export interface Language {
  code: string
  name: string
  flag: string
  /** Tailwind bg/text class for the language chip. */
  color: string
}

// ───────── Reader / Novels ─────────

export type TranslationStatus = 'none' | 'pending' | 'translated' | 'failed'

export interface Chapter {
  id: string
  title: string
  originalText: string
  translatedText?: string
  translationStatus: TranslationStatus
}

export interface NovelMeta {
  id: string
  title: string
  author?: string
  coverUrl?: string
  sourceLanguage: string   // language code, e.g. 'ja'
  targetLanguage: string   // user's native language, e.g. 'en'
  chapterCount: number
  addedAt: number
  lastReadChapter: number  // index
  lastReadOffset: number   // scrollTop or page index
  /**
   * Was the translated text provided by the user (e.g. dual import / JSON / paste)?
   * If true, we never overwrite chapters via MT.
   */
  hasUserTranslation: boolean
}

/**
 * Stored separately from NovelMeta so the library list stays small.
 * Chapters can be megabytes.
 */
export interface NovelBody {
  id: string               // same as NovelMeta.id
  chapters: Chapter[]
}

export type ReaderLayout = 'scroll' | 'paged'
export type ReaderViewMode = 'original' | 'translated' | 'parallel'
export type ReaderFontFamily = 'serif' | 'sans' | 'mono' | 'dyslexic'

export interface ReaderTheme {
  id: string
  name: string
  bg: string        // CSS color
  fg: string        // CSS color
  accent: string    // CSS color (used for toggles, highlights)
  muted: string     // CSS color (secondary text)
  /** True for dark themes — flips a few UI affordances. */
  dark: boolean
  /** If true, the theme is user-defined and editable. */
  custom?: boolean
}

export interface ReaderPrefs {
  fontFamily: ReaderFontFamily
  fontSize: number          // px
  lineHeight: number        // unitless
  letterSpacing: number     // em
  paragraphSpacing: number  // em
  maxWidth: number          // px column max-width
  themeId: string
  customThemes: ReaderTheme[]
  layout: ReaderLayout
  viewMode: ReaderViewMode
  /** If true, single-tap translates selected paragraphs in-place. */
  tapToTranslate: boolean
  /** Show furigana / rubies where present. */
  showRubies: boolean
  /** If true, MT requests are cached per chapter automatically. */
  autoCacheTranslations: boolean
  /** Preferred TTS rate. */
  ttsRate: number
  /** If true, Japanese source text is tokenized and colored by JLPT level. */
  coloriseJapanese: boolean
}
