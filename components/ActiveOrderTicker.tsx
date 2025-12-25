'use client'

import { useEffect, useState } from 'react'
import { BinaryOrder } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Clock, X } from 'lucide-react'

interface ActiveOrderTickerProps {
  orders: BinaryOrder[]
  onClose?: (orderId: string) => void
}

export default function ActiveOrderTicker({ orders, onClose }: ActiveOrderTickerProps) {
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({})

  useEffect(() => {
    if (orders.length === 0) return

    const interval = setInterval(() => {
      const newTimeLeft: Record<string, string> = {}

      orders.forEach(order => {
        if (order.exit_time) {
          const now = Date.now()
          const exitTime = new Date(order.exit_time).getTime()
          const diff = exitTime - now

          if (diff <= 0) {
            newTimeLeft[order.id] = 'Settling...'
          } else {
            const minutes = Math.floor(diff / 60000)
            const seconds = Math.floor((diff % 60000) / 1000)
            newTimeLeft[order.id] = `${minutes}:${seconds.toString().padStart(2, '0')}`
          }
        }
      })

      setTimeLeft(newTimeLeft)
    }, 100)

    return () => clearInterval(interval)
  }, [orders])

  if (orders.length === 0) return null

  return (
    <>
      {/* Desktop Version */}
      <div className="hidden lg:block fixed top-20 right-4 w-80 max-h-[400px] overflow-y-auto z-30">
        <div className="space-y-2">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-[#0f1419]/95 backdrop-blur-xl border border-gray-800/50 rounded-xl p-3 shadow-2xl animate-slide-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    order.direction === 'CALL' 
                      ? 'bg-green-500/20 border border-green-500/30' 
                      : 'bg-red-500/20 border border-red-500/30'
                  }`}>
                    {order.direction === 'CALL' ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{order.asset_name}</div>
                    <div className="text-[10px] text-gray-400">{order.direction}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold">{formatCurrency(order.amount)}</div>
                  <div className="text-[10px] text-gray-400">Entry: {order.entry_price.toFixed(3)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {timeLeft[order.id] || 'Calculating...'}
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  +{order.profitRate}% = {formatCurrency(order.amount * order.profitRate / 100)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    order.direction === 'CALL' ? 'bg-green-400' : 'bg-red-400'
                  }`}
                  style={{
                    width: order.exit_time 
                      ? `${Math.max(0, Math.min(100, ((new Date(order.exit_time).getTime() - Date.now()) / (order.duration * 60000)) * 100))}%`
                      : '100%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Version - Floating Bottom */}
      <div className="lg:hidden fixed bottom-20 left-2 right-2 z-30">
        <div className="space-y-2">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-[#0f1419]/95 backdrop-blur-xl border border-gray-800/50 rounded-xl p-2.5 shadow-2xl animate-slide-up"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  order.direction === 'CALL' 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-red-500/20 border border-red-500/30'
                }`}>
                  {order.direction === 'CALL' ? (
                    <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold truncate">{order.asset_name}</span>
                    <span className="text-xs font-mono font-bold ml-2">{formatCurrency(order.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">{order.direction} @ {order.entry_price.toFixed(3)}</span>
                    <span className="text-gray-400">+{order.profitRate}%</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {timeLeft[order.id] || '...'}
                  </span>
                </div>
                <div className="text-xs font-semibold text-green-400">
                  {formatCurrency(order.amount * order.profitRate / 100)}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    order.direction === 'CALL' ? 'bg-green-400' : 'bg-red-400'
                  }`}
                  style={{
                    width: order.exit_time 
                      ? `${Math.max(0, Math.min(100, ((new Date(order.exit_time).getTime() - Date.now()) / (order.duration * 60000)) * 100))}%`
                      : '100%'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-left {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-left {
          animation: slide-left 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  )
}