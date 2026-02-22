// app/robots.ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
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
      // Blokir bot yang sering abuse
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot', 'MJ12bot'],
        disallow: '/',
      },
    ],
    sitemap: 'https://stouch.id/sitemap.xml',
    host: 'https://stouch.id',
  }
}