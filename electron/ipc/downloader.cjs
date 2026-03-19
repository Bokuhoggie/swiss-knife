'use strict';

const path = require('path');
const os = require('os');
const fs = require('fs');
const { app } = require('electron');
const YTDlpWrap = require('yt-dlp-wrap').default;
const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked');

// Ensure ffmpeg binary is executable on macOS/Linux
if (process.platform !== 'win32' && fs.existsSync(ffmpegPath)) {
  try {
    fs.chmodSync(ffmpegPath, 0o755);
  } catch (e) {
    console.warn('[downloader] Failed to chmod ffmpeg:', e.message);
  }
}

// Resolve or auto-download the yt-dlp binary into the app's userData folder.
// This means the app works on Windows without yt-dlp in PATH.
async function getYtDlpInstance() {
  const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const userDataPath = app.getPath('userData');
  const binaryPath = path.join(userDataPath, binaryName);

  if (!fs.existsSync(binaryPath)) {
    console.log('[downloader] yt-dlp binary not found, downloading from GitHub...');
    await YTDlpWrap.downloadFromGithub(binaryPath);
    console.log('[downloader] yt-dlp downloaded to:', binaryPath);
    // Ensure the downloaded binary is executable on macOS/Linux
    if (process.platform !== 'win32') {
      try { fs.chmodSync(binaryPath, 0o755); } catch (e) {
        console.warn('[downloader] Failed to chmod yt-dlp:', e.message);
      }
    }
  }

  return new YTDlpWrap(binaryPath);
}

function setupDownloaderHandlers(ipcMain, dialog) {
  ipcMain.handle('downloader:selectFolder', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('downloader:download', async (event, { url, outputDir, formatType, quality, audioFormat, embedThumbnail, embedSubs, subsLang, rateLimit, outputName, cookiesFromBrowser }) => {
    return new Promise(async (resolve) => {
      // Use path.join so separators are correct on Windows
      const outFolder = outputDir || path.join(os.homedir(), 'Downloads');

      // formatType: 'video' | 'audio'
      let ytDlp;
      try {
        ytDlp = await getYtDlpInstance();
      } catch (err) {
        return resolve({ success: false, error: `Failed to initialize yt-dlp: ${err.message}` });
      }

      // Sanitize custom name: strip characters that are illegal in filenames
      const safeName = outputName
        ? outputName.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').replace(/\.+$/, '') || '%(title)s'
        : '%(title)s';

      const args = [
        url,
        '-o', path.join(outFolder, `${safeName}.%(ext)s`),
        '--no-playlist',
        '--ffmpeg-location', ffmpegPath,
      ];

      // Twitter/X serves pre-muxed streams — don't try to merge separate video+audio
      const isTwitter = /twitter\.com|x\.com|t\.co/i.test(url);

      if (formatType === 'audio') {
        args.push('-x', '--audio-format', audioFormat || 'mp3');
      } else if (isTwitter) {
        // Pick best already-muxed mp4, fall back to anything available
        args.push('-f', 'best[ext=mp4]/best', '--merge-output-format', 'mp4');
      } else {
        const heightMap = { '1080p': 1080, '720p': 720, '480p': 480, '360p': 360 };
        const maxH = heightMap[quality] || 1080;
        // Prefer mp4+m4a (h264+aac) — avoids opus/webm being embedded in MP4
        // which causes playback issues in many players. Falls back to best available.
        args.push(
          '-f', `bestvideo[height<=${maxH}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${maxH}]+bestaudio/best[height<=${maxH}]`,
          '--merge-output-format', 'mp4',
        );
      }

      // Advanced options
      if (embedThumbnail) args.push('--embed-thumbnail');
      if (embedSubs) args.push('--embed-subs', '--sub-lang', subsLang || 'en');
      if (rateLimit && rateLimit.trim()) args.push('--limit-rate', rateLimit.trim());
      // Cookie auth — lets yt-dlp pull session cookies for private/rate-limited content
      if (cookiesFromBrowser) args.push('--cookies-from-browser', cookiesFromBrowser);

      const dlp = ytDlp.exec(args);

      let lastTitle = '';
      dlp.on('ytDlpEvent', (eventType, eventData) => {
        if (eventType === 'download') {
          // Parse percent from "[download]  45.2% of ..."
          const match = eventData.match(/(\d+\.?\d*)%/);
          const percent = match ? parseFloat(match[1]) : 0;
          // Handle both / and \ path separators (Windows uses \)
          const titleMatch = eventData.match(/Destination: .+[/\\](.+)$/);
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
