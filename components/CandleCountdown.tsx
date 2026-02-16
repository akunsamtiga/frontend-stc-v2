// components/CandleCountdown.tsx - ⚡ SYNCHRONIZED VERSION
'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { Timeframe } from '@/types'
import { getBarPeriodTimestamp, getTimeframeSeconds } from '@/lib/calculation'

interface CandleCountdownProps {
  timeframe: Timeframe
}

const formatCountdown = (seconds: number, timeframe: Timeframe): string => {
  // For sub-minute timeframes, show seconds only
  if (timeframe === '1s') {
    return `00:${seconds.toString().padStart(2, '0')}`
  }
  
  // For minute+ timeframes, show MM:SS format
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const CandleCountdown = ({ timeframe }: CandleCountdownProps) => {
  const [timeRemaining, setTimeRemaining] = useState<number>(0)

  useEffect(() => {
    const calculateTimeRemaining = () => {
      // ⚡ SYNCHRONIZED: Use same method as order calculation
      const now = Math.floor(Date.now() / 1000) // Current timestamp in seconds
      const intervalSeconds = getTimeframeSeconds(timeframe)
      
      // Get current bar period start (same as backend)
      const barPeriodStart = getBarPeriodTimestamp(now, timeframe)
      
      // Calculate next bar period
      const nextBarPeriod = barPeriodStart + intervalSeconds
      
      // Calculate seconds remaining until next candle
      const remaining = nextBarPeriod - now
      
      setTimeRemaining(remaining)
    }

    // Initial calculation
    calculateTimeRemaining()

    // ⚡ PERFORMANCE: Update every second, synchronized to the second boundary
    const now = Date.now()
    const msUntilNextSecond = 1000 - (now % 1000)
    
    // Start exactly on the next second boundary
    const initialTimeout = setTimeout(() => {
      calculateTimeRemaining()
      
      // Then update every second
      const interval = setInterval(calculateTimeRemaining, 1000)
      
      return () => clearInterval(interval)
    }, msUntilNextSecond)

    return () => clearTimeout(initialTimeout)
  }, [timeframe])

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg shadow-lg">
        <div className="flex items-baseline gap-1.5">
          <span className="text-sm font-light text-white tabular-nums">
            {formatCountdown(timeRemaining, timeframe)}
          </span>
        </div>
      </div>
    </div>
  )
}

export default CandleCountdown