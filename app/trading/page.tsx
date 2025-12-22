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
import HistorySidebar from '../../components/HistorySidebar'
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Clock, 
  Wallet,
  TrendingUp,
  RefreshCw,
  History,
  Plus,
  Minus,
  LogOut,
  User,
  ChevronDown,
  BarChart3,
  Activity,
  Menu,
  X
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
  const [refreshing, setRefreshing] = useState(false)
  const [showHistorySidebar, setShowHistorySidebar] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [transactionAmount, setTransactionAmount] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showAssetSelector, setShowAssetSelector] = useState(false)
  const [mobileView, setMobileView] = useState<'chart' | 'trade'>('chart')
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

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setTimeout(() => setRefreshing(false), 500)
  }

  const handleDeposit = async () => {
    const amt = parseFloat(transactionAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Invalid amount')
      return
    }

    setLoading(true)
    try {
      await api.createBalanceEntry({
        type: 'deposit',
        amount: amt,
        description: 'Deposit',
      })
      toast.success('Deposit successful!')
      setShowDepositModal(false)
      setTransactionAmount('')
      loadData()
    } catch (error) {
      toast.error('Deposit failed')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const amt = parseFloat(transactionAmount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Invalid amount')
      return
    }
    if (amt > balance) {
      toast.error('Insufficient balance')
      return
    }

    setLoading(true)
    try {
      await api.createBalanceEntry({
        type: 'withdrawal',
        amount: amt,
        description: 'Withdrawal',
      })
      toast.success('Withdrawal successful!')
      setShowWithdrawModal(false)
      setTransactionAmount('')
      loadData()
    } catch (error) {
      toast.error('Withdrawal failed')
    } finally {
      setLoading(false)
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

      toast.success(`${direction} order placed!`)
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

  if (!user) return null

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ========== TOP NAVBAR ========== */}
      <nav className="h-14 sm:h-16 border-b border-gray-700 bg-background-secondary flex items-center px-3 sm:px-4 flex-shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-4 flex-1">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="font-bold text-base sm:text-lg hidden sm:block">BinaryTrade</span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-2 hover:bg-background-tertiary rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Asset Selector - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-sm text-gray-400">Asset:</span>
            <div className="relative">
              <button
                onClick={() => setShowAssetSelector(!showAssetSelector)}
                className="flex items-center gap-2 bg-background-tertiary hover:bg-gray-700 border border-gray-600 px-3 py-2 rounded-lg transition-colors min-w-[200px]"
                disabled={assets.length === 0}
              >
                {selectedAsset ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Activity className="w-4 h-4 text-primary" />
                    <div className="text-left flex-1">
                      <div className="text-sm font-medium">{selectedAsset.name}</div>
                      <div className="text-xs text-gray-400">{selectedAsset.symbol} • {selectedAsset.profitRate}%</div>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">No assets</span>
                )}
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              {showAssetSelector && assets.length > 0 && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowAssetSelector(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-full bg-background-secondary border border-gray-700 rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto">
                    {assets.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => {
                          setSelectedAsset(asset)
                          setShowAssetSelector(false)
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-background-tertiary transition-colors border-b border-gray-700 last:border-0 ${
                          selectedAsset?.id === asset.id ? 'bg-primary/10' : ''
                        }`}
                      >
                        <Activity className={`w-4 h-4 ${selectedAsset?.id === asset.id ? 'text-primary' : 'text-gray-400'}`} />
                        <div className="text-left flex-1">
                          <div className="text-sm font-medium">{asset.name}</div>
                          <div className="text-xs text-gray-400">{asset.symbol}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-success">{asset.profitRate}%</div>
                          <div className="text-xs text-gray-400">Profit</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Refresh Button - Desktop */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="hidden lg:flex p-2 hover:bg-background-tertiary rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex-1" />

          {/* Balance & Actions - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-background-tertiary rounded-lg border border-gray-700">
              <Wallet className="w-4 h-4 text-primary" />
              <div className="text-right">
                <div className="text-xs text-gray-400">Balance</div>
                <div className="text-sm font-mono font-bold">{formatCurrency(balance)}</div>
              </div>
            </div>
            
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-3 py-2 bg-success hover:bg-success-dark rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xl:inline">Deposit</span>
            </button>
            
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-3 py-2 bg-danger hover:bg-danger-dark rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5"
            >
              <Minus className="w-4 h-4" />
              <span className="hidden xl:inline">Withdraw</span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 bg-primary rounded-full flex items-center justify-center hover:bg-primary-dark transition-colors"
              >
                <User className="w-5 h-5" />
              </button>

              {showUserMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-background-secondary border border-gray-700 rounded-lg shadow-2xl py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-700">
                      <div className="text-xs text-gray-400 mb-1">Logged in as</div>
                      <div className="text-sm font-medium truncate">{user.email}</div>
                      <div className="text-xs text-primary mt-1 capitalize">{user.role.replace('_', ' ')}</div>
                    </div>
                    <button
                      onClick={() => {
                        logout()
                        router.push('/')
                      }}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-background-tertiary transition-all w-full text-left text-danger mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Balance - Mobile/Tablet */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1.5 bg-background-tertiary rounded-lg border border-gray-700">
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
              <span className="text-xs sm:text-sm font-mono font-semibold">{formatCurrency(balance)}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* ========== MOBILE MENU OVERLAY ========== */}
      {showMobileMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed top-14 left-0 right-0 bg-background-secondary border-b border-gray-700 z-50 lg:hidden animate-slide-down">
            <div className="p-4 space-y-3">
              {/* Asset Selector - Mobile */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block">Select Asset</label>
                <select
                  value={selectedAsset?.id || ''}
                  onChange={(e) => {
                    const asset = assets.find((a) => a.id === e.target.value)
                    if (asset) {
                      setSelectedAsset(asset)
                      setShowMobileMenu(false)
                    }
                  }}
                  className="w-full bg-background-tertiary border-gray-600 px-3 py-2.5 rounded-lg"
                  disabled={assets.length === 0}
                >
                  {assets.length === 0 ? (
                    <option value="">No assets</option>
                  ) : (
                    assets.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.symbol}) - {asset.profitRate}% profit
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowDepositModal(true)
                    setShowMobileMenu(false)
                  }}
                  className="btn btn-success py-2.5 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Deposit
                </button>
                <button
                  onClick={() => {
                    setShowWithdrawModal(true)
                    setShowMobileMenu(false)
                  }}
                  className="btn btn-danger py-2.5 flex items-center justify-center gap-2"
                >
                  <Minus className="w-4 h-4" />
                  Withdraw
                </button>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="w-full btn btn-secondary py-2.5 flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Data
              </button>

              <button
                onClick={() => {
                  logout()
                  router.push('/')
                }}
                className="w-full btn bg-red-600 hover:bg-red-700 py-2.5 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* ========== MAIN CONTENT ========== */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Desktop Only */}
        <div className="hidden lg:flex w-16 border-r border-gray-700 bg-background-secondary flex-col items-center py-4 gap-4">
          <button
            onClick={() => setShowHistorySidebar(true)}
            className="p-3 hover:bg-background-tertiary rounded-lg transition-colors group relative"
            title="History"
          >
            <History className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              History
            </span>
          </button>
          
          <button
            onClick={() => router.push('/balance')}
            className="p-3 hover:bg-background-tertiary rounded-lg transition-colors group relative"
            title="Balance"
          >
            <Wallet className="w-5 h-5" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Balance
            </span>
          </button>
        </div>

        {/* Chart + Trading Panel Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Chart Area */}
          <div className={`flex-1 flex flex-col ${mobileView === 'chart' ? 'flex' : 'hidden'} lg:flex`}>
            <TradingChart />
          </div>

          {/* Trading Panel - Desktop: Sidebar, Mobile: Full view */}
          <div className={`
            lg:w-96 lg:border-l border-gray-700 bg-background-secondary 
            flex flex-col
            ${mobileView === 'trade' ? 'flex' : 'hidden'} lg:flex
          `}>
            {/* Panel Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-400 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Trading Panel
                </h3>
                {selectedAsset && (
                  <div className="text-right">
                    <div className="text-xs text-gray-400">Profit Rate</div>
                    <div className="text-sm font-bold text-success">{selectedAsset.profitRate}%</div>
                  </div>
                )}
              </div>

              {/* Current Price Display */}
              {currentPrice && selectedAsset && (
                <div className="bg-background-tertiary rounded-lg p-3 border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">{selectedAsset.name}</div>
                  <div className="text-2xl font-bold font-mono">{currentPrice.price.toFixed(3)}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(currentPrice.datetime).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>

            {/* Trading Controls */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Amount Input */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block font-medium">
                  Investment Amount
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-background-tertiary border-gray-600 px-4 py-3 rounded-lg text-center font-mono text-xl font-bold focus:ring-2 focus:ring-primary"
                  min="1000"
                  step="1000"
                />
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[10000, 50000, 100000].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setAmount(preset)}
                      className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                        amount === preset
                          ? 'bg-primary text-white'
                          : 'bg-background-tertiary hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {preset >= 1000000 ? `${preset/1000000}M` : `${preset/1000}K`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Selector */}
              <div>
                <label className="text-xs text-gray-400 mb-2 block font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DURATIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        duration === d
                          ? 'bg-primary text-white'
                          : 'bg-background-tertiary hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {d}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Profit Calculation */}
              {selectedAsset && (
                <div className="bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/30 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-400 mb-1">Potential Profit</div>
                    <div className="text-3xl font-bold text-success mb-2 font-mono">
                      +{formatCurrency(potentialProfit)}
                    </div>
                    <div className="text-xs text-gray-400">
                      {selectedAsset.profitRate}% return on investment
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Buttons */}
            <div className="p-4 border-t border-gray-700 space-y-3">
              <button
                onClick={() => handlePlaceOrder('CALL')}
                disabled={loading || !selectedAsset}
                className="btn bg-success hover:bg-success-dark w-full py-4 flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <ArrowUpCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-lg">BUY (CALL)</span>
                <span className="text-xs opacity-80">Price will rise</span>
              </button>

              <button
                onClick={() => handlePlaceOrder('PUT')}
                disabled={loading || !selectedAsset}
                className="btn bg-danger hover:bg-danger-dark w-full py-4 flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <ArrowDownCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-lg">SELL (PUT)</span>
                <span className="text-xs opacity-80">Price will fall</span>
              </button>

              {loading && (
                <div className="text-center text-sm text-gray-400 flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Processing order...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========== MOBILE TAB NAVIGATION ========== */}
      <div className="lg:hidden h-16 border-t border-gray-700 bg-background-secondary flex items-center justify-around px-4">
        <button
          onClick={() => setMobileView('chart')}
          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
            mobileView === 'chart' ? 'text-primary bg-primary/10' : 'text-gray-400'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-xs font-medium">Chart</span>
        </button>

        <button
          onClick={() => setMobileView('trade')}
          className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
            mobileView === 'trade' ? 'text-primary bg-primary/10' : 'text-gray-400'
          }`}
        >
          <Activity className="w-5 h-5" />
          <span className="text-xs font-medium">Trade</span>
        </button>

        <button
          onClick={() => setShowHistorySidebar(true)}
          className="flex-1 flex flex-col items-center gap-1 py-2 text-gray-400 hover:text-primary transition-colors rounded-lg"
        >
          <History className="w-5 h-5" />
          <span className="text-xs font-medium">History</span>
        </button>

        <button
          onClick={() => router.push('/balance')}
          className="flex-1 flex flex-col items-center gap-1 py-2 text-gray-400 hover:text-primary transition-colors rounded-lg"
        >
          <Wallet className="w-5 h-5" />
          <span className="text-xs font-medium">Balance</span>
        </button>
      </div>

      {/* ========== MODALS ========== */}
      
      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full animate-scale-in">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Plus className="w-6 h-6 text-success" />
              Deposit Funds
            </h2>
            <div className="input-group mb-6">
              <label className="input-label">Amount (IDR)</label>
              <input
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="Enter amount"
                className="text-center text-xl font-mono font-bold"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeposit}
                disabled={loading}
                className="btn btn-success flex-1 py-3"
              >
                {loading ? 'Processing...' : 'Confirm Deposit'}
              </button>
              <button
                onClick={() => {
                  setShowDepositModal(false)
                  setTransactionAmount('')
                }}
                className="btn btn-secondary py-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full animate-scale-in">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Minus className="w-6 h-6 text-danger" />
              Withdraw Funds
            </h2>
            <div className="bg-background-tertiary rounded-lg p-3 mb-4">
              <div className="text-xs text-gray-400">Available Balance</div>
              <div className="text-lg font-bold font-mono">{formatCurrency(balance)}</div>
            </div>
            <div className="input-group mb-6">
              <label className="input-label">Amount (IDR)</label>
              <input
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="Enter amount"
                max={balance}
                className="text-center text-xl font-mono font-bold"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleWithdraw}
                disabled={loading}
                className="btn btn-danger flex-1 py-3"
              >
                {loading ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
              <button
                onClick={() => {
                  setShowWithdrawModal(false)
                  setTransactionAmount('')
                }}
                className="btn btn-secondary py-3"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Sidebar */}
      <HistorySidebar
        isOpen={showHistorySidebar}
        onClose={() => setShowHistorySidebar(false)}
      />

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
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

        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}