// lib/firebase.ts - ULTRA-FAST VERSION WITH AGGRESSIVE CACHING & PREFETCHING
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
// TYPES & CONFIG
// ===================================

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

const TIMEFRAME_CONFIG: Record<Timeframe, { path: string; barsToFetch: number; cacheTTL: number }> = {
  '1m': { path: 'ohlc_1m', barsToFetch: 100, cacheTTL: 5000 },      // 5s
  '5m': { path: 'ohlc_5m', barsToFetch: 100, cacheTTL: 15000 },     // 15s
  '15m': { path: 'ohlc_15m', barsToFetch: 150, cacheTTL: 30000 },   // 30s
  '1h': { path: 'ohlc_1h', barsToFetch: 150, cacheTTL: 60000 },     // 1m
  '4h': { path: 'ohlc_4h', barsToFetch: 100, cacheTTL: 120000 },    // 2m
  '1d': { path: 'ohlc_1d', barsToFetch: 60, cacheTTL: 300000 }      // 5m
}

// ===================================
// INDEXEDDB PERSISTENT CACHE
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

  async delete(key: string): Promise<void> {
    await this.init()
    if (!this.db) return

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      store.delete(key)
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

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    idbCache.cleanup().catch(console.error)
  }, 300000)
}

// ===================================
// IN-MEMORY CACHE (FAST ACCESS)
// ===================================

interface CacheEntry {
  data: any[]
  timestamp: number
  ttl: number
}

const memoryCache = new Map<string, CacheEntry>()

// ===================================
// PREFETCH MANAGER
// ===================================

class PrefetchManager {
  private prefetchQueue = new Set<string>()
  private prefetching = new Map<string, Promise<any>>()
  
  async prefetch(assetPath: string, timeframes: Timeframe[]): Promise<void> {
    const promises = timeframes.map(tf => {
      const key = `${assetPath}-${tf}`
      
      // Skip if already prefetching
      if (this.prefetchQueue.has(key) || this.prefetching.has(key)) {
        return Promise.resolve()
      }
      
      this.prefetchQueue.add(key)
      const promise = fetchHistoricalData(assetPath, tf)
        .then(() => {
          this.prefetchQueue.delete(key)
          this.prefetching.delete(key)
        })
        .catch(() => {
          this.prefetchQueue.delete(key)
          this.prefetching.delete(key)
        })
      
      this.prefetching.set(key, promise)
      return promise
    })

    await Promise.allSettled(promises)
  }

  isPrefetching(assetPath: string, timeframe: Timeframe): boolean {
    const key = `${assetPath}-${timeframe}`
    return this.prefetchQueue.has(key) || this.prefetching.has(key)
  }

  async waitForPrefetch(assetPath: string, timeframe: Timeframe): Promise<void> {
    const key = `${assetPath}-${timeframe}`
    const promise = this.prefetching.get(key)
    if (promise) {
      await promise
    }
  }
}

const prefetchManager = new PrefetchManager()

// ===================================
// OPTIMIZED FETCH WITH MULTI-LEVEL CACHE
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
      console.error(`Invalid timeframe: ${timeframe}`)
      return []
    }

    const cacheKey = `${assetPath}-${timeframe}`

    // 1️⃣ Check memory cache (instant)
    const memCached = memoryCache.get(cacheKey)
    if (memCached && (Date.now() - memCached.timestamp) < memCached.ttl) {
      console.log(`⚡ Memory cache hit: ${timeframe} (${memCached.data.length} bars)`)
      return memCached.data
    }

    // 2️⃣ Check IndexedDB cache (fast)
    const idbCached = await idbCache.get(cacheKey)
    if (idbCached) {
      console.log(`💾 IndexedDB cache hit: ${timeframe} (${idbCached.length} bars)`)
      
      // Update memory cache
      memoryCache.set(cacheKey, {
        data: idbCached,
        timestamp: Date.now(),
        ttl: config.cacheTTL
      })
      
      return idbCached
    }

    // 3️⃣ Check if prefetching in progress
    if (prefetchManager.isPrefetching(assetPath, timeframe)) {
      console.log(`⏳ Waiting for prefetch: ${timeframe}`)
      await prefetchManager.waitForPrefetch(assetPath, timeframe)
      
      // Try cache again after prefetch
      const cachedAfterPrefetch = memoryCache.get(cacheKey)
      if (cachedAfterPrefetch) {
        return cachedAfterPrefetch.data
      }
    }

    // 4️⃣ Fetch from Firebase (optimized query)
    console.log(`🔥 Fetching from Firebase: ${timeframe}`)
    
    const ohlcPath = `${assetPath}/${config.path}`
    const ohlcRef = ref(database, ohlcPath)
    
    // Use limitToLast for better performance
    const limitedQuery = query(ohlcRef, limitToLast(config.barsToFetch))
    
    const snapshot = await get(limitedQuery)
    
    if (!snapshot.exists()) {
      console.warn(`No data at: ${ohlcPath}`)
      return []
    }

    const rawData = snapshot.val()
    const result = processHistoricalData(rawData, config.barsToFetch)
    
    if (result.length === 0) {
      console.warn(`No valid data after processing`)
      return []
    }
    
    // Store in both caches
    memoryCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
      ttl: config.cacheTTL
    })
    
    await idbCache.set(cacheKey, result, config.cacheTTL)
    
    console.log(`✅ Fetched & cached ${result.length} bars for ${timeframe}`)
    return result

  } catch (error: any) {
    console.error('Fetch error:', error.message)
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
// SUBSCRIBE TO OHLC (RAF THROTTLED)
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
    console.error(`Invalid timeframe: ${timeframe}`)
    return () => {}
  }

  const ohlcPath = `${assetPath}/${config.path}`
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
      const cacheKey = `${assetPath}-${timeframe}`
      memoryCache.delete(cacheKey)
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
    console.error(`OHLC subscription error (${timeframe}):`, error)
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
// SUBSCRIBE TO CURRENT PRICE (RAF THROTTLED)
// ===================================

export function subscribeToPriceUpdates(
  path: string,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined' || !database) {
    return () => {}
  }

  const priceRef = ref(database, path)
  
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
  
  let updateCount = 0
  
  const unsubscribe = onValue(priceRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      updateCount++
      throttledCallback(data)
    }
  }, (error) => {
    console.error('Price subscription error:', error)
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
// PREFETCH DEFAULT ASSET (AUTO)
// ===================================

export async function prefetchDefaultAsset(assetPath: string): Promise<void> {
  console.log(`🚀 Prefetching default asset: ${assetPath}`)
  
  // Prefetch most used timeframes in parallel
  const timeframes: Timeframe[] = ['1m', '5m', '15m']
  
  await prefetchManager.prefetch(assetPath, timeframes)
  
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
// PREFETCH MULTIPLE TIMEFRAMES
// ===================================

export async function prefetchTimeframes(
  assetPath: string,
  timeframes: Timeframe[]
): Promise<void> {
  await prefetchManager.prefetch(assetPath, timeframes)
  console.log(`✅ Prefetched ${timeframes.length} timeframes`)
}

// ===================================
// GET CACHE STATISTICS
// ===================================

export function getCacheStats(): any {
  return {
    memoryCache: {
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys())
    }
  }
}