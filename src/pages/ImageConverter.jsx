import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { IconImage } from '../components/Icons.jsx'

const FORMATS = ['jpg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff']
const api = window.swissKnife

export default function ImageConverter() {
  const { state } = useLocation()
  const [tab, setTab] = useState('convert')

  const [files, setFiles]               = useState([])
  const [outputFormat, setOutputFormat] = useState('png')
  const [quality, setQuality]           = useState(85)
  const [outputDir, setOutputDir]       = useState('')
  const [results, setResults]           = useState([])
  const [loading, setLoading]           = useState(false)
  const [dragOver, setDragOver]         = useState(false)

  // Advanced
  const [width, setWidth]               = useState('')
  const [height, setHeight]             = useState('')
  const [keepMetadata, setKeepMetadata] = useState(false)

  useEffect(() => {
    api.settings?.read().then(s => {
      if (!s) return
      if (s.general?.defaultOutputDir)  setOutputDir(s.general.defaultOutputDir)
      if (s.image?.format)              setOutputFormat(s.image.format)
      if (s.image?.quality !== undefined) setQuality(s.image.quality)
      if (s.image?.width  !== undefined) setWidth(s.image.width)
      if (s.image?.height !== undefined) setHeight(s.image.height)
      if (s.image?.keepMetadata !== undefined) setKeepMetadata(s.image.keepMetadata)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (state?.file) addFiles([state.file])
  }, [state?.file])


  const basename = (p) => p ? p.split('/').pop().split('\\').pop() : ''

  const addFiles = (paths) => {
    const unique = paths.filter(p => p && !files.includes(p))
    setFiles(prev => [...prev, ...unique])
    setResults([])
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files).map(f => f.path).filter(Boolean))
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
    setLoading(true); setResults([])
    try {
      const res = await api.image.convert({
        filePaths: files, outputFormat, outputDir, quality,
        width:  width  ? parseInt(width)  : undefined,
        height: height ? parseInt(height) : undefined,
        keepMetadata,
      })
      setResults(res)
    } finally {
      setLoading(false)
    }
  }

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
        <div className="tabs">
          <button className={`tab-btn${tab === 'convert'  ? ' active' : ''}`} onClick={() => setTab('convert')}>Convert</button>
          <button className={`tab-btn${tab === 'advanced' ? ' active' : ''}`} onClick={() => setTab('advanced')}>⚙ Advanced</button>
        </div>

        {tab === 'convert' && (
          <>
            <div
              className={`dropzone${dragOver ? ' drag-over' : ''}`}
              onClick={handleBrowse}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="dropzone-icon"><IconImage size={36} /></div>
              <div className="dropzone-title">Drop images here or click to browse</div>
              <div className="dropzone-sub">JPG, PNG, WebP, AVIF, GIF, BMP, TIFF — multiple files OK</div>
            </div>

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
              <button className="btn btn-secondary" onClick={pickOutputDir}>📁 Output Folder</button>
              <button className="btn btn-primary" onClick={convert} disabled={loading || !files.length}>
                {loading ? <span className="spinner">⟳</span> : null}
                {loading ? 'Converting…' : `Convert ${files.length > 1 ? `${files.length} files` : 'Image'}`}
              </button>
            </div>
          </>
        )}

        {tab === 'advanced' && (
          <div className="advanced-grid">
            <div className="form-group">
              <label className="form-label">Max Width (px)</label>
              <input
                className="form-input"
                type="number" min={1} placeholder="No limit"
                value={width} onChange={e => setWidth(e.target.value)}
                style={{ minWidth: 130 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Max Height (px)</label>
              <input
                className="form-input"
                type="number" min={1} placeholder="No limit"
                value={height} onChange={e => setHeight(e.target.value)}
                style={{ minWidth: 130 }}
              />
            </div>
            <div className="toggle-row" style={{ gridColumn: '1 / -1' }}>
              <div className="toggle-info">
                <div className="toggle-title">Preserve Metadata</div>
                <div className="toggle-desc">Keep EXIF, ICC colour profile, GPS data (stripped by default)</div>
              </div>
              <label className="pixel-toggle">
                <input type="checkbox" checked={keepMetadata} onChange={e => setKeepMetadata(e.target.checked)} />
                <span className="pixel-toggle-track" />
              </label>
            </div>
            <div className="adv-note">
              Resize uses "fit inside" — aspect ratio is always preserved.<br/>
              Set permanent defaults in ⚙ Settings.
            </div>
          </div>
        )}

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
              ? `✓ All ${results.length} images converted`
              : `⚠ ${results.filter(r => !r.success).length} file(s) failed`}
          </div>
        )}
      </div>
    </div>
  )
}
