// components/ChartPreloader.tsx
'use client'

import { useEffect, useState } from 'react'
import { prefetchMultipleTimeframes } from '@/lib/firebase'
import { Asset } from '@/types'

interface PreloadStatus {
  loading: boolean
  progress: number
  total: number
  loaded: number
}

export default function ChartPreloader() {
  const [status, setStatus] = useState<PreloadStatus>({
    loading: true,
    progress: 0,
    total: 0,
    loaded: 0,
  })

  useEffect(() => {
    const preloadAllAssets = async () => {
      try {
        const response = await fetch('/api/v1/assets?activeOnly=true')
        const { data } = await response.json()
        const assets: Asset[] = data.assets

        setStatus(prev => ({ ...prev, total: assets.length }))

        const preloadPromises = assets.map(asset => {
          if (!asset.realtimeDbPath) return null
          return prefetchMultipleTimeframes(asset.realtimeDbPath, ['1m', '5m'])
            .then(() => {
              setStatus(prev => ({
                ...prev,
                loaded: prev.loaded + 1,
                progress: Math.round(((prev.loaded + 1) / assets.length) * 100)
              }))
            })
            .catch(() => null)
        })

        await Promise.allSettled(preloadPromises)
      } catch (error) {
        console.error('Preload failed:', error)
      } finally {
        setStatus(prev => ({ ...prev, loading: false, progress: 100 }))
      }
    }

    const timer = setTimeout(preloadAllAssets, 1000)
    return () => clearTimeout(timer)
  }, [])

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
      prefetchMultipleTimeframes(path, ['1m', '5m'])
        .then(() => ({ success: true }))
        .catch(() => ({ success: false }))
    )
  )
  const success = results.filter(r => r.status === 'fulfilled' && r.value.success).length
  console.log(`Manual preload: ${success}/${assetPaths.length} in ${Date.now() - start}ms`)
  return { success, failed: assetPaths.length - success, duration: Date.now() - start }
}