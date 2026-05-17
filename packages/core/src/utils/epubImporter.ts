import JSZip from 'jszip'
import type { Chapter } from '../data/types'

export interface ParsedEpub {
  title: string
  author?: string
  language?: string
  coverDataUrl?: string
  chapters: Chapter[]
}

/**
 * Parse an EPUB 2/3 file blob into a structured novel.
 *
 * EPUB layout:
 *   - META-INF/container.xml points to the OPF file
 *   - The OPF lists <metadata>, <manifest> (every file), and <spine> (read order)
 *   - The spine itemrefs reference manifest items by idref; manifest items hold href + media-type
 *
 * We pull metadata for title/author/language, then walk the spine in order,
 * extract visible text from each XHTML file, and emit one chapter per spine item.
 * Items with too little text are skipped (e.g. cover.xhtml, copyright pages).
 */
export async function parseEpub(file: File | Blob): Promise<ParsedEpub> {
  const zip = await JSZip.loadAsync(file)

  // 1. Find OPF path via container.xml
  const containerFile = zip.file('META-INF/container.xml')
  if (!containerFile) throw new Error('Not a valid EPUB: missing META-INF/container.xml')
  const containerXml = await containerFile.async('string')
  const opfPath = /full-path="([^"]+)"/.exec(containerXml)?.[1]
  if (!opfPath) throw new Error('EPUB container.xml has no rootfile')

  const opfFile = zip.file(opfPath)
  if (!opfFile) throw new Error(`EPUB: OPF not found at ${opfPath}`)
  const opfXml = await opfFile.async('string')
  const opfDir = opfPath.includes('/') ? opfPath.slice(0, opfPath.lastIndexOf('/') + 1) : ''

  const parser = new DOMParser()
  const opfDoc = parser.parseFromString(opfXml, 'application/xml')

  // 2. Metadata
  const title = textOf(opfDoc, 'title') || 'Untitled'
  const author = textOf(opfDoc, 'creator')
  const language = textOf(opfDoc, 'language')

  // 3. Build manifest map: id → { href, mediaType, properties }
  const manifest = new Map<string, { href: string; mediaType: string; properties: string }>()
  opfDoc.querySelectorAll('manifest > item').forEach(el => {
    const id = el.getAttribute('id') || ''
    const href = el.getAttribute('href') || ''
    const mediaType = el.getAttribute('media-type') || ''
    const properties = el.getAttribute('properties') || ''
    if (id && href) manifest.set(id, { href, mediaType, properties })
  })

  // 4. Cover (best effort)
  let coverDataUrl: string | undefined
  const coverId =
    opfDoc.querySelector('metadata > meta[name="cover"]')?.getAttribute('content') ||
    [...manifest.entries()].find(([, v]) => v.properties.includes('cover-image'))?.[0]
  if (coverId) {
    const cover = manifest.get(coverId)
    if (cover) {
      const coverFile = zip.file(opfDir + cover.href)
      if (coverFile) {
        const b64 = await coverFile.async('base64')
        coverDataUrl = `data:${cover.mediaType || 'image/jpeg'};base64,${b64}`
      }
    }
  }

  // 5. Spine order
  const spineIds: string[] = []
  opfDoc.querySelectorAll('spine > itemref').forEach(el => {
    const idref = el.getAttribute('idref')
    if (idref) spineIds.push(idref)
  })

  // 6. Extract text per spine item
  const chapters: Chapter[] = []
  for (let i = 0; i < spineIds.length; i++) {
    const item = manifest.get(spineIds[i])
    if (!item) continue
    if (!/xhtml|html/i.test(item.mediaType) && !/\.x?html?$/i.test(item.href)) continue
    const f = zip.file(opfDir + item.href)
    if (!f) continue
    const raw = await f.async('string')
    const { title: chTitle, text } = extractXhtmlText(raw)
    if (text.replace(/\s+/g, ' ').trim().length < 80) continue // skip cover/colophon
    chapters.push({
      id: crypto.randomUUID(),
      title: chTitle || `Chapter ${chapters.length + 1}`,
      originalText: text,
      translationStatus: 'none',
    })
  }

  return { title, author, language, coverDataUrl, chapters }
}

function textOf(doc: Document, tag: string): string | undefined {
  // EPUB metadata uses dc: prefix in the dc namespace.
  const ns = 'http://purl.org/dc/elements/1.1/'
  const el = doc.getElementsByTagNameNS(ns, tag)[0] || doc.getElementsByTagName(`dc:${tag}`)[0]
  return el?.textContent?.trim() || undefined
}

/**
 * Extract human-readable text from an XHTML chapter, preserving paragraph breaks.
 * Returns the inferred chapter title (first <h1>/<h2>/<h3>) and the body.
 */
function extractXhtmlText(html: string): { title: string; text: string } {
  // Sanitize: drop script/style early. Use regex (DOMParser would also work, this is faster + safer for malformed XHTML).
  const cleaned = html
    .replace(/<\?xml[\s\S]*?\?>/g, '')
    .replace(/<!DOCTYPE[\s\S]*?>/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')

  const parser = new DOMParser()
  const doc = parser.parseFromString(cleaned, 'text/html')
  const title =
    doc.querySelector('h1, h2, h3, title')?.textContent?.trim().slice(0, 120) || ''

  const body = doc.body || doc.documentElement
  // Force block-level elements to be newline-separated by inserting markers.
  body.querySelectorAll('br').forEach(br => br.replaceWith('\n'))
  const blockSel = 'p, div, li, h1, h2, h3, h4, h5, h6, blockquote, pre, tr'
  body.querySelectorAll(blockSel).forEach(el => {
    el.appendChild(document.createTextNode('\n\n'))
  })

  const text = (body.textContent || '')
    .replace(/\u00A0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return { title, text }
}
