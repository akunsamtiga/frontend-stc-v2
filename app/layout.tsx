import type { Metadata } from 'next'
import { IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import GoogleAuthHandler from '@/components/GoogleAuthHandler'
import ChartPreloader from '@/components/ChartPreloader'
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar'
import { WebSocketProvider } from '@/components/providers/WebSocketProvider' // ✅ WebSocket Provider
import './globals.css'

const ibmPlexSans = IBM_Plex_Sans({ 
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-ibm',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'STC AutoTrade',
  description: 'Platform dengan penarikan kilat, profit hingga 100%, dan keamanan maksimal.',
  keywords: ['binary option', 'trading', 'IDX_STC', 'forex', 'crypto', 'STC AutoTrade'],
  themeColor: '#0f1419', 
  icons: {
    icon: '/stc.ico',
    shortcut: '/stc.ico',
    apple: '/stc.ico',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'STC AutoTrade',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className={`${ibmPlexSans.variable} ${jetbrainsMono.variable}`}>
      <head>
        <link rel="icon" href="/stc.ico" sizes="any" />
        {/* Dark theme for mobile browsers */}
        <meta name="theme-color" content="#0f1419" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f1419" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content="#0f1419" />
        
        {/* Apple specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Android Chrome */}
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Microsoft */}
        <meta name="msapplication-TileColor" content="#0f1419" />
        <meta name="msapplication-navbutton-color" content="#0f1419" />
      </head>
      <body className="bg-[#0a0e17] text-white">
        {/* Auth Handler - Harus di paling atas */}
        <GoogleAuthHandler />
        
        {/* WebSocket Provider - Bungkus seluruh aplikasi untuk real-time */}
        <WebSocketProvider>
          {/* Background Services */}
          <ServiceWorkerRegistrar />
          <ChartPreloader />
          
          {/* Main Content */}
          {children}
          
          {/* Toast Notifications */}
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