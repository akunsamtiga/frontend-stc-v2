// components/IndicatorControls.tsx - Enhanced with 25+ Indicators (Phosphor Icons)
'use client'

import { useState, memo } from 'react'
import { 
  TrendUp, 
  Activity, 
  ChartLine, 
  Waves,
  X,
  Sliders,
  Target,
  Compass,
  Wind,
  TrendDown,
  Stack,
  CircleDashed,
  GridFour,
  Lightning,
  ChartLineUp,
  ArrowsOutLineVertical,
  Drop,
  ChartBar,
  ArrowFatLinesUp,
  Spiral,
  PushPin,
  Database
} from 'phosphor-react'

export interface IndicatorConfig {
  // Overlay Indicators
  sma?: { enabled: boolean; period: number; color: string }
  ema?: { enabled: boolean; period: number; color: string }
  wma?: { enabled: boolean; period: number; color: string }
  bollinger?: { enabled: boolean; period: number; stdDev: number; colorUpper: string; colorMiddle: string; colorLower: string }
  keltner?: { enabled: boolean; emaPeriod: number; atrPeriod: number; multiplier: number }
  donchian?: { enabled: boolean; period: number }
  ichimoku?: { enabled: boolean; tenkanPeriod: number; kijunPeriod: number; senkouBPeriod: number }
  vwap?: { enabled: boolean; color: string }
  parabolicSar?: { enabled: boolean; accelerationFactor: number; maxAF: number }
  supertrend?: { enabled: boolean; period: number; multiplier: number }
  
  // Oscillator Indicators
  rsi?: { enabled: boolean; period: number; overbought: number; oversold: number }
  macd?: { enabled: boolean; fastPeriod: number; slowPeriod: number; signalPeriod: number }
  stochastic?: { enabled: boolean; kPeriod: number; dPeriod: number; overbought: number; oversold: number }
  atr?: { enabled: boolean; period: number }
  adx?: { enabled: boolean; period: number }
  cci?: { enabled: boolean; period: number }
  williamsR?: { enabled: boolean; period: number }
  mfi?: { enabled: boolean; period: number }
  aroon?: { enabled: boolean; period: number }
  trix?: { enabled: boolean; period: number }
  obv?: { enabled: boolean }
  elderRay?: { enabled: boolean; period: number }
}

interface IndicatorControlsProps {
  isOpen: boolean
  onClose: () => void
  config: IndicatorConfig
  onChange: (config: IndicatorConfig) => void
}

const IndicatorControls = memo(({ isOpen, onClose, config, onChange }: IndicatorControlsProps) => {
  const [activeTab, setActiveTab] = useState<'overlay' | 'oscillator'>('overlay')
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  if (!isOpen) return null

  const updateConfig = (indicator: keyof IndicatorConfig, updates: any) => {
    onChange({
      ...config,
      [indicator]: {
        ...config[indicator],
        ...updates
      }
    })
  }

  const toggleIndicator = (indicator: keyof IndicatorConfig) => {
    updateConfig(indicator, {
      enabled: !config[indicator]?.enabled
    })
  }

  const IndicatorRow = ({ 
    icon: Icon, 
    name, 
    indicator, 
    description,
    children,
    tags = []
  }: { 
    icon: any
    name: string
    indicator: keyof IndicatorConfig
    description: string
    children?: React.ReactNode
    tags?: string[]
  }) => {
    const isEnabled = config[indicator]?.enabled || false
    const isExpanded = expandedIndicator === indicator

    // Filter by search
    if (searchQuery && !name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return null
    }

    return (
      <div className="border-b border-gray-800/50 last:border-0">
        <div className="flex items-center justify-between p-3 hover:bg-[#232936] transition-colors">
          <div className="flex items-center gap-3 flex-1">
            <Icon 
              size={18} 
              weight={isEnabled ? "duotone" : "regular"}
              className={`flex-shrink-0 ${isEnabled ? 'text-blue-400' : 'text-gray-500'}`} 
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{name}</div>
              <div className="text-xs text-gray-500 truncate">{description}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {children && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedIndicator(isExpanded ? null : indicator)
                }}
                className="p-1 hover:bg-[#2a3142] rounded transition-colors"
              >
                <Sliders 
                  size={16} 
                  weight="regular"
                  className={`text-gray-400 ${isExpanded ? 'rotate-90' : ''} transition-transform`} 
                />
              </button>
            )}
            <button
              onClick={() => toggleIndicator(indicator)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isEnabled ? 'bg-blue-500' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
        
        {isExpanded && children && (
          <div className="px-3 pb-3 bg-[#1a1f2e] space-y-3">
            {children}
          </div>
        )}
      </div>
    )
  }

  const enabledCount = Object.values(config).filter(c => c?.enabled).length

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-[#0f1419] border-l border-gray-800/50 z-50 flex flex-col animate-slide-left overflow-hidden">
        {/* Header */}
        <div className="bg-[#1a1f2e] border-b border-gray-800/50 flex-shrink-0">
          <div className="h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Activity size={20} weight="duotone" className="text-blue-400" />
              <h3 className="font-bold text-lg">Indikator Teknikal</h3>
              {enabledCount > 0 && (
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                  {enabledCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-[#232936] rounded-lg transition-colors"
            >
              <X size={20} weight="regular" />
            </button>
          </div>
          
          {/* Search */}
          <div className="px-4 pb-3">
            <input
              type="text"
              placeholder="Cari indikator..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0f1419] border border-gray-800/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#1a1f2e] border-b border-gray-800/50 flex flex-shrink-0">
          <button
            onClick={() => setActiveTab('overlay')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'overlay' 
                ? 'text-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Overlay (10)
            {activeTab === 'overlay' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('oscillator')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'oscillator' 
                ? 'text-blue-400' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Osilator (12)
            {activeTab === 'oscillator' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'overlay' ? (
            <div>
              {/* SMA */}
              <IndicatorRow
                icon={TrendUp}
                name="SMA"
                indicator="sma"
                description="Simple Moving Average"
                tags={["moving average", "trend"]}
              >
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                    <input
                      type="number"
                      value={config.sma?.period || 20}
                      onChange={(e) => updateConfig('sma', { period: parseInt(e.target.value) })}
                      className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                      min="2"
                      max="200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Warna</label>
                    <input
                      type="color"
                      value={config.sma?.color || '#3b82f6'}
                      onChange={(e) => updateConfig('sma', { color: e.target.value })}
                      className="w-full h-10 bg-[#0f1419] border border-gray-800/50 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </IndicatorRow>

              {/* EMA */}
              <IndicatorRow
                icon={ChartLineUp}
                name="EMA"
                indicator="ema"
                description="Exponential Moving Average"
                tags={["moving average", "trend"]}
              >
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                    <input
                      type="number"
                      value={config.ema?.period || 20}
                      onChange={(e) => updateConfig('ema', { period: parseInt(e.target.value) })}
                      className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                      min="2"
                      max="200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Warna</label>
                    <input
                      type="color"
                      value={config.ema?.color || '#f59e0b'}
                      onChange={(e) => updateConfig('ema', { color: e.target.value })}
                      className="w-full h-10 bg-[#0f1419] border border-gray-800/50 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </IndicatorRow>

              {/* WMA */}
              <IndicatorRow
                icon={ChartLine}
                name="WMA"
                indicator="wma"
                description="Weighted Moving Average"
                tags={["moving average", "trend"]}
              >
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                    <input
                      type="number"
                      value={config.wma?.period || 20}
                      onChange={(e) => updateConfig('wma', { period: parseInt(e.target.value) })}
                      className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                      min="2"
                      max="200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Warna</label>
                    <input
                      type="color"
                      value={config.wma?.color || '#8b5cf6'}
                      onChange={(e) => updateConfig('wma', { color: e.target.value })}
                      className="w-full h-10 bg-[#0f1419] border border-gray-800/50 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </IndicatorRow>

              {/* Bollinger Bands */}
              <IndicatorRow
                icon={Stack}
                name="Bollinger Bands"
                indicator="bollinger"
                description="Volatility bands"
                tags={["volatility", "bands"]}
              >
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                      <input
                        type="number"
                        value={config.bollinger?.period || 20}
                        onChange={(e) => updateConfig('bollinger', { period: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="2"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Std Dev</label>
                      <input
                        type="number"
                        value={config.bollinger?.stdDev || 2}
                        onChange={(e) => updateConfig('bollinger', { stdDev: parseFloat(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="0.5"
                        max="5"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              </IndicatorRow>

              {/* Keltner Channels */}
              <IndicatorRow
                icon={ArrowsOutLineVertical}
                name="Keltner Channels"
                indicator="keltner"
                description="ATR-based volatility bands"
                tags={["volatility", "atr", "channels"]}
              >
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">EMA</label>
                      <input
                        type="number"
                        value={config.keltner?.emaPeriod || 20}
                        onChange={(e) => updateConfig('keltner', { emaPeriod: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="2"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">ATR</label>
                      <input
                        type="number"
                        value={config.keltner?.atrPeriod || 10}
                        onChange={(e) => updateConfig('keltner', { atrPeriod: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="2"
                        max="50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Multi</label>
                      <input
                        type="number"
                        value={config.keltner?.multiplier || 2}
                        onChange={(e) => updateConfig('keltner', { multiplier: parseFloat(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="0.5"
                        max="5"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              </IndicatorRow>

              {/* Donchian Channels */}
              <IndicatorRow
                icon={GridFour}
                name="Donchian Channels"
                indicator="donchian"
                description="Price breakout indicator"
                tags={["breakout", "channels"]}
              >
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                  <input
                    type="number"
                    value={config.donchian?.period || 20}
                    onChange={(e) => updateConfig('donchian', { period: parseInt(e.target.value) })}
                    className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                    min="2"
                    max="100"
                  />
                </div>
              </IndicatorRow>

              {/* Ichimoku Cloud */}
              <IndicatorRow
                icon={Stack}
                name="Ichimoku Cloud"
                indicator="ichimoku"
                description="Comprehensive trend system"
                tags={["trend", "cloud", "support", "resistance"]}
              >
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Tenkan</label>
                      <input
                        type="number"
                        value={config.ichimoku?.tenkanPeriod || 9}
                        onChange={(e) => updateConfig('ichimoku', { tenkanPeriod: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="2"
                        max="50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Kijun</label>
                      <input
                        type="number"
                        value={config.ichimoku?.kijunPeriod || 26}
                        onChange={(e) => updateConfig('ichimoku', { kijunPeriod: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="2"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Senkou</label>
                      <input
                        type="number"
                        value={config.ichimoku?.senkouBPeriod || 52}
                        onChange={(e) => updateConfig('ichimoku', { senkouBPeriod: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="2"
                        max="100"
                      />
                    </div>
                  </div>
                </div>
              </IndicatorRow>

              {/* VWAP */}
              <IndicatorRow
                icon={ChartBar}
                name="VWAP"
                indicator="vwap"
                description="Volume Weighted Average Price"
                tags={["volume", "average"]}
              >
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Warna</label>
                  <input
                    type="color"
                    value={config.vwap?.color || '#ec4899'}
                    onChange={(e) => updateConfig('vwap', { color: e.target.value })}
                    className="w-full h-10 bg-[#0f1419] border border-gray-800/50 rounded cursor-pointer"
                  />
                </div>
              </IndicatorRow>

              {/* Parabolic SAR */}
              <IndicatorRow
                icon={CircleDashed}
                name="Parabolic SAR"
                indicator="parabolicSar"
                description="Stop and Reverse points"
                tags={["stop", "reverse", "trend"]}
              >
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">AF</label>
                      <input
                        type="number"
                        value={config.parabolicSar?.accelerationFactor || 0.02}
                        onChange={(e) => updateConfig('parabolicSar', { accelerationFactor: parseFloat(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="0.01"
                        max="0.1"
                        step="0.01"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Max AF</label>
                      <input
                        type="number"
                        value={config.parabolicSar?.maxAF || 0.2}
                        onChange={(e) => updateConfig('parabolicSar', { maxAF: parseFloat(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="0.1"
                        max="0.5"
                        step="0.05"
                      />
                    </div>
                  </div>
                </div>
              </IndicatorRow>

              {/* Supertrend */}
              <IndicatorRow
                icon={Lightning}
                name="Supertrend"
                indicator="supertrend"
                description="Trend following indicator"
                tags={["trend", "atr"]}
              >
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                      <input
                        type="number"
                        value={config.supertrend?.period || 10}
                        onChange={(e) => updateConfig('supertrend', { period: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="2"
                        max="50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Multiplier</label>
                      <input
                        type="number"
                        value={config.supertrend?.multiplier || 3}
                        onChange={(e) => updateConfig('supertrend', { multiplier: parseFloat(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="0.5"
                        max="10"
                        step="0.5"
                      />
                    </div>
                  </div>
                </div>
              </IndicatorRow>
            </div>
          ) : (
            <div>
              {/* RSI */}
              <IndicatorRow
                icon={Activity}
                name="RSI"
                indicator="rsi"
                description="Relative Strength Index"
                tags={["momentum", "overbought", "oversold"]}
              >
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                    <input
                      type="number"
                      value={config.rsi?.period || 14}
                      onChange={(e) => updateConfig('rsi', { period: parseInt(e.target.value) })}
                      className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                      min="2"
                      max="100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Overbought</label>
                      <input
                        type="number"
                        value={config.rsi?.overbought || 70}
                        onChange={(e) => updateConfig('rsi', { overbought: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="50"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Oversold</label>
                      <input
                        type="number"
                        value={config.rsi?.oversold || 30}
                        onChange={(e) => updateConfig('rsi', { oversold: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="0"
                        max="50"
                      />
                    </div>
                  </div>
                </div>
              </IndicatorRow>

              {/* MACD */}
              <IndicatorRow
                icon={TrendUp}
                name="MACD"
                indicator="macd"
                description="Moving Average Convergence Divergence"
                tags={["trend", "momentum"]}
              >
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Cepat</label>
                      <input
                        type="number"
                        value={config.macd?.fastPeriod || 12}
                        onChange={(e) => updateConfig('macd', { fastPeriod: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="2"
                        max="50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Lambat</label>
                      <input
                        type="number"
                        value={config.macd?.slowPeriod || 26}
                        onChange={(e) => updateConfig('macd', { slowPeriod: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="2"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Sinyal</label>
                      <input
                        type="number"
                        value={config.macd?.signalPeriod || 9}
                        onChange={(e) => updateConfig('macd', { signalPeriod: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="2"
                        max="50"
                      />
                    </div>
                  </div>
                </div>
              </IndicatorRow>

              {/* Stochastic */}
              <IndicatorRow
                icon={Waves}
                name="Stochastic"
                indicator="stochastic"
                description="Momentum oscillator"
                tags={["momentum", "overbought", "oversold"]}
              >
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">%K</label>
                      <input
                        type="number"
                        value={config.stochastic?.kPeriod || 14}
                        onChange={(e) => updateConfig('stochastic', { kPeriod: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="2"
                        max="50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">%D</label>
                      <input
                        type="number"
                        value={config.stochastic?.dPeriod || 3}
                        onChange={(e) => updateConfig('stochastic', { dPeriod: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="2"
                        max="20"
                      />
                    </div>
                  </div>
                </div>
              </IndicatorRow>

              {/* ATR */}
              <IndicatorRow
                icon={ChartBar}
                name="ATR"
                indicator="atr"
                description="Average True Range (Volatility)"
                tags={["volatility", "range"]}
              >
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                  <input
                    type="number"
                    value={config.atr?.period || 14}
                    onChange={(e) => updateConfig('atr', { period: parseInt(e.target.value) })}
                    className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                    min="2"
                    max="100"
                  />
                </div>
              </IndicatorRow>

              {/* ADX */}
              <IndicatorRow
                icon={Compass}
                name="ADX"
                indicator="adx"
                description="Average Directional Index (Trend Strength)"
                tags={["trend", "strength", "direction"]}
              >
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                  <input
                    type="number"
                    value={config.adx?.period || 14}
                    onChange={(e) => updateConfig('adx', { period: parseInt(e.target.value) })}
                    className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                    min="2"
                    max="100"
                  />
                </div>
              </IndicatorRow>

              {/* CCI */}
              <IndicatorRow
                icon={Target}
                name="CCI"
                indicator="cci"
                description="Commodity Channel Index"
                tags={["momentum", "divergence"]}
              >
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                  <input
                    type="number"
                    value={config.cci?.period || 20}
                    onChange={(e) => updateConfig('cci', { period: parseInt(e.target.value) })}
                    className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                    min="2"
                    max="100"
                  />
                </div>
              </IndicatorRow>

              {/* Williams %R */}
              <IndicatorRow
                icon={TrendDown}
                name="Williams %R"
                indicator="williamsR"
                description="Momentum indicator"
                tags={["momentum", "overbought", "oversold"]}
              >
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                  <input
                    type="number"
                    value={config.williamsR?.period || 14}
                    onChange={(e) => updateConfig('williamsR', { period: parseInt(e.target.value) })}
                    className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                    min="2"
                    max="100"
                  />
                </div>
              </IndicatorRow>

              {/* MFI */}
              <IndicatorRow
                icon={Drop}
                name="MFI"
                indicator="mfi"
                description="Money Flow Index (Volume RSI)"
                tags={["volume", "momentum", "money flow"]}
              >
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                  <input
                    type="number"
                    value={config.mfi?.period || 14}
                    onChange={(e) => updateConfig('mfi', { period: parseInt(e.target.value) })}
                    className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                    min="2"
                    max="100"
                  />
                </div>
              </IndicatorRow>

              {/* Aroon */}
              <IndicatorRow
                icon={Wind}
                name="Aroon"
                indicator="aroon"
                description="Trend identification indicator"
                tags={["trend", "identification"]}
              >
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                  <input
                    type="number"
                    value={config.aroon?.period || 25}
                    onChange={(e) => updateConfig('aroon', { period: parseInt(e.target.value) })}
                    className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                    min="2"
                    max="100"
                  />
                </div>
              </IndicatorRow>

              {/* TRIX */}
              <IndicatorRow
                icon={Spiral}
                name="TRIX"
                indicator="trix"
                description="Triple Exponential Average"
                tags={["trend", "momentum"]}
              >
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Periode</label>
                  <input
                    type="number"
                    value={config.trix?.period || 14}
                    onChange={(e) => updateConfig('trix', { period: parseInt(e.target.value) })}
                    className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                    min="2"
                    max="100"
                  />
                </div>
              </IndicatorRow>

              {/* OBV */}
              <IndicatorRow
                icon={Database}
                name="OBV"
                indicator="obv"
                description="On Balance Volume"
                tags={["volume", "accumulation", "distribution"]}
              />

              {/* Elder Ray */}
              <IndicatorRow
                icon={ArrowFatLinesUp}
                name="Elder Ray"
                indicator="elderRay"
                description="Bull/Bear Power indicator"
                tags={["power", "bull", "bear"]}
              >
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Periode EMA</label>
                  <input
                    type="number"
                    value={config.elderRay?.period || 13}
                    onChange={(e) => updateConfig('elderRay', { period: parseInt(e.target.value) })}
                    className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                    min="2"
                    max="100"
                  />
                </div>
              </IndicatorRow>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 bg-[#1a1f2e] border-t border-gray-800/50 flex items-center justify-between px-4 flex-shrink-0">
          <button
            onClick={() => {
              const resetConfig: IndicatorConfig = {
                sma: { enabled: false, period: 20, color: '#3b82f6' },
                ema: { enabled: false, period: 20, color: '#f59e0b' },
                wma: { enabled: false, period: 20, color: '#8b5cf6' },
                bollinger: { enabled: false, period: 20, stdDev: 2, colorUpper: '#ef4444', colorMiddle: '#6b7280', colorLower: '#10b981' },
                keltner: { enabled: false, emaPeriod: 20, atrPeriod: 10, multiplier: 2 },
                donchian: { enabled: false, period: 20 },
                ichimoku: { enabled: false, tenkanPeriod: 9, kijunPeriod: 26, senkouBPeriod: 52 },
                vwap: { enabled: false, color: '#ec4899' },
                parabolicSar: { enabled: false, accelerationFactor: 0.02, maxAF: 0.2 },
                supertrend: { enabled: false, period: 10, multiplier: 3 },
                rsi: { enabled: false, period: 14, overbought: 70, oversold: 30 },
                macd: { enabled: false, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
                stochastic: { enabled: false, kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20 },
                atr: { enabled: false, period: 14 },
                adx: { enabled: false, period: 14 },
                cci: { enabled: false, period: 20 },
                williamsR: { enabled: false, period: 14 },
                mfi: { enabled: false, period: 14 },
                aroon: { enabled: false, period: 25 },
                trix: { enabled: false, period: 14 },
                obv: { enabled: false },
                elderRay: { enabled: false, period: 13 }
              }
              onChange(resetConfig)
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Reset Semua
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
          >
            Terapkan
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-left {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-left {
          animation: slide-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  )
})

IndicatorControls.displayName = 'IndicatorControls'

export default IndicatorControls