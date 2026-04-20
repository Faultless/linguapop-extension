import { useState } from 'react'
import type { CustomFeed } from '../data/types'

const KEY = 'linguapop_custom_feeds'

function load(): CustomFeed[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function save(feeds: CustomFeed[]) {
  localStorage.setItem(KEY, JSON.stringify(feeds))
}

export function useCustomFeeds() {
  const [feeds, setFeeds] = useState<CustomFeed[]>(load)

  const add = (feed: CustomFeed) => {
    const next = [feed, ...feeds.filter(f => f.id !== feed.id)]
    save(next)
    setFeeds(next)
  }

  const remove = (id: string) => {
    const next = feeds.filter(f => f.id !== id)
    save(next)
    setFeeds(next)
  }

  return { feeds, add, remove }
}
