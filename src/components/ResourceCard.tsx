import { LANG_MAP } from '../data/languages'
import type { Resource } from '../data/types'

const TYPE_STYLE: Record<string, string> = {
  radio:       'bg-sky-100 text-sky-700',
  podcast:     'bg-violet-100 text-violet-700',
  youtube:     'bg-red-100 text-red-700',
  website:     'bg-emerald-100 text-emerald-700',
  newsletter:  'bg-orange-100 text-orange-700',
}

const TYPE_ICON: Record<string, string> = {
  radio: '📻', podcast: '🎙', youtube: '▶', website: '🌐', newsletter: '✉',
}

export function ResourceCard({
  resource,
  saved,
  onSave,
}: {
  resource: Resource
  saved: boolean
  onSave: () => void
}) {
  const lang = LANG_MAP[resource.language]

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_STYLE[resource.type]}`}>
              {TYPE_ICON[resource.type]} {resource.type}
            </span>
            {lang && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${lang.color}`}>
                {lang.flag} {lang.name}
              </span>
            )}
            {!resource.free && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-500">
                💳 Paid
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-stone-800 leading-snug">{resource.name}</h3>
        </div>
        <button
          onClick={onSave}
          title={saved ? 'Remove from saved' : 'Save'}
          className="shrink-0 text-lg leading-none transition-transform hover:scale-110 active:scale-95"
        >
          {saved ? '🔖' : '🤍'}
        </button>
      </div>

      {/* Description */}
      <p className="text-xs text-stone-500 leading-relaxed">{resource.description}</p>

      {/* Level badges + open */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-wrap flex-1">
          {resource.levels.map(lv => (
            <span key={lv} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 capitalize">
              {lv}
            </span>
          ))}
        </div>
        <a
          href={resource.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs font-semibold px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded-lg transition-colors"
        >
          Open →
        </a>
      </div>
    </div>
  )
}
