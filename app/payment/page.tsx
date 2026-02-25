// app/payment/page.tsx


'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Navbar from '@/components/Navbar'
import { Loader2 } from 'lucide-react'


const MidtransDepositPage = dynamic(
  () => import('@/components/MidtransDepositPage'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading payment page...</p>
        </div>
      </div>
    )
  }
)


export default function PaymentPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)


    if (!user) {
      console.log('❌ User not authenticated, redirecting to home')
      router.push('/')
      return
    }

    console.log('✅ Payment page loaded for user:', user.email)
  }, [user, router])


  if (!mounted) {
    return null
  }


  if (!user) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />


      <MidtransDepositPage />
    </div>
  )
}