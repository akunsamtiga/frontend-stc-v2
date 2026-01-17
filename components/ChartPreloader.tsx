// components/ChartPreloader.tsx - ✅ COMPLETE VERSION - Parallel Asset Loading
'use client'

import { useEffect, useState } from 'react'
import { prefetchMultipleTimeframes } from '@/lib/firebase'

interface PreloadStatus {
  loading: boolean
  progress: number
  currentAsset: string
  total: number
  loaded: number
  errors: number
  startTime: number
  duration: number
}

/**
 * ✅ ChartPreloader - Automatically preload default assets in PARALLEL
 * This runs once when app starts to ensure instant chart loading
 * 
 * Features:
 * - Parallel loading (not sequential!)
 * - Progress tracking
 * - Error handling
 * - Performance metrics
 */
export default function ChartPreloader() {
  const [status, setStatus] = useState<PreloadStatus>({
    loading: true,
    progress: 0,
    currentAsset: '',
    total: 0,
    loaded: 0,
    errors: 0,
    startTime: 0,
    duration: 0,
  })

  useEffect(() => {
    // ✅ Default assets to preload (prioritize popular ones)
    const defaultAssets = [
      { path: '/crypto/btc_usdt', name: 'Bitcoin', priority: 1 },
      { path: '/crypto/eth_usdt', name: 'Ethereum', priority: 2 },
      { path: '/crypto/bnb_usdt', name: 'BNB', priority: 3 },
    ]

    const total = defaultAssets.length

    async function preloadAllAssets() {
      const startTime = Date.now()
      
      console.log('')
      console.log('🚀 ================================================')
      console.log('🚀 CHART PRELOADER - PARALLEL MODE')
      console.log('🚀 ================================================')
      console.log(`   Assets to load: ${total}`)
      console.log(`   Strategy: Parallel (simultaneous)`)
      console.log(`   Timeframes: 1m, 5m (essential only)`)
      console.log('🚀 ================================================')
      console.log('')

      setStatus(prev => ({
        ...prev,
        total,
        startTime,
      }))

      // ✅ PARALLEL LOADING - Load all assets simultaneously
      const loadPromises = defaultAssets.map(async (asset, index) => {
        try {
          console.log(`⏳ [${index + 1}/${total}] Starting ${asset.name}...`)

          setStatus(prev => ({
            ...prev,
            currentAsset: asset.name,
            progress: Math.round(((index + 1) / total) * 50), // First 50% = initiate
          }))

          // Prefetch only essential timeframes (1m, 5m) for speed
          await prefetchMultipleTimeframes(asset.path, ['1m', '5m'])

          console.log(`✅ [${index + 1}/${total}] ${asset.name} loaded`)

          setStatus(prev => ({
            ...prev,
            loaded: prev.loaded + 1,
            progress: Math.round(((prev.loaded + 1) / total) * 100),
          }))

          return { 
            asset: asset.name, 
            success: true,
            index,
          }

        } catch (error) {
          console.warn(`⚠️ [${index + 1}/${total}] Failed to preload ${asset.name}:`, error)

          setStatus(prev => ({
            ...prev,
            errors: prev.errors + 1,
            loaded: prev.loaded + 1,
            progress: Math.round(((prev.loaded + 1) / total) * 100),
          }))

          return { 
            asset: asset.name, 
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            index,
          }
        }
      })

      // ✅ Wait for ALL to complete (parallel)
      const results = await Promise.allSettled(loadPromises)

      const duration = Date.now() - startTime
      const successful = results.filter(
        r => r.status === 'fulfilled' && r.value.success
      ).length
      const failed = total - successful

      console.log('')
      console.log('✅ ================================================')
      console.log('✅ CHART PRELOAD COMPLETE')
      console.log('✅ ================================================')
      console.log(`   Duration: ${duration}ms`)
      console.log(`   Success: ${successful}/${total}`)
      console.log(`   Failed: ${failed}/${total}`)
      console.log(`   Speed: ${Math.round(duration / total)}ms per asset`)
      console.log(`   Status: ${failed === 0 ? '🎉 PERFECT' : '⚠️ PARTIAL'}`)
      console.log('✅ ================================================')
      console.log('')

      setStatus(prev => ({
        ...prev,
        loading: false,
        progress: 100,
        duration,
      }))
    }

    // ✅ Delay 1 second to let critical UI load first
    const timer = setTimeout(preloadAllAssets, 1000)

    return () => clearTimeout(timer)
  }, [])

  // ✅ Don't render anything by default (invisible background loading)
  if (!status.loading) return null

  // ✅ Optional: Show loading indicator in development mode
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-black/90 backdrop-blur-sm rounded-lg px-4 py-3 text-white text-xs shadow-2xl border border-gray-700 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
          <div className="font-semibold">Chart Preloader</div>
        </div>
        
        <div className="space-y-1 text-[10px] text-gray-300">
          <div>Loading: {status.currentAsset || 'Initializing...'}</div>
          <div>Progress: {status.loaded}/{status.total} assets</div>
          {status.errors > 0 && (
            <div className="text-yellow-400">Errors: {status.errors}</div>
          )}
        </div>
        
        <div className="mt-2 bg-gray-700 rounded-full h-1.5 overflow-hidden">
          <div 
            className="bg-blue-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${status.progress}%` }}
          />
        </div>
      </div>
    )
  }

  return null
}

/**
 * ✅ Export function to manually trigger preload
 * Useful for refresh or when user navigates back
 */
export async function manualPreload(assetPaths: string[]): Promise<{
  success: number
  failed: number
  duration: number
}> {
  const startTime = Date.now()
  
  console.log(`🔄 Manual preload triggered for ${assetPaths.length} assets`)

  const results = await Promise.allSettled(
    assetPaths.map(path => 
      prefetchMultipleTimeframes(path, ['1m', '5m'])
        .then(() => ({ success: true }))
        .catch(() => ({ success: false }))
    )
  )

  const successful = results.filter(
    r => r.status === 'fulfilled' && r.value.success
  ).length

  const duration = Date.now() - startTime

  console.log(`✅ Manual preload complete: ${successful}/${assetPaths.length} in ${duration}ms`)

  return {
    success: successful,
    failed: assetPaths.length - successful,
    duration,
  }
}