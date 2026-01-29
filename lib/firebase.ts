// lib/firebase.ts - UNLIMITED VERSION - No chart limits, load all history

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getDatabase, Database, ref, onValue, off, query, limitToLast, get } from 'firebase/database'
import type { Timeframe } from '@/types'

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
    console.log('Firebase initialized - UNLIMITED MODE')
  } catch (error) {
    console.error('Firebase init error:', error)
  }
}

export { database, ref, onValue, off, query, limitToLast, get }

interface PendingRequest {
  promise: Promise<any>
  timestamp: number
}

const pendingRequests = new Map<string, PendingRequest>()
const REQUEST_TIMEOUT = 10000

function deduplicateRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const now = Date.now()
  for (const [k, req] of pendingRequests.entries()) {
    if (now - req.timestamp > REQUEST_TIMEOUT) {
      pendingRequests.delete(k)
    }
  }

  const pending = pendingRequests.get(key)
  
  if (pending) {
    return pending.promise as Promise<T>
  }
  
  const promise = fn().finally(() => {
    pendingRequests.delete(key)
  })
  
  pendingRequests.set(key, {
    promise,
    timestamp: now,
  })
  
  return promise
}

interface CacheEntry {
  data: any
  timestamp: number
}

class FastMemoryCache {
  private cache = new Map<string, CacheEntry>()
  private readonly CACHE_TTL = 300000 // 5 min normal
  private readonly STALE_TTL = 1800000 // 30 min stale
  private readonly MAX_SIZE = 200 // Increased for unlimited data

  get(key: string): any | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }
    
    const age = Date.now() - entry.timestamp
    
    if (age <= this.CACHE_TTL) {
      return entry.data
    }
    
    if (age <= this.STALE_TTL) {
      return entry.data
    }
    
    this.cache.delete(key)
    return null
  }

  getStale(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null
    
    const age = Date.now() - entry.timestamp
    if (age > this.STALE_TTL) {
      this.cache.delete(key)
      return null
    }
    
    return entry.data
  }

  set(key: string, data: any): void {
    if (this.cache.size >= this.MAX_SIZE) {
      this.cleanup()
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    })
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    console.log('Memory cache cleared')
  }

  private cleanup(): void {
    const now = Date.now()
    let deletedCount = 0
    
    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp
      
      if (age > this.STALE_TTL) {
        this.cache.delete(key)
        deletedCount++
      }
    }
    
    if (this.cache.size >= this.MAX_SIZE) {
      const entries = Array.from(this.cache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toDelete = entries.slice(0, Math.floor(this.MAX_SIZE / 4))
      toDelete.forEach(([key]) => this.cache.delete(key))
      deletedCount += toDelete.length
    }
    
    if (deletedCount > 0) {
      console.log(`Cleaned ${deletedCount} cache entries`)
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_SIZE,
      ttl: this.CACHE_TTL,
    }
  }
}

const memoryCache = new FastMemoryCache()

// ✅ Data buffer for network lag tolerance
interface BufferedData {
  timestamp: number
  data: any
  receivedAt: number
}

class DataBuffer {
  private buffer: Map<string, BufferedData[]> = new Map()
  private readonly MAX_BUFFER_SIZE = 100
  private readonly BUFFER_FLUSH_INTERVAL = 1000

  add(key: string, data: any, timestamp: number) {
    if (!this.buffer.has(key)) {
      this.buffer.set(key, [])
    }
    
    const buffer = this.buffer.get(key)!
    buffer.push({
      timestamp,
      data,
      receivedAt: Date.now()
    })
    
    if (buffer.length > this.MAX_BUFFER_SIZE) {
      buffer.shift()
    }
  }

  flush(key: string): any[] {
    const buffer = this.buffer.get(key)
    if (!buffer || buffer.length === 0) return []
    
    const sorted = buffer.sort((a, b) => a.timestamp - b.timestamp)
    this.buffer.set(key, [])
    
    return sorted.map(item => item.data)
  }

  getLastTimestamp(key: string): number | null {
    const buffer = this.buffer.get(key)
    if (!buffer || buffer.length === 0) return null
    
    return Math.max(...buffer.map(item => item.timestamp))
  }

  clear(key: string) {
    this.buffer.delete(key)
  }
}

const dataBuffer = new DataBuffer()

// ✅ Connection state tracker
class ConnectionTracker {
  private connected = true
  private lastDisconnect: number | null = null
  private lastConnect: number | null = null

  setConnected(state: boolean) {
    if (state !== this.connected) {
      if (state) {
        this.lastConnect = Date.now()
        console.log('📡 Connection restored')
      } else {
        this.lastDisconnect = Date.now()
        console.log('📡 Connection lost')
      }
      this.connected = state
    }
  }

  isConnected() {
    return this.connected
  }

  getDowntimeDuration() {
    if (!this.lastDisconnect || !this.lastConnect) return 0
    if (this.lastConnect < this.lastDisconnect) return Date.now() - this.lastDisconnect
    return this.lastConnect - this.lastDisconnect
  }

  wasDisconnectedRecently(threshold = 5000) {
    if (!this.lastConnect) return false
    return Date.now() - this.lastConnect < threshold
  }
}

const connectionTracker = new ConnectionTracker()

function cleanAssetPath(path: string): string {
  if (!path) return ''
  
  if (path.endsWith('/current_price')) {
    path = path.replace('/current_price', '')
  }
  
  path = path.replace(/\/$/, '')
  
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  
  return path
}

// ✅ REMOVED LIMIT - Process ALL data without restrictions
function processHistoricalData(rawData: any): any[] {
  if (!rawData || typeof rawData !== 'object') {
    return []
  }

  const isArray = Array.isArray(rawData)
  let bars: any[] = []
  
  if (isArray) {
    bars = rawData.filter(item => 
      item && 
      typeof item === 'object' && 
      item.timestamp && 
      typeof item.close === 'number' &&
      item.close > 0
    ).map(item => ({
      timestamp: item.timestamp,
      datetime: item.datetime || new Date(item.timestamp * 1000).toISOString(),
      open: item.open || item.close,
      high: item.high || item.close,
      low: item.low || item.close,
      close: item.close,
      volume: item.volume || 0,
    }))
  } else {
    bars = Object.entries(rawData)
      .filter(([_, item]: [string, any]) => 
        item && 
        typeof item === 'object' && 
        typeof item.close === 'number' &&
        item.close > 0
      )
      .map(([key, item]: [string, any]) => ({
        timestamp: parseInt(key) || item.timestamp,
        datetime: item.datetime || new Date((parseInt(key) || item.timestamp) * 1000).toISOString(),
        open: item.open || item.close,
        high: item.high || item.close,
        low: item.low || item.close,
        close: item.close,
        volume: item.volume || 0,
      }))
  }

  if (bars.length === 0) {
    return []
  }

  bars.sort((a, b) => a.timestamp - b.timestamp)
  
  // ✅ RETURN ALL DATA - No limit applied
  console.log(`✅ Processing ALL ${bars.length} candles without limit`)
  return bars
}

// ✅ REMOVED LIMITS - Load all available history
const TIMEFRAME_CONFIGS: Record<Timeframe, { 
  seconds: number
  cacheStrategy: 'aggressive' | 'moderate' | 'normal'
}> = {
  '1s': { seconds: 1, cacheStrategy: 'aggressive' }, 
  '1m': { seconds: 60, cacheStrategy: 'aggressive' },
  '5m': { seconds: 300, cacheStrategy: 'moderate' },
  '15m': { seconds: 900, cacheStrategy: 'moderate' },
  '30m': { seconds: 1800, cacheStrategy: 'moderate' },
  '1h': { seconds: 3600, cacheStrategy: 'normal' },
  '4h': { seconds: 14400, cacheStrategy: 'normal' },
  '1d': { seconds: 86400, cacheStrategy: 'normal' }
}

// ✅ Gap detection and filling (no limit)
async function detectAndFillGaps(
  assetPath: string,
  timeframe: Timeframe,
  existingData: any[]
): Promise<any[]> {
  if (existingData.length < 2) return existingData

  const config = TIMEFRAME_CONFIGS[timeframe]
  const expectedInterval = config.seconds
  
  const gaps: { start: number; end: number }[] = []
  
  for (let i = 1; i < existingData.length; i++) {
    const timeDiff = existingData[i].timestamp - existingData[i - 1].timestamp
    
    if (timeDiff > expectedInterval * 1.5) {
      gaps.push({
        start: existingData[i - 1].timestamp,
        end: existingData[i].timestamp
      })
    }
  }
  
  if (gaps.length === 0) return existingData
  
  console.log(`🔍 Detected ${gaps.length} gaps in ${timeframe} data`)
  
  try {
    const cleanPath = cleanAssetPath(assetPath)
    const ohlcPath = `${cleanPath}/ohlc_${timeframe}`
    const snapshot = await get(ref(database, ohlcPath))
    
    if (!snapshot.exists()) return existingData
    
    const allData = snapshot.val()
    const processed = processHistoricalData(allData) // ✅ No limit
    
    const merged = [...existingData]
    
    for (const gap of gaps) {
      const fillData = processed.filter(
        item => item.timestamp > gap.start && item.timestamp < gap.end
      )
      
      if (fillData.length > 0) {
        merged.push(...fillData)
        console.log(`✅ Filled gap: ${fillData.length} candles`)
      }
    }
    
    const unique = Array.from(
      new Map(merged.map(item => [item.timestamp, item])).values()
    ).sort((a, b) => a.timestamp - b.timestamp)
    
    return unique
    
  } catch (error) {
    console.error('Gap filling failed:', error)
    return existingData
  }
}

// ✅ FETCH ALL HISTORICAL DATA - No limits
export async function fetchHistoricalData(
  assetPath: string,
  timeframe: Timeframe = '1m'
): Promise<any[]> {
  if (typeof window === 'undefined' || !database) {
    return []
  }

  try {
    const cleanPath = cleanAssetPath(assetPath)
    const cacheKey = `${cleanPath}-${timeframe}-unlimited`

    const cached = memoryCache.get(cacheKey)
    if (cached) {
      if (connectionTracker.wasDisconnectedRecently()) {
        console.log('🔄 Recently reconnected, verifying cache freshness...')
        setTimeout(() => {
          fetchHistoricalData(assetPath, timeframe)
            .catch(err => console.log('Background refresh failed:', err))
        }, 0)
      }
      return cached
    }

    return await deduplicateRequest(cacheKey, async () => {
      console.log(`🔥 Fetching ALL ${timeframe} data (NO LIMIT)...`)
      const startTime = Date.now()
      
      const ohlcPath = `${cleanPath}/ohlc_${timeframe}`
      
      // ✅ NO LIMIT - Get all data from Firebase
      const snapshot = await get(ref(database, ohlcPath))
      
      if (!snapshot.exists()) {
        console.warn(`No data at: ${ohlcPath}`)
        return []
      }
      
      const rawData = snapshot.val()
      
      // ✅ Process ALL data without limit
      let processed = processHistoricalData(rawData)
      
      // ✅ Fill gaps
      processed = await detectAndFillGaps(cleanPath, timeframe, processed)
      
      if (processed.length > 0) {
        memoryCache.set(cacheKey, processed)
      }
      
      const duration = Date.now() - startTime
      console.log(`✅ Fetched ALL ${processed.length} ${timeframe} bars in ${duration}ms (UNLIMITED)`)
      
      return processed
    })

  } catch (error: any) {
    console.error(`Fetch error for ${timeframe}:`, error.message)
    
    const cacheKey = `${cleanAssetPath(assetPath)}-${timeframe}-unlimited`
    const stale = memoryCache.getStale(cacheKey)
    if (stale) {
      console.log('⚠️ Using stale cache due to fetch error')
      return stale
    }
    
    return []
  }
}

export async function fetchHistoricalDataWithStale(
  assetPath: string,
  timeframe: Timeframe = '1m'
): Promise<{ data: any[], isStale: boolean }> {
  if (typeof window === 'undefined' || !database) {
    return { data: [], isStale: false }
  }

  try {
    const cleanPath = cleanAssetPath(assetPath)
    const cacheKey = `${cleanPath}-${timeframe}-unlimited`

    const cached = memoryCache.get(cacheKey)
    if (cached) {
      return { data: cached, isStale: false }
    }

    const stale = memoryCache.getStale(cacheKey)
    if (stale) {
      setTimeout(() => {
        fetchHistoricalData(assetPath, timeframe)
      }, 0)
      
      return { data: stale, isStale: true }
    }

    const data = await fetchHistoricalData(assetPath, timeframe)
    return { data, isStale: false }

  } catch (error: any) {
    console.error(`Fetch error for ${timeframe}:`, error.message)
    return { data: [], isStale: false }
  }
}

// ✅ Backfill missing data after reconnection (no limit)
async function backfillMissingData(
  assetPath: string,
  timeframe: Timeframe,
  lastKnownTimestamp: number
): Promise<any[]> {
  try {
    const cleanPath = cleanAssetPath(assetPath)
    const ohlcPath = `${cleanPath}/ohlc_${timeframe}`
    
    console.log(`🔄 Backfilling data from ${lastKnownTimestamp}...`)
    
    const snapshot = await get(ref(database, ohlcPath))
    if (!snapshot.exists()) return []
    
    const rawData = snapshot.val()
    const allData = processHistoricalData(rawData) // ✅ No limit
    
    const missingData = allData.filter(
      item => item.timestamp > lastKnownTimestamp
    )
    
    if (missingData.length > 0) {
      console.log(`✅ Backfilled ${missingData.length} candles`)
    }
    
    return missingData
    
  } catch (error) {
    console.error('Backfill failed:', error)
    return []
  }
}

export function subscribeTo1sOHLC(
  assetPath: string,
  callback: (data: any) => void
): () => void {
  console.log('Starting ULTRA-FAST 1s OHLC subscription (UNLIMITED)...')
  return subscribeToOHLCUpdates(assetPath, '1s', callback)
}

export function subscribeToOHLCUpdates(
  assetPath: string,
  timeframe: Timeframe,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined' || !database) {
    return () => {}
  }

  const cleanPath = cleanAssetPath(assetPath)
  const ohlcPath = `${cleanPath}/ohlc_${timeframe}`
  const ohlcRef = ref(database, ohlcPath)
  
  let lastTimestamp: number | null = null
  let lastData: any = null
  let reconnectBackfillDone = false
  
  const bufferKey = `${cleanPath}-${timeframe}`
  
  const unsubscribe = onValue(ohlcRef, async (snapshot) => {
    const data = snapshot.val()
    if (!data) return

    connectionTracker.setConnected(true)

    // ✅ RECONNECTION BACKFILL (no limit)
    if (connectionTracker.wasDisconnectedRecently(10000) && !reconnectBackfillDone) {
      if (lastTimestamp) {
        console.log('🔄 Reconnected, backfilling ALL missing data...')
        const missingData = await backfillMissingData(cleanPath, timeframe, lastTimestamp)
        
        for (const missedBar of missingData) {
          callback({
            ...missedBar,
            isNewBar: true,
            isBackfilled: true
          })
        }
      }
      reconnectBackfillDone = true
      setTimeout(() => { reconnectBackfillDone = false }, 30000)
    }

    const isArray = Array.isArray(data)
    const latestBar = isArray 
      ? data[data.length - 1]
      : data[Object.keys(data).sort().pop()!]
    
    if (!latestBar || !latestBar.close) return

    const timestamp = latestBar.timestamp || 
                     (isArray ? data.length - 1 : parseInt(Object.keys(data).pop()!))
    
    const isNewBar = timestamp !== lastTimestamp
    
    const hasChanged = !lastData || 
                      lastData.open !== latestBar.open ||
                      lastData.high !== latestBar.high ||
                      lastData.low !== latestBar.low ||
                      lastData.close !== latestBar.close
    
    if (isNewBar || hasChanged) {
      dataBuffer.add(bufferKey, {
        timestamp,
        datetime: latestBar.datetime || new Date(timestamp * 1000).toISOString(),
        open: latestBar.open || latestBar.close,
        high: latestBar.high || latestBar.close,
        low: latestBar.low || latestBar.close,
        close: latestBar.close,
        volume: latestBar.volume || 0,
        isNewBar,
        isCompleted: latestBar.isCompleted || false,
      }, timestamp)
      
      lastTimestamp = timestamp
      lastData = latestBar
      
      callback({
        timestamp,
        datetime: latestBar.datetime || new Date(timestamp * 1000).toISOString(),
        open: latestBar.open || latestBar.close,
        high: latestBar.high || latestBar.close,
        low: latestBar.low || latestBar.close,
        close: latestBar.close,
        volume: latestBar.volume || 0,
        isNewBar,
        isCompleted: latestBar.isCompleted || false,
      })
      
      if (isNewBar) {
        const cacheKey = `${cleanPath}-${timeframe}-unlimited`
        memoryCache.delete(cacheKey)
      }
    }
  }, (error) => {
    console.error(`OHLC subscription error (${timeframe}):`, error)
    connectionTracker.setConnected(false)
  })

  return () => {
    off(ohlcRef)
    dataBuffer.clear(bufferKey)
  }
}

// ✅ Prefetch ALL timeframes without limits
export async function prefetchMultipleTimeframes(
  assetPath: string,
  timeframes: Timeframe[] = ['1s', '1m', '5m']
): Promise<Map<Timeframe, any[]>> {
  const results = new Map<Timeframe, any[]>()
  
  console.log(`🔥 Prefetching ${timeframes.length} timeframes (UNLIMITED)...`)
  const startTime = Date.now()
  
  const sorted = [...timeframes].sort((a, b) => {
    if (a === '1s') return -1
    if (b === '1s') return 1
    return 0
  })
  
  const promises = sorted.map(tf => 
    fetchHistoricalData(assetPath, tf)
      .then(data => ({ tf, data, success: true }))
      .catch(error => ({ tf, data: [], success: false, error }))
  )
  
  const settled = await Promise.allSettled(promises)
  
  settled.forEach(result => {
    if (result.status === 'fulfilled') {
      const { tf, data } = result.value
      results.set(tf, data)
      
      if (data.length === 0) {
        console.warn(`No data for ${tf}`)
      } else {
        console.log(`✅ Loaded ${data.length} ${tf} candles (UNLIMITED)`)
      }
    } else {
      console.error(`Prefetch failed:`, result.reason)
    }
  })
  
  const duration = Date.now() - startTime
  const successful = Array.from(results.values()).filter(d => d.length > 0).length
  
  console.log(`✅ Prefetched ${successful}/${timeframes.length} timeframes in ${duration}ms (UNLIMITED MODE)`)
  
  return results
}

export function subscribeToPriceUpdates(
  assetPath: string,
  callback: (data: any) => void
): () => void {
  if (typeof window === 'undefined' || !database) {
    return () => {}
  }

  const cleanPath = cleanAssetPath(assetPath)
  const pricePath = `${cleanPath}/current_price`
  const priceRef = ref(database, pricePath)
  
  let lastPrice: number | null = null
  let lastTimestamp: number | null = null
  
  const unsubscribe = onValue(priceRef, (snapshot) => {
    const data = snapshot.val()
    if (!data || !data.price) return
    
    connectionTracker.setConnected(true)
    
    const isDuplicate = lastPrice !== null && 
                       lastTimestamp === data.timestamp &&
                       Math.abs(data.price - lastPrice) < 0.000001
    
    if (isDuplicate) return
    
    lastPrice = data.price
    lastTimestamp = data.timestamp
    
    callback(data)
    
  }, (error) => {
    console.error('Price subscription error:', error)
    connectionTracker.setConnected(false)
  })

  return () => {
    off(priceRef)
  }
}

export async function prefetchDefaultAsset(assetPath: string): Promise<void> {
  const cleanPath = cleanAssetPath(assetPath)
  await prefetchMultipleTimeframes(cleanPath, ['1m', '5m'])
}

export async function clearDataCache(): Promise<void> {
  memoryCache.clear()
  pendingRequests.clear()
  console.log('All caches cleared')
}

export function getCacheStats() {
  return {
    memory: memoryCache.getStats(),
    pending: pendingRequests.size,
    connected: connectionTracker.isConnected(),
    lastDowntime: connectionTracker.getDowntimeDuration(),
  }
}

if (typeof window !== 'undefined') {
  (window as any).firebaseDebug = {
    getCacheStats,
    clearDataCache,
    memoryCache,
    pendingRequests,
    connectionTracker,
    dataBuffer,
  }
}

if (typeof window !== 'undefined') {
  setInterval(() => {
    const stats = memoryCache.getStats()
    
    if (stats.size > stats.maxSize * 0.8) {
      console.log('Auto-cleanup triggered')
      memoryCache.clear()
    }
  }, 60000)
}

export const SUPPORTS_1S_TRADING = true
export const ULTRA_FAST_TIMEFRAME = '1s' as Timeframe
export const UNLIMITED_HISTORY = true // ✅ NEW FLAG