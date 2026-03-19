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

  // ── Read file as data URL (for preview) ──
  ipcMain.handle('image:readAsDataURL', async (event, filePath) => {
    try {
      const buf = fs.readFileSync(filePath)
      const ext = path.extname(filePath).toLowerCase()
      const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp', '.avif': 'image/avif', '.tiff': 'image/tiff' }[ext] || 'image/png'
      return 'data:' + mime + ';base64,' + buf.toString('base64')
    } catch { return null }
  })

  // ── Background Removal (flood-fill, 100% local) ──
  // mode: 'corner' (sample corners), 'color' (most common), 'custom' (user-picked hex)
  ipcMain.handle('image:removeBg', async (event, { filePath, outputDir, outputName, tolerance = 30, mode = 'corner', customColor }) => {
    try {
      const { data, info } = await sharp(filePath)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

      const { width, height } = info  // channels always 4 (RGBA) after ensureAlpha
      let bgR, bgG, bgB

      if (mode === 'custom' && customColor) {
        // Parse hex color like '#RRGGBB'
        const hex = customColor.replace('#', '')
        bgR = parseInt(hex.substring(0, 2), 16)
        bgG = parseInt(hex.substring(2, 4), 16)
        bgB = parseInt(hex.substring(4, 6), 16)
      } else if (mode === 'color') {
        // Find the most common color by quantizing to 5-bit bins
        const colorMap = new Map()
        const total = width * height
        // Sample up to 500k pixels for speed on large images
        const sampleStep = total > 500000 ? Math.ceil(total / 500000) : 1
        for (let pi = 0; pi < total; pi += sampleStep) {
          const i4 = pi * 4
          if (data[i4 + 3] < 128) continue // skip transparent
          const key = ((data[i4] >> 3) << 10) | ((data[i4+1] >> 3) << 5) | (data[i4+2] >> 3)
          colorMap.set(key, (colorMap.get(key) || 0) + 1)
        }
        let maxCount = 0, maxKey = 0
        for (const [key, count] of colorMap) {
          if (count > maxCount) { maxCount = count; maxKey = key }
        }
        // Reconstruct approximate color from 5-bit bins (shift back and center)
        bgR = ((maxKey >> 10) & 0x1F) * 8 + 4
        bgG = ((maxKey >> 5) & 0x1F) * 8 + 4
        bgB = (maxKey & 0x1F) * 8 + 4
      } else {
        // Corner mode: sample 4 corners to estimate background colour
        let sumR = 0, sumG = 0, sumB = 0
        const corners = [[0,0],[width-1,0],[0,height-1],[width-1,height-1]]
        for (const [cx, cy] of corners) {
          const i = (cy * width + cx) * 4
          sumR += data[i]; sumG += data[i+1]; sumB += data[i+2]
        }
        bgR = Math.round(sumR/4); bgG = Math.round(sumG/4); bgB = Math.round(sumB/4)
      }

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

      if (mode === 'custom' || mode === 'color') {
        // For color/custom mode: remove ALL matching pixels (no flood fill from edges)
        for (let pi = 0; pi < width * height; pi++) {
          const i4 = pi * 4
          const dr = data[i4] - bgR, dg = data[i4+1] - bgG, db = data[i4+2] - bgB
          if (Math.sqrt(dr*dr + dg*dg + db*db) <= thresh) {
            data[i4 + 3] = 0
          }
        }
      } else {
        // Corner mode: flood fill from edges
        const step = Math.max(1, Math.floor(Math.min(width, height) / 20))
        for (let x = 0; x < width;  x += step) { tryAdd(x, 0); tryAdd(x, height - 1) }
        for (let y = 0; y < height; y += step) { tryAdd(0, y); tryAdd(width - 1, y)  }
        tryAdd(0, 0); tryAdd(width - 1, 0); tryAdd(0, height - 1); tryAdd(width - 1, height - 1)

        while (stack.length > 0) {
          const y = stack.pop(), x = stack.pop()
          const idx = (y * width + x) * 4
          data[idx + 3] = 0
          tryAdd(x + 1, y); tryAdd(x - 1, y)
          tryAdd(x, y + 1); tryAdd(x, y - 1)
        }
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
