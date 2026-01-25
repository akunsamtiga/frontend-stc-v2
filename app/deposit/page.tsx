'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Navbar from '@/components/Navbar'

// Dynamic import untuk avoid SSR issues dengan Midtrans
const MidtransDepositPage = dynamic(
  () => import('@/components/MidtransDepositPage'),
  { ssr: false }
)

export default function DepositPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!mounted || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      <MidtransDepositPage />
    </div>
  )
}