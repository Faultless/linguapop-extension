import { useState } from 'react'
import type { UserPrefs } from '../data/types'

const KEY = 'linguapop_prefs'

function load(): UserPrefs | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function save(p: UserPrefs) {
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function usePrefs() {
  const [prefs, setPrefs] = useState<UserPrefs | null>(load)

  const update = (p: UserPrefs) => {
    save(p)
    setPrefs(p)
  }

  const reset = () => {
    localStorage.removeItem(KEY)
    setPrefs(null)
  }

  return { prefs, update, reset }
}
