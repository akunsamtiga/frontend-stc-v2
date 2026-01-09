'use client'

import { useEffect, useState, useCallback, memo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { unstable_batchedUpdates } from 'react-dom'
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
  ArrowUpFromLine,
  TrendingUp,
  Activity,
  Logs
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

class AggressivePollingManager {
  private intervalId: NodeJS.Timeout | null = null
  private isPolling = false
  private pollCallback: (() => Promise<void>) | null = null
  private activeOrders: BinaryOrder[] = []
  private consecutiveEmptyPolls = 0
  
  start(callback: () => Promise<void>) {
    this.pollCallback = callback
    this.isPolling = true
    this.consecutiveEmptyPolls = 0
    this.scheduleNext()
  }

  stop() {
    this.isPolling = false
    if (this.intervalId) {
      clearTimeout(this.intervalId)
      this.intervalId = null
    }
  }

  updateActiveOrders(orders: BinaryOrder[]) {
    const hadOrders = this.activeOrders.length > 0
    this.activeOrders = orders
    
    if (hadOrders !== (orders.length > 0)) {
      this.consecutiveEmptyPolls = 0
    }
  }

  private getInterval(): number {
    if (this.activeOrders.length === 0) {
      this.consecutiveEmptyPolls++
      
      if (this.consecutiveEmptyPolls < 6) {
        return 500
      } else if (this.consecutiveEmptyPolls < 20) {
        return 1000
      } else {
        return 3000
      }
    }

    this.consecutiveEmptyPolls = 0
    
    const now = Date.now()
    
    const hasVeryNearExpiry = this.activeOrders.some(order => {
      const exitTime = new Date(order.exit_time!).getTime()
      const timeLeft = exitTime - now
      return timeLeft > 0 && timeLeft < 3000
    })
    
    if (hasVeryNearExpiry) {
      return 200
    }
    
    const hasNearExpiry = this.activeOrders.some(order => {
      const exitTime = new Date(order.exit_time!).getTime()
      const timeLeft = exitTime - now
      return timeLeft > 0 && timeLeft < 10000
    })

    if (hasNearExpiry) {
      return 500
    }

    return 1000
  }

  private async scheduleNext() {
    if (!this.isPolling || !this.pollCallback) return

    const startTime = Date.now()
    
    try {
      await this.pollCallback()
    } catch (error) {
      console.error('Polling error:', error)
    }

    if (this.isPolling) {
      const executionTime = Date.now() - startTime
      const interval = this.getInterval()
      
      const adjustedInterval = Math.max(100, interval - executionTime)
      
      this.intervalId = setTimeout(() => this.scheduleNext(), adjustedInterval)
    }
  }
}

export default function TradingPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  
  const selectedAsset = useSelectedAsset()
  const currentPrice = useCurrentPrice()
  const selectedAccountType = useSelectedAccountType()
  const { setSelectedAsset, setCurrentPrice, addPriceToHistory, setSelectedAccountType } = useTradingActions()

  const [assets, setAssets] = useState<Asset[]>([])
  const [realBalance, setRealBalance] = useState(0)
  const [demoBalance, setDemoBalance] = useState(0)
  const [amount, setAmount] = useState(10000)
  const [duration, setDuration] = useState(1)
  const [loading, setLoading] = useState(false)
  const [activeOrders, setActiveOrders] = useState<BinaryOrder[]>([])
  const [completedOrders, setCompletedOrders] = useState<BinaryOrder[]>([])
  const [notificationOrder, setNotificationOrder] = useState<BinaryOrder | null>(null)
  
  const notifiedOrdersRef = useRef<Set<string>>(new Set())
  const previousOrdersRef = useRef<Map<string, BinaryOrder>>(new Map())
  const balanceUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingManagerRef = useRef(new AggressivePollingManager())
  
  const [showAssetMenu, setShowAssetMenu] = useState(false)
  const [showAccountMenu, setShowAccountMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showHistorySidebar, setShowHistorySidebar] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [showAmountDropdown, setShowAmountDropdown] = useState(false)
  const [showLeftSidebar, setShowLeftSidebar] = useState(false)

  const currentBalance = selectedAccountType === 'real' ? realBalance : demoBalance

  const detectOrderCompletion = useCallback((active: BinaryOrder[], completed: BinaryOrder[]) => {
    active.forEach((order: BinaryOrder) => {
      previousOrdersRef.current.set(order.id, order)
    })

    completed.forEach((order: BinaryOrder) => {
      if (notifiedOrdersRef.current.has(order.id)) {
        return
      }

      const previousOrder = previousOrdersRef.current.get(order.id)
      
      if (previousOrder && 
          previousOrder.status === 'ACTIVE' && 
          (order.status === 'WON' || order.status === 'LOST')) {
        
        notifiedOrdersRef.current.add(order.id)
        
        setNotificationOrder(order)
        
        if (typeof window !== 'undefined') {
          const audio = new Audio(order.status === 'WON' ? '/sounds/win.mp3' : '/sounds/lose.mp3')
          audio.volume = 0.3
          audio.play().catch(e => console.log('Audio play failed:', e))
        }
        
        previousOrdersRef.current.delete(order.id)
        
        if (balanceUpdateTimeoutRef.current) {
          clearTimeout(balanceUpdateTimeoutRef.current)
        }
        
        balanceUpdateTimeoutRef.current = setTimeout(() => {
          api.getBothBalances().then(res => {
            const balances = res?.data || res
            unstable_batchedUpdates(() => {
              setRealBalance(balances?.realBalance || 0)
              setDemoBalance(balances?.demoBalance || 0)
            })
          }).catch(console.error)
        }, 100)
      }
    })

    const completedIds = new Set(completed.map(o => o.id))
    const notifiedIds = Array.from(notifiedOrdersRef.current)
    notifiedIds.forEach(id => {
      if (!completedIds.has(id)) {
        notifiedOrdersRef.current.delete(id)
      }
    })
  }, [])

  const loadData = useCallback(async () => {
    try {
      const [assetsRes, balancesRes, ordersRes] = await Promise.all([
        api.getAssets(true),
        api.getBothBalances(),
        api.getOrders(undefined, 1, 100),
      ])

      const assetsList = assetsRes?.data?.assets || assetsRes?.assets || []
      const balances = balancesRes?.data || balancesRes
      const currentRealBalance = balances?.realBalance || 0
      const currentDemoBalance = balances?.demoBalance || 0
      const allOrders = ordersRes?.data?.orders || ordersRes?.orders || []

      const active = allOrders.filter((o: BinaryOrder) => o.status === 'ACTIVE')
      const completed = allOrders.filter((o: BinaryOrder) => 
        o.status === 'WON' || o.status === 'LOST'
      )

      detectOrderCompletion(active, completed)

      unstable_batchedUpdates(() => {
        setAssets(assetsList)
        setRealBalance(currentRealBalance)
        setDemoBalance(currentDemoBalance)
        setActiveOrders(active)
        setCompletedOrders(completed.slice(0, 10))
      })

      pollingManagerRef.current.updateActiveOrders(active)

      if (assetsList.length > 0 && !selectedAsset) {
        setSelectedAsset(assetsList[0])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      unstable_batchedUpdates(() => {
        setAssets([])
        setRealBalance(0)
        setDemoBalance(0)
        setActiveOrders([])
        setCompletedOrders([])
      })
    }
  }, [selectedAsset, detectOrderCompletion, setSelectedAsset])

    const handleLogout = useCallback(async () => {
    try {
      console.log('🚪 Starting logout...')
      
      // 1. Clear API client
      api.removeToken()
      api.clearCache()
      
      // 2. Logout from store
      logout()
      
      // 3. Clear all storage
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      // 4. Small delay for cleanup
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 5. Force redirect
      router.replace('/')
      
      console.log('✅ Logout completed')
    } catch (error) {
      console.error('❌ Logout error:', error)
      router.replace('/')
    }
  }, [logout, router])

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
        
        prefetchDefaultAsset(basePath).catch(console.error)
      }
    }
    
    initializeData()
  }, [user, router])

  useEffect(() => {
    if (!user) return

    pollingManagerRef.current.start(loadData)

    return () => {
      pollingManagerRef.current.stop()
    }
  }, [user, loadData])

  useEffect(() => {
    if (!selectedAsset) return

    let unsubscribe: (() => void) | undefined

    if (selectedAsset.dataSource === 'realtime_db' && selectedAsset.realtimeDbPath) {
      unsubscribe = subscribeToPriceUpdates(
        selectedAsset.realtimeDbPath,
        (data) => {
          setCurrentPrice(data)
          addPriceToHistory(data)
        }
      )
    }

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [selectedAsset?.id, setCurrentPrice, addPriceToHistory])

  const handleCloseNotification = useCallback(() => {
    setNotificationOrder(null)
  }, [])

  useEffect(() => {
    return () => {
      if (balanceUpdateTimeoutRef.current) {
        clearTimeout(balanceUpdateTimeoutRef.current)
      }
      notifiedOrdersRef.current.clear()
      previousOrdersRef.current.clear()
    }
  }, [])

  const handlePlaceOrder = useCallback(async (direction: 'CALL' | 'PUT') => {
    if (!selectedAsset) {
      toast.error('Please select an asset')
      return
    }
    if (amount <= 0) {
      toast.error('Invalid amount')
      return
    }
    
    const currentBalance = selectedAccountType === 'real' ? realBalance : demoBalance
    
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

      toast.success(`${direction} order placed successfully!`)
      
      unstable_batchedUpdates(() => {
        if (selectedAccountType === 'real') {
          setRealBalance((prev) => prev - amount)
        } else {
          setDemoBalance((prev) => prev - amount)
        }
      })
      
      setTimeout(loadData, 200)
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || 'Failed to place order'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [selectedAsset, amount, selectedAccountType, realBalance, demoBalance, duration, loadData])

  const potentialProfit = selectedAsset ? (amount * selectedAsset.profitRate) / 100 : 0
  const potentialPayout = amount + potentialProfit

  if (!user) return null

  return (
    <div className="h-screen flex flex-col bg-[#0a0e17] text-white overflow-hidden">
      <div className="h-14 lg:h-16 bg-[#1a1f2e] border-b border-gray-800/50 flex items-center justify-between px-2 flex-shrink-0">
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
              <div className="text-base font-bold  text-white">
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
                    <span className="text-base font-bold  text-white pl-4">
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
                    <span className="text-base font-bold  text-white pl-4">
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
                        setShowUserMenu(false)
                        handleLogout()
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

        <div className="flex lg:hidden items-center justify-between w-full px-1">
          {/* Left side - Hamburger + Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowLeftSidebar(true)}
              className="w-8 h-8 flex items-center justify-center hover:bg-[#232936] rounded-lg transition-colors"
            >
              <Logs className="w-6 h-6 font-bold text-white" />
            </button>
            <div className="w-8 h-8 relative">
              <Image 
                src="/stc-logo.png" 
                alt="STC Logo" 
                fill
                className="object-contain rounded-md"
              />
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Account Selector - Mobile Compact */}
            <div className="relative">
              <button
                onClick={() => setShowAccountMenu(!showAccountMenu)}
                className="flex flex-col items-end py-1 px-2.5 bg-[#1a1f2e] rounded-lg border border-gray-800/50"
              >
                <div className="flex items-center gap-1">
                  <span className="text-[12px] text-gray-400">
                    {selectedAccountType === 'real' ? 'Real' : 'Demo'}
                  </span>
                  <ChevronDown className="w-4 h-4 font-bold text-gray-400" />
                </div>
                <span className="text-sm font-bold text-white leading-tight">
                  {formatCurrency(currentBalance)}
                </span>
              </button>

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

            {/* Avatar Menu */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="w-10 h-10 lg:w-8 lg:h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
            >
              <span className="text-sm font-bold">{user.email[0].toUpperCase()}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
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

        <div className="hidden lg:block w-64 bg-[#0f1419] border-l border-gray-800/50 flex-shrink-0">
          <div className="h-full flex flex-col p-4 space-y-4 overflow-hidden">
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
                  className="flex-1 min-w-0 bg-transparent border-0 text-center text-base  text-white focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

            {selectedAsset && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl px-3 py-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Pendapatan</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">+{selectedAsset.profitRate}%</span>
                    <span className=" font-bold text-green-400">{formatCurrency(potentialPayout)}</span>
                  </div>
                </div>
              </div>
            )}

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

      <div className="lg:hidden bg-[#0f1419] border-t border-gray-800/50 p-4">
        <div className="space-y-4">
          {/* Amount & Duration - Improved Spacing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="relative">
              <label className="text-xs text-gray-400 mb-2 block font-medium">Amount</label>
              <div className="relative">
                {/* Changed from <button> to <div> to avoid nesting buttons */}
                <div
                  onClick={() => setShowAmountDropdown(!showAmountDropdown)}
                  className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-lg px-3 py-3 text-center text-sm font-bold text-white hover:bg-[#232936] transition-colors flex items-center justify-between cursor-pointer"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setAmount(prev => Math.max(1000, prev - 10000))
                    }}
                    className="flex items-center justify-center hover:bg-[#2a3142] rounded p-1 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-300" />
                  </button>
                  
                  <span className="flex-1">{formatCurrency(amount)}</span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setAmount(prev => prev + 10000)
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
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#1a1f2e] border border-gray-800/50 rounded-lg shadow-2xl z-50 overflow-hidden">
                    {[10000, 25000, 50000, 75000, 100000, 250000, 500000, 1000000].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setAmount(preset)
                          setShowAmountDropdown(false)
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[#232936] transition-colors border-b border-gray-800/30 last:border-0 ${
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
              <label className="text-xs text-gray-400 mb-2 block font-medium">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-lg px-3 py-3 text-center text-sm font-bold text-white focus:outline-none focus:border-blue-500/50 appearance-none cursor-pointer"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d}m</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payout Info - Improved Spacing */}
          {selectedAsset && (
            <div className="flex justify-center py-2">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-full px-5 py-2.5">
                <span className="text-xs text-gray-400">Pendapatan</span>
                <span className="text-xs font-semibold text-green-400">+{selectedAsset.profitRate}%</span>
                <span className="text-sm font-bold text-green-400">
                  {formatCurrency(potentialPayout)}
                </span>
              </div>
            </div>
          )}

          {/* Buy/Sell Buttons - Improved Spacing */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              onClick={() => handlePlaceOrder('CALL')}
              disabled={loading || !selectedAsset}
              className="bg-green-500 hover:bg-green-600 active:bg-green-700 disabled:opacity-50 py-4 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <ArrowUp className="w-5 h-5" />
              <span>BUY</span>
            </button>
            <button
              onClick={() => handlePlaceOrder('PUT')}
              disabled={loading || !selectedAsset}
              className="bg-red-500 hover:bg-red-600 active:bg-red-700 disabled:opacity-50 py-4 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <ArrowDown className="w-5 h-5" />
              <span>SELL</span>
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-2 pt-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
              Processing order...
            </div>
          )}
        </div>
      </div>

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
                  <div className="text-2xl font-bold  text-green-400">{formatCurrency(realBalance)}</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">DEMO Balance</div>
                  <div className="text-2xl font-bold  text-blue-400">{formatCurrency(demoBalance)}</div>
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
                  setShowMobileMenu(false)
                  handleLogout()
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

      {/* Left Sidebar */}
      {showLeftSidebar && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setShowLeftSidebar(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-[#0f1419] border-r border-gray-800/50 z-50 p-4 animate-slide-right">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 relative">
                  <Image 
                    src="/stc-logo.png" 
                    alt="STC Logo" 
                    fill
                    className="object-contain rounded-md"
                  />
                </div>
                <span className="font-bold">STC AutoTrade</span>
              </div>
              <button onClick={() => setShowLeftSidebar(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              <button
                onClick={() => {
                  router.push('/calendar')
                  setShowLeftSidebar(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>Kalender</span>
              </button>

              <button
                onClick={() => {
                  router.push('/event')
                  setShowLeftSidebar(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <Activity className="w-4 h-4" />
                <span>Event</span>
              </button>

              <button
                onClick={() => {
                  router.push('/tournament')
                  setShowLeftSidebar(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                <span>Turnamen</span>
              </button>
              
              <button
                onClick={() => {
                  router.push('/runner-up')
                  setShowLeftSidebar(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <ArrowUp className="w-4 h-4" />
                <span>Trader Terbaik</span>
              </button>
            </div>
          </div>
        </>
      )}

      <OrderNotification 
        order={notificationOrder}
        onClose={handleCloseNotification}
      />

      <style jsx>{`
      @keyframes slide-left {
        from { 
          transform: translateX(100%); 
          opacity: 0;
        }
        to { 
          transform: translateX(0); 
          opacity: 1;
        }
      }

      @keyframes slide-right {
        from { 
          transform: translateX(-100%); 
          opacity: 0;
        }
        to { 
          transform: translateX(0); 
          opacity: 1;
        }
      }

      @keyframes slide-up {
        from { 
          transform: translateY(100%); 
          opacity: 0;
        }
        to { 
          transform: translateY(0); 
          opacity: 1;
        }
      }

      @keyframes fade-in {
        from { 
          opacity: 0; 
        }
        to { 
          opacity: 1; 
        }
      }

      @keyframes scale-in {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .animate-slide-left {
        animation: slide-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .animate-slide-right {
        animation: slide-right 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .animate-slide-up {
        animation: slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .animate-fade-in {
        animation: fade-in 0.2s ease-out;
      }

      .animate-scale-in {
        animation: scale-in 0.2s ease-out;
      }

      /* Smooth transitions for all interactive elements */
      button {
        transition: all 0.2s ease;
      }

      /* Custom scrollbar */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      ::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
      }

      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    `}</style>
    </div>
  )
}