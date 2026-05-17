/**
 * Lazy-loaded Japanese tokenizer wrapping kuromoji.js.
 *
 * Kuromoji ships a ~10MB IPADIC dictionary. We load it from the jsDelivr CDN
 * the first time it's needed; the browser caches the response after that, so
 * subsequent reader sessions are offline-fast.
 *
 * We load kuromoji's prebuilt UMD bundle via a <script> tag rather than going
 * through the bundler — the npm package's source entry imports Node's `path`
 * module, which would otherwise blow up at runtime.
 */

export interface JpToken {
  /** As it appeared in the source text. */
  surface: string
  /** kuromoji `basic_form` — dictionary form for lookup. */
  base: string
  /** Katakana reading from kuromoji, kept for the popover. */
  reading?: string
  /** Part of speech. We use it to skip punctuation/numbers when colorizing. */
  pos: string
  /** True if surface is purely non-Japanese (latin, punctuation only). */
  isFiller: boolean
}

/** Default CDN URL for kuromoji's IPADIC dictionary files. */
const DEFAULT_DICT_URL = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/'
/** Prebuilt browser bundle on jsDelivr. */
const KUROMOJI_BUNDLE_URL = 'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js'

interface KuromojiGlobal {
  builder: (opts: { dicPath: string }) => {
    build: (cb: (err: Error | null, t: KuromojiTokenizer) => void) => void
  }
}

declare global {
  interface Window { kuromoji?: KuromojiGlobal }
}

let kuromojiScriptPromise: Promise<KuromojiGlobal> | null = null

function loadKuromojiScript(): Promise<KuromojiGlobal> {
  if (typeof window === 'undefined') return Promise.reject(new Error('kuromoji requires a browser environment'))
  if (window.kuromoji) return Promise.resolve(window.kuromoji)
  if (kuromojiScriptPromise) return kuromojiScriptPromise
  kuromojiScriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = KUROMOJI_BUNDLE_URL
    s.async = true
    s.onload = () => {
      if (window.kuromoji) resolve(window.kuromoji)
      else reject(new Error('kuromoji loaded but no global exposed'))
    }
    s.onerror = () => reject(new Error('Failed to fetch kuromoji bundle'))
    document.head.appendChild(s)
  })
  kuromojiScriptPromise.catch(() => { kuromojiScriptPromise = null })
  return kuromojiScriptPromise
}

interface KuromojiTokenizer {
  tokenize: (text: string) => Array<{
    surface_form: string
    basic_form: string
    reading?: string
    pos: string
  }>
}

let tokenizerPromise: Promise<KuromojiTokenizer> | null = null
let progressCallbacks: Array<(s: 'idle' | 'loading' | 'ready' | 'failed') => void> = []
let status: 'idle' | 'loading' | 'ready' | 'failed' = 'idle'

function setStatus(next: typeof status) {
  status = next
  for (const cb of progressCallbacks) cb(next)
}

/**
 * Subscribe to tokenizer loading status.
 */
export function onTokenizerStatusChange(cb: (s: typeof status) => void): () => void {
  progressCallbacks.push(cb)
  cb(status)
  return () => { progressCallbacks = progressCallbacks.filter(c => c !== cb) }
}

export function getTokenizerStatus(): typeof status {
  return status
}

/**
 * Returns a kuromoji tokenizer, loading the dictionary on first call.
 *
 * @param dicPath - Optional custom URL for the dictionary files. Default points at jsDelivr.
 */
export function loadTokenizer(dicPath = DEFAULT_DICT_URL): Promise<KuromojiTokenizer> {
  if (tokenizerPromise) return tokenizerPromise
  setStatus('loading')
  tokenizerPromise = (async () => {
    const kuromoji = await loadKuromojiScript()
    return await new Promise<KuromojiTokenizer>((resolve, reject) => {
      kuromoji.builder({ dicPath }).build((err, t) => {
        if (err) { setStatus('failed'); reject(err); return }
        setStatus('ready')
        resolve(t)
      })
    })
  })()
  tokenizerPromise.catch(() => { tokenizerPromise = null })
  return tokenizerPromise
}

/**
 * Tokenize a string into `JpToken`s. Resolves immediately with a single
 * "filler" token if the tokenizer isn't ready yet; callers can await
 * `loadTokenizer()` first if they want to block.
 */
export async function tokenizeJapanese(text: string, dicPath?: string): Promise<JpToken[]> {
  const tokenizer = await loadTokenizer(dicPath)
  const raw = tokenizer.tokenize(text)
  return raw.map(r => {
    const surface = r.surface_form
    const isFiller = !/[぀-ゟ゠-ヿ一-鿿]/.test(surface)
    return {
      surface,
      base: r.basic_form && r.basic_form !== '*' ? r.basic_form : surface,
      reading: r.reading && r.reading !== '*' ? r.reading : undefined,
      pos: r.pos,
      isFiller,
    }
  })
}
