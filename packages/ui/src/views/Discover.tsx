import { useState, useMemo, useEffect } from 'react'
import { RESOURCES, LANG_MAP, searchFeeds, resolveAndParseFeed } from '@linguapop/core'
import { ResourceCard } from '../components/ResourceCard'
import { CustomFeedCard } from '../components/CustomFeedCard'
import type { UserPrefs, ResourceType, CustomFeed, Resource, FeedSearchResult } from '@linguapop/core'

const TYPES: { id: ResourceType | 'all'; label: string; icon: string }[] = [
  { id: 'all',       label: 'All',       icon: '✦' },
  { id: 'radio',     label: 'Radio',     icon: '📻' },
  { id: 'podcast',   label: 'Podcast',   icon: '🎙' },
  { id: 'youtube',   label: 'YouTube',   icon: '▶' },
  { id: 'website',   label: 'Website',   icon: '🌐' },
]

function pickLang(detected: string | undefined, prefs: UserPrefs): string {
  if (detected && prefs.languages.some(l => l.code === detected)) return detected
  return prefs.languages[0]?.code ?? 'fr'
}

export function Discover({
  prefs,
  saved,
  onSave,
  onOpenPodcast,
  customFeeds,
  onAddFeed,
  onRemoveFeed,
  onOpenCustomFeed,
  onAddDirectFeed,
}: {
  prefs: UserPrefs
  saved: Set<string>
  onSave: (id: string) => void
  onOpenPodcast: (r: Resource) => void
  customFeeds: CustomFeed[]
  onAddFeed: () => void
  onRemoveFeed: (id: string) => void
  onOpenCustomFeed: (feed: CustomFeed) => void
  onAddDirectFeed: (feed: CustomFeed) => void
}) {
  const [activeLang, setActiveLang] = useState<string>('all')
  const [activeType, setActiveType] = useState<ResourceType | 'all'>('all')
  const [search, setSearch] = useState('')
  const [externalResults, setExternalResults] = useState<FeedSearchResult[]>([])
  const [externalLoading, setExternalLoading] = useState(false)
  const [addingFeedUrl, setAddingFeedUrl] = useState<string | null>(null)

  const userLangCodes = prefs.languages.map(l => l.code)

  useEffect(() => {
    const q = search.trim()
    if (!q) {
      setExternalResults([])
      setExternalLoading(false)
      return
    }

    setExternalLoading(true)
    const controller = new AbortController()
    let cancelled = false

    const timer = setTimeout(async () => {
      try {
        const results = await searchFeeds(q, controller.signal)
        if (!cancelled) { setExternalResults(results); setExternalLoading(false) }
      } catch {
        if (!cancelled) { setExternalResults([]); setExternalLoading(false) }
      }
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
      controller.abort()
    }
  }, [search])

  async function handleAddResult(result: FeedSearchResult) {
    setAddingFeedUrl(result.feedUrl)
    try {
      let feed: CustomFeed
      if (result.type === 'radio') {
        feed = {
          id: 'custom_' + Date.now().toString(36),
          url: result.url,
          feedUrl: result.feedUrl,
          title: result.title,
          description: result.description,
          language: pickLang(result.language, prefs),
          type: 'radio',
          imageUrl: result.imageUrl,
          addedAt: Date.now(),
        }
      } else {
        const { feed: feedData } = await resolveAndParseFeed(result.feedUrl)
        feed = {
          id: 'custom_' + Date.now().toString(36),
          language: pickLang(result.language, prefs),
          addedAt: Date.now(),
          ...feedData,
        }
      }
      onAddDirectFeed(feed)
    } catch {
      // network errors are ignored; button returns to normal state
    } finally {
      setAddingFeedUrl(null)
    }
  }

  const filteredFeeds = useMemo(() => {
    return customFeeds
      .filter(f => activeLang === 'all' || f.language === activeLang)
      .filter(f => activeType === 'all' || f.type === activeType)
      .filter(f => {
        if (!search) return true
        const q = search.toLowerCase()
        return f.title.toLowerCase().includes(q) || f.description.toLowerCase().includes(q)
      })
  }, [customFeeds, activeLang, activeType, search])

  const filtered = useMemo(() => {
    const langPrefs = prefs.languages
    return RESOURCES
      .filter(r => userLangCodes.includes(r.language))
      .filter(r => activeLang === 'all' || r.language === activeLang)
      .filter(r => activeType === 'all' || r.type === activeType)
      .filter(r => {
        if (!search) return true
        const q = search.toLowerCase()
        return r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const score = (r: typeof a) => {
          const lp = langPrefs.find(l => l.code === r.language)
          const levelMatch = lp && r.levels.includes(lp.level) ? 2 : 0
          const interestMatch = r.interests.filter(i => prefs.interests.includes(i)).length
          return levelMatch + interestMatch
        }
        return score(b) - score(a)
      })
  }, [prefs, activeLang, activeType, search, userLangCodes])

  const showEmptyState =
    filtered.length === 0 &&
    filteredFeeds.length === 0 &&
    externalResults.length === 0 &&
    !externalLoading

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <input
          className="w-full bg-stone-100 rounded-xl px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 outline-none focus:ring-2 focus:ring-amber-300 transition"
          placeholder="Search resources…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Language filter */}
      <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveLang('all')}
          className={`shrink-0 text-xs px-2.5 py-1 rounded-full border transition-all ${activeLang === 'all' ? 'bg-stone-800 text-white border-stone-800' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'}`}
        >
          All
        </button>
        {prefs.languages.map(({ code }) => {
          const lang = LANG_MAP[code]
          return (
            <button
              key={code}
              onClick={() => setActiveLang(activeLang === code ? 'all' : code)}
              className={`shrink-0 text-xs px-2.5 py-1 rounded-full border transition-all ${activeLang === code ? `${lang.color} border-transparent font-semibold` : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'}`}
            >
              {lang.flag} {lang.name}
            </button>
          )
        })}
      </div>

      {/* Type filter */}
      <div className="flex gap-1 px-4 pb-3">
        {TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveType(t.id)}
            className={`flex-1 text-[11px] py-1 rounded-lg border transition-all ${activeType === t.id ? 'bg-amber-500 text-white border-amber-500 font-semibold' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-300'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-3">
        {/* Add feed button */}
        <button
          onClick={onAddFeed}
          className="w-full py-2.5 border-2 border-dashed border-stone-300 hover:border-amber-400 rounded-2xl text-sm text-stone-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span> Add your own feed
        </button>

        {/* Custom feeds */}
        {filteredFeeds.map(feed => (
          <CustomFeedCard
            key={feed.id}
            feed={feed}
            onOpen={() => onOpenCustomFeed(feed)}
            onRemove={() => onRemoveFeed(feed.id)}
          />
        ))}

        {/* External search results */}
        {search.trim() && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                Find online
              </span>
              {externalLoading && (
                <span className="text-[10px] text-stone-400 animate-pulse">Searching…</span>
              )}
            </div>
            {externalResults.map(result => {
              const alreadyAdded = customFeeds.some(f => f.feedUrl === result.feedUrl)
              const isAdding = addingFeedUrl === result.feedUrl
              return (
                <div key={result.feedUrl} className="bg-white rounded-xl border border-stone-100 shadow-sm px-3 py-2.5 flex items-center gap-2.5">
                  {result.imageUrl ? (
                    <img src={result.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center text-base shrink-0">
                      {result.type === 'radio' ? '📻' : '🎙'}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-stone-800 truncate">{result.title}</div>
                    {result.description && (
                      <div className="text-[10px] text-stone-400 truncate">{result.description}</div>
                    )}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${result.type === 'radio' ? 'bg-sky-100 text-sky-600' : 'bg-violet-100 text-violet-600'}`}>
                      {result.type}
                    </span>
                  </div>
                  <button
                    onClick={() => { if (!alreadyAdded && !isAdding) handleAddResult(result) }}
                    disabled={alreadyAdded || isAdding}
                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      alreadyAdded
                        ? 'bg-green-100 text-green-600 cursor-default'
                        : isAdding
                          ? 'bg-stone-100 text-stone-400 cursor-wait'
                          : 'bg-amber-100 text-amber-600 hover:bg-amber-500 hover:text-white'
                    }`}
                  >
                    {alreadyAdded ? '✓' : isAdding ? <span className="animate-spin inline-block text-xs">◌</span> : '+'}
                  </button>
                </div>
              )
            })}
            {!externalLoading && search.trim().length >= 2 && externalResults.length === 0 && (
              <div className="text-xs text-stone-400 text-center py-2">No results found online</div>
            )}
          </div>
        )}

        {/* Curated resources */}
        {showEmptyState ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            <div className="text-3xl mb-2">🔍</div>
            No resources found
          </div>
        ) : (
          filtered.map(r => (
            <ResourceCard
              key={r.id}
              resource={r}
              saved={saved.has(r.id)}
              onSave={() => onSave(r.id)}
              onOpenPodcast={onOpenPodcast}
            />
          ))
        )}
      </div>
    </div>
  )
}
