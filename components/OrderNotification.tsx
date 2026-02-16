// components/OrderNotification.tsx - BATCH AGGREGATION SUPPORT
'use client'

import { useEffect, useRef, useState } from 'react'
import { BinaryOrder } from '@/types'
import { formatCurrency, playSound } from '@/lib/utils'

interface BatchResult {
  orders: BinaryOrder[]
  totalProfit: number
  wonCount: number
  lostCount: number
  timestamp: number
}

interface OrderNotificationProps {
  orders: BinaryOrder[] // Changed from single order to array
  onClose: () => void
}

export default function OrderNotification({ orders, onClose }: OrderNotificationProps) {
  const [visible, setVisible] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [batchResult, setBatchResult] = useState<BatchResult | null>(null)
  const lastNotifiedRef = useRef<Set<string>>(new Set())
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!orders || orders.length === 0) {
      setVisible(false)
      setExpanded(false)
      setIsClosing(false)
      setBatchResult(null)
      return
    }

    // Filter settled orders that haven't been notified yet
    const settledOrders = orders.filter(order => 
      (order.status === 'WON' || order.status === 'LOST') &&
      !lastNotifiedRef.current.has(order.id)
    )

    if (settledOrders.length === 0) return

    // Mark as notified
    settledOrders.forEach(order => lastNotifiedRef.current.add(order.id))

    // Calculate batch results
    const wonOrders = settledOrders.filter(o => o.status === 'WON')
    const lostOrders = settledOrders.filter(o => o.status === 'LOST')
    const totalProfit = settledOrders.reduce((sum, o) => sum + (o.profit || 0), 0)

    const batch: BatchResult = {
      orders: settledOrders,
      totalProfit,
      wonCount: wonOrders.length,
      lostCount: lostOrders.length,
      timestamp: Date.now(),
    }

    setBatchResult(batch)
    setIsClosing(false)

    // ⚡ INSTANT: Show immediately with requestAnimationFrame
    requestAnimationFrame(() => {
      setVisible(true)
      // Expand immediately (no delay)
      requestAnimationFrame(() => {
        setExpanded(true)
      })
    })

    // Play sound based on overall result
    try {
      const isOverallWin = totalProfit > 0
      playSound(isOverallWin ? '/sounds/win.mp3' : '/sounds/lose.mp3', 0.3)
    } catch (e) {}

    // Auto close after 3 seconds (reduced from 4)
    autoCloseTimeoutRef.current = setTimeout(() => {
      setIsClosing(true)
      setTimeout(() => {
        setVisible(false)
        setTimeout(() => {
          onClose()
          // Clear notified IDs after closing
          setTimeout(() => {
            lastNotifiedRef.current.clear()
            setBatchResult(null)
            setExpanded(false)
            setIsClosing(false)
          }, 500)
        }, 300) // Reduced from 500ms
      }, 100)
    }, 3000) // Reduced from 4000ms

    return () => {
      if (autoCloseTimeoutRef.current) clearTimeout(autoCloseTimeoutRef.current)
    }
  }, [orders, onClose])

  if (!batchResult) return null

  const { totalProfit, wonCount, lostCount, orders: settledOrders } = batchResult
  const isOverallWin = totalProfit > 0
  const isBatch = settledOrders.length > 1
  const showExpandedContent = expanded || isClosing

  return (
    <>
      {/* Backdrop Overlay */}
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

      {/* Notification Container */}
      <div 
        className={`
          fixed z-[9999] top-3 left-1/2 -translate-x-1/2
          transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
          
          ${visible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : '-translate-y-4 opacity-0 scale-95 pointer-events-none'
          }
        `}
      >
        <div 
          className={`
            relative overflow-hidden backdrop-blur-3xl
            ${isOverallWin 
              ? 'bg-gradient-to-br from-emerald-500/12 via-slate-900/85 to-slate-950/90' 
              : 'bg-gradient-to-br from-rose-500/12 via-slate-900/85 to-slate-950/90'
            }
            rounded-full
            transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]
            
            ${showExpandedContent 
              ? isBatch 
                ? 'w-[320px] sm:w-[380px]'  // Wider for batch
                : 'w-[280px] sm:w-[340px]'
              : 'w-[100px]'
            }
            
            h-[44px]
            flex items-center
            px-4
          `}
          style={{
            boxShadow: isOverallWin
              ? '0 20px 40px -12px rgba(16, 185, 129, 0.22), 0 0 0 0.5px rgba(16, 185, 129, 0.18)'
              : '0 20px 40px -12px rgba(244, 63, 94, 0.22), 0 0 0 0.5px rgba(244, 63, 94, 0.18)',
          }}
        >
          {/* COMPACT STATE */}
          <div 
            className={`
              flex items-center justify-center gap-1.5 w-full
              transition-all duration-300
              ${showExpandedContent ? 'opacity-0 absolute' : 'opacity-100'}
            `}
          >
            <div className={`w-2 h-2 rounded-full ${isOverallWin ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          </div>

          {/* EXPANDED STATE */}
          <div 
            className={`
              flex items-center justify-between w-full gap-2
              transition-all duration-300
              ${showExpandedContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 absolute'}
            `}
          >
            {/* Left: Batch Count or Direction */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isBatch ? (
                <div className="flex items-center gap-1">
                  <span className={`text-xs font-bold ${isOverallWin ? 'text-emerald-300' : 'text-rose-300'}`}>
                    {wonCount + lostCount}x
                  </span>
                  <span className="text-[10px] text-gray-400">ORDERS</span>
                </div>
              ) : (
                <span className={`text-xs font-bold ${
                  settledOrders[0].direction === 'CALL' ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {settledOrders[0].direction === 'CALL' ? 'BUY' : 'SELL'}
                </span>
              )}
            </div>

            <div className="h-4 w-[1px] bg-white/10 flex-shrink-0" />

            {/* Center: Win/Loss Count or Status */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isBatch ? (
                <div className="flex items-center gap-1">
                  {wonCount > 0 && (
                    <span className="text-xs font-bold text-emerald-300">
                      {wonCount}W
                    </span>
                  )}
                  {wonCount > 0 && lostCount > 0 && (
                    <span className="text-[10px] text-gray-500">/</span>
                  )}
                  {lostCount > 0 && (
                    <span className="text-xs font-bold text-rose-300">
                      {lostCount}L
                    </span>
                  )}
                </div>
              ) : (
                <span className={`text-xs font-bold ${
                  settledOrders[0].status === 'WON' ? 'text-emerald-300' : 'text-rose-300'
                }`}>
                  {settledOrders[0].status}
                </span>
              )}
            </div>

            <div className="h-4 w-[1px] bg-white/10 flex-shrink-0" />

            {/* Right: Total Payout */}
            <div className="flex-1 text-right min-w-0">
              <span className={`text-sm font-bold tabular-nums ${
                isOverallWin ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {totalProfit > 0 ? '+' : ''}{formatCurrency(totalProfit)}
              </span>
            </div>
          </div>

          {/* Glow overlay */}
          <div 
            className="absolute inset-0 rounded-[inherit] pointer-events-none"
            style={{
              background: isOverallWin
                ? 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1), transparent 70%)'
                : 'radial-gradient(circle at 50% 50%, rgba(244, 63, 94, 0.1), transparent 70%)'
            }}
          />

          {/* Progress bar */}
          <div 
            className={`
              absolute bottom-0 left-0 right-0 h-[2px] bg-white/5
              transition-opacity duration-300
              ${showExpandedContent ? 'opacity-100' : 'opacity-0'}
            `}
          >
            <div 
              className={`h-full ${isOverallWin ? 'bg-emerald-500' : 'bg-rose-500'}`}
              style={{
                animation: (expanded && !isClosing) ? 'progress 3s linear forwards' : 'none',
                width: isClosing ? '0%' : '100%'
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