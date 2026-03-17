'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('swissKnife', {
  // Image conversion
  image: {
    convert: (opts) => ipcRenderer.invoke('image:convert', opts),
    selectFiles: () => ipcRenderer.invoke('image:selectFiles'),
  },
  // Video conversion
  video: {
    convert: (opts) => ipcRenderer.invoke('video:convert', opts),
    selectFile: () => ipcRenderer.invoke('video:selectFile'),
    onProgress: (cb) => ipcRenderer.on('video:progress', (_, data) => cb(data)),
    offProgress: () => ipcRenderer.removeAllListeners('video:progress'),
  },
  // Audio conversion
  audio: {
    convert: (opts) => ipcRenderer.invoke('audio:convert', opts),
    selectFiles: () => ipcRenderer.invoke('audio:selectFiles'),
    onProgress: (cb) => ipcRenderer.on('audio:progress', (_, data) => cb(data)),
    offProgress: () => ipcRenderer.removeAllListeners('audio:progress'),
  },
  // Video downloader
  downloader: {
    download: (opts) => ipcRenderer.invoke('downloader:download', opts),
    selectFolder: () => ipcRenderer.invoke('downloader:selectFolder'),
    onProgress: (cb) => ipcRenderer.on('downloader:progress', (_, data) => cb(data)),
    offProgress: () => ipcRenderer.removeAllListeners('downloader:progress'),
  },
  // PDF tools
  pdf: {
    merge: (opts) => ipcRenderer.invoke('pdf:merge', opts),
    split: (opts) => ipcRenderer.invoke('pdf:split', opts),
    compress: (opts) => ipcRenderer.invoke('pdf:compress', opts),
    toImages: (opts) => ipcRenderer.invoke('pdf:toImages', opts),
    selectFiles: () => ipcRenderer.invoke('pdf:selectFiles'),
    selectFile: () => ipcRenderer.invoke('pdf:selectFile'),
  },
  // File hasher
  hash: {
    compute: (opts) => ipcRenderer.invoke('hash:compute', opts),
    selectFile: () => ipcRenderer.invoke('hash:selectFile'),
  },
  // Shell
  shell: {
    openPath: (filePath) => ipcRenderer.invoke('shell:openPath', filePath),
  },
  // Common: select output directory
  selectOutputDir: () => ipcRenderer.invoke('common:selectOutputDir'),
});

// Also expose via ipcRenderer.invoke for common calls
contextBridge.exposeInMainWorld('ipcRenderer', {
  invoke: (channel, ...args) => ipcRenderer.invoke(channel, ...args),
  on: (channel, cb) => ipcRenderer.on(channel, cb),
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
});
