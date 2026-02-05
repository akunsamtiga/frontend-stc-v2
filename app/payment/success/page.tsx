// app/payment/success/page.tsx
// ✅ IMPROVED VERSION with comprehensive debugging

'use client'

import { useEffect, useState, useCallback, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  CheckCircle, 
  Loader2, 
  ArrowRight, 
  AlertCircle,
  Wallet,
  Clock,
  TrendingUp,
  Tag,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

// ============================================================
// TYPES
// ============================================================

type VerificationStatus = 'checking' | 'pending' | 'processing' | 'success' | 'failed'

interface DepositStatus {
  orderId: string
  status: 'pending' | 'success' | 'failed' | 'expired' | 'not_found'
  amount: number
  voucherCode?: string
  voucherBonus?: number
  paymentType?: string
  transactionTime?: string
  settlementTime?: string
}

interface BalanceCheck {
  previousBalance: number
  currentBalance: number
  expectedBalance: number
  difference: number
  verified: boolean
}

// ============================================================
// PAYMENT SUCCESS CONTENT COMPONENT
// ============================================================

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore((state) => state.user)
  
  // Get order_id from query params
  const orderId = searchParams.get('order_id')
  const transactionStatus = searchParams.get('transaction_status')
  
  // State
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('checking')
  const [depositInfo, setDepositInfo] = useState<DepositStatus | null>(null)
  const [balanceCheck, setBalanceCheck] = useState<BalanceCheck | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [countdown, setCountdown] = useState(5)
  const [attempts, setAttempts] = useState(0)
  const [lastChecked, setLastChecked] = useState<Date>(new Date())
  
  // ✅ DEBUG STATE
  const [debugInfo, setDebugInfo] = useState<any>({})
  
  // Constants
  const POLLING_INTERVAL = 3000 // 3 seconds for faster updates
  const MAX_ATTEMPTS = 60 // Max 3 minutes (60 * 3s)
  
  // Refs for polling control
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const previousBalanceRef = useRef<number>(0)
  const hasVerifiedRef = useRef(false)

  // ==========================================================
  // HELPER FUNCTIONS
  // ==========================================================

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  // ==========================================================
  // BALANCE VERIFICATION LOGIC
  // ==========================================================

  const verifyBalanceUpdate = useCallback(async (expectedAmount: number, voucherBonus: number = 0) => {
    try {
      console.log('💰 Verifying balance update...', { expectedAmount, voucherBonus })
      
      const response = await api.getBothBalances()
      
      console.log('✅ Balance response:', response)
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch balance')
      }

      const currentRealBalance = response.data.realBalance || 0
      const expectedTotal = expectedAmount + voucherBonus
      
      // Store initial balance on first check
      if (previousBalanceRef.current === 0 && currentRealBalance > 0) {
        previousBalanceRef.current = currentRealBalance
        console.log('📊 Initial balance set:', currentRealBalance)
      }

      const difference = currentRealBalance - previousBalanceRef.current
      
      // Verify with tolerance for rounding
      const tolerance = 100 // 100 IDR tolerance
      const verified = difference >= (expectedTotal - tolerance) && difference <= (expectedTotal + tolerance)

      console.log('🔍 Balance verification:', {
        previous: previousBalanceRef.current,
        current: currentRealBalance,
        expected: expectedTotal,
        difference,
        verified
      })

      const balanceData: BalanceCheck = {
        previousBalance: previousBalanceRef.current,
        currentBalance: currentRealBalance,
        expectedBalance: previousBalanceRef.current + expectedTotal,
        difference: difference,
        verified: verified
      }

      setBalanceCheck(balanceData)
      setLastChecked(new Date())

      return { verified, currentBalance: currentRealBalance }

    } catch (error) {
      console.error('❌ Balance verification error:', error)
      return { verified: false, currentBalance: 0 }
    }
  }, [])

  // ==========================================================
  // MAIN VERIFICATION FLOW
  // ==========================================================

  const verifyDeposit = useCallback(async () => {
    if (!orderId || !isMountedRef.current || hasVerifiedRef.current) return

    setAttempts(prev => prev + 1)
    console.log(`🔄 Verification attempt #${attempts + 1} for order: ${orderId}`)

    try {
      // Check deposit status from backend
      console.log('📡 Calling API: checkMidtransDepositStatus')
      const statusResponse = await api.checkMidtransDepositStatus(orderId)
      
      console.log('📥 API Response:', JSON.stringify(statusResponse, null, 2))
      
      // ✅ UPDATE DEBUG INFO
      setDebugInfo({
        rawResponse: statusResponse,
        hasSuccess: statusResponse?.success,
        hasData: !!statusResponse?.data,
        dataKeys: statusResponse?.data ? Object.keys(statusResponse.data) : [],
        timestamp: new Date().toISOString()
      })

      if (!statusResponse.success) {
        throw new Error(statusResponse.error || 'Failed to check deposit status')
      }

      // ✅ FIXED: Safely extract deposit data from response
      let depositData: DepositStatus | null = null
      
      if (statusResponse.data) {
        console.log('🔍 Checking data structure:', statusResponse.data)
        
        // Check if response has nested 'deposit' property
        if ('deposit' in statusResponse.data && statusResponse.data.deposit) {
          console.log('✅ Found nested deposit property')
          depositData = statusResponse.data.deposit as DepositStatus
        } 
        // Or if response is directly the deposit data
        else if ('orderId' in statusResponse.data) {
          console.log('✅ Found direct deposit data')
          depositData = statusResponse.data as unknown as DepositStatus
        }
        else {
          console.error('❌ Unexpected data structure:', statusResponse.data)
        }
      }
      
      // ✅ FIXED: Only proceed if we have valid deposit data
      if (!depositData) {
        console.error('❌ No valid deposit data found')
        throw new Error('Invalid deposit data structure')
      }

      console.log('✅ Deposit data extracted:', depositData)
      setDepositInfo(depositData)
      setLastChecked(new Date())

      switch (depositData.status) {
        case 'success':
          console.log('✅ Deposit status: SUCCESS')
          setVerificationStatus('processing')
          
          const { verified } = await verifyBalanceUpdate(
            depositData.amount,
            depositData.voucherBonus || 0
          )

          if (verified) {
            // ✅ SUCCESS - Stop polling and auto-redirect
            console.log('🎉 VERIFICATION COMPLETE - Balance updated!')
            hasVerifiedRef.current = true
            setVerificationStatus('success')
            stopPolling()
            
            // Auto-redirect countdown
            let count = 5
            const countdownInterval = setInterval(() => {
              count -= 1
              setCountdown(count)
              if (count <= 0) {
                clearInterval(countdownInterval)
                router.push('/balance')
              }
            }, 1000)
            
          } else {
            // Balance not yet updated, continue polling
            console.log('⏳ Balance not yet updated, continuing to poll...')
            if (attempts >= MAX_ATTEMPTS) {
              console.warn('⚠️ Max attempts reached')
              setVerificationStatus('failed')
              setErrorMessage('Deposit processed but balance update timeout. Your balance will be updated shortly.')
              stopPolling()
            } else {
              setVerificationStatus('pending')
            }
          }
          break

        case 'pending':
          console.log('⏳ Deposit status: PENDING')
          setVerificationStatus('pending')
          
          if (attempts >= MAX_ATTEMPTS) {
            console.warn('⚠️ Max attempts reached')
            setVerificationStatus('failed')
            setErrorMessage('Payment confirmation timeout. Please check your balance later or contact support.')
            stopPolling()
          }
          break

        case 'failed':
        case 'expired':
          console.log(`❌ Deposit status: ${depositData.status.toUpperCase()}`)
          setVerificationStatus('failed')
          setErrorMessage(`Payment ${depositData.status === 'expired' ? 'expired' : 'failed'}. Please try again.`)
          stopPolling()
          break

        default:
          console.log('❓ Unknown status:', depositData.status)
          setVerificationStatus('pending')
      }

    } catch (error: any) {
      console.error('❌ Verification error:', error)
      
          setDebugInfo((prev: typeof debugInfo) => ({
        ...prev,
        error: error.message,
        errorStack: error.stack,
        timestamp: new Date().toISOString()
      }))

      
      if (attempts >= MAX_ATTEMPTS) {
        setVerificationStatus('failed')
        setErrorMessage('Unable to verify payment status. Please check your balance or contact support.')
        stopPolling()
      } else {
        setVerificationStatus('pending')
      }
    }
  }, [orderId, attempts, verifyBalanceUpdate, stopPolling, router])

  // ==========================================================
  // INITIALIZATION & POLLING SETUP
  // ==========================================================

  useEffect(() => {
    if (!orderId) {
      console.error('❌ No order ID provided')
      setVerificationStatus('failed')
      setErrorMessage('Invalid order ID')
      return
    }

    if (!user) {
      console.error('❌ User not authenticated')
      router.push('/')
      return
    }

    console.log('🚀 Payment success page initialized', { orderId, user: user.email })

    // Initial balance capture
    api.getBothBalances().then(res => {
      if (res.success && res.data) {
        previousBalanceRef.current = res.data.realBalance || 0
        console.log('💰 Initial balance captured:', previousBalanceRef.current)
      }
    })

    // First verification immediately
    verifyDeposit()

    // Setup auto-polling every 3 seconds
    pollIntervalRef.current = setInterval(verifyDeposit, POLLING_INTERVAL)

    return () => {
      console.log('🧹 Cleaning up payment success page')
      isMountedRef.current = false
      stopPolling()
    }
  }, [orderId, user, router, verifyDeposit, stopPolling])

  // ==========================================================
  // RENDER COMPONENTS
  // ==========================================================

  const renderStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return (
          <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
            <CheckCircle className="w-14 h-14 text-white" />
          </div>
        )
      case 'failed':
        return (
          <div className="w-24 h-24 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <XCircle className="w-14 h-14 text-white" />
          </div>
        )
      case 'processing':
      case 'checking':
        return (
          <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <RefreshCw className="w-14 h-14 text-white animate-spin" />
          </div>
        )
      case 'pending':
      default:
        return (
          <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Clock className="w-14 h-14 text-white animate-pulse" />
          </div>
        )
    }
  }

  const getStatusConfig = () => {
    switch (verificationStatus) {
      case 'success':
        return {
          title: 'Payment Successful!',
          description: 'Your payment has been verified and balance updated.',
          gradient: 'from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800'
        }
      case 'failed':
        return {
          title: 'Payment Failed',
          description: errorMessage || 'There was an issue with your payment.',
          gradient: 'from-red-50 to-rose-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800'
        }
      case 'processing':
        return {
          title: 'Verifying Balance...',
          description: 'Confirming your balance update...',
          gradient: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        }
      case 'checking':
        return {
          title: 'Checking Payment...',
          description: 'Verifying your payment status with Midtrans...',
          gradient: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800'
        }
      case 'pending':
      default:
        return {
          title: 'Processing Payment...',
          description: 'Waiting for payment confirmation. This may take a moment...',
          gradient: 'from-amber-50 to-orange-50',
          borderColor: 'border-amber-200',
          textColor: 'text-amber-800'
        }
    }
  }

  const renderProgressBar = () => {
    if (verificationStatus === 'success' || verificationStatus === 'failed') return null

    const progress = Math.min((attempts / MAX_ATTEMPTS) * 100, 100)
    const statusConfig = getStatusConfig()
    
    return (
      <div className="w-full mb-6">
        <div className="flex justify-between text-xs mb-2 font-medium">
          <span className={statusConfig.textColor}>Auto-checking...</span>
          <span className="text-gray-500">
            {attempts}/{MAX_ATTEMPTS} • {lastChecked.toLocaleTimeString('id-ID')}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 rounded-full ${
              verificationStatus === 'pending' ? 'bg-amber-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  const renderDepositDetails = () => {
    if (!depositInfo) return null

    const totalAmount = depositInfo.amount + (depositInfo.voucherBonus || 0)

    return (
      <div className="bg-white/70 backdrop-blur rounded-xl p-5 mb-6 border border-gray-200/50 text-left shadow-sm">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Transaction Details
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Order ID</span>
            <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs">
              {depositInfo.orderId}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Deposit Amount</span>
            <span className="font-bold text-gray-900 text-base">
              {formatCurrency(depositInfo.amount)}
            </span>
          </div>

          {depositInfo.voucherCode && depositInfo.voucherBonus ? (
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-green-600 flex items-center gap-1 font-medium">
                <Tag className="w-4 h-4" />
                Bonus ({depositInfo.voucherCode})
              </span>
              <span className="font-bold text-green-600 text-base">
                +{formatCurrency(depositInfo.voucherBonus)}
              </span>
            </div>
          ) : null}

          <div className="flex justify-between items-center py-3 bg-gradient-to-r from-blue-50 to-indigo-50 -mx-2 px-3 rounded-lg mt-2">
            <span className="font-bold text-gray-900">Total to Receive</span>
            <span className="text-xl font-bold text-blue-600">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {depositInfo.paymentType && (
            <div className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100 flex items-center gap-1">
              <span>Payment method:</span>
              <span className="font-semibold text-gray-700 capitalize bg-gray-100 px-2 py-0.5 rounded">
                {depositInfo.paymentType.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderBalanceVerification = () => {
    if (!balanceCheck || verificationStatus === 'failed') return null

    return (
      <div className={`rounded-xl p-4 mb-6 border ${
        balanceCheck.verified 
          ? 'bg-green-50 border-green-200' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center gap-2 mb-3">
          <Wallet className={`w-5 h-5 ${balanceCheck.verified ? 'text-green-600' : 'text-blue-600'}`} />
          <span className={`font-bold ${balanceCheck.verified ? 'text-green-900' : 'text-blue-900'}`}>
            {balanceCheck.verified ? '✓ Balance Verified' : '⟳ Checking Balance...'}
          </span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Previous:</span>
            <span className="font-medium text-gray-700">{formatCurrency(balanceCheck.previousBalance)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Current:</span>
            <span className={`font-bold ${balanceCheck.verified ? 'text-green-700' : 'text-blue-700'}`}>
              {formatCurrency(balanceCheck.currentBalance)}
            </span>
          </div>
          <div className="flex justify-between border-t border-gray-200/50 pt-2 mt-2">
            <span className="text-gray-600">Added:</span>
            <span className={`font-bold ${balanceCheck.verified ? 'text-green-700' : 'text-blue-700'}`}>
              +{formatCurrency(balanceCheck.difference)}
            </span>
          </div>
        </div>

        {!balanceCheck.verified && (
          <div className="mt-3 flex items-center gap-2 text-xs text-blue-700 bg-blue-100/50 p-2 rounded">
            <Loader2 className="w-4 h-4 animate-spin" />
            Waiting for balance update... ({attempts}s)
          </div>
        )}
      </div>
    )
  }

  // ✅ DEBUG PANEL
  const renderDebugPanel = () => {
    if (process.env.NODE_ENV !== 'development') return null

    return (
      <details className="mb-6 bg-gray-100 rounded-xl p-4 text-xs">
        <summary className="cursor-pointer font-bold text-gray-700">🐛 Debug Info (Dev Only)</summary>
        <pre className="mt-2 overflow-auto max-h-64 bg-white p-2 rounded border">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </details>
    )
  }

  const renderActionButtons = () => {
    if (verificationStatus === 'success') {
      return (
        <div className="space-y-3">
          <button
            onClick={() => router.push('/balance')}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            Go to Wallet
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <p className="text-sm text-gray-500 text-center flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Auto-redirect in {countdown}s...
          </p>
        </div>
      )
    }

    if (verificationStatus === 'failed') {
      return (
        <div className="space-y-3">
          <button
            onClick={() => router.push('/payment')}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            Try Payment Again
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => router.push('/balance')}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all"
          >
            Check My Balance
          </button>
        </div>
      )
    }

    // Pending/Processing - No manual buttons, just auto-polling indicator
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
          <div className="flex items-center justify-center gap-3 text-blue-800">
            <div className="relative">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute" />
              <div className="w-3 h-3 bg-blue-600 rounded-full relative" />
            </div>
            <span className="font-semibold">Auto-verifying in real-time...</span>
          </div>
          <p className="text-xs text-blue-600 mt-2 text-center">
            Checking every {POLLING_INTERVAL/1000}s • Please keep this page open
          </p>
        </div>

        <button
          onClick={() => router.push('/balance')}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2"
        >
          <Wallet className="w-5 h-5" />
          Check Balance Now
        </button>
      </div>
    )
  }

  const statusConfig = getStatusConfig()

  // ==========================================================
  // MAIN RENDER
  // ==========================================================

  return (
    <div className={`min-h-screen bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center p-4 transition-colors duration-500`}>
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl max-w-lg w-full border border-white/50">
        {/* Status Icon */}
        {renderStatusIcon()}
        
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 text-center">
          {statusConfig.title}
        </h1>
        
        {/* Description */}
        <p className="text-gray-600 mb-6 text-center leading-relaxed">
          {statusConfig.description}
        </p>

        {/* Progress Bar */}
        {renderProgressBar()}

        {/* Debug Panel (Dev Only) */}
        {renderDebugPanel()}

        {/* Deposit Details */}
        {renderDepositDetails()}

        {/* Balance Verification */}
        {renderBalanceVerification()}

        {/* Error Message */}
        {errorMessage && verificationStatus === 'failed' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        {renderActionButtons()}

        {/* Security Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200/50">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              verificationStatus === 'success' ? 'bg-green-400' :
              verificationStatus === 'failed' ? 'bg-red-400' :
              'bg-blue-400'
            }`} />
            <span>
              {verificationStatus === 'success' ? 'Verified & Secured' :
               verificationStatus === 'failed' ? 'Verification failed' :
               'Real-time verification active'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// LOADING FALLBACK
// ============================================================

function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 shadow-2xl max-w-lg w-full text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-14 h-14 text-blue-600 animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
        <p className="text-gray-600">Preparing payment verification</p>
      </div>
    </div>
  )
}

// ============================================================
// MAIN PAGE COMPONENT
// ============================================================

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}