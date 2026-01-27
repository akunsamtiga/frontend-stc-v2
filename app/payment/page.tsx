// app/payment/page.tsx
// ✅ CORRECT PAYMENT PAGE - This should be at /payment route, NOT /deposit

'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Navbar from '@/components/Navbar'
import { Loader2 } from 'lucide-react'

// ✅ Dynamic import to avoid SSR issues with Midtrans
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

/**
 * ✅ PAYMENT PAGE
 * 
 * This page handles deposit/top-up functionality
 * Route: /payment (NOT /deposit)
 * 
 * Features:
 * - Midtrans integration for payment
 * - Voucher code support
 * - Real-time balance update
 * - Transaction history
 * 
 * IMPORTANT: All deposit links should point to /payment
 * - Balance page: router.push('/payment')
 * - Navbar: Link href="/payment"
 * - Any other deposit buttons: use /payment
 */
export default function PaymentPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Redirect to login if not authenticated
    if (!user) {
      console.log('❌ User not authenticated, redirecting to home')
      router.push('/')
      return
    }

    console.log('✅ Payment page loaded for user:', user.email)
  }, [user, router])

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!mounted) {
    return null
  }

  // Show loading if user is not yet loaded
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
      
      {/* ✅ Render MidtransDepositPage component */}
      <MidtransDepositPage />
    </div>
  )
}