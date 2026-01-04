// components/OrderNotification.tsx - FIXED: No Duplicate Notifications
'use client'

import { useEffect, useRef } from 'react'
import { BinaryOrder } from '@/types'
import { formatCurrency, playSound } from '@/lib/utils'
import { CheckCircle2, XCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

interface OrderNotificationProps {
  order: BinaryOrder | null
  onClose: () => void
}

export default function OrderNotification({ order, onClose }: OrderNotificationProps) {
  const lastNotifiedOrderRef = useRef<string | null>(null)
  const toastIdRef = useRef<string | number | null>(null)
  const isProcessingRef = useRef(false)

  useEffect(() => {
    // Skip if no order
    if (!order) {
      lastNotifiedOrderRef.current = null
      isProcessingRef.current = false
      return
    }

    // Skip if currently processing another notification
    if (isProcessingRef.current) {
      console.log('⏭️ Skipping: Already processing notification')
      return
    }

    // CRITICAL: Don't show notification for ACTIVE orders
    if (order.status === 'ACTIVE' || order.status === 'PENDING') {
      return
    }

    // CRITICAL: Check if this order was already notified
    if (lastNotifiedOrderRef.current === order.id) {
      console.log('⏭️ Skipping duplicate notification for order:', order.id)
      return
    }

    // Mark as processing
    isProcessingRef.current = true
    
    // Mark this order as notified IMMEDIATELY
    lastNotifiedOrderRef.current = order.id
    console.log('🔔 Showing notification for order:', order.id, order.status)

    const isWin = order.status === 'WON'
    const profit = order.profit || 0

    // Play sound
    try {
      playSound(isWin ? '/sounds/win.mp3' : '/sounds/lose.mp3', 0.3)
    } catch (e) {
      console.log('Audio play failed:', e)
    }

    // Custom toast content
    const ToastContent = () => (
      <div className="flex items-start gap-3 w-full">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isWin 
            ? 'bg-green-500/20 border-2 border-green-500' 
            : 'bg-red-500/20 border-2 border-red-500'
        }`}>
          {isWin ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400" />
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
            <span className="font-mono">{formatCurrency(order.amount)}</span>
          </div>

          {/* Profit/Loss */}
          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold font-mono ${
            isWin 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          }`}>
            {profit > 0 ? '+' : ''}{formatCurrency(profit)}
          </div>
        </div>
      </div>
    )

    // Dismiss previous toast if exists
    if (toastIdRef.current !== null) {
      toast.dismiss(toastIdRef.current)
    }

    // Show toast with custom styling
    toastIdRef.current = toast.custom(
      () => (
        <div className="max-w-md w-full pointer-events-auto animate-toast-in">
          <div className={`rounded-xl shadow-2xl border overflow-hidden ${
            isWin
              ? 'bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-500/30'
              : 'bg-gradient-to-br from-red-500/10 to-rose-600/10 border-red-500/30'
          }`}>
            <div className="bg-[#0f1419]/95 backdrop-blur-xl p-4">
              <ToastContent />
            </div>
          </div>

          <style jsx>{`
            @keyframes toast-in {
              from {
                transform: translateX(calc(100% + 1rem));
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }

            .animate-toast-in {
              animation: toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            }
          `}</style>
        </div>
      ),
      {
        duration: 4000,
        position: 'top-right',
        id: `order-${order.id}`, // Unique ID per order
      }
    )

    // Cleanup after toast duration + buffer
    const cleanupTimer = setTimeout(() => {
      isProcessingRef.current = false
      onClose()
      toastIdRef.current = null
    }, 4500) // 4000ms toast + 500ms buffer

    return () => {
      clearTimeout(cleanupTimer)
    }
  }, [order, onClose])

  // No visible component, just triggers toast
  return null
}