'use strict';

const path = require('path');
const os = require('os');
const YTDlpWrap = require('yt-dlp-wrap').default;

const ytDlp = new YTDlpWrap();

function setupDownloaderHandlers(ipcMain, dialog) {
  ipcMain.handle('downloader:selectFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('downloader:download', async (event, { url, outputDir, formatType, quality }) => {
    return new Promise((resolve) => {
      const outFolder = outputDir || os.homedir() + '/Downloads';

      // formatType: 'video' | 'audio'
      const args = [
        url,
        '-o', path.join(outFolder, '%(title)s.%(ext)s'),
        '--no-playlist',
      ];

      if (formatType === 'audio') {
        args.push('-x', '--audio-format', 'mp3');
      } else {
        // Best video up to chosen quality
        const heightMap = { '1080p': 1080, '720p': 720, '480p': 480, '360p': 360 };
        const maxH = heightMap[quality] || 1080;
        args.push('-f', `bestvideo[height<=${maxH}]+bestaudio/best[height<=${maxH}]`, '--merge-output-format', 'mp4');
      }

      const dlp = ytDlp.exec(args);

      let lastTitle = '';
      dlp.on('ytDlpEvent', (eventType, eventData) => {
        if (eventType === 'download') {
          // Parse percent from "[download]  45.2% of ..."
          const match = eventData.match(/(\d+\.?\d*)%/);
          const percent = match ? parseFloat(match[1]) : 0;
          const titleMatch = eventData.match(/Destination: .+\/(.+)$/);
          if (titleMatch) lastTitle = titleMatch[1];
          event.sender.send('downloader:progress', { percent, title: lastTitle });
        }
      });

      dlp.on('error', (err) => {
        resolve({ success: false, error: err.message || String(err) });
      });

      dlp.on('close', () => {
        resolve({ success: true, outputDir: outFolder });
      });
    });
  });
}

module.exports = { setupDownloaderHandlers };
