// app/panduan-affiliator/page.tsx
import type { Metadata } from 'next'
import AffiliatorRegistrationPageClient from './PageClient'

const BASE_URL = 'https://stouch.id'

export const metadata: Metadata = {
  title: 'Daftar Affiliator — Cara Apply, Komisi & Panduan Lengkap | Stouch.id',
  description:
    'Panduan lengkap cara mendaftar program affiliator Stouch.id. Pelajari sistem komisi hingga 80%, cara apply, fitur Autotrade, syarat penarikan komisi, dan semua yang perlu kamu ketahui sebelum bergabung.',
  keywords: [
    'daftar affiliator Stouch',
    'program afiliasi trading Indonesia',
    'komisi affiliator binary option',
    'cara apply affiliator Stouch',
    'affiliate program Stockity',
    'komisi trading Indonesia',
    'referral trading Stouch',
    'autotrade whitelist affiliator',
    'program referral binary option',
    'cara mendapat komisi dari trading',
  ],
  alternates: {
    canonical: `${BASE_URL}/panduan-affiliator`,
    languages: { 'id-ID': `${BASE_URL}/panduan-affiliator` },
  },
  openGraph: {
    title: 'Daftar Affiliator Stouch.id — Raih Komisi hingga 80%',
    description:
      'Panduan lengkap cara mendaftar dan menjadi affiliator Stouch.id. Sistem komisi dinamis hingga 80%, penarikan mudah, dan fitur Autotrade eksklusif.',
    url: `${BASE_URL}/panduan-affiliator`,
    images: [
      {
        url: `${BASE_URL}/og-affiliator.png`,
        width: 1200,
        height: 630,
        alt: 'Program Affiliator Stouch.id — Komisi hingga 80%',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daftar Affiliator Stouch.id — Raih Komisi hingga 80%',
    description: 'Panduan lengkap program affiliator Stouch.id.',
    images: [`${BASE_URL}/og-affiliator.png`],
  },
}

function AffiliatorJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/panduan-affiliator/#webpage`,
        url: `${BASE_URL}/panduan-affiliator`,
        name: 'Daftar Affiliator — Stouch.id',
        description:
          'Panduan lengkap cara mendaftar program affiliator Stouch.id, sistem komisi, dan syarat penarikan.',
        inLanguage: 'id-ID',
        isPartOf: { '@id': `${BASE_URL}/#website` },
        breadcrumb: { '@id': `${BASE_URL}/panduan-affiliator/#breadcrumb` },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['h1', 'h2'],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASE_URL}/panduan-affiliator/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: BASE_URL },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Daftar Affiliator',
            item: `${BASE_URL}/panduan-affiliator`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${BASE_URL}/panduan-affiliator/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Apa itu program affiliator Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Program affiliator Stouch memungkinkan kamu mendapatkan komisi otomatis dari kerugian trading pengguna yang kamu undang menggunakan kode referral unikmu di akun real.',
            },
          },
          {
            '@type': 'Question',
            name: 'Berapa komisi yang didapatkan affiliator Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: '2 bulan pertama (Fase Baru): 80% flat dari semua loss invitee. Setelah 2 bulan (Fase Lama): 50%–80% dinamis berdasarkan jumlah user aktif per bulan.',
            },
          },
          {
            '@type': 'Question',
            name: 'Bagaimana cara mendaftar menjadi affiliator Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Pastikan akun Stouch sudah aktif dan KYC terverifikasi, lalu hubungi support@stouch.id atau live chat dengan subjek "Permohonan Affiliator". Sertakan informasi platform/komunitas yang kamu kelola. Tim kami akan memproses dalam 1–3 hari kerja.',
            },
          },
          {
            '@type': 'Question',
            name: 'Berapa minimum penarikan komisi affiliator?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Minimum penarikan komisi adalah Rp 50.000. Komisi bisa ditarik setelah minimal 5 pengguna undanganmu sudah melakukan deposit (threshold default).',
            },
          },
          {
            '@type': 'Question',
            name: 'Apa itu fitur Autotrade untuk affiliator?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Fitur Autotrade memungkinkan affiliator mengelola whitelist User ID yang boleh menggunakan bot autotrade mereka. Mengaktifkan Autotrade akan mengenakan fee 5% pada setiap penarikan komisi.',
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

export default function AffiliatorRegistrationPage() {
  return (
    <>
      <AffiliatorJsonLd />
      <AffiliatorRegistrationPageClient />
    </>
  )
}