// components/CandleCountdown.tsx
'use client'

import { memo } from 'react'
import { Timer } from 'lucide-react'

interface CandleCountdownProps {
  timeframe: string
  nowSeconds: number
  isLightMode?: boolean
}

/**
 * Countdown per-30-detik:
 * - 30 detik pertama tiap menit (detik 0–29) → hijau
 * - 30 detik kedua tiap menit (detik 30–59) → merah
 * Countdown selalu menghitung mundur 30 → 1 kemudian reset.
 */
const CandleCountdown = memo(({ timeframe, nowSeconds, isLightMode = false }: CandleCountdownProps) => {
  const countdown = 30 - (nowSeconds % 30)       // 30 → 1
  const isFirstHalf = (nowSeconds % 60) < 30     // true = fase hijau, false = fase merah

  const isCritical = countdown <= 3
  const isUrgent   = countdown <= 8

  // Warna berdasarkan fase (hijau / merah), bukan hanya urgensi
  let containerClass = ''
  let textColor = ''

  if (isLightMode) {
    if (isFirstHalf) {
      containerClass = isCritical
        ? 'bg-emerald-100 border-emerald-500/70'
        : 'bg-emerald-50 border-emerald-400/60'
      textColor  = isCritical ? '#059669' : '#10b981'
    } else {
      containerClass = isCritical
        ? 'bg-red-100 border-red-500/70'
        : 'bg-rose-50 border-rose-400/60'
      textColor  = isCritical ? '#dc2626' : '#ef4444'
    }
  } else {
    if (isFirstHalf) {
      containerClass = isCritical
        ? 'bg-emerald-500/25 border-emerald-400/70'
        : 'bg-emerald-500/15 border-emerald-500/40'
      textColor  = isCritical ? '#34d399' : '#6ee7b7'
    } else {
      containerClass = isCritical
        ? 'bg-red-500/25 border-red-400/70'
        : 'bg-red-500/15 border-red-500/40'
      textColor  = isCritical ? '#f87171' : '#fca5a5'
    }
  }

  return (
    <div
      className={`
        flex items-center gap-2
        px-3 py-1.5 rounded-lg
        backdrop-blur-sm border
        transition-colors duration-300
        ${containerClass}
      `}
    >
      <Timer className="w-3.5 h-3.5 flex-shrink-0" style={{ color: textColor }} />

      <span
        className="text-xs font-bold tabular-nums"
        style={{ color: textColor }}
      >
        {`00:${String(countdown).padStart(2, '0')}`}
      </span>
    </div>
  )
})

CandleCountdown.displayName = 'CandleCountdown'

export default CandleCountdown