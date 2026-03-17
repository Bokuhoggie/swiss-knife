import { HashRouter, Routes, Route } from 'react-router-dom'
import SwissKnifeWidget from './components/SwissKnifeWidget.jsx'
import Home from './pages/Home.jsx'
import ImageConverter from './pages/ImageConverter.jsx'
import AudioConverter from './pages/AudioConverter.jsx'
import VideoConverter from './pages/VideoConverter.jsx'
import Downloader from './pages/Downloader.jsx'
import PdfTools from './pages/PdfTools.jsx'
import FileHasher from './pages/FileHasher.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
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
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </main>
        <SwissKnifeWidget />
      </div>
    </HashRouter>
  )
}
