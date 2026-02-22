// app/help-center/page.tsx
import type { Metadata } from 'next'
import HelpCenterPageClient from './PageClient'

// ─── Metadata ─────────────────────────────────────────────────────────────────

const BASE_URL = 'https://stouch.id'

export const metadata: Metadata = {
  title: 'Pusat Bantuan — FAQ & Panduan Trading Stouch.id',
  description:
    'Temukan jawaban atas pertanyaanmu di Pusat Bantuan Stouch.id. Panduan lengkap tentang akun, verifikasi, deposit, penarikan, trading binary option, bonus VIP, dan lainnya.',
  keywords: [
    'bantuan trading Stouch',
    'FAQ binary option Indonesia',
    'cara deposit trading',
    'cara penarikan dana trading',
    'verifikasi akun trading',
    'panduan binary option pemula',
    'cara trading Stouch',
    'pusat bantuan Stockity',
  ],
  alternates: {
    canonical: `${BASE_URL}/help-center`,
    languages: { 'id-ID': `${BASE_URL}/help-center` },
  },
  openGraph: {
    title: 'Pusat Bantuan | Stouch.id',
    description:
      'Panduan lengkap dan FAQ untuk trader Stouch.id. Cari jawaban tentang akun, deposit, penarikan, trading, dan benefit VIP.',
    url: `${BASE_URL}/help-center`,
    images: [
      {
        url: `${BASE_URL}/og-help.png`,
        width: 1200,
        height: 630,
        alt: 'Pusat Bantuan Stouch.id — FAQ & Panduan Trading',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pusat Bantuan | Stouch.id',
    description: 'FAQ & panduan lengkap untuk trader Stouch.id.',
    images: [`${BASE_URL}/og-help.png`],
  },
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function HelpCenterJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/help-center/#webpage`,
        url: `${BASE_URL}/help-center`,
        name: 'Pusat Bantuan — Stouch.id',
        description: 'FAQ dan panduan lengkap untuk pengguna platform trading Stouch.id.',
        inLanguage: 'id-ID',
        isPartOf: { '@id': `${BASE_URL}/#website` },
        breadcrumb: { '@id': `${BASE_URL}/help-center/#breadcrumb` },
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['h1', 'h2'],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASE_URL}/help-center/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Pusat Bantuan', item: `${BASE_URL}/help-center` },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${BASE_URL}/help-center/#faq`,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Bagaimana cara mendaftar di Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Kunjungi Stouch.id dan klik "Daftar". Isi email aktif dan buat password yang kuat (minimal 8 karakter). Konfirmasi email dan akun siap digunakan.',
            },
          },
          {
            '@type': 'Question',
            name: 'Berapa minimum deposit di Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Minimum deposit di Stouch.id adalah Rp 10.000. Tersedia via transfer bank (BCA, Mandiri, BRI, BNI), e-wallet (GoPay, OVO, Dana, ShopeePay), dan virtual account.',
            },
          },
          {
            '@type': 'Question',
            name: 'Berapa lama proses penarikan dana di Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Waktu penarikan bergantung pada tier: Standard 1-3 hari kerja, Gold kurang dari 12 jam, VIP kurang dari 1 jam (ekspres).',
            },
          },
          {
            '@type': 'Question',
            name: 'Apa itu binary option trading di Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Binary option adalah trading di mana kamu memprediksi apakah harga aset akan naik atau turun dalam waktu tertentu. Jika benar, profit hingga 95%. Tersedia aset forex, crypto, komoditas, dan indeks saham.',
            },
          },
          {
            '@type': 'Question',
            name: 'Bagaimana cara verifikasi identitas di Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Upload KTP atau paspor yang masih berlaku beserta foto selfie memegang dokumen tersebut. Verifikasi selesai dalam 1-3 hari kerja setelah dokumen diterima.',
            },
          },
          {
            '@type': 'Question',
            name: 'Apakah Stouch aman dan terpercaya?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Ya, Stouch.id dioperasikan oleh Verte Securities Limited yang berlisensi di Vanuatu dan bermitra dengan Trusted by Traders (TBT), badan regulator independen. Dana tersimpan aman dengan enkripsi SSL 256-bit.',
            },
          },
          {
            '@type': 'Question',
            name: 'Bagaimana cara mengaktifkan 2FA di Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Buka Pengaturan Akun → tab Keamanan → klik "Aktifkan 2FA". Scan QR code dengan aplikasi Google Authenticator atau Authy, lalu masukkan kode 6 digit untuk menyelesaikan aktivasi.',
            },
          },
          {
            '@type': 'Question',
            name: 'Berapa minimum trade di Stouch?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Minimum trade di Stouch.id adalah Rp 1.000 per transaksi. Tersedia berbagai durasi trade dari 1 detik hingga 1 jam.',
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

export default function HelpCenterPage() {
  return (
    <>
      <HelpCenterJsonLd />
      <HelpCenterPageClient />
    </>
  )
}