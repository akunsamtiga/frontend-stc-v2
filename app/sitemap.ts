// app/sitemap.ts
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://stouch.id'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    // ── Halaman utama ──────────────────────────────────────────────────────────
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: { languages: { id: `${BASE_URL}/` } },
    },

    // ── Halaman publik ─────────────────────────────────────────────────────────
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages: { id: `${BASE_URL}/about` } },
    },
    {
      url: `${BASE_URL}/status`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: { languages: { id: `${BASE_URL}/status` } },
    },
    {
      url: `${BASE_URL}/help-center`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: { languages: { id: `${BASE_URL}/help-center` } },
    },

    // ── Dokumen legal ──────────────────────────────────────────────────────────
    {
      url: `${BASE_URL}/agreement`,
      lastModified: new Date('2026-01-15'),
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: { languages: { id: `${BASE_URL}/agreement` } },
    },
    {
      url: `${BASE_URL}/copytrading-agreement`,
      lastModified: new Date('2025-11-06'),
      changeFrequency: 'monthly',
      priority: 0.4,
      alternates: { languages: { id: `${BASE_URL}/copytrading-agreement` } },
    },
  ]
}