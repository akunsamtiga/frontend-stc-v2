// components/OrderNotification.tsx - INSTANT VERSION
'use client'

import { useEffect, useRef, useState } from 'react'
import { BinaryOrder } from '@/types'
import { formatCurrency, playSound } from '@/lib/utils'
import { CheckCircle2, XCircle, TrendingUp, TrendingDown } from 'lucide-react'

interface OrderNotificationProps {
  order: BinaryOrder | null
  onClose: () => void
}

export default function OrderNotification({ order, onClose }: OrderNotificationProps) {
  const [visible, setVisible] = useState(false)
  const lastNotifiedRef = useRef<string | null>(null)
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!order) {
      setVisible(false)
      return
    }

    // Skip if already notified
    if (lastNotifiedRef.current === order.id) {
      console.log('⏭️ Skipping duplicate notification:', order.id)
      return
    }

    // Only notify for completed orders
    if (order.status !== 'WON' && order.status !== 'LOST') {
      return
    }

    lastNotifiedRef.current = order.id
    console.log('🔔 Showing instant notification:', order.id, order.status)

    // ✅ Show immediately with requestAnimationFrame for instant feedback
    requestAnimationFrame(() => {
      setVisible(true)
    })

    // ✅ Play sound instantly
    const isWin = order.status === 'WON'
    try {
      playSound(isWin ? '/sounds/win.mp3' : '/sounds/lose.mp3', 0.3)
    } catch (e) {
      console.log('Audio play failed:', e)
    }

    // ✅ Auto-hide after 4 seconds
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }

    closeTimeoutRef.current = setTimeout(() => {
      setVisible(false)
      setTimeout(() => {
        onClose()
        lastNotifiedRef.current = null
      }, 300)
    }, 4000)

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current)
      }
    }
  }, [order, onClose])

  if (!order) return null

  const isWin = order.status === 'WON'
  const profit = order.profit || 0

  return (
    <div 
      className={`fixed top-4 right-4 z-[9999] transition-all duration-300 ease-out ${
        visible 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
      }`}
    >
      <div className={`
        max-w-sm rounded-xl shadow-2xl border-2 overflow-hidden
        ${isWin 
          ? 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/50' 
          : 'bg-gradient-to-br from-red-500/20 to-rose-600/20 border-red-500/50'
        }
      `}>
        <div className="bg-[#0f1419]/95 backdrop-blur-xl p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              isWin 
                ? 'bg-green-500/20 border-2 border-green-500 animate-bounce-once' 
                : 'bg-red-500/20 border-2 border-red-500 animate-shake-once'
            }`}>
              {isWin ? (
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              ) : (
                <XCircle className="w-6 h-6 text-red-400" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`font-bold text-sm ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                  {isWin ? 'Trade Won! 🎉' : 'Trade Lost'}
                </h4>
                <span className="text-xs text-gray-400">{order.asset_name}</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
                {order.direction === 'CALL' ? (
                  <TrendingUp className="w-3 h-3 text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-400" />
                )}
                <span className="font-semibold">{order.direction}</span>
                <span className="text-gray-500">•</span>
                <span>{formatCurrency(order.amount)}</span>
              </div>

              {/* Profit/Loss */}
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold ${
                isWin 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {profit > 0 ? '+' : ''}{formatCurrency(profit)}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={() => {
                setVisible(false)
                setTimeout(() => {
                  onClose()
                  lastNotifiedRef.current = null
                }, 300)
              }}
              className="text-gray-400 hover:text-white transition-colors text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-800">
          <div 
            className={`h-full ${isWin ? 'bg-green-500' : 'bg-red-500'}`}
            style={{
              animation: 'progress 4s linear forwards'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }

        @keyframes bounce-once {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-10px); }
          50% { transform: translateY(0); }
          75% { transform: translateY(-5px); }
        }

        @keyframes shake-once {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          50% { transform: translateX(5px); }
          75% { transform: translateX(-3px); }
        }

        .animate-bounce-once {
          animation: bounce-once 0.6s ease-out;
        }

        .animate-shake-once {
          animation: shake-once 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}