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
  console.log('🔥 Firebase initialized with URL:', process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL)
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

  console.log('🔔 Subscribing to price updates at:', path)
  const priceRef = ref(database, path)
  const unsubscribe = onValue(priceRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      console.log('📈 Price update received:', data.price)
      callback(data)
    }
  }, (error) => {
    console.error('❌ Error subscribing to price:', error)
  })

  return () => {
    console.log('🔕 Unsubscribing from:', path)
    off(priceRef)
  }
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

    // Try multiple path variations
    const pathsToTry = [
      `${assetPath}/${config.path}`, // /idx_stc/ohlc_1m
      `/${config.path}`, // /ohlc_1m
      `/idx_stc/${config.path}`, // Explicit path
    ]

    console.log(`📊 Fetching ${timeframe} data:`)
    console.log(`   Asset Path: ${assetPath}`)
    console.log(`   Timeframe: ${timeframe}`)
    console.log(`   Config Path: ${config.path}`)
    console.log(`   Bars needed: ${config.barsToFetch}`)
    
    for (const testPath of pathsToTry) {
      console.log(`🔍 Trying path: ${testPath}`)
      
      try {
        const ohlcRef = ref(database, testPath)
        const historyQuery = query(ohlcRef, orderByKey(), limitToLast(config.barsToFetch))
        const snapshot = await get(historyQuery)
        
        if (snapshot.exists()) {
          const data = snapshot.val()
          const dataKeys = Object.keys(data)
          console.log(`✅ Found data at: ${testPath}`)
          console.log(`   Bars found: ${dataKeys.length}`)
          
          if (dataKeys.length > 0) {
            // Show sample
            const firstKey = dataKeys[0]
            const lastKey = dataKeys[dataKeys.length - 1]
            console.log(`   First bar timestamp: ${firstKey} (${data[firstKey]?.datetime})`)
            console.log(`   Last bar timestamp: ${lastKey} (${data[lastKey]?.datetime})`)
            console.log(`   Sample data:`, data[firstKey])
            
            const result = processHistoricalData(data, config.barsToFetch)
            
            if (result.length > 0) {
              return result
            }
          }
        } else {
          console.log(`   ⚠️ No data at: ${testPath}`)
        }
      } catch (err) {
        console.log(`   ❌ Error at ${testPath}:`, err)
      }
    }
    
    // If we get here, no path worked
    console.error('❌ No data found in any path')
    console.log('💡 Debugging tips:')
    console.log('   1. Check Firebase Console: https://console.firebase.google.com')
    console.log('   2. Verify simulator is running: check simulator.log')
    console.log('   3. Check Firebase Database rules allow read access')
    console.log('   4. Expected structure: /idx_stc/ohlc_1m/{timestamp}/')
    
    // Try to check root structure
    await debugFirebaseStructure()
    
    return []

  } catch (error) {
    console.error('❌ Error fetching historical data:', error)
    return []
  }
}

// Debug function to inspect Firebase structure
async function debugFirebaseStructure() {
  try {
    console.log('🔍 Debugging Firebase structure...')
    
    // Check root
    const rootRef = ref(database, '/')
    const rootSnapshot = await get(rootRef)
    
    if (rootSnapshot.exists()) {
      const rootKeys = Object.keys(rootSnapshot.val())
      console.log('📁 Root level keys:', rootKeys)
      
      // Check idx_stc
      if (rootKeys.includes('idx_stc')) {
        const idxRef = ref(database, '/idx_stc')
        const idxSnapshot = await get(idxRef)
        
        if (idxSnapshot.exists()) {
          const idxKeys = Object.keys(idxSnapshot.val())
          console.log('📁 /idx_stc keys:', idxKeys)
          
          // Check for ohlc paths
          const ohlcKeys = idxKeys.filter(k => k.startsWith('ohlc_'))
          console.log('📊 OHLC timeframes found:', ohlcKeys)
          
          // Check first ohlc path
          if (ohlcKeys.length > 0) {
            const firstOhlc = ohlcKeys[0]
            const ohlcRef = ref(database, `/idx_stc/${firstOhlc}`)
            const ohlcSnapshot = await get(query(ohlcRef, limitToLast(1)))
            
            if (ohlcSnapshot.exists()) {
              console.log(`📋 Sample from /idx_stc/${firstOhlc}:`, ohlcSnapshot.val())
            }
          }
        }
      }
    } else {
      console.error('❌ Firebase root is empty!')
    }
  } catch (error) {
    console.error('❌ Debug error:', error)
  }
}

// Process and validate historical data
function processHistoricalData(data: any, limit: number): any[] {
  const historicalData: any[] = []

  // Convert object to array
  Object.keys(data).forEach(key => {
    const item = data[key]
    
    if (!item || typeof item !== 'object') {
      console.warn(`⚠️ Invalid item at key ${key}:`, item)
      return
    }

    const timestamp = item.timestamp || parseInt(key)
    
    if (!timestamp || !item.close) {
      console.warn(`⚠️ Missing required fields at key ${key}:`, item)
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
        console.log(`📊 New ${timeframe} bar:`, latestData.close)
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
  }, (error) => {
    console.error(`❌ Error subscribing to ${timeframe}:`, error)
  })

  return () => {
    console.log(`🔕 Unsubscribing from ${timeframe} updates`)
    off(ohlcRef)
  }
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

// Test Firebase connection
export async function testFirebaseConnection(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  
  try {
    console.log('🔍 Testing Firebase connection...')
    const testRef = ref(database, '/test')
    const snapshot = await get(testRef)
    console.log('✅ Firebase connection successful')
    return true
  } catch (error) {
    console.error('❌ Firebase connection failed:', error)
    return false
  }
}