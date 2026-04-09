# CLAUDE.md - Hoggie's Tool Kit (HTK) Project Guide

## Project Overview
Hoggie's Tool Kit (HTK) is an all-in-one Tauri (Rust) + React (Vite) desktop utility app featuring:
- Image conversion + background removal (Rust `image` crate)
- Video conversion (ffmpeg via Rust `tokio::process`)
- Audio conversion (ffmpeg via Rust `tokio::process`)
- Video/audio downloader (yt-dlp — auto-downloads binary on first run)
- PDF tools (Rust `lopdf`: merge, split, compress)
- File hasher / inspector (Rust `sha2`, `sha1`, `md-5`)

## Branch Strategy
| Branch | Purpose |
|--------|---------|
| `master` | Stable base, merges from both dev branches |
| `win-dev` | Windows-specific work (Electron) |
| `mac-dev` | macOS-specific work (Electron) |
| `win-rust` | Windows Tauri/Rust rewrite |
| `mac-rust` | macOS Tauri/Rust rewrite (current) |

## Current Branch: `mac-rust`
macOS Tauri/Rust rewrite. Migrated from Electron to Tauri v2 with a full Rust backend.
- ✅ Tauri v2 with native macOS titlebar (`titleBarStyle: "overlay"`, hidden title)
- ✅ All IPC handlers rewritten in Rust (`src-tauri/src/commands/`)
- ✅ `tauriBridge.js` polyfills `window.swissKnife` API for React components
- ✅ ffmpeg/ffprobe resolved as macOS binaries (no `.exe` extension)
- ✅ `yt-dlp` auto-downloads macOS universal binary + chmod 0o755
- ✅ Bundle targets: `dmg` + `app` for macOS distribution
- ✅ `tauri:build:mac` script targets `universal-apple-darwin` (arm64 + x64)

## Dev & Build Commands
```
npm install                    # Install JS dependencies
npm run tauri:dev              # Dev mode — starts Vite + Tauri together
npm run tauri:build            # Build for current platform
npm run tauri:build:mac        # Build universal macOS binary (arm64 + x64)
npm run lint                   # ESLint
```

### Prerequisites
- **Rust**: Install via `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node.js**: v18+
- **ffmpeg/ffprobe**: Place in `src-tauri/resources/` for bundling, or install via Homebrew for dev

## Project Structure
```
src-tauri/
  src/
    main.rs              # Tauri app entry point
    commands/
      mod.rs             # Module declarations
      media_commands.rs  # Video/audio convert, waveform, clip (ffmpeg)
      image_commands.rs  # Image convert + remove BG (image crate)
      download_commands.rs # yt-dlp downloader (auto-downloads binary)
      pdf_commands.rs    # PDF merge/split/compress (lopdf)
      hash_commands.rs   # File hashing (sha2/sha1/md5)
      inspector_commands.rs # File inspector
      dialog_commands.rs # Native file/folder dialogs
      settings_commands.rs # Persistent settings (JSON file)
  Cargo.toml             # Rust dependencies
  tauri.conf.json        # Tauri app config (window, bundle, CSP)
  capabilities/          # Tauri permission capabilities
  resources/             # Bundled binaries (ffmpeg, ffprobe)
  icons/                 # App icons (icon.png, icon.ico)
src/
  tauriBridge.js         # Polyfills window.swissKnife → Tauri invoke()
  pageCache.js           # Module-level page state cache
  pages/                 # One React page per tool
  components/            # SwissKnifeWidget, WaveformPlayer, Icons
  contexts/              # ThemeContext (themes, sizes, fonts)
  App.jsx                # Router + layout
  main.jsx               # Entry point (imports tauriBridge.js first)
```

## Code Style Guidelines
- **JavaScript/React**: Functional components with hooks
- **Rust backend**: All native ops in `src-tauri/src/commands/`, invoked via `@tauri-apps/api`
- **Bridge layer**: `src/tauriBridge.js` maps `window.swissKnife.*` to `invoke()` calls
- **CSS**: Plain CSS in `src/index.css`, class prefix `sk-` for widget components
- **Path handling**: Rust uses `std::path::PathBuf` — never string-concatenate paths
- **Binary permissions**: chmod 0o755 downloaded binaries (yt-dlp) on macOS via `#[cfg(unix)]`

## Known TODO (macOS)
- [ ] Bundle ffmpeg/ffprobe binaries in `src-tauri/resources/` for production builds
- [ ] Create proper `.icns` icon for macOS dock/Finder
- [ ] Test code-signing + notarization flow for macOS distribution
- [ ] Test auto-updater with tauri-plugin-updater
- [ ] `--cookies-from-browser safari` requires macOS Keychain access — test on packaged build
