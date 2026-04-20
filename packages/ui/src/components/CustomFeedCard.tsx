import { LANG_MAP } from '@linguapop/core'
import type { CustomFeed } from '@linguapop/core'

export function CustomFeedCard({
  feed,
  onOpen,
  onRemove,
}: {
  feed: CustomFeed
  onOpen: () => void
  onRemove: () => void
}) {
  const lang = LANG_MAP[feed.language]

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-all p-4 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${feed.type === 'youtube' ? 'bg-red-100 text-red-700' : 'bg-violet-100 text-violet-700'}`}>
              {feed.type === 'youtube' ? '▶ youtube' : '🎙 podcast'}
            </span>
            {lang && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${lang.color}`}>
                {lang.flag} {lang.name}
              </span>
            )}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              My Feed
            </span>
          </div>
          <h3 className="text-sm font-bold text-stone-800 leading-snug">{feed.title}</h3>
        </div>
        <button
          onClick={onRemove}
          title="Remove feed"
          className="shrink-0 text-lg leading-none text-stone-300 hover:text-red-400 transition-colors"
        >
          ×
        </button>
      </div>

      {feed.description && (
        <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">{feed.description}</p>
      )}

      <div className="flex items-center gap-2">
        <div className="flex-1" />
        <button
          onClick={onOpen}
          className="text-xs font-semibold px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors"
        >
          {feed.type === 'youtube' ? '▶ Videos' : '🎙 Episodes'}
        </button>
        <a
          href={feed.url}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors"
        >
          Open →
        </a>
      </div>
    </div>
  )
}
