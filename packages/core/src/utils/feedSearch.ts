import { corsFetch } from './corsFetch'
import type { FeedSearchResult } from '../data/types'

export async function searchFeeds(query: string, signal?: AbortSignal): Promise<FeedSearchResult[]> {
  const q = query.trim()
  if (!q) return []

  const opts: RequestInit | undefined = signal ? { signal } : undefined

  const [podcasts, radio] = await Promise.allSettled([
    searchItunes(q, opts),
    searchRadioBrowser(q, opts),
  ])

  return [
    ...(podcasts.status === 'fulfilled' ? podcasts.value : []),
    ...(radio.status === 'fulfilled' ? radio.value : []),
  ]
}

async function searchItunes(q: string, options?: RequestInit): Promise<FeedSearchResult[]> {
  const res = await corsFetch(
    `https://itunes.apple.com/search?media=podcast&term=${encodeURIComponent(q)}&limit=6`,
    options,
  )
  const json = await res.json()
  return (json.results ?? [])
    .filter((r: any) => r.feedUrl)
    .map((r: any): FeedSearchResult => ({
      title: r.collectionName ?? r.trackName ?? '',
      description: r.artistName ?? '',
      type: 'podcast',
      feedUrl: r.feedUrl,
      url: r.trackViewUrl ?? r.feedUrl,
      imageUrl: r.artworkUrl100 ?? undefined,
      language: r.languageCodesISO2A?.toLowerCase() ?? undefined,
    }))
}

async function searchRadioBrowser(q: string, options?: RequestInit): Promise<FeedSearchResult[]> {
  const res = await corsFetch(
    `https://de1.api.radio-browser.info/json/stations/search?name=${encodeURIComponent(q)}&limit=6&hidebroken=true&order=votes`,
    options,
  )
  const json = await res.json()
  return (json ?? [])
    .filter((r: any) => r.url_resolved)
    .map((r: any): FeedSearchResult => ({
      title: r.name,
      description: r.tags ?? '',
      type: 'radio',
      feedUrl: r.url_resolved,
      url: r.homepage || r.url_resolved,
      imageUrl: r.favicon || undefined,
      language:
        r.languagecodes?.split(',')[0]?.toLowerCase() ||
        r.language?.split(',')[0]?.trim().slice(0, 2)?.toLowerCase() ||
        undefined,
    }))
}
