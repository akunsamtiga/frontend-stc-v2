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
  Plus, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  X,
  DollarSign,
  RefreshCw
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

  // Quick amount presets
  const quickAmounts = [10000, 50000, 100000, 250000, 500000, 1000000]

  // âœ… PERBAIKAN: Filter HANYA transaksi wallet (deposit & withdrawal)
  const walletTransactions = allTransactions.filter(
    t => t.type === 'deposit' || t.type === 'withdrawal'
  )

  // âœ… PERBAIKAN: Stats HANYA untuk wallet transactions
  const walletStats = {
    totalDeposits: walletTransactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawals: walletTransactions
      .filter(t => t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0),
    transactionCount: walletTransactions.length,
  }

  // Net change dari deposit - withdrawal
  const netChange = walletStats.totalDeposits - walletStats.totalWithdrawals

  if (!user) return null

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e17]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <div className="text-gray-400">Loading balance...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Wallet & Balance</h1>
            <p className="text-sm text-gray-400">Manage your deposits and withdrawals</p>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-800/50 rounded-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Balance Card - Full Width on Mobile */}
        <div className="mb-6 animate-fade-in-up">
          <div className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-emerald-500/20 border border-blue-500/30 rounded-2xl p-6 sm:p-8 backdrop-blur-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet className="w-5 h-5 text-blue-400" />
                  <span className="text-sm text-gray-300">Current Balance</span>
                </div>
                <div className="text-4xl sm:text-5xl lg:text-6xl font-bold font-mono mb-4">
                  {formatCurrency(balance)}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Available for trading</span>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex sm:flex-col gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowDeposit(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-lg shadow-green-500/20 group"
                >
                  <ArrowDownToLine className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                  <span>Deposit</span>
                </button>
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-lg shadow-red-500/20 group"
                >
                  <ArrowUpFromLine className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* âœ… Stats Grid - HANYA WALLET STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-xl p-4 hover:bg-[#1a1f2e] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <ArrowDownToLine className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-xs text-gray-400">Total Deposits</div>
            </div>
            <div className="text-xl font-bold font-mono text-green-400">
              {formatCurrency(walletStats.totalDeposits)}
            </div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-xl p-4 hover:bg-[#1a1f2e] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <ArrowUpFromLine className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-xs text-gray-400">Total Withdrawals</div>
            </div>
            <div className="text-xl font-bold font-mono text-red-400">
              {formatCurrency(walletStats.totalWithdrawals)}
            </div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-xl p-4 hover:bg-[#1a1f2e] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-xs text-gray-400">Net Change</div>
            </div>
            <div className={`text-xl font-bold font-mono ${
              netChange >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {netChange >= 0 ? '+' : ''}{formatCurrency(netChange)}
            </div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-xl p-4 hover:bg-[#1a1f2e] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <History className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-xs text-gray-400">Transactions</div>
            </div>
            <div className="text-xl font-bold font-mono text-purple-400">
              {walletStats.transactionCount}
            </div>
          </div>
        </div>

        {/* âœ… Transaction History - HANYA DEPOSIT & WITHDRAWAL */}
        <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="p-4 sm:p-6 border-b border-gray-800/50">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg sm:text-xl font-bold">Wallet History</h2>
              <span className="ml-auto text-sm text-gray-400">
                {walletTransactions.length} {walletTransactions.length === 1 ? 'transaction' : 'transactions'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Deposits and withdrawals only</p>
          </div>

          <div className="p-4 sm:p-6">
            {walletTransactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-20" />
                <p className="text-gray-400">No wallet transactions yet</p>
                <p className="text-sm text-gray-500 mt-2">Deposits and withdrawals will appear here</p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => setShowDeposit(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium">Make Deposit</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {walletTransactions.map((tx, index) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl hover:bg-[#232936] transition-all animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'deposit'
                          ? 'bg-green-500/20 border border-green-500/30' 
                          : 'bg-red-500/20 border border-red-500/30'
                      }`}>
                        {tx.type === 'deposit' ? (
                          <ArrowDownToLine className="w-6 h-6 text-green-400" />
                        ) : (
                          <ArrowUpFromLine className="w-6 h-6 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold capitalize mb-1">
                          {tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'}
                        </div>
                        <div className="text-sm text-gray-400 truncate">{formatDate(tx.createdAt)}</div>
                        {tx.description && (
                          <div className="text-xs text-gray-500 mt-1 truncate">{tx.description}</div>
                        )}
                      </div>
                    </div>
                    <div className={`text-xl font-bold font-mono flex-shrink-0 ${
                      tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
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

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <History className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1 text-sm">
              <div className="font-semibold text-blue-400 mb-1">Trading History</div>
              <div className="text-gray-400 leading-relaxed">
                To view your trading profit/loss history, please visit the{' '}
                <button 
                  onClick={() => router.push('/history')}
                  className="text-blue-400 hover:text-blue-300 underline font-medium"
                >
                  History page
                </button>
                . This page only shows wallet deposits and withdrawals.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <>
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" 
            onClick={() => setShowDeposit(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md bg-[#0f1419] border border-gray-800/50 rounded-2xl z-50 animate-scale-in shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30">
                    <ArrowDownToLine className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Deposit Funds</h2>
                    <p className="text-sm text-gray-400">Add money to your wallet</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeposit(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#1a1f2e] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quick Amount</label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          amount === preset.toString()
                            ? 'bg-green-500 text-white'
                            : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                        }`}
                      >
                        {preset >= 1000000 ? `${preset/1000000}M` : `${preset/1000}K`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-semibold text-white transition-all shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    'Confirm Deposit'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeposit(false)
                    setAmount('')
                  }}
                  className="px-6 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-xl font-semibold transition-all border border-gray-800/50"
                >
                  Cancel
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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in" 
            onClick={() => setShowWithdraw(false)}
          />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md bg-[#0f1419] border border-gray-800/50 rounded-2xl z-50 animate-scale-in shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                    <ArrowUpFromLine className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Withdraw Funds</h2>
                    <p className="text-sm text-gray-400">Max: {formatCurrency(balance)}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWithdraw(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#1a1f2e] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    max={balance}
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Quick Amount</label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.filter(p => p <= balance).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          amount === preset.toString()
                            ? 'bg-red-500 text-white'
                            : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                        }`}
                      >
                        {preset >= 1000000 ? `${preset/1000000}M` : `${preset/1000}K`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-semibold text-white transition-all shadow-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processing...
                    </span>
                  ) : (
                    'Confirm Withdrawal'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowWithdraw(false)
                    setAmount('')
                  }}
                  className="px-6 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-xl font-semibold transition-all border border-gray-800/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}