'use client'

import { useEffect, useRef, useState } from 'react'
import { useTradingStore } from '@/store/trading'
import { formatNumber } from '@/lib/utils'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

interface PricePoint {
  timestamp: number
  price: number
}

export default function TradingChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { selectedAsset, currentPrice, priceHistory } = useTradingStore()
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [priceData, setPriceData] = useState<PricePoint[]>([])
  const [priceChange, setPriceChange] = useState(0)
  const [priceChangePercent, setPriceChangePercent] = useState(0)
  const maxDataPoints = 60

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
  }, [])

  // Update price data
  useEffect(() => {
    if (currentPrice) {
      const newPoint: PricePoint = {
        timestamp: currentPrice.timestamp || Date.now() / 1000,
        price: currentPrice.price
      }

      setPriceData(prev => {
        const updated = [...prev, newPoint]
        return updated.slice(-maxDataPoints)
      })

      if (priceData.length > 0) {
        const firstPrice = priceData[0].price
        const change = currentPrice.price - firstPrice
        const changePercent = (change / firstPrice) * 100
        setPriceChange(change)
        setPriceChangePercent(changePercent)
      }
    }
  }, [currentPrice])

  // Draw chart
  useEffect(() => {
    if (!canvasRef.current || priceData.length < 2 || dimensions.width === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = dimensions.width * dpr
    canvas.height = dimensions.height * dpr
    canvas.style.width = `${dimensions.width}px`
    canvas.style.height = `${dimensions.height}px`
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    // Responsive padding
    const isMobile = dimensions.width < 640
    const padding = {
      top: isMobile ? 30 : 50,
      right: isMobile ? 50 : 70,
      bottom: isMobile ? 25 : 35,
      left: isMobile ? 5 : 10
    }

    const chartWidth = dimensions.width - padding.left - padding.right
    const chartHeight = dimensions.height - padding.top - padding.bottom

    const prices = priceData.map(d => d.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    const pricePadding = priceRange * 0.1
    const minY = minPrice - pricePadding
    const maxY = maxPrice + pricePadding
    const adjustedRange = maxY - minY

    const getX = (index: number) => {
      return padding.left + (index / (priceData.length - 1)) * chartWidth
    }

    const getY = (price: number) => {
      return padding.top + chartHeight - ((price - minY) / adjustedRange) * chartHeight
    }

    // Draw grid
    ctx.strokeStyle = 'rgba(75, 85, 99, 0.2)'
    ctx.lineWidth = 1
    const gridLines = isMobile ? 3 : 5

    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(dimensions.width - padding.right, y)
      ctx.stroke()

      const price = maxY - (adjustedRange / gridLines) * i
      ctx.fillStyle = '#9ca3af'
      ctx.font = isMobile ? '10px monospace' : '11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(
        price.toFixed(3),
        dimensions.width - padding.right + 5,
        y + 4
      )
    }

    // Trend colors
    const isUptrend = priceChange >= 0
    const lineColor = isUptrend ? '#10b981' : '#ef4444'
    const gradientColor1 = isUptrend ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
    const gradientColor2 = isUptrend ? 'rgba(16, 185, 129, 0)' : 'rgba(239, 68, 68, 0)'

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, dimensions.height - padding.bottom)
    gradient.addColorStop(0, gradientColor1)
    gradient.addColorStop(1, gradientColor2)

    ctx.beginPath()
    ctx.moveTo(getX(0), dimensions.height - padding.bottom)
    
    priceData.forEach((point, index) => {
      ctx.lineTo(getX(index), getY(point.price))
    })
    
    ctx.lineTo(getX(priceData.length - 1), dimensions.height - padding.bottom)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw line
    ctx.beginPath()
    ctx.strokeStyle = lineColor
    ctx.lineWidth = isMobile ? 2 : 2.5
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    priceData.forEach((point, index) => {
      const x = getX(index)
      const y = getY(point.price)
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Current price indicator
    if (priceData.length > 0) {
      const lastPoint = priceData[priceData.length - 1]
      const lastX = getX(priceData.length - 1)
      const lastY = getY(lastPoint.price)

      // Animated glow
      ctx.beginPath()
      ctx.arc(lastX, lastY, isMobile ? 8 : 10, 0, Math.PI * 2)
      ctx.fillStyle = lineColor + '20'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(lastX, lastY, isMobile ? 5 : 6, 0, Math.PI * 2)
      ctx.fillStyle = lineColor + '60'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(lastX, lastY, isMobile ? 3 : 4, 0, Math.PI * 2)
      ctx.fillStyle = lineColor
      ctx.fill()

      // Price line
      ctx.beginPath()
      ctx.strokeStyle = lineColor + '40'
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      ctx.moveTo(lastX, lastY)
      ctx.lineTo(dimensions.width - padding.right, lastY)
      ctx.stroke()
      ctx.setLineDash([])
    }

  }, [priceData, dimensions, priceChange])

  if (!selectedAsset) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400 bg-background-secondary">
        <div className="text-center px-4">
          <Activity className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 opacity-30" />
          <p className="text-sm sm:text-base">Select an asset to view chart</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full bg-background-secondary relative overflow-hidden">
      {/* Price Display - Responsive positioning */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10">
        <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 sm:p-3 border border-gray-700 shadow-xl">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
            <div className="text-xs sm:text-sm text-gray-400">{selectedAsset.symbol}</div>
          </div>
          <div className="flex items-baseline gap-2 sm:gap-3">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold font-mono">
              {currentPrice ? formatNumber(currentPrice.price) : '---'}
            </div>
            {priceData.length > 1 && (
              <div className={`flex items-center gap-1 text-xs sm:text-sm font-semibold ${
                priceChange >= 0 ? 'text-success' : 'text-danger'
              }`}>
                {priceChange >= 0 ? (
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                ) : (
                  <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
                <span>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(3)}
                </span>
                <span className="text-[10px] sm:text-xs opacity-80">
                  ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
          {currentPrice && (
            <div className="text-[10px] sm:text-xs text-gray-400 mt-1">
              {new Date(currentPrice.datetime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chart Canvas */}
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Loading State */}
      {priceData.length === 0 && currentPrice && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-gray-400 text-xs sm:text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-primary"></div>
            Collecting data...
          </div>
        </div>
      )}

      {/* Time Range Label */}
      {priceData.length > 0 && (
        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3">
          <div className="bg-background/70 backdrop-blur-sm rounded px-2 py-1 text-[10px] sm:text-xs text-gray-400 border border-gray-700">
            {priceData.length}s
          </div>
        </div>
      )}

      {/* Asset Info - Bottom Left */}
      <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3">
        <div className="bg-background/70 backdrop-blur-sm rounded px-2 py-1 border border-gray-700">
          <div className="text-[10px] sm:text-xs text-gray-400">
            {selectedAsset.name}
          </div>
        </div>
      </div>
    </div>
  )
}