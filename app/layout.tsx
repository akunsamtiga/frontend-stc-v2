import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Toaster } from 'sonner'
import GoogleAuthHandler from '@/components/GoogleAuthHandler'
import ChartPreloader from '@/components/ChartPreloader'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import { WebSocketProvider } from '@/components/providers/WebSocketProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stouch',
  description: 'Platform dengan penarikan kilat, profit hingga 100%, dan keamanan maksimal.',
  keywords: ['binary option', 'trading', 'IDX_STC', 'forex', 'crypto', 'Stouch' ,'STC AutoTrade'],
  icons: {
    icon: '/stc.ico',
    shortcut: '/stc.ico',
    apple: '/stc.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Stouch',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0f1419',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <link rel="icon" href="/stc.ico" sizes="any" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        <meta name="mobile-web-app-capable" content="yes" />
        
        <meta name="msapplication-TileColor" content="#0f1419" />
        <meta name="msapplication-navbutton-color" content="#0f1419" />
      </head>
      <body className="text-white">
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