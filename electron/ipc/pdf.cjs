'use strict';

const path = require('path');
const fs = require('fs');
const { PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } = require('pdf-lib');
const sharp = require('sharp');

// ── Quality presets for compression levels ────────────────────────────
const QUALITY_PRESETS = {
  low:    { quality: 85, maxDim: null },
  medium: { quality: 60, maxDim: 2048 },
  high:   { quality: 40, maxDim: 1200 },
};

// ── Helper: determine channel count from PDF ColorSpace ───────────────
function getChannels(colorSpace) {
  if (!colorSpace) return 3;
  const name = colorSpace.toString?.() || '';
  if (name.includes('Gray') || name.includes('CalGray')) return 1;
  if (name.includes('CMYK')) return 4;
  return 3; // DeviceRGB, CalRGB, etc.
}

// ── Helper: recompress all images in a PDFDocument ────────────────────
async function recompressImages(doc, quality, maxDim) {
  const objects = doc.context.enumerateIndirectObjects();
  let processed = 0;

  for (const [ref, obj] of objects) {
    // Only process raw streams that are Image XObjects
    if (!(obj instanceof PDFRawStream)) continue;
    const dict = obj.dict;
    const subtype = dict.get(PDFName.of('Subtype'));
    if (!subtype || subtype.toString() !== '/Image') continue;

    // Read image properties from the dict
    const width  = dict.get(PDFName.of('Width'))?.asNumber?.()  ?? dict.get(PDFName.of('Width'))?.value;
    const height = dict.get(PDFName.of('Height'))?.asNumber?.() ?? dict.get(PDFName.of('Height'))?.value;
    if (!width || !height) continue;

    const bpc = dict.get(PDFName.of('BitsPerComponent'))?.asNumber?.()
             ?? dict.get(PDFName.of('BitsPerComponent'))?.value ?? 8;

    // Skip images with alpha masks (JPEG can't represent transparency)
    if (dict.get(PDFName.of('SMask'))) continue;

    const colorSpace = dict.get(PDFName.of('ColorSpace'));
    const channels = getChannels(colorSpace);
    // Skip CMYK — sharp's raw input doesn't handle 4-channel reliably without ICC
    if (channels === 4) continue;

    const filter = dict.get(PDFName.of('Filter'));
    const filterStr = filter?.toString?.() || '';

    // Get the raw/decoded image bytes
    let imgBuffer;
    try {
      if (filterStr.includes('DCTDecode')) {
        // Already JPEG — use the raw stream bytes directly (they ARE the JPEG)
        imgBuffer = Buffer.from(obj.getContents());
      } else if (filterStr.includes('FlateDecode') || filterStr.includes('LZWDecode')) {
        // Decode the compressed stream to get raw pixel data
        const decoded = decodePDFRawStream(obj);
        const rawBytes = decoded.decode();
        // Only handle 8-bit images
        if (bpc !== 8) continue;
        const expectedSize = width * height * channels;
        if (rawBytes.length < expectedSize) continue;
        imgBuffer = Buffer.from(rawBytes);
      } else if (!filterStr || filterStr === '/') {
        // Uncompressed raw stream
        if (bpc !== 8) continue;
        const rawBytes = obj.getContents();
        imgBuffer = Buffer.from(rawBytes);
      } else {
        // JPXDecode, CCITTFax, etc. — skip
        continue;
      }
    } catch {
      continue; // If decoding fails, skip this image
    }

    // Skip tiny images (icons, bullets, etc.)
    if (imgBuffer.length < 5000) continue;

    try {
      let pipeline;
      if (filterStr.includes('DCTDecode')) {
        // Input is already a JPEG file
        pipeline = sharp(imgBuffer);
      } else {
        // Input is raw pixel data
        pipeline = sharp(imgBuffer, { raw: { width, height, channels } });
      }

      // Resize if over maxDim
      if (maxDim && (width > maxDim || height > maxDim)) {
        pipeline = pipeline.resize(maxDim, maxDim, { fit: 'inside', withoutEnlargement: true });
      }

      const jpegBuffer = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();

      // Only replace if the JPEG is actually smaller
      if (jpegBuffer.length < imgBuffer.length) {
        obj.contents = jpegBuffer;
        // Update the stream dictionary for JPEG
        dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'));
        dict.delete(PDFName.of('DecodeParms'));
        dict.set(PDFName.of('Length'), doc.context.obj(jpegBuffer.length));
        // If we resized, update Width/Height
        if (maxDim && (width > maxDim || height > maxDim)) {
          const meta = await sharp(jpegBuffer).metadata();
          dict.set(PDFName.of('Width'), doc.context.obj(meta.width));
          dict.set(PDFName.of('Height'), doc.context.obj(meta.height));
        }
        // Force DeviceRGB colorspace since JPEG output is always RGB
        if (channels === 1) {
          dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceRGB'));
          dict.set(PDFName.of('BitsPerComponent'), doc.context.obj(8));
        }
        processed++;
      }
    } catch {
      continue; // If sharp fails on this image, skip it
    }
  }

  return processed;
}

// ── Helper: compress a PDF with given quality settings ─────────────────
async function compressPdf(bytes, quality, maxDim) {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  await recompressImages(doc, quality, maxDim);
  const pdfBytes = await doc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    objectsPerTick: 20,
  });
  return pdfBytes;
}

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

  // ── Compress with quality preset ─────────────────────────────────────
  ipcMain.handle('pdf:compress', async (_, { filePath, outputDir, compressionLevel = 'medium' }) => {
    try {
      const bytes = fs.readFileSync(filePath);
      const originalSize = bytes.length;
      const preset = QUALITY_PRESETS[compressionLevel] || QUALITY_PRESETS.medium;
      const pdfBytes = await compressPdf(bytes, preset.quality, preset.maxDim);
      const outPath = path.join(outputDir, `compressed_${path.basename(filePath)}`);
      fs.writeFileSync(outPath, pdfBytes);
      const savedBytes = originalSize - pdfBytes.length;
      return {
        success: true,
        outputPath: outPath,
        savedBytes: Math.max(0, savedBytes),
        originalSize,
        finalSize: pdfBytes.length,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Compress to target file size (iterative) ─────────────────────────
  ipcMain.handle('pdf:compressToSize', async (event, { filePath, outputDir, targetSizeMB }) => {
    try {
      const bytes = fs.readFileSync(filePath);
      const originalSize = bytes.length;
      const targetBytes = targetSizeMB * 1024 * 1024;

      // If already under target, just do a light optimization pass
      if (originalSize <= targetBytes) {
        const pdfBytes = await compressPdf(bytes, 90, null);
        const outPath = path.join(outputDir, `compressed_${path.basename(filePath)}`);
        fs.writeFileSync(outPath, pdfBytes);
        return {
          success: true,
          outputPath: outPath,
          savedBytes: Math.max(0, originalSize - pdfBytes.length),
          originalSize,
          finalSize: pdfBytes.length,
          passes: 1,
        };
      }

      // Iterative compression — reduce quality until we hit target
      let quality = 80;
      let maxDim = 2048;
      let pdfBytes = null;
      let pass = 0;
      const maxPasses = 6;

      while (pass < maxPasses && quality >= 10) {
        pass++;
        event.sender.send('pdf:compressProgress', {
          pass,
          maxPasses,
          quality,
          maxDim,
          status: `Pass ${pass} — quality ${quality}${maxDim ? `, max ${maxDim}px` : ''}`,
        });

        pdfBytes = await compressPdf(bytes, quality, maxDim);

        if (pdfBytes.length <= targetBytes) break;

        // Adjust for next pass based on how far we are from target
        const ratio = pdfBytes.length / targetBytes;
        if (ratio > 3) {
          quality = Math.max(10, quality - 25);
          maxDim = maxDim ? Math.max(600, Math.round(maxDim * 0.6)) : 1200;
        } else if (ratio > 1.5) {
          quality = Math.max(10, quality - 15);
          maxDim = maxDim ? Math.max(600, Math.round(maxDim * 0.75)) : 1600;
        } else {
          quality = Math.max(10, quality - 10);
          maxDim = maxDim ? Math.max(600, maxDim - 200) : null;
        }
      }

      const outPath = path.join(outputDir, `compressed_${path.basename(filePath)}`);
      fs.writeFileSync(outPath, pdfBytes);

      return {
        success: true,
        outputPath: outPath,
        savedBytes: Math.max(0, originalSize - pdfBytes.length),
        originalSize,
        finalSize: pdfBytes.length,
        passes: pass,
        hitTarget: pdfBytes.length <= targetBytes,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Get file size (for UI display) ──────────────────────────────────
  ipcMain.handle('pdf:fileSize', async (_, filePath) => {
    try {
      const stat = fs.statSync(filePath);
      return { success: true, size: stat.size };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('pdf:toImages', async (_, { filePath, outputDir }) => {
    return { success: false, error: 'PDF→Image requires pdftoppm. Feature coming soon.' };
  });
}

module.exports = { setupPdfHandlers };
