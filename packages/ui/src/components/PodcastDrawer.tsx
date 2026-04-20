import { useState, useEffect, useMemo } from 'react'
import type { Resource, Episode } from '@linguapop/core'
import { useAudio } from '@linguapop/core'
import { corsFetch } from '@linguapop/core'

const PAGE_SIZE = 30

async function parseRss(feedUrl: string): Promise<Episode[]> {
  const res = await corsFetch(feedUrl)
  const text = await res.text()
  const doc = new DOMParser().parseFromString(text, 'text/xml')
  return [...doc.querySelectorAll('item')].map(item => ({
    title: item.querySelector('title')?.textContent?.trim() ?? 'Untitled',
    url: item.querySelector('enclosure')?.getAttribute('url') ?? '',
    pubDate: item.querySelector('pubDate')?.textContent?.trim() ?? '',
    duration: item.querySelector('itunes\\:duration, duration')?.textContent?.trim() ?? '',
    description: item.querySelector('description')?.textContent?.replace(/<[^>]+>/g, '').trim().slice(0, 120) ?? '',
  })).filter(e => e.url)
}

function fmtDate(raw: string) {
  try { return new Date(raw).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) }
  catch { return raw }
}

type SortDir = 'desc' | 'asc'

export function PodcastDrawer({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  const { play, track: nowTrack } = useAudio()
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    if (!resource.feedUrl) return
    setLoading(true); setError('')
    parseRss(resource.feedUrl)
      .then(eps => { setEpisodes(eps); setLoading(false) })
      .catch(() => { setError('Could not load episodes. The feed may be unavailable.'); setLoading(false) })
  }, [resource.feedUrl])

  const sorted = useMemo(() => {
    const sorted = [...episodes]
    if (sortDir === 'asc') sorted.reverse()
    return sorted
  }, [episodes, sortDir])

  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  return (
    <div className="absolute inset-0 bg-stone-50 z-10 flex flex-col" style={{ top: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-200 bg-white shrink-0">
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-lg leading-none">←</button>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-stone-800 truncate">{resource.name}</div>
          <div className="text-[10px] text-stone-400">{episodes.length ? `${episodes.length} episodes` : 'Podcast'}</div>
        </div>
        {episodes.length > 0 && (
          <button
            onClick={() => { setSortDir(d => d === 'desc' ? 'asc' : 'desc'); setVisibleCount(PAGE_SIZE) }}
            className="text-[10px] font-semibold px-2 py-1 rounded-lg border border-stone-200 bg-white text-stone-500 hover:border-stone-300 transition-colors shrink-0"
            title={sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
          >
            {sortDir === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </button>
        )}
      </div>

      {/* Episode list */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-2xl animate-spin">◌</div>
            <span className="text-sm text-stone-400">Loading episodes…</span>
          </div>
        )}
        {error && (
          <div className="p-6 text-center">
            <div className="text-3xl mb-2">📡</div>
            <p className="text-sm text-stone-500">{error}</p>
            <a href={resource.url} target="_blank" rel="noreferrer"
              className="mt-3 inline-block text-xs text-amber-600 hover:underline">
              Open website instead →
            </a>
          </div>
        )}
        {!loading && !error && visible.map((ep, i) => {
          const isNow = nowTrack?.url === ep.url
          return (
            <button
              key={i}
              onClick={() => play(resource, { url: ep.url, title: ep.title })}
              className={`w-full text-left px-4 py-3 border-b border-stone-100 hover:bg-amber-50 transition-colors flex gap-3 items-start ${isNow ? 'bg-amber-50' : ''}`}
            >
              <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs mt-0.5 ${isNow ? 'bg-amber-400 text-white' : 'bg-stone-100 text-stone-400'}`}>
                {isNow ? '▶' : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-xs font-semibold leading-snug ${isNow ? 'text-amber-700' : 'text-stone-700'}`}>{ep.title}</div>
                {ep.description && <div className="text-[10px] text-stone-400 mt-0.5 line-clamp-2">{ep.description}</div>}
                <div className="flex gap-2 mt-1 text-[10px] text-stone-400">
                  {ep.pubDate && <span>{fmtDate(ep.pubDate)}</span>}
                  {ep.duration && <span>· {ep.duration}</span>}
                </div>
              </div>
            </button>
          )
        })}
        {!loading && !error && hasMore && (
          <button
            onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
            className="w-full py-3 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition-colors border-b border-stone-100"
          >
            Load more ({sorted.length - visibleCount} remaining)
          </button>
        )}
      </div>
    </div>
  )
}
