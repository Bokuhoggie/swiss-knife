import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { IconImage } from '../components/Icons.jsx'
import { getDropPaths } from '../dropHelpers.js'

const FORMATS = ['jpg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff']
const api = window.swissKnife

export default function ImageConverter() {
  const { state } = useLocation()
  const [tab, setTab] = useState('convert')

  const [files, setFiles]               = useState([]) // Array of { path, selected }
  const [outputFormat, setOutputFormat] = useState('png')
  const [quality, setQuality]           = useState(85)
  const [outputDir, setOutputDir]       = useState('')
  const [results, setResults]           = useState([])
  const [loading, setLoading]           = useState(false)
  const [dragOver, setDragOver]         = useState(false)
  const [customName, setCustomName]     = useState('')
  useEffect(() => { window.dispatchEvent(new CustomEvent('blade-wave', { detail: loading })) }, [loading])
  const [isFlashing, setIsFlashing]     = useState(false)

  // ── Remove BG tab state ──
  const [bgFile, setBgFile]           = useState('')
  const [bgResult, setBgResult]       = useState('')
  const [bgStatus, setBgStatus]       = useState('idle')
  const [bgDragOver, setBgDragOver]   = useState(false)
  const [bgTolerance, setBgTolerance] = useState(30)
  const [bgOutputName, setBgOutputName] = useState('')

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
    const unique = paths.filter(p => p && !files.some(f => f.path === p))
    const objects = unique.map(p => ({ path: p, selected: true }))
    setFiles(prev => { if (prev.length + unique.length > 1) setCustomName(''); return [...prev, ...objects] })
    setResults([])
  }

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false)
    const paths = getDropPaths(e)
    if (paths.length) {
      addFiles(paths)
      setIsFlashing(true)
      setTimeout(() => setIsFlashing(false), 500)
      window.dispatchEvent(new CustomEvent('blade-flick', { detail: '/image' }))
    }
  }

  const handleBrowse = async () => {
    const selected = await api.image.selectFiles()
    if (selected.length) addFiles(selected)
  }

  const pickOutputDir = async () => {
    const dir = await api.selectOutputDir()
    if (dir) setOutputDir(dir)
  }

  // ── Remove BG handlers ──
  const handleBgBrowse = async () => {
    const selected = await api.image.selectFiles()
    if (selected.length) { setBgFile(selected[0]); setBgResult(''); setBgStatus('idle') }
  }
  const handleBgDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setBgDragOver(false)
    const paths = getDropPaths(e)
    if (paths.length) { setBgFile(paths[0]); setBgResult(''); setBgStatus('idle') }
  }
  const removeBg = async () => {
    if (!bgFile) return
    if (!outputDir) { alert('Please select an output folder first.'); return }
    setLoading(true); setBgStatus('Processing…'); setBgResult('')
    try {
      const res = await api.image.removeBg({ filePath: bgFile, outputDir, outputName: bgOutputName.trim() || undefined, tolerance: bgTolerance })
      if (res.success) { setBgResult(res.outputPath); setBgStatus('done') }
      else setBgStatus('Error: ' + res.error)
    } catch (err) {
      setBgStatus('Error: ' + (err?.message || 'Failed'))
    } finally { setLoading(false) }
  }

  const convert = async () => {
    const selectedFiles = files.filter(f => f.selected).map(f => f.path)
    if (!selectedFiles.length) return
    if (!outputDir) { alert('Please select an output folder first.'); return }
    setLoading(true); setResults([])
    try {
      const res = await api.image.convert({
        filePaths: selectedFiles, outputFormat, outputDir, quality,
        width:  width  ? parseInt(width)  : undefined,
        height: height ? parseInt(height) : undefined,
        keepMetadata,
        outputName: (selectedFiles.length === 1 && customName.trim()) ? customName.trim() : undefined,
      })
      setResults(res)
    } catch (err) {
      setResults(selectedFiles.map(f => ({ inputPath: f, success: false, error: err?.message || 'Conversion failed' })))
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
          <button className={`tab-btn${tab === 'convert'   ? ' active' : ''}`} onClick={() => setTab('convert')}>Convert</button>
          <button className={`tab-btn${tab === 'removebg'  ? ' active' : ''}`} onClick={() => setTab('removebg')}>✂ Remove BG</button>
          <button className={`tab-btn${tab === 'advanced'  ? ' active' : ''}`} onClick={() => setTab('advanced')}>⚙ Advanced</button>
        </div>

        {tab === 'convert' && (
          <>
            <div
              className={`dropzone${dragOver ? ' drag-over' : ''}${isFlashing ? ' flash-active' : ''}`}
              onClick={handleBrowse}
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={e => { if (e.currentTarget === e.target) setDragOver(false) }}
              onDrop={handleDrop}
            >
              <div className="dropzone-icon"><IconImage size={36} /></div>
              <div className="dropzone-title">Drop images here or click to browse</div>
              <div className="dropzone-sub">JPG, PNG, WebP, AVIF, GIF, BMP, TIFF — multiple files OK</div>
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="form-label">Files ({files.filter(f => f.selected).length}/{files.length} selected)</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const allSelected = files.every(f => f.selected)
                    setFiles(files.map(f => ({ ...f, selected: !allSelected })))
                  }}
                >
                  {files.every(f => f.selected) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
            )}

            {files.length > 0 && (
              <div className="file-list" style={{ marginTop: 4 }}>
                {files.map((fileObj, i) => {
                  const result = results.find(r => r.inputPath === fileObj.path)
                  return (
                    <div key={i} className="file-item" style={{ opacity: fileObj.selected ? 1 : 0.5 }}>
                      <input
                        type="checkbox"
                        checked={fileObj.selected}
                        onChange={(e) => {
                          const next = [...files]
                          next[i].selected = e.target.checked
                          setFiles(next)
                        }}
                        style={{ accentColor: 'var(--accent)', marginRight: 4, cursor: 'pointer' }}
                        title="Toggle conversion for this file"
                      />
                      <span className="file-item-icon" style={{ marginLeft: 4 }}><IconImage size={16} /></span>
                      <span className="file-item-name" title={fileObj.path}>{basename(fileObj.path)}</span>
                      {result && (
                        <span 
                          className={`file-item-status ${result.success ? 'success' : 'error'}`}
                          title={result.error || ''}
                        >
                          {result.success ? '✓ Done' : '✗ Error'}
                        </span>
                      )}
                      <button className="file-remove-btn" onClick={() => setFiles(files.filter((_, j) => j !== i))}>✕</button>
                    </div>
                  )
                })}
              </div>
            )}

            {files.filter(f => f.selected).length === 1 && (
              <div className="form-group" style={{ marginTop: 8, marginBottom: 0 }}>
                <label className="form-label">Output Filename <span style={{ opacity: 0.5, fontWeight: 400 }}>(optional)</span></label>
                <input
                  className="form-input"
                  type="text"
                  placeholder={`${basename(files.find(f => f.selected)?.path ?? '').replace(/\.[^.]+$/, '')} (keep original name)`}
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                  disabled={loading}
                />
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
              <button 
                className="btn btn-primary" 
                onClick={convert} 
                disabled={loading || !files.some(f => f.selected)}
              >
                {loading ? <span className="spinner">⟳</span> : null}
                {loading 
                  ? 'Converting…' 
                  : `Convert ${files.filter(f => f.selected).length > 1 ? `${files.filter(f => f.selected).length} files` : 'Image'}`
                }
              </button>
            </div>
          </>
        )}

        {tab === 'removebg' && (
          <>
            {/* Drop zone */}
            <div
              className={`dropzone${bgDragOver ? ' drag-over' : ''}`}
              onClick={() => !bgFile && handleBgBrowse()}
              onDragOver={e => { e.preventDefault(); setBgDragOver(true) }}
              onDragLeave={e => { if (e.currentTarget === e.target) setBgDragOver(false) }}
              onDrop={handleBgDrop}
              style={{ cursor: bgFile ? 'default' : 'pointer' }}
            >
              {bgFile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <IconImage size={20} />
                  <span style={{ color: 'var(--accent)', fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem' }}>{basename(bgFile)}</span>
                  <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setBgFile(''); setBgResult(''); setBgStatus('idle') }}>✕</button>
                </div>
              ) : (
                <>
                  <div className="dropzone-icon">✂</div>
                  <div className="dropzone-title">Drop an image here or click to browse</div>
                  <div className="dropzone-sub">Detects & removes the background — saves as transparent PNG</div>
                </>
              )}
            </div>

            {/* Tolerance */}
            <div className="form-group" style={{ marginTop: 12 }}>
              <label className="form-label">
                Tolerance: {bgTolerance}&nbsp;
                <span style={{ opacity: 0.45, fontWeight: 400, fontSize: '0.8em' }}>lower = precise edges · higher = aggressive removal</span>
              </label>
              <div className="range-wrap">
                <input type="range" min={5} max={75} value={bgTolerance} onChange={e => setBgTolerance(+e.target.value)} />
              </div>
            </div>

            {/* Controls row */}
            <div className="controls-row">
              <button className="btn btn-secondary" onClick={pickOutputDir}>📁 Output Folder</button>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <input className="form-input" placeholder="Output filename (optional, default: original_nobg.png)" value={bgOutputName} onChange={e => setBgOutputName(e.target.value)} disabled={loading} />
              </div>
              <button className="btn btn-primary" onClick={removeBg} disabled={!bgFile || loading}>
                {loading ? <span className="spinner">⟳</span> : '✂'}
                {loading ? ' Removing…' : ' Remove Background'}
              </button>
            </div>

            {/* Status banner */}
            {bgStatus !== 'idle' && (
              <div className={`result-banner ${bgStatus === 'done' ? 'success' : bgStatus.startsWith('Error') ? 'error' : ''}`}>
                {bgStatus === 'done' ? '✓ Background removed — transparent PNG saved' : bgStatus}
              </div>
            )}

            {/* Before / After preview */}
            {bgResult && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <div className="form-label" style={{ marginBottom: 6 }}>Before</div>
                  <img
                    src={'file://' + bgFile.replace(/\\/g, '/')}
                    style={{ width: '100%', maxHeight: 200, objectFit: 'contain', border: '1px solid var(--border)', background: 'var(--bg-elevated)' }}
                    alt="original"
                  />
                </div>
                <div>
                  <div className="form-label" style={{ marginBottom: 6 }}>After</div>
                  <div style={{ background: 'repeating-conic-gradient(#666 0% 25%, #444 0% 50%) 0 0 / 14px 14px', border: '1px solid var(--border)' }}>
                    <img
                      src={'file://' + bgResult.replace(/\\/g, '/') + '?t=' + Date.now()}
                      style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block' }}
                      alt="result"
                    />
                  </div>
                </div>
              </div>
            )}
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

        {tab === 'convert' && outputDir && (
          <div className="output-path-row">
            <span className="output-folder-icon">📂</span>
            <span className="output-path-text">{outputDir}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => api.shell.openPath(outputDir)}>Open ↗</button>
          </div>
        )}

        {tab === 'convert' && results.length > 0 && (
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
