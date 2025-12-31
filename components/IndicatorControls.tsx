// components/IndicatorControls.tsx
'use client'

import { useState, memo } from 'react'
import { 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Waves,
  X,
  Settings2,
  ChevronDown
} from 'lucide-react'

export interface IndicatorConfig {
  sma?: { enabled: boolean; period: number; color: string }
  ema?: { enabled: boolean; period: number; color: string }
  bollinger?: { enabled: boolean; period: number; stdDev: number; colorUpper: string; colorMiddle: string; colorLower: string }
  rsi?: { enabled: boolean; period: number; overbought: number; oversold: number }
  macd?: { enabled: boolean; fastPeriod: number; slowPeriod: number; signalPeriod: number }
  volume?: { enabled: boolean; maPeriod: number }
  stochastic?: { enabled: boolean; kPeriod: number; dPeriod: number; overbought: number; oversold: number }
  atr?: { enabled: boolean; period: number }
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
    children 
  }: { 
    icon: any
    name: string
    indicator: keyof IndicatorConfig
    description: string
    children?: React.ReactNode 
  }) => {
    const isEnabled = config[indicator]?.enabled || false
    const isExpanded = expandedIndicator === indicator

    return (
      <div className="border-b border-gray-800/50 last:border-0">
        <div className="flex items-center justify-between p-3 hover:bg-[#232936] transition-colors">
          <div className="flex items-center gap-3 flex-1">
            <Icon className={`w-4 h-4 ${isEnabled ? 'text-blue-400' : 'text-gray-500'}`} />
            <div className="flex-1">
              <div className="text-sm font-medium">{name}</div>
              <div className="text-xs text-gray-500">{description}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {children && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setExpandedIndicator(isExpanded ? null : indicator)
                }}
                className="p-1 hover:bg-[#2a3142] rounded transition-colors"
              >
                <Settings2 className={`w-4 h-4 text-gray-400 ${isExpanded ? 'rotate-90' : ''} transition-transform`} />
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
        <div className="h-14 bg-[#1a1f2e] border-b border-gray-800/50 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-lg">Indicators</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-[#232936] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
            Overlay
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
            Oscillator
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
                icon={TrendingUp}
                name="Simple Moving Average"
                indicator="sma"
                description="Smoothed price average"
              >
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Period</label>
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
                    <label className="text-xs text-gray-400 mb-1 block">Color</label>
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
                icon={TrendingUp}
                name="Exponential Moving Average"
                indicator="ema"
                description="Weighted recent prices"
              >
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Period</label>
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
                    <label className="text-xs text-gray-400 mb-1 block">Color</label>
                    <input
                      type="color"
                      value={config.ema?.color || '#f59e0b'}
                      onChange={(e) => updateConfig('ema', { color: e.target.value })}
                      className="w-full h-10 bg-[#0f1419] border border-gray-800/50 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </IndicatorRow>

              {/* Bollinger Bands */}
              <IndicatorRow
                icon={Waves}
                name="Bollinger Bands"
                indicator="bollinger"
                description="Volatility bands"
              >
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Period</label>
                      <input
                        type="number"
                        value={config.bollinger?.period || 20}
                        onChange={(e) => updateConfig('bollinger', { period: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="2"
                        max="200"
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
                        step="0.5"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Upper</label>
                      <input
                        type="color"
                        value={config.bollinger?.colorUpper || '#ef4444'}
                        onChange={(e) => updateConfig('bollinger', { colorUpper: e.target.value })}
                        className="w-full h-10 bg-[#0f1419] border border-gray-800/50 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Middle</label>
                      <input
                        type="color"
                        value={config.bollinger?.colorMiddle || '#6b7280'}
                        onChange={(e) => updateConfig('bollinger', { colorMiddle: e.target.value })}
                        className="w-full h-10 bg-[#0f1419] border border-gray-800/50 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Lower</label>
                      <input
                        type="color"
                        value={config.bollinger?.colorLower || '#10b981'}
                        onChange={(e) => updateConfig('bollinger', { colorLower: e.target.value })}
                        className="w-full h-10 bg-[#0f1419] border border-gray-800/50 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </IndicatorRow>

              {/* Volume */}
              <IndicatorRow
                icon={BarChart3}
                name="Volume"
                indicator="volume"
                description="Trading volume with MA"
              >
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">MA Period</label>
                  <input
                    type="number"
                    value={config.volume?.maPeriod || 20}
                    onChange={(e) => updateConfig('volume', { maPeriod: parseInt(e.target.value) })}
                    className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                    min="2"
                    max="200"
                  />
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
              >
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Period</label>
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
                icon={TrendingUp}
                name="MACD"
                indicator="macd"
                description="Moving Average Convergence Divergence"
              >
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Fast</label>
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
                      <label className="text-xs text-gray-400 mb-1 block">Slow</label>
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
                      <label className="text-xs text-gray-400 mb-1 block">Signal</label>
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
                description="Momentum indicator"
              >
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">%K Period</label>
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
                      <label className="text-xs text-gray-400 mb-1 block">%D Period</label>
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
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Overbought</label>
                      <input
                        type="number"
                        value={config.stochastic?.overbought || 80}
                        onChange={(e) => updateConfig('stochastic', { overbought: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="50"
                        max="100"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-1 block">Oversold</label>
                      <input
                        type="number"
                        value={config.stochastic?.oversold || 20}
                        onChange={(e) => updateConfig('stochastic', { oversold: parseInt(e.target.value) })}
                        className="w-full bg-[#0f1419] border border-gray-800/50 rounded px-3 py-2 text-sm"
                        min="0"
                        max="50"
                      />
                    </div>
                  </div>
                </div>
              </IndicatorRow>

              {/* ATR */}
              <IndicatorRow
                icon={BarChart3}
                name="ATR"
                indicator="atr"
                description="Average True Range"
              >
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Period</label>
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
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="h-14 bg-[#1a1f2e] border-t border-gray-800/50 flex items-center justify-between px-4 flex-shrink-0">
          <button
            onClick={() => {
              onChange({
                sma: { enabled: false, period: 20, color: '#3b82f6' },
                ema: { enabled: false, period: 20, color: '#f59e0b' },
                bollinger: { enabled: false, period: 20, stdDev: 2, colorUpper: '#ef4444', colorMiddle: '#6b7280', colorLower: '#10b981' },
                rsi: { enabled: false, period: 14, overbought: 70, oversold: 30 },
                macd: { enabled: false, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
                volume: { enabled: false, maPeriod: 20 },
                stochastic: { enabled: false, kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20 },
                atr: { enabled: false, period: 14 }
              })
            }}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Reset All
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-sm font-medium transition-colors"
          >
            Apply
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