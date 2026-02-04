// app/payment-success/page.tsx
'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, XCircle, Clock, Loader2, ArrowRight, Home, Receipt } from 'lucide-react'
import { api } from '@/lib/api'

interface TransactionStatus {
  status: 'success' | 'pending' | 'failed' | 'expired'
  orderId: string
  amount?: number
  message: string
  transactionStatus?: string
  statusCode?: string
}

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<TransactionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const orderId = searchParams.get('order_id')
    const transactionStatus = searchParams.get('transaction_status')
    const statusCode = searchParams.get('status_code')

    console.log('🎯 Payment callback received:', {
      orderId,
      transactionStatus,
      statusCode
    })

    if (!orderId) {
      setStatus({
        status: 'failed',
        orderId: '',
        message: 'Invalid payment callback - missing order ID'
      })
      setLoading(false)
      return
    }

    // Determine status from Midtrans callback
    let paymentStatus: 'success' | 'pending' | 'failed' | 'expired' = 'pending'
    let message = 'Processing your payment...'

    // Midtrans transaction status mapping
    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      paymentStatus = 'success'
      message = 'Payment successful! Your balance has been updated.'
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'pending'
      message = 'Payment is pending. Please complete your payment.'
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
      paymentStatus = 'failed'
      if (transactionStatus === 'cancel') {
        message = 'Payment was cancelled. You can try again if you want.'
      } else if (transactionStatus === 'expire') {
        message = 'Payment time has expired. Please try again.'
      } else {
        message = 'Payment was denied. Please try a different payment method.'
      }
    }

    setStatus({
      status: paymentStatus,
      orderId,
      message,
      transactionStatus: transactionStatus || undefined,
      statusCode: statusCode || undefined
    })

    // Verify with backend
    verifyPayment(orderId)
  }, [searchParams])

  const verifyPayment = async (orderId: string) => {
    try {
      console.log('✅ Verifying payment with backend:', orderId)
      
      // Check transaction status from backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payment/deposit/${orderId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('📊 Backend verification:', data)
        
        if (data.data?.deposit) {
          setStatus(prev => ({
            ...prev!,
            amount: data.data.deposit.amount,
            status: data.data.deposit.status
          }))
        }
      }
    } catch (error) {
      console.error('❌ Failed to verify payment:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto redirect countdown
  useEffect(() => {
    if (!loading && status) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            if (status.status === 'success') {
              router.push('/balance')
            } else {
              router.push('/payment')
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [loading, status, router])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Verifying Payment
            </h2>
            <p className="text-gray-600">
              Please wait while we confirm your transaction...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!status) return null

  const statusConfig = {
    success: {
      icon: <CheckCircle className="w-16 h-16 text-green-600" />,
      bgColor: 'bg-green-100',
      textColor: 'text-green-900',
      borderColor: 'border-green-200',
      title: 'Payment Successful!',
      redirectText: 'Redirecting to Balance',
      redirectPath: '/balance'
    },
    pending: {
      icon: <Clock className="w-16 h-16 text-amber-600" />,
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-900',
      borderColor: 'border-amber-200',
      title: 'Payment Pending',
      redirectText: 'Redirecting to Payment',
      redirectPath: '/payment'
    },
    failed: {
      icon: <XCircle className="w-16 h-16 text-red-600" />,
      bgColor: 'bg-red-100',
      textColor: 'text-red-900',
      borderColor: 'border-red-200',
      title: 'Payment Failed',
      redirectText: 'Redirecting to Payment',
      redirectPath: '/payment'
    },
    expired: {
      icon: <XCircle className="w-16 h-16 text-gray-600" />,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-900',
      borderColor: 'border-gray-200',
      title: 'Payment Expired',
      redirectText: 'Redirecting to Payment',
      redirectPath: '/payment'
    }
  }

  const config = statusConfig[status.status]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header with gradient */}
        <div className={`${config.bgColor} p-8 text-center border-b-4 ${config.borderColor}`}>
          <div className="flex justify-center mb-4">
            {config.icon}
          </div>
          <h1 className={`text-3xl font-bold ${config.textColor} mb-2`}>
            {config.title}
          </h1>
          <p className="text-gray-700">
            {status.message}
          </p>
        </div>

        {/* Transaction Details */}
        <div className="p-8 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-gray-200">
              <span className="text-sm text-gray-600 font-medium">Order ID</span>
              <span className="text-sm font-mono font-semibold text-gray-900">
                {status.orderId}
              </span>
            </div>

            {status.amount && (
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600 font-medium">Amount</span>
                <span className="text-xl font-bold text-blue-600">
                  {formatCurrency(status.amount)}
                </span>
              </div>
            )}

            {status.transactionStatus && (
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-sm text-gray-600 font-medium">Transaction Status</span>
                <span className="text-sm font-semibold text-gray-900 uppercase">
                  {status.transactionStatus}
                </span>
              </div>
            )}
          </div>

          {/* Auto redirect countdown */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 mb-2">
              {config.redirectText} in
            </p>
            <div className="text-3xl font-bold text-blue-600">
              {countdown}s
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push(config.redirectPath)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              {status.status === 'success' ? (
                <>
                  <Receipt className="w-5 h-5" />
                  <span>View Balance</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  <span>Try Again</span>
                </>
              )}
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-5 h-5" />
              <span>Back to Home</span>
            </button>
          </div>

          {/* Additional Info for Pending */}
          {status.status === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-xs text-amber-800">
                <strong>Note:</strong> Your payment is being processed. 
                You can check your balance page for updates.
              </p>
            </div>
          )}

          {/* Additional Info for Failed */}
          {status.status === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-xs text-red-800">
                <strong>What happened?</strong> Your payment was not completed. 
                This could be due to cancellation, insufficient funds, or payment timeout.
                You can try again with a different payment method.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}