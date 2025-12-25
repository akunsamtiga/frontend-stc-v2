// components/TradingChart.tsx
'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, Time, UTCTimestamp } from 'lightweight-charts'
import { useTradingStore } from '@/store/trading'
import { fetchHistoricalData, subscribeToOHLCUpdates, subscribeToPriceUpdates } from '@/lib/firebase'
import { BinaryOrder } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  AlertCircle,
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

type ChartType = 'line' | 'candle'
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

interface TradingChartProps {
  activeOrders?: BinaryOrder[]
  currentPrice?: number
}

interface OrderMarker {
  order: BinaryOrder
  entryMarker: any
  entryLine: any
}

// Optimized Controls Component
const ChartControls = memo(({ 
  timeframe, 
  chartType, 
  isLoading,
  isMobile,
  onTimeframeChange,
  onChartTypeChange,
  onFitContent,
  onRefresh,
  onToggleFullscreen,
  isFullscreen
}: any) => (
  <div className={`absolute ${isMobile ? 'top-1 left-1 right-1' : 'top-2 left-2'} z-10`}>
    <div className="flex items-center gap-1.5">
      {/* Timeframe Selector */}
      <div className={`flex items-center gap-0.5 bg-black/20 backdrop-blur-md border border-white/10 rounded-md p-0.5 ${
        isMobile ? 'overflow-x-auto scrollbar-hide max-w-[200px]' : 'max-w-[140px] overflow-x-auto scrollbar-hide'
      }`}>
        {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            disabled={isLoading}
            className={`${isMobile ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'} font-semibold rounded transition-all flex-shrink-0 ${
              timeframe === tf
                ? 'bg-blue-500/80 text-white shadow-sm backdrop-blur-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            } disabled:opacity-50`}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart Type Selector */}
      <div className="flex items-center gap-0.5 bg-black/20 backdrop-blur-md border border-white/10 rounded-md p-0.5">
        <button
          onClick={() => onChartTypeChange('candle')}
          disabled={isLoading}
          className={`${isMobile ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'} font-semibold rounded transition-all ${
            chartType === 'candle'
              ? 'bg-blue-500/80 text-white shadow-sm backdrop-blur-sm'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          {isMobile ? <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0v3M8 13v3M2 7h3M11 7h3M4 4h8v8H4z"/></svg> : 'Candle'}
        </button>
        <button
          onClick={() => onChartTypeChange('line')}
          disabled={isLoading}
          className={`${isMobile ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs'} font-semibold rounded transition-all ${
            chartType === 'line'
              ? 'bg-blue-500/80 text-white shadow-sm backdrop-blur-sm'
              : 'text-gray-300 hover:text-white hover:bg-white/10'
          }`}
        >
          {isMobile ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4"/></svg> : 'Line'}
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-0.5 bg-black/20 backdrop-blur-md border border-white/10 rounded-md p-0.5">
        {!isMobile && (
          <button
            onClick={onFitContent}
            className="px-2 py-0.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Fit content"
          >
            Fit
          </button>
        )}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className={`${isMobile ? 'p-0.5' : 'p-1'} text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50`}
          title="Refresh"
        >
          <RefreshCw className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} ${isLoading ? 'animate-spin' : ''}`} />
        </button>
        {!isMobile && (
          <button
            onClick={onToggleFullscreen}
            className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        )}
      </div>
    </div>
  </div>
))

ChartControls.displayName = 'ChartControls'

// Loading Skeleton
const ChartSkeleton = () => (
  <div className="w-full h-full flex items-center justify-center bg-[#0a0e17]">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <div className="space-y-2">
        <div className="text-sm text-gray-400 animate-pulse">Loading chart data...</div>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  </div>
)

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
  const rafIdRef = useRef<number | null>(null)
  
  const { selectedAsset } = useTradingStore()

  const [chartType, setChartType] = useState<ChartType>('candle')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update current price line
  const updateCurrentPriceLine = useCallback((price: number) => {
    if (!candleSeriesRef.current || !chartRef.current) return
    
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current)
    }
    
    rafIdRef.current = requestAnimationFrame(() => {
      try {
        if (currentPriceLineRef.current && candleSeriesRef.current) {
          candleSeriesRef.current.removePriceLine(currentPriceLineRef.current)
        }
        
        if (candleSeriesRef.current) {
          currentPriceLineRef.current = candleSeriesRef.current.createPriceLine({
            price: price,
            color: 'rgba(59, 130, 246, 0.4)',
            lineWidth: 1,
            lineStyle: 2,
            axisLabelVisible: true,
            title: ''
          })
        }
      } catch (error) {
        console.error('Price line update error:', error)
      }
    })
  }, [])

  // Update order markers
  const updateOrderMarker = useCallback((order: BinaryOrder) => {
    if (!candleSeriesRef.current || !chartRef.current) return

    const existingMarker = orderMarkersRef.current.get(order.id)
    if (existingMarker && order.status === 'ACTIVE') return

    const entryTime = Math.floor(new Date(order.entry_time).getTime() / 1000) as Time
    const isCall = order.direction === 'CALL'

    if (existingMarker?.entryLine && candleSeriesRef.current) {
      candleSeriesRef.current.removePriceLine(existingMarker.entryLine)
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
      title: `${order.direction}`
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

  // Update current price
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
            color: 'rgba(255, 255, 255, 0.15)',
            style: 0,
            visible: true
          },
          horzLines: { 
            color: 'rgba(255, 255, 255, 0.15)',
            style: 0,
            visible: true
          },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            width: 1,
            color: 'rgba(255, 255, 255, 0.3)',
            style: 3,
          },
          horzLine: {
            width: 1,
            color: 'rgba(255, 255, 255, 0.3)',
            style: 3,
          },
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

  // Load data
  useEffect(() => {
    if (!selectedAsset || !isInitialized || !candleSeriesRef.current || !lineSeriesRef.current) {
      return
    }

    let isCancelled = false

    const loadChartData = async () => {
      setIsLoading(true)
      setError(null)

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

        const data = await fetchHistoricalData(assetPath, timeframe)

        if (isCancelled) return

        if (!data || data.length === 0) {
          setError('No data available')
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
        }

        setIsLoading(false)

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
        isMobile={isMobile}
        onTimeframeChange={setTimeframe}
        onChartTypeChange={setChartType}
        onFitContent={handleFitContent}
        onRefresh={handleRefresh}
        onToggleFullscreen={toggleFullscreen}
        isFullscreen={isFullscreen}
      />

      <div 
        ref={chartContainerRef} 
        className="w-full h-full bg-[#0a0e17]"
        style={{ minHeight: '400px' }}
      />

      {isLoading && <ChartSkeleton />}

      {!isLoading && error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/90 z-20">
          <div className="text-center max-w-md px-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3 opacity-30" />
            <div className="text-sm font-medium text-red-400 mb-2">Failed to Load</div>
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