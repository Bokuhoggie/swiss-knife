import { useState } from 'react'
import { IconDownload } from '../components/Icons.jsx'

const QUALITIES = ['1080p', '720p', '480p', '360p']
const api = window.swissKnife

export default function Downloader() {
  const [url, setUrl] = useState('')
  const [formatType, setFormatType] = useState('video')
  const [quality, setQuality] = useState('1080p')
  const [outputDir, setOutputDir] = useState('')
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [result, setResult] = useState(null)

  const pickOutputDir = async () => {
    const dir = await api.downloader.selectFolder()
    if (dir) setOutputDir(dir)
  }

  const download = async () => {
    if (!url.trim()) return
    if (!outputDir) { alert('Please select an output folder first.'); return }
    setLoading(true)
    setResult(null)
    setProgress(null)

    api.downloader.onProgress(data => setProgress(data))

    const res = await api.downloader.download({
      url: url.trim(),
      outputDir,
      formatType,
      quality,
    })

    api.downloader.offProgress()
    setResult(res)
    setProgress(null)
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') download()
  }

  return (
    <div className="page-anim" style={{ '--accent': '#00FF87' }}>
      <div className="page-header">
        <h1 className="page-title"><IconDownload size={20} /> Video Downloader</h1>
        <p className="page-subtitle">Download videos from YouTube, Twitter, Reddit, and hundreds of other sites via yt-dlp</p>
      </div>

      <div className="card">
        {/* URL Input */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Video URL</label>
          <div className="url-input-group">
            <input
              className="form-input"
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
            />
            <button className="btn btn-primary btn-lg" onClick={download} disabled={loading || !url.trim()}>
              {loading ? <span className="spinner">⟳</span> : '⬇'}
              {loading ? 'Downloading…' : 'Download'}
            </button>
          </div>
        </div>

        {/* Supported sites hint */}
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
          Supports: YouTube · Twitter/X · Reddit · Vimeo · TikTok · Instagram · and 1000+ more
        </div>

        <div className="section-divider" />

        {/* Options */}
        <div className="controls-row">
          <div className="form-group">
            <label className="form-label">Format</label>
            <select className="form-select" value={formatType} onChange={e => setFormatType(e.target.value)} disabled={loading}>
              <option value="video">🎬 Video (MP4)</option>
              <option value="audio">🎵 Audio only (MP3)</option>
            </select>
          </div>
          {formatType === 'video' && (
            <div className="form-group">
              <label className="form-label">Max Quality</label>
              <select className="form-select" value={quality} onChange={e => setQuality(e.target.value)} disabled={loading}>
                {QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={pickOutputDir} disabled={loading}>
            📁 Output Folder
          </button>
        </div>

        {outputDir && (
          <div className="output-path-row">
            <span className="output-folder-icon">📂</span>
            <span className="output-path-text">{outputDir}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => api.shell.openPath(outputDir)}>Open ↗</button>
          </div>
        )}

        {/* Progress */}
        {loading && (
          <div className="progress-wrap">
            <div className="progress-label">
              <span>{progress?.title || 'Starting download…'}</span>
              <span>{progress ? `${Math.round(progress.percent || 0)}%` : ''}</span>
            </div>
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${progress?.percent || 2}%` }} />
            </div>
          </div>
        )}

        {result && (
          <div className={`result-banner ${result.success ? 'success' : 'error'}`}>
            {result.success
              ? `✓ Downloaded to: ${result.outputDir}`
              : `✗ ${result.error}`}
          </div>
        )}
      </div>
    </div>
  )
}
