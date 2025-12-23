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

if (typeof window !== 'undefined' && !getApps().length) {
  app = initializeApp(firebaseConfig)
  database = getDatabase(app)
  console.log('🔥 Firebase initialized')
}

export { database, ref, onValue, off }

// Timeframe configuration - OPTIMIZED
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

const TIMEFRAME_CONFIG: Record<Timeframe, { path: string; barsToFetch: number }> = {
  '1m': { path: 'ohlc_1m', barsToFetch: 100 },  // Reduced from 200
  '5m': { path: 'ohlc_5m', barsToFetch: 100 },  // Reduced from 200
  '15m': { path: 'ohlc_15m', barsToFetch: 150 }, // Reduced from 200
  '1h': { path: 'ohlc_1h', barsToFetch: 150 },   // Reduced from 200
  '4h': { path: 'ohlc_4h', barsToFetch: 100 },   // Reduced from 150
  '1d': { path: 'ohlc_1d', barsToFetch: 60 }     // Reduced from 100
}

// Cache for fetched data
const dataCache = new Map<string, { data: any[]; timestamp: number }>()
const CACHE_TTL = 30000 // 30 seconds

// Fetch historical data with caching
export async function fetchHistoricalData(
  assetPath: string,
  timeframe: Timeframe = '1m'
): Promise<any[]> {
  if (typeof window === 'undefined') return []

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
      console.log(`✅ Using cached data for ${timeframe}`)
      return cached.data
    }

    const ohlcPath = `${assetPath}/${config.path}`
    console.log(`📊 Fetching ${timeframe} from: ${ohlcPath}`)
    
    const ohlcRef = ref(database, ohlcPath)
    const historyQuery = query(ohlcRef, orderByKey(), limitToLast(config.barsToFetch))
    const snapshot = await get(historyQuery)
    
    if (!snapshot.exists()) {
      console.warn(`⚠️ No data at: ${ohlcPath}`)
      return []
    }

    const rawData = snapshot.val()
    const result = processHistoricalData(rawData, config.barsToFetch)
    
    // Update cache
    dataCache.set(cacheKey, { data: result, timestamp: now })
    
    // Clear old cache entries
    if (dataCache.size > 10) {
      const oldestKey = Array.from(dataCache.keys())[0]
      dataCache.delete(oldestKey)
    }
    
    console.log(`✅ Fetched ${result.length} bars for ${timeframe}`)
    return result

  } catch (error) {
    console.error('❌ Error fetching data:', error)
    return []
  }
}

// Process and validate historical data
function processHistoricalData(data: any, limit: number): any[] {
  const historicalData: any[] = []

  Object.keys(data).forEach(key => {
    const item = data[key]
    
    if (!item || typeof item !== 'object') return

    const timestamp = item.timestamp || parseInt(key)
    
    if (!timestamp || !item.close) return

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

  // Sort by timestamp
  historicalData.sort((a, b) => a.timestamp - b.timestamp)

  // Take last N bars
  return historicalData.slice(-limit)
}

// Subscribe to OHLC updates with debouncing
let updateTimeout: NodeJS.Timeout | null = null

export function subscribeToOHLCUpdates(
  assetPath: string,
  timeframe: Timeframe,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  const config = TIMEFRAME_CONFIG[timeframe]
  if (!config) {
    console.error(`❌ Invalid timeframe: ${timeframe}`)
    return () => {}
  }

  const ohlcPath = `${assetPath}/${config.path}`
  const ohlcRef = ref(database, ohlcPath)
  
  console.log(`🔔 Subscribing to ${timeframe} updates`)
  
  // Track last bar to avoid duplicates
  let lastBarTimestamp: number | null = null
  
  const unsubscribe = onValue(ohlcRef, (snapshot) => {
    const data = snapshot.val()
    if (!data) return

    // Get the latest entry
    const keys = Object.keys(data).sort()
    const latestKey = keys[keys.length - 1]
    const latestData = data[latestKey]
    
    if (!latestData) return

    const barTimestamp = latestData.timestamp || parseInt(latestKey)
    
    // Skip if same bar
    if (barTimestamp === lastBarTimestamp) return
    
    lastBarTimestamp = barTimestamp

    // Debounce updates
    if (updateTimeout) clearTimeout(updateTimeout)
    
    updateTimeout = setTimeout(() => {
      callback({
        timestamp: barTimestamp,
        datetime: latestData.datetime,
        open: latestData.open,
        high: latestData.high,
        low: latestData.low,
        close: latestData.close,
        volume: latestData.volume || 0
      })
    }, 100) // 100ms debounce

  }, (error) => {
    console.error(`❌ Error subscribing to ${timeframe}:`, error)
  })

  return () => {
    console.log(`🔕 Unsubscribing from ${timeframe}`)
    if (updateTimeout) clearTimeout(updateTimeout)
    off(ohlcRef)
  }
}

// Subscribe to current price (for price ticker)
export function subscribeToPriceUpdates(
  path: string,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined') return () => {}

  console.log('🔔 Subscribing to price updates')
  const priceRef = ref(database, path)
  
  const unsubscribe = onValue(priceRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      callback(data)
    }
  }, (error) => {
    console.error('❌ Error subscribing to price:', error)
  })

  return () => {
    console.log('🔕 Unsubscribing from price updates')
    off(priceRef)
  }
}

// Get latest bar (for initialization)
export async function getLatestBar(
  assetPath: string,
  timeframe: Timeframe
): Promise<any | null> {
  if (typeof window === 'undefined') return null

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
    console.error('❌ Error getting latest bar:', error)
    return null
  }
}

// Clear cache manually
export function clearDataCache() {
  dataCache.clear()
  console.log('🗑️ Cache cleared')
}

// Test Firebase connection
export async function testFirebaseConnection(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  try {
    console.log('🔍 Testing Firebase connection...')
    const testRef = ref(database, '/test')
    await get(testRef)
    console.log('✅ Firebase connection successful')
    return true
  } catch (error) {
    console.error('❌ Firebase connection failed:', error)
    return false
  }
}