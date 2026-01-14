// lib/firebase.ts - ✅ FIXED: Full Crypto Asset Support
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
    console.log('✅ Firebase initialized successfully')
  } catch (error) {
    console.error('❌ Firebase initialization error:', error)
  }
}

export { database, ref, onValue, off, query, limitToLast, get }

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

// ✅ FIXED: Check both normal and crypto asset structures
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
    
    // Check current_price
    const priceRef = ref(database, `${basePath}/current_price`)
    const priceSnapshot = await get(priceRef)
    const hasCurrentPrice = priceSnapshot.exists()
    
    // ✅ FIX: Check OHLC with proper structure detection
    let hasOHLC = false
    let ohlcMessage = ''
    
    // Try multiple timeframes
    const timeframesToCheck = ['1m', '1s', '5m']
    
    for (const tf of timeframesToCheck) {
      const ohlcRef = ref(database, `${basePath}/ohlc_${tf}`)
      const ohlcSnapshot = await get(ohlcRef)
      
      if (ohlcSnapshot.exists()) {
        const data = ohlcSnapshot.val()
        
        // Check if it has data (array or object with keys)
        if (Array.isArray(data) && data.length > 0) {
          hasOHLC = true
          ohlcMessage = `✅ Found ${data.length} bars in ohlc_${tf} (array)`
          break
        } else if (typeof data === 'object' && Object.keys(data).length > 0) {
          hasOHLC = true
          ohlcMessage = `✅ Found ${Object.keys(data).length} bars in ohlc_${tf} (object)`
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
      message = `❌ Missing OHLC data (checked: ${timeframesToCheck.join(', ')})`
    } else {
      message = ohlcMessage
    }
    
    console.log(`🔍 Simulator check for ${basePath}:`, {
      hasCurrentPrice,
      hasOHLC,
      message
    })
    
    return { isRunning, hasCurrentPrice, hasOHLC, message }
  } catch (error) {
    console.error('❌ Simulator check error:', error)
    return { 
      isRunning: false, 
      hasCurrentPrice: false, 
      hasOHLC: false,
      message: 'Check failed: ' + (error as Error).message 
    }
  }
}

// ============================================
// TYPES
// ============================================

type Timeframe = '1s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

const TIMEFRAME_CONFIG: Record<Timeframe, { path: string; barsToFetch: number; cacheTTL: number }> = {
  '1s': { path: 'ohlc_1s', barsToFetch: 100, cacheTTL: 1000 },
  '1m': { path: 'ohlc_1m', barsToFetch: 150, cacheTTL: 3000 },
  '5m': { path: 'ohlc_5m', barsToFetch: 150, cacheTTL: 10000 },
  '15m': { path: 'ohlc_15m', barsToFetch: 200, cacheTTL: 20000 },
  '1h': { path: 'ohlc_1h', barsToFetch: 200, cacheTTL: 40000 },
  '4h': { path: 'ohlc_4h', barsToFetch: 150, cacheTTL: 80000 },
  '1d': { path: 'ohlc_1d', barsToFetch: 100, cacheTTL: 180000 }
}

// ============================================
// CACHE MANAGEMENT
// ============================================

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
      console.log(`🗑️ Evicted LRU cache entry: ${oldestKey}`)
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
          console.log(`🗑️ Cleaned up ${deleteCount} expired cache entries`)
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

// ============================================
// ✅ FIXED: Process historical data - Support both structures
// ============================================

function processHistoricalData(data: any, limit: number): any[] {
  if (!data || typeof data !== 'object') {
    console.warn('⚠️ Invalid data received:', typeof data)
    return []
  }

  const historicalData: any[] = []
  
  // ✅ FIX: Detect structure type
  const isArray = Array.isArray(data)
  
  if (isArray) {
    console.log('📊 Processing array structure (normal asset)')
    
    // Normal asset structure (array)
    data.forEach((item: any, index: number) => {
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
    console.log('📊 Processing object structure (crypto asset)')
    
    // ✅ Crypto asset structure (object with timestamp keys)
    const keys = Object.keys(data)
    
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const item = data[key]
      
      if (!item || typeof item !== 'object') continue

      // ✅ FIX: Try to get timestamp from key first (crypto structure)
      let timestamp = parseInt(key)
      
      // If key is not a number, try item.timestamp
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
    console.warn('⚠️ No valid bars found in data')
    return []
  }

  // Sort by timestamp
  historicalData.sort((a, b) => a.timestamp - b.timestamp)
  
  const result = historicalData.slice(-limit)
  
  console.log(`✅ Processed ${result.length} bars (structure: ${isArray ? 'array' : 'object'})`)
  
  return result
}

// ============================================
// ✅ FIXED: Fetch historical data
// ============================================

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

    // Check memory cache
    const memCached = memoryCache.get(cacheKey)
    if (memCached) {
      console.log(`⚡ Memory cache hit for ${timeframe}`)
      return memCached
    }

    // Check IndexedDB cache
    const idbCached = await idbCache.get(cacheKey)
    if (idbCached) {
      console.log(`💾 IndexedDB cache hit for ${timeframe}`)
      memoryCache.set(cacheKey, idbCached, config.cacheTTL)
      return idbCached
    }

    console.log(`📡 Fetching ${timeframe} data from Firebase for ${basePath}...`)
    
    const ohlcPath = getOHLCPath(basePath, timeframe)
    const ohlcRef = ref(database, ohlcPath)
    
    // ✅ FIX: Don't use limitToLast for crypto (object structure)
    // Just get all data and process in memory
    const snapshot = await get(ohlcRef)
    
    if (!snapshot.exists()) {
      console.warn(`⚠️ No data at: ${ohlcPath}`)
      return []
    }

    const rawData = snapshot.val()
    console.log(`📦 Raw data type: ${Array.isArray(rawData) ? 'array' : 'object'}`)
    
    const result = processHistoricalData(rawData, config.barsToFetch)
    
    if (result.length === 0) {
      console.warn(`⚠️ No valid bars after processing`)
      return []
    }
    
    // Cache the results
    memoryCache.set(cacheKey, result, config.cacheTTL)
    await idbCache.set(cacheKey, result, config.cacheTTL)
    
    console.log(`✅ Fetched ${result.length} ${timeframe} bars for ${basePath}`)
    console.log(`   First bar: ${new Date(result[0].timestamp * 1000).toISOString()}`)
    console.log(`   Last bar: ${new Date(result[result.length - 1].timestamp * 1000).toISOString()}`)
    
    return result

  } catch (error: any) {
    console.error('❌ Fetch error:', error.message)
    console.error(error)
    return []
  }
}

// ============================================
// ✅ FIXED: Subscribe to OHLC updates
// ============================================

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

    // ✅ FIX: Handle both array and object structures
    let latestData: any = null
    let latestKey: string | null = null
    let isArray = Array.isArray(data)
    
    if (isArray) {
      // Normal asset (array structure)
      latestData = data[data.length - 1]
      latestKey = String(data.length - 1)
    } else {
      // ✅ Crypto asset (object with timestamp keys)
      const keys = Object.keys(data)
      
      // Sort keys numerically (timestamps)
      keys.sort((a, b) => {
        const numA = parseInt(a)
        const numB = parseInt(b)
        if (!isNaN(numA) && !isNaN(numB)) {
          return numB - numA // Descending order
        }
        return b.localeCompare(a)
      })
      
      latestKey = keys[0]
      latestData = data[latestKey]
    }
    
    if (!latestData || !latestData.close) {
      console.warn(`⚠️ Invalid latest data for ${timeframe}`)
      return
    }

    // ✅ Get timestamp from key or data
    let barTimestamp = latestData.timestamp
    
    if (!barTimestamp && latestKey) {
      const parsedKey = parseInt(latestKey)
      if (!isNaN(parsedKey)) {
        barTimestamp = parsedKey
      }
    }
    
    if (!barTimestamp) {
      console.warn(`⚠️ No timestamp found for ${timeframe} bar`)
      return
    }
    
    const isNewBar = barTimestamp !== lastBarTimestamp
    
    if (isNewBar) {
      lastBarTimestamp = barTimestamp
      const cacheKey = `${basePath}-${timeframe}`
      memoryCache.delete(cacheKey)
      
      if (timeframe === '1s') {
        console.log(`✅ New 1s bar: ${new Date(barTimestamp * 1000).toISOString()}`)
      } else if (timeframe === '1m') {
        console.log(`✅ New 1m bar: ${new Date(barTimestamp * 1000).toISOString()}`)
      }
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

  console.log(`📊 Subscribed to ${timeframe} OHLC updates at ${ohlcPath}`)

  return () => {
    console.log(`🔌 Unsubscribed from ${timeframe} OHLC updates`)
    off(ohlcRef)
  }
}

// ============================================
// PRICE UPDATES (current_price)
// ============================================

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

  console.log(`💰 Subscribed to price updates at ${pricePath}`)

  return () => {
    console.log(`🔌 Unsubscribed from price updates`)
    off(priceRef)
  }
}

// ============================================
// PREFETCH & UTILITIES
// ============================================

export async function prefetchDefaultAsset(assetPath: string): Promise<void> {
  const basePath = cleanAssetPath(assetPath)
  const timeframes: Timeframe[] = ['1s', '1m', '5m']
  
  console.log(`🚀 Prefetching data for ${basePath}...`)
  
  const results = await Promise.allSettled(
    timeframes.map(tf => fetchHistoricalData(basePath, tf))
  )
  
  const successful = results.filter(r => r.status === 'fulfilled').length
  console.log(`✅ Prefetch complete for ${basePath} (${successful}/${timeframes.length} successful)`)
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
  
  console.log(`🗑️ Cache cleared for pattern: ${pattern}`)
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

// ============================================
// DEBUG UTILITIES
// ============================================

if (typeof window !== 'undefined') {
  (window as any).firebaseDebug = {
    getCacheStats,
    clearDataCache,
    getSupportedTimeframes,
    getTimeframeInfo,
    isValidTimeframe,
    prefetchDefaultAsset,
    checkSimulatorStatus,
    // ✅ NEW: Manual data inspection
    async inspectPath(path: string) {
      if (!database) return null
      const snapshot = await get(ref(database, path))
      console.log(`📦 Data at ${path}:`, snapshot.val())
      return snapshot.val()
    },
    // ✅ NEW: Test crypto structure
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
  
  console.log('🔧 Firebase debug utilities available at window.firebaseDebug')
  console.log('   - getCacheStats()')
  console.log('   - clearDataCache(pattern?)')
  console.log('   - inspectPath(path)')
  console.log('   - testCryptoAsset(assetPath)')
  console.log('   - checkSimulatorStatus(assetPath)')
}