'use client'

import { 
  X, Edit, Package, Activity, TrendingUp, Settings, Database, 
  Zap, DollarSign, Info, Clock, User, Coins, Globe, CheckCircle, XCircle
} from 'lucide-react'

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

  const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h`
}


  const hasUltraFast = asset.tradingSettings?.allowedDurations.includes(0.0167)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
              asset.isActive 
                ? 'bg-gradient-to-br from-green-500 to-green-600' 
                : 'bg-gradient-to-br from-gray-400 to-gray-500'
            }`}>
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
  <h2 className="text-2xl font-bold text-gray-900">{asset.name}</h2>
  {asset.category === 'crypto' ? (
    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">
      Crypto
    </span>
  ) : (
    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
      Normal
    </span>
  )}
</div>

              <p className="text-sm text-gray-600 mt-1">Asset Details & Configuration</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Symbol</span>
                <p className="text-lg font-bold text-gray-900 mt-1">{asset.symbol}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Category</span>
                <p className="text-lg font-semibold text-gray-900 mt-1 capitalize">
                  {asset.category === 'crypto' ? 'Cryptocurrency' : 'Normal Asset'}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Profit Rate</span>
                <p className="text-lg font-bold text-purple-600 mt-1">{asset.profitRate}%</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Status</span>
                <div className="flex items-center gap-2 mt-1">
                  {asset.isActive ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-lg font-semibold text-green-600">Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-gray-500" />
                      <span className="text-lg font-semibold text-gray-500">Inactive</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            {asset.description && (
              <div className="mt-4 bg-white p-4 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Description</span>
                <p className="text-sm text-gray-900 mt-2 leading-relaxed">{asset.description}</p>
              </div>
            )}
          </div>

          {asset.category === 'crypto' && asset.cryptoConfig && (
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-orange-500" />
                Cryptocurrency Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-orange-200">
                  <span className="text-xs text-orange-600 uppercase tracking-wide">Base Currency</span>
                  <p className="text-lg font-bold text-orange-700 mt-1">{asset.cryptoConfig.baseCurrency}</p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-orange-200">
                  <span className="text-xs text-orange-600 uppercase tracking-wide">Quote Currency</span>
                  <p className="text-lg font-bold text-orange-700 mt-1">{asset.cryptoConfig.quoteCurrency}</p>
                </div>
                {asset.cryptoConfig.exchange && (
                  <div className="bg-white p-4 rounded-lg border border-orange-200">
                    <span className="text-xs text-orange-600 uppercase tracking-wide">Exchange</span>
                    <p className="text-lg font-bold text-orange-700 mt-1">{asset.cryptoConfig.exchange}</p>
                  </div>
                )}
              </div>
              <div className="mt-4 p-3 bg-white border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="font-semibold text-orange-700">Trading Pair:</span>
                  <code className="px-2 py-1 bg-orange-100 rounded font-mono font-bold text-orange-900">
                    {asset.cryptoConfig.baseCurrency}/{asset.cryptoConfig.quoteCurrency}
                  </code>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-500" />
              Data Source
            </h3>
            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  {asset.dataSource === 'binance' ? (
                    <Coins className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Database className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <span className="text-xs text-blue-600 uppercase tracking-wide">Source Type</span>
                  <p className="text-sm font-semibold text-gray-900 capitalize">
                    {asset.dataSource === 'realtime_db' && 'Firebase Realtime DB'}
                    {asset.dataSource === 'api' && 'External API'}
                    {asset.dataSource === 'mock' && 'Mock/Simulator'}
                    {asset.dataSource === 'binance' && 'Binance API'}
                  </p>
                </div>
              </div>
              
              {asset.dataSource === 'realtime_db' && asset.realtimeDbPath && (
                <div className="mt-3 pt-3 border-t border-blue-100">
                  <span className="text-xs text-blue-600 uppercase tracking-wide block mb-2">Realtime DB Path</span>
                  <code className="text-sm bg-gray-900 text-green-400 px-3 py-2 rounded-lg block break-all">
                    {asset.realtimeDbPath}
                  </code>
                </div>
              )}
              
              {asset.dataSource === 'api' && asset.apiEndpoint && (
                <div className="mt-3 pt-3 border-t border-blue-100">
                  <span className="text-xs text-blue-600 uppercase tracking-wide block mb-2">API Endpoint</span>
                  <code className="text-sm bg-gray-900 text-green-400 px-3 py-2 rounded-lg block break-all">
                    {asset.apiEndpoint}
                  </code>
                </div>
              )}
            </div>
          </div>

          {asset.simulatorSettings && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Simulator Settings
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <span className="text-xs text-green-600 uppercase tracking-wide">Initial Price</span>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {asset.simulatorSettings.initialPrice.toFixed(3)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <span className="text-xs text-green-600 uppercase tracking-wide">Min Price</span>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {asset.simulatorSettings.minPrice?.toFixed(3) || 'N/A'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <span className="text-xs text-green-600 uppercase tracking-wide">Max Price</span>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {asset.simulatorSettings.maxPrice?.toFixed(3) || 'N/A'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-green-200">
                  <span className="text-xs text-green-600 uppercase tracking-wide">Daily Volatility</span>
                  <p className="text-sm font-mono text-gray-900 mt-1">
                    {(asset.simulatorSettings.dailyVolatilityMin * 100).toFixed(3)}% - {(asset.simulatorSettings.dailyVolatilityMax * 100).toFixed(3)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {asset.tradingSettings && (
            <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                Trading Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg border border-orange-200">
                  <span className="text-xs text-orange-600 uppercase tracking-wide flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Min Order Amount
                  </span>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrency(asset.tradingSettings.minOrderAmount)}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-orange-200">
                  <span className="text-xs text-orange-600 uppercase tracking-wide flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Max Order Amount
                  </span>
                  <p className="text-lg font-bold text-gray-900 mt-1">
                    {formatCurrency(asset.tradingSettings.maxOrderAmount)}
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <span className="text-xs text-orange-600 uppercase tracking-wide block mb-3">
  Allowed Durations
</span>
                <div className="flex flex-wrap gap-2">
  {asset.tradingSettings.allowedDurations
    .sort((a, b) => a - b)
    .map((duration) => (
      <span
        key={duration}
        className="px-3 py-1.5 rounded-lg text-sm font-semibold border-2 bg-purple-100 text-purple-700 border-purple-200"
      >
        {formatDuration(duration)}
      </span>
    ))}
</div>

              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-gray-500" />
              Metadata
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Asset ID
                </span>
                <code className="text-xs bg-gray-900 text-green-400 px-2 py-1 rounded mt-2 block break-all">
                  {asset.id}
                </code>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Created At
                </span>
                <p className="text-sm font-medium text-gray-900 mt-2">{formatDate(asset.createdAt)}</p>
              </div>
              {asset.updatedAt && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last Updated
                  </span>
                  <p className="text-sm font-medium text-gray-900 mt-2">{formatDate(asset.updatedAt)}</p>
                </div>
              )}
              {asset.createdBy && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <span className="text-xs text-gray-500 uppercase tracking-wide flex items-center gap-1">
                    <User className="w-3 h-3" />
                    Created By
                  </span>
                  <p className="text-sm font-medium text-gray-900 mt-2">{asset.createdBy}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-white hover:bg-gray-100 text-gray-700 rounded-xl font-semibold transition-all border-2 border-gray-200 hover:border-gray-300"
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
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