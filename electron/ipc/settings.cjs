'use strict';

const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Full set of default settings — any missing keys from the saved file
// are filled in from here via deep-merge, so new settings added in updates
// always have a valid fallback.
const DEFAULTS = {
  general: {
    defaultOutputDir: '',
    openAfterConvert: false,
  },
  image: {
    format: 'png',
    quality: 85,
    width: '',
    height: '',
    keepMetadata: false,
  },
  video: {
    format: 'mp4',
    codec: '',
    crf: 23,
    resolution: '',
    audioCodec: 'aac',
    audioBitrate: '192k',
    fps: '',
    hwAccel: '',
  },
  audio: {
    format: 'mp3',
    bitrate: '192k',
    sampleRate: '44100',
    channels: '',
    normalize: false,
    fadeIn: 0,
  },
  downloader: {
    formatType: 'video',
    quality: '1080p',
    audioFormat: 'mp3',
    embedThumbnail: false,
    embedSubs: false,
    subsLang: 'en',
    rateLimit: '',
  },
  pdf: {
    compressionLevel: 'medium',
  },
};

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'htk-settings.json');
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] !== null &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] !== null &&
      typeof target[key] === 'object'
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

function readSettings() {
  try {
    const raw = fs.readFileSync(getSettingsPath(), 'utf8');
    return deepMerge(DEFAULTS, JSON.parse(raw));
  } catch {
    return JSON.parse(JSON.stringify(DEFAULTS));
  }
}

function writeSettings(data) {
  try {
    fs.writeFileSync(getSettingsPath(), JSON.stringify(data, null, 2), 'utf8');
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function setupSettingsHandlers(ipcMain) {
  ipcMain.handle('settings:read', () => readSettings());
  ipcMain.handle('settings:write', (_, data) => writeSettings(data));
}

module.exports = { setupSettingsHandlers };
