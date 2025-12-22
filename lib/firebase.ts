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

// Fetch historical OHLC data
export async function fetchHistoricalData(
  assetPath: string,
  limit: number = 500
): Promise<any[]> {
  if (typeof window === 'undefined') return []

  try {
    const ohlcPath = `${assetPath}/ohlc`
    const ohlcRef = ref(database, ohlcPath)
    
    // Query last N records
    const historyQuery = query(ohlcRef, orderByKey(), limitToLast(limit))
    const snapshot = await get(historyQuery)
    
    if (!snapshot.exists()) {
      console.log('No historical data found')
      return []
    }

    const data = snapshot.val()
    const historicalData: any[] = []

    // Convert object to array
    Object.keys(data).forEach(key => {
      const item = data[key]
      historicalData.push({
        timestamp: item.timestamp || parseInt(key),
        datetime: item.datetime,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume || 0
      })
    })

    // Sort by timestamp ascending
    historicalData.sort((a, b) => a.timestamp - b.timestamp)

    console.log(`✅ Loaded ${historicalData.length} historical bars from Firebase`)
    
    return historicalData

  } catch (error) {
    console.error('Error fetching historical data:', error)
    return []
  }
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