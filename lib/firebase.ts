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

// ✅ Timeframe configuration - OPTIMIZED
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

const TIMEFRAME_CONFIG: Record<Timeframe, { path: string; barsToFetch: number; updateInterval: number }> = {
  '1m': { path: 'ohlc_1m', barsToFetch: 100, updateInterval: 60000 }, // 1 min
  '5m': { path: 'ohlc_5m', barsToFetch: 100, updateInterval: 300000 }, // 5 min
  '15m': { path: 'ohlc_15m', barsToFetch: 100, updateInterval: 900000 }, // 15 min
  '1h': { path: 'ohlc_1h', barsToFetch: 80, updateInterval: 3600000 }, // 1 hour
  '4h': { path: 'ohlc_4h', barsToFetch: 60, updateInterval: 14400000 }, // 4 hours
  '1d': { path: 'ohlc_1d', barsToFetch: 50, updateInterval: 86400000 } // 1 day
}

// ✅ Cache untuk data
const dataCache = new Map<string, { data: any[], timestamp: number }>()
const CACHE_DURATION = 30000 // 30 seconds

// ✅ Fetch historical data - OPTIMIZED with cache
export async function fetchHistoricalData(
  assetPath: string,
  timeframe: Timeframe = '1m'
): Promise<any[]> {
  if (typeof window === 'undefined') return []

  const config = TIMEFRAME_CONFIG[timeframe]
  if (!config) {
    console.error(`❌ Invalid timeframe: ${timeframe}`)
    return []
  }

  // Check cache first
  const cacheKey = `${assetPath}_${timeframe}`
  const cached = dataCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 Using cached data for ${timeframe}`)
    return cached.data
  }

  try {
    const pathsToTry = [
      `${assetPath}/${config.path}`,
      `/${config.path}`,
      `/idx_stc/${config.path}`,
    ]

    console.log(`📊 Fetching ${timeframe} data (${config.barsToFetch} bars)...`)

    for (const testPath of pathsToTry) {
      try {
        const ohlcRef = ref(database, testPath)
        const historyQuery = query(ohlcRef, orderByKey(), limitToLast(config.barsToFetch))
        const snapshot = await get(historyQuery)

        if (snapshot.exists()) {
          const data = snapshot.val()
          const processed = processHistoricalData(data, config.barsToFetch)

          if (processed.length > 0) {
            console.log(`✅ Loaded ${processed.length} bars from ${testPath}`)
            
            // Cache the result
            dataCache.set(cacheKey, { data: processed, timestamp: Date.now() })
            
            return processed
          }
        }
      } catch (err) {
        console.log(`⚠️ Path ${testPath} failed, trying next...`)
      }
    }

    console.error('❌ No data found in any path')
    return []

  } catch (error) {
    console.error('❌ Error fetching data:', error)
    return []
  }
}

// ✅ Process historical data - OPTIMIZED
function processHistoricalData(data: any, limit: number): any[] {
  if (!data || typeof data !== 'object') return []

  const historicalData: any[] = []
  const keys = Object.keys(data).sort((a, b) => parseInt(a) - parseInt(b))

  // Process only the most recent bars
  const startIndex = Math.max(0, keys.length - limit)
  
  for (let i = startIndex; i < keys.length; i++) {
    const key = keys[i]
    const item = data[key]

    if (!item || typeof item !== 'object') continue

    const timestamp = item.timestamp || parseInt(key)
    if (!timestamp || !item.close) continue

    historicalData.push({
      timestamp: timestamp,
      datetime: item.datetime || new Date(timestamp * 1000).toISOString(),
      open: parseFloat(item.open) || parseFloat(item.close),
      high: parseFloat(item.high) || parseFloat(item.close),
      low: parseFloat(item.low) || parseFloat(item.close),
      close: parseFloat(item.close),
      volume: parseInt(item.volume) || 0
    })
  }

  return historicalData
}

// ✅ Subscribe to real-time price updates
export function subscribeToPriceUpdates(
  path: string,
  callback: (data: any) => void
) {
  if (typeof window === 'undefined') return () => {}

  console.log('🔔 Subscribing to price updates:', path)
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

// ✅ Subscribe to OHLC updates - OPTIMIZED with debounce
let updateTimeout: NodeJS.Timeout | null = null

export function subscribeToOHLCUpdates(
  assetPath: string,
  timeframe: Timeframe,
  callback: (data: any) => void
) {
  if (typeof window === 'undefined') return () => {}

  const config = TIMEFRAME_CONFIG[timeframe]
  if (!config) {
    console.error(`❌ Invalid timeframe: ${timeframe}`)
    return () => {}
  }

  const ohlcPath = `${assetPath}/${config.path}`
  const ohlcRef = ref(database, ohlcPath)

  console.log(`🔔 Subscribing to ${timeframe} updates at: ${ohlcPath}`)

  const unsubscribe = onValue(ohlcRef, (snapshot) => {
    const data = snapshot.val()
    if (!data) return

    // Debounce updates untuk performa
    if (updateTimeout) clearTimeout(updateTimeout)
    
    updateTimeout = setTimeout(() => {
      const keys = Object.keys(data).sort()
      const latestKey = keys[keys.length - 1]
      const latestData = data[latestKey]

      if (latestData) {
        callback({
          timestamp: latestData.timestamp || parseInt(latestKey),
          datetime: latestData.datetime,
          open: parseFloat(latestData.open),
          high: parseFloat(latestData.high),
          low: parseFloat(latestData.low),
          close: parseFloat(latestData.close),
          volume: parseInt(latestData.volume) || 0
        })
      }
    }, 500) // 500ms debounce
  }, (error) => {
    console.error(`❌ ${timeframe} subscription error:`, error)
  })

  return () => {
    if (updateTimeout) clearTimeout(updateTimeout)
    console.log(`🔕 Unsubscribing from ${timeframe} updates`)
    off(ohlcRef)
  }
}

// ✅ Get latest bar - OPTIMIZED
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
      open: parseFloat(latestData.open),
      high: parseFloat(latestData.high),
      low: parseFloat(latestData.low),
      close: parseFloat(latestData.close),
      volume: parseInt(latestData.volume) || 0
    }
  } catch (error) {
    console.error('❌ Error getting latest bar:', error)
    return null
  }
}

// ✅ Clear cache
export function clearCache() {
  dataCache.clear()
  console.log('🗑️ Cache cleared')
}

// ✅ Test connection
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