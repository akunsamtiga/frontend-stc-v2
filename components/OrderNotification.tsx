// components/OrderNotification.tsx - ULTRA OPTIMIZED
'use client'

import { useEffect, useRef, memo } from 'react'
import { BinaryOrder } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2, XCircle, TrendingUp, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'

interface OrderNotificationProps {
  order: BinaryOrder | null
  onClose: () => void
}

const OrderNotification = memo(({ order, onClose }: OrderNotificationProps) => {
  const toastIdRef = useRef<string | number | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Cleanup previous
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
    }

    if (!order || order.status === 'ACTIVE') return

    const isWin = order.status === 'WON'
    const profit = order.profit || 0

    // Immediate toast
    const ToastContent = () => (
      <div className="flex items-start gap-3 w-full">
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

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-bold text-sm ${isWin ? 'text-green-400' : 'text-red-400'}`}>
              {isWin ? 'Trade Won! 🎉' : 'Trade Lost 😔'}
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

    // Show toast instantly
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
        duration: 5000,
        position: 'top-right',
      }
    )

    // Auto cleanup
    timerRef.current = setTimeout(() => {
      onClose()
    }, 5000)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [order, onClose])

  return null
})

OrderNotification.displayName = 'OrderNotification'

export default OrderNotification