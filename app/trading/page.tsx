// app/trading/page.tsx - ULTRA OPTIMIZED VERSION
'use client'

import { useEffect, useState, useCallback, memo, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth'
import { useTradingStore, useSelectedAsset, useCurrentPrice, useSelectedAccountType, useTradingActions } from '@/store/trading'
import { api } from '@/lib/api'
import { subscribeToPriceUpdates, prefetchDefaultAsset } from '@/lib/firebase'
import { toast } from 'sonner'
import { Asset, BinaryOrder, AccountType } from '@/types'
import { formatCurrency, DURATIONS } from '@/lib/utils'
import dynamic from 'next/dynamic'

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
  ArrowUpFromLine
} from 'lucide-react'
import OrderNotification from '@/components/OrderNotification'

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

// ===================================
// OPTIMIZED COMPONENTS
// ===================================

const PriceTicker = memo(({ asset, price }: { asset: Asset; price: any }) => {
  if (!price) return null

  return (
    <div className="h-16 bg-[#0f1419] border-b border-gray-800/50 flex items-center px-6 flex-shrink-0">
      <div className="flex items-center gap-6">
        <div>
          <div className="text-xs text-gray-400 mb-1">{asset.name}</div>
          <div className="text-2xl font-bold font-mono">{price.price.toFixed(3)}</div>
        </div>
        {price.change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-semibold ${
            price.change >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {price.change >= 0 ? (
              <ArrowUp className="w-4 h-4" />
            ) : (
              <ArrowDown className="w-4 h-4" />
            )}
            <span>
              {price.change >= 0 ? '+' : ''}{price.change.toFixed(3)}
              {' '}({price.change >= 0 ? '+' : ''}{((price.change / price.price) * 100).toFixed(2)}%)
            </span>
          </div>
        )}
        <div className="text-xs text-gray-400">
          {new Date(price.datetime).toLocaleTimeString()}
        </div>
      </div>
    </div>
  )
})

PriceTicker.displayName = 'PriceTicker'

// ===================================
// SMART POLLING MANAGER
// ===================================

class PollingManager {
  private intervalId: NodeJS.Timeout | null = null
  private callback: (() => Promise<void>) | null = null
  private currentInterval: number = 5000
  private isPolling: boolean = false
  
  // Adaptive intervals
  private readonly intervals = {
    idle: 5000,           // No active orders
    active: 2000,         // Has active orders
    nearExpiry: 500,      // Order expiring soon (< 10s)
    critical: 250         // Order expiring very soon (< 3s)
  }

  start(callback: () => Promise<void>, activeOrders: BinaryOrder[]) {
    this.callback = callback
    this.updateInterval(activeOrders)
    this.poll()
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isPolling = false
  }

  updateInterval(activeOrders: BinaryOrder[]) {
    const newInterval = this.calculateInterval(activeOrders)
    
    if (newInterval !== this.currentInterval) {
      this.currentInterval = newInterval
      
      // Restart polling with new interval
      if (this.intervalId) {
        clearInterval(this.intervalId)
        this.poll()
      }
    }
  }

  private calculateInterval(activeOrders: BinaryOrder[]): number {
    if (activeOrders.length === 0) {
      return this.intervals.idle
    }

    const now = Date.now()
    const minTimeLeft = Math.min(...activeOrders.map(order => {
      const exitTime = new Date(order.exit_time!).getTime()
      return exitTime - now
    }))

    if (minTimeLeft < 3000) return this.intervals.critical
    if (minTimeLeft < 10000) return this.intervals.nearExpiry
    return this.intervals.active
  }

  private poll() {
    if (!this.callback) return

    this.intervalId = setInterval(async () => {
      if (this.isPolling) return // Skip if still processing
      
      this.isPolling = true
      try {
        await this.callback!()
      } catch (error) {
        console.error('Polling error:', error)
      } finally {
        this.isPolling = false
      }
    }, this.currentInterval)
  }
}

// ===================================
// MAIN COMPONENT
// ===================================

export default function TradingPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  
  const selectedAsset = useSelectedAsset()
  const currentPrice = useCurrentPrice()
  const selectedAccountType = useSelectedAccountType()
  const { setSelectedAsset, setCurrentPrice, addPriceToHistory, setSelectedAccountType } = useTradingActions()

  // State
  const [assets, setAssets] = useState<Asset[]>([])
  const [realBalance, setRealBalance] = useState(0)
  const [demoBalance, setDemoBalance] = useState(0)
  const [amount, setAmount] = useState(10000)
  const [duration, setDuration] = useState(1)
  const [loading, setLoading] = useState(false)
  const [activeOrders, setActiveOrders] = useState<BinaryOrder[]>([])
  const [completedOrders, setCompletedOrders] = useState<BinaryOrder[]>([])
  const [notificationOrder, setNotificationOrder] = useState<BinaryOrder | null>(null)
  
  // UI State
  const [showAssetMenu, setShowAssetMenu] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showHistorySidebar, setShowHistorySidebar] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showAmountDropdown, setShowAmountDropdown] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [walletLoading, setWalletLoading] = useState(false)

  // Refs
  const previousOrdersRef = useRef<Map<string, BinaryOrder>>(new Map())
  const pollingManagerRef = useRef<PollingManager>(new PollingManager())
  const priceUnsubscribeRef = useRef<(() => void) | null>(null)
  const isLoadingDataRef = useRef(false)
  const mountedRef = useRef(true)

  // Computed values
  const currentBalance = useMemo(() => 
    selectedAccountType === 'real' ? realBalance : demoBalance,
    [selectedAccountType, realBalance, demoBalance]
  )

  const potentialProfit = useMemo(() => 
    selectedAsset ? (amount * selectedAsset.profitRate) / 100 : 0,
    [selectedAsset, amount]
  )

  const potentialPayout = useMemo(() => 
    amount + potentialProfit,
    [amount, potentialProfit]
  )

  // ===================================
  // OPTIMIZED LOAD DATA
  // ===================================

  const loadData = useCallback(async (force = false) => {
    // Prevent concurrent loads
    if (isLoadingDataRef.current && !force) {
      return
    }
    
    isLoadingDataRef.current = true

    try {
      const [assetsRes, balancesRes, ordersRes] = await Promise.all([
        api.getAssets(true),
        api.getBothBalances(),
        api.getOrders(undefined, 1, 100),
      ])

      if (!mountedRef.current) return

      const assetsList = assetsRes?.data?.assets || assetsRes?.assets || []
      const balances = balancesRes?.data || balancesRes
      const currentRealBalance = balances?.realBalance || 0
      const currentDemoBalance = balances?.demoBalance || 0
      const allOrders = ordersRes?.data?.orders || ordersRes?.orders || []

      const active = allOrders.filter((o: BinaryOrder) => o.status === 'ACTIVE')
      const completed = allOrders.filter((o: BinaryOrder) => 
        o.status === 'WON' || o.status === 'LOST'
      )

      // Detect completed orders
      detectOrderCompletion(active, completed)

      // Batch state updates
      setAssets(assetsList)
      setRealBalance(currentRealBalance)
      setDemoBalance(currentDemoBalance)
      setActiveOrders(active)
      setCompletedOrders(completed.slice(0, 10))

      // Update polling interval based on active orders
      pollingManagerRef.current.updateInterval(active)

      // Auto-select first asset if none selected
      if (assetsList.length > 0 && !selectedAsset) {
        setSelectedAsset(assetsList[0])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      isLoadingDataRef.current = false
    }
  }, [selectedAsset])

  // ===================================
  // INSTANT ORDER COMPLETION DETECTION
  // ===================================

  const detectOrderCompletion = useCallback((active: BinaryOrder[], completed: BinaryOrder[]) => {
    // Update tracking for active orders
    const newActiveMap = new Map<string, BinaryOrder>()
    active.forEach((order: BinaryOrder) => {
      newActiveMap.set(order.id, order)
    })

    // Check for newly completed orders
    completed.forEach((order: BinaryOrder) => {
      const wasActive = previousOrdersRef.current.has(order.id)
      const isNowComplete = order.status === 'WON' || order.status === 'LOST'
      
      if (wasActive && isNowComplete) {
        console.log('🎯 Order completed:', order.id, order.status)
        
        // Show notification
        setNotificationOrder(order)
        
        // Play sound
        if (typeof window !== 'undefined') {
          const audio = new Audio(order.status === 'WON' ? '/sounds/win.mp3' : '/sounds/lose.mp3')
          audio.volume = 0.3
          audio.play().catch(() => {})
        }
        
        // Update balance immediately (optimistic update)
        const balanceChange = order.profit || 0
        if (order.accountType === 'real') {
          setRealBalance(prev => prev + balanceChange)
        } else {
          setDemoBalance(prev => prev + balanceChange)
        }
      }
    })

    // Update tracking
    previousOrdersRef.current = newActiveMap
  }, [])

  // ===================================
  // LIFECYCLE
  // ===================================

  // Mount
  useEffect(() => {
    mountedRef.current = true
    
    if (!user) {
      router.push('/')
      return
    }
    
    const initializeData = async () => {
      await loadData(true)
      
      // Prefetch chart data
      if (selectedAsset?.realtimeDbPath) {
        let basePath = selectedAsset.realtimeDbPath
        if (basePath.endsWith('/current_price')) {
          basePath = basePath.replace('/current_price', '')
        }
        prefetchDefaultAsset(basePath).catch(console.error)
      }
    }
    
    initializeData()

    return () => {
      mountedRef.current = false
    }
  }, [user, router])

  // Smart polling
  useEffect(() => {
    if (!user) return

    pollingManagerRef.current.start(
      () => loadData(false),
      activeOrders
    )

    return () => {
      pollingManagerRef.current.stop()
    }
  }, [user, activeOrders.length])

  // Price subscription
  useEffect(() => {
    // Cleanup previous subscription
    if (priceUnsubscribeRef.current) {
      priceUnsubscribeRef.current()
      priceUnsubscribeRef.current = null
    }

    if (!selectedAsset?.realtimeDbPath || selectedAsset.dataSource !== 'realtime_db') {
      return
    }

    priceUnsubscribeRef.current = subscribeToPriceUpdates(
      selectedAsset.realtimeDbPath,
      (data) => {
        if (!mountedRef.current) return
        setCurrentPrice(data)
        addPriceToHistory(data)
      }
    )

    return () => {
      if (priceUnsubscribeRef.current) {
        priceUnsubscribeRef.current()
        priceUnsubscribeRef.current = null
      }
    }
  }, [selectedAsset?.id])

  // ===================================
  // OPTIMIZED HANDLERS
  // ===================================

  const handlePlaceOrder = useCallback(async (direction: 'CALL' | 'PUT') => {
    if (!selectedAsset) {
      toast.error('Please select an asset')
      return
    }
    if (amount <= 0) {
      toast.error('Invalid amount')
      return
    }
    if (amount > currentBalance) {
      toast.error(`Insufficient ${selectedAccountType} balance`)
      return
    }

    setLoading(true)
    try {
      await api.createOrder({
        accountType: selectedAccountType,
        asset_id: selectedAsset.id,
        direction,
        amount,
        duration,
      })

      toast.success(`${direction} order placed!`)
      
      // Optimistic update
      if (selectedAccountType === 'real') {
        setRealBalance(prev => prev - amount)
      } else {
        setDemoBalance(prev => prev - amount)
      }
      
      // Force immediate refresh
      setTimeout(() => loadData(true), 100)
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || 'Failed to place order'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [selectedAsset, amount, selectedAccountType, currentBalance, duration, loadData])

  const handleDeposit = useCallback(async () => {
    const amt = parseFloat(depositAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Invalid amount')
      return
    }

    setWalletLoading(true)
    try {
      await api.createBalanceEntry({
        accountType: selectedAccountType,
        type: 'deposit',
        amount: amt,
        description: `Deposit to ${selectedAccountType} account`,
      })
      toast.success(`Deposit successful!`)
      setDepositAmount('')
      setShowWalletModal(false)
      loadData(true)
    } catch (error) {
      toast.error('Deposit failed')
    } finally {
      setWalletLoading(false)
    }
  }, [depositAmount, selectedAccountType, loadData])

  const handleWithdraw = useCallback(async () => {
    const amt = parseFloat(withdrawAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Invalid amount')
      return
    }
    if (amt > currentBalance) {
      toast.error('Insufficient balance')
      return
    }

    setWalletLoading(true)
    try {
      await api.createBalanceEntry({
        accountType: selectedAccountType,
        type: 'withdrawal',
        amount: amt,
        description: `Withdrawal from ${selectedAccountType} account`,
      })
      toast.success(`Withdrawal successful!`)
      setWithdrawAmount('')
      setShowWalletModal(false)
      loadData(true)
    } catch (error) {
      toast.error('Withdrawal failed')
    } finally {
      setWalletLoading(false)
    }
  }, [withdrawAmount, selectedAccountType, currentBalance, loadData])

  if (!user) return null

  return (
    <div className="h-screen flex flex-col bg-[#0a0e17] text-white overflow-hidden">
      {/* Top Bar - Same as before but optimized */}
      <div className="h-20 bg-[#1a1f2e] border-b border-gray-800/50 flex items-center justify-between px-4 flex-shrink-0">
        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center gap-4 w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative">
              <Image 
                src="/stc-logo.png" 
                alt="STC Logo" 
                fill
                className="object-contain rounded-md"
              />
            </div>
            <span className="font-bold text-xl">STC AutoTrade</span>
          </div>

          {/* Asset Menu */}
          <div className="relative">
            <button
              onClick={() => setShowAssetMenu(!showAssetMenu)}
              className="flex items-center gap-2 bg-[#2f3648] hover:bg-[#3a4360] px-4 py-2.5 rounded-lg transition-colors border border-gray-800/50"
            >
              {selectedAsset ? (
                <>
                  <span className="text-sm font-medium">{selectedAsset.symbol}</span>
                  <span className="text-xs font-bold text-green-400">+{selectedAsset.profitRate}%</span>
                </>
              ) : (
                <span className="text-sm text-gray-400">Select Asset</span>
              )}
            </button>

            {showAssetMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAssetMenu(false)} />
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#232936] border border-gray-800/50 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => {
                        setSelectedAsset(asset)
                        setShowAssetMenu(false)
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#2a3142] transition-colors border-b border-gray-800/30 last:border-0 ${
                        selectedAsset?.id === asset.id ? 'bg-[#2a3142]' : ''
                      }`}
                    >
                      <div className="text-left">
                        <div className="text-sm font-medium">{asset.symbol}</div>
                      </div>
                      <div className="text-xs font-bold text-green-400">+{asset.profitRate}%</div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex-1"></div>

          {/* Account Type + Balance */}
          <div className="relative">
            <button
              onClick={() => setShowAccountMenu(!showAccountMenu)}
              className="flex flex-col items-start gap-0.5 hover:bg-[#232936] px-3 py-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">
                  Akun {selectedAccountType === 'real' ? 'Real' : 'Demo'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <div className="text-base font-bold font-mono text-white">
                {formatCurrency(currentBalance)}
              </div>
            </button>

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
                    <span className="text-base font-bold font-mono text-white pl-4">
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
                    <span className="text-base font-bold font-mono text-white pl-4">
                      {formatCurrency(realBalance)}
                    </span>
                  </button>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => router.push('/balance')}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#0C8DF8] rounded-lg"
          >
            <Wallet className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white">Deposit</span>
          </button>

          <button
            onClick={() => setShowHistorySidebar(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2f3648] hover:bg-[#3a4360] rounded-lg transition-colors border border-gray-800/50"
          >
            <History className="w-4 h-4" />
            <span className="text-sm">History</span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <span className="text-sm font-bold">{user.email[0].toUpperCase()}</span>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1f2e] border border-gray-800/50 rounded-lg shadow-2xl z-50">
                  <div className="px-4 py-3 border-b border-gray-800/30">
                    <div className="text-sm font-medium truncate">{user.email}</div>
                    <div className="text-xs text-gray-400 mt-1">{user.role}</div>
                  </div>
                  <button
                    onClick={() => router.push('/profile')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#232936] transition-colors text-left"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Settings</span>
                  </button>
                  <div className="border-t border-gray-800/30">
                    <button
                      onClick={() => {
                        logout()
                        router.push('/')
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-left text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Layout - Simplified */}
        <div className="flex lg:hidden items-center justify-between w-full">
          <div className="w-8 h-8 relative">
            <Image 
              src="/stc-logo.png" 
              alt="STC Logo" 
              fill
              className="object-contain rounded-md"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#1a1f2e] px-3 py-1.5 rounded-lg border border-gray-800/50">
            <span className="text-xs font-mono font-bold">{formatCurrency(currentBalance)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowWalletModal(true)}
              className="w-8 h-8 flex items-center justify-center"
            >
              <Wallet className="w-4.5 h-4.5 text-blue-400" />
            </button>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-8 h-8 flex items-center justify-center"
            >
              <Menu className="w-4.5 h-4.5 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {selectedAsset && currentPrice && (
            <div className="hidden lg:block">
              <PriceTicker asset={selectedAsset} price={currentPrice} />
            </div>
          )}

          <div className="flex-1 bg-[#0a0e17] relative overflow-hidden">
            {selectedAsset ? (
              <TradingChart 
                activeOrders={activeOrders}
                currentPrice={currentPrice?.price}
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

        {/* Trading Panel - Desktop */}
        <div className="hidden lg:block w-64 bg-[#0f1419] border-l border-gray-800/50 flex-shrink-0">
          <div className="h-full flex flex-col p-4 space-y-4 overflow-hidden">
            {/* Amount Input */}
            <div className="bg-[#1a1f2e] rounded-xl px-3 py-2">
              <div className="text-[10px] text-gray-500 text-center leading-none">Amount</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAmount(prev => Math.max(1000, prev - 10000))}
                  className="hover:bg-[#232936] rounded-lg p-1.5 transition-colors flex-shrink-0"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="flex-1 min-w-0 bg-transparent border-0 text-center text-base font-mono text-white focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1000"
                  step="1000"
                />
                
                <button
                  onClick={() => setAmount(prev => prev + 10000)}
                  className="hover:bg-[#232936] rounded-lg p-1.5 transition-colors flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Duration Select */}
            <div className="bg-[#1a1f2e] rounded-xl px-3 py-0">
              <div className="text-[10px] text-gray-500 text-center leading-none pt-2">Duration</div>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-transparent border-0 text-center text-base text-white focus:outline-none focus:ring-0 appearance-none cursor-pointer my-0"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d} minute{d > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {/* Payout Info */}
            {selectedAsset && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl px-3 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Pendapatan</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-green-400">+{selectedAsset.profitRate}%</span>
                    <span className="font-mono font-bold text-green-400">{formatCurrency(potentialPayout)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Buy/Sell Buttons */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handlePlaceOrder('CALL')}
                  disabled={loading || !selectedAsset}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center shadow-lg shadow-green-500/20"
                >
                  <ArrowUp className="w-6 h-6" />
                </button>

                <button
                  onClick={() => handlePlaceOrder('PUT')}
                  disabled={loading || !selectedAsset}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center shadow-lg shadow-red-500/20"
                >
                  <ArrowDown className="w-6 h-6" />
                </button>
              </div>

              {loading && (
                <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-2 mt-3">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                  Processing...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Trading Panel - Same structure, optimized callbacks */}
      <div className="lg:hidden bg-[#0f1419] border-t border-gray-800/50 p-3">
        <div className="space-y-3">
          {/* Account Type Selector */}
          <div className="bg-[#1a1f2e] border border-gray-800/50 rounded-xl p-3">
            <div className="text-xs text-gray-400 text-center mb-2 font-medium">Select Account</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedAccountType('demo')}
                className={`px-3 py-3 rounded-lg text-xs font-bold transition-all ${
                  selectedAccountType === 'demo'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-[#0f1419] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span>DEMO</span>
                  <span className="font-mono text-[10px]">{formatCurrency(demoBalance)}</span>
                </div>
              </button>
              <button
                onClick={() => setSelectedAccountType('real')}
                className={`px-3 py-3 rounded-lg text-xs font-bold transition-all ${
                  selectedAccountType === 'real'
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-[#0f1419] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span>REAL</span>
                  <span className="font-mono text-[10px]">{formatCurrency(realBalance)}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Amount & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-lg px-3 py-2.5 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500/50"
                min="1000"
                step="1000"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-lg px-3 py-2.5 text-center text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d}m</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payout Display */}
          {selectedAsset && (
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full px-4 py-2">
                <span className="text-xs text-gray-400">Pendapatan</span>
                <span className="text-xs font-semibold text-green-400">+{selectedAsset.profitRate}%</span>
                <span className="text-sm font-mono font-bold text-green-400">
                  {formatCurrency(potentialPayout)}
                </span>
              </div>
            </div>
          )}

          {/* Order Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handlePlaceOrder('CALL')}
              disabled={loading || !selectedAsset}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 py-3.5 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <ArrowUp className="w-5 h-5" />
              <span>BUY</span>
            </button>
            <button
              onClick={() => handlePlaceOrder('PUT')}
              disabled={loading || !selectedAsset}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 py-3.5 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <ArrowDown className="w-5 h-5" />
              <span>SELL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modals & Sidebars - Same as before */}
      {showWalletModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm animate-fade-in" 
            onClick={() => setShowWalletModal(false)} 
          />
          <div className="fixed bottom-0 left-0 right-0 bg-[#0f1419] rounded-t-3xl z-50 animate-slide-up border-t border-gray-800/50">
            <div className="p-6">
              <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6"></div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Wallet</h3>
                <button 
                  onClick={() => setShowWalletModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#1a1f2e] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">REAL Balance</div>
                  <div className="text-2xl font-bold font-mono text-green-400">{formatCurrency(realBalance)}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">DEMO Balance</div>
                  <div className="text-2xl font-bold font-mono text-blue-400">{formatCurrency(demoBalance)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => {
                    setShowWalletModal(false)
                    setTimeout(() => router.push('/balance'), 300)
                  }}
                  className="bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl p-6 transition-all group"
                >
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-green-500/30 transition-colors">
                    <ArrowDownToLine className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-400 mb-1">Deposit</div>
                    <div className="text-xs text-gray-400">Add funds</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowWalletModal(false)
                    setTimeout(() => router.push('/balance'), 300)
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl p-6 transition-all group"
                >
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-red-500/30 transition-colors">
                    <ArrowUpFromLine className="w-6 h-6 text-red-400" />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-red-400 mb-1">Withdraw</div>
                    <div className="text-xs text-gray-400">Cash out</div>
                  </div>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-800/50">
                <button
                  onClick={() => {
                    setShowWalletModal(false)
                    setTimeout(() => router.push('/history'), 300)
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <History className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Transaction History</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 rotate-[-90deg]" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showMobileMenu && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-[#0f1419] border-l border-gray-800/50 z-50 p-4 animate-slide-left">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">Menu</h3>
              <button onClick={() => setShowMobileMenu(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="mb-4">
                <label className="text-xs text-gray-400 mb-2 block">Select Asset</label>
                <select
                  value={selectedAsset?.id || ''}
                  onChange={(e) => {
                    const asset = assets.find(a => a.id === e.target.value)
                    if (asset) {
                      setSelectedAsset(asset)
                      setShowMobileMenu(false)
                    }
                  }}
                  className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50"
                >
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.symbol} - {asset.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => {
                  setShowHistorySidebar(true)
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>

              <button
                onClick={() => {
                  router.push('/balance')
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <Wallet className="w-4 h-4" />
                <span>Balance</span>
              </button>
              
              <button
                onClick={() => {
                  router.push('/profile')
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  logout()
                  router.push('/')
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </>
      )}

      {showHistorySidebar && (
        <HistorySidebar 
          isOpen={showHistorySidebar} 
          onClose={() => setShowHistorySidebar(false)} 
        />
      )}

      <OrderNotification 
        order={notificationOrder}
        onClose={() => setNotificationOrder(null)}
      />

      <style jsx>{`
        @keyframes slide-left {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-slide-left { animation: slide-left 0.3s ease-out; }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  )
}