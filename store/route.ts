import { NextResponse } from 'next/server'
import type { RSSNewsItem } from '@/types/index'

// Re-export for convenience
export type { RSSNewsItem }

// ─── Parser RSS sederhana (tanpa library) ──────────────────────────────────────
function getCDATA(xml: string, tag: string): string {
  // Support <tag><![CDATA[...]]></tag> dan <tag>...</tag>
  const re = new RegExp(
    `<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`,
    'i'
  )
  const m = xml.match(re)
  if (!m) return ''
  return m[1].trim()
}

function stripHTML(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').trim()
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

/**
 * Mapping kategori dari Detik Finance ke kategori internal.
 * Detik Finance pakai tag <category> seperti "Ekonomi", "Saham", "Moneter", dll.
 */
function mapCategory(raw: string): RSSNewsItem['category'] {
  const c = (raw || '').toLowerCase()
  if (['saham', 'bursa', 'crypto', 'kurs', 'valuta', 'ihsg', 'emiten', 'investasi'].some(k => c.includes(k)))
    return 'market'
  if (['tips', 'edukasi', 'belajar', 'panduan', 'cara', 'strategi'].some(k => c.includes(k)))
    return 'education'
  if (['promo', 'diskon', 'cashback', 'bonus', 'gratis'].some(k => c.includes(k)))
    return 'promotion'
  if (['update', 'baru', 'fitur', 'perubahan', 'teknologi'].some(k => c.includes(k)))
    return 'update'
  // default: announcement (berita umum ekonomi/moneter/peraturan)
  return 'announcement'
}

function parseRSS(xml: string): RSSNewsItem[] {
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? []
  const results: RSSNewsItem[] = []

  for (let i = 0; i < itemBlocks.length; i++) {
    const block = itemBlocks[i]
    const title   = stripHTML(getCDATA(block, 'title'))
    const rawDesc = getCDATA(block, 'description')
    const excerpt = stripHTML(rawDesc).slice(0, 220).trimEnd()
    const link    = getCDATA(block, 'link') || getCDATA(block, 'guid')
    const pubDate = getCDATA(block, 'pubDate')
    const catRaw  = getCDATA(block, 'category')

    if (!title) continue

    results.push({
      id:       `detik-${i}`,
      title,
      excerpt:  excerpt ? `${excerpt}…` : 'Klik untuk baca selengkapnya.',
      category: mapCategory(catRaw),
      date:     formatDate(pubDate),
      link,
      image:    '',
      featured: i < 4,
      source:   'Detik Finance',
    })
  }

  return results
}

// ─── Handler ───────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    const response = await fetch('https://finance.detik.com/indeks.rss', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
        'Accept': 'application/rss+xml, application/xml, text/xml',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`)
    }

    const xml  = await response.text()
    const news = parseRSS(xml)

    if (news.length === 0) {
      throw new Error('No items found in RSS feed')
    }

    return NextResponse.json({
      news,
      total:     news.length,
      source:    'Detik Finance',
      fetchedAt: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[/api/news] Error:', err)
    return NextResponse.json(
      {
        error:  'Gagal mengambil berita dari Detik Finance.',
        detail: err instanceof Error ? err.message : 'Unknown error',
        news:   [],
      },
      { status: 500 }
    )
  }
}