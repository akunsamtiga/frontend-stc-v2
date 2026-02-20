'use client'

import React, { useEffect, useState, useCallback, memo, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { unstable_batchedUpdates } from 'react-dom'
import { useAuthStore } from '@/store/auth'
import { useTradingStore, useSelectedAsset, useCurrentPrice, useSelectedAccountType, useTradingActions } from '@/store/trading'
import { api } from '@/lib/api'
import { prefetchDefaultAsset, prefetchMultipleTimeframes } from '@/lib/firebase'
import { toast } from 'sonner'
import { Asset, BinaryOrder, AccountType, UserProfile, STATUS_CONFIG } from '@/types'
import { calculateStatusProgress, formatDepositRequirement } from '@/lib/status-utils'
import { formatCurrency, getDurationDisplay } from '@/lib/utils'
import dynamic from 'next/dynamic'
import TradingTutorial from '@/components/TradingTutorial'
import AssetIcon from '@/components/common/AssetIcon'
import BalanceDisplay from '@/components/BalanceDisplay'
import { 
  ArrowUp,
  ArrowDown,
  Clock,
  Wallet,
  History,
  Settings,
  LogOut,
  ChevronDown,
  X,
  Menu,
  Minus,
  Plus,
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  Activity,
  Logs,
  Zap,
  Info,
  Calendar,
  Trophy,
  Award,
  Newspaper,
  MessageCircle,
  Search,
  CalendarClock,
  UserPlus,
} from 'lucide-react'
import OrderNotification from '@/components/OrderNotification'
import { useWebSocket, usePriceSubscription, useOrderSubscription } from '@/components/providers/WebSocketProvider'
import { CalculationUtil } from '@/lib/calculation'
import { TimezoneUtil } from '@/lib/timezone'
import { useOptimisticOrders, useAggressiveResultPolling } from '@/hooks/useInstantOrders'
import { useOrderResultNotification } from '@/hooks/useBatchNotification'
import InformationBanner from '@/components/InformationBanner'
import StatusBadge from '@/components/StatusBadge'

const TradingChart = dynamic(() => import('@/components/TradingChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#0a0e17]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
        <div className="text-sm text-gray-400">Loading chart...</div>
      </div>
    </div>
  )
})

const HistorySidebar = dynamic(() => import('@/components/HistorySidebar'), {
  ssr: false
})

const EXTENDED_DURATIONS = [
  { value: 1, label: '1 menit', shortLabel: '1m' },
  { value: 2, label: '2 menit', shortLabel: '2m' },
  { value: 3, label: '3 menit', shortLabel: '3m' },
  { value: 4, label: '4 menit', shortLabel: '4m' },
  { value: 5, label: '5 menit', shortLabel: '5m' },
  { value: 10, label: '10 menit', shortLabel: '10m' },
  { value: 15, label: '15 menit', shortLabel: '15m' },
  { value: 30, label: '30 menit', shortLabel: '30m' },
  { value: 45, label: '45 menit', shortLabel: '45m' },
  { value: 60, label: '1 jam', shortLabel: '60m' },
]

// ============================================================================
// ✅ NEW: HELPER FUNCTIONS FOR MIN/MAX ORDER VALIDATION
// ============================================================================

/**
 * Get min/max order limits from asset tradingSettings
 * Falls back to default values if tradingSettings not available
 */
const getOrderLimits = (asset: Asset | null) => {
  const defaultMin = 10000
  const defaultMax = 10000000
  
  if (!asset?.tradingSettings) {
    return { min: defaultMin, max: defaultMax }
  }
  
  const min = asset.tradingSettings.minOrderAmount ?? defaultMin
  const max = asset.tradingSettings.maxOrderAmount ?? defaultMax
  
  return { min, max }
}

/**
 * Generate preset amounts based on min/max limits
 * Returns array of reasonable increment values between min and max
 */
const generatePresetAmounts = (min: number, max: number): number[] => {
  const presets: number[] = []
  
  // Start from min
  presets.push(min)
  
  // Generate reasonable increments
  const increments = [
    min * 2.5,
    min * 5,
    min * 7.5,
    min * 10,
    min * 25,
    min * 50,
    min * 100,
  ]
  
  increments.forEach(amount => {
    if (amount > min && amount <= max && !presets.includes(amount)) {
      presets.push(Math.floor(amount))
    }
  })
  
  // Always add max if not already included
  if (!presets.includes(max)) {
    presets.push(max)
  }
  
  // Sort and return unique values, limit to 8 presets
  return Array.from(new Set(presets)).sort((a, b) => a - b).slice(0, 8)
}

// ============================================================================
// ✅ MODIFIED: ASSET TYPE FILTER WITHOUT ICONS
// ============================================================================

type AssetTypeFilter = 'all' | 'forex' | 'crypto' | 'stock' | 'commodity' | 'index'

const ASSET_TYPE_META: Record<AssetTypeFilter, {
  label: string
  activeBg: string
  activeBorder: string
  activeText: string
}> = {
  all:       { label: 'Semua',     activeBg: 'bg-slate-600',       activeBorder: 'border-slate-400',   activeText: 'text-white'       },
  forex:     { label: 'Forex',     activeBg: 'bg-blue-500/30',     activeBorder: 'border-blue-400',    activeText: 'text-blue-300'    },
  crypto:    { label: 'Crypto',    activeBg: 'bg-orange-500/30',   activeBorder: 'border-orange-400',  activeText: 'text-orange-300'  },
  stock:     { label: 'Stocks',    activeBg: 'bg-emerald-500/30',  activeBorder: 'border-emerald-400', activeText: 'text-emerald-300' },
  commodity: { label: 'Komoditas', activeBg: 'bg-yellow-500/30',   activeBorder: 'border-yellow-400',  activeText: 'text-yellow-300'  },
  index:     { label: 'Indeks',    activeBg: 'bg-purple-500/30',   activeBorder: 'border-purple-400',  activeText: 'text-purple-300'  },
}

const TypeFilterChips = memo(({
  activeFilter,
  onFilterChange,
  assetCounts,
  availableTypes,
}: {
  activeFilter: AssetTypeFilter
  onFilterChange: (f: AssetTypeFilter) => void
  assetCounts: Record<string, number>
  availableTypes: AssetTypeFilter[]
}) => {
  const types: AssetTypeFilter[] = ['all', ...availableTypes]
  
  // Bagi chips menjadi 2 baris yang seimbang
  const midPoint = Math.ceil(types.length / 2)
  const row1 = types.slice(0, midPoint)
  const row2 = types.slice(midPoint)

  const renderChip = (type: AssetTypeFilter) => {
    const meta = ASSET_TYPE_META[type]
    const count = type === 'all'
      ? Object.values(assetCounts).reduce((a, b) => a + b, 0)
      : (assetCounts[type] || 0)
    const isActive = activeFilter === type

    return (
      <button
        key={type}
        onClick={(e) => { e.stopPropagation(); onFilterChange(type) }}
        className={`
          flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md
          text-[11px] font-semibold border transition-all duration-150
          ${isActive
            ? `${meta.activeBg} ${meta.activeBorder} ${meta.activeText}`
            : 'bg-[#1a1f2e] border-gray-700/50 text-gray-400 hover:border-gray-500 hover:text-gray-300'
          }
        `}
      >
        <span>{meta.label}</span>
        {count > 0 && (
          <span className={`text-[9px] px-1 py-0.5 rounded ${isActive ? 'bg-white/10' : 'bg-gray-700/60'}`}>
            {count}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        {row1.map(renderChip)}
      </div>
      {row2.length > 0 && (
        <div className="flex gap-1.5">
          {row2.map(renderChip)}
        </div>
      )}
    </div>
  )
})

TypeFilterChips.displayName = 'TypeFilterChips'

// ============================================================================

const formatExpiryTime = (durationMinutes: number): string => {
  const asset = useTradingStore.getState().selectedAsset
  if (!asset) return getDurationDisplay(durationMinutes)
  
  const now = TimezoneUtil.getCurrentTimestamp()
  const timing = CalculationUtil.formatOrderTiming(asset, durationMinutes, now)
  
  // Format waktu dan ganti titik dengan colon
  const formattedTime = TimezoneUtil.formatWIBTime(timing.expiryTimestamp)
  return formattedTime.replace(/\./g, ':')
}

export default function TradingPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [showTutorial, setShowTutorial] = useState(false)

  const selectedAsset = useSelectedAsset()
  const currentPrice = useCurrentPrice()
  const selectedAccountType = useSelectedAccountType()
  const { setSelectedAsset, setCurrentPrice, addPriceToHistory, setSelectedAccountType } = useTradingActions()

  const {
    orders: allOrders,
    confirmedOrders,
    optimisticOrders,
    addOptimisticOrder,
    confirmOrder,
    rollbackOrder,
    updateOrder,
    setAllOrders,
  } = useOptimisticOrders(user?.id)

  const notification = useOrderResultNotification()
  
  const notify = notification.notify

  const notifiedOrderIdsRef = useRef<Set<string>>(new Set())
  const updateOrderRef = useRef(updateOrder)
  const notifyRef = useRef(notify)
  const loadOrdersRef = useRef<() => Promise<void>>(async () => {})
  
  useEffect(() => {
    updateOrderRef.current = updateOrder
    notifyRef.current = notify
  }, [updateOrder, notify])

  const [assets, setAssets] = useState<Asset[]>([])
  const [realBalance, setRealBalance] = useState(0)
  const [demoBalance, setDemoBalance] = useState(0)
  const [amount, setAmount] = useState(10000)
  const [duration, setDuration] = useState(1)
  const [loading, setLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  
  const balanceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const balanceRef = useRef({ real: 0, demo: 0 })
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isPlacingRef = useRef(false) // ✅ Guard sinkron anti double-submit
  // ✅ FIX: Pastikan banner hanya muncul sekali, meski effect re-run karena assets.length berubah
  const bannerShownRef = useRef(false)
  
  const [showAssetMenu, setShowAssetMenu] = useState(false)
  const [isAssetMenuClosing, setIsAssetMenuClosing] = useState(false)
  const [assetSearch, setAssetSearch] = useState('')
  // ✅ Asset type filter state
  const [assetTypeFilter, setAssetTypeFilter] = useState<AssetTypeFilter>('all')
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showHistorySidebar, setShowHistorySidebar] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isMobileMenuClosing, setIsMobileMenuClosing] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [isWalletModalClosing, setIsWalletModalClosing] = useState(false)
  const [showAmountDropdown, setShowAmountDropdown] = useState(false)
  const [showDurationDropdown, setShowDurationDropdown] = useState(false)
  const [showDesktopDurationDropdown, setShowDesktopDurationDropdown] = useState(false)
  const [showLeftSidebar, setShowLeftSidebar] = useState(false)
  const [isLeftSidebarClosing, setIsLeftSidebarClosing] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [btnEffect, setBtnEffect] = useState<'CALL' | 'PUT' | null>(null)

  const triggerBtnEffect = (dir: 'CALL' | 'PUT') => {
    setBtnEffect(null)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setBtnEffect(dir)
        setTimeout(() => setBtnEffect(null), 800)
      })
    })
  }

  const currentBalance = selectedAccountType === 'real' ? realBalance : demoBalance
  const isUltraFastMode = duration === 0.0167

  // ✅ Notif merah jika profil belum 100% complete
  const isProfileIncomplete = (userProfile?.profileInfo?.completion ?? 0) < 100

  // ✅ FIX: Sync balanceRef agar handlePlaceOrder tidak stale closure
  useEffect(() => {
    balanceRef.current = { real: realBalance, demo: demoBalance }
  }, [realBalance, demoBalance])

  const durationDisplay = getDurationDisplay(duration)

  const activeOrders = allOrders.filter(o => o.status === 'ACTIVE' || o.status === 'PENDING')
  const completedOrders = allOrders.filter(o => o.status === 'WON' || o.status === 'LOST')

  const { isConnected, isConnecting, isReconnecting } = useWebSocket()

  // ✅ FIX: Tampilkan toast saat reconnecting tapi TIDAK block tombol
  useEffect(() => {
    if (isReconnecting) {
      toast.loading('Menghubungkan ulang...', { id: 'ws-reconnect', duration: Infinity })
    } else if (isConnected) {
      toast.dismiss('ws-reconnect')
    }
  }, [isReconnecting, isConnected])
  
  const { priceData: wsPrice, lastUpdate: priceLastUpdate } = usePriceSubscription(
    selectedAsset?.id || null,
    true
  )

  const { orderUpdate: wsOrder, lastUpdate: orderLastUpdate } = useOrderSubscription(
    user?.id || null,
    true
  )

  useEffect(() => {
    if (wsPrice && selectedAsset?.id === wsPrice.assetId) {
      setCurrentPrice({
        price: wsPrice.price,
        timestamp: wsPrice.timestamp,
        datetime: wsPrice.datetime,
        change: wsPrice.changePercent24h || 0,
      })
    }
  }, [wsPrice, selectedAsset?.id, setCurrentPrice])

  useEffect(() => {
    if (!wsOrder) return

    if (wsOrder.event === 'order:created') {
      // FIXED: Immediately add the order to the list instead of just reloading
      if (wsOrder.orderData) {
        setAllOrders((prevOrders: BinaryOrder[]) => {
          if (prevOrders.some((o: BinaryOrder) => o.id === wsOrder.id)) {
            return prevOrders
          }
          return [wsOrder.orderData, ...prevOrders]
        })
      }
      loadOrdersRef.current()
    } else if (wsOrder.event === 'order:settled') {
      updateOrderRef.current(wsOrder.id, {
        status: wsOrder.status,
        exit_price: wsOrder.exit_price,
        profit: wsOrder.profit,
      } as any)

      if (!notifiedOrderIdsRef.current.has(wsOrder.id)) {
        notifiedOrderIdsRef.current.add(wsOrder.id)

        api.getOrderById(wsOrder.id).then(response => {
          const fullOrder = response?.data || response
          notifyRef.current(fullOrder)
        })
      }

      loadBalances()
    } else if (wsOrder.event === 'order:updated') {
      // FIXED: Handle order updates (including status changes to ACTIVE)
      if (wsOrder.orderData) {
        setAllOrders((prevOrders: BinaryOrder[]) => {
          const existingIndex = prevOrders.findIndex((o: BinaryOrder) => o.id === wsOrder.id)
          if (existingIndex >= 0) {
            const updated = [...prevOrders]
            updated[existingIndex] = { ...updated[existingIndex], ...wsOrder.orderData }
            return updated
          } else {
            return [wsOrder.orderData, ...prevOrders]
          }
        })
      }
    }
  }, [wsOrder])

  const handlePollingResult = useCallback((resultOrder: BinaryOrder) => {
    updateOrderRef.current(resultOrder.id, resultOrder)
    
    if (!notifiedOrderIdsRef.current.has(resultOrder.id)) {
      notifiedOrderIdsRef.current.add(resultOrder.id)
      notifyRef.current(resultOrder)
    }
    
    if (balanceUpdateTimeoutRef.current) {
      clearTimeout(balanceUpdateTimeoutRef.current)
    }
    
    balanceUpdateTimeoutRef.current = setTimeout(() => {
      loadBalances()
    }, 100)
  }, [])

  useAggressiveResultPolling(activeOrders, handlePollingResult)

  const loadBalances = useCallback(async () => {
    try {
      const res = await api.getBothBalances()
      const balances = res?.data || res
      unstable_batchedUpdates(() => {
        setRealBalance(balances?.realBalance || 0)
        setDemoBalance(balances?.demoBalance || 0)
      })
    } catch (error) {
    }
  }, [])

  const loadUserProfile = useCallback(async () => {
    try {
      const response = await api.getProfile()
      const profile = (response as any)?.data as UserProfile || response as UserProfile
      
      if (profile && 'user' in profile && 'statusInfo' in profile) {
        setUserProfile(profile)
      }
    } catch (error) {
    }
  }, [])

  const loadOrders = useCallback(async () => {
    try {
      const response = await api.getOrders(undefined, 1, 100)
      const orders = response?.data?.orders || response?.orders || []
      setAllOrders(orders)
    } catch (error) {
    }
  }, [setAllOrders])

  // Update ref for use in other effects
  useEffect(() => {
    loadOrdersRef.current = loadOrders
  }, [loadOrders])

  const loadData = useCallback(async () => {
    try {
      const [assetsRes, balancesRes, ordersRes, profileRes] = await Promise.all([
        api.getAssets(true),
        api.getBothBalances(),
        api.getOrders(undefined, 1, 100),
        api.getProfile(),
      ])

      const assetsList = assetsRes?.data?.assets || assetsRes?.assets || []
      const balances = balancesRes?.data || balancesRes
      const allOrders = ordersRes?.data?.orders || ordersRes?.orders || []
      const profile = (profileRes as any)?.data as UserProfile || profileRes as UserProfile

      unstable_batchedUpdates(() => {
        setAssets(assetsList)
        setRealBalance(balances?.realBalance || 0)
        setDemoBalance(balances?.demoBalance || 0)
        setAllOrders(allOrders)
        if (profile && 'user' in profile && 'statusInfo' in profile) {
          setUserProfile(profile)
        }
      })

      if (assetsList.length > 0 && !selectedAsset) {
        setSelectedAsset(assetsList[0])
      }
    } catch (error) {
    }
  }, [selectedAsset, setSelectedAsset, setAllOrders])

  const handleCompleteTutorial = useCallback(async () => {
    try {
      await api.completeTutorial()
      
      const updatedUser = {
        ...user!,
        tutorialCompleted: true,
        isNewUser: false,
      }
      
      useAuthStore.setState({ user: updatedUser })
      setShowTutorial(false)
      toast.success('Tutorial selesai! Selamat trading!')
    } catch (error) {
      setShowTutorial(false)
    }
  }, [user])

  const handleSkipTutorial = useCallback(async () => {
    try {
      await api.completeTutorial()
      
      const updatedUser = {
        ...user!,
        tutorialCompleted: true,
        isNewUser: false,
      }
      
      useAuthStore.setState({ user: updatedUser })
      setShowTutorial(false)
      toast.info('Tutorial dilewati. Akses lagi dari Settings > Show Tutorial')
    } catch (error) {
      setShowTutorial(false)
    }
  }, [user])

  const handleLogout = useCallback(async () => {
    try {
      api.removeToken()
      api.clearCache()
      logout()
      
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
      router.replace('/')
    } catch (error) {
      router.replace('/')
    }
  }, [logout, router])

  const handleCloseWalletModal = useCallback(() => {
    setIsWalletModalClosing(true)
    setTimeout(() => {
      setShowWalletModal(false)
      setIsWalletModalClosing(false)
    }, 250)
  }, [])

  const handleCloseAssetMenu = useCallback(() => {
    setIsAssetMenuClosing(true)
    setTimeout(() => {
      setShowAssetMenu(false)
      setIsAssetMenuClosing(false)
      setAssetSearch('')
      setAssetTypeFilter('all')
    }, 200)
  }, [])

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuClosing(true)
    setTimeout(() => {
      setShowMobileMenu(false)
      setIsMobileMenuClosing(false)
    }, 250)
  }, [])

  const handleCloseLeftSidebar = useCallback(() => {
    setIsLeftSidebarClosing(true)
    setTimeout(() => {
      setShowLeftSidebar(false)
      setIsLeftSidebarClosing(false)
    }, 250)
  }, [])

  // ✅ FIX: Effect init hanya jalan sekali saat user berubah (login/logout)
  // assets.length DIHAPUS dari dependency agar tidak trigger ulang setelah loadData()
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    const initializeData = async () => {
      await loadData()
      
      if (selectedAsset && selectedAsset.realtimeDbPath) {
        let basePath = selectedAsset.realtimeDbPath
        if (basePath.endsWith('/current_price')) {
          basePath = basePath.replace('/current_price', '')
        }
        prefetchDefaultAsset(basePath)
      }

      // ✅ FIX: Guard dengan ref agar banner hanya muncul 1x, tidak ikut re-run effect
      if (!bannerShownRef.current) {
        bannerShownRef.current = true
        setTimeout(() => setShowBanner(true), 600)
      }
    }
    
    initializeData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]) // assets.length sengaja dihapus dari sini

  // ✅ FIX: Sync assets ke TradingStore dipisah ke effect sendiri
  useEffect(() => {
    if (assets.length > 0) {
      useTradingStore.getState().setAssets(assets)
    }
  }, [assets])

  useEffect(() => {
    if (!user) return

    const shouldShowTutorial = 
      user.isNewUser === true ||
      user.tutorialCompleted === false ||
      (user.tutorialCompleted === undefined &&
       typeof user.loginCount === 'number' && 
       user.loginCount <= 2)

    if (shouldShowTutorial) {
      const timer = setTimeout(() => {
        setShowTutorial(true)
      }, 1500)
      
      return () => clearTimeout(timer)
    }
  }, [user])

  // Price updates are handled by WebSocket via usePriceSubscription (see wsPrice effect above)

  useEffect(() => {
    return () => {
      if (balanceUpdateTimeoutRef.current) {
        clearTimeout(balanceUpdateTimeoutRef.current)
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
      notifiedOrderIdsRef.current.clear()
    }
  }, [])

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (notifiedOrderIdsRef.current.size > 50) {
        const idsArray = Array.from(notifiedOrderIdsRef.current)
        const idsToKeep = idsArray.slice(-50)
        
        notifiedOrderIdsRef.current.clear()
        idsToKeep.forEach(id => notifiedOrderIdsRef.current.add(id))
      }
    }, 30000)

    return () => clearInterval(cleanupInterval)
  }, [])

  const handlePlaceOrder = useCallback(async (direction: 'CALL' | 'PUT') => {
    if (!selectedAsset) {
      toast.error('Please select an asset')
      return
    }

    // ✅ Guard sinkron: langsung lock sebelum validasi apapun
    if (isPlacingRef.current) return
    isPlacingRef.current = true
    
    // ✅ NEW: Validate against asset min/max limits
    const limits = getOrderLimits(selectedAsset)
    
    if (amount < limits.min) {
      toast.error(`Jumlah minimum untuk ${selectedAsset.name} adalah ${formatCurrency(limits.min)}`)
      isPlacingRef.current = false
      return
    }
    
    if (amount > limits.max) {
      toast.error(`Jumlah maksimum untuk ${selectedAsset.name} adalah ${formatCurrency(limits.max)}`)
      isPlacingRef.current = false
      return
    }
    
    if (amount <= 0) {
      toast.error('Invalid amount')
      isPlacingRef.current = false
      return
    }

    // ✅ FIX: Baca balance dari ref agar selalu fresh, hindari stale closure
    const latestBalance = selectedAccountType === 'real'
      ? balanceRef.current.real
      : balanceRef.current.demo
    
    if (amount > latestBalance) {
      toast.error(`Saldo ${selectedAccountType} tidak mencukupi`)
      isPlacingRef.current = false
      return
    }

    // ✅ FIX: Safety timeout agar loading tidak pernah stuck
    if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current)
    setLoading(true)
    loadingTimeoutRef.current = setTimeout(() => {
      setLoading(false)
    }, 10000)

    const now = TimezoneUtil.getCurrentTimestamp()
    const timing = CalculationUtil.formatOrderTiming(selectedAsset, duration, now)

    const optimisticId = addOptimisticOrder({
      accountType: selectedAccountType,
      asset_id: selectedAsset.id,
      asset_name: selectedAsset.name,
      direction,
      amount,
      duration,
      entry_price: 0,
      entry_time: timing.entryDateTime,
      exit_time: timing.expiryDateTime,
      profitRate: selectedAsset.profitRate,
      status: 'PENDING',
    })

    if (selectedAccountType === 'real') {
      setRealBalance(prev => prev - amount)
    } else {
      setDemoBalance(prev => prev - amount)
    }

    try {
      const response = await api.createOrder({
        accountType: selectedAccountType,
        asset_id: selectedAsset.id,
        direction,
        amount,
        duration,
      })

      const confirmedOrderData = response?.data || response
      confirmOrder(optimisticId, confirmedOrderData)

    } catch (error: any) {
      rollbackOrder(optimisticId)
      
      if (selectedAccountType === 'real') {
        setRealBalance(prev => prev + amount)
      } else {
        setDemoBalance(prev => prev + amount)
      }

      const errorMsg = error?.response?.data?.error || 'Failed to place order'
      toast.error(errorMsg)
    } finally {
      // ✅ FIX: Selalu clear safety timeout dan reset loading
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
      setLoading(false)
      isPlacingRef.current = false // ✅ Unlock setelah selesai
    }
  }, [
    selectedAsset, 
    amount, 
    duration, 
    selectedAccountType, 
    // ✅ FIX: Hapus realBalance & demoBalance dari deps — pakai balanceRef.current
    addOptimisticOrder,
    confirmOrder,
    rollbackOrder,
  ])

  const baseProfitRate = Number(selectedAsset?.profitRate) || 0
  
  let statusBonus = 0
  if (userProfile?.statusInfo?.profitBonus) {
    const bonus = userProfile.statusInfo.profitBonus
    if (typeof bonus === 'number') {
      statusBonus = bonus
    } else if (typeof bonus === 'string') {
      const cleaned = String(bonus).replace(/[+%\s]/g, '')
      statusBonus = parseFloat(cleaned) || 0
    } else {
      const bonusStr = String(bonus).replace(/[+%\s]/g, '')
      statusBonus = parseFloat(bonusStr) || 0
    }
  }
  
  const effectiveProfitRate = Number((baseProfitRate + statusBonus).toFixed(2))
  const validAmount = Number(amount) || 0
  const validProfitRate = Number(effectiveProfitRate) || 0
  
  const potentialProfit = selectedAsset ? (validAmount * validProfitRate) / 100 : 0
  const potentialPayout = validAmount + potentialProfit

  // ============================================================================
  // ✅ NEW: Order Limits and Preset Amounts based on Asset
  // ============================================================================
  
  // Get min/max limits for current asset
  const orderLimits = useMemo(() => getOrderLimits(selectedAsset), [selectedAsset])
  
  // Generate preset amounts based on asset limits
  const presetAmounts = useMemo(() => 
    generatePresetAmounts(orderLimits.min, orderLimits.max),
    [orderLimits.min, orderLimits.max]
  )
  
  // Auto-adjust amount when asset changes if out of range
  useEffect(() => {
    if (!selectedAsset) return
    
    const limits = getOrderLimits(selectedAsset)
    
    // If current amount is below min, set to min
    if (amount < limits.min) {
      setAmount(limits.min)
    }
    // If current amount is above max, set to max
    else if (amount > limits.max) {
      setAmount(limits.max)
    }
  }, [selectedAsset?.id, amount])

  // ✅ Count assets per type for chip badges
  const assetCountsByType = useMemo(() => {
    const counts: Record<string, number> = {}
    assets.forEach(a => {
      if (a.type) counts[a.type] = (counts[a.type] || 0) + 1
    })
    return counts
  }, [assets])

  // ✅ Derive which types actually have assets
  const availableAssetTypes = useMemo((): AssetTypeFilter[] => {
    return (Object.keys(assetCountsByType) as AssetTypeFilter[]).filter(
      t => assetCountsByType[t] > 0
    )
  }, [assetCountsByType])

  // ✅ MODIFIED: filteredAssets applies type filter + text search together
  const filteredAssets = useMemo(() => {
    let result = assets

    if (assetTypeFilter !== 'all') {
      result = result.filter(a => a.type === assetTypeFilter)
    }

    if (assetSearch.trim()) {
      const q = assetSearch.toLowerCase()
      result = result.filter(
        a => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
      )
    }

    return result
  }, [assets, assetSearch, assetTypeFilter])

  if (!user) return null

  return (
    <div className="h-screen flex flex-col bg-[#0a0e17] text-white overflow-hidden">
      {/* Header */}
      <div className="h-14 lg:h-16 bg-[#1a1f2e] px-2 lg:px-5 border-b border-gray-800/50 flex items-center justify-between px-2 flex-shrink-0">
        <div className="hidden lg:flex items-center gap-4 w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-md">
              <Image 
                src="/stc-logo1.png" 
                alt="Stouch" 
                fill
                className="object-contain rounded-md"
              />
            </div>
            <span className="font-bold text-xl">Stouch</span>
          </div>

          {/* ✅ MODIFIED: Desktop asset dropdown with type filter chips (text only, 2-row wrap) */}
          <div className="relative">
            <div
  className="relative rounded-xl group"
  style={{
    padding: '2px',
    background: 'linear-gradient(to right, rgba(52,211,153,0.25) 0%, rgba(52,211,153,0.18) 15%, rgba(52,211,153,0.12) 28%, rgba(52,211,153,0.07) 40%, rgba(52,211,153,0.06) 55%, rgba(52,211,153,0.07) 70%, rgba(52,211,153,0.07) 100%)',
  }}
>
  <button
    onClick={() => {
      if (showAssetMenu) {
        handleCloseAssetMenu()
      } else {
        setShowAssetMenu(true)
      }
    }}
    className="relative z-10 flex items-center gap-2 px-2 py-2 transition-colors w-full hover:brightness-110"
    style={{
      background: 'linear-gradient(to right, rgba(47,54,72,0.95) 0%, rgba(47,54,72,0.75) 28%, rgba(47,54,72,0.35) 52%, rgba(47,54,72,0.12) 72%, rgba(47,54,72,0.12) 100%)',
      borderRadius: '10px',
    }}
  >
    {selectedAsset ? (
      <>
        <span className="transition-transform duration-200 group-hover:scale-110">
          <AssetIcon asset={selectedAsset} size="xs" />
        </span>
        <span className="text-sm font-medium transition-transform duration-200 delay-75 group-hover:scale-105">
          {selectedAsset.symbol}
        </span>
        <span className="text-sm text-emerald-400 ml-2 transition-transform duration-200 delay-75 group-hover:scale-105">
          {effectiveProfitRate}%
        </span>
      </>
    ) : (
      <span className="text-sm text-gray-400">Pilih Asset</span>
    )}
  </button>
</div>

            {showAssetMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={handleCloseAssetMenu}
                />
                <div className={`absolute top-full left-0 mt-2 w-72 bg-[#232936] border border-gray-800/50 rounded-lg shadow-2xl z-50 flex flex-col max-h-[420px] ${
                  isAssetMenuClosing ? 'animate-dropdown-out' : 'animate-dropdown-in'
                }`}>

                  {/* Search Input */}
                  <div className="px-3 py-2.5 border-b border-gray-800/50 flex-shrink-0">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={assetSearch}
                        onChange={(e) => setAssetSearch(e.target.value)}
                        placeholder="Cari aset..."
                        className="flex-1 bg-[#1a1f2e] text-xs text-white outline-none border-0 hover:border-1 ring-0 hover:ring-1"
                      />
                      {assetSearch && (
                        <button onClick={() => setAssetSearch('')} className="text-gray-500 hover:text-gray-300 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ✅ MODIFIED: Type Filter Chips - text only, 2-row wrap */}
                  {availableAssetTypes.length > 1 && (
                    <div
                      className="px-3 py-2 border-b border-gray-800/30 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TypeFilterChips
                        activeFilter={assetTypeFilter}
                        onFilterChange={setAssetTypeFilter}
                        assetCounts={assetCountsByType}
                        availableTypes={availableAssetTypes}
                      />
                    </div>
                  )}

                  {/* Asset List */}
                  <div className="overflow-y-auto">
                    {filteredAssets.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="text-2xl mb-2 opacity-50">🔍</div>
                        <p className="text-xs text-gray-500">
                          {assetSearch
                            ? 'Aset tidak ditemukan'
                            : `Tidak ada ${ASSET_TYPE_META[assetTypeFilter]?.label || ''} tersedia`
                          }
                        </p>
                        {assetTypeFilter !== 'all' && !assetSearch && (
                          <button
                            onClick={() => setAssetTypeFilter('all')}
                            className="mt-2 text-[11px] text-blue-400 hover:text-blue-300 underline"
                          >
                            Tampilkan semua
                          </button>
                        )}
                      </div>
                    ) : (
                      filteredAssets.map((asset) => (
                        <button
                          key={asset.id}
                          onClick={() => {
                            setSelectedAsset(asset)
                            handleCloseAssetMenu()
                          }}
                          onMouseEnter={() => {
                            if (asset.realtimeDbPath) {
                              prefetchMultipleTimeframes(asset.realtimeDbPath, ['1m', '5m'])
                            }
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#2a3142] transition-colors border-b border-gray-800/30 last:border-0 ${
                            selectedAsset?.id === asset.id ? 'bg-[#2a3142]' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <AssetIcon asset={asset} size="xs" />
                            <div className="text-left">
                              <div className="text-sm font-medium">{asset.symbol}</div>
                              <div className="text-xs text-gray-400">{asset.name}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="text-xs font-bold text-emerald-400">+{asset.profitRate}%</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex-1"></div>

          <div className="relative">
            <BalanceDisplay
              amount={currentBalance}
              label={`Akun ${selectedAccountType === 'real' ? 'Real' : 'Demo'}`}
              isActive={showAccountMenu}
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              isMobile={false}
            />

            {showAccountMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAccountMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-52 bg-[#232936] border border-gray-800/50 rounded-lg shadow-2xl z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setSelectedAccountType('demo')
                      setShowAccountMenu(false)
                    }}
                    className={`w-full flex flex-col items-start gap-1 px-4 py-3 hover:bg-[#2a3142] transition-colors border-b border-gray-800/30 ${
                      selectedAccountType === 'demo' ? 'bg-[#2a3142]' : ''
                    }`}
                  >
                    <span className="text-xs text-white">Akun Demo</span>
                    <span className="text-base font-bold text-white pl-4">
                      {formatCurrency(demoBalance)}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedAccountType('real')
                      setShowAccountMenu(false)
                    }}
                    className={`w-full flex flex-col items-start gap-1 px-4 py-3 hover:bg-[#2a3142] transition-colors ${
                      selectedAccountType === 'real' ? 'bg-[#2a3142]' : ''
                    }`}
                  >
                    <span className="text-xs text-white">Akun Real</span>
                    <span className="text-base font-bold text-white pl-4">
                      {formatCurrency(realBalance)}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="relative rounded-lg p-px overflow-hidden group">
  <div
    className="absolute inset-[-100%]"
    style={{
      background: 'conic-gradient(from 0deg, transparent 0%, transparent 35%, rgba(255,255,255,0.15) 42%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.15) 58%, transparent 65%, transparent 85%, rgba(255,255,255,0.08) 92%, rgba(255,255,255,0.4) 100%)',
      animation: 'spin-variable 4s ease-in-out infinite',
    }}
  />
  <div
    className="absolute inset-[-100%] blur-sm"
    style={{
      background: 'conic-gradient(from 0deg, transparent 0%, transparent 38%, rgba(147,210,255,0.4) 50%, transparent 62%, transparent 100%)',
      animation: 'spin-variable 4s ease-in-out infinite',
    }}
  />
  <div className="absolute inset-[1px] rounded-lg bg-[#0C8DF8]" />
  <div className="absolute inset-[1px] rounded-lg bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />

  <button
    onClick={() => router.push('/balance')}
    className="relative z-10 flex items-center gap-2 px-4 py-2.5 bg-[#0C8DF8] rounded-lg group-hover:brightness-110 transition-all duration-300"
  >
    <Wallet className="w-4 h-4 text-white transition-transform duration-200 group-hover:scale-110" />
    <span className="text-sm font-medium text-white">Top Up</span>
  </button>
</div>
          <button
            onClick={() => setShowHistorySidebar(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2f3648] hover:bg-[#3a4360] rounded-lg transition-colors border border-gray-800/50"
          >
            <div className="relative">
              <CalendarClock className="w-4 h-4" />
              <span className={`absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5 transition-opacity duration-300 ${activeOrders.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-full w-full rounded-full bg-red-500" />
              </span>
            </div>
            <span className="text-sm">Riwayat</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity border-2 border-blue-500/30 relative"
            >
              <div className="w-full h-full rounded-full overflow-hidden">
                {userProfile?.profileInfo?.avatar?.url ? (
                  <Image
                    src={userProfile.profileInfo.avatar.url}
                    alt={user.email}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                    <span className="text-sm font-bold">{user.email[0].toUpperCase()}</span>
                  </div>
                )}
              </div>
              {userProfile?.user?.status && (
                <StatusBadge status={userProfile.user.status} size="sm" />
              )}
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1f2e] border border-gray-800/50 rounded-lg shadow-2xl z-50">
                  <div className="px-4 py-4 border-b border-gray-800/30">
                    <div className="text-sm font-medium truncate">{user.email}</div>
                    <div className="text-xs text-gray-400 mt-1">{user.role}</div>
                  </div>
                  
                  <div className="p-2 space-y-0.5">
                  {/* ✅ Status Progress Widget - Desktop */}
                  {userProfile?.statusInfo && (() => {
                    const statusInfo = userProfile.statusInfo
                    const progress = calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current)
                    if (!progress.next) return null
                    const nextConfig = STATUS_CONFIG[progress.next]
                    const STATUS_BADGE_IMAGES: Record<string, string> = {
                      standard: '/std.png',
                      gold: '/gold.png',
                      vip: '/vip.png'
                    }
                    const badgeImg = STATUS_BADGE_IMAGES[statusInfo.current]
                    return (
                      <div className="px-3 py-2.5 mb-1 bg-[#0f1419] rounded-lg border border-gray-800/60">
                        {/* Header: status saat ini */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            {badgeImg && (
                              <Image
                                src={badgeImg}
                                alt={statusInfo.current}
                                width={18}
                                height={18}
                                className="object-contain"
                              />
                            )}
                            <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
                              {statusInfo.current}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-blue-400">
                            {progress.progress}%
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-gray-700/60 rounded-full h-1.5 mb-2 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                            style={{ width: `${progress.progress}%` }}
                          />
                        </div>
                        {/* Keterangan naik status */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-[10px] text-gray-400">Butuh</span>
                          <span className="text-[10px] text-white font-semibold">
                            {formatDepositRequirement(progress.depositNeeded)}
                          </span>
                          <span className="text-[10px] text-gray-400"> ke</span>
                          <span className="text-[10px] text-blue-400 font-semibold">
                            {nextConfig?.label ?? progress.next}
                          </span>
                        </div>
                      </div>
                    )
                  })()}

                  <button
                    onClick={() => {
                      router.push('/profile')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#232936] transition-colors text-left"
                  >
                    {/* ✅ Icon wrapper dengan badge notif di pojok kanan atas */}
                    <div className="relative flex-shrink-0">
                      <Settings className="w-4 h-4" />
                      {isProfileIncomplete && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                          <span className="relative inline-flex h-full w-full rounded-full bg-red-500" />
                        </span>
                      )}
                    </div>
                    <span className="text-sm">Profil</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push('/history')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#232936] transition-colors text-left"
                  >
                    <div className="relative flex-shrink-0">
                      <CalendarClock className="w-4 h-4" />
                      <span className={`absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5 transition-opacity duration-300 ${activeOrders.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-full w-full rounded-full bg-red-500" />
                      </span>
                    </div>
                    <span className="text-sm">Riwayat</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push('/balance')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[#232936] transition-colors text-left"
                  >
                    <Wallet className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Keuangan</span>
                  </button>

                  <button
                    onClick={() => {
                      router.push('/referral')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-yellow-500/10 transition-colors text-left text-yellow-400"
                  >
                    <UserPlus className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Undang Teman</span>
                    <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white tracking-wide badge-new-shimmer">
                      NEW
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      setTimeout(() => {
                        setShowTutorial(true)
                      }, 300)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-blue-500/10 transition-colors text-left text-blue-400"
                  >
                    <Info className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">Tutorial</span>
                  </button>
                  </div>
                  
                  <div className="p-2 border-t border-gray-800/30">
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        handleLogout()
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-rose-500/10 transition-colors text-left text-rose-400"
                    >
                      <LogOut className="w-4 h-4 flex-shrink-0" />
                      <span className="text-sm">Keluar</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex lg:hidden items-center justify-between w-full px-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLeftSidebar(true)}
              className="w-8 h-8 flex items-center justify-center hover:bg-[#232936] rounded-lg transition-colors"
            >
              <Logs className="w-6 h-6 font-bold text-white" />
            </button>
            <div className="w-8 h-8 relative">
              <Image 
                src="/stc-logo1.png" 
                alt="Stouch" 
                fill
                className="object-contain rounded-md"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <BalanceDisplay
                amount={currentBalance}
                label={selectedAccountType === 'real' ? 'Real' : 'Demo'}
                isActive={showAccountMenu}
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                isMobile={true}
              />

              {showAccountMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowAccountMenu(false)} />
                  <div className="absolute top-full right-0 mt-1 bg-[#1a1f2e] border border-gray-800/50 rounded-lg shadow-2xl z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        setSelectedAccountType('demo')
                        setShowAccountMenu(false)
                      }}
                      className={`w-full flex flex-col items-end px-3 py-1.5 hover:bg-[#232936] transition-colors border-b border-gray-800/30 ${
                        selectedAccountType === 'demo' ? 'bg-[#232936]' : ''
                      }`}
                    >
                      <span className="text-[10px] text-gray-400">Demo</span>
                      <span className="text-xs font-bold text-white leading-tight whitespace-nowrap">
                        {formatCurrency(demoBalance)}
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAccountType('real')
                        setShowAccountMenu(false)
                      }}
                      className={`w-full flex flex-col items-end px-3 py-1.5 hover:bg-[#232936] transition-colors ${
                        selectedAccountType === 'real' ? 'bg-[#232936]' : ''
                      }`}
                    >
                      <span className="text-[10px] text-gray-400">Real</span>
                      <span className="text-xs font-bold text-white leading-tight whitespace-nowrap">
                        {formatCurrency(realBalance)}
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setShowWalletModal(true)}
              className="w-10 h-10 lg:w-8 lg:h-8 flex items-center justify-center bg-blue-500 rounded-lg transition-colors hover:bg-blue-600"
            >
              <Wallet className="w-6 h-6 lg:w-4 lg:h-4 text-white" />
            </button>

            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-10 h-10 lg:w-8 lg:h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity border-2 border-blue-500/30 relative"
            >
              <div className="w-full h-full rounded-full overflow-hidden">
                {userProfile?.profileInfo?.avatar?.url ? (
                  <Image
                    src={userProfile.profileInfo.avatar.url}
                    alt={user.email}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                    <span className="text-sm font-bold">{user.email[0].toUpperCase()}</span>
                  </div>
                )}
              </div>
              {userProfile?.user?.status && (
                <StatusBadge status={userProfile.user.status} size="sm" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Banner popup - fixed overlay, tidak mempengaruhi layout */}
      {showBanner && (
        <InformationBanner 
          onClose={() => setShowBanner(false)} 
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop Left Sidebar */}
        <div className="hidden lg:block w-16 bg-[#0f1419] border-r border-gray-800/50 flex-shrink-0">
          <div className="h-full flex flex-col items-center py-4 gap-2">
            <button
              onClick={() => router.push('/calendar')}
              className="w-12 h-12 flex flex-col items-center justify-center gap-1 hover:bg-[#1a1f2e] rounded-lg transition-colors group"
              title="Kalender"
            >
              <Calendar className="w-5 h-5 text-gray-400 group-hover:text-blue-400" />
              <span className="text-[9px] text-gray-500 group-hover:text-blue-400">Kalender</span>
            </button>

            <button
              onClick={() => router.push('/tournament')}
              className="w-12 h-12 flex flex-col items-center justify-center gap-1 hover:bg-[#1a1f2e] rounded-lg transition-colors group"
              title="Turnamen"
            >
              <Trophy className="w-5 h-5 text-gray-400 group-hover:text-yellow-400" />
              <span className="text-[9px] text-gray-500 group-hover:text-yellow-400">Turnamen</span>
            </button>

            {/* <button
              onClick={() => router.push('/runner-up')}
              className="w-12 h-12 flex flex-col items-center justify-center gap-1 hover:bg-[#1a1f2e] rounded-lg transition-colors group"
              title="Trader Terbaik"
            >
              <Award className="w-5 h-5 text-gray-400 group-hover:text-emerald-400" />
              <span className="text-[9px] text-gray-500 group-hover:text-emerald-400">Terbaik</span>
            </button> */}

            <button
              onClick={() => router.push('/berita')}
              className="w-12 h-12 flex flex-col items-center justify-center gap-1 hover:bg-[#1a1f2e] rounded-lg transition-colors group"
              title="Berita"
            >
              <Newspaper className="w-5 h-5 text-gray-400 group-hover:text-rose-400" />
              <span className="text-[9px] text-gray-500 group-hover:text-rose-400">Berita</span>
            </button>

            <button
              onClick={() => router.push('/support')}
              className="w-12 h-12 flex flex-col items-center justify-center gap-1 hover:bg-[#1a1f2e] rounded-lg transition-colors group"
              title="Support"
            >
              <MessageCircle className="w-5 h-5 text-gray-400 group-hover:text-emerald-400" />
              <span className="text-[9px] text-gray-500 group-hover:text-emerald-400">Support</span>
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 bg-[#0a0e17] relative overflow-hidden">
            {selectedAsset ? (
              <TradingChart 
                activeOrders={activeOrders}
                currentPrice={currentPrice?.price}
                assets={assets}
                onAssetSelect={setSelectedAsset}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-sm">Select an asset to view chart</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Right Sidebar */}
        <div className="hidden lg:block w-64 bg-[#0f1419] border-l border-gray-800/50 flex-shrink-0">
          <div className="h-full flex flex-col p-4 space-y-4 overflow-hidden">
            <div className="bg-[#1a1f2e] rounded-xl px-3 py-2">
              <div className="text-[10px] text-gray-500 text-center leading-none">Jumlah</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const newAmount = Math.max(orderLimits.min, amount - 10000)
                    setAmount(newAmount)
                  }}
                  className="hover:bg-[#232936] rounded-lg p-1.5 transition-colors flex-shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => {
                    const newAmount = Number(e.target.value)
                    const limits = getOrderLimits(selectedAsset)
                    
                    // Clamp between min and max
                    if (newAmount >= limits.min && newAmount <= limits.max) {
                      setAmount(newAmount)
                    } else if (newAmount < limits.min) {
                      setAmount(limits.min)
                    } else if (newAmount > limits.max) {
                      setAmount(limits.max)
                    }
                  }}
                  className="flex-1 min-w-0 bg-transparent border-0 text-center text-base text-white focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min={orderLimits.min}
                  max={orderLimits.max}
                  step="1000"
                />
                <button
                  onClick={() => {
                    const newAmount = Math.min(orderLimits.max, amount + 10000)
                    setAmount(newAmount)
                  }}
                  className="hover:bg-[#232936] rounded-lg p-1.5 transition-colors flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {/* Optional: Show limits */}
              <div className="text-[9px] text-gray-500 text-center mt-1">
                Min: {formatCurrency(orderLimits.min)} - Max: {formatCurrency(orderLimits.max)}
              </div>
            </div>

            <div className="bg-[#1a1f2e] rounded-xl px-3 py-2 relative">
              <div className="text-[10px] text-gray-500 text-center leading-none mb-1">
                Durasi Waktu
              </div>
              <div
                onClick={() => setShowDesktopDurationDropdown(!showDesktopDurationDropdown)}
                className="w-full bg-transparent text-center text-base text-white cursor-pointer hover:text-blue-400 transition-colors py-1"
              >
                {`${EXTENDED_DURATIONS.find(d => d.value === duration)?.label} ➜ ${formatExpiryTime(duration)}`}
              </div>

              {showDesktopDurationDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowDesktopDurationDropdown(false)} 
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#232936] border border-gray-700/50 rounded-lg shadow-2xl z-50 overflow-hidden max-h-[280px] overflow-y-auto">
                    {EXTENDED_DURATIONS.map((d) => {
                      const isSelected = duration === d.value
                      
                      return (
                        <button
                          key={d.value}
                          onClick={() => {
                            setDuration(d.value)
                            setShowDesktopDurationDropdown(false)
                          }}
                          className={`
                            w-full px-3 py-2.5 text-xs font-medium transition-colors border-b border-gray-800/30 last:border-0
                            ${isSelected 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'text-white hover:bg-[#2a3142]'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span>{d.label}</span>
                            <span className={`text-[10px] flex items-center gap-1.5 ${isSelected ? 'text-blue-400/80' : 'text-gray-400'}`}>
                              <span>➜</span>
                              <span>{formatExpiryTime(d.value)}</span>
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            {selectedAsset && (
              <div className="bg-gradient-to-r from-emerald-500/10 to-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Pendapatan</span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">+{effectiveProfitRate}%</span>
                    <span className="font-bold text-emerald-400">{formatCurrency(potentialPayout)}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => { triggerBtnEffect('CALL'); handlePlaceOrder('CALL') }}
                  disabled={loading || !selectedAsset}
                  className="relative overflow-hidden bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 rounded-xl font-bold text-white flex items-center justify-center shadow-lg shadow-emerald-500/20"
                  style={btnEffect === 'CALL' ? {
                    animation: 'tradeBtnPress 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards, tradeBtnGlowBuy 0.7s ease-out forwards'
                  } : undefined}
                >
                  {btnEffect === 'CALL' && <span style={{
                    position:'absolute', borderRadius:'50%',
                    width:36, height:36, top:'50%', left:'50%',
                    marginTop:-18, marginLeft:-18,
                    background:'rgba(255,255,255,0.45)',
                    animation:'tradeBtnRipple 0.65s ease-out forwards',
                    pointerEvents:'none'
                  }} />}
                  {btnEffect === 'CALL' && <span style={{
                    position:'absolute', top:0, width:'55%', height:'100%',
                    background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.28) 50%,transparent 100%)',
                    transform:'skewX(-20deg)',
                    animation:'tradeBtnShine 0.55s ease-out forwards',
                    pointerEvents:'none'
                  }} />}
                  <ArrowUp className="w-6 h-6 relative z-10" style={btnEffect === 'CALL' ? {
                    animation:'tradeBtnIconBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards'
                  } : undefined} />
                </button>

                <button
                  onClick={() => { triggerBtnEffect('PUT'); handlePlaceOrder('PUT') }}
                  disabled={loading || !selectedAsset}
                  className="relative overflow-hidden bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 rounded-xl font-bold text-white flex items-center justify-center shadow-lg shadow-rose-500/20"
                  style={btnEffect === 'PUT' ? {
                    animation: 'tradeBtnPress 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards, tradeBtnGlowSell 0.7s ease-out forwards'
                  } : undefined}
                >
                  {btnEffect === 'PUT' && <span style={{
                    position:'absolute', borderRadius:'50%',
                    width:36, height:36, top:'50%', left:'50%',
                    marginTop:-18, marginLeft:-18,
                    background:'rgba(255,255,255,0.45)',
                    animation:'tradeBtnRipple 0.65s ease-out forwards',
                    pointerEvents:'none'
                  }} />}
                  {btnEffect === 'PUT' && <span style={{
                    position:'absolute', top:0, width:'55%', height:'100%',
                    background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.28) 50%,transparent 100%)',
                    transform:'skewX(-20deg)',
                    animation:'tradeBtnShine 0.55s ease-out forwards',
                    pointerEvents:'none'
                  }} />}
                  <ArrowDown className="w-6 h-6 relative z-10" style={btnEffect === 'PUT' ? {
                    animation:'tradeBtnIconBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards'
                  } : undefined} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Controls */}
      <div className="lg:hidden bg-[#0f1419] border-t border-gray-800/50 p-4">
        <div className="space-y-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-xs text-gray-400 text-center mb-2 block font-medium">Jumlah</label>
              <div className="relative">
                <div
                  onClick={() => setShowAmountDropdown(!showAmountDropdown)}
                  className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-3 py-3 text-center text-sm font-bold text-white hover:bg-[#232936] transition-colors flex items-center justify-between cursor-pointer"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const newAmount = Math.max(orderLimits.min, amount - 10000)
                      setAmount(newAmount)
                    }}
                    className="flex items-center justify-center hover:bg-[#2a3142] rounded p-1 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-300" />
                  </button>
                  
                  <span className="flex-1">{formatCurrency(amount)}</span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const newAmount = Math.min(orderLimits.max, amount + 10000)
                      setAmount(newAmount)
                    }}
                    className="flex items-center justify-center hover:bg-[#2a3142] rounded p-1 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              </div>

              {showAmountDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowAmountDropdown(false)} 
                  />
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1f2e] border border-gray-800/50 rounded-lg shadow-2xl z-50 overflow-hidden max-h-[280px] overflow-y-auto">
                    {presetAmounts.map((preset) => {
                      const isSelected = amount === preset
                      const isAffordable = preset <= currentBalance
                      
                      return (
                        <button
                          key={preset}
                          onClick={() => {
                            setAmount(preset)
                            setShowAmountDropdown(false)
                          }}
                          disabled={!isAffordable}
                          className={`
                            w-full px-4 py-3 text-sm font-medium transition-colors border-b border-gray-800/30 last:border-0
                            ${isSelected 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : isAffordable 
                                ? 'text-white hover:bg-[#232936]' 
                                : 'text-gray-600 opacity-50 cursor-not-allowed'
                            }
                          `}
                        >
                          {formatCurrency(preset)}
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
              <label className="text-xs text-gray-400 mb-2 text-center block font-medium">
                Durasi Waktu
              </label>
              <div
                onClick={() => setShowDurationDropdown(!showDurationDropdown)}
                className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-3 py-3 text-center text-sm font-bold text-white cursor-pointer hover:bg-[#232936] transition-colors"
              >
                {`${EXTENDED_DURATIONS.find(d => d.value === duration)?.shortLabel} ➜ ${formatExpiryTime(duration)}`}
              </div>

              {showDurationDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowDurationDropdown(false)} 
                  />
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1f2e] border border-gray-800/50 rounded-lg shadow-2xl z-50 overflow-hidden max-h-[280px] overflow-y-auto">
                    {EXTENDED_DURATIONS.map((d) => {
                      const isSelected = duration === d.value
                      
                      return (
                        <button
                          key={d.value}
                          onClick={() => {
                            setDuration(d.value)
                            setShowDurationDropdown(false)
                          }}
                          className={`
                            w-full px-4 py-3 text-sm font-medium transition-colors border-b border-gray-800/30 last:border-0
                            ${isSelected 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : 'text-white hover:bg-[#232936]'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span>{d.label}</span>
                            <span className={`text-xs flex items-center gap-2 ${isSelected ? 'text-blue-400/80' : 'text-gray-400'}`}>
                              <span>➜</span>
                              <span>{formatExpiryTime(d.value)}</span>
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {selectedAsset && (
            <div className="flex justify-center py-2">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/10 border border-emerald-500/20 rounded-full px-5 py-2.5">
                <span className="text-xs text-gray-400">Pendapatan</span>
                <span className="text-xs text-emerald-400">+{effectiveProfitRate}%</span>
                <span className="text-sm font-bold text-emerald-400">
                  {formatCurrency(potentialPayout)}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => { triggerBtnEffect('CALL'); handlePlaceOrder('CALL') }}
              disabled={loading || !selectedAsset}
              className="relative overflow-hidden bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:opacity-50 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg"
              style={btnEffect === 'CALL' ? {
                animation: 'tradeBtnPress 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards, tradeBtnGlowBuy 0.7s ease-out forwards'
              } : undefined}
            >
              {btnEffect === 'CALL' && <span style={{
                position:'absolute', borderRadius:'50%',
                width:40, height:40, top:'50%', left:'50%',
                marginTop:-20, marginLeft:-20,
                background:'rgba(255,255,255,0.45)',
                animation:'tradeBtnRipple 0.65s ease-out forwards',
                pointerEvents:'none', zIndex:1
              }} />}
              {btnEffect === 'CALL' && <span style={{
                position:'absolute', top:0, width:'55%', height:'100%',
                background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.28) 50%,transparent 100%)',
                transform:'skewX(-20deg)',
                animation:'tradeBtnShine 0.55s ease-out forwards',
                pointerEvents:'none', zIndex:1
              }} />}
              <ArrowUp className="w-5 h-5 relative z-10" style={btnEffect === 'CALL' ? {
                animation:'tradeBtnIconBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards'
              } : undefined} />
              <span className="relative z-10">BUY</span>
            </button>
            <button
              onClick={() => { triggerBtnEffect('PUT'); handlePlaceOrder('PUT') }}
              disabled={loading || !selectedAsset}
              className="relative overflow-hidden bg-rose-500 hover:bg-rose-600 active:bg-rose-700 disabled:opacity-50 py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-lg"
              style={btnEffect === 'PUT' ? {
                animation: 'tradeBtnPress 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards, tradeBtnGlowSell 0.7s ease-out forwards'
              } : undefined}
            >
              {btnEffect === 'PUT' && <span style={{
                position:'absolute', borderRadius:'50%',
                width:40, height:40, top:'50%', left:'50%',
                marginTop:-20, marginLeft:-20,
                background:'rgba(255,255,255,0.45)',
                animation:'tradeBtnRipple 0.65s ease-out forwards',
                pointerEvents:'none', zIndex:1
              }} />}
              {btnEffect === 'PUT' && <span style={{
                position:'absolute', top:0, width:'55%', height:'100%',
                background:'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.28) 50%,transparent 100%)',
                transform:'skewX(-20deg)',
                animation:'tradeBtnShine 0.55s ease-out forwards',
                pointerEvents:'none', zIndex:1
              }} />}
              <ArrowDown className="w-5 h-5 relative z-10" style={btnEffect === 'PUT' ? {
                animation:'tradeBtnIconBounce 0.5s cubic-bezier(0.34,1.56,0.64,1) forwards'
              } : undefined} />
              <span className="relative z-10">SELL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Wallet Modal - Clean & Modern */}
      {showWalletModal && (
        <>
          <div 
            className={`fixed inset-0 bg-black/70 z-50 backdrop-blur-sm ${
              isWalletModalClosing ? 'animate-fade-out' : 'animate-fade-in'
            }`}
            onClick={handleCloseWalletModal} 
          />
          <div className={`fixed bottom-0 left-0 right-0 bg-[#0f1419] rounded-t-3xl z-50 border-t border-gray-800/50 shadow-2xl ${
            isWalletModalClosing ? 'animate-slide-down' : 'animate-slide-up'
          }`}>
            <div className="p-6">
              {/* Handle Bar */}
              <div className="w-12 h-1.5 bg-gray-700/50 rounded-full mx-auto mb-6"></div>
              
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-400" />
                  <h3 className="text-xl font-bold">Dompet</h3>
                </div>
                <button
                  onClick={handleCloseWalletModal}
                  className="w-9 h-9 flex items-center justify-center hover:bg-gray-800/50 rounded-xl transition-all active:scale-95"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Real Account Card */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-2xl p-4 mb-3 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">Real Account</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-emerald-400">{formatCurrency(realBalance)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      handleCloseWalletModal()
                      setTimeout(() => router.push('/balance'), 300)
                    }}
                    className="flex items-center justify-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-400 py-2.5 rounded-xl font-medium transition-all active:scale-95"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    <span className="text-sm">Top Up</span>
                  </button>
                  <button
                    onClick={() => {
                      handleCloseWalletModal()
                      setTimeout(() => router.push('/balance'), 300)
                    }}
                    className="flex items-center justify-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-400 py-2.5 rounded-xl font-medium transition-all active:scale-95"
                  >
                    <ArrowUpFromLine className="w-4 h-4" />
                    <span className="text-sm">Penarikan</span>
                  </button>
                </div>
              </div>

              {/* Demo Account Card */}
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-blue-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-300">Demo Account</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-400">{formatCurrency(demoBalance)}</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    handleCloseWalletModal()
                    setTimeout(() => router.push('/balance'), 300)
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 py-2.5 rounded-xl font-medium transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Top Up Demo</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Menu */}
      {showMobileMenu && (
        <>
          <div className={`fixed inset-0 bg-black/80 z-50 ${
            isMobileMenuClosing ? 'animate-fade-out' : 'animate-fade-in'
          }`} onClick={handleCloseMobileMenu} />
          <div className={`fixed top-0 right-0 bottom-0 w-64 bg-[#0f1419] border-l border-gray-800/50 z-50 p-4 ${
            isMobileMenuClosing ? 'animate-slide-right-out' : 'animate-slide-left'
          }`}>
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500/30">
                  {userProfile?.profileInfo?.avatar?.url ? (
                    <Image
                      src={userProfile.profileInfo.avatar.url}
                      alt={user.email}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center">
                      <span className="text-sm font-bold">{user.email[0].toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm truncate">{user.email}</h3>
                  <p className="text-xs text-gray-400">{user.role}</p>
                  {/* ✅ Info kelengkapan profil di header sidebar */}
                  {isProfileIncomplete && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="flex h-1.5 w-1.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-red-400 opacity-75" />
                        <span className="relative inline-flex h-full w-full rounded-full bg-red-500" />
                      </span>
                      <span className="text-[10px] text-red-400 font-medium">
                        Profil {userProfile?.profileInfo?.completion ?? 0}% lengkap
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Pilih Aset</label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => {
                        setSelectedAsset(asset)
                        handleCloseMobileMenu()
                      }}
                      onTouchStart={() => {
                        if (asset.realtimeDbPath) {
                          prefetchMultipleTimeframes(
                            asset.realtimeDbPath,
                            ['1m', '5m']
                          )
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        selectedAsset?.id === asset.id
                          ? 'bg-blue-500/20 border border-blue-500/50'
                          : 'bg-[#1a1f2e] hover:bg-[#232936]'
                      }`}
                    >
                      <AssetIcon asset={asset} size="sm" />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{asset.symbol}</div>
                        <div className="text-xs text-gray-400">{asset.name}</div>
                      </div>
                      <div className="text-xs font-bold text-emerald-400">
                        +{asset.profitRate}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ✅ Status Progress Widget - Mobile */}
              {userProfile?.statusInfo && (() => {
                const statusInfo = userProfile.statusInfo
                const progress = calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current)
                if (!progress.next) return null
                const nextConfig = STATUS_CONFIG[progress.next]
                const STATUS_BADGE_IMAGES: Record<string, string> = {
                  standard: '/std.png',
                  gold: '/gold.png',
                  vip: '/vip.png'
                }
                const badgeImg = STATUS_BADGE_IMAGES[statusInfo.current]
                return (
                  <div className="px-4 py-3 bg-[#1a1f2e] rounded-xl border border-gray-700/50">
                    {/* Header: status saat ini */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        {badgeImg && (
                          <Image
                            src={badgeImg}
                            alt={statusInfo.current}
                            width={18}
                            height={18}
                            className="object-contain"
                          />
                        )}
                        <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider">
                          {statusInfo.current}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-blue-400">
                        {progress.progress}%
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-gray-700/60 rounded-full h-1.5 mb-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                    {/* Keterangan naik status */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-[10px] text-gray-400">Butuh</span>
                      <span className="text-[10px] text-white font-semibold">
                        {formatDepositRequirement(progress.depositNeeded)}
                      </span>
                      <span className="text-[10px] text-gray-400"> ke</span>
                      <span className="text-[10px] text-blue-400 font-semibold">
                        {nextConfig?.label ?? progress.next}
                      </span>
                    </div>
                  </div>
                )
              })()}

              <button
                onClick={() => {
                  handleCloseMobileMenu()
                  setTimeout(() => router.push('/profile'), 300)
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-[#1a1f2e] hover:bg-[#232936] rounded-xl transition-colors"
              >
                {/* ✅ Icon wrapper dengan badge notif di pojok kanan atas */}
                <div className="relative flex-shrink-0">
                  <Settings className="w-4 h-4" />
                  {isProfileIncomplete && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-full w-full rounded-full bg-red-500" />
                    </span>
                  )}
                </div>
                <span>Profil</span>
              </button>

              <button
                onClick={() => {
                  handleCloseMobileMenu()
                  setTimeout(() => router.push('/balance'), 300)
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-[#1a1f2e] hover:bg-[#232936] rounded-xl transition-colors"
              >
                <Wallet className="w-4 h-4 flex-shrink-0" />
                <span>Keuangan</span>
              </button>
              
              <button
                onClick={() => {
                  setShowHistorySidebar(true)
                  handleCloseMobileMenu()
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-[#1a1f2e] hover:bg-[#232936] rounded-xl transition-colors"
              >
                <div className="relative flex-shrink-0">
                  <CalendarClock className="w-4 h-4" />
                  <span className={`absolute -top-1.5 -right-1.5 flex h-2.5 w-2.5 transition-opacity duration-300 ${activeOrders.length > 0 ? 'opacity-100' : 'opacity-0'}`}>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-full w-full rounded-full bg-red-500" />
                  </span>
                </div>
                <span>Riwayat</span>
              </button>

              <button
                onClick={() => {
                  handleCloseMobileMenu()
                  setTimeout(() => {
                    setShowTutorial(true)
                  }, 300)
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-colors text-blue-400"
              >
                <Info className="w-4 h-4 flex-shrink-0" />
                <span>Lihat Tutorial</span>
              </button>

              <button
                onClick={() => {
                  handleCloseMobileMenu()
                  setTimeout(() => handleLogout(), 300)
                  handleLogout()
                }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors text-rose-400"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Left Sidebar */}
      {showLeftSidebar && (
        <>
          <div className={`fixed inset-0 bg-black/80 z-50 ${
            isLeftSidebarClosing ? 'animate-fade-out' : 'animate-fade-in'
          }`} onClick={handleCloseLeftSidebar} />
          <div className={`fixed top-0 left-0 bottom-0 w-64 bg-[#0f1419] border-r border-gray-800/50 z-50 p-4 ${
            isLeftSidebarClosing ? 'animate-slide-left-out' : 'animate-slide-right'
          }`}>
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 relative">
                  <Image 
                    src="/stc-logo1.png" 
                    alt="Stouch" 
                    fill
                    className="object-contain rounded-md"
                  />
                </div>
                <span className="font-bold">Stouch</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  handleCloseLeftSidebar()
                  setTimeout(() => router.push('/calendar'), 300)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <Calendar className="w-4 h-4" />
                <span>Kalender</span>
              </button>

              <button
                onClick={() => {
                  handleCloseLeftSidebar()
                  setTimeout(() => router.push('/tournament'), 300)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Turnamen</span>
              </button>
              
              {/* <button
                onClick={() => {
                  handleCloseLeftSidebar()
                  setTimeout(() => router.push('/runner-up'), 300)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <ArrowUp className="w-4 h-4" />
                <span>Trader Terbaik</span>
              </button> */}

              <button
                onClick={() => {
                  handleCloseLeftSidebar()
                  setTimeout(() => router.push('/berita'), 300)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <Newspaper className="w-4 h-4" />
                <span>Berita</span>
              </button>

              <button
                onClick={() => {
                  handleCloseLeftSidebar()
                  setTimeout(() => router.push('/support'), 300)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Support</span>
              </button>

              <button
                onClick={() => {
                  handleCloseLeftSidebar()
                  setTimeout(() => router.push('/referral'), 300)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors text-yellow-400"
              >
                <UserPlus className="w-4 h-4" />
                <span>Undang Teman</span>
                <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold text-white tracking-wide badge-new-shimmer">
                  NEW
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* History Sidebar */}
      {showHistorySidebar && (
        <HistorySidebar 
          isOpen={showHistorySidebar} 
          onClose={() => setShowHistorySidebar(false)} 
        />
      )}

      {/* Tutorial */}
      {showTutorial && (
        <TradingTutorial
          onComplete={handleCompleteTutorial}
          onSkip={handleSkipTutorial}
        />
      )}

      {/* Batch Notification */}
      <OrderNotification 
        orders={notification.currentBatch}
        onClose={notification.closeBatch}
      />

      <style>{`
        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dropdown-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-8px) scale(0.96); }
        }
        @keyframes slide-left {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-right {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slide-left-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(-100%); opacity: 0; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slide-down {
          from { transform: translateY(0); opacity: 1; }
          to { transform: translateY(100%); opacity: 0; }
        }
        @keyframes slide-right-out {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fade-out { from { opacity: 1; } to { opacity: 0; } }
        @keyframes spin-variable {
          0%   { transform: rotate(0deg); }
          30%  { transform: rotate(60deg); }
          55%  { transform: rotate(110deg); }
          65%  { transform: rotate(250deg); }
          80%  { transform: rotate(300deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes border-shimmer {
          0%   { opacity: 0.9; } 15%  { opacity: 0.3; }
          25%  { opacity: 0.7; } 40%  { opacity: 0.15; }
          50%  { opacity: 1; }   60%  { opacity: 0.4; }
          72%  { opacity: 0.8; } 85%  { opacity: 0.2; }
          100% { opacity: 0.9; }
        }
        .animate-dropdown-in  { animation: dropdown-in 0.2s cubic-bezier(0.16,1,0.3,1); }
        .animate-dropdown-out { animation: dropdown-out 0.2s cubic-bezier(0.4,0,1,1); }
        .animate-slide-left   { animation: slide-left 0.25s cubic-bezier(0.16,1,0.3,1); }
        .animate-slide-right  { animation: slide-right 0.25s cubic-bezier(0.16,1,0.3,1); }
        .animate-slide-left-out  { animation: slide-left-out 0.25s cubic-bezier(0.4,0,1,1); }
        .animate-slide-right-out { animation: slide-right-out 0.25s cubic-bezier(0.4,0,1,1); }
        .animate-slide-up   { animation: slide-up 0.25s cubic-bezier(0.16,1,0.3,1); }
        .animate-slide-down { animation: slide-down 0.25s cubic-bezier(0.4,0,1,1); }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
        .animate-fade-out { animation: fade-out 0.2s ease-in; }
        button { transition: all 0.2s ease; }
        .badge-new-shimmer {
          position: relative;
          overflow: hidden;
          background: linear-gradient(90deg, #2563eb, #3b82f6, #2563eb);
        }
        .badge-new-shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(120deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%);
          animation: badge-shimmer-move 1.8s ease-in-out infinite;
        }
        @keyframes badge-shimmer-move {
          0%   { left: -60%; }
          100% { left: 160%; }
        }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 3px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }

        /* ===== TRADE BUTTON CLICK EFFECTS ===== */
        @keyframes tradeBtnPress {
          0%   { transform: scale(1); }
          18%  { transform: scale(0.91); }
          52%  { transform: scale(1.07); }
          76%  { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
        @keyframes tradeBtnRipple {
          0%   { transform: scale(0); opacity: 0.8; }
          100% { transform: scale(14); opacity: 0; }
        }
        @keyframes tradeBtnShine {
          0%   { left: -80%; opacity: 0; }
          10%  { opacity: 1; }
          100% { left: 200%; opacity: 0; }
        }
        @keyframes tradeBtnGlowBuy {
          0%   { box-shadow: 0 4px 15px rgba(16,185,129,0.4); }
          30%  { box-shadow: 0 0 0 5px rgba(16,185,129,0.22), 0 0 35px rgba(16,185,129,0.85), 0 0 70px rgba(16,185,129,0.3); }
          100% { box-shadow: 0 4px 15px rgba(16,185,129,0.15); }
        }
        @keyframes tradeBtnGlowSell {
          0%   { box-shadow: 0 4px 15px rgba(244,63,94,0.4); }
          30%  { box-shadow: 0 0 0 5px rgba(244,63,94,0.22), 0 0 35px rgba(244,63,94,0.85), 0 0 70px rgba(244,63,94,0.3); }
          100% { box-shadow: 0 4px 15px rgba(244,63,94,0.15); }
        }
        @keyframes tradeBtnIconBounce {
          0%   { transform: translateY(0) scale(1); }
          28%  { transform: translateY(-5px) scale(1.4); }
          58%  { transform: translateY(2px) scale(0.88); }
          80%  { transform: translateY(-1px) scale(1.06); }
          100% { transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}