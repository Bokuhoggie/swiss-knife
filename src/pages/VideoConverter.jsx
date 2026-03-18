import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { IconVideo } from '../components/Icons.jsx'

const FORMATS    = ['mp4', 'mkv', 'avi', 'mov', 'webm']
const RESOLUTIONS = ['', '1920x1080', '1280x720', '854x480', '640x360']
const CODECS     = ['', 'libx264', 'libx265', 'vp9', 'libvpx']
const ACODECS    = ['aac', 'mp3', 'copy', 'libopus']
const ABITRATES  = ['128k', '192k', '256k', '320k']
const FPS_OPTS   = ['', '24', '30', '60']
const HW_OPTS    = [
  { value: '',        label: 'None (CPU)' },
  { value: 'cuda',    label: 'NVENC (NVIDIA)' },
  { value: 'dxva2',   label: 'DXVA2 (Windows)' },
  { value: 'qsv',     label: 'QuickSync (Intel)' },
  { value: 'd3d11va', label: 'D3D11VA (Windows)' },
]
const api = window.swissKnife

export default function VideoConverter() {
  const { state } = useLocation()
  const [tab, setTab] = useState('convert')

  const [file, setFile]               = useState(null)
  const [outputFormat, setOutputFormat] = useState('mp4')
  const [resolution, setResolution]   = useState('')
  const [codec, setCodec]             = useState('')
  const [crf, setCrf]                 = useState(23)
  const [outputDir, setOutputDir]     = useState('')
  const [result, setResult]           = useState(null)
  const [loading, setLoading]         = useState(false)
  const [progress, setProgress]       = useState(null)
  const [dragOver, setDragOver]       = useState(false)

  const [audioCodec, setAudioCodec]     = useState('aac')
  const [audioBitrate, setAudioBitrate] = useState('192k')
  const [fps, setFps]                   = useState('')
  const [hwAccel, setHwAccel]           = useState('')

  useEffect(() => {
    api.settings?.read().then(s => {
      if (!s) return
      if (s.general?.defaultOutputDir) setOutputDir(s.general.defaultOutputDir)
      if (s.video?.format)       setOutputFormat(s.video.format)
      if (s.video?.codec !== undefined) setCodec(s.video.codec)
      if (s.video?.crf   !== undefined) setCrf(s.video.crf)
      if (s.video?.audioCodec)   setAudioCodec(s.video.audioCodec)
      if (s.video?.audioBitrate) setAudioBitrate(s.video.audioBitrate)
      if (s.video?.fps !== undefined) setFps(s.video.fps)
      if (s.video?.hwAccel !== undefined) setHwAccel(s.video.hwAccel)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (state?.file) { setFile(state.file); setResult(null) }
  }, [state?.file])


  const basename = (p) => p ? p.split('/').pop().split('\\').pop() : ''

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.path) { setFile(f.path); setResult(null) }
  }

  const handleBrowse = async () => {
    const selected = await api.video.selectFile()
    if (selected) { setFile(selected); setResult(null) }
  }

  const pickOutputDir = async () => {
    const dir = await api.selectOutputDir()
    if (dir) setOutputDir(dir)
  }

  const convert = async () => {
    if (!file) return
    if (!outputDir) { alert('Please select an output folder first.'); return }
    setLoading(true); setResult(null); setProgress(null)
    api.video.onProgress(data => setProgress(data))
    const res = await api.video.convert({
      filePath: file, outputFormat, outputDir,
      resolution: resolution || undefined,
      codec: codec || undefined, crf,
      audioCodec: audioCodec || undefined,
      audioBitrate: audioBitrate || undefined,
      fps: fps || undefined,
      hwAccel: hwAccel || undefined,
    })
    api.video.offProgress()
    setResult(res); setProgress(null); setLoading(false)
  }

  return (
    <div className="page-anim" style={{ '--accent': '#C77DFF' }}>
      <div className="page-header">
        <h1 className="page-title"><IconVideo size={20} /> Video Converter</h1>
        <p className="page-subtitle">Convert videos between MP4, MKV, AVI, MOV, and WebM</p>
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
              <div className="dropzone-icon"><IconVideo size={36} /></div>
              <div className="dropzone-title">{file ? basename(file) : 'Drop video here or click to browse'}</div>
              {file  && <div className="dropzone-sub" style={{ color: 'var(--accent)', marginTop: 4 }}>✓ File selected — click to change</div>}
              {!file && <div className="dropzone-sub">MP4, MKV, AVI, MOV, WebM, WMV and more</div>}
            </div>

            {loading && (
              <div className="progress-wrap">
                <div className="progress-label">
                  <span>{progress?.timemark ? `Timecode: ${progress.timemark}` : 'Starting…'}</span>
                  <span>{progress ? `${Math.round(progress.percent || 0)}%` : ''}</span>
                </div>
                <div className="progress-track">
                  <div className="progress-bar" style={{ width: `${progress?.percent || 0}%` }} />
                </div>
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
                <label className="form-label">Resolution</label>
                <select className="form-select" value={resolution} onChange={e => setResolution(e.target.value)}>
                  <option value="">Original</option>
                  {RESOLUTIONS.filter(Boolean).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Video Codec</label>
                <select className="form-select" value={codec} onChange={e => setCodec(e.target.value)}>
                  <option value="">Auto</option>
                  {CODECS.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Quality (CRF): {crf}</label>
                <div className="range-wrap">
                  <input type="range" min={0} max={51} value={crf} onChange={e => setCrf(+e.target.value)} />
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <button className="btn btn-secondary" onClick={pickOutputDir}>📁 Output Folder</button>
              <button className="btn btn-primary" onClick={convert} disabled={loading || !file}>
                {loading ? <span className="spinner">⟳</span> : null}
                {loading ? 'Converting…' : 'Convert Video'}
              </button>
            </div>
          </>
        )}

        {tab === 'advanced' && (
          <div className="advanced-grid">
            <div className="form-group">
              <label className="form-label">Audio Codec</label>
              <select className="form-select" value={audioCodec} onChange={e => setAudioCodec(e.target.value)}>
                {ACODECS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Audio Bitrate</label>
              <select className="form-select" value={audioBitrate} onChange={e => setAudioBitrate(e.target.value)}>
                {ABITRATES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Frame Rate</label>
              <select className="form-select" value={fps} onChange={e => setFps(e.target.value)}>
                <option value="">Original</option>
                {FPS_OPTS.filter(Boolean).map(f => <option key={f} value={f}>{f} fps</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">HW Acceleration</label>
              <select className="form-select" value={hwAccel} onChange={e => setHwAccel(e.target.value)}>
                {HW_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
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

        {result && (
          <div className={`result-banner ${result.success ? 'success' : 'error'}`}>
            {result.success ? `✓ Converted: ${basename(result.outputPath)}` : `✗ ${result.error}`}
          </div>
        )}
      </div>
    </div>
  )
}
