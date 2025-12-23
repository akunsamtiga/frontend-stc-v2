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

// Initialize Firebase
if (typeof window !== 'undefined') {
  try {
    if (!getApps().length) {
      console.log('🔥 Initializing Firebase...')
      app = initializeApp(firebaseConfig)
      database = getDatabase(app)
      console.log('✅ Firebase initialized successfully')
    } else {
      app = getApps()[0]
      database = getDatabase(app)
      console.log('✅ Using existing Firebase instance')
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error)
  }
}

export { database, ref, onValue, off }

// Timeframe configuration
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

const TIMEFRAME_CONFIG: Record<Timeframe, { path: string; barsToFetch: number }> = {
  '1m': { path: 'ohlc_1m', barsToFetch: 100 },
  '5m': { path: 'ohlc_5m', barsToFetch: 100 },
  '15m': { path: 'ohlc_15m', barsToFetch: 150 },
  '1h': { path: 'ohlc_1h', barsToFetch: 150 },
  '4h': { path: 'ohlc_4h', barsToFetch: 100 },
  '1d': { path: 'ohlc_1d', barsToFetch: 60 }
}

// Cache for fetched data
const dataCache = new Map<string, { data: any[]; timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds

/**
 * Fetch historical OHLC data from Firebase
 */
export async function fetchHistoricalData(
  assetPath: string,
  timeframe: Timeframe = '1m'
): Promise<any[]> {
  if (typeof window === 'undefined' || !database) {
    console.warn('⚠️ Firebase not available')
    return []
  }

  try {
    const config = TIMEFRAME_CONFIG[timeframe]
    if (!config) {
      console.error(`❌ Invalid timeframe: ${timeframe}`)
      return []
    }

    // Check cache
    const cacheKey = `${assetPath}-${timeframe}`
    const cached = dataCache.get(cacheKey)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      console.log(`✅ Using cached data for ${timeframe} (${cached.data.length} bars)`)
      return cached.data
    }

    // Build Firebase path
    const ohlcPath = `${assetPath}/${config.path}`
    console.log(`📊 Fetching ${timeframe} from: ${ohlcPath}`)
    
    const ohlcRef = ref(database, ohlcPath)
    const historyQuery = query(ohlcRef, orderByKey(), limitToLast(config.barsToFetch))
    
    const snapshot = await get(historyQuery)
    
    if (!snapshot.exists()) {
      console.warn(`⚠️ No data found at: ${ohlcPath}`)
      console.log('💡 Make sure the simulator is running and generating data')
      return []
    }

    const rawData = snapshot.val()
    const result = processHistoricalData(rawData, config.barsToFetch)
    
    if (result.length === 0) {
      console.warn(`⚠️ No valid data after processing`)
      return []
    }
    
    // Update cache
    dataCache.set(cacheKey, { data: result, timestamp: now })
    
    // Clear old cache entries
    if (dataCache.size > 10) {
      const oldestKey = Array.from(dataCache.keys())[0]
      dataCache.delete(oldestKey)
    }
    
    console.log(`✅ Fetched ${result.length} bars for ${timeframe}`)
    return result

  } catch (error: any) {
    console.error('❌ Error fetching data:', error.message)
    console.error('Stack:', error.stack)
    return []
  }
}

/**
 * Process and validate historical data
 */
function processHistoricalData(data: any, limit: number): any[] {
  if (!data || typeof data !== 'object') {
    console.warn('⚠️ Invalid data format')
    return []
  }

  const historicalData: any[] = []
  const keys = Object.keys(data)

  console.log(`🔍 Processing ${keys.length} raw data points...`)

  keys.forEach(key => {
    const item = data[key]
    
    if (!item || typeof item !== 'object') {
      console.warn(`⚠️ Skipping invalid item at key ${key}`)
      return
    }

    // Get timestamp (prefer item.timestamp, fallback to key)
    const timestamp = item.timestamp || parseInt(key)
    
    if (!timestamp || isNaN(timestamp)) {
      console.warn(`⚠️ Invalid timestamp for key ${key}`)
      return
    }

    // Validate OHLC values
    if (typeof item.close !== 'number' || item.close <= 0) {
      console.warn(`⚠️ Invalid close price for key ${key}`)
      return
    }

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
    console.warn('⚠️ No valid data points after processing')
    return []
  }

  // Sort by timestamp (ascending)
  historicalData.sort((a, b) => a.timestamp - b.timestamp)

  // Take last N bars
  const result = historicalData.slice(-limit)
  
  console.log(`✅ Processed ${result.length} valid bars`)
  console.log(`📅 Date range: ${result[0]?.datetime} to ${result[result.length - 1]?.datetime}`)
  
  return result
}

/**
 * Subscribe to OHLC updates - REAL-TIME VERSION
 */
export function subscribeToOHLCUpdates(
  assetPath: string,
  timeframe: Timeframe,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined' || !database) {
    console.warn('⚠️ Firebase not available for subscription')
    return () => {}
  }

  const config = TIMEFRAME_CONFIG[timeframe]
  if (!config) {
    console.error(`❌ Invalid timeframe: ${timeframe}`)
    return () => {}
  }

  const ohlcPath = `${assetPath}/${config.path}`
  console.log(`🔔 Subscribing to ${timeframe} REAL-TIME updates at: ${ohlcPath}`)
  
  // Get reference to the OHLC path
  const ohlcRef = ref(database, ohlcPath)
  
  // Track last bar timestamp to detect updates
  let lastBarTimestamp: number | null = null
  let updateCount = 0
  
  const unsubscribe = onValue(ohlcRef, (snapshot) => {
    const data = snapshot.val()
    if (!data) return

    // Get the latest entry
    const keys = Object.keys(data).sort()
    const latestKey = keys[keys.length - 1]
    const latestData = data[latestKey]
    
    if (!latestData || !latestData.close) return

    const barTimestamp = latestData.timestamp || parseInt(latestKey)
    
    // Always update (even same bar) for real-time OHLC changes
    const isNewBar = barTimestamp !== lastBarTimestamp
    
    if (isNewBar) {
      lastBarTimestamp = barTimestamp
      updateCount++
      console.log(`🆕 New ${timeframe} bar #${updateCount}: ${latestData.close} @ ${latestData.datetime}`)
    }
    
    const barData = {
      timestamp: barTimestamp,
      datetime: latestData.datetime || new Date(barTimestamp * 1000).toISOString(),
      open: latestData.open || latestData.close,
      high: latestData.high || latestData.close,
      low: latestData.low || latestData.close,
      close: latestData.close,
      volume: latestData.volume || 0,
      isNewBar // Flag untuk chart tahu ini bar baru atau update
    }
    
    callback(barData)

  }, (error) => {
    console.error(`❌ Subscription error for ${timeframe}:`, error)
  })

  return () => {
    console.log(`🔕 Unsubscribing from ${timeframe} (received ${updateCount} updates)`)
    off(ohlcRef)
  }
}

/**
 * Subscribe to current price updates (for price ticker)
 */
export function subscribeToPriceUpdates(
  path: string,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined' || !database) {
    console.warn('⚠️ Firebase not available for price subscription')
    return () => {}
  }

  console.log('🔔 Subscribing to price updates at:', path)
  const priceRef = ref(database, path)
  
  const unsubscribe = onValue(priceRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      callback(data)
    }
  }, (error) => {
    console.error('❌ Price subscription error:', error)
  })

  return () => {
    console.log('🔕 Unsubscribing from price updates')
    off(priceRef)
  }
}

/**
 * Get latest bar (for initialization)
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
    
    if (!snapshot.exists()) {
      console.warn(`⚠️ No latest bar found at: ${ohlcPath}`)
      return null
    }

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
    console.error('❌ Error getting latest bar:', error)
    return null
  }
}

/**
 * Clear cache manually
 */
export function clearDataCache() {
  dataCache.clear()
  console.log('🗑️ Cache cleared')
}

/**
 * Test Firebase connection
 */
export async function testFirebaseConnection(): Promise<boolean> {
  if (typeof window === 'undefined' || !database) {
    console.warn('⚠️ Firebase not initialized')
    return false
  }
  
  try {
    console.log('🔍 Testing Firebase connection...')
    
    // Try to read a test path
    const testRef = ref(database, '/test')
    await get(testRef)
    
    console.log('✅ Firebase connection successful')
    return true
  } catch (error: any) {
    console.error('❌ Firebase connection failed:', error.message)
    return false
  }
}

/**
 * Debug: List available paths in Firebase
 */
export async function debugListPaths(basePath: string = '/'): Promise<void> {
  if (typeof window === 'undefined' || !database) {
    console.warn('⚠️ Firebase not available')
    return
  }

  try {
    console.log(`🔍 Listing paths at: ${basePath}`)
    const baseRef = ref(database, basePath)
    const snapshot = await get(baseRef)
    
    if (!snapshot.exists()) {
      console.log('❌ No data at this path')
      return
    }

    const data = snapshot.val()
    const keys = Object.keys(data)
    
    console.log(`📁 Found ${keys.length} keys:`)
    keys.forEach(key => {
      console.log(`  - ${key}`)
    })
  } catch (error) {
    console.error('❌ Error listing paths:', error)
  }
}