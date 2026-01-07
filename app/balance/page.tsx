// app/(authenticated)/balance/page.tsx - CARD ONLY
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { Balance as BalanceType, AccountType, UserProfile } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getStatusGradient, getStatusProfitBonus } from '@/lib/status-utils'
import { 
  Wallet, 
  ArrowDownToLine,
  ArrowUpFromLine,
  X,
  Receipt,
  Award,
  TrendingUp,
  CreditCard,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

// Skeleton Components
const CardSkeleton = () => (
  <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl p-6 min-h-[280px] animate-pulse">
    <div className="flex justify-between mb-6">
      <div className="w-12 h-10 bg-gray-400 rounded-lg"></div>
      <div className="w-16 h-6 bg-gray-400 rounded-lg"></div>
    </div>
    <div className="mb-6">
      <div className="h-3 w-32 bg-gray-400 rounded mb-2"></div>
      <div className="h-4 w-48 bg-gray-400 rounded"></div>
    </div>
    <div className="mb-auto">
      <div className="h-3 w-32 bg-gray-400 rounded mb-2"></div>
      <div className="h-8 w-40 bg-gray-400 rounded"></div>
    </div>
  </div>
)

const TransactionSkeleton = () => (
  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 animate-pulse">
    <div className="flex items-center gap-4 flex-1">
      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
      <div className="flex-1">
        <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
    <div className="h-6 w-24 bg-gray-200 rounded"></div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#fafafa]">
    <Navbar />
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-48 mb-3"></div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-xl w-32 h-12"></div>
        </div>
      </div>

      <div className="mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl border-2 border-gray-200 p-6 shadow-lg">
            <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
            <CardSkeleton />
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl border-2 border-gray-200 p-6 shadow-lg">
            <div className="h-6 w-32 bg-gray-200 rounded mb-6"></div>
            <CardSkeleton />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-5 sm:p-6 border-b border-gray-200">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4"></div>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
        <div className="p-5 sm:p-6 space-y-3">
          {[...Array(5)].map((_, i) => (
            <TransactionSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  </div>
)

export default function BalancePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [realBalance, setRealBalance] = useState(0)
  const [demoBalance, setDemoBalance] = useState(0)
  const [allTransactions, setAllTransactions] = useState<BalanceType[]>([])
  const [selectedAccount, setSelectedAccount] = useState<AccountType | 'all'>('all')
  const [transactionAccount, setTransactionAccount] = useState<AccountType>('demo')
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  
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
      const [balancesRes, historyRes, profileRes] = await Promise.all([
        api.getBothBalances(),
        api.getBalanceHistory(1, 100),
        api.getProfile()
      ])
      
      const balances = balancesRes?.data || balancesRes
      setRealBalance(balances?.realBalance || 0)
      setDemoBalance(balances?.demoBalance || 0)
      
      setAllTransactions(historyRes?.data?.transactions || historyRes?.transactions || [])
      
      const profileData = profileRes?.data || profileRes
      setProfile(profileData)
    } catch (error) {
      console.error('Failed to load balance:', error)
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
      
      if (transactionAccount === 'real' && profile?.statusInfo) {
        const newDeposit = profile.statusInfo.totalDeposit + amt
        if (newDeposit >= 200000 && profile.statusInfo.current === 'standard') {
          toast.success('🎉 Congratulations! You\'ve been upgraded to GOLD status!')
        } else if (newDeposit >= 1600000 && profile.statusInfo.current === 'gold') {
          toast.success('🎉 Congratulations! You\'ve been upgraded to VIP status!')
        } else {
          toast.success(`Deposit to ${transactionAccount} account successful!`)
        }
      } else {
        toast.success(`Deposit to ${transactionAccount} account successful!`)
      }
      
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

  if (!user) return null
  if (initialLoading) return <LoadingSkeleton />

  const statusInfo = profile?.statusInfo
  const profitBonus = statusInfo ? getStatusProfitBonus(statusInfo.current) : 0

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header with Status Badge */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Wallet</span>
          </div>
          <div className="flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Wallet</h1>
                <p className="text-sm text-gray-500">Manage your Real and Demo funds</p>
              </div>
            </div>
            
            {statusInfo && (
              <div className={`flex items-center gap-3 px-4 py-2 rounded-xl text-white shadow-2xl border-2 border-white/30 ring-2 ring-black/10 ${
                statusInfo.current === 'standard' ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                statusInfo.current === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-orange-600' :
                'bg-gradient-to-r from-purple-400 to-pink-600'
              }`}>
                <Award className="w-5 h-5" />
                <div className="text-sm">
                  <div className="font-bold">{statusInfo.current.toUpperCase()}</div>
                  <div className="text-xs opacity-90">+{profitBonus}% Bonus</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Info Banner (Mobile) */}
        {statusInfo && (
          <div className="sm:hidden mb-6">
            <div className={`p-4 rounded-xl text-white shadow-lg ${
              statusInfo.current === 'standard' ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
              statusInfo.current === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-orange-600' :
              'bg-gradient-to-r from-purple-400 to-pink-600'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Award className="w-8 h-8" />
                  <div>
                    <div className="text-lg font-bold">{statusInfo.current.toUpperCase()} Status</div>
                    <div className="text-sm opacity-90">Profit Bonus: +{profitBonus}%</div>
                  </div>
                </div>
                {statusInfo.nextStatus && (
                  <div className="text-right">
                    <div className="text-xs opacity-80">Next: {statusInfo.nextStatus.toUpperCase()}</div>
                    <div className="text-sm font-bold">{statusInfo.progress}%</div>
                  </div>
                )}
              </div>
              {statusInfo.nextStatus && statusInfo.depositNeeded && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>{formatCurrency(statusInfo.depositNeeded)} more to {statusInfo.nextStatus.toUpperCase()}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Account Cards - Card Only */}
        <div className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* REAL ACCOUNT BOX */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 rounded-3xl border-2 border-emerald-200 p-6 shadow-xl">
              {/* Header with Buttons */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  Real Account
                  {statusInfo && profitBonus > 0 && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg border border-green-500/30 text-xs font-bold text-green-700">
                      <Award className="w-3 h-3" />
                      +{profitBonus}%
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTransactionAccount('real')
                      setShowDeposit(true)
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white rounded-lg transition-all text-sm font-semibold shadow-md"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    Deposit
                  </button>
                  <button
                    onClick={() => {
                      setTransactionAccount('real')
                      setShowWithdraw(true)
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white rounded-lg transition-all text-sm font-semibold shadow-md"
                  >
                    <ArrowUpFromLine className="w-4 h-4" />
                    Withdraw
                  </button>
                </div>
              </div>

              {/* Real Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1 min-h-[280px] group">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl translate-y-32 -translate-x-32"></div>
                </div>

                <div className="relative z-10 h-full flex flex-col">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      {/* Chip */}
                      <div className="relative w-12 h-10 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 rounded-lg shadow-xl">
                        <div className="absolute inset-1 bg-gradient-to-br from-yellow-200 to-amber-400 rounded-md"></div>
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[2px] p-2">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className="bg-amber-600/30 rounded-[1px]"></div>
                          ))}
                        </div>
                      </div>
                      {/* Contactless */}
                      <div className="flex flex-col gap-1">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="flex gap-1">
                            <div className={`w-1.5 h-1.5 border-2 border-white/40 rounded-full transform rotate-45 ${i === 0 ? 'opacity-100' : i === 1 ? 'opacity-70' : 'opacity-40'}`}></div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-white/20 backdrop-blur-xl rounded-lg border border-white/30 shadow-lg">
                      <span className="text-[11px] font-black text-white tracking-[0.15em] drop-shadow-sm">REAL</span>
                    </div>
                  </div>

                  {/* Card Number */}
                  <div className="mb-6">
                    <div className="text-white/70 text-[10px] font-bold tracking-[0.2em] mb-2">ACCOUNT NUMBER</div>
                    <div className="text-base text-white tracking-[0.3em] drop-shadow-md flex items-center gap-3 flex-wrap font-mono">
                      <span className="opacity-60">••••</span>
                      <span className="opacity-60">••••</span>
                      <span className="opacity-60 hidden sm:inline">••••</span>
                      <span className="font-bold">{String(user.id).slice(-4).padStart(4, '0')}</span>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="mb-auto">
                    <div className="text-white/70 text-[10px] font-bold tracking-[0.2em] mb-2">AVAILABLE BALANCE</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-black text-white tracking-tight drop-shadow-lg break-all">
                        {formatCurrency(realBalance)}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-6 flex items-end justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-white/60 text-[9px] font-bold tracking-[0.2em] mb-1">CARD HOLDER</div>
                      <div className="text-sm font-black text-white uppercase tracking-wider drop-shadow-md truncate">
                        {user.email.split('@')[0].substring(0, 15)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-white/60 text-[9px] font-bold tracking-[0.2em] mb-1">VALID THRU</div>
                      <div className="text-xs font-bold text-white tracking-wider">12/28</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DEMO ACCOUNT BOX */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border-2 border-blue-200 p-6 shadow-xl">
              {/* Header with Buttons */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  Demo Account
                  <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-lg border border-blue-500/30 text-xs font-bold text-blue-700">
                    Practice
                  </span>
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setTransactionAccount('demo')
                      setShowDeposit(true)
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white rounded-lg transition-all text-sm font-semibold shadow-md"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    Add Funds
                  </button>
                  <button
                    onClick={() => {
                      setTransactionAccount('demo')
                      setShowWithdraw(true)
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-lg transition-all text-sm font-semibold shadow-md"
                  >
                    <ArrowUpFromLine className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              </div>

              {/* Demo Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-1 min-h-[280px] group">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl translate-y-32 -translate-x-32"></div>
                </div>

                <div className="relative z-10 h-full flex flex-col">
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      {/* Chip */}
                      <div className="relative w-12 h-10 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 rounded-lg shadow-xl">
                        <div className="absolute inset-1 bg-gradient-to-br from-yellow-200 to-amber-400 rounded-md"></div>
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-[2px] p-2">
                          {[...Array(9)].map((_, i) => (
                            <div key={i} className="bg-amber-600/30 rounded-[1px]"></div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 bg-white/20 backdrop-blur-xl rounded-lg border border-white/30 shadow-lg">
                      <span className="text-[11px] font-black text-white tracking-[0.15em] drop-shadow-sm">DEMO</span>
                    </div>
                  </div>

                  {/* Card Number */}
                  <div className="mb-6">
                    <div className="text-white/70 text-[10px] font-bold tracking-[0.2em] mb-2">ACCOUNT NUMBER</div>
                    <div className="text-base text-white tracking-[0.3em] drop-shadow-md flex items-center gap-3 flex-wrap font-mono">
                      <span className="opacity-60">••••</span>
                      <span className="opacity-60">••••</span>
                      <span className="opacity-60 hidden sm:inline">••••</span>
                      <span className="font-bold">{String(user.id + 1000).slice(-4).padStart(4, '0')}</span>
                    </div>
                  </div>

                  {/* Balance */}
                  <div className="mb-auto">
                    <div className="text-white/70 text-[10px] font-bold tracking-[0.2em] mb-2">AVAILABLE BALANCE</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-3xl font-black text-white tracking-tight drop-shadow-lg break-all">
                        {formatCurrency(demoBalance)}
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-6 flex items-end justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-white/60 text-[9px] font-bold tracking-[0.2em] mb-1">CARD HOLDER</div>
                      <div className="text-sm font-black text-white uppercase tracking-wider drop-shadow-md truncate">
                        {user.email.split('@')[0].substring(0, 15)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-white/60 text-[9px] font-bold tracking-[0.2em] mb-1">VALID THRU</div>
                      <div className="text-xs font-bold text-white tracking-wider">12/28</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-5 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Transaction History</h2>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 scrollbar-hide">
              {[
                { id: 'all', label: 'All', count: allTransactions.length },
                { id: 'real', label: 'Real', count: allTransactions.filter(t => (t.accountType || 'demo') === 'real').length },
                { id: 'demo', label: 'Demo', count: allTransactions.filter(t => (t.accountType || 'demo') === 'demo').length }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setSelectedAccount(filter.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    selectedAccount === filter.id
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions yet</h3>
                <p className="text-base text-gray-500">Your wallet activity will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors border border-gray-100 gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'deposit' ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        {tx.type === 'deposit' ? (
                          <ArrowDownToLine className="w-6 h-6 text-green-600" />
                        ) : (
                          <ArrowUpFromLine className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <div className="font-semibold text-gray-900 capitalize text-base">{tx.type}</div>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                            (tx.accountType || 'demo') === 'real' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {(tx.accountType || 'demo').toUpperCase()}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 truncate">{formatDate(tx.createdAt)}</div>
                      </div>
                    </div>
                    
                    <div className={`text-lg sm:text-xl font-bold flex-shrink-0 ${
                      tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" 
            onClick={() => setShowDeposit(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      transactionAccount === 'real' ? 'bg-green-50' : 'bg-blue-50'
                    }`}>
                      <ArrowDownToLine className={`w-6 h-6 ${
                        transactionAccount === 'real' ? 'text-green-600' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-900">Add Funds</h2>
                      <p className="text-sm text-gray-500 truncate">
                        Deposit to <span className="font-semibold uppercase">{transactionAccount}</span> account
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeposit(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0 ml-2"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {transactionAccount === 'real' && statusInfo && statusInfo.nextStatus && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-900">Status Upgrade Available</span>
                    </div>
                    <p className="text-sm text-purple-700">
                      Deposit {formatCurrency(statusInfo.depositNeeded || 0)} more to reach <span className="font-bold">{statusInfo.nextStatus.toUpperCase()}</span> status and get +{getStatusProfitBonus(statusInfo.nextStatus)}% profit bonus!
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Enter Amount (IDR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-center text-3xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl py-4 focus:border-blue-500 focus:bg-white transition-all focus:outline-none"
                    autoFocus
                  />
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
                            ? `${transactionAccount === 'real' ? 'bg-green-500' : 'bg-blue-500'} text-white shadow-sm`
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 border border-gray-200'
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
                  className={`w-full text-white py-4 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 text-base flex items-center justify-center gap-2 ${
                    transactionAccount === 'real'
                      ? 'bg-green-500 hover:bg-green-600 active:bg-green-700'
                      : 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" 
            onClick={() => setShowWithdraw(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ArrowUpFromLine className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl font-bold text-gray-900">Withdraw Funds</h2>
                      <p className="text-sm text-gray-500 truncate">
                        Max: {formatCurrency(transactionAccount === 'real' ? realBalance : demoBalance)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWithdraw(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0 ml-2"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Enter Amount (IDR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    max={transactionAccount === 'real' ? realBalance : demoBalance}
                    className="w-full text-center text-3xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl py-4 focus:border-red-500 focus:bg-white transition-all focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Quick Select</label>
                  <div className="grid grid-cols-3 gap-2">
                    {quickAmounts
                      .filter(p => p <= (transactionAccount === 'real' ? realBalance : demoBalance))
                      .map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setAmount(preset.toString())}
                          className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                            amount === preset.toString()
                              ? 'bg-red-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 border border-gray-200'
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
                  className="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white py-4 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 text-base flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
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