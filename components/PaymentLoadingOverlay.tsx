// components/PaymentLoadingOverlay.tsx
// ✅ Beautiful loading overlay for Midtrans Snap payment

'use client'

import { Loader2, Shield, CreditCard, Lock, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PaymentLoadingOverlayProps {
  isVisible: boolean
  amount?: number
  orderId?: string
}

/**
 * ✅ PAYMENT LOADING OVERLAY
 * 
 * Tampilkan overlay indah saat:
 * - Midtrans Snap sedang di-load
 * - Transaction sedang dibuat
 * - Waiting for payment gateway
 */
export default function PaymentLoadingOverlay({ 
  isVisible, 
  amount,
  orderId 
}: PaymentLoadingOverlayProps) {
  const [dots, setDots] = useState('')
  const [currentTip, setCurrentTip] = useState(0)

  const securityTips = [
    'Your payment is secured with SSL encryption',
    'We never store your card information',
    'Transaction protected by fraud detection',
    'Your data is encrypted end-to-end'
  ]

  /**
   * Animate dots
   */
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    return () => clearInterval(interval)
  }, [isVisible])

  /**
   * Rotate security tips
   */
  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % securityTips.length)
    }, 3000)

    return () => clearInterval(interval)
  }, [isVisible])

  /**
   * Format currency
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 animate-scaleIn">
        
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-center relative overflow-hidden">
          {/* Animated background circles */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-float delay-1000"></div>
          
          <div className="relative">
            {/* Main loader */}
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30 relative">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
              
              {/* Orbiting icons */}
              <div className="absolute inset-0 animate-spin-slow">
                <CreditCard className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-white" />
              </div>
              <div className="absolute inset-0 animate-spin-slow-reverse">
                <Shield className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-5 h-5 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              Preparing Payment{dots}
            </h2>
            
            <p className="text-blue-100 text-sm">
              Setting up secure payment gateway
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          
          {/* Amount */}
          {amount && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 mb-6 border-2 border-blue-200 text-center">
              <div className="text-xs text-blue-700 font-semibold mb-2 uppercase tracking-wider">
                Payment Amount
              </div>
              <div className="text-3xl font-bold text-blue-900 mb-2">
                {formatCurrency(amount)}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
                <Lock className="w-3.5 h-3.5" />
                <span>Encrypted Transaction</span>
              </div>
            </div>
          )}

          {/* Order ID */}
          {orderId && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">
                Order ID
              </div>
              <div className="text-sm font-mono text-gray-900 break-all bg-white px-3 py-2 rounded-lg border border-gray-200">
                {orderId}
              </div>
            </div>
          )}

          {/* Loading Steps */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-200">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-blue-900">
                  Initializing secure connection...
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 opacity-50">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-700">
                  Loading payment methods
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 opacity-50">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-700">
                  Verifying transaction
                </div>
              </div>
            </div>
          </div>

          {/* Security Tip - Rotating */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 min-h-[80px] flex items-center">
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0 mt-1">
                <Sparkles className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-green-700 font-semibold mb-1 uppercase tracking-wider">
                  Security Note
                </div>
                <div className="text-sm text-green-900 transition-all duration-500">
                  {securityTips[currentTip]}
                </div>
              </div>
            </div>
          </div>

          {/* Please Wait */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Please wait while we prepare your payment options
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.95);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-20px) scale(1.1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }

        .animate-spin-slow-reverse {
          animation: spin 8s linear infinite reverse;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </div>
  )
}