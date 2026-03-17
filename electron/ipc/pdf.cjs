'use strict';

const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

function setupPdfHandlers(ipcMain, dialog) {
  ipcMain.handle('pdf:selectFiles', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    return canceled ? [] : filePaths;
  });

  ipcMain.handle('pdf:selectFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF', extensions: ['pdf'] }]
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('pdf:merge', async (_, { filePaths, outputDir }) => {
    try {
      const merged = await PDFDocument.create();
      for (const fp of filePaths) {
        const bytes = fs.readFileSync(fp);
        const doc = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const outPath = path.join(outputDir, `merged_${Date.now()}.pdf`);
      const pdfBytes = await merged.save();
      fs.writeFileSync(outPath, pdfBytes);
      return { success: true, outputPath: outPath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('pdf:split', async (_, { filePath, outputDir, ranges }) => {
    try {
      const bytes = fs.readFileSync(filePath);
      const doc = await PDFDocument.load(bytes);
      const results = [];
      for (const range of ranges) {
        const newDoc = await PDFDocument.create();
        const start = Math.max(0, range.start - 1);
        const end = Math.min(doc.getPageCount() - 1, range.end - 1);
        const pages = await newDoc.copyPages(doc, Array.from({ length: end - start + 1 }, (_, i) => start + i));
        pages.forEach(p => newDoc.addPage(p));
        const outPath = path.join(outputDir, `split_${range.start}-${range.end}_${Date.now()}.pdf`);
        const pdfBytes = await newDoc.save();
        fs.writeFileSync(outPath, pdfBytes);
        results.push({ success: true, outputPath: outPath, range });
      }
      return results;
    } catch (err) {
      return [{ success: false, error: err.message }];
    }
  });

  ipcMain.handle('pdf:compress', async (_, { filePath, outputDir }) => {
    // pdf-lib reserializes which often compresses; true compression needs ghostscript
    try {
      const bytes = fs.readFileSync(filePath);
      const doc = await PDFDocument.load(bytes);
      const outPath = path.join(outputDir, `compressed_${path.basename(filePath)}`);
      const pdfBytes = await doc.save({ useObjectStreams: true });
      fs.writeFileSync(outPath, pdfBytes);
      return { success: true, outputPath: outPath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('pdf:toImages', async (_, { filePath, outputDir }) => {
    // Note: Full PDF→image needs pdftoppm or similar native tool
    // This returns a placeholder message pointing user to the video converter for now
    return { success: false, error: 'PDF→Image requires pdftoppm. Feature coming soon.' };
  });
}

module.exports = { setupPdfHandlers };
