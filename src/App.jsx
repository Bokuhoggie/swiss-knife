import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import SwissKnifeWidget from './components/SwissKnifeWidget.jsx'
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

/**
 * App-level drop handler.
 * Component dropzones call e.stopPropagation() so this ONLY fires
 * for drops that land outside any tool-specific dropzone.
 * Routes unhandled file drops to the File Inspector.
 */
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

function handleGlobalDrop(e) {
  const filePath = getFirstDropPath(e)
  if (!filePath) return
  
  window.dispatchEvent(new CustomEvent('blade-flick', { detail: '/inspector' }))

  setPendingFile(filePath)
  if (!window.location.hash.startsWith('#/inspector')) {
    window.location.hash = '#/inspector'
  }
}

export default function App() {
  const [dragOverApp, setDragOverApp] = useState(false)
  const [debugPaths, setDebugPaths] = useState('[]')

  useEffect(() => {
    const handleDrop = () => {
      setTimeout(() => {
         setDebugPaths(JSON.stringify(window.swissKnife?.getDroppedPaths?.() || []) + 
                      ' | Err: ' + (window.swissKnife?.getDropError?.() || 'none'))
      }, 50)
    }
    window.addEventListener('drop', handleDrop)
    return () => window.removeEventListener('drop', handleDrop)
  }, [])

  return (
    <ThemeProvider>
    <HashRouter>
      <div
        className="app-shell"
        onDragOver={(e) => { e.preventDefault(); setDragOverApp(true) }}
        onDragLeave={(e) => {
          // Only clear when leaving the app shell itself (not entering a child)
          if (e.currentTarget === e.target) setDragOverApp(false)
        }}
        onDrop={(e) => { setDragOverApp(false); handleGlobalDrop(e) }}
      >
        {/* ── Draggable title bar ── */}
        <div className="title-bar">
          <span className="title-bar-label">Swiss Knife</span>
          <span style={{color: 'red', marginLeft: 'auto', fontSize: 10}}>
            DBG: {debugPaths}
          </span>
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
        <SwissKnifeWidget />
        <SettingsCog />
      </div>
    </HashRouter>
    </ThemeProvider>
  )
}
