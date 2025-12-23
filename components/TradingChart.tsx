'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, CrosshairMode } from 'lightweight-charts'
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
  const chartRef = useRef<any>(null)
  const candleSeriesRef = useRef<any>(null)
  const lineSeriesRef = useRef<any>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  const { selectedAsset } = useTradingStore()

  const [chartType, setChartType] = useState<ChartType>('candle')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Debug log
  useEffect(() => {
    console.log('🔍 Chart Debug:', {
      hasContainer: !!chartContainerRef.current,
      hasChart: !!chartRef.current,
      hasSeries: !!candleSeriesRef.current,
      selectedAsset: selectedAsset?.symbol,
      isLoading,
      error,
      dataLoaded
    })
  }, [selectedAsset, isLoading, error, dataLoaded])

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) {
      console.warn('⚠️ Chart container not ready')
      return
    }

    console.log('🎨 Initializing chart...')

    try {
      // Create chart
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: chartContainerRef.current.clientHeight,
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

      chartRef.current = chart

      // Add candlestick series
      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      })
      candleSeriesRef.current = candleSeries

      // Add line series (hidden by default)
      const lineSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
      })
      lineSeriesRef.current = lineSeries

      // Make line series invisible initially
      if (chartType === 'candle') {
        candleSeries.applyOptions({ visible: true })
        lineSeries.applyOptions({ visible: false })
      } else {
        candleSeries.applyOptions({ visible: false })
        lineSeries.applyOptions({ visible: true })
      }

      console.log('✅ Chart initialized successfully')

      // Handle resize
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          const { width, height } = chartContainerRef.current.getBoundingClientRect()
          chartRef.current.applyOptions({ width, height })
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        if (unsubscribeRef.current) {
          unsubscribeRef.current()
        }
        chart.remove()
        chartRef.current = null
        candleSeriesRef.current = null
        lineSeriesRef.current = null
      }
    } catch (err: any) {
      console.error('❌ Chart initialization error:', err)
      setError(`Chart init failed: ${err.message}`)
    }
  }, [])

  // Switch chart type
  useEffect(() => {
    if (!candleSeriesRef.current || !lineSeriesRef.current) return

    console.log(`📊 Switching to ${chartType} chart`)

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
    if (!selectedAsset || !candleSeriesRef.current || !lineSeriesRef.current) {
      console.log('⚠️ Not ready to load data:', {
        hasAsset: !!selectedAsset,
        hasCandleSeries: !!candleSeriesRef.current,
        hasLineSeries: !!lineSeriesRef.current
      })
      return
    }

    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      setDataLoaded(false)

      // Cleanup previous subscription
      if (unsubscribeRef.current) {
        console.log('🔕 Cleaning up previous subscription')
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }

      try {
        const pathParts = selectedAsset.realtimeDbPath?.split('/') || []
        const assetPath = pathParts.slice(0, -1).join('/') || `/${selectedAsset.symbol.toLowerCase()}`

        console.log(`📥 Loading ${timeframe} data from: ${assetPath}`)
        
        const data = await fetchHistoricalData(assetPath, timeframe)

        console.log(`📊 Received ${data.length} bars`)

        if (data.length === 0) {
          setError('No data available. Check if simulator is running.')
          setIsLoading(false)
          return
        }

        // Convert data
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

        console.log('💾 Setting data on series...')
        console.log('Sample bar:', candleData[0])

        // Set data
        candleSeriesRef.current.setData(candleData)
        lineSeriesRef.current.setData(lineData)

        // Fit content
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent()
        }

        console.log('✅ Data loaded successfully!')
        setDataLoaded(true)
        setIsLoading(false)

        // Subscribe to updates
        console.log(`🔔 Subscribing to ${timeframe} updates`)
        unsubscribeRef.current = subscribeToOHLCUpdates(assetPath, timeframe, (newBar) => {
          if (!candleSeriesRef.current || !lineSeriesRef.current) return

          console.log('📊 New bar received:', newBar.close)

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
        })

      } catch (err: any) {
        console.error('❌ Error loading data:', err)
        setError(err.message || 'Failed to load chart data')
        setIsLoading(false)
      }
    }

    loadData()

    return () => {
      if (unsubscribeRef.current) {
        console.log('🔕 Unsubscribing on cleanup')
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [selectedAsset, timeframe])

  // Handlers
  const handleRefresh = () => {
    if (!selectedAsset) return
    console.log('🔄 Manual refresh triggered')
    const asset = selectedAsset
    useTradingStore.setState({ selectedAsset: null })
    setTimeout(() => useTradingStore.setState({ selectedAsset: asset }), 100)
  }

  const handleFitContent = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev)
  }

  // Render states
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
      {/* Controls */}
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
          >
            Fit
          </button>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-1.5 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="absolute top-2 right-2 z-10 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800 rounded-lg px-3 py-1.5">
        <div className="text-xs text-gray-400 flex items-center gap-2">
          <span>{selectedAsset.symbol}</span>
          <span>•</span>
          <span>{timeframe}</span>
          {dataLoaded && (
            <>
              <span>•</span>
              <span className="text-green-400">●</span>
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

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/90">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
            <div className="text-sm text-gray-400">Loading {timeframe} data...</div>
            <div className="text-xs text-gray-500 mt-2">
              {selectedAsset.symbol} • {selectedAsset.name}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/90">
          <div className="text-center max-w-md px-6">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3 opacity-30" />
            <div className="text-sm font-medium text-red-400 mb-2">Failed to Load Chart</div>
            <div className="text-xs text-gray-500 mb-4 whitespace-pre-line">{error}</div>
            <div className="space-y-2">
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs font-medium transition-colors"
              >
                Try Again
              </button>
              <div className="text-xs text-gray-600">
                Check browser console (F12) for details
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}