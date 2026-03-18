import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { IconAudio } from '../components/Icons.jsx'
import { getDropPaths } from '../dropHelpers.js'

const FORMATS      = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus']
const BITRATES     = ['64k', '128k', '192k', '256k', '320k']
const SAMPLE_RATES = ['22050', '44100', '48000', '96000']
const CHANNELS     = [{ value: '', label: 'Auto' }, { value: 'stereo', label: 'Stereo' }, { value: 'mono', label: 'Mono' }]
const api = window.swissKnife

export default function AudioConverter() {
  const { state } = useLocation()
  const [tab, setTab] = useState('convert')

  const [files, setFiles]               = useState([]) // Array of { path, selected }
  const [outputFormat, setOutputFormat] = useState('mp3')
  const [bitrate, setBitrate]           = useState('192k')
  const [sampleRate, setSampleRate]     = useState('44100')
  const [outputDir, setOutputDir]       = useState('')
  const [results, setResults]           = useState([])
  const [loading, setLoading]           = useState(false)
  const [progress, setProgress]         = useState(null)
  useEffect(() => { window.dispatchEvent(new CustomEvent('blade-wave', { detail: loading })) }, [loading])
  const [dragOver, setDragOver]         = useState(false)
  const [isFlashing, setIsFlashing]     = useState(false)
  const [currentIdx, setCurrentIdx]     = useState(-1)
  const [customName, setCustomName]     = useState('')

  // Advanced
  const [channels, setChannels]   = useState('')
  const [normalize, setNormalize] = useState(false)
  const [fadeIn, setFadeIn]       = useState(0)

  useEffect(() => {
    api.settings?.read().then(s => {
      if (!s) return
      if (s.general?.defaultOutputDir) setOutputDir(s.general.defaultOutputDir)
      if (s.audio?.format)              setOutputFormat(s.audio.format)
      if (s.audio?.bitrate)             setBitrate(s.audio.bitrate)
      if (s.audio?.sampleRate)          setSampleRate(s.audio.sampleRate)
      if (s.audio?.channels !== undefined) setChannels(s.audio.channels)
      if (s.audio?.normalize !== undefined) setNormalize(s.audio.normalize)
      if (s.audio?.fadeIn   !== undefined) setFadeIn(s.audio.fadeIn)
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
      window.dispatchEvent(new CustomEvent('blade-flick', { detail: '/audio' }))
    }
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
    const selectedFiles = files.filter(f => f.selected).map(f => f.path)
    if (!selectedFiles.length) return
    if (!outputDir) { alert('Please select an output folder first.'); return }
    setLoading(true); setResults([])
    api.audio.onProgress(data => setProgress(data))
    const allResults = []
    for (let i = 0; i < files.length; i++) {
      if (!files[i].selected) continue;
      setCurrentIdx(i); setProgress(null)
      try {
        const res = await api.audio.convert({
          filePath: files[i].path, outputFormat, outputDir, bitrate, sampleRate,
          channels: channels || undefined,
          normalize,
          fadeIn: fadeIn > 0 ? fadeIn : undefined,
          outputName: (files.filter(f => f.selected).length === 1 && customName.trim()) ? customName.trim() : undefined,
        })
        allResults.push({ ...res, inputPath: files[i].path })
      } catch (err) {
        allResults.push({ success: false, error: err?.message || 'Conversion failed', inputPath: files[i].path })
      }
    }
    api.audio.offProgress()
    setResults(allResults); setProgress(null); setLoading(false); setCurrentIdx(-1)
  }

  return (
    <div className="page-anim" style={{ '--accent': '#FF3CAC' }}>
      <div className="page-header">
        <h1 className="page-title"><IconAudio size={20} /> Audio Converter</h1>
        <p className="page-subtitle">Convert audio between MP3, WAV, FLAC, AAC, OGG, M4A, and Opus</p>
      </div>

      <div className="card">
        <div className="tabs">
          <button className={`tab-btn${tab === 'convert'  ? ' active' : ''}`} onClick={() => setTab('convert')}>Convert</button>
          <button className={`tab-btn${tab === 'advanced' ? ' active' : ''}`} onClick={() => setTab('advanced')}>⚙ Advanced</button>
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
              <div className="dropzone-icon"><IconAudio size={36} /></div>
              <div className="dropzone-title">Drop audio files here or click to browse</div>
              <div className="dropzone-sub">MP3, WAV, FLAC, AAC, OGG, M4A, WMA, Opus — multiple files OK</div>
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
                  const isCurrent = loading && i === currentIdx
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
                      <span className="file-item-icon"><IconAudio size={16} /></span>
                      <span className="file-item-name" title={fileObj.path}>{basename(fileObj.path)}</span>
                      {isCurrent && progress && (
                        <span className="file-item-status pending">{Math.round(progress.percent || 0)}%</span>
                      )}
                      {result && (
                        <span 
                          className={`file-item-status ${result.success ? 'success' : 'error'}`}
                          title={result.error || ''}
                        >
                          {result.success ? '✓ Done' : '✗ Error'}
                        </span>
                      )}
                      {!loading && <button className="file-remove-btn" onClick={() => setFiles(files.filter((_, j) => j !== i))}>✕</button>}
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

            {loading && progress && currentIdx >= 0 && files[currentIdx] && (
              <div className="progress-wrap">
                <div className="progress-label">
                  <span>Converting {basename(files[currentIdx].path)}…</span>
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
              <button 
                className="btn btn-primary" 
                onClick={convert} 
                disabled={loading || !files.some(f => f.selected)}
              >
                {loading ? <span className="spinner">⟳</span> : null}
                {loading 
                  ? 'Converting…' 
                  : `Convert ${files.filter(f => f.selected).length > 1 ? `${files.filter(f => f.selected).length} files` : 'Audio'}`
                }
              </button>
            </div>
          </>
        )}

        {tab === 'advanced' && (
          <div className="advanced-grid">
            <div className="form-group">
              <label className="form-label">Channels</label>
              <select className="form-select" value={channels} onChange={e => setChannels(e.target.value)}>
                {CHANNELS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fade In (seconds)</label>
              <input
                className="form-input"
                type="number" min={0} max={10} step={0.5}
                value={fadeIn}
                onChange={e => setFadeIn(+e.target.value)}
                style={{ minWidth: 110 }}
              />
            </div>
            <div className="toggle-row" style={{ gridColumn: '1 / -1' }}>
              <div className="toggle-info">
                <div className="toggle-title">Normalize Audio</div>
                <div className="toggle-desc">EBU R128 loudness normalization — makes volume consistent across files</div>
              </div>
              <label className="pixel-toggle">
                <input type="checkbox" checked={normalize} onChange={e => setNormalize(e.target.checked)} />
                <span className="pixel-toggle-track" />
              </label>
            </div>
            <div className="adv-note">
              Advanced settings apply to the current session only.<br/>
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
              ? `✓ All ${results.length} files converted`
              : `⚠ ${results.filter(r => !r.success).length} file(s) failed`}
          </div>
        )}
      </div>
    </div>
  )
}
