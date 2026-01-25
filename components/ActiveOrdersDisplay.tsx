// components/ActiveOrdersDisplay.tsx
'use client'

import { memo } from 'react'
import { Clock, ArrowUp, ArrowDown, Zap } from 'lucide-react'
import { BinaryOrder } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { useInstantCountdown } from '@/hooks/useInstantOrders'

interface ActiveOrdersDisplayProps {
  orders: BinaryOrder[]
}

const ActiveOrdersDisplay = memo(({ orders }: ActiveOrdersDisplayProps) => {
  const timeLeft = useInstantCountdown(orders)

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2)
    if (price >= 1) return price.toFixed(6)
    return price.toFixed(8)
  }

  if (orders.length === 0) return null

  return (
    <div className="absolute bottom-2 left-2 z-10 space-y-2 max-w-sm">
      {orders.map((order) => {
        const isCall = order.direction === 'CALL'
        const remaining = timeLeft.get(order.id) || 0
        const isVeryUrgent = remaining <= 2 && remaining > 0
        const isUrgent = remaining <= 5 && remaining > 0
        const potentialProfit = (order.amount * order.profitRate) / 100
        const isOptimistic = (order as any).isOptimistic

        return (
          <div
            key={order.id}
            className={`
              bg-black/60 backdrop-blur-md border rounded-lg p-3
              transition-all duration-200
              ${isCall ? 'border-green-500/30' : 'border-red-500/30'}
              ${isVeryUrgent ? 'border-red-500/60' : ''}
              ${isUrgent && !isVeryUrgent ? 'ring-1 ring-yellow-500/30' : ''}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isCall ? (
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <ArrowUp className="w-4 h-4 text-green-400" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                    <ArrowDown className="w-4 h-4 text-red-400" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-white">
                    {order.asset_name}
                  </div>
                  <div className={`text-xs font-semibold ${isCall ? 'text-green-400' : 'text-red-400'}`}>
                    {order.direction}
                  </div>
                </div>
              </div>

              <div className={`
                flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono font-bold transition-all
                ${isVeryUrgent 
                  ? 'bg-red-500/30 text-red-300 border border-red-500/50' 
                  : isUrgent 
                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }
              `}>
                <Clock className="w-3 h-3" />
                <span>{formatTimeLeft(remaining)}</span>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Amount:</span>
                <span className="text-white font-semibold">{formatCurrency(order.amount)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Entry:</span>
                <span className="text-white font-mono">{formatPrice(order.entry_price)}</span>
              </div>

              <div className="flex justify-between pt-1 border-t border-gray-700/50">
                <span className="text-gray-400">Potential:</span>
                <span className="text-green-400 font-bold">
                  +{formatCurrency(potentialProfit)}
                </span>
              </div>
            </div>

            <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  isVeryUrgent 
                    ? 'bg-red-500' 
                    : isUrgent 
                      ? 'bg-yellow-500' 
                      : isCall 
                        ? 'bg-green-500' 
                        : 'bg-red-500'
                }`}
                style={{
                  width: `${Math.max(0, Math.min(100, (remaining / 300) * 100))}%`
                }}
              />
            </div>

            {isOptimistic && (
              <div className="flex items-center gap-1 mt-2 text-xs text-yellow-400">
                <Zap className="w-3 h-3 animate-pulse" />
                <span>Processing...</span>
              </div>
            )}
          </div>
        )
      })}

      {orders.length > 1 && (
        <div className="bg-black/40 backdrop-blur-sm border border-gray-700/50 rounded-lg p-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">Total Active:</span>
            <span className="text-white font-bold">{orders.length} orders</span>
          </div>
        </div>
      )}
    </div>
  )
})

ActiveOrdersDisplay.displayName = 'ActiveOrdersDisplay'

export default ActiveOrdersDisplay