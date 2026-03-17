'use strict';

const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegPath);

function setupVideoHandlers(ipcMain, dialog) {
  ipcMain.handle('video:selectFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Videos', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v', 'wmv'] }]
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('video:convert', async (event, { filePath, outputFormat, outputDir, resolution, crf, codec }) => {
    return new Promise((resolve) => {
      const baseName = path.basename(filePath, path.extname(filePath));
      const outPath = path.join(outputDir, `${baseName}_converted.${outputFormat}`);

      let cmd = ffmpeg(filePath);

      if (codec) cmd = cmd.videoCodec(codec);
      if (resolution) cmd = cmd.size(resolution);
      if (crf) cmd = cmd.addOption(`-crf`, String(crf));

      cmd
        .output(outPath)
        .on('progress', (progress) => {
          event.sender.send('video:progress', { percent: progress.percent || 0, timemark: progress.timemark });
        })
        .on('end', () => {
          resolve({ success: true, outputPath: outPath });
        })
        .on('error', (err) => {
          resolve({ success: false, error: err.message });
        })
        .run();
    });
  });
}

module.exports = { setupVideoHandlers };
