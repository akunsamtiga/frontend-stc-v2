// app/privacy/page.tsx
import type { Metadata } from 'next'
import PrivacyPageClient from './PageClient'

const BASE_URL = 'https://stouch.id'

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — Stouch.id',
  description:
    'Kebijakan Privasi Stouch.id: cara kami mengumpulkan, menggunakan, mengungkapkan, dan melindungi informasi pribadi Anda saat menggunakan platform perdagangan Stouch. Berlaku mulai 15 Januari 2026.',
  keywords: [
    'kebijakan privasi Stouch',
    'privacy policy Stouch.id',
    'perlindungan data Stouch',
    'data pribadi platform trading',
    'Verte Securities privasi',
  ],
  alternates: {
    canonical: `${BASE_URL}/privacy`,
    languages: { 'id-ID': `${BASE_URL}/privacy` },
  },
  openGraph: {
    title: 'Kebijakan Privasi | Stouch.id',
    description: 'Aturan lengkap perlindungan data pribadi pengguna Stouch.id. Berlaku mulai 15 Januari 2026.',
    url: `${BASE_URL}/privacy`,
    images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: 'Kebijakan Privasi Stouch.id' }],
  },
}

function PrivacyJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/privacy/#webpage`,
        url: `${BASE_URL}/privacy`,
        name: 'Kebijakan Privasi — Stouch.id',
        description: 'Kebijakan Privasi resmi Stouch.id, berlaku mulai 15 Januari 2026.',
        inLanguage: 'id-ID',
        isPartOf: { '@id': `${BASE_URL}/#website` },
        breadcrumb: { '@id': `${BASE_URL}/privacy/#breadcrumb` },
        datePublished: '2026-01-15',
        dateModified: '2026-01-15',
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASE_URL}/privacy/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Kebijakan Privasi', item: `${BASE_URL}/privacy` },
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

export default function PrivacyPage() {
  return (
    <>
      <PrivacyJsonLd />
      <PrivacyPageClient />
    </>
  )
}