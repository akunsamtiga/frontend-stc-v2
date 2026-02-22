'use client'

// components/ClientProviders.tsx
// Wrapper Client Component — menampung semua komponen yang butuh
// dynamic import dengan ssr: false, agar layout.tsx tetap Server Component.

import dynamic from 'next/dynamic'

const GoogleAuthHandler = dynamic(
  () => import('@/components/GoogleAuthHandler'),
  { ssr: false }
)

const ChartPreloader = dynamic(
  () => import('@/components/ChartPreloader'),
  { ssr: false }
)

const ServiceWorkerRegistrar = dynamic(
  () => import('@/components/ServiceWorkerRegistrar'),
  { ssr: false }
)

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <GoogleAuthHandler />
      <ServiceWorkerRegistrar />
      <ChartPreloader />
      {children}
    </>
  )
}