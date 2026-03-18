import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { IconHash } from '../components/Icons.jsx'
import { getFirstDropPath } from '../dropHelpers.js'

const ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha512']
const api = window.swissKnife

export default function FileHasher() {
  const { state } = useLocation()
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(null)
  const [compareVal, setCompareVal] = useState('')
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (state?.file) { setFile(state.file); setResult(null) }
  }, [state?.file])

  const basename = (p) => p?.split('/').pop().split('\\').pop()

  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation()
    setDragOver(false)
    const filePath = getFirstDropPath(e)
    if (filePath) {
      setFile(filePath)
      setResult(null)
      setCopied(null)
      await compute(filePath)
    }
  }

  const handleBrowse = async () => {
    const selected = await api.hash.selectFile()
    if (selected) {
      setFile(selected)
      setResult(null)
      setCopied(null)
      await compute(selected)
    }
  }

  const compute = async (filePath) => {
    setLoading(true)
    try {
      const res = await api.hash.compute({ filePath, algorithms: ALGORITHMS })
      setResult(res)
    } catch (err) {
      setResult({ success: false, error: err?.message || 'Hash computation failed' })
    }
    setLoading(false)
  }

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const matchAlgo = compareVal.trim()
    ? Object.entries(result?.hashes || {}).find(([, v]) => v === compareVal.trim().toLowerCase())?.[0]
    : null

  return (
    <div className="page-anim" style={{ '--accent': '#39FF14' }}>
      <div className="page-header">
        <h1 className="page-title"><IconHash size={20} /> File Hasher</h1>
        <p className="page-subtitle">Verify file integrity with MD5, SHA-1, SHA-256, and SHA-512</p>
      </div>

      <div className="card">
        <div
          className={`dropzone${dragOver ? ' drag-over' : ''}`}
          onClick={handleBrowse}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="dropzone-icon"><IconHash size={36} /></div>
          {file
            ? <><div className="dropzone-title">{basename(file)}</div><div className="dropzone-sub">Drop another file or click to change</div></>
            : <><div className="dropzone-title">Drop any file here or click to browse</div><div className="dropzone-sub">Compute MD5, SHA-1, SHA-256, SHA-512 instantly</div></>}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
            <span className="spinner" style={{ fontSize: 24 }}>⟳</span>
            <p style={{ marginTop: 8, fontSize: 13 }}>Computing hashes…</p>
          </div>
        )}

        {result?.success && (
          <>
            <table className="hash-table">
              <thead>
                <tr>
                  <th>Algorithm</th>
                  <th>Hash</th>
                  <th>Copy</th>
                </tr>
              </thead>
              <tbody>
                {ALGORITHMS.map(algo => (
                  <tr key={algo}>
                    <td className="hash-algo">{algo.toUpperCase()}</td>
                    <td className="hash-value">{result.hashes[algo]}</td>
                    <td>
                      <button
                        className="hash-copy-btn"
                        onClick={() => copyToClipboard(result.hashes[algo], algo)}
                        title="Copy to clipboard"
                      >
                        {copied === algo ? '✓' : '📋'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="section-divider" />

            <div className="form-group">
              <label className="form-label">Verify Hash (paste a hash to compare)</label>
              <input
                className="form-input"
                placeholder="Paste expected hash here…"
                value={compareVal}
                onChange={e => setCompareVal(e.target.value)}
              />
            </div>

            {compareVal.trim() && (
              <div className={`result-banner ${matchAlgo ? 'success' : 'error'}`} style={{ marginTop: 12 }}>
                {matchAlgo
                  ? `✓ Hash matches ${matchAlgo.toUpperCase()} — file is authentic`
                  : '✗ Hash does not match any algorithm — file may be altered'}
              </div>
            )}
          </>
        )}

        {result && !result.success && (
          <div className="result-banner error">✗ {result.error}</div>
        )}
      </div>
    </div>
  )
}
