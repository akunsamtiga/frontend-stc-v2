// app/news/page.tsx  —  Server Component
import { NewsClient } from './NewsClient'
import type { RSSNewsItem } from '@/types/index'

// ─── Fallback ──────────────────────────────────────────────────────────────────
const FALLBACK: RSSNewsItem[] = [
  {
    id: 'fallback-1',
    title: 'Analisis Market: Kondisi Pasar Saham Terkini',
    excerpt: 'Pantau pergerakan IHSG dan saham-saham unggulan hari ini. Data live tidak tersedia saat ini, silakan coba lagi beberapa saat.',
    category: 'market',
    date: new Date().toLocaleDateString('id-ID'),
    link: 'https://finance.detik.com',
    image: '',
    featured: true,
    source: 'Fallback',
  },
  {
    id: 'fallback-2',
    title: 'Tips Trading: Manajemen Risiko yang Efektif',
    excerpt: 'Pelajari cara mengelola risiko dalam trading agar modal Anda selalu terlindungi dari kerugian besar.',
    category: 'education',
    date: new Date().toLocaleDateString('id-ID'),
    link: 'https://finance.detik.com',
    image: '',
    featured: true,
    source: 'Fallback',
  },
  {
    id: 'fallback-3',
    title: 'Update: Peraturan OJK Terbaru untuk Investor Ritel',
    excerpt: 'OJK merilis aturan baru yang berdampak pada aktivitas trading ritel di pasar modal Indonesia.',
    category: 'announcement',
    date: new Date().toLocaleDateString('id-ID'),
    link: 'https://finance.detik.com',
    image: '',
    featured: true,
    source: 'Fallback',
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getCDATA(xml: string, tag: string): string {
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    'i'
  )
  return xml.match(re)?.[1].trim() ?? ''
}

function stripHTML(html: string): string {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .trim()
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return '-'
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
  } catch {
    return '-'
  }
}

function mapCategory(raw: string): RSSNewsItem['category'] {
  const c = (raw ?? '').toLowerCase()
  if (['saham', 'bursa', 'crypto', 'kurs', 'valuta', 'ihsg', 'emiten', 'investasi'].some(k => c.includes(k)))
    return 'market'
  if (['tips', 'edukasi', 'belajar', 'panduan', 'cara', 'strategi'].some(k => c.includes(k)))
    return 'education'
  if (['promo', 'diskon', 'cashback', 'bonus'].some(k => c.includes(k)))
    return 'promotion'
  if (['update', 'baru', 'fitur', 'perubahan', 'teknologi'].some(k => c.includes(k)))
    return 'update'
  return 'announcement'
}

function getImage(block: string): string {
  // 1. <media:content url="...">
  const media = block.match(/<media:content[^>]+url=["']([^"']+)["']/i)
  if (media) return media[1]
  // 2. <media:thumbnail url="...">
  const thumb = block.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/i)
  if (thumb) return thumb[1]
  // 3. <enclosure url="..." type="image/...">
  const enc = block.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image[^"']*["']/i)
            ?? block.match(/<enclosure[^>]+type=["']image[^"']*["'][^>]+url=["']([^"']+)["']/i)
  if (enc) return enc[1]
  // 4. <img src="..."> di dalam description
  const img = block.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (img) return img[1]
  return ''
}

function parseRSS(xml: string, source: string): RSSNewsItem[] {
  const blocks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []
  return blocks.map((block, i) => {
    const title   = stripHTML(getCDATA(block, 'title'))
    const excerpt = stripHTML(getCDATA(block, 'description')).slice(0, 220).trimEnd()
    const link    = getCDATA(block, 'link') || getCDATA(block, 'guid')
    const pubDate = getCDATA(block, 'pubDate')
    const catRaw  = getCDATA(block, 'category')
    const image   = getImage(block)
    return {
      id:       `detik-${i}`,
      title:    title || 'Tanpa judul',
      excerpt:  excerpt ? `${excerpt}…` : 'Klik untuk baca selengkapnya.',
      category: mapCategory(catRaw),
      date:     formatDate(pubDate),
      link,
      image,
      featured: i < 4,
      source,
    }
  }).filter(n => n.title !== 'Tanpa judul')
}

// ─── Daftar RSS yang dicoba secara berurutan ───────────────────────────────────
const RSS_SOURCES = [
  { url: 'https://rss.detik.com/index.php/finance',       source: 'Detik Finance' },
  { url: 'https://finance.detik.com/rss',                 source: 'Detik Finance' },
  { url: 'https://www.antaranews.com/rss/ekonomi',        source: 'ANTARA Ekonomi' },
  { url: 'https://www.antaranews.com/rss/top-news',       source: 'ANTARA' },
]

async function tryFetch(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

// ─── Fetch RSS langsung (coba satu per satu sampai berhasil) ──────────────────
async function fetchNews(): Promise<RSSNewsItem[]> {
  for (const { url, source } of RSS_SOURCES) {
    const xml = await tryFetch(url)
    if (!xml) {
      console.warn(`[NewsPage] Failed: ${url}`)
      continue
    }
    const news = parseRSS(xml, source)
    if (news.length > 0) {
      console.log(`[NewsPage] OK: ${url} (${news.length} items)`)
      return news
    }
  }
  console.error('[NewsPage] All RSS sources failed, using fallback')
  return FALLBACK
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default async function NewsPage() {
  const news = await fetchNews()
  return <NewsClient initialNews={news} />
}