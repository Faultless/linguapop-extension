import { useState, useMemo } from 'react'
import { RESOURCES } from '../data/resources'
import { LANG_MAP } from '../data/languages'
import { ResourceCard } from '../components/ResourceCard'
import type { UserPrefs, ResourceType } from '../data/types'

const TYPES: { id: ResourceType | 'all'; label: string; icon: string }[] = [
  { id: 'all',       label: 'All',       icon: '✦' },
  { id: 'radio',     label: 'Radio',     icon: '📻' },
  { id: 'podcast',   label: 'Podcast',   icon: '🎙' },
  { id: 'youtube',   label: 'YouTube',   icon: '▶' },
  { id: 'website',   label: 'Website',   icon: '🌐' },
]

export function Discover({
  prefs,
  saved,
  onSave,
}: {
  prefs: UserPrefs
  saved: Set<string>
  onSave: (id: string) => void
}) {
  const [activeLang, setActiveLang] = useState<string>('all')
  const [activeType, setActiveType] = useState<ResourceType | 'all'>('all')
  const [search, setSearch] = useState('')

  const userLangCodes = prefs.languages.map(l => l.code)

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
        // Boost resources that match the user's level and interests
        const score = (r: typeof a) => {
          const lp = langPrefs.find(l => l.code === r.language)
          const levelMatch = lp && r.levels.includes(lp.level) ? 2 : 0
          const interestMatch = r.interests.filter(i => prefs.interests.includes(i)).length
          return levelMatch + interestMatch
        }
        return score(b) - score(a)
      })
  }, [prefs, activeLang, activeType, search, userLangCodes])

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
        {filtered.length === 0 ? (
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
            />
          ))
        )}
      </div>
    </div>
  )
}
