import { useState, useEffect, useRef, useCallback } from 'react'

const api = window.swissKnife

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * WaveformPlayer — reusable audio/video player with waveform visualisation.
 *
 * Props:
 *   filePath    – absolute path to the media file
 *   type        – 'audio' | 'video'  (default 'audio')
 *   accentColor – CSS colour value for the played portion of the waveform
 *   glowColor   – CSS colour value for the glow (defaults to accentColor)
 *   onClose     – callback when user clicks the close button
 *   label       – display name shown in the header
 *   autoPlay    – auto-play on mount (default false)
 *   showClip    – show clip/trim controls (default true)
 */
export default function WaveformPlayer({
  filePath,
  type = 'audio',
  accentColor = 'var(--accent)',
  glowColor,
  onClose,
  label = '',
  autoPlay = false,
  showClip = true,
}) {
  const [peaks, setPeaks]           = useState([])
  const [waveLoading, setWaveLoading] = useState(true)
  const [playing, setPlaying]       = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]     = useState(0)
  const [clipStart, setClipStart]   = useState(null)
  const [clipEnd, setClipEnd]       = useState(null)
  const [clipping, setClipping]     = useState(false)
  const [clipResult, setClipResult] = useState(null)

  const mediaRef    = useRef(null)
  const waveformRef = useRef(null)
  const animRef     = useRef(null)

  const glow = glowColor || accentColor

  // ── Load waveform peaks ───────────────────────────────────────────────────
  useEffect(() => {
    if (!filePath) return
    setWaveLoading(true)
    setPeaks([])
    setCurrentTime(0)
    setClipStart(null)
    setClipEnd(null)
    setClipResult(null)

    api.media.waveform(filePath).then((data) => {
      setPeaks(data || [])
      setWaveLoading(false)
    }).catch(() => setWaveLoading(false))
  }, [filePath])

  // ── RAF loop to sync time ────────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const el = mediaRef.current
      if (el) {
        setCurrentTime(el.currentTime)
        if (el.duration && !isNaN(el.duration)) setDuration(el.duration)
      }
      animRef.current = requestAnimationFrame(tick)
    }
    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [filePath])

  // ── Play / pause ─────────────────────────────────────────────────────────
  const togglePlay = useCallback(() => {
    const el = mediaRef.current
    if (!el) return
    if (el.paused) { el.play(); setPlaying(true) }
    else           { el.pause(); setPlaying(false) }
  }, [])

  const handleEnded = useCallback(() => setPlaying(false), [])

  // ── Click-to-seek on waveform ─────────────────────────────────────────────
  const seek = useCallback((e) => {
    const el   = mediaRef.current
    const rect = waveformRef.current?.getBoundingClientRect()
    if (!el || !rect || !duration) return
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    el.currentTime = pct * duration
  }, [duration])

  // ── Clip ──────────────────────────────────────────────────────────────────
  const handleClip = async () => {
    if (clipStart === null || clipEnd === null || clipStart >= clipEnd) return
    const outputDir = await api.selectOutputDir()
    if (!outputDir) return
    setClipping(true); setClipResult(null)
    try {
      const res = await api.media.clip({ filePath, startTime: clipStart, endTime: clipEnd, outputDir })
      setClipResult(res)
    } catch (err) {
      setClipResult({ success: false, error: err?.message || 'Clip failed' })
    }
    setClipping(false)
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const playPct     = duration > 0 ? currentTime / duration : 0
  const clipStartPct = clipStart !== null && duration > 0 ? clipStart / duration : null
  const clipEndPct   = clipEnd   !== null && duration > 0 ? clipEnd   / duration : null

  const mediaUrl = `sk-media://file?path=${encodeURIComponent(filePath)}`

  return (
    <div className="waveform-player">
      {/* ── Header ── */}
      <div className="media-preview-header">
        <span className="form-label">{label || (type === 'video' ? 'Video Preview' : 'Audio Preview')}</span>
        {onClose && <button className="btn btn-ghost btn-sm" onClick={onClose}>✕ Close</button>}
      </div>

      {/* ── Video element ── */}
      {type === 'video' && (
        <video
          ref={mediaRef}
          key={filePath}
          src={mediaUrl}
          className="media-preview-player"
          autoPlay={autoPlay}
          onEnded={handleEnded}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      )}

      {/* ── Waveform ── */}
      <div
        className="waveform-crown"
        style={{ '--wf-accent': accentColor, '--wf-glow': glow }}
      >
        <div className="waveform-container" ref={waveformRef} onClick={seek}>
          {waveLoading ? (
            <div className="waveform-loading">
              <span className="spinner" style={{ fontSize: 12 }}>⟳</span>
              <span>Analysing waveform…</span>
            </div>
          ) : (
            <div className="waveform-bars">
              {peaks.map((peak, i) => {
                const pct = i / peaks.length
                const played = pct <= playPct
                const inClip =
                  clipStartPct !== null &&
                  clipEndPct !== null &&
                  pct >= clipStartPct &&
                  pct <= clipEndPct
                return (
                  <div
                    key={i}
                    className="waveform-bar"
                    style={{
                      height: `${Math.max(6, peak * 100)}%`,
                      backgroundColor: inClip
                        ? 'var(--accent-3, #3b82f6)'
                        : played
                          ? 'var(--wf-accent)'
                          : 'var(--text-muted)',
                      opacity: played || inClip ? 1 : 0.3,
                    }}
                  />
                )
              })}
            </div>
          )}

          {/* Playhead */}
          {duration > 0 && (
            <div className="waveform-playhead" style={{ left: `${playPct * 100}%`, backgroundColor: 'var(--wf-accent)' }} />
          )}

          {/* Clip region overlay */}
          {clipStartPct !== null && clipEndPct !== null && (
            <div
              className="waveform-clip-region"
              style={{
                left: `${clipStartPct * 100}%`,
                width: `${(clipEndPct - clipStartPct) * 100}%`,
              }}
            />
          )}
        </div>
      </div>

      {/* ── Controls ── */}
      <div className="waveform-controls">
        <button className="btn btn-ghost btn-sm waveform-play-btn" onClick={togglePlay}>
          {playing ? '⏸' : '▶'}
        </button>
        <span className="waveform-time">{formatTime(currentTime)} / {formatTime(duration)}</span>

        <div style={{ flex: 1 }} />

        {/* Clip controls */}
        {showClip && duration > 0 && (
          <div className="waveform-clip-controls">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setClipStart(currentTime); setClipResult(null) }}
              title="Set clip start at current time"
            >
              [
            </button>
            {clipStart !== null && (
              <span className="waveform-clip-label">{formatTime(clipStart)}</span>
            )}
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setClipEnd(currentTime); setClipResult(null) }}
              title="Set clip end at current time"
            >
              ]
            </button>
            {clipEnd !== null && (
              <span className="waveform-clip-label">{formatTime(clipEnd)}</span>
            )}
            {clipStart !== null && clipEnd !== null && clipEnd > clipStart && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleClip}
                disabled={clipping}
                title="Trim to selection"
              >
                {clipping ? <span className="spinner">⟳</span> : '✂'}
                {' '}Clip ({formatTime(clipEnd - clipStart)})
              </button>
            )}
          </div>
        )}
      </div>

      {/* Clip result */}
      {clipResult && (
        <div className={`result-banner ${clipResult.success ? 'success' : 'error'}`} style={{ margin: '0 12px 8px' }}>
          {clipResult.success ? `✓ Saved clip → ${clipResult.outputPath}` : `✗ ${clipResult.error}`}
        </div>
      )}

      {/* Hidden audio element (only for audio type) */}
      {type === 'audio' && (
        <audio
          ref={mediaRef}
          key={filePath}
          src={mediaUrl}
          preload="auto"
          autoPlay={autoPlay}
          onEnded={handleEnded}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          style={{ display: 'none' }}
        />
      )}
    </div>
  )
}
