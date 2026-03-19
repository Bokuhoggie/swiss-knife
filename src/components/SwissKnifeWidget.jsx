import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { getFirstDropPath } from '../dropHelpers.js'
import { setPendingFile } from '../globalDrop.js'
import { useTheme } from '../contexts/ThemeContext.jsx'

/* ============================================================
   PIXEL ART TOOL BLADE SHAPES  (42 × 190 viewBox)
   Pivot is at bottom-center (x: 21, y: 190).
============================================================ */

function BladeSVG({ color, flip }) {
  return (
    <svg width="42" height="190" viewBox="0 0 42 190" fill="none">
      <g transform={flip ? "translate(42, 0) scale(-1, 1)" : undefined}>
        <rect x="16" y="10" width="10" height="130" fill={color} opacity="0.95"/>
        <polygon points="16,140 26,140 21,175" fill={color} opacity="0.95"/>
        <rect x="13" y="6"  width="16" height="8"  fill="#9090A8"/>
        <rect x="14" y="7"  width="14" height="6"  fill="#C0C0D0"/>
        {[20,34,48,62,76,90,104].map((y,i) => (
          <rect key={i} x="18" y={y} width="3" height="8" fill="rgba(255,255,255,0.18)"/>
        ))}
        <rect x="22" y="10" width="3" height="130" fill="rgba(255,255,255,0.14)"/>
      </g>
    </svg>
  )
}

function ScissorsSVG({ color, flip }) {
  return (
    <svg width="42" height="190" viewBox="0 0 42 190" fill="none">
      <g transform={flip ? "translate(42, 0) scale(-1, 1)" : undefined}>
        <rect x="4"  y="8"  width="14" height="14" fill={color} opacity="0.9"/>
        <rect x="2"  y="11" width="6"  height="8"  fill={color} opacity="0.9"/>
        <rect x="4"  y="20" width="14" height="4"  fill={color} opacity="0.9"/>
        <rect x="24" y="8"  width="14" height="14" fill={color} opacity="0.9"/>
        <rect x="34" y="11" width="6"  height="8"  fill={color} opacity="0.9"/>
        <rect x="24" y="20" width="14" height="4"  fill={color} opacity="0.9"/>
        <rect x="16" y="24" width="10" height="6" fill={color} opacity="0.9"/>
        <polygon points="10,30 20,30 16,170" fill={color} opacity="0.88"/>
        <polygon points="22,30 32,30 26,170" fill={color} opacity="0.88"/>
        <rect x="13" y="36" width="2" height="80" fill="rgba(255,255,255,0.2)"/>
        <rect x="27" y="36" width="2" height="80" fill="rgba(255,255,255,0.2)"/>
      </g>
    </svg>
  )
}

function ScrewdriverSVG({ color, flip }) {
  return (
    <svg width="42" height="190" viewBox="0 0 42 190" fill="none">
      <g transform={flip ? "translate(42, 0) scale(-1, 1)" : undefined}>
        <rect x="13" y="8"  width="16" height="30" fill={color} opacity="0.92"/>
        {[13,19,25,31].map((y,i) => (
          <rect key={i} x="11" y={y} width="20" height="4" fill="rgba(0,0,0,0.18)"/>
        ))}
        <rect x="12" y="8"  width="18" height="30" fill="none" stroke={color} strokeWidth="1" opacity="0.5"/>
        <rect x="12" y="38" width="18" height="8" fill="#9090A8"/>
        <rect x="13" y="39" width="16" height="6" fill="#B8B8CC"/>
        <rect x="18" y="46" width="6"  height="112" fill="#A0A0B4"/>
        <rect x="19" y="46" width="4"  height="112" fill="#C8C8DC"/>
        <rect x="10" y="155" width="22" height="6"  fill="#808090"/>
        <rect x="9"  y="158" width="24" height="4"  fill="#A0A0B4"/>
      </g>
    </svg>
  )
}

function CanOpenerSVG({ color, flip }) {
  return (
    <svg width="42" height="190" viewBox="0 0 42 190" fill="none">
      <g transform={flip ? "translate(42, 0) scale(-1, 1)" : undefined}>
        <rect x="16" y="8"  width="10" height="100" fill={color} opacity="0.92"/>
        <rect x="14" y="6"  width="14" height="6"  fill="#9090A8"/>
        <rect x="10" y="100" width="22" height="8"  fill={color} opacity="0.92"/>
        <rect x="10" y="108" width="10" height="16" fill={color} opacity="0.92"/>
        <polygon points="10,124 20,124 14,148" fill={color} opacity="0.9"/>
        <rect x="16" y="108" width="4"  height="8"  fill="rgba(0,0,0,0.25)"/>
        {[112,117,122].map((y,i) => (
          <rect key={i} x="10" y={y} width="5" height="3" fill="rgba(0,0,0,0.3)"/>
        ))}
        <rect x="18" y="14" width="3" height="86" fill="rgba(255,255,255,0.18)"/>
      </g>
    </svg>
  )
}

function NailFileSVG({ color, flip }) {
  return (
    <svg width="42" height="190" viewBox="0 0 42 190" fill="none">
      <g transform={flip ? "translate(42, 0) scale(-1, 1)" : undefined}>
        <rect x="10" y="8"  width="22" height="140" fill={color} opacity="0.9"/>
        <rect x="8"  y="6"  width="26" height="6"   fill="#9090A8"/>
        {[16,23,30,37,44,51,58,65,72,79,86,93,100,107,114,121,128,135].map((y,i) => (
          <rect key={i} x="10" y={y} width="22" height="4" fill="rgba(0,0,0,0.14)"/>
        ))}
        <rect x="13" y="146" width="16" height="8"  fill={color} opacity="0.9"/>
        <rect x="16" y="152" width="10" height="6"  fill={color} opacity="0.8"/>
        <rect x="18" y="156" width="6"  height="4"  fill={color} opacity="0.6"/>
        <rect x="11" y="8"   width="3"  height="140" fill="rgba(255,255,255,0.14)"/>
      </g>
    </svg>
  )
}

function MagnifyGlassSVG({ color, flip }) {
  return (
    <svg width="42" height="190" viewBox="0 0 42 190" fill="none">
      <g transform={flip ? "translate(42, 0) scale(-1, 1)" : undefined}>
        {/* Mounting collar */}
        <rect x="13" y="4" width="16" height="6" fill="#9090A8"/>
        <rect x="14" y="5" width="14" height="4" fill="#C0C0D0"/>
        {/* Handle stick */}
        <rect x="18" y="10" width="6" height="110" fill={color} opacity="0.92"/>
        <rect x="20" y="10" width="3"  height="110" fill="rgba(255,255,255,0.18)"/>
        {/* Lens ring — pixel-art circle */}
        <rect x="9"  y="120" width="24" height="5"  fill={color} opacity="0.95"/>
        <rect x="5"  y="125" width="5"  height="5"  fill={color} opacity="0.95"/>
        <rect x="32" y="125" width="5"  height="5"  fill={color} opacity="0.95"/>
        <rect x="3"  y="130" width="5"  height="26" fill={color} opacity="0.95"/>
        <rect x="34" y="130" width="5"  height="26" fill={color} opacity="0.95"/>
        <rect x="5"  y="156" width="5"  height="5"  fill={color} opacity="0.95"/>
        <rect x="32" y="156" width="5"  height="5"  fill={color} opacity="0.95"/>
        <rect x="9"  y="161" width="24" height="5"  fill={color} opacity="0.95"/>
        {/* Lens interior glow */}
        <rect x="8"  y="125" width="26" height="36" fill={color} opacity="0.06"/>
        {/* Glare */}
        <rect x="8"  y="130" width="7"  height="7"  fill="rgba(255,255,255,0.28)"/>
        <rect x="17" y="122" width="5"  height="4"  fill="rgba(255,255,255,0.18)"/>
      </g>
    </svg>
  )
}

function CorkscrewSVG({ color, flip }) {
  return (
    <svg width="42" height="190" viewBox="0 0 42 190" fill="none">
      <g transform={flip ? "translate(42, 0) scale(-1, 1)" : undefined}>
        <rect x="16" y="8"  width="10" height="6"  fill={color} opacity="0.9"/>
        <rect x="24" y="8"  width="6"  height="10" fill={color} opacity="0.9"/>
        <rect x="16" y="14" width="6"  height="6"  fill={color} opacity="0.9"/>
        <rect x="18" y="20" width="6"  height="12" fill={color} opacity="0.9"/>
        <rect x="20" y="32" width="14" height="5" fill={color} opacity="0.9"/>
        <rect x="30" y="37" width="5"  height="5" fill={color} opacity="0.9"/>
        <rect x="30" y="42" width="5"  height="5" fill={color} opacity="0.9"/>
        <rect x="20" y="47" width="14" height="5" fill={color} opacity="0.9"/>
        <rect x="8"  y="52" width="5"  height="5" fill={color} opacity="0.9"/>
        <rect x="8"  y="57" width="5"  height="5" fill={color} opacity="0.9"/>
        <rect x="8"  y="62" width="16" height="5" fill={color} opacity="0.9"/>
        <rect x="20" y="67" width="14" height="5" fill={color} opacity="0.9"/>
        <rect x="30" y="72" width="5"  height="5" fill={color} opacity="0.9"/>
        <rect x="30" y="77" width="5"  height="5" fill={color} opacity="0.9"/>
        <rect x="16" y="82" width="14" height="5" fill={color} opacity="0.9"/>
        <rect x="8"  y="87" width="5"  height="5" fill={color} opacity="0.9"/>
        <rect x="8"  y="92" width="5"  height="5" fill={color} opacity="0.9"/>
        <rect x="8"  y="97" width="16" height="5" fill={color} opacity="0.9"/>
        <rect x="20" y="102" width="12" height="5" fill={color} opacity="0.9"/>
        <rect x="18" y="106" width="8" height="5"  fill={color} opacity="0.85"/>
        <rect x="19" y="111" width="6" height="5"  fill={color} opacity="0.7"/>
        <rect x="20" y="116" width="4" height="4"  fill={color} opacity="0.5"/>
        <rect x="21" y="120" width="2" height="3"  fill={color} opacity="0.35"/>
        <rect x="13" y="4" width="18" height="6" fill="#9090A8"/>
      </g>
    </svg>
  )
}

/* ============================================================
   COLLEGE / THEME LOGOS  (replaces the swiss cross on handle)
   All render in the cross area: x:86-114, y:24-52
============================================================ */
function LogoMichiganM() {
  const c = "white"
  return (
    <g>
      {/* Blocky M - 28x28 approx within 86-114, 24-52 */}
      <rect x="86" y="24" width="6" height="28" fill={c}/>
      <rect x="108" y="24" width="6" height="28" fill={c}/>
      <rect x="92" y="24" width="16" height="6" fill={c}/>
      <rect x="96" y="30" width="8" height="6" fill={c}/>
      <rect x="98" y="36" width="4" height="6" fill={c}/>
    </g>
  )
}

function LogoSpartanS() {
  const c = "white"
  return (
    <g>
      {/* Blocky S - matching example */}
      <rect x="86" y="24" width="28" height="6" fill={c}/>
      <rect x="86" y="30" width="6" height="8" fill={c}/>
      <rect x="86" y="38" width="28" height="6" fill={c}/>
      <rect x="108" y="44" width="6" height="8" fill={c}/>
      <rect x="86" y="52" width="28" height="6" fill={c}/>
      {/* Serif-like bits */}
      <rect x="108" y="30" width="6" height="2" fill={c}/>
      <rect x="86" y="50" width="6" height="2" fill={c}/>
    </g>
  )
}

function LogoNMU() {
  const c = "white"
  return (
    <g>
      {/* N with compass/torch */}
      {/* Outer compass ring (simplified) */}
      <rect x="86" y="41" width="2" height="6" fill={c}/>
      <rect x="112" y="41" width="2" height="6" fill={c}/>
      <rect x="97" y="56" width="6" height="2" fill={c}/>
      <rect x="97" y="32" width="6" height="2" fill={c}/>
      
      {/* Compass spikes */}
      <rect x="99" y="30" width="2" height="4" fill={c}/>
      <rect x="99" y="54" width="2" height="4" fill={c}/>
      <rect x="84" y="43" width="4" height="2" fill={c}/>
      <rect x="112" y="43" width="4" height="2" fill={c}/>

      {/* The N */}
      <rect x="94" y="40" width="4" height="12" fill={c}/>
      <rect x="102" y="40" width="4" height="12" fill={c}/>
      <rect x="96" y="42" width="8" height="8" fill={c}/>

      {/* The Torch handle */}
      <rect x="98" y="34" width="4" height="8" fill={c}/>
      {/* Flame */}
      <rect x="97" y="26" width="6" height="8" fill={c} opacity="0.8"/>
      <rect x="99" y="24" width="2" height="2" fill={c}/>
    </g>
  )
}

function LogoWayneW() {
  const c = "white"
  return (
    <g>
      {/* Blocky W - matching example */}
      <rect x="86" y="24" width="6" height="28" fill={c}/>
      <rect x="108" y="24" width="6" height="28" fill={c}/>
      <rect x="97" y="38" width="6" height="14" fill={c}/>
      <rect x="86" y="52" width="28" height="6" fill={c}/>
      <rect x="92" y="46" width="16" height="6" fill={c}/>
    </g>
  )
}

const HANDLE_LOGOS = {
  uofm:      LogoMichiganM,
  msu:       LogoSpartanS,
  nmu:       LogoNMU,
  waynestate: LogoWayneW,
}

/* ============================================================
   HORIZONTAL SWISS ARMY KNIFE HANDLE (200x76)
============================================================ */
function KnifeHandleHorizontal({ open, themeId }) {
  return (
    <svg width="200" height="76" viewBox="0 0 200 76"
      className={`sk-handle-svg${open ? ' open' : ''}`}
      style={{ display: 'block' }}
    >
      {/* ── Left bolster ── */}
      <rect x="10" y="12" width="12" height="52" fill="#808090"/>
      <rect x="11" y="14" width="10" height="48" fill="#B0B0C4"/>
      <rect x="20" y="12" width="3"  height="52" fill="#505060"/>

      {/* ── Main body — theme accent color ── */}
      <rect x="22" y="8" width="156" height="60" fill="var(--accent-dim)"/>
      {/* Top highlight */}
      <rect x="22" y="8" width="156" height="7" fill="rgba(255,255,255,0.15)"/>
      {/* Bottom shadow edge */}
      <rect x="22" y="61" width="156" height="7" fill="rgba(0,0,0,0.18)"/>

      {/* ── Side scale texture (pixel bumps) vertically ── */}
      {[40,60,80,100,120,140,160].map((x, i) => (
        <rect key={i} x={x} y="8" width="2" height="60" fill="rgba(0,0,0,0.06)"/>
      ))}

      {/* ── Center logo (college theme) or default Swiss cross ── */}
      {(() => {
        const Logo = HANDLE_LOGOS[themeId]
        if (Logo) return <Logo />
        return (
          <>
            <rect x="95" y="24" width="10" height="28" fill="white"/>
            <rect x="86" y="33" width="28" height="10" fill="white"/>
          </>
        )
      })()}

      {/* ── Rivets (Left, Center, Right) ── */}
      {/* Left rivet (Pivot for left blades) */}
      <rect x="36" y="34" width="8" height="8" fill="#707080"/>
      <rect x="37" y="35" width="4" height="4" fill="#A0A0B8"/>


      {/* Right rivet (Pivot for right blades) */}
      <rect x="156" y="34" width="8" height="8" fill="#707080"/>
      <rect x="157" y="35" width="4" height="4" fill="#A0A0B8"/>

      {/* ── Right bolster ── */}
      <rect x="175" y="12" width="3"  height="52" fill="#505060"/>
      <rect x="178" y="12" width="12" height="52" fill="#808090"/>
      <rect x="179" y="14" width="10" height="48" fill="#B0B0C4"/>

      {/* ── Lanyard loop (far right) ── */}
      <rect x="188" y="28" width="10" height="20" fill="#808090"/>
      <rect x="190" y="30" width="8"  height="16" fill="#606070"/>
      <rect x="192" y="32" width="6"  height="12" fill="#2A2A32"/>

      {/* ── "SK" micro-text ── */}
      <text x="130" y="44"
        textAnchor="middle" fontSize="6"
        fontFamily="'Press Start 2P', monospace"
        fill="rgba(255,255,255,0.4)"
      >SK</text>
    </svg>
  )
}

/* ============================================================
   TOOL CONFIG (Divided by pivot side)
============================================================ */
const LEFT_TOOLS = [
  { label: 'IMAGE',  route: '/image', color: 'var(--accent-3)', glow: 'var(--glow-cyan)',   Blade: BladeSVG,       angleOpen: -60, angleClosed: 90,  flip: false, flipY: true  },
  { label: 'AUDIO',  route: '/audio', color: 'var(--accent-2)', glow: 'var(--glow-pink)',   Blade: ScissorsSVG,    angleOpen: -40, angleClosed: 90,  flip: false, flipY: true  },
  { label: 'VIDEO',  route: '/video', color: 'var(--accent)',   glow: 'var(--glow-accent)', Blade: ScrewdriverSVG, angleOpen: -20, angleClosed: 90,  flip: false, flipY: false },
]

const RIGHT_TOOLS = [
  { label: 'DOWNLOAD', route: '/download',  color: 'var(--accent-4)', glow: 'var(--glow-accent)', Blade: CanOpenerSVG,    angleOpen: 20, angleClosed: -90, flip: true, flipY: true },
  { label: 'PDF',      route: '/pdf',       color: 'var(--accent-2)', glow: 'var(--glow-pink)',   Blade: NailFileSVG,    angleOpen: 40, angleClosed: -90, flip: true, flipY: true },
  { label: 'HASH',     route: '/hash',      color: 'var(--accent)',   glow: 'var(--glow-accent)', Blade: CorkscrewSVG,   angleOpen: 60, angleClosed: -90, flip: true, flipY: true },
  { label: 'INSPECT',  route: '/inspector', color: 'var(--accent-3)', glow: 'var(--glow-cyan)',   Blade: MagnifyGlassSVG, angleOpen: 80, angleClosed: -90, flip: true, flipY: true },
]

const ALL_TOOLS = [...LEFT_TOOLS, ...RIGHT_TOOLS]

/* ============================================================
   WIDGET
============================================================ */
export default function SwissKnifeWidget() {
  const { themeId } = useTheme()
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(null)
  const [isShaking, setIsShaking] = useState(false)
  const [flickingTool, setFlickingTool] = useState(null)
  const [peekingTool, setPeekingTool] = useState(null)
  const [dragOverWidget, setDragOverWidget] = useState(false)
  const [isWaving, setIsWaving] = useState(false)
  const [waveBlades, setWaveBlades] = useState(new Set())
  const navigate = useNavigate()
  const location = useLocation()

  // Listen for blade flick / peek / wave events
  useEffect(() => {
    const handleFlick = (e) => {
      const route = e.detail
      setFlickingTool(route)
      setTimeout(() => setFlickingTool(null), 1200)
    }
    const handlePeek = (e) => setPeekingTool(e.detail)
    const handleWave = (e) => setIsWaving(e.detail)
    window.addEventListener('blade-flick', handleFlick)
    window.addEventListener('blade-peek', handlePeek)
    window.addEventListener('blade-wave', handleWave)
    return () => {
      window.removeEventListener('blade-flick', handleFlick)
      window.removeEventListener('blade-peek', handlePeek)
      window.removeEventListener('blade-wave', handleWave)
    }
  }, [])

  // Wave: choppy slicing pattern — interleaves left/right blades, each pops open briefly
  useEffect(() => {
    if (!isWaving) { setWaveBlades(new Set()); return }
    // Interleaved order: alternates left↔right for a "busy cutting" feel
    const ORDER = [0, 3, 1, 4, 2, 5, 6]
    const INTERVAL = 110  // ms between each blade firing
    const HOLD     = 175  // ms each blade stays open (overlap = 2 blades at once most of the time)
    let step = 0
    const id = setInterval(() => {
      const idx = ORDER[step % ORDER.length]
      setWaveBlades(prev => new Set([...prev, idx]))
      setTimeout(() => setWaveBlades(prev => { const n = new Set(prev); n.delete(idx); return n }), HOLD)
      step++
    }, INTERVAL)
    return () => clearInterval(id)
  }, [isWaving])

  // Dynamic layout based on route
  const isHome = location.pathname === '/'

  // Close the knife when navigating to an inner page
  const prevIsHome = useState(isHome)[0]
  useEffect(() => {
    if (!isHome && prevIsHome) {
      // Small delay to let the navigate complete before closing
      const t = setTimeout(() => setOpen(false), 50)
      return () => clearTimeout(t)
    }
  }, [isHome, prevIsHome])

  const goHome = (e) => {
    e.stopPropagation()
    // Trigger shake animation
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 400)

    if (isHome) {
      setOpen(prev => !prev) // Toggle open state on home screen via click
    } else {
      setOpen(false)
      navigate('/')
    }
  }

  // Pivots in local SVG coords (relative to the 200x76 handle)
  const LEFT_PIVOT_X = 40
  const LEFT_PIVOT_Y = 38
  const RIGHT_PIVOT_X = 160
  const RIGHT_PIVOT_Y = 38
  const BLADE_PIVOT_X = 21   // center of blade width
  const BLADE_PIVOT_Y = 190  // bottom of blade

  const handleWidgetDrop = (e) => {
    e.preventDefault(); e.stopPropagation()
    setDragOverWidget(false)
    const filePath = getFirstDropPath(e)
    if (!filePath) return

    // Prevent immediate hover snap-open on /inspector transition
    window.__skSuppressHover = true
    setTimeout(() => { window.__skSuppressHover = false }, 1500)

    window.dispatchEvent(new CustomEvent('blade-flick', { detail: '/inspector' }))
    setPendingFile(filePath)
    setOpen(false)
    navigate('/inspector')
  }

  return (
    <div
      className={`sk-widget-container ${isHome ? 'sk-size-large' : 'sk-size-small'}`}
      onDragOver={(e) => { e.preventDefault(); setDragOverWidget(true) }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOverWidget(false) }}
      onDrop={handleWidgetDrop}
    >
      <div 
        className={`sk-knife-assembly ${isHome ? 'sk-float' : ''}`}
        style={{
          filter: dragOverWidget ? 'drop-shadow(0 0 16px rgba(255, 159, 28, 0.8))' : 'none',
          transform: dragOverWidget ? 'scale(1.05)' : 'none',
          transition: 'all 0.2s ease-out'
        }}
        onMouseEnter={() => { if (!isHome && !window.__skSuppressHover) setOpen(true) }}
        onMouseLeave={() => { if (!isHome) setOpen(false) }}
      >
        {/* Invisible bridge to catch hovers across the fanned blades */}
        <div 
          className="sk-hover-bridge" 
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '360px',
            height: '240px',
            pointerEvents: open ? 'auto' : 'none',
            zIndex: 1
          }} 
        />

        {/* ─── BLADES ─── Rendered behind handle context */}
        {ALL_TOOLS.map((tool, i) => {
          const isLeft = i < 3
          const ToolBlade = tool.Blade
          
          // Determine local anchor point on the handle
          const pivotX = isLeft ? LEFT_PIVOT_X : RIGHT_PIVOT_X
          const pivotY = isLeft ? LEFT_PIVOT_Y : RIGHT_PIVOT_Y
          
          // Offset blade absolute position so its (21, 190) sits on (pivotX, pivotY)
          const leftOffset = pivotX - BLADE_PIVOT_X
          const topOffset = pivotY - BLADE_PIVOT_Y

          const isOpen = open || flickingTool === tool.route
          const isPeeking = peekingTool === tool.route && !isOpen
          const isWaveActive = isWaving && !open && waveBlades.has(i)

          // Wave opens only 40% of the way — a quick chop, not a full fan
          const waveAngle = tool.angleClosed + (tool.angleOpen - tool.angleClosed) * 0.4

          let currentAngle = tool.angleClosed
          if (isOpen) currentAngle = tool.angleOpen
          else if (isWaveActive) currentAngle = waveAngle
          else if (isPeeking) {
             currentAngle = tool.angleClosed + (tool.angleOpen - tool.angleClosed) * 0.4
          }

          return (
            <button
              key={tool.route}
              className={`sk-blade-item ${(isOpen || isPeeking || isWaveActive) ? 'open' : ''} ${hovered === tool.route ? 'hovered' : ''}`}
              style={{
                left: `${leftOffset}px`,
                top: `${topOffset}px`,
                transform: `rotate(${currentAngle}deg)`,
                zIndex: (hovered === tool.route || flickingTool === tool.route || isPeeking || isWaveActive) ? 15 : 10,
                // Snappy choppy transition while waving; normal stagger otherwise
                ...(isWaving ? { transition: 'transform 75ms cubic-bezier(0.2, 0, 0.6, 1)' } : {
                  transitionDelay: (flickingTool === tool.route || isPeeking)
                    ? '0ms'
                    : (open
                      ? `${isLeft ? i * 60 : (6 - i) * 60}ms`
                      : `${isLeft ? (2 - i) * 50 : (i - 3) * 50}ms`)
                })
              }}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                setFlickingTool(null)
                navigate(tool.route)
              }}
              onMouseEnter={() => setHovered(tool.route)}
              onMouseLeave={() => setHovered(null)}
              title={tool.label}
            >
              <div 
                className="sk-blade-visual"
                style={{
                  transform: [
                    tool.flipY ? 'scaleY(-1)' : '',
                    tool.flip ? 'scaleX(-1)' : ''
                  ].filter(Boolean).join(' ') || 'none',
                  filter: (hovered === tool.route || flickingTool === tool.route || isPeeking)
                    ? `drop-shadow(0 0 12px ${tool.color}) brightness(1.3)`
                    : `drop-shadow(0 0 4px rgba(0,0,0,0.8))`
                }}
              >
                <ToolBlade color={tool.color} />
              </div>
              
              {/* Tool tip label */}
              <div 
                className={`sk-blade-tooltip ${hovered === tool.route ? 'visible' : ''}`}
                style={{
                  color: tool.color,
                  borderColor: tool.color,
                  boxShadow: tool.glow
                }}
              >
                {tool.label}
              </div>
            </button>
          )
        })}

        {/* ─── HANDLE ─── Rendered in front */}
        <button
          className={`sk-handle-btn-horizontal ${isShaking ? 'sk-shake' : ''}`}
          onClick={goHome}
          title={isHome ? "Swiss Knife" : "Back to Home"}
        >
          <KnifeHandleHorizontal open={open} themeId={themeId} />
        </button>

      </div>
    </div>
  )
}
