import { useState } from 'react'
import { IconImage } from '../components/Icons.jsx'

const FORMATS = ['jpg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff']
const api = window.swissKnife

export default function ImageConverter() {
  const [files, setFiles] = useState([])
  const [outputFormat, setOutputFormat] = useState('png')
  const [quality, setQuality] = useState(85)
  const [outputDir, setOutputDir] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const addFiles = (paths) => {
    const unique = paths.filter(p => !files.includes(p))
    setFiles(prev => [...prev, ...unique])
    setResults([])
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const dropped = Array.from(e.dataTransfer.files).map(f => f.path)
    addFiles(dropped)
  }

  const handleBrowse = async () => {
    const selected = await api.image.selectFiles()
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
    try {
      const res = await api.image.convert({ filePaths: files, outputFormat, outputDir, quality })
      setResults(res)
    } finally {
      setLoading(false)
    }
  }

  const basename = (p) => p.split('/').pop().split('\\').pop()

  return (
    <div className="page-anim" style={{ '--accent': '#00D4FF' }}>
      <div className="page-header">
        <h1 className="page-title">
          <IconImage size={24} style={{ marginRight: 16, verticalAlign: 'middle' }} />
          Image Converter
        </h1>
        <p className="page-subtitle">Convert images between JPG, PNG, WebP, AVIF, GIF, BMP, and TIFF</p>
      </div>

      <div className="card">
        {/* Dropzone */}
        <div
          className={`dropzone${dragOver ? ' drag-over' : ''}`}
          onClick={handleBrowse}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="dropzone-icon"><IconImage size={36} /></div>
          <div className="dropzone-title">Drop images here or click to browse</div>
          <div className="dropzone-sub">Supports JPG, PNG, WebP, AVIF, GIF, BMP, TIFF — multiple files OK</div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="file-list">
            {files.map((f, i) => {
              const result = results.find(r => r.inputPath === f)
              return (
                <div key={i} className="file-item">
                  <span className="file-item-icon"><IconImage size={16} /></span>
                  <span className="file-item-name">{basename(f)}</span>
                  {result && (
                    <span className={`file-item-status ${result.success ? 'success' : 'error'}`}>
                      {result.success ? '✓ Done' : '✗ Error'}
                    </span>
                  )}
                  <button className="file-remove-btn" onClick={() => setFiles(files.filter((_, j) => j !== i))}>✕</button>
                </div>
              )
            })}
          </div>
        )}

        {/* Controls */}
        <div className="controls-row">
          <div className="form-group">
            <label className="form-label">Output Format</label>
            <select className="form-select" value={outputFormat} onChange={e => setOutputFormat(e.target.value)}>
              {FORMATS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Quality: {quality}</label>
            <div className="range-wrap">
              <input type="range" min={10} max={100} value={quality} onChange={e => setQuality(+e.target.value)} />
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <button className="btn btn-secondary" onClick={pickOutputDir}>
            📁 Output Folder
          </button>
          <button className="btn btn-primary" onClick={convert} disabled={loading || !files.length}>
            {loading ? <span className="spinner">⟳</span> : null}
            {loading ? 'Converting…' : `Convert ${files.length > 1 ? `${files.length} files` : 'Image'}`}
          </button>
        </div>

        {/* Output path */}
        {outputDir && (
          <div className="output-path-row">
            <span className="output-folder-icon">📂</span>
            <span className="output-path-text">{outputDir}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => api.shell.openPath(outputDir)}>Open ↗</button>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className={`result-banner ${results.every(r => r.success) ? 'success' : 'error'}`}>
            {results.every(r => r.success)
              ? `✓ All ${results.length} images converted successfully`
              : `⚠ ${results.filter(r => !r.success).length} file(s) failed`}
          </div>
        )}
      </div>
    </div>
  )
}
