'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useTradingStore } from '@/store/trading'
import { fetchHistoricalData, subscribeToOHLCUpdates, clearCache } from '@/lib/firebase'
import { Activity, ZoomIn, ZoomOut, Maximize2, Minimize2, RefreshCw, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

interface BarData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

type ChartType = 'line' | 'candle'
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'

const MAX_VISIBLE_BARS = 100 // Reduced for performance
const MIN_VISIBLE_BARS = 30

export default function TradingChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)

  const { selectedAsset } = useTradingStore()
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [barData, setBarData] = useState<BarData[]>([])
  const [chartType, setChartType] = useState<ChartType>('line')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dataLoadError, setDataLoadError] = useState<string | null>(null)
  const [panOffset, setPanOffset] = useState(0)
  const [lastUpdate, setLastUpdate] = useState(0)

  const visibleBars = Math.floor(MAX_VISIBLE_BARS / zoom)

  // ✅ Memoized visible data
  const visibleData = useMemo(() => {
    if (barData.length === 0) return []
    
    const endIndex = barData.length - panOffset
    const startIndex = Math.max(0, endIndex - visibleBars)
    
    return barData.slice(startIndex, endIndex)
  }, [barData, panOffset, visibleBars])

  // ✅ Debounced resize handler
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
      timeoutId = setTimeout(updateDimensions, 150)
    }

    updateDimensions()
    window.addEventListener('resize', debouncedUpdate)
    
    return () => {
      window.removeEventListener('resize', debouncedUpdate)
      clearTimeout(timeoutId)
    }
  }, [isFullscreen])

  // ✅ Load data when asset or timeframe changes
  useEffect(() => {
    if (!selectedAsset) {
      console.log('⚠️ No asset selected')
      return
    }

    const loadData = async () => {
      console.log('📊 Loading chart data...')
      
      setIsLoading(true)
      setDataLoadError(null)
      setPanOffset(0)
      
      try {
        let assetPath = ''
        
        if (selectedAsset.dataSource === 'realtime_db' && selectedAsset.realtimeDbPath) {
          const pathParts = selectedAsset.realtimeDbPath.split('/')
          assetPath = pathParts.slice(0, -1).join('/')
        } else {
          assetPath = `/${selectedAsset.symbol.toLowerCase()}`
        }

        console.log(`📈 Fetching ${timeframe} data from ${assetPath}...`)
        
        const data = await fetchHistoricalData(assetPath, timeframe)
        
        if (data.length > 0) {
          console.log(`✅ Loaded ${data.length} bars for ${timeframe}`)
          setBarData(data)
          setDataLoadError(null)
        } else {
          console.error('❌ No data received')
          setDataLoadError('No data available. Please check if simulator is running.')
          setBarData([])
        }
        
      } catch (error: any) {
        console.error('❌ Error loading data:', error)
        setDataLoadError(`Error: ${error.message}`)
        setBarData([])
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [selectedAsset, timeframe])

  // ✅ Subscribe to real-time updates
  useEffect(() => {
    if (!selectedAsset || isLoading || barData.length === 0) return

    let unsubscribe: (() => void) | undefined

    if (selectedAsset.dataSource === 'realtime_db' && selectedAsset.realtimeDbPath) {
      const pathParts = selectedAsset.realtimeDbPath.split('/')
      const assetPath = pathParts.slice(0, -1).join('/')
      
      console.log(`🔔 Subscribing to ${timeframe} updates`)
      
      unsubscribe = subscribeToOHLCUpdates(assetPath, timeframe, (newBar) => {
        // Throttle updates untuk performa
        const now = Date.now()
        if (now - lastUpdate < 1000) return
        setLastUpdate(now)
        
        console.log(`📊 New ${timeframe} bar:`, newBar.close)
        
        setBarData(prev => {
          const existingIndex = prev.findIndex(b => b.timestamp === newBar.timestamp)
          
          if (existingIndex >= 0) {
            // Update existing bar
            const updated = [...prev]
            updated[existingIndex] = newBar
            return updated
          } else {
            // Add new bar and keep only last 500 bars
            return [...prev, newBar].slice(-500)
          }
        })
      })
    }

    return () => {
      if (unsubscribe) {
        console.log(`🔕 Unsubscribing from ${timeframe}`)
        unsubscribe()
      }
    }
  }, [selectedAsset, timeframe, isLoading, barData.length])

  // ✅ Optimized canvas rendering with RAF
  useEffect(() => {
    if (!canvasRef.current || visibleData.length === 0 || dimensions.width === 0) return

    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      drawChart()
    })

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [visibleData, dimensions, chartType, showGrid, zoom])

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || visibleData.length === 0) return

    const ctx = canvas.getContext('2d', { 
      alpha: false,
      desynchronized: true // Better performance
    })
    if (!ctx) return

    // Use lower DPR on mobile for performance
    const isMobile = window.innerWidth < 768
    const dpr = isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2)
    
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    canvas.style.width = `${dimensions.width}px`
    canvas.style.height = `${dimensions.height}px`
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.fillStyle = '#0a0e17'
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)

    const padding = { top: 30, right: 70, bottom: 30, left: 20 }
    const chartWidth = dimensions.width - padding.left - padding.right
    const chartHeight = dimensions.height - padding.top - padding.bottom

    // Calculate price range
    const prices = visibleData.flatMap(d => [d.high, d.low])
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1
    const pricePadding = priceRange * 0.1
    const minY = minPrice - pricePadding
    const maxY = maxPrice + pricePadding
    const adjustedRange = maxY - minY

    const getX = (index: number) => {
      if (visibleData.length === 1) return padding.left + chartWidth / 2
      return padding.left + (index / (visibleData.length - 1)) * chartWidth
    }

    const getY = (price: number) => {
      return padding.top + chartHeight - ((price - minY) / adjustedRange) * chartHeight
    }

    // Draw grid (simplified)
    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
      ctx.lineWidth = 1

      const gridLines = 4
      for (let i = 0; i <= gridLines; i++) {
        const y = padding.top + (chartHeight / gridLines) * i
        
        ctx.beginPath()
        ctx.moveTo(padding.left, y)
        ctx.lineTo(dimensions.width - padding.right, y)
        ctx.stroke()

        const price = maxY - (adjustedRange / gridLines) * i
        ctx.fillStyle = 'rgba(156, 163, 175, 0.5)'
        ctx.font = '10px monospace'
        ctx.textAlign = 'left'
        ctx.fillText(price.toFixed(3), dimensions.width - padding.right + 5, y + 3)
      }
    }

    const firstBar = visibleData[0]
    const lastBar = visibleData[visibleData.length - 1]
    const isUptrend = lastBar.close >= firstBar.open
    const lineColor = isUptrend ? '#10b981' : '#ef4444'

    if (chartType === 'line') {
      // Draw line chart (optimized)
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
      gradient.addColorStop(0, isUptrend ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)')
      gradient.addColorStop(1, isUptrend ? 'rgba(16, 185, 129, 0)' : 'rgba(239, 68, 68, 0)')

      // Fill area
      ctx.beginPath()
      ctx.moveTo(getX(0), padding.top + chartHeight)
      visibleData.forEach((bar, i) => ctx.lineTo(getX(i), getY(bar.close)))
      ctx.lineTo(getX(visibleData.length - 1), padding.top + chartHeight)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      // Draw line
      ctx.beginPath()
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      visibleData.forEach((bar, i) => {
        const x = getX(i)
        const y = getY(bar.close)
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.stroke()

    } else {
      // Draw candlestick chart (optimized)
      const candleWidth = Math.max(1, Math.min(15, chartWidth / visibleData.length * 0.7))
      
      visibleData.forEach((bar, index) => {
        const x = getX(index)
        const open = getY(bar.open)
        const close = getY(bar.close)
        const high = getY(bar.high)
        const low = getY(bar.low)
        
        const isBullish = bar.close >= bar.open
        const color = isBullish ? '#10b981' : '#ef4444'
        
        // Draw wick
        ctx.strokeStyle = color
        ctx.lineWidth = Math.max(1, candleWidth * 0.1)
        ctx.beginPath()
        ctx.moveTo(x, high)
        ctx.lineTo(x, low)
        ctx.stroke()
        
        // Draw body
        const bodyTop = Math.min(open, close)
        const bodyBottom = Math.max(open, close)
        const bodyHeight = Math.max(1, bodyBottom - bodyTop)
        
        ctx.fillStyle = color
        ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight)
      })
    }

    // Draw current price line
    if (visibleData.length > 0) {
      const lastBar = visibleData[visibleData.length - 1]
      const lastY = getY(lastBar.close)

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
      ctx.font = 'bold 10px monospace'
      ctx.textAlign = 'center'
      ctx.fillText(lastBar.close.toFixed(3), dimensions.width - padding.right / 2, lastY + 3)
    }
  }, [visibleData, dimensions, chartType, showGrid, zoom])

  // Pan controls
  const panLeft = useCallback(() => {
    setPanOffset(prev => Math.min(prev + 20, barData.length - visibleBars))
  }, [barData.length, visibleBars])

  const panRight = useCallback(() => {
    setPanOffset(prev => Math.max(prev - 20, 0))
  }, [])

  const resetPan = useCallback(() => {
    setPanOffset(0)
  }, [])

  const handleRefresh = useCallback(() => {
    if (!selectedAsset) return
    
    console.log('🔄 Manual refresh')
    clearCache()
    setIsLoading(true)
    setBarData([])
    setPanOffset(0)
    
    const asset = selectedAsset
    useTradingStore.setState({ selectedAsset: null })
    setTimeout(() => {
      useTradingStore.setState({ selectedAsset: asset })
    }, 100)
  }, [selectedAsset])

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev)
  }, [])

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

  const canPanLeft = panOffset < barData.length - visibleBars
  const canPanRight = panOffset > 0

  return (
    <div 
      ref={containerRef} 
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0e17]' : 'h-full'}`}
    >
      {/* Chart Controls */}
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
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              } disabled:opacity-50`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Type */}
        <div className="flex items-center gap-1 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800/50 rounded-lg p-1">
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

        {/* Zoom */}
        <div className="flex items-center gap-1 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800/50 rounded-lg p-1">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            disabled={zoom <= 0.5}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono text-gray-400 px-1">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            disabled={zoom >= 2}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pan */}
        <div className="flex items-center gap-1 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800/50 rounded-lg p-1">
          <button
            onClick={panLeft}
            disabled={!canPanLeft}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetPan}
            disabled={panOffset === 0}
            className="px-2 py-1 text-xs font-medium text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            Latest
          </button>
          <button
            onClick={panRight}
            disabled={!canPanRight}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Grid Toggle */}
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1.5 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800/50 rounded-lg transition-colors ${
            showGrid ? 'text-white' : 'text-gray-400 hover:text-white'
          }`}
        >
          Grid
        </button>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1.5 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800/50 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800/50 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Chart Info */}
      <div className="absolute top-3 right-3 z-10 bg-[#0f1419]/90 backdrop-blur-sm border border-gray-800/50 rounded-lg px-3 py-2">
        <div className="text-xs text-gray-400">
          {selectedAsset.symbol} • {timeframe} • {chartType === 'line' ? 'Line' : 'Candle'}
        </div>
        {barData.length > 0 && (
          <div className="text-xs font-bold mt-1">
            <span className="text-green-400">{visibleData.length}</span>
            <span className="text-gray-500"> / </span>
            <span className="text-gray-400">{barData.length} bars</span>
          </div>
        )}
        {panOffset > 0 && (
          <div className="text-xs text-yellow-400 mt-1">📜 History</div>
        )}
      </div>

      {/* Canvas */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/90">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mx-auto mb-3"></div>
            <div className="text-sm text-gray-400">Loading {timeframe} data...</div>
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && dataLoadError && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/90">
          <div className="text-center max-w-md p-6">
            <AlertCircle className="w-12 h-12 text-red-400 opacity-20 mx-auto mb-3" />
            <div className="text-red-400 text-sm mb-2">Unable to Load Data</div>
            <div className="text-xs text-gray-400 mb-4">{dataLoadError}</div>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !dataLoadError && barData.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/90">
          <div className="text-center">
            <Activity className="w-12 h-12 opacity-20 mx-auto mb-3 animate-pulse" />
            <div className="text-sm text-gray-400 mb-4">Waiting for {timeframe} data...</div>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  )
}