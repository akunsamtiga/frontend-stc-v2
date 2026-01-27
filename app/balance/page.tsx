'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { Balance as BalanceType, AccountType, UserProfile } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getStatusGradient, getStatusProfitBonus } from '@/lib/status-utils'
import { 
  Wallet, ArrowDownToLine, ArrowUpFromLine, X, Receipt, Award, 
  TrendingUp, CreditCard, Loader2
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
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showDeposit, setShowDeposit] = useState(false)
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
      
      let profileData: UserProfile | null = null
      
      if (profileRes && typeof profileRes === 'object') {
        if ('data' in profileRes && profileRes.data) {
          profileData = profileRes.data as UserProfile
        } else if ('user' in profileRes && 'statusInfo' in profileRes) {
          profileData = profileRes as UserProfile
        }
      }
      
      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Failed to load balance:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  const handleDemoDeposit = async () => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) {
      toast.error('Invalid amount')
      return
    }

    setLoading(true)
    try {
      await api.createBalanceEntry({
        accountType: 'demo',
        type: 'deposit',
        amount: amt,
        description: `Top up to demo account`,  // ✅ UBAH: Dari "Deposit to demo account"
      })
      toast.success(`Demo top up successful!`)  // ✅ UBAH: Dari "Demo deposit successful"
      setShowDeposit(false)
      setAmount('')
      loadData()
    } catch (error) {
      toast.error('Demo top up failed')  // ✅ UBAH: Dari "Demo deposit failed"
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [10000, 50000, 100000, 250000, 500000, 1000000]
  const filteredTransactions = selectedAccount === 'all' 
    ? allTransactions 
    : allTransactions.filter(t => (t.accountType || 'demo') === selectedAccount)

  if (!user) return null

  const statusInfo = profile?.statusInfo
  const profitBonus = statusInfo ? getStatusProfitBonus(statusInfo.current) : 0

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Wallet</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">My Wallet</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Manage your Real and Demo funds</p>
              </div>
            </div>
            
            {/* Desktop Status Badge */}
            {statusInfo && (
              <div className={`hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl text-white shadow-2xl border-2 border-white/30 ${
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

        {/* Mobile Status Badge */}
        {statusInfo && (
          <div className="lg:hidden mb-4 sm:mb-6">
            <div className={`p-3 sm:p-4 rounded-xl text-white shadow-lg ${
              statusInfo.current === 'standard' ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
              statusInfo.current === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-orange-600' :
              'bg-gradient-to-r from-purple-400 to-pink-600'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Award className="w-6 h-6 sm:w-8 sm:h-8" />
                  <div>
                    <div className="text-base sm:text-lg font-bold">{statusInfo.current.toUpperCase()} Status</div>
                    <div className="text-xs sm:text-sm opacity-90">Profit Bonus: +{profitBonus}%</div>
                  </div>
                </div>
                {statusInfo.nextStatus && (
                  <div className="text-right">
                    <div className="text-[10px] sm:text-xs opacity-80">Next: {statusInfo.nextStatus.toUpperCase()}</div>
                    <div className="text-sm font-bold">{statusInfo.progress}%</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* MOBILE VERSION - Simplified & Clean */}
        {/* ============================================ */}
        <div className="lg:hidden mb-4 sm:mb-6">
          <div className="space-y-4">
            {/* Real Account Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Real Account</div>
                    {profitBonus > 0 && (
                      <div className="text-xs text-green-600 font-semibold">+{profitBonus}% bonus</div>
                    )}
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-md font-bold">REAL</span>
              </div>
              
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Balance</div>
                <div className="text-2xl font-bold text-gray-900 break-all">
                  {formatCurrency(realBalance)}
                </div>
              </div>
              
              {/* ✅ FIXED: Real Account Buttons - Redirect to /payment */}
              <div className="flex gap-2">
                <Link
                  href="/payment"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Top Up  {/* ✅ UBAH: Dari "Deposit" */}
                </Link>
                <Link
                  href="/withdrawal"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  <ArrowUpFromLine className="w-4 h-4" />
                  Withdraw
                </Link>
              </div>
            </div>

            {/* Demo Account Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">Demo Account</div>
                    <div className="text-xs text-blue-600 font-semibold">Practice</div>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded-md font-bold">DEMO</span>
              </div>
              
              <div className="mb-4">
                <div className="text-xs text-gray-500 mb-1">Balance</div>
                <div className="text-2xl font-bold text-gray-900 break-all">
                  {formatCurrency(demoBalance)}
                </div>
              </div>
              
              {/* ✅ Demo Account Button - Open Modal */}
              <button
                onClick={() => {
                  setTransactionAccount('demo')
                  setShowDeposit(true)
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
              >
                <ArrowDownToLine className="w-4 h-4" />
                Add Funds
              </button>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* DESKTOP VERSION - Original Cards */}
        {/* ============================================ */}
        <div className="hidden lg:block mb-4 sm:mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Real Account Desktop Card */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 rounded-2xl sm:rounded-3xl border-2 border-emerald-200 p-4 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  Real Account
                  {statusInfo && profitBonus > 0 && (
                    <span className="hidden sm:flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg border border-green-500/30 text-xs font-bold text-green-700">
                      <Award className="w-3 h-3" />
                      +{profitBonus}%
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* ✅ Desktop Real Account - Redirect to /payment */}
                  <Link
                    href="/payment"
                    className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md touch-manipulation transition-colors"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Top Up</span>  {/* ✅ UBAH: Dari "Deposit" */}
                  </Link>
                  <Link
                    href="/withdrawal"
                    className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md touch-manipulation transition-colors"
                  >
                    <ArrowUpFromLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Withdraw</span>
                  </Link>
                </div>
              </div>

              {/* Real Account Card Visual */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl min-h-[200px] sm:min-h-[280px]">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 sm:w-64 sm:h-64 bg-white rounded-full blur-3xl -translate-y-20 sm:-translate-y-32 translate-x-20 sm:translate-x-32"></div>
                </div>

                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="relative w-9 h-7 sm:w-12 sm:h-10 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 rounded-lg shadow-xl">
                        <div className="absolute inset-1 bg-gradient-to-br from-yellow-200 to-amber-400 rounded-md"></div>
                      </div>
                    </div>
                    <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white/20 backdrop-blur-xl rounded-lg border border-white/30">
                      <span className="text-[9px] sm:text-[11px] font-black text-white tracking-widest">REAL</span>
                    </div>
                  </div>

                  <div className="mb-3 sm:mb-6">
                    <div className="text-white/70 text-[8px] sm:text-[10px] font-bold tracking-widest mb-1 sm:mb-2">ACCOUNT NUMBER</div>
                    <div className="text-xs sm:text-base text-white tracking-widest font-mono flex items-center gap-2">
                      <span className="opacity-60">••••</span>
                      <span className="opacity-60">••••</span>
                      <span className="opacity-60 hidden xs:inline">••••</span>
                      <span className="font-bold">{String(user.id).slice(-4).padStart(4, '0')}</span>
                    </div>
                  </div>

                  <div className="mb-auto">
                    <div className="text-white/70 text-[8px] sm:text-[10px] font-bold tracking-widest mb-1 sm:mb-2">BALANCE</div>
                    <div className="text-xl sm:text-3xl font-black text-white tracking-tight break-all">
                      {formatCurrency(realBalance)}
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-6 flex items-end justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-white/60 text-[7px] sm:text-[9px] font-bold tracking-widest mb-0.5 sm:mb-1">CARD HOLDER</div>
                      <div className="text-[11px] sm:text-sm font-black text-white uppercase tracking-wider truncate">
                        {user.email.split('@')[0].substring(0, 12)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/60 text-[7px] sm:text-[9px] font-bold tracking-widest mb-0.5 sm:mb-1">VALID</div>
                      <div className="text-[10px] sm:text-xs font-bold text-white">12/28</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Account Desktop Card */}
            <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl sm:rounded-3xl border-2 border-blue-200 p-4 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
                  <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Demo Account
                  <span className="hidden sm:flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-lg border border-blue-500/30 text-xs font-bold text-blue-700">
                    Practice
                  </span>
                </h2>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* ✅ Desktop Demo Account - Open Modal */}
                  <button
                    onClick={() => { setTransactionAccount('demo'); setShowDeposit(true) }}
                    className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-md touch-manipulation transition-colors"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
              </div>

              {/* Demo Account Card Visual */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-2xl min-h-[200px] sm:min-h-[280px]">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-0 right-0 w-40 h-40 sm:w-64 sm:h-64 bg-white rounded-full blur-3xl -translate-y-20 sm:-translate-y-32 translate-x-20 sm:translate-x-32"></div>
                </div>

                <div className="relative z-10 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3 sm:mb-6">
                    <div className="flex items-center gap-2">
                      <div className="relative w-9 h-7 sm:w-12 sm:h-10 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 rounded-lg shadow-xl">
                        <div className="absolute inset-1 bg-gradient-to-br from-yellow-200 to-amber-400 rounded-md"></div>
                      </div>
                    </div>
                    <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white/20 backdrop-blur-xl rounded-lg border border-white/30">
                      <span className="text-[9px] sm:text-[11px] font-black text-white tracking-widest">DEMO</span>
                    </div>
                  </div>

                  <div className="mb-3 sm:mb-6">
                    <div className="text-white/70 text-[8px] sm:text-[10px] font-bold tracking-widest mb-1 sm:mb-2">ACCOUNT NUMBER</div>
                    <div className="text-xs sm:text-base text-white tracking-widest font-mono flex items-center gap-2">
                      <span className="opacity-60">••••</span>
                      <span className="opacity-60">••••</span>
                      <span className="opacity-60 hidden xs:inline">••••</span>
                      <span className="font-bold">{String(user.id + 1000).slice(-4).padStart(4, '0')}</span>
                    </div>
                  </div>

                  <div className="mb-auto">
                    <div className="text-white/70 text-[8px] sm:text-[10px] font-bold tracking-widest mb-1 sm:mb-2">BALANCE</div>
                    <div className="text-xl sm:text-3xl font-black text-white tracking-tight break-all">
                      {formatCurrency(demoBalance)}
                    </div>
                  </div>

                  <div className="mt-3 sm:mt-6 flex items-end justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-white/60 text-[7px] sm:text-[9px] font-bold tracking-widest mb-0.5 sm:mb-1">CARD HOLDER</div>
                      <div className="text-[11px] sm:text-sm font-black text-white uppercase tracking-wider truncate">
                        {user.email.split('@')[0].substring(0, 12)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white/60 text-[7px] sm:text-[9px] font-bold tracking-widest mb-0.5 sm:mb-1">VALID</div>
                      <div className="text-[10px] sm:text-xs font-bold text-white">12/28</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* Transaction History */}
        {/* ============================================ */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Transaction History</h2>
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
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 touch-manipulation ${
                    selectedAccount === filter.id
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter.label} ({filter.count})
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 sm:p-5 lg:p-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 sm:py-16 px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Wallet className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No transactions yet</h3>
                <p className="text-sm sm:text-base text-gray-500">Your wallet activity will appear here</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 gap-3 sm:gap-4"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        tx.type === 'deposit' ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        {tx.type === 'deposit' ? (
                          <ArrowDownToLine className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        ) : (
                          <ArrowUpFromLine className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 sm:mb-1 flex-wrap">
                          <div className="font-semibold text-gray-900 capitalize text-sm sm:text-base">
                            {tx.type === 'deposit' ? 'Top Up' : tx.type}  {/* ✅ UBAH: Dari "deposit" menjadi "Top Up" */}
                          </div>
                          <span className={`px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold ${
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
                    
                    <div className={`text-base sm:text-lg lg:text-xl font-bold flex-shrink-0 ${
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

      {/* ============================================ */}
      {/* DEMO TOP UP MODAL (Only for Demo Account) */}
      {/* ============================================ */}
      {showDeposit && transactionAccount === 'demo' && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowDeposit(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-5 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <ArrowDownToLine className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Add Demo Funds</h2>
                      <p className="text-xs sm:text-sm text-gray-500 truncate">
                        Practice trading with virtual money
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeposit(false)}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors flex-shrink-0 ml-2 touch-manipulation"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5 sm:space-y-6">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Enter Amount (IDR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full text-center text-2xl sm:text-3xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl py-3 sm:py-4 focus:border-blue-500 focus:bg-white transition-all focus:outline-none"
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
                        className={`py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all touch-manipulation ${
                          amount === preset.toString()
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                        }`}
                      >
                        {preset >= 1000000 ? `${preset/1000000}M` : `${preset/1000}K`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleDemoDeposit}
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white py-3.5 sm:py-4 rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 text-sm sm:text-base flex items-center justify-center gap-2 touch-manipulation"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm'  
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