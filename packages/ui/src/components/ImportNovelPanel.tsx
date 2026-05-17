import { useState } from 'react'
import { LANGUAGES, alignChapters, parseEpub, pruneNovel, splitTxtIntoChapters, useReaderPrefs } from '@linguapop/core'
import type { AddNovelInput, Chapter } from '@linguapop/core'

type Source = 'single' | 'dual' | 'paste'
type Step = 'input' | 'loading' | 'meta' | 'error'

interface ParsedFile {
  title?: string
  author?: string
  coverUrl?: string
  language?: string
  chapters: Chapter[]
  /** Chapters dropped by the pruner — shown in the preview. */
  prunedCount: number
}

interface DraftNovel {
  title: string
  author?: string
  coverUrl?: string
  chapters: Chapter[]
  /** Stats for the preview pane. */
  stats: {
    rawOriginalCount: number
    rawTranslationCount?: number
    prunedOriginalCount: number
    prunedTranslationCount?: number
    /** Pairs that ended up with a translation attached. */
    pairedCount?: number
  }
  hasTranslation: boolean
}

export function ImportNovelPanel({
  onAdd,
  onClose,
  defaultSourceLang = 'ja',
  defaultTargetLang = 'en',
}: {
  onAdd: (input: AddNovelInput) => Promise<void> | void
  onClose: () => void
  defaultSourceLang?: string
  defaultTargetLang?: string
}) {
  const [source, setSource] = useState<Source>('single')
  const [step, setStep] = useState<Step>('input')
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<DraftNovel | null>(null)

  // single-file
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  // dual-file (second slot)
  const [translationFile, setTranslationFile] = useState<File | null>(null)

  // paste fields
  const [pastedText, setPastedText] = useState('')
  const [pastedTitle, setPastedTitle] = useState('')
  const [pastedTranslation, setPastedTranslation] = useState('')

  // metadata step
  const { theme } = useReaderPrefs()
  const [sourceLanguage, setSourceLanguage] = useState(defaultSourceLang)
  const [targetLanguage, setTargetLanguage] = useState(defaultTargetLang)
  const [titleEdit, setTitleEdit] = useState('')
  const [authorEdit, setAuthorEdit] = useState('')

  /** Parse a single file into title/author/chapters. No pruning here. */
  const parseFile = async (file: File): Promise<ParsedFile> => {
    const name = file.name.toLowerCase()
    const baseName = file.name.replace(/\.[^.]+$/, '')
    if (name.endsWith('.epub')) {
      const parsed = await parseEpub(file)
      if (!parsed.chapters.length) throw new Error(`No readable chapters in ${file.name}.`)
      return {
        title: parsed.title,
        author: parsed.author,
        coverUrl: parsed.coverDataUrl,
        language: parsed.language,
        chapters: parsed.chapters,
        prunedCount: 0,
      }
    }
    if (name.endsWith('.txt') || file.type.startsWith('text/')) {
      const text = await file.text()
      const chapters = splitTxtIntoChapters(text, baseName)
      if (!chapters.length) throw new Error(`Could not read ${file.name}.`)
      return { title: baseName, chapters, prunedCount: 0 }
    }
    throw new Error(`Unsupported file type: ${file.name}. Import an .epub or .txt file.`)
  }

  /** Prune frontmatter/backmatter from a parsed file, tracking how many we dropped. */
  const prune = (p: ParsedFile): ParsedFile => {
    const cleaned = pruneNovel(p.chapters)
    return { ...p, chapters: cleaned, prunedCount: p.chapters.length - cleaned.length }
  }

  const handleSubmitFiles = async () => {
    if (!originalFile) return
    setStep('loading')
    setError('')
    try {
      const orig = prune(await parseFile(originalFile))
      let chapters: Chapter[] = orig.chapters
      let rawTransCount: number | undefined
      let prunedTransCount: number | undefined
      let pairedCount: number | undefined
      let hasTranslation = false

      if (source === 'dual' && translationFile) {
        const transRaw = await parseFile(translationFile)
        const trans = prune(transRaw)
        rawTransCount = transRaw.chapters.length
        prunedTransCount = trans.prunedCount
        chapters = alignChapters(orig.chapters, trans.chapters)
        pairedCount = chapters.filter(c => !!c.translatedText).length
        hasTranslation = pairedCount > 0
      }

      if (!chapters.length) throw new Error('After pruning, no chapters remained. Try the other file format or paste the text directly.')

      const next: DraftNovel = {
        title: orig.title || originalFile.name.replace(/\.[^.]+$/, ''),
        author: orig.author,
        coverUrl: orig.coverUrl,
        chapters,
        hasTranslation,
        stats: {
          rawOriginalCount: orig.chapters.length + orig.prunedCount,
          rawTranslationCount: rawTransCount,
          prunedOriginalCount: orig.prunedCount,
          prunedTranslationCount: prunedTransCount,
          pairedCount,
        },
      }
      setDraft(next)
      setTitleEdit(next.title)
      setAuthorEdit(next.author || '')
      if (orig.language) {
        const m = LANGUAGES.find(l => orig.language?.toLowerCase().startsWith(l.code))
        if (m) setSourceLanguage(m.code)
      }
      setStep('meta')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed.')
      setStep('error')
    }
  }

  const handlePaste = () => {
    setError('')
    const text = pastedText.trim()
    if (!text) { setError('Paste some text first.'); setStep('error'); return }
    const rawOrig = splitTxtIntoChapters(text, pastedTitle || 'Untitled')
    if (!rawOrig.length) { setError('Could not parse the pasted text.'); setStep('error'); return }
    const orig = pruneNovel(rawOrig)
    const finalOrig = orig.length ? orig : rawOrig // don't over-prune pasted snippets

    let chapters: Chapter[] = finalOrig
    let rawTrans: number | undefined
    let prunedTrans: number | undefined
    let paired: number | undefined
    let hasTranslation = false

    if (pastedTranslation.trim()) {
      const tRaw = splitTxtIntoChapters(pastedTranslation.trim(), 'translated')
      rawTrans = tRaw.length
      const tPruned = pruneNovel(tRaw)
      const tFinal = tPruned.length ? tPruned : tRaw
      prunedTrans = tRaw.length - tFinal.length
      chapters = alignChapters(finalOrig, tFinal)
      paired = chapters.filter(c => !!c.translatedText).length
      hasTranslation = paired > 0
    }

    const next: DraftNovel = {
      title: pastedTitle || 'Untitled',
      chapters,
      hasTranslation,
      stats: {
        rawOriginalCount: rawOrig.length,
        rawTranslationCount: rawTrans,
        prunedOriginalCount: rawOrig.length - finalOrig.length,
        prunedTranslationCount: prunedTrans,
        pairedCount: paired,
      },
    }
    setDraft(next)
    setTitleEdit(next.title)
    setStep('meta')
  }

  const handleSave = async () => {
    if (!draft) return
    await onAdd({
      title: titleEdit || draft.title,
      author: authorEdit || draft.author,
      coverUrl: draft.coverUrl,
      sourceLanguage,
      targetLanguage,
      chapters: draft.chapters,
      hasUserTranslation: draft.hasTranslation,
    })
    onClose()
  }

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col"
      style={{ background: theme.bg, color: theme.fg }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
        style={{ borderColor: theme.muted + '40' }}
      >
        <button onClick={onClose} className="text-lg leading-none opacity-70 hover:opacity-100">←</button>
        <div className="text-sm font-bold">Import Novel</div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        {step === 'input' && (
          <>
            {/* Source tabs */}
            <div className="flex bg-white rounded-xl border border-stone-200 p-1 gap-1">
              {([
                { id: 'single', label: '📄 Single' },
                { id: 'dual',   label: '📚 Dual files' },
                { id: 'paste',  label: '✏ Paste' },
              ] as { id: Source; label: string }[]).map(s => (
                <button
                  key={s.id}
                  onClick={() => setSource(s.id)}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${source === s.id ? 'bg-amber-500 text-white' : 'text-stone-500 hover:bg-stone-50'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {(source === 'single' || source === 'dual') && (
              <>
                <FilePicker
                  label={source === 'dual' ? 'Original (source language)' : 'EPUB or TXT'}
                  file={originalFile}
                  onPick={setOriginalFile}
                />
                {source === 'dual' && (
                  <FilePicker
                    label="Translation (target language)"
                    file={translationFile}
                    onPick={setTranslationFile}
                    accent="emerald"
                  />
                )}
                <p className="text-[10px] text-stone-400 leading-relaxed">
                  Frontmatter, copyright pages, table-of-contents and similar fluff are stripped automatically — entirely on your device, no cloud calls.
                  {source === 'dual' && ' Chapters from both files are paired after cleaning, by index or fuzzy title match.'}
                </p>
                <button
                  onClick={handleSubmitFiles}
                  disabled={!originalFile || (source === 'dual' && !translationFile)}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold text-sm rounded-xl transition-colors"
                >
                  Continue
                </button>
              </>
            )}

            {source === 'paste' && (
              <>
                <input
                  className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-stone-200 focus:ring-2 focus:ring-amber-300 outline-none"
                  placeholder="Title"
                  value={pastedTitle}
                  onChange={e => setPastedTitle(e.target.value)}
                />
                <div>
                  <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1.5">Original text</label>
                  <textarea
                    className="w-full bg-white rounded-xl px-3 py-2.5 text-sm border border-stone-200 focus:ring-2 focus:ring-amber-300 outline-none resize-none min-h-[180px]"
                    placeholder="Paste the chapter(s) in the source language. Use blank lines, '# Chapter 1', or '---' to separate chapters."
                    value={pastedText}
                    onChange={e => setPastedText(e.target.value)}
                  />
                </div>
                <details className="bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs">
                  <summary className="cursor-pointer text-stone-600 font-semibold">Add your own translation (optional)</summary>
                  <textarea
                    className="w-full mt-2 bg-stone-50 rounded-lg px-2 py-2 text-sm border border-stone-200 focus:ring-2 focus:ring-amber-300 outline-none resize-none min-h-[140px]"
                    placeholder="Paste the matching translation. Use the same chapter separators so chapters line up."
                    value={pastedTranslation}
                    onChange={e => setPastedTranslation(e.target.value)}
                  />
                  <p className="text-[10px] text-stone-400 mt-1.5">If you skip this, you can still toggle translation on-demand using machine translation.</p>
                </details>
                <button
                  onClick={handlePaste}
                  disabled={!pastedText.trim()}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold text-sm rounded-xl transition-colors"
                >
                  Continue
                </button>
              </>
            )}
          </>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="text-2xl animate-spin">◌</div>
            <span className="text-sm text-stone-400">Parsing…</span>
          </div>
        )}

        {step === 'error' && (
          <>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs text-red-600">{error}</p>
            </div>
            <button
              onClick={() => setStep('input')}
              className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-sm rounded-xl transition-colors"
            >
              Back
            </button>
          </>
        )}

        {step === 'meta' && draft && (
          <>
            <div className="bg-white border border-stone-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  📖 {draft.chapters.length} chapter{draft.chapters.length !== 1 ? 's' : ''}
                </span>
                {draft.hasTranslation && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                    dual: {draft.stats.pairedCount}/{draft.chapters.length} paired
                  </span>
                )}
                {draft.stats.prunedOriginalCount > 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600" title="Frontmatter, copyright pages, TOC etc. removed">
                    🧹 −{draft.stats.prunedOriginalCount} fluff
                  </span>
                )}
              </div>
              <input
                className="w-full text-sm font-bold text-stone-800 outline-none border-b border-transparent focus:border-amber-300 pb-1"
                value={titleEdit}
                onChange={e => setTitleEdit(e.target.value)}
              />
              <input
                className="w-full text-xs text-stone-500 outline-none mt-1.5"
                placeholder="Author (optional)"
                value={authorEdit}
                onChange={e => setAuthorEdit(e.target.value)}
              />
              <details className="mt-3 text-[10px] text-stone-500">
                <summary className="cursor-pointer">Cleanup details</summary>
                <ul className="mt-1.5 space-y-0.5">
                  <li>Original: {draft.stats.rawOriginalCount} parsed → {draft.chapters.length} kept ({draft.stats.prunedOriginalCount} dropped)</li>
                  {draft.stats.rawTranslationCount != null && (
                    <li>
                      Translation: {draft.stats.rawTranslationCount} parsed
                      {draft.stats.prunedTranslationCount != null && ` (${draft.stats.prunedTranslationCount} dropped)`}
                      {draft.stats.pairedCount != null && ` → ${draft.stats.pairedCount} paired with originals`}
                    </li>
                  )}
                </ul>
              </details>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1.5">Source language</label>
              <LanguageChips selected={sourceLanguage} onSelect={setSourceLanguage} />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1.5">Translate to</label>
              <LanguageChips selected={targetLanguage} onSelect={setTargetLanguage} />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep('input')}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-semibold text-sm rounded-xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={sourceLanguage === targetLanguage}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold text-sm rounded-xl transition-colors"
              >
                Add to Library
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function FilePicker({
  label,
  file,
  onPick,
  accent = 'amber',
}: {
  label: string
  file: File | null
  onPick: (f: File | null) => void
  accent?: 'amber' | 'emerald'
}) {
  const borderHover = accent === 'emerald' ? 'hover:border-emerald-300' : 'hover:border-amber-300'
  const chipBg = accent === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
  return (
    <label className={`flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border-2 border-dashed border-stone-200 ${borderHover} cursor-pointer transition-colors`}>
      <span className="text-2xl">{file ? '✓' : '📄'}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{label}</div>
        <div className="text-sm font-semibold text-stone-700 truncate">
          {file ? file.name : 'Tap to choose .epub or .txt'}
        </div>
      </div>
      {file && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${chipBg}`}>
          {(file.size / 1024).toFixed(0)} KB
        </span>
      )}
      {file && (
        <button
          type="button"
          onClick={e => { e.preventDefault(); onPick(null) }}
          className="text-stone-400 hover:text-red-500 text-lg leading-none"
        >
          ×
        </button>
      )}
      <input
        type="file"
        accept=".epub,.txt,application/epub+zip,text/plain"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
        }}
      />
    </label>
  )
}

function LanguageChips({ selected, onSelect }: { selected: string; onSelect: (code: string) => void }) {
  // We include English as a fallback target even though it's not in LANGUAGES; many users want EN as the target.
  const withEnglish = [
    { code: 'en', name: 'English', flag: '🇬🇧', color: 'bg-stone-100 text-stone-700' },
    ...LANGUAGES,
  ]
  return (
    <div className="flex flex-wrap gap-1.5">
      {withEnglish.map(lang => (
        <button
          key={lang.code}
          onClick={() => onSelect(lang.code)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-all ${selected === lang.code ? `${lang.color} border-transparent font-semibold` : 'bg-white text-stone-600 border-stone-200'}`}
        >
          {lang.flag} {lang.name}
        </button>
      ))}
    </div>
  )
}
