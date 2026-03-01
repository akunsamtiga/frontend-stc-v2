// app/ref/[code]/layout.tsx

import type { Metadata } from 'next'

interface Props {
  params: Promise<{ code: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const upperCode = code.toUpperCase()

  return {
    title: `Daftar via Kode ${upperCode} — Stouch.id`,
    description:
      'Bergabung dengan Stouch.id menggunakan kode undangan eksklusif. Dapatkan saldo demo Rp 10 juta untuk mulai trading binary option.',
    robots: { index: false, follow: false },
    openGraph: {
      title: `Kamu Diundang ke Stouch.id!`,
      description: `Gunakan kode ${upperCode} untuk mendaftar dan mulai trading binary option dengan saldo demo Rp 10 juta.`,
      type: 'website',
    },
  }
}

export default function RefLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}