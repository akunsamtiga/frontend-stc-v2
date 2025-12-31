// components/TradingChart.tsx - ULTRA OPTIMIZED WITH INDICATORS
'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, UTCTimestamp, LineStyle } from 'lightweight-charts'
import { useTradingStore } from '@/store/trading'
import { fetchHistoricalData, subscribeToOHLCUpdates, subscribeToPriceUpdates } from '@/lib/firebase'
import { BinaryOrder } from '@/types'
import { formatCurrency, calculateTimeLeft } from '@/lib/utils'
import { database, ref, get } from '@/lib/firebase'
import dynamic from 'next/dynamic'
import { 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Activity,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Server,
  Sliders
} from 'lucide-react'
import { 
  calculateSMA, 
  calculateEMA, 
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateVolumeMA,
  calculateStochastic,
  calculateATR,
  CandleData
} from '@/lib/indicators'

const IndicatorControls = dynamic(() => import('./IndicatorControls'), { ssr: false })

import type { IndicatorConfig } from './IndicatorControls'

type ChartType = 'line' | 'candle'
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

interface TradingChartProps {
  activeOrders?: BinaryOrder[]
  currentPrice?: number
}

// Default indicator config
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

// ===================================
// UTILITIES
// ===================================

function cleanAssetPath(path: string): string {
  if (!path) return ''
  if (path.endsWith('/current_price')) {
    path = path.replace('/current_price', '')
  }
  path = path.replace(/\/$/, '')
  if (!path.startsWith('/')) path = '/' + path
  return path
}

// ===================================
// RAF QUEUE
// ===================================

class RAFQueue {
  private queue: Map<string, () => void> = new Map()
  private rafId: number | null = null

  add(key: string, fn: () => void) {
    this.queue.set(key, fn)
    
    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flush()
      })
    }
  }

  private flush() {
    this.queue.forEach(fn => fn())
    this.queue.clear()
    this.rafId = null
  }

  clear() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
    this.queue.clear()
  }
}

// ===================================
// SIMULATOR STATUS CHECK
// ===================================

async function checkSimulatorStatus(assetPath: string): Promise<{
  isRunning: boolean
  hasCurrentPrice: boolean
  hasOHLC: boolean
  message: string
}> {
  if (!database) {
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
      message = 'Simulator not running - no data found'
    } else if (!hasCurrentPrice) {
      message = 'Missing current_price data'
    } else if (!hasOHLC) {
      message = 'Missing OHLC data'
    } else {
      message = 'Simulator running'
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

// ===================================
// MEMOIZED COMPONENTS
// ===================================

const SimulatorStatus = memo(({ 
  status, 
  onRetry 
}: { 
  status: { isRunning: boolean; message: string } | null
  onRetry: () => void
}) => {
  if (!status) return null
  
  if (status.isRunning) {
    return (
      <div className="absolute top-12 right-2 z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-lg backdrop-blur-md">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-400 font-medium">Live</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/95 z-20">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Server className="w-8 h-8 text-red-400" />
        </div>
        
        <div className="text-lg font-bold text-red-400 mb-2">
          Simulator Not Running
        </div>
        
        <div className="text-sm text-gray-400 mb-1">
          {status.message}
        </div>
        
        <div className="text-xs text-gray-500 mb-6">
          Please start the data simulator to view real-time data
        </div>
        
        <button 
          onClick={onRetry}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
        >
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

  const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d']

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
    <div className="lg:hidden absolute top-2 left-2 z-10" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg hover:bg-black/50 transition-all"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-white">{timeframe}</span>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-xs text-gray-300">{chartType === 'candle' ? 'Candle' : 'Line'}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-[#0f1419] border border-gray-800/50 rounded-lg shadow-2xl overflow-hidden animate-scale-in min-w-[200px]">
          <div className="p-2 border-b border-gray-800/50">
            <div className="text-[10px] font-semibold text-gray-400 mb-1.5 px-2">Timeframe</div>
            <div className="grid grid-cols-3 gap-1">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    onTimeframeChange(tf)
                    setIsOpen(false)
                  }}
                  disabled={isLoading}
                  className={`px-2 py-1.5 text-xs font-bold rounded transition-all ${
                    timeframe === tf
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#232936]'
                  } disabled:opacity-50`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 border-b border-gray-800/50">
            <div className="text-[10px] font-semibold text-gray-400 mb-1.5 px-2">Chart Type</div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  onChartTypeChange('candle')
                  setIsOpen(false)
                }}
                disabled={isLoading}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded transition-all ${
                  chartType === 'candle'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#232936]'
                }`}
              >
                Candle
              </button>
              <button
                onClick={() => {
                  onChartTypeChange('line')
                  setIsOpen(false)
                }}
                disabled={isLoading}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded transition-all ${
                  chartType === 'line'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#232936]'
                }`}
              >
                Line
              </button>
            </div>
          </div>

          <div className="p-2">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  onOpenIndicators()
                  setIsOpen(false)
                }}
                className="px-2 py-1.5 text-xs font-medium text-gray-300 bg-[#1a1f2e] hover:bg-[#232936] rounded transition-all flex items-center gap-2"
              >
                <Sliders className="w-3.5 h-3.5" />
                Indicators
              </button>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    onFitContent()
                    setIsOpen(false)
                  }}
                  className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-300 bg-[#1a1f2e] hover:bg-[#232936] rounded transition-all"
                >
                  Fit
                </button>
                <button
                  onClick={() => {
                    onRefresh()
                    setIsOpen(false)
                  }}
                  disabled={isLoading}
                  className="px-2 py-1.5 text-gray-300 bg-[#1a1f2e] hover:bg-[#232936] rounded transition-all disabled:opacity-50 flex items-center gap-1"
                >
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
}: any) => (
  <div className="hidden lg:block absolute top-2 left-2 z-10">
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5 bg-black/15 backdrop-blur-md border border-white/5 rounded-md p-0.5">
        {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            disabled={isLoading}
            className={`px-2 py-0.5 text-xs font-semibold rounded transition-all ${
              timeframe === tf
                ? 'bg-blue-500/70 text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            } disabled:opacity-50`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-0.5 bg-black/15 backdrop-blur-md border border-white/5 rounded-md p-0.5">
        <button
          onClick={() => onChartTypeChange('candle')}
          disabled={isLoading}
          className={`px-2 py-0.5 text-xs font-semibold rounded transition-all ${
            chartType === 'candle'
              ? 'bg-blue-500/70 text-white shadow-sm'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Candle
        </button>
        <button
          onClick={() => onChartTypeChange('line')}
          disabled={isLoading}
          className={`flex-1 px-2 py-0.5 text-xs font-semibold rounded transition-all ${
            chartType === 'line'
              ? 'bg-blue-500/70 text-white shadow-sm'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Line
        </button>
      </div>

      <div className="flex items-center gap-0.5 bg-black/15 backdrop-blur-md border border-white/5 rounded-md p-0.5">
        <button
          onClick={onOpenIndicators}
          className="px-2 py-0.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors flex items-center gap-1"
          title="Indicators"
        >
          <Sliders className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onFitContent}
          className="px-2 py-0.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          Fit
        </button>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={onToggleFullscreen}
          className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </button>
      </div>
    </div>
  </div>
))

DesktopControls.displayName = 'DesktopControls'

const OrderTicker = memo(({ orders, currentPrice }: { orders: BinaryOrder[], currentPrice?: number }) => {
  if (orders.length === 0) return null

  return (
    <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
      <div className="flex flex-col gap-2 items-start">
        {orders.map((order) => {
          const timeLeft = calculateTimeLeft(order.exit_time || '')
          const priceDiff = currentPrice ? currentPrice - order.entry_price : 0
          const isWinning = order.direction === 'CALL' ? priceDiff > 0 : priceDiff < 0

          return (
            <div
              key={order.id}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md border shadow-lg animate-slide-up pointer-events-auto ${
                isWinning
                  ? 'bg-green-500/20 border-green-500/50'
                  : 'bg-red-500/20 border-red-500/50'
              }`}
            >
              {order.direction === 'CALL' ? (
                <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}

              <div className="text-xs">
                <div className="font-semibold leading-tight">{order.asset_name}</div>
                <div className="text-gray-300 font-mono text-[10px]">{order.entry_price.toFixed(3)}</div>
              </div>

              <div className="w-px h-6 bg-white/10"></div>

              <div className="text-xs">
                <div className={`font-bold leading-tight ${isWinning ? 'text-green-400' : 'text-red-400'}`}>
                  {isWinning ? 'WIN' : 'LOSE'}
                </div>
                <div className="text-gray-300 font-mono text-[10px]">{timeLeft}</div>
              </div>

              <div className="w-px h-6 bg-white/10"></div>

              <div className="text-xs text-right">
                <div className="text-gray-400 text-[10px] leading-tight">Amount</div>
                <div className="font-bold font-mono leading-tight">{formatCurrency(order.amount)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

OrderTicker.displayName = 'OrderTicker'

// ===================================
// MAIN CHART COMPONENT
// ===================================

const TradingChart = memo(({ activeOrders = [], currentPrice }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const currentPriceLineRef = useRef<any>(null)
  
  // Indicator series refs
  const indicatorSeriesRefs = useRef<{
    sma?: ISeriesApi<"Line">
    ema?: ISeriesApi<"Line">
    bollingerUpper?: ISeriesApi<"Line">
    bollingerMiddle?: ISeriesApi<"Line">
    bollingerLower?: ISeriesApi<"Line">
    rsi?: ISeriesApi<"Line">
    macd?: ISeriesApi<"Line">
    macdSignal?: ISeriesApi<"Line">
    macdHistogram?: ISeriesApi<"Histogram">
    volume?: ISeriesApi<"Histogram">
    volumeMA?: ISeriesApi<"Line">
    stochasticK?: ISeriesApi<"Line">
    stochasticD?: ISeriesApi<"Line">
    atr?: ISeriesApi<"Line">
  }>({})
  
  const unsubscribeOHLCRef = useRef<(() => void) | null>(null)
  const unsubscribePriceRef = useRef<(() => void) | null>(null)
  
  const mountedRef = useRef(false)
  const rafQueueRef = useRef(new RAFQueue())
  const currentDataRef = useRef<CandleData[]>([])
  
  const { selectedAsset } = useTradingStore()

  const [chartType, setChartType] = useState<ChartType>('candle')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [simulatorStatus, setSimulatorStatus] = useState<{
    isRunning: boolean
    hasCurrentPrice: boolean
    hasOHLC: boolean
    message: string
  } | null>(null)
  
  const [showIndicators, setShowIndicators] = useState(false)
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>(DEFAULT_INDICATOR_CONFIG)

  // Check simulator status
  const checkSimulator = useCallback(async () => {
    if (!selectedAsset?.realtimeDbPath) return
    
    const status = await checkSimulatorStatus(selectedAsset.realtimeDbPath)
    setSimulatorStatus(status)
    
    if (!status.isRunning) {
      console.error('🚨 Simulator not running:', status.message)
    }
  }, [selectedAsset?.realtimeDbPath])

  // Calculate and render indicators
  const renderIndicators = useCallback(() => {
    if (!chartRef.current || currentDataRef.current.length === 0) return

    const data = currentDataRef.current

    // Clear existing indicator series
    Object.values(indicatorSeriesRefs.current).forEach(series => {
      if (series) {
        try {
          chartRef.current?.removeSeries(series)
        } catch (e) {}
      }
    })
    indicatorSeriesRefs.current = {}

    // SMA
    if (indicatorConfig.sma?.enabled && indicatorConfig.sma.period) {
      try {
        const smaData = calculateSMA(data, indicatorConfig.sma.period)
        const smaSeries = chartRef.current.addLineSeries({
          color: indicatorConfig.sma.color,
          lineWidth: 2,
          title: `SMA(${indicatorConfig.sma.period})`,
          priceLineVisible: false,
          lastValueVisible: false
        })
        smaSeries.setData(smaData.map(d => ({ time: d.time as UTCTimestamp, value: d.value })))
        indicatorSeriesRefs.current.sma = smaSeries
      } catch (e) {
        console.error('SMA error:', e)
      }
    }

    // EMA
    if (indicatorConfig.ema?.enabled && indicatorConfig.ema.period) {
      try {
        const emaData = calculateEMA(data, indicatorConfig.ema.period)
        const emaSeries = chartRef.current.addLineSeries({
          color: indicatorConfig.ema.color,
          lineWidth: 2,
          title: `EMA(${indicatorConfig.ema.period})`,
          priceLineVisible: false,
          lastValueVisible: false
        })
        emaSeries.setData(emaData.map(d => ({ time: d.time as UTCTimestamp, value: d.value })))
        indicatorSeriesRefs.current.ema = emaSeries
      } catch (e) {
        console.error('EMA error:', e)
      }
    }

    // Bollinger Bands
    if (indicatorConfig.bollinger?.enabled && indicatorConfig.bollinger.period) {
      try {
        const bbData = calculateBollingerBands(data, indicatorConfig.bollinger.period, indicatorConfig.bollinger.stdDev)
        
        const upperSeries = chartRef.current.addLineSeries({
          color: indicatorConfig.bollinger.colorUpper,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: `BB Upper`,
          priceLineVisible: false,
          lastValueVisible: false
        })
        upperSeries.setData(bbData.map(d => ({ time: d.time as UTCTimestamp, value: d.upper })))
        
        const middleSeries = chartRef.current.addLineSeries({
          color: indicatorConfig.bollinger.colorMiddle,
          lineWidth: 1,
          title: `BB Middle`,
          priceLineVisible: false,
          lastValueVisible: false
        })
        middleSeries.setData(bbData.map(d => ({ time: d.time as UTCTimestamp, value: d.middle })))
        
        const lowerSeries = chartRef.current.addLineSeries({
          color: indicatorConfig.bollinger.colorLower,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: `BB Lower`,
          priceLineVisible: false,
          lastValueVisible: false
        })
        lowerSeries.setData(bbData.map(d => ({ time: d.time as UTCTimestamp, value: d.lower })))
        
        indicatorSeriesRefs.current.bollingerUpper = upperSeries
        indicatorSeriesRefs.current.bollingerMiddle = middleSeries
        indicatorSeriesRefs.current.bollingerLower = lowerSeries
      } catch (e) {
        console.error('Bollinger Bands error:', e)
      }
    }

    // Volume
    if (indicatorConfig.volume?.enabled && data.some(d => d.volume)) {
      try {
        const volumeSeries = chartRef.current.addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume',
        })
        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        })
        volumeSeries.setData(data.map(d => ({
          time: d.time as UTCTimestamp,
          value: d.volume || 0,
          color: d.close >= d.open ? '#26a69a' : '#ef5350'
        })))
        indicatorSeriesRefs.current.volume = volumeSeries

        if (indicatorConfig.volume.maPeriod) {
          const volumeMAData = calculateVolumeMA(data, indicatorConfig.volume.maPeriod)
          const volumeMASeries = chartRef.current.addLineSeries({
            color: '#2962FF',
            lineWidth: 1,
            priceScaleId: 'volume',
            priceLineVisible: false,
            lastValueVisible: false
          })
          volumeMASeries.setData(volumeMAData.map(d => ({ time: d.time as UTCTimestamp, value: d.value })))
          indicatorSeriesRefs.current.volumeMA = volumeMASeries
        }
      } catch (e) {
        console.error('Volume error:', e)
      }
    }

    // Note: RSI, MACD, Stochastic, ATR require separate chart panels
    // For now, they're calculated but not displayed on the main chart
    // You would need to create additional chart containers for these oscillators

  }, [indicatorConfig])

  // Update indicators when config changes
  useEffect(() => {
    if (isInitialized && currentDataRef.current.length > 0) {
      renderIndicators()
    }
  }, [indicatorConfig, isInitialized, renderIndicators])

  // Update price line dengan RAF Queue
  const updateCurrentPriceLine = useCallback((price: number) => {
    if (!candleSeriesRef.current || !chartRef.current || !price) return
    
    rafQueueRef.current.add('priceline', () => {
      try {
        if (currentPriceLineRef.current && candleSeriesRef.current) {
          candleSeriesRef.current.removePriceLine(currentPriceLineRef.current)
        }
        
        if (candleSeriesRef.current) {
          currentPriceLineRef.current = candleSeriesRef.current.createPriceLine({
            price: price,
            color: '#3b82f6',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: 'Current',
            lineVisible: true,
          })
        }
        
        setLastPrice(price)
      } catch (error) {
        console.error('Price line update error:', error)
      }
    })
  }, [])

  // Initialize chart
  useEffect(() => {
    if (mountedRef.current) return
    
    const container = chartContainerRef.current
    if (!container) return

    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) return

    mountedRef.current = true

    try {
      const chart = createChart(container, {
        width,
        height,
        layout: {
          background: { type: ColorType.Solid, color: '#0a0e17' },
          textColor: '#9ca3af',
        },
        grid: {
          vertLines: { 
            color: 'rgba(255, 255, 255, 0.08)',
            style: 0,
            visible: true
          },
          horzLines: { 
            color: 'rgba(255, 255, 255, 0.08)',
            style: 0,
            visible: true
          },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          timeVisible: true,
        },
      })

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
        visible: chartType === 'candle',
      })

      const lineSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        visible: chartType === 'line',
      })

      chartRef.current = chart
      candleSeriesRef.current = candleSeries
      lineSeriesRef.current = lineSeries

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

      return () => {
        window.removeEventListener('resize', handleResize)
        
        if (unsubscribeOHLCRef.current) {
          unsubscribeOHLCRef.current()
        }
        if (unsubscribePriceRef.current) {
          unsubscribePriceRef.current()
        }
        
        rafQueueRef.current.clear()
        
        mountedRef.current = false
        setIsInitialized(false)
        
        try {
          chart.remove()
        } catch (e) {}
      }
    } catch (err: any) {
      console.error('Chart init error:', err)
      mountedRef.current = false
    }
  }, [])

  // Chart type change
  useEffect(() => {
    if (!candleSeriesRef.current || !lineSeriesRef.current) return

    if (chartType === 'candle') {
      candleSeriesRef.current.applyOptions({ visible: true })
      lineSeriesRef.current.applyOptions({ visible: false })
    } else {
      candleSeriesRef.current.applyOptions({ visible: false })
      lineSeriesRef.current.applyOptions({ visible: true })
    }
  }, [chartType])

  // Load data & subscribe
  useEffect(() => {
    if (!selectedAsset || !isInitialized || !candleSeriesRef.current || !lineSeriesRef.current) {
      return
    }

    let isCancelled = false

    const loadChartData = async () => {
      setIsLoading(true)

      await checkSimulator()

      if (unsubscribeOHLCRef.current) {
        unsubscribeOHLCRef.current()
        unsubscribeOHLCRef.current = null
      }
      
      if (unsubscribePriceRef.current) {
        unsubscribePriceRef.current()
        unsubscribePriceRef.current = null
      }

      try {
        let assetPath = selectedAsset.realtimeDbPath || `/${selectedAsset.symbol.toLowerCase()}`
        assetPath = cleanAssetPath(assetPath)

        const data = await fetchHistoricalData(assetPath, timeframe)

        if (isCancelled) return

        if (!data || data.length === 0) {
          setIsLoading(false)
          return
        }

        // Store data for indicator calculations
        currentDataRef.current = data.map(bar => ({
          time: bar.timestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume
        }))

        const candleData = data.map(bar => ({
          time: bar.timestamp as UTCTimestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        }))

        const lineData = data.map(bar => ({
          time: bar.timestamp as UTCTimestamp,
          value: bar.close,
        }))

        if (isCancelled) return

        if (candleSeriesRef.current && lineSeriesRef.current) {
          candleSeriesRef.current.setData(candleData)
          lineSeriesRef.current.setData(lineData)

          if (chartRef.current) {
            chartRef.current.timeScale().fitContent()
          }
        }

        // Render indicators
        renderIndicators()

        setIsLoading(false)

        // Subscribe
        unsubscribeOHLCRef.current = subscribeToOHLCUpdates(assetPath, timeframe, (newBar) => {
          if (isCancelled || !candleSeriesRef.current || !lineSeriesRef.current) return

          rafQueueRef.current.add('ohlc', () => {
            const candleUpdate = {
              time: newBar.timestamp as UTCTimestamp,
              open: newBar.open,
              high: newBar.high,
              low: newBar.low,
              close: newBar.close,
            }

            const lineUpdate = {
              time: newBar.timestamp as UTCTimestamp,
              value: newBar.close,
            }

            candleSeriesRef.current?.update(candleUpdate)
            lineSeriesRef.current?.update(lineUpdate)

            // Update stored data
            const existingIndex = currentDataRef.current.findIndex(d => d.time === newBar.timestamp)
            const newData: CandleData = {
              time: newBar.timestamp,
              open: newBar.open,
              high: newBar.high,
              low: newBar.low,
              close: newBar.close,
              volume: newBar.volume
            }

            if (existingIndex >= 0) {
              currentDataRef.current[existingIndex] = newData
            } else {
              currentDataRef.current.push(newData)
            }

            // Re-render indicators
            renderIndicators()
          })
        })
        
        unsubscribePriceRef.current = subscribeToPriceUpdates(
          assetPath,
          (priceData) => {
            if (isCancelled || !priceData?.price) return
            updateCurrentPriceLine(priceData.price)
          }
        )

      } catch (err: any) {
        if (isCancelled) return
        console.error('Error loading data:', err)
        setIsLoading(false)
      }
    }

    loadChartData()

    return () => {
      isCancelled = true
      if (unsubscribeOHLCRef.current) {
        unsubscribeOHLCRef.current()
      }
      if (unsubscribePriceRef.current) {
        unsubscribePriceRef.current()
      }
    }
  }, [selectedAsset?.id, timeframe, isInitialized, updateCurrentPriceLine, checkSimulator, renderIndicators])

  // Update current price
  useEffect(() => {
    if (currentPrice && isInitialized) {
      updateCurrentPriceLine(currentPrice)
    }
  }, [currentPrice, isInitialized, updateCurrentPriceLine])

  // Handlers
  const handleRefresh = useCallback(() => {
    if (!selectedAsset) return
    checkSimulator()
    
    const currentAsset = selectedAsset
    useTradingStore.setState({ selectedAsset: null })
    setTimeout(() => {
      useTradingStore.setState({ selectedAsset: currentAsset })
    }, 100)
  }, [selectedAsset, checkSimulator])

  const handleFitContent = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }, [])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setTimeframe(tf)
  }, [])

  const handleChartTypeChange = useCallback((type: ChartType) => {
    setChartType(type)
  }, [])

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

  return (
    <div className={`relative h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0e17]' : ''}`}>
      <DesktopControls
        timeframe={timeframe}
        chartType={chartType}
        isLoading={isLoading}
        onTimeframeChange={handleTimeframeChange}
        onChartTypeChange={handleChartTypeChange}
        onFitContent={handleFitContent}
        onRefresh={handleRefresh}
        onToggleFullscreen={toggleFullscreen}
        onOpenIndicators={() => setShowIndicators(true)}
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
        onOpenIndicators={() => setShowIndicators(true)}
      />

      <div className="absolute top-2 right-2 z-10 bg-black/15 backdrop-blur-md border border-white/5 rounded-md px-2 py-1">
        <div className="text-[10px] text-gray-300 flex items-center gap-1.5">
          <span className="font-semibold">{selectedAsset.symbol}</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400">{timeframe}</span>
          {lastPrice && (
            <>
              <span className="text-gray-500">•</span>
              <span className="text-green-400 font-mono font-semibold">{lastPrice.toFixed(3)}</span>
            </>
          )}
        </div>
      </div>

      <SimulatorStatus 
        status={simulatorStatus} 
        onRetry={checkSimulator}
      />

      <div 
        ref={chartContainerRef} 
        className="absolute inset-0 bg-[#0a0e17]"
      />

      <OrderTicker orders={activeOrders} currentPrice={currentPrice} />

      {isLoading && (
        <div className="absolute inset-0 bg-[#0a0e17]/95 z-20">
          <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
            <div className="text-sm text-gray-400">
              Loading {timeframe} chart data...
            </div>
          </div>
        </div>
      )}

      {/* Indicator Controls */}
      <IndicatorControls
        isOpen={showIndicators}
        onClose={() => setShowIndicators(false)}
        config={indicatorConfig}
        onChange={setIndicatorConfig}
      />

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
})

TradingChart.displayName = 'TradingChart'

export default TradingChart