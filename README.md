# Hoggie's Tool Kit (HTK)

Your all-in-one file conversion and utility toolkit — private, fast, and offline.

Built with **Tauri 2** (Rust backend) + **React** (Vite frontend).

## Features

- 🖼 **Image Converter** — JPG, PNG, WebP, AVIF, GIF, BMP, TIFF, ICO + background removal
- 🎬 **Video Converter** — MP4, MKV, AVI, MOV, WebM with hardware acceleration
- 🎵 **Audio Converter** — MP3, WAV, FLAC, AAC, OGG, M4A, Opus
- ⬇️ **Video/Audio Downloader** — Download from YouTube and other platforms
- 📄 **PDF Tools** — Merge, split, compress, compress-to-target-size
- 🔑 **File Hasher** — SHA-256, SHA-512, SHA-1, MD5
- 🔍 **File Inspector** — Metadata analysis with media preview
- 🎛 **Waveform Player** — Audio/video playback with clip/trim tool

## Quick Start

```bash
npm install
npm run tauri:dev
```

## Build

```bash
npm run tauri:build
```

## Tech Stack

| Layer    | Technology |
|----------|-----------|
| Frontend | React 19, Vite 8, React Router 7 |
| Backend  | Rust (Tauri 2) |
| Styling  | Plain CSS with custom theming system |
| Desktop  | Tauri 2 (native window, file dialogs, shell) |
