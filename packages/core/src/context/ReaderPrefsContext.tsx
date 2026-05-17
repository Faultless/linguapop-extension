import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { BUILTIN_THEMES, DEFAULT_THEME_ID } from '../data/readerThemes'
import type { ReaderPrefs, ReaderTheme } from '../data/types'

const KEY = 'linguapop_reader_prefs'

const DEFAULTS: ReaderPrefs = {
  fontFamily: 'serif',
  fontSize: 18,
  lineHeight: 1.7,
  letterSpacing: 0,
  paragraphSpacing: 1,
  maxWidth: 680,
  themeId: DEFAULT_THEME_ID,
  customThemes: [],
  layout: 'scroll',
  viewMode: 'original',
  tapToTranslate: true,
  showRubies: true,
  autoCacheTranslations: true,
  ttsRate: 1,
  coloriseJapanese: true,
}

function load(): ReaderPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULTS
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { return DEFAULTS }
}

function persist(p: ReaderPrefs) {
  localStorage.setItem(KEY, JSON.stringify(p))
}

interface ReaderPrefsState {
  prefs: ReaderPrefs
  /** Currently selected theme (built-in or custom). Falls back to the default if missing. */
  theme: ReaderTheme
  update: (patch: Partial<ReaderPrefs>) => void
  addCustomTheme: (theme: ReaderTheme) => void
  removeCustomTheme: (id: string) => void
}

const Ctx = createContext<ReaderPrefsState | null>(null)

export function ReaderPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<ReaderPrefs>(load)

  const value = useMemo<ReaderPrefsState>(() => {
    const theme =
      [...BUILTIN_THEMES, ...prefs.customThemes].find(t => t.id === prefs.themeId) ||
      BUILTIN_THEMES.find(t => t.id === DEFAULT_THEME_ID) ||
      BUILTIN_THEMES[0]

    const update = (patch: Partial<ReaderPrefs>) => {
      setPrefs(prev => {
        const next = { ...prev, ...patch }
        persist(next)
        return next
      })
    }

    const addCustomTheme = (t: ReaderTheme) => {
      setPrefs(prev => {
        const next: ReaderPrefs = {
          ...prev,
          customThemes: [
            ...prev.customThemes.filter((x: ReaderTheme) => x.id !== t.id),
            { ...t, custom: true },
          ],
        }
        persist(next)
        return next
      })
    }

    const removeCustomTheme = (id: string) => {
      setPrefs(prev => {
        const next: ReaderPrefs = {
          ...prev,
          customThemes: prev.customThemes.filter((x: ReaderTheme) => x.id !== id),
          themeId: prev.themeId === id ? DEFAULT_THEME_ID : prev.themeId,
        }
        persist(next)
        return next
      })
    }

    return { prefs, theme, update, addCustomTheme, removeCustomTheme }
  }, [prefs])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useReaderPrefs(): ReaderPrefsState {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useReaderPrefs must be used inside <ReaderPrefsProvider>')
  return ctx
}
