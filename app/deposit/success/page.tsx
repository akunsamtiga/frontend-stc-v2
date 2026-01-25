'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'

// Separate component that uses useSearchParams
function DepositSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  useEffect(() => {
    // Redirect ke balance setelah 3 detik
    const timer = setTimeout(() => {
      router.push('/balance')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Received!
        </h1>
        <p className="text-gray-600 mb-4">
          Your deposit is being processed
        </p>

        {orderId && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-xs text-gray-500 mb-1">Order ID</div>
            <div className="text-sm font-mono font-semibold text-gray-900">
              {orderId}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Redirecting to wallet...</span>
        </div>
      </div>
    </div>
  )
}

// Loading fallback component
function DepositSuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

// Main page component with Suspense boundary
export default function DepositSuccessPage() {
  return (
    <Suspense fallback={<DepositSuccessLoading />}>
      <DepositSuccessContent />
    </Suspense>
  )
}