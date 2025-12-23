'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, IChartApi, ISeriesApi, UTCTimestamp, LineStyle } from 'lightweight-charts'
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
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const { selectedAsset } = useTradingStore()

  const [chartType, setChartType] = useState<ChartType>('candle')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Initialize chart once
  useEffect(() => {
    if (!chartContainerRef.current) return

    // Create chart with proper typing
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: '#0a0e17' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          style: LineStyle.Dashed,
          labelBackgroundColor: '#3b82f6',
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          style: LineStyle.Dashed,
          labelBackgroundColor: '#3b82f6',
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

    chartRef.current = chart

    // Add candlestick series
    candleSeriesRef.current = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderUpColor: '#10b981',
      borderDownColor: '#ef4444',
      wickUpColor: '#10b981',
      wickDownColor: '#ef4444',
    })

    // Add line series (hidden by default)
    lineSeriesRef.current = chart.addLineSeries({
      color: '#3b82f6',
      lineWidth: 2,
      visible: false,
    })

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    resizeObserverRef.current = new ResizeObserver(handleResize)
    resizeObserverRef.current.observe(chartContainerRef.current)

    return () => {
      resizeObserverRef.current?.disconnect()
      unsubscribeRef.current?.()
      chart.remove()
    }
  }, [])

  // Switch chart type
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

  // Load data when asset/timeframe changes
  useEffect(() => {
    if (!selectedAsset || !candleSeriesRef.current || !lineSeriesRef.current) return

    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      // Unsubscribe from previous updates
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }

      try {
        const pathParts = selectedAsset.realtimeDbPath?.split('/') || []
        const assetPath = pathParts.slice(0, -1).join('/') || `/${selectedAsset.symbol.toLowerCase()}`

        console.log(`📊 Loading ${timeframe} data...`)
        const data = await fetchHistoricalData(assetPath, timeframe)

        if (data.length === 0) {
          setError('No data available')
          setIsLoading(false)
          return
        }

        // Convert to chart format
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

        // Update both series
        candleSeriesRef.current!.setData(candleData)
        lineSeriesRef.current!.setData(lineData)

        // Fit content
        chartRef.current?.timeScale().fitContent()

        console.log(`✅ Loaded ${data.length} bars`)

        // Subscribe to real-time updates
        console.log(`🔔 Subscribing to ${timeframe} updates`)
        unsubscribeRef.current = subscribeToOHLCUpdates(assetPath, timeframe, (newBar) => {
          if (!candleSeriesRef.current || !lineSeriesRef.current) return

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

        setIsLoading(false)
      } catch (error: any) {
        console.error('❌ Error loading data:', error)
        setError(error.message || 'Failed to load data')
        setIsLoading(false)
      }
    }

    loadData()

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [selectedAsset, timeframe])

  // Handlers
  const handleRefresh = useCallback(() => {
    if (!selectedAsset) return
    const asset = selectedAsset
    useTradingStore.setState({ selectedAsset: null })
    setTimeout(() => useTradingStore.setState({ selectedAsset: asset }), 100)
  }, [selectedAsset])

  const handleFitContent = useCallback(() => {
    chartRef.current?.timeScale().fitContent()
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
      {/* Top Controls */}
      <div className="absolute top-2 left-2 z-10 flex items-center gap-2">
        {/* Timeframe */}
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
              } disabled:opacity-50 disabled:cursor-not-allowed`}
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
            title="Fit Content"
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
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Info Badge */}
      <div className="absolute top-2 right-2 z-10 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800 rounded-lg px-3 py-1.5">
        <div className="text-xs text-gray-400">
          {selectedAsset.symbol} • {timeframe}
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/90">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
            <div className="text-sm text-gray-400">Loading {timeframe} data...</div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {!isLoading && error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/90">
          <div className="text-center max-w-md px-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3 opacity-30" />
            <div className="text-sm font-medium text-red-400 mb-2">Failed to Load Data</div>
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
}