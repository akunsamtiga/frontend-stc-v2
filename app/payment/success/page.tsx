// app/payment-success/page.tsx
// ✅ CORRECT PAYMENT SUCCESS PAGE

'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react'

/**
 * ✅ PAYMENT SUCCESS CONTENT
 * 
 * This component uses useSearchParams so it must be wrapped in Suspense
 */
function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get order_id from query params
  const orderId = searchParams.get('order_id')
  const transactionStatus = searchParams.get('transaction_status')
  const statusCode = searchParams.get('status_code')

  useEffect(() => {
    console.log('✅ Payment success page loaded')
    console.log('Order ID:', orderId)
    console.log('Status:', transactionStatus)
    console.log('Status Code:', statusCode)

    // Redirect to balance after 3 seconds
    const timer = setTimeout(() => {
      console.log('🔄 Redirecting to balance page...')
      router.push('/balance')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router, orderId, transactionStatus, statusCode])

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Payment Received!
        </h1>
        
        {/* Description */}
        <p className="text-gray-600 mb-6">
          Your transaction is being processed. Your balance will be updated shortly.
        </p>

        {/* Order Details */}
        {orderId && (
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="text-xs text-gray-500 mb-1">Order ID</div>
            <div className="text-sm font-mono font-semibold text-gray-900 break-all">
              {orderId}
            </div>
            
            {transactionStatus && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Status</div>
                <div className={`text-sm font-semibold capitalize ${
                  transactionStatus === 'settlement' || transactionStatus === 'capture'
                    ? 'text-green-600'
                    : transactionStatus === 'pending'
                    ? 'text-yellow-600'
                    : 'text-gray-600'
                }`}>
                  {transactionStatus}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-6">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Redirecting to your wallet...</span>
        </div>

        {/* Manual redirect button */}
        <button
          onClick={() => router.push('/balance')}
          className="w-full bg-green-500 text-white py-3 rounded-xl font-semibold hover:bg-green-600 active:bg-green-700 transition-all flex items-center justify-center gap-2"
        >
          Go to Wallet Now
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Or make another payment */}
        <button
          onClick={() => router.push('/payment')}
          className="w-full mt-3 text-green-600 py-3 rounded-xl font-semibold hover:bg-green-50 transition-all"
        >
          Make Another Payment
        </button>
      </div>
    </div>
  )
}

/**
 * ✅ LOADING FALLBACK
 * 
 * Shown while useSearchParams is being resolved
 */
function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
        </div>
        <p className="text-gray-600">Loading payment status...</p>
      </div>
    </div>
  )
}

/**
 * ✅ MAIN PAGE COMPONENT
 * 
 * Wraps content in Suspense to handle useSearchParams
 * This prevents the "useSearchParams should be wrapped in Suspense" error
 */
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}