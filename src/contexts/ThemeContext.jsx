import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'swiss-knife-theme'
const FONT_KEY = 'swiss-knife-font'

export const SIZES = {
  s:   { id: 's',   name: 'Small',   scale: 0.82 },
  m:   { id: 'm',   name: 'Medium',  scale: 1.0  },
  l:   { id: 'l',   name: 'Large',   scale: 1.22 },
  xl:  { id: 'xl',  name: 'X-Large', scale: 1.48 },
  xxl: { id: 'xxl', name: '4K',      scale: 2.10 },
}

const SIZE_KEY = 'swiss-knife-size'

// Auto-detect best default size for high-DPI/4K displays
function detectDefaultSize() {
  const saved = localStorage.getItem(SIZE_KEY)
  if (saved) return saved
  const dpr = window.devicePixelRatio || 1
  if (dpr >= 2.5) return 'xl'    // 4K+ display
  if (dpr >= 1.75) return 'l'    // QHD / high-DPI
  return 'm'
}

export const FONTS = {
  pixel: {
    id: 'pixel',
    name: 'Pixel',
    label: 'Press Start 2P',
    preview: 'ABCD 1234',
    family: "'Press Start 2P', monospace",
  },
  vt323: {
    id: 'vt323',
    name: 'Terminal',
    label: 'VT323',
    preview: 'ABCD 1234',
    family: "'VT323', monospace",
  },
  inter: {
    id: 'inter',
    name: 'Sans',
    label: 'Inter',
    preview: 'ABCD 1234',
    family: "'Inter', sans-serif",
  },
  mono: {
    id: 'mono',
    name: 'Mono',
    label: 'Courier',
    preview: 'ABCD 1234',
    family: "'Courier New', monospace",
  },
}

// --accent-rgb is the raw R,G,B of --accent, used for rgba(var(--accent-rgb), opacity)
export const THEMES = {
  arcade: {
    id: 'arcade',
    name: 'Arcade',
    preview: ['#00FF87', '#FF3CAC', '#39FF14', '#0A0A0C'],
    vars: {
      '--bg-base':        '#0A0A0C',
      '--bg-surface':     '#0F0F14',
      '--bg-elevated':    '#16161E',
      '--bg-card':        '#13131A',
      '--bg-hover':       '#1E1E28',
      '--accent':         '#00FF87',
      '--accent-dim':     '#00CC6A',
      '--accent-glow':    'rgba(0, 255, 135, 0.2)',
      '--accent-2':       '#FF3CAC',
      '--accent-3':       '#39FF14',
      '--accent-4':       '#FFD60A',
      '--accent-rgb':     '0, 255, 135',
      '--success':        '#00FF87',
      '--warning':        '#FFD60A',
      '--error':          '#FF3CAC',
      '--text-primary':   '#E8E8F0',
      '--text-secondary': '#8888A8',
      '--text-muted':     '#444460',
      '--border':         'rgba(0, 255, 135, 0.12)',
      '--border-hover':   'rgba(0, 255, 135, 0.28)',
      '--shadow-card':    '0 0 0 1px rgba(0,255,135,0.1), 0 8px 32px rgba(0,0,0,0.6)',
      '--glow-accent':    '0 0 12px rgba(0,255,135,0.5)',
      '--glow-pink':      '0 0 12px rgba(255,60,172,0.5)',
      '--glow-cyan':      '0 0 12px rgba(57,255,20,0.5)',
    },
  },

  navy: {
    id: 'navy',
    name: 'Navy',
    preview: ['#60a5fa', '#818cf8', '#22d3ee', '#080d1a'],
    vars: {
      '--bg-base':        '#080d1a',
      '--bg-surface':     '#0f172a',
      '--bg-elevated':    '#1e293b',
      '--bg-card':        '#111827',
      '--bg-hover':       '#243449',
      '--accent':         '#60a5fa',
      '--accent-dim':     '#3b82f6',
      '--accent-glow':    'rgba(96, 165, 250, 0.2)',
      '--accent-2':       '#818cf8',
      '--accent-3':       '#22d3ee',
      '--accent-4':       '#34d399',
      '--accent-rgb':     '96, 165, 250',
      '--success':        '#34d399',
      '--warning':        '#fbbf24',
      '--error':          '#f87171',
      '--text-primary':   '#f1f5f9',
      '--text-secondary': '#94a3b8',
      '--text-muted':     '#334155',
      '--border':         'rgba(96, 165, 250, 0.12)',
      '--border-hover':   'rgba(96, 165, 250, 0.28)',
      '--shadow-card':    '0 0 0 1px rgba(96,165,250,0.1), 0 8px 32px rgba(0,0,0,0.6)',
      '--glow-accent':    '0 0 12px rgba(96,165,250,0.5)',
      '--glow-pink':      '0 0 12px rgba(129,140,248,0.5)',
      '--glow-cyan':      '0 0 12px rgba(34,211,238,0.5)',
    },
  },

  red: {
    id: 'red',
    name: 'Red',
    preview: ['#ef4444', '#f97316', '#fbbf24', '#030712'],
    vars: {
      '--bg-base':        '#030712',
      '--bg-surface':     '#0a0305',
      '--bg-elevated':    '#12050a',
      '--bg-card':        '#0d0307',
      '--bg-hover':       '#1a0610',
      '--accent':         '#ef4444',
      '--accent-dim':     '#b91c1c',
      '--accent-glow':    'rgba(239, 68, 68, 0.2)',
      '--accent-2':       '#f97316',
      '--accent-3':       '#fbbf24',
      '--accent-4':       '#f87171',
      '--accent-rgb':     '239, 68, 68',
      '--success':        '#4ade80',
      '--warning':        '#fbbf24',
      '--error':          '#f87171',
      '--text-primary':   '#fff1f2',
      '--text-secondary': '#fecaca',
      '--text-muted':     '#7f1d1d',
      '--border':         'rgba(239, 68, 68, 0.12)',
      '--border-hover':   'rgba(239, 68, 68, 0.28)',
      '--shadow-card':    '0 0 0 1px rgba(239,68,68,0.1), 0 8px 32px rgba(0,0,0,0.7)',
      '--glow-accent':    '0 0 12px rgba(239,68,68,0.5)',
      '--glow-pink':      '0 0 12px rgba(249,115,22,0.5)',
      '--glow-cyan':      '0 0 12px rgba(251,191,36,0.5)',
    },
  },

  lavender: {
    id: 'lavender',
    name: 'Lavender',
    preview: ['#a855f7', '#c084fc', '#818cf8', '#0c0a1f'],
    vars: {
      '--bg-base':        '#0c0a1f',
      '--bg-surface':     '#110e2a',
      '--bg-elevated':    '#1a1347',
      '--bg-card':        '#16113b',
      '--bg-hover':       '#221854',
      '--accent':         '#a855f7',
      '--accent-dim':     '#9333ea',
      '--accent-glow':    'rgba(168, 85, 247, 0.2)',
      '--accent-2':       '#818cf8',
      '--accent-3':       '#c084fc',
      '--accent-4':       '#e879f9',
      '--accent-rgb':     '168, 85, 247',
      '--success':        '#4ade80',
      '--warning':        '#fbbf24',
      '--error':          '#f87171',
      '--text-primary':   '#f5f3ff',
      '--text-secondary': '#e9d5ff',
      '--text-muted':     '#6b21a8',
      '--border':         'rgba(168, 85, 247, 0.12)',
      '--border-hover':   'rgba(168, 85, 247, 0.28)',
      '--shadow-card':    '0 0 0 1px rgba(168,85,247,0.1), 0 8px 32px rgba(0,0,0,0.6)',
      '--glow-accent':    '0 0 12px rgba(168,85,247,0.5)',
      '--glow-pink':      '0 0 12px rgba(232,121,249,0.5)',
      '--glow-cyan':      '0 0 12px rgba(192,132,252,0.5)',
    },
  },

  lions: {
    id: 'lions',
    name: 'Detroit Lions',
    hidden: true,
    preview: ['#0076B6', '#B0B7BC', '#FFFFFF', '#00111A'],
    vars: {
      '--bg-base':        '#000B11',
      '--bg-surface':     '#001420',
      '--bg-elevated':    '#001D2D',
      '--bg-card':        '#001825',
      '--bg-hover':       '#002133',
      '--accent':         '#0076B6',
      '--accent-dim':     '#005B8C',
      '--accent-glow':    'rgba(0, 118, 182, 0.25)',
      '--accent-2':       '#B0B7BC',
      '--accent-3':       '#0076B6',
      '--accent-4':       '#0076B6',
      '--accent-rgb':     '0, 118, 182',
      '--success':        '#0076B6',
      '--warning':        '#A5ACAF',
      '--error':          '#E31837',
      '--text-primary':   '#FFFFFF',
      '--text-secondary': '#A5ACAF',
      '--text-muted':     '#00334E',
      '--border':         'rgba(0, 118, 182, 0.2)',
      '--border-hover':   'rgba(0, 118, 182, 0.45)',
      '--shadow-card':    '0 0 0 1px rgba(0,118,182,0.15), 0 8px 32px rgba(0,0,0,0.8)',
      '--glow-accent':    '0 0 16px rgba(0,118,182,0.6)',
      '--glow-pink':      '0 0 16px rgba(165,172,175,0.5)',
      '--glow-cyan':      '0 0 16px rgba(0,118,182,0.6)',
    },
  },

  tron: {
    id: 'tron',
    name: 'TRON',
    hidden: true,
    preview: ['#4DE8FF', '#0088CC', '#18C8FF', '#000000'],
    vars: {
      '--bg-base':        '#000000',
      '--bg-surface':     '#000004',
      '--bg-elevated':    '#000008',
      '--bg-card':        '#000006',
      '--bg-hover':       '#00050E',
      '--accent':         '#4DE8FF',
      '--accent-dim':     '#0A4860',
      '--accent-glow':    'rgba(77, 232, 255, 0.15)',
      '--accent-2':       '#0088CC',
      '--accent-3':       '#18C8FF',
      '--accent-4':       '#6AF0FF',
      '--accent-rgb':     '77, 232, 255',
      '--success':        '#4DE8FF',
      '--warning':        '#18C8FF',
      '--error':          '#FF2040',
      '--text-primary':   '#A0D8E8',
      '--text-secondary': '#305868',
      '--text-muted':     '#0A1820',
      '--border':         'rgba(77, 232, 255, 0.08)',
      '--border-hover':   'rgba(77, 232, 255, 0.22)',
      '--shadow-card':    '0 0 0 1px rgba(77,232,255,0.05), 0 0 40px rgba(0,0,0,0.98), inset 0 0 20px rgba(77,232,255,0.01)',
      '--glow-accent':    '0 0 16px rgba(77,232,255,0.5), 0 0 50px rgba(77,232,255,0.12)',
      '--glow-pink':      '0 0 16px rgba(0,136,204,0.5), 0 0 50px rgba(0,136,204,0.12)',
      '--glow-cyan':      '0 0 16px rgba(24,200,255,0.5), 0 0 50px rgba(24,200,255,0.12)',
    },
  },

  clu: {
    id: 'clu',
    name: 'CLU',
    hidden: true,
    preview: ['#FF6A00', '#FF8800', '#FFBB44', '#000000'],
    vars: {
      '--bg-base':        '#000000',
      '--bg-surface':     '#040200',
      '--bg-elevated':    '#080400',
      '--bg-card':        '#060300',
      '--bg-hover':       '#0E0800',
      '--accent':         '#FF6A00',
      '--accent-dim':     '#4A2000',
      '--accent-glow':    'rgba(255, 106, 0, 0.15)',
      '--accent-2':       '#FF8800',
      '--accent-3':       '#CC4400',
      '--accent-4':       '#FFBB44',
      '--accent-rgb':     '255, 106, 0',
      '--success':        '#FF8800',
      '--warning':        '#FFBB44',
      '--error':          '#FF2020',
      '--text-primary':   '#E8C8A0',
      '--text-secondary': '#685030',
      '--text-muted':     '#201008',
      '--border':         'rgba(255, 106, 0, 0.08)',
      '--border-hover':   'rgba(255, 106, 0, 0.22)',
      '--shadow-card':    '0 0 0 1px rgba(255,106,0,0.05), 0 0 40px rgba(0,0,0,0.98), inset 0 0 20px rgba(255,106,0,0.01)',
      '--glow-accent':    '0 0 16px rgba(255,106,0,0.5), 0 0 50px rgba(255,106,0,0.12)',
      '--glow-pink':      '0 0 16px rgba(255,136,0,0.5), 0 0 50px rgba(255,136,0,0.12)',
      '--glow-cyan':      '0 0 16px rgba(204,68,0,0.5), 0 0 50px rgba(204,68,0,0.12)',
    },
  },

  uofm: {
    id: 'uofm',
    name: 'U of M',
    hidden: true,
    preview: ['#FFCB05', '#1A6BB5', '#FFE566', '#001830'],
    vars: {
      '--bg-base':        '#001830',
      '--bg-surface':     '#002040',
      '--bg-elevated':    '#002E5A',
      '--bg-card':        '#00254D',
      '--bg-hover':       '#003870',
      '--accent':         '#FFCB05',
      '--accent-dim':     '#D4A800',
      '--accent-glow':    'rgba(255, 203, 5, 0.2)',
      '--accent-2':       '#1A6BB5',
      '--accent-3':       '#FFE566',
      '--accent-4':       '#80BFFF',
      '--accent-rgb':     '255, 203, 5',
      '--success':        '#FFCB05',
      '--warning':        '#FFE566',
      '--error':          '#FF6B6B',
      '--text-primary':   '#F0E8C8',
      '--text-secondary': '#B8A060',
      '--text-muted':     '#3A4A6A',
      '--border':         'rgba(255, 203, 5, 0.15)',
      '--border-hover':   'rgba(255, 203, 5, 0.35)',
      '--shadow-card':    '0 0 0 1px rgba(255,203,5,0.1), 0 8px 32px rgba(0,0,0,0.7)',
      '--glow-accent':    '0 0 12px rgba(255,203,5,0.6)',
      '--glow-pink':      '0 0 12px rgba(26,107,181,0.5)',
      '--glow-cyan':      '0 0 12px rgba(255,229,102,0.5)',
    },
  },

  msu: {
    id: 'msu',
    name: 'MSU',
    hidden: true,
    preview: ['#18BB6A', '#FFFFFF', '#50E890', '#0A1F1A'],
    vars: {
      '--bg-base':        '#0A1F1A',
      '--bg-surface':     '#0F2920',
      '--bg-elevated':    '#163826',
      '--bg-card':        '#122B22',
      '--bg-hover':       '#1D4030',
      '--accent':         '#18BB6A',
      '--accent-dim':     '#128A50',
      '--accent-glow':    'rgba(24, 187, 106, 0.2)',
      '--accent-2':       '#FFFFFF',
      '--accent-3':       '#50E890',
      '--accent-4':       '#D0F0E0',
      '--accent-rgb':     '24, 187, 106',
      '--success':        '#18BB6A',
      '--warning':        '#F0F0F0',
      '--error':          '#FF6B6B',
      '--text-primary':   '#FFFFFF',
      '--text-secondary': '#A0D8B8',
      '--text-muted':     '#2A5040',
      '--border':         'rgba(24, 187, 106, 0.12)',
      '--border-hover':   'rgba(255, 255, 255, 0.25)',
      '--shadow-card':    '0 0 0 1px rgba(24,187,106,0.1), 0 8px 32px rgba(0,0,0,0.6)',
      '--glow-accent':    '0 0 12px rgba(24,187,106,0.5)',
      '--glow-pink':      '0 0 12px rgba(255,255,255,0.4)',
      '--glow-cyan':      '0 0 12px rgba(80,232,144,0.5)',
    },
  },

  nmu: {
    id: 'nmu',
    name: 'NMU',
    hidden: true,
    preview: ['#F2A900', '#006341', '#FFD050', '#001008'],
    vars: {
      '--bg-base':        '#001008',
      '--bg-surface':     '#001C10',
      '--bg-elevated':    '#002818',
      '--bg-card':        '#001F14',
      '--bg-hover':       '#003520',
      '--accent':         '#F2A900',
      '--accent-dim':     '#C48800',
      '--accent-glow':    'rgba(242, 169, 0, 0.2)',
      '--accent-2':       '#006341',
      '--accent-3':       '#FFD050',
      '--accent-4':       '#00A060',
      '--accent-rgb':     '242, 169, 0',
      '--success':        '#00A060',
      '--warning':        '#F2A900',
      '--error':          '#FF6B6B',
      '--text-primary':   '#F5EDD0',
      '--text-secondary': '#B09050',
      '--text-muted':     '#2A4030',
      '--border':         'rgba(242, 169, 0, 0.15)',
      '--border-hover':   'rgba(242, 169, 0, 0.35)',
      '--shadow-card':    '0 0 0 1px rgba(242,169,0,0.1), 0 8px 32px rgba(0,0,0,0.7)',
      '--glow-accent':    '0 0 12px rgba(242,169,0,0.6)',
      '--glow-pink':      '0 0 12px rgba(0,99,65,0.5)',
      '--glow-cyan':      '0 0 12px rgba(255,208,80,0.5)',
    },
  },

  waynestate: {
    id: 'waynestate',
    name: 'Wayne St.',
    hidden: true,
    preview: ['#CFAA5E', '#0C5449', '#E8CC88', '#080E0D'],
    vars: {
      '--bg-base':        '#080E0D',
      '--bg-surface':     '#0D1916',
      '--bg-elevated':    '#14261F',
      '--bg-card':        '#10201A',
      '--bg-hover':       '#1A3028',
      '--accent':         '#CFAA5E',
      '--accent-dim':     '#A88840',
      '--accent-glow':    'rgba(207, 170, 94, 0.2)',
      '--accent-2':       '#0C5449',
      '--accent-3':       '#E8CC88',
      '--accent-4':       '#2A9070',
      '--accent-rgb':     '207, 170, 94',
      '--success':        '#2A9070',
      '--warning':        '#CFAA5E',
      '--error':          '#FF6B6B',
      '--text-primary':   '#F0EAD8',
      '--text-secondary': '#A89060',
      '--text-muted':     '#304840',
      '--border':         'rgba(207, 170, 94, 0.15)',
      '--border-hover':   'rgba(207, 170, 94, 0.35)',
      '--shadow-card':    '0 0 0 1px rgba(207,170,94,0.1), 0 8px 32px rgba(0,0,0,0.7)',
      '--glow-accent':    '0 0 12px rgba(207,170,94,0.5)',
      '--glow-pink':      '0 0 12px rgba(12,84,73,0.5)',
      '--glow-cyan':      '0 0 12px rgba(232,204,136,0.5)',
    },
  },
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [themeId, setThemeId] = useState(
    () => localStorage.getItem(STORAGE_KEY) || 'arcade'
  )
  const [fontId, setFontId] = useState(
    () => localStorage.getItem(FONT_KEY) || 'inter'
  )
  const [sizeId, setSizeId] = useState(detectDefaultSize)

  useEffect(() => {
    const theme = THEMES[themeId] || THEMES.arcade
    const root = document.documentElement
    for (const [prop, value] of Object.entries(theme.vars)) {
      root.style.setProperty(prop, value)
    }
    document.body.classList.toggle('theme-tron', themeId === 'tron' || themeId === 'clu')
    localStorage.setItem(STORAGE_KEY, themeId)
  }, [themeId])

  useEffect(() => {
    const font = FONTS[fontId] || FONTS.inter
    document.documentElement.style.setProperty('--ui-font', font.family)
    localStorage.setItem(FONT_KEY, fontId)
  }, [fontId])

  useEffect(() => {
    const size = SIZES[sizeId] || SIZES.m
    document.documentElement.style.setProperty('--font-scale', size.scale)
    localStorage.setItem(SIZE_KEY, sizeId)
  }, [sizeId])

  return (
    <ThemeContext.Provider value={{ themeId, setThemeId, fontId, setFontId, sizeId, setSizeId, themes: THEMES, fonts: FONTS, sizes: SIZES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
