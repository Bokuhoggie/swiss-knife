export default function Home() {
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
        <p style={{
          fontFamily: "'VT323', monospace",
          fontSize: '2rem',
          color: 'var(--text-dim)',
          marginTop: '2rem',
          letterSpacing: '4px'
        }}>
          HOVER TOOL TO BEGIN
        </p>
      </div>

      <div className="home-footer" style={{ position: 'fixed', bottom: 20, left: 48, right: 48 }}>
        <span>&#9632; 100% LOCAL</span>
        <span>&#9632; NO UPLOADS</span>
        <span>&#9632; FFMPEG + SHARP + YT-DLP</span>
        <span className="blink">_</span>
      </div>
    </div>
  )
}
