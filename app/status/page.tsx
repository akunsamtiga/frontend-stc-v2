// app/status/page.tsx
import type { Metadata } from 'next'
import StatusPageClient from './PageClient'

// ─── Metadata ─────────────────────────────────────────────────────────────────

const BASE_URL = 'https://stouch.id'

export const metadata: Metadata = {
  title: 'Status & Tier VIP Gold — Bonus Profit & Penarikan Ekspres',
  description:
    'Tingkatkan status akun tradingmu di Stouch.id. Standard, Gold (+5% profit), dan VIP (+10% profit, penarikan < 1 jam, dedicated manager). Naik tier otomatis berdasarkan deposit akumulatif.',
  keywords: [
    'status VIP trading',
    'tier Gold binary option',
    'bonus profit trading Indonesia',
    'penarikan ekspres trading',
    'upgrade akun trading',
    'benefit VIP Stouch',
    'program tier Stockity',
    'keuntungan member gold trading',
  ],
  alternates: {
    canonical: `${BASE_URL}/status`,
    languages: { 'id-ID': `${BASE_URL}/status` },
  },
  openGraph: {
    title: 'Status & Tier VIP Gold | Stouch.id',
    description:
      'Naik tier otomatis dan nikmati bonus profit hingga +10%, penarikan < 1 jam, dan dedicated account manager. Standard → Gold → VIP.',
    url: `${BASE_URL}/status`,
    images: [
      {
        url: `${BASE_URL}/og-status.png`,
        width: 1200,
        height: 630,
        alt: 'Program Tier Stouch.id — Standard, Gold, VIP',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Status & Tier VIP Gold | Stouch.id',
    description: 'Bonus profit +10%, penarikan ekspres, dedicated manager. Naik tier otomatis.',
    images: [`${BASE_URL}/og-status.png`],
  },
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function StatusJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/status/#webpage`,
        url: `${BASE_URL}/status`,
        name: 'Status & Tier — Stouch.id',
        description:
          'Program tier eksklusif Stouch.id: Standard, Gold, dan VIP dengan benefit berbeda di setiap level.',
        inLanguage: 'id-ID',
        isPartOf: { '@id': `${BASE_URL}/#website` },
        breadcrumb: { '@id': `${BASE_URL}/status/#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASE_URL}/status/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Status & Tier', item: `${BASE_URL}/status` },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${BASE_URL}/status/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Bagaimana cara naik tier di Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Status naik otomatis berdasarkan total akumulasi deposit: Standard (gratis), Gold (deposit ≥ Rp 200.000), VIP (deposit ≥ Rp 1.600.000). Tidak perlu request manual.',
            },
          },
          {
            '@type': 'Question',
            name: 'Apa keuntungan status VIP di Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Status VIP memberikan bonus profit +10%, penarikan ekspres kurang dari 1 jam, limit penarikan tidak terbatas, dedicated account manager, dan sinyal trading premium setiap hari.',
            },
          },
          {
            '@type': 'Question',
            name: 'Apakah status bisa turun di Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Tidak. Status tidak pernah turun meskipun saldo berkurang. Status dihitung dari total historis deposit kumulatif, bukan saldo aktif.',
            },
          },
          {
            '@type': 'Question',
            name: 'Berapa bonus profit status Gold Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Status Gold memberikan bonus profit +5% di atas profit rate standar (85%), sehingga profit rate efektif menjadi ~90% untuk setiap trade yang menang.',
            },
          },
          {
            '@type': 'Question',
            name: 'Berapa minimum deposit untuk status Gold?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Minimum total akumulasi deposit untuk status Gold adalah Rp 200.000. Untuk VIP minimum Rp 1.600.000.',
            },
          },
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

export default function StatusPage() {
  return (
    <>
      <StatusJsonLd />
      <StatusPageClient />
    </>
  )
}