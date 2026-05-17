// Data
export { LANGUAGES, LANG_MAP } from './data/languages'
export { BUILTIN_THEMES, DEFAULT_THEME_ID } from './data/readerThemes'
export type {
  Language,
  Chapter, NovelMeta, NovelBody, TranslationStatus,
  ReaderLayout, ReaderViewMode, ReaderFontFamily, ReaderTheme, ReaderPrefs,
} from './data/types'

// Hooks
export { useNovels } from './hooks/useNovels'
export type { AddNovelInput } from './hooks/useNovels'

// Context
export { ReaderPrefsProvider, useReaderPrefs } from './context/ReaderPrefsContext'

// Utils
export { corsFetch } from './utils/corsFetch'
export { idb } from './utils/idb'
export { parseEpub } from './utils/epubImporter'
export type { ParsedEpub } from './utils/epubImporter'
export { splitTxtIntoChapters } from './utils/txtImporter'
export { pruneNovel, alignChapters } from './utils/novelCleaner'
export type { PruneOptions } from './utils/novelCleaner'
export { translateText } from './utils/translator'
export type { TranslateOptions } from './utils/translator'
export { tts } from './utils/tts'
export { looksJapanese } from './utils/jpDetect'
export { tokenizeJapanese, loadTokenizer, getTokenizerStatus, onTokenizerStatusChange } from './utils/jpTokenizer'
export type { JpToken } from './utils/jpTokenizer'
export { lookupJlpt, registerJlptVocab, jlptVocabSize } from './data/jlptVocab'
export type { JlptLevel } from './data/jlptVocab'
export { lookupWord } from './utils/jpDictLookup'
export type { DictResult, DictEntry, DictSense } from './utils/jpDictLookup'
