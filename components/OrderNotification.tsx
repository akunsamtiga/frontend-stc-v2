// components/OrderNotification.tsx - DYNAMIC ISLAND SINGLE BAR
'use client'

import { useEffect, useRef, useState } from 'react'
import { BinaryOrder } from '@/types'
import { formatCurrency, playSound } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface OrderNotificationProps {
  order: BinaryOrder | null
  onClose: () => void
}

export default function OrderNotification({ order, onClose }: OrderNotificationProps) {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const lastNotifiedRef = useRef<string | null>(null)
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!order) {
      setVisible(false)
      setExpanded(false)
      return
    }

    if (lastNotifiedRef.current === order.id) {
      return
    }

    if (order.status !== 'WON' && order.status !== 'LOST') {
      return
    }

    lastNotifiedRef.current = order.id

    // Show compact
    requestAnimationFrame(() => {
      setVisible(true)
    })

    // Expand after 150ms
    setTimeout(() => {
      setExpanded(true)
    }, 150)

    // Play sound
    const isWin = order.status === 'WON'
    try {
      playSound(isWin ? '/sounds/win.mp3' : '/sounds/lose.mp3', 0.3)
    } catch (e) {}

    // Auto close after 3.5 seconds
    autoCloseTimeoutRef.current = setTimeout(() => {
      setExpanded(false)
      setTimeout(() => {
        setVisible(false)
        setTimeout(() => {
          onClose()
          lastNotifiedRef.current = null
        }, 500)
      }, 600)
    }, 3500)

    return () => {
      if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current)
    }
  }, [order, onClose])

  if (!order) return null

  const isWin = order.status === 'WON'
  const profit = order.profit || 0
  const isCall = order.direction === 'CALL'

  return (
    <>
      {/* Backdrop Overlay - Gradient dark from top */}
      <div 
        className={`
          fixed inset-0 z-[9998] pointer-events-none
          transition-opacity duration-500
          ${visible ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.3) 30%, transparent 50%)'
        }}
      />

      {/* Notification */}
      <div 
        className={`
          fixed z-[9999]
          transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          
          /* Mobile & Desktop positioning */
          top-3 left-1/2 -translate-x-1/2
          
          ${visible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : '-translate-y-4 opacity-0 scale-95 pointer-events-none'
          }
        `}
      >
      <div 
        className={`
          relative overflow-hidden backdrop-blur-3xl
          ${isWin 
            ? 'bg-gradient-to-br from-emerald-500/12 via-slate-900/85 to-slate-950/90' 
            : 'bg-gradient-to-br from-rose-500/12 via-slate-900/85 to-slate-950/90'
          }
          rounded-full
          transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]
          
          /* Dynamic width based on state */
          ${expanded 
            ? 'w-[280px] sm:w-[340px]' 
            : 'w-[100px]'
          }
          
          h-[44px]
          
          flex items-center
          px-4
        `}
        style={{
          boxShadow: isWin
            ? '0 20px 40px -12px rgba(16, 185, 129, 0.22), 0 0 0 0.5px rgba(16, 185, 129, 0.18)'
            : '0 20px 40px -12px rgba(244, 63, 94, 0.22), 0 0 0 0.5px rgba(244, 63, 94, 0.18)',
        }}
      >
        {/* COMPACT STATE - Icon + Checkmark */}
        <div 
          className={`
            flex items-center justify-center gap-1.5 w-full
            transition-all duration-500
            ${expanded ? 'opacity-0 absolute' : 'opacity-100'}
          `}
        >
          {isCall ? (
            <TrendingUp className={`w-3.5 h-3.5 ${isWin ? 'text-emerald-400' : 'text-rose-400'}`} strokeWidth={2.5} />
          ) : (
            <TrendingDown className={`w-3.5 h-3.5 ${isWin ? 'text-emerald-400' : 'text-rose-400'}`} strokeWidth={2.5} />
          )}
          <span className={`text-sm font-bold ${isWin ? 'text-emerald-300' : 'text-rose-300'}`}>
            {isWin ? '✓' : '✗'}
          </span>
        </div>

        {/* EXPANDED STATE - Single Line Info */}
        <div 
          className={`
            flex items-center justify-between w-full gap-2
            transition-all duration-500 delay-200
            ${expanded ? 'opacity-100' : 'opacity-0 absolute'}
          `}
        >
          {/* Left: Icon + Direction */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isCall ? (
              <TrendingUp className={`w-4 h-4 ${isWin ? 'text-emerald-400' : 'text-rose-400'}`} strokeWidth={2.5} />
            ) : (
              <TrendingDown className={`w-4 h-4 ${isWin ? 'text-emerald-400' : 'text-rose-400'}`} strokeWidth={2.5} />
            )}
            <span className={`text-xs font-bold ${isWin ? 'text-emerald-300' : 'text-rose-300'}`}>
              {isCall ? 'BUY' : 'SELL'}
            </span>
          </div>

          {/* Separator */}
          <div className="h-4 w-[1px] bg-white/10 flex-shrink-0" />

          {/* Center: Win/Lost */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className={`text-xs font-bold ${isWin ? 'text-emerald-300' : 'text-rose-300'}`}>
              {isWin ? 'WON' : 'LOST'}
            </span>
          </div>

          {/* Separator */}
          <div className="h-4 w-[1px] bg-white/10 flex-shrink-0" />

          {/* Right: Payout */}
          <div className="flex-1 text-right min-w-0">
            <span className={`text-sm font-bold tabular-nums ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
              {profit > 0 ? '+' : ''}{formatCurrency(profit)}
            </span>
          </div>
        </div>

        {/* Subtle glow overlay */}
        <div 
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            background: isWin
              ? 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1), transparent 70%)'
              : 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.1), transparent 70%)'
          }}
        />

        {/* Progress indicator (bottom) */}
        <div 
          className={`
            absolute bottom-0 left-0 right-0 h-[2px] bg-white/5
            transition-opacity duration-500 delay-300
            ${expanded ? 'opacity-100' : 'opacity-0'}
          `}
        >
          <div 
            className={`h-full ${isWin ? 'bg-emerald-500' : 'bg-rose-500'}`}
            style={{
              animation: expanded ? 'progress 3.5s linear forwards' : 'none',
              width: expanded ? '100%' : '0%'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
    </>
  )
}