import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { ThemeProvider, useTheme } from './contexts/ThemeContext.jsx'
import { getCurrentWindow } from '@tauri-apps/api/window'
import HtkWidget from './components/HtkWidget.jsx'
import Home from './pages/Home.jsx'
import ImageConverter from './pages/ImageConverter.jsx'
import AudioConverter from './pages/AudioConverter.jsx'
import VideoConverter from './pages/VideoConverter.jsx'
import Downloader from './pages/Downloader.jsx'
import PdfTools from './pages/PdfTools.jsx'
import FileHasher from './pages/FileHasher.jsx'
import FileInspector from './pages/FileInspector.jsx'
import Settings from './pages/Settings.jsx'
import { setPendingFile } from './globalDrop.js'
import { getFirstDropPath } from './dropHelpers.js'

// ─── Settings cog ─────────────────────────────────────────────────────────────
function SettingsCog() {
  const navigate = useNavigate()
  const location = useLocation()
  if (location.pathname === '/settings') return null
  return (
    <button className="settings-cog-btn" onClick={() => navigate('/settings')} title="Settings">
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" style={{ imageRendering: 'pixelated' }}>
        <rect x="10" y="1"  width="4" height="4" fill="#AAAACC"/>
        <rect x="10" y="19" width="4" height="4" fill="#AAAACC"/>
        <rect x="1"  y="10" width="4" height="4" fill="#AAAACC"/>
        <rect x="19" y="10" width="4" height="4" fill="#AAAACC"/>
        <rect x="3"  y="3"  width="4" height="4" fill="#AAAACC"/>
        <rect x="17" y="3"  width="4" height="4" fill="#AAAACC"/>
        <rect x="3"  y="17" width="4" height="4" fill="#AAAACC"/>
        <rect x="17" y="17" width="4" height="4" fill="#AAAACC"/>
        <rect x="6"  y="6"  width="12" height="12" fill="#AAAACC"/>
        <rect x="8"  y="8"  width="8"  height="8"  fill="var(--bg-surface)"/>
        <rect x="10" y="10" width="4"  height="4"  fill="#AAAACC"/>
      </svg>
    </button>
  )
}

// ─── Update notifier ──────────────────────────────────────────────────────────
function UpdateNotifier() {
  const [state, setState] = useState('idle') // idle | available | downloading | downloaded | error
  const [version, setVersion] = useState('')
  const [progress, setProgress] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const api = window.htk?.updater
    if (!api) return

    api.onUpdateAvailable((info) => { setVersion(info.version); setState('available'); setDismissed(false) })
    api.onProgress((p) => { setState('downloading'); setProgress(p.percent) })
    api.onDownloaded(() => setState('downloaded'))
    api.onError(() => setState('error'))

    return () => api.offAll?.()
  }, [])

  if (dismissed || state === 'idle' || state === 'error') return null

  return (
    <div style={{
      position: 'fixed', top: 42, left: '50%', transform: 'translateX(-50%)',
      zIndex: 2000,
      background: 'var(--bg-surface)',
      border: '1px solid var(--accent)',
      boxShadow: '0 0 16px var(--glow-accent)',
      borderRadius: 6,
      padding: '8px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
      fontSize: 12,
      fontFamily: "'Press Start 2P', monospace",
      color: 'var(--text-primary)',
      minWidth: 320,
      maxWidth: 460,
    }}>
      {state === 'available' && (
        <>
          <span style={{ color: 'var(--accent)', fontSize: 10 }}>▲ v{version} available</span>
          <button
            className="btn btn-primary btn-sm"
            style={{ fontSize: 10, padding: '4px 10px', marginLeft: 'auto' }}
            onClick={() => window.htk.updater.download()}
          >Download</button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 10, padding: '4px 8px' }}
            onClick={() => setDismissed(true)}
          >✕</button>
        </>
      )}
      {state === 'downloading' && (
        <>
          <span style={{ flex: 1 }}>
            <span style={{ color: 'var(--accent)', fontSize: 10 }}>Downloading update…</span>
            <div style={{ marginTop: 4, height: 4, background: 'var(--bg-hover)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          </span>
          <span style={{ fontSize: 10, opacity: 0.7 }}>{progress}%</span>
        </>
      )}
      {state === 'downloaded' && (
        <>
          <span style={{ color: 'var(--accent)', fontSize: 10 }}>✓ Ready to install</span>
          <button
            className="btn btn-primary btn-sm"
            style={{ fontSize: 10, padding: '4px 10px', marginLeft: 'auto' }}
            onClick={() => window.htk.updater.install()}
          >Restart & Install</button>
          <button
            className="btn btn-ghost btn-sm"
            style={{ fontSize: 10, padding: '4px 8px' }}
            onClick={() => setDismissed(true)}
          >✕</button>
        </>
      )}
    </div>
  )
}

// ─── Global drop handler ──────────────────────────────────────────────────────
function handleGlobalDrop(e) {
  const filePath = getFirstDropPath(e)
  if (!filePath) return

  window.dispatchEvent(new CustomEvent('blade-flick', { detail: '/inspector' }))

  setPendingFile(filePath)
  if (!window.location.hash.startsWith('#/inspector')) {
    window.location.hash = '#/inspector'
  }
}

// ─── TRON Light Cycles — bright racing trails on gridlines ───────────────────
// Positions / timings randomized once per theme and cached so re-renders are stable
// (keeps Math.random out of render — react-hooks/purity).
const cycleCache = new Map()
function generateCycles(themeId) {
  if (cycleCache.has(themeId)) return cycleCache.get(themeId)
  const color = themeId === 'clu' ? 'orange' : ''
  const arr = []
  for (let i = 0; i < 5; i++) {
    const row = 60 + (i * 120) + Math.floor(Math.random() * 60)
    arr.push({
      type: i % 2 === 0 ? 'cycle-h' : 'cycle-h2',
      color,
      style: {
        top: `${row}px`,
        animationDuration: `${6 + Math.random() * 8}s`,
        animationDelay: `${-Math.random() * 12}s`,
      },
    })
  }
  for (let i = 0; i < 4; i++) {
    const col = 100 + (i * 250) + Math.floor(Math.random() * 100)
    arr.push({
      type: i % 2 === 0 ? 'cycle-v' : 'cycle-v2',
      color,
      style: {
        left: `${col}px`,
        animationDuration: `${8 + Math.random() * 10}s`,
        animationDelay: `${-Math.random() * 15}s`,
      },
    })
  }
  cycleCache.set(themeId, arr)
  return arr
}

function TronCycles() {
  const { themeId } = useTheme()
  const location = useLocation()
  const isTron = themeId === 'tron' || themeId === 'clu'
  const isHome = location.pathname === '/'

  if (!isTron) return null
  const cycles = generateCycles(themeId)

  return (
    <div className={`tron-cycles ${isHome ? '' : 'tron-cycles-dim'}`}>
      {cycles.map((c, i) => (
        <div key={i} className={`cycle ${c.type} ${c.color}`} style={c.style} />
      ))}
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
    <HashRouter>
      <div
        className="app-shell"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleGlobalDrop}
      >
        <div className="title-bar">
          <span className="title-bar-label">Hoggie's Tool Kit</span>
          <div className="title-bar-controls">
            <button className="title-bar-btn" onClick={() => getCurrentWindow().minimize()} title="Minimize">
              <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="5" width="8" height="1" fill="currentColor"/></svg>
            </button>
            <button className="title-bar-btn" onClick={() => getCurrentWindow().toggleMaximize()} title="Maximize">
              <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.2"/></svg>
            </button>
            <button className="title-bar-btn title-bar-btn-close" onClick={() => getCurrentWindow().close()} title="Close">
              <svg width="10" height="10" viewBox="0 0 10 10"><line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" strokeWidth="1.4"/><line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" strokeWidth="1.4"/></svg>
            </button>
          </div>
        </div>

        <main className="main-content">
          <div className="page-scroll">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/image" element={<ImageConverter />} />
              <Route path="/audio" element={<AudioConverter />} />
              <Route path="/video" element={<VideoConverter />} />
              <Route path="/download" element={<Downloader />} />
              <Route path="/pdf" element={<PdfTools />} />
              <Route path="/hash" element={<FileHasher />} />
              <Route path="/inspector" element={<FileInspector />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
        <HtkWidget />
        <SettingsCog />
        <UpdateNotifier />
        <TronCycles />
      </div>
    </HashRouter>
    </ThemeProvider>
  )
}
