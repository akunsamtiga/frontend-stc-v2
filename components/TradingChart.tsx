'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time, UTCTimestamp } from 'lightweight-charts'
import { useTradingStore } from '@/store/trading'
import { fetchHistoricalData, subscribeToOHLCUpdates, getLatestBar } from '@/lib/firebase'
import { Activity, RefreshCw, AlertCircle, TrendingUp, Maximize2, Minimize2 } from 'lucide-react'

type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
type ChartType = 'candlestick' | 'line' | 'area'

export default function TradingChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const areaSeriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  const { selectedAsset } = useTradingStore()
  
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [chartType, setChartType] = useState<ChartType>('candlestick')
  const [showVolume, setShowVolume] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#0a0e17' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#3b82f6',
          width: 1,
          style: 3,
          labelBackgroundColor: '#3b82f6',
        },
        horzLine: {
          color: '#3b82f6',
          width: 1,
          style: 3,
          labelBackgroundColor: '#3b82f6',
        },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        textColor: '#9ca3af',
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: true,
        secondsVisible: timeframe === '1m',
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

    // Auto-resize
    const resizeObserver = new ResizeObserver(() => {
      if (chartContainerRef.current && chartRef.current) {
        const { width, height } = chartContainerRef.current.getBoundingClientRect()
        chart.applyOptions({ width, height })
      }
    })

    resizeObserver.observe(chartContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [isFullscreen])

  // Create series based on chart type
  useEffect(() => {
    if (!chartRef.current) return

    // Remove existing series
    if (candleSeriesRef.current) {
      chartRef.current.removeSeries(candleSeriesRef.current)
      candleSeriesRef.current = null
    }
    if (lineSeriesRef.current) {
      chartRef.current.removeSeries(lineSeriesRef.current)
      lineSeriesRef.current = null
    }
    if (areaSeriesRef.current) {
      chartRef.current.removeSeries(areaSeriesRef.current)
      areaSeriesRef.current = null
    }

    // Create new series based on type
    if (chartType === 'candlestick') {
      candleSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      })
    } else if (chartType === 'line') {
      lineSeriesRef.current = chartRef.current.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 6,
        crosshairMarkerBorderColor: '#3b82f6',
        crosshairMarkerBackgroundColor: '#0a0e17',
      })
    } else if (chartType === 'area') {
      areaSeriesRef.current = chartRef.current.addAreaSeries({
        topColor: 'rgba(59, 130, 246, 0.4)',
        bottomColor: 'rgba(59, 130, 246, 0.0)',
        lineColor: '#3b82f6',
        lineWidth: 2,
      })
    }

    // Add volume series if enabled
    if (showVolume && volumeSeriesRef.current === null) {
      volumeSeriesRef.current = chartRef.current.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
      })
      volumeSeriesRef.current.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      })
    } else if (!showVolume && volumeSeriesRef.current) {
      chartRef.current.removeSeries(volumeSeriesRef.current)
      volumeSeriesRef.current = null
    }
  }, [chartType, showVolume])

  // Load historical data
  const loadHistoricalData = useCallback(async () => {
    if (!selectedAsset || !chartRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const pathParts = selectedAsset.realtimeDbPath?.split('/') || []
      const assetPath = pathParts.slice(0, -1).join('/')

      console.log(`📊 Loading ${timeframe} data for ${selectedAsset.symbol}...`)

      const data = await fetchHistoricalData(assetPath, timeframe)

      if (data.length === 0) {
        throw new Error('No data available')
      }

      console.log(`✅ Loaded ${data.length} bars`)

      // Convert data for Lightweight Charts
      const chartData: CandlestickData[] = data.map(bar => ({
        time: bar.timestamp as UTCTimestamp,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      }))

      const volumeData = data.map(bar => ({
        time: bar.timestamp as UTCTimestamp,
        value: bar.volume,
        color: bar.close >= bar.open ? '#10b98180' : '#ef444480',
      }))

      // Set data to appropriate series
      if (chartType === 'candlestick' && candleSeriesRef.current) {
        candleSeriesRef.current.setData(chartData)
      } else if (chartType === 'line' && lineSeriesRef.current) {
        const lineData = chartData.map(d => ({
          time: d.time,
          value: d.close,
        }))
        lineSeriesRef.current.setData(lineData)
      } else if (chartType === 'area' && areaSeriesRef.current) {
        const areaData = chartData.map(d => ({
          time: d.time,
          value: d.close,
        }))
        areaSeriesRef.current.setData(areaData)
      }

      if (showVolume && volumeSeriesRef.current) {
        volumeSeriesRef.current.setData(volumeData)
      }

      // Fit content
      chartRef.current.timeScale().fitContent()

      setLastUpdateTime(new Date().toLocaleTimeString())
      setError(null)

    } catch (err: any) {
      console.error('❌ Error loading data:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [selectedAsset, timeframe, chartType, showVolume])

  // Load data when asset or timeframe changes
  useEffect(() => {
    loadHistoricalData()
  }, [loadHistoricalData])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!selectedAsset || !chartRef.current || isLoading) return

    const pathParts = selectedAsset.realtimeDbPath?.split('/') || []
    const assetPath = pathParts.slice(0, -1).join('/')

    console.log(`🔔 Subscribing to ${timeframe} updates...`)

    const unsubscribe = subscribeToOHLCUpdates(assetPath, timeframe, (newBar) => {
      console.log(`📊 New ${timeframe} bar:`, newBar.close)

      const candleData: CandlestickData = {
        time: newBar.timestamp as UTCTimestamp,
        open: newBar.open,
        high: newBar.high,
        low: newBar.low,
        close: newBar.close,
      }

      const volumeData = {
        time: newBar.timestamp as UTCTimestamp,
        value: newBar.volume,
        color: newBar.close >= newBar.open ? '#10b98180' : '#ef444480',
      }

      // Update appropriate series
      if (chartType === 'candlestick' && candleSeriesRef.current) {
        candleSeriesRef.current.update(candleData)
      } else if (chartType === 'line' && lineSeriesRef.current) {
        lineSeriesRef.current.update({
          time: candleData.time,
          value: candleData.close,
        })
      } else if (chartType === 'area' && areaSeriesRef.current) {
        areaSeriesRef.current.update({
          time: candleData.time,
          value: candleData.close,
        })
      }

      if (showVolume && volumeSeriesRef.current) {
        volumeSeriesRef.current.update(volumeData)
      }

      setLastUpdateTime(new Date().toLocaleTimeString())
    })

    return () => {
      console.log(`🔕 Unsubscribing from ${timeframe} updates`)
      unsubscribe()
    }
  }, [selectedAsset, timeframe, chartType, showVolume, isLoading])

  const handleRefresh = () => {
    loadHistoricalData()
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
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
      {/* Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        {/* Timeframe */}
        <div className="flex items-center gap-1 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800/50 rounded-lg p-1">
          {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              disabled={isLoading}
              className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                timeframe === tf
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Type */}
        <div className="flex items-center gap-1 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800/50 rounded-lg p-1">
          {(['candlestick', 'line', 'area'] as ChartType[]).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              disabled={isLoading}
              className={`px-2 py-1 text-xs font-medium rounded transition-all capitalize ${
                chartType === type
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Volume Toggle */}
        <button
          onClick={() => setShowVolume(!showVolume)}
          disabled={isLoading}
          className={`px-2 py-1 text-xs font-medium rounded transition-all bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800/50 ${
            showVolume
              ? 'text-white bg-white/10'
              : 'text-gray-400 hover:text-white hover:bg-white/5 disabled:opacity-50'
          }`}
        >
          Volume
        </button>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1.5 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800/50 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800/50 rounded-lg text-gray-400 hover:text-white transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Info */}
      <div className="absolute top-3 right-3 z-10 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800/50 rounded-lg px-3 py-2">
        <div className="text-xs text-gray-400">
          {selectedAsset.symbol} • {timeframe} • {chartType}
        </div>
        {lastUpdateTime && (
          <div className="text-xs text-green-400 mt-1">
            Updated: {lastUpdateTime}
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/80">
          <div className="text-gray-500 text-sm flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <div>Loading {timeframe} data...</div>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {error && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/80">
          <div className="text-red-400 text-sm flex flex-col items-center gap-3 text-center max-w-md p-6">
            <AlertCircle className="w-12 h-12 opacity-20" />
            <div className="font-medium text-base">Unable to Load Chart</div>
            <div className="text-xs text-gray-400">{error}</div>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Watermark */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-700 font-mono pointer-events-none">
        BinaryTrade • {selectedAsset.symbol} • Powered by TradingView
      </div>
    </div>
  )
}