import { useState } from 'react'

const KEY = 'linguapop_saved'

function load(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch { return new Set() }
}

export function useSaved() {
  const [saved, setSaved] = useState<Set<string>>(load)

  const toggle = (id: string) => {
    setSaved(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      localStorage.setItem(KEY, JSON.stringify([...next]))
      return next
    })
  }

  return { saved, toggle }
}
