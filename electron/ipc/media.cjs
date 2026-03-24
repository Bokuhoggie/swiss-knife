'use strict';

const path = require('path');
const { spawn } = require('child_process');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static').replace('app.asar', 'app.asar.unpacked');

ffmpeg.setFfmpegPath(ffmpegPath);

function setupMediaHandlers(ipcMain) {
  // ── Waveform peak extraction ──────────────────────────────────────────────
  // Spawns ffmpeg to decode the audio track into raw f32le PCM at 8 kHz mono,
  // then computes 200 amplitude peaks normalised to 0–1.
  ipcMain.handle('media:waveform', async (_, filePath) => {
    return new Promise((resolve) => {
      const chunks = [];
      const proc = spawn(ffmpegPath, [
        '-i', filePath,
        '-f', 'f32le',
        '-ac', '1',
        '-ar', '8000',
        '-v', 'quiet',
        'pipe:1',
      ]);

      proc.stdout.on('data', (chunk) => chunks.push(chunk));
      proc.stderr.on('data', () => {}); // suppress

      proc.on('close', () => {
        try {
          const buf = Buffer.concat(chunks);
          if (buf.length < 4) { resolve([]); return; }

          const samples = new Float32Array(
            buf.buffer, buf.byteOffset, Math.floor(buf.length / 4)
          );

          const numBars = 200;
          const perBar = Math.max(1, Math.floor(samples.length / numBars));
          const peaks = [];

          for (let i = 0; i < numBars; i++) {
            let max = 0;
            const start = i * perBar;
            const end = Math.min(start + perBar, samples.length);
            for (let j = start; j < end; j++) {
              const abs = Math.abs(samples[j]);
              if (abs > max) max = abs;
            }
            peaks.push(max);
          }

          // Normalise to 0–1
          const maxPeak = Math.max(...peaks, 0.001);
          resolve(peaks.map((p) => p / maxPeak));
        } catch {
          resolve([]);
        }
      });

      proc.on('error', () => resolve([]));
    });
  });

  // ── Clip / trim ───────────────────────────────────────────────────────────
  // Uses stream-copy (no re-encode) so it's near-instant.
  ipcMain.handle('media:clip', async (_, { filePath, startTime, endTime, outputDir }) => {
    return new Promise((resolve) => {
      const ext = path.extname(filePath);
      const baseName = path.basename(filePath, ext);
      const sLabel = Math.round(startTime);
      const eLabel = Math.round(endTime);
      const clipName = `${baseName}_clip_${sLabel}s-${eLabel}s${ext}`;
      const outPath = path.join(outputDir, clipName);

      ffmpeg(filePath)
        .setStartTime(startTime)
        .setDuration(endTime - startTime)
        .audioCodec('copy')
        .videoCodec('copy')
        .output(outPath)
        .on('end', () => resolve({ success: true, outputPath: outPath }))
        .on('error', (err) => resolve({ success: false, error: err.message }))
        .run();
    });
  });
}

module.exports = { setupMediaHandlers };
