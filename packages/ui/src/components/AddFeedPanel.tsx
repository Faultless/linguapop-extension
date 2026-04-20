import { useState } from 'react'
import { LANGUAGES } from '@linguapop/core'
import { resolveAndParseFeed } from '@linguapop/core'
import type { CustomFeed, Episode, UserPrefs } from '@linguapop/core'

type Step = 'input' | 'loading' | 'preview' | 'error'

export function AddFeedPanel({
  prefs,
  onAdd,
  onClose,
}: {
  prefs: UserPrefs
  onAdd: (feed: CustomFeed) => void
  onClose: () => void
}) {
  const [url, setUrl] = useState('')
  const [step, setStep] = useState<Step>('input')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<{
    feed: Omit<CustomFeed, 'id' | 'language' | 'addedAt'>
    episodes: Episode[]
  } | null>(null)
  const [selectedLang, setSelectedLang] = useState(prefs.languages[0]?.code ?? 'fr')

  const handleResolve = async () => {
    if (!url.trim()) return
    setStep('loading')
    setError('')
    try {
      const result = await resolveAndParseFeed(url)
      setPreview(result)
      setStep('preview')
    } catch (e: any) {
      setError(e.message ?? 'Could not parse this URL')
      setStep('error')
    }
  }

  const handleSave = () => {
    if (!preview) return
    const feed: CustomFeed = {
      id: 'custom_' + Date.now().toString(36),
      language: selectedLang,
      addedAt: Date.now(),
      ...preview.feed,
    }
    onAdd(feed)
    onClose()
  }

  return (
    <div className="absolute inset-0 bg-stone-50 z-10 flex flex-col" style={{ top: 0 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-200 bg-white shrink-0">
        <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-lg leading-none">←</button>
        <div className="text-sm font-bold text-stone-800">Add Your Feed</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {/* URL input */}
        {(step === 'input' || step === 'error') && (
          <>
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                Paste a URL
              </label>
              <input
                className="w-full bg-white rounded-xl px-3 py-2.5 text-sm text-stone-800 placeholder:text-stone-400 outline-none border border-stone-200 focus:ring-2 focus:ring-amber-300 transition"
                placeholder="YouTube channel, podcast RSS, or website…"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleResolve()}
              />
              <p className="text-[10px] text-stone-400 mt-1.5 leading-relaxed">
                Supports YouTube channels (youtube.com/@handle), podcast RSS feeds, and websites with RSS links.
              </p>
            </div>

            {step === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            <button
              onClick={handleResolve}
              disabled={!url.trim()}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              Fetch Feed
            </button>
          </>
        )}

        {/* Loading */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="text-2xl animate-spin">◌</div>
            <span className="text-sm text-stone-400">Resolving feed…</span>
          </div>
        )}

        {/* Preview */}
        {step === 'preview' && preview && (
          <>
            <div className="bg-white border border-stone-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${preview.feed.type === 'youtube' ? 'bg-red-100 text-red-700' : 'bg-violet-100 text-violet-700'}`}>
                  {preview.feed.type === 'youtube' ? '▶ YouTube' : '🎙 Podcast'}
                </span>
              </div>
              <h3 className="text-sm font-bold text-stone-800 leading-snug">{preview.feed.title}</h3>
              {preview.feed.description && (
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">{preview.feed.description}</p>
              )}
              <p className="text-[10px] text-stone-400 mt-2">
                {preview.episodes.length} episode{preview.episodes.length !== 1 ? 's' : ''} found
              </p>
            </div>

            {/* Language selector */}
            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                Language of this feed
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGES.filter(l => prefs.languages.some(pl => pl.code === l.code)).map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setSelectedLang(lang.code)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selectedLang === lang.code ? `${lang.color} border-transparent font-semibold` : 'bg-white text-stone-600 border-stone-200'}`}
                  >
                    {lang.flag} {lang.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Episode preview list */}
            {preview.episodes.length > 0 && (
              <div>
                <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                  Latest episodes
                </label>
                <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
                  {preview.episodes.slice(0, 5).map((ep, i) => (
                    <div key={i} className="px-3 py-2 border-b border-stone-100 last:border-0">
                      <div className="text-xs font-medium text-stone-700 truncate">{ep.title}</div>
                      {ep.pubDate && <div className="text-[10px] text-stone-400 mt-0.5">{new Date(ep.pubDate).toLocaleDateString()}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => { setStep('input'); setPreview(null) }}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-sm rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                Add Feed
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
