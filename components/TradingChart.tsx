// components/TradingChart.tsx - REALTIME OPTIMIZED
'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, Time, UTCTimestamp } from 'lightweight-charts'
import { useTradingStore } from '@/store/trading'
import { fetchHistoricalData, subscribeToOHLCUpdates, subscribeToPriceUpdates } from '@/lib/firebase'
import { BinaryOrder } from '@/types'
import { formatCurrency, calculateTimeLeft } from '@/lib/utils'
import { 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  AlertCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  ChevronDown
} from 'lucide-react'

type ChartType = 'line' | 'candle'
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

interface OrderMarker {
  order: BinaryOrder
  entryMarker: any
  entryLine: any
}

interface TradingChartProps {
  activeOrders?: BinaryOrder[]
  currentPrice?: number
}

// Clean asset path
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

// Mobile Controls Component
const MobileControls = memo(({ 
  timeframe, 
  chartType, 
  isLoading,
  onTimeframeChange,
  onChartTypeChange,
  onFitContent,
  onRefresh
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
            <div className="flex gap-1">
              <button
                onClick={() => {
                  onFitContent()
                  setIsOpen(false)
                }}
                className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-300 bg-[#1a1f2e] hover:bg-[#232936] rounded transition-all"
              >
                Fit Content
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
      )}
    </div>
  )
})

MobileControls.displayName = 'MobileControls'

// Desktop Controls Component
const DesktopControls = memo(({ 
  timeframe, 
  chartType, 
  isLoading,
  onTimeframeChange,
  onChartTypeChange,
  onFitContent,
  onRefresh,
  onToggleFullscreen,
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

// Order Ticker Component
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

// Main Chart Component
const TradingChart = memo(({ activeOrders = [], currentPrice }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const currentPriceLineRef = useRef<any>(null)
  
  const unsubscribeOHLCRef = useRef<(() => void) | null>(null)
  const unsubscribePriceRef = useRef<(() => void) | null>(null)
  
  const mountedRef = useRef(false)
  const orderMarkersRef = useRef<Map<string, OrderMarker>>(new Map())
  
  const { selectedAsset } = useTradingStore()

  const [chartType, setChartType] = useState<ChartType>('candle')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // ✅ REALTIME: Update price line with RAF optimization
  const updateCurrentPriceLine = useCallback((price: number) => {
    if (!candleSeriesRef.current || !chartRef.current) return
    
    requestAnimationFrame(() => {
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

  // Order markers management
  const updateOrderMarker = useCallback((order: BinaryOrder) => {
    if (!candleSeriesRef.current || !chartRef.current) return

    const existingMarker = orderMarkersRef.current.get(order.id)
    if (existingMarker && order.status === 'ACTIVE') return

    const entryTime = Math.floor(new Date(order.entry_time).getTime() / 1000) as Time
    const isCall = order.direction === 'CALL'

    if (existingMarker) {
      if (existingMarker.entryLine && candleSeriesRef.current) {
        candleSeriesRef.current.removePriceLine(existingMarker.entryLine)
      }
    }

    const entryMarker = {
      time: entryTime,
      position: isCall ? 'belowBar' as const : 'aboveBar' as const,
      color: isCall ? '#10b981' : '#ef4444',
      shape: isCall ? 'arrowUp' as const : 'arrowDown' as const,
      text: `${order.direction} ${formatCurrency(order.amount)}`,
      size: 2
    }

    const entryLine = candleSeriesRef.current.createPriceLine({
      price: order.entry_price,
      color: isCall ? '#10b981' : '#ef4444',
      lineWidth: 2,
      lineStyle: 2,
      axisLabelVisible: true,
      title: `${order.direction} Entry`
    })

    const existingMarkers = candleSeriesRef.current.markers() || []
    candleSeriesRef.current.setMarkers([...existingMarkers, entryMarker])

    orderMarkersRef.current.set(order.id, {
      order,
      entryMarker,
      entryLine
    })
  }, [])

  // Update orders
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return

    const currentOrderIds = new Set(activeOrders.map(o => o.id))
    
    orderMarkersRef.current.forEach((marker, orderId) => {
      if (!currentOrderIds.has(orderId)) {
        if (marker.entryLine && candleSeriesRef.current) {
          candleSeriesRef.current.removePriceLine(marker.entryLine)
        }
        orderMarkersRef.current.delete(orderId)
      }
    })

    if (candleSeriesRef.current) {
      candleSeriesRef.current.setMarkers([])
    }

    activeOrders.forEach(order => {
      updateOrderMarker(order)
    })
  }, [activeOrders, updateOrderMarker])

  // ✅ REALTIME: Update current price immediately
  useEffect(() => {
    if (currentPrice && isInitialized) {
      updateCurrentPriceLine(currentPrice)
    }
  }, [currentPrice, isInitialized, updateCurrentPriceLine])

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
          vertLine: {
            color: 'rgba(255, 255, 255, 0.3)',
            width: 1,
            style: 3,
          },
          horzLine: {
            color: 'rgba(255, 255, 255, 0.3)',
            width: 1,
            style: 3,
          },
        },
        rightPriceScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderVisible: true,
        },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderVisible: true,
          timeVisible: true,
          secondsVisible: false,
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
          unsubscribeOHLCRef.current = null
        }
        
        if (unsubscribePriceRef.current) {
          unsubscribePriceRef.current()
          unsubscribePriceRef.current = null
        }
        
        if (currentPriceLineRef.current && candleSeriesRef.current) {
          candleSeriesRef.current.removePriceLine(currentPriceLineRef.current)
        }
        
        orderMarkersRef.current.forEach((marker) => {
          if (marker.entryLine && candleSeriesRef.current) {
            candleSeriesRef.current.removePriceLine(marker.entryLine)
          }
        })
        orderMarkersRef.current.clear()
        
        mountedRef.current = false
        setIsInitialized(false)
        
        try {
          chart.remove()
        } catch (e) {
          // Ignore
        }
      }
    } catch (err: any) {
      console.error('Chart init error:', err)
      setError(`Chart initialization failed: ${err.message}`)
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

  // ✅ REALTIME: Load data & subscribe
  useEffect(() => {
    if (!selectedAsset || !isInitialized || !candleSeriesRef.current || !lineSeriesRef.current) {
      return
    }

    let isCancelled = false

    const loadChartData = async () => {
      setIsLoading(true)
      setError(null)
      setLoadingProgress(0)

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

        console.log('📊 Loading chart data:', assetPath, timeframe)
        
        setLoadingProgress(30)

        const data = await fetchHistoricalData(assetPath, timeframe)

        if (isCancelled) return

        setLoadingProgress(60)

        if (!data || data.length === 0) {
          setError('No data available. Check if simulator is running.')
          setIsLoading(false)
          return
        }

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

        setLoadingProgress(90)

        if (candleSeriesRef.current && lineSeriesRef.current) {
          candleSeriesRef.current.setData(candleData)
          lineSeriesRef.current.setData(lineData)

          if (chartRef.current) {
            chartRef.current.timeScale().fitContent()
          }
        }

        setLoadingProgress(100)
        setIsLoading(false)

        // ✅ REALTIME: Subscribe to OHLC updates
        unsubscribeOHLCRef.current = subscribeToOHLCUpdates(assetPath, timeframe, (newBar) => {
          if (isCancelled || !candleSeriesRef.current || !lineSeriesRef.current) return

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

          candleSeriesRef.current.update(candleUpdate)
          lineSeriesRef.current.update(lineUpdate)
        })
        
        // ✅ REALTIME: Subscribe to price updates
        unsubscribePriceRef.current = subscribeToPriceUpdates(
          assetPath,
          (priceData) => {
            if (isCancelled) return
            updateCurrentPriceLine(priceData.price)
          }
        )

      } catch (err: any) {
        if (isCancelled) return
        console.error('❌ Error loading data:', err)
        setError(err.message || 'Failed to load chart data')
        setIsLoading(false)
      }
    }

    loadChartData()

    return () => {
      isCancelled = true
      if (unsubscribeOHLCRef.current) {
        unsubscribeOHLCRef.current()
        unsubscribeOHLCRef.current = null
      }
      if (unsubscribePriceRef.current) {
        unsubscribePriceRef.current()
        unsubscribePriceRef.current = null
      }
    }
  }, [selectedAsset?.id, timeframe, isInitialized, updateCurrentPriceLine])

  // Handlers
  const handleRefresh = useCallback(() => {
    if (!selectedAsset) return
    
    const currentAsset = selectedAsset
    useTradingStore.setState({ selectedAsset: null })
    setTimeout(() => {
      useTradingStore.setState({ selectedAsset: currentAsset })
    }, 100)
  }, [selectedAsset])

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
      />

      <div className="absolute top-2 right-2 z-10 bg-black/15 backdrop-blur-md border border-white/5 rounded-md px-2 py-1">
        <div className="text-[10px] text-gray-300 flex items-center gap-1.5">
          <span className="font-semibold">{selectedAsset.symbol}</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400">{timeframe}</span>
          {activeOrders.length > 0 && (
            <>
              <span className="text-gray-500">•</span>
              <span className="text-blue-400 font-semibold">{activeOrders.length} Active</span>
            </>
          )}
          {lastPrice && (
            <>
              <span className="text-gray-500">•</span>
              <span className="text-green-400 font-mono font-semibold">{lastPrice.toFixed(3)}</span>
            </>
          )}
        </div>
      </div>

      <div 
        ref={chartContainerRef} 
        className="absolute inset-0 bg-[#0a0e17]"
      />

      <OrderTicker orders={activeOrders} currentPrice={currentPrice} />

      {isLoading && (
        <div className="absolute inset-0 bg-[#0a0e17]/95 z-20">
          <div className="h-full flex flex-col p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <div className="w-12 h-8 bg-gray-800 rounded animate-pulse"></div>
                <div className="w-12 h-8 bg-gray-800 rounded animate-pulse" style={{ animationDelay: '100ms' }}></div>
                <div className="w-12 h-8 bg-gray-800 rounded animate-pulse" style={{ animationDelay: '200ms' }}></div>
              </div>
              <div className="w-24 h-8 bg-gray-800 rounded animate-pulse" style={{ animationDelay: '300ms' }}></div>
            </div>
            
            <div className="flex-1 flex items-end gap-1">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-blue-500/20 to-blue-500/5 rounded-t animate-pulse"
                  style={{
                    height: `${20 + Math.random() * 80}%`,
                    animationDelay: `${i * 30}ms`,
                    animationDuration: '1.5s'
                  }}
                />
              ))}
            </div>
            
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-400 mb-2">
                Loading {timeframe} chart data...
              </div>
              <div className="w-48 h-1 bg-gray-800 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 animate-loading-bar"></div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {loadingProgress}% complete
              </div>
            </div>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/90 z-20">
          <div className="text-center max-w-md px-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3 opacity-30" />
            <div className="text-sm font-medium text-red-400 mb-2">Failed to Load Chart</div>
            <div className="text-xs text-gray-500 mb-4">{error}</div>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

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

        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
})

TradingChart.displayName = 'TradingChart'

export default TradingChart