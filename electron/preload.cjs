'use strict';

const { contextBridge, ipcRenderer, webUtils } = require('electron');

window.addEventListener('dragenter', (e) => { e.preventDefault(); }, true);
window.addEventListener('dragover', (e) => {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
}, true);

contextBridge.exposeInMainWorld('swissKnife', {
  // File path from drag events (Electron 32+ — File.path is deprecated)
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch (e) {
      console.error('webUtils.getPathForFile failed:', e);
      return '';
    }
  },

  image: {
    convert:       (opts) => ipcRenderer.invoke('image:convert', opts),
    selectFiles:   ()     => ipcRenderer.invoke('image:selectFiles'),
    removeBg:      (opts) => ipcRenderer.invoke('image:removeBg', opts),
    readAsDataURL: (path) => ipcRenderer.invoke('image:readAsDataURL', path),
  },
  video: {
    convert: (opts) => ipcRenderer.invoke('video:convert', opts),
    selectFile: () => ipcRenderer.invoke('video:selectFile'),
    onProgress: (cb) => ipcRenderer.on('video:progress', (_, data) => cb(data)),
    offProgress: () => ipcRenderer.removeAllListeners('video:progress'),
  },
  audio: {
    convert: (opts) => ipcRenderer.invoke('audio:convert', opts),
    selectFiles: () => ipcRenderer.invoke('audio:selectFiles'),
    onProgress: (cb) => ipcRenderer.on('audio:progress', (_, data) => cb(data)),
    offProgress: () => ipcRenderer.removeAllListeners('audio:progress'),
  },
  downloader: {
    download: (opts) => ipcRenderer.invoke('downloader:download', opts),
    selectFolder: () => ipcRenderer.invoke('downloader:selectFolder'),
    onProgress: (cb) => ipcRenderer.on('downloader:progress', (_, data) => cb(data)),
    offProgress: () => ipcRenderer.removeAllListeners('downloader:progress'),
  },
  pdf: {
    merge: (opts) => ipcRenderer.invoke('pdf:merge', opts),
    split: (opts) => ipcRenderer.invoke('pdf:split', opts),
    compress: (opts) => ipcRenderer.invoke('pdf:compress', opts),
    compressToSize: (opts) => ipcRenderer.invoke('pdf:compressToSize', opts),
    onCompressProgress: (cb) => ipcRenderer.on('pdf:compressProgress', (_, data) => cb(data)),
    offCompressProgress: () => ipcRenderer.removeAllListeners('pdf:compressProgress'),
    fileSize: (filePath) => ipcRenderer.invoke('pdf:fileSize', filePath),
    toImages: (opts) => ipcRenderer.invoke('pdf:toImages', opts),
    selectFiles: () => ipcRenderer.invoke('pdf:selectFiles'),
    selectFile: () => ipcRenderer.invoke('pdf:selectFile'),
  },
  hash: {
    compute: (opts) => ipcRenderer.invoke('hash:compute', opts),
    selectFile: () => ipcRenderer.invoke('hash:selectFile'),
  },
  shell: {
    openPath: (filePath) => ipcRenderer.invoke('shell:openPath', filePath),
  },
  selectOutputDir: () => ipcRenderer.invoke('common:selectOutputDir'),
  settings: {
    read: () => ipcRenderer.invoke('settings:read'),
    write: (data) => ipcRenderer.invoke('settings:write', data),
  },
  inspector: {
    analyze:    (filePath) => ipcRenderer.invoke('inspector:analyze', filePath),
    selectFile: ()         => ipcRenderer.invoke('inspector:selectFile'),
  },
  media: {
    waveform: (filePath) => ipcRenderer.invoke('media:waveform', filePath),
    clip:     (opts)     => ipcRenderer.invoke('media:clip', opts),
  },
  getVersion: () => ipcRenderer.invoke('app:version'),
  updater: {
    check:    ()   => ipcRenderer.invoke('updater:check'),
    download: ()   => ipcRenderer.invoke('updater:download'),
    install:  ()   => ipcRenderer.invoke('updater:install'),
    onUpdateAvailable: (cb) => ipcRenderer.on('updater:update-available', (_, info) => cb(info)),
    onNoUpdate:        (cb) => ipcRenderer.on('updater:no-update', () => cb()),
    onProgress:        (cb) => ipcRenderer.on('updater:download-progress', (_, p) => cb(p)),
    onDownloaded:      (cb) => ipcRenderer.on('updater:downloaded', () => cb()),
    onError:           (cb) => ipcRenderer.on('updater:error', (_, msg) => cb(msg)),
    offAll: () => {
      ['updater:update-available','updater:no-update','updater:download-progress','updater:downloaded','updater:error']
        .forEach(ch => ipcRenderer.removeAllListeners(ch));
    },
  },
});

