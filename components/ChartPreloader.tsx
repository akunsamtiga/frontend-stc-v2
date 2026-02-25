// components/ChartPreloader.tsx
'use client'

import { useEffect, useRef } from 'react'
import { prefetchMultipleTimeframes } from '@/lib/firebase'
import { useSelectedAsset } from '@/store/trading'
import { Timeframe } from '@/types'

const ALL_TIMEFRAMES: Timeframe[] = ['1s', '1m', '5m', '15m', '30m', '1h', '4h', '1d']

export default function ChartPreloader() {
  const selectedAsset = useSelectedAsset()


  const prefetchedRef = useRef<Set<string>>(new Set())
  const abortRef = useRef<boolean>(false)

  useEffect(() => {
    abortRef.current = false

    if (!selectedAsset?.realtimeDbPath) return

    const assetPath = selectedAsset.realtimeDbPath


    if (prefetchedRef.current.has(assetPath)) return

    const prefetch = async () => {
      try {
        console.log(`🔥 Prefetching ${selectedAsset.symbol} — semua timeframe...`)

        await prefetchMultipleTimeframes(assetPath, ALL_TIMEFRAMES)

        if (abortRef.current) return

        prefetchedRef.current.add(assetPath)
        console.log(`✅ Prefetch done: ${selectedAsset.symbol} (${ALL_TIMEFRAMES.length} timeframes)`)

      } catch (err: any) {
        if (!abortRef.current) {
          console.warn(`⚠️ Prefetch failed for ${selectedAsset.symbol}:`, err.message)
        }
      }
    }

    prefetch()

    return () => {
      abortRef.current = true
    }
  }, [selectedAsset?.realtimeDbPath, selectedAsset?.symbol])

  return null
}