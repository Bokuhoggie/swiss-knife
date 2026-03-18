import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'swiss-knife-theme'
const FONT_KEY = 'swiss-knife-font'

export const SIZES = {
  s:  { id: 's',  name: 'Small',  scale: 0.82 },
  m:  { id: 'm',  name: 'Medium', scale: 1.0  },
  l:  { id: 'l',  name: 'Large',  scale: 1.22 },
  xl: { id: 'xl', name: 'X-Large', scale: 1.48 },
}

const SIZE_KEY = 'swiss-knife-size'

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
    preview: ['#00FF87', '#FF3CAC', '#00D4FF', '#0A0A0C'],
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
      '--accent-3':       '#00D4FF',
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
      '--glow-cyan':      '0 0 12px rgba(0,212,255,0.5)',
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

  papyrus: {
    id: 'papyrus',
    name: 'Papyrus',
    preview: ['#16a34a', '#8b4513', '#b45309', '#f0e6d2'],
    vars: {
      '--bg-base':        '#f0e6d2',
      '--bg-surface':     '#ead5ba',
      '--bg-elevated':    '#e8d0b0',
      '--bg-card':        '#edd8bc',
      '--bg-hover':       '#d9c4a2',
      '--accent':         '#16a34a',
      '--accent-dim':     '#15803d',
      '--accent-glow':    'rgba(22, 163, 74, 0.2)',
      '--accent-2':       '#8b4513',
      '--accent-3':       '#b45309',
      '--accent-4':       '#22c55e',
      '--accent-rgb':     '22, 163, 74',
      '--success':        '#16a34a',
      '--warning':        '#b45309',
      '--error':          '#dc2626',
      '--text-primary':   '#1a0a00',
      '--text-secondary': '#4a3728',
      '--text-muted':     '#8b7355',
      '--border':         'rgba(22, 163, 74, 0.2)',
      '--border-hover':   'rgba(22, 163, 74, 0.4)',
      '--shadow-card':    '0 0 0 1px rgba(22,163,74,0.15), 0 4px 16px rgba(0,0,0,0.15)',
      '--glow-accent':    '0 0 12px rgba(22,163,74,0.4)',
      '--glow-pink':      '0 0 12px rgba(139,69,19,0.4)',
      '--glow-cyan':      '0 0 12px rgba(180,83,9,0.4)',
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
  const [sizeId, setSizeId] = useState(
    () => localStorage.getItem(SIZE_KEY) || 'm'
  )

  useEffect(() => {
    const theme = THEMES[themeId] || THEMES.arcade
    const root = document.documentElement
    for (const [prop, value] of Object.entries(theme.vars)) {
      root.style.setProperty(prop, value)
    }
    document.body.classList.toggle('theme-light', themeId === 'papyrus')
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
