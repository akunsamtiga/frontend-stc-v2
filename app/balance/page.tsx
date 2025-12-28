// app/balance/page.tsx - COMPLETE REWRITE with Real/Demo Support - FIXED
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { Balance as BalanceType, AccountType } from '@/types'
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
  Target
} from 'lucide-react'
import { toast } from 'sonner'

export default function BalancePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [realBalance, setRealBalance] = useState(0)
  const [demoBalance, setDemoBalance] = useState(0)
  
  const [allTransactions, setAllTransactions] = useState<BalanceType[]>([])
  
  const [selectedAccount, setSelectedAccount] = useState<AccountType | 'all'>('all')
  
  const [transactionAccount, setTransactionAccount] = useState<AccountType>('demo')
  
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
      const [balancesRes, historyRes] = await Promise.all([
        api.getBothBalances(),
        api.getBalanceHistory(1, 100),
      ])
      
      const balances = balancesRes?.data || balancesRes
      setRealBalance(balances?.realBalance || 0)
      setDemoBalance(balances?.demoBalance || 0)
      
      setAllTransactions(historyRes?.data?.transactions || historyRes?.transactions || [])
    } catch (error) {
      console.error('Failed to load balance:', error)
      setRealBalance(0)
      setDemoBalance(0)
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
        accountType: transactionAccount,
        type: 'deposit',
        amount: amt,
        description: `Deposit to ${transactionAccount} account`,
      })
      toast.success(`Deposit to ${transactionAccount} account successful!`)
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
    
    const currentBalance = transactionAccount === 'real' ? realBalance : demoBalance
    
    if (amt > currentBalance) {
      toast.error('Insufficient balance')
      return
    }

    setLoading(true)
    try {
      await api.createBalanceEntry({
        accountType: transactionAccount,
        type: 'withdrawal',
        amount: amt,
        description: `Withdrawal from ${transactionAccount} account`,
      })
      toast.success(`Withdrawal from ${transactionAccount} account successful!`)
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

  const filteredTransactions = selectedAccount === 'all' 
    ? allTransactions 
    : allTransactions.filter(t => (t.accountType || 'demo') === selectedAccount)

  const realStats = {
    totalDeposits: allTransactions
      .filter(t => (t.accountType || 'demo') === 'real' && t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawals: allTransactions
      .filter(t => (t.accountType || 'demo') === 'real' && t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0),
    totalWins: allTransactions
      .filter(t => (t.accountType || 'demo') === 'real' && (t.type === 'win' || t.type === 'order_profit'))
      .reduce((sum, t) => sum + t.amount, 0),
    totalLosses: allTransactions
      .filter(t => (t.accountType || 'demo') === 'real' && (t.type === 'lose' || t.type === 'order_debit'))
      .reduce((sum, t) => sum + t.amount, 0),
  }

  const demoStats = {
    totalDeposits: allTransactions
      .filter(t => (t.accountType || 'demo') === 'demo' && t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0),
    totalWithdrawals: allTransactions
      .filter(t => (t.accountType || 'demo') === 'demo' && t.type === 'withdrawal')
      .reduce((sum, t) => sum + t.amount, 0),
    totalWins: allTransactions
      .filter(t => (t.accountType || 'demo') === 'demo' && (t.type === 'win' || t.type === 'order_profit'))
      .reduce((sum, t) => sum + t.amount, 0),
    totalLosses: allTransactions
      .filter(t => (t.accountType || 'demo') === 'demo' && (t.type === 'lose' || t.type === 'order_debit'))
      .reduce((sum, t) => sum + t.amount, 0),
  }

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
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-2">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Wallet</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Wallet</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Manage your Real and Demo funds</p>
            </div>
          </div>
        </div>

        {/* DUAL BALANCE CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8">
          {/* Real Balance Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full -translate-y-24 sm:-translate-y-32 translate-x-24 sm:translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/5 rounded-full translate-y-16 sm:translate-y-24 -translate-x-16 sm:-translate-x-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-green-100 mb-2">
                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">REAL Balance</span>
              </div>
              
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 font-mono tracking-tight">
                {formatCurrency(realBalance)}
              </div>
              
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setTransactionAccount('real')
                    setShowDeposit(true)
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white text-green-600 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-green-50 transition-all shadow-lg"
                >
                  <ArrowDownToLine className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Deposit</span>
                </button>
                
                <button
                  onClick={() => {
                    setTransactionAccount('real')
                    setShowWithdraw(true)
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
                >
                  <ArrowUpFromLine className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>
          </div>

          {/* Demo Balance Card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/10 rounded-full -translate-y-24 sm:-translate-y-32 translate-x-24 sm:translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-white/5 rounded-full translate-y-16 sm:translate-y-24 -translate-x-16 sm:-translate-x-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-blue-100 mb-2">
                <PiggyBank className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">DEMO Balance</span>
              </div>
              
              <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6 font-mono tracking-tight">
                {formatCurrency(demoBalance)}
              </div>
              
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setTransactionAccount('demo')
                    setShowDeposit(true)
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white text-blue-600 rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-blue-50 transition-all shadow-lg"
                >
                  <ArrowDownToLine className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Add Funds</span>
                </button>
                
                <button
                  onClick={() => {
                    setTransactionAccount('demo')
                    setShowWithdraw(true)
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/10 text-white rounded-lg sm:rounded-xl text-sm sm:text-base font-semibold hover:bg-white/20 transition-all backdrop-blur-sm border border-white/20"
                >
                  <ArrowUpFromLine className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Real Deposits</div>
            <div className="text-lg sm:text-xl font-bold text-green-600">{formatCurrency(realStats.totalDeposits)}</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Real Withdrawals</div>
            <div className="text-lg sm:text-xl font-bold text-red-600">{formatCurrency(realStats.totalWithdrawals)}</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Demo Deposits</div>
            <div className="text-lg sm:text-xl font-bold text-blue-600">{formatCurrency(demoStats.totalDeposits)}</div>
          </div>
          <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-100">
            <div className="text-xs text-gray-500 mb-1">Demo Withdrawals</div>
            <div className="text-lg sm:text-xl font-bold text-orange-600">{formatCurrency(demoStats.totalWithdrawals)}</div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-transparent">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <h2 className="text-base sm:text-xl font-bold text-gray-900">Transaction History</h2>
              </div>
            </div>

            {/* Account Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[
                { id: 'all', label: 'All', count: allTransactions.length },
                { id: 'real', label: 'Real', count: allTransactions.filter(t => (t.accountType || 'demo') === 'real').length },
                { id: 'demo', label: 'Demo', count: allTransactions.filter(t => (t.accountType || 'demo') === 'demo').length }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedAccount(filter.id as any)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                    selectedAccount === filter.id
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 sm:p-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 sm:py-16 px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-sm sm:text-base text-gray-500">Your wallet activity will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="group flex items-center justify-between p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${
                        tx.type === 'deposit' ? 'bg-green-50 group-hover:bg-green-100' : 'bg-red-50 group-hover:bg-red-100'
                      } transition-colors flex-shrink-0`}>
                        {tx.type === 'deposit' ? (
                          <ArrowDownToLine className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        ) : (
                          <ArrowUpFromLine className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="text-sm sm:text-base font-semibold text-gray-900 capitalize">{tx.type}</div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            (tx.accountType || 'demo') === 'real' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {(tx.accountType || 'demo').toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500 truncate">{formatDate(tx.createdAt)}</div>
                      </div>
                    </div>
                    
                    <div className={`text-lg sm:text-2xl font-bold font-mono ${
                      tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'deposit' ? '+' : '-'}
                      <span className="hidden xs:inline">{formatCurrency(tx.amount)}</span>
                      <span className="xs:hidden">{formatCurrency(tx.amount).replace('Rp', '').replace('.00', '')}</span>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl animate-slide-up">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                      transactionAccount === 'real' ? 'bg-green-50' : 'bg-blue-50'
                    }`}>
                      <ArrowDownToLine className={`w-5 h-5 sm:w-6 sm:h-6 ${
                        transactionAccount === 'real' ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Add Funds</h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Deposit to <span className="font-semibold uppercase">{transactionAccount}</span> account
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeposit(false)}
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Enter Amount (IDR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-center text-2xl sm:text-3xl font-bold font-mono bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl py-3 sm:py-4 focus:border-blue-500 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Quick Select</label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setAmount(preset.toString())}
                        className={`py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                          amount === preset.toString()
                            ? `${transactionAccount === 'real' ? 'bg-green-500' : 'bg-blue-500'} text-white shadow-lg scale-105`
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
                  className={`w-full text-white py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 ${
                    transactionAccount === 'real'
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    `Confirm Deposit`
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl animate-slide-up">
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                      <ArrowUpFromLine className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Withdraw Funds</h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Max: {formatCurrency(transactionAccount === 'real' ? realBalance : demoBalance)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWithdraw(false)}
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Enter Amount (IDR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    max={transactionAccount === 'real' ? realBalance : demoBalance}
                    className="w-full text-center text-2xl sm:text-3xl font-bold font-mono bg-gray-50 border-2 border-gray-200 rounded-xl sm:rounded-2xl py-3 sm:py-4 focus:border-red-500 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Quick Select</label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts
                      .filter(p => p <= (transactionAccount === 'real' ? realBalance : demoBalance))
                      .map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setAmount(preset.toString())}
                          className={`py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold transition-all ${
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
                  className="w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
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