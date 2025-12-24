// components/OrderNotification.tsx
'use client'

import { useEffect, useState } from 'react'
import { BinaryOrder } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Trophy, XCircle, TrendingUp, TrendingDown, Sparkles } from 'lucide-react'

interface OrderNotificationProps {
  order: BinaryOrder | null
  onClose: () => void
}

export default function OrderNotification({ order, onClose }: OrderNotificationProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (order) {
      setShow(true)
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [order])

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 300)
  }

  if (!order || order.status === 'ACTIVE') return null

  const isWin = order.status === 'WON'
  const profit = order.profit || 0

  return (
    <>
      {/* Backdrop with blur */}
      <div 
        className={`fixed inset-0 z-[60] transition-all duration-300 ${
          show ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Notification Card */}
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] transition-all duration-500 ${
        show ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
      }`}>
        <div className={`relative w-[90vw] max-w-md rounded-3xl overflow-hidden shadow-2xl ${
          isWin 
            ? 'bg-gradient-to-br from-emerald-500/20 via-green-500/20 to-teal-500/20' 
            : 'bg-gradient-to-br from-red-500/20 via-rose-500/20 to-orange-500/20'
        }`}>
          {/* Glass effect */}
          <div className="absolute inset-0 bg-[#0a0e17]/80 backdrop-blur-2xl"></div>
          
          {/* Animated border */}
          <div className={`absolute inset-0 rounded-3xl border-2 ${
            isWin ? 'border-emerald-500/50' : 'border-red-500/50'
          }`}>
            <div className={`absolute inset-0 ${
              isWin ? 'bg-emerald-500/20' : 'bg-red-500/20'
            } blur-xl opacity-50`}></div>
          </div>

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 ${
                  isWin ? 'bg-emerald-400' : 'bg-red-400'
                } rounded-full opacity-0 animate-float-particle`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative p-8 text-center">
            {/* Icon with pulse animation */}
            <div className="relative inline-block mb-6">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
                isWin 
                  ? 'bg-gradient-to-br from-emerald-500 to-green-500' 
                  : 'bg-gradient-to-br from-red-500 to-rose-500'
              } shadow-2xl animate-scale-pulse`}>
                {isWin ? (
                  <Trophy className="w-12 h-12 text-white animate-bounce-subtle" />
                ) : (
                  <XCircle className="w-12 h-12 text-white animate-shake" />
                )}
              </div>
              
              {/* Pulsing rings */}
              <div className={`absolute inset-0 rounded-full border-4 ${
                isWin ? 'border-emerald-400' : 'border-red-400'
              } animate-ping opacity-20`}></div>
              <div className={`absolute inset-0 rounded-full border-2 ${
                isWin ? 'border-emerald-400' : 'border-red-400'
              } animate-pulse opacity-40`}></div>
              
              {/* Sparkles for win */}
              {isWin && (
                <>
                  <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-400 animate-spin-slow" />
                  <Sparkles className="absolute -bottom-2 -left-2 w-5 h-5 text-yellow-400 animate-spin-slow" style={{ animationDelay: '0.5s' }} />
                </>
              )}
            </div>

            {/* Title */}
            <h2 className={`text-3xl font-bold mb-3 animate-slide-down ${
              isWin ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {isWin ? 'TRADE WON!' : 'TRADE LOST'}
            </h2>

            {/* Subtitle */}
            <p className="text-gray-300 mb-6 animate-slide-down" style={{ animationDelay: '0.1s' }}>
              Your {order.direction} position on {order.asset_name}
            </p>

            {/* Divider with glow */}
            <div className="relative h-px mb-6">
              <div className={`absolute inset-0 ${
                isWin ? 'bg-gradient-to-r from-transparent via-emerald-500 to-transparent' : 'bg-gradient-to-r from-transparent via-red-500 to-transparent'
              }`}></div>
            </div>

            {/* Trade details */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <span className="text-gray-400">Direction</span>
                <div className="flex items-center gap-2">
                  {order.direction === 'CALL' ? (
                    <>
                      <TrendingUp className="w-4 h-4 text-green-400" />
                      <span className="font-semibold text-green-400">CALL</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 text-red-400" />
                      <span className="font-semibold text-red-400">PUT</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-sm animate-slide-up" style={{ animationDelay: '0.25s' }}>
                <span className="text-gray-400">Amount</span>
                <span className="font-mono font-semibold text-white">{formatCurrency(order.amount)}</span>
              </div>

              <div className="flex items-center justify-between text-sm animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <span className="text-gray-400">Entry → Exit</span>
                <span className="font-mono text-gray-300">
                  {order.entry_price.toFixed(3)} → {order.exit_price?.toFixed(3)}
                </span>
              </div>
            </div>

            {/* Profit/Loss - BIG */}
            <div className={`relative p-6 rounded-2xl mb-6 animate-scale-in ${
              isWin 
                ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/50' 
                : 'bg-gradient-to-br from-red-500/20 to-rose-500/20 border-2 border-red-500/50'
            }`} style={{ animationDelay: '0.35s' }}>
              <div className="text-sm text-gray-300 mb-2">
                {isWin ? 'Profit' : 'Loss'}
              </div>
              <div className={`text-5xl font-bold font-mono ${
                isWin ? 'text-emerald-400' : 'text-red-400'
              } drop-shadow-2xl`}>
                {profit > 0 ? '+' : ''}{formatCurrency(profit)}
              </div>
              
              {/* Glow effect */}
              <div className={`absolute inset-0 ${
                isWin ? 'bg-emerald-500/20' : 'bg-red-500/20'
              } blur-2xl rounded-2xl -z-10`}></div>
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                isWin 
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400' 
                  : 'bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400'
              } animate-slide-up`}
              style={{ animationDelay: '0.4s' }}
            >
              Continue Trading
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float-particle {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0);
          }
          50% {
            opacity: 0.8;
            transform: translateY(-100px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-200px) scale(0.5);
          }
        }

        @keyframes scale-pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-float-particle {
          animation: float-particle 4s ease-out infinite;
        }

        .animate-scale-pulse {
          animation: scale-pulse 2s ease-in-out infinite;
        }

        .animate-bounce-subtle {
          animation: bounce-subtle 1.5s ease-in-out infinite;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.6s ease-out;
        }
      `}</style>
    </>
  )
}