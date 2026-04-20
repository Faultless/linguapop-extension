import { useAudio } from '../context/AudioContext'
import { LANG_MAP } from '../data/languages'

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]

function fmt(s: number) {
  if (!isFinite(s)) return '--:--'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function NowPlaying() {
  const { resource, track, isPlaying, isLoading, currentTime, duration, speed, togglePlay, seek, setSpeed, stop } = useAudio()

  if (!resource || !track) return null

  const lang = LANG_MAP[resource.language]
  const isStream = !isFinite(duration) || duration === 0

  return (
    <div className="border-t border-amber-100 bg-amber-50 px-3 py-2.5 shrink-0">
      {/* Top row: info + controls */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{lang?.flag ?? '🎵'}</span>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-stone-700 truncate">{track.title}</div>
          <div className="text-[10px] text-stone-400 truncate">{resource.name}</div>
        </div>

        {/* Speed */}
        <div className="flex gap-0.5">
          {SPEEDS.map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors ${speed === s ? 'bg-amber-400 text-white font-bold' : 'text-stone-400 hover:text-stone-600'}`}
            >
              {s}×
            </button>
          ))}
        </div>

        {/* Play/pause */}
        <button
          onClick={togglePlay}
          className="w-8 h-8 rounded-full bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center shrink-0 transition-colors"
        >
          {isLoading ? (
            <span className="text-xs animate-spin">◌</span>
          ) : isPlaying ? (
            <span className="text-xs">⏸</span>
          ) : (
            <span className="text-xs pl-0.5">▶</span>
          )}
        </button>

        {/* Stop */}
        <button onClick={stop} className="text-stone-300 hover:text-stone-500 text-xs transition-colors" title="Stop">✕</button>
      </div>

      {/* Progress bar */}
      {isStream ? (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-amber-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full animate-pulse w-full" />
          </div>
          <span className="text-[10px] text-stone-400 shrink-0">LIVE</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-stone-400 shrink-0 w-8 text-right">{fmt(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={1}
            value={currentTime}
            onChange={e => seek(+e.target.value)}
            className="flex-1 h-1 accent-amber-500 cursor-pointer"
          />
          <span className="text-[10px] text-stone-400 shrink-0 w-8">{fmt(duration)}</span>
        </div>
      )}
    </div>
  )
}
