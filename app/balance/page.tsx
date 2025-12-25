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
  History,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Minus,
  ChevronRight
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
      <div className="min-h-screen bg-[#0a0e17]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-gray-400">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header - Clean & Minimal */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 tracking-tight">Wallet</h1>
          <p className="text-gray-400">Manage your funds</p>
        </div>

        {/* Balance Card - Centered & Clean */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent border border-gray-800/50 rounded-3xl p-8 sm:p-12">
            {/* Subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-3xl blur-2xl -z-10"></div>
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-800/30 rounded-full mb-4">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">Available Balance</span>
              </div>
              
              <div className="text-5xl sm:text-6xl font-bold font-mono mb-2 tracking-tight">
                {formatCurrency(balance)}
              </div>
              
              <p className="text-sm text-gray-500">Ready for trading</p>
            </div>

            {/* Action Buttons - Minimal */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeposit(true)}
                className="group flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-gray-800/50 hover:border-gray-700 rounded-xl transition-all"
              >
                <ArrowDownToLine className="w-4 h-4 text-green-400" />
                <span className="font-medium">Deposit</span>
              </button>
              
              <button
                onClick={() => setShowWithdraw(true)}
                className="group flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-gray-800/50 hover:border-gray-700 rounded-xl transition-all"
              >
                <ArrowUpFromLine className="w-4 h-4 text-red-400" />
                <span className="font-medium">Withdraw</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats - Clean Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">Deposits</span>
            </div>
            <div className="text-2xl font-bold font-mono">{formatCurrency(stats.totalDeposits)}</div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-sm text-gray-400">Withdrawals</span>
            </div>
            <div className="text-2xl font-bold font-mono">{formatCurrency(stats.totalWithdrawals)}</div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-gray-400">Wins</span>
            </div>
            <div className="text-2xl font-bold font-mono">{formatCurrency(stats.totalWins)}</div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                <Minus className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-sm text-gray-400">Losses</span>
            </div>
            <div className="text-2xl font-bold font-mono">{formatCurrency(stats.totalLosses)}</div>
          </div>
        </div>

        {/* Transaction History - Clean List */}
        <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-bold">Recent Transactions</h2>
              </div>
              <span className="text-sm text-gray-500">{walletTransactions.length} total</span>
            </div>
          </div>

          <div className="p-6">
            {walletTransactions.length === 0 ? (
              <div className="text-center py-16">
                <History className="w-16 h-16 mx-auto mb-4 text-gray-700 opacity-20" />
                <p className="text-gray-400 mb-1">No transactions yet</p>
                <p className="text-sm text-gray-500">Your wallet activity will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {walletTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="group flex items-center justify-between p-4 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-800/50 hover:border-gray-700 rounded-xl transition-all cursor-default"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.type === 'deposit'
                          ? 'bg-green-500/10'
                          : 'bg-red-500/10'
                      }`}>
                        {tx.type === 'deposit' ? (
                          <ArrowDownToLine className="w-5 h-5 text-green-400" />
                        ) : (
                          <ArrowUpFromLine className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium mb-0.5 capitalize">{tx.type}</div>
                        <div className="text-sm text-gray-400">{formatDate(tx.createdAt)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`text-xl font-bold font-mono ${
                        tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tx.type === 'deposit' ? '+' : '-'}
                        {formatCurrency(tx.amount)}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Modal - Minimal Design */}
      {showDeposit && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
            onClick={() => setShowDeposit(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f1419] border border-gray-800/50 rounded-2xl shadow-2xl animate-scale-in">
              <div className="p-6 border-b border-gray-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Deposit Funds</h2>
                    <p className="text-sm text-gray-400">Add money to your wallet</p>
                  </div>
                  <button
                    onClick={() => setShowDeposit(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#1a1f2e] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Enter Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-4 text-2xl font-mono font-bold text-center focus:outline-none focus:border-green-500/50 transition-colors"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-3">Quick Select</label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${
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

                <button
                  onClick={handleDeposit}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 py-4 rounded-xl font-semibold text-white transition-all"
                >
                  {loading ? 'Processing...' : 'Confirm Deposit'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Withdraw Modal - Minimal Design */}
      {showWithdraw && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
            onClick={() => setShowWithdraw(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#0f1419] border border-gray-800/50 rounded-2xl shadow-2xl animate-scale-in">
              <div className="p-6 border-b border-gray-800/50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold mb-1">Withdraw Funds</h2>
                    <p className="text-sm text-gray-400">Max: {formatCurrency(balance)}</p>
                  </div>
                  <button
                    onClick={() => setShowWithdraw(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#1a1f2e] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Enter Amount</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    max={balance}
                    className="w-full bg-[#1a1f2e] border border-gray-800/50 rounded-xl px-4 py-4 text-2xl font-mono font-bold text-center focus:outline-none focus:border-red-500/50 transition-colors"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-3">Quick Select</label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.filter(p => p <= balance).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        className={`py-3 rounded-xl text-sm font-medium transition-all ${
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

                <button
                  onClick={handleWithdraw}
                  disabled={loading}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:opacity-50 py-4 rounded-xl font-semibold text-white transition-all"
                >
                  {loading ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
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

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}