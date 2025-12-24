'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import { useTradingStore } from '@/store/trading'
import { fetchHistoricalData, subscribeToOHLCUpdates } from '@/lib/firebase'
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
  Clock
} from 'lucide-react'

type ChartType = 'line' | 'candle'
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

interface OrderMarker {
  order: BinaryOrder
  entryMarker: any
  exitMarker?: any
  priceLine: any
}

interface TradingChartProps {
  activeOrders?: BinaryOrder[]
  currentPrice?: number
}

export default function TradingChart({ activeOrders = [], currentPrice }: TradingChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const mountedRef = useRef(false)
  const orderMarkersRef = useRef<Map<string, OrderMarker>>(new Map())

  const { selectedAsset } = useTradingStore()

  const [chartType, setChartType] = useState<ChartType>('candle')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [orderTimers, setOrderTimers] = useState<Record<string, string>>({})

  // Update order timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      const timers: Record<string, string> = {}
      activeOrders.forEach(order => {
        if (order.status === 'ACTIVE' && order.exit_time) {
          timers[order.id] = calculateTimeLeft(order.exit_time)
        }
      })
      setOrderTimers(timers)
    }, 1000)

    return () => clearInterval(interval)
  }, [activeOrders])

  // Clear markers when orders change
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return

    // HANYA tampilkan marker untuk ACTIVE orders
    const activeOnly = activeOrders.filter(o => o.status === 'ACTIVE')
    const currentOrderIds = new Set(activeOnly.map(o => o.id))
    
    // Remove markers for orders that are no longer ACTIVE
    orderMarkersRef.current.forEach((marker, orderId) => {
      if (!currentOrderIds.has(orderId)) {
        // Remove price line
        if (marker.priceLine && candleSeriesRef.current) {
          candleSeriesRef.current.removePriceLine(marker.priceLine)
        }
        orderMarkersRef.current.delete(orderId)
      }
    })

    // Clear all markers first
    if (candleSeriesRef.current) {
      candleSeriesRef.current.setMarkers([])
    }

    // Add markers only for ACTIVE orders
    activeOnly.forEach(order => {
      updateOrderMarker(order)
    })
  }, [activeOrders])

  const updateOrderMarker = (order: BinaryOrder) => {
    if (!candleSeriesRef.current || !chartRef.current) return
    if (order.status !== 'ACTIVE') return // Only show markers for ACTIVE orders

    const existingMarker = orderMarkersRef.current.get(order.id)
    
    // Skip if marker already exists
    if (existingMarker) return

    // Create new marker for new ACTIVE order
    const entryTime = Math.floor(new Date(order.entry_time).getTime() / 1000) as Time
    const isCall = order.direction === 'CALL'
    
    const entryMarker = {
      time: entryTime,
      position: isCall ? 'belowBar' as const : 'aboveBar' as const,
      color: isCall ? '#10b981' : '#ef4444',
      shape: isCall ? 'arrowUp' as const : 'arrowDown' as const,
      text: `${order.direction} ${formatCurrency(order.amount)}`,
      size: 2
    }

    // Add price line
    const priceLine = candleSeriesRef.current.createPriceLine({
      price: order.entry_price,
      color: isCall ? '#10b981' : '#ef4444',
      lineWidth: 2,
      lineStyle: 2, // Dashed
      axisLabelVisible: true,
      title: `${order.direction} @ ${order.entry_price.toFixed(3)}`
    })

    // Set marker
    const existingMarkers = candleSeriesRef.current.markers() || []
    candleSeriesRef.current.setMarkers([...existingMarkers, entryMarker])

    orderMarkersRef.current.set(order.id, {
      order,
      entryMarker,
      priceLine
    })
  }

  // Initialize chart
  useEffect(() => {
    if (mountedRef.current) return
    
    let retryCount = 0
    const maxRetries = 5
    const retryDelay = 200

    const initChart = () => {
      const container = chartContainerRef.current
      
      if (!container) {
        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(initChart, retryDelay)
        } else {
          setError('Chart container initialization timeout')
        }
        return
      }

      const { width, height } = container.getBoundingClientRect()
      
      if (width === 0 || height === 0) {
        if (retryCount < maxRetries) {
          retryCount++
          setTimeout(initChart, retryDelay)
        } else {
          setError('Chart container has no size')
        }
        return
      }

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
              
              const isMobile = window.innerWidth < 1024
              if (isMobile) {
                const visibleRange = chart.timeScale().getVisibleRange()
                if (visibleRange) {
                  setTimeout(() => {
                    chart.timeScale().setVisibleRange(visibleRange)
                  }, 100)
                }
              }
            }
          }
        }

        window.addEventListener('resize', handleResize)

        return () => {
          window.removeEventListener('resize', handleResize)
          if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
          }
          
          // Clear all markers
          orderMarkersRef.current.forEach((marker) => {
            if (marker.priceLine && candleSeriesRef.current) {
              candleSeriesRef.current.removePriceLine(marker.priceLine)
            }
          })
          orderMarkersRef.current.clear()
          
          mountedRef.current = false
          setIsInitialized(false)
          try {
            chart.remove()
          } catch (e) {
            console.warn('Chart already removed')
          }
        }
      } catch (err: any) {
        console.error('Chart init error:', err)
        setError(`Chart initialization failed: ${err.message}`)
        mountedRef.current = false
      }
    }

    const timeoutId = setTimeout(initChart, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  // Handle chart type change
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

      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }

      try {
        const pathParts = selectedAsset.realtimeDbPath?.split('/') || []
        const assetPath = pathParts.slice(0, -1).join('/') || `/${selectedAsset.symbol.toLowerCase()}`

        const data = await fetchHistoricalData(assetPath, timeframe)

        if (isCancelled) return

        if (!data || data.length === 0) {
          setError('No data available. Please check if the simulator is running.')
          setIsLoading(false)
          return
        }

        const candleData = data.map(bar => ({
          time: bar.timestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        }))

        const lineData = data.map(bar => ({
          time: bar.timestamp,
          value: bar.close,
        }))

        if (isCancelled) return

        if (candleSeriesRef.current && lineSeriesRef.current) {
          candleSeriesRef.current.setData(candleData)
          lineSeriesRef.current.setData(lineData)

          if (chartRef.current) {
            const isMobile = window.innerWidth < 1024
            
            if (isMobile && candleData.length > 0) {
              const barsToShow = 35
              const lastIndex = candleData.length - 1
              const firstIndex = Math.max(0, lastIndex - barsToShow)
              
              chartRef.current.timeScale().setVisibleRange({
                from: candleData[firstIndex].time as any,
                to: candleData[lastIndex].time as any,
              })
            } else {
              chartRef.current.timeScale().fitContent()
            }
          }
        }

        setIsLoading(false)

        unsubscribeRef.current = subscribeToOHLCUpdates(assetPath, timeframe, (newBar) => {
          if (isCancelled || !candleSeriesRef.current || !lineSeriesRef.current) return

          const candleUpdate = {
            time: newBar.timestamp,
            open: newBar.open,
            high: newBar.high,
            low: newBar.low,
            close: newBar.close,
          }

          const lineUpdate = {
            time: newBar.timestamp,
            value: newBar.close,
          }

          candleSeriesRef.current.update(candleUpdate)
          lineSeriesRef.current.update(lineUpdate)
          
          setIsLive(true)
          
          setTimeout(() => {
            setIsLive(false)
          }, 5000)
        })

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
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [selectedAsset?.id, timeframe, isInitialized])

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
      {/* Desktop Controls */}
      <div className="hidden lg:block absolute top-2 left-2 z-10">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5 bg-black/15 backdrop-blur-md border border-white/5 rounded-md p-0.5 max-w-[140px] overflow-x-auto scrollbar-hide">
            {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
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
              onClick={() => setChartType('candle')}
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
              onClick={() => setChartType('line')}
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
              onClick={handleFitContent}
              className="px-2 py-0.5 text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              title="Fit content"
            >
              Fit
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>

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
        </div>
      </div>

      {/* Active Orders Overlay - SIMPLE REALTIME P&L */}
      {activeOrders.length > 0 && (
        <div className="absolute top-12 right-2 z-10 space-y-1.5 max-h-[calc(100%-100px)] overflow-y-auto scrollbar-hide">
          {activeOrders.filter(o => o.status === 'ACTIVE').map((order) => {
            // Calculate realtime P&L
            const current = currentPrice || order.entry_price
            const isCall = order.direction === 'CALL'
            
            // Determine if winning or losing
            const isWinning = isCall 
              ? current > order.entry_price 
              : current < order.entry_price
            
            // Calculate potential profit/loss
            const potentialProfit = order.amount * (order.profitRate / 100)
            const potentialPayout = isWinning 
              ? order.amount + potentialProfit 
              : -order.amount
            
            return (
              <div 
                key={order.id}
                className={`bg-black/50 backdrop-blur-md border rounded-lg px-3 py-2.5 min-w-[160px] transition-all ${
                  isWinning
                    ? 'border-green-500/50 shadow-lg shadow-green-500/20' 
                    : 'border-red-500/50 shadow-lg shadow-red-500/20'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-700/50">
                  <div className="flex items-center gap-1.5">
                    {order.direction === 'CALL' ? (
                      <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                    )}
                    <span className={`text-xs font-bold ${
                      order.direction === 'CALL' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {order.direction}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{order.asset_name}</span>
                </div>
                
                {/* Body - Simple Info */}
                <div className="space-y-1.5">
                  {/* Amount */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400">Amount</span>
                    <span className="text-xs font-mono font-semibold text-gray-200">
                      {formatCurrency(order.amount)}
                    </span>
                  </div>
                  
                  {/* Time Remaining */}
                  {orderTimers[order.id] && (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        Time
                      </span>
                      <span className={`text-xs font-mono font-bold ${
                        orderTimers[order.id].includes('Expired') 
                          ? 'text-red-400' 
                          : 'text-yellow-400'
                      }`}>
                        {orderTimers[order.id]}
                      </span>
                    </div>
                  )}
                  
                  {/* P&L - PROMINENT */}
                  <div className={`flex justify-between items-center pt-2 mt-1 border-t ${
                    isWinning ? 'border-green-500/30' : 'border-red-500/30'
                  }`}>
                    <span className="text-[11px] text-gray-300 font-semibold">P&L</span>
                    <span className={`font-mono font-bold text-base ${
                      isWinning ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isWinning ? '+' : ''}{formatCurrency(potentialPayout)}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full h-full bg-[#0a0e17]"
        style={{ minHeight: '400px' }}
      />

      {/* Mobile Controls */}
      <div className="lg:hidden absolute top-2 left-2 z-10">
        <div className="inline-flex items-center gap-1 bg-black/20 backdrop-blur-md border border-white/10 rounded-full p-1">
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide max-w-[80px]">
            {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                disabled={isLoading}
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  timeframe === tf
                    ? 'bg-blue-500/80 text-white shadow-sm'
                    : 'bg-white/5 text-gray-300 hover:bg-white/15'
                } disabled:opacity-50`}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="w-px h-3 bg-white/10 flex-shrink-0"></div>

          <button
            onClick={() => setChartType(chartType === 'candle' ? 'line' : 'candle')}
            disabled={isLoading}
            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap bg-white/5 text-gray-300 hover:bg-white/15 flex-shrink-0 transition-colors"
          >
            {chartType === 'candle' ? 'Candle' : 'Line'}
          </button>

          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/15 flex-shrink-0 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/90 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
            <div className="text-sm text-gray-400">Loading {timeframe} data...</div>
            <div className="text-xs text-gray-500 mt-2">
              {selectedAsset.symbol} • {selectedAsset.name}
            </div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {!isLoading && error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/90 z-20">
          <div className="text-center max-w-md px-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3 opacity-30" />
            <div className="text-sm font-medium text-red-400 mb-2">Failed to Load Chart</div>
            <div className="text-xs text-gray-500 mb-4 whitespace-pre-line">{error}</div>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Initialization Overlay */}
      {!isInitialized && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/90 z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
            <div className="text-sm text-gray-400">Initializing chart...</div>
          </div>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}