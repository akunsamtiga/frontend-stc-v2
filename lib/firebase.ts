// lib/firebase.ts - OPTIMIZED VERSION
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getDatabase, Database, ref, onValue, off, query, orderByKey, limitToLast, get } from 'firebase/database'

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

export { database, ref, onValue, off }

// ===================================
// OPTIMIZATIONS
// ===================================

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

const TIMEFRAME_CONFIG: Record<Timeframe, { path: string; barsToFetch: number }> = {
  '1m': { path: 'ohlc_1m', barsToFetch: 100 },
  '5m': { path: 'ohlc_5m', barsToFetch: 100 },
  '15m': { path: 'ohlc_15m', barsToFetch: 150 },
  '1h': { path: 'ohlc_1h', barsToFetch: 150 },
  '4h': { path: 'ohlc_4h', barsToFetch: 100 },
  '1d': { path: 'ohlc_1d', barsToFetch: 60 }
}

// Enhanced cache with TTL
interface CacheEntry {
  data: any[]
  timestamp: number
  ttl: number
}

const dataCache = new Map<string, CacheEntry>()
const CACHE_TTL = {
  '1m': 10000,  // 10s
  '5m': 30000,  // 30s
  '15m': 60000, // 1m
  '1h': 300000, // 5m
  '4h': 600000, // 10m
  '1d': 900000  // 15m
}

// Request deduplication
const pendingRequests = new Map<string, Promise<any[]>>()

// Debounce helper
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle helper
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * Fetch historical OHLC data with caching and deduplication
 */
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

    // Check cache
    const cacheKey = `${assetPath}-${timeframe}`
    const cached = dataCache.get(cacheKey)
    const now = Date.now()
    const ttl = CACHE_TTL[timeframe] || 30000
    
    if (cached && (now - cached.timestamp) < ttl) {
      console.log(`✅ Using cached data for ${timeframe} (${cached.data.length} bars)`)
      return cached.data
    }

    // Check if request is pending
    const pendingKey = cacheKey
    if (pendingRequests.has(pendingKey)) {
      console.log(`⏳ Waiting for pending request: ${timeframe}`)
      return pendingRequests.get(pendingKey)!
    }

    // Create new request
    const requestPromise = (async () => {
      const ohlcPath = `${assetPath}/${config.path}`
      const ohlcRef = ref(database, ohlcPath)
      const historyQuery = query(ohlcRef, orderByKey(), limitToLast(config.barsToFetch))
      
      const snapshot = await get(historyQuery)
      
      if (!snapshot.exists()) {
        console.warn(`No data found at: ${ohlcPath}`)
        return []
      }

      const rawData = snapshot.val()
      const result = processHistoricalData(rawData, config.barsToFetch)
      
      if (result.length === 0) {
        console.warn(`No valid data after processing`)
        return []
      }
      
      // Update cache
      dataCache.set(cacheKey, { 
        data: result, 
        timestamp: now,
        ttl 
      })
      
      // Clean old cache
      if (dataCache.size > 20) {
        const entries = Array.from(dataCache.entries())
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
        dataCache.delete(entries[0][0])
      }
      
      console.log(`✅ Fetched ${result.length} bars for ${timeframe}`)
      return result
    })()

    // Store pending request
    pendingRequests.set(pendingKey, requestPromise)
    
    try {
      const result = await requestPromise
      return result
    } finally {
      pendingRequests.delete(pendingKey)
    }

  } catch (error: any) {
    console.error('Error fetching data:', error.message)
    return []
  }
}

/**
 * Process and validate historical data
 */
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

/**
 * Subscribe to OHLC updates with throttling
 */
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
  
  // Throttle callback to prevent too many updates
  const throttledCallback = throttle(callback, 500)
  
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
    console.error(`Subscription error for ${timeframe}:`, error)
  })

  return () => {
    console.log(`🔕 Unsubscribing from ${timeframe} (received ${updateCount} updates)`)
    off(ohlcRef)
  }
}

/**
 * Subscribe to current price with debouncing
 */
export function subscribeToPriceUpdates(
  path: string,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined' || !database) {
    return () => {}
  }

  const priceRef = ref(database, path)
  
  // Debounce callback to prevent too many rapid updates
  const debouncedCallback = debounce(callback, 100)
  
  const unsubscribe = onValue(priceRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      debouncedCallback(data)
    }
  }, (error) => {
    console.error('Price subscription error:', error)
  })

  return () => {
    console.log('🔕 Unsubscribing from price updates')
    off(priceRef)
  }
}

/**
 * Get latest bar
 */
export async function getLatestBar(
  assetPath: string,
  timeframe: Timeframe
): Promise<any | null> {
  if (typeof window === 'undefined' || !database) return null

  try {
    const config = TIMEFRAME_CONFIG[timeframe]
    if (!config) return null

    const ohlcPath = `${assetPath}/${config.path}`
    const ohlcRef = ref(database, ohlcPath)
    const latestQuery = query(ohlcRef, orderByKey(), limitToLast(1))
    
    const snapshot = await get(latestQuery)
    
    if (!snapshot.exists()) return null

    const data = snapshot.val()
    const keys = Object.keys(data)
    if (keys.length === 0) return null

    const latestData = data[keys[0]]
    
    return {
      timestamp: latestData.timestamp || parseInt(keys[0]),
      datetime: latestData.datetime,
      open: latestData.open,
      high: latestData.high,
      low: latestData.low,
      close: latestData.close,
      volume: latestData.volume || 0
    }
  } catch (error) {
    console.error('Error getting latest bar:', error)
    return null
  }
}

/**
 * Clear cache manually
 */
export function clearDataCache(pattern?: string) {
  if (!pattern) {
    dataCache.clear()
    console.log('🗑️ All cache cleared')
    return
  }
  
  const keys = Array.from(dataCache.keys())
  keys.forEach(key => {
    if (key.includes(pattern)) {
      dataCache.delete(key)
    }
  })
  console.log(`🗑️ Cache cleared for pattern: ${pattern}`)
}

/**
 * Prefetch data for multiple timeframes
 */
export async function prefetchTimeframes(
  assetPath: string,
  timeframes: Timeframe[]
): Promise<void> {
  const promises = timeframes.map(tf => 
    fetchHistoricalData(assetPath, tf)
  )
  
  await Promise.all(promises)
  console.log(`✅ Prefetched ${timeframes.length} timeframes`)
}