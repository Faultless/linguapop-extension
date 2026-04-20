import { useState } from 'react'
import { usePrefs } from './hooks/usePrefs'
import { useSaved } from './hooks/useSaved'
import { Onboarding } from './views/Onboarding'
import { Discover } from './views/Discover'
import { Saved } from './views/Saved'
import { Settings } from './views/Settings'

type Tab = 'discover' | 'saved' | 'settings'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'discover', label: 'Discover', icon: '✦' },
  { id: 'saved',    label: 'Saved',    icon: '🔖' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
]

export default function App() {
  const { prefs, update, reset } = usePrefs()
  const { saved, toggle } = useSaved()
  const [tab, setTab] = useState<Tab>('discover')

  if (!prefs) return <Onboarding onDone={update} />

  return (
    <div className="flex flex-col bg-stone-50" style={{ width: 420, height: 580 }}>
      {/* Header */}
      <div className="flex items-center px-4 pt-4 pb-2 bg-amber-50 border-b border-amber-100 shrink-0">
        <span className="text-lg font-bold text-amber-700 tracking-tight">🌍 LinguaPop</span>
        <span className="ml-auto text-[10px] text-stone-400">
          {prefs.languages.map(l => l.code.toUpperCase()).join(' · ')}
        </span>
      </div>

      {/* View */}
      <div className="flex-1 overflow-hidden">
        {tab === 'discover' && <Discover prefs={prefs} saved={saved} onSave={toggle} />}
        {tab === 'saved'    && <Saved saved={saved} onSave={toggle} />}
        {tab === 'settings' && <Settings prefs={prefs} onUpdate={update} onReset={reset} />}
      </div>

      {/* Bottom nav */}
      <div className="flex border-t border-stone-200 bg-white shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors border-0 cursor-pointer ${
              tab === t.id
                ? 'text-amber-600 bg-amber-50'
                : 'text-stone-400 hover:text-stone-600 bg-white'
            }`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>
    </div>
  )
}
