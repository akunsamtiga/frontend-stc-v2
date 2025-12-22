'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTradingStore } from '@/store/trading'
import { fetchHistoricalData, subscribeToPriceUpdates, getAllData } from '@/lib/firebase'
import { Activity, ZoomIn, ZoomOut, Maximize2, Minimize2, RefreshCw } from 'lucide-react'

interface PricePoint {
  timestamp: number
  price: number
  high?: number
  low?: number
  open?: number
  close?: number
  volume?: number
}

interface AggregatedBar {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type ChartType = 'line' | 'candle'
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

// Timeframe ke detik
const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1d': 86400
}

export default function TradingChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { selectedAsset, currentPrice, setCurrentPrice, addPriceToHistory } = useTradingStore()
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [rawPriceData, setRawPriceData] = useState<PricePoint[]>([])
  const [aggregatedData, setAggregatedData] = useState<AggregatedBar[]>([])
  const [chartType, setChartType] = useState<ChartType>('line')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [showVolume, setShowVolume] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [historicalLoaded, setHistoricalLoaded] = useState(false)
  const [dataLoadError, setDataLoadError] = useState<string | null>(null)
  
  const maxDataPoints = Math.floor(100 / zoom)
  
  // ✅ FIXED: Load historical data with better error handling and logging
  useEffect(() => {
    if (!selectedAsset) return

    const loadHistoricalData = async () => {
      setIsLoading(true)
      setHistoricalLoaded(false)
      setDataLoadError(null)
      
      try {
        console.log('📊 Loading historical data for:', selectedAsset.symbol)
        
        // Determine the data path based on asset
        let assetPath = ''
        
        if (selectedAsset.dataSource === 'realtime_db' && selectedAsset.realtimeDbPath) {
          // Extract base path (remove /current_price or similar)
          const pathParts = selectedAsset.realtimeDbPath.split('/')
          assetPath = pathParts.slice(0, -1).join('/')
          console.log('🔗 Using realtimeDbPath:', assetPath)
        } else {
          // Default to lowercase asset symbol
          assetPath = `/${selectedAsset.symbol.toLowerCase()}`
          console.log('🔗 Using default path:', assetPath)
        }

        // ✅ First, check what data is available
        console.log('🔍 Checking available data structure...')
        const allData = await getAllData(assetPath)
        
        if (allData) {
          console.log('📦 Available data keys:', Object.keys(allData))
          
          // Check for ohlc data
          if (allData.ohlc) {
            console.log('✅ Found OHLC data, count:', Object.keys(allData.ohlc).length)
          } else {
            console.log('⚠️ No OHLC data found, checking for direct timestamp keys...')
            
            // Check if data is stored directly without /ohlc path
            const timestamps = Object.keys(allData).filter(key => !isNaN(parseInt(key)))
            if (timestamps.length > 0) {
              console.log('✅ Found direct timestamp data, count:', timestamps.length)
            }
          }
        }

        // ✅ Fetch historical data with increased limit
        console.log(`📥 Fetching last 2000 bars from: ${assetPath}`)
        const historical = await fetchHistoricalData(assetPath, 2000)
        
        if (historical.length > 0) {
          console.log(`✅ Loaded ${historical.length} historical bars`)
          console.log(`   First bar: ${historical[0].datetime}`)
          console.log(`   Last bar: ${historical[historical.length - 1].datetime}`)
          console.log(`   Sample data:`, historical[historical.length - 1])
          
          // Convert to PricePoint format
          const pricePoints: PricePoint[] = historical.map(bar => ({
            timestamp: bar.timestamp,
            price: bar.close,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: bar.volume
          }))
          
          setRawPriceData(pricePoints)
          setHistoricalLoaded(true)
          console.log(`✅ Set ${pricePoints.length} price points to state`)
        } else {
          console.warn('⚠️ No historical data returned')
          setDataLoadError('No historical data available. Make sure the simulator is running.')
          setRawPriceData([])
        }
        
      } catch (error) {
        console.error('❌ Error loading historical data:', error)
        setDataLoadError(`Error loading data: ${error}`)
        setRawPriceData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadHistoricalData()
  }, [selectedAsset])

  // Handle resize
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    const debouncedUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateDimensions, 100)
    }

    updateDimensions()
    window.addEventListener('resize', debouncedUpdate)
    
    return () => {
      window.removeEventListener('resize', debouncedUpdate)
      clearTimeout(timeoutId)
    }
  }, [isFullscreen])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!selectedAsset || !historicalLoaded) return

    let unsubscribe: (() => void) | undefined

    if (selectedAsset.dataSource === 'realtime_db' && selectedAsset.realtimeDbPath) {
      console.log('🔴 Subscribing to real-time updates:', selectedAsset.realtimeDbPath)
      
      // Subscribe to current_price for real-time updates
      unsubscribe = subscribeToPriceUpdates(selectedAsset.realtimeDbPath, (data) => {
        console.log('📡 Real-time update received:', data)
        setCurrentPrice(data)
        addPriceToHistory(data)
      })
    }

    return () => {
      if (unsubscribe) {
        console.log('🔴 Unsubscribing from real-time updates')
        unsubscribe()
      }
    }
  }, [selectedAsset, historicalLoaded, setCurrentPrice, addPriceToHistory])

  // Add real-time price to raw data
  useEffect(() => {
    if (currentPrice && historicalLoaded) {
      const newPoint: PricePoint = {
        timestamp: currentPrice.timestamp || Math.floor(Date.now() / 1000),
        price: currentPrice.price,
        volume: Math.random() * 1000000 // Mock volume for real-time data
      }

      setRawPriceData(prev => {
        // Check if this timestamp already exists (avoid duplicates)
        const exists = prev.some(p => p.timestamp === newPoint.timestamp)
        if (exists) return prev
        
        const updated = [...prev, newPoint]
        // Keep last 2000 points for performance
        return updated.slice(-2000)
      })
    }
  }, [currentPrice, historicalLoaded])

  // ✅ FIXED: Aggregate data based on timeframe with better handling
  useEffect(() => {
    if (rawPriceData.length === 0) {
      console.log('⚠️ No raw price data to aggregate')
      return
    }

    console.log(`🔄 Aggregating ${rawPriceData.length} bars to ${timeframe} timeframe`)

    const timeframeSeconds = TIMEFRAME_SECONDS[timeframe]
    const bars: Map<number, AggregatedBar> = new Map()

    // Group raw data into timeframe bars
    rawPriceData.forEach(point => {
      // Round timestamp to timeframe boundary
      const barTimestamp = Math.floor(point.timestamp / timeframeSeconds) * timeframeSeconds

      if (!bars.has(barTimestamp)) {
        // Create new bar
        bars.set(barTimestamp, {
          timestamp: barTimestamp,
          open: point.open || point.price,
          high: point.high || point.price,
          low: point.low || point.price,
          close: point.close || point.price,
          volume: point.volume || 0
        })
      } else {
        // Update existing bar
        const bar = bars.get(barTimestamp)!
        
        // If point has OHLC data, use it
        if (point.open !== undefined) {
          // This is already an OHLC bar, just update close
          bar.close = point.close || point.price
          bar.high = Math.max(bar.high, point.high || point.price)
          bar.low = Math.min(bar.low, point.low || point.price)
          bar.volume += point.volume || 0
        } else {
          // This is a single price point, update OHLC
          bar.high = Math.max(bar.high, point.price)
          bar.low = Math.min(bar.low, point.price)
          bar.close = point.price
          bar.volume += point.volume || 0
        }
      }
    })

    // Convert to array and sort by timestamp
    const aggregated = Array.from(bars.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-maxDataPoints)

    console.log(`✅ Aggregated to ${aggregated.length} ${timeframe} bars`)
    console.log(`   Showing last ${maxDataPoints} bars (zoom: ${zoom}x)`)

    setAggregatedData(aggregated)
  }, [rawPriceData, timeframe, maxDataPoints, zoom])

  // Mouse handlers
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return
    const rect = canvasRef.current.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setMousePos(null)
  }, [])

  // Refresh data manually
  const handleRefresh = async () => {
    if (!selectedAsset) return
    
    setIsLoading(true)
    setRawPriceData([])
    setAggregatedData([])
    
    // Trigger reload by updating selected asset
    const asset = selectedAsset
    useTradingStore.setState({ selectedAsset: null })
    setTimeout(() => {
      useTradingStore.setState({ selectedAsset: asset })
    }, 100)
  }

  // Draw chart (same as before, no changes needed)
  useEffect(() => {
    if (!canvasRef.current || aggregatedData.length === 0 || dimensions.width === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    // Setup canvas
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    canvas.style.width = `${dimensions.width}px`
    canvas.style.height = `${dimensions.height}px`
    ctx.scale(dpr, dpr)

    // Clear
    ctx.fillStyle = '#0a0e17'
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)

    const padding = {
      top: 40,
      right: 80,
      bottom: showVolume ? 80 : 40,
      left: 20
    }

    const chartWidth = dimensions.width - padding.left - padding.right
    const chartHeight = (dimensions.height - padding.top - padding.bottom) * (showVolume ? 0.7 : 1)

    // Get price range
    const prices = aggregatedData.flatMap(d => [d.high, d.low])
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    const pricePadding = priceRange * 0.15
    const minY = minPrice - pricePadding
    const maxY = maxPrice + pricePadding
    const adjustedRange = maxY - minY

    // Helper functions
    const getX = (index: number) => {
      if (aggregatedData.length === 1) {
        return padding.left + chartWidth / 2
      }
      return padding.left + (index / (aggregatedData.length - 1)) * chartWidth
    }

    const getY = (price: number) => {
      return padding.top + chartHeight - ((price - minY) / adjustedRange) * chartHeight
    }

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
      ctx.lineWidth = 1

      const gridLines = 5
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i
        
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(dimensions.width - padding.right, y)
        ctx.stroke()

        const price = maxY - (adjustedRange / gridLines) * i
        ctx.fillStyle = 'rgba(156, 163, 175, 0.6)'
        ctx.font = '11px ui-monospace, monospace'
        ctx.textAlign = 'left'
        ctx.fillText(
          price.toFixed(3),
          dimensions.width - padding.right + 10,
          y + 4
        )
      }

      const timeLines = 6
      for (let i = 0; i <= timeLines; i++) {
        const x = padding.left + (chartWidth / timeLines) * i
        
        ctx.beginPath()
        ctx.moveTo(x, padding.top)
        ctx.lineTo(x, padding.top + chartHeight)
        ctx.stroke()
      }
    }

    // Determine overall trend
    const firstBar = aggregatedData[0]
    const lastBar = aggregatedData[aggregatedData.length - 1]
    const isUptrend = lastBar.close >= firstBar.open

    const lineColor = isUptrend ? '#10b981' : '#ef4444'
    const gradientColor1 = isUptrend ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
    const gradientColor2 = isUptrend ? 'rgba(16, 185, 129, 0)' : 'rgba(239, 68, 68, 0)'

    if (chartType === 'line') {
      // Draw line chart using CLOSE prices
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
      gradient.addColorStop(0, gradientColor1)
      gradient.addColorStop(1, gradientColor2)

      // Fill area
      ctx.beginPath()
      ctx.moveTo(getX(0), padding.top + chartHeight)
      
      aggregatedData.forEach((bar, index) => {
        ctx.lineTo(getX(index), getY(bar.close))
      })
      
      ctx.lineTo(getX(aggregatedData.length - 1), padding.top + chartHeight)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      // Draw line
      ctx.beginPath()
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      aggregatedData.forEach((bar, index) => {
        const x = getX(index)
        const y = getY(bar.close)
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()

    } else {
      // Draw candlestick chart
      const candleWidth = Math.max(1, Math.min(20, chartWidth / aggregatedData.length * 0.8))
      
      aggregatedData.forEach((bar, index) => {
        const x = getX(index)
        const open = getY(bar.open)
        const close = getY(bar.close)
        const high = getY(bar.high)
        const low = getY(bar.low)
        
        // Determine if bullish or bearish
        const isBullish = bar.close >= bar.open
        const color = isBullish ? '#10b981' : '#ef4444'
        
        // Draw wick (high-low line)
        ctx.strokeStyle = color
        ctx.lineWidth = Math.max(1, candleWidth * 0.1)
        ctx.beginPath()
        ctx.moveTo(x, high)
        ctx.lineTo(x, low)
        ctx.stroke()
        
        // Draw body (open-close rectangle)
        const bodyTop = Math.min(open, close)
        const bodyBottom = Math.max(open, close)
        const bodyHeight = Math.max(1, bodyBottom - bodyTop)
        
        if (isBullish) {
          // Bullish candle - filled
          ctx.fillStyle = color
          ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight)
        } else {
          // Bearish candle - filled
          ctx.fillStyle = color
          ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight)
        }
        
        // Add border for clarity
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.strokeRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight)
      })
    }

    // Draw current price indicator
    if (aggregatedData.length > 0) {
      const lastBar = aggregatedData[aggregatedData.length - 1]
      const lastX = getX(aggregatedData.length - 1)
      const lastY = getY(lastBar.close)

      // Glow effect
      ctx.shadowColor = lineColor
      ctx.shadowBlur = 20
      
      ctx.beginPath()
      ctx.arc(lastX, lastY, 8, 0, Math.PI * 2)
      ctx.fillStyle = lineColor + '30'
      ctx.fill()

      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
      ctx.fillStyle = lineColor
      ctx.fill()

      ctx.shadowBlur = 0

      // Horizontal price line
      ctx.beginPath()
      ctx.setLineDash([5, 5])
      ctx.strokeStyle = lineColor + '60'
      ctx.lineWidth = 1
      ctx.moveTo(padding.left, lastY)
      ctx.lineTo(dimensions.width - padding.right, lastY)
      ctx.stroke()
      ctx.setLineDash([])

      // Price label
      ctx.fillStyle = lineColor
      ctx.fillRect(dimensions.width - padding.right + 5, lastY - 10, padding.right - 10, 20)
      ctx.fillStyle = '#0a0e17'
      ctx.font = 'bold 11px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(
        lastBar.close.toFixed(3),
        dimensions.width - padding.right / 2,
        lastY + 4
      )
    }

    // Draw volume bars
    if (showVolume && aggregatedData.some(b => b.volume)) {
      const volumeHeight = dimensions.height - padding.top - chartHeight - 40
      const volumes = aggregatedData.map(b => b.volume)
      const maxVolume = Math.max(...volumes) || 1

      aggregatedData.forEach((bar, index) => {
        const x = getX(index)
        const barHeight = (bar.volume / maxVolume) * volumeHeight
        const barWidth = Math.max(2, chartWidth / aggregatedData.length * 0.6)

        const isBullish = bar.close >= bar.open
        ctx.fillStyle = isBullish ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'
        
        ctx.fillRect(
          x - barWidth/2,
          padding.top + chartHeight + 20 + (volumeHeight - barHeight),
          barWidth,
          barHeight
        )
      })
    }

    // Draw crosshair
    if (mousePos) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])

      ctx.beginPath()
      ctx.moveTo(mousePos.x, padding.top)
      ctx.lineTo(mousePos.x, padding.top + chartHeight)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(padding.left, mousePos.y)
      ctx.lineTo(dimensions.width - padding.right, mousePos.y)
      ctx.stroke()

      ctx.setLineDash([])

      const priceAtCursor = maxY - ((mousePos.y - padding.top) / chartHeight) * adjustedRange
      if (priceAtCursor >= minY && priceAtCursor <= maxY) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.9)'
        ctx.fillRect(dimensions.width - padding.right + 5, mousePos.y - 10, padding.right - 10, 20)
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 11px ui-monospace, monospace'
        ctx.textAlign = 'center'
        ctx.fillText(
          priceAtCursor.toFixed(3),
          dimensions.width - padding.right / 2,
          mousePos.y + 4
        )
      }
    }

  }, [aggregatedData, dimensions, chartType, showGrid, showVolume, mousePos, isFullscreen])

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
    <div 
      ref={containerRef} 
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0e17]' : 'h-full'}`}
    >
      {/* Chart Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-1">
          {(['1m', '5m', '15m', '1h', '4h', '1d'] as Timeframe[]).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                timeframe === tf
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Type */}
        <div className="flex items-center gap-1 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-1">
          <button
            onClick={() => setChartType('line')}
            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
              chartType === 'line'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('candle')}
            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
              chartType === 'candle'
                ? 'bg-blue-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Candle
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-1">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            disabled={zoom <= 0.5}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono text-gray-400 px-1">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            disabled={zoom >= 3}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Toggle Buttons */}
        <div className="flex items-center gap-1 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-1">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
              showGrid
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Toggle Grid"
          >
            Grid
          </button>
          <button
            onClick={() => setShowVolume(!showVolume)}
            className={`px-2 py-1 text-xs font-medium rounded transition-all ${
              showVolume
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
            title="Toggle Volume"
          >
            Vol
          </button>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1.5 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg text-gray-400 hover:text-white transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Chart Info */}
      <div className="absolute top-3 right-3 z-10 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg px-3 py-2">
        <div className="text-xs text-gray-400">
          {selectedAsset.symbol} • {timeframe} • {chartType === 'line' ? 'Line' : 'Candle'}
        </div>
        {aggregatedData.length > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            {aggregatedData.length} bars • {rawPriceData.length} raw
          </div>
        )}
      </div>

      {/* Chart Canvas */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Loading/Info indicator */}
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-sm flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <div>Loading historical data...</div>
          </div>
        </div>
      ) : dataLoadError ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-400 text-sm flex flex-col items-center gap-3 text-center max-w-md">
            <Activity className="w-12 h-12 opacity-20" />
            <div>{dataLoadError}</div>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : aggregatedData.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-sm flex flex-col items-center gap-3">
            <div className="animate-pulse">
              <Activity className="w-12 h-12 opacity-20" />
            </div>
            <div>Waiting for data...</div>
            <div className="text-xs text-gray-600">Make sure simulator is running</div>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      ) : !historicalLoaded && aggregatedData.length < 20 ? (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-2 text-xs text-blue-400 animate-pulse">
          📊 Building chart... ({aggregatedData.length} bars loaded)
        </div>
      ) : null}

      {/* Watermark */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-700 font-mono">
        BinaryTrade • {selectedAsset.symbol} • {timeframe}
      </div>
    </div>
  )
}