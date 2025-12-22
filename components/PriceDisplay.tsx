'use client'

import { useEffect, useState } from 'react'
import { useTradingStore } from '@/store/trading'
import { formatNumber, getPriceChangeClass } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

export default function PriceDisplay() {
  const { selectedAsset, currentPrice } = useTradingStore()
  const [priceChange, setPriceChange] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (currentPrice && currentPrice.change !== undefined) {
      setPriceChange(currentPrice.change)
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 500)
      return () => clearTimeout(timer)
    }
  }, [currentPrice])

  if (!selectedAsset || !currentPrice) {
    return (
      <div className="card">
        <div className="text-center text-gray-400">
          Select an asset to view price
        </div>
      </div>
    )
  }

  return (
    <div className={cn('card', isAnimating ? (priceChange > 0 ? 'price-up' : 'price-down') : '')}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-400 mb-1">{selectedAsset.name}</div>
          <div className="text-4xl font-bold font-mono">
            {formatNumber(currentPrice.price)}
          </div>
        </div>
        <div className="text-right">
          <div className={cn('flex items-center gap-2 text-2xl font-bold', getPriceChangeClass(priceChange))}>
            {priceChange > 0 ? (
              <TrendingUp className="w-6 h-6" />
            ) : priceChange < 0 ? (
              <TrendingDown className="w-6 h-6" />
            ) : null}
            {priceChange !== 0 && (
              <span>
                {priceChange > 0 ? '+' : ''}
                {priceChange.toFixed(3)}%
              </span>
            )}
          </div>
          <div className="text-sm text-gray-400 mt-1">
            {new Date(currentPrice.datetime).toLocaleTimeString()}
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}