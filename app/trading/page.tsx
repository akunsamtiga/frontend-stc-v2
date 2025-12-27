// app/trading/page.tsx - INSTANT ORDER COMPLETION DETECTION
'use client'

import { useEffect, useState, useCallback, memo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth'
import { useTradingStore, useSelectedAsset, useCurrentPrice } from '@/store/trading'
import { api } from '@/lib/api'
import { subscribeToPriceUpdates } from '@/lib/firebase'
import { toast } from 'sonner'
import { Asset, BinaryOrder } from '@/types'
import { formatCurrency, DURATIONS } from '@/lib/utils'
import dynamic from 'next/dynamic'
import { prefetchDefaultAsset } from '@/lib/firebase'

import { 
  TrendingUp,
  TrendingDown,
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
import RealtimeMonitor from '@/components/RealtimeMonitor'
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
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
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

export default function TradingPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  
  const selectedAsset = useSelectedAsset()
  const currentPrice = useCurrentPrice()
  const { setSelectedAsset, setCurrentPrice, addPriceToHistory } = useTradingStore()

  const [assets, setAssets] = useState<Asset[]>([])
  const [balance, setBalance] = useState(0)
  const [amount, setAmount] = useState(10000)
  const [duration, setDuration] = useState(1)
  const [loading, setLoading] = useState(false)
  const [activeOrders, setActiveOrders] = useState<BinaryOrder[]>([])
  const [completedOrders, setCompletedOrders] = useState<BinaryOrder[]>([])
  const [notificationOrder, setNotificationOrder] = useState<BinaryOrder | null>(null)
  
  // ✅ NEW: Track order states untuk instant detection
  const previousOrdersRef = useRef<Map<string, BinaryOrder>>(new Map())
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const nearExpiryCheckRef = useRef<NodeJS.Timeout | null>(null)
  
  const [showAssetMenu, setShowAssetMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showHistorySidebar, setShowHistorySidebar] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showAmountDropdown, setShowAmountDropdown] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [walletLoading, setWalletLoading] = useState(false)

  // ✅ Load data on mount
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    const initializeData = async () => {
      await loadData()
      
      if (selectedAsset && selectedAsset.realtimeDbPath) {
        const pathParts = selectedAsset.realtimeDbPath.split('/') || []
        const assetPath = pathParts.slice(0, -1).join('/') || `/${selectedAsset.symbol.toLowerCase()}`
        prefetchDefaultAsset(assetPath).catch(console.error)
      }
    }
    
    initializeData()
  }, [user, router])

  // ✅ Price subscription
  useEffect(() => {
    if (!selectedAsset) return

    let unsubscribe: (() => void) | undefined

    if (selectedAsset.dataSource === 'realtime_db' && selectedAsset.realtimeDbPath) {
      console.log('📡 Subscribing to price:', selectedAsset.realtimeDbPath)
      
      unsubscribe = subscribeToPriceUpdates(selectedAsset.realtimeDbPath, (data) => {
        console.log('💰 Price update:', data.price)
        setCurrentPrice(data)
        addPriceToHistory(data)
      })
    }

    return () => {
      if (unsubscribe) {
        console.log('🔕 Unsubscribing from price updates')
        unsubscribe()
      }
    }
  }, [selectedAsset?.id])

  // ✅ ULTRA-AGGRESSIVE POLLING dengan adaptive interval
  useEffect(() => {
    if (!user) return

    const startAdaptivePolling = () => {
      // Clear existing interval
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      
      const poll = async () => {
        try {
          const ordersRes = await api.getOrders(undefined, 1, 100)
          const allOrders = ordersRes?.data?.orders || ordersRes?.orders || []
          
          const active = allOrders.filter((o: BinaryOrder) => o.status === 'ACTIVE')
          const completed = allOrders.filter((o: BinaryOrder) => 
            o.status === 'WON' || o.status === 'LOST'
          )

          // ✅ INSTANT DETECTION - Check for status changes
          detectOrderCompletion(active, completed)

          setActiveOrders(active)
          setCompletedOrders(completed.slice(0, 10))

        } catch (error) {
          console.error('Polling error:', error)
        }
      }

      // ✅ Tentukan interval berdasarkan active orders
      const getPollingInterval = () => {
        const hasActiveOrders = activeOrders.length > 0
        
        // Cek apakah ada order yang akan expire dalam 10 detik
        const hasNearExpiry = activeOrders.some(order => {
          const timeLeft = new Date(order.exit_time!).getTime() - Date.now()
          return timeLeft > 0 && timeLeft < 10000 // < 10 seconds
        })

        if (hasNearExpiry) {
          return 1000 // ✅ SUPER FAST: 1 detik saat order hampir selesai
        } else if (hasActiveOrders) {
          return 2000 // ✅ FAST: 2 detik saat ada active orders
        } else {
          return 5000 // ✅ NORMAL: 5 detik saat tidak ada active orders
        }
      }

      // Initial poll
      poll()

      // Start polling with adaptive interval
      const interval = getPollingInterval()
      pollingIntervalRef.current = setInterval(poll, interval)
      
      console.log(`🔄 Polling started: ${interval}ms interval`)
    }

    startAdaptivePolling()

    // ✅ Restart polling dengan interval baru saat activeOrders berubah
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [user, activeOrders.length]) // Re-run saat jumlah active orders berubah

  // ✅ CLIENT-SIDE COUNTDOWN CHECK - cek setiap detik
  useEffect(() => {
    if (activeOrders.length === 0) {
      if (nearExpiryCheckRef.current) {
        clearInterval(nearExpiryCheckRef.current)
      }
      return
    }

    nearExpiryCheckRef.current = setInterval(() => {
      const now = Date.now()
      
      activeOrders.forEach(order => {
        const exitTime = new Date(order.exit_time!).getTime()
        const timeLeft = exitTime - now

        // ✅ Jika order sudah melewati waktu expiry
        if (timeLeft <= 0) {
          console.log(`⏰ Order ${order.id} should be expired! Forcing refresh...`)
          // Force refresh immediate
          loadData()
        }
        
        // ✅ Jika order akan expire dalam 3 detik, polling lebih agresif
        if (timeLeft > 0 && timeLeft < 3000) {
          console.log(`⚡ Order ${order.id} expiring in ${Math.round(timeLeft/1000)}s - Forcing check...`)
          loadData()
        }
      })
    }, 1000) // Check setiap detik

    return () => {
      if (nearExpiryCheckRef.current) {
        clearInterval(nearExpiryCheckRef.current)
      }
    }
  }, [activeOrders])

  // ✅ INSTANT DETECTION function
  const detectOrderCompletion = useCallback((active: BinaryOrder[], completed: BinaryOrder[]) => {
    // Update previousOrders dengan active orders saat ini
    active.forEach((order: BinaryOrder) => {
      previousOrdersRef.current.set(order.id, order)
    })

    // Check untuk newly completed orders
    completed.forEach((order: BinaryOrder) => {
      const previousOrder = previousOrdersRef.current.get(order.id)
      
      // ✅ Jika order sebelumnya ACTIVE dan sekarang completed
      if (previousOrder && previousOrder.status === 'ACTIVE' && 
          (order.status === 'WON' || order.status === 'LOST')) {
        
        console.log('🎯 INSTANT DETECTION! Order completed:', order.id, order.status)
        
        // Show notification immediately
        setNotificationOrder(order)
        
        // Play sound
        if (typeof window !== 'undefined') {
          const audio = new Audio(order.status === 'WON' ? '/sounds/win.mp3' : '/sounds/lose.mp3')
          audio.volume = 0.3
          audio.play().catch(e => console.log('Audio play failed:', e))
        }
        
        // Remove from tracking
        previousOrdersRef.current.delete(order.id)
        
        // Force balance refresh
        setTimeout(() => {
          api.getCurrentBalance().then(res => {
            const newBalance = res?.data?.balance || res?.balance || 0
            setBalance(newBalance)
          })
        }, 500)
      }
    })
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [assetsRes, balanceRes, ordersRes] = await Promise.all([
        api.getAssets(true),
        api.getCurrentBalance(),
        api.getOrders(undefined, 1, 100),
      ])

      const assetsList = assetsRes?.data?.assets || assetsRes?.assets || []
      const currentBalance = balanceRes?.data?.balance || balanceRes?.balance || 0
      const allOrders = ordersRes?.data?.orders || ordersRes?.orders || []

      const active = allOrders.filter((o: BinaryOrder) => o.status === 'ACTIVE')
      const completed = allOrders.filter((o: BinaryOrder) => 
        o.status === 'WON' || o.status === 'LOST'
      )

      // ✅ Check for completions
      detectOrderCompletion(active, completed)

      setAssets(assetsList)
      setBalance(currentBalance)
      setActiveOrders(active)
      setCompletedOrders(completed.slice(0, 10))

      if (assetsList.length > 0 && !selectedAsset) {
        setSelectedAsset(assetsList[0])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setAssets([])
      setBalance(0)
      setActiveOrders([])
      setCompletedOrders([])
    }
  }, [selectedAsset, detectOrderCompletion])

  const handlePlaceOrder = useCallback(async (direction: 'CALL' | 'PUT') => {
    if (!selectedAsset) {
      toast.error('Please select an asset')
      return
    }
    if (amount <= 0) {
      toast.error('Invalid amount')
      return
    }
    if (amount > balance) {
      toast.error('Insufficient balance')
      return
    }

    setLoading(true)
    try {
      await api.createOrder({
        asset_id: selectedAsset.id,
        direction,
        amount,
        duration,
      })

      toast.success(`${direction} order placed successfully!`)
      setBalance((prev) => prev - amount)
      
      // ✅ Reload immediately
      setTimeout(loadData, 300)
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || 'Failed to place order'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [selectedAsset, amount, balance, duration, loadData])

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Invalid amount')
      return
    }

    setWalletLoading(true)
    try {
      await api.createBalanceEntry({
        type: 'deposit',
        amount: amt,
        description: 'Deposit',
      })
      toast.success('Deposit successful!')
      setDepositAmount('')
      setShowWalletModal(false)
      loadData()
    } catch (error) {
      console.error('Deposit failed:', error)
      toast.error('Deposit failed')
    } finally {
      setWalletLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Invalid amount')
      return
    }
    if (amt > balance) {
      toast.error('Insufficient balance')
      return
    }

    setWalletLoading(true)
    try {
      await api.createBalanceEntry({
        type: 'withdrawal',
        amount: amt,
        description: 'Withdrawal',
      })
      toast.success('Withdrawal successful!')
      setWithdrawAmount('')
      setShowWalletModal(false)
      loadData()
    } catch (error) {
      console.error('Withdrawal failed:', error)
      toast.error('Withdrawal failed')
    } finally {
      setWalletLoading(false)
    }
  }

  const potentialProfit = selectedAsset ? (amount * selectedAsset.profitRate) / 100 : 0
  const potentialPayout = amount + potentialProfit

  if (!user) return null

  return (
    <div className="h-screen flex flex-col bg-[#0a0e17] text-white overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-[#0f1419] border-b border-gray-800/50 flex items-center justify-between px-4 flex-shrink-0">
        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center gap-4 w-full">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 relative">
              <Image 
                src="/stc-logo.png" 
                alt="STC Logo" 
                fill
                className="object-contain rounded-md"
              />
            </div>
            <span className="font-bold text-sm">STC AutoTrade</span>
          </div>

          {/* Asset Menu */}
          <div className="relative">
            <button
              onClick={() => setShowAssetMenu(!showAssetMenu)}
              className="flex items-center gap-2 bg-[#1a1f2e] hover:bg-[#232936] px-3 py-1.5 rounded-lg transition-colors border border-gray-800/50"
            >
              {selectedAsset ? (
                <>
                  <span className="text-sm font-medium">{selectedAsset.symbol}</span>
                  <span className="text-xs font-bold text-green-400">+{selectedAsset.profitRate}%</span>
                </>
              ) : (
                <span className="text-sm text-gray-400">Select Asset</span>
              )}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showAssetMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAssetMenu(false)} />
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#1a1f2e] border border-gray-800/50 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto">
                  {assets.map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => {
                        setSelectedAsset(asset)
                        setShowAssetMenu(false)
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-[#232936] transition-colors border-b border-gray-800/30 last:border-0 ${
                        selectedAsset?.id === asset.id ? 'bg-[#232936]' : ''
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

          {/* Balance & Actions */}
          <div className="flex items-center gap-2 bg-[#1a1f2e] px-3 py-1.5 rounded-lg border border-gray-800/50">
            <span className="text-sm font-mono font-bold">{formatCurrency(balance)}</span>
          </div>

          <button
            onClick={() => router.push('/balance')}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg transition-colors group"
          >
            <Wallet className="w-4 h-4 text-green-400 group-hover:text-green-300" />
            <span className="text-sm font-medium text-green-400 group-hover:text-green-300">Deposit</span>
          </button>

          <button
            onClick={() => setShowHistorySidebar(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors border border-gray-800/50"
          >
            <History className="w-4 h-4" />
            <span className="text-sm">History</span>
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <span className="text-xs font-bold">{user.email[0].toUpperCase()}</span>
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

        {/* Mobile Layout */}
        <div className="flex lg:hidden items-center justify-between w-full">
          <div className="flex items-center w-16">
            <div className="w-8 h-8 relative">
              <Image 
                src="/stc-logo.png" 
                alt="STC Logo" 
                fill
                className="object-contain rounded-md"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#1a1f2e] px-3 py-1.5 rounded-lg border border-gray-800/50">
            <span className="text-sm font-mono font-bold">{formatCurrency(balance)}</span>
          </div>

          <div className="flex items-center gap-2 justify-end w-16">
            <button
              onClick={() => setShowWalletModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              aria-label="Wallet"
            >
              <Wallet className="w-4.5 h-4.5 text-blue-400" />
            </button>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-4.5 h-4.5 text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {selectedAsset && currentPrice && (
            <div className="hidden lg:block">
              <PriceTicker asset={selectedAsset} price={currentPrice} />
            </div>
          )}

          <div className="flex-1 bg-[#0a0e17] relative" style={{ minHeight: '400px' }}>
            {selectedAsset ? (
              <TradingChart 
                activeOrders={activeOrders}
                currentPrice={currentPrice?.price}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
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
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-medium">Amount</label>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setAmount(prev => Math.max(1000, prev - 10000))}
                  className="w-8 h-9 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-800/50 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="flex-1 min-w-0 bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-2 py-2.5 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500/50 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  min="1000"
                  step="1000"
                />
                
                <button
                  onClick={() => setAmount(prev => prev + 10000)}
                  className="w-8 h-9 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-800/50 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Time Select */}
            <div>
              <label className="text-xs text-gray-400 mb-2 block font-medium flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Time (m)
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-3 py-2.5 text-center text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none cursor-pointer"
                style={{
                  backgroundImage: 'none'
                }}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d}m</option>
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
                  <TrendingUp className="w-6 h-6" />
                </button>

                <button
                  onClick={() => handlePlaceOrder('PUT')}
                  disabled={loading || !selectedAsset}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed py-3.5 rounded-xl font-bold text-white transition-all flex items-center justify-center shadow-lg shadow-red-500/20"
                >
                  <TrendingDown className="w-6 h-6" />
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

      {/* Mobile Trading Panel */}
      <div className="lg:hidden bg-[#0f1419] border-t border-gray-800/50 p-3">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <label className="text-xs text-gray-400 mb-1.5 block font-medium">Amount</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-lg pl-3 pr-9 py-2.5 text-center text-sm font-mono font-bold text-white focus:outline-none focus:border-blue-500/50"
                  min="1000"
                  step="1000"
                />
                <button
                  onClick={() => setShowAmountDropdown(!showAmountDropdown)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {showAmountDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowAmountDropdown(false)} 
                  />
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1f2e] border border-gray-800/50 rounded-lg shadow-2xl z-50 overflow-hidden">
                    {[10000, 25000, 50000, 75000, 100000, 250000, 500000, 1000000].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setAmount(preset)
                          setShowAmountDropdown(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm font-mono hover:bg-[#232936] transition-colors border-b border-gray-800/30 last:border-0 ${
                          amount === preset ? 'bg-[#232936] text-blue-400' : 'text-gray-300'
                        }`}
                      >
                        {formatCurrency(preset)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="relative">
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

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handlePlaceOrder('CALL')}
              disabled={loading || !selectedAsset}
              className="bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:opacity-50 py-3.5 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <TrendingUp className="w-5 h-5" />
              <span>BUY</span>
            </button>
            <button
              onClick={() => handlePlaceOrder('PUT')}
              disabled={loading || !selectedAsset}
              className="bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:opacity-50 py-3.5 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <TrendingDown className="w-5 h-5" />
              <span>SELL</span>
            </button>
          </div>

          {loading && (
            <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
              Processing order...
            </div>
          )}
        </div>
      </div>

      {/* Wallet Modal */}
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

              <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-blue-500/20 rounded-2xl p-6 mb-6">
                <div className="text-sm text-gray-400 mb-2">Current Balance</div>
                <div className="text-4xl font-bold font-mono mb-1">{formatCurrency(balance)}</div>
                <div className="text-xs text-gray-500">Available for trading</div>
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

      {/* Mobile Menu */}
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

      {/* History Sidebar */}
      {showHistorySidebar && (
        <HistorySidebar 
          isOpen={showHistorySidebar} 
          onClose={() => setShowHistorySidebar(false)} 
        />
      )}

      {/* ORDER NOTIFICATION */}
      <OrderNotification 
        order={notificationOrder}
        onClose={() => setNotificationOrder(null)}
      />

      {process.env.NODE_ENV === 'development' && <RealtimeMonitor />}
    
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

        .animate-slide-left {
          animation: slide-left 0.3s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}