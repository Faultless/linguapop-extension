import type { Chapter } from '../data/types'

/**
 * Heuristically split a plain-text novel into chapters.
 *
 * Order of preference for chapter boundaries:
 *   1. Lines matching /^\s*(Chapter|Ch\.?|第)\s*\d+/i (or 章, 화)
 *   2. Markdown-style headings ('# ...', '## ...')
 *   3. Triple-dash separators '---'
 *   4. Three+ blank lines
 *
 * If no boundaries are found, the whole text becomes a single chapter.
 */
export function splitTxtIntoChapters(text: string, fallbackTitle = 'Untitled'): Chapter[] {
  const normalized = text.replace(/\r\n?/g, '\n').trim()
  if (!normalized) return []

  const lines = normalized.split('\n')
  const chapterRe = /^\s*(?:chapter|ch\.?|prologue|epilogue|part|book|第\s*[\d一二三四五六七八九十百千]+\s*[章話回部]|[\d]+\.\s+\S)/i
  const headingRe = /^#{1,3}\s+\S/

  // Detect chapter starts.
  const starts: number[] = []
  let blankRun = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) { blankRun++; continue }
    const isBoundary =
      chapterRe.test(line) ||
      headingRe.test(line) ||
      line.trim() === '---' ||
      line.trim() === '***' ||
      (blankRun >= 3 && i > 0)
    if (isBoundary) starts.push(i)
    blankRun = 0
  }

  if (starts.length < 2) {
    return [{
      id: crypto.randomUUID(),
      title: fallbackTitle,
      originalText: normalized,
      translationStatus: 'none',
    }]
  }

  // If the first chapter doesn't start at 0, the preceding block is a preface.
  const boundaries = starts[0] === 0 ? starts : [0, ...starts]
  const chapters: Chapter[] = []
  for (let i = 0; i < boundaries.length; i++) {
    const start = boundaries[i]
    const end = i + 1 < boundaries.length ? boundaries[i + 1] : lines.length
    const block = lines.slice(start, end).join('\n').trim()
    if (!block) continue
    const firstLine = lines[start].replace(/^#+\s*/, '').trim() || `Chapter ${i + 1}`
    const body = block.split('\n').slice(1).join('\n').trim() || block
    chapters.push({
      id: crypto.randomUUID(),
      title: firstLine.slice(0, 120),
      originalText: body,
      translationStatus: 'none',
    })
  }
  return chapters
}
