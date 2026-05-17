import { idb } from './idb'
import { corsFetch } from './corsFetch'
import type { JlptLevel } from '../data/jlptVocab'

/**
 * Live dictionary lookup for words that aren't in the bundled JLPT starter set.
 *
 * Source: Jisho.org's public search API (JMdict-derived, CC-BY-SA). The
 * response is normalized into a small shape we render in the popover, and
 * cached per-query in IndexedDB so re-tapping the same word is instant and
 * works offline after first use.
 *
 * Routing: goes through `corsFetch`, which uses the dev Vite proxy in dev,
 * direct fetch on extension/mobile, and the configured prod proxy on the web
 * build. Jisho's API generally allows CORS but the proxy ensures consistent
 * behavior in restricted environments.
 */

export interface DictSense {
  partsOfSpeech: string[]
  definitions: string[]
  tags: string[]
}

export interface DictEntry {
  /** Canonical headword (kanji surface if present, else kana). */
  word: string
  /** Kana reading(s). */
  readings: string[]
  isCommon: boolean
  jlptLevel?: JlptLevel
  senses: DictSense[]
}

export interface DictResult {
  /** The query that was sent to the dictionary. */
  query: string
  entries: DictEntry[]
  /** Time of fetch. */
  fetchedAt: number
}

const CACHE_PREFIX = 'jpdict:'
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

/**
 * Returns dictionary entries for the given query.
 * - If `fallbackQuery` is provided and the primary query returns no entries,
 *   retries with the fallback (e.g. base form first, surface form second).
 * - Cache key includes the query string only; identical queries reuse data.
 */
export async function lookupWord(query: string, fallbackQuery?: string): Promise<DictResult> {
  const primary = await lookupOne(query)
  if (primary.entries.length > 0) return primary
  if (fallbackQuery && fallbackQuery !== query) {
    return lookupOne(fallbackQuery)
  }
  return primary
}

async function lookupOne(query: string): Promise<DictResult> {
  const trimmed = query.trim()
  if (!trimmed) return { query: trimmed, entries: [], fetchedAt: Date.now() }

  const cacheKey = CACHE_PREFIX + trimmed
  const cached = await idb.get<DictResult>(cacheKey).catch(() => undefined)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached
  }

  const fresh = await fetchFromJisho(trimmed)
  // Only cache non-empty results, so transient network failures don't poison
  // the cache with empty entries.
  if (fresh.entries.length > 0) {
    await idb.set(cacheKey, fresh).catch(() => undefined)
  }
  return fresh
}

interface JishoApiResponse {
  meta?: { status: number }
  data?: Array<{
    slug: string
    is_common?: boolean
    tags?: string[]
    jlpt?: string[]
    japanese: Array<{ word?: string; reading?: string }>
    senses: Array<{
      parts_of_speech?: string[]
      english_definitions?: string[]
      tags?: string[]
    }>
  }>
}

async function fetchFromJisho(query: string): Promise<DictResult> {
  const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(query)}`
  const res = await corsFetch(url)
  if (!res.ok) throw new Error(`Dictionary lookup failed (HTTP ${res.status})`)
  const data = await res.json() as JishoApiResponse
  const entries: DictEntry[] = (data.data || [])
    .slice(0, 6) // cap entries per word — most popovers show 1–3
    .map(d => ({
      word: d.japanese[0]?.word || d.japanese[0]?.reading || d.slug,
      readings: Array.from(new Set(d.japanese.map(j => j.reading).filter((r): r is string => !!r))),
      isCommon: !!d.is_common,
      jlptLevel: parseJlptLevel(d.jlpt),
      senses: (d.senses || []).slice(0, 5).map(s => ({
        partsOfSpeech: s.parts_of_speech || [],
        definitions: s.english_definitions || [],
        tags: s.tags || [],
      })).filter(s => s.definitions.length > 0),
    }))
    .filter(e => e.senses.length > 0)
  return { query, entries, fetchedAt: Date.now() }
}

function parseJlptLevel(tags?: string[]): JlptLevel | undefined {
  if (!tags) return undefined
  // Jisho returns ["jlpt-n5", "jlpt-n4", ...] — take the easiest one if multiple are tagged.
  let best: JlptLevel | undefined
  for (const t of tags) {
    const m = /jlpt-n([1-5])/i.exec(t)
    if (m) {
      const lvl = Number(m[1]) as JlptLevel
      if (best === undefined || lvl > best) best = lvl
    }
  }
  return best
}
