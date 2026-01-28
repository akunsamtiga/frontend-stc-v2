// components/OrderPriceTracker.tsx - SIMPLIFIED: Thin solid line only
'use client'

import { useEffect, useState, useRef } from 'react'
import { BinaryOrder } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { Clock, ArrowUp, ArrowDown } from 'lucide-react'

interface OrderPriceTrackerProps {
  orders: BinaryOrder[]
  currentPrice: number
  chartContainerRef: React.RefObject<HTMLDivElement | null>
  priceToPixel: (price: number) => number | null
  timeToPixel?: (timestamp: number) => number | null
  showProfitAnimation?: boolean
  showPricePath?: boolean
  highlightWinning?: boolean
  compactMode?: boolean
}

interface TrackerPosition {
  order: BinaryOrder
  yPosition: number
  currentProfit: number
  timeLeft: number
  isWinning: boolean
}

export default function OrderPriceTracker({
  orders,
  currentPrice,
  chartContainerRef,
  priceToPixel,
  compactMode = false,
}: OrderPriceTrackerProps) {
  const [trackerPositions, setTrackerPositions] = useState<TrackerPosition[]>([])
  const [cardWidth, setCardWidth] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (cardRef.current) {
      const updateWidth = () => {
        setCardWidth(cardRef.current?.offsetWidth || 0)
      }
      updateWidth()
      
      const observer = new ResizeObserver(updateWidth)
      observer.observe(cardRef.current)
      
      return () => observer.disconnect()
    }
  }, [trackerPositions.length])

  useEffect(() => {
    const updatePositions = () => {
      if (!chartContainerRef.current) return

      const activeOrdersToShow = orders.filter(order => {
        if (order.status === 'PENDING' || order.status === 'ACTIVE') return true
        if (order.exit_time) {
          const exitTime = new Date(order.exit_time).getTime()
          const now = Date.now()
          return now < exitTime + 2000
        }
        return false
      })

      const positions: TrackerPosition[] = []

      activeOrdersToShow.forEach(order => {
        const yPos = priceToPixel(order.entry_price)
        if (yPos === null) return

        const isCall = order.direction === 'CALL'
        const priceDiff = currentPrice - order.entry_price
        const isWinning = isCall ? priceDiff > 0 : priceDiff < 0
        
        const currentProfit = isWinning 
          ? (order.amount * order.profitRate) / 100 
          : -order.amount

        const now = Date.now()
        const exitTime = order.exit_time ? new Date(order.exit_time).getTime() : now
        const timeLeft = Math.max(0, Math.floor((exitTime - now) / 1000))

        positions.push({
          order,
          yPosition: yPos,
          currentProfit,
          timeLeft,
          isWinning,
        })
      })

      setTrackerPositions(positions)
      animationFrameRef.current = requestAnimationFrame(updatePositions)
    }

    updatePositions()

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [orders, currentPrice, priceToPixel, chartContainerRef])

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (trackerPositions.length === 0) return null

  // ✅ Calculate card offsets to avoid overlap at same Y position
  const positionsWithOffset = trackerPositions.map((position, index) => {
    // Count how many orders above have similar Y position
    let offset = 0
    for (let i = 0; i < index; i++) {
      const prevPos = trackerPositions[i]
      if (Math.abs(prevPos.yPosition - position.yPosition) < 5) {
        offset += 30 // Stack 30px below for each similar position
      }
    }
    
    return {
      ...position,
      cardOffset: offset
    }
  })

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {positionsWithOffset.map((position, index) => {
        const { order, yPosition, currentProfit, timeLeft, isWinning, cardOffset } = position
        const isCall = order.direction === 'CALL'
        const isUrgent = timeLeft <= 5 && timeLeft > 0
        const isCritical = timeLeft <= 2 && timeLeft > 0

        return (
          <div
            key={order.id}
            className="absolute right-0 left-0"
            style={{
              top: `${yPosition}px`,
              transform: 'translateY(-50%)',
              transition: 'top 0.15s ease-out',
            }}
          >
            {/* ✅ Each order has its own line (can duplicate/overlap) */}
            <div
              className={`absolute left-0 right-0 h-[1px] ${
                isCall ? 'bg-green-500/40' : 'bg-red-500/40'
              }`}
              style={{
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />

            {/* ✅ Card with offset to avoid overlap */}
            <div 
              className="absolute z-10"
              style={{
                right: '8px',
                top: `${cardOffset}px`, // Offset if multiple cards at same Y
                transform: 'translateY(-50%)',
              }}
            >
              <div
                ref={index === 0 ? cardRef : null}
                className={`
                  flex items-center gap-1.5 sm:gap-2
                  rounded-l-lg pointer-events-auto
                  border backdrop-blur-md shadow-lg transition-all
                  ${compactMode ? 'px-2 py-1' : 'px-2 sm:px-2.5 py-1 sm:py-1.5'}
                  ${isCall 
                    ? isWinning 
                      ? 'bg-green-500/20 border-green-500' 
                      : 'bg-green-500/10 border-green-500/50'
                    : isWinning
                      ? 'bg-red-500/20 border-red-500'
                      : 'bg-red-500/10 border-red-500/50'
                  }
                `}
              >
                {/* ✅ Arrow Icon + Direction */}
                <div className="flex items-center gap-1">
                  {isCall ? (
                    <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400 flex-shrink-0" strokeWidth={3} />
                  ) : (
                    <ArrowDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-400 flex-shrink-0" strokeWidth={3} />
                  )}
                  <span className={`
                    text-[9px] sm:text-[10px] font-bold whitespace-nowrap
                    ${isCall ? 'text-green-400' : 'text-red-400'}
                  `}>
                    {order.direction === 'CALL' ? 'BUY' : 'SELL'}
                  </span>
                </div>

                {/* Separator */}
                <span className="text-gray-600 text-[10px]">|</span>

                {/* Amount */}
                <span className="text-[9px] sm:text-[10px] text-white font-semibold whitespace-nowrap">
                  {formatCurrency(order.amount)}
                </span>

                {/* Separator */}
                <span className="text-gray-600 text-[10px]">|</span>

                {/* Countdown */}
                <div className={`
                  flex items-center gap-0.5 sm:gap-1 
                  text-[9px] sm:text-[10px] font-mono font-bold whitespace-nowrap
                  ${isCritical 
                    ? 'text-red-400' 
                    : isUrgent 
                      ? 'text-yellow-400' 
                      : 'text-blue-400'
                  }
                `}>
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                  <span>{formatTime(timeLeft)}</span>
                </div>

                {/* Separator */}
                <span className="text-gray-600 text-[10px]">|</span>

                {/* Payout */}
                <span className={`
                  text-[9px] sm:text-[10px] font-bold whitespace-nowrap
                  ${isWinning ? 'text-green-400' : 'text-red-400'}
                `}>
                  {currentProfit > 0 ? '+' : ''}{formatCurrency(currentProfit)}
                </span>

                {/* ✅ Winning Pulse Indicator */}
                {isWinning && (
                  <div className="absolute -right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                    <div className="relative w-2 h-2 sm:w-2.5 sm:h-2.5">
                      <div className={`
                        absolute inset-0 rounded-full animate-ping
                        ${isCall ? 'bg-green-500' : 'bg-red-500'}
                      `} />
                      <div className={`
                        absolute inset-0 rounded-full
                        ${isCall ? 'bg-green-500' : 'bg-red-500'}
                      `} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}