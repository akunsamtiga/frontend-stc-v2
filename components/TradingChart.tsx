// components/TradingChart.tsx - COMPLETE VERSION with OrderPriceTracker Integration
'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts'
import { useTradingStore, useTradingActions } from '@/store/trading'
import { fetchHistoricalData, subscribeToOHLCUpdates, prefetchMultipleTimeframes } from '@/lib/firebase'
import { BinaryOrder, TIMEFRAMES, Timeframe as TimeframeType } from '@/types'
import { database, ref, get } from '@/lib/firebase'
import { formatPriceAuto } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { Maximize2, Minimize2, RefreshCw, Activity, ChevronDown, Server, Sliders, Clock, BarChart2 } from 'lucide-react'
import AssetIcon from '@/components/common/AssetIcon'
import OrderPriceTracker from '@/components/OrderPriceTracker'
import { useChartPriceScale } from '@/hooks/useChartPriceScale'

const IndicatorControls = dynamic(() => import('./IndicatorControls'), { ssr: false })

type ChartType = 'line' | 'candle'
type Timeframe = TimeframeType

interface TradingChartProps {
  activeOrders?: BinaryOrder[]
  currentPrice?: number
  assets?: any[]
  onAssetSelect?: (asset: any) => void
}

interface IndicatorConfig {
  sma?: { enabled: boolean; period: number; color: string }
  ema?: { enabled: boolean; period: number; color: string }
  bollinger?: { enabled: boolean; period: number; stdDev: number; colorUpper: string; colorMiddle: string; colorLower: string }
  rsi?: { enabled: boolean; period: number; overbought: number; oversold: number }
  macd?: { enabled: boolean; fastPeriod: number; slowPeriod: number; signalPeriod: number }
  volume?: { enabled: boolean; maPeriod: number }
  stochastic?: { enabled: boolean; kPeriod: number; dPeriod: number; overbought: number; oversold: number }
  atr?: { enabled: boolean; period: number }
}

const DEFAULT_INDICATOR_CONFIG: IndicatorConfig = {
  sma: { enabled: false, period: 20, color: '#3b82f6' },
  ema: { enabled: false, period: 20, color: '#f59e0b' },
  bollinger: { enabled: false, period: 20, stdDev: 2, colorUpper: '#ef4444', colorMiddle: '#6b7280', colorLower: '#10b981' },
  rsi: { enabled: false, period: 14, overbought: 70, oversold: 30 },
  macd: { enabled: false, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  volume: { enabled: false, maPeriod: 20 },
  stochastic: { enabled: false, kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20 },
  atr: { enabled: false, period: 14 }
}

interface CandleData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
  isCompleted?: boolean
}

interface AnimatedCandle extends CandleData {
  targetHigh: number
  targetLow: number
  targetClose: number
  isAnimating: boolean
}

const ChartSkeleton = memo(({ timeframe, assetSymbol }: { timeframe: Timeframe; assetSymbol: string }) => {
  return (
    <div className="absolute inset-0 bg-[#0a0e17] z-30 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-800/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-800 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-800 rounded animate-pulse" />
            <div className="h-3 w-16 bg-gray-800/50 rounded animate-pulse" />
          </div>
        </div>
        <div className="h-6 w-32 bg-gray-800 rounded animate-pulse" />
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />

        <div className="absolute inset-0 flex items-end justify-center pb-20 px-10 gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div 
              key={i}
              className="bg-gray-800/60 rounded-sm animate-pulse"
              style={{
                width: '8px',
                height: `${Math.random() * 60 + 20}%`,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-800 rounded-full" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/30 rounded-full border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 m-auto w-8 h-8 bg-blue-500/20 rounded-full animate-ping" />
          </div>
          
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm font-medium text-gray-300">
              Loading {timeframe} Chart
            </p>
            <p className="text-xs text-gray-500">
              {assetSymbol}
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
})

ChartSkeleton.displayName = 'ChartSkeleton'

function calculateSMA(data: Array<{ time: UTCTimestamp; close: number }>, period: number): Array<{ time: UTCTimestamp; value: number }> {
  const result: Array<{ time: UTCTimestamp; value: number }> = []
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close
    }
    result.push({ time: data[i].time, value: sum / period })
  }
  
  return result
}

function calculateEMA(data: Array<{ time: UTCTimestamp; close: number }>, period: number): Array<{ time: UTCTimestamp; value: number }> {
  const result: Array<{ time: UTCTimestamp; value: number }> = []
  const multiplier = 2 / (period + 1)
  
  let sum = 0
  for (let i = 0; i < Math.min(period, data.length); i++) {
    sum += data[i].close
  }
  let ema = sum / Math.min(period, data.length)
  
  if (data.length >= period) {
    result.push({ time: data[period - 1].time, value: ema })
  }
  
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema
    result.push({ time: data[i].time, value: ema })
  }
  
  return result
}

function calculateBollingerBands(
  data: Array<{ time: UTCTimestamp; close: number }>, 
  period: number, 
  stdDev: number
): {
  upper: Array<{ time: UTCTimestamp; value: number }>
  middle: Array<{ time: UTCTimestamp; value: number }>
  lower: Array<{ time: UTCTimestamp; value: number }>
} {
  const upper: Array<{ time: UTCTimestamp; value: number }> = []
  const middle: Array<{ time: UTCTimestamp; value: number }> = []
  const lower: Array<{ time: UTCTimestamp; value: number }> = []
  
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close
    }
    const sma = sum / period
    
    let squaredDiffSum = 0
    for (let j = 0; j < period; j++) {
      const diff = data[i - j].close - sma
      squaredDiffSum += diff * diff
    }
    const sd = Math.sqrt(squaredDiffSum / period)
    
    const time = data[i].time
    upper.push({ time, value: sma + (stdDev * sd) })
    middle.push({ time, value: sma })
    lower.push({ time, value: sma - (stdDev * sd) })
  }
  
  return { upper, middle, lower }
}

class LoadingStateManager {
  private isLoading = false
  private loadingTimeouts: NodeJS.Timeout[] = []
  private updateCallback: ((loading: boolean) => void) | null = null

  setCallback(callback: (loading: boolean) => void) {
    this.updateCallback = callback
  }

  setLoading(loading: boolean, delay: number = 0) {
    this.clearTimeouts()

    if (delay > 0) {
      const timeout = setTimeout(() => {
        this.isLoading = loading
        this.updateCallback?.(loading)
      }, delay)
      this.loadingTimeouts.push(timeout)
    } else {
      this.isLoading = loading
      this.updateCallback?.(loading)
    }
  }

  getLoading(): boolean {
    return this.isLoading
  }

  clearTimeouts() {
    this.loadingTimeouts.forEach(t => clearTimeout(t))
    this.loadingTimeouts = []
  }

  reset() {
    this.clearTimeouts()
    this.isLoading = false
    this.updateCallback?.(false)
  }
}

class SmoothCandleAnimator {
  private currentCandle: AnimatedCandle | null = null
  private animationFrame: number | null = null
  private duration: number = 300
  private startTime: number = 0
  private onUpdate: (candle: CandleData) => void
  private initialHigh: number = 0
  private initialLow: number = 0
  private initialClose: number = 0

  constructor(onUpdate: (candle: CandleData) => void, duration: number = 300) {
    this.onUpdate = onUpdate
    this.duration = duration
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  updateCandle(newCandle: CandleData) {
    if (!this.currentCandle || this.currentCandle.timestamp !== newCandle.timestamp) {
      this.currentCandle = {
        ...newCandle,
        targetHigh: newCandle.high,
        targetLow: newCandle.low,
        targetClose: newCandle.close,
        isAnimating: false,
      }
      
      this.onUpdate({
        timestamp: newCandle.timestamp,
        open: newCandle.open,
        high: newCandle.high,
        low: newCandle.low,
        close: newCandle.close,
        volume: newCandle.volume,
      })
      
      return
    }

    const hasChanges = 
      this.currentCandle.high !== newCandle.high ||
      this.currentCandle.low !== newCandle.low ||
      this.currentCandle.close !== newCandle.close

    if (!hasChanges) return

    this.initialHigh = this.currentCandle.high
    this.initialLow = this.currentCandle.low
    this.initialClose = this.currentCandle.close

    this.currentCandle.targetHigh = newCandle.high
    this.currentCandle.targetLow = newCandle.low
    this.currentCandle.targetClose = newCandle.close
    this.currentCandle.volume = newCandle.volume
    this.currentCandle.isAnimating = true

    this.startAnimation()
  }

  private startAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }

    this.startTime = performance.now()

    const animate = (currentTime: number) => {
      if (!this.currentCandle || !this.currentCandle.isAnimating) return

      const elapsed = currentTime - this.startTime
      const progress = Math.min(elapsed / this.duration, 1)
      const easedProgress = this.easeOutCubic(progress)
      
      const newHigh = this.lerp(this.initialHigh, this.currentCandle.targetHigh, easedProgress)
      const newLow = this.lerp(this.initialLow, this.currentCandle.targetLow, easedProgress)
      const newClose = this.lerp(this.initialClose, this.currentCandle.targetClose, easedProgress)

      this.currentCandle.high = Math.max(newHigh, this.currentCandle.open, newClose)
      this.currentCandle.low = Math.min(newLow, this.currentCandle.open, newClose)
      this.currentCandle.close = newClose

      this.onUpdate({
        timestamp: this.currentCandle.timestamp,
        open: this.currentCandle.open,
        high: this.currentCandle.high,
        low: this.currentCandle.low,
        close: this.currentCandle.close,
        volume: this.currentCandle.volume,
      })

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate)
      } else {
        this.currentCandle.isAnimating = false
        this.animationFrame = null
        
        this.currentCandle.high = this.currentCandle.targetHigh
        this.currentCandle.low = this.currentCandle.targetLow
        this.currentCandle.close = this.currentCandle.targetClose
        
        this.onUpdate({
          timestamp: this.currentCandle.timestamp,
          open: this.currentCandle.open,
          high: this.currentCandle.targetHigh,
          low: this.currentCandle.targetLow,
          close: this.currentCandle.targetClose,
          volume: this.currentCandle.volume,
        })
      }
    }

    this.animationFrame = requestAnimationFrame(animate)
  }

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  reset() {
    this.stop()
    this.currentCandle = null
  }
}

const GLOBAL_DATA_CACHE = new Map<string, {
  data: any[]
  timestamp: number
  timeframe: Timeframe
}>()

const CACHE_TTL = 300000
const STALE_CACHE_TTL = 600000

function getCachedData(assetId: string, timeframe: Timeframe): any[] | null {
  const key = `${assetId}-${timeframe}`
  const cached = GLOBAL_DATA_CACHE.get(key)
  if (!cached) return null
  const now = Date.now()
  const age = now - cached.timestamp
  
  if (age > CACHE_TTL) {
    if (age > STALE_CACHE_TTL) {
      GLOBAL_DATA_CACHE.delete(key)
      return null
    }
    return cached.data
  }
  return cached.data
}

function setCachedData(assetId: string, timeframe: Timeframe, data: any[]) {
  const key = `${assetId}-${timeframe}`
  GLOBAL_DATA_CACHE.set(key, {
    data,
    timestamp: Date.now(),
    timeframe
  })
  
  if (GLOBAL_DATA_CACHE.size > 100) {
    const entries = Array.from(GLOBAL_DATA_CACHE.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = entries.slice(0, 25)
    toDelete.forEach(([key]) => GLOBAL_DATA_CACHE.delete(key))
  }
}

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

function getTimeframeSeconds(timeframe: Timeframe): number {
  const map: Record<Timeframe, number> = {
    '1s': 1,
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400
  }
  return map[timeframe] || 60
}

function getBarPeriodTimestamp(timestamp: number, timeframe: Timeframe): number {
  const seconds = getTimeframeSeconds(timeframe)
  
  // 🔧 FIX: Pastikan menggunakan Math.floor seperti backend
  // Backend menggunakan: Math.floor(timestamp / seconds) * seconds
  return Math.floor(timestamp / seconds) * seconds
}

async function checkSimulatorStatus(assetPath: string): Promise<{
  isRunning: boolean
  hasCurrentPrice: boolean
  hasOHLC: boolean
  message: string
}> {
  if (typeof window === 'undefined' || !database) {
    return { 
      isRunning: false, 
      hasCurrentPrice: false, 
      hasOHLC: false,
      message: 'Firebase not initialized' 
    }
  }

  try {
    const basePath = cleanAssetPath(assetPath)
    
    const priceRef = ref(database, `${basePath}/current_price`)
    const priceSnapshot = await get(priceRef)
    const hasCurrentPrice = priceSnapshot.exists()
    
    const ohlcRef = ref(database, `${basePath}/ohlc_1m`)
    const ohlcSnapshot = await get(ohlcRef)
    const hasOHLC = ohlcSnapshot.exists()
    
    const isRunning = hasCurrentPrice && hasOHLC
    
    let message = ''
    if (!hasCurrentPrice && !hasOHLC) {
      message = 'Market offline - no data found'
    } else if (!hasCurrentPrice) {
      message = 'Missing current_price data'
    } else if (!hasOHLC) {
      message = 'Missing OHLC data'
    } else {
      message = 'Market online'
    }
    
    return { isRunning, hasCurrentPrice, hasOHLC, message }
  } catch (error) {
    return { 
      isRunning: false, 
      hasCurrentPrice: false, 
      hasOHLC: false,
      message: 'Check failed: ' + (error as Error).message 
    }
  }
}

const RealtimeClock = memo(() => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const timeStr = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  })

  const dateStr = time.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  })

  return (
    <div className="absolute top-14 left-2 z-10 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
      <div className="flex items-center gap-2">
        <div className="text-xs font-light text-white">
          {timeStr} <span className="text-gray-300">|</span> {dateStr}
        </div>
      </div>
    </div>
  )
})

RealtimeClock.displayName = 'RealtimeClock'

const PriceDisplay = memo(({ 
  asset, 
  price, 
  onClick, 
  showMenu, 
  assets, 
  onSelectAsset 
}: any) => {
  if (!asset || !price) return null

  const hasChange = price.change !== undefined && price.change !== 0
  const formattedPrice = formatPriceAuto(price.price, asset.type)

  return (
    <div className="absolute top-2 left-2 z-20">
      <button
        onClick={onClick}
        className="lg:hidden bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2 hover:bg-black/50 transition-all flex items-center gap-3"
      >
        {asset && <AssetIcon asset={asset} size="sm" />}
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{asset.name}</span>
          <span className="text-xl font-bold">{formattedPrice}</span>
        </div>
        {hasChange && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            price.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {price.change >= 0 ? '▲' : '▼'}
            <span>{price.change >= 0 ? '+' : ''}{price.change.toFixed(2)}%</span>
          </div>
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
          showMenu ? 'rotate-180' : ''
        }`} />
      </button>

      <div className="hidden lg:flex bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2 items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{asset.name}</span>
          <span className="text-xl font-bold">{formattedPrice}</span>
        </div>
        {hasChange && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            price.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {price.change >= 0 ? '▲' : '▼'}
            <span>{price.change >= 0 ? '+' : ''}{price.change.toFixed(2)}%</span>
          </div>
        )}
      </div>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-30 lg:hidden" onClick={onClick} />
          <div className="absolute top-full left-0 mt-2 w-72 bg-[#0f1419] border border-gray-800/50 rounded-lg shadow-2xl z-40 max-h-80 overflow-y-auto lg:hidden">
            {assets.map((assetItem: any) => (
              <button
                key={assetItem.id}
                onClick={() => {
                  onSelectAsset(assetItem)
                }}
                onMouseEnter={() => {
                  if (assetItem.realtimeDbPath) {
                    prefetchMultipleTimeframes(
                      assetItem.realtimeDbPath,
                      ['1m', '5m']
                    ).catch(err => console.log('Prefetch failed:', err))
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#1a1f2e] transition-colors border-b border-gray-800/30 last:border-0 ${
                  assetItem.id === asset?.id ? 'bg-[#1a1f2e]' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <AssetIcon asset={assetItem} size="xs" />
                  <div className="text-left">
                    <div className="text-sm font-medium">{assetItem.symbol}</div>
                    <div className="text-xs text-gray-400">{assetItem.name}</div>
                  </div>
                </div>
                <div className="text-xs font-bold text-emerald-400">+{assetItem.profitRate}%</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
})

PriceDisplay.displayName = 'PriceDisplay'

const OHLCDisplay = memo(({ 
  data,
  visible 
}: { 
  data: { 
    time: number
    open: number
    high: number
    low: number
    close: number
  } | null
  visible: boolean 
}) => {
  if (!visible || !data) return null

  const date = new Date(data.time * 1000)
  const timeStr = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  })

  const formatOHLCPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2)
    if (price >= 1) return price.toFixed(6)
    return price.toFixed(8)
  }

  return (
    <div className="absolute bottom-12 left-2 z-10 bg-[#0a0e17] border border-gray-800/50 rounded-lg px-3 py-2 text-xs">
      <div className="flex items-center gap-1 text-gray-400 mb-1">
        <Clock className="w-3 h-3" />
        <span>{timeStr} WIB</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 w-3">O:</span>
          <span className="text-white">{formatOHLCPrice(data.open)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 w-3">H:</span>
          <span className="text-emerald-400">{formatOHLCPrice(data.high)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 w-3">L:</span>
          <span className="text-rose-400">{formatOHLCPrice(data.low)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 w-3">C:</span>
          <span className="text-blue-400">{formatOHLCPrice(data.close)}</span>
        </div>
      </div>
    </div>
  )
})

OHLCDisplay.displayName = 'OHLCDisplay'

const SimulatorStatus = memo(({ 
  status, 
  onRetry 
}: { 
  status: { isRunning: boolean; message: string } | null
  onRetry: () => void
}) => {
  if (!status || status.isRunning) return null
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/95 z-20">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 bg-rose-500/10 border-2 border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Server className="w-8 h-8 text-rose-400" />
        </div>
        
        <div className="text-lg font-bold text-rose-400 mb-2">
          Market Not Available
        </div>
        
        <div className="text-sm text-gray-400 mb-1">
          {status.message}
        </div>
        
        <div className="text-xs text-gray-500 mb-6">
          Loading to view real-time data
        </div>
        
        <button onClick={onRetry} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" />
          Check Again
        </button>
      </div>
    </div>
  )
})

SimulatorStatus.displayName = 'SimulatorStatus'

const MobileControls = memo(({ 
  timeframe, 
  chartType, 
  isLoading,
  onTimeframeChange,
  onChartTypeChange,
  onFitContent,
  onRefresh,
  onOpenIndicators
}: any) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const timeframes: Timeframe[] = ['1s', '1m', '5m', '15m', '30m', '1h', '4h', '1d']

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="lg:hidden absolute top-24 left-2 z-10" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg hover:bg-black/50 transition-all">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-gray-300" />
          <span className="text-xs font-bold text-white">{timeframe}</span>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-xs text-gray-300">{chartType === 'candle' ? 'Candle' : 'Line'}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-[#0f1419] border border-gray-800/50 rounded-lg shadow-2xl z-50 overflow-hidden animate-scale-in min-w-[200px]">
          <div className="p-2 border-b border-gray-800/50">
            <div className="text-[10px] font-semibold text-gray-400 mb-1.5 px-2">Timeframe</div>
            <div className="grid grid-cols-3 gap-1">
              {timeframes.map((tf) => (
                <button key={tf} onClick={() => { onTimeframeChange(tf); setIsOpen(false) }} disabled={isLoading} className={`px-2 py-1.5 text-xs font-bold rounded transition-all flex items-center justify-center gap-1 ${
                  timeframe === tf ? 'bg-blue-500 text-white shadow-sm' : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#232936]'
                } disabled:opacity-50`}>
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 border-b border-gray-800/50">
            <div className="text-[10px] font-semibold text-gray-400 mb-1.5 px-2">Chart Type</div>
            <div className="flex gap-1">
              <button onClick={() => { onChartTypeChange('candle'); setIsOpen(false) }} disabled={isLoading} className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded transition-all ${
                chartType === 'candle' ? 'bg-blue-500 text-white shadow-sm' : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#232936]'
              }`}>Candle</button>
              <button onClick={() => { onChartTypeChange('line'); setIsOpen(false) }} disabled={isLoading} className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded transition-all ${
                chartType === 'line' ? 'bg-blue-500 text-white shadow-sm' : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#232936]'
              }`}>Line</button>
            </div>
          </div>

          <div className="p-2">
            <div className="flex flex-col gap-1">
              <button onClick={() => { onOpenIndicators(); setIsOpen(false) }} className="px-2 py-1.5 text-xs font-medium text-gray-300 bg-[#1a1f2e] hover:bg-[#232936] rounded transition-all flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5" /> Indicators
              </button>
              <div className="flex gap-1">
                <button onClick={() => { onFitContent(); setIsOpen(false) }} className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-300 bg-[#1a1f2e] hover:bg-[#232936] rounded transition-all">Fit</button>
                <button onClick={() => { onRefresh(); setIsOpen(false) }} disabled={isLoading} className="px-2 py-1.5 text-gray-300 bg-[#1a1f2e] hover:bg-[#232936] rounded transition-all disabled:opacity-50 flex items-center gap-1">
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

MobileControls.displayName = 'MobileControls'

const DesktopControls = memo(({ 
  timeframe, 
  chartType, 
  isLoading,
  onTimeframeChange,
  onChartTypeChange,
  onFitContent,
  onRefresh,
  onToggleFullscreen,
  onOpenIndicators,
  isFullscreen
}: any) => {
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false)
  const timeframeRef = useRef<HTMLDivElement>(null)

  const timeframes: Timeframe[] = ['1s', '1m', '5m', '15m', '30m', '1h', '4h', '1d']

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeframeRef.current && !timeframeRef.current.contains(event.target as Node)) {
        setShowTimeframeMenu(false)
      }
    }

    if (showTimeframeMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTimeframeMenu])

  return (
    <div className="hidden lg:block absolute top-2 right-16 z-10">
      <div className="flex items-center gap-2">
        <div className="relative" ref={timeframeRef}>
          <button onClick={() => setShowTimeframeMenu(!showTimeframeMenu)} disabled={isLoading} className="p-2.5 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg hover:bg-black/30 transition-all flex items-center gap-1.5 disabled:opacity-50" title="Timeframe">
            <Clock className="w-5 h-5 text-gray-300" />
            <span className="text-xs font-bold text-white">{timeframe}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showTimeframeMenu ? 'rotate-180' : ''}`} />
          </button>

          {showTimeframeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTimeframeMenu(false)} />
              <div className="absolute top-full right-0 mt-1 bg-[#0f1419] border border-gray-800/50 rounded-lg shadow-2xl z-50 overflow-hidden min-w-[120px]">
                {timeframes.map((tf) => (
                  <button key={tf} onClick={() => { onTimeframeChange(tf); setShowTimeframeMenu(false) }} disabled={isLoading} className={`w-full px-4 py-2.5 text-left text-sm font-bold transition-all flex items-center gap-2 ${
                    timeframe === tf ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-300 hover:bg-[#1a1f2e]'
                  } disabled:opacity-50`}>
                    {tf}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-1">
          <button onClick={() => onChartTypeChange('candle')} disabled={isLoading} className={`p-2 rounded transition-all ${
            chartType === 'candle' ? 'bg-blue-500/80 text-white shadow-sm' : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`} title="Candlestick">
            <BarChart2 className="w-5 h-5" />
          </button>
          <button onClick={() => onChartTypeChange('line')} disabled={isLoading} className={`p-2 rounded transition-all ${
            chartType === 'line' ? 'bg-blue-500/80 text-white shadow-sm' : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`} title="Line">
            <Activity className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-1">
          <button onClick={onOpenIndicators} disabled={isLoading} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50" title="Indicators">
            <Sliders className="w-5 h-5" />
          </button>
          <button onClick={onRefresh} disabled={isLoading} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50" title="Refresh">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={onToggleFullscreen} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors" title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
})

DesktopControls.displayName = 'DesktopControls'

const TradingChart = memo(({ activeOrders = [], currentPrice, assets = [], onAssetSelect }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const candleAnimatorRef = useRef<SmoothCandleAnimator | null>(null)
  const { setChart, setSeries, priceToPixel } = useChartPriceScale()
  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const emaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const bollingerUpperRef = useRef<ISeriesApi<"Line"> | null>(null)
  const bollingerMiddleRef = useRef<ISeriesApi<"Line"> | null>(null)
  const bollingerLowerRef = useRef<ISeriesApi<"Line"> | null>(null)
  
  const isMountedRef = useRef(false)
  const cleanupFunctionsRef = useRef<Array<() => void>>([])
  const currentBarRef = useRef<CandleData | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)
  const previousAssetIdRef = useRef<string | null>(null)
  const previousTimeframeRef = useRef<Timeframe>('1m')
  
  const loadingManagerRef = useRef(new LoadingStateManager())
  
  const { selectedAsset } = useTradingStore()
  const { setSelectedAsset } = useTradingActions()
  const storeAssets = useTradingStore(state => state.assets)
  const availableAssets = assets.length > 0 ? assets : storeAssets || []
  
  const [chartType, setChartType] = useState<ChartType>('candle')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [openingPrice, setOpeningPrice] = useState<number | null>(null)
  const [simulatorStatus, setSimulatorStatus] = useState<any>(null)
  const [showIndicators, setShowIndicators] = useState(false)
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>(DEFAULT_INDICATOR_CONFIG)
  const [ohlcData, setOhlcData] = useState<any>(null)
  const [showOhlc, setShowOhlc] = useState(false)
  const [showAssetMenu, setShowAssetMenu] = useState(false)
  
  const [prefetchedAssets, setPrefetchedAssets] = useState<Set<string>>(new Set())
  const [currentChartData, setCurrentChartData] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    loadingManagerRef.current.setCallback(setIsLoading)
    
    return () => {
      loadingManagerRef.current.reset()
    }
  }, [])

  const addCleanup = useCallback((fn: () => void) => {
    cleanupFunctionsRef.current.push(fn)
  }, [])

  const cleanupAll = useCallback(() => {
    loadingManagerRef.current.reset()
    
    cleanupFunctionsRef.current.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    })
    cleanupFunctionsRef.current = []
    
    currentBarRef.current = null
    lastUpdateTimeRef.current = 0
  }, [])

  const isLoadingDataRef = useRef(false)

  const checkSimulator = useCallback(async () => {
    if (!selectedAsset?.realtimeDbPath) return
    
    const status = await checkSimulatorStatus(selectedAsset.realtimeDbPath)
    setSimulatorStatus(status)
  }, [selectedAsset?.realtimeDbPath])

  const toggleFullscreen = useCallback(async () => {
    const container = fullscreenContainerRef.current
    if (!container) return

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const prefetchAllTimeframes = useCallback(async (assetId: string, assetPath: string) => {
    if (prefetchedAssets.has(assetId)) {
      return
    }

    try {
      const allTimeframes = [...TIMEFRAMES]
      const timeframesToPrefetch = allTimeframes.filter(tf => tf !== timeframe)
      
      const prefetchPromises = timeframesToPrefetch.map(tf => 
        fetchHistoricalData(assetPath, tf as Timeframe)
          .then(data => {
            if (data.length > 0) {
              setCachedData(assetId, tf as Timeframe, data)
            }
            return { timeframe: tf, success: true, bars: data.length }
          })
          .catch(error => {
            return { timeframe: tf, success: false, error: error.message }
          })
      )

      await Promise.allSettled(prefetchPromises)
      
      setPrefetchedAssets(prev => new Set(prev).add(assetId))
      
    } catch (error) {
      console.error('Full prefetch error:', error)
    }
  }, [prefetchedAssets, timeframe])

  useEffect(() => {
    if (!selectedAsset?.realtimeDbPath) return

    const prefetch = async () => {
      const assetPath = cleanAssetPath(selectedAsset.realtimeDbPath!)
      const criticalTimeframes = ['1m', '5m', '15m']
      
      await prefetchMultipleTimeframes(assetPath, criticalTimeframes as Timeframe[])
        .catch(err => console.log('Critical prefetch failed:', err.message))
    }

    const timer = setTimeout(prefetch, 500)
    return () => clearTimeout(timer)
  }, [selectedAsset?.id, selectedAsset?.realtimeDbPath])

  const fetchCurrentPriceImmediately = useCallback(async () => {
    if (!selectedAsset?.realtimeDbPath) return
    
    try {
      const assetPath = cleanAssetPath(selectedAsset.realtimeDbPath)
      const priceData = await get(ref(database, `${assetPath}/current_price`))
      
      if (priceData.exists()) {
        const data = priceData.val()
        setLastPrice(data.price)
        setOpeningPrice(data.price)
        lastUpdateTimeRef.current = Date.now()
      }
    } catch (error) {
      console.warn('Immediate price fetch failed:', error)
    }
  }, [selectedAsset?.realtimeDbPath])

  useEffect(() => {
    if (selectedAsset && isInitialized) {
      fetchCurrentPriceImmediately()
    }
  }, [selectedAsset?.id, isInitialized, fetchCurrentPriceImmediately])

  // REALTIME OHLC SUBSCRIPTION with Cache Invalidation
  useEffect(() => {
    if (!selectedAsset?.realtimeDbPath || !isInitialized) return
    if (!candleSeriesRef.current || !lineSeriesRef.current) return

    const assetPath = cleanAssetPath(selectedAsset.realtimeDbPath)
    
    const unsubscribe = subscribeToOHLCUpdates(assetPath, timeframe, (newBar) => {
      if (!newBar) return
      
      // 🔧 FIX: Invalidate cache saat bar selesai agar refresh mendapat data fresh
      if (newBar.isCompleted) {
        const cacheKey = `${selectedAsset.id}-${timeframe}`
        // Hapus dari cache agar fetch berikutnya ambil dari Firebase
        GLOBAL_DATA_CACHE.delete(cacheKey)
        console.log('🔄 Bar completed, cache invalidated for', cacheKey)
      }
      
      // 🔧 FIX: Pastikan timestamp alignment sama persis dengan backend
      const barPeriod = getBarPeriodTimestamp(newBar.timestamp, timeframe)

      if (!currentBarRef.current || currentBarRef.current.timestamp !== barPeriod) {
        // Bar baru dimulai
        currentBarRef.current = {
          timestamp: barPeriod,
          open: newBar.open,
          high: newBar.high,
          low: newBar.low,
          close: newBar.close,
          volume: newBar.volume || 0,
          isCompleted: newBar.isCompleted || false
        }
        console.log('🆕 New bar:', barPeriod, 'Open:', newBar.open)
      } else {
        // Update bar yang sedang berjalan
        const prevHigh = currentBarRef.current.high
        const prevLow = currentBarRef.current.low
        
        currentBarRef.current = {
          ...currentBarRef.current,
          high: Math.max(currentBarRef.current.high, newBar.high),
          low: Math.min(currentBarRef.current.low, newBar.low),
          close: newBar.close,
          volume: (currentBarRef.current.volume || 0) + (newBar.volume || 0),
          isCompleted: newBar.isCompleted || false
        }
        
        // Log jika ada perubahan significant (untuk debug)
        if (currentBarRef.current.high !== prevHigh || currentBarRef.current.low !== prevLow) {
          console.log('📊 Bar update - High:', currentBarRef.current.high, 'Low:', currentBarRef.current.low)
        }
      }

      const chartCandle = {
        time: currentBarRef.current.timestamp as UTCTimestamp,
        open: currentBarRef.current.open,
        high: currentBarRef.current.high,
        low: currentBarRef.current.low,
        close: currentBarRef.current.close,
      }

      if (candleAnimatorRef.current) {
        candleAnimatorRef.current.updateCandle(currentBarRef.current)
      } else {
        try {
          candleSeriesRef.current?.update(chartCandle)
          lineSeriesRef.current?.update({
            time: chartCandle.time,
            value: chartCandle.close
          })
        } catch (error) {
          console.warn('Chart update error:', error)
        }
      }

      setLastPrice(newBar.close)
      lastUpdateTimeRef.current = Date.now()
    })

    return () => {
      unsubscribe()
    }
  }, [selectedAsset?.realtimeDbPath, timeframe, isInitialized])

  // INITIALIZE CHART
  useEffect(() => {
    if (isMountedRef.current) return
    
    const container = chartContainerRef.current
    if (!container) return

    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) return

    isMountedRef.current = true

    try {
      const chart = createChart(container, {
        width,
        height,
        layout: { background: { type: ColorType.Solid, color: '#0a0e17' }, textColor: '#9ca3af' },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.08)', style: 0, visible: true },
          horzLines: { color: 'rgba(255, 255, 255, 0.08)', style: 0, visible: true }
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          timeVisible: true,
          secondsVisible: false
        },
        localization: {
          locale: 'id-ID',
          dateFormat: 'dd/MM/yyyy'
        }
      })

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
        visible: chartType === 'candle',
        priceFormat: {
          type: 'price',
          precision: 8,
          minMove: 0.00000001,
        },
      })

      const lineSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        visible: chartType === 'line',
        priceFormat: {
          type: 'price',
          precision: 8,
          minMove: 0.00000001,
        },
      })

      chart.subscribeCrosshairMove((param) => {
        if (!param || !param.point || !param.time) {
          setShowOhlc(false)
          return
        }

        const data = candleSeries.dataByIndex(Math.round(param.logical as number))
        if (data && 'open' in data && 'high' in data && 'low' in data && 'close' in data) {
          setOhlcData({ 
            time: param.time as number, 
            open: (data as any).open, 
            high: (data as any).high, 
            low: (data as any).low, 
            close: (data as any).close 
          })
          setShowOhlc(true)
        } else {
          setShowOhlc(false)
        }
      })

      chartRef.current = chart
      candleSeriesRef.current = candleSeries
      lineSeriesRef.current = lineSeries
      
      setChart(chart)
      setSeries(chartType === 'candle' ? candleSeries : lineSeries)

      candleAnimatorRef.current = new SmoothCandleAnimator(
        (animatedCandle) => {
          const chartCandle = {
            time: animatedCandle.timestamp as UTCTimestamp,
            open: animatedCandle.open,
            high: animatedCandle.high,
            low: animatedCandle.low,
            close: animatedCandle.close,
          }
          
          try {
            candleSeriesRef.current?.update(chartCandle)
            lineSeriesRef.current?.update({
              time: chartCandle.time,
              value: chartCandle.close
            })
          } catch (e) {
            console.warn('Chart update error:', e)
          }
        },
        300
      )

      setIsInitialized(true)

      const handleResize = () => {
        if (container && chart) {
          const { width, height } = container.getBoundingClientRect()
          if (width > 0 && height > 0) {
            chart.applyOptions({ width, height })
          }
        }
      }

      window.addEventListener('resize', handleResize)
      addCleanup(() => window.removeEventListener('resize', handleResize))

      return () => {
        cleanupAll()
        isMountedRef.current = false
        setIsInitialized(false)
        
        if (smaSeriesRef.current) chart.removeSeries(smaSeriesRef.current)
        if (emaSeriesRef.current) chart.removeSeries(emaSeriesRef.current)
        if (bollingerUpperRef.current) chart.removeSeries(bollingerUpperRef.current)
        if (bollingerMiddleRef.current) chart.removeSeries(bollingerMiddleRef.current)
        if (bollingerLowerRef.current) chart.removeSeries(bollingerLowerRef.current)
        
        try {
          candleAnimatorRef.current?.stop()
          chart.remove()
        } catch (e) {
          console.error('Chart removal error:', e)
        }
      }
    } catch (err: any) {
      console.error('Chart init error:', err)
      isMountedRef.current = false
    }
  }, [chartType, addCleanup, cleanupAll, setChart, setSeries])

  // CHART TYPE CHANGES - MODIFIED FOR 60 CANDLE ZOOM
  useEffect(() => {
    if (!candleSeriesRef.current || !lineSeriesRef.current || !chartRef.current) return
    if (currentChartData.length === 0) return

    try {
      if (chartType === 'candle') {
        lineSeriesRef.current.applyOptions({ visible: false })
        candleSeriesRef.current.setData(currentChartData as any)
        candleSeriesRef.current.applyOptions({ visible: true })
        
        setSeries(candleSeriesRef.current)
      } else {
        candleSeriesRef.current.applyOptions({ visible: false })
        const lineData = currentChartData.map(bar => ({ 
          time: bar.time, 
          value: bar.close 
        }))
        lineSeriesRef.current.setData(lineData as any)
        lineSeriesRef.current.applyOptions({ visible: true })
        
        setSeries(lineSeriesRef.current)
      }
      
      // MODIFIED: Zoom to last 60 candles instead of fitContent
      requestAnimationFrame(() => {
        if (chartRef.current && currentChartData.length > 60) {
          const timeScale = chartRef.current.timeScale()
          timeScale.setVisibleLogicalRange({
            from: currentChartData.length - 60,
            to: currentChartData.length - 1
          })
        } else if (chartRef.current) {
          chartRef.current.timeScale().fitContent()
        }
      })
    } catch (error) {
      console.error('Chart type switch error:', error)
    }
  }, [chartType, currentChartData, setSeries])

  useEffect(() => {
    if (!showIndicators && candleSeriesRef.current && lineSeriesRef.current && chartRef.current) {
      const timer = setTimeout(() => {
        setChartType(prev => prev)
      }, 150)
      
      return () => clearTimeout(timer)
    }
  }, [showIndicators])

  // APPLY INDICATORS TO CHART
  useEffect(() => {
    if (!chartRef.current || currentChartData.length === 0) return

    const chart = chartRef.current

    if (indicatorConfig.sma?.enabled) {
      if (!smaSeriesRef.current) {
        smaSeriesRef.current = chart.addLineSeries({
          color: indicatorConfig.sma.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }
      
      const smaData = calculateSMA(currentChartData, indicatorConfig.sma.period)
      smaSeriesRef.current.setData(smaData)
      smaSeriesRef.current.applyOptions({ 
        color: indicatorConfig.sma.color,
        visible: true
      })
    } else if (smaSeriesRef.current) {
      smaSeriesRef.current.applyOptions({ visible: false })
    }

    if (indicatorConfig.ema?.enabled) {
      if (!emaSeriesRef.current) {
        emaSeriesRef.current = chart.addLineSeries({
          color: indicatorConfig.ema.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }
      
      const emaData = calculateEMA(currentChartData, indicatorConfig.ema.period)
      emaSeriesRef.current.setData(emaData)
      emaSeriesRef.current.applyOptions({ 
        color: indicatorConfig.ema.color,
        visible: true
      })
    } else if (emaSeriesRef.current) {
      emaSeriesRef.current.applyOptions({ visible: false })
    }

    if (indicatorConfig.bollinger?.enabled) {
      const { upper, middle, lower } = calculateBollingerBands(
        currentChartData, 
        indicatorConfig.bollinger.period,
        indicatorConfig.bollinger.stdDev
      )

      if (!bollingerUpperRef.current) {
        bollingerUpperRef.current = chart.addLineSeries({
          color: indicatorConfig.bollinger.colorUpper,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }
      if (!bollingerMiddleRef.current) {
        bollingerMiddleRef.current = chart.addLineSeries({
          color: indicatorConfig.bollinger.colorMiddle,
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }
      if (!bollingerLowerRef.current) {
        bollingerLowerRef.current = chart.addLineSeries({
          color: indicatorConfig.bollinger.colorLower,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }

      bollingerUpperRef.current.setData(upper)
      bollingerMiddleRef.current.setData(middle)
      bollingerLowerRef.current.setData(lower)
      
      bollingerUpperRef.current.applyOptions({ visible: true, color: indicatorConfig.bollinger.colorUpper })
      bollingerMiddleRef.current.applyOptions({ visible: true, color: indicatorConfig.bollinger.colorMiddle })
      bollingerLowerRef.current.applyOptions({ visible: true, color: indicatorConfig.bollinger.colorLower })
    } else {
      if (bollingerUpperRef.current) bollingerUpperRef.current.applyOptions({ visible: false })
      if (bollingerMiddleRef.current) bollingerMiddleRef.current.applyOptions({ visible: false })
      if (bollingerLowerRef.current) bollingerLowerRef.current.applyOptions({ visible: false })
    }

  }, [indicatorConfig, currentChartData])

  // LOAD HISTORICAL DATA - with Live Bar Merging
  useEffect(() => {
    if (!selectedAsset || !isInitialized || !candleSeriesRef.current || !lineSeriesRef.current) {
      return
    }

    const isAssetChange = previousAssetIdRef.current !== selectedAsset.id
    const isTimeframeChange = previousTimeframeRef.current !== timeframe
    
    if (isAssetChange || isTimeframeChange) {
      setIsLoading(true)
      previousAssetIdRef.current = selectedAsset.id
      previousTimeframeRef.current = timeframe
      
      // 🔧 FIX: Clear cache untuk asset/timeframe ini agar data fresh
      if (isAssetChange) {
        setCurrentChartData([])
        candleSeriesRef.current.setData([])
        lineSeriesRef.current.setData([])
        currentBarRef.current = null // Reset live bar
        
        // Clear semua cache untuk asset ini
        TIMEFRAMES.forEach(tf => {
          const cacheKey = `${selectedAsset.id}-${tf}`
          GLOBAL_DATA_CACHE.delete(cacheKey)
        })
      }
      
      if (isTimeframeChange) {
        // Clear cache untuk timeframe spesifik
        const cacheKey = `${selectedAsset.id}-${timeframe}`
        GLOBAL_DATA_CACHE.delete(cacheKey)
        currentBarRef.current = null // Reset live bar untuk timeframe baru
      }
    }

    isLoadingDataRef.current = true
    let isCancelled = false

    const processAndDisplayData = (data: any[]) => {
      if (data.length > 0 && !isCancelled) {
        // 🔧 FIX: Sort data untuk memastikan urutan benar
        const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp)
        
        // 🔧 FIX: Merge dengan live bar jika ada dan timestamp sama
        if (currentBarRef.current && sortedData.length > 0) {
          const lastHistoricalTimestamp = sortedData[sortedData.length - 1].timestamp
          const liveBarTimestamp = currentBarRef.current.timestamp
          
          if (lastHistoricalTimestamp === liveBarTimestamp) {
            // Merge: gunakan high/low tertinggi, close terbaru dari live
            const mergedBar = {
              ...sortedData[sortedData.length - 1],
              high: Math.max(
                sortedData[sortedData.length - 1].high, 
                currentBarRef.current.high
              ),
              low: Math.min(
                sortedData[sortedData.length - 1].low, 
                currentBarRef.current.low
              ),
              close: currentBarRef.current.close, // Prioritaskan close live
              volume: (sortedData[sortedData.length - 1].volume || 0) + (currentBarRef.current.volume || 0)
            }
            
            sortedData[sortedData.length - 1] = mergedBar
            console.log('✅ Merged live bar with historical:', mergedBar.close)
          } else if (liveBarTimestamp > lastHistoricalTimestamp) {
            // 🔧 FIX: Jika live bar lebih baru, append ke historical
            sortedData.push({
              timestamp: currentBarRef.current.timestamp,
              open: currentBarRef.current.open,
              high: currentBarRef.current.high,
              low: currentBarRef.current.low,
              close: currentBarRef.current.close,
              volume: currentBarRef.current.volume || 0
            })
          }
        }
        
        const candleData = sortedData.map((bar: any) => ({
          time: bar.timestamp as UTCTimestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close
        }))

        setCurrentChartData(candleData)

        candleSeriesRef.current!.setData(candleData)
        lineSeriesRef.current!.setData(candleData.map(bar => ({ time: bar.time, value: bar.close })))
        
        // MODIFIED: Zoom to show only last 60 candles by default
        const timeScale = chartRef.current?.timeScale()
        if (timeScale && candleData.length > 60) {
          timeScale.setVisibleLogicalRange({
            from: candleData.length - 60,
            to: candleData.length - 1
          })
        } else {
          timeScale?.fitContent()
        }

        const lastBar = sortedData[sortedData.length - 1]
        if (!currentBarRef.current) {
          currentBarRef.current = {
            timestamp: lastBar.timestamp,
            open: lastBar.open,
            high: lastBar.high,
            low: lastBar.low,
            close: lastBar.close,
            volume: lastBar.volume || 0
          }
        }
        
        setOpeningPrice(sortedData[0].open)
        setLastPrice(lastBar.close)
      }
    }

    const loadHistoricalData = async () => {
      try {
        const assetPath = cleanAssetPath(selectedAsset.realtimeDbPath || `/${selectedAsset.symbol.toLowerCase()}`)
        
        const cachedData = getCachedData(selectedAsset.id, timeframe)
        
        if (cachedData && cachedData.length > 0 && !isAssetChange) {
          processAndDisplayData(cachedData)
          setIsLoading(false)
          
          setTimeout(async () => {
            if (isCancelled) return
            const freshData = await fetchHistoricalData(assetPath, timeframe)
            if (freshData.length > 0 && !isCancelled) {
              setCachedData(selectedAsset.id, timeframe, freshData)
              if (JSON.stringify(freshData) !== JSON.stringify(cachedData)) {
                processAndDisplayData(freshData)
              }
            }
          }, 100)
        } else {
          const minLoadTime = new Promise(resolve => setTimeout(resolve, 600))
          const dataPromise = fetchHistoricalData(assetPath, timeframe)
          
          const [data] = await Promise.all([dataPromise, minLoadTime])
          
          if (!isCancelled) {
            setCachedData(selectedAsset.id, timeframe, data)
            processAndDisplayData(data)
          }
        }
      } catch (error) {
        console.error('Historical data load error:', error)
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
          isLoadingDataRef.current = false
        }
      }
    }

    const initializeData = async () => {
      await checkSimulator().catch(err => console.log('Market check failed:', err))
      await loadHistoricalData()
    }

    initializeData()

    return () => {
      isCancelled = true
      isLoadingDataRef.current = false
    }
  }, [selectedAsset?.id, timeframe, isInitialized, checkSimulator])

  useEffect(() => {
    if (isLoading) {
      const safetyTimeout = setTimeout(() => {
        if (loadingManagerRef.current.getLoading()) {
          setIsLoading(false)
        }
      }, 10000)
      
      return () => clearTimeout(safetyTimeout)
    }
  }, [isLoading])

  useEffect(() => {
    if (!selectedAsset || !isInitialized || isLoading || prefetchedAssets.has(selectedAsset.id)) {
      return
    }

    const assetPath = cleanAssetPath(selectedAsset.realtimeDbPath || `/${selectedAsset.symbol.toLowerCase()}`)

    const prefetchTimer = setTimeout(() => {
      prefetchAllTimeframes(selectedAsset.id, assetPath)
    }, 2000)

    return () => clearTimeout(prefetchTimer)
  }, [selectedAsset?.id, isInitialized, isLoading, prefetchedAssets, prefetchAllTimeframes])

  const handleRefresh = useCallback(() => {
    if (!selectedAsset) return
    
    // 🔧 FIX: Clear cache lebih agresif
    const cacheKey = `${selectedAsset.id}-${timeframe}`
    GLOBAL_DATA_CACHE.delete(cacheKey)
    
    // Reset current bar agar tidak merge dengan data lama
    currentBarRef.current = null
    
    setPrefetchedAssets(prev => {
      const newSet = new Set(prev)
      newSet.delete(selectedAsset.id)
      return newSet
    })
    
    checkSimulator()
    
    // Trigger reload data
    const currentAsset = selectedAsset
    useTradingStore.setState({ selectedAsset: null })
    setTimeout(() => {
      useTradingStore.setState({ selectedAsset: currentAsset })
    }, 100)
  }, [selectedAsset, timeframe, checkSimulator])

  const handleFitContent = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }, [])

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setTimeframe(tf)
  }, [])

  const handleChartTypeChange = useCallback((type: ChartType) => {
    setChartType(type)
  }, [])

  const handleOpenIndicators = useCallback(() => {
    setShowIndicators(true)
  }, [])

  const handleCloseIndicators = useCallback(() => {
    setShowIndicators(false)
    
    setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent()
      }
    }, 200)
  }, [])

  const calculatePriceChange = useCallback(() => {
    if (!lastPrice || !openingPrice || openingPrice === 0) return 0
    return ((lastPrice - openingPrice) / openingPrice) * 100
  }, [lastPrice, openingPrice])

  const handleAssetSelect = useCallback((asset: any) => {
    setSelectedAsset(asset)
    onAssetSelect?.(asset)
    setShowAssetMenu(false)
  }, [setSelectedAsset, onAssetSelect])

  // 🔧 DEBUG HELPER: Log perbedaan antara live dan historical
  useEffect(() => {
    // Debug: Log perbedaan antara live dan historical setiap 10 detik
    const debugInterval = setInterval(() => {
      if (currentBarRef.current && currentChartData.length > 0) {
        const lastHistorical = currentChartData[currentChartData.length - 1]
        const live = currentBarRef.current
        
        if (lastHistorical.time === live.timestamp) {
          if (lastHistorical.close !== live.close || 
              lastHistorical.high !== live.high || 
              lastHistorical.low !== live.low) {
            console.warn('⚠️ MISMATCH DETECTED:', {
              historical: { 
                close: lastHistorical.close, 
                high: lastHistorical.high, 
                low: lastHistorical.low 
              },
              live: { 
                close: live.close, 
                high: live.high, 
                low: live.low 
              }
            })
          }
        }
      }
    }, 10000)
    
    return () => clearInterval(debugInterval)
  }, [currentChartData])

  if (!selectedAsset) {
    return (
      <div className="h-full flex items-center justify-center bg-[#0a0e17]">
        <div className="text-center text-gray-500">
          <Activity className="w-16 h-16 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Select an asset to view chart</p>
        </div>
      </div>
    )
  }

  const currentPriceData = {
    price: lastPrice || 0,
    change: calculatePriceChange(),
    datetime: new Date().toISOString()
  }

  return (
    <div ref={fullscreenContainerRef} className={`relative h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0e17]' : ''}`}>
      <PriceDisplay 
        asset={selectedAsset} 
        price={currentPriceData} 
        onClick={() => setShowAssetMenu(!showAssetMenu)}
        showMenu={showAssetMenu}
        assets={availableAssets}
        onSelectAsset={handleAssetSelect}
      />
      <RealtimeClock />

      <DesktopControls 
        timeframe={timeframe} 
        chartType={chartType} 
        isLoading={isLoading} 
        onTimeframeChange={handleTimeframeChange} 
        onChartTypeChange={handleChartTypeChange} 
        onFitContent={handleFitContent} 
        onRefresh={handleRefresh} 
        onToggleFullscreen={toggleFullscreen} 
        onOpenIndicators={handleOpenIndicators}
        isFullscreen={isFullscreen} 
      />

      <MobileControls 
        timeframe={timeframe} 
        chartType={chartType} 
        isLoading={isLoading} 
        onTimeframeChange={handleTimeframeChange} 
        onChartTypeChange={handleChartTypeChange} 
        onFitContent={handleFitContent} 
        onRefresh={handleRefresh} 
        onOpenIndicators={handleOpenIndicators}
      />

      <SimulatorStatus status={simulatorStatus} onRetry={checkSimulator} />

      <OHLCDisplay data={ohlcData} visible={showOhlc} />

      <div ref={chartContainerRef} className="absolute inset-0 bg-[#0a0e17]" />

      {activeOrders && activeOrders.length > 0 && currentPriceData.price > 0 && (
        <OrderPriceTracker
          orders={activeOrders}
          currentPrice={currentPriceData.price}
          chartContainerRef={chartContainerRef}
          priceToPixel={priceToPixel}
          showProfitAnimation={!isMobile}
          showPricePath={!isMobile}
          highlightWinning={true}
          compactMode={isMobile}
        />
      )}

      {isLoading && (
        <ChartSkeleton 
          timeframe={timeframe} 
          assetSymbol={selectedAsset?.symbol || ''} 
        />
      )}

      <IndicatorControls 
        isOpen={showIndicators} 
        onClose={handleCloseIndicators}
        config={indicatorConfig} 
        onChange={setIndicatorConfig} 
      />
    </div>
  )
})

TradingChart.displayName = 'TradingChart'

export default TradingChart