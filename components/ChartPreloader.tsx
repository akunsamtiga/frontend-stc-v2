// components/ChartPreloader.tsx - ✅ Preload default assets on app start
'use client'

import { useEffect } from 'react'
import { prefetchDefaultAsset } from '@/lib/firebase'

/**
 * ✅ ChartPreloader - Automatically preload default asset data
 * This runs once when the app starts to ensure instant chart loading
 */
export default function ChartPreloader() {
  useEffect(() => {
    // List of default assets to preload
    const defaultAssets = [
      '/crypto/btc_usdt',   // Bitcoin - most popular
      '/crypto/eth_usdt',   // Ethereum - second most popular
    ]

    console.log('🚀 Starting chart preloader...')
    
    // Preload all default assets in parallel
    Promise.all(
      defaultAssets.map(async (assetPath) => {
        try {
          console.log(`⏳ Preloading ${assetPath}...`)
          await prefetchDefaultAsset(assetPath)
          console.log(`✅ Preloaded ${assetPath}`)
        } catch (error) {
          console.warn(`⚠️ Failed to preload ${assetPath}:`, error)
        }
      })
    ).then(() => {
      console.log('✅ Chart preloader completed!')
    }).catch((error) => {
      console.error('❌ Chart preloader error:', error)
    })

    // Cleanup function (optional)
    return () => {
      console.log('🧹 Chart preloader unmounted')
    }
  }, []) // Run only once on mount

  // This component renders nothing
  return null
}