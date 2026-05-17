import { useEffect, useMemo, useState } from 'react'
import {
  lookupJlpt,
  onTokenizerStatusChange,
  tokenizeJapanese,
  type JpToken,
  type JlptLevel,
  type ReaderTheme,
} from '@linguapop/core'

/**
 * JLPT level → display color. Tuned for legibility on both light and dark
 * themes. The non-JLPT (proper-noun / unknown) tokens get a faint underline
 * only on hover so the body text stays calm.
 */
const LEVEL_COLOR: Record<JlptLevel, string> = {
  5: '#0d9488', // teal-600 — N5, easiest
  4: '#16a34a', // green-600 — N4
  3: '#ca8a04', // amber-600 — N3
  2: '#ea580c', // orange-600 — N2
  1: '#dc2626', // red-600 — N1, hardest
}

interface JapaneseTextProps {
  text: string
  theme: ReaderTheme
  /** Show colored levels (when false, falls back to plain text). */
  enabled: boolean
  /** Optional click handler — passed the token + its JLPT level (if any). */
  onWordTap?: (info: WordInfo) => void
}

export interface WordInfo {
  surface: string
  base: string
  reading?: string
  level?: JlptLevel
  gloss?: string
  /** Bounding rect of the tapped token (or the selection range), for popover positioning. */
  rect: DOMRect
  /**
   * `word` — single tokenized word, used for dictionary lookup.
   * `phrase` — multi-token text selection, used for machine translation.
   */
  mode: 'word' | 'phrase'
}

/**
 * Renders a paragraph of Japanese text with each tokenized word colored by
 * its JLPT level. Tokenization runs asynchronously; the component shows the
 * raw text until kuromoji is ready, then upgrades in place.
 */
export function JapaneseText({ text, theme, enabled, onWordTap }: JapaneseTextProps) {
  const [tokens, setTokens] = useState<JpToken[] | null>(null)
  const [, setStatusBump] = useState(0)

  useEffect(() => {
    const unsub = onTokenizerStatusChange(() => setStatusBump(n => n + 1))
    return unsub
  }, [])

  useEffect(() => {
    if (!enabled) { setTokens(null); return }
    let cancelled = false
    tokenizeJapanese(text)
      .then(t => { if (!cancelled) setTokens(t) })
      .catch(() => { if (!cancelled) setTokens(null) })
    return () => { cancelled = true }
  }, [text, enabled])

  // Precompute spans with their lookup result.
  const rendered = useMemo(() => {
    if (!enabled || !tokens) return null
    return tokens.map((tok, i) => {
      if (tok.isFiller) return <span key={i}>{tok.surface}</span>
      const info = lookupJlpt({ base: tok.base, surface: tok.surface, reading: tok.reading })
      const color = info ? LEVEL_COLOR[info.level] : undefined
      return (
        <span
          key={i}
          data-token={i}
          data-base={tok.base}
          data-reading={tok.reading || ''}
          data-level={info?.level ?? ''}
          data-gloss={info?.gloss ?? ''}
          style={{
            color,
            textDecorationLine: color ? 'underline' : undefined,
            textDecorationStyle: 'dotted',
            textDecorationColor: color ? color + '60' : undefined,
            textUnderlineOffset: '3px',
            cursor: 'pointer',
            borderRadius: 3,
          }}
          className="hover:bg-current/10"
        >
          {tok.surface}
        </span>
      )
    })
  }, [tokens, enabled])

  if (!rendered) {
    // Raw text while we wait for the tokenizer (or coloring disabled).
    return (
      <span
        onMouseUp={onWordTap ? e => handleMouseUp(e, onWordTap) : undefined}
        style={{ color: theme.fg }}
      >
        {text}
      </span>
    )
  }

  return (
    <span
      onMouseUp={onWordTap ? e => handleMouseUp(e, onWordTap) : undefined}
      style={{ color: theme.fg }}
    >
      {rendered}
    </span>
  )
}

/**
 * Handles both single-token taps and multi-token text selections.
 *
 * - If there's a non-collapsed selection at release time → look up the entire
 *   selection (handles idioms, compound phrases, grammar patterns).
 * - Otherwise → fall back to the single tokenized word under the cursor.
 *
 * The selection's bounding rect is used to anchor the popover so it appears
 * near the highlighted phrase.
 */
function handleMouseUp(e: React.MouseEvent, cb: (info: WordInfo) => void) {
  const sel = typeof window !== 'undefined' ? window.getSelection() : null
  if (sel && !sel.isCollapsed) {
    const text = sel.toString().trim()
    if (text.length >= 1) {
      let rect: DOMRect
      try {
        rect = sel.getRangeAt(0).getBoundingClientRect()
      } catch {
        rect = pointRect(e.clientX, e.clientY)
      }
      if (!rect || rect.width === 0 && rect.height === 0) rect = pointRect(e.clientX, e.clientY)
      cb({ surface: text, base: text, rect, mode: 'phrase' })
      return
    }
  }

  // Single-token fallback.
  const target = e.target as HTMLElement
  const span = target.closest('[data-token]') as HTMLElement | null
  if (!span) return
  const base = span.dataset.base || span.textContent || ''
  const reading = span.dataset.reading || undefined
  const levelStr = span.dataset.level
  const gloss = span.dataset.gloss || undefined
  cb({
    surface: span.textContent || '',
    base,
    reading,
    level: levelStr ? (Number(levelStr) as JlptLevel) : undefined,
    gloss,
    rect: span.getBoundingClientRect(),
    mode: 'word',
  })
}

function pointRect(x: number, y: number): DOMRect {
  return {
    x, y, left: x, top: y, right: x, bottom: y, width: 0, height: 0,
    toJSON: () => ({}),
  } as DOMRect
}

export { LEVEL_COLOR }
