import { useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="page-anim" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', opacity: 0.15, pointerEvents: 'none', userSelect: 'none', transform: 'translateY(-40px)' }}>
        <h1 style={{ 
          fontFamily: "'Press Start 2P', monospace", 
          fontSize: '5rem', 
          color: 'var(--accent)',
          margin: 0,
          textShadow: '0 0 20px var(--accent)'
        }}>
          SWISS
          <br/>
          KNIFE
        </h1>

      </div>

      {/* Settings cog — bottom right */}
      <button
        onClick={() => navigate('/settings')}
        title="Settings"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          opacity: 0.4,
          transition: 'opacity 0.2s ease, transform 0.3s ease',
          padding: 8,
          zIndex: 50,
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'rotate(90deg)' }}
        onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.transform = 'rotate(0deg)' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ imageRendering: 'pixelated' }}>
          <rect x="10" y="1"  width="4" height="4" fill="#AAAACC"/>
          <rect x="10" y="19" width="4" height="4" fill="#AAAACC"/>
          <rect x="1"  y="10" width="4" height="4" fill="#AAAACC"/>
          <rect x="19" y="10" width="4" height="4" fill="#AAAACC"/>
          <rect x="3"  y="3"  width="4" height="4" fill="#AAAACC"/>
          <rect x="17" y="3"  width="4" height="4" fill="#AAAACC"/>
          <rect x="3"  y="17" width="4" height="4" fill="#AAAACC"/>
          <rect x="17" y="17" width="4" height="4" fill="#AAAACC"/>
          <rect x="6"  y="6"  width="12" height="12" fill="#AAAACC"/>
          <rect x="8"  y="8"  width="8"  height="8"  fill="var(--bg-surface)"/>
          <rect x="10" y="10" width="4"  height="4"  fill="#AAAACC"/>
        </svg>
      </button>

      <div className="home-footer" style={{ position: 'fixed', bottom: 20, left: 48, right: 48 }}>
        <span>&#9632; 100% LOCAL</span>
        <span>&#9632; NO UPLOADS</span>
        <span>&#9632; FFMPEG + SHARP + YT-DLP</span>
        <span className="blink">_</span>
      </div>
    </div>
  )
}
