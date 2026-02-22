// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import GoogleAuthHandler from '@/components/GoogleAuthHandler'
import ChartPreloader from '@/components/ChartPreloader'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import { WebSocketProvider } from '@/components/providers/WebSocketProvider'
import './globals.css'

// ─── Site constants ────────────────────────────────────────────────────────────
const SITE_URL = 'https://stouch.id'
const SITE_NAME = 'Stouch.id'
const SITE_DESCRIPTION =
  'Platform trading binary option terpercaya di Indonesia. Profit hingga 95%, penarikan kilat, bonus VIP, dan keamanan maksimal. Powered by Stockity.'

// ─── Root metadata ─────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  // ── Title template ──────────────────────────────────────────────────────────
  title: {
    default: `${SITE_NAME} — Platform Trading Binary Option Terpercaya`,
    template: `%s | ${SITE_NAME}`,
  },

  // ── Basic ────────────────────────────────────────────────────────────────────
  description: SITE_DESCRIPTION,
  keywords: [
    'binary option indonesia',
    'platform trading terpercaya',
    'trading binary',
    'Stouch',
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
  ],
  authors: [{ name: 'Stouch.id', url: SITE_URL }],
  creator: 'Stouch.id',
  publisher: 'Verte Securities Limited',
  category: 'finance',
  applicationName: SITE_NAME,
  generator: 'Next.js',

  // ── Canonical ────────────────────────────────────────────────────────────────
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
    languages: { 'id-ID': '/' },
  },

  // ── Open Graph ───────────────────────────────────────────────────────────────
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Platform Trading Binary Option Terpercaya`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',     // buat file 1200×630 px
        width: 1200,
        height: 630,
        alt: 'Stouch.id — Platform Trading Binary Option',
        type: 'image/png',
      },
    ],
  },

  // ── Twitter / X ──────────────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Platform Trading Binary Option Terpercaya`,
    description: SITE_DESCRIPTION,
    images: ['/og-image.png'],
    creator: '@stockity_id',
    site: '@stockity_id',
  },

  // ── Icons ────────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/stc.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/stc.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },

  // ── Manifest (PWA) ───────────────────────────────────────────────────────────
  manifest: '/manifest.json',

  // ── Apple PWA ────────────────────────────────────────────────────────────────
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
    startupImage: '/apple-splash.png',
  },

  // ── Robots ───────────────────────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ── Verification (isi sesuai Google/Bing Search Console) ─────────────────────
  verification: {
    google: 'GANTI_DENGAN_GOOGLE_VERIFICATION_CODE',
    // yandex: '...',
    // bing: '...',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f1419',
}

// ─── JSON-LD structured data ───────────────────────────────────────────────────
function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Stouch.id',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/stc-logo1.png`,
      width: 512,
      height: 512,
    },
    description: SITE_DESCRIPTION,
    sameAs: [
      'https://www.facebook.com/profile.php?id=61576277923484',
      'https://www.instagram.com/stockity_id/',
      'https://t.me/+gj1bIkhkGRBhNzIy',
      'https://www.youtube.com/@Stockity_channel',
      'https://www.tiktok.com/@stockity_indonesian',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@stouch.id',
      contactType: 'customer service',
      availableLanguage: ['Indonesian', 'English'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'VU',
      streetAddress: 'International Business Centre, Suite 8, Pot 820/104, Route Elluk',
      addressLocality: 'Port Vila',
      addressRegion: 'Vanuatu',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

function WebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    publisher: { '@id': `${SITE_URL}/#organization` },
    inLanguage: 'id-ID',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/help-center?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// ─── Root layout ───────────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Icons */}
        <link rel="icon" href="/stc.ico" sizes="any" />

        {/* Apple PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        {/* Android PWA */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* MS Tiles */}
        <meta name="msapplication-TileColor" content="#0f1419" />
        <meta name="msapplication-navbutton-color" content="#0f1419" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />

        {/* Preconnect untuk performa */}
        <link rel="preconnect" href="https://storage.googleapis.com" />
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />

        {/* Structured data */}
        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>

      <body className="text-white bg-black">
        <GoogleAuthHandler />

        <WebSocketProvider>
          <ServiceWorkerRegistrar />
          <ChartPreloader />

          {children}

          <Toaster
            position="top-right"
            theme="dark"
            toastOptions={{
              style: {
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#f1f5f9',
              },
            }}
          />
        </WebSocketProvider>
      </body>
    </html>
  )
}