'use strict';

const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { PDFDocument } = require('pdf-lib');
const sharp = require('sharp');
const ffmpegPath = require('ffmpeg-static');

// ─── MIME / tool suggestion maps ───────────────────────────────────────────────

const EXT_MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  webp: 'image/webp', bmp: 'image/bmp', tiff: 'image/tiff', tif: 'image/tiff',
  avif: 'image/avif', svg: 'image/svg+xml', ico: 'image/x-icon', heic: 'image/heic',
  mp3: 'audio/mpeg', wav: 'audio/wav', flac: 'audio/flac', aac: 'audio/aac',
  ogg: 'audio/ogg', m4a: 'audio/mp4', opus: 'audio/opus', wma: 'audio/x-ms-wma',
  mp4: 'video/mp4', mkv: 'video/x-matroska', avi: 'video/x-msvideo',
  mov: 'video/quicktime', webm: 'video/webm', flv: 'video/x-flv',
  wmv: 'video/x-ms-wmv', m4v: 'video/x-m4v', ts: 'video/mp2t',
  pdf: 'application/pdf',
  zip: 'application/zip', rar: 'application/x-rar',
  '7z': 'application/x-7z-compressed', tar: 'application/x-tar',
  gz: 'application/gzip',
  txt: 'text/plain', md: 'text/markdown', json: 'application/json',
  xml: 'application/xml', csv: 'text/csv', html: 'text/html', css: 'text/css',
  js: 'text/javascript', jsx: 'text/javascript', py: 'text/x-python',
  exe: 'application/x-msdownload', msi: 'application/x-msi',
  dll: 'application/x-msdownload',
};

const EXT_TOOL = {
  jpg: '/image', jpeg: '/image', png: '/image', gif: '/image',
  webp: '/image', bmp: '/image', tiff: '/image', tif: '/image', avif: '/image',
  mp3: '/audio', wav: '/audio', flac: '/audio', aac: '/audio',
  ogg: '/audio', m4a: '/audio', opus: '/audio', wma: '/audio',
  mp4: '/video', mkv: '/video', avi: '/video', mov: '/video',
  webm: '/video', flv: '/video', wmv: '/video', m4v: '/video',
  pdf: '/pdf',
};

const TOOL_LABELS = {
  '/image': 'Image Converter',
  '/audio': 'Audio Converter',
  '/video': 'Video Converter',
  '/pdf':   'PDF Tools',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatBytes(bytes) {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)    return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3)      return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

function formatDate(d) {
  return new Date(d).toLocaleString();
}

// Parse `ffmpeg -i file` stderr output to extract media properties
function parseMediaInfo(stderr) {
  const info = {};

  const d = stderr.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
  if (d) {
    const secs = +d[1] * 3600 + +d[2] * 60 + +d[3];
    const h = d[1].padStart(2, '0');
    const m = d[2].padStart(2, '0');
    const s = String(Math.floor(+d[3])).padStart(2, '0');
    info.duration = secs;
    info.durationStr = `${h}:${m}:${s}`;
  }

  const br = stderr.match(/bitrate:\s*(\d+)\s*kb\/s/);
  if (br) info.bitrate = `${br[1]} kb/s`;

  // Video stream: codec, resolution, fps
  const vid = stderr.match(/Stream #\S+[^:]*:\s*Video:\s*([^\s,]+)[^\n]*?(\d{2,5}x\d{2,5})[^\n]*?(\d+(?:\.\d+)?)\s*fps/);
  if (vid) {
    info.videoCodec = vid[1];
    info.resolution = vid[2];
    info.fps = `${vid[3]} fps`;
  }

  // Audio stream: codec, sampleRate, channels
  const aud = stderr.match(/Stream #\S+[^:]*:\s*Audio:\s*([^\s,]+),\s*(\d+)\s*Hz,\s*([^\n,]+)/);
  if (aud) {
    info.audioCodec = aud[1];
    info.sampleRate = `${(+aud[2] / 1000).toFixed(1)} kHz`;
    info.channels = aud[3].trim().replace(/\s*\(.*\)/, '');
  }

  return info;
}

// ─── Analyze ───────────────────────────────────────────────────────────────────

async function analyzeFile(filePath) {
  const stat = fs.statSync(filePath);
  const ext  = path.extname(filePath).toLowerCase().replace('.', '');
  const name = path.basename(filePath);
  const mime = EXT_MIME[ext] || 'application/octet-stream';
  const suggestedTool = EXT_TOOL[ext] || null;

  const result = {
    name,
    path: filePath,
    ext: ext || '(none)',
    mime,
    size: stat.size,
    sizeStr: formatBytes(stat.size),
    modified: formatDate(stat.mtime),
    created: formatDate(stat.birthtime),
    suggestedTool,
    suggestedToolLabel: suggestedTool ? TOOL_LABELS[suggestedTool] : null,
    category: null,
    details: {},
  };

  // ── IMAGE ──
  if (/^image\//.test(mime) && ext !== 'svg' && ext !== 'ico') {
    result.category = 'image';
    try {
      const meta = await sharp(filePath).metadata();
      result.details = {
        'Dimensions':   `${meta.width} × ${meta.height} px`,
        'Format':        (meta.format || ext).toUpperCase(),
        'Color Space':   meta.space || '—',
        'Channels':      meta.channels ?? '—',
        'Bit Depth':     meta.depth ? `${meta.depth}-bit` : '—',
        'Has Alpha':     meta.hasAlpha ? 'Yes' : 'No',
        'Density':       meta.density ? `${meta.density} DPI` : '—',
      };
    } catch {}
  }

  // ── AUDIO ──
  else if (/^audio\//.test(mime)) {
    result.category = 'audio';
    try {
      const proc = spawnSync(
        ffmpegPath.replace('app.asar', 'app.asar.unpacked'),
        ['-i', filePath, '-hide_banner'],
        { encoding: 'utf8', timeout: 6000 }
      );
      const media = parseMediaInfo(proc.stderr || proc.stdout || '');
      result.details = {
        'Duration':    media.durationStr || '—',
        'Bitrate':     media.bitrate     || '—',
        'Codec':       media.audioCodec  || '—',
        'Sample Rate': media.sampleRate  || '—',
        'Channels':    media.channels    || '—',
      };
    } catch {}
  }

  // ── VIDEO ──
  else if (/^video\//.test(mime)) {
    result.category = 'video';
    try {
      const proc = spawnSync(
        ffmpegPath.replace('app.asar', 'app.asar.unpacked'),
        ['-i', filePath, '-hide_banner'],
        { encoding: 'utf8', timeout: 6000 }
      );
      const media = parseMediaInfo(proc.stderr || proc.stdout || '');
      result.details = {
        'Duration':      media.durationStr || '—',
        'Resolution':    media.resolution  || '—',
        'Frame Rate':    media.fps         || '—',
        'Video Codec':   media.videoCodec  || '—',
        'Audio Codec':   media.audioCodec  || '—',
        'Bitrate':       media.bitrate     || '—',
        'Sample Rate':   media.sampleRate  || '—',
      };
    } catch {}
  }

  // ── PDF ──
  else if (mime === 'application/pdf') {
    result.category = 'pdf';
    try {
      const bytes = fs.readFileSync(filePath);
      const doc   = await PDFDocument.load(bytes, { ignoreEncryption: true });
      result.details = {
        'Pages':  doc.getPageCount(),
        'Title':  doc.getTitle()   || '—',
        'Author': doc.getAuthor()  || '—',
      };
    } catch {}
  }

  return result;
}

// ─── Setup ─────────────────────────────────────────────────────────────────────

function setupInspectorHandlers(ipcMain, dialog) {
  ipcMain.handle('inspector:selectFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('inspector:analyze', async (_, filePath) => {
    try {
      return await analyzeFile(filePath);
    } catch (err) {
      return { error: err.message };
    }
  });
}

module.exports = { setupInspectorHandlers };
