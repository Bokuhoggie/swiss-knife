'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell, protocol, net } = require('electron');
const path = require('path');

// ─── Single instance lock (fixes "needs two tries" NSIS installer bug) ───────
// When the NSIS installer's "Launch app" checkbox is used, it starts the app
// with elevated privileges. If the user also double-clicks the shortcut, two
// instances fight. The single-instance lock ensures only one runs at a time
// and focuses the existing window if a second instance tries to start.
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const { setupImageHandlers } = require('./ipc/image.cjs');
const { setupVideoHandlers } = require('./ipc/video.cjs');
const { setupAudioHandlers } = require('./ipc/audio.cjs');
const { setupDownloaderHandlers } = require('./ipc/downloader.cjs');
const { setupPdfHandlers } = require('./ipc/pdf.cjs');
const { setupHashHandlers } = require('./ipc/hash.cjs');
const { setupSettingsHandlers } = require('./ipc/settings.cjs');
const { setupInspectorHandlers } = require('./ipc/inspector.cjs');
const { autoUpdater } = require('electron-updater');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const { pathToFileURL } = require('url');

// Register htk-media as privileged to allow local image loading and bypass CSP
protocol.registerSchemesAsPrivileged([
  { scheme: 'htk-media', privileges: {
    secure: true,
    supportFetchAPI: true,
    bypassCSP: true,
    stream: true
  } }
]);

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

  return win;
}

// ─── Auto-updater ────────────────────────────────────────────────────────────
function setupAutoUpdater(win) {
  // Don't run in dev mode
  if (isDev) return;

  autoUpdater.autoDownload = false; // ask user first
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('update-available', (info) => {
    win.webContents.send('updater:update-available', {
      version: info.version,
      releaseNotes: info.releaseNotes || '',
    });
  });

  autoUpdater.on('update-not-available', () => {
    win.webContents.send('updater:no-update');
  });

  autoUpdater.on('download-progress', (progress) => {
    win.webContents.send('updater:download-progress', {
      percent: Math.round(progress.percent),
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', () => {
    win.webContents.send('updater:downloaded');
  });

  autoUpdater.on('error', (err) => {
    win.webContents.send('updater:error', err.message);
  });

  // IPC: renderer triggers these actions
  ipcMain.handle('updater:check', async () => {
    try { await autoUpdater.checkForUpdates(); } catch (e) { /* silent */ }
  });
  ipcMain.handle('updater:download', async () => {
    try { await autoUpdater.downloadUpdate(); } catch (e) { /* silent */ }
  });
  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // Check for updates 8 seconds after launch (non-blocking)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch(() => {});
  }, 8000);
}

// When a second instance tries to start, focus the existing window instead
app.on('second-instance', () => {
  const wins = BrowserWindow.getAllWindows();
  if (wins.length) {
    const win = wins[0];
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.whenReady().then(() => {
  // Register custom protocol to load local files (bypasses "Not allowed to load local resource")
  protocol.handle('htk-media', (request) => {
    let rawPath = decodeURIComponent(request.url.replace('htk-media://', ''))
    // Strip query params (e.g. ?t=timestamp for cache busting)
    const qIdx = rawPath.indexOf('?')
    if (qIdx !== -1) rawPath = rawPath.substring(0, qIdx)
    // Normalize to prevent path traversal
    rawPath = path.normalize(rawPath)
    return net.fetch(pathToFileURL(rawPath).href)
  })

  const win = createWindow();

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

  // App version
  ipcMain.handle('app:version', () => app.getVersion());

  setupAutoUpdater(win);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
