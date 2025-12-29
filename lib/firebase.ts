// lib/firebase.ts - FIXED VERSION with Proper Path Handling
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
  } catch (error) {
    console.error('Firebase initialization error:', error)
  }
}

export { database, ref, onValue, off, query, limitToLast, get }

// ===================================
// PATH UTILITY - CRITICAL FIX
// ===================================

/**
 * ✅ Clean asset path - removes /current_price if exists
 * Backend stores: /idx_stc (without /current_price)
 * Simulator stores: /idx_stc/current_price and /idx_stc/ohlc_1m
 */
function cleanAssetPath(path: string): string {
  if (!path) return ''
  
  // Remove /current_price suffix if exists
  if (path.endsWith('/current_price')) {
    path = path.replace('/current_price', '')
  }
  
  // Remove trailing slash
  path = path.replace(/\/$/, '')
  
  // Ensure starts with /
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  
  return path
}

/**
 * ✅ Get price path - always append /current_price
 */
function getPricePath(assetPath: string): string {
  const clean = cleanAssetPath(assetPath)
  return `${clean}/current_price`
}

/**
 * ✅ Get OHLC path - append /ohlc_timeframe
 */
function getOHLCPath(assetPath: string, timeframe: string): string {
  const clean = cleanAssetPath(assetPath)
  return `${clean}/ohlc_${timeframe}`
}

// ===================================
// TYPES & CONFIG
// ===================================

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

const TIMEFRAME_CONFIG: Record<Timeframe, { path: string; barsToFetch: number; cacheTTL: number }> = {
  '1m': { path: 'ohlc_1m', barsToFetch: 100, cacheTTL: 5000 },
  '5m': { path: 'ohlc_5m', barsToFetch: 100, cacheTTL: 15000 },
  '15m': { path: 'ohlc_15m', barsToFetch: 150, cacheTTL: 30000 },
  '1h': { path: 'ohlc_1h', barsToFetch: 150, cacheTTL: 60000 },
  '4h': { path: 'ohlc_4h', barsToFetch: 100, cacheTTL: 120000 },
  '1d': { path: 'ohlc_1d', barsToFetch: 60, cacheTTL: 300000 }
}

// ===================================
// INDEXEDDB CACHE
// ===================================

class IndexedDBCache {
  private dbName = 'trading_chart_cache'
  private storeName = 'ohlc_data'
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.db) return
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('expiry', 'expiry', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  async get(key: string): Promise<any | null> {
    await this.init()
    if (!this.db) return null

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result
        if (result && result.expiry > Date.now()) {
          resolve(result.data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => resolve(null)
    })
  }

  async set(key: string, data: any, ttl: number): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const expiry = Date.now() + ttl
      
      store.put({ key, data, timestamp: Date.now(), expiry })
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => resolve()
    })
  }

  async clear(): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      store.clear()
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => resolve()
    })
  }

  async cleanup(): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const index = store.index('expiry')
      const range = IDBKeyRange.upperBound(Date.now())
      const request = index.openCursor(range)

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => resolve()
    })
  }
}

const idbCache = new IndexedDBCache()

// Auto cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    idbCache.cleanup().catch(console.error)
  }, 300000)
}

// ===================================
// MEMORY CACHE
// ===================================

interface CacheEntry {
  data: any[]
  timestamp: number
  ttl: number
}

const memoryCache = new Map<string, CacheEntry>()

// ===================================
// FETCH HISTORICAL DATA - FIXED
// ===================================

export async function fetchHistoricalData(
  assetPath: string,
  timeframe: Timeframe = '1m'
): Promise<any[]> {
  if (typeof window === 'undefined' || !database) {
    return []
  }

  try {
    const config = TIMEFRAME_CONFIG[timeframe]
    if (!config) {
      console.error(`❌ Invalid timeframe: ${timeframe}`)
      return []
    }

    // ✅ CRITICAL: Clean path first
    const basePath = cleanAssetPath(assetPath)
    const cacheKey = `${basePath}-${timeframe}`

    console.log(`📊 Fetching historical data:`)
    console.log(`   Asset path (input): ${assetPath}`)
    console.log(`   Asset path (clean): ${basePath}`)
    console.log(`   Timeframe: ${timeframe}`)

    // 1️⃣ Memory cache
    const memCached = memoryCache.get(cacheKey)
    if (memCached && (Date.now() - memCached.timestamp) < memCached.ttl) {
      console.log(`⚡ Memory cache hit: ${timeframe} (${memCached.data.length} bars)`)
      return memCached.data
    }

    // 2️⃣ IndexedDB cache
    const idbCached = await idbCache.get(cacheKey)
    if (idbCached) {
      console.log(`💾 IndexedDB cache hit: ${timeframe} (${idbCached.length} bars)`)
      
      memoryCache.set(cacheKey, {
        data: idbCached,
        timestamp: Date.now(),
        ttl: config.cacheTTL
      })
      
      return idbCached
    }

    // 3️⃣ Fetch from Firebase
    console.log(`🔥 Fetching from Firebase: ${timeframe}`)
    
    // ✅ Use helper function to get OHLC path
    const ohlcPath = getOHLCPath(basePath, timeframe)
    
    console.log(`   OHLC path: ${ohlcPath}`)
    
    const ohlcRef = ref(database, ohlcPath)
    const limitedQuery = query(ohlcRef, limitToLast(config.barsToFetch))
    
    const snapshot = await get(limitedQuery)
    
    if (!snapshot.exists()) {
      console.warn(`⚠️ No data at: ${ohlcPath}`)
      console.warn(`   Make sure simulator is running and path is correct`)
      return []
    }

    const rawData = snapshot.val()
    const result = processHistoricalData(rawData, config.barsToFetch)
    
    if (result.length === 0) {
      console.warn(`⚠️ No valid data after processing`)
      return []
    }
    
    // Store in caches
    memoryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl: config.cacheTTL
    })
    
    await idbCache.set(cacheKey, result, config.cacheTTL)
    
    console.log(`✅ Fetched & cached ${result.length} bars for ${timeframe}`)
    return result

  } catch (error: any) {
    console.error('❌ Fetch error:', error.message)
    console.error('   Path:', assetPath)
    console.error('   Timeframe:', timeframe)
    return []
  }
}

// ===================================
// PROCESS DATA
// ===================================

function processHistoricalData(data: any, limit: number): any[] {
  if (!data || typeof data !== 'object') {
    return []
  }

  const historicalData: any[] = []
  const keys = Object.keys(data)

  keys.forEach(key => {
    const item = data[key]
    
    if (!item || typeof item !== 'object') return

    const timestamp = item.timestamp || parseInt(key)
    
    if (!timestamp || isNaN(timestamp)) return
    if (typeof item.close !== 'number' || item.close <= 0) return

    historicalData.push({
      timestamp: timestamp,
      datetime: item.datetime || new Date(timestamp * 1000).toISOString(),
      open: item.open || item.close,
      high: item.high || item.close,
      low: item.low || item.close,
      close: item.close,
      volume: item.volume || 0
    })
  })

  if (historicalData.length === 0) {
    return []
  }

  historicalData.sort((a, b) => a.timestamp - b.timestamp)
  return historicalData.slice(-limit)
}

// ===================================
// SUBSCRIBE TO OHLC - FIXED
// ===================================

export function subscribeToOHLCUpdates(
  assetPath: string,
  timeframe: Timeframe,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined' || !database) {
    return () => {}
  }

  const config = TIMEFRAME_CONFIG[timeframe]
  if (!config) {
    console.error(`❌ Invalid timeframe: ${timeframe}`)
    return () => {}
  }

  // ✅ CRITICAL: Clean path and use helper
  const basePath = cleanAssetPath(assetPath)
  const ohlcPath = getOHLCPath(basePath, timeframe)
  
  console.log(`🔥 Subscribing to OHLC:`)
  console.log(`   Asset path (input): ${assetPath}`)
  console.log(`   Asset path (clean): ${basePath}`)
  console.log(`   OHLC path: ${ohlcPath}`)
  
  const ohlcRef = ref(database, ohlcPath)
  
  let lastBarTimestamp: number | null = null
  let updateCount = 0
  let rafId: number | null = null
  
  const throttledCallback = (data: any) => {
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
    
    rafId = requestAnimationFrame(() => {
      callback(data)
      rafId = null
    })
  }
  
  const unsubscribe = onValue(ohlcRef, (snapshot) => {
    const data = snapshot.val()
    if (!data) return

    const keys = Object.keys(data).sort()
    const latestKey = keys[keys.length - 1]
    const latestData = data[latestKey]
    
    if (!latestData || !latestData.close) return

    const barTimestamp = latestData.timestamp || parseInt(latestKey)
    const isNewBar = barTimestamp !== lastBarTimestamp
    
    if (isNewBar) {
      lastBarTimestamp = barTimestamp
      updateCount++
      
      // Invalidate cache on new bar
      const cacheKey = `${basePath}-${timeframe}`
      memoryCache.delete(cacheKey)
      
      console.log(`🆕 New ${timeframe} bar: ${barTimestamp}`)
    }
    
    const barData = {
      timestamp: barTimestamp,
      datetime: latestData.datetime || new Date(barTimestamp * 1000).toISOString(),
      open: latestData.open || latestData.close,
      high: latestData.high || latestData.close,
      low: latestData.low || latestData.close,
      close: latestData.close,
      volume: latestData.volume || 0,
      isNewBar
    }
    
    throttledCallback(barData)

  }, (error) => {
    console.error(`❌ OHLC subscription error (${timeframe}):`, error)
  })

  return () => {
    console.log(`🔕 Unsubscribing from ${timeframe} (${updateCount} updates)`)
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
    off(ohlcRef)
  }
}

// ===================================
// SUBSCRIBE TO PRICE - FIXED
// ===================================

export function subscribeToPriceUpdates(
  assetPath: string,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined' || !database) {
    return () => {}
  }

  // ✅ CRITICAL: Use helper to get price path
  const pricePath = getPricePath(assetPath)
  
  console.log(`🔥 Subscribing to price:`)
  console.log(`   Asset path (input): ${assetPath}`)
  console.log(`   Price path: ${pricePath}`)
  
  const priceRef = ref(database, pricePath)
  
  let rafId: number | null = null
  let updateCount = 0
  
  const throttledCallback = (data: any) => {
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
    
    rafId = requestAnimationFrame(() => {
      callback(data)
      rafId = null
    })
  }
  
  const unsubscribe = onValue(priceRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      updateCount++
      throttledCallback(data)
    }
  }, (error) => {
    console.error('❌ Price subscription error:', error)
  })

  return () => {
    console.log(`🔕 Unsubscribing from price (${updateCount} updates)`)
    if (rafId) {
      cancelAnimationFrame(rafId)
    }
    off(priceRef)
  }
}

// ===================================
// PREFETCH
// ===================================

export async function prefetchDefaultAsset(assetPath: string): Promise<void> {
  const basePath = cleanAssetPath(assetPath)
  
  console.log(`🚀 Prefetching default asset:`)
  console.log(`   Asset path (input): ${assetPath}`)
  console.log(`   Asset path (clean): ${basePath}`)
  
  const timeframes: Timeframe[] = ['1m', '5m', '15m']
  
  const promises = timeframes.map(tf => 
    fetchHistoricalData(basePath, tf)
  )
  
  await Promise.allSettled(promises)
  
  console.log(`✅ Default asset prefetched`)
}

// ===================================
// CLEAR CACHE
// ===================================

export async function clearDataCache(pattern?: string): Promise<void> {
  if (!pattern) {
    memoryCache.clear()
    await idbCache.clear()
    console.log('🗑️ All cache cleared')
    return
  }
  
  const keys = Array.from(memoryCache.keys())
  keys.forEach(key => {
    if (key.includes(pattern)) {
      memoryCache.delete(key)
    }
  })
  
  console.log(`🗑️ Cache cleared for: ${pattern}`)
}

// ===================================
// CACHE STATS
// ===================================

export function getCacheStats(): any {
  return {
    memoryCache: {
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys())
    }
  }
}