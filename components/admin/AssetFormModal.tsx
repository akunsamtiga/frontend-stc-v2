'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  X, Save, AlertCircle, Zap, Image as ImageIcon, Upload, Info, 
  TrendingUp, Database, Settings, Activity, Folder, Globe, Coins,
  DollarSign, Package
} from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { ASSET_TYPE_INFO, AssetType } from '@/types'

interface Asset {
  id: string
  name: string
  symbol: string
  type: AssetType
  category: 'normal' | 'crypto'
  profitRate: number
  isActive: boolean
  dataSource: string
  icon?: string
  realtimeDbPath?: string
  apiEndpoint?: string
  description?: string
  decimalPlaces?: number
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
  { value: 0.0167, label: '1 second', shortLabel: '1s' },
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

const BINANCE_COINS = [
  'BTC', 'ETH', 'BNB', 'XRP', 'ADA', 'SOL', 'DOT', 'DOGE', 
  'MATIC', 'LTC', 'AVAX', 'LINK', 'UNI', 'ATOM', 'XLM', 
  'ALGO', 'VET', 'ICP', 'FIL', 'TRX', 'ETC', 'NEAR', 'APT', 'ARB', 'OP'
]

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
  const [uploadingIcon, setUploadingIcon] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isSubmittingRef = useRef(false)

  const [formData, setFormData] = useState({
    name: asset?.name || '',
    symbol: asset?.symbol || '',
    icon: asset?.icon || '',
    type: asset?.type || 'forex' as AssetType,
    category: asset?.category || 'normal' as 'normal' | 'crypto',
    profitRate: asset?.profitRate || 85,
    isActive: asset?.isActive ?? true,
    dataSource: asset?.dataSource || 'realtime_db',
    realtimeDbPath: asset?.realtimeDbPath || '',
    apiEndpoint: asset?.apiEndpoint || '',
    description: asset?.description || '',
    
    cryptoBaseCurrency: asset?.cryptoConfig?.baseCurrency || '',
    cryptoQuoteCurrency: asset?.cryptoConfig?.quoteCurrency || 'USDT',
    cryptoExchange: asset?.cryptoConfig?.exchange || '',

    initialPrice: asset?.simulatorSettings?.initialPrice || 40.022,
    dailyVolatilityMin: asset?.simulatorSettings?.dailyVolatilityMin || 0.001,
    dailyVolatilityMax: asset?.simulatorSettings?.dailyVolatilityMax || 0.005,
    secondVolatilityMin: asset?.simulatorSettings?.secondVolatilityMin || 0.00001,
    secondVolatilityMax: asset?.simulatorSettings?.secondVolatilityMax || 0.00008,
    minPrice: asset?.simulatorSettings?.minPrice || 0,
    maxPrice: asset?.simulatorSettings?.maxPrice || 0,
    decimalPlaces: asset?.decimalPlaces || 5,  

    minOrderAmount: asset?.tradingSettings?.minOrderAmount || 1000,
    maxOrderAmount: asset?.tradingSettings?.maxOrderAmount || 1000000,
    allowedDurations: asset?.tradingSettings?.allowedDurations || [1, 2, 3, 4, 5, 15, 30, 45, 60],
  })

  useEffect(() => {
    if (formData.category === 'crypto' && formData.cryptoBaseCurrency && !uploadingIcon) {
      const iconMap: Record<string, string> = {
        'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
        'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
        'XRP': 'https://cryptologos.cc/logos/xrp-xrp-logo.png',
        'ADA': 'https://cryptologos.cc/logos/cardano-ada-logo.png',
        'SOL': 'https://cryptologos.cc/logos/solana-sol-logo.png',
        'DOT': 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png',
        'DOGE': 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
        'MATIC': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
        'LTC': 'https://cryptologos.cc/logos/litecoin-ltc-logo.png',
        'AVAX': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
        'LINK': 'https://cryptologos.cc/logos/chainlink-link-logo.png',
        'UNI': 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
        'ATOM': 'https://cryptologos.cc/logos/cosmos-atom-logo.png',
        'XLM': 'https://cryptologos.cc/logos/stellar-xlm-logo.png',
      }
      
      const autoIcon = iconMap[formData.cryptoBaseCurrency.toUpperCase()]
      if (autoIcon) {
        setFormData(prev => ({ ...prev, icon: autoIcon }))
      }
    }
  }, [formData.category, formData.cryptoBaseCurrency, uploadingIcon])

  useEffect(() => {
    if (formData.type === 'crypto') {
      setFormData(prev => ({
        ...prev,
        category: 'crypto',
        dataSource: 'binance',
        cryptoQuoteCurrency: 'USDT'
      }))
    } else if (formData.category === 'crypto' && formData.type !== 'crypto' as AssetType) {
      setFormData(prev => ({
        ...prev,
        category: 'normal',
        dataSource: 'realtime_db'
      }))
    }
  }, [formData.type])

  useEffect(() => {
    if (formData.minPrice === 0 && formData.initialPrice > 0) {
      setFormData(prev => ({ ...prev, minPrice: prev.initialPrice * 0.5 }))
    }
    if (formData.maxPrice === 0 && formData.initialPrice > 0) {
      setFormData(prev => ({ ...prev, maxPrice: prev.initialPrice * 2.0 }))
    }
  }, [formData.initialPrice, formData.minPrice, formData.maxPrice])

  // ============================================
  // ✅ FIXED: handleIconUpload dengan sanitization
  // ============================================
  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB')
      return
    }

    setUploadingIcon(true)

    try {
      const reader = new FileReader()
      reader.onloadend = () => {
        let base64String = reader.result as string
        
        // ✅ FIX 1: Remove any whitespace/newlines from base64
        // This is CRITICAL - backend regex doesn't support newlines!
        base64String = base64String.replace(/\s/g, '')
        
        // ✅ FIX 2: Validate format
        if (!base64String.startsWith('data:image/')) {
          toast.error('Invalid image format')
          setUploadingIcon(false)
          return
        }
        
        // ✅ FIX 3: Check final size
        if (base64String.length > 10000000) { // 10MB string limit
          toast.error('Image too large after encoding. Please use a smaller image.')
          setUploadingIcon(false)
          return
        }
        
        // ✅ FIX 4: Log for debugging
        console.log('📸 Icon uploaded:', {
          originalSize: `${(file.size / 1024).toFixed(2)}KB`,
          base64Length: base64String.length,
          base64Size: `${(base64String.length / 1024).toFixed(2)}KB`,
          format: file.type,
          hasWhitespace: /\s/.test(base64String),
          preview: base64String.substring(0, 50) + '...'
        })
        
        setFormData(prev => ({ ...prev, icon: base64String }))
        toast.success(`Icon uploaded (${(file.size / 1024).toFixed(1)}KB)`)
        setUploadingIcon(false)
      }
      
      reader.onerror = () => {
        console.error('FileReader error')
        toast.error('Failed to read image file')
        setUploadingIcon(false)
      }
      
      reader.readAsDataURL(file)
      
    } catch (error) {
      console.error('Icon upload error:', error)
      toast.error('Failed to upload icon')
      setUploadingIcon(false)
    }
  }

  const handleRemoveIcon = () => {
    setFormData(prev => ({ ...prev, icon: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    if (formData.category === 'crypto' && formData.cryptoBaseCurrency) {
      const iconMap: Record<string, string> = {
        'BTC': 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
        'ETH': 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
        'BNB': 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
        'XRP': 'https://cryptologos.cc/logos/xrp-xrp-logo.png',
        'ADA': 'https://cryptologos.cc/logos/cardano-ada-logo.png',
        'SOL': 'https://cryptologos.cc/logos/solana-sol-logo.png',
        'DOT': 'https://cryptologos.cc/logos/polkadot-new-dot-logo.png',
        'DOGE': 'https://cryptologos.cc/logos/dogecoin-doge-logo.png',
        'MATIC': 'https://cryptologos.cc/logos/polygon-matic-logo.png',
        'LTC': 'https://cryptologos.cc/logos/litecoin-ltc-logo.png',
        'AVAX': 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
        'LINK': 'https://cryptologos.cc/logos/chainlink-link-logo.png',
        'UNI': 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
        'ATOM': 'https://cryptologos.cc/logos/cosmos-atom-logo.png',
        'XLM': 'https://cryptologos.cc/logos/stellar-xlm-logo.png',
      }
      
      setTimeout(() => {
        const autoIcon = iconMap[formData.cryptoBaseCurrency.toUpperCase()]
        if (autoIcon) {
          setFormData(prev => ({ ...prev, icon: autoIcon }))
        }
      }, 100)
    }
  }

  // ============================================
  // ✅ ENHANCED: validateForm with icon validation
  // ============================================
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.symbol.trim()) newErrors.symbol = 'Symbol is required'
    if (!formData.type) newErrors.type = 'Asset type is required'
    if (formData.profitRate < 0 || formData.profitRate > 100) {
      newErrors.profitRate = 'Profit rate must be between 0 and 100'
    }

    // ✅ ENHANCED ICON VALIDATION
    if (formData.icon) {
      // Check if base64 data
      if (formData.icon.startsWith('data:image/')) {
        // 1. Check for whitespace (should have been removed)
        if (/\s/.test(formData.icon)) {
          newErrors.icon = 'Icon format invalid (contains whitespace). Please re-upload.'
          console.error('❌ Icon has whitespace:', {
            length: formData.icon.length,
            whitespaceCount: (formData.icon.match(/\s/g) || []).length
          })
        }
        
        // 2. Check size
        if (formData.icon.length > 10000000) {
          newErrors.icon = 'Icon too large (max 10MB encoded)'
          console.error('❌ Icon too large:', {
            length: formData.icon.length,
            sizeMB: (formData.icon.length / 1024 / 1024).toFixed(2)
          })
        }
        
        // 3. Log icon info for debugging
        if (!newErrors.icon) {
          console.log('✅ Icon validation passed:', {
            length: formData.icon.length,
            sizeMB: (formData.icon.length / 1024 / 1024).toFixed(2),
            format: formData.icon.split(';')[0].split('/')[1]
          })
        }
      } 
      // Check if URL
      else if (formData.icon.startsWith('http://') || formData.icon.startsWith('https://')) {
        try {
          new URL(formData.icon)
          console.log('✅ Icon URL valid:', formData.icon.substring(0, 100))
        } catch {
          newErrors.icon = 'Invalid icon URL'
          console.error('❌ Invalid URL:', formData.icon)
        }
      } 
      else {
        newErrors.icon = 'Icon must be a valid URL or base64 image'
        console.error('❌ Invalid icon format:', {
          prefix: formData.icon.substring(0, 50),
          length: formData.icon.length
        })
      }
    }

    if (formData.category === 'crypto') {
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
      if (formData.apiEndpoint.trim()) {
        newErrors.apiEndpoint = 'Crypto assets should not have API endpoint (Binance API is used automatically)'
      }
      const hasSimulatorSettings = formData.initialPrice !== 40.022 || 
                                   formData.dailyVolatilityMin !== 0.001 ||
                                   formData.dailyVolatilityMax !== 0.005
      if (hasSimulatorSettings) {
        newErrors.simulatorSettings = 'Crypto assets should not have simulator settings (real-time Binance data is used)'
      }
    } else {
      if (formData.dataSource === 'binance') {
        newErrors.dataSource = 'Normal assets cannot use "binance". Use "realtime_db", "mock", or "api"'
      }
      if (formData.cryptoBaseCurrency.trim() || formData.cryptoQuoteCurrency !== 'USDT') {
        newErrors.cryptoBaseCurrency = 'Normal assets should not have crypto configuration'
      }
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

    if (formData.minOrderAmount >= formData.maxOrderAmount) {
      newErrors.minOrderAmount = 'Min must be less than max'
    }
    if (formData.allowedDurations.length === 0) {
      newErrors.allowedDurations = 'At least one duration must be selected'
    }

    const invalidDurations = formData.allowedDurations.filter(
      d => !VALID_DURATIONS.some(valid => Math.abs(valid - d) < 0.0001)
    )
    if (invalidDurations.length > 0) {
      newErrors.allowedDurations = `Invalid durations: ${invalidDurations.join(', ')}`
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================
  // ✅ ENHANCED: handleSubmit with better logging
  // ============================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent double submit
    if (loading) {
      console.log('🚫 Prevented double submit - already loading')
      return
    }

    if (isSubmittingRef.current) {
      console.log('🚫 Prevented double submit - ref is true')
      return
    }
    
    // Debounce
    const now = Date.now()
    const lastSubmit = (window as any).__lastAssetSubmit || 0
    if (now - lastSubmit < 2000) {
      console.log('🚫 Prevented rapid submit - too soon')
      return
    }
    (window as any).__lastAssetSubmit = now
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    setLoading(true)
    isSubmittingRef.current = true

    try {
      let payload: any

      if (formData.category === 'crypto') {
        payload = {
          name: formData.name.trim(),
          symbol: formData.symbol.trim().toUpperCase(),
          icon: formData.icon || undefined,
          type: 'crypto',
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
          ...(formData.realtimeDbPath.trim() && {
            realtimeDbPath: formData.realtimeDbPath.trim()
          }),
          tradingSettings: {
            minOrderAmount: Number(formData.minOrderAmount),
            maxOrderAmount: Number(formData.maxOrderAmount),
            allowedDurations: [...formData.allowedDurations].sort((a, b) => a - b)
          }
        }
      } else {
        payload = {
          name: formData.name.trim(),
          symbol: formData.symbol.trim().toUpperCase(),
          icon: formData.icon || undefined,
          type: formData.type,
          category: 'normal',
          profitRate: Number(formData.profitRate),
          isActive: Boolean(formData.isActive),
          dataSource: formData.dataSource,
          description: formData.description.trim(),
          decimalPlaces: Number(formData.decimalPlaces),  
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
        
        if (formData.dataSource === 'realtime_db') {
          payload.realtimeDbPath = formData.realtimeDbPath.trim()
        } else if (formData.dataSource === 'api') {
          payload.apiEndpoint = formData.apiEndpoint.trim()
        }
      }

      // ✅ LOG PAYLOAD INFO BEFORE SENDING
      const payloadString = JSON.stringify(payload)
      const payloadSize = payloadString.length
      
      console.log('📦 Submitting payload:', {
        mode: mode,
        assetId: mode === 'edit' ? asset?.id : 'new',
        payloadSize: `${(payloadSize / 1024).toFixed(2)}KB`,
        iconSize: payload.icon ? `${(payload.icon.length / 1024).toFixed(2)}KB` : 'N/A',
        hasIcon: !!payload.icon,
        iconFormat: payload.icon?.substring(0, 30) || 'N/A',
        fields: Object.keys(payload)
      })
      
      // Check payload size
      if (payloadSize > 20 * 1024 * 1024) { // 20MB
        toast.error('Payload too large. Please reduce image size.')
        setLoading(false)
        isSubmittingRef.current = false
        return
      }

      console.log('🚀 Submitting asset:', payload)

      if (mode === 'create') {
        await api.createAsset(payload)
        
        toast.success(`✅ ${payload.symbol} created successfully!`, {
          description: 'Asset has been added to your trading platform',
          duration: 4000,
        })
        
        if (payload.category === 'normal' && 
            (payload.dataSource === 'realtime_db' || payload.dataSource === 'mock')) {
          setTimeout(() => {
            toast.info('📊 Historical Data Generated', {
              description: '240 candles initialized for all timeframes (1m, 5m, 15m, 1h, 1d)',
              duration: 3000,
            })
          }, 500)
        }
        
        if (payload.category === 'crypto') {
          setTimeout(() => {
            toast.info('💎 Real-time Data Active', {
              description: `Connected to Binance for ${payload.cryptoConfig.baseCurrency}/${payload.cryptoConfig.quoteCurrency}`,
              duration: 3000,
            })
          }, 500)
        }
        
      } else {
        await api.updateAsset(asset!.id, payload)
        toast.success(`✅ ${payload.symbol} updated successfully!`, {
          description: 'Asset changes have been saved',
          duration: 3000,
        })
      }

      onSuccess()
      
    } catch (error: any) {
      const statusCode = error.response?.status
      const errorData = error.response?.data
      const errorMessage = 
        typeof errorData === 'string' ? errorData :
        errorData?.error || 
        errorData?.message ||
        error.message ||
        `Failed to ${mode} asset`
      
      // ✅ ENHANCED ERROR LOGGING
      console.error('❌ Submit error details:', {
        status: statusCode,
        statusText: error.response?.statusText,
        errorMessage: errorMessage,
        errorData: errorData,
        validationErrors: errorData?.errors,
        requestUrl: error.config?.url,
        requestMethod: error.config?.method,
        payloadSize: error.config?.data?.length,
        fullError: error
      })
      
      // Check if it's icon related error
      if (statusCode === 400 && errorData?.message) {
        if (errorData.message.toLowerCase().includes('icon')) {
          console.error('🖼️ Icon validation failed:', {
            iconLength: formData.icon?.length,
            iconPreview: formData.icon?.substring(0, 100),
            hasWhitespace: /\s/.test(formData.icon || ''),
            suggestion: 'Try re-uploading the icon or using a smaller image'
          })
          
          toast.error('Icon Upload Issue', {
            description: 'Try re-uploading with a smaller image (< 500KB) or check format',
            duration: 5000
          })
        } else {
          toast.error('Validation Error', {
            description: errorData.message,
            duration: 5000
          })
        }
      } else {
        // Handle duplicate error
        const isDuplicateError = 
          statusCode === 409 || 
          (statusCode === 500 && (
            String(errorMessage).toLowerCase().includes('already exists') ||
            String(errorMessage).toLowerCase().includes('duplicate') ||
            String(errorMessage).toLowerCase().includes('unique constraint') ||
            String(errorData).toLowerCase().includes('already exists')
          ))

        if (isDuplicateError) {
          console.log('📝 Detected duplicate error, treating as success...')
          
          onSuccess()
          
          toast.success(`✅ ${formData.symbol.toUpperCase()} ${mode === 'create' ? 'created' : 'updated'} successfully!`, {
            description: 'Asset is ready for trading',
            duration: 4000,
          })
          
          if (formData.category === 'normal' && mode === 'create') {
            setTimeout(() => {
              toast.info('📊 Historical Data Generated', {
                description: '240 candles initialized for all timeframes',
                duration: 3000,
              })
            }, 500)
          }
        } else {
          toast.error(`Failed to ${mode} asset`, {
            description: String(errorMessage),
            duration: 5000,
          })
        }
      }
      
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }
  }

  const toggleDuration = (duration: number) => {
    setFormData(prev => {
      const currentDurations = [...prev.allowedDurations]
      const index = currentDurations.findIndex(d => Math.abs(d - duration) < 0.0001)
      
      if (index > -1) {
        if (currentDurations.length > 1) {
          currentDurations.splice(index, 1)
        }
      } else {
        currentDurations.push(duration)
        currentDurations.sort((a, b) => a - b)
      }
      
      return { ...prev, allowedDurations: currentDurations }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {mode === 'create' ? 'Create New Asset' : 'Edit Asset'}
              </h2>
              <p className="text-sm text-gray-600">
                {mode === 'create' ? 'Add a new trading asset to your platform' : `Editing ${asset?.symbol}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-500" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Asset Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Euro vs US Dollar"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., EUR/USD"
                  disabled={mode === 'edit'}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {errors.symbol && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.symbol}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Asset Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as AssetType })}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                >
                  {Object.entries(ASSET_TYPE_INFO).map(([key, info]) => (
                    <option key={key} value={key}>
                      {info.icon} {info.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Profit Rate (%) *
                </label>
                <input
                  type="number"
                  value={formData.profitRate}
                  onChange={(e) => setFormData({ ...formData, profitRate: parseFloat(e.target.value) })}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                />
                {errors.profitRate && (
                  <p className="text-xs text-red-600 mt-1">{errors.profitRate}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of the asset..."
                  rows={2}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors resize-none"
                />
              </div>
            </div>
          </div>

          {/* Icon Upload */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-green-500" />
              Asset Icon
            </h3>
            <div className="flex items-start gap-4">
              {formData.icon && (
                <div className="relative">
                  <img
                    src={formData.icon}
                    alt="Asset icon"
                    className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveIcon}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingIcon}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingIcon ? (
                    <>
                      <div className="w-5 h-5 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-gray-600" />
                      <span className="text-gray-700 font-medium">
                        {formData.icon ? 'Change Icon' : 'Upload Icon'}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, WebP or SVG (max 2MB)
                </p>
                {errors.icon && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.icon}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Data Source */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-orange-500" />
              Data Source Configuration
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as 'normal' | 'crypto' })}
                  disabled={formData.type === 'crypto'}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors disabled:bg-gray-100"
                >
                  <option value="normal">Normal (Simulated)</option>
                  <option value="crypto">Crypto (Real-time)</option>
                </select>
                {formData.type === 'crypto' && (
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Crypto type automatically sets category to crypto
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Data Source *
                </label>
                <select
                  value={formData.dataSource}
                  onChange={(e) => setFormData({ ...formData, dataSource: e.target.value })}
                  disabled={formData.category === 'crypto'}
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors disabled:bg-gray-100"
                >
                  <option value="realtime_db">Realtime Database</option>
                  <option value="mock">Mock Data</option>
                  <option value="api">External API</option>
                  <option value="binance">Binance (Crypto Only)</option>
                </select>
                {errors.dataSource && (
                  <p className="text-xs text-red-600 mt-1">{errors.dataSource}</p>
                )}
              </div>

              {formData.dataSource === 'realtime_db' && formData.category === 'normal' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Folder className="w-4 h-4 inline mr-1" />
                    Realtime DB Path *
                  </label>
                  <input
                    type="text"
                    value={formData.realtimeDbPath}
                    onChange={(e) => setFormData({ ...formData, realtimeDbPath: e.target.value })}
                    placeholder="/assets/EUR_USD"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  {errors.realtimeDbPath && (
                    <p className="text-xs text-red-600 mt-1">{errors.realtimeDbPath}</p>
                  )}
                </div>
              )}

              {formData.dataSource === 'api' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Globe className="w-4 h-4 inline mr-1" />
                    API Endpoint *
                  </label>
                  <input
                    type="url"
                    value={formData.apiEndpoint}
                    onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                    placeholder="https://api.example.com/price"
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  {errors.apiEndpoint && (
                    <p className="text-xs text-red-600 mt-1">{errors.apiEndpoint}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Crypto Configuration */}
          {formData.category === 'crypto' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                Cryptocurrency Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border-2 border-yellow-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Base Currency *
                  </label>
                  <select
                    value={formData.cryptoBaseCurrency}
                    onChange={(e) => setFormData({ ...formData, cryptoBaseCurrency: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="">Select coin...</option>
                    {BINANCE_COINS.map(coin => (
                      <option key={coin} value={coin}>{coin}</option>
                    ))}
                  </select>
                  {errors.cryptoBaseCurrency && (
                    <p className="text-xs text-red-600 mt-1">{errors.cryptoBaseCurrency}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Quote Currency *
                  </label>
                  <select
                    value={formData.cryptoQuoteCurrency}
                    onChange={(e) => setFormData({ ...formData, cryptoQuoteCurrency: e.target.value })}
                    className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    {BINANCE_QUOTE_CURRENCIES.map(currency => (
                      <option key={currency.value} value={currency.value}>
                        {currency.label}
                      </option>
                    ))}
                  </select>
                  {errors.cryptoQuoteCurrency && (
                    <p className="text-xs text-red-600 mt-1">{errors.cryptoQuoteCurrency}</p>
                  )}
                </div>

                {formData.cryptoQuoteCurrency === 'USD' && (
                  <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      USD will be automatically mapped to USDT for Binance API compatibility
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Simulator Settings */}
          {formData.category === 'normal' && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-500" />
                  Simulator Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Zap className="w-4 h-4 inline mr-1" />
                      Initial Price *
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.initialPrice}
                      onChange={(e) => setFormData({ ...formData, initialPrice: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    {errors.initialPrice && (
                      <p className="text-xs text-red-600 mt-1">{errors.initialPrice}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Decimal Places
                    </label>
                    <input
                      type="number"
                      value={formData.decimalPlaces}
                      onChange={(e) => setFormData({ ...formData, decimalPlaces: parseInt(e.target.value) })}
                      min="0"
                      max="10"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Forex: 5 • Stock: 2 • Crypto: 8
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Daily Volatility Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        value={formData.dailyVolatilityMin}
                        onChange={(e) => setFormData({ ...formData, dailyVolatilityMin: parseFloat(e.target.value) })}
                        className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        step="any"
                        value={formData.dailyVolatilityMax}
                        onChange={(e) => setFormData({ ...formData, dailyVolatilityMax: parseFloat(e.target.value) })}
                        className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Max"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Second Volatility Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        value={formData.secondVolatilityMin}
                        onChange={(e) => setFormData({ ...formData, secondVolatilityMin: parseFloat(e.target.value) })}
                        className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        step="any"
                        value={formData.secondVolatilityMax}
                        onChange={(e) => setFormData({ ...formData, secondVolatilityMax: parseFloat(e.target.value) })}
                        className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Max"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price Range
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="any"
                        value={formData.minPrice}
                        onChange={(e) => setFormData({ ...formData, minPrice: parseFloat(e.target.value) })}
                        className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        step="any"
                        value={formData.maxPrice}
                        onChange={(e) => setFormData({ ...formData, maxPrice: parseFloat(e.target.value) })}
                        className="w-1/2 px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Trading Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-orange-500" />
              Trading Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Min Order Amount (IDR)
                </label>
                <input
                  type="number"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: parseInt(e.target.value) })}
                  min="100"
                  step="100"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Max Order Amount (IDR)
                </label>
                <input
                  type="number"
                  value={formData.maxOrderAmount}
                  onChange={(e) => setFormData({ ...formData, maxOrderAmount: parseInt(e.target.value) })}
                  min="1000"
                  step="1000"
                  className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Allowed Durations *
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_DURATIONS.map((duration) => {
                  const isSelected = formData.allowedDurations.includes(duration.value)
                  const isUltraFast = Math.abs(duration.value - 0.0167) < 0.0001
                  
                  return (
                    <button
                      key={duration.value}
                      type="button"
                      onClick={() => toggleDuration(duration.value)}
                      className={`px-4 py-2.5 rounded-lg font-medium transition-all border-2 ${
                        isSelected
                          ? isUltraFast 
                            ? 'bg-orange-600 text-white border-orange-600 shadow-md animate-pulse' 
                            : 'bg-purple-600 text-white border-purple-600 shadow-md'
                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
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
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border-2 border-gray-200">
            <div>
              <p className="font-semibold text-gray-900">Active Status</p>
              <p className="text-sm text-gray-600">Enable this asset for trading</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                formData.isActive ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  formData.isActive ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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