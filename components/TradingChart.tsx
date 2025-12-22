'use client'

import { useEffect, useRef, useState } from 'react'
import { useTradingStore } from '@/store/trading'
import { Activity } from 'lucide-react'

interface PricePoint {
  timestamp: number
  price: number
}

export default function TradingChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { selectedAsset, currentPrice } = useTradingStore()
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [priceData, setPriceData] = useState<PricePoint[]>([])
  const maxDataPoints = 60

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

    // Clear
    ctx.fillStyle = '#0a0e17'
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)

    const padding = {
      top: 40,
      right: 80,
      bottom: 40,
      left: 20
    }

    const chartWidth = dimensions.width - padding.left - padding.right
    const chartHeight = dimensions.height - padding.top - padding.bottom

    // Get price range
    const prices = priceData.map(d => d.price)
    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const priceRange = maxPrice - minPrice || 1

    const pricePadding = priceRange * 0.15
    const minY = minPrice - pricePadding
    const maxY = maxPrice + pricePadding
    const adjustedRange = maxY - minY

    // Helper functions
    const getX = (index: number) => {
      return padding.left + (index / (priceData.length - 1)) * chartWidth
    }

    const getY = (price: number) => {
      return padding.top + chartHeight - ((price - minY) / adjustedRange) * chartHeight
    }

    // Draw horizontal grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    ctx.lineWidth = 1

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

    // Draw vertical time grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
    const timeLines = 6
    for (let i = 0; i <= timeLines; i++) {
      const x = padding.left + (chartWidth / timeLines) * i
      
      ctx.beginPath()
      ctx.moveTo(x, padding.top)
      ctx.lineTo(x, dimensions.height - padding.bottom)
      ctx.stroke()
    }

    // Determine trend
    const firstPrice = priceData[0].price
    const lastPrice = priceData[priceData.length - 1].price
    const isUptrend = lastPrice >= firstPrice

    // Colors based on trend
    const lineColor = isUptrend ? '#10b981' : '#ef4444'
    const gradientColor1 = isUptrend ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'
    const gradientColor2 = isUptrend ? 'rgba(16, 185, 129, 0)' : 'rgba(239, 68, 68, 0)'

    // Create gradient for fill
    const gradient = ctx.createLinearGradient(0, padding.top, 0, dimensions.height - padding.bottom)
    gradient.addColorStop(0, gradientColor1)
    gradient.addColorStop(1, gradientColor2)

    // Draw filled area
    ctx.beginPath()
    ctx.moveTo(getX(0), dimensions.height - padding.bottom)
    
    priceData.forEach((point, index) => {
      ctx.lineTo(getX(index), getY(point.price))
    })
    
    ctx.lineTo(getX(priceData.length - 1), dimensions.height - padding.bottom)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw line with smooth curves
    ctx.beginPath()
    ctx.strokeStyle = lineColor
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'

    priceData.forEach((point, index) => {
      const x = getX(index)
      const y = getY(point.price)
      
      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        // Smooth curve using quadratic
        const prevX = getX(index - 1)
        const prevY = getY(priceData[index - 1].price)
        const cpX = (prevX + x) / 2
        const cpY = (prevY + y) / 2
        ctx.quadraticCurveTo(prevX, prevY, cpX, cpY)
      }
    })

    // Complete the curve to last point
    const lastIndex = priceData.length - 1
    ctx.lineTo(getX(lastIndex), getY(priceData[lastIndex].price))
    ctx.stroke()

    // Draw current price indicator
    if (priceData.length > 0) {
      const lastPoint = priceData[priceData.length - 1]
      const lastX = getX(priceData.length - 1)
      const lastY = getY(lastPoint.price)

      // Glow effect
      ctx.shadowColor = lineColor
      ctx.shadowBlur = 20
      
      // Outer circle
      ctx.beginPath()
      ctx.arc(lastX, lastY, 8, 0, Math.PI * 2)
      ctx.fillStyle = lineColor + '30'
      ctx.fill()

      // Inner circle
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(lastX, lastY, 4, 0, Math.PI * 2)
      ctx.fillStyle = lineColor
      ctx.fill()

      // Reset shadow
      ctx.shadowBlur = 0

      // Horizontal price line (dashed)
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
        lastPoint.price.toFixed(3),
        dimensions.width - padding.right / 2,
        lastY + 4
      )
    }

  }, [priceData, dimensions])

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
    <div ref={containerRef} className="h-full relative">
      <canvas ref={canvasRef} className="w-full h-full" />

      {/* Loading indicator */}
      {priceData.length === 0 && currentPrice && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-500 text-sm flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            Loading chart data...
          </div>
        </div>
      )}

      {/* Watermark */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-700 font-mono">
        BinaryTrade • Real-time
      </div>
    </div>
  )
}