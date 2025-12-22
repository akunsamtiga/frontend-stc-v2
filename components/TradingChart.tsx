'use client'

import { useEffect, useRef, useState } from 'react'
import { useTradingStore } from '@/store/trading'
import { formatNumber } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'

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

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

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

  useEffect(() => {
    if (!canvasRef.current || priceData.length < 2 || dimensions.width === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = dimensions.width * window.devicePixelRatio
    canvas.height = dimensions.height * window.devicePixelRatio
    canvas.style.width = `${dimensions.width}px`
    canvas.style.height = `${dimensions.height}px`
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    ctx.clearRect(0, 0, dimensions.width, dimensions.height)

    const padding = { top: 40, right: 60, bottom: 30, left: 10 }
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

    ctx.strokeStyle = 'rgba(75, 85, 99, 0.3)'
    ctx.lineWidth = 1
    const gridLines = 5

    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartHeight / gridLines) * i
      ctx.beginPath()
      ctx.moveTo(padding.left, y)
      ctx.lineTo(dimensions.width - padding.right, y)
      ctx.stroke()

      const price = maxY - (adjustedRange / gridLines) * i
      ctx.fillStyle = '#9ca3af'
      ctx.font = '11px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(
        price.toFixed(3),
        dimensions.width - padding.right + 5,
        y + 4
      )
    }

    const isUptrend = priceChange >= 0
    const lineColor = isUptrend ? '#10b981' : '#ef4444'
    const gradientColor1 = isUptrend ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'
    const gradientColor2 = isUptrend ? 'rgba(16, 185, 129, 0)' : 'rgba(239, 68, 68, 0)'

    const gradient = ctx.createLinearGradient(0, padding.top, 0, dimensions.height - padding.bottom)
    gradient.addColorStop(0, gradientColor1)
    gradient.addColorStop(1, gradientColor2)

    ctx.beginPath()
    ctx.moveTo(getX(0), dimensions.height - padding.bottom)
    
    priceData.forEach((point, index) => {
      const x = getX(index)
      const y = getY(point.price)
      if (index === 0) {
        ctx.lineTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    
    ctx.lineTo(getX(priceData.length - 1), dimensions.height - padding.bottom)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

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
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    if (priceData.length > 0) {
      const lastPoint = priceData[priceData.length - 1]
      const lastX = getX(priceData.length - 1)
      const lastY = getY(lastPoint.price)

      ctx.beginPath()
      ctx.arc(lastX, lastY, 6, 0, Math.PI * 2)
      ctx.fillStyle = lineColor + '40'
      ctx.fill()

      ctx.beginPath()
      ctx.arc(lastX, lastY, 3, 0, Math.PI * 2)
      ctx.fillStyle = lineColor
      ctx.fill()
    }

  }, [priceData, dimensions, priceChange])

  if (!selectedAsset) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Select an asset to view chart</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full bg-background-secondary relative">
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
          <div className="text-xs text-gray-400 mb-1">{selectedAsset.name}</div>
          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-bold font-mono">
              {currentPrice ? formatNumber(currentPrice.price) : '---'}
            </div>
            {priceData.length > 1 && (
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                priceChange >= 0 ? 'text-success' : 'text-danger'
              }`}>
                {priceChange >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(3)}
                </span>
                <span className="text-xs">
                  ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
          {currentPrice && (
            <div className="text-xs text-gray-400 mt-1">
              {new Date(currentPrice.datetime).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="w-full h-full" />

      {priceData.length === 0 && currentPrice && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-sm">
            Collecting data...
          </div>
        </div>
      )}

      {priceData.length > 0 && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-500">
          Last {priceData.length} seconds
        </div>
      )}
    </div>
  )
}