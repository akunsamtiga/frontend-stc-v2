// components/CandleCountdown.tsx
'use client'

import { memo } from 'react'
import { Timer } from 'lucide-react'

const TIMEFRAME_SECONDS: Record<string, number> = {
  '1s': 1,
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '30m': 1800,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400,
}

interface CandleCountdownProps {
  timeframe: string
  /** nowSeconds dari TradingChart — satu sumber waktu untuk semua. */
  nowSeconds: number
}

function formatCountdown(secs: number, timeframe: string): string {
  if (timeframe === '1s') return `00:${String(secs).padStart(2, '0')}`
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const CandleCountdown = memo(({ timeframe, nowSeconds }: CandleCountdownProps) => {
  const intervalSeconds = TIMEFRAME_SECONDS[timeframe] ?? 60
  const remaining = intervalSeconds - (nowSeconds % intervalSeconds)

  const isUrgent = remaining <= 5
  const isCritical = remaining <= 2

  return (
    <div
      className={`
        flex items-center gap-1.5
        px-2.5 py-1.5 rounded-lg
        backdrop-blur-sm border
        transition-colors duration-300
        ${isCritical
          ? 'bg-red-500/20 border-red-500/50 text-red-400'
          : isUrgent
            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400'
            : 'bg-black/30 border-white/10 text-gray-300'
        }
      `}
    >
      <Timer className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="text-xs font-bold tabular-nums">
        {formatCountdown(remaining, timeframe)}
      </span>
    </div>
  )
})

CandleCountdown.displayName = 'CandleCountdown'

export default CandleCountdown