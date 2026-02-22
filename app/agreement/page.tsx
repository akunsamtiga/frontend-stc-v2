// app/agreement/page.tsx
import type { Metadata } from 'next'
import AgreementPageClient from './PageClient'

// ─── Metadata ─────────────────────────────────────────────────────────────────

const BASE_URL = 'https://stouch.id'

export const metadata: Metadata = {
  title: 'Perjanjian Klien — Syarat & Ketentuan Stouch.id',
  description:
    'Baca Perjanjian Klien lengkap Stouch.id (berlaku 15 Januari 2026). Mencakup definisi, pendaftaran, mekanisme trading FTT & CFD, bonus, penarikan, penyelesaian sengketa, dan ketentuan hukum Vanuatu.',
  keywords: [
    'perjanjian klien Stouch',
    'syarat ketentuan trading binary',
    'terms conditions Stockity',
    'legal trading Indonesia',
    'perjanjian binary option',
    'Verte Securities Limited',
  ],
  alternates: {
    canonical: `${BASE_URL}/agreement`,
    languages: { 'id-ID': `${BASE_URL}/agreement` },
  },
  openGraph: {
    title: 'Perjanjian Klien | Stouch.id',
    description: 'Syarat dan ketentuan resmi platform trading Stouch.id. Berlaku mulai 15 Januari 2026.',
    url: `${BASE_URL}/agreement`,
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Perjanjian Klien Stouch.id' }],
  },
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function AgreementJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/agreement/#webpage`,
        url: `${BASE_URL}/agreement`,
        name: 'Perjanjian Klien — Stouch.id',
        description: 'Perjanjian Klien resmi Stouch.id, berlaku mulai 15 Januari 2026.',
        inLanguage: 'id-ID',
        isPartOf: { '@id': `${BASE_URL}/#website` },
        breadcrumb: { '@id': `${BASE_URL}/agreement/#breadcrumb` },
        datePublished: '2026-01-15',
        dateModified: '2026-01-15',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASE_URL}/agreement/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Perjanjian Klien', item: `${BASE_URL}/agreement` },
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

export default function AgreementPage() {
  return (
    <>
      <AgreementJsonLd />
      <AgreementPageClient />
    </>
  )
}