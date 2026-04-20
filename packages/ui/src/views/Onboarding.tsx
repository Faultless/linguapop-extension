import { useState } from 'react'
import { LANGUAGES } from '@linguapop/core'
import type { UserPrefs, Level, Interest } from '@linguapop/core'

const INTERESTS: { id: Interest; label: string; emoji: string }[] = [
  { id: 'news',          label: 'News',          emoji: '📰' },
  { id: 'culture',       label: 'Culture',        emoji: '🎭' },
  { id: 'music',         label: 'Music',          emoji: '🎵' },
  { id: 'stories',       label: 'Stories',        emoji: '📖' },
  { id: 'science',       label: 'Science',        emoji: '🔬' },
  { id: 'business',      label: 'Business',       emoji: '💼' },
  { id: 'kids',          label: 'Kids',           emoji: '🧸' },
  { id: 'entertainment', label: 'Entertainment',  emoji: '🎬' },
]

const LEVELS: { id: Level; label: string; desc: string }[] = [
  { id: 'beginner',     label: 'Beginner',     desc: 'Just starting out' },
  { id: 'intermediate', label: 'Intermediate', desc: 'Can hold a conversation' },
  { id: 'advanced',     label: 'Advanced',     desc: 'Near-fluent' },
]

export function Onboarding({ onDone }: { onDone: (p: UserPrefs) => void }) {
  const [step, setStep] = useState(0)
  const [selectedLangs, setSelectedLangs] = useState<string[]>([])
  const [levels, setLevels] = useState<Record<string, Level>>({})
  const [interests, setInterests] = useState<Interest[]>([])

  const toggleLang = (code: string) =>
    setSelectedLangs(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )

  const toggleInterest = (id: Interest) =>
    setInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )

  const finish = () =>
    onDone({
      languages: selectedLangs.map(code => ({ code, level: levels[code] ?? 'beginner' })),
      interests,
    })

  return (
    <div className="flex flex-col h-full bg-amber-50">
      {/* Header */}
      <div className="px-6 pt-8 pb-4">
        <div className="text-2xl font-bold text-stone-800 tracking-tight">
          {step === 0 && '🌍 Which languages?'}
          {step === 1 && '📊 What\'s your level?'}
          {step === 2 && '✨ What do you enjoy?'}
        </div>
        <p className="text-sm text-stone-500 mt-1">
          {step === 0 && 'Pick the languages you\'re learning'}
          {step === 1 && 'Set your level for each language'}
          {step === 2 && 'We\'ll prioritise content you\'ll love'}
        </p>
        {/* Progress dots */}
        <div className="flex gap-1.5 mt-4">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? 'bg-amber-500 w-6' : 'bg-stone-200 w-3'}`} />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-6 pb-4">
        {step === 0 && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {LANGUAGES.map(lang => {
              const on = selectedLangs.includes(lang.code)
              return (
                <button
                  key={lang.code}
                  onClick={() => toggleLang(lang.code)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    on ? 'border-amber-400 bg-amber-100' : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className={`text-sm font-medium ${on ? 'text-amber-800' : 'text-stone-700'}`}>{lang.name}</span>
                  {on && <span className="ml-auto text-amber-500 text-xs">✓</span>}
                </button>
              )
            })}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4 pt-1">
            {selectedLangs.map(code => {
              const lang = LANGUAGES.find(l => l.code === code)!
              return (
                <div key={code}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm font-semibold text-stone-700">{lang.name}</span>
                  </div>
                  <div className="flex gap-2">
                    {LEVELS.map(lv => (
                      <button
                        key={lv.id}
                        onClick={() => setLevels(p => ({ ...p, [code]: lv.id }))}
                        className={`flex-1 py-2 px-1 rounded-lg border text-center text-xs transition-all ${
                          (levels[code] ?? 'beginner') === lv.id
                            ? 'border-amber-400 bg-amber-100 text-amber-800 font-semibold'
                            : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        <div className="font-medium">{lv.label}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{lv.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {INTERESTS.map(i => {
              const on = interests.includes(i.id)
              return (
                <button
                  key={i.id}
                  onClick={() => toggleInterest(i.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    on ? 'border-amber-400 bg-amber-100' : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <span className="text-lg">{i.emoji}</span>
                  <span className={`text-sm font-medium ${on ? 'text-amber-800' : 'text-stone-700'}`}>{i.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-2 border-t border-stone-100">
        <button
          onClick={() => step < 2 ? setStep(s => s + 1) : finish()}
          disabled={step === 0 && selectedLangs.length === 0}
          className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {step === 2 ? 'Start exploring →' : 'Continue →'}
        </button>
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="w-full mt-2 py-2 text-sm text-stone-400 hover:text-stone-600 transition-colors">
            ← Back
          </button>
        )}
      </div>
    </div>
  )
}
