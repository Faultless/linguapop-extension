import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  LANG_MAP,
  translateText,
  tts,
  useReaderPrefs,
} from '@linguapop/core'
import type {
  Chapter, NovelBody, NovelMeta, ReaderPrefs, ReaderTheme,
} from '@linguapop/core'
import { ReaderSettingsPanel } from '../components/ReaderSettingsPanel'
import { JapaneseText, type WordInfo } from '../components/JapaneseText'
import { JlptWordPopover } from '../components/JlptWordPopover'

interface ReaderProps {
  meta: NovelMeta
  body: NovelBody
  /** Persist user navigation (chapter, offset). */
  onUpdateMeta: (patch: Partial<NovelMeta>) => void
  /** Persist a chapter (e.g. cached translation). */
  onUpdateChapter: (chapterIndex: number, patch: Partial<Chapter>) => void
  onClose: () => void
}

export function Reader({ meta, body: initialBody, onUpdateMeta, onUpdateChapter, onClose }: ReaderProps) {
  const { prefs, theme, update, addCustomTheme, removeCustomTheme } = useReaderPrefs()
  // Body is owned locally so newly-cached translations show up immediately;
  // the parent (ReadTab) only persists to IDB.
  const [body, setBody] = useState<NovelBody>(initialBody)
  const patchChapter = useCallback((chapterIndex: number, patch: Partial<Chapter>) => {
    setBody(b => ({
      ...b,
      chapters: b.chapters.map((c, i) => i === chapterIndex ? { ...c, ...patch } : c),
    }))
    onUpdateChapter(chapterIndex, patch)
  }, [onUpdateChapter])
  const [chapterIdx, setChapterIdx] = useState(Math.min(meta.lastReadChapter, body.chapters.length - 1))
  const [showSettings, setShowSettings] = useState(false)
  const [showChapters, setShowChapters] = useState(false)
  const [showChrome, setShowChrome] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translationProgress, setTranslationProgress] = useState(0)
  const [translationError, setTranslationError] = useState('')
  const [ttsState, setTtsState] = useState<'idle' | 'playing'>('idle')
  const [wordPopover, setWordPopover] = useState<WordInfo | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const translationAbort = useRef<AbortController | null>(null)
  const chapterRef = useRef(chapterIdx)
  chapterRef.current = chapterIdx

  const chapter = body.chapters[chapterIdx]

  // ----- Restore scroll position for the last-read chapter on mount -----
  useEffect(() => {
    if (chapterIdx === meta.lastReadChapter && contentRef.current) {
      contentRef.current.scrollTop = meta.lastReadOffset || 0
    }
    // Intentionally only run on mount; subsequent chapter changes start at top.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ----- Persist position (throttled) -----
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    let t: number | null = null
    const onScroll = () => {
      if (t) return
      t = window.setTimeout(() => {
        t = null
        onUpdateMeta({ lastReadChapter: chapterRef.current, lastReadOffset: el.scrollTop })
      }, 400)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (t) clearTimeout(t)
      el.removeEventListener('scroll', onScroll)
    }
  }, [onUpdateMeta])

  // Persist chapter index when it changes.
  useEffect(() => {
    onUpdateMeta({ lastReadChapter: chapterIdx, lastReadOffset: 0 })
    contentRef.current?.scrollTo({ top: 0 })
  }, [chapterIdx, onUpdateMeta])

  // ----- Auto-translate when target language requested and not yet available -----
  const runTranslation = useCallback(async () => {
    if (!chapter) return
    setTranslating(true)
    setTranslationProgress(0)
    setTranslationError('')
    translationAbort.current?.abort()
    const ac = new AbortController()
    translationAbort.current = ac
    try {
      const translated = await translateText(chapter.originalText, meta.sourceLanguage, meta.targetLanguage, {
        signal: ac.signal,
        onProgress: setTranslationProgress,
      })
      if (ac.signal.aborted) return
      patchChapter(chapterIdx, { translatedText: translated, translationStatus: 'translated' })
    } catch (e) {
      if (!ac.signal.aborted) {
        setTranslationError(e instanceof Error ? e.message : 'Translation failed')
        patchChapter(chapterIdx, { translationStatus: 'failed' })
      }
    } finally {
      if (!ac.signal.aborted) setTranslating(false)
    }
  }, [chapter, chapterIdx, meta.sourceLanguage, meta.targetLanguage, patchChapter])

  // Always abort any in-flight translation when the chapter changes or the
  // reader unmounts. Translation is now explicit-only — there is no auto-fire
  // effect; users press the "Translate" button to invoke it.
  useEffect(() => () => translationAbort.current?.abort(), [chapterIdx])

  // ----- Fullscreen -----
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await containerRef.current?.requestFullscreen?.()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen?.()
        setIsFullscreen(false)
      }
    } catch {
      // Fullscreen API not available (e.g. some Capacitor WebViews). Fall back to CSS fullscreen.
      setIsFullscreen(v => !v)
    }
  }, [])
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // ----- TTS -----
  const ttsLang = prefs.viewMode === 'translated' ? meta.targetLanguage : meta.sourceLanguage
  const speak = () => {
    if (ttsState === 'playing') { tts.stop(); setTtsState('idle'); return }
    const text =
      prefs.viewMode === 'translated' && chapter?.translatedText
        ? chapter.translatedText
        : chapter?.originalText
    if (!text) return
    setTtsState('playing')
    tts.speak(text, {
      lang: ttsLang,
      rate: prefs.ttsRate,
      onEnd: () => setTtsState('idle'),
    })
  }
  useEffect(() => () => tts.stop(), [])

  // ----- Keyboard nav -----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') nextChapter()
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') prevChapter()
      else if (e.key === 'f') toggleFullscreen()
      else if (e.key === 't') update({ viewMode: prefs.viewMode === 'original' ? 'translated' : 'original' })
      else if (e.key === 'Escape' && !showSettings && !showChapters) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const nextChapter = () => setChapterIdx(i => Math.min(body.chapters.length - 1, i + 1))
  const prevChapter = () => setChapterIdx(i => Math.max(0, i - 1))

  const srcLang = LANG_MAP[meta.sourceLanguage]
  const tgtLang = LANG_MAP[meta.targetLanguage] || { code: meta.targetLanguage, name: 'Target', flag: '🌐', color: '' }

  // ----- Paged layout -----
  // Implemented as horizontal CSS columns of the same container height: scrolling left/right pages through it.
  const isPaged = prefs.layout === 'paged'

  return (
    <div
      ref={containerRef}
      className={`${isFullscreen ? 'fixed' : 'absolute'} inset-0 z-30 flex flex-col select-text`}
      style={{ background: theme.bg, color: theme.fg }}
    >
      {/* Top chrome */}
      {showChrome && (
        <div
          className="flex items-center gap-2 px-3 py-2 border-b shrink-0"
          style={{ borderColor: theme.muted + '30', background: theme.bg }}
        >
          <button onClick={onClose} className="px-2 py-1 text-base leading-none opacity-70 hover:opacity-100">←</button>
          <button onClick={() => setShowChapters(true)} className="flex-1 min-w-0 text-left">
            <div className="text-xs font-bold truncate">{meta.title}</div>
            <div className="text-[10px] opacity-60 truncate">
              {chapter?.title || `Chapter ${chapterIdx + 1}`} · {chapterIdx + 1} / {body.chapters.length}
            </div>
          </button>

          {/* Translation toggle (the core feature) */}
          <div
            className="flex rounded-full p-0.5 text-[10px] font-semibold"
            style={{ background: theme.muted + '20' }}
          >
            {(['original', 'parallel', 'translated'] as const).map(m => (
              <button
                key={m}
                onClick={() => update({ viewMode: m })}
                className="px-2 py-1 rounded-full transition-colors"
                style={{
                  background: prefs.viewMode === m ? theme.accent : 'transparent',
                  color: prefs.viewMode === m ? '#fff' : 'inherit',
                }}
                title={m === 'parallel' ? 'Side by side' : m === 'translated' ? `Translate to ${tgtLang.name}` : `Original ${srcLang?.name ?? ''}`}
              >
                {m === 'original' && (srcLang?.flag || 'A')}
                {m === 'parallel' && '⇄'}
                {m === 'translated' && (tgtLang.flag || 'T')}
              </button>
            ))}
          </div>

          <button onClick={speak} className="px-2 py-1 text-base opacity-70 hover:opacity-100" title="Text to speech">
            {ttsState === 'playing' ? '■' : '🔊'}
          </button>
          <button onClick={toggleFullscreen} className="px-2 py-1 text-base opacity-70 hover:opacity-100" title="Fullscreen (F)">
            {isFullscreen ? '⤓' : '⛶'}
          </button>
          <button onClick={() => setShowChrome(false)} className="px-2 py-1 text-base opacity-70 hover:opacity-100" title="Hide UI">⤢</button>
          <button onClick={() => setShowSettings(true)} className="px-2 py-1 text-base opacity-70 hover:opacity-100" title="Reader settings">⚙</button>
        </div>
      )}

      {!showChrome && (
        <button
          onClick={() => setShowChrome(true)}
          className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full text-base opacity-50 hover:opacity-100"
          style={{ background: theme.muted + '20', color: theme.fg }}
          title="Show UI"
        >
          ⌃
        </button>
      )}

      {/* Translation progress strip */}
      {translating && (
        <div className="h-0.5 w-full" style={{ background: theme.muted + '30' }}>
          <div className="h-full transition-all" style={{ width: `${translationProgress * 100}%`, background: theme.accent }} />
        </div>
      )}

      {/* Content */}
      <div
        ref={contentRef}
        className={`flex-1 min-h-0 ${isPaged ? 'overflow-x-auto overflow-y-hidden snap-x snap-mandatory' : 'overflow-y-auto overflow-x-hidden'}`}
        onClick={() => { if (!showChrome) setShowChrome(true) }}
      >
        <div
          className={isPaged ? 'px-5 py-8' : 'mx-auto px-5 py-8'}
          style={{
            // Scroll mode: cap width like a regular reading column.
            // Paged: let CSS columns extend the box horizontally to create pages.
            maxWidth: isPaged ? undefined : prefs.maxWidth,
            fontFamily: fontCss(prefs.fontFamily),
            fontSize: prefs.fontSize,
            lineHeight: prefs.lineHeight,
            letterSpacing: `${prefs.letterSpacing}em`,
            columnWidth: isPaged ? `${prefs.maxWidth}px` : undefined,
            columnGap: isPaged ? 40 : undefined,
            columnFill: isPaged ? 'auto' : undefined,
            height: isPaged ? '100%' : undefined,
          }}
        >
          <ChapterBody
            chapter={chapter}
            viewMode={prefs.viewMode}
            prefs={prefs}
            theme={theme}
            sourceLang={meta.sourceLanguage}
            targetLang={meta.targetLanguage}
            translating={translating}
            translationError={translationError}
            onRetryTranslate={runTranslation}
            coloriseSource={prefs.coloriseJapanese && meta.sourceLanguage === 'ja'}
            onWordTap={setWordPopover}
          />

          {/* Chapter nav at the bottom of every chapter (scroll layout). */}
          {!isPaged && (
            <div className="flex items-center justify-between mt-12 pt-6 border-t" style={{ borderColor: theme.muted + '30' }}>
              <button
                onClick={prevChapter}
                disabled={chapterIdx === 0}
                className="text-sm font-semibold opacity-70 hover:opacity-100 disabled:opacity-30"
              >
                ← Previous
              </button>
              <span className="text-xs opacity-50">{chapterIdx + 1} / {body.chapters.length}</span>
              <button
                onClick={nextChapter}
                disabled={chapterIdx === body.chapters.length - 1}
                className="text-sm font-semibold opacity-70 hover:opacity-100 disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Paged-mode arrows */}
      {isPaged && showChrome && (
        <div className="flex items-center gap-2 px-3 py-2 border-t shrink-0" style={{ borderColor: theme.muted + '30' }}>
          <button onClick={prevChapter} disabled={chapterIdx === 0} className="text-sm font-semibold opacity-70 hover:opacity-100 disabled:opacity-30">← Prev ch.</button>
          <div className="flex-1 text-center text-xs opacity-60">Swipe / scroll horizontally to page</div>
          <button onClick={nextChapter} disabled={chapterIdx === body.chapters.length - 1} className="text-sm font-semibold opacity-70 hover:opacity-100 disabled:opacity-30">Next ch. →</button>
        </div>
      )}

      {/* Chapter drawer */}
      {showChapters && (
        <ChapterList
          chapters={body.chapters}
          current={chapterIdx}
          theme={theme}
          onSelect={i => { setChapterIdx(i); setShowChapters(false) }}
          onClose={() => setShowChapters(false)}
        />
      )}

      {/* Settings drawer */}
      {showSettings && (
        <ReaderSettingsPanel
          prefs={prefs}
          onUpdate={update}
          onAddCustomTheme={addCustomTheme}
          onRemoveCustomTheme={removeCustomTheme}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* JLPT word popover */}
      {wordPopover && (
        <JlptWordPopover
          info={wordPopover}
          theme={theme}
          sourceLang={meta.sourceLanguage}
          targetLang={meta.targetLanguage}
          onClose={() => setWordPopover(null)}
        />
      )}
    </div>
  )
}

function ChapterBody({
  chapter,
  viewMode,
  prefs,
  theme,
  sourceLang,
  targetLang,
  translating,
  translationError,
  onRetryTranslate,
  coloriseSource,
  onWordTap,
}: {
  chapter: Chapter
  viewMode: 'original' | 'translated' | 'parallel'
  prefs: ReaderPrefs
  theme: ReaderTheme
  sourceLang: string
  targetLang: string
  translating: boolean
  translationError: string
  onRetryTranslate: () => void
  /** When true, the source-language paragraphs are wrapped in JapaneseText. */
  coloriseSource: boolean
  onWordTap?: (info: WordInfo) => void
}) {
  const paragraphs = useMemo(
    () => chapter ? splitParagraphs(chapter.originalText) : [],
    [chapter?.originalText],
  )
  const translatedParagraphs = useMemo(
    () => chapter?.translatedText && chapter.translatedText.trim()
      ? splitParagraphs(chapter.translatedText)
      : null,
    [chapter?.translatedText],
  )
  if (!chapter) return null

  if (viewMode === 'parallel') {
    return (
      <>
        <h1 className="font-bold mb-6" style={{ fontSize: prefs.fontSize * 1.4, color: theme.fg }}>
          {chapter.title}
        </h1>
        {translatedParagraphs ? (
          <ParallelRows
            paragraphs={paragraphs}
            translatedParagraphs={translatedParagraphs}
            prefs={prefs}
            theme={theme}
            sourceLang={sourceLang}
            targetLang={targetLang}
            coloriseSource={coloriseSource}
            onWordTap={onWordTap}
          />
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div>
              {paragraphs.map((p, i) => (
                <Para key={i} text={p} translated={false} prefs={prefs} theme={theme}
                      onTranslateThis={() => {}} langForTap={sourceLang}
                      colorise={coloriseSource} onWordTap={onWordTap} />
              ))}
            </div>
            <TranslateCTA
              theme={theme}
              translating={translating}
              error={translationError}
              onTranslate={onRetryTranslate}
            />
          </div>
        )}
      </>
    )
  }

  if (viewMode === 'translated') {
    if (!translatedParagraphs) {
      return (
        <>
          <h1 className="font-bold mb-6" style={{ fontSize: prefs.fontSize * 1.4, color: theme.fg }}>
            {chapter.title}
          </h1>
          <TranslateCTA
            theme={theme}
            translating={translating}
            error={translationError}
            onTranslate={onRetryTranslate}
          />
        </>
      )
    }
    return (
      <>
        <h1 className="font-bold mb-6" style={{ fontSize: prefs.fontSize * 1.4, color: theme.fg }}>
          {chapter.title}
        </h1>
        {translatedParagraphs.map((p, i) => (
          <Para
            key={i}
            text={p}
            translated
            prefs={prefs}
            theme={theme}
            onTranslateThis={() => {}}
            langForTap={targetLang}
          />
        ))}
      </>
    )
  }

  // Original (default)
  return (
    <>
      <h1 className="font-bold mb-6" style={{ fontSize: prefs.fontSize * 1.4, color: theme.fg }}>
        {chapter.title}
      </h1>
      {paragraphs.map((p, i) => (
        <Para
          key={i}
          text={p}
          translated={false}
          prefs={prefs}
          theme={theme}
          colorise={coloriseSource}
          onWordTap={onWordTap}
          onTranslateThis={async () => {
            if (!prefs.tapToTranslate) return
            try {
              const t = await translateText(p, sourceLang, targetLang)
              // Show inline as a hover/popover.
              alert(t)
            } catch { /* swallow */ }
          }}
          langForTap={sourceLang}
        />
      ))}
    </>
  )
}

function Para({
  text, translated, prefs, theme, onTranslateThis, langForTap, colorise, onWordTap,
}: {
  text: string
  translated: boolean
  prefs: ReaderPrefs
  theme: ReaderTheme
  onTranslateThis: () => void
  langForTap: string
  /** When true, render via JapaneseText (JLPT color-coding). */
  colorise?: boolean
  onWordTap?: (info: WordInfo) => void
}) {
  return (
    <p
      onDoubleClick={onTranslateThis}
      className="cursor-text"
      style={{
        marginBottom: `${prefs.paragraphSpacing}em`,
        color: translated ? theme.fg : theme.fg,
        opacity: translated ? 0.95 : 1,
        whiteSpace: 'pre-wrap',
      }}
      lang={langForTap}
    >
      {colorise
        ? <JapaneseText text={text} theme={theme} enabled onWordTap={onWordTap} />
        : text}
    </p>
  )
}

function ParallelRows({
  paragraphs, translatedParagraphs, prefs, theme, sourceLang, targetLang, coloriseSource, onWordTap,
}: {
  paragraphs: string[]
  translatedParagraphs: string[]
  prefs: ReaderPrefs
  theme: ReaderTheme
  sourceLang: string
  targetLang: string
  coloriseSource: boolean
  onWordTap?: (info: WordInfo) => void
}) {
  // Best-effort row alignment: pad the shorter side.
  const maxLen = Math.max(paragraphs.length, translatedParagraphs.length)
  const rows: ReactNode[] = []
  for (let i = 0; i < maxLen; i++) {
    rows.push(
      <Para
        key={`o-${i}`}
        text={paragraphs[i] || ''}
        translated={false}
        prefs={prefs}
        theme={theme}
        onTranslateThis={() => {}}
        langForTap={sourceLang}
        colorise={coloriseSource}
        onWordTap={onWordTap}
      />,
    )
    rows.push(
      <Para
        key={`t-${i}`}
        text={translatedParagraphs[i] || ''}
        translated
        prefs={prefs}
        theme={theme}
        onTranslateThis={() => {}}
        langForTap={targetLang}
      />,
    )
  }
  return <div className="grid grid-cols-2 gap-6">{rows}</div>
}

/**
 * Empty-state CTA shown in Translated/Parallel views when the chapter has no
 * uploaded translation yet. Translation is explicit-only — pressing the button
 * is the ONLY way to invoke MT (no auto-fire on view-mode switch).
 */
function TranslateCTA({
  theme, translating, error, onTranslate,
}: {
  theme: ReaderTheme
  translating: boolean
  error: string
  onTranslate: () => void
}) {
  if (translating) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 gap-3 rounded-2xl"
        style={{ background: theme.muted + '15', color: theme.fg }}
      >
        <div className="text-2xl animate-spin">◌</div>
        <span className="text-sm opacity-80">Translating…</span>
      </div>
    )
  }
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 gap-3 rounded-2xl text-center"
      style={{ background: theme.muted + '15', color: theme.fg }}
    >
      <div className="text-3xl">🈯</div>
      <p className="text-sm font-semibold">No translation yet for this chapter</p>
      <p className="text-xs opacity-70 max-w-xs">
        Use machine translation to generate one now — original stays unchanged.
      </p>
      <button
        onClick={onTranslate}
        className="mt-1 text-xs font-semibold px-4 py-2 rounded-xl"
        style={{ background: theme.accent, color: '#fff' }}
      >
        Translate this chapter
      </button>
      {error && (
        <p className="text-[11px] opacity-70 mt-1" style={{ color: theme.accent }}>
          {error}
        </p>
      )}
    </div>
  )
}

function ChapterList({
  chapters, current, theme, onSelect, onClose,
}: {
  chapters: Chapter[]
  current: number
  theme: ReaderTheme
  onSelect: (i: number) => void
  onClose: () => void
}) {
  return (
    <div className="absolute inset-y-0 left-0 z-30 w-80 max-w-[85%] shadow-2xl flex flex-col" style={{ background: theme.bg, color: theme.fg }}>
      <div className="flex items-center px-4 py-3 border-b shrink-0" style={{ borderColor: theme.muted + '30' }}>
        <div className="text-sm font-bold">Chapters</div>
        <button onClick={onClose} className="ml-auto text-lg leading-none opacity-60 hover:opacity-100">×</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {chapters.map((c, i) => (
          <button
            key={c.id}
            onClick={() => onSelect(i)}
            className="block w-full text-left px-4 py-3 border-b text-sm"
            style={{
              borderColor: theme.muted + '20',
              background: i === current ? theme.accent + '22' : 'transparent',
              fontWeight: i === current ? 600 : 400,
            }}
          >
            <div className="text-[10px] opacity-50">{i + 1}</div>
            <div className="truncate">{c.title}</div>
          </button>
        ))}
      </div>
      <button onClick={onClose} className="absolute inset-0 -z-10" aria-hidden />
    </div>
  )
}

function splitParagraphs(text: string): string[] {
  return text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean)
}

function fontCss(family: ReaderPrefs['fontFamily']): string {
  switch (family) {
    case 'sans':     return 'system-ui, -apple-system, "Helvetica Neue", sans-serif'
    case 'mono':     return 'ui-monospace, "Menlo", monospace'
    case 'dyslexic': return '"OpenDyslexic", "Comic Sans MS", sans-serif'
    default:         return 'Georgia, "Times New Roman", serif'
  }
}
