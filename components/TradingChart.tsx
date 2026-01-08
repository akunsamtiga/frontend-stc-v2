'use client'

import { useEffect, useRef, useState, useCallback, memo } from 'react'
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, UTCTimestamp, LineStyle, LineWidth } from 'lightweight-charts'
import { useTradingStore } from '@/store/trading'
import { fetchHistoricalData, subscribeToOHLCUpdates, subscribeToPriceUpdates } from '@/lib/firebase'
import { BinaryOrder } from '@/types'
import { formatCurrency, calculateTimeLeft } from '@/lib/utils'
import { database, ref, get } from '@/lib/firebase'
import dynamic from 'next/dynamic'
import { 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Activity,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Server,
  Sliders,
  Clock,
  BarChart2,
  ArrowUp,
  ArrowDown,
  HelpCircle,
  X,
  MessageCircle,
  Mail,
  Send,
  Minus,
  TrendingDownIcon as LineIcon,
  Circle,
  Square,
  ArrowRight,
  Type
} from 'lucide-react'
import type { IndicatorConfig } from './IndicatorControls'

const IndicatorControls = dynamic(() => import('./IndicatorControls'), { ssr: false })

type ChartType = 'line' | 'candle'
type Timeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
type DrawingTool = 'none' | 'trendline' | 'horizontal' | 'vertical' | 'rectangle' | 'circle' | 'text'

interface TradingChartProps {
  activeOrders?: BinaryOrder[]
  currentPrice?: number
}

interface DrawingObject {
  id: string
  type: DrawingTool
  points: { time: number; price: number }[]
  color: string
  text?: string
}

const DEFAULT_INDICATOR_CONFIG: IndicatorConfig = {
  sma: { enabled: false, period: 20, color: '#3b82f6' },
  ema: { enabled: false, period: 20, color: '#f59e0b' },
  bollinger: { enabled: false, period: 20, stdDev: 2, colorUpper: '#ef4444', colorMiddle: '#6b7280', colorLower: '#10b981' },
  rsi: { enabled: false, period: 14, overbought: 70, oversold: 30 },
  macd: { enabled: false, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  volume: { enabled: false, maPeriod: 20 },
  stochastic: { enabled: false, kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20 },
  atr: { enabled: false, period: 14 }
}

function cleanAssetPath(path: string): string {
  if (!path) return ''
  if (path.endsWith('/current_price')) {
    path = path.replace('/current_price', '')
  }
  path = path.replace(/\/$/, '')
  if (!path.startsWith('/')) path = '/' + path
  return path
}

async function checkSimulatorStatus(assetPath: string): Promise<{
  isRunning: boolean
  hasCurrentPrice: boolean
  hasOHLC: boolean
  message: string
}> {
  if (!database) {
    return { 
      isRunning: false, 
      hasCurrentPrice: false, 
      hasOHLC: false,
      message: 'Firebase not initialized' 
    }
  }

  try {
    const basePath = cleanAssetPath(assetPath)
    
    const priceRef = ref(database, `${basePath}/current_price`)
    const priceSnapshot = await get(priceRef)
    const hasCurrentPrice = priceSnapshot.exists()
    
    const ohlcRef = ref(database, `${basePath}/ohlc_1m`)
    const ohlcSnapshot = await get(ohlcRef)
    const hasOHLC = ohlcSnapshot.exists()
    
    const isRunning = hasCurrentPrice && hasOHLC
    
    let message = ''
    if (!hasCurrentPrice && !hasOHLC) {
      message = 'Simulator not running - no data found'
    } else if (!hasCurrentPrice) {
      message = 'Missing current_price data'
    } else if (!hasOHLC) {
      message = 'Missing OHLC data'
    } else {
      message = 'Simulator running'
    }
    
    return { isRunning, hasCurrentPrice, hasOHLC, message }
  } catch (error) {
    return { 
      isRunning: false, 
      hasCurrentPrice: false, 
      hasOHLC: false,
      message: 'Check failed: ' + (error as Error).message 
    }
  }
}

// ===================================
// REAL-TIME CLOCK COMPONENT
// ===================================
const RealtimeClock = memo(() => {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const timeStr = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  })

  const dateStr = time.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  })

  return (
    <div className="absolute top-14 left-2 z-10 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10">
      <div className="flex items-center gap-2">
        <div className="text-xs font-thin text-white">
          {timeStr} <span className="text-gray-400">|</span> {dateStr}
        </div>
      </div>
    </div>
  )
})

RealtimeClock.displayName = 'RealtimeClock'

// ===================================
// SUPPORT POPUP COMPONENT
// ===================================
const SupportPopup = memo(({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null

  const contacts = [
    {
      icon: MessageCircle,
      name: 'WhatsApp',
      value: '+62 812-3456-7890',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      hoverBg: 'hover:bg-green-500/20',
      action: () => window.open('https://wa.me/6281234567890', '_blank')
    },
    {
      icon: Send,
      name: 'Telegram',
      value: '@stc_support',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      hoverBg: 'hover:bg-blue-500/20',
      action: () => window.open('https://t.me/stc_support', '_blank')
    },
    {
      icon: Mail,
      name: 'Email',
      value: 'support@stc.com',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      hoverBg: 'hover:bg-purple-500/20',
      action: () => window.open('mailto:support@stc.com', '_blank')
    }
  ]

  return (
    <>
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      {/* Desktop positioning - left of button */}
      <div className="hidden lg:block absolute top-1/2 right-full mr-3 -translate-y-1/2 w-80 bg-[#0f1419] border border-gray-800/50 rounded-xl shadow-2xl z-50 animate-scale-in overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-gray-800/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-bold">Butuh Bantuan?</div>
              <div className="text-xs text-gray-400">Hubungi support kami</div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-2">
          {contacts.map((contact) => (
            <button
              key={contact.name}
              onClick={contact.action}
              className={`w-full ${contact.bgColor} ${contact.borderColor} border ${contact.hoverBg} rounded-lg p-3 transition-all group`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${contact.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <contact.icon className={`w-5 h-5 ${contact.color}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-white">{contact.name}</div>
                  <div className="text-xs text-gray-400">{contact.value}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        <div className="bg-[#1a1f2e] border-t border-gray-800/50 px-4 py-2.5">
          <div className="text-xs text-gray-400 text-center">
            Available 24/7 • Response time: &lt;5 minutes
          </div>
        </div>
      </div>

      {/* Mobile positioning - centered */}
      <div className="lg:hidden fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-sm bg-[#0f1419] border border-gray-800/50 rounded-xl shadow-2xl z-50 animate-scale-in overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-gray-800/50 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-bold">Butuh Bantuan?</div>
              <div className="text-xs text-gray-400">Hubungi support kami</div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 space-y-2">
          {contacts.map((contact) => (
            <button
              key={contact.name}
              onClick={contact.action}
              className={`w-full ${contact.bgColor} ${contact.borderColor} border ${contact.hoverBg} rounded-lg p-3 transition-all group`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${contact.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <contact.icon className={`w-5 h-5 ${contact.color}`} />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold text-white">{contact.name}</div>
                  <div className="text-xs text-gray-400">{contact.value}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        <div className="bg-[#1a1f2e] border-t border-gray-800/50 px-4 py-2.5">
          <div className="text-xs text-gray-400 text-center">
            Available 24/7 • Response time: &lt;5 minutes
          </div>
        </div>
      </div>
    </>
  )
})

SupportPopup.displayName = 'SupportPopup'

// ===================================
// DRAWING TOOLS COMPONENT
// ===================================
const DrawingTools = memo(({ 
  activeTool, 
  onToolChange,
  onClear 
}: { 
  activeTool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  onClear: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const tools = [
    { id: 'none' as DrawingTool, icon: ArrowUp, label: 'Select', transform: 'rotate-45' },
    { id: 'trendline' as DrawingTool, icon: LineIcon, label: 'Trend Line' },
    { id: 'horizontal' as DrawingTool, icon: Minus, label: 'Horizontal' },
    { id: 'vertical' as DrawingTool, icon: Minus, label: 'Vertical', transform: 'rotate-90' },
    { id: 'rectangle' as DrawingTool, icon: Square, label: 'Rectangle' },
    { id: 'circle' as DrawingTool, icon: Circle, label: 'Circle' },
    { id: 'text' as DrawingTool, icon: Type, label: 'Text' },
  ]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2.5 rounded-lg transition-all ${
          activeTool !== 'none'
            ? 'bg-blue-500/20 border border-blue-500/50 text-blue-400'
            : 'bg-black/20 backdrop-blur-md border border-white/10 hover:bg-black/30'
        }`}
        title="Drawing Tools"
      >
        <LineIcon className="w-5 h-5" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 bg-[#0f1419] border border-gray-800/50 rounded-lg shadow-2xl z-50 overflow-hidden min-w-[180px]">
            <div className="p-2">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    onToolChange(tool.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    activeTool === tool.id
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'hover:bg-[#1a1f2e] text-gray-300'
                  }`}
                >
                  <tool.icon className={`w-4 h-4 ${tool.transform || ''}`} />
                  <span className="text-sm font-medium">{tool.label}</span>
                </button>
              ))}
              
              {activeTool !== 'none' && (
                <>
                  <div className="h-px bg-gray-800/50 my-2" />
                  <button
                    onClick={() => {
                      onClear()
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 text-red-400 transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-sm font-medium">Clear All</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
})

DrawingTools.displayName = 'DrawingTools'

// ===================================
// OTHER COMPONENTS (SimulatorStatus, PriceDisplay, etc.)
// ===================================

const SimulatorStatus = memo(({ 
  status, 
  onRetry 
}: { 
  status: { isRunning: boolean; message: string } | null
  onRetry: () => void
}) => {
  if (!status || status.isRunning) return null
  
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/95 z-20">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Server className="w-8 h-8 text-red-400" />
        </div>
        
        <div className="text-lg font-bold text-red-400 mb-2">
          Simulator Not Running
        </div>
        
        <div className="text-sm text-gray-400 mb-1">
          {status.message}
        </div>
        
        <div className="text-xs text-gray-500 mb-6">
          Please start the data simulator to view real-time data
        </div>
        
        <button 
          onClick={onRetry}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Check Again
        </button>
      </div>
    </div>
  )
})

SimulatorStatus.displayName = 'SimulatorStatus'

const PriceDisplay = memo(({ asset, price }: { asset: any; price: any }) => {
  if (!asset || !price) return null

  const hasChange = price.change !== undefined && price.change !== 0

  return (
    <div className="absolute top-2 left-2 z-10 bg-black/20 backdrop-blur-sm rounded-lg px-4 py-2">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{asset.name}</span>
          <span className="text-xl font-bold ">{price.price.toFixed(3)}</span>
        </div>
        {hasChange && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            price.change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {price.change >= 0 ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )}
            <span>
              {price.change >= 0 ? '+' : ''}{price.change.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  )
})

PriceDisplay.displayName = 'PriceDisplay'

const OHLCDisplay = memo(({ 
  data,
  visible 
}: { 
  data: { 
    time: number
    open: number
    high: number
    low: number
    close: number
  } | null
  visible: boolean 
}) => {
  if (!visible || !data) return null

  const date = new Date(data.time * 1000)
  const timeStr = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  })

  return (
    <div className="absolute bottom-12 left-2 z-10 bg-[#0a0e17] border border-gray-800/50 rounded-lg px-3 py-2 text-xs ">
      <div className="flex items-center gap-1 text-gray-400 mb-1">
        <Clock className="w-3 h-3" />
        <span>{timeStr} WIB</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <div className="text-gray-500">O:</div>
        <div className="text-white text-right">{data.open.toFixed(3)}</div>
        <div className="text-gray-500">H:</div>
        <div className="text-green-400 text-right">{data.high.toFixed(3)}</div>
        <div className="text-gray-500">L:</div>
        <div className="text-red-400 text-right">{data.low.toFixed(3)}</div>
        <div className="text-gray-500">C:</div>
        <div className="text-blue-400 text-right">{data.close.toFixed(3)}</div>
      </div>
    </div>
  )
})

OHLCDisplay.displayName = 'OHLCDisplay'

const MobileControls = memo(({ 
  timeframe, 
  chartType, 
  isLoading,
  activeTool,
  onTimeframeChange,
  onChartTypeChange,
  onFitContent,
  onRefresh,
  onOpenIndicators,
  onToolChange,
  onClearDrawings
}: any) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d']

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="lg:hidden absolute top-24 left-2 z-10" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg hover:bg-black/50 transition-all"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-white">{timeframe}</span>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-xs text-gray-300">{chartType === 'candle' ? 'Candle' : 'Line'}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-[#0f1419] border border-gray-800/50 rounded-lg shadow-2xl overflow-hidden animate-scale-in min-w-[200px]">
          <div className="p-2 border-b border-gray-800/50">
            <div className="text-[10px] font-semibold text-gray-400 mb-1.5 px-2">Timeframe</div>
            <div className="grid grid-cols-3 gap-1">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => {
                    onTimeframeChange(tf)
                    setIsOpen(false)
                  }}
                  disabled={isLoading}
                  className={`px-2 py-1.5 text-xs font-bold rounded transition-all ${
                    timeframe === tf
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#232936]'
                  } disabled:opacity-50`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="p-2 border-b border-gray-800/50">
            <div className="text-[10px] font-semibold text-gray-400 mb-1.5 px-2">Chart Type</div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  onChartTypeChange('candle')
                  setIsOpen(false)
                }}
                disabled={isLoading}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded transition-all ${
                  chartType === 'candle'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#232936]'
                }`}
              >
                Candle
              </button>
              <button
                onClick={() => {
                  onChartTypeChange('line')
                  setIsOpen(false)
                }}
                disabled={isLoading}
                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded transition-all ${
                  chartType === 'line'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#232936]'
                }`}
              >
                Line
              </button>
            </div>
          </div>

          <div className="p-2">
            <div className="flex flex-col gap-1">
              <button
                onClick={() => {
                  onOpenIndicators()
                  setIsOpen(false)
                }}
                className="px-2 py-1.5 text-xs font-medium text-gray-300 bg-[#1a1f2e] hover:bg-[#232936] rounded transition-all flex items-center gap-2"
              >
                <Sliders className="w-3.5 h-3.5" />
                Indicators
              </button>
              <button
                onClick={() => {
                  onToolChange(activeTool === 'none' ? 'trendline' : 'none')
                  setIsOpen(false)
                }}
                className={`px-2 py-1.5 text-xs font-medium rounded transition-all flex items-center gap-2 ${
                  activeTool !== 'none'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-300 bg-[#1a1f2e] hover:bg-[#232936]'
                }`}
              >
                <LineIcon className="w-3.5 h-3.5" />
                Drawing Tools
              </button>
              {activeTool !== 'none' && (
                <button
                  onClick={() => {
                    onClearDrawings()
                    setIsOpen(false)
                  }}
                  className="px-2 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded transition-all flex items-center gap-2"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear Drawings
                </button>
              )}
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    onFitContent()
                    setIsOpen(false)
                  }}
                  className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-300 bg-[#1a1f2e] hover:bg-[#232936] rounded transition-all"
                >
                  Fit
                </button>
                <button
                  onClick={() => {
                    onRefresh()
                    setIsOpen(false)
                  }}
                  disabled={isLoading}
                  className="px-2 py-1.5 text-gray-300 bg-[#1a1f2e] hover:bg-[#232936] rounded transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

MobileControls.displayName = 'MobileControls'

const DesktopControls = memo(({ 
  timeframe, 
  chartType, 
  isLoading,
  activeTool,
  onTimeframeChange,
  onChartTypeChange,
  onFitContent,
  onRefresh,
  onToggleFullscreen,
  onOpenIndicators,
  onToolChange,
  onClearDrawings,
  isFullscreen
}: any) => {
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false)
  const timeframeRef = useRef<HTMLDivElement>(null)

  const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1d']

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeframeRef.current && !timeframeRef.current.contains(event.target as Node)) {
        setShowTimeframeMenu(false)
      }
    }

    if (showTimeframeMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTimeframeMenu])

  return (
    <div className="hidden lg:block absolute top-2 right-16 z-10">
      <div className="flex items-center gap-2">
        <div className="relative" ref={timeframeRef}>
          <button
            onClick={() => setShowTimeframeMenu(!showTimeframeMenu)}
            className="p-2.5 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg hover:bg-black/30 transition-all flex items-center gap-1.5"
            title="Timeframe"
          >
            <Clock className="w-5 h-5 text-gray-300" />
            <span className="text-xs font-bold text-white">{timeframe}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showTimeframeMenu ? 'rotate-180' : ''}`} />
          </button>

          {showTimeframeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTimeframeMenu(false)} />
              <div className="absolute top-full right-0 mt-1 bg-[#0f1419] border border-gray-800/50 rounded-lg shadow-2xl z-50 overflow-hidden min-w-[120px]">
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => {
                      onTimeframeChange(tf)
                      setShowTimeframeMenu(false)
                    }}
                    disabled={isLoading}
                    className={`w-full px-4 py-2.5 text-left text-sm font-bold transition-all ${
                      timeframe === tf
                        ? 'bg-blue-500 text-white'
                        : 'text-gray-300 hover:bg-[#1a1f2e]'
                    } disabled:opacity-50`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-1">
          <button
            onClick={() => onChartTypeChange('candle')}
            disabled={isLoading}
            className={`p-2 rounded transition-all ${
              chartType === 'candle'
                ? 'bg-blue-500/80 text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Candlestick"
          >
            <BarChart2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onChartTypeChange('line')}
            disabled={isLoading}
            className={`p-2 rounded transition-all ${
              chartType === 'line'
                ? 'bg-blue-500/80 text-white shadow-sm'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title="Line"
          >
            <Activity className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg p-1">
          <button
            onClick={onOpenIndicators}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
            title="Indicators"
          >
            <Sliders className="w-5 h-5" />
          </button>
          <DrawingTools 
            activeTool={activeTool}
            onToolChange={onToolChange}
            onClear={onClearDrawings}
          />
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onToggleFullscreen}
            className="p-2 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-colors"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
})

DesktopControls.displayName = 'DesktopControls'

const OrderTicker = memo(({ orders, currentPrice }: { orders: BinaryOrder[], currentPrice?: number }) => {
  if (orders.length === 0) return null

  return (
    <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
      <div className="flex flex-col gap-2 items-start">
        {orders.map((order) => {
          const timeLeft = calculateTimeLeft(order.exit_time || '')
          const priceDiff = currentPrice ? currentPrice - order.entry_price : 0
          const isWinning = order.direction === 'CALL' ? priceDiff > 0 : priceDiff < 0

          return (
            <div
              key={order.id}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-md border shadow-lg animate-slide-up pointer-events-auto ${
                isWinning
                  ? 'bg-green-500/20 border-green-500/50'
                  : 'bg-red-500/20 border-red-500/50'
              }`}
            >
              {order.direction === 'CALL' ? (
                <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />
              )}

              <div className="text-xs">
                <div className="font-semibold leading-tight">{order.asset_name}</div>
                <div className="text-gray-300  text-[10px]">{order.entry_price.toFixed(3)}</div>
              </div>

              <div className="w-px h-6 bg-white/10"></div>

              <div className="text-xs">
                <div className={`font-bold leading-tight ${isWinning ? 'text-green-400' : 'text-red-400'}`}>
                  {isWinning ? 'WIN' : 'LOSE'}
                </div>
                <div className="text-gray-300  text-[10px]">{timeLeft}</div>
              </div>

              <div className="w-px h-6 bg-white/10"></div>

              <div className="text-xs text-right">
                <div className="text-gray-400 text-[10px] leading-tight">Amount</div>
                <div className="font-bold  leading-tight">{formatCurrency(order.amount)}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

OrderTicker.displayName = 'OrderTicker'

const TradingChart = memo(({ activeOrders = [], currentPrice }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  
  const indicatorSeriesRefs = useRef<{
    sma?: ISeriesApi<"Line">
    ema?: ISeriesApi<"Line">
    bollingerUpper?: ISeriesApi<"Line">
    bollingerMiddle?: ISeriesApi<"Line">
    bollingerLower?: ISeriesApi<"Line">
    rsi?: ISeriesApi<"Line">
    macd?: ISeriesApi<"Line">
    macdSignal?: ISeriesApi<"Line">
    macdHistogram?: ISeriesApi<"Histogram">
    volume?: ISeriesApi<"Histogram">
    volumeMA?: ISeriesApi<"Line">
    stochasticK?: ISeriesApi<"Line">
    stochasticD?: ISeriesApi<"Line">
    atr?: ISeriesApi<"Line">
  }>({})

  const drawingSeriesRef = useRef<ISeriesApi<"Line">[]>([])
  
  const unsubscribeOHLCRef = useRef<(() => void) | null>(null)
  const unsubscribePriceRef = useRef<(() => void) | null>(null)
  
  const mountedRef = useRef(false)
  const currentDataRef = useRef<any[]>([])
  
  const { selectedAsset } = useTradingStore()

  const [chartType, setChartType] = useState<ChartType>('candle')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [openingPrice, setOpeningPrice] = useState<number | null>(null)
  const [simulatorStatus, setSimulatorStatus] = useState<{
    isRunning: boolean
    hasCurrentPrice: boolean
    hasOHLC: boolean
    message: string
  } | null>(null)
  
  const [showIndicators, setShowIndicators] = useState(false)
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>(DEFAULT_INDICATOR_CONFIG)
  
  const [ohlcData, setOhlcData] = useState<{
    time: number
    open: number
    high: number
    low: number
    close: number
  } | null>(null)
  const [showOhlc, setShowOhlc] = useState(false)

  const [showSupportPopup, setShowSupportPopup] = useState(false)
  const [activeTool, setActiveTool] = useState<DrawingTool>('none')
  const [drawings, setDrawings] = useState<DrawingObject[]>([])
  const [currentDrawing, setCurrentDrawing] = useState<DrawingObject | null>(null)

  const checkSimulator = useCallback(async () => {
    if (!selectedAsset?.realtimeDbPath) return
    
    const status = await checkSimulatorStatus(selectedAsset.realtimeDbPath)
    setSimulatorStatus(status)
    
    if (!status.isRunning) {
      console.error('Simulator not running:', status.message)
    }
  }, [selectedAsset?.realtimeDbPath])

  const renderIndicators = useCallback(() => {
    if (!chartRef.current || currentDataRef.current.length === 0) return

    const data = currentDataRef.current

    Object.values(indicatorSeriesRefs.current).forEach(series => {
      if (series) {
        try {
          chartRef.current?.removeSeries(series)
        } catch (e) {}
      }
    })
    indicatorSeriesRefs.current = {}

    if (indicatorConfig.sma?.enabled && indicatorConfig.sma.period) {
      try {
        const { calculateSMA } = require('@/lib/indicators')
        const smaData = calculateSMA(data, indicatorConfig.sma.period)
        const smaSeries = chartRef.current.addLineSeries({
          color: indicatorConfig.sma.color,
          lineWidth: 2,
          title: `SMA(${indicatorConfig.sma.period})`,
          priceLineVisible: false,
          lastValueVisible: false
        })
        smaSeries.setData(smaData.map((d: any) => ({ time: d.time as UTCTimestamp, value: d.value })))
        indicatorSeriesRefs.current.sma = smaSeries
      } catch (e) {
        console.error('SMA error:', e)
      }
    }

    if (indicatorConfig.ema?.enabled && indicatorConfig.ema.period) {
      try {
        const { calculateEMA } = require('@/lib/indicators')
        const emaData = calculateEMA(data, indicatorConfig.ema.period)
        const emaSeries = chartRef.current.addLineSeries({
          color: indicatorConfig.ema.color,
          lineWidth: 2,
          title: `EMA(${indicatorConfig.ema.period})`,
          priceLineVisible: false,
          lastValueVisible: false
        })
        emaSeries.setData(emaData.map((d: any) => ({ time: d.time as UTCTimestamp, value: d.value })))
        indicatorSeriesRefs.current.ema = emaSeries
      } catch (e) {
        console.error('EMA error:', e)
      }
    }

    if (indicatorConfig.bollinger?.enabled && indicatorConfig.bollinger.period) {
      try {
        const { calculateBollingerBands } = require('@/lib/indicators')
        const bbData = calculateBollingerBands(data, indicatorConfig.bollinger.period, indicatorConfig.bollinger.stdDev)
        
        const upperSeries = chartRef.current.addLineSeries({
          color: indicatorConfig.bollinger.colorUpper,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: `BB Upper`,
          priceLineVisible: false,
          lastValueVisible: false
        })
        upperSeries.setData(bbData.map((d: any) => ({ time: d.time as UTCTimestamp, value: d.upper })))
        
        const middleSeries = chartRef.current.addLineSeries({
          color: indicatorConfig.bollinger.colorMiddle,
          lineWidth: 1,
          title: `BB Middle`,
          priceLineVisible: false,
          lastValueVisible: false
        })
        middleSeries.setData(bbData.map((d: any) => ({ time: d.time as UTCTimestamp, value: d.middle })))
        
        const lowerSeries = chartRef.current.addLineSeries({
          color: indicatorConfig.bollinger.colorLower,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          title: `BB Lower`,
          priceLineVisible: false,
          lastValueVisible: false
        })
        lowerSeries.setData(bbData.map((d: any) => ({ time: d.time as UTCTimestamp, value: d.lower })))
        
        indicatorSeriesRefs.current.bollingerUpper = upperSeries
        indicatorSeriesRefs.current.bollingerMiddle = middleSeries
        indicatorSeriesRefs.current.bollingerLower = lowerSeries
      } catch (e) {
        console.error('Bollinger Bands error:', e)
      }
    }

    if (indicatorConfig.volume?.enabled && data.some((d: any) => d.volume)) {
      try {
        const volumeSeries = chartRef.current.addHistogramSeries({
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: 'volume',
        })
        volumeSeries.priceScale().applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        })
        volumeSeries.setData(data.map((d: any) => ({
          time: d.time as UTCTimestamp,
          value: d.volume || 0,
          color: d.close >= d.open ? '#26a69a' : '#ef5350'
        })))
        indicatorSeriesRefs.current.volume = volumeSeries

        if (indicatorConfig.volume.maPeriod) {
          const { calculateVolumeMA } = require('@/lib/indicators')
          const volumeMAData = calculateVolumeMA(data, indicatorConfig.volume.maPeriod)
          const volumeMASeries = chartRef.current.addLineSeries({
            color: '#2962FF',
            lineWidth: 1,
            priceScaleId: 'volume',
            priceLineVisible: false,
            lastValueVisible: false
          })
          volumeMASeries.setData(volumeMAData.map((d: any) => ({ time: d.time as UTCTimestamp, value: d.value })))
          indicatorSeriesRefs.current.volumeMA = volumeMASeries
        }
      } catch (e) {
        console.error('Volume error:', e)
      }
    }

  }, [indicatorConfig])

  const clearDrawings = useCallback(() => {
    drawingSeriesRef.current.forEach(series => {
      try {
        chartRef.current?.removeSeries(series)
      } catch (e) {}
    })
    drawingSeriesRef.current = []
    setDrawings([])
    setCurrentDrawing(null)
  }, [])

  const renderDrawings = useCallback(() => {
    if (!chartRef.current) return

    drawingSeriesRef.current.forEach(series => {
      try {
        chartRef.current?.removeSeries(series)
      } catch (e) {}
    })
    drawingSeriesRef.current = []

    drawings.forEach(drawing => {
      if (drawing.type === 'trendline' || drawing.type === 'horizontal' || drawing.type === 'vertical') {
        if (drawing.points.length >= 2) {
          const series = chartRef.current!.addLineSeries({
            color: drawing.color,
            lineWidth: 2 as LineWidth,
            priceLineVisible: false,
            lastValueVisible: false
          })
          
          const data = drawing.points.map(p => ({
            time: p.time as UTCTimestamp,
            value: p.price
          }))
          
          series.setData(data)
          drawingSeriesRef.current.push(series)
        }
      }
    })
  }, [drawings])

  useEffect(() => {
    if (isInitialized && currentDataRef.current.length > 0) {
      renderIndicators()
      renderDrawings()
    }
  }, [indicatorConfig, isInitialized, renderIndicators, renderDrawings])

  const toggleFullscreen = useCallback(async () => {
    const container = fullscreenContainerRef.current
    if (!container) return

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    if (mountedRef.current) return
    
    const container = chartContainerRef.current
    if (!container) return

    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) return

    mountedRef.current = true

    try {
      const chart = createChart(container, {
        width,
        height,
        layout: {
          background: { type: ColorType.Solid, color: '#0a0e17' },
          textColor: '#9ca3af',
        },
        grid: {
          vertLines: { 
            color: 'rgba(255, 255, 255, 0.08)',
            style: 0,
            visible: true
          },
          horzLines: { 
            color: 'rgba(255, 255, 255, 0.08)',
            style: 0,
            visible: true
          },
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
        localization: {
          locale: 'id-ID',
          dateFormat: 'dd/MM/yyyy',
          timeFormatter: (time: number) => {
            return new Date(time * 1000).toLocaleTimeString('id-ID', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
              timeZone: 'Asia/Jakarta'
            })
          }
        },
      })

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
        visible: chartType === 'candle',
      })

      const lineSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        visible: chartType === 'line',
      })

      chart.subscribeCrosshairMove((param) => {
        if (!param || !param.point || !param.time) {
          setShowOhlc(false)
          return
        }

        const data = candleSeries.dataByIndex(Math.round(param.logical as number))
        if (data && 'open' in data) {
          setOhlcData({
            time: param.time as number,
            open: data.open,
            high: data.high,
            low: data.low,
            close: data.close
          })
          setShowOhlc(true)
        } else {
          setShowOhlc(false)
        }
      })

      chartRef.current = chart
      candleSeriesRef.current = candleSeries
      lineSeriesRef.current = lineSeries

      setIsInitialized(true)

      const handleResize = () => {
        if (container && chart) {
          const { width, height } = container.getBoundingClientRect()
          if (width > 0 && height > 0) {
            chart.applyOptions({ width, height })
          }
        }
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        
        if (unsubscribeOHLCRef.current) {
          unsubscribeOHLCRef.current()
        }
        if (unsubscribePriceRef.current) {
          unsubscribePriceRef.current()
        }
        
        mountedRef.current = false
        setIsInitialized(false)
        
        try {
          chart.remove()
        } catch (e) {}
      }
    } catch (err: any) {
      console.error('Chart init error:', err)
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!candleSeriesRef.current || !lineSeriesRef.current) return

    if (chartType === 'candle') {
      candleSeriesRef.current.applyOptions({ visible: true })
      lineSeriesRef.current.applyOptions({ visible: false })
    } else {
      candleSeriesRef.current.applyOptions({ visible: false })
      lineSeriesRef.current.applyOptions({ visible: true })
    }
  }, [chartType])

  useEffect(() => {
    if (!selectedAsset || !isInitialized || !candleSeriesRef.current || !lineSeriesRef.current) {
      return
    }

    let isCancelled = false

    const loadChartData = async () => {
      setIsLoading(true)
      setOpeningPrice(null)
      setLastPrice(null)

      await checkSimulator()

      if (unsubscribeOHLCRef.current) {
        unsubscribeOHLCRef.current()
        unsubscribeOHLCRef.current = null
      }
      
      if (unsubscribePriceRef.current) {
        unsubscribePriceRef.current()
        unsubscribePriceRef.current = null
      }

      try {
        let assetPath = selectedAsset.realtimeDbPath || `/${selectedAsset.symbol.toLowerCase()}`
        assetPath = cleanAssetPath(assetPath)

        const data = await fetchHistoricalData(assetPath, timeframe)

        if (isCancelled) return

        if (!data || data.length === 0) {
          setIsLoading(false)
          return
        }

        currentDataRef.current = data.map((bar: any) => ({
          time: bar.timestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
          volume: bar.volume
        }))

        const candleData = data.map((bar: any) => ({
          time: bar.timestamp as UTCTimestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        }))

        const lineData = data.map((bar: any) => ({
          time: bar.timestamp as UTCTimestamp,
          value: bar.close,
        }))

        if (isCancelled) return

        if (candleSeriesRef.current && lineSeriesRef.current) {
          candleSeriesRef.current.setData(candleData)
          lineSeriesRef.current.setData(lineData)

          if (chartRef.current) {
            chartRef.current.timeScale().fitContent()
          }

          if (data.length > 0) {
            setOpeningPrice(data[0].open)
            setLastPrice(data[data.length - 1].close)
          }
        }

        renderIndicators()

        setIsLoading(false)

        unsubscribeOHLCRef.current = subscribeToOHLCUpdates(assetPath, timeframe, (newBar) => {
          if (isCancelled || !candleSeriesRef.current || !lineSeriesRef.current) return

          try {
            const candleUpdate = {
              time: newBar.timestamp as UTCTimestamp,
              open: newBar.open,
              high: newBar.high,
              low: newBar.low,
              close: newBar.close,
            }

            const lineUpdate = {
              time: newBar.timestamp as UTCTimestamp,
              value: newBar.close,
            }

            if (newBar.isNewBar) {
              candleSeriesRef.current.update(candleUpdate)
              lineSeriesRef.current.update(lineUpdate)
            } else {
              const existingData = candleSeriesRef.current.data()
              if (existingData.length > 0) {
                const updatedData = [...existingData.slice(0, -1), candleUpdate]
                candleSeriesRef.current.setData(updatedData as any)
                
                const lineExisting = lineSeriesRef.current.data()
                const updatedLine = [...lineExisting.slice(0, -1), lineUpdate]
                lineSeriesRef.current.setData(updatedLine as any)
              }
            }

            const existingIndex = currentDataRef.current.findIndex(d => d.time === newBar.timestamp)
            const newData = {
              time: newBar.timestamp,
              open: newBar.open,
              high: newBar.high,
              low: newBar.low,
              close: newBar.close,
              volume: newBar.volume
            }

            if (existingIndex >= 0) {
              currentDataRef.current[existingIndex] = newData
            } else {
              currentDataRef.current.push(newData)
              if (currentDataRef.current.length > 1000) {
                currentDataRef.current.shift()
              }
            }

            setLastPrice(newBar.close)

            if (newBar.isNewBar) {
              renderIndicators()
            }
          } catch (error) {
            console.error('Chart update error:', error)
          }
        })

      } catch (err: any) {
        if (isCancelled) return
        console.error('Error loading data:', err)
        setIsLoading(false)
      }
    }

    loadChartData()

    return () => {
      isCancelled = true
      if (unsubscribeOHLCRef.current) {
        unsubscribeOHLCRef.current()
      }
      if (unsubscribePriceRef.current) {
        unsubscribePriceRef.current()
      }
    }
  }, [selectedAsset?.id, timeframe, isInitialized, checkSimulator, renderIndicators])

  useEffect(() => {
    if (currentPrice && isInitialized) {
      setLastPrice(currentPrice)
    }
  }, [currentPrice, isInitialized])

  const handleRefresh = useCallback(() => {
    if (!selectedAsset) return
    checkSimulator()
    
    const currentAsset = selectedAsset
    useTradingStore.setState({ selectedAsset: null })
    setTimeout(() => {
      useTradingStore.setState({ selectedAsset: currentAsset })
    }, 100)
  }, [selectedAsset, checkSimulator])

  const handleFitContent = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }, [])

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setTimeframe(tf)
  }, [])

  const handleChartTypeChange = useCallback((type: ChartType) => {
    setChartType(type)
  }, [])

  const calculatePriceChange = useCallback(() => {
    if (!lastPrice || !openingPrice || openingPrice === 0) return 0
    return ((lastPrice - openingPrice) / openingPrice) * 100
  }, [lastPrice, openingPrice])

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

  const currentPriceData = {
    price: lastPrice || 0,
    change: calculatePriceChange(),
    datetime: new Date().toISOString()
  }

  return (
    <div 
      ref={fullscreenContainerRef}
      className={`relative h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-[#0a0e17]' : ''}`}
    >
      <PriceDisplay asset={selectedAsset} price={currentPriceData} />
      <RealtimeClock />

      <DesktopControls
        timeframe={timeframe}
        chartType={chartType}
        isLoading={isLoading}
        activeTool={activeTool}
        onTimeframeChange={handleTimeframeChange}
        onChartTypeChange={handleChartTypeChange}
        onFitContent={handleFitContent}
        onRefresh={handleRefresh}
        onToggleFullscreen={toggleFullscreen}
        onOpenIndicators={() => setShowIndicators(true)}
        onToolChange={setActiveTool}
        onClearDrawings={clearDrawings}
        isFullscreen={isFullscreen}
      />

      <MobileControls
        timeframe={timeframe}
        chartType={chartType}
        isLoading={isLoading}
        activeTool={activeTool}
        onTimeframeChange={handleTimeframeChange}
        onChartTypeChange={handleChartTypeChange}
        onFitContent={handleFitContent}
        onRefresh={handleRefresh}
        onOpenIndicators={() => setShowIndicators(true)}
        onToolChange={setActiveTool}
        onClearDrawings={clearDrawings}
      />

      <SimulatorStatus 
        status={simulatorStatus} 
        onRetry={checkSimulator}
      />

      <OHLCDisplay data={ohlcData} visible={showOhlc} />

      <div 
        ref={chartContainerRef} 
        className="absolute inset-0 bg-[#0a0e17]"
      />

      <OrderTicker orders={activeOrders} currentPrice={currentPrice} />

      {/* Support Button - Positioned to not block price or orders */}
      <div className="absolute right-14 bottom-4 -translate-y-1/2 z-20">
        <button
          onClick={() => setShowSupportPopup(!showSupportPopup)}
          className="w-11 h-11 bg-gradient-to-br from-red-400 to-red-400 hover:from-pink-400 hover:to-red-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
          title="Need Help?"
        >
          <HelpCircle className="w-7 h-7 text-white group-hover:rotate-12 transition-transform" />
        </button>

        <SupportPopup 
          isOpen={showSupportPopup}
          onClose={() => setShowSupportPopup(false)}
        />
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-[#0a0e17]/95 z-20">
          <div className="h-full flex flex-col items-center justify-center p-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
            <div className="text-sm text-gray-400">
              Loading {timeframe} chart data...
            </div>
          </div>
        </div>
      )}

      <IndicatorControls
        isOpen={showIndicators}
        onClose={() => setShowIndicators(false)}
        config={indicatorConfig}
        onChange={setIndicatorConfig}
      />

      <style jsx>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
})

TradingChart.displayName = 'TradingChart'

export default TradingChart