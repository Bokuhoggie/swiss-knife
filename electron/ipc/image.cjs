'use strict';

const path = require('path');
const fs   = require('fs');
const sharp = require('sharp');

function setupImageHandlers(ipcMain, dialog) {
  ipcMain.handle('image:selectFiles', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'tiff', 'avif'] }
      ]
    });
    return canceled ? [] : filePaths;
  });

  ipcMain.handle('image:convert', async (event, { filePaths, outputFormat, outputDir, quality, width, height, keepMetadata, outputName }) => {
    const results = [];
    for (const filePath of filePaths) {
      try {
        const ext = outputFormat.toLowerCase();
        const autoName = path.basename(filePath, path.extname(filePath));
        const baseName = (outputName && filePaths.length === 1) ? outputName.trim() : autoName;
        const outPath = path.join(outputDir, `${baseName}.${ext}`);

        let processor = sharp(filePath);
        // Preserve EXIF/ICC/XMP metadata (sharp strips it by default)
        if (keepMetadata) processor = processor.withMetadata();
        if (width || height) {
          processor = processor.resize(width || null, height || null, { fit: 'inside' });
        }

        const opts = {};
        if (quality) opts.quality = parseInt(quality);

        switch (ext) {
          case 'jpg':
          case 'jpeg':
            processor = processor.jpeg(opts);
            break;
          case 'png':
            processor = processor.png();
            break;
          case 'webp':
            processor = processor.webp(opts);
            break;
          case 'avif':
            processor = processor.avif(opts);
            break;
          case 'gif':
            processor = processor.gif();
            break;
          case 'bmp':
            processor = processor.bmp();
            break;
          case 'tiff':
            processor = processor.tiff(opts);
            break;
          default:
            processor = processor.png();
        }

        await processor.toFile(outPath);
        results.push({ success: true, inputPath: filePath, outputPath: outPath });
      } catch (err) {
        results.push({ success: false, inputPath: filePath, error: err.message });
      }
    }
    return results;
  });

  // ── Background Removal (flood-fill from edges, 100% local, no model needed) ──
  ipcMain.handle('image:removeBg', async (event, { filePath, outputDir, outputName, tolerance = 30 }) => {
    try {
      const { data, info } = await sharp(filePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

      const { width, height } = info  // channels always 4 (RGBA) after ensureAlpha

      // Sample 4 corners to estimate background colour
      let sumR = 0, sumG = 0, sumB = 0
      const corners = [[0,0],[width-1,0],[0,height-1],[width-1,height-1]]
      for (const [cx, cy] of corners) {
        const i = (cy * width + cx) * 4
        sumR += data[i]; sumG += data[i+1]; sumB += data[i+2]
      }
      const bgR = Math.round(sumR/4), bgG = Math.round(sumG/4), bgB = Math.round(sumB/4)

      // tolerance 0-100 → RGB Euclidean distance threshold 0-170
      const thresh = (tolerance / 100) * 170

      const visited = new Uint8Array(width * height)
      const stack = []

      const tryAdd = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return
        const pi = y * width + x
        if (visited[pi]) return
        const i4 = pi * 4
        const dr = data[i4] - bgR, dg = data[i4+1] - bgG, db = data[i4+2] - bgB
        if (Math.sqrt(dr*dr + dg*dg + db*db) > thresh) return
        visited[pi] = 1
        stack.push(x, y)
      }

      // Seed from all 4 edges
      for (let x = 0; x < width;  x++) { tryAdd(x, 0); tryAdd(x, height - 1) }
      for (let y = 0; y < height; y++) { tryAdd(0, y); tryAdd(width - 1, y)  }

      // Iterative flood fill
      while (stack.length > 0) {
        const y = stack.pop(), x = stack.pop()
        data[(y * width + x) * 4 + 3] = 0   // transparent
        tryAdd(x + 1, y); tryAdd(x - 1, y)
        tryAdd(x, y + 1); tryAdd(x, y - 1)
      }

      const base    = outputName?.trim() || (path.basename(filePath, path.extname(filePath)) + '_nobg')
      const outPath = path.join(outputDir, base + '.png')
      await sharp(Buffer.from(data), { raw: { width, height, channels: 4 } }).png().toFile(outPath)
      return { success: true, outputPath: outPath }
    } catch (err) {
      return { success: false, error: err.message }
    }
  })

  ipcMain.handle('common:selectOutputDir', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    return canceled ? null : filePaths[0];
  });
}

module.exports = { setupImageHandlers };
