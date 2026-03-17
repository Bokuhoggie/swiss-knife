import { useState } from 'react'
import { IconAudio } from '../components/Icons.jsx'

const FORMATS = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus']
const BITRATES = ['64k', '128k', '192k', '256k', '320k']
const SAMPLE_RATES = ['22050', '44100', '48000', '96000']
const api = window.swissKnife

export default function AudioConverter() {
  const [files, setFiles] = useState([])
  const [outputFormat, setOutputFormat] = useState('mp3')
  const [bitrate, setBitrate] = useState('192k')
  const [sampleRate, setSampleRate] = useState('44100')
  const [outputDir, setOutputDir] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)

  const basename = (p) => p.split('/').pop().split('\\').pop()

  const addFiles = (paths) => {
    const unique = paths.filter(p => !files.includes(p))
    setFiles(prev => [...prev, ...unique])
    setResults([])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files).map(f => f.path))
  }

  const handleBrowse = async () => {
    const selected = await api.audio.selectFiles()
    if (selected.length) addFiles(selected)
  }

  const pickOutputDir = async () => {
    const dir = await api.selectOutputDir()
    if (dir) setOutputDir(dir)
  }

  const convert = async () => {
    if (!files.length) return
    if (!outputDir) { alert('Please select an output folder first.'); return }
    setLoading(true)
    setResults([])

    api.audio.onProgress(data => setProgress(data))

    const allResults = []
    for (let i = 0; i < files.length; i++) {
      setCurrentIdx(i)
      setProgress(null)
      const res = await api.audio.convert({ filePath: files[i], outputFormat, outputDir, bitrate, sampleRate })
      allResults.push({ ...res, inputPath: files[i] })
    }

    api.audio.offProgress()
    setResults(allResults)
    setProgress(null)
    setLoading(false)
  }

  return (
    <div className="page-anim" style={{ '--accent': '#FF3CAC' }}>
      <div className="page-header">
        <h1 className="page-title"><IconAudio size={20} /> Audio Converter</h1>
        <p className="page-subtitle">Convert audio between MP3, WAV, FLAC, AAC, OGG, M4A, and Opus</p>
      </div>

      <div className="card">
        <div
          className={`dropzone${dragOver ? ' drag-over' : ''}`}
          onClick={handleBrowse}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="dropzone-icon"><IconAudio size={36} /></div>
          <div className="dropzone-title">Drop audio files here or click to browse</div>
          <div className="dropzone-sub">Supports MP3, WAV, FLAC, AAC, OGG, M4A, WMA, Opus</div>
        </div>

        {files.length > 0 && (
          <div className="file-list">
            {files.map((f, i) => {
              const result = results.find(r => r.inputPath === f)
              const isCurrent = loading && i === currentIdx
              return (
                <div key={i} className="file-item">
                  <span className="file-item-icon"><IconAudio size={16} /></span>
                  <span className="file-item-name">{basename(f)}</span>
                  {isCurrent && progress && (
                    <span className="file-item-status pending">{Math.round(progress.percent || 0)}%</span>
                  )}
                  {result && (
                    <span className={`file-item-status ${result.success ? 'success' : 'error'}`}>
                      {result.success ? '✓ Done' : '✗ Error'}
                    </span>
                  )}
                  {!loading && <button className="file-remove-btn" onClick={() => setFiles(files.filter((_, j) => j !== i))}>✕</button>}
                </div>
              )
            })}
          </div>
        )}

        {loading && progress && (
          <div className="progress-wrap">
            <div className="progress-label">
              <span>Converting {basename(files[currentIdx])}…</span>
              <span>{Math.round(progress.percent || 0)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-bar" style={{ width: `${progress.percent || 0}%` }} />
            </div>
          </div>
        )}

        <div className="controls-row">
          <div className="form-group">
            <label className="form-label">Format</label>
            <select className="form-select" value={outputFormat} onChange={e => setOutputFormat(e.target.value)}>
              {FORMATS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Bitrate</label>
            <select className="form-select" value={bitrate} onChange={e => setBitrate(e.target.value)}>
              {BITRATES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Sample Rate</label>
            <select className="form-select" value={sampleRate} onChange={e => setSampleRate(e.target.value)}>
              {SAMPLE_RATES.map(s => <option key={s} value={s}>{(+s / 1000).toFixed(1)} kHz</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn btn-secondary" onClick={pickOutputDir}>📁 Output Folder</button>
          <button className="btn btn-primary" onClick={convert} disabled={loading || !files.length}>
            {loading ? <span className="spinner">⟳</span> : null}
            {loading ? 'Converting…' : `Convert ${files.length > 1 ? `${files.length} files` : 'Audio'}`}
          </button>
        </div>

        {outputDir && (
          <div className="output-path-row">
            <span className="output-folder-icon">📂</span>
            <span className="output-path-text">{outputDir}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => api.shell.openPath(outputDir)}>Open ↗</button>
          </div>
        )}

        {results.length > 0 && (
          <div className={`result-banner ${results.every(r => r.success) ? 'success' : 'error'}`}>
            {results.every(r => r.success)
              ? `✓ All ${results.length} files converted`
              : `⚠ ${results.filter(r => !r.success).length} file(s) failed`}
          </div>
        )}
      </div>
    </div>
  )
}
