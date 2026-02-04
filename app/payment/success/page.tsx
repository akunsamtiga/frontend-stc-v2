// app/payment-success/page.tsx
// ✅ SUCCESS PAGE dengan monitoring saldo real account
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, Loader2, XCircle, Clock, Home, Wallet, ArrowRight, Tag, TrendingUp } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { api } from '@/lib/api'

interface PaymentInfo {
  orderId: string
  depositAmount: number
  voucherBonus: number
  voucherCode?: string
  initialBalance: number
  expectedBalance: number
  timestamp: number
}

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [status, setStatus] = useState<'checking' | 'success' | 'pending' | 'timeout'>('checking')
  const [currentBalance, setCurrentBalance] = useState<number>(0)
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null)
  const [checkCount, setCheckCount] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  
  const MAX_CHECKS = 40 // 2 menit (40 checks x 3 detik)
  const CHECK_INTERVAL = 3000 // 3 detik

  /**
   * Load payment info dari URL params atau localStorage
   */
  useEffect(() => {
    const orderId = searchParams.get('orderId')
    
    if (!orderId) {
      console.error('❌ No order ID provided')
      router.push('/payment')
      return
    }

    // Try to get payment info from localStorage
    const storedInfo = localStorage.getItem(`payment_${orderId}`)
    
    if (!storedInfo) {
      console.error('❌ No payment info found for order:', orderId)
      // Fallback: redirect to payment with message
      router.push('/payment')
      return
    }

    try {
      const info: PaymentInfo = JSON.parse(storedInfo)
      setPaymentInfo(info)
      console.log('✅ Payment info loaded:', {
        orderId: info.orderId,
        depositAmount: info.depositAmount,
        voucherBonus: info.voucherBonus,
        expectedBalance: info.expectedBalance
      })
    } catch (error) {
      console.error('❌ Failed to parse payment info:', error)
      router.push('/payment')
    }
  }, [searchParams, router])

  /**
   * Monitor saldo real account
   */
  const checkBalance = useCallback(async () => {
    if (!paymentInfo) return

    try {
      console.log(`🔍 Checking balance (attempt ${checkCount + 1}/${MAX_CHECKS})...`)
      
      // Get current real balance (bypass cache)
      const response = await api.getAccountBalance('real')
      
      if (response?.data?.balance !== undefined) {
        const balance = response.data.balance
        setCurrentBalance(balance)
        
        const balanceIncrease = balance - paymentInfo.initialBalance
        const expectedIncrease = paymentInfo.depositAmount + paymentInfo.voucherBonus
        
        console.log('💰 Balance check:', {
          currentBalance: balance,
          initialBalance: paymentInfo.initialBalance,
          increase: balanceIncrease,
          expectedIncrease: expectedIncrease,
          match: Math.abs(balanceIncrease - expectedIncrease) < 1
        })

        // ✅ Success: Balance increased by expected amount (with small tolerance)
        if (balanceIncrease >= expectedIncrease - 1) {
          console.log('✅ PAYMENT VERIFIED - Balance increased correctly!')
          setStatus('success')
          
          // Clear payment info from localStorage
          localStorage.removeItem(`payment_${paymentInfo.orderId}`)
          return true
        }
      }
      
      return false
    } catch (error) {
      console.error('❌ Error checking balance:', error)
      return false
    }
  }, [paymentInfo, checkCount, MAX_CHECKS])

  /**
   * Polling effect
   */
  useEffect(() => {
    if (!paymentInfo || status !== 'checking') return

    // Initial check
    checkBalance()

    // Set up polling interval
    const interval = setInterval(async () => {
      setCheckCount(prev => prev + 1)
      setElapsedSeconds(prev => prev + (CHECK_INTERVAL / 1000))
      
      const success = await checkBalance()
      
      if (success) {
        clearInterval(interval)
        return
      }

      // Timeout after MAX_CHECKS attempts
      if (checkCount >= MAX_CHECKS - 1) {
        console.log('⏱️ Timeout - Payment verification taking too long')
        setStatus('timeout')
        clearInterval(interval)
      }
    }, CHECK_INTERVAL)

    return () => clearInterval(interval)
  }, [paymentInfo, status, checkBalance, checkCount, MAX_CHECKS, CHECK_INTERVAL])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Show loading if payment info not yet loaded
  if (!paymentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="flex items-center justify-center p-4 pt-20">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-200">
          
          {/* ========================================
              CHECKING STATUS - Memantau Saldo
          ======================================== */}
          {status === 'checking' && (
            <>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-8 sm:p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
                
                <div className="relative">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Verifying Payment</h2>
                  <p className="text-blue-100 text-sm sm:text-base">
                    Monitoring your account balance...
                  </p>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                {/* Progress Info */}
                <div className="bg-blue-50 rounded-xl p-5 mb-6 border-2 border-blue-200">
                  <div className="text-center mb-4">
                    <div className="text-xs text-blue-700 font-semibold uppercase tracking-wider mb-2">
                      Expected Deposit
                    </div>
                    <div className="text-3xl font-bold text-blue-900 mb-1">
                      {formatCurrency(paymentInfo.depositAmount)}
                    </div>
                    
                    {paymentInfo.voucherBonus > 0 && (
                      <div className="mt-3 pt-3 border-t-2 border-blue-200">
                        <div className="flex items-center justify-center gap-2 text-sm text-blue-700 mb-1">
                          <Tag className="w-4 h-4" />
                          <span className="font-semibold">Voucher Bonus</span>
                        </div>
                        <div className="text-xl font-bold text-green-600">
                          +{formatCurrency(paymentInfo.voucherBonus)}
                        </div>
                        {paymentInfo.voucherCode && (
                          <div className="text-xs text-blue-600 font-mono mt-1">
                            {paymentInfo.voucherCode}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t-2 border-blue-300 text-center">
                    <div className="text-xs text-blue-700 font-semibold mb-1">
                      Total Expected Balance Increase
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {formatCurrency(paymentInfo.depositAmount + paymentInfo.voucherBonus)}
                    </div>
                  </div>
                </div>

                {/* Current Balance */}
                <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600 font-semibold">Current Balance</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(currentBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-semibold">Balance Increase</span>
                    <span className={`text-lg font-bold ${
                      currentBalance > paymentInfo.initialBalance ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      +{formatCurrency(Math.max(0, currentBalance - paymentInfo.initialBalance))}
                    </span>
                  </div>
                </div>

                {/* Status Updates */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-blue-900">
                        Monitoring balance changes...
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        Check {checkCount + 1} of {MAX_CHECKS} • {formatTime(elapsedSeconds)} elapsed
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>✓ Payment submitted to Midtrans</div>
                      <div>✓ Waiting for payment confirmation</div>
                      <div>• Checking real account balance...</div>
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm text-amber-900 font-medium mb-1">
                        Please wait
                      </div>
                      <div className="text-xs text-amber-700">
                        We're verifying your payment by monitoring your balance. This usually takes 10-30 seconds.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========================================
              SUCCESS STATUS
          ======================================== */}
          {status === 'success' && (
            <>
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-8 sm:p-10 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                
                <div className="relative">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30 animate-scale-in">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-2">Payment Verified!</h2>
                  <p className="text-green-100">Your balance has been updated successfully</p>
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border-2 border-green-200">
                  <div className="text-center mb-4">
                    <div className="text-sm text-green-700 font-semibold mb-2 uppercase tracking-wider">
                      Amount Deposited
                    </div>
                    <div className="text-4xl font-bold text-green-900">
                      {formatCurrency(paymentInfo.depositAmount)}
                    </div>
                  </div>

                  {paymentInfo.voucherBonus > 0 && (
                    <div className="mt-4 pt-4 border-t-2 border-green-200">
                      <div className="flex items-center justify-between bg-white rounded-lg p-4 border border-green-300">
                        <div className="flex items-center gap-3">
                          <Tag className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="text-sm font-semibold text-gray-700">Voucher Bonus</div>
                            {paymentInfo.voucherCode && (
                              <div className="text-xs text-gray-500 font-mono">{paymentInfo.voucherCode}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-xl font-bold text-green-600">
                          +{formatCurrency(paymentInfo.voucherBonus)}
                        </div>
                      </div>
                      
                      <div className="mt-3 text-center">
                        <div className="text-sm text-green-700 font-medium mb-1">Total Added to Balance</div>
                        <div className="text-2xl font-bold text-green-900">
                          {formatCurrency(paymentInfo.depositAmount + paymentInfo.voucherBonus)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New Balance</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatCurrency(currentBalance)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/trading')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <TrendingUp className="w-5 h-5" />
                    <span>Start Trading Now</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={() => router.push('/balance')}
                    className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>View Balance History</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ========================================
              TIMEOUT STATUS
          ======================================== */}
          {status === 'timeout' && (
            <>
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-8 sm:p-10 text-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
                  <Clock className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Verification Pending</h2>
                <p className="text-amber-100">Your payment is being processed</p>
              </div>

              <div className="p-6 sm:p-8">
                <div className="bg-amber-50 rounded-xl p-6 mb-6 border-2 border-amber-200">
                  <div className="text-center">
                    <div className="text-sm text-amber-700 font-semibold mb-2">Expected Amount</div>
                    <div className="text-3xl font-bold text-amber-900 mb-4">
                      {formatCurrency(paymentInfo.depositAmount + paymentInfo.voucherBonus)}
                    </div>
                    <div className="text-sm text-amber-600 leading-relaxed">
                      Your payment is being processed by the payment gateway. Balance updates may take a few minutes.
                      Please check your balance page shortly.
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>Payment submitted successfully</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                      <span>Waiting for confirmation from payment gateway</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                      <span>Balance will be updated automatically</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/balance')}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Wallet className="w-5 h-5" />
                    <span>Check Balance</span>
                  </button>
                  
                  <button
                    onClick={() => router.push('/trading')}
                    className="w-full bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Home className="w-5 h-5" />
                    <span>Go to Dashboard</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
          }
          to {
            transform: scale(1);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}