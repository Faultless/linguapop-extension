import { useAudio } from '@linguapop/core'
import { LANG_MAP } from '@linguapop/core'
import type { Resource } from '@linguapop/core'

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
  onOpenPodcast,
}: {
  resource: Resource
  saved: boolean
  onSave: () => void
  onOpenPodcast?: (r: Resource) => void
}) {
  const { play, togglePlay, stop, resource: nowResource, isPlaying } = useAudio()
  const lang = LANG_MAP[resource.language]

  const isNowPlaying = nowResource?.id === resource.id

  const handlePlayRadio = () => {
    if (!resource.streamUrl) return
    if (isNowPlaying) { togglePlay(); return }
    play(resource, { url: resource.streamUrl, title: 'Live Stream' })
  }

  const handlePlayPodcast = () => {
    if (isNowPlaying) { stop(); return }
    onOpenPodcast?.(resource)
  }

  const canPlayRadio = resource.type === 'radio' && !!resource.streamUrl
  const canPlayPodcast = resource.type === 'podcast' && !!resource.feedUrl

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all p-4 flex flex-col gap-3 ${isNowPlaying ? 'border-amber-300 ring-1 ring-amber-200' : 'border-stone-100'}`}>
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

      <p className="text-xs text-stone-500 leading-relaxed">{resource.description}</p>

      {/* Level badges + actions */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-wrap flex-1">
          {resource.levels.map(lv => (
            <span key={lv} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 capitalize">
              {lv}
            </span>
          ))}
        </div>
        <div className="flex gap-1.5 shrink-0">
          {canPlayRadio && (
            <button
              onClick={handlePlayRadio}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${isNowPlaying ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-amber-500 hover:bg-amber-400 text-white'}`}
            >
              {isNowPlaying && isPlaying ? '⏸ Live' : '▶ Live'}
            </button>
          )}
          {canPlayPodcast && (
            <button
              onClick={handlePlayPodcast}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${isNowPlaying ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-amber-500 hover:bg-amber-400 text-white'}`}
            >
              {isNowPlaying ? '⏹ Stop' : '🎙 Episodes'}
            </button>
          )}
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors"
          >
            Open →
          </a>
        </div>
      </div>
    </div>
  )
}
