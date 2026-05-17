/**
 * Return true if the given text contains at least a couple of characters from
 * the Hiragana, Katakana, or CJK Unified Ideographs blocks. We require at
 * least 2 to avoid false positives on stray kanji in latin text.
 */
export function looksJapanese(text: string): boolean {
  if (!text) return false
  // ぀-ゟ hiragana, ゠-ヿ katakana, 一-鿿 CJK
  const re = /[぀-ゟ゠-ヿ一-鿿]/g
  let count = 0
  while (re.exec(text)) {
    count++
    if (count >= 2) return true
  }
  return false
}
