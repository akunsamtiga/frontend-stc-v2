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
  Activity,
  Settings
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
  const [showControls, setShowControls] = useState(false)

  // Initialize chart once on mount
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

  // Load data when chart is ready
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
      {/* Controls - DESKTOP */}
      <div className="hidden lg:block absolute top-2 left-2 z-10">
        <div className="flex items-center gap-2">
          {/* Timeframe Selector */}
          <div className="flex items-center gap-1 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800 rounded-lg p-1">
            {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                disabled={isLoading}
                className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                  timeframe === tf
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                } disabled:opacity-50`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Type */}
          <div className="flex items-center gap-1 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800 rounded-lg p-1">
            <button
              onClick={() => setChartType('candle')}
              disabled={isLoading}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                chartType === 'candle'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Candle
            </button>
            <button
              onClick={() => setChartType('line')}
              disabled={isLoading}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-all ${
                chartType === 'line'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Line
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800 rounded-lg p-1">
            <button
              onClick={handleFitContent}
              className="px-2.5 py-1 text-xs font-medium text-gray-400 hover:text-white transition-colors"
              title="Fit content"
            >
              Fit
            </button>
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1.5 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 text-gray-400 hover:text-white transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Controls - MOBILE (Stacked Properly) */}
      <div className="lg:hidden absolute top-2 left-2 right-2 z-10">
        <div className="flex items-center justify-between mb-2">
          {/* Settings Button */}
          <button
            onClick={() => setShowControls(!showControls)}
            className="p-2 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800 rounded-lg"
          >
            <Settings className="w-4 h-4 text-gray-400" />
          </button>

          {/* Live Indicator */}
          {isInitialized && !isLoading && !error && (
            <div className="flex items-center gap-2 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800 rounded-lg px-3 py-1.5">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></span>
              <span className={`text-xs font-medium ${isLive ? 'text-green-400' : 'text-gray-500'}`}>
                {isLive ? 'LIVE' : 'Waiting'}
              </span>
            </div>
          )}
        </div>

        {/* Controls Panel */}
        {showControls && (
          <div className="bg-[#0f1419]/95 backdrop-blur-sm border border-gray-800 rounded-lg p-3 space-y-3 animate-slide-down">
            {/* Timeframe */}
            <div>
              <div className="text-xs text-gray-400 mb-2 font-medium">Timeframe</div>
              <div className="grid grid-cols-6 gap-1">
                {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    disabled={isLoading}
                    className={`px-2 py-1.5 text-xs font-medium rounded transition-all ${
                      timeframe === tf
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#1a1f2e] text-gray-400 border border-gray-800/50'
                    } disabled:opacity-50`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Type */}
            <div>
              <div className="text-xs text-gray-400 mb-2 font-medium">Chart Type</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setChartType('candle')}
                  disabled={isLoading}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                    chartType === 'candle'
                      ? 'bg-blue-500 text-white'
                      : 'bg-[#1a1f2e] text-gray-400 border border-gray-800/50'
                  }`}
                >
                  Candlestick
                </button>
                <button
                  onClick={() => setChartType('line')}
                  disabled={isLoading}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                    chartType === 'line'
                      ? 'bg-blue-500 text-white'
                      : 'bg-[#1a1f2e] text-gray-400 border border-gray-800/50'
                  }`}
                >
                  Line Chart
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-800/50">
              <button
                onClick={handleFitContent}
                className="flex-1 px-3 py-2 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-800/50 rounded-lg text-xs font-medium transition-colors"
              >
                Fit View
              </button>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="px-4 py-2 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-800/50 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chart Info - Top Right */}
      <div className="absolute top-2 right-2 z-10 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800 rounded-lg px-3 py-1.5">
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span className="font-medium">{selectedAsset.symbol}</span>
          <span>•</span>
          <span>{timeframe}</span>
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
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}