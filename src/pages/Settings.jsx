import { useState, useEffect } from 'react'
import { useSettings } from '../hooks/useSettings.js'
import { useTheme, THEMES, SIZES } from '../contexts/ThemeContext.jsx'

const api = window.htk

const IMG_FORMATS   = ['jpg', 'png', 'webp', 'avif', 'gif', 'bmp', 'tiff']
const VID_FORMATS   = ['mp4', 'mkv', 'avi', 'mov', 'webm']
const VID_CODECS    = ['', 'libx264', 'libx265', 'vp9', 'libvpx']
const VID_ACODECS   = ['aac', 'mp3', 'copy', 'libopus']
const VID_ABITRATES = ['128k', '192k', '256k', '320k']
const VID_FPS       = ['', '24', '30', '60']
const VID_HWACCELS  = ['', 'cuda', 'dxva2', 'qsv', 'd3d11va']
const AUD_FORMATS   = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'opus']
const AUD_BITRATES  = ['64k', '128k', '192k', '256k', '320k']
const AUD_RATES     = ['22050', '44100', '48000', '96000']
const AUD_CHANNELS  = ['', 'stereo', 'mono']
const DL_QUALITIES  = ['1080p', '720p', '480p', '360p']
const DL_AFORMATS   = ['mp3', 'aac', 'flac', 'opus', 'wav']
const PDF_COMPRESS  = ['low', 'medium', 'high']

function Toggle({ checked, onChange }) {
  return (
    <label className="pixel-toggle">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="pixel-toggle-track" />
    </label>
  )
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="toggle-row">
      <div className="toggle-info">
        <div className="toggle-title">{label}</div>
        {desc && <div className="toggle-desc">{desc}</div>}
      </div>
      <Toggle checked={!!checked} onChange={onChange} />
    </div>
  )
}

function AppCarousel({ label, keys, value, onChange, renderPreview }) {
  const idx = keys.indexOf(value)
  const prev = () => onChange(keys[(idx - 1 + keys.length) % keys.length])
  const next = () => onChange(keys[(idx + 1) % keys.length])
  const arrowStyle = {
    background: 'var(--bg-elevated)',
    border: '2px solid var(--border)',
    color: 'var(--accent)',
    cursor: 'pointer',
    width: 36,
    minWidth: 36,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    transition: 'all 0.15s ease',
    alignSelf: 'stretch',
  }
  return (
    <div className="form-group" style={{ marginBottom: 14 }}>
      <label className="form-label" style={{ marginBottom: 8 }}>{label}</label>
      <div style={{ display: 'flex', gap: 0, border: '2px solid var(--border)', background: 'var(--bg-elevated)' }}>
        <button style={arrowStyle} onClick={prev} onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-elevated)'}>◄</button>
        <div style={{ flex: 1, padding: '14px 20px', textAlign: 'center', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
          {renderPreview(value)}
        </div>
        <button style={arrowStyle} onClick={next} onMouseEnter={e => e.currentTarget.style.background='var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background='var(--bg-elevated)'}>►</button>
      </div>
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
        {keys.map((k, i) => (
          <div key={k} onClick={() => onChange(k)} style={{ width: 6, height: 6, background: i === idx ? 'var(--accent)' : 'var(--border)', cursor: 'pointer', transition: 'background 0.15s' }} />
        ))}
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="settings-section">
      <div className="settings-section-title">{title}</div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { settings, update } = useSettings()
  const { themeId, setThemeId, sizeId, setSizeId } = useTheme()
  const [secretCode, setSecretCode] = useState('')
  const [unlockedThemes, setUnlockedThemes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('htk-unlocks') || '[]') } catch(e) { return [] }
  })

  if (!settings) {
    return (
      <div className="page-anim">
        <div className="page-header">
          <h1 className="page-title">⚙ Settings</h1>
        </div>
        <div style={{ fontFamily: "'VT323', monospace", fontSize: '1.4rem', color: 'var(--text-muted)', padding: 32 }}>
          Loading settings…
        </div>
      </div>
    )
  }

  const pickDefaultOutput = async () => {
    const dir = await api.selectOutputDir()
    if (dir) update('general.defaultOutputDir', dir)
  }

  const unlockSecret = () => {
    const code = secretCode.trim().toLowerCase()
    const nospace = code.replace(/\s+/g, '')
    const map = {
      'go green': ['msu'],
      'go blue': ['uofm'],
      'go cats': ['nmu'],
      'warrior strong': ['waynestate'],
      'digital jazz': ['tron', 'clu'],
      'jared goff': ['lions'],
    }
    // Try exact match first, then spaceless match
    let ids = map[code]
    if (!ids) {
      for (const [phrase, val] of Object.entries(map)) {
        if (phrase.replace(/\s+/g, '') === nospace) { ids = val; break }
      }
    }
    if (!ids) { setSecretCode(''); return }
    const newIds = ids.filter(id => !unlockedThemes.includes(id))
    if (newIds.length) {
      const newU = [...unlockedThemes, ...newIds]
      setUnlockedThemes(newU)
      localStorage.setItem('htk-unlocks', JSON.stringify(newU))
    }
    setThemeId(ids[0])
    setSecretCode('')
  }

  return (
    <div className="page-anim">
      <div className="page-header">
        <h1 className="page-title">⚙ Settings</h1>
        <p className="page-subtitle">Defaults auto-save as you change them — no Save button needed</p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>

        {/* ─── APPEARANCE ─── */}
        <Section title="// APPEARANCE">
          <AppCarousel
            label="Color Theme"
            keys={Object.keys(THEMES).filter(k => !THEMES[k].hidden || unlockedThemes.includes(k) || themeId === k)}
            value={themeId}
            onChange={setThemeId}
            renderPreview={(key) => {
              const t = THEMES[key]
              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {t.preview.map((c, i) => (
                      <div key={i} style={{ width: 18, height: 18, background: c, border: '1px solid rgba(255,255,255,0.15)' }} />
                    ))}
                  </div>
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: 'var(--text-primary)' }}>{t.name}</span>
                </div>
              )
            }}
          />
          <AppCarousel
            label="Text Size"
            keys={Object.keys(SIZES)}
            value={sizeId}
            onChange={setSizeId}
            renderPreview={(key) => {
              const s = SIZES[key]
              return (
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 10 }}>
                  <span style={{ fontSize: `${s.scale * 1.1}rem`, color: 'var(--text-primary)' }}>Aa</span>
                  <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: 'var(--text-muted)' }}>{s.name}</span>
                </div>
              )
            }}
          />
        </Section>

        <div className="section-divider" />

        {/* ─── GENERAL ─── */}
        <Section title="// GENERAL">
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Default Output Folder</label>
            <div className="controls-row" style={{ marginTop: 6 }}>
              <input
                className="form-input"
                value={settings.general.defaultOutputDir}
                readOnly
                placeholder="None set — tools will prompt each time"
                style={{ flex: 1 }}
              />
              <button className="btn btn-secondary" onClick={pickDefaultOutput}>📁 Choose</button>
              {settings.general.defaultOutputDir && (
                <button className="btn btn-ghost btn-sm" onClick={() => update('general.defaultOutputDir', '')}>✕ Clear</button>
              )}
            </div>
          </div>
          <ToggleRow
            label="Open folder after conversion"
            desc="Auto-opens the output folder in Explorer when done"
            checked={settings.general.openAfterConvert}
            onChange={v => update('general.openAfterConvert', v)}
          />
        </Section>

        <div className="section-divider" />

        {/* ─── IMAGE ─── */}
        <Section title="// IMAGE DEFAULTS">
          <div className="advanced-grid" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Default Format</label>
              <select className="form-select" value={settings.image.format} onChange={e => update('image.format', e.target.value)}>
                {IMG_FORMATS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Quality: {settings.image.quality}</label>
              <div className="range-wrap">
                <input type="range" min={10} max={100} value={settings.image.quality} onChange={e => update('image.quality', +e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Max Width (px)</label>
              <input className="form-input" type="number" min={1} placeholder="No limit" value={settings.image.width} onChange={e => update('image.width', e.target.value)} style={{ minWidth: 110 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Max Height (px)</label>
              <input className="form-input" type="number" min={1} placeholder="No limit" value={settings.image.height} onChange={e => update('image.height', e.target.value)} style={{ minWidth: 110 }} />
            </div>
          </div>
          <ToggleRow
            label="Preserve metadata (EXIF/ICC)"
            desc="Keeps camera data, colour profiles, GPS info"
            checked={settings.image.keepMetadata}
            onChange={v => update('image.keepMetadata', v)}
          />
        </Section>

        <div className="section-divider" />

        {/* ─── VIDEO ─── */}
        <Section title="// VIDEO DEFAULTS">
          <div className="advanced-grid" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Default Format</label>
              <select className="form-select" value={settings.video.format} onChange={e => update('video.format', e.target.value)}>
                {VID_FORMATS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Video Codec</label>
              <select className="form-select" value={settings.video.codec} onChange={e => update('video.codec', e.target.value)}>
                <option value="">Auto</option>
                {VID_CODECS.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Audio Codec</label>
              <select className="form-select" value={settings.video.audioCodec} onChange={e => update('video.audioCodec', e.target.value)}>
                {VID_ACODECS.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Audio Bitrate</label>
              <select className="form-select" value={settings.video.audioBitrate} onChange={e => update('video.audioBitrate', e.target.value)}>
                {VID_ABITRATES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">CRF Quality: {settings.video.crf}</label>
              <div className="range-wrap">
                <input type="range" min={0} max={51} value={settings.video.crf} onChange={e => update('video.crf', +e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Frame Rate</label>
              <select className="form-select" value={settings.video.fps} onChange={e => update('video.fps', e.target.value)}>
                <option value="">Original</option>
                {VID_FPS.filter(Boolean).map(f => <option key={f} value={f}>{f} fps</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">HW Acceleration</label>
              <select className="form-select" value={settings.video.hwAccel} onChange={e => update('video.hwAccel', e.target.value)}>
                <option value="">None (CPU)</option>
                <option value="cuda">NVENC (NVIDIA)</option>
                <option value="dxva2">DXVA2 (Windows)</option>
                <option value="qsv">QuickSync (Intel)</option>
                <option value="d3d11va">D3D11VA (Windows)</option>
              </select>
            </div>
          </div>
        </Section>

        <div className="section-divider" />

        {/* ─── AUDIO ─── */}
        <Section title="// AUDIO DEFAULTS">
          <div className="advanced-grid" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Default Format</label>
              <select className="form-select" value={settings.audio.format} onChange={e => update('audio.format', e.target.value)}>
                {AUD_FORMATS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bitrate</label>
              <select className="form-select" value={settings.audio.bitrate} onChange={e => update('audio.bitrate', e.target.value)}>
                {AUD_BITRATES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Sample Rate</label>
              <select className="form-select" value={settings.audio.sampleRate} onChange={e => update('audio.sampleRate', e.target.value)}>
                {AUD_RATES.map(r => <option key={r} value={r}>{(+r / 1000).toFixed(1)} kHz</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Channels</label>
              <select className="form-select" value={settings.audio.channels} onChange={e => update('audio.channels', e.target.value)}>
                <option value="">Auto</option>
                {AUD_CHANNELS.filter(Boolean).map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Fade In (seconds)</label>
              <input className="form-input" type="number" min={0} max={10} step={0.5} value={settings.audio.fadeIn} onChange={e => update('audio.fadeIn', +e.target.value)} style={{ minWidth: 110 }} />
            </div>
          </div>
          <ToggleRow
            label="Normalize audio by default"
            desc="Applies EBU R128 loudness normalization (loudnorm)"
            checked={settings.audio.normalize}
            onChange={v => update('audio.normalize', v)}
          />
        </Section>

        <div className="section-divider" />

        {/* ─── DOWNLOADER ─── */}
        <Section title="// DOWNLOADER DEFAULTS">
          <div className="advanced-grid" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Default Format</label>
              <select className="form-select" value={settings.downloader.formatType} onChange={e => update('downloader.formatType', e.target.value)}>
                <option value="video">Video (MP4)</option>
                <option value="audio">Audio only</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Max Quality</label>
              <select className="form-select" value={settings.downloader.quality} onChange={e => update('downloader.quality', e.target.value)}>
                {DL_QUALITIES.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Audio-only Format</label>
              <select className="form-select" value={settings.downloader.audioFormat} onChange={e => update('downloader.audioFormat', e.target.value)}>
                {DL_AFORMATS.map(f => <option key={f} value={f}>{f.toUpperCase()}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Subtitle Language</label>
              <input className="form-input" value={settings.downloader.subsLang} onChange={e => update('downloader.subsLang', e.target.value)} placeholder="en" style={{ minWidth: 110 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Rate Limit</label>
              <input className="form-input" value={settings.downloader.rateLimit} onChange={e => update('downloader.rateLimit', e.target.value)} placeholder="e.g. 5M" style={{ minWidth: 110 }} />
            </div>
          </div>
          <ToggleRow
            label="Embed thumbnail"
            desc="Adds cover art to downloaded files"
            checked={settings.downloader.embedThumbnail}
            onChange={v => update('downloader.embedThumbnail', v)}
          />
          <ToggleRow
            label="Embed subtitles"
            desc="Burns subtitles into the output file when available"
            checked={settings.downloader.embedSubs}
            onChange={v => update('downloader.embedSubs', v)}
          />
        </Section>

        <div className="section-divider" />

        {/* ─── PDF ─── */}
        <Section title="// PDF DEFAULTS">
          <div className="form-group">
            <label className="form-label">Compression Level</label>
            <select className="form-select" value={settings.pdf.compressionLevel} onChange={e => update('pdf.compressionLevel', e.target.value)}>
              {PDF_COMPRESS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
            </select>
          </div>
        </Section>

        <div className="section-divider" />

        {/* ─── UPDATES ─── */}
        <UpdatesSection />

        <div className="section-divider" />

        {/* ─── SECRETS ─── */}
        <Section title="// SECRETS">
          <div className="form-group" style={{ marginBottom: 16 }}>
             <label className="form-label">Unlock Hidden Themes</label>
             <div className="controls-row" style={{ marginTop: 6 }}>
               <input 
                 className="form-input" 
                 placeholder="Enter secret passphrase..." 
                 value={secretCode} 
                 onChange={e => setSecretCode(e.target.value)} 
                 onKeyDown={e => { if (e.key === 'Enter') unlockSecret() }}
               />
               <button className="btn btn-secondary" onClick={unlockSecret}>Unlock</button>
             </div>
          </div>
        </Section>

      </div>
    </div>
  )
}

function UpdatesSection() {
  const [version, setVersion]   = useState('')
  const [status, setStatus]     = useState('idle') // idle | checking | up-to-date | available | downloading | downloaded | error
  const [newVersion, setNewVersion] = useState('')
  const [progress, setProgress] = useState(0)
  const [errMsg, setErrMsg]     = useState('')

  useEffect(() => {
    api.getVersion?.().then(v => setVersion(v)).catch(() => {})

    const u = api.updater
    if (!u) return
    u.onUpdateAvailable((info) => { setNewVersion(info.version); setStatus('available') })
    u.onNoUpdate(() => setStatus('up-to-date'))
    u.onProgress((p) => { setStatus('downloading'); setProgress(p.percent) })
    u.onDownloaded(() => setStatus('downloaded'))
    u.onError((msg) => { setErrMsg(msg || 'Unknown error'); setStatus('error') })
    return () => u.offAll?.()
  }, [])

  const check = async () => {
    setStatus('checking'); setErrMsg('')
    await api.updater?.check()
  }

  const statusColor = {
    'up-to-date': 'var(--success)',
    'available':  'var(--accent)',
    'downloaded': 'var(--accent)',
    'error':      'var(--error)',
  }[status] || 'var(--text-muted)'

  const statusText = {
    'idle':        'Not checked yet',
    'checking':    'Checking…',
    'up-to-date':  'You\'re up to date',
    'available':   `v${newVersion} available`,
    'downloading': `Downloading… ${Math.round(progress)}%`,
    'downloaded':  'Ready to install',
    'error':       errMsg || 'Update check failed',
  }[status]

  return (
    <Section title="// UPDATES">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="form-label" style={{ marginBottom: 2 }}>Current Version</div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.7rem', color: 'var(--accent)' }}>
            v{version || '…'}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div className="form-label" style={{ marginBottom: 2 }}>Status</div>
          <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.6rem', color: statusColor }}>
            {statusText}
          </div>
          {status === 'downloading' && (
            <div style={{ marginTop: 6, height: 4, background: 'var(--bg-hover)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--accent)', borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
          {status !== 'downloading' && status !== 'downloaded' && (
            <button className="btn btn-secondary" onClick={check} disabled={status === 'checking'}>
              {status === 'checking' ? '⟳ Checking…' : '⟳ Check for Updates'}
            </button>
          )}
          {status === 'available' && (
            <button className="btn btn-primary" onClick={() => api.updater?.download()}>⬇ Download</button>
          )}
          {status === 'downloaded' && (
            <button className="btn btn-primary" onClick={() => api.updater?.install()}>↺ Restart & Install</button>
          )}
        </div>
      </div>
    </Section>
  )
}
