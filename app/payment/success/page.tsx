// app/payment-success/page.tsx
// ✅ FIXED: Memantau saldo real untuk konfirmasi pembayaran

'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react'

/**
 * ✅ PAYMENT SUCCESS CONTENT
 * Memantau perubahan saldo real secara realtime
 */
function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [paymentStatus, setPaymentStatus] = useState<'checking' | 'confirmed' | 'pending' | 'failed'>('checking')
  const [initialBalance, setInitialBalance] = useState<number | null>(null)
  const [currentBalance, setCurrentBalance] = useState<number | null>(null)
  const [balanceIncreased, setBalanceIncreased] = useState(false)
  const [checkCount, setCheckCount] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState(0)
  
  const orderId = searchParams.get('order_id')
  const transactionStatus = searchParams.get('transaction_status')
  const statusCode = searchParams.get('status_code')

  // Fungsi untuk mendapatkan saldo real
  const fetchRealBalance = async (): Promise<number | null> => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found')
        return null
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
      const response = await fetch(`${API_URL}/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch balance')
      }

      const data = await response.json()
      
      // Cari saldo real dari response
      // Format data bisa berbeda, sesuaikan dengan struktur backend Anda
      let realBalance = null
      
      if (data?.data?.balances) {
        const realBalanceData = data.data.balances.find((b: any) => b.accountType === 'real')
        realBalance = realBalanceData?.balance || 0
      } else if (data?.balances) {
        const realBalanceData = data.balances.find((b: any) => b.accountType === 'real')
        realBalance = realBalanceData?.balance || 0
      } else if (data?.data?.real) {
        realBalance = data.data.real
      } else if (data?.real) {
        realBalance = data.real
      }

      console.log('Real balance fetched:', realBalance)
      return realBalance
    } catch (error) {
      console.error('Error fetching balance:', error)
      return null
    }
  }

  // Monitor saldo secara realtime
  useEffect(() => {
    let intervalId: NodeJS.Timeout
    let timeoutId: NodeJS.Timeout
    let mounted = true

    const monitorBalance = async () => {
      console.log('💰 Payment monitoring started')
      console.log('Order ID:', orderId)
      console.log('Transaction Status:', transactionStatus)

      // Ambil saldo awal
      const startBalance = await fetchRealBalance()
      if (!mounted) return
      
      if (startBalance !== null) {
        setInitialBalance(startBalance)
        setCurrentBalance(startBalance)
        console.log('Initial balance:', startBalance)
      }

      // Cek saldo setiap 2 detik
      intervalId = setInterval(async () => {
        if (!mounted) return

        const newBalance = await fetchRealBalance()
        setCheckCount(prev => prev + 1)

        if (newBalance !== null && startBalance !== null) {
          setCurrentBalance(newBalance)
          
          // Jika saldo bertambah, konfirmasi pembayaran berhasil
          if (newBalance > startBalance) {
            console.log('✅ Balance increased! Payment confirmed')
            console.log(`Old balance: ${startBalance}, New balance: ${newBalance}`)
            setBalanceIncreased(true)
            setPaymentStatus('confirmed')
            
            // Redirect ke balance page setelah 3 detik
            setTimeout(() => {
              if (mounted) {
                router.push('/balance')
              }
            }, 3000)
            
            clearInterval(intervalId)
          }
        }
      }, 2000) // Cek setiap 2 detik

      // Timeout setelah 5 menit (300 detik)
      timeoutId = setTimeout(() => {
        if (!mounted) return
        
        if (!balanceIncreased) {
          console.log('⏰ Timeout reached, payment still pending')
          setPaymentStatus('pending')
          clearInterval(intervalId)
        }
      }, 300000) // 5 menit
    }

    monitorBalance()

    // Timer untuk menampilkan waktu yang telah berlalu
    const timeTimer = setInterval(() => {
      if (mounted && paymentStatus === 'checking') {
        setTimeElapsed(prev => prev + 1)
      }
    }, 1000)

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
      if (timeoutId) clearTimeout(timeoutId)
      clearInterval(timeTimer)
    }
  }, [orderId, router])

  // Render berdasarkan status
  if (paymentStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
          {/* Loading Icon */}
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Verifying Payment
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 mb-6">
            Please wait while we confirm your payment...
          </p>

          {/* Status Details */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
            {orderId && (
              <div className="text-left">
                <div className="text-xs text-gray-500 mb-1">Order ID</div>
                <div className="text-sm font-semibold text-gray-900 break-all font-mono">
                  {orderId}
                </div>
              </div>
            )}
            
            <div className="text-left pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Status</div>
              <div className="text-sm font-semibold text-blue-600 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Monitoring balance changes...
              </div>
            </div>

            {initialBalance !== null && (
              <div className="text-left pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Current Balance</div>
                <div className="text-sm font-semibold text-gray-900">
                  Rp {currentBalance?.toLocaleString('id-ID') || '0'}
                </div>
              </div>
            )}

            <div className="text-left pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Monitoring Time</div>
              <div className="text-sm font-semibold text-gray-900">
                {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')} / 5:00
              </div>
            </div>

            <div className="text-left pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-1">Checks Performed</div>
              <div className="text-sm font-semibold text-gray-900">
                {checkCount} times
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-2 text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-left">
              We're monitoring your account balance in real-time. Once your payment is confirmed by the payment gateway, your balance will be updated automatically.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'confirmed') {
    const balanceIncrease = currentBalance && initialBalance ? currentBalance - initialBalance : 0

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Payment Confirmed!
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 mb-6">
            Your payment has been successfully processed and your balance has been updated.
          </p>

          {/* Balance Details */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border-2 border-green-200">
            <div className="mb-4">
              <div className="text-sm text-gray-600 font-medium mb-2">Balance Added</div>
              <div className="text-4xl font-bold text-green-600">
                +Rp {balanceIncrease.toLocaleString('id-ID')}
              </div>
            </div>
            
            <div className="pt-4 border-t border-green-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Previous Balance:</span>
                <span className="font-semibold text-gray-900">
                  Rp {initialBalance?.toLocaleString('id-ID') || '0'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">New Balance:</span>
                <span className="font-semibold text-green-700">
                  Rp {currentBalance?.toLocaleString('id-ID') || '0'}
                </span>
              </div>
            </div>

            {orderId && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="text-xs text-gray-500 mb-1">Transaction ID</div>
                <div className="text-xs font-mono text-gray-700 break-all bg-white px-3 py-2 rounded">
                  {orderId}
                </div>
              </div>
            )}
          </div>

          {/* Loading indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Redirecting to your wallet...</span>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/balance')}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 active:bg-green-800 transition-all flex items-center justify-center gap-2"
            >
              Go to Wallet Now
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => router.push('/payment')}
              className="w-full text-green-700 py-4 rounded-xl font-semibold hover:bg-green-50 transition-all"
            >
              Make Another Payment
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (paymentStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
          {/* Pending Icon */}
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-amber-600" />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Payment Pending
          </h1>
          
          {/* Description */}
          <p className="text-gray-600 mb-6">
            Your payment is being processed by the payment gateway. This may take a few minutes.
          </p>

          {/* Info */}
          <div className="bg-amber-50 rounded-xl p-4 mb-6 border border-amber-200">
            <p className="text-sm text-amber-800">
              We've been monitoring your account for 5 minutes and haven't detected the balance update yet. 
              Your payment may still be processing with the payment gateway.
            </p>
          </div>

          {orderId && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-xs text-gray-500 mb-1">Order ID</div>
              <div className="text-sm font-semibold text-gray-900 break-all font-mono">
                {orderId}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-amber-600 text-white py-4 rounded-xl font-semibold hover:bg-amber-700 active:bg-amber-800 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Check Again
            </button>
            
            <button
              onClick={() => router.push('/balance')}
              className="w-full text-amber-700 py-4 rounded-xl font-semibold hover:bg-amber-50 transition-all"
            >
              Go to Wallet
            </button>

            <button
              onClick={() => router.push('/payment')}
              className="w-full text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all text-sm"
            >
              Back to Payment
            </button>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              If you've completed the payment but your balance hasn't updated after 15 minutes, 
              please contact our support team with your transaction ID.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return null
}

/**
 * ✅ LOADING FALLBACK
 */
function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
        <p className="text-gray-600">Loading payment status...</p>
      </div>
    </div>
  )
}

/**
 * ✅ MAIN PAGE COMPONENT
 */
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}