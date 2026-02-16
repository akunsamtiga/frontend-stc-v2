// components/CandleCountdown.tsx
'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { Timeframe } from '@/types'

interface CandleCountdownProps {
  timeframe: Timeframe
}

const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  '1s': 1,
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
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
      const now = Math.floor(Date.now() / 1000) // Current time in seconds
      const intervalSeconds = TIMEFRAME_SECONDS[timeframe]
      
      // Calculate seconds since the start of the current candle
      const secondsSinceIntervalStart = now % intervalSeconds
      
      // Calculate seconds remaining until next candle
      const remaining = intervalSeconds - secondsSinceIntervalStart
      
      setTimeRemaining(remaining)
    }

    // Initial calculation
    calculateTimeRemaining()

    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000)

    return () => clearInterval(interval)
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