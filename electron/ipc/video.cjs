'use strict';

const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked');

ffmpeg.setFfmpegPath(ffmpegPath);

function setupVideoHandlers(ipcMain, dialog) {
  ipcMain.handle('video:selectFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Videos', extensions: ['mp4', 'mkv', 'avi', 'mov', 'webm', 'flv', 'm4v', 'wmv'] }]
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('video:convert', async (event, {
    filePath, outputFormat, outputDir,
    resolution, crf, codec,
    // Advanced
    audioCodec, audioBitrate, fps, hwAccel,
    outputName,
  }) => {
    return new Promise((resolve) => {
      const autoName = path.basename(filePath, path.extname(filePath));
      const baseName = outputName ? outputName.trim() : `${autoName}_converted`;
      const outPath = path.join(outputDir, `${baseName}.${outputFormat}`);

      let cmd = ffmpeg(filePath);

      // Hardware acceleration must be set as input option before the input
      if (hwAccel && hwAccel !== '') cmd = cmd.addInputOption('-hwaccel', hwAccel);

      if (codec) cmd = cmd.videoCodec(codec);
      if (audioCodec === 'copy') cmd = cmd.audioCodec('copy');
      else if (audioCodec) cmd = cmd.audioCodec(audioCodec);

      if (resolution) cmd = cmd.size(resolution);
      if (crf !== undefined && crf !== null) cmd = cmd.addOption('-crf', String(crf));
      if (audioBitrate) cmd = cmd.audioBitrate(audioBitrate);
      if (fps && fps !== '') cmd = cmd.fps(parseInt(fps));

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
