'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useTradingStore } from '@/store/trading'
import { fetchHistoricalData, subscribeToPriceUpdates, subscribeToOHLCUpdates, testFirebaseConnection } from '@/lib/firebase'
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

const MAX_VISIBLE_BARS = 150
const MIN_VISIBLE_BARS = 50

export default function TradingChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { selectedAsset, currentPrice, setCurrentPrice, addPriceToHistory } = useTradingStore()
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [barData, setBarData] = useState<BarData[]>([])
  const [visibleData, setVisibleData] = useState<BarData[]>([])
  const [chartType, setChartType] = useState<ChartType>('line')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [showVolume, setShowVolume] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dataLoadError, setDataLoadError] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  
  const [panOffset, setPanOffset] = useState(0)
  const [canPanLeft, setCanPanLeft] = useState(false)
  const [canPanRight, setCanPanRight] = useState(false)
  
  const visibleBars = Math.floor(MAX_VISIBLE_BARS / zoom)

  // Test Firebase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      console.log('🔍 Checking Firebase connection...')
      setConnectionStatus('checking')
      const isConnected = await testFirebaseConnection()
      setConnectionStatus(isConnected ? 'connected' : 'error')
      
      if (!isConnected) {
        setDataLoadError('Cannot connect to Firebase. Please check:\n1. Firebase URL in .env\n2. Network connection\n3. Firebase rules')
      }
    }
    
    checkConnection()
  }, [])
  
  // ✅ Load data when asset or timeframe changes
  useEffect(() => {
    if (!selectedAsset) {
      console.log('⚠️ No asset selected')
      return
    }

    const loadData = async () => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📊 LOADING CHART DATA')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      
      setIsLoading(true)
      setDataLoadError(null)
      setPanOffset(0)
      
      try {
        console.log('📋 Asset Info:', {
          name: selectedAsset.name,
          symbol: selectedAsset.symbol,
          dataSource: selectedAsset.dataSource,
          realtimeDbPath: selectedAsset.realtimeDbPath
        })
        
        let assetPath = ''
        
        if (selectedAsset.dataSource === 'realtime_db' && selectedAsset.realtimeDbPath) {
          const pathParts = selectedAsset.realtimeDbPath.split('/')
          assetPath = pathParts.slice(0, -1).join('/')
          console.log('✅ Using realtimeDbPath:', assetPath)
        } else {
          assetPath = `/${selectedAsset.symbol.toLowerCase()}`
          console.log('✅ Using symbol path:', assetPath)
        }

        console.log(`🔍 Fetching ${timeframe} timeframe data...`)
        
        // ✅ Fetch directly from pre-aggregated timeframe
        const data = await fetchHistoricalData(assetPath, timeframe)
        
        console.log(`📊 Data Fetch Result:`, {
          barsReceived: data.length,
          timeframe: timeframe,
          path: `${assetPath}/ohlc_${timeframe}`
        })
        
        if (data.length > 0) {
          console.log('✅ Data loaded successfully!')
          console.log('   First bar:', {
            timestamp: data[0].timestamp,
            datetime: data[0].datetime,
            close: data[0].close
          })
          console.log('   Last bar:', {
            timestamp: data[data.length - 1].timestamp,
            datetime: data[data.length - 1].datetime,
            close: data[data.length - 1].close
          })
          
          setBarData(data)
          setDataLoadError(null)
        } else {
          console.error('❌ No data received!')
          console.log('💡 Troubleshooting:')
          console.log('   1. Check simulator is running: tail -f simulator.log')
          console.log('   2. Check Firebase Console for data')
          console.log('   3. Expected path:', `${assetPath}/ohlc_${timeframe}`)
          console.log('   4. Check asset configuration in database')
          
          const errorMsg = '⚠️ No data available\n\n' +
            'Please check:\n' +
            '1. Simulator is running\n' +
            '2. Data exists in Firebase Console\n' +
            `3. Path: ${assetPath}/ohlc_${timeframe}\n` +
            '4. Asset realtimeDbPath is correct'
          
          setDataLoadError(errorMsg)
          setBarData([])
        }
        
      } catch (error: any) {
        console.error('❌ ERROR loading data:', error)
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        })
        
        setDataLoadError(`Error: ${error.message}\n\nCheck console for details`)
        setBarData([])
      } finally {
        setIsLoading(false)
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      }
    }

    loadData()
  }, [selectedAsset, timeframe])

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

  // ✅ Subscribe to real-time updates for CURRENT price
  useEffect(() => {
    if (!selectedAsset || isLoading) return

    let unsubscribe: (() => void) | undefined

    if (selectedAsset.dataSource === 'realtime_db' && selectedAsset.realtimeDbPath) {
      console.log('🔔 Subscribing to current price updates')
      console.log('   Path:', selectedAsset.realtimeDbPath)
      
      unsubscribe = subscribeToPriceUpdates(selectedAsset.realtimeDbPath, (data) => {
        console.log('📈 Price update:', data.price)
        setCurrentPrice(data)
        addPriceToHistory(data)
      })
    }

    return () => {
      if (unsubscribe) {
        console.log('🔕 Unsubscribing from price updates')
        unsubscribe()
      }
    }
  }, [selectedAsset, isLoading])

  // ✅ Subscribe to timeframe-specific OHLC updates
  useEffect(() => {
    if (!selectedAsset || isLoading || barData.length === 0) return

    let unsubscribe: (() => void) | undefined

    if (selectedAsset.dataSource === 'realtime_db' && selectedAsset.realtimeDbPath) {
      const pathParts = selectedAsset.realtimeDbPath.split('/')
      const assetPath = pathParts.slice(0, -1).join('/')
      
      console.log(`🔔 Subscribing to ${timeframe} OHLC updates`)
      console.log('   Path:', `${assetPath}/ohlc_${timeframe}`)
      
      unsubscribe = subscribeToOHLCUpdates(assetPath, timeframe, (newBar) => {
        console.log(`📊 New ${timeframe} bar:`, newBar.close)
        
        setBarData(prev => {
          const existingIndex = prev.findIndex(b => b.timestamp === newBar.timestamp)
          
          if (existingIndex >= 0) {
            const updated = [...prev]
            updated[existingIndex] = newBar
            return updated
          } else {
            const updated = [...prev, newBar]
            return updated.slice(-1000)
          }
        })
      })
    }

    return () => {
      if (unsubscribe) {
        console.log(`🔕 Unsubscribing from ${timeframe} updates`)
        unsubscribe()
      }
    }
  }, [selectedAsset, timeframe, isLoading, barData.length])

  // ✅ Set visible data based on pan and zoom
  useEffect(() => {
    if (barData.length === 0) return

    const totalBars = barData.length
    const barsToShow = Math.min(visibleBars, totalBars)
    
    const endIndex = totalBars - panOffset
    const startIndex = Math.max(0, endIndex - barsToShow)
    
    const visible = barData.slice(startIndex, endIndex)
    
    setVisibleData(visible)
    setCanPanLeft(endIndex < totalBars)
    setCanPanRight(panOffset > 0)
    
  }, [barData, panOffset, visibleBars])

  // Pan controls
  const panLeft = () => {
    if (canPanLeft) {
      setPanOffset(prev => Math.min(prev + 20, barData.length - visibleBars))
    }
  }

  const panRight = () => {
    if (canPanRight) {
      setPanOffset(prev => Math.max(prev - 20, 0))
    }
  }

  const resetPan = () => {
    setPanOffset(0)
  }

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

  // Refresh data
  const handleRefresh = () => {
    if (!selectedAsset) return
    
    console.log('🔄 Manual refresh triggered')
    
    setIsLoading(true)
    setBarData([])
    setPanOffset(0)
    
    const asset = selectedAsset
    useTradingStore.setState({ selectedAsset: null })
    setTimeout(() => {
      useTradingStore.setState({ selectedAsset: asset })
    }, 100)
  }

  // Draw chart
  useEffect(() => {
    if (!canvasRef.current || visibleData.length === 0 || dimensions.width === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    canvas.style.width = `${dimensions.width}px`
    canvas.style.height = `${dimensions.height}px`
    ctx.scale(dpr, dpr)

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

    const prices = visibleData.flatMap(d => [d.high, d.low])
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    const pricePadding = priceRange * 0.15
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
        ctx.fillText(price.toFixed(3), dimensions.width - padding.right + 10, y + 4)
      }
    }

    const firstBar = visibleData[0]
    const lastBar = visibleData[visibleData.length - 1]
    const isUptrend = lastBar.close >= firstBar.open

    const lineColor = isUptrend ? '#10b981' : '#ef4444'
    const gradientColor1 = isUptrend ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
    const gradientColor2 = isUptrend ? 'rgba(16, 185, 129, 0)' : 'rgba(239, 68, 68, 0)'

    if (chartType === 'line') {
      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight)
      gradient.addColorStop(0, gradientColor1)
      gradient.addColorStop(1, gradientColor2)

      ctx.beginPath()
      ctx.moveTo(getX(0), padding.top + chartHeight)
      
      visibleData.forEach((bar, index) => {
        ctx.lineTo(getX(index), getY(bar.close))
      })
      
      ctx.lineTo(getX(visibleData.length - 1), padding.top + chartHeight)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      ctx.beginPath()
      ctx.strokeStyle = lineColor
      ctx.lineWidth = 2
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      visibleData.forEach((bar, index) => {
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
      const candleWidth = Math.max(1, Math.min(20, chartWidth / visibleData.length * 0.8))
      
      visibleData.forEach((bar, index) => {
        const x = getX(index)
        const open = getY(bar.open)
        const close = getY(bar.close)
        const high = getY(bar.high)
        const low = getY(bar.low)
        
        const isBullish = bar.close >= bar.open
        const color = isBullish ? '#10b981' : '#ef4444'
        
        ctx.strokeStyle = color
        ctx.lineWidth = Math.max(1, candleWidth * 0.1)
        ctx.beginPath()
        ctx.moveTo(x, high)
        ctx.lineTo(x, low)
        ctx.stroke()
        
        const bodyTop = Math.min(open, close)
        const bodyBottom = Math.max(open, close)
        const bodyHeight = Math.max(1, bodyBottom - bodyTop)
        
        ctx.fillStyle = color
        ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight)
        
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.strokeRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight)
      })
    }

    // Draw current price indicator
    if (visibleData.length > 0) {
      const lastBar = visibleData[visibleData.length - 1]
      const lastX = getX(visibleData.length - 1)
      const lastY = getY(lastBar.close)

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

      ctx.beginPath()
      ctx.setLineDash([5, 5])
      ctx.strokeStyle = lineColor + '60'
      ctx.lineWidth = 1
      ctx.moveTo(padding.left, lastY)
      ctx.lineTo(dimensions.width - padding.right, lastY)
      ctx.stroke()
      ctx.setLineDash([])

      ctx.fillStyle = lineColor
      ctx.fillRect(dimensions.width - padding.right + 5, lastY - 10, padding.right - 10, 20)
      ctx.fillStyle = '#0a0e17'
      ctx.font = 'bold 11px ui-monospace, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(lastBar.close.toFixed(3), dimensions.width - padding.right / 2, lastY + 4)
    }

    // Draw volume bars
    if (showVolume && visibleData.some(b => b.volume)) {
      const volumeHeight = dimensions.height - padding.top - chartHeight - 40
      const volumes = visibleData.map(b => b.volume)
      const maxVolume = Math.max(...volumes) || 1

      visibleData.forEach((bar, index) => {
        const x = getX(index)
        const barHeight = (bar.volume / maxVolume) * volumeHeight
        const barWidth = Math.max(2, chartWidth / visibleData.length * 0.6)

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
        ctx.fillText(priceAtCursor.toFixed(3), dimensions.width - padding.right / 2, mousePos.y + 4)
      }
    }

  }, [visibleData, dimensions, chartType, showGrid, showVolume, mousePos, isFullscreen])

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
      {/* Connection Status */}
      {connectionStatus !== 'connected' && (
        <div className="absolute top-3 right-3 z-20 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 flex items-center gap-2">
          {connectionStatus === 'checking' ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400"></div>
              <span className="text-xs text-yellow-400">Checking connection...</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3 h-3 text-red-400" />
              <span className="text-xs text-red-400">Connection error</span>
            </>
          )}
        </div>
      )}

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
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-mono text-gray-400 px-1">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            disabled={zoom >= 3}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pan Controls */}
        <div className="flex items-center gap-1 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-1">
          <button
            onClick={panLeft}
            disabled={!canPanLeft}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetPan}
            disabled={panOffset === 0}
            className="px-2 py-1 text-xs font-medium text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Latest
          </button>
          <button
            onClick={panRight}
            disabled={!canPanRight}
            className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
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
          >
            Vol
          </button>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-1.5 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg text-gray-400 hover:text-white transition-colors"
        >
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Chart Info */}
      <div className="absolute top-3 right-3 z-10 bg-[#0f1419]/80 backdrop-blur-sm border border-gray-800/50 rounded-lg px-3 py-2">
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
          <div className="text-xs text-yellow-400 mt-1">
            📜 Viewing history
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

      {/* Loading/Error States */}
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/80">
          <div className="text-gray-500 text-sm flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <div>Loading {timeframe} data...</div>
            <div className="text-xs text-gray-600">This may take a few seconds</div>
          </div>
        </div>
      ) : dataLoadError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/80">
          <div className="text-red-400 text-sm flex flex-col items-center gap-3 text-center max-w-md p-6">
            <AlertCircle className="w-12 h-12 opacity-20" />
            <div className="font-medium text-base">Unable to Load Chart Data</div>
            <div className="text-xs text-gray-400 whitespace-pre-line">{dataLoadError}</div>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={handleRefresh}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.open('https://console.firebase.google.com', '_blank')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-xs transition-colors"
              >
                Open Firebase Console
              </button>
            </div>
            <div className="text-xs text-gray-600 mt-4">
              💡 Check browser console (F12) for detailed logs
            </div>
          </div>
        </div>
      ) : barData.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/80">
          <div className="text-gray-500 text-sm flex flex-col items-center gap-3">
            <div className="animate-pulse">
              <Activity className="w-12 h-12 opacity-20" />
            </div>
            <div>Waiting for {timeframe} data...</div>
            <div className="text-xs text-gray-600">Simulator may need to generate first bars</div>
            <button 
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-xs transition-colors mt-2"
            >
              Refresh
            </button>
          </div>
        </div>
      ) : null}

      {/* Watermark */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-700 font-mono">
        BinaryTrade • {selectedAsset.symbol} • {timeframe} • {barData.length} bars loaded
      </div>
    </div>
  )
}