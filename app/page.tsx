// app/page.tsx — SERVER COMPONENT
// ✅ PENTING: File ini HARUS server component (tanpa 'use client')
// Supaya bisa export metadata + canonical URL yang dibaca Google.
// Metadata di sini HANYA yang berbeda dari layout.tsx (tidak duplikasi icons, manifest, robots, dll).
// Komponen client yang berat ada di ./LandingPageClient.tsx

import type { Metadata } from 'next'
import LandingPageClient from './LandingPageClient'

const SITE_URL = 'https://stouch.id'
const SITE_NAME = 'Stouch'
const SITE_DESCRIPTION =
  'Platform trading binary option terpercaya di Indonesia. Profit hingga 100%, penarikan kilat, bonus VIP, dan keamanan tinggi. Powered by Stockity.'

// ✅ PERBAIKAN: page.tsx hanya mendefinisikan metadata yang BERBEDA dari layout.tsx.
// Layout sudah handle: icons, manifest, appleWebApp, robots, metadataBase, generator, authors.
// Di sini cukup: title halaman ini, description, canonical, keywords spesifik halaman, OG & Twitter.
export const metadata: Metadata = {
  title: `${SITE_NAME} - Platform Trading Terpercaya di Indonesia`,
  description: SITE_DESCRIPTION,
  keywords: [
    'platform trading terpercaya',
    'fixed time trading indonesia',
    'FTT trading',
    'copy trading indonesia',
    'trading online indonesia',
    'Stouch',
    'Stouch.id',
    'Stockity',
    'IDX STC',
    'STC AutoTrade',
    'broker trading indonesia',
    'penarikan cepat trading',
    'deposit trading indonesia',
    'profit trading indonesia',
  ],
  alternates: {
    canonical: SITE_URL,
    languages: {
      'id-ID': SITE_URL,
      // ✅ PERBAIKAN: tambahkan x-default agar Google tahu ini halaman default
      'x-default': SITE_URL,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} - Platform Trading Terpercaya di Indonesia`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Platform Trading Terpercaya di Indonesia`,
        type: 'image/png',
      },
      // ✅ PERBAIKAN: konsisten dengan layout.tsx, tambah logo sebagai fallback
      {
        url: `${SITE_URL}/stc-logo1.png`,
        width: 512,
        height: 512,
        alt: `Logo ${SITE_NAME}`,
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} - Platform Trading Terpercaya di Indonesia`,
    description: SITE_DESCRIPTION,
    images: [{ url: `${SITE_URL}/og-image.png`, alt: `${SITE_NAME} - Platform Trading Terpercaya di Indonesia` }],
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
        name: `${SITE_NAME} - Platform Trading Terpercaya di Indonesia`,
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
      {/* ✅ Preload LCP images — hero background loaded ASAP */}
      <link
        rel="preload"
        as="image"
        href="/best1.jpg"
        media="(max-width: 767px)"
        // @ts-ignore fetchpriority is valid HTML attribute
        fetchpriority="high"
      />
      <link
        rel="preload"
        as="image"
        href="/best1pc.jpeg"
        media="(min-width: 768px)"
        // @ts-ignore
        fetchpriority="high"
      />
      <LandingPageJsonLd />
      <LandingPageClient />
    </>
  )
}