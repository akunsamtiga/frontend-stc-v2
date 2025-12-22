'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useTradingStore } from '@/store/trading'
import { Activity, ZoomIn, ZoomOut, Maximize2, Minimize2 } from 'lucide-react'

interface PricePoint {
  timestamp: number
  price: number
  high?: number
  low?: number
  open?: number
  close?: number
  volume?: number
}

interface AggregatedCandle {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type ChartType = 'line' | 'candle'
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

// Timeframe in seconds
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
  const animationRef = useRef<number | null>(null)
  
  const { selectedAsset, currentPrice } = useTradingStore()
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [priceData, setPriceData] = useState<PricePoint[]>([])
  const [chartType, setChartType] = useState<ChartType>('line')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [showVolume, setShowVolume] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)

  // Handle resize with debounce
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

  // Update price data
  useEffect(() => {
    if (currentPrice) {
      const newPoint: PricePoint = {
        timestamp: currentPrice.timestamp || Date.now() / 1000,
        price: currentPrice.price,
        open: currentPrice.price,
        close: currentPrice.price,
        high: currentPrice.price,
        low: currentPrice.price,
        volume: Math.random() * 1000000
      }

      setPriceData(prev => {
        // Keep last 500 points for aggregation
        const updated = [...prev, newPoint]
        return updated.slice(-500)
      })
    }
  }, [currentPrice])

  // Aggregate data based on timeframe
  const aggregatedData = useMemo(() => {
    if (priceData.length < 2) return []

    const interval = TIMEFRAME_SECONDS[timeframe]
    const candles: AggregatedCandle[] = []
    
    // Group prices by timeframe
    const grouped = new Map<number, PricePoint[]>()
    
    priceData.forEach(point => {
      const bucketTime = Math.floor(point.timestamp / interval) * interval
      if (!grouped.has(bucketTime)) {
        grouped.set(bucketTime, [])
      }
      grouped.get(bucketTime)!.push(point)
    })

    // Create candles from grouped data
    Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .forEach(([bucketTime, points]) => {
        if (points.length === 0) return

        const prices = points.map(p => p.price)
        const volumes = points.map(p => p.volume || 0)
        
        candles.push({
          timestamp: bucketTime,
          open: points[0].price,
          high: Math.max(...prices),
          low: Math.min(...prices),
          close: points[points.length - 1].price,
          volume: volumes.reduce((sum, v) => sum + v, 0)
        })
      })

    // Apply zoom - show fewer candles when zoomed in
    const maxCandles = Math.floor(60 / zoom)
    return candles.slice(-maxCandles)
  }, [priceData, timeframe, zoom])

  // Mouse move handler for crosshair
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

  // Draw chart
  useEffect(() => {
    if (!canvasRef.current || aggregatedData.length < 2 || dimensions.width === 0) return

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

    // Clear with solid background
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
    let prices: number[]
    if (chartType === 'line') {
      prices = aggregatedData.map(d => d.close)
    } else {
      prices = aggregatedData.flatMap(d => [d.high, d.low])
    }
    
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    const pricePadding = priceRange * 0.15
    const minY = minPrice - pricePadding
    const maxY = maxPrice + pricePadding
    const adjustedRange = maxY - minY

    // Helper functions
    const getX = (index: number) => {
      return padding.left + (index / (aggregatedData.length - 1)) * chartWidth
    }

    const getY = (price: number) => {
      return padding.top + chartHeight - ((price - minY) / adjustedRange) * chartHeight
    }

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
      ctx.lineWidth = 1

      // Horizontal grid
      const gridLines = 5
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i
        
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(dimensions.width - padding.right, y)
        ctx.stroke()

        // Price labels
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

      // Vertical grid
      const timeLines = 6
      for (let i = 0; i <= timeLines; i++) {
        const x = padding.left + (chartWidth / timeLines) * i
        
        ctx.beginPath()
        ctx.moveTo(x, padding.top)
        ctx.lineTo(x, padding.top + chartHeight)
        ctx.stroke()
      }
    }

    // Determine trend
    const firstPrice = aggregatedData[0].close
    const lastPrice = aggregatedData[aggregatedData.length - 1].close
    const isUptrend = lastPrice >= firstPrice

    // Colors
    const lineColor = isUptrend ? '#10b981' : '#ef4444'
    const gradientColor1 = isUptrend ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
    const gradientColor2 = isUptrend ? 'rgba(16, 185, 129, 0)' : 'rgba(239, 68, 68, 0)'

    if (chartType === 'line') {
      // Draw line chart
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
      gradient.addColorStop(0, gradientColor1)
      gradient.addColorStop(1, gradientColor2)

      // Fill area
      ctx.beginPath()
      ctx.moveTo(getX(0), padding.top + chartHeight)
      
      aggregatedData.forEach((candle, index) => {
        ctx.lineTo(getX(index), getY(candle.close))
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

      aggregatedData.forEach((candle, index) => {
        const x = getX(index)
        const y = getY(candle.close)
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
    } else {
      // Draw candlestick chart
      const candleWidth = Math.max(3, (chartWidth / aggregatedData.length) * 0.7)
      
      aggregatedData.forEach((candle, index) => {
        const x = getX(index)
        const open = getY(candle.open)
        const close = getY(candle.close)
        const high = getY(candle.high)
        const low = getY(candle.low)
        
        const isBullish = candle.close >= candle.open
        const color = isBullish ? '#10b981' : '#ef4444'
        
        // Draw wick
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(x, high)
        ctx.lineTo(x, low)
        ctx.stroke()
        
        // Draw body
        const bodyTop = Math.min(open, close)
        const bodyHeight = Math.max(Math.abs(close - open), 1) // Minimum 1px height
        
        ctx.fillStyle = color
        ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight)
        
        // Add border for hollow candles (optional)
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.strokeRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight)
      })
    }

    // Draw current price indicator
    if (aggregatedData.length > 0) {
      const lastCandle = aggregatedData[aggregatedData.length - 1]
      const lastX = getX(aggregatedData.length - 1)
      const lastY = getY(lastCandle.close)

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
        lastCandle.close.toFixed(3),
        dimensions.width - padding.right / 2,
        lastY + 4
      )
    }

    // Draw volume bars
    if (showVolume && aggregatedData.some(c => c.volume)) {
      const volumeHeight = dimensions.height - padding.top - chartHeight - 40
      const volumes = aggregatedData.map(c => c.volume)
      const maxVolume = Math.max(...volumes) || 1

      aggregatedData.forEach((candle, index) => {
        const x = getX(index)
        const barHeight = (candle.volume / maxVolume) * volumeHeight
        const barWidth = Math.max(2, (chartWidth / aggregatedData.length) * 0.6)

        const isBullish = candle.close >= candle.open
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

      // Vertical line
      ctx.beginPath()
      ctx.moveTo(mousePos.x, padding.top)
      ctx.lineTo(mousePos.x, padding.top + chartHeight)
      ctx.stroke()

      // Horizontal line
      ctx.beginPath()
      ctx.moveTo(padding.left, mousePos.y)
      ctx.lineTo(dimensions.width - padding.right, mousePos.y)
      ctx.stroke()

      ctx.setLineDash([])

      // Price at crosshair
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

  // Toggle fullscreen
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
      {aggregatedData.length > 0 && (
        <div className="absolute top-3 right-3 z-10 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg px-3 py-2">
          <div className="text-xs text-gray-400 space-y-1">
            <div className="flex items-center gap-3">
              <span>Candles: {aggregatedData.length}</span>
              <span>TF: {timeframe}</span>
            </div>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Loading indicator */}
      {aggregatedData.length === 0 && currentPrice && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            Aggregating chart data...
          </div>
        </div>
      )}

      {/* Watermark */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-700 font-mono">
        BinaryTrade • {selectedAsset.symbol} • {timeframe} • {chartType.toUpperCase()}
      </div>
    </div>
  )
}