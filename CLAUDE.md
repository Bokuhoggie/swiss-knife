# CLAUDE.md - Hoggie's Tool Kit (HTK) Project Guide

## Project Overview
Hoggie's Tool Kit (HTK) is an all-in-one Tauri 2 + React (Vite) desktop utility app featuring:
- Image conversion (Rust `image` crate)
- Video conversion (ffmpeg via Rust `tokio::process`)
- Audio conversion (ffmpeg via Rust `tokio::process`)
- Video/audio downloader (yt-dlp via Rust `tokio::process`)
- PDF tools (Rust `lopdf`: merge, split, compress)
- File hasher (Rust `sha2`, `sha1`, `md-5`)
- File inspector (metadata analysis)
- Media player with waveform visualisation

## Architecture
- **Frontend**: React + Vite (JavaScript/JSX)
- **Backend**: Rust via Tauri 2 — all native operations are Tauri commands
- **Bridge**: `src/tauriBridge.js` creates `window.htk` which wraps `@tauri-apps/api/core invoke()` calls
- **No Electron, no Python** — strictly Rust backend

## Current Branch: `win-rust`
Windows-specific work branch with Tauri backend.

## Dev & Build Commands
> **Run these in a Windows terminal (PowerShell or CMD), not Git Bash**

```
npm install                # Install JS dependencies (run first!)
npm run tauri:dev          # Dev mode — starts Vite + Tauri together
npm run tauri:build        # Build Windows NSIS installer → src-tauri/target/release/bundle/
npm run dev                # Vite dev server only (no Tauri shell)
npm run lint               # ESLint
```

## Project Structure
```
src-tauri/
  src/
    main.rs               # Tauri app entry point, command registration
    commands/
      mod.rs              # Module declarations
      image_commands.rs   # Image conversion (Rust image crate)
      media_commands.rs   # Audio/video waveform + clip (ffmpeg)
      download_commands.rs # yt-dlp download handlers
      pdf_commands.rs     # PDF merge/split/compress (lopdf)
      hash_commands.rs    # File hashing (SHA-256, SHA-1, MD5)
      inspector_commands.rs # File metadata analysis
      settings_commands.rs  # Settings read/write
      dialog_commands.rs  # File/folder dialog wrappers
  Cargo.toml              # Rust dependencies
  tauri.conf.json          # Tauri window config, bundler, CSP
src/
  tauriBridge.js          # Creates window.htk — polyfills Tauri invoke() calls
  pages/                  # One React page per tool
  components/             # ToolKitWidget, WaveformPlayer, Sidebar, Icons
  contexts/               # ThemeContext (11 themes + secret unlock system)
  hooks/                  # useSettings
  App.jsx                 # Router + layout
  index.css               # All styles (plain CSS, no Tailwind)
public/
  icon.ico                # Windows icon
  icon.png                # App icon
```

## Code Style Guidelines
- **JavaScript/React**: Functional components with hooks
- **Tauri IPC**: All native ops go through `src-tauri/src/commands/`, invoked via `window.htk` bridge
- **CSS**: Plain CSS in `src/index.css` (no Tailwind)
- **Path handling**: Always use proper path joining — never string-concatenate paths
- **API bridge**: All pages use `const api = window.htk` to access backend commands

## Known TODO
- [ ] Consider tauri-plugin-updater for auto-update support
- [ ] PDF → Image feature (needs alternative to pdftoppm)
- [ ] Consider code-signing setup for Windows installer (SmartScreen warnings)
