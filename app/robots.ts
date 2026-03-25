// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/dashboard/',
          '/balance/',
          '/berita/',
          '/calendar/',
          '/history/',
          '/payment/',
          '/profile/',
          '/admin/',
          '/tournaments/',
          '/support/',
          '/withdrawal/',
          '/referral/',
        ],
      },
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot'],
        disallow: '/',
      },
    ],
    sitemap: 'https://stouch.id/sitemap.xml',
  }
}