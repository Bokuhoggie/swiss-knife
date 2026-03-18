'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const { setupImageHandlers } = require('./ipc/image.cjs');
const { setupVideoHandlers } = require('./ipc/video.cjs');
const { setupAudioHandlers } = require('./ipc/audio.cjs');
const { setupDownloaderHandlers } = require('./ipc/downloader.cjs');
const { setupPdfHandlers } = require('./ipc/pdf.cjs');
const { setupHashHandlers } = require('./ipc/hash.cjs');
const { setupSettingsHandlers } = require('./ipc/settings.cjs');
const { setupInspectorHandlers } = require('./ipc/inspector.cjs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  // Resolve icon: prefer .ico on Windows, fall back to .png
  const iconPng = path.join(__dirname, '../public/icon.png');
  const iconIco = path.join(__dirname, '../public/icon.ico');
  const fs = require('fs');
  let appIcon;
  if (isWin && fs.existsSync(iconIco)) appIcon = iconIco;
  else if (fs.existsSync(iconPng)) appIcon = iconPng;

  const winOptions = {
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: '#0D0D0F',
    // 'hiddenInset' is macOS-only; use 'hidden' + overlay on Windows
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    ...(isWin && {
      titleBarOverlay: {
        color: '#0D0D0F',
        symbolColor: '#ffffff',
        height: 36,
      },
    }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    ...(appIcon && { icon: appIcon }),
  };

  const win = new BrowserWindow(winOptions);

  // Prevent Electron from navigating to a dropped file's URL — this is what
  // causes the window to go completely black on Windows when dragging files.
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.on('will-redirect', (e) => e.preventDefault());

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
  setupSettingsHandlers(ipcMain);
  setupInspectorHandlers(ipcMain, dialog);

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
