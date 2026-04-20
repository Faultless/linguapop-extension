import { LANGUAGES } from '../data/languages'
import type { UserPrefs, Level, Interest } from '../data/types'

const INTERESTS: { id: Interest; label: string; emoji: string }[] = [
  { id: 'news', label: 'News', emoji: '📰' },
  { id: 'culture', label: 'Culture', emoji: '🎭' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'stories', label: 'Stories', emoji: '📖' },
  { id: 'science', label: 'Science', emoji: '🔬' },
  { id: 'business', label: 'Business', emoji: '💼' },
  { id: 'kids', label: 'Kids', emoji: '🧸' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬' },
]

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']

export function Settings({
  prefs,
  onUpdate,
  onReset,
}: {
  prefs: UserPrefs
  onUpdate: (p: UserPrefs) => void
  onReset: () => void
}) {
  const toggleLang = (code: string) => {
    const has = prefs.languages.find(l => l.code === code)
    onUpdate({
      ...prefs,
      languages: has
        ? prefs.languages.filter(l => l.code !== code)
        : [...prefs.languages, { code, level: 'beginner' }],
    })
  }

  const setLevel = (code: string, level: Level) =>
    onUpdate({
      ...prefs,
      languages: prefs.languages.map(l => l.code === code ? { ...l, level } : l),
    })

  const toggleInterest = (id: Interest) => {
    const has = prefs.interests.includes(id)
    onUpdate({ ...prefs, interests: has ? prefs.interests.filter(i => i !== id) : [...prefs.interests, id] })
  }

  return (
    <div className="overflow-y-auto px-4 py-4 flex flex-col gap-5 h-full">
      {/* Languages */}
      <section>
        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Languages</h2>
        <div className="flex flex-col gap-2">
          {LANGUAGES.map(lang => {
            const lp = prefs.languages.find(l => l.code === lang.code)
            const on = !!lp
            return (
              <div key={lang.code} className={`rounded-xl border p-3 transition-colors ${on ? 'border-amber-300 bg-amber-50' : 'border-stone-200 bg-white'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => toggleLang(lang.code)} className="flex items-center gap-2 flex-1 text-left">
                    <span className="text-lg">{lang.flag}</span>
                    <span className={`text-sm font-semibold ${on ? 'text-amber-800' : 'text-stone-600'}`}>{lang.name}</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${on ? 'bg-amber-200 text-amber-700' : 'bg-stone-100 text-stone-400'}`}>
                      {on ? 'On' : 'Off'}
                    </span>
                  </button>
                </div>
                {on && (
                  <div className="flex gap-1.5">
                    {LEVELS.map(lv => (
                      <button
                        key={lv}
                        onClick={() => setLevel(lang.code, lv)}
                        className={`flex-1 text-[11px] py-1 rounded-lg border capitalize transition-all ${lp?.level === lv ? 'bg-amber-400 text-white border-amber-400 font-semibold' : 'bg-white text-stone-500 border-stone-200'}`}
                      >
                        {lv}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Interests */}
      <section>
        <h2 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Interests</h2>
        <div className="grid grid-cols-2 gap-1.5">
          {INTERESTS.map(i => {
            const on = prefs.interests.includes(i.id)
            return (
              <button
                key={i.id}
                onClick={() => toggleInterest(i.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left transition-all text-sm ${on ? 'border-amber-300 bg-amber-50 text-amber-800 font-medium' : 'border-stone-200 bg-white text-stone-600'}`}
              >
                <span>{i.emoji}</span> {i.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* Reset */}
      <section className="border-t border-stone-100 pt-4">
        <button
          onClick={() => { if (confirm('Reset all preferences?')) onReset() }}
          className="text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          Reset all preferences
        </button>
      </section>
    </div>
  )
}
