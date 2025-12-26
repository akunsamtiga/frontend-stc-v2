'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { Balance as BalanceType } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  Wallet, 
  ArrowDownToLine,
  ArrowUpFromLine,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Minus,
  X
} from 'lucide-react'
import { toast } from 'sonner'

export default function BalancePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [balance, setBalance] = useState(0)
  const [allTransactions, setAllTransactions] = useState<BalanceType[]>([])
  const [showDeposit, setShowDeposit] = useState(false)
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      const [balanceRes, historyRes] = await Promise.all([
        api.getCurrentBalance(),
        api.getBalanceHistory(),
      ])
      
      setBalance(balanceRes?.data?.balance || balanceRes?.balance || 0)
      setAllTransactions(historyRes?.data?.transactions || historyRes?.transactions || [])
    } catch (error) {
      console.error('Failed to load balance:', error)
      setBalance(0)
      setAllTransactions([])
    } finally {
      setInitialLoading(false)
    }
  }

  const handleDeposit = async () => {
    const amt = parseFloat(amount)
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
      setShowDeposit(false)
      setAmount('')
      loadData()
    } catch (error) {
      console.error('Deposit failed:', error)
      toast.error('Deposit failed')
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async () => {
    const amt = parseFloat(amount)
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
      setShowWithdraw(false)
      setAmount('')
      loadData()
    } catch (error) {
      console.error('Withdrawal failed:', error)
      toast.error('Withdrawal failed')
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [10000, 50000, 100000, 250000, 500000, 1000000]

  const stats = {
    totalDeposits: allTransactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawals: allTransactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0),
    totalWins: allTransactions
      .filter(t => t.type === 'win' || t.type === 'order_profit')
      .reduce((sum, t) => sum + t.amount, 0),
    totalLosses: allTransactions
      .filter(t => t.type === 'lose' || t.type === 'order_debit')
      .reduce((sum, t) => sum + t.amount, 0),
  }

  const walletTransactions = allTransactions.filter(
    t => t.type === 'deposit' || t.type === 'withdrawal'
  )

  if (!user) return null

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flat-section-header">
          <div>
            <h1 className="flat-section-title">Wallet</h1>
            <p className="flat-section-description">Manage your funds</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flat-card text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-full mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-green-700">Available Balance</span>
            </div>
            
            <div className="text-5xl font-bold text-gray-900 mb-2 font-mono">
              {formatCurrency(balance)}
            </div>
            
            <p className="text-sm text-gray-500 mb-6">Ready for trading</p>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeposit(true)}
                className="flat-btn flat-btn-success flex items-center gap-2"
              >
                <ArrowDownToLine className="w-4 h-4" />
                <span>Deposit</span>
              </button>
              
              <button
                onClick={() => setShowWithdraw(true)}
                className="flat-btn flat-btn-danger flex items-center gap-2"
              >
                <ArrowUpFromLine className="w-4 h-4" />
                <span>Withdraw</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="flat-stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="flat-stat-label">Deposits</span>
            </div>
            <div className="flat-stat-value">{formatCurrency(stats.totalDeposits)}</div>
          </div>

          <div className="flat-stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <span className="flat-stat-label">Withdrawals</span>
            </div>
            <div className="flat-stat-value">{formatCurrency(stats.totalWithdrawals)}</div>
          </div>

          <div className="flat-stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <span className="flat-stat-label">Wins</span>
            </div>
            <div className="flat-stat-value">{formatCurrency(stats.totalWins)}</div>
          </div>

          <div className="flat-stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                <Minus className="w-5 h-5 text-orange-600" />
              </div>
              <span className="flat-stat-label">Losses</span>
            </div>
            <div className="flat-stat-value">{formatCurrency(stats.totalLosses)}</div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="flat-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Transactions</h2>
            <span className="text-sm text-gray-500">{walletTransactions.length} total</span>
          </div>

          {walletTransactions.length === 0 ? (
            <div className="text-center py-16">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 mb-1">No transactions yet</p>
              <p className="text-sm text-gray-400">Your wallet activity will appear here</p>
            </div>
          ) : (
            <div className="space-y-0">
              {walletTransactions.map((tx) => (
                <div key={tx.id} className="flat-list-item">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      tx.type === 'deposit' ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {tx.type === 'deposit' ? (
                        <ArrowDownToLine className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowUpFromLine className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 capitalize">{tx.type}</div>
                      <div className="text-sm text-gray-500">{formatDate(tx.createdAt)}</div>
                    </div>
                  </div>
                  
                  <div className={`text-xl font-bold font-mono ${
                    tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'deposit' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-50" 
            onClick={() => setShowDeposit(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-flat-lg">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Deposit Funds</h2>
                    <p className="text-sm text-gray-500 mt-1">Add money to your wallet</p>
                  </div>
                  <button
                    onClick={() => setShowDeposit(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Enter Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-center text-2xl font-bold font-mono"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Quick Select</label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        className={`py-3 rounded-lg text-sm font-medium transition-all ${
                          amount === preset.toString()
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        {preset >= 1000000 ? `${preset/1000000}M` : `${preset/1000}K`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="w-full flat-btn flat-btn-success"
                >
                  {loading ? 'Processing...' : 'Confirm Deposit'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Withdraw Modal */}
      {showWithdraw && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-50" 
            onClick={() => setShowWithdraw(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-flat-lg">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Withdraw Funds</h2>
                    <p className="text-sm text-gray-500 mt-1">Max: {formatCurrency(balance)}</p>
                  </div>
                  <button
                    onClick={() => setShowWithdraw(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Enter Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    max={balance}
                    className="w-full text-center text-2xl font-bold font-mono"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Quick Select</label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.filter(p => p <= balance).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        className={`py-3 rounded-lg text-sm font-medium transition-all ${
                          amount === preset.toString()
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        {preset >= 1000000 ? `${preset/1000000}M` : `${preset/1000}K`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="w-full flat-btn flat-btn-danger"
                >
                  {loading ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}