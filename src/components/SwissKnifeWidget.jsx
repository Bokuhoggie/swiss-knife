import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

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
   HORIZONTAL SWISS ARMY KNIFE HANDLE (200x76)
============================================================ */
function KnifeHandleHorizontal({ open }) {
  return (
    <svg width="200" height="76" viewBox="0 0 200 76"
      className={`sk-handle-svg${open ? ' open' : ''}`}
      style={{ display: 'block' }}
    >
      {/* ── Left bolster ── */}
      <rect x="10" y="12" width="12" height="52" fill="#808090"/>
      <rect x="11" y="14" width="10" height="48" fill="#B0B0C4"/>
      <rect x="20" y="12" width="3"  height="52" fill="#505060"/>

      {/* ── Main body red ── */}
      <rect x="22" y="8" width="156" height="60" fill="#CC001A"/>
      {/* Top highlight */}
      <rect x="22" y="8" width="156" height="7" fill="rgba(255,255,255,0.15)"/>
      {/* Bottom shadow edge */}
      <rect x="22" y="61" width="156" height="7" fill="rgba(0,0,0,0.18)"/>

      {/* ── Side scale texture (pixel bumps) vertically ── */}
      {[40,60,80,100,120,140,160].map((x, i) => (
        <rect key={i} x={x} y="8" width="2" height="60" fill="rgba(0,0,0,0.06)"/>
      ))}

      {/* ── White cross (centered horizontally) ── */}
      {/* vertical */}
      <rect x="95" y="24" width="10" height="28" fill="white"/>
      {/* horizontal */}
      <rect x="86" y="33" width="28" height="10" fill="white"/>

      {/* ── Rivets (Left, Center, Right) ── */}
      {/* Left rivet (Pivot for left blades) */}
      <rect x="36" y="34" width="8" height="8" fill="#707080"/>
      <rect x="37" y="35" width="4" height="4" fill="#A0A0B8"/>


      {/* Right rivet (Pivot for right blades) */}
      <rect x="156" y="34" width="8" height="8" fill="#707080"/>
      <rect x="157" y="35" width="4" height="4" fill="#A0A0B8"/>

      {/* ── OPEN state seam glows ── */}
      {open && <>
        {/* Top seam glow */}
        <rect x="22" y="6" width="156" height="4" fill="rgba(0,220,255,0.4)"/>
      </>}

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
  { label: 'IMAGE', route: '/image', color: '#00D4FF', Blade: BladeSVG,       angleOpen: -60, angleClosed: 90, flip: false, flipY: true, side: 'left' },
  { label: 'AUDIO', route: '/audio', color: '#FF3CAC', Blade: ScissorsSVG,    angleOpen: -40, angleClosed: 90, flip: false, flipY: true, side: 'left' },
  { label: 'VIDEO', route: '/video', color: '#C77DFF', Blade: ScrewdriverSVG, angleOpen: -20, angleClosed: 90, flip: false, flipY: false, side: 'left' },
]

const CENTER_TOOLS = [
  { label: 'SETTINGS', route: '/settings', color: '#AAAACC', Blade: ScrewdriverSVG, angleOpen: 0, angleClosed: 0, flip: false, flipY: false, side: 'center' },
]

const RIGHT_TOOLS = [
  { label: 'DOWNLOAD', route: '/download', color: '#00FF87', Blade: CanOpenerSVG, angleOpen: 20, angleClosed: -90, flip: true, flipY: true, side: 'right' },
  { label: 'PDF',      route: '/pdf',      color: '#FFD60A', Blade: NailFileSVG,  angleOpen: 40, angleClosed: -90, flip: true, flipY: true, side: 'right' },
  { label: 'HASH',     route: '/hash',     color: '#39FF14', Blade: CorkscrewSVG, angleOpen: 60, angleClosed: -90, flip: true, flipY: true, side: 'right' },
]

const ALL_TOOLS = [...LEFT_TOOLS, ...CENTER_TOOLS, ...RIGHT_TOOLS]

/* ============================================================
   WIDGET
============================================================ */
export default function SwissKnifeWidget() {
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(null)
  const [isShaking, setIsShaking] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

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

  return (
    <div
      className={`sk-widget-container ${isHome ? 'sk-size-large' : 'sk-size-small'}`}
    >
      <div 
        className={`sk-knife-assembly ${isHome ? 'sk-float' : ''}`}
        onMouseEnter={() => { if (!isHome) setOpen(true) }}
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
          const ToolBlade = tool.Blade
          
          // Determine local anchor point on the handle based on side
          const pivotX = tool.side === 'left' ? LEFT_PIVOT_X 
                       : tool.side === 'right' ? RIGHT_PIVOT_X 
                       : 100 // center pivot
          const pivotY = tool.side === 'center' ? 38 
                       : tool.side === 'left' ? LEFT_PIVOT_Y 
                       : RIGHT_PIVOT_Y
          
          // Offset blade absolute position so its (21, 190) sits on (pivotX, pivotY)
          const leftOffset = pivotX - BLADE_PIVOT_X
          const topOffset = pivotY - BLADE_PIVOT_Y

          const currentAngle = open ? tool.angleOpen : tool.angleClosed

          return (
            <button
              key={tool.route}
              className={`sk-blade-item ${open ? 'open' : ''} ${hovered === tool.route ? 'hovered' : ''}`}
              style={{
                left: `${leftOffset}px`,
                top: `${topOffset}px`,
                transform: `rotate(${currentAngle}deg)`,
                zIndex: hovered === tool.route ? 15 : 10,
                // Sequential transition delay (both opening & closing)
                transitionDelay: open 
                  ? `${tool.side === 'left' ? i * 60 : tool.side === 'center' ? 100 : (6 - i) * 60}ms` 
                  : `${tool.side === 'left' ? (2 - i) * 50 : tool.side === 'center' ? 50 : (i - 4) * 50}ms`
              }}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
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
                    hovered === tool.route ? 'scale(1.15)' : '',
                    tool.flipY ? 'scaleY(-1)' : '',
                    tool.flip ? 'scaleX(-1)' : ''
                  ].filter(Boolean).join(' ') || 'none',
                  filter: hovered === tool.route 
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
                  boxShadow: `0 0 8px ${tool.color}66`
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
          <KnifeHandleHorizontal open={open} />
        </button>

      </div>
    </div>
  )
}
