'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, UTCTimestamp } from 'lightweight-charts'
import { useTradingStore } from '@/store/trading'
import { fetchHistoricalData, subscribeToOHLCUpdates } from '@/lib/firebase'
import { Activity, ZoomIn, ZoomOut, Maximize2, Minimize2, RefreshCw, AlertCircle } from 'lucide-react'

type ChartType = 'line' | 'candle'
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | null>(null)
  
  const { selectedAsset } = useTradingStore()
  
  const [chartType, setChartType] = useState<ChartType>('line')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [isLoading, setIsLoading] = useState(true)
  const [dataLoadError, setDataLoadError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
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
          width: 1,
          style: 1,
          labelBackgroundColor: '#3b82f6',
        },
        horzLine: {
          color: 'rgba(255, 255, 255, 0.3)',
          width: 1,
          style: 1,
          labelBackgroundColor: '#3b82f6',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: true,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    })

    chartRef.current = chart

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        })
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [isFullscreen])

  // Create/update series when chart type changes
  useEffect(() => {
    if (!chartRef.current) return

    // Remove old series
    if (seriesRef.current) {
      chartRef.current.removeSeries(seriesRef.current)
      seriesRef.current = null
    }

    // Create new series
    if (chartType === 'candle') {
      seriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      })
    } else {
      seriesRef.current = chartRef.current.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
        crosshairMarkerBorderColor: '#3b82f6',
        crosshairMarkerBackgroundColor: '#3b82f6',
        lastValueVisible: true,
        priceLineVisible: true,
      })
    }
  }, [chartType])

  // Load data when asset or timeframe changes
  useEffect(() => {
    if (!selectedAsset || !seriesRef.current) return

    const loadData = async () => {
      setIsLoading(true)
      setDataLoadError(null)

      try {
        const pathParts = selectedAsset.realtimeDbPath?.split('/') || []
        const assetPath = pathParts.slice(0, -1).join('/') || `/${selectedAsset.symbol.toLowerCase()}`

        console.log(`📊 Loading ${timeframe} data for ${selectedAsset.symbol}...`)
        
        const data = await fetchHistoricalData(assetPath, timeframe)

        if (data.length === 0) {
          setDataLoadError('No data available. Please check if simulator is running.')
          return
        }

        console.log(`✅ Loaded ${data.length} bars`)

        // Convert to chart format
        if (chartType === 'candle') {
          const candleData: CandlestickData[] = data.map(bar => ({
            time: bar.timestamp as UTCTimestamp,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
          }))
          ;(seriesRef.current as ISeriesApi<'Candlestick'>).setData(candleData)
        } else {
          const lineData: LineData[] = data.map(bar => ({
            time: bar.timestamp as UTCTimestamp,
            value: bar.close,
          }))
          ;(seriesRef.current as ISeriesApi<'Line'>).setData(lineData)
        }

        // Fit content
        chartRef.current?.timeScale().fitContent()

      } catch (error: any) {
        console.error('❌ Error loading data:', error)
        setDataLoadError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [selectedAsset, timeframe, chartType])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!selectedAsset || !seriesRef.current || isLoading) return

    const pathParts = selectedAsset.realtimeDbPath?.split('/') || []
    const assetPath = pathParts.slice(0, -1).join('/') || `/${selectedAsset.symbol.toLowerCase()}`

    console.log(`🔔 Subscribing to ${timeframe} real-time updates...`)

    const unsubscribe = subscribeToOHLCUpdates(assetPath, timeframe, (newBar) => {
      if (!seriesRef.current) return

      try {
        if (chartType === 'candle') {
          const candleBar: CandlestickData = {
            time: newBar.timestamp as UTCTimestamp,
            open: newBar.open,
            high: newBar.high,
            low: newBar.low,
            close: newBar.close,
          }
          ;(seriesRef.current as ISeriesApi<'Candlestick'>).update(candleBar)
        } else {
          const lineBar: LineData = {
            time: newBar.timestamp as UTCTimestamp,
            value: newBar.close,
          }
          ;(seriesRef.current as ISeriesApi<'Line'>).update(lineBar)
        }
      } catch (error) {
        console.error('Error updating chart:', error)
      }
    })

    return () => {
      console.log(`🔕 Unsubscribing from ${timeframe} updates`)
      unsubscribe()
    }
  }, [selectedAsset, timeframe, chartType, isLoading])

  const handleRefresh = () => {
    if (!selectedAsset) return
    
    const asset = selectedAsset
    useTradingStore.setState({ selectedAsset: null })
    setTimeout(() => {
      useTradingStore.setState({ selectedAsset: asset })
    }, 100)
  }

  const handleZoomIn = () => {
    chartRef.current?.timeScale().scrollToPosition(5, true)
  }

  const handleZoomOut = () => {
    chartRef.current?.timeScale().scrollToPosition(-5, true)
  }

  const handleFitContent = () => {
    chartRef.current?.timeScale().fitContent()
  }

  if (!selectedAsset) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Activity className="w-16 h-16 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Select an asset to view chart</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0e17]' : 'h-full'}`}>
      {/* Chart Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-1">
          {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              disabled={isLoading}
              className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                timeframe === tf
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              } disabled:opacity-50`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Type */}
        <div className="flex items-center gap-1 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-1">
          <button
            onClick={() => setChartType('line')}
            disabled={isLoading}
            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
              chartType === 'line'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            } disabled:opacity-50`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('candle')}
            disabled={isLoading}
            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
              chartType === 'candle'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            } disabled:opacity-50`}
          >
            Candle
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-1">
          <button
            onClick={handleZoomOut}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleFitContent}
            disabled={isLoading}
            className="px-2 py-1 text-xs font-medium text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Fit Content"
          >
            Fit
          </button>
          <button
            onClick={handleZoomIn}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1.5 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1.5 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg text-gray-400 hover:text-white transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Chart Info */}
      <div className="absolute top-3 right-3 z-10 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg px-3 py-2">
        <div className="text-xs text-gray-400">
          {selectedAsset.symbol} • {timeframe} • {chartType === 'line' ? 'Line' : 'Candle'}
        </div>
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full h-full" />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/80">
          <div className="text-gray-500 text-sm flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <div>Loading {timeframe} data...</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && dataLoadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/80">
          <div className="text-red-400 text-sm flex flex-col items-center gap-3 text-center max-w-md p-6">
            <AlertCircle className="w-12 h-12 opacity-20" />
            <div className="font-medium text-base">Unable to Load Chart Data</div>
            <div className="text-xs text-gray-400 whitespace-pre-line">{dataLoadError}</div>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs transition-colors mt-2"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Watermark */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-700 font-mono pointer-events-none">
        BinaryTrade • Powered by TradingView
      </div>
    </div>
  )
}