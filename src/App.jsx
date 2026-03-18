import { useState } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
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
function handleGlobalDrop(e) {
  const filePath = getFirstDropPath(e)
  if (!filePath) return

  setPendingFile(filePath)
  if (!window.location.hash.startsWith('#/inspector')) {
    window.location.hash = '#/inspector'
  }
}

export default function App() {
  const [dragOverApp, setDragOverApp] = useState(false)

  return (
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
      </div>
    </HashRouter>
  )
}
