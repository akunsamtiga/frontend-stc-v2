// lib/firebase.ts - Optimized for Fast Loading
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

function cleanAssetPath(path: string): string {
  if (!path) return ''
  if (path.endsWith('/current_price')) {
    path = path.replace('/current_price', '')
  }
  path = path.replace(/\/$/, '')
  if (!path.startsWith('/')) path = '/' + path
  return path
}

function getPricePath(assetPath: string): string {
  const clean = cleanAssetPath(assetPath)
  return `${clean}/current_price`
}

function getOHLCPath(assetPath: string, timeframe: string): string {
  const clean = cleanAssetPath(assetPath)
  return `${clean}/ohlc_${timeframe}`
}

async function checkSimulatorStatus(assetPath: string): Promise<{
  isRunning: boolean
  hasCurrentPrice: boolean
  hasOHLC: boolean
  message: string
}> {
  if (!database) {
    return { 
      isRunning: false, 
      hasCurrentPrice: false, 
      hasOHLC: false,
      message: 'Firebase not initialized' 
    }
  }

  try {
    const basePath = cleanAssetPath(assetPath)
    
    const priceRef = ref(database, `${basePath}/current_price`)
    const priceSnapshot = await get(priceRef)
    const hasCurrentPrice = priceSnapshot.exists()
    
    let hasOHLC = false
    let ohlcMessage = ''
    
    const timeframesToCheck = ['1m', '1s', '5m']
    
    for (const tf of timeframesToCheck) {
      const ohlcRef = ref(database, `${basePath}/ohlc_${tf}`)
      const ohlcSnapshot = await get(ohlcRef)
      
      if (ohlcSnapshot.exists()) {
        const data = ohlcSnapshot.val()
        
        if (Array.isArray(data) && data.length > 0) {
          hasOHLC = true
          ohlcMessage = `✅ Found ${data.length} bars in ohlc_${tf}`
          break
        } else if (typeof data === 'object' && Object.keys(data).length > 0) {
          hasOHLC = true
          ohlcMessage = `✅ Found ${Object.keys(data).length} bars in ohlc_${tf}`
          break
        }
      }
    }
    
    const isRunning = hasCurrentPrice && hasOHLC
    
    let message = ''
    if (!hasCurrentPrice && !hasOHLC) {
      message = '❌ No data found - Simulator not running'
    } else if (!hasCurrentPrice) {
      message = '❌ Missing current_price data'
    } else if (!hasOHLC) {
      message = `❌ Missing OHLC data`
    } else {
      message = ohlcMessage
    }
    
    return { isRunning, hasCurrentPrice, hasOHLC, message }
  } catch (error) {
    return { 
      isRunning: false, 
      hasCurrentPrice: false, 
      hasOHLC: false,
      message: 'Check failed: ' + (error as Error).message 
    }
  }
}

type Timeframe = '1s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

const TIMEFRAME_CONFIG: Record<Timeframe, { path: string; barsToFetch: number; cacheTTL: number }> = {
  '1s': { path: 'ohlc_1s', barsToFetch: 60, cacheTTL: 1000 },
  '1m': { path: 'ohlc_1m', barsToFetch: 100, cacheTTL: 3000 },
  '5m': { path: 'ohlc_5m', barsToFetch: 100, cacheTTL: 10000 },
  '15m': { path: 'ohlc_15m', barsToFetch: 150, cacheTTL: 20000 },
  '1h': { path: 'ohlc_1h', barsToFetch: 150, cacheTTL: 40000 },
  '4h': { path: 'ohlc_4h', barsToFetch: 100, cacheTTL: 80000 },
  '1d': { path: 'ohlc_1d', barsToFetch: 60, cacheTTL: 180000 }
}

interface CacheEntry {
  data: any[]
  timestamp: number
  ttl: number
  accessCount: number
  lastAccess: number
}

class LRUCache {
  private cache = new Map<string, CacheEntry>()
  private maxSize = 50

  get(key: string): any[] | null {
    const entry = this.cache.get(key)
    
    if (!entry) return null
    
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }
    
    entry.accessCount++
    entry.lastAccess = now
    
    return entry.data
  }

  set(key: string, data: any[], ttl: number) {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccess: Date.now()
    })
  }

  delete(key: string) {
    this.cache.delete(key)
  }

  clear() {
    this.cache.clear()
  }

  private evictLRU() {
    let oldestKey: string | null = null
    let oldestTime = Infinity
    
    this.cache.forEach((entry, key) => {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess
        oldestKey = key
      }
    })
    
    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    }
  }
}

const memoryCache = new LRUCache()

class IndexedDBCache {
  private dbName = 'trading_chart_cache'
  private storeName = 'ohlc_data'
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null
  private pendingWrites: Map<string, any> = new Map()
  private writeTimeout: NodeJS.Timeout | null = null

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
          if (result) {
            this.delete(key).catch(() => {})
          }
          resolve(null)
        }
      }
      request.onerror = () => resolve(null)
    })
  }

  async set(key: string, data: any, ttl: number): Promise<void> {
    this.pendingWrites.set(key, { data, ttl })
    
    if (this.writeTimeout) {
      clearTimeout(this.writeTimeout)
    }
    
    this.writeTimeout = setTimeout(() => {
      this.flushWrites()
    }, 100)
  }

  private async flushWrites(): Promise<void> {
    if (this.pendingWrites.size === 0) return
    
    await this.init()
    if (!this.db) return

    const writes = Array.from(this.pendingWrites.entries())
    this.pendingWrites.clear()

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      writes.forEach(([key, { data, ttl }]) => {
        const expiry = Date.now() + ttl
        store.put({ key, data, timestamp: Date.now(), expiry })
      })
      
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

      let deleteCount = 0
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          cursor.delete()
          deleteCount++
          cursor.continue()
        }
      }

      transaction.oncomplete = () => {
        if (deleteCount > 0) {
          console.log(`🗑️ Cleaned ${deleteCount} expired entries`)
        }
        resolve()
      }
      transaction.onerror = () => resolve()
    })
  }
}

const idbCache = new IndexedDBCache()

if (typeof window !== 'undefined') {
  setInterval(() => {
    idbCache.cleanup().catch(() => {})
  }, 120000)
}

const pendingFetches = new Map<string, Promise<any[]>>()

function processHistoricalData(data: any, limit: number): any[] {
  if (!data || typeof data !== 'object') {
    return []
  }

  const historicalData: any[] = []
  const isArray = Array.isArray(data)
  
  if (isArray) {
    data.forEach((item: any) => {
      if (!item || typeof item !== 'object') return
      
      const timestamp = item.timestamp
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
  } else {
    const keys = Object.keys(data)
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const item = data[key]
      
      if (!item || typeof item !== 'object') continue

      let timestamp = parseInt(key)
      
      if (isNaN(timestamp)) {
        timestamp = item.timestamp
      }
      
      if (!timestamp || isNaN(timestamp)) continue
      if (typeof item.close !== 'number' || item.close <= 0) continue

      historicalData.push({
        timestamp: timestamp,
        datetime: item.datetime || new Date(timestamp * 1000).toISOString(),
        open: item.open || item.close,
        high: item.high || item.close,
        low: item.low || item.close,
        close: item.close,
        volume: item.volume || 0
      })
    }
  }

  if (historicalData.length === 0) {
    return []
  }

  historicalData.sort((a, b) => a.timestamp - b.timestamp)
  
  return historicalData.slice(-limit)
}

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

    const basePath = cleanAssetPath(assetPath)
    const cacheKey = `${basePath}-${timeframe}`

    const memCached = memoryCache.get(cacheKey)
    if (memCached) {
      console.log(`⚡ Memory cache hit: ${timeframe}`)
      return memCached
    }

    if (pendingFetches.has(cacheKey)) {
      console.log(`🔄 Deduplicating fetch: ${timeframe}`)
      return await pendingFetches.get(cacheKey)!
    }

    const fetchPromise = (async () => {
      try {
        const idbCached = await idbCache.get(cacheKey)
        if (idbCached) {
          console.log(`💾 IndexedDB cache hit: ${timeframe}`)
          memoryCache.set(cacheKey, idbCached, config.cacheTTL)
          return idbCached
        }

        console.log(`📡 Fetching ${timeframe} from Firebase...`)
        
        const ohlcPath = getOHLCPath(basePath, timeframe)
        const ohlcRef = ref(database, ohlcPath)
        
        const snapshot = await get(ohlcRef)
        
        if (!snapshot.exists()) {
          console.warn(`⚠️ No data at: ${ohlcPath}`)
          return []
        }

        const rawData = snapshot.val()
        const result = processHistoricalData(rawData, config.barsToFetch)
        
        if (result.length === 0) {
          return []
        }
        
        memoryCache.set(cacheKey, result, config.cacheTTL)
        await idbCache.set(cacheKey, result, config.cacheTTL)
        
        console.log(`✅ Fetched ${result.length} ${timeframe} bars`)
        
        return result
      } finally {
        pendingFetches.delete(cacheKey)
      }
    })()

    pendingFetches.set(cacheKey, fetchPromise)
    return await fetchPromise

  } catch (error: any) {
    console.error('❌ Fetch error:', error.message)
    return []
  }
}

export async function prefetchMultipleTimeframes(
  assetPath: string,
  timeframes: Timeframe[] = ['1m', '5m', '15m']
): Promise<Map<Timeframe, any[]>> {
  const results = new Map<Timeframe, any[]>()
  
  const promises = timeframes.map(async (tf) => {
    const data = await fetchHistoricalData(assetPath, tf)
    return { timeframe: tf, data }
  })
  
  const settled = await Promise.allSettled(promises)
  
  settled.forEach((result) => {
    if (result.status === 'fulfilled') {
      results.set(result.value.timeframe, result.value.data)
    }
  })
  
  console.log(`✅ Prefetched ${results.size} timeframes`)
  
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

  const config = TIMEFRAME_CONFIG[timeframe]
  if (!config) {
    console.error(`❌ Invalid timeframe: ${timeframe}`)
    return () => {}
  }

  const basePath = cleanAssetPath(assetPath)
  const ohlcPath = getOHLCPath(basePath, timeframe)
  const ohlcRef = ref(database, ohlcPath)
  
  let lastBarTimestamp: number | null = null
  let lastData: any = null
  
  const unsubscribe = onValue(ohlcRef, (snapshot) => {
    const data = snapshot.val()
    if (!data) return

    let latestData: any = null
    let latestKey: string | null = null
    let isArray = Array.isArray(data)
    
    if (isArray) {
      latestData = data[data.length - 1]
      latestKey = String(data.length - 1)
    } else {
      const keys = Object.keys(data)
      
      keys.sort((a, b) => {
        const numA = parseInt(a)
        const numB = parseInt(b)
        if (!isNaN(numA) && !isNaN(numB)) {
          return numB - numA
        }
        return b.localeCompare(a)
      })
      
      latestKey = keys[0]
      latestData = data[latestKey]
    }
    
    if (!latestData || !latestData.close) {
      return
    }

    let barTimestamp = latestData.timestamp
    
    if (!barTimestamp && latestKey) {
      const parsedKey = parseInt(latestKey)
      if (!isNaN(parsedKey)) {
        barTimestamp = parsedKey
      }
    }
    
    if (!barTimestamp) {
      return
    }
    
    const isNewBar = barTimestamp !== lastBarTimestamp
    
    if (isNewBar) {
      lastBarTimestamp = barTimestamp
      const cacheKey = `${basePath}-${timeframe}`
      memoryCache.delete(cacheKey)
    }
    
    const hasChanged = !lastData || 
      lastData.open !== latestData.open ||
      lastData.high !== latestData.high ||
      lastData.low !== latestData.low ||
      lastData.close !== latestData.close
    
    if (!hasChanged && !isNewBar) {
      return
    }
    
    lastData = latestData
    
    const barData = {
      timestamp: barTimestamp,
      datetime: latestData.datetime || new Date(barTimestamp * 1000).toISOString(),
      open: latestData.open || latestData.close,
      high: latestData.high || latestData.close,
      low: latestData.low || latestData.close,
      close: latestData.close,
      volume: latestData.volume || 0,
      isNewBar,
      isCompleted: latestData.isCompleted || false
    }
    
    callback(barData)

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

  const pricePath = getPricePath(assetPath)
  const priceRef = ref(database, pricePath)
  
  let lastPrice: number | null = null
  let lastTimestamp: number | null = null
  
  const unsubscribe = onValue(priceRef, (snapshot) => {
    const data = snapshot.val()
    if (!data || !data.price) return
    
    const isDuplicate = lastPrice && 
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
  const basePath = cleanAssetPath(assetPath)
  const timeframes: Timeframe[] = ['1s', '1m', '5m']
  
  await prefetchMultipleTimeframes(basePath, timeframes)
}

export async function clearDataCache(pattern?: string): Promise<void> {
  if (!pattern) {
    memoryCache.clear()
    await idbCache.clear()
    console.log('🗑️ All cache cleared')
    return
  }
  
  const stats = memoryCache.getStats()
  stats.keys.forEach(key => {
    if (key.includes(pattern)) {
      memoryCache.delete(key)
    }
  })
}

export function getCacheStats(): any {
  return memoryCache.getStats()
}

export function isValidTimeframe(timeframe: string): timeframe is Timeframe {
  return timeframe in TIMEFRAME_CONFIG
}

export function getSupportedTimeframes(): Timeframe[] {
  return Object.keys(TIMEFRAME_CONFIG) as Timeframe[]
}

export function getTimeframeInfo(timeframe: Timeframe) {
  return TIMEFRAME_CONFIG[timeframe]
}

if (typeof window !== 'undefined') {
  (window as any).firebaseDebug = {
    getCacheStats,
    clearDataCache,
    getSupportedTimeframes,
    getTimeframeInfo,
    isValidTimeframe,
    prefetchDefaultAsset,
    checkSimulatorStatus,
    async inspectPath(path: string) {
      if (!database) return null
      const snapshot = await get(ref(database, path))
      console.log(`📦 Data at ${path}:`, snapshot.val())
      return snapshot.val()
    },
    async testCryptoAsset(assetPath: string) {
      console.log(`🧪 Testing crypto asset: ${assetPath}`)
      
      const status = await checkSimulatorStatus(assetPath)
      console.log('Status:', status)
      
      if (status.hasOHLC) {
        const data = await fetchHistoricalData(assetPath, '1m')
        console.log(`Fetched ${data.length} bars`)
        if (data.length > 0) {
          console.log('First bar:', data[0])
          console.log('Last bar:', data[data.length - 1])
        }
      }
      
      return status
    }
  }
}