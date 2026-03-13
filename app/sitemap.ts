// app/sitemap.ts
import type { MetadataRoute } from 'next'

const BASE_URL = 'https://stouch.id'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: { languages: { id: `${BASE_URL}/` } },
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: now,
      changeFrequency: 'weekly',
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
    {
      url: `${BASE_URL}/berita`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: { languages: { id: `${BASE_URL}/berita` } },
    },
    {
      url: `${BASE_URL}/support`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
      alternates: { languages: { id: `${BASE_URL}/support` } },
    },
    {
      url: `${BASE_URL}/agreement`,
      lastModified: new Date('2022-01-15'),
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: { languages: { id: `${BASE_URL}/agreement` } },
    },
    {
      url: `${BASE_URL}/copytrading-agreement`,
      lastModified: new Date('2023-11-06'),
      changeFrequency: 'monthly',
      priority: 0.4,
      alternates: { languages: { id: `${BASE_URL}/copytrading-agreement` } },
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date('2022-01-15'),
      changeFrequency: 'monthly',
      priority: 0.4,
      alternates: { languages: { id: `${BASE_URL}/privacy` } },
    },
  ]
}