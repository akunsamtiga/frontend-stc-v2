'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi } from 'lightweight-charts'
import { useTradingStore } from '@/store/trading'
import { fetchHistoricalData, subscribeToOHLCUpdates } from '@/lib/firebase'
import { 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  AlertCircle,
  Activity
} from 'lucide-react'

type ChartType = 'line' | 'candle'
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const mountedRef = useRef(false)

  const { selectedAsset } = useTradingStore()

  const [chartType, setChartType] = useState<ChartType>('candle')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

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
            vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
            horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
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
          if (unsubscribeRef.current) {
            unsubscribeRef.current()
            unsubscribeRef.current = null
          }
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
            chartRef.current.timeScale().fitContent()
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
          setLastUpdate(new Date())
          
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
      {/* Desktop Controls - Top Left - SMALLER & MORE TRANSPARENT */}
      <div className="hidden lg:block absolute top-2 left-2 z-10">
        <div className="flex items-center gap-1.5">
          {/* Timeframe - Scrollable */}
          <div className="flex items-center gap-0.5 bg-black/15 backdrop-blur-md border border-white/5 rounded-md p-0.5 max-w-[140px] overflow-x-auto scrollbar-hide">
            {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                disabled={isLoading}
                className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all flex-shrink-0 ${
                  timeframe === tf
                    ? 'bg-blue-500/70 text-white shadow-sm backdrop-blur-sm'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                } disabled:opacity-50`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Type */}
          <div className="flex items-center gap-0.5 bg-black/15 backdrop-blur-md border border-white/5 rounded-md p-0.5">
            <button
              onClick={() => setChartType('candle')}
              disabled={isLoading}
              className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all ${
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
              className={`px-2 py-0.5 text-[10px] font-semibold rounded transition-all ${
                chartType === 'line'
                  ? 'bg-blue-500/70 text-white shadow-sm backdrop-blur-sm'
                  : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              Line
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 bg-black/15 backdrop-blur-md border border-white/5 rounded-md p-0.5">
            <button
              onClick={handleFitContent}
              className="px-2 py-0.5 text-[10px] font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
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
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
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

      {/* Chart Info - Top Right - SMALLER & MORE TRANSPARENT */}
      <div className="absolute top-2 right-2 z-10 bg-black/15 backdrop-blur-md border border-white/5 rounded-md px-2 py-1">
        <div className="text-[10px] text-gray-300 flex items-center gap-1.5">
          <span className="font-semibold">{selectedAsset.symbol}</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-400">{timeframe}</span>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        ref={chartContainerRef} 
        className="w-full h-full bg-[#0a0e17]"
        style={{ minHeight: '400px' }}
      />

      {/* Mobile Controls - Floating Above Chart - SMALLER & MORE TRANSPARENT */}
      <div className="lg:hidden absolute top-2 left-2 right-2 z-10">
        <div className="flex items-center gap-1 bg-black/15 backdrop-blur-md border border-white/5 rounded-md p-0.5">
          {/* Timeframe Buttons - Scrollable, Show 3 */}
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide max-w-[90px]">
            {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                disabled={isLoading}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  timeframe === tf
                    ? 'bg-blue-500/70 text-white backdrop-blur-sm'
                    : 'bg-white/5 text-gray-300 hover:bg-white/15 backdrop-blur-sm'
                } disabled:opacity-50`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="w-px h-4 bg-white/10 flex-shrink-0"></div>

          {/* Chart Type */}
          <button
            onClick={() => setChartType(chartType === 'candle' ? 'line' : 'candle')}
            disabled={isLoading}
            className="px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap bg-white/5 text-gray-300 hover:bg-white/15 backdrop-blur-sm flex-shrink-0 transition-colors"
          >
            {chartType === 'candle' ? 'Candle' : 'Line'}
          </button>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="w-5 h-5 rounded bg-white/5 hover:bg-white/15 backdrop-blur-sm flex-shrink-0 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <RefreshCw className={`w-2.5 h-2.5 text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
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

        /* Smooth scroll */
        .scrollbar-hide {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  )
}