import { useCallback, useEffect, useState } from 'react'
import { idb } from '../utils/idb'
import type { Chapter, NovelBody, NovelMeta } from '../data/types'

const META_KEY = 'linguapop_novels_meta'
const BODY_PREFIX = 'novel:'

function loadMeta(): NovelMeta[] {
  try {
    const raw = localStorage.getItem(META_KEY)
    return raw ? JSON.parse(raw) as NovelMeta[] : []
  } catch { return [] }
}

function saveMeta(metas: NovelMeta[]) {
  localStorage.setItem(META_KEY, JSON.stringify(metas))
}

export interface AddNovelInput {
  title: string
  author?: string
  coverUrl?: string
  sourceLanguage: string
  targetLanguage: string
  chapters: Chapter[]
  hasUserTranslation?: boolean
}

export function useNovels() {
  const [novels, setNovels] = useState<NovelMeta[]>(loadMeta)

  // Keep state in sync if another tab edits storage.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === META_KEY) setNovels(loadMeta())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const persist = useCallback((next: NovelMeta[]) => {
    saveMeta(next)
    setNovels(next)
  }, [])

  const add = useCallback(async (input: AddNovelInput): Promise<NovelMeta> => {
    const id = crypto.randomUUID()
    const meta: NovelMeta = {
      id,
      title: input.title || 'Untitled',
      author: input.author,
      coverUrl: input.coverUrl,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
      chapterCount: input.chapters.length,
      addedAt: Date.now(),
      lastReadChapter: 0,
      lastReadOffset: 0,
      hasUserTranslation: !!input.hasUserTranslation,
    }
    const body: NovelBody = { id, chapters: input.chapters }
    await idb.set(BODY_PREFIX + id, body)
    persist([meta, ...loadMeta()])
    return meta
  }, [persist])

  const remove = useCallback(async (id: string) => {
    await idb.del(BODY_PREFIX + id)
    persist(loadMeta().filter(n => n.id !== id))
  }, [persist])

  const updateMeta = useCallback((id: string, patch: Partial<NovelMeta>) => {
    const next = loadMeta().map(n => n.id === id ? { ...n, ...patch } : n)
    persist(next)
  }, [persist])

  const getBody = useCallback(async (id: string): Promise<NovelBody | undefined> => {
    return idb.get<NovelBody>(BODY_PREFIX + id)
  }, [])

  const updateChapter = useCallback(async (id: string, chapterIndex: number, patch: Partial<Chapter>) => {
    const body = await idb.get<NovelBody>(BODY_PREFIX + id)
    if (!body) return
    const chapters = body.chapters.map((c, i) => i === chapterIndex ? { ...c, ...patch } : c)
    await idb.set(BODY_PREFIX + id, { ...body, chapters })
  }, [])

  return { novels, add, remove, updateMeta, getBody, updateChapter }
}
