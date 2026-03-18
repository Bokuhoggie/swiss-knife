'use strict';

const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked');

ffmpeg.setFfmpegPath(ffmpegPath);

function setupAudioHandlers(ipcMain, dialog) {
  ipcMain.handle('audio:selectFiles', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Audio', extensions: ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus'] }]
    });
    return canceled ? [] : filePaths;
  });

  ipcMain.handle('audio:convert', async (event, {
    filePath, outputFormat, outputDir, bitrate, sampleRate,
    // Advanced
    channels, normalize, fadeIn,
    outputName,
  }) => {
    return new Promise((resolve) => {
      const baseName = outputName ? outputName.trim() : path.basename(filePath, path.extname(filePath));
      const outPath = path.join(outputDir, `${baseName}.${outputFormat}`);

      let cmd = ffmpeg(filePath);
      if (bitrate) cmd = cmd.audioBitrate(bitrate);
      if (sampleRate) cmd = cmd.audioFrequency(parseInt(sampleRate));
      if (channels === 'mono') cmd = cmd.audioChannels(1);
      else if (channels === 'stereo') cmd = cmd.audioChannels(2);

      // Audio filter chain
      const filters = [];
      if (normalize) filters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
      if (fadeIn && fadeIn > 0) filters.push(`afade=t=in:d=${fadeIn}`);
      if (filters.length) cmd = cmd.audioFilters(filters.join(','));

      cmd
        .output(outPath)
        .on('progress', (progress) => {
          event.sender.send('audio:progress', { percent: progress.percent || 0, timemark: progress.timemark });
        })
        .on('end', () => resolve({ success: true, outputPath: outPath }))
        .on('error', (err) => resolve({ success: false, error: err.message }))
        .run();
    });
  });
}

module.exports = { setupAudioHandlers };
