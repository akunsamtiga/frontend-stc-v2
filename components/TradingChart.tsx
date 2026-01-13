// components/TradingChart.tsx
'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, UTCTimestamp, LineStyle, LineWidth } from 'lightweight-charts'
import { useTradingStore } from '@/store/trading'
import { fetchHistoricalData, subscribeToOHLCUpdates, subscribeToPriceUpdates } from '@/lib/firebase'
import { BinaryOrder } from '@/types'
import { formatCurrency, calculateTimeLeft } from '@/lib/utils'
import { database, ref, get } from '@/lib/firebase'
import dynamic from 'next/dynamic'
import { Maximize2, Minimize2, RefreshCw, Activity, TrendingUp, TrendingDown, ChevronDown, Server, Sliders, Clock, BarChart2, ArrowUp, ArrowDown, HelpCircle, X, MessageCircle, Mail, Send, Minus, TrendingDownIcon as LineIcon, Circle, Square, ArrowRight, Type, Zap } from 'lucide-react'

const IndicatorControls = dynamic(() => import('./IndicatorControls'), { ssr: false })

type ChartType = 'line' | 'candle'
type Timeframe = '1s' | '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
type DrawingTool = 'none' | 'trendline' | 'horizontal' | 'vertical' | 'rectangle' | 'circle' | 'text'

interface TradingChartProps {
  activeOrders?: BinaryOrder[]
  currentPrice?: number
}

interface DrawingObject {
  id: string
  type: DrawingTool
  points: { time: number; price: number }[]
  color: string
  text?: string
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

function cleanAssetPath(path: string): string {
  if (!path) return ''
  if (path.endsWith('/current_price')) {
    path = path.replace('/current_price', '')
  }
  path = path.replace(/\/$/, '')
  if (!path.startsWith('/')) path = '/' + path
  return path
}

function getTimeframeSeconds(timeframe: Timeframe): number {
  switch (timeframe) {
    case '1s': return 1
    case '1m': return 60
    case '5m': return 300
    case '15m': return 900
    case '1h': return 3600
    case '4h': return 14400
    case '1d': return 86400
    default: return 60
  }
}

function getBarPeriodTimestamp(timestamp: number, timeframe: Timeframe): number {
  const seconds = getTimeframeSeconds(timeframe)
  return Math.floor(timestamp / seconds) * seconds
}

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
          {timeStr} <span className="text-gray-400">|</span> {dateStr}
        </div>
      </div>
    </div>
  )
})

RealtimeClock.displayName = 'RealtimeClock'

const PriceDisplay = memo(({ asset, price }: { asset: any; price: any }) => {
  if (!asset || !price) return null

  const hasChange = price.change !== undefined && price.change !== 0

  return (
    <div className="absolute top-2 left-2 z-10 bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{asset.name}</span>
          <span className="text-xl font-bold">{price.price.toFixed(3)}</span>
        </div>
        {hasChange && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            price.change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {price.change >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span>{price.change >= 0 ? '+' : ''}{price.change.toFixed(2)}%</span>
          </div>
        )}
      </div>
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

  return (
    <div className="absolute bottom-12 left-2 z-10 bg-[#0a0e17] border border-gray-800/50 rounded-lg px-3 py-2 text-xs">
      <div className="flex items-center gap-1 text-gray-400 mb-1">
        <Clock className="w-3 h-3" />
        <span>{timeStr} WIB</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <div className="text-gray-500">O:</div><div className="text-white text-right">{data.open.toFixed(3)}</div>
        <div className="text-gray-500">H:</div><div className="text-green-400 text-right">{data.high.toFixed(3)}</div>
        <div className="text-gray-500">L:</div><div className="text-red-400 text-right">{data.low.toFixed(3)}</div>
        <div className="text-gray-500">C:</div><div className="text-blue-400 text-right">{data.close.toFixed(3)}</div>
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

  const timeframes: Timeframe[] = ['1s', '1m', '5m', '15m', '1h', '4h', '1d']

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
          {timeframe === '1s' ? <Zap className="w-3 h-3 text-yellow-400" /> : <Clock className="w-3 h-3 text-gray-300" />}
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
                  {tf === '1s' && <Zap className="w-2.5 h-2.5" />}
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

  const timeframes: Timeframe[] = ['1s', '1m', '5m', '15m', '1h', '4h', '1d']

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
          <button onClick={() => setShowTimeframeMenu(!showTimeframeMenu)} className="p-2.5 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg hover:bg-black/30 transition-all flex items-center gap-1.5" title="Timeframe">
            {timeframe === '1s' ? <Zap className="w-5 h-5 text-yellow-400" /> : <Clock className="w-5 h-5 text-gray-300" />}
            <span className="text-xs font-bold text-white">{timeframe}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showTimeframeMenu ? 'rotate-180' : ''}`} />
          </button>

          {showTimeframeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTimeframeMenu(false)} />
              <div className="absolute top-full right-0 mt-1 bg-[#0f1419] border border-gray-800/50 rounded-lg shadow-2xl z-50 overflow-hidden min-w-[120px]">
                {timeframes.map((tf) => (
                  <button key={tf} onClick={() => { onTimeframeChange(tf); setShowTimeframeMenu(false) }} disabled={isLoading} className={`w-full px-4 py-2.5 text-left text-sm font-bold transition-all flex items-center gap-2 ${
                    timeframe === tf ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-[#1a1f2e]'
                  } disabled:opacity-50`}>
                    {tf === '1s' && <Zap className="w-3.5 h-3.5" />}
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
          <button onClick={onOpenIndicators} className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors" title="Indicators">
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

const TradingChart = memo(({ activeOrders = [], currentPrice }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  
  const unsubscribe1sRef = useRef<(() => void) | null>(null)
  const unsubscribeTimeframeRef = useRef<(() => void) | null>(null)
  
  const mountedRef = useRef(false)
  const currentDataRef = useRef<any[]>([])
  
  // ✅ KUNCI: State untuk menyimpan bar yang sedang berlangsung
  const currentBarRef = useRef<{
    timestamp: number
    open: number
    high: number
    low: number
    close: number
    volume: number
  } | null>(null)
  
  const { selectedAsset } = useTradingStore()

  const [chartType, setChartType] = useState<ChartType>('candle')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [openingPrice, setOpeningPrice] = useState<number | null>(null)
  const [simulatorStatus, setSimulatorStatus] = useState<{
    isRunning: boolean
    hasCurrentPrice: boolean
    hasOHLC: boolean
    message: string
  } | null>(null)
  
  const [showIndicators, setShowIndicators] = useState(false)
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>(DEFAULT_INDICATOR_CONFIG)
  
  const [ohlcData, setOhlcData] = useState<{
    time: number
    open: number
    high: number
    low: number
    close: number
  } | null>(null)
  const [showOhlc, setShowOhlc] = useState(false)

  const checkSimulator = useCallback(async () => {
    if (!selectedAsset?.realtimeDbPath) return
    
    const status = await checkSimulatorStatus(selectedAsset.realtimeDbPath)
    setSimulatorStatus(status)
    
    if (!status.isRunning) {
      console.error('Simulator not running:', status.message)
    }
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

  // ✅ Initialize chart
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
        visible: chartType === 'candle'
      })

      const lineSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        visible: chartType === 'line'
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
        
        if (unsubscribe1sRef.current) unsubscribe1sRef.current()
        if (unsubscribeTimeframeRef.current) unsubscribeTimeframeRef.current()
        
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
  }, [chartType])

  // ✅ Chart type switch
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

  // ✅ MAIN LOGIC: Load data dan subscribe ke real-time updates
  useEffect(() => {
    if (!selectedAsset || !isInitialized || !candleSeriesRef.current || !lineSeriesRef.current) {
      return
    }

    let isCancelled = false

    const loadChartData = async () => {
      setIsLoading(true)
      setOpeningPrice(null)
      setLastPrice(null)
      currentBarRef.current = null

      await checkSimulator()

      // Cleanup previous subscriptions
      if (unsubscribe1sRef.current) {
        unsubscribe1sRef.current()
        unsubscribe1sRef.current = null
      }
      
      if (unsubscribeTimeframeRef.current) {
        unsubscribeTimeframeRef.current()
        unsubscribeTimeframeRef.current = null
      }

      try {
        let assetPath = selectedAsset.realtimeDbPath || `/${selectedAsset.symbol.toLowerCase()}`
        assetPath = cleanAssetPath(assetPath)

        // ✅ Load historical data
        const data = await fetchHistoricalData(assetPath, timeframe)

        if (isCancelled) return

        if (!data || data.length === 0) {
          setIsLoading(false)
          return
        }

        currentDataRef.current = data.map((bar: any) => ({
          time: bar.timestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume
        }))

        const candleData = data.map((bar: any) => ({
          time: bar.timestamp as UTCTimestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close
        }))

        const lineData = data.map((bar: any) => ({
          time: bar.timestamp as UTCTimestamp,
          value: bar.close
        }))

        if (isCancelled) return

        if (candleSeriesRef.current && lineSeriesRef.current) {
          candleSeriesRef.current.setData(candleData)
          lineSeriesRef.current.setData(lineData)

          if (chartRef.current) {
            chartRef.current.timeScale().fitContent()
          }

          if (data.length > 0) {
            setOpeningPrice(data[0].open)
            setLastPrice(data[data.length - 1].close)
            
            // Initialize current bar
            const lastBar = data[data.length - 1]
            currentBarRef.current = {
              timestamp: lastBar.timestamp,
              open: lastBar.open,
              high: lastBar.high,
              low: lastBar.low,
              close: lastBar.close,
              volume: lastBar.volume || 0
            }
          }
        }

        setIsLoading(false)

        // ✅ KUNCI 1: Subscribe to 1s updates (always, regardless of timeframe)
        // Ini memberikan update price setiap detik untuk smooth animation
        unsubscribe1sRef.current = subscribeToOHLCUpdates(assetPath, '1s', (tick1s) => {
          if (isCancelled || !candleSeriesRef.current || !lineSeriesRef.current) return

          try {
            const newPrice = tick1s.close
            const currentTimestamp = Math.floor(Date.now() / 1000)
            
            // Calculate which bar period this tick belongs to
            const barPeriod = getBarPeriodTimestamp(currentTimestamp, timeframe)
            
            // ✅ KUNCI 2: Update current bar smoothly
            if (!currentBarRef.current || currentBarRef.current.timestamp !== barPeriod) {
              // New bar starts
              currentBarRef.current = {
                timestamp: barPeriod,
                open: newPrice,
                high: newPrice,
                low: newPrice,
                close: newPrice,
                volume: 0
              }
            } else {
              // Update existing bar
              currentBarRef.current.high = Math.max(currentBarRef.current.high, newPrice)
              currentBarRef.current.low = Math.min(currentBarRef.current.low, newPrice)
              currentBarRef.current.close = newPrice
            }

            // ✅ KUNCI 3: Update chart smoothly with current bar
            const updatedBar = {
              time: currentBarRef.current.timestamp as UTCTimestamp,
              open: currentBarRef.current.open,
              high: currentBarRef.current.high,
              low: currentBarRef.current.low,
              close: currentBarRef.current.close
            }

            // Check if this is updating the last bar or creating a new one
            const existingData = candleSeriesRef.current.data()
            const lastBarTime = existingData.length > 0 ? existingData[existingData.length - 1].time : 0
            
            if (currentBarRef.current.timestamp === lastBarTime) {
              // Update existing bar (smooth animation)
              candleSeriesRef.current.update(updatedBar)
              lineSeriesRef.current.update({ time: updatedBar.time, value: updatedBar.close })
            } else {
              // New bar period - add new bar
              candleSeriesRef.current.update(updatedBar)
              lineSeriesRef.current.update({ time: updatedBar.time, value: updatedBar.close })
              
              // Update internal data
              currentDataRef.current.push({
                time: currentBarRef.current.timestamp,
                open: currentBarRef.current.open,
                high: currentBarRef.current.high,
                low: currentBarRef.current.low,
                close: currentBarRef.current.close,
                volume: currentBarRef.current.volume
              })
              
              // Keep only last 1000 bars
              if (currentDataRef.current.length > 1000) {
                currentDataRef.current.shift()
              }
            }

            setLastPrice(newPrice)

          } catch (error) {
            console.error('1s update error:', error)
          }
        })

        // ✅ Subscribe to selected timeframe updates (for new complete bars)
        if (timeframe !== '1s') {
          unsubscribeTimeframeRef.current = subscribeToOHLCUpdates(assetPath, timeframe, (newBar) => {
            if (isCancelled) return

            try {
              // When a new complete bar arrives from the selected timeframe,
              // synchronize our current bar data
              if (newBar.isNewBar) {
                const barPeriod = getBarPeriodTimestamp(newBar.timestamp, timeframe)
                
                // Update current bar ref with complete bar data
                currentBarRef.current = {
                  timestamp: barPeriod,
                  open: newBar.open,
                  high: newBar.high,
                  low: newBar.low,
                  close: newBar.close,
                  volume: newBar.volume || 0
                }
              }
            } catch (error) {
              console.error('Timeframe update error:', error)
            }
          })
        }

      } catch (err: any) {
        if (isCancelled) return
        console.error('Error loading data:', err)
        setIsLoading(false)
      }
    }

    loadChartData()

    return () => {
      isCancelled = true
      if (unsubscribe1sRef.current) unsubscribe1sRef.current()
      if (unsubscribeTimeframeRef.current) unsubscribeTimeframeRef.current()
    }
  }, [selectedAsset?.id, timeframe, isInitialized, checkSimulator])

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

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setTimeframe(tf)
  }, [])

  const handleChartTypeChange = useCallback((type: ChartType) => {
    setChartType(type)
  }, [])

  const calculatePriceChange = useCallback(() => {
    if (!lastPrice || !openingPrice || openingPrice === 0) return 0
    return ((lastPrice - openingPrice) / openingPrice) * 100
  }, [lastPrice, openingPrice])

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
      <PriceDisplay asset={selectedAsset} price={currentPriceData} />
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

      <SimulatorStatus status={simulatorStatus} onRetry={checkSimulator} />

      <OHLCDisplay data={ohlcData} visible={showOhlc} />

      <div ref={chartContainerRef} className="absolute inset-0 bg-[#0a0e17]" />

      {isLoading && (
        <div className="absolute inset-0 bg-[#0a0e17]/95 z-20">
          <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
            <div className="text-sm text-gray-400">Loading {timeframe} chart data...</div>
          </div>
        </div>
      )}

      <IndicatorControls 
        isOpen={showIndicators} 
        onClose={() => setShowIndicators(false)} 
        config={indicatorConfig} 
        onChange={setIndicatorConfig} 
      />

      <style jsx>{`
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in { animation: scale-in 0.2s ease-out; }
      `}</style>
    </div>
  )
})

TradingChart.displayName = 'TradingChart'

export default TradingChart