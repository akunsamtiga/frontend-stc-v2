// lib/firebase.ts - OPTIMIZED VERSION with Progressive Loading Support

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getDatabase, Database, ref, onValue, off, query, limitToLast, get } from 'firebase/database'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

let app: FirebaseApp
let database: Database

if (typeof window !== 'undefined') {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
      database = getDatabase(app)
    } else {
      app = getApps()[0]
      database = getDatabase(app)
    }
    console.log('✅ Firebase initialized')
  } catch (error) {
    console.error('❌ Firebase init error:', error)
  }
}

export { database, ref, onValue, off, query, limitToLast, get }

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

const pendingRequests = new Map<string, PendingRequest>()
const REQUEST_TIMEOUT = 10000

function deduplicateRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  for (const [k, req] of pendingRequests.entries()) {
    if (now - req.timestamp > REQUEST_TIMEOUT) {
      pendingRequests.delete(k)
    }
  }

  const pending = pendingRequests.get(key)
  
  if (pending) {
    const age = now - pending.timestamp
    console.log(`🔄 Deduplicated request (age: ${age}ms):`, key.slice(0, 50))
    return pending.promise as Promise<T>
  }
  
  const promise = fn().finally(() => {
    pendingRequests.delete(key)
  })
  
  pendingRequests.set(key, {
    promise,
    timestamp: now,
  })
  
  return promise
}

interface CacheEntry {
  data: any
  timestamp: number
}

class FastMemoryCache {
  private cache = new Map<string, CacheEntry>()
  private readonly CACHE_TTL = 300000
  private readonly STALE_TTL = 600000
  private readonly MAX_SIZE = 100

  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    const age = Date.now() - entry.timestamp
    
    if (age <= this.CACHE_TTL) {
      console.log(`⚡ Memory cache HIT (age: ${age}ms):`, key.slice(0, 50))
      return entry.data
    }
    
    if (age <= this.STALE_TTL) {
      console.log(`⚠️ Stale cache (age: ${age}ms):`, key.slice(0, 50))
      return entry.data
    }
    
    this.cache.delete(key)
    return null
  }

  getStale(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    const age = Date.now() - entry.timestamp
    if (age > this.STALE_TTL) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  set(key: string, data: any): void {
    if (this.cache.size >= this.MAX_SIZE) {
      this.cleanup()
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    console.log('🗑️ Memory cache cleared')
  }

  private cleanup(): void {
    const now = Date.now()
    let deletedCount = 0
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp
      
      if (age > this.STALE_TTL) {
        this.cache.delete(key)
        deletedCount++
      }
    }
    
    if (this.cache.size >= this.MAX_SIZE) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toDelete = entries.slice(0, Math.floor(this.MAX_SIZE / 4))
      toDelete.forEach(([key]) => this.cache.delete(key))
      deletedCount += toDelete.length
    }
    
    if (deletedCount > 0) {
      console.log(`🗑️ Cleaned ${deletedCount} cache entries`)
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
      ttl: this.CACHE_TTL,
    }
  }
}

const memoryCache = new FastMemoryCache()

function cleanAssetPath(path: string): string {
  if (!path) return ''
  
  if (path.endsWith('/current_price')) {
    path = path.replace('/current_price', '')
  }
  
  path = path.replace(/\/$/, '')
  
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  
  return path
}

function processHistoricalData(rawData: any, limit: number): any[] {
  if (!rawData || typeof rawData !== 'object') {
    return []
  }

  const isArray = Array.isArray(rawData)
  let bars: any[] = []
  
  if (isArray) {
    bars = rawData.filter(item => 
      item && 
      typeof item === 'object' && 
      item.timestamp && 
      typeof item.close === 'number' &&
      item.close > 0
    ).map(item => ({
      timestamp: item.timestamp,
      datetime: item.datetime || new Date(item.timestamp * 1000).toISOString(),
      open: item.open || item.close,
      high: item.high || item.close,
      low: item.low || item.close,
      close: item.close,
      volume: item.volume || 0,
    }))
  } else {
    bars = Object.entries(rawData)
      .filter(([_, item]: [string, any]) => 
        item && 
        typeof item === 'object' && 
        typeof item.close === 'number' &&
        item.close > 0
      )
      .map(([key, item]: [string, any]) => ({
        timestamp: parseInt(key) || item.timestamp,
        datetime: item.datetime || new Date((parseInt(key) || item.timestamp) * 1000).toISOString(),
        open: item.open || item.close,
        high: item.high || item.close,
        low: item.low || item.close,
        close: item.close,
        volume: item.volume || 0,
      }))
  }

  if (bars.length === 0) {
    return []
  }

  bars.sort((a, b) => a.timestamp - b.timestamp)
  
  return bars.slice(-limit)
}

import type { Timeframe } from '@/types'

// ✅ MODIFIED: Added customLimit parameter for progressive loading
export async function fetchHistoricalData(
  assetPath: string,
  timeframe: Timeframe = '1m',
  customLimit?: number  // ✅ NEW: Optional parameter for dynamic limit
): Promise<any[]> {
  if (typeof window === 'undefined' || !database) {
    return []
  }

  try {
    const cleanPath = cleanAssetPath(assetPath)
    const cacheKey = `${cleanPath}-${timeframe}-${customLimit || 'default'}`

    const cached = memoryCache.get(cacheKey)
    if (cached) {
      return cached
    }

    return await deduplicateRequest(cacheKey, async () => {
      console.log(`📡 Fetching ${timeframe} from Firebase...`)
      const startTime = Date.now()
      
      const ohlcPath = `${cleanPath}/ohlc_${timeframe}`
      const snapshot = await get(ref(database, ohlcPath))
      
      if (!snapshot.exists()) {
        console.warn(`⚠️ No data at: ${ohlcPath}`)
        return []
      }
      
      const rawData = snapshot.val()
      
      // ✅ MODIFIED: Use customLimit if provided, otherwise use defaults
      const baseLimit = timeframe === '1m' ? 100 : 
                       timeframe === '1s' ? 60 : 
                       60
      const limit = customLimit || baseLimit  // ✅ Use custom limit for progressive loading
      
      const processed = processHistoricalData(rawData, limit)
      
      if (processed.length > 0) {
        memoryCache.set(cacheKey, processed)
      }
      
      const duration = Date.now() - startTime
      console.log(`✅ Fetched ${processed.length} ${timeframe} bars in ${duration}ms`)
      
      return processed
    })

  } catch (error: any) {
    console.error(`❌ Fetch error for ${timeframe}:`, error.message)
    return []
  }
}

export async function fetchHistoricalDataWithStale(
  assetPath: string,
  timeframe: Timeframe = '1m'
): Promise<{ data: any[], isStale: boolean }> {
  if (typeof window === 'undefined' || !database) {
    return { data: [], isStale: false }
  }

  try {
    const cleanPath = cleanAssetPath(assetPath)
    const cacheKey = `${cleanPath}-${timeframe}`

    const cached = memoryCache.get(cacheKey)
    if (cached) {
      return { data: cached, isStale: false }
    }

    const stale = memoryCache.getStale(cacheKey)
    if (stale) {
      setTimeout(() => {
        fetchHistoricalData(assetPath, timeframe)
      }, 0)
      
      return { data: stale, isStale: true }
    }

    const data = await fetchHistoricalData(assetPath, timeframe)
    return { data, isStale: false }

  } catch (error: any) {
    console.error(`❌ Fetch error for ${timeframe}:`, error.message)
    return { data: [], isStale: false }
  }
}

export async function prefetchMultipleTimeframes(
  assetPath: string,
  timeframes: Timeframe[] = ['1m', '5m']
): Promise<Map<Timeframe, any[]>> {
  const results = new Map<Timeframe, any[]>()
  
  console.log(`🔄 Prefetching ${timeframes.length} timeframes in parallel...`)
  const startTime = Date.now()
  
  const promises = timeframes.map(tf => 
    fetchHistoricalData(assetPath, tf)
      .then(data => ({ tf, data, success: true }))
      .catch(error => ({ tf, data: [], success: false, error }))
  )
  
  const settled = await Promise.allSettled(promises)
  
  settled.forEach(result => {
    if (result.status === 'fulfilled') {
      const { tf, data } = result.value
      results.set(tf, data)
      
      if (data.length === 0) {
        console.warn(`⚠️ No data for ${tf}`)
      }
    } else {
      console.error(`❌ Prefetch failed:`, result.reason)
    }
  })
  
  const duration = Date.now() - startTime
  const successful = Array.from(results.values()).filter(d => d.length > 0).length
  
  console.log(`✅ Prefetched ${successful}/${timeframes.length} timeframes in ${duration}ms`)
  
  return results
}

export function subscribeToOHLCUpdates(
  assetPath: string,
  timeframe: Timeframe,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined' || !database) {
    return () => {}
  }

  const cleanPath = cleanAssetPath(assetPath)
  const ohlcPath = `${cleanPath}/ohlc_${timeframe}`
  const ohlcRef = ref(database, ohlcPath)
  
  let lastTimestamp: number | null = null
  let lastData: any = null
  
  const unsubscribe = onValue(ohlcRef, (snapshot) => {
    const data = snapshot.val()
    if (!data) return

    const isArray = Array.isArray(data)
    const latestBar = isArray 
      ? data[data.length - 1]
      : data[Object.keys(data).sort().pop()!]
    
    if (!latestBar || !latestBar.close) return

    const timestamp = latestBar.timestamp || 
                     (isArray ? data.length - 1 : parseInt(Object.keys(data).pop()!))
    
    const isNewBar = timestamp !== lastTimestamp
    
    const hasChanged = !lastData || 
                      lastData.open !== latestBar.open ||
                      lastData.high !== latestBar.high ||
                      lastData.low !== latestBar.low ||
                      lastData.close !== latestBar.close
    
    if (isNewBar || hasChanged) {
      lastTimestamp = timestamp
      lastData = latestBar
      
      callback({
        timestamp,
        datetime: latestBar.datetime || new Date(timestamp * 1000).toISOString(),
        open: latestBar.open || latestBar.close,
        high: latestBar.high || latestBar.close,
        low: latestBar.low || latestBar.close,
        close: latestBar.close,
        volume: latestBar.volume || 0,
        isNewBar,
        isCompleted: latestBar.isCompleted || false,
      })
      
      if (isNewBar) {
        const cacheKey = `${cleanPath}-${timeframe}`
        memoryCache.delete(cacheKey)
      }
    }
  }, (error) => {
    console.error(`❌ OHLC subscription error (${timeframe}):`, error)
  })

  return () => {
    off(ohlcRef)
  }
}

export function subscribeToPriceUpdates(
  assetPath: string,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined' || !database) {
    return () => {}
  }

  const cleanPath = cleanAssetPath(assetPath)
  const pricePath = `${cleanPath}/current_price`
  const priceRef = ref(database, pricePath)
  
  let lastPrice: number | null = null
  let lastTimestamp: number | null = null
  
  const unsubscribe = onValue(priceRef, (snapshot) => {
    const data = snapshot.val()
    if (!data || !data.price) return
    
    const isDuplicate = lastPrice !== null && 
                       lastTimestamp === data.timestamp &&
                       Math.abs(data.price - lastPrice) < 0.000001
    
    if (isDuplicate) return
    
    lastPrice = data.price
    lastTimestamp = data.timestamp
    
    callback(data)
    
  }, (error) => {
    console.error('❌ Price subscription error:', error)
  })

  return () => {
    off(priceRef)
  }
}

export async function prefetchDefaultAsset(assetPath: string): Promise<void> {
  const cleanPath = cleanAssetPath(assetPath)
  await prefetchMultipleTimeframes(cleanPath, ['1m', '5m'])
}

export async function clearDataCache(): Promise<void> {
  memoryCache.clear()
  pendingRequests.clear()
  console.log('🗑️ All caches cleared')
}

export function getCacheStats() {
  return {
    memory: memoryCache.getStats(),
    pending: pendingRequests.size,
  }
}

if (typeof window !== 'undefined') {
  (window as any).firebaseDebug = {
    getCacheStats,
    clearDataCache,
    memoryCache,
    pendingRequests,
  }
}

if (typeof window !== 'undefined') {
  setInterval(() => {
    const stats = memoryCache.getStats()
    
    if (stats.size > stats.maxSize * 0.8) {
      console.log('🧹 Auto-cleanup triggered')
      memoryCache.clear()
    }
  }, 60000)
}