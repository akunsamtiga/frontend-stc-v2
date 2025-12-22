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

// ✅ SMART: Calculate how many raw bars needed based on timeframe
const TIMEFRAME_REQUIREMENTS = {
  '1m': { seconds: 60, barsNeeded: 200, rawBarsNeeded: 200 * 60 },      // 200 bars x 60s = 12,000 raw
  '5m': { seconds: 300, barsNeeded: 200, rawBarsNeeded: 200 * 300 },    // 200 bars x 300s = 60,000 raw
  '15m': { seconds: 900, barsNeeded: 200, rawBarsNeeded: 200 * 900 },   // 200 bars x 900s = 180,000 raw
  '1h': { seconds: 3600, barsNeeded: 200, rawBarsNeeded: 200 * 3600 },  // 200 bars x 3600s = 720,000 raw
  '4h': { seconds: 14400, barsNeeded: 200, rawBarsNeeded: 200 * 14400 },// 200 bars x 14400s = 2,880,000 raw
  '1d': { seconds: 86400, barsNeeded: 200, rawBarsNeeded: 200 * 86400 } // 200 bars x 86400s = 17,280,000 raw
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

// ✅ SMART: Fetch appropriate amount of data based on timeframe
export async function fetchHistoricalData(
  assetPath: string,
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1m'
): Promise<any[]> {
  if (typeof window === 'undefined') return []

  try {
    const requirements = TIMEFRAME_REQUIREMENTS[timeframe]
    
    // Cap to reasonable limits to prevent memory issues
    const maxLimit = 50000 // Firebase limit per query
    const limitToFetch = Math.min(requirements.rawBarsNeeded, maxLimit)
    
    console.log(`📊 Fetching for ${timeframe} timeframe:`)
    console.log(`   Need: ${requirements.barsNeeded} bars`)
    console.log(`   Fetching: ${limitToFetch} raw bars`)
    console.log(`   Time covered: ${(limitToFetch / 60).toFixed(0)} minutes`)
    
    const ohlcPath = `${assetPath}/ohlc`
    const ohlcRef = ref(database, ohlcPath)
    
    // Query with appropriate limit
    const historyQuery = query(ohlcRef, orderByKey(), limitToLast(limitToFetch))
    const snapshot = await get(historyQuery)
    
    if (!snapshot.exists()) {
      console.warn('⚠️ No historical data found at path:', ohlcPath)
      
      // Try alternative path
      console.log('🔄 Trying alternative path:', assetPath)
      const altRef = ref(database, assetPath)
      const altSnapshot = await get(query(altRef, orderByKey(), limitToLast(limitToFetch)))
      
      if (!altSnapshot.exists()) {
        console.error('❌ No data found at alternative path either')
        return []
      }
      
      const data = altSnapshot.val()
      console.log('✅ Found data at alternative path')
      return processHistoricalData(data, limitToFetch)
    }

    const data = snapshot.val()
    console.log(`✅ Raw data fetched. Keys count: ${Object.keys(data).length}`)
    
    return processHistoricalData(data, limitToFetch)

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

  console.log(`✅ Processed ${result.length} historical bars`)
  if (result.length > 0) {
    console.log(`   Date range: ${result[0]?.datetime} to ${result[result.length - 1]?.datetime}`)
  }

  return result
}

// Subscribe to OHLC updates (for new bars)
export function subscribeToOHLCUpdates(
  assetPath: string,
  callback: (data: any) => void
) {
  if (typeof window === 'undefined') return () => {}

  const ohlcPath = `${assetPath}/ohlc`
  const ohlcRef = ref(database, ohlcPath)
  
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

// Get all available data (for debugging)
export async function getAllData(assetPath: string): Promise<any> {
  if (typeof window === 'undefined') return null

  try {
    console.log(`🔍 Getting all data from: ${assetPath}`)
    const assetRef = ref(database, assetPath)
    const snapshot = await get(assetRef)
    
    if (!snapshot.exists()) {
      console.warn('⚠️ No data found')
      return null
    }

    const data = snapshot.val()
    console.log('📦 Data structure:', Object.keys(data))
    
    return data
  } catch (error) {
    console.error('❌ Error getting all data:', error)
    return null
  }
}