import { LANG_MAP, useReaderPrefs } from '@linguapop/core'
import type { NovelMeta } from '@linguapop/core'

export function NovelCard({
  novel,
  onOpen,
  onRemove,
  cardBg,
  borderColor,
}: {
  novel: NovelMeta
  onOpen: () => void
  onRemove: () => void
  cardBg?: string
  borderColor?: string
}) {
  const { theme } = useReaderPrefs()
  const src = LANG_MAP[novel.sourceLanguage]
  const tgt = LANG_MAP[novel.targetLanguage]
  const progress = novel.chapterCount
    ? Math.min(100, Math.round(((novel.lastReadChapter + 1) / novel.chapterCount) * 100))
    : 0

  const bg = cardBg ?? (theme.dark ? theme.fg + '0a' : '#ffffff')
  const border = borderColor ?? theme.muted + '40'
  const progressTrack = theme.muted + '30'

  return (
    <div
      className="rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden flex"
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <button onClick={onOpen} className="flex items-stretch gap-3 flex-1 text-left p-3 min-w-0">
        <div
          className="w-14 h-20 shrink-0 rounded-lg overflow-hidden flex items-center justify-center text-2xl"
          style={{ background: theme.accent + '33' }}
        >
          {novel.coverUrl
            ? <img src={novel.coverUrl} alt="" className="w-full h-full object-cover" />
            : <span>📖</span>}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {src && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${src.color}`}>{src.flag}</span>}
            <span className="text-[10px]" style={{ color: theme.muted }}>→</span>
            {tgt && <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${tgt.color}`}>{tgt.flag}</span>}
            {novel.hasUserTranslation && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">dual</span>
            )}
          </div>
          <h3 className="text-sm font-bold leading-snug line-clamp-2" style={{ color: theme.fg }}>{novel.title}</h3>
          {novel.author && <p className="text-xs mt-0.5 truncate" style={{ color: theme.muted }}>{novel.author}</p>}
          <div className="mt-auto flex items-center gap-2 text-[10px]" style={{ color: theme.muted }}>
            <span>{novel.chapterCount} ch.</span>
            {progress > 0 && (
              <>
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: progressTrack }}>
                  <div className="h-full" style={{ width: `${progress}%`, background: theme.accent }} />
                </div>
                <span>{progress}%</span>
              </>
            )}
          </div>
        </div>
      </button>
      <button
        onClick={onRemove}
        title="Remove from library"
        className="px-3 text-lg hover:text-red-500 transition-colors"
        style={{ color: theme.muted }}
      >
        ×
      </button>
    </div>
  )
}
