'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { prefetchMultipleTimeframes } from '@/lib/firebase'
import { Asset, Timeframe } from '@/types'

interface PreloadStatus {
  loading: boolean
  progress: number
  total: number
  loaded: number
}

const ALL_TIMEFRAMES: Timeframe[] = ['1s', '1m', '5m', '15m', '30m', '1h', '4h', '1d']

export default function ChartPreloader() {
  const token = useAuthStore(state => state.token)
  const [status, setStatus] = useState<PreloadStatus>({
    loading: true,
    progress: 0,
    total: 0,
    loaded: 0,
  })

  useEffect(() => {
    if (!token) {
      console.log('ChartPreloader: No token, skipping preload')
      setStatus(prev => ({ ...prev, loading: false, progress: 100 }))
      return
    }

    const preloadAllAssets = async () => {
      setStatus({ loading: true, progress: 0, total: 0, loaded: 0 })

      try {
        const response = await fetch('/api/v1/assets?activeOnly=true', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'omit'
        })
        
        if (!response.ok) {
          if (response.status === 401) {
            console.log('Preload skipped: Unauthorized')
          } else {
            console.error('Preload failed:', response.status, response.statusText)
          }
          setStatus(prev => ({ ...prev, loading: false, progress: 100 }))
          return
        }
        
        const result = await response.json()
        const assets: Asset[] = result?.data?.assets || []
        
        if (!assets.length) {
          console.log('Preload skipped: No assets')
          setStatus(prev => ({ ...prev, loading: false, progress: 100 }))
          return
        }

        const totalTasks = assets.length
        setStatus(prev => ({ ...prev, total: totalTasks }))

        const preloadPromises = assets.map(asset => {
          if (!asset.realtimeDbPath) return null
          
          return prefetchMultipleTimeframes(asset.realtimeDbPath, ALL_TIMEFRAMES)
            .then(() => {
              setStatus(prev => ({
                ...prev,
                loaded: prev.loaded + 1,
                progress: Math.round(((prev.loaded + 1) / totalTasks) * 100)
              }))
            })
            .catch(err => {
              console.warn(`Prefetch failed for ${asset.symbol}:`, err.message)
              setStatus(prev => ({
                ...prev,
                loaded: prev.loaded + 1,
                progress: Math.round(((prev.loaded + 1) / totalTasks) * 100)
              }))
              return null
            })
        }).filter(Boolean)

        await Promise.allSettled(preloadPromises)
        
      } catch (error) {
        console.error('Preload error:', error)
      } finally {
        setStatus(prev => ({ ...prev, loading: false, progress: 100 }))
      }
    }

    const timer = setTimeout(preloadAllAssets, 1000)
    return () => clearTimeout(timer)
  }, [token])

  if (!status.loading) return null

  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-black/90 backdrop-blur-sm rounded-lg px-4 py-3 text-white text-xs shadow-2xl border border-gray-700 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
          <div className="font-semibold">Loading Charts</div>
        </div>
        <div className="space-y-1 text-[10px] text-gray-300">
          <div>Assets: {status.loaded}/{status.total}</div>
          <div>Progress: {status.progress}%</div>
          <div className="text-gray-400">Timeframes: All (1s-1d)</div>
        </div>
        <div className="mt-2 bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>
    )
  }

  return null
}

export async function manualPreload(assetPaths: string[]) {
  const start = Date.now()
  const results = await Promise.allSettled(
    assetPaths.map(path => 
      prefetchMultipleTimeframes(path, ALL_TIMEFRAMES)
        .then(() => ({ success: true }))
        .catch(() => ({ success: false }))
    )
  )
  const success = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  console.log(`Manual preload: ${success}/${assetPaths.length} in ${Date.now() - start}ms`)
  return { success, failed: assetPaths.length - success, duration: Date.now() - start }
}