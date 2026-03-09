// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import { WebSocketProvider } from '@/components/providers/WebSocketProvider'
import ClientProviders from '@/components/ClientProviders'
import './globals.css'

const SITE_URL = 'https://stouch.id'
const SITE_NAME = 'Stouch.id'
const SITE_DESCRIPTION =
  'Platform trading binary option terpercaya di Indonesia. Profit hingga 100%, penarikan kilat, bonus VIP, dan keamanan tinggi. Powered by Stockity.'

const OG_IMAGE = '/og-image.png'
const LOGO_IMAGE = '/stc-logo1.png'

export const metadata: Metadata = {

  title: {
    default: `${SITE_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },

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
  ],
  authors: [{ name: 'Stouch.id', url: SITE_URL }],
  creator: 'Stouch.id',
  publisher: 'Verte Securities Limited',
  category: 'finance',
  applicationName: SITE_NAME,
  generator: 'Next.js',

  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
    languages: { 'id-ID': '/' },
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
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: 'Stouch.id — Platform Trading Binary Option Terpercaya di Indonesia',
        type: 'image/png',
      },
      {
        url: LOGO_IMAGE,
        width: 512,
        height: 512,
        alt: 'Logo Stouch.id — Platform Trading Binary Option',
        type: 'image/png',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Platform Trading Binary Option Terpercaya`,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        alt: 'Stouch.id — Platform Trading Binary Option Terpercaya di Indonesia',
      },
    ],
    creator: '@stockity_id',
    site: '@stockity_id',
  },

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

  manifest: '/manifest.json',

  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: SITE_NAME,
    startupImage: '/apple-splash.png',
  },

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

}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f1419',
}

function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Stouch.id',
    url: SITE_URL,

    logo: {
      '@type': 'ImageObject',
      '@id': `${SITE_URL}/#logo`,
      url: `${SITE_URL}${LOGO_IMAGE}`,
      contentUrl: `${SITE_URL}${LOGO_IMAGE}`,
      width: 512,
      height: 512,
      name: 'Logo Stouch.id',
      caption: 'Stouch.id — Platform Trading Binary Option Indonesia',
      inLanguage: 'id-ID',
    },

    image: [
      {
        '@type': 'ImageObject',
        '@id': `${SITE_URL}/#primary-image`,
        url: `${SITE_URL}${OG_IMAGE}`,
        contentUrl: `${SITE_URL}${OG_IMAGE}`,
        width: 1200,
        height: 630,
        name: 'Stouch.id Platform Trading Binary Option Terpercaya Indonesia',
        caption: 'Platform trading binary option terpercaya di Indonesia dengan profit hingga 100%',
        description: SITE_DESCRIPTION,
        inLanguage: 'id-ID',
        representativeOfPage: true,
      },
      {
        '@type': 'ImageObject',
        '@id': `${SITE_URL}/#logo`,
        url: `${SITE_URL}${LOGO_IMAGE}`,
        contentUrl: `${SITE_URL}${LOGO_IMAGE}`,
        width: 512,
        height: 512,
        name: 'Logo Stouch.id',
        caption: 'Logo resmi Stouch.id',
        inLanguage: 'id-ID',
      },
    ],

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
    primaryImageOfPage: {
      '@id': `${SITE_URL}/#primary-image`,
    },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="icon" href="/stc.ico" sizes="any" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

        <meta name="mobile-web-app-capable" content="yes" />

        <meta name="msapplication-TileColor" content="#0f1419" />
        <meta name="msapplication-navbutton-color" content="#0f1419" />
        <meta name="msapplication-TileImage" content="/icon-192.png" />

        <link rel="preconnect" href="https://storage.googleapis.com" />
        <link rel="dns-prefetch" href="https://storage.googleapis.com" />

        <OrganizationJsonLd />
        <WebSiteJsonLd />
      </head>

      <body className="text-white bg-black">
        <WebSocketProvider>
          <ClientProviders>
            {children}
          </ClientProviders>

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