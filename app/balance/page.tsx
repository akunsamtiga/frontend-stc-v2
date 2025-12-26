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
  X,
  Receipt,
  PiggyBank,
  CreditCard
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
            <div className="text-sm text-gray-500">Loading your wallet...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/30">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Wallet</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wallet</h1>
              <p className="text-gray-500">Manage your funds securely</p>
            </div>
          </div>
        </div>

        {/* Main Balance Card - Featured */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-emerald-500 rounded-3xl p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-blue-100 mb-2">
                <PiggyBank className="w-4 h-4" />
                <span className="text-sm font-medium">Available Balance</span>
              </div>
              
              <div className="text-5xl md:text-6xl font-bold text-white mb-6 font-mono tracking-tight">
                {formatCurrency(balance)}
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowDeposit(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                >
                  <ArrowDownToLine className="w-5 h-5" />
                  <span>Deposit</span>
                </button>
                
                <button
                  onClick={() => setShowWithdraw(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
                >
                  <ArrowUpFromLine className="w-5 h-5" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Total Deposits</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.totalDeposits)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Total Withdrawals</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.totalWithdrawals)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Trading Wins</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.totalWins)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <Minus className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Trading Losses</div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(stats.totalLosses)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700">{walletTransactions.length} transactions</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            {walletTransactions.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-gray-500 mb-6">Your wallet activity will appear here</p>
                <button
                  onClick={() => setShowDeposit(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  <ArrowDownToLine className="w-5 h-5" />
                  Make Your First Deposit
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {walletTransactions.map((tx, index) => (
                  <div key={tx.id} className="group flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        tx.type === 'deposit' ? 'bg-green-50 group-hover:bg-green-100' : 'bg-red-50 group-hover:bg-red-100'
                      } transition-colors`}>
                        {tx.type === 'deposit' ? (
                          <ArrowDownToLine className="w-6 h-6 text-green-600" />
                        ) : (
                          <ArrowUpFromLine className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 capitalize mb-1">{tx.type}</div>
                        <div className="text-sm text-gray-500">{formatDate(tx.createdAt)}</div>
                      </div>
                    </div>
                    
                    <div className={`text-2xl font-bold font-mono ${
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
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" 
            onClick={() => setShowDeposit(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl animate-slide-up">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                      <ArrowDownToLine className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Add Funds</h2>
                      <p className="text-sm text-gray-500">Deposit money to your wallet</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeposit(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Enter Amount (IDR)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full text-center text-3xl font-bold font-mono bg-gray-50 border-2 border-gray-200 rounded-2xl py-4 focus:border-green-500 focus:bg-white transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Quick Select</label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                          amount === preset.toString()
                            ? 'bg-green-500 text-white shadow-lg scale-105'
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
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    'Confirm Deposit'
                  )}
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 animate-fade-in" 
            onClick={() => setShowWithdraw(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl animate-slide-up">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                      <ArrowUpFromLine className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Withdraw Funds</h2>
                      <p className="text-sm text-gray-500">Max: {formatCurrency(balance)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWithdraw(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Enter Amount (IDR)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      max={balance}
                      className="w-full text-center text-3xl font-bold font-mono bg-gray-50 border-2 border-gray-200 rounded-2xl py-4 focus:border-red-500 focus:bg-white transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Quick Select</label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.filter(p => p <= balance).map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                          amount === preset.toString()
                            ? 'bg-red-500 text-white shadow-lg scale-105'
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
                  className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    'Confirm Withdrawal'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}