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
import TradingChart from '@/components/ChartTrading'
import HistorySidebar from '@/components/HistorySidebar'
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
  User
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
      {/* Top Navbar */}
      <nav className="h-16 border-b border-gray-700 bg-background-secondary flex items-center px-4 flex-shrink-0 z-30">
        <div className="flex items-center gap-6 flex-1">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg hidden sm:block">BinaryTrade</span>
          </div>

          {/* Asset Selector - Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-sm text-gray-400">Asset:</span>
            <select
              value={selectedAsset?.id || ''}
              onChange={(e) => {
                const asset = assets.find((a) => a.id === e.target.value)
                if (asset) setSelectedAsset(asset)
              }}
              className="bg-background-tertiary border-gray-600 px-3 py-1.5 rounded-lg text-sm min-w-[160px]"
              disabled={assets.length === 0}
            >
              {assets.length === 0 ? (
                <option value="">No assets</option>
              ) : (
                assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.profitRate}%)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Asset Selector - Mobile */}
          <select
            value={selectedAsset?.id || ''}
            onChange={(e) => {
              const asset = assets.find((a) => a.id === e.target.value)
              if (asset) setSelectedAsset(asset)
            }}
            className="lg:hidden bg-background-tertiary border-gray-600 px-2 py-1.5 rounded-lg text-xs flex-1 max-w-[140px]"
            disabled={assets.length === 0}
          >
            {assets.length === 0 ? (
              <option value="">No assets</option>
            ) : (
              assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.symbol}
                </option>
              ))
            )}
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex-1" />

          {/* Balance & Actions - Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-background-tertiary rounded-lg">
              <Wallet className="w-4 h-4 text-primary" />
              <span className="text-sm font-mono font-semibold">{formatCurrency(balance)}</span>
            </div>
            
            <button
              onClick={() => setShowDepositModal(true)}
              className="px-3 py-1.5 bg-success hover:bg-success-dark rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              Deposit
            </button>
            
            <button
              onClick={() => setShowWithdrawModal(true)}
              className="px-3 py-1.5 bg-danger hover:bg-danger-dark rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <Minus className="w-3 h-3" />
              Withdraw
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
                <div className="absolute right-0 mt-2 w-48 bg-background-secondary border border-gray-700 rounded-lg shadow-xl py-2">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <div className="text-xs text-gray-400">{user.role}</div>
                    <div className="text-sm font-medium truncate">{user.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      router.push('/')
                    }}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-background-tertiary transition-all w-full text-left text-danger"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Balance - Mobile */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-background-tertiary rounded-lg">
              <Wallet className="w-3 h-3 text-primary" />
              <span className="text-xs font-mono font-semibold">{formatCurrency(balance)}</span>
            </div>
            <button
              onClick={() => router.push('/balance')}
              className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Desktop Only */}
        <div className="hidden lg:flex w-14 border-r border-gray-700 bg-background-secondary flex-col items-center py-4">
          <button
            onClick={() => setShowHistorySidebar(true)}
            className="p-3 hover:bg-background-tertiary rounded-lg transition-colors"
            title="History"
          >
            <History className="w-5 h-5" />
          </button>
        </div>

        {/* Chart Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile: 70% Chart */}
          <div className="flex-1 lg:h-full">
            <TradingChart />
          </div>

          {/* Mobile: 30% Trading Panel */}
          <div className="lg:hidden border-t border-gray-700 bg-background-secondary p-3">
            <div className="grid grid-cols-2 gap-2 mb-2">
              {/* Duration */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full bg-background-tertiary border-gray-600 px-2 py-1.5 rounded text-sm"
                >
                  {DURATIONS.map((d) => (
                    <option key={d} value={d}>{d}m</option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Amount</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-background-tertiary border-gray-600 px-2 py-1.5 rounded text-sm"
                  min="1000"
                  step="1000"
                />
              </div>
            </div>

            {/* Profit Info */}
            {selectedAsset && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-2 mb-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Potential Profit:</span>
                  <span className="text-success font-bold">+{formatCurrency(potentialProfit)}</span>
                </div>
                <div className="text-xs text-gray-400 text-center mt-1">
                  {selectedAsset.profitRate}% return
                </div>
              </div>
            )}

            {/* Buy/Sell Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handlePlaceOrder('CALL')}
                disabled={loading || !selectedAsset}
                className="btn bg-success hover:bg-success-dark py-3 flex flex-col items-center gap-1 disabled:opacity-50"
              >
                <ArrowUpCircle className="w-5 h-5" />
                <span className="font-bold">BUY</span>
              </button>

              <button
                onClick={() => handlePlaceOrder('PUT')}
                disabled={loading || !selectedAsset}
                className="btn bg-danger hover:bg-danger-dark py-3 flex flex-col items-center gap-1 disabled:opacity-50"
              >
                <ArrowDownCircle className="w-5 h-5" />
                <span className="font-bold">SELL</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Desktop Only */}
        <div className="hidden lg:flex w-80 border-l border-gray-700 bg-background-secondary flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold text-sm text-gray-400 mb-3">Trading Panel</h3>

            {/* Amount */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block">Investment Amount</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-background-tertiary border-gray-600 px-3 py-2 rounded-lg text-center font-mono text-lg"
                min="1000"
                step="1000"
              />
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[10000, 50000, 100000].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setAmount(preset)}
                    className="px-2 py-1 bg-background-tertiary hover:bg-gray-600 rounded text-xs transition-colors"
                  >
                    {formatCurrency(preset)}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="mb-4">
              <label className="text-xs text-gray-400 mb-2 block flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-background-tertiary border-gray-600 px-3 py-2 rounded-lg text-center"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} {d === 1 ? 'Minute' : 'Minutes'}
                  </option>
                ))}
              </select>
            </div>

            {/* Profit Info */}
            {selectedAsset && (
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-4">
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">Potential Profit</div>
                  <div className="text-2xl font-bold text-success mb-1">
                    +{formatCurrency(potentialProfit)}
                  </div>
                  <div className="text-xs text-gray-400">
                    ({selectedAsset.profitRate}% return)
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Buttons */}
          <div className="p-4 space-y-3">
            <button
              onClick={() => handlePlaceOrder('CALL')}
              disabled={loading || !selectedAsset}
              className="btn bg-success hover:bg-success-dark w-full py-4 flex flex-col items-center gap-2 disabled:opacity-50"
            >
              <ArrowUpCircle className="w-6 h-6" />
              <span className="font-bold text-lg">BUY (CALL)</span>
              <span className="text-xs opacity-80">Price will rise</span>
            </button>

            <button
              onClick={() => handlePlaceOrder('PUT')}
              disabled={loading || !selectedAsset}
              className="btn bg-danger hover:bg-danger-dark w-full py-4 flex flex-col items-center gap-2 disabled:opacity-50"
            >
              <ArrowDownCircle className="w-6 h-6" />
              <span className="font-bold text-lg">SELL (PUT)</span>
              <span className="text-xs opacity-80">Price will fall</span>
            </button>

            {loading && (
              <div className="text-center text-sm text-gray-400">
                Processing order...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Sidebar */}
      <HistorySidebar
        isOpen={showHistorySidebar}
        onClose={() => setShowHistorySidebar(false)}
      />

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Deposit Funds</h2>
            <div className="input-group mb-6">
              <label className="input-label">Amount</label>
              <input
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="Enter amount"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleDeposit}
                disabled={loading}
                className="btn btn-success flex-1"
              >
                {loading ? 'Processing...' : 'Confirm Deposit'}
              </button>
              <button
                onClick={() => {
                  setShowDepositModal(false)
                  setTransactionAmount('')
                }}
                className="btn btn-secondary"
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
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Withdraw Funds</h2>
            <div className="input-group mb-6">
              <label className="input-label">Amount (Max: {formatCurrency(balance)})</label>
              <input
                type="number"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
                placeholder="Enter amount"
                max={balance}
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleWithdraw}
                disabled={loading}
                className="btn btn-danger flex-1"
              >
                {loading ? 'Processing...' : 'Confirm Withdrawal'}
              </button>
              <button
                onClick={() => {
                  setShowWithdrawModal(false)
                  setTransactionAmount('')
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}