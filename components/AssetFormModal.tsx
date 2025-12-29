'use client'

import { useState, useEffect } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

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
}

interface AssetFormModalProps {
  mode: 'create' | 'edit'
  asset?: Asset
  onClose: () => void
  onSuccess: () => void
}

const ALL_DURATIONS = [1, 2, 3, 4, 5, 15, 30, 45, 60]

export default function AssetFormModal({ mode, asset, onClose, onSuccess }: AssetFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Form state
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    symbol: asset?.symbol || '',
    profitRate: asset?.profitRate || 85,
    isActive: asset?.isActive ?? true,
    dataSource: asset?.dataSource || 'realtime_db',
    realtimeDbPath: asset?.realtimeDbPath || '',
    apiEndpoint: asset?.apiEndpoint || '',
    description: asset?.description || '',
    
    // Simulator Settings
    initialPrice: asset?.simulatorSettings?.initialPrice || 40.022,
    dailyVolatilityMin: asset?.simulatorSettings?.dailyVolatilityMin || 0.001,
    dailyVolatilityMax: asset?.simulatorSettings?.dailyVolatilityMax || 0.005,
    secondVolatilityMin: asset?.simulatorSettings?.secondVolatilityMin || 0.00001,
    secondVolatilityMax: asset?.simulatorSettings?.secondVolatilityMax || 0.00008,
    minPrice: asset?.simulatorSettings?.minPrice || 0,
    maxPrice: asset?.simulatorSettings?.maxPrice || 0,
    
    // Trading Settings
    minOrderAmount: asset?.tradingSettings?.minOrderAmount || 1000,
    maxOrderAmount: asset?.tradingSettings?.maxOrderAmount || 1000000,
    allowedDurations: asset?.tradingSettings?.allowedDurations || ALL_DURATIONS,
  })

  // Auto-calculate min/max price if not set
  useEffect(() => {
    if (formData.minPrice === 0) {
      setFormData(prev => ({
        ...prev,
        minPrice: prev.initialPrice * 0.5
      }))
    }
    if (formData.maxPrice === 0) {
      setFormData(prev => ({
        ...prev,
        maxPrice: prev.initialPrice * 2.0
      }))
    }
  }, [formData.initialPrice])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Basic validations
    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.symbol.trim()) newErrors.symbol = 'Symbol is required'
    if (formData.profitRate < 0 || formData.profitRate > 100) {
      newErrors.profitRate = 'Profit rate must be between 0 and 100'
    }

    // Data source validations
    if (formData.dataSource === 'realtime_db') {
      if (!formData.realtimeDbPath.trim()) {
        newErrors.realtimeDbPath = 'Realtime DB path is required'
      } else if (formData.realtimeDbPath.endsWith('/current_price')) {
        newErrors.realtimeDbPath = 'Path should NOT include /current_price'
      } else if (!formData.realtimeDbPath.startsWith('/')) {
        newErrors.realtimeDbPath = 'Path must start with /'
      }
    }

    if (formData.dataSource === 'api' && !formData.apiEndpoint.trim()) {
      newErrors.apiEndpoint = 'API endpoint is required'
    }

    // Simulator settings validations
    if (formData.initialPrice <= 0) {
      newErrors.initialPrice = 'Initial price must be greater than 0'
    }
    if (formData.dailyVolatilityMin >= formData.dailyVolatilityMax) {
      newErrors.dailyVolatilityMin = 'Min must be less than max'
    }
    if (formData.secondVolatilityMin >= formData.secondVolatilityMax) {
      newErrors.secondVolatilityMin = 'Min must be less than max'
    }

    // Trading settings validations
    if (formData.minOrderAmount >= formData.maxOrderAmount) {
      newErrors.minOrderAmount = 'Min must be less than max'
    }
    if (formData.allowedDurations.length === 0) {
      newErrors.allowedDurations = 'At least one duration must be selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: formData.name.trim(),
        symbol: formData.symbol.trim().toUpperCase(),
        profitRate: formData.profitRate,
        isActive: formData.isActive,
        dataSource: formData.dataSource,
        ...(formData.dataSource === 'realtime_db' && {
          realtimeDbPath: formData.realtimeDbPath.trim()
        }),
        ...(formData.dataSource === 'api' && {
          apiEndpoint: formData.apiEndpoint.trim()
        }),
        description: formData.description.trim(),
        simulatorSettings: {
          initialPrice: formData.initialPrice,
          dailyVolatilityMin: formData.dailyVolatilityMin,
          dailyVolatilityMax: formData.dailyVolatilityMax,
          secondVolatilityMin: formData.secondVolatilityMin,
          secondVolatilityMax: formData.secondVolatilityMax,
          minPrice: formData.minPrice,
          maxPrice: formData.maxPrice,
        },
        tradingSettings: {
          minOrderAmount: formData.minOrderAmount,
          maxOrderAmount: formData.maxOrderAmount,
          allowedDurations: formData.allowedDurations.sort((a, b) => a - b),
        },
      }

      if (mode === 'create') {
        await api.createAsset(payload)
      } else {
        await api.updateAsset(asset!.id, payload)
      }

      onSuccess()
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(error.response?.data?.error || `Failed to ${mode} asset`)
    } finally {
      setLoading(false)
    }
  }

  const toggleDuration = (duration: number) => {
    setFormData(prev => ({
      ...prev,
      allowedDurations: prev.allowedDurations.includes(duration)
        ? prev.allowedDurations.filter(d => d !== duration)
        : [...prev.allowedDurations, duration]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New Asset' : 'Edit Asset'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Asset Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-purple-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="e.g., IDX STC"
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-purple-500 ${
                    errors.symbol ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="e.g., IDX_STC"
                />
                {errors.symbol && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.symbol}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Profit Rate (%) *
                </label>
                <input
                  type="number"
                  value={formData.profitRate}
                  onChange={(e) => setFormData({ ...formData, profitRate: parseFloat(e.target.value) })}
                  min="0"
                  max="100"
                  step="0.1"
                  className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-purple-500 ${
                    errors.profitRate ? 'border-red-500' : 'border-gray-200'
                  }`}
                />
                {errors.profitRate && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.profitRate}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Status
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                placeholder="Optional description..."
              />
            </div>
          </div>

          {/* Data Source */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Data Source</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Source Type *
                </label>
                <select
                  value={formData.dataSource}
                  onChange={(e) => setFormData({ ...formData, dataSource: e.target.value })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                >
                  <option value="realtime_db">Firebase Realtime DB</option>
                  <option value="api">External API</option>
                  <option value="mock">Mock Data</option>
                </select>
              </div>

              {formData.dataSource === 'realtime_db' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Realtime DB Path *
                  </label>
                  <input
                    type="text"
                    value={formData.realtimeDbPath}
                    onChange={(e) => setFormData({ ...formData, realtimeDbPath: e.target.value })}
                    className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-purple-500 ${
                      errors.realtimeDbPath ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="/idx_stc"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: /idx_stc (Do NOT include /current_price)
                  </p>
                  {errors.realtimeDbPath && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.realtimeDbPath}
                    </p>
                  )}
                </div>
              )}

              {formData.dataSource === 'api' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    API Endpoint *
                  </label>
                  <input
                    type="url"
                    value={formData.apiEndpoint}
                    onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                    className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-purple-500 ${
                      errors.apiEndpoint ? 'border-red-500' : 'border-gray-200'
                    }`}
                    placeholder="https://api.example.com/price"
                  />
                  {errors.apiEndpoint && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.apiEndpoint}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Simulator Settings */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Simulator Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Initial Price
                </label>
                <input
                  type="number"
                  value={formData.initialPrice}
                  onChange={(e) => setFormData({ ...formData, initialPrice: parseFloat(e.target.value) })}
                  step="0.001"
                  min="0.001"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Daily Volatility Range (%)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.dailyVolatilityMin}
                    onChange={(e) => setFormData({ ...formData, dailyVolatilityMin: parseFloat(e.target.value) })}
                    step="0.001"
                    min="0"
                    max="1"
                    className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={formData.dailyVolatilityMax}
                    onChange={(e) => setFormData({ ...formData, dailyVolatilityMax: parseFloat(e.target.value) })}
                    step="0.001"
                    min="0"
                    max="1"
                    className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Second Volatility Range (%)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.secondVolatilityMin}
                    onChange={(e) => setFormData({ ...formData, secondVolatilityMin: parseFloat(e.target.value) })}
                    step="0.00001"
                    min="0"
                    max="0.01"
                    className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={formData.secondVolatilityMax}
                    onChange={(e) => setFormData({ ...formData, secondVolatilityMax: parseFloat(e.target.value) })}
                    step="0.00001"
                    min="0"
                    max="0.01"
                    className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                    placeholder="Max"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Price Range (Min/Max)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.minPrice}
                    onChange={(e) => setFormData({ ...formData, minPrice: parseFloat(e.target.value) })}
                    step="0.001"
                    min="0"
                    className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={formData.maxPrice}
                    onChange={(e) => setFormData({ ...formData, maxPrice: parseFloat(e.target.value) })}
                    step="0.001"
                    min="0"
                    className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Trading Settings */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Trading Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Min Order Amount (IDR)
                </label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: parseInt(e.target.value) })}
                  min="100"
                  step="100"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Max Order Amount (IDR)
                </label>
                <input
                  type="number"
                  value={formData.maxOrderAmount}
                  onChange={(e) => setFormData({ ...formData, maxOrderAmount: parseInt(e.target.value) })}
                  min="1000"
                  step="1000"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Allowed Durations (minutes) *
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_DURATIONS.map((duration) => (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => toggleDuration(duration)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      formData.allowedDurations.includes(duration)
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {duration}m
                  </button>
                ))}
              </div>
              {errors.allowedDurations && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.allowedDurations}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {mode === 'create' ? 'Create Asset' : 'Save Changes'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}