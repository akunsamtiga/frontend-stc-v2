'use client'
import { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Zap, AlertTriangle, Info } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface Asset {
  id: string
  name: string
  symbol: string
  category: 'normal' | 'crypto'
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
}

interface AssetFormModalProps {
  mode: 'create' | 'edit'
  asset?: Asset
  onClose: () => void
  onSuccess: () => void
}

const ALL_DURATIONS = [
  { value: 0.0167, label: '1 second ⚡', shortLabel: '1s', isUltraFast: true },
  { value: 1, label: '1 minute', shortLabel: '1m' },
  { value: 2, label: '2 minutes', shortLabel: '2m' },
  { value: 3, label: '3 minutes', shortLabel: '3m' },
  { value: 4, label: '4 minutes', shortLabel: '4m' },
  { value: 5, label: '5 minutes', shortLabel: '5m' },
  { value: 15, label: '15 minutes', shortLabel: '15m' },
  { value: 30, label: '30 minutes', shortLabel: '30m' },
  { value: 45, label: '45 minutes', shortLabel: '45m' },
  { value: 60, label: '1 hour', shortLabel: '60m' },
]

const VALID_DURATIONS = [0.0167, 1, 2, 3, 4, 5, 15, 30, 45, 60]

// ✅ FIXED: Binance supported coins
const BINANCE_COINS = [
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOT', 'DOGE', 
  'MATIC', 'LTC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'XLM', 
  'ALGO', 'VET', 'ICP', 'FIL', 'TRX', 'ETC', 'NEAR', 'APT', 'ARB', 'OP'
]

// ✅ FIXED: Prioritize USDT as default, include USD with warning
const BINANCE_QUOTE_CURRENCIES = [
  { value: 'USDT', label: 'USDT (Recommended)', isDefault: true },
  { value: 'USD', label: 'USD (Auto-mapped to USDT)', warning: true },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  { value: 'BUSD', label: 'BUSD (Deprecated)' },
]

export default function AssetFormModal({ mode, asset, onClose, onSuccess }: AssetFormModalProps) {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // ✅ FIXED: Default quote currency untuk crypto adalah USDT
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    symbol: asset?.symbol || '',
    category: asset?.category || 'normal' as 'normal' | 'crypto',
    profitRate: asset?.profitRate || 85,
    isActive: asset?.isActive ?? true,
    dataSource: asset?.dataSource || 'realtime_db',
    realtimeDbPath: asset?.realtimeDbPath || '',
    apiEndpoint: asset?.apiEndpoint || '',
    description: asset?.description || '',
    
    // Crypto Config
    cryptoBaseCurrency: asset?.cryptoConfig?.baseCurrency || '',
    cryptoQuoteCurrency: asset?.cryptoConfig?.quoteCurrency || 'USDT', // ✅ Changed from 'USD' to 'USDT'
    cryptoExchange: asset?.cryptoConfig?.exchange || '',

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
    allowedDurations: asset?.tradingSettings?.allowedDurations || [0.0167, 1, 2, 3, 4, 5, 15, 30, 45, 60],
  })

  // ✅ FIXED: Auto-switch to Binance when category changes to crypto
  useEffect(() => {
    if (formData.category === 'crypto') {
      setFormData(prev => ({
        ...prev,
        dataSource: 'binance',
        cryptoQuoteCurrency: 'USDT' // ✅ Ensure USDT default for new crypto assets
      }))
    } else if (formData.category === 'normal' && formData.dataSource === 'binance') {
      setFormData(prev => ({
        ...prev,
        dataSource: 'realtime_db'
      }))
    }
  }, [formData.category])

  // Auto-calculate min/max price if not set
  useEffect(() => {
    if (formData.minPrice === 0 && formData.initialPrice > 0) {
      setFormData(prev => ({
        ...prev,
        minPrice: prev.initialPrice * 0.5
      }))
    }
    if (formData.maxPrice === 0 && formData.initialPrice > 0) {
      setFormData(prev => ({
        ...prev,
        maxPrice: prev.initialPrice * 2.0
      }))
    }
  }, [formData.initialPrice, formData.minPrice, formData.maxPrice])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // ============================================
    // BASIC VALIDATIONS
    // ============================================
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Symbol is required'
    }

    // ✅ Allow symbols with / for crypto pairs (e.g., BTC/USD)
    if (!/^[A-Z0-9/_-]+$/i.test(formData.symbol)) {
      newErrors.symbol = 'Symbol can only contain letters, numbers, /, _, and -'
    }

    if (formData.profitRate < 0 || formData.profitRate > 100) {
      newErrors.profitRate = 'Profit rate must be between 0 and 100'
    }

    if (!formData.category) {
      newErrors.category = 'Category is required'
    }

    if (formData.category !== 'normal' && formData.category !== 'crypto') {
      newErrors.category = 'Invalid category. Must be "normal" or "crypto"'
    }

    // ============================================
    // CATEGORY-SPECIFIC VALIDATION
    // ============================================
    if (formData.category === 'crypto') {
      // CRYPTO ASSETS REQUIREMENTS
      
      // ✅ FIXED: Must use 'binance' data source
      if (formData.dataSource !== 'binance') {
        newErrors.dataSource = 'Crypto assets MUST use "binance" data source'
      }
      
      if (!formData.cryptoBaseCurrency.trim()) {
        newErrors.cryptoBaseCurrency = 'Base currency is required for crypto assets'
      } else if (!BINANCE_COINS.includes(formData.cryptoBaseCurrency.toUpperCase())) {
        newErrors.cryptoBaseCurrency = `Unsupported coin. Supported: ${BINANCE_COINS.join(', ')}`
      }
      
      if (!formData.cryptoQuoteCurrency.trim()) {
        newErrors.cryptoQuoteCurrency = 'Quote currency is required for crypto assets'
      } else if (!BINANCE_QUOTE_CURRENCIES.some(q => q.value === formData.cryptoQuoteCurrency.toUpperCase())) {
        newErrors.cryptoQuoteCurrency = `Unsupported quote currency`
      }
      
      // ✅ Crypto assets should NOT have apiEndpoint OR simulatorSettings
      if (formData.apiEndpoint.trim()) {
        newErrors.apiEndpoint = 'Crypto assets should not have API endpoint (Binance API is used automatically)'
      }
      
      // ✅ FIXED: Check if simulator settings are being set (should not be for crypto)
      const hasSimulatorSettings = formData.initialPrice !== 40.022 || 
                                   formData.dailyVolatilityMin !== 0.001 ||
                                   formData.dailyVolatilityMax !== 0.005
      
      if (hasSimulatorSettings) {
        newErrors.simulatorSettings = 'Crypto assets should not have simulator settings (real-time Binance data is used)'
      }
      
    } else {
      // NORMAL ASSETS REQUIREMENTS
      
      // ✅ FIXED: Normal assets cannot use "binance"
      if (formData.dataSource === 'binance') {
        newErrors.dataSource = 'Normal assets cannot use "binance". Use "realtime_db", "mock", or "api"'
      }
      
      if (formData.cryptoBaseCurrency.trim() || formData.cryptoQuoteCurrency !== 'USDT') {
        newErrors.cryptoBaseCurrency = 'Normal assets should not have crypto configuration'
      }
      
      // Data source specific validations
      if (formData.dataSource === 'realtime_db') {
        if (!formData.realtimeDbPath.trim()) {
          newErrors.realtimeDbPath = 'Realtime DB path is required for this data source'
        } else if (formData.realtimeDbPath.endsWith('/current_price')) {
          newErrors.realtimeDbPath = 'Path should NOT include /current_price (added automatically)'
        } else if (!formData.realtimeDbPath.startsWith('/')) {
          newErrors.realtimeDbPath = 'Path must start with / (e.g., /idx_stc)'
        }
      }
      
      if (formData.dataSource === 'api') {
        if (!formData.apiEndpoint.trim()) {
          newErrors.apiEndpoint = 'API endpoint is required for this data source'
        }
      }

      // Simulator settings validation (for normal assets only)
      if (formData.initialPrice <= 0) {
        newErrors.initialPrice = 'Initial price must be greater than 0'
      }

      if (formData.dailyVolatilityMin >= formData.dailyVolatilityMax) {
        newErrors.dailyVolatilityMin = 'Min must be less than max'
      }

      if (formData.secondVolatilityMin >= formData.secondVolatilityMax) {
        newErrors.secondVolatilityMin = 'Min must be less than max'
      }

      if (formData.minPrice && formData.maxPrice && formData.minPrice >= formData.maxPrice) {
        newErrors.minPrice = 'Min price must be less than max price'
      }
    }

    // ============================================
    // TRADING SETTINGS VALIDATION
    // ============================================
    if (formData.minOrderAmount >= formData.maxOrderAmount) {
      newErrors.minOrderAmount = 'Min must be less than max'
    }

    if (formData.allowedDurations.length === 0) {
      newErrors.allowedDurations = 'At least one duration must be selected'
    }

    // Validate each duration value
    const invalidDurations = formData.allowedDurations.filter(
      d => !VALID_DURATIONS.some(valid => Math.abs(valid - d) < 0.0001)
    )
    
    if (invalidDurations.length > 0) {
      newErrors.allowedDurations = `Invalid durations: ${invalidDurations.join(', ')}`
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
      let payload: any

      if (formData.category === 'crypto') {
        // ✅ FIXED: CRYPTO ASSET PAYLOAD (Binance)
        payload = {
          name: formData.name.trim(),
          symbol: formData.symbol.trim().toUpperCase(),
          category: 'crypto',
          profitRate: Number(formData.profitRate),
          isActive: Boolean(formData.isActive),
          dataSource: 'binance',
          description: formData.description.trim(),
          cryptoConfig: {
            baseCurrency: formData.cryptoBaseCurrency.trim().toUpperCase(),
            quoteCurrency: formData.cryptoQuoteCurrency.trim().toUpperCase(),
            ...(formData.cryptoExchange.trim() && { 
              exchange: formData.cryptoExchange.trim() 
            })
          },
          // ✅ Optional: Custom Realtime DB path for crypto
          ...(formData.realtimeDbPath.trim() && {
            realtimeDbPath: formData.realtimeDbPath.trim()
          }),
          tradingSettings: {
            minOrderAmount: Number(formData.minOrderAmount),
            maxOrderAmount: Number(formData.maxOrderAmount),
            allowedDurations: [...formData.allowedDurations].sort((a, b) => a - b)
          }
        }
        
        // ✅ IMPORTANT: No simulatorSettings for crypto
        // ✅ IMPORTANT: No apiEndpoint for crypto
        
      } else {
        // NORMAL ASSET PAYLOAD
        payload = {
          name: formData.name.trim(),
          symbol: formData.symbol.trim().toUpperCase(),
          category: 'normal',
          profitRate: Number(formData.profitRate),
          isActive: Boolean(formData.isActive),
          dataSource: formData.dataSource,
          description: formData.description.trim(),
          simulatorSettings: {
            initialPrice: Number(formData.initialPrice),
            dailyVolatilityMin: Number(formData.dailyVolatilityMin),
            dailyVolatilityMax: Number(formData.dailyVolatilityMax),
            secondVolatilityMin: Number(formData.secondVolatilityMin),
            secondVolatilityMax: Number(formData.secondVolatilityMax),
            minPrice: Number(formData.minPrice) || Number(formData.initialPrice) * 0.5,
            maxPrice: Number(formData.maxPrice) || Number(formData.initialPrice) * 2.0
          },
          tradingSettings: {
            minOrderAmount: Number(formData.minOrderAmount),
            maxOrderAmount: Number(formData.maxOrderAmount),
            allowedDurations: [...formData.allowedDurations].sort((a, b) => a - b)
          }
        }
        
        // Add data source specific fields
        if (formData.dataSource === 'realtime_db') {
          payload.realtimeDbPath = formData.realtimeDbPath.trim()
        } else if (formData.dataSource === 'api') {
          payload.apiEndpoint = formData.apiEndpoint.trim()
        }
      }

      console.log('📤 Submitting payload:', JSON.stringify(payload, null, 2))

      if (mode === 'create') {
        const response = await api.createAsset(payload)
        console.log('✅ Create response:', response)
        toast.success(response.data?.message || 'Asset created successfully')
      } else {
        const response = await api.updateAsset(asset!.id, payload)
        console.log('✅ Update response:', response)
        toast.success(response.data?.message || 'Asset updated successfully')
      }

      onSuccess()
    } catch (error: any) {
      console.error('❌ Submit error:', error)
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          error.message ||
                          `Failed to ${mode} asset`
      
      toast.error(errorMessage)
      
      if (error.response?.data) {
        console.error('Backend error details:', error.response.data)
      }
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

  const hasUltraFast = formData.allowedDurations.includes(0.0167)

  // ✅ FIXED: Data sources untuk crypto hanya Binance
  const availableDataSources = formData.category === 'crypto'
    ? [{ value: 'binance', label: '🪙 Binance API (Real-time Crypto)' }]
    : [
        { value: 'realtime_db', label: '🔥 Firebase Realtime DB' },
        { value: 'mock', label: '🎲 Mock/Simulator' },
        { value: 'api', label: '🌐 External API' },
      ]

  // ✅ FIXED: Preview untuk Binance symbol
  const getBinancePreview = () => {
    const base = formData.cryptoBaseCurrency.toUpperCase()
    const quote = formData.cryptoQuoteCurrency.toUpperCase()
    if (!base || !quote) return '???'
    
    // ✅ Auto-map USD ke USDT untuk preview
    const normalizedQuote = quote === 'USD' ? 'USDT' : quote
    return `${base}/${quote} → ${base}${normalizedQuote}`
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'create' ? 'Create New Asset' : 'Edit Asset'}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              {formData.category === 'crypto' && (
                <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded font-semibold">
                  🪙 Crypto Mode (Binance)
                </span>
              )}
              {formData.category === 'normal' && (
                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-semibold">
                  📊 Normal Mode
                </span>
              )}
              {hasUltraFast && (
                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Ultra-Fast (1s)
                </span>
              )}
            </div>
          </div>
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
                  placeholder="e.g., Bitcoin, IDX STC"
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
                  placeholder="e.g., BTC/USD, IDX_STC"
                />
                {errors.symbol && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.symbol}
                  </p>
                )}
              </div>

              {/* Category Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Asset Category * <span className="text-red-600">⚠️ Important - Choose Carefully</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'normal' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.category === 'normal'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        formData.category === 'normal' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <span className="text-xl">📊</span>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-gray-900">Normal Asset</div>
                        <div className="text-xs text-gray-600">Stocks, Indices, Commodities</div>
                      </div>
                    </div>
                    {formData.category === 'normal' && (
                      <div className="mt-2 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                        Simulated by trading-simulator service
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, category: 'crypto' })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.category === 'crypto'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        formData.category === 'crypto' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <span className="text-xl">🪙</span>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-gray-900">Cryptocurrency</div>
                        <div className="text-xs text-gray-600">BTC, ETH, BNB, etc</div>
                      </div>
                    </div>
                    {formData.category === 'crypto' && (
                      <div className="mt-2 text-xs text-orange-700 bg-orange-100 px-2 py-1 rounded">
                        Real-time Binance API
                      </div>
                    )}
                  </button>
                </div>
                {errors.category && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.category}
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
                    {formData.isActive ? '✅ Active' : '❌ Inactive'}
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

          {/* Conditional Rendering Based on Category */}
          {formData.category === 'crypto' ? (
            // ✅ FIXED: CRYPTO ASSET CONFIGURATION (Binance)
            <>
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                      🪙 Cryptocurrency Configuration (Binance)
                    </h3>
                    <p className="text-sm text-orange-800">
                      Crypto assets use <strong>real-time Binance API</strong>.
                      Backend fetches prices and stores to Realtime DB automatically.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Base Currency * <span className="text-xs">(e.g., BTC)</span>
                    </label>
                    <select
                      value={formData.cryptoBaseCurrency}
                      onChange={(e) => setFormData({ ...formData, cryptoBaseCurrency: e.target.value })}
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-orange-500 ${
                        errors.cryptoBaseCurrency ? 'border-red-500' : 'border-orange-200'
                      }`}
                    >
                      <option value="">Select Coin</option>
                      {BINANCE_COINS.map(coin => (
                        <option key={coin} value={coin}>{coin}</option>
                      ))}
                    </select>
                    {errors.cryptoBaseCurrency && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.cryptoBaseCurrency}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Quote Currency * <span className="text-xs">(e.g., USDT)</span>
                    </label>
                    <select
                      value={formData.cryptoQuoteCurrency}
                      onChange={(e) => setFormData({ ...formData, cryptoQuoteCurrency: e.target.value })}
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-orange-500 ${
                        errors.cryptoQuoteCurrency ? 'border-red-500' : 'border-orange-200'
                      }`}
                    >
                      {BINANCE_QUOTE_CURRENCIES.map(currency => (
                        <option key={currency.value} value={currency.value}>
                          {currency.label}
                        </option>
                      ))}
                    </select>
                    {errors.cryptoQuoteCurrency && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.cryptoQuoteCurrency}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Exchange <span className="text-xs">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.cryptoExchange}
                      onChange={(e) => setFormData({ ...formData, cryptoExchange: e.target.value })}
                      className="w-full px-4 py-2.5 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500"
                      placeholder="Binance, Coinbase"
                    />
                  </div>
                </div>

                <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                  <p className="text-xs text-orange-900">
                    <strong>💡 Trading Pair Preview:</strong>{' '}
                    <code className="px-2 py-1 bg-white rounded font-mono font-bold">
                      {getBinancePreview()}
                    </code>
                    {formData.cryptoExchange && (
                      <> from <strong>{formData.cryptoExchange}</strong></>
                    )}
                  </p>
                </div>

                {/* ✅ NEW: Warning if USD is selected */}
                {formData.cryptoQuoteCurrency === 'USD' && (
                  <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                    <p className="text-xs text-yellow-800 flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <strong>⚠️ USD selected:</strong> Backend will auto-map to USDT for Binance compatibility.
                    </p>
                  </div>
                )}

                {/* Optional: Custom Realtime DB Path for Crypto */}
                <div className="mt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    <Info className="w-4 h-4 inline mr-1" />
                    Custom Realtime DB Path <span className="text-xs font-normal">(Optional - auto-generated if empty)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.realtimeDbPath}
                    onChange={(e) => setFormData({ ...formData, realtimeDbPath: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-orange-200 rounded-xl focus:outline-none focus:border-orange-500"
                    placeholder="/crypto/btc_usd (optional)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for auto-generated path: /crypto/{formData.cryptoBaseCurrency.toLowerCase() || 'base'}_{formData.cryptoQuoteCurrency === 'USD' ? 'usdt' : formData.cryptoQuoteCurrency.toLowerCase() || 'quote'}
                  </p>
                </div>
              </div>

              {/* Data Source - LOCKED for crypto */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Data Source</h3>
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">🪙</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Binance API</p>
                      <p className="text-sm text-gray-600">
                        Real-time cryptocurrency prices via Backend (locked for crypto assets)
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-900">
                      <strong>💡 Data Flow:</strong> Binance API → Backend → Realtime Database → Frontend
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            // NORMAL ASSET CONFIGURATION
            <>
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
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:outline-none focus:border-purple-500 ${
                        errors.dataSource ? 'border-red-500' : 'border-gray-200'
                      }`}
                    >
                      {availableDataSources.map(source => (
                        <option key={source.value} value={source.value}>
                          {source.label}
                        </option>
                      ))}
                    </select>
                    {errors.dataSource && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.dataSource}
                      </p>
                    )}
                  </div>

                  {formData.dataSource === 'realtime_db' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Firebase Realtime DB Path *
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
                        ✅ Example: <code className="bg-gray-100 px-1 rounded">/idx_stc</code> (do NOT include /current_price)
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

                  {formData.dataSource === 'mock' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-blue-900">
                        <strong>🎲 Mock/Simulator Mode:</strong> Prices will be simulated using the settings below.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-900">
                    <strong>💡 Data Flow:</strong> Trading Simulator → Realtime Database → Frontend
                  </p>
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
            </>
          )}

          {/* Trading Settings - COMMON FOR BOTH */}
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
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Allowed Durations *
                {hasUltraFast && (
                  <span className="ml-2 text-xs text-yellow-600 font-semibold">
                    ⚡ Ultra-Fast Mode Active
                  </span>
                )}
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_DURATIONS.map((duration) => {
                  const isSelected = formData.allowedDurations.includes(duration.value)
                  return (
                    <button
                      key={duration.value}
                      type="button"
                      onClick={() => toggleDuration(duration.value)}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all border-2 ${
                        isSelected
                          ? duration.isUltraFast
                            ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-500 shadow-lg'
                            : 'bg-purple-500 text-white border-purple-500'
                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {duration.isUltraFast && <Zap className="w-4 h-4 inline mr-1" />}
                      {duration.shortLabel}
                    </button>
                  )
                })}
              </div>
              {errors.allowedDurations && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.allowedDurations}
                </p>
              )}
              {hasUltraFast && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>⚡ Ultra-Fast Trading:</strong> 1-second orders require high-frequency data updates. 
                    {formData.category === 'crypto' 
                      ? ' Binance API provides real-time updates.' 
                      : ' Ensure simulator is running with 1s update interval.'
                    }
                  </p>
                </div>
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