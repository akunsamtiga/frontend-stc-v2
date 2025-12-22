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
}

export { database, ref, onValue, off }

// ✅ Timeframe mapping
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

const TIMEFRAME_CONFIG = {
  '1m': { path: 'ohlc_1m', barsToFetch: 200 },
  '5m': { path: 'ohlc_5m', barsToFetch: 200 },
  '15m': { path: 'ohlc_15m', barsToFetch: 200 },
  '1h': { path: 'ohlc_1h', barsToFetch: 200 },
  '4h': { path: 'ohlc_4h', barsToFetch: 150 },
  '1d': { path: 'ohlc_1d', barsToFetch: 100 }
}

// Subscribe to real-time price updates
export function subscribeToPriceUpdates(
  path: string,
  callback: (data: any) => void
) {
  if (typeof window === 'undefined') return () => {}

  const priceRef = ref(database, path)
  const unsubscribe = onValue(priceRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      callback(data)
    }
  })

  return () => off(priceRef)
}

// ✅ Fetch historical data from pre-aggregated timeframe
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

    console.log(`📊 Fetching ${timeframe} data from pre-aggregated path`)
    console.log(`   Path: ${assetPath}/${config.path}`)
    console.log(`   Bars needed: ${config.barsToFetch}`)
    
    const ohlcPath = `${assetPath}/${config.path}`
    const ohlcRef = ref(database, ohlcPath)
    
    // Query with appropriate limit
    const historyQuery = query(ohlcRef, orderByKey(), limitToLast(config.barsToFetch))
    const snapshot = await get(historyQuery)
    
    if (!snapshot.exists()) {
      console.warn('⚠️ No data found at path:', ohlcPath)
      
      // Try alternative paths
      console.log('🔄 Trying alternative paths...')
      
      // Try without asset prefix
      const altPath = `/${config.path}`
      const altRef = ref(database, altPath)
      const altSnapshot = await get(query(altRef, orderByKey(), limitToLast(config.barsToFetch)))
      
      if (!altSnapshot.exists()) {
        console.error('❌ No data found in alternative paths')
        console.log('💡 Make sure simulator is running with multi-timeframe mode')
        return []
      }
      
      const data = altSnapshot.val()
      console.log('✅ Found data at alternative path')
      return processHistoricalData(data, config.barsToFetch)
    }

    const data = snapshot.val()
    console.log(`✅ Fetched ${Object.keys(data).length} bars from ${timeframe} timeframe`)
    
    return processHistoricalData(data, config.barsToFetch)

  } catch (error) {
    console.error('❌ Error fetching historical data:', error)
    return []
  }
}

// Process and validate historical data
function processHistoricalData(data: any, limit: number): any[] {
  const historicalData: any[] = []

  // Convert object to array
  Object.keys(data).forEach(key => {
    const item = data[key]
    
    if (!item || typeof item !== 'object') {
      return
    }

    const timestamp = item.timestamp || parseInt(key)
    
    if (!timestamp || !item.close) {
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

  // Sort by timestamp ascending
  historicalData.sort((a, b) => a.timestamp - b.timestamp)

  // Take last N bars
  const result = historicalData.slice(-limit)

  console.log(`✅ Processed ${result.length} bars`)
  if (result.length > 0) {
    console.log(`   Date range: ${result[0]?.datetime} to ${result[result.length - 1]?.datetime}`)
  }

  return result
}

// ✅ Subscribe to timeframe-specific OHLC updates
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
    if (data) {
      // Get the latest entry
      const keys = Object.keys(data).sort()
      const latestKey = keys[keys.length - 1]
      const latestData = data[latestKey]
      
      if (latestData) {
        callback({
          timestamp: latestData.timestamp || parseInt(latestKey),
          datetime: latestData.datetime,
          open: latestData.open,
          high: latestData.high,
          low: latestData.low,
          close: latestData.close,
          volume: latestData.volume || 0
        })
      }
    }
  })

  return () => off(ohlcRef)
}

// ✅ Get latest bar from specific timeframe (for real-time updates)
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

// Debug helper
export async function checkAvailableTimeframes(assetPath: string): Promise<string[]> {
  if (typeof window === 'undefined') return []

  const available: string[] = []
  
  for (const [tf, config] of Object.entries(TIMEFRAME_CONFIG)) {
    try {
      const path = `${assetPath}/${config.path}`
      const testRef = ref(database, path)
      const snapshot = await get(query(testRef, limitToLast(1)))
      
      if (snapshot.exists()) {
        available.push(tf)
      }
    } catch (error) {
      // Path doesn't exist
    }
  }
  
  console.log('📊 Available timeframes:', available.join(', '))
  return available
}