# CLAUDE.md - Hoggie's Tool Kit (HTK) Project Guide

## Project Overview
Hoggie's Tool Kit (HTK) is an all-in-one Electron + React (Vite) desktop utility app featuring:
- Image conversion + background removal (sharp)
- Video conversion (ffmpeg-static + fluent-ffmpeg)
- Audio conversion (ffmpeg-static + fluent-ffmpeg)
- Video/audio downloader (yt-dlp-wrap — auto-downloads yt-dlp binary on first run)
- PDF tools (pdf-lib: merge, split, compress)
- File hasher / inspector

## Branch Strategy
| Branch | Purpose |
|--------|---------|
| `master` | Stable base, merges from both dev branches |
| `win-dev` | Windows-specific work |
| `mac-dev` | macOS-specific work (current) |

## Current Branch: `mac-dev`
macOS-specific work branch. Key fixes applied:
- ✅ `titleBarStyle: 'hiddenInset'` on macOS for native traffic-light buttons
- ✅ `window-all-closed` respects macOS convention (app stays alive until Cmd+Q)
- ✅ `app.on('activate')` re-creates window when clicking dock icon with no windows
- ✅ `ffmpeg-static` binary chmod'd 0o755 on first use (macOS/Linux)
- ✅ `yt-dlp` binary chmod'd 0o755 after auto-download (macOS/Linux)
- ✅ `file://` URLs fixed in Remove BG preview (`file:// + /abs/path` → `file:///abs/path`)
- ✅ Mac build targets: `dmg` (installer) + `zip` (for auto-updater delta)
- ✅ `electron:publish:mac` script added for GitHub Releases CI
- ✅ arm64 + x64 universal build targets for Apple Silicon + Intel

## Dev & Build Commands
```
npm install                    # Install dependencies
npm run electron:dev           # Dev mode — starts Vite + Electron together
npm run electron:build:mac     # Build .dmg + .zip → /release
npm run electron:publish:mac   # Build + publish to GitHub Releases
npm run lint                   # ESLint
```

## Project Structure
```
electron/
  main.cjs              # Electron main process, BrowserWindow setup
  preload.cjs           # Context bridge — exposes window.swissKnife to renderer
  ipc/
    audio.cjs           # Audio conversion handlers (ffmpeg)
    video.cjs           # Video conversion handlers (ffmpeg)
    image.cjs           # Image conversion + Remove BG handlers (sharp)
    downloader.cjs      # yt-dlp download handlers (auto-downloads binary)
    pdf.cjs             # PDF merge/split/compress handlers (pdf-lib)
    hash.cjs            # File hash handlers
    inspector.cjs       # File inspector handlers
    settings.cjs        # Persistent settings handlers
src/
  pages/                # One React page per tool
  components/           # Sidebar, Icons, SwissKnifeWidget
  contexts/             # ThemeContext (themes, sizes, fonts)
  App.jsx               # Router + layout
public/
  icon.png              # macOS app icon (used for .icns via electron-builder)
  icon.ico              # Windows icon (for win-dev)
```

## Code Style Guidelines
- **JavaScript/React**: Functional components with hooks
- **Electron IPC**: All native ops go through `electron/ipc/`, exposed via `preload.cjs`
- **CSS**: Plain CSS in `src/index.css`
- **Path handling**: Always use `path.join()` — never string-concatenate paths
- **File URLs**: Use `'file://' + absolutePath` (not `'file:///' + path`) — macOS paths start with `/` so `file://` + `/abs/path` = `file:///abs/path` correctly
- **Platform checks**: Use `process.platform === 'win32'` / `'darwin'` for OS-specific logic
- **Binary permissions**: Always chmod 0o755 native binaries (ffmpeg, yt-dlp) on macOS/Linux after resolving/downloading

## Known TODO (macOS)
- [ ] Create `public/icon.icns` for best-quality macOS dock/Finder icon (electron-builder can auto-convert from icon.png but quality is better with a proper .icns)
- [ ] Test code-signing + notarization flow (`CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` env vars)
- [ ] Test auto-updater with real GitHub Release on macOS (zip-based delta)
- [ ] `--cookies-from-browser safari` requires macOS Keychain access — test on a packaged build
- [ ] PDF → Image feature (needs `pdftoppm` or alternative bundled for macOS)
