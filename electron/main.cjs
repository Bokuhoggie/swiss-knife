'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { setupImageHandlers } = require('./ipc/image.cjs');
const { setupVideoHandlers } = require('./ipc/video.cjs');
const { setupAudioHandlers } = require('./ipc/audio.cjs');
const { setupDownloaderHandlers } = require('./ipc/downloader.cjs');
const { setupPdfHandlers } = require('./ipc/pdf.cjs');
const { setupHashHandlers } = require('./ipc/hash.cjs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: '#0D0D0F',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(__dirname, '../public/icon.png'),
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    // win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Register all IPC handlers
  setupImageHandlers(ipcMain, dialog);
  setupVideoHandlers(ipcMain, dialog);
  setupAudioHandlers(ipcMain, dialog);
  setupDownloaderHandlers(ipcMain, dialog);
  setupPdfHandlers(ipcMain, dialog);
  setupHashHandlers(ipcMain, dialog);

  // Open output folder in Finder/Explorer
  ipcMain.handle('shell:openPath', async (_, filePath) => {
    await shell.showItemInFolder(filePath);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
