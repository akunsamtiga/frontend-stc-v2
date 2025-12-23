'use client'

import { useEffect, useState, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useTradingStore, useSelectedAsset, useCurrentPrice } from '@/store/trading'
import { api } from '@/lib/api'
import { subscribeToPriceUpdates } from '@/lib/firebase'
import { toast } from 'sonner'
import { Asset } from '@/types'
import { formatCurrency, DURATIONS } from '@/lib/utils'
import dynamic from 'next/dynamic'
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
  Plus
} from 'lucide-react'
import RealtimeMonitor from '@/components/RealtimeMonitor'

// Lazy load heavy components with proper loading state
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

// Memoized Price Ticker
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
  const [showAssetMenu, setShowAssetMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showHistorySidebar, setShowHistorySidebar] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadData()
  }, [user, router])

  // Subscribe to price updates
  useEffect(() => {
    if (!selectedAsset) return

    let unsubscribe: (() => void) | undefined

    if (selectedAsset.dataSource === 'realtime_db' && selectedAsset.realtimeDbPath) {
      unsubscribe = subscribeToPriceUpdates(selectedAsset.realtimeDbPath, (data) => {
        setCurrentPrice(data)
        addPriceToHistory(data)
      })
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [selectedAsset?.id])

  const loadData = useCallback(async () => {
    try {
      const [assetsRes, balanceRes] = await Promise.all([
        api.getAssets(true),
        api.getCurrentBalance(),
      ])

      const assetsList = assetsRes?.data?.assets || assetsRes?.assets || []
      const currentBalance = balanceRes?.data?.balance || balanceRes?.balance || 0

      setAssets(assetsList)
      setBalance(currentBalance)

      if (assetsList.length > 0 && !selectedAsset) {
        setSelectedAsset(assetsList[0])
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      setAssets([])
      setBalance(0)
    }
  }, [selectedAsset])

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
      
      setTimeout(loadData, 1000)
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || 'Failed to place order'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }, [selectedAsset, amount, balance, duration, loadData])

  const potentialProfit = selectedAsset ? (amount * selectedAsset.profitRate) / 100 : 0
  const potentialPayout = amount + potentialProfit

  if (!user) return null

  return (
    <div className="h-screen flex flex-col bg-[#0a0e17] text-white overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-[#0f1419] border-b border-gray-800/50 flex items-center justify-between px-4 flex-shrink-0">
        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center gap-4 w-full">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm">BinaryTrade</span>
          </div>

          {/* Asset Selector */}
          <div className="relative">
            <button
              onClick={() => setShowAssetMenu(!showAssetMenu)}
              className="flex items-center gap-2 bg-[#1a1f2e] hover:bg-[#232936] px-3 py-1.5 rounded-lg transition-colors border border-gray-800/50"
            >
              {selectedAsset ? (
                <>
                  <span className="text-sm font-medium">{selectedAsset.symbol}</span>
                  <span className="text-xs text-gray-400">{selectedAsset.name}</span>
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
                        <div className="text-xs text-gray-400">{asset.name}</div>
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
            <Wallet className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-mono font-bold">{formatCurrency(balance)}</span>
          </div>

          <button
            onClick={() => router.push('/balance')}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg transition-colors group"
          >
            <Plus className="w-4 h-4 text-green-400 group-hover:text-green-300" />
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
              className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
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
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#1a1f2e] px-3 py-1.5 rounded-lg border border-gray-800/50">
            <Wallet className="w-3 h-3 text-blue-400" />
            <span className="text-xs font-mono font-bold">{formatCurrency(balance)}</span>
          </div>

          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 hover:bg-[#1a1f2e] rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content - FIXED LAYOUT */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Chart Area - EXPLICIT SIZING */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Price Ticker */}
          {selectedAsset && currentPrice && (
            <PriceTicker asset={selectedAsset} price={currentPrice} />
          )}

          {/* Chart Container - CRITICAL: Must have explicit height */}
          <div className="flex-1 bg-[#0a0e17] relative" style={{ minHeight: '500px' }}>
            {selectedAsset ? (
              <TradingChart />
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
        <div className="hidden lg:block w-72 bg-[#0f1419] border-l border-gray-800/50 flex-shrink-0">
          <div className="h-full flex flex-col p-4 space-y-3">
            <div className="pb-3 border-b border-gray-800/50">
              <h3 className="text-xs font-semibold text-gray-400">Quick Trade</h3>
              {selectedAsset && (
                <div className="text-xs text-gray-500 mt-1">
                  Rate: <span className="text-green-400 font-bold">+{selectedAsset.profitRate}%</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-lg px-3 py-2 text-center text-sm font-mono font-bold focus:outline-none focus:border-blue-500/50 transition-colors"
                  min="1000"
                  step="1000"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Time (m)
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-lg px-3 py-2 text-center text-sm font-bold focus:outline-none focus:border-blue-500/50 transition-colors"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d}m</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[10000, 50000, 100000].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                    amount === preset
                      ? 'bg-blue-500 text-white'
                      : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                  }`}
                >
                  {preset >= 1000000 ? `${preset/1000000}M` : `${preset/1000}K`}
                </button>
              ))}
            </div>

            {selectedAsset && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Potential:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-gray-300">{formatCurrency(amount)}</span>
                    <span className="text-gray-500">→</span>
                    <span className="font-mono font-bold text-green-400">{formatCurrency(potentialPayout)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1"></div>

            <div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handlePlaceOrder('CALL')}
                  disabled={loading || !selectedAsset}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center shadow-lg shadow-green-500/20"
                >
                  <TrendingUp className="w-6 h-6" />
                </button>

                <button
                  onClick={() => handlePlaceOrder('PUT')}
                  disabled={loading || !selectedAsset}
                  className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center shadow-lg shadow-red-500/20"
                >
                  <TrendingDown className="w-6 h-6" />
                </button>
              </div>

              {loading && (
                <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-2 mt-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
                  Processing...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Trading Panel */}
      <div className="lg:hidden bg-[#0f1419] border-t border-gray-800/50 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400">Balance:</span>
              <span className="font-mono font-bold">{formatCurrency(balance)}</span>
            </div>
            {selectedAsset && (
              <div className="text-green-400 font-bold">+{selectedAsset.profitRate}%</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-lg px-3 py-2 text-center text-sm font-mono font-bold focus:outline-none focus:border-blue-500/50"
                min="1000"
                step="1000"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-lg px-3 py-2 text-center text-sm font-bold focus:outline-none focus:border-blue-500/50"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d}m</option>
                ))}
              </select>
            </div>
          </div>

          {selectedAsset && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 flex justify-between items-center">
              <span className="text-xs text-gray-400">Potential Payout:</span>
              <span className="text-sm font-mono font-bold text-green-400">{formatCurrency(potentialPayout)}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handlePlaceOrder('CALL')}
              disabled={loading || !selectedAsset}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>BUY</span>
            </button>
            <button
              onClick={() => handlePlaceOrder('PUT')}
              disabled={loading || !selectedAsset}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2"
            >
              <TrendingDown className="w-4 h-4" />
              <span>SELL</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-[#0f1419] border-l border-gray-800/50 z-50 p-4">
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
                  className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500/50"
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
                onClick={() => router.push('/profile')}
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
          {process.env.NODE_ENV === 'development' && <RealtimeMonitor />}
    </div>
  )
}