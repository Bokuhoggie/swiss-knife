# CLAUDE.md - Hoggie's Tool Kit (HTK) Project Guide

## Project Overview
Hoggie's Tool Kit (HTK) is an all-in-one Electron + React (Vite) desktop utility app featuring:
- Image conversion (sharp)
- Video conversion (ffmpeg-static + fluent-ffmpeg)
- Audio conversion (ffmpeg-static + fluent-ffmpeg)
- Video/audio downloader (yt-dlp-wrap — auto-downloads yt-dlp binary on first run)
- PDF tools (pdf-lib: merge, split, compress)
- File hasher

## Current Branch: `win-dev`
Windows-specific work branch. Key Windows fixes already applied:
- ✅ `titleBarStyle` is now platform-aware (`hiddenInset` on macOS, `hidden` + overlay on Windows)
- ✅ `titleBarOverlay` styled to match `#0D0D0F` background with white symbols
- ✅ yt-dlp binary auto-downloads to `app.getPath('userData')` on first launch (no PATH dependency)
- ✅ Path separators fixed in downloader (`path.join` instead of string concat)
- ✅ Windows build targets added (NSIS installer + portable `.exe`)
- ⚠️  App icon (`public/icon.ico`) still needed — add a 256x256 `.ico` file for Windows installer/taskbar

## Dev & Build Commands
> **Run these in a Windows terminal (PowerShell or CMD), not Git Bash**

```
npm install                        # Install dependencies (run first!)
npm run electron:dev               # Dev mode — starts Vite + Electron together
npm run electron:build:win         # Build Windows NSIS installer + portable exe → /release
npm run electron:build:win:portable  # Build portable exe only
npm run lint                       # ESLint
```

## Project Structure
```
electron/
  main.cjs              # Electron main process, BrowserWindow setup
  preload.cjs           # Context bridge — exposes window.swissKnife to renderer
  ipc/
    audio.cjs           # Audio conversion handlers (ffmpeg)
    video.cjs           # Video conversion handlers (ffmpeg)
    image.cjs           # Image conversion handlers (sharp)
    downloader.cjs      # yt-dlp download handlers (auto-downloads binary)
    pdf.cjs             # PDF merge/split/compress handlers (pdf-lib)
    hash.cjs            # File hash handlers
src/
  pages/                # One React page per tool
  components/           # Sidebar, Icons, SwissKnifeWidget
  App.jsx               # Router + layout
public/
  icon.ico              # Windows icon (NEEDS TO BE ADDED)
  icon.png              # macOS/Linux icon (NEEDS TO BE ADDED)
```

## Code Style Guidelines
- **System**: Direct me to run anything that needs a Windows terminal
- **JavaScript/React**: Functional components with hooks
- **Electron IPC**: All native ops go through `electron/ipc/`, exposed via `preload.cjs`
- **CSS**: Plain CSS in `src/index.css` (no Tailwind — add if desired)
- **Path handling**: Always use `path.join()` — never string-concatenate paths
- **Platform checks**: Use `process.platform === 'win32'` / `'darwin'` for OS-specific logic

## Known TODO (Windows)
- [ ] Create `public/icon.ico` (256x256) for Windows taskbar + installer
- [ ] Test ffmpeg-static binary resolution on Windows build
- [ ] PDF → Image feature (needs `pdftoppm` or alternative bundled for Windows)
- [ ] Consider code-signing setup for Windows installer (SmartScreen warnings)
