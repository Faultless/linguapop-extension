import { useEffect, useState } from 'react'
import { lookupWord, translateText } from '@linguapop/core'
import type { DictResult, ReaderTheme } from '@linguapop/core'
import type { WordInfo } from './JapaneseText'
import { LEVEL_COLOR } from './JapaneseText'

const LEVEL_LABEL: Record<number, string> = { 5: 'N5', 4: 'N4', 3: 'N3', 2: 'N2', 1: 'N1' }

/**
 * Floating word/phrase detail popover.
 *
 * Two modes, set by the caller:
 * - `word`: a single tokenized word — runs a Jisho dictionary lookup
 *   (readings, parts of speech, multiple senses).
 * - `phrase`: a multi-token text selection — runs a machine translation
 *   of the entire selected string into the user's target language. The
 *   dictionary API would just return junk for a full sentence.
 */
export function JlptWordPopover({
  info, theme, sourceLang, targetLang, onClose,
}: {
  info: WordInfo
  theme: ReaderTheme
  sourceLang: string
  targetLang: string
  onClose: () => void
}) {
  const isPhrase = info.mode === 'phrase'
  const popoverWidth = isPhrase ? 340 : 300

  const [pos, setPos] = useState<{ left: number; top: number; below: boolean } | null>(null)
  const [dict, setDict] = useState<DictResult | null>(null)
  const [translation, setTranslation] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const margin = 8
    const vw = window.innerWidth
    const vh = window.innerHeight
    const left = Math.max(margin, Math.min(vw - popoverWidth - margin, info.rect.left + info.rect.width / 2 - popoverWidth / 2))
    const spaceBelow = vh - info.rect.bottom
    const below = spaceBelow > 260 || info.rect.top < 260
    const top = below ? info.rect.bottom + 6 : info.rect.top - 6
    setPos({ left, top, below })
  }, [info, popoverWidth])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (!t.closest('[data-jlpt-popover]')) onClose()
    }
    window.addEventListener('keydown', onKey)
    const id = window.setTimeout(() => window.addEventListener('click', onClick), 0)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('click', onClick)
      clearTimeout(id)
    }
  }, [onClose])

  // Run the appropriate async load based on mode.
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setDict(null)
    setTranslation(null)

    if (isPhrase) {
      const ac = new AbortController()
      translateText(info.surface, sourceLang, targetLang, { signal: ac.signal })
        .then(t => { if (!cancelled) setTranslation(t) })
        .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Translation failed') })
        .finally(() => { if (!cancelled) setLoading(false) })
      return () => { cancelled = true; ac.abort() }
    }

    lookupWord(info.base || info.surface, info.surface)
      .then(r => { if (!cancelled) setDict(r) })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Lookup failed') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [info.mode, info.base, info.surface, sourceLang, targetLang, isPhrase])

  if (!pos) return null

  const cardBg = theme.dark ? '#1c1917' : '#ffffff'
  const cardFg = theme.dark ? '#fafaf9' : '#1c1917'
  const cardMuted = theme.muted
  const cardBorder = cardMuted + '33'

  return (
    <div
      data-jlpt-popover
      role="dialog"
      className="fixed z-50 rounded-xl shadow-xl text-sm"
      style={{
        left: pos.left,
        top: pos.top,
        width: popoverWidth,
        transform: pos.below ? 'none' : 'translateY(-100%)',
        background: cardBg,
        color: cardFg,
        border: `1px solid ${cardBorder}`,
        maxHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={e => e.stopPropagation()}
    >
      {isPhrase
        ? <PhraseBody info={info} translation={translation} loading={loading} error={error} cardMuted={cardMuted} />
        : <WordBody info={info} dict={dict} loading={loading} error={error} cardMuted={cardMuted} />}

      <div className="px-3 py-2 border-t flex items-center gap-2 shrink-0" style={{ borderColor: cardBorder }}>
        <a
          href={isPhrase
            ? `https://translate.google.com/?sl=${encodeURIComponent(sourceLang)}&tl=${encodeURIComponent(targetLang)}&text=${encodeURIComponent(info.surface)}`
            : `https://jisho.org/search/${encodeURIComponent(info.base || info.surface)}`}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-semibold underline"
          style={{ color: theme.accent }}
        >
          {isPhrase ? 'Open in Google Translate ↗' : 'Open on Jisho ↗'}
        </a>
        <button
          onClick={onClose}
          className="ml-auto text-[11px] opacity-60 hover:opacity-100"
        >
          Close
        </button>
      </div>
    </div>
  )
}

// ───────────────────────── Word (single-tap) body ─────────────────────────

function WordBody({
  info, dict, loading, error, cardMuted,
}: {
  info: WordInfo
  dict: DictResult | null
  loading: boolean
  error: string
  cardMuted: string
}) {
  const primary = dict?.entries[0]
  const readingFromApi = primary?.readings[0]
  const reading = info.reading || readingFromApi
  const apiLevel = primary?.jlptLevel
  const level = info.level ?? apiLevel
  const levelColor = level ? LEVEL_COLOR[level] : cardMuted
  return (
    <>
      <div className="px-3 pt-3 pb-2 flex items-baseline gap-2 shrink-0">
        <div className="text-xl font-bold" lang="ja">{primary?.word || info.surface}</div>
        {reading && reading !== (primary?.word || info.surface) && (
          <div className="text-xs" style={{ color: cardMuted }} lang="ja">{reading}</div>
        )}
        {level && (
          <span
            className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: levelColor + '22', color: levelColor }}
          >
            {LEVEL_LABEL[level]}
          </span>
        )}
      </div>

      <div className="px-3 pb-3 flex flex-col gap-2 overflow-y-auto">
        {info.base && info.base !== info.surface && info.base !== primary?.word && (
          <Row label="Base" value={info.base} muted={cardMuted} />
        )}
        {info.gloss && (
          <div className="text-xs leading-relaxed">{info.gloss}</div>
        )}
        {loading && !primary && (
          <div className="flex items-center gap-2 py-2 text-xs" style={{ color: cardMuted }}>
            <span className="inline-block animate-spin">◌</span>
            <span>Looking up…</span>
          </div>
        )}
        {primary && (
          <ol className="flex flex-col gap-2 mt-1 list-none">
            {primary.senses.map((s, i) => (
              <li key={i} className="flex flex-col gap-0.5">
                {s.partsOfSpeech.length > 0 && (
                  <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: cardMuted }}>
                    {s.partsOfSpeech.join(' · ')}
                  </div>
                )}
                <div className="text-xs leading-snug">
                  <span className="font-semibold" style={{ color: cardMuted }}>{i + 1}.</span>{' '}
                  {s.definitions.join('; ')}
                  {s.tags.length > 0 && (
                    <span className="ml-1 text-[10px]" style={{ color: cardMuted }}>
                      ({s.tags.join(', ')})
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
        {dict && dict.entries.length > 1 && (
          <details className="mt-1 text-[11px]" style={{ color: cardMuted }}>
            <summary className="cursor-pointer">+ {dict.entries.length - 1} other reading{dict.entries.length - 1 !== 1 ? 's' : ''}</summary>
            <div className="mt-1 flex flex-col gap-1.5 pl-1">
              {dict.entries.slice(1).map((e, i) => (
                <div key={i} className="flex flex-col">
                  <div className="text-xs" lang="ja">
                    <span className="font-bold">{e.word}</span>
                    {e.readings[0] && e.readings[0] !== e.word && (
                      <span style={{ color: cardMuted }}> · {e.readings[0]}</span>
                    )}
                  </div>
                  <div className="text-[11px]">{e.senses[0]?.definitions.slice(0, 3).join('; ')}</div>
                </div>
              ))}
            </div>
          </details>
        )}
        {!loading && !primary && !error && !info.gloss && (
          <div className="text-xs italic" style={{ color: cardMuted }}>
            No dictionary entry found — may be a proper noun, slang, or an obscure form.
          </div>
        )}
        {error && (
          <div className="text-[11px]" style={{ color: '#dc2626' }}>{error}</div>
        )}
      </div>
    </>
  )
}

// ───────────────────────── Phrase (selection) body ────────────────────────

function PhraseBody({
  info, translation, loading, error, cardMuted,
}: {
  info: WordInfo
  translation: string | null
  loading: boolean
  error: string
  cardMuted: string
}) {
  return (
    <>
      <div className="px-3 pt-3 pb-1 shrink-0">
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cardMuted }}>
          Selection
        </div>
        <div className="text-sm font-medium leading-snug mt-0.5" lang="ja">
          {info.surface}
        </div>
      </div>
      <div className="px-3 py-2 flex flex-col gap-1.5 overflow-y-auto">
        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cardMuted }}>
          Translation
        </div>
        {loading && (
          <div className="flex items-center gap-2 py-1 text-xs" style={{ color: cardMuted }}>
            <span className="inline-block animate-spin">◌</span>
            <span>Translating…</span>
          </div>
        )}
        {translation && (
          <div className="text-sm leading-snug whitespace-pre-wrap">{translation}</div>
        )}
        {error && (
          <div className="text-[11px]" style={{ color: '#dc2626' }}>{error}</div>
        )}
      </div>
    </>
  )
}

function Row({ label, value, muted }: { label: string; value: string; muted: string }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-16 shrink-0" style={{ color: muted }}>{label}</span>
      <span className="font-medium" lang="ja">{value}</span>
    </div>
  )
}
