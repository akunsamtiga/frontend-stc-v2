'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { useTradingStore } from '@/store/trading'
import { api } from '@/lib/api'
import { subscribeToPriceUpdates } from '@/lib/firebase'
import { toast } from 'sonner'
import { Asset } from '@/types'
import { formatCurrency, DURATIONS } from '@/lib/utils'
import TradingChart from '../../components/TradingChart'
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
  Plus
} from 'lucide-react'

export default function TradingPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const { selectedAsset, currentPrice, setSelectedAsset, setCurrentPrice, addPriceToHistory } = useTradingStore()

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
  }, [selectedAsset])

  const loadData = async () => {
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
  }

  const handlePlaceOrder = async (direction: 'CALL' | 'PUT') => {
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
      
      setTimeout(() => {
        loadData()
      }, 1000)
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || 'Failed to place order'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const potentialProfit = selectedAsset ? (amount * selectedAsset.profitRate) / 100 : 0
  const potentialPayout = amount + potentialProfit

  if (!user) return null

  return (
    <div className="h-screen flex flex-col bg-[#0a0e17] text-white overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 bg-[#0f1419] border-b border-gray-800/50 flex items-center justify-between px-4 flex-shrink-0">
        {/* Left - Logo & Asset */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm hidden sm:block">BinaryTrade</span>
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
                  <span className="text-xs text-gray-400 hidden sm:inline">{selectedAsset.name}</span>
                </>
              ) : (
                <span className="text-sm text-gray-400">Select Asset</span>
              )}
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Asset Dropdown */}
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
        </div>

        {/* Right - Balance & User */}
        <div className="flex items-center gap-3">
          {/* Balance */}
          <div className="hidden sm:flex items-center gap-2 bg-[#1a1f2e] px-3 py-1.5 rounded-lg border border-gray-800/50">
            <Wallet className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-mono font-bold">{formatCurrency(balance)}</span>
          </div>

          {/* History Button - Desktop */}
          <button
            onClick={() => setShowHistorySidebar(true)}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors border border-gray-800/50"
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
                    onClick={() => router.push('/balance')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#232936] transition-colors text-left"
                  >
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm">Balance</span>
                  </button>
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

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 hover:bg-[#1a1f2e] rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chart Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Price Ticker */}
          {selectedAsset && currentPrice && (
            <div className="h-16 bg-[#0f1419] border-b border-gray-800/50 flex items-center px-6 flex-shrink-0">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-xs text-gray-400 mb-1">{selectedAsset.name}</div>
                  <div className="text-2xl font-bold font-mono">{currentPrice.price.toFixed(3)}</div>
                </div>
                {currentPrice.change !== undefined && (
                  <div className={`flex items-center gap-1 text-sm font-semibold ${
                    currentPrice.change >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {currentPrice.change >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>
                      {currentPrice.change >= 0 ? '+' : ''}{currentPrice.change.toFixed(3)}
                      {' '}({currentPrice.change >= 0 ? '+' : ''}{((currentPrice.change / currentPrice.price) * 100).toFixed(2)}%)
                    </span>
                  </div>
                )}
                <div className="text-xs text-gray-400">
                  {new Date(currentPrice.datetime).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* Chart */}
          <div className="flex-1 bg-[#0a0e17]">
            <TradingChart />
          </div>
        </div>

        {/* Trading Panel - Desktop */}
        <div className="hidden lg:block w-80 bg-[#0f1419] border-l border-gray-800/50 flex-shrink-0">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="p-4 border-b border-gray-800/50">
              <h3 className="text-sm font-semibold text-gray-400 mb-1">Trading Panel</h3>
              {selectedAsset && (
                <div className="text-xs text-gray-500">
                  Profit Rate: <span className="text-green-400 font-bold">{selectedAsset.profitRate}%</span>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Amount */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block font-medium">Investment Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-lg px-4 py-3 text-center text-lg font-mono font-bold focus:outline-none focus:border-blue-500/50 transition-colors"
                    min="1000"
                    step="1000"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1">
                    <button
                      onClick={() => setAmount((prev) => prev + 1000)}
                      className="p-0.5 bg-[#232936] hover:bg-[#2d3442] rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => setAmount((prev) => Math.max(1000, prev - 1000))}
                      className="p-0.5 bg-[#232936] hover:bg-[#2d3442] rounded transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
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
              </div>

              {/* Duration */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Duration (Minutes)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${
                        duration === d
                          ? 'bg-blue-500 text-white'
                          : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Profit Info */}
              {selectedAsset && (
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Investment:</span>
                      <span className="font-mono font-bold">{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Profit:</span>
                      <span className="font-mono font-bold text-green-400">+{formatCurrency(potentialProfit)}</span>
                    </div>
                    <div className="border-t border-green-500/20 pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">Total Payout:</span>
                        <span className="font-mono font-bold text-green-400">{formatCurrency(potentialPayout)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-800/50 space-y-2">
              <button
                onClick={() => handlePlaceOrder('CALL')}
                disabled={loading || !selectedAsset}
                className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/20"
              >
                <TrendingUp className="w-5 h-5" />
                <span>BUY (Higher)</span>
              </button>

              <button
                onClick={() => handlePlaceOrder('PUT')}
                disabled={loading || !selectedAsset}
                className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
              >
                <TrendingDown className="w-5 h-5" />
                <span>SELL (Lower)</span>
              </button>

              {loading && (
                <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-2">
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
          {/* Quick Stats */}
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

          {/* Amount & Duration */}
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

          {/* Profit Display */}
          {selectedAsset && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 flex justify-between items-center">
              <span className="text-xs text-gray-400">Potential Payout:</span>
              <span className="text-sm font-mono font-bold text-green-400">{formatCurrency(potentialPayout)}</span>
            </div>
          )}

          {/* Buy/Sell Buttons */}
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

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <>
          <div className="fixed inset-0 bg-black/80 z-50" onClick={() => setShowMobileMenu(false)} />
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-[#0f1419] border-l border-gray-800/50 z-50 p-4 animate-slide-in-right">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">Menu</h3>
              <button onClick={() => setShowMobileMenu(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
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
                onClick={() => router.push('/balance')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <Wallet className="w-4 h-4" />
                <span>Balance</span>
              </button>
              <button
                onClick={() => router.push('/profile')}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}