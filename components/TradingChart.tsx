// components/TradingChart.tsx - REAL-TIME OPTIMIZED VERSION
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
  Activity
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

// ===================================
// OPTIMIZED COMPONENTS
// ===================================

const ChartControls = memo(({ 
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
      <div className="flex items-center gap-0.5 bg-black/15 backdrop-blur-md border border-white/5 rounded-md p-0.5 max-w-[140px] overflow-x-auto scrollbar-hide">
        {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            disabled={isLoading}
            className={`px-2 py-0.5 text-xs font-semibold rounded transition-all flex-shrink-0 ${
              timeframe === tf
                ? 'bg-blue-500/70 text-white shadow-sm backdrop-blur-sm'
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
              ? 'bg-blue-500/70 text-white shadow-sm backdrop-blur-sm'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          Candle
        </button>
        <button
          onClick={() => onChartTypeChange('line')}
          disabled={isLoading}
          className={`px-2 py-0.5 text-xs font-semibold rounded transition-all ${
            chartType === 'line'
              ? 'bg-blue-500/70 text-white shadow-sm backdrop-blur-sm'
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
          title="Fit content"
        >
          Fit
        </button>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
        <button
          onClick={onToggleFullscreen}
          className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </button>
      </div>
    </div>
  </div>
))

ChartControls.displayName = 'ChartControls'

// ===================================
// MAIN CHART COMPONENT
// ===================================

const TradingChart = memo(({ activeOrders = [], currentPrice }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const currentPriceLineRef = useRef<any>(null)
  
  // Unsubscribe functions
  const unsubscribeOHLCRef = useRef<(() => void) | null>(null)
  const unsubscribePriceRef = useRef<(() => void) | null>(null)
  
  const mountedRef = useRef(false)
  const orderMarkersRef = useRef<Map<string, OrderMarker>>(new Map())
  const lastBarTimestampRef = useRef<number>(0)
  const rafIdRef = useRef<number | null>(null)
  
  const { selectedAsset } = useTradingStore()

  const [chartType, setChartType] = useState<ChartType>('candle')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastPrice, setLastPrice] = useState<number | null>(null)

  // ===================================
  // REAL-TIME PRICE LINE UPDATE
  // ===================================
  
  const updateCurrentPriceLine = useCallback((price: number) => {
    if (!candleSeriesRef.current || !chartRef.current) return
    
    // Cancel previous RAF
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }
    
    // Use RAF for smooth updates
    rafIdRef.current = requestAnimationFrame(() => {
      try {
        // Remove old line
        if (currentPriceLineRef.current && candleSeriesRef.current) {
          candleSeriesRef.current.removePriceLine(currentPriceLineRef.current)
        }
        
        // Add new line
        if (candleSeriesRef.current) {
          currentPriceLineRef.current = candleSeriesRef.current.createPriceLine({
            price: price,
            color: '#3b82f6',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: 'Current'
          })
        }
        
        setLastPrice(price)
      } catch (error) {
        console.error('Price line update error:', error)
      }
    })
  }, [])

  // ===================================
  // ORDER MARKERS
  // ===================================
  
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

  // ===================================
  // UPDATE ORDERS
  // ===================================
  
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return

    const currentOrderIds = new Set(activeOrders.map(o => o.id))
    
    // Remove old markers
    orderMarkersRef.current.forEach((marker, orderId) => {
      if (!currentOrderIds.has(orderId)) {
        if (marker.entryLine && candleSeriesRef.current) {
          candleSeriesRef.current.removePriceLine(marker.entryLine)
        }
        orderMarkersRef.current.delete(orderId)
      }
    })

    // Update markers
    if (candleSeriesRef.current) {
      candleSeriesRef.current.setMarkers([])
    }

    activeOrders.forEach(order => {
      updateOrderMarker(order)
    })
  }, [activeOrders, updateOrderMarker])

  // ===================================
  // UPDATE CURRENT PRICE LINE
  // ===================================
  
  useEffect(() => {
    if (currentPrice && isInitialized) {
      updateCurrentPriceLine(currentPrice)
    }
  }, [currentPrice, isInitialized, updateCurrentPriceLine])

  // ===================================
  // INITIALIZE CHART
  // ===================================
  
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
          vertLines: { color: 'rgba(255, 255, 255, 0.1)' },
          horzLines: { color: 'rgba(255, 255, 255, 0.1)' },
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
        
        // Cleanup
        if (unsubscribeOHLCRef.current) {
          unsubscribeOHLCRef.current()
          unsubscribeOHLCRef.current = null
        }
        
        if (unsubscribePriceRef.current) {
          unsubscribePriceRef.current()
          unsubscribePriceRef.current = null
        }
        
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current)
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

  // ===================================
  // CHART TYPE CHANGE
  // ===================================
  
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

  // ===================================
  // LOAD DATA & SUBSCRIBE
  // ===================================
  
  useEffect(() => {
    if (!selectedAsset || !isInitialized || !candleSeriesRef.current || !lineSeriesRef.current) {
      return
    }

    let isCancelled = false

    const loadChartData = async () => {
      setIsLoading(true)
      setError(null)

      // Cleanup previous subscriptions
      if (unsubscribeOHLCRef.current) {
        unsubscribeOHLCRef.current()
        unsubscribeOHLCRef.current = null
      }
      
      if (unsubscribePriceRef.current) {
        unsubscribePriceRef.current()
        unsubscribePriceRef.current = null
      }

      try {
        const pathParts = selectedAsset.realtimeDbPath?.split('/') || []
        const assetPath = pathParts.slice(0, -1).join('/') || `/${selectedAsset.symbol.toLowerCase()}`

        // Load historical data
        const data = await fetchHistoricalData(assetPath, timeframe)

        if (isCancelled) return

        if (!data || data.length === 0) {
          setError('No data available. Check simulator.')
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

        if (candleSeriesRef.current && lineSeriesRef.current) {
          candleSeriesRef.current.setData(candleData)
          lineSeriesRef.current.setData(lineData)

          if (chartRef.current) {
            chartRef.current.timeScale().fitContent()
          }
          
          // Store last bar timestamp
          if (data.length > 0) {
            lastBarTimestampRef.current = data[data.length - 1].timestamp
          }
        }

        setIsLoading(false)

        // ✅ SUBSCRIBE TO OHLC UPDATES
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
          
          // Update last bar timestamp
          lastBarTimestampRef.current = newBar.timestamp
        })
        
        // ✅ SUBSCRIBE TO REAL-TIME PRICE (for current price line)
        if (selectedAsset.realtimeDbPath) {
          unsubscribePriceRef.current = subscribeToPriceUpdates(
            selectedAsset.realtimeDbPath, 
            (priceData) => {
              if (isCancelled) return
              updateCurrentPriceLine(priceData.price)
            }
          )
        }

      } catch (err: any) {
        if (isCancelled) return
        console.error('Error loading data:', err)
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

  // ===================================
  // HANDLERS
  // ===================================
  
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

  // ===================================
  // RENDER
  // ===================================
  
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
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0e17]' : 'h-full'}`}>
      <ChartControls
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

      {/* Chart Info */}
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

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full h-full bg-[#0a0e17]"
        style={{ minHeight: '400px' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/90 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
            <div className="text-sm text-gray-400">Loading {timeframe} data...</div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
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
    </div>
  )
})

TradingChart.displayName = 'TradingChart'

export default TradingChart