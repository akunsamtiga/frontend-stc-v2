import type { Metadata } from 'next'
import { Poppins, JetBrains_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const poppins = Poppins({ 
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-poppins',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'STC AutoTrade - Platform Trading Binary Option Profesional',
  description: 'Platform trading binary option dengan eksekusi kilat, profit hingga 95%, dan keamanan maksimal. Dipercaya 50.000+ trader.',
  keywords: ['binary option', 'trading', 'IDX_STC', 'forex', 'crypto', 'STC AutoTrade'],
  icons: {
    icon: '/stc.ico',
    shortcut: '/stc.ico',
    apple: '/stc.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
        <html lang="id" className={`${poppins.variable} ${jetbrainsMono.variable}`}>      <head>
        <link rel="icon" href="/stc.ico" sizes="any" />
      </head>
      <body>
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
      </body>
    </html>
  )
}