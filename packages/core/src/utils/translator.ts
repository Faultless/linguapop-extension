import { corsFetch } from './corsFetch'

/**
 * Unified text translator.
 *
 * Routing:
 *   - Native (iOS/Android) via Capacitor: try the ML Kit / Apple Translation plugin if it's
 *     registered on the platform (window.Capacitor.Plugins.MLKitTranslate or .Translation).
 *     If unavailable, fall back to the web MT path so the feature still works.
 *   - Everywhere else (extension/web/native fallback): hit the Google Translate "gtx" public
 *     endpoint, which doesn't require an API key and supports CORS in extensions. On web we
 *     route through the existing corsFetch proxy. If that fails, try LibreTranslate.
 *
 * Chunks longer than ~4500 chars are split on sentence/paragraph boundaries before sending.
 */

const MAX_CHUNK = 4500

interface CapacitorWindow {
  Capacitor?: {
    isNativePlatform?: () => boolean
    Plugins?: Record<string, {
      translate?: (opts: { text: string; from: string; to: string }) => Promise<{ text: string }>
    }>
  }
}

async function nativeTranslateChunk(text: string, from: string, to: string): Promise<string | null> {
  const w = window as unknown as CapacitorWindow
  if (!w.Capacitor?.isNativePlatform?.()) return null
  const plugins = w.Capacitor.Plugins || {}
  const candidates = ['MLKitTranslate', 'Translation', 'Translator']
  for (const name of candidates) {
    const plugin = plugins[name]
    if (plugin?.translate) {
      try {
        const res = await plugin.translate({ text, from, to })
        if (res?.text) return res.text
      } catch {
        // try next
      }
    }
  }
  return null
}

async function googleGtxChunk(text: string, from: string, to: string): Promise<string | null> {
  const url =
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(from)}` +
    `&tl=${encodeURIComponent(to)}&dt=t&q=${encodeURIComponent(text)}`
  try {
    const res = await corsFetch(url)
    if (!res.ok) return null
    const data = await res.json() as unknown
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null
    const segments = data[0] as unknown[]
    return segments.map(s => Array.isArray(s) ? String(s[0] ?? '') : '').join('')
  } catch {
    return null
  }
}

async function libreTranslateChunk(text: string, from: string, to: string): Promise<string | null> {
  // Public LibreTranslate mirrors come and go. Try a couple.
  const endpoints = [
    'https://translate.argosopentech.com/translate',
    'https://libretranslate.de/translate',
  ]
  for (const ep of endpoints) {
    try {
      const res = await corsFetch(ep, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: from, target: to, format: 'text' }),
      })
      if (!res.ok) continue
      const data = await res.json() as { translatedText?: string }
      if (data.translatedText) return data.translatedText
    } catch {
      // try next
    }
  }
  return null
}

function splitForTranslation(text: string): string[] {
  if (text.length <= MAX_CHUNK) return [text]
  const chunks: string[] = []
  // Split on paragraph boundaries first, then sentence, then hard at MAX_CHUNK.
  const paragraphs = text.split(/\n{2,}/)
  let buf = ''
  const flush = () => { if (buf) { chunks.push(buf); buf = '' } }
  for (const p of paragraphs) {
    if ((buf + '\n\n' + p).length <= MAX_CHUNK) {
      buf = buf ? buf + '\n\n' + p : p
      continue
    }
    flush()
    if (p.length <= MAX_CHUNK) { buf = p; continue }
    // Paragraph itself too long — sentence split.
    const sentences = p.split(/(?<=[.!?。！？])\s+/)
    for (const s of sentences) {
      if ((buf + ' ' + s).length <= MAX_CHUNK) {
        buf = buf ? buf + ' ' + s : s
      } else {
        flush()
        if (s.length <= MAX_CHUNK) buf = s
        else {
          // Hard cut.
          for (let i = 0; i < s.length; i += MAX_CHUNK) chunks.push(s.slice(i, i + MAX_CHUNK))
        }
      }
    }
  }
  flush()
  return chunks
}

export interface TranslateOptions {
  /** Optional progress callback (0..1) for long texts. */
  onProgress?: (p: number) => void
  /** AbortSignal to cancel mid-translation. */
  signal?: AbortSignal
}

export async function translateText(
  text: string,
  from: string,
  to: string,
  opts: TranslateOptions = {},
): Promise<string> {
  if (!text.trim()) return ''
  if (from === to) return text

  const chunks = splitForTranslation(text)
  const out: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    if (opts.signal?.aborted) throw new Error('Translation cancelled')
    const chunk = chunks[i]
    const translated =
      (await nativeTranslateChunk(chunk, from, to)) ??
      (await googleGtxChunk(chunk, from, to)) ??
      (await libreTranslateChunk(chunk, from, to))
    if (translated == null) throw new Error('Translation service unavailable. Try again or import a translated copy.')
    out.push(translated)
    opts.onProgress?.((i + 1) / chunks.length)
  }
  return out.join('\n\n')
}
