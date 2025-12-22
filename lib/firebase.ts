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

// ✅ FIXED: Fetch historical OHLC data with better error handling and logging
export async function fetchHistoricalData(
  assetPath: string,
  limit: number = 1000 // Increased default limit
): Promise<any[]> {
  if (typeof window === 'undefined') return []

  try {
    console.log(`📊 Fetching historical data from: ${assetPath}`)
    console.log(`   Limit: ${limit} bars`)
    
    const ohlcPath = `${assetPath}/ohlc`
    const ohlcRef = ref(database, ohlcPath)
    
    // Query last N records
    const historyQuery = query(ohlcRef, orderByKey(), limitToLast(limit))
    const snapshot = await get(historyQuery)
    
    if (!snapshot.exists()) {
      console.warn('⚠️ No historical data found at path:', ohlcPath)
      
      // Try alternative path without /ohlc
      console.log('🔄 Trying alternative path:', assetPath)
      const altRef = ref(database, assetPath)
      const altSnapshot = await get(query(altRef, orderByKey(), limitToLast(limit)))
      
      if (!altSnapshot.exists()) {
        console.error('❌ No data found at alternative path either')
        return []
      }
      
      // Use alternative snapshot
      const data = altSnapshot.val()
      console.log('✅ Found data at alternative path')
      return processHistoricalData(data, limit)
    }

    const data = snapshot.val()
    console.log(`✅ Raw data fetched. Keys count: ${Object.keys(data).length}`)
    
    return processHistoricalData(data, limit)

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
    
    // Validate data structure
    if (!item || typeof item !== 'object') {
      console.warn('⚠️ Invalid data item:', key)
      return
    }

    // Handle both timestamp formats
    const timestamp = item.timestamp || parseInt(key)
    
    // Validate required fields
    if (!timestamp || !item.close) {
      console.warn('⚠️ Missing required fields:', { timestamp, close: item.close })
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
  console.log(`   Date range: ${result[0]?.datetime} to ${result[result.length - 1]?.datetime}`)

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
  
  // Listen for new data
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

// ✅ NEW: Get all available data (for debugging)
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