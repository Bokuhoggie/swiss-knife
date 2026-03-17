import { useState } from 'react'

export default function Settings() {
  const [outputDir, setOutputDir] = useState('')

  const pickDefaultOutput = async () => {
    const dir = await window.swissKnife?.selectOutputDir()
    if (dir) setOutputDir(dir)
  }

  return (
    <div className="page-anim" style={{ '--accent': '#AAAACC' }}>
      <div className="page-header">
        <h1 className="page-title">⚙ Settings</h1>
        <p className="page-subtitle">Configure Swiss Knife preferences</p>
      </div>

      <div className="card">
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Default Output Folder</label>
          <div className="controls-row">
            <input
              className="form-input"
              value={outputDir}
              readOnly
              placeholder="No default folder set"
              style={{ flex: 1 }}
            />
            <button className="btn btn-secondary" onClick={pickDefaultOutput}>
              📁 Choose Folder
            </button>
          </div>
        </div>

        <div className="section-divider" />

        <div style={{ padding: '20px 0', color: 'var(--text-secondary)', fontFamily: "'VT323', monospace", fontSize: '1.2rem' }}>
          More settings coming soon…
        </div>
      </div>
    </div>
  )
}
