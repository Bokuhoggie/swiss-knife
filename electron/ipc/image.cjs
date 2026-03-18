'use strict';

const path = require('path');
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

  ipcMain.handle('image:convert', async (event, { filePaths, outputFormat, outputDir, quality, width, height, keepMetadata }) => {
    const results = [];
    for (const filePath of filePaths) {
      try {
        const ext = outputFormat.toLowerCase();
        const baseName = path.basename(filePath, path.extname(filePath));
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

  ipcMain.handle('common:selectOutputDir', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    return canceled ? null : filePaths[0];
  });
}

module.exports = { setupImageHandlers };
