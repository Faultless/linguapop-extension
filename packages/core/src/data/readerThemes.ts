import type { ReaderTheme } from './types'

export const BUILTIN_THEMES: ReaderTheme[] = [
  { id: 'paper',    name: 'Paper',     bg: '#fafaf6', fg: '#1c1917', accent: '#b45309', muted: '#78716c', dark: false },
  { id: 'sepia',    name: 'Sepia',     bg: '#f1e3c8', fg: '#3b2a14', accent: '#a16207', muted: '#7c5e3a', dark: false },
  { id: 'cream',    name: 'Cream',     bg: '#fff8e7', fg: '#2b1f0c', accent: '#d97706', muted: '#92744d', dark: false },
  { id: 'rose',     name: 'Rose',      bg: '#fff1f2', fg: '#3f0a17', accent: '#be123c', muted: '#8b3a4a', dark: false },
  { id: 'mint',     name: 'Mint',      bg: '#ecfdf5', fg: '#022c22', accent: '#047857', muted: '#3f6b5f', dark: false },
  { id: 'night',    name: 'Night',     bg: '#0c0a09', fg: '#e7e5e4', accent: '#fbbf24', muted: '#a8a29e', dark: true  },
  { id: 'midnight', name: 'Midnight',  bg: '#0f172a', fg: '#e2e8f0', accent: '#60a5fa', muted: '#94a3b8', dark: true  },
  { id: 'forest',   name: 'Forest',    bg: '#10241b', fg: '#d1fae5', accent: '#34d399', muted: '#86b4a3', dark: true  },
  { id: 'eink',     name: 'E-ink',     bg: '#f5f5f4', fg: '#0a0a0a', accent: '#171717', muted: '#525252', dark: false },
  { id: 'highc',    name: 'High Contrast', bg: '#000000', fg: '#ffffff', accent: '#ffff00', muted: '#a3a3a3', dark: true  },
  // Based on felipefdl/warm-burnout iTerm2 scheme: warm brown-black bg with honey-amber accent.
  { id: 'burnout',  name: 'Warm Burnout',  bg: '#1a1510', fg: '#bfbdb6', accent: '#f5c56e', muted: '#686868', dark: true  },
]

export const DEFAULT_THEME_ID = 'paper'
