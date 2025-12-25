// lib/firebase.ts - OPTIMIZED VERSION WITH BETTER REAL-TIME
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getDatabase, Database, ref, onValue, off } from 'firebase/database'

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
// TYPES & CONFIG
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

// Cache with TTL
interface CacheEntry {
  data: any[]
  timestamp: number
  ttl: number
}

const dataCache = new Map<string, CacheEntry>()
const CACHE_TTL = {
  '1m': 5000,   // 5s
  '5m': 15000,  // 15s
  '15m': 30000, // 30s
  '1h': 60000,  // 1m
  '4h': 120000, // 2m
  '1d': 300000  // 5m
}

// Request deduplication
const pendingRequests = new Map<string, Promise<any[]>>()

// ===================================
// RAF THROTTLE FOR SMOOTH UPDATES
// ===================================

function rafThrottle<T extends (...args: any[]) => any>(func: T): T {
  let rafId: number | null = null
  let lastArgs: any[] | null = null
  
  return ((...args: any[]) => {
    lastArgs = args
    
    if (rafId !== null) return
    
    rafId = requestAnimationFrame(() => {
      if (lastArgs) {
        func(...lastArgs)
        lastArgs = null
      }
      rafId = null
    })
  }) as T
}

// ===================================
// DEBOUNCE (for less frequent updates)
// ===================================

function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout | null = null
  
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }) as T
}

// ===================================
// FETCH HISTORICAL DATA (with cache)
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

    // Check cache
    const cacheKey = `${assetPath}-${timeframe}`
    const cached = dataCache.get(cacheKey)
    const now = Date.now()
    const ttl = CACHE_TTL[timeframe] || 30000
    
    if (cached && (now - cached.timestamp) < ttl) {
      console.log(`✅ Cache hit: ${timeframe} (${cached.data.length} bars)`)
      return cached.data
    }

    // Check pending
    const pendingKey = cacheKey
    if (pendingRequests.has(pendingKey)) {
      console.log(`⏳ Using pending request: ${timeframe}`)
      return pendingRequests.get(pendingKey)!
    }

    // Fetch data
    const requestPromise = new Promise<any[]>((resolve, reject) => {
      const ohlcPath = `${assetPath}/${config.path}`
      const ohlcRef = ref(database, ohlcPath)
      
      // Use onValue for real-time snapshot
      const unsubscribe = onValue(ohlcRef, (snapshot) => {
        unsubscribe() // Get once
        
        if (!snapshot.exists()) {
          console.warn(`No data at: ${ohlcPath}`)
          resolve([])
          return
        }

        const rawData = snapshot.val()
        const result = processHistoricalData(rawData, config.barsToFetch)
        
        if (result.length === 0) {
          console.warn(`No valid data after processing`)
          resolve([])
          return
        }
        
        // Cache it
        dataCache.set(cacheKey, { 
          data: result, 
          timestamp: now,
          ttl 
        })
        
        // Cleanup cache if too large
        if (dataCache.size > 20) {
          const entries = Array.from(dataCache.entries())
          entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
          dataCache.delete(entries[0][0])
        }
        
        console.log(`✅ Fetched ${result.length} bars for ${timeframe}`)
        resolve(result)
      }, (error) => {
        console.error('Firebase read error:', error)
        reject(error)
      })
    })

    pendingRequests.set(pendingKey, requestPromise)
    
    try {
      const result = await requestPromise
      return result
    } finally {
      pendingRequests.delete(pendingKey)
    }

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
// SUBSCRIBE TO OHLC (RAF throttled)
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
  
  // RAF throttle the callback for smooth updates
  const throttledCallback = rafThrottle(callback)
  
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
    
    // Use RAF throttled callback
    throttledCallback(barData)

  }, (error) => {
    console.error(`OHLC subscription error (${timeframe}):`, error)
  })

  return () => {
    console.log(`🔕 Unsubscribing from ${timeframe} (${updateCount} updates)`)
    off(ohlcRef)
  }
}

// ===================================
// SUBSCRIBE TO CURRENT PRICE (RAF throttled)
// ===================================

export function subscribeToPriceUpdates(
  path: string,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined' || !database) {
    return () => {}
  }

  const priceRef = ref(database, path)
  
  // RAF throttle for ultra-smooth price updates
  const throttledCallback = rafThrottle(callback)
  
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
    off(priceRef)
  }
}

// ===================================
// CLEAR CACHE
// ===================================

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
  console.log(`🗑️ Cache cleared for: ${pattern}`)
}

// ===================================
// PREFETCH (for better UX)
// ===================================

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