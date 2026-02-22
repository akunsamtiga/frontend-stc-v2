// app/about/page.tsx
import type { Metadata } from 'next'
import PageNavbar from '@/components/PageNavbar'
import { ExternalLink, Mail, CheckCircle2 } from 'lucide-react'

// ─── Metadata ─────────────────────────────────────────────────────────────────

const BASE_URL = 'https://stouch.id'

export const metadata: Metadata = {
  title: 'Tentang Kami — Stouch.id Platform Trading Terpercaya',
  description:
    'Stouch.id adalah platform trading binary option terpercaya powered by Stockity. Berlisensi, teregulasi, bermitra dengan Trusted by Traders (TBT), dan melayani trader Indonesia dari semua level.',
  keywords: [
    'tentang Stouch',
    'Stouch trading Indonesia',
    'Stockity broker',
    'platform trading teregulasi',
    'binary option terpercaya Indonesia',
    'Trusted by Traders',
    'Verte Securities Limited',
  ],
  alternates: {
    canonical: `${BASE_URL}/about`,
    languages: { 'id-ID': `${BASE_URL}/about` },
  },
  openGraph: {
    title: 'Tentang Kami — Stouch.id',
    description:
      'Stouch.id — platform trading binary option terpercaya untuk semua level trader Indonesia. Berlisensi, teregulasi, dukungan 24 jam.',
    url: `${BASE_URL}/about`,
    images: [
      {
        url: `${BASE_URL}/og-about.png`,
        width: 1200,
        height: 630,
        alt: 'Tentang Stouch.id — Platform Trading Binary Option Terpercaya',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tentang Kami — Stouch.id',
    description: 'Platform trading binary option terpercaya untuk trader Indonesia.',
    images: [`${BASE_URL}/og-about.png`],
  },
}

// ─── JSON-LD ──────────────────────────────────────────────────────────────────

function AboutJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${BASE_URL}/about/#webpage`,
        url: `${BASE_URL}/about`,
        name: 'Tentang Kami — Stouch.id',
        description:
          'Stouch.id adalah platform trading binary option terpercaya powered by Stockity.',
        inLanguage: 'id-ID',
        isPartOf: { '@id': `${BASE_URL}/#website` },
        about: { '@id': `${BASE_URL}/#organization` },
        breadcrumb: { '@id': `${BASE_URL}/about/#breadcrumb` },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${BASE_URL}/about/#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Beranda', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Tentang Kami', item: `${BASE_URL}/about` },
        ],
      },
      {
        '@type': 'FinancialService',
        '@id': `${BASE_URL}/#financialservice`,
        name: 'Stouch.id — Platform Trading Binary Option',
        url: BASE_URL,
        description:
          'Platform trading binary option dengan profit hingga 95%, penarikan kilat, dan keamanan maksimal untuk trader Indonesia.',
        serviceType: 'Binary Options Trading',
        areaServed: { '@type': 'Country', name: 'Indonesia' },
        provider: { '@id': `${BASE_URL}/#organization` },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Layanan Trading',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: { '@type': 'Service', name: 'Fixed Time Trading (FTT)' },
            },
            {
              '@type': 'Offer',
              itemOffered: { '@type': 'Service', name: 'Copy Trading' },
            },
            {
              '@type': 'Offer',
              itemOffered: { '@type': 'Service', name: 'Trading CFD Demo' },
            },
          ],
        },
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

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AboutJsonLd />

      <PageNavbar title="Tentang Kami" subtitle="Mengenal Stouch lebih dalam" />

      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 pb-20">

        {/* ── Hero ── */}
        <div className="py-10 sm:py-12 lg:py-16 max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 mb-5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">
              Platform Trading Terpercaya
            </span>
          </div>
          <h1
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-bold text-gray-900 mb-5"
            style={{ letterSpacing: '-0.04em', lineHeight: 1.1 }}
          >
            Memberdayakan trader dari semua level
          </h1>
          <p className="text-sm sm:text-base text-gray-500 leading-relaxed">
            Stouch adalah platform trading canggih yang dirancang untuk memberdayakan trader
            dengan perangkat dan layanan terbaik di pasar keuangan — dari pemula hingga
            profesional berpengalaman.
          </p>
        </div>

        {/* ── Value pillars ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-12 sm:mb-14">
          {[
            { num: '01', label: 'Dukungan 24 Jam',       desc: 'Siap membantu kapan saja',              color: '#2563eb' },
            { num: '02', label: 'Tutorial Komprehensif',  desc: 'Belajar dari materi bernilai tinggi',   color: '#d97706' },
            { num: '03', label: 'Analitik Terbaik',       desc: 'Perangkat analisis kelas profesional',  color: '#059669' },
            { num: '04', label: 'Lingkungan Aman',        desc: 'Trading terproteksi dan teregulasi',    color: '#7c3aed' },
          ].map(({ num, label, desc, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 sm:p-5" style={{ border: '1px solid #f0f0f0' }}>
              <p className="text-2xl font-black mb-3" style={{ color: `${color}30`, letterSpacing: '-0.04em' }}>{num}</p>
              <p className="text-sm font-bold text-gray-800 mb-1">{label}</p>
              <p className="text-[11px] text-gray-400 leading-snug">{desc}</p>
            </div>
          ))}
        </div>

        {/* ── Main content: about + regulation ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 mb-12 sm:mb-14">

          {/* LEFT: About paragraphs — 3/5 */}
          <div className="lg:col-span-3 space-y-6">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Tentang Kami</p>

            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ border: '1px solid #f0f0f0' }}>
              <div className="h-0.5 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-5 sm:mb-6 rounded-t-2xl"
                style={{ background: '#2563eb' }} />
              <h2 className="text-sm font-bold text-gray-900 mb-4">Platform Terdepan</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Selamat datang di Stouch, platform trading canggih yang dirancang untuk memberdayakan
                trader dengan perangkat dan layanan terbaik di pasar keuangan. Di Stouch, kami
                berkomitmen untuk memberikan pengalaman trading yang tak tertandingi, memastikan klien
                kami memiliki akses ke tutorial komprehensif yang bernilai tinggi, perangkat analitis
                terbaik, dan dukungan 24 jam.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Kami memahami bahwa kesuksesan seorang trader bergantung pada kualitas platform trading
                mereka. Oleh karena itu, kami sangat menekankan penyediaan layanan berkualitas tinggi
                dan mendengarkan masukan dari para trader kami.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ border: '1px solid #f0f0f0' }}>
              <div className="h-0.5 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-5 sm:mb-6 rounded-t-2xl"
                style={{ background: '#059669' }} />
              <h2 className="text-sm font-bold text-gray-900 mb-4">Untuk Semua Level Trader</h2>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Stouch disiapkan untuk melayani trader dari semua level, mulai dari pemula hingga
                profesional berpengalaman. Kami berkomitmen untuk menciptakan lingkungan trading yang
                aman dan teregulasi agar klien kami dapat berkembang.
              </p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Dengan membangun komunikasi yang terbuka, kami bertujuan untuk memahami dan memenuhi
                kebutuhan unik setiap trader, menyediakan perangkat yang mereka butuhkan untuk sukses
                di dunia pasar keuangan yang dinamis.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ border: '1px solid #f0f0f0' }}>
              <div className="h-0.5 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-5 sm:mb-6 rounded-t-2xl"
                style={{ background: '#d97706' }} />
              <h2 className="text-sm font-bold text-gray-900 mb-4">Mitra Tepercaya Global</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Platform kami menawarkan kondisi trading yang kompetitif, termasuk akses ke beragam
                aset keuangan dan ketentuan trading yang menguntungkan. Kami bangga menjadi mitra
                tepercaya bagi para trader dari seluruh dunia, memastikan pengalaman mereka dengan
                Stouch menjadi menguntungkan dan menyenangkan.
              </p>
            </div>
          </div>

          {/* RIGHT: Regulation + contact — 2/5 */}
          <div className="lg:col-span-2 space-y-5">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Regulasi & Kontak</p>

            {/* Regulation card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ border: '1.5px solid #ddd6fe' }}>
              <div className="h-0.5 -mx-5 sm:-mx-6 -mt-5 sm:-mt-6 mb-5 sm:mb-6 rounded-t-2xl"
                style={{ background: 'linear-gradient(90deg, #7c3aed, #5b21b6)' }} />

              <h2 className="text-sm font-bold text-gray-900 mb-4">Regulasi</h2>

              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                Untuk memperkuat komitmen kami terhadap keamanan pelanggan dan integritas pasar,
                Stouch mematuhi semua peraturan dan standar industri yang relevan. Selain itu, kami
                bermitra dengan <span className="font-semibold text-gray-800">Trusted by Traders (TBT)</span>,
                sebuah badan regulator independen dan netral yang berdedikasi untuk melindungi
                hak-hak para trader.
              </p>

              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                Kemitraan ini memastikan bahwa klien kami mendapatkan perlindungan yang lebih baik
                dan risiko yang minimal, karena platform kami memenuhi standar praktik trading tertinggi.
              </p>

              {/* Compliance checklist */}
              <div className="space-y-2.5 mb-5 p-3.5 rounded-xl" style={{ background: '#f9f5ff', border: '1px solid #ede9fe' }}>
                {[
                  'Mematuhi standar industri trading internasional',
                  'Bermitra dengan badan regulator independen',
                  'Perlindungan dana klien terjamin',
                  'Audit keamanan berkala',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <CheckCircle2 size={13} className="text-violet-500 flex-shrink-0 mt-0.5" />
                    <span className="text-[12px] text-gray-600">{item}</span>
                  </div>
                ))}
              </div>

              <a
                href="https://trustedbytraders.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all hover:opacity-80 active:scale-95"
                style={{ background: '#7c3aed' }}
              >
                <span className="text-xs font-semibold text-white">Trusted by Traders</span>
                <ExternalLink size={12} className="text-white/60" />
              </a>
            </div>

            {/* Contact card */}
            <div className="bg-white rounded-2xl p-5 sm:p-6" style={{ border: '1px solid #f0f0f0' }}>
              <h2 className="text-sm font-bold text-gray-900 mb-3">Hubungi Kami</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">
                Dengan memilih Stouch, Anda bermitra dengan platform yang menghargai transparansi,
                keadilan, dan standar praktik trading tertinggi.
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Jika ada pertanyaan, silakan hubungi kami di:
              </p>
              <a
                href="mailto:support@stouch.id"
                className="flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all hover:bg-blue-50 active:scale-95"
                style={{ background: '#eff6ff', border: '1px solid #dbeafe' }}
              >
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-blue-500" />
                  <span className="text-sm font-semibold text-blue-700">support@stouch.id</span>
                </div>
                <ExternalLink size={11} className="text-blue-400" />
              </a>
            </div>

            {/* Commitment note */}
            <div className="rounded-2xl p-4 sm:p-5" style={{ background: '#f8fafc', border: '1px solid #e8edf2' }}>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                <span className="font-semibold text-gray-600">Komitmen kami: </span>
                Transparansi, keadilan, dan standar praktik trading tertinggi adalah nilai inti yang
                selalu kami pegang dalam setiap keputusan produk dan layanan.
              </p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}