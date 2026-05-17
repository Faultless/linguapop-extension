import type { Chapter } from '../data/types'

/**
 * Heuristic pruner: strips out non-prose chapters that commonly appear in
 * ebook/visual-novel exports — cover pages, copyright/imprint pages, table of
 * contents, dedications, "About the author", etc.
 *
 * All purely local: title-pattern matching, body-text regex sniffing, word
 * count threshold, and a TOC-shape detector. No network.
 */

const SKIP_TITLE_RE = new RegExp(
  '^\\s*(?:' +
  [
    'cover',
    'title\\s*page',
    'front\\s*matter',
    'back\\s*matter',
    'half\\s*title',
    'copyright',
    'colophon',
    'imprint',
    'publishing\\s*information',
    'legal\\s*notice',
    'disclaimer',
    'dedication',
    'acknowledg(?:e?ments?)',
    'thanks',
    'preface',
    'foreword',
    'afterword',
    'about\\s+the\\s+(?:author|book|series|translator)',
    'author\'?s?\\s+note',
    'translator\'?s?\\s+note',
    'note\\s+from\\s+the\\s+(?:author|translator)',
    'other\\s+(?:books|works)\\s+by',
    'by\\s+the\\s+same\\s+author',
    'also\\s+by',
    'praise\\s+for',
    'advance\\s+praise',
    'reviews',
    'table\\s+of\\s+contents',
    'contents',
    'toc',
    'index',
    'glossary',
    'bibliography',
    'references',
    'notes',
    'footnotes',
    'endnotes',
    'appendix(?:es|\\s+[A-Z])?',
    'illustrations?',
    'maps?',
    'character\\s+list',
    'dramatis\\s+personae',
    'sample\\s+chapter',
    'preview',
    'excerpt',
    'newsletter',
    'mailing\\s+list',
    'connect\\s+with',
    'follow\\s+me',
    'social\\s+media',
  ].join('|') +
  ')\\s*$',
  'i',
)

const SKIP_BODY_REGEXES: RegExp[] = [
  /\ball rights reserved\b/i,
  /\bisbn[\s-]*\d/i,
  /\blibrary of congress\b/i,
  /\bfirst (?:published|edition|printing|impression)\b/i,
  /\bcopyright\s*(?:©|\([cC]\))?\s*\d{4}\b/i,
  /©\s*\d{4}.{0,80}all rights/i,
  /\bprinted in (?:the\s+)?(?:united\s+states|usa|uk|china|canada)\b/i,
  /\bpublished by\b[^\n]{0,80}(?:press|books|publishing|house)\b/i,
  /\b(?:this is a work of fiction|any resemblance to actual)\b/i,
  /\bno part of this (?:book|publication) may be reproduced\b/i,
]

const CHAPTER_LINE_RE = /^\s*(?:chapter|ch\.?|part|book|prologue|epilogue|interlude|第\s*[\d一二三四五六七八九十百千]+\s*[章話回部]|\d{1,3}[\.:）)])\s/i

function countWords(text: string): number {
  const matches = text.match(/\p{L}+/gu)
  return matches ? matches.length : 0
}

function looksLikeTOC(text: string): boolean {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length < 4) return false
  // A TOC has many short lines that look like chapter entries.
  let chapterLike = 0
  let short = 0
  for (const line of lines) {
    if (CHAPTER_LINE_RE.test(line)) chapterLike++
    if (line.length <= 80) short++
  }
  return chapterLike / lines.length > 0.5 && short / lines.length > 0.8
}

function looksLikeLinkDump(text: string): boolean {
  // Backmatter pages often contain a wall of URLs / social handles.
  const urls = (text.match(/https?:\/\//gi) || []).length
  const ats = (text.match(/@[A-Za-z0-9_]+/g) || []).length
  return urls + ats >= 4 && countWords(text) < 400
}

export interface PruneOptions {
  /** Minimum number of words for a chapter to be considered real prose. */
  minWords?: number
}

/**
 * Strip frontmatter, backmatter, and other non-prose chapters.
 * Pure function — never mutates input.
 */
export function pruneNovel(chapters: Chapter[], opts: PruneOptions = {}): Chapter[] {
  const minWords = opts.minWords ?? 120
  return chapters.filter(c => {
    const title = c.title.trim()
    const body = c.originalText

    if (SKIP_TITLE_RE.test(title)) return false
    if (looksLikeTOC(body)) return false
    if (looksLikeLinkDump(body)) return false

    // Body-pattern sniff: a real prose chapter doesn't usually contain ISBNs
    // or "all rights reserved", *and* doesn't otherwise read as prose.
    // We require: matches a skip-pattern AND has < 400 words.
    const hits = SKIP_BODY_REGEXES.some(re => re.test(body))
    if (hits && countWords(body) < 400) return false

    if (countWords(body) < minWords) return false

    return true
  })
}

/**
 * Align an array of original chapters with an array of translated chapters,
 * producing a single Chapter[] where each item has both originalText and
 * translatedText set.
 *
 * Strategy:
 *   1. If lengths match exactly, pair by index (the common case after pruning).
 *   2. Otherwise, greedy match by normalized-title similarity (Jaccard on
 *      whitespace-tokenized words after stripping "Chapter X" prefixes).
 *      Tie-break and fallback on extracted chapter numbers.
 *   3. Originals with no good match keep an empty translation (translationStatus 'none').
 */
export function alignChapters(originals: Chapter[], translations: Chapter[]): Chapter[] {
  if (originals.length === 0) return []
  if (translations.length === 0) return originals

  if (originals.length === translations.length) {
    return originals.map((o, i) => ({
      ...o,
      translatedText: translations[i].originalText,
      translationStatus: 'translated',
    }))
  }

  const used = new Set<number>()
  return originals.map(o => {
    let bestIdx = -1
    let bestScore = 0
    for (let j = 0; j < translations.length; j++) {
      if (used.has(j)) continue
      const score = titleSimilarity(o.title, translations[j].title)
      if (score > bestScore) { bestScore = score; bestIdx = j }
    }
    if (bestIdx >= 0 && bestScore >= 0.3) {
      used.add(bestIdx)
      return {
        ...o,
        translatedText: translations[bestIdx].originalText,
        translationStatus: 'translated',
      }
    }
    return o
  })
}

function titleSimilarity(a: string, b: string): number {
  const norm = (s: string) => s
    .toLowerCase()
    .replace(/^\s*(?:chapter|ch\.?|part|book|prologue|epilogue|interlude|第)\s*[\d一二三四五六七八九十百千]+[\.:：、]?\s*/i, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const A = norm(a)
  const B = norm(b)

  // Number-based fallback: if titles strip down to nothing, compare extracted numbers.
  if (!A || !B) {
    const aNum = (a.match(/\d+/) || [])[0]
    const bNum = (b.match(/\d+/) || [])[0]
    if (aNum && aNum === bNum) return 1
    return 0
  }

  const aw = new Set(A.split(' '))
  const bw = new Set(B.split(' '))
  let inter = 0
  aw.forEach(w => { if (bw.has(w)) inter++ })
  const union = new Set<string>()
  aw.forEach(w => union.add(w))
  bw.forEach(w => union.add(w))
  return union.size ? inter / union.size : 0
}
