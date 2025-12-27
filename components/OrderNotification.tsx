// components/OrderNotification.tsx - MINIMALIS & PERFORMA TINGGI
'use client'

import { useEffect, useState } from 'react'
import { BinaryOrder } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { CheckCircle2, XCircle, TrendingUp, TrendingDown } from 'lucide-react'

interface OrderNotificationProps {
  order: BinaryOrder | null
  onClose: () => void
}

export default function OrderNotification({ order, onClose }: OrderNotificationProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (order) {
      setShow(true)
      const timer = setTimeout(() => {
        handleClose()
      }, 4000) // Auto close 4 detik
      return () => clearTimeout(timer)
    }
  }, [order])

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 200) // Waktu untuk animasi keluar
  }

  if (!order || order.status === 'ACTIVE') return null

  const isWin = order.status === 'WON'
  const profit = order.profit || 0

  return (
    <>
      {/* Backdrop Minimal */}
      <div 
        className={`fixed inset-0 z-[60] bg-black/30 transition-opacity duration-200 ${
          show ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Notification Card - Compact & Clean */}
      <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] transition-all duration-300 ${
        show ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
      }`}>
        <div className={`w-[90vw] max-w-sm rounded-2xl overflow-hidden shadow-2xl ${
          isWin 
            ? 'bg-gradient-to-br from-green-500/10 to-emerald-600/10' 
            : 'bg-gradient-to-br from-red-500/10 to-rose-600/10'
        }`}>
          {/* Glass Background */}
          <div className="relative bg-[#0f1419]/95 backdrop-blur-xl border border-gray-800/50">
            
            {/* Top Border Accent */}
            <div className={`h-1 w-full ${isWin ? 'bg-green-500' : 'bg-red-500'}`} />

            {/* Content */}
            <div className="p-6">
              
              {/* Icon & Status */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isWin 
                    ? 'bg-green-500/20 border-2 border-green-500' 
                    : 'bg-red-500/20 border-2 border-red-500'
                }`}>
                  {isWin ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className={`text-xl font-bold ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                    {isWin ? 'Trade Won!' : 'Trade Lost'}
                  </h3>
                  <p className="text-sm text-gray-400">{order.asset_name}</p>
                </div>
              </div>

              {/* Trade Info - Clean Grid */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Direction</span>
                  <div className="flex items-center gap-1.5">
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

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Amount</span>
                  <span className="font-mono font-semibold text-white">
                    {formatCurrency(order.amount)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Price</span>
                  <span className="font-mono text-gray-300">
                    {order.entry_price.toFixed(3)} → {order.exit_price?.toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Profit/Loss - Prominent */}
              <div className={`relative p-4 rounded-xl mb-4 text-center ${
                isWin 
                  ? 'bg-green-500/10 border border-green-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className="text-xs text-gray-400 mb-1">
                  {isWin ? 'Profit' : 'Loss'}
                </div>
                <div className={`text-3xl font-bold font-mono ${
                  isWin ? 'text-green-400' : 'text-red-400'
                }`}>
                  {profit > 0 ? '+' : ''}{formatCurrency(profit)}
                </div>
              </div>

              {/* Close Button - Simple */}
              <button
                onClick={handleClose}
                className={`w-full py-3 rounded-xl font-semibold transition-all ${
                  isWin 
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30' 
                    : 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30'
                }`}
              >
                Continue Trading
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}