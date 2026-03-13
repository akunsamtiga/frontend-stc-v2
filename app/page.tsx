// app/page.tsx — SERVER COMPONENT
// ✅ PENTING: File ini HARUS server component (tanpa 'use client')
// Supaya bisa export metadata + canonical URL yang dibaca Google
// Komponen client yang berat ada di ./LandingPageClient.tsx

import type { Metadata } from 'next'
import LandingPageClient from './LandingPageClient'

const SITE_URL = 'https://stouch.id'
const SITE_NAME = 'Stouch.id'
const SITE_DESCRIPTION =
  'Platform trading binary option terpercaya di Indonesia. Profit hingga 100%, penarikan kilat, bonus VIP, dan keamanan tinggi. Powered by Stockity.'

// ✅ Metadata khusus untuk halaman / (landing page)
// Ini override metadata dari layout.tsx untuk halaman ini saja
export const metadata: Metadata = {
  title: `${SITE_NAME} — Platform Trading Binary Option Terpercaya`,
  description: SITE_DESCRIPTION,
  keywords: [
    'binary option indonesia',
    'platform trading terpercaya',
    'trading binary',
    'Stouch',
    'Stouch.id',
    'Stockity',
    'binary option profit tinggi',
    'trading online indonesia',
    'penarikan cepat trading',
    'IDX STC',
    'STC AutoTrade',
    'fixed time trading',
    'FTT trading',
    'copy trading indonesia',
    'broker binary option',
    'deposit binary option',
    'profit trading indonesia',
  ],
  // ✅ Canonical absolut — wajib untuk halaman root
  alternates: {
    canonical: SITE_URL,
    languages: { 'id-ID': SITE_URL },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Platform Trading Binary Option Terpercaya`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'Stouch.id — Platform Trading Binary Option Terpercaya di Indonesia',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Platform Trading Binary Option Terpercaya`,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
    creator: '@stockity_id',
    site: '@stockity_id',
  },
}

function LandingPageJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: `${SITE_NAME} — Platform Trading Binary Option Terpercaya`,
        description: SITE_DESCRIPTION,
        inLanguage: 'id-ID',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        primaryImageOfPage: { '@id': `${SITE_URL}/#primary-image` },
        breadcrumb: { '@id': `${SITE_URL}/#breadcrumb` },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['h1', 'h2'],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${SITE_URL}/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: SITE_URL },
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

export default function LandingPage() {
  return (
    <>
      <LandingPageJsonLd />
      <LandingPageClient />
    </>
  )
}