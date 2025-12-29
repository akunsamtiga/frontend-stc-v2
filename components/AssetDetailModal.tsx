'use client'

import { X, Edit, Package, Activity, TrendingUp, Settings as SettingsIcon, Database } from 'lucide-react'

interface Asset {
  id: string
  name: string
  symbol: string
  profitRate: number
  isActive: boolean
  dataSource: string
  realtimeDbPath?: string
  apiEndpoint?: string
  description?: string
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
              <h2 className="text-2xl font-bold text-gray-900">{asset.name}</h2>
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
                  {asset.dataSource.replace('_', ' ')}
                </span>
              </div>
              {asset.dataSource === 'realtime_db' && asset.realtimeDbPath && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600 block mb-1">Realtime DB Path</span>
                  <code className="text-sm bg-gray-900 text-green-400 px-2 py-1 rounded">
                    {asset.realtimeDbPath}
                  </code>
                  <p className="text-xs text-gray-500 mt-1">
                    Price fetched from: {asset.realtimeDbPath}/current_price
                  </p>
                </div>
              )}
              {asset.dataSource === 'api' && asset.apiEndpoint && (
                <div className="pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600 block mb-1">API Endpoint</span>
                  <code className="text-sm bg-gray-900 text-green-400 px-2 py-1 rounded break-all">
                    {asset.apiEndpoint}
                  </code>
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
                  <span className="text-xs text-gray-600 block mb-2">Allowed Durations</span>
                  <div className="flex flex-wrap gap-2">
                    {asset.tradingSettings.allowedDurations.map((duration) => (
                      <span
                        key={duration}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold"
                      >
                        {duration}m
                      </span>
                    ))}
                  </div>
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