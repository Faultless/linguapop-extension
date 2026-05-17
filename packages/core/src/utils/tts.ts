/**
 * Thin wrapper around the Web Speech API for reading novel chapters aloud.
 *
 * Capacitor's WebView exposes window.speechSynthesis on both iOS and Android,
 * so a single implementation works across all three targets.
 *
 * Single global queue — there can only be one active utterance at a time.
 */

export const tts = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  },

  speak(text: string, opts: { lang?: string; rate?: number; onEnd?: () => void; onBoundary?: (charIndex: number) => void } = {}) {
    if (!this.isSupported() || !text.trim()) return
    this.stop()
    const u = new SpeechSynthesisUtterance(text)
    if (opts.lang) u.lang = bcpFromCode(opts.lang)
    if (opts.rate != null) u.rate = opts.rate
    u.onend = () => opts.onEnd?.()
    u.onerror = () => opts.onEnd?.()
    if (opts.onBoundary) u.onboundary = ev => opts.onBoundary?.(ev.charIndex)
    window.speechSynthesis.speak(u)
  },

  pause() {
    if (this.isSupported()) window.speechSynthesis.pause()
  },

  resume() {
    if (this.isSupported()) window.speechSynthesis.resume()
  },

  stop() {
    if (this.isSupported()) window.speechSynthesis.cancel()
  },

  isSpeaking(): boolean {
    return this.isSupported() && window.speechSynthesis.speaking
  },
}

/** Map our 2-letter language codes to reasonable BCP-47 locales. */
function bcpFromCode(code: string): string {
  const map: Record<string, string> = {
    en: 'en-US', fr: 'fr-FR', es: 'es-ES', de: 'de-DE', it: 'it-IT',
    pt: 'pt-PT', ja: 'ja-JP', ko: 'ko-KR', zh: 'zh-CN', ar: 'ar-SA', ru: 'ru-RU',
  }
  return map[code] || code
}
