'use client'

import { X, Edit, Package, Activity, TrendingUp, Settings as SettingsIcon, Database, Zap, DollarSign } from 'lucide-react'

interface Asset {
  id: string
  name: string
  symbol: string
  category?: 'normal' | 'crypto'
  profitRate: number
  isActive: boolean
  dataSource: string
  realtimeDbPath?: string
  apiEndpoint?: string
  description?: string
  cryptoConfig?: {
    baseCurrency: string
    quoteCurrency: string
    exchange?: string
  }
  simulatorSettings?: {
    initialPrice: number
    dailyVolatilityMin: number
    dailyVolatilityMax: number
    secondVolatilityMin: number
    secondVolatilityMax: number
    minPrice?: number
    maxPrice?: number
  }
  tradingSettings?: {
    minOrderAmount: number
    maxOrderAmount: number
    allowedDurations: number[]
  }
  createdAt: string
  updatedAt?: string
  createdBy?: string
}

interface AssetDetailModalProps {
  asset: Asset
  onClose: () => void
  onEdit?: () => void
}

export default function AssetDetailModal({ asset, onClose, onEdit }: AssetDetailModalProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      dateStyle: 'long',
      timeStyle: 'short',
    })
  }

  // ✅ Format duration with proper labels including 1 second
  const formatDuration = (minutes: number): string => {
    if (minutes === 0.0167) return '⚡ 1 second'
    if (minutes < 1) return `${Math.round(minutes * 60)}s`
    if (minutes < 60) return `${minutes}m`
    return `${Math.floor(minutes / 60)}h`
  }

  // ✅ Check if asset has ultra-fast mode
  const hasUltraFast = asset.tradingSettings?.allowedDurations.includes(0.0167)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              asset.isActive ? 'bg-green-50' : 'bg-gray-100'
            }`}>
              <Package className={`w-6 h-6 ${
                asset.isActive ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">{asset.name}</h2>
                {/* ✅ Category Badge */}
                {asset.category === 'crypto' ? (
                  <span className="px-2 py-1 bg-gradient-to-r from-orange-100 to-yellow-100 border border-orange-300 text-orange-700 rounded-lg text-xs font-bold">
                    ₿ Crypto
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg text-xs font-bold">
                    📊 Normal
                  </span>
                )}
                {/* ✅ Ultra-Fast Badge */}
                {hasUltraFast && (
                  <span className="px-2 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 text-yellow-700 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Ultra-Fast
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">Asset Details</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              Basic Information
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Symbol</span>
                <span className="text-sm font-semibold text-gray-900">{asset.symbol}</span>
              </div>
              {/* ✅ Category Display */}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Category</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">
                  {asset.category === 'crypto' ? '₿ Cryptocurrency' : '📊 Normal Asset'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Profit Rate</span>
                <span className="text-sm font-bold text-purple-600">{asset.profitRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <span className={`text-sm font-semibold ${
                  asset.isActive ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {asset.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              {asset.description && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600 block mb-1">Description</span>
                  <p className="text-sm text-gray-900">{asset.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* ✅ Crypto Configuration (if exists) */}
          {asset.category === 'crypto' && asset.cryptoConfig && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-orange-500" />
                Cryptocurrency Configuration
              </h3>
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 font-medium">Base Currency</span>
                  <span className="text-sm font-bold text-orange-700">{asset.cryptoConfig.baseCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-700 font-medium">Quote Currency</span>
                  <span className="text-sm font-bold text-orange-700">{asset.cryptoConfig.quoteCurrency}</span>
                </div>
                {asset.cryptoConfig.exchange && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-700 font-medium">Exchange</span>
                    <span className="text-sm font-bold text-orange-700">{asset.cryptoConfig.exchange}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-orange-200">
                  <div className="flex items-center gap-2 text-xs text-orange-800">
                    <span className="font-semibold">Trading Pair:</span>
                    <code className="px-2 py-1 bg-orange-100 rounded font-mono font-bold">
                      {asset.cryptoConfig.baseCurrency}/{asset.cryptoConfig.quoteCurrency}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Source */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              Data Source
            </h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Source Type</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">
                  {asset.dataSource === 'realtime_db' && '🔥 Firebase Realtime DB'}
                  {asset.dataSource === 'api' && '🌐 External API'}
                  {asset.dataSource === 'mock' && '🎲 Mock/Simulator'}
                  {asset.dataSource === 'cryptocompare' && '₿ CryptoCompare API'}
                </span>
              </div>
              {asset.dataSource === 'realtime_db' && asset.realtimeDbPath && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600 block mb-2">Realtime DB Path</span>
                  <code className="text-sm bg-gray-900 text-green-400 px-3 py-2 rounded block break-all">
                    {asset.realtimeDbPath}
                  </code>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 Current Price: <code className="text-xs bg-gray-200 px-1 py-0.5 rounded">{asset.realtimeDbPath}/current_price</code>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    💡 OHLC Data: <code className="text-xs bg-gray-200 px-1 py-0.5 rounded">{asset.realtimeDbPath}/ohlc_1m</code>
                  </p>
                </div>
              )}
              {asset.dataSource === 'api' && asset.apiEndpoint && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600 block mb-2">API Endpoint</span>
                  <code className="text-sm bg-gray-900 text-green-400 px-3 py-2 rounded block break-all">
                    {asset.apiEndpoint}
                  </code>
                </div>
              )}
              {asset.dataSource === 'cryptocompare' && asset.cryptoConfig && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600 block mb-2">CryptoCompare Configuration</span>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-900">
                      <strong>Real-time Crypto Data:</strong> Fetching prices for{' '}
                      <span className="font-mono font-bold">{asset.cryptoConfig.baseCurrency}/{asset.cryptoConfig.quoteCurrency}</span>
                      {asset.cryptoConfig.exchange && (
                        <> from <span className="font-semibold">{asset.cryptoConfig.exchange}</span></>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Simulator Settings */}
          {asset.simulatorSettings && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Simulator Settings
              </h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-600 block mb-1">Initial Price</span>
                    <span className="text-lg font-bold text-gray-900">
                      {asset.simulatorSettings.initialPrice.toFixed(3)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600 block mb-1">Price Range</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {asset.simulatorSettings.minPrice?.toFixed(3) || 'N/A'} - {asset.simulatorSettings.maxPrice?.toFixed(3) || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs text-gray-600 block mb-1">Daily Volatility</span>
                      <div className="flex gap-2">
                        <span className="text-sm bg-white px-3 py-1 rounded-lg font-mono">
                          {(asset.simulatorSettings.dailyVolatilityMin * 100).toFixed(3)}%
                        </span>
                        <span className="text-gray-400">-</span>
                        <span className="text-sm bg-white px-3 py-1 rounded-lg font-mono">
                          {(asset.simulatorSettings.dailyVolatilityMax * 100).toFixed(3)}%
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-600 block mb-1">Second Volatility</span>
                      <div className="flex gap-2">
                        <span className="text-sm bg-white px-3 py-1 rounded-lg font-mono">
                          {(asset.simulatorSettings.secondVolatilityMin * 100).toFixed(5)}%
                        </span>
                        <span className="text-gray-400">-</span>
                        <span className="text-sm bg-white px-3 py-1 rounded-lg font-mono">
                          {(asset.simulatorSettings.secondVolatilityMax * 100).toFixed(5)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trading Settings */}
          {asset.tradingSettings && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-orange-500" />
                Trading Settings
              </h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-gray-600 block mb-1">Min Order Amount</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(asset.tradingSettings.minOrderAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-600 block mb-1">Max Order Amount</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(asset.tradingSettings.maxOrderAmount)}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-600 block mb-3">
                    Allowed Durations
                    {hasUltraFast && (
                      <span className="ml-2 text-yellow-600 font-semibold">⚡ Ultra-Fast Enabled</span>
                    )}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {asset.tradingSettings.allowedDurations
                      .sort((a, b) => a - b)
                      .map((duration) => {
                        const isUltraFast = duration === 0.0167
                        return (
                          <span
                            key={duration}
                            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border-2 ${
                              isUltraFast
                                ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border-yellow-300'
                                : 'bg-purple-100 text-purple-700 border-purple-200'
                            }`}
                          >
                            {isUltraFast && <Zap className="w-3 h-3 inline mr-1" />}
                            {formatDuration(duration)}
                          </span>
                        )
                      })}
                  </div>
                  {hasUltraFast && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800">
                        <strong>⚡ Ultra-Fast Trading:</strong> This asset supports 1-second orders. 
                        High-frequency updates required for optimal performance.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Metadata</h3>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Asset ID</span>
                <code className="text-xs bg-gray-900 text-green-400 px-2 py-1 rounded">
                  {asset.id}
                </code>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Created At</span>
                <span className="text-gray-900 font-medium">{formatDate(asset.createdAt)}</span>
              </div>
              {asset.updatedAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Updated</span>
                  <span className="text-gray-900 font-medium">{formatDate(asset.updatedAt)}</span>
                </div>
              )}
              {asset.createdBy && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Created By</span>
                  <span className="text-gray-900 font-medium">{asset.createdBy}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-colors"
            >
              <Edit className="w-5 h-5" />
              Edit Asset
            </button>
          )}
        </div>
      </div>
    </div>
  )
}