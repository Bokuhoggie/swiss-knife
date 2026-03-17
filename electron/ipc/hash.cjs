'use strict';

const fs = require('fs');
const crypto = require('crypto');

function setupHashHandlers(ipcMain, dialog) {
  ipcMain.handle('hash:selectFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile']
    });
    return canceled ? null : filePaths[0];
  });

  ipcMain.handle('hash:compute', async (_, { filePath, algorithms }) => {
    try {
      const buffer = fs.readFileSync(filePath);
      const results = {};
      for (const algo of (algorithms || ['md5', 'sha1', 'sha256', 'sha512'])) {
        results[algo] = crypto.createHash(algo).update(buffer).digest('hex');
      }
      return { success: true, filePath, hashes: results };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = { setupHashHandlers };
