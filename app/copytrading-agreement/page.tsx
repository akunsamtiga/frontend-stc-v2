// app/copytrading-agreement/page.tsx
import type { Metadata } from 'next'
import CopyTradingPageClient from './PageClient'

// ─── Metadata ─────────────────────────────────────────────────────────────────

const BASE_URL = 'https://stouch.id'

export const metadata: Metadata = {
  title: 'Perjanjian Copy Trading — Stouch.id',
  description:
    'Perjanjian Copy Trading Stouch.id: aturan menyalin perdagangan trader lain, komisi, hak kewajiban, dan pengungkapan risiko. Berlaku mulai 6 November 2025.',
  keywords: [
    'copy trading agreement Stouch',
    'perjanjian copy trading Indonesia',
    'aturan copy trading binary',
    'copy trade Stockity',
    'salin perdagangan Stouch',
  ],
  alternates: {
    canonical: `${BASE_URL}/copytrading-agreement`,
    languages: { 'id-ID': `${BASE_URL}/copytrading-agreement` },
  },
  openGraph: {
    title: 'Perjanjian Copy Trading | Stouch.id',
    description: 'Aturan lengkap layanan Copy Trading Stouch.id. Berlaku mulai 6 November 2025.',
    url: `${BASE_URL}/copytrading-agreement`,
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Perjanjian Copy Trading Stouch.id' }],
  },
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function CopyTradingJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/copytrading-agreement/#webpage`,
        url: `${BASE_URL}/copytrading-agreement`,
        name: 'Perjanjian Copy Trading — Stouch.id',
        description: 'Perjanjian Copy Trading resmi Stouch.id, berlaku mulai 6 November 2025.',
        inLanguage: 'id-ID',
        isPartOf: { '@id': `${BASE_URL}/#website` },
        breadcrumb: { '@id': `${BASE_URL}/copytrading-agreement/#breadcrumb` },
        datePublished: '2025-11-06',
        dateModified: '2025-11-06',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASE_URL}/copytrading-agreement/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Perjanjian Klien', item: `${BASE_URL}/agreement` },
          { '@type': 'ListItem', position: 3, name: 'Perjanjian Copy Trading', item: `${BASE_URL}/copytrading-agreement` },
        ],
      },
    ],
  }
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CopyTradingAgreementPage() {
  return (
    <>
      <CopyTradingJsonLd />
      <CopyTradingPageClient />
    </>
  )
}