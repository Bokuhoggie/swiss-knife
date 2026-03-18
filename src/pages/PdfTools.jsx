import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { IconPDF } from '../components/Icons.jsx'

const api = window.swissKnife

const COMPRESS_LEVELS = [
  { value: 'low',    label: 'Low — Faster, larger file' },
  { value: 'medium', label: 'Medium — Balanced (recommended)' },
  { value: 'high',   label: 'High — Slower, smaller file' },
]

function MergeTab() {
  const [files, setFiles] = useState([])
  const [outputDir, setOutputDir] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    api.settings?.read().then(s => {
      if (!s) return
      if (s.general?.defaultOutputDir) setOutputDir(s.general.defaultOutputDir)
    }).catch(() => {})
  }, [])

  const basename = (p) => p?.split('/').pop().split('\\').pop()

  const addFiles = (paths) => {
    const pdfs = paths.filter(p => p.toLowerCase().endsWith('.pdf'))
    setFiles(prev => [...prev, ...pdfs.filter(f => !prev.includes(f))])
    setResult(null)
  }

  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(false)
    const paths = Array.from(e.dataTransfer.files).map(f => f.path).filter(Boolean)
    if (paths.length) addFiles(paths)
  }

  const pickFiles = async () => {
    const selected = await api.pdf.selectFiles()
    if (selected.length) addFiles(selected)
  }

  const pickOutputDir = async () => {
    const dir = await api.selectOutputDir()
    if (dir) setOutputDir(dir)
  }

  const merge = async () => {
    if (files.length < 2) { alert('Select at least 2 PDFs to merge.'); return }
    if (!outputDir) { alert('Select an output folder.'); return }
    setLoading(true)
    try {
      const res = await api.pdf.merge({ filePaths: files, outputDir })
      setResult(res)
    } catch (err) {
      setResult({ success: false, error: err?.message || 'Merge failed' })
    }
    setLoading(false)
  }

  return (
    <div>
      <div
        className={`dropzone${dragOver ? ' drag-over' : ''}`}
        style={{ marginBottom: 16, padding: '24px' }}
        onClick={pickFiles}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="dropzone-icon"><IconPDF size={28} /></div>
        <div className="dropzone-title" style={{ fontSize: 7 }}>Drop PDFs here or click to browse</div>
        <div className="dropzone-sub">Multiple files OK — merge order matches list order</div>
      </div>

      {files.length > 0 && (
        <div className="file-list">
          {files.map((f, i) => (
            <div key={i} className="file-item">
              <span className="file-item-icon">📄</span>
              <span className="file-item-name">{basename(f)}</span>
              <button
                className="file-remove-btn"
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                disabled={loading}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="controls-row" style={{ marginTop: 16 }}>
        <button className="btn btn-secondary" onClick={pickOutputDir} disabled={loading}>📁 Output Folder</button>
        <button className="btn btn-primary" onClick={merge} disabled={loading || files.length < 2}>
          {loading ? <span className="spinner">⟳</span> : '🔗'} Merge PDFs
        </button>
      </div>

      {outputDir && (
        <div className="output-path-row">
          <span className="output-folder-icon">📂</span>
          <span className="output-path-text">{outputDir}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => api.shell.openPath(outputDir)}>Open ↗</button>
        </div>
      )}
      {result && (
        <div className={`result-banner ${result.success ? 'success' : 'error'}`}>
          {result.success ? `✓ Merged PDF saved: ${basename(result.outputPath)}` : `✗ ${result.error}`}
        </div>
      )}
    </div>
  )
}

function SplitTab() {
  const [file, setFile] = useState(null)
  const [outputDir, setOutputDir] = useState('')
  const [rangeStr, setRangeStr] = useState('1-3')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.settings?.read().then(s => {
      if (!s) return
      if (s.general?.defaultOutputDir) setOutputDir(s.general.defaultOutputDir)
    }).catch(() => {})
  }, [])

  const basename = (p) => p?.split('/').pop().split('\\').pop()

  const pickFile = async () => {
    const f = await api.pdf.selectFile()
    if (f) setFile(f)
  }

  const pickOutputDir = async () => {
    const dir = await api.selectOutputDir()
    if (dir) setOutputDir(dir)
  }

  const parseRanges = (str) => {
    return str.split(',').map(r => {
      const [s, e] = r.trim().split('-').map(Number)
      return { start: s, end: e || s }
    }).filter(r => !isNaN(r.start))
  }

  const split = async () => {
    if (!file) { alert('Select a PDF.'); return }
    if (!outputDir) { alert('Select an output folder.'); return }
    setLoading(true)
    try {
      const ranges = parseRanges(rangeStr)
      const res = await api.pdf.split({ filePath: file, outputDir, ranges })
      setResult(Array.isArray(res) ? res : [res])
    } catch (err) {
      setResult([{ success: false, error: err?.message || 'Split failed' }])
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="controls-row" style={{ marginBottom: 16, alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={pickFile} disabled={loading}>📄 Select PDF</button>
        {file && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{basename(file)}</span>}
      </div>
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Page Ranges (e.g. 1-3, 5-8, 10)</label>
        <input className="form-input" value={rangeStr} onChange={e => setRangeStr(e.target.value)} placeholder="1-3, 5-8" />
      </div>
      <div className="controls-row">
        <button className="btn btn-secondary" onClick={pickOutputDir} disabled={loading}>📁 Output Folder</button>
        <button className="btn btn-primary" onClick={split} disabled={loading || !file}>
          {loading ? <span className="spinner">⟳</span> : '✂'} Split PDF
        </button>
      </div>
      {outputDir && (
        <div className="output-path-row">
          <span className="output-folder-icon">📂</span>
          <span className="output-path-text">{outputDir}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => api.shell.openPath(outputDir)}>Open ↗</button>
        </div>
      )}
      {result && result.length > 0 && (
        <div className={`result-banner ${result.every(r => r.success) ? 'success' : 'error'}`}>
          {result.every(r => r.success) ? `✓ Split into ${result.length} file(s)` : `✗ ${result.find(r => !r.success)?.error}`}
        </div>
      )}
    </div>
  )
}

function CompressTab() {
  const [file, setFile] = useState(null)
  const [outputDir, setOutputDir] = useState('')
  const [compressionLevel, setCompressionLevel] = useState('medium')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.settings?.read().then(s => {
      if (!s) return
      if (s.general?.defaultOutputDir)      setOutputDir(s.general.defaultOutputDir)
      if (s.pdf?.compressionLevel)          setCompressionLevel(s.pdf.compressionLevel)
    }).catch(() => {})
  }, [])

  const basename = (p) => p?.split('/').pop().split('\\').pop()

  const pickFile = async () => { const f = await api.pdf.selectFile(); if (f) { setFile(f); setResult(null) } }
  const pickOutputDir = async () => { const dir = await api.selectOutputDir(); if (dir) setOutputDir(dir) }

  const compress = async () => {
    if (!file || !outputDir) { alert('Select a PDF and output folder.'); return }
    setLoading(true)
    try {
      const res = await api.pdf.compress({ filePath: file, outputDir, compressionLevel })
      setResult(res)
    } catch (err) {
      setResult({ success: false, error: err?.message || 'Compression failed' })
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="controls-row" style={{ marginBottom: 16 }}>
        <button className="btn btn-secondary" onClick={pickFile} disabled={loading}>📄 Select PDF</button>
        {file && <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{basename(file)}</span>}
      </div>
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Compression Level</label>
        <select className="form-select" value={compressionLevel} onChange={e => setCompressionLevel(e.target.value)} disabled={loading}>
          {COMPRESS_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>
      </div>
      <div className="controls-row">
        <button className="btn btn-secondary" onClick={pickOutputDir} disabled={loading}>📁 Output Folder</button>
        <button className="btn btn-primary" onClick={compress} disabled={loading || !file}>
          {loading ? <span className="spinner">⟳</span> : '🗜'} Compress PDF
        </button>
      </div>
      {outputDir && (
        <div className="output-path-row">
          <span className="output-folder-icon">📂</span>
          <span className="output-path-text">{outputDir}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => api.shell.openPath(outputDir)}>Open ↗</button>
        </div>
      )}
      {result && (
        <div className={`result-banner ${result.success ? 'success' : 'error'}`}>
          {result.success
            ? `✓ Compressed: ${basename(result.outputPath)}${result.savedBytes ? ` (saved ${(result.savedBytes / 1024).toFixed(0)} KB)` : ''}`
            : `✗ ${result.error}`}
        </div>
      )}
    </div>
  )
}

const TABS = ['Merge', 'Split', 'Compress']

export default function PdfTools() {
  const [activeTab, setActiveTab] = useState('Merge')
  const { state } = useLocation()
  const [inspectorFile, setInspectorFile] = useState(null)

  useEffect(() => {
    if (state?.file) {
      setActiveTab('Compress')
      setInspectorFile(state.file)
    }
  }, [state?.file])
  return (
    <div className="page-anim" style={{ '--accent': '#FFD60A' }}>
      <div className="page-header">
        <h1 className="page-title"><IconPDF size={20} /> PDF Tools</h1>
        <p className="page-subtitle">Merge, split, and compress PDF documents locally</p>
      </div>
      <div className="card">
        <div className="tabs">
          {TABS.map(t => (
            <button key={t} className={`tab-btn${activeTab === t ? ' active' : ''}`} onClick={() => setActiveTab(t)}>{t}</button>
          ))}
        </div>
        {activeTab === 'Merge'    && <MergeTab />}
        {activeTab === 'Split'    && <SplitTab />}
        {activeTab === 'Compress' && <CompressTab preloadFile={inspectorFile} />}
      </div>
    </div>
  )
}
