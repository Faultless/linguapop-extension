import type { CustomFeed, Episode } from '../data/types'
import { corsFetch } from './corsFetch'

/** Detect what kind of URL the user pasted and resolve to an RSS feed */
export async function resolveAndParseFeed(rawUrl: string): Promise<{
  feed: Omit<CustomFeed, 'id' | 'language' | 'addedAt'>
  episodes: Episode[]
}> {
  const url = rawUrl.trim()

  // YouTube channel / playlist / handle
  if (/youtube\.com|youtu\.be/.test(url)) {
    return resolveYouTube(url)
  }

  // Try fetching as RSS directly
  return resolveRss(url)
}

// ---- YouTube ----

function extractYouTubeChannelId(url: string): string | null {
  // /channel/UCxxxxxx
  const chanMatch = url.match(/youtube\.com\/channel\/(UC[\w-]+)/)
  if (chanMatch) return chanMatch[1]
  return null
}

function extractYouTubeHandle(url: string): string | null {
  // /@handle
  const handleMatch = url.match(/youtube\.com\/@([\w.-]+)/)
  if (handleMatch) return handleMatch[1]
  return null
}

function extractYouTubePlaylist(url: string): string | null {
  const m = url.match(/[?&]list=([\w-]+)/)
  return m ? m[1] : null
}

async function resolveYouTube(url: string): Promise<{
  feed: Omit<CustomFeed, 'id' | 'language' | 'addedAt'>
  episodes: Episode[]
}> {
  let feedUrl: string | null = null

  const channelId = extractYouTubeChannelId(url)
  if (channelId) {
    feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
  }

  const playlistId = extractYouTubePlaylist(url)
  if (!feedUrl && playlistId) {
    feedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`
  }

  // For handles like /@handle, we need to scrape the page to find the channel ID
  const handle = extractYouTubeHandle(url)
  if (!feedUrl && handle) {
    try {
      const html = await corsFetch(`https://www.youtube.com/@${handle}`).then(r => r.text())
      const cidMatch = html.match(/\"externalId\":\"(UC[\w-]+)\"/) ||
                        html.match(/channel_id=(UC[\w-]+)/) ||
                        html.match(/<meta\s[^>]*content="(UC[\w-]+)"/)
      if (cidMatch) {
        feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${cidMatch[1]}`
      }
    } catch { /* fall through */ }
  }

  // Last resort: try fetching the page and finding the RSS link
  if (!feedUrl) {
    try {
      const html = await corsFetch(url).then(r => r.text())
      const rssMatch = html.match(/channel_id=(UC[\w-]+)/)
      if (rssMatch) {
        feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${rssMatch[1]}`
      }
    } catch { /* fall through */ }
  }

  if (!feedUrl) {
    throw new Error('Could not resolve YouTube channel feed. Try pasting a channel URL like youtube.com/channel/UC... or youtube.com/@handle')
  }

  const res = await corsFetch(feedUrl)
  if (!res.ok) throw new Error('Could not fetch YouTube feed')
  const text = await res.text()
  const doc = new DOMParser().parseFromString(text, 'text/xml')

  const title = doc.querySelector('feed > title')?.textContent?.trim() ?? 'YouTube Channel'
  const description = doc.querySelector('feed > subtitle')?.textContent?.trim() ??
                      doc.querySelector('feed > author > name')?.textContent?.trim() ?? ''

  const episodes: Episode[] = [...doc.querySelectorAll('entry')].map(entry => {
    const videoId = entry.querySelector('yt\\:videoId, videoId')?.textContent?.trim() ?? ''
    return {
      title: entry.querySelector('title')?.textContent?.trim() ?? 'Untitled',
      url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : (entry.querySelector('link')?.getAttribute('href') ?? ''),
      pubDate: entry.querySelector('published')?.textContent?.trim() ?? '',
      description: entry.querySelector('media\\:description, description')?.textContent?.trim().slice(0, 120) ?? '',
    }
  }).filter(e => e.url)

  return {
    feed: { url, feedUrl, title, description, type: 'youtube' },
    episodes,
  }
}

// ---- RSS / Podcast ----

async function resolveRss(url: string): Promise<{
  feed: Omit<CustomFeed, 'id' | 'language' | 'addedAt'>
  episodes: Episode[]
}> {
  // First try fetching the URL directly as XML
  let feedUrl = url
  let text: string

  try {
    const res = await corsFetch(url)
    text = await res.text()
  } catch {
    throw new Error('Could not fetch the URL. Check that it is accessible.')
  }

  // If it looks like HTML, try to find an RSS <link> in the head
  if (text.trim().startsWith('<!') || text.trim().startsWith('<html')) {
    const htmlDoc = new DOMParser().parseFromString(text, 'text/html')
    const rssLink = htmlDoc.querySelector(
      'link[type="application/rss+xml"], link[type="application/atom+xml"]'
    )
    const discoveredUrl = rssLink?.getAttribute('href')
    if (discoveredUrl) {
      feedUrl = new URL(discoveredUrl, url).href
      const res2 = await corsFetch(feedUrl)
      text = await res2.text()
    } else {
      throw new Error('No RSS feed found at this URL. Try pasting a direct feed URL.')
    }
  }

  const doc = new DOMParser().parseFromString(text, 'text/xml')

  // Check for parse errors
  if (doc.querySelector('parsererror')) {
    throw new Error('Could not parse this as a valid RSS/Atom feed.')
  }

  // Detect RSS vs Atom
  const isAtom = !!doc.querySelector('feed > entry')

  let title: string
  let description: string
  let imageUrl: string | undefined
  let episodes: Episode[]

  if (isAtom) {
    title = doc.querySelector('feed > title')?.textContent?.trim() ?? 'Feed'
    description = doc.querySelector('feed > subtitle')?.textContent?.trim() ?? ''
    imageUrl = doc.querySelector('feed > logo')?.textContent?.trim() || undefined
    episodes = [...doc.querySelectorAll('entry')].map(entry => ({
      title: entry.querySelector('title')?.textContent?.trim() ?? 'Untitled',
      url: entry.querySelector('link[rel="enclosure"]')?.getAttribute('href') ??
           entry.querySelector('link')?.getAttribute('href') ?? '',
      pubDate: entry.querySelector('published, updated')?.textContent?.trim() ?? '',
      description: entry.querySelector('summary, content')?.textContent?.replace(/<[^>]+>/g, '').trim().slice(0, 120) ?? '',
    })).filter(e => e.url)
  } else {
    // RSS 2.0
    title = doc.querySelector('channel > title')?.textContent?.trim() ?? 'Feed'
    description = doc.querySelector('channel > description')?.textContent?.trim() ?? ''
    imageUrl = doc.querySelector('channel > image > url')?.textContent?.trim() ||
               doc.querySelector('channel > itunes\\:image, channel > image')?.getAttribute('href') || undefined
    episodes = [...doc.querySelectorAll('item')].map(item => ({
      title: item.querySelector('title')?.textContent?.trim() ?? 'Untitled',
      url: item.querySelector('enclosure')?.getAttribute('url') ??
           item.querySelector('link')?.textContent?.trim() ?? '',
      pubDate: item.querySelector('pubDate')?.textContent?.trim() ?? '',
      duration: item.querySelector('itunes\\:duration, duration')?.textContent?.trim() ?? '',
      description: item.querySelector('description')?.textContent?.replace(/<[^>]+>/g, '').trim().slice(0, 120) ?? '',
    })).filter(e => e.url)
  }

  return {
    feed: {
      url,
      feedUrl,
      title,
      description,
      type: 'podcast',
      imageUrl,
    },
    episodes,
  }
}

/** Parse episodes from an already-known feed URL (reused for PodcastDrawer) */
export async function parseFeedEpisodes(feedUrl: string, type: 'podcast' | 'youtube'): Promise<Episode[]> {
  const res = await corsFetch(feedUrl)
  const text = await res.text()
  const doc = new DOMParser().parseFromString(text, 'text/xml')

  if (type === 'youtube') {
    return [...doc.querySelectorAll('entry')].map(entry => {
      const videoId = entry.querySelector('yt\\:videoId, videoId')?.textContent?.trim() ?? ''
      return {
        title: entry.querySelector('title')?.textContent?.trim() ?? 'Untitled',
        url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : (entry.querySelector('link')?.getAttribute('href') ?? ''),
        pubDate: entry.querySelector('published')?.textContent?.trim() ?? '',
        description: entry.querySelector('media\\:description, description')?.textContent?.trim().slice(0, 120) ?? '',
      }
    }).filter(e => e.url)
  }

  // RSS/Atom podcast
  const isAtom = !!doc.querySelector('feed > entry')
  if (isAtom) {
    return [...doc.querySelectorAll('entry')].map(entry => ({
      title: entry.querySelector('title')?.textContent?.trim() ?? 'Untitled',
      url: entry.querySelector('link[rel="enclosure"]')?.getAttribute('href') ??
           entry.querySelector('link')?.getAttribute('href') ?? '',
      pubDate: entry.querySelector('published, updated')?.textContent?.trim() ?? '',
      description: entry.querySelector('summary, content')?.textContent?.replace(/<[^>]+>/g, '').trim().slice(0, 120) ?? '',
    })).filter(e => e.url)
  }

  return [...doc.querySelectorAll('item')].map(item => ({
    title: item.querySelector('title')?.textContent?.trim() ?? 'Untitled',
    url: item.querySelector('enclosure')?.getAttribute('url') ??
         item.querySelector('link')?.textContent?.trim() ?? '',
    pubDate: item.querySelector('pubDate')?.textContent?.trim() ?? '',
    duration: item.querySelector('itunes\\:duration, duration')?.textContent?.trim() ?? '',
    description: item.querySelector('description')?.textContent?.replace(/<[^>]+>/g, '').trim().slice(0, 120) ?? '',
  })).filter(e => e.url)
}
