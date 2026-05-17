import { useState } from 'react'
import { useReaderPrefs } from '@linguapop/core'
import type { NovelMeta } from '@linguapop/core'
import { NovelCard } from '../components/NovelCard'

export function Library({
  novels,
  onOpen,
  onRemove,
  onAddClick,
  onSettingsClick,
}: {
  novels: NovelMeta[]
  onOpen: (n: NovelMeta) => void
  onRemove: (id: string) => void
  onAddClick: () => void
  onSettingsClick: () => void
}) {
  const { theme } = useReaderPrefs()
  const [query, setQuery] = useState('')
  const filtered = query.trim()
    ? novels.filter(n =>
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.author?.toLowerCase().includes(query.toLowerCase()))
    : novels

  const cardBg = theme.dark ? theme.fg + '0a' : '#ffffff'
  const inputBg = theme.dark ? theme.fg + '0d' : '#ffffff'
  const borderColor = theme.muted + '40'

  return (
    <div className="flex flex-col h-full" style={{ background: theme.bg, color: theme.fg }}>
      {/* Header */}
      <div
        className="flex items-center px-4 pt-4 pb-3 border-b shrink-0"
        style={{ borderColor }}
      >
        <span className="text-lg font-bold tracking-tight" style={{ color: theme.accent }}>
          📖 LinguaPop
        </span>
        <button
          onClick={onSettingsClick}
          className="ml-auto w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
          style={{ background: theme.muted + '20', color: theme.fg }}
          title="Reader settings"
        >
          ⚙
        </button>
      </div>

      {/* Search + import */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2 shrink-0">
        <input
          className="flex-1 rounded-xl px-3 py-2 text-sm outline-none transition-all"
          placeholder="Search your library…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ background: inputBg, color: theme.fg, border: `1px solid ${borderColor}` }}
        />
        <button
          onClick={onAddClick}
          className="shrink-0 px-3 py-2 text-sm font-semibold rounded-xl transition-colors"
          style={{ background: theme.accent, color: '#fff' }}
        >
          + Import
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: theme.muted }}>
            <div className="text-4xl mb-3">📚</div>
            <p className="text-sm font-medium">
              {novels.length === 0 ? 'No novels yet' : 'Nothing matches'}
            </p>
            {novels.length === 0 && (
              <p className="text-xs mt-1 opacity-70">Tap + Import to add a visual novel, ebook, or pasted chapter.</p>
            )}
          </div>
        ) : (
          filtered.map(n => (
            <NovelCard
              key={n.id}
              novel={n}
              onOpen={() => onOpen(n)}
              onRemove={() => { if (confirm(`Remove "${n.title}" from your library?`)) onRemove(n.id) }}
              cardBg={cardBg}
              borderColor={borderColor}
            />
          ))
        )}
      </div>
    </div>
  )
}
