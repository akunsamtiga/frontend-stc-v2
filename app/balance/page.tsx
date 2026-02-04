'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { Balance as BalanceType, AccountType, UserProfile } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getStatusProfitBonus } from '@/lib/status-utils'
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, X, Receipt, Award,
  CreditCard, Loader2, ChevronLeft, ChevronRight, Wifi, Clock
} from 'lucide-react'
import { toast } from 'sonner'

const ITEMS_PER_PAGE = 10

// ============================================
// INTERFACE UNTUK DEPOSIT MIDTRANS
// ============================================
interface MidtransDeposit {
  id: string
  order_id: string
  user_id: string
  amount: number
  status: 'pending' | 'success' | 'failed' | 'expired'
  payment_type?: string
  description?: string
  createdAt: string
  completedAt?: string
}

// ============================================
// INTERFACE UNTUK TRANSAKSI GABUNGAN
// ============================================
interface CombinedTransaction {
  id: string
  type: 'deposit' | 'withdrawal'
  amount: number
  accountType: 'real' | 'demo'
  description?: string
  createdAt: string
  status?: string
  payment_type?: string
  source: 'balance' | 'midtrans' // Menandai sumber data
}

// ============================================
// STAGGER ANIMATION STYLES
// ============================================
const StaggerStyles = () => (
  <style jsx global>{`
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    .stagger-item {
      animation: fadeInUp 0.5s ease-out forwards;
      opacity: 0;
    }
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .skeleton-item {
      animation: skeleton-pulse 2s ease-in-out infinite;
      opacity: 0;
      animation-fill-mode: forwards;
    }
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    .card-shimmer {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
      background-size: 1000px 100%;
      animation: shimmer 3s infinite;
    }
    /* Grid Pattern - Background putih, pattern kotak-kotak gelap 8% opacity, jarak lebar */
    .bg-pattern-grid {
      background-color: #ffffff;
      background-image:
        linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
      background-size: 40px 40px;
      background-position: center center;
    }
    /* Alternative: Grid dengan jarak 48px */
    .bg-pattern-grid-48 {
      background-color: #ffffff;
      background-image:
        linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
      background-size: 48px 48px;
      background-position: center center;
    }
    /* Alternative: Grid dengan jarak 56px */
    .bg-pattern-grid-56 {
      background-color: #ffffff;
      background-image:
        linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
      background-size: 56px 56px;
      background-position: center center;
    }
  `}</style>
)

// ============================================
// SKELETON COMPONENTS (untuk loading state)
// ============================================
const SkeletonCard = ({ index = 0 }: { index?: number }) => (
  <div
    className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm skeleton-item"
    style={{ animationDelay: `${index * 200}ms` }}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
          <div className="h-6 bg-gray-200 rounded w-32 mt-2"></div>
        </div>
      </div>
      <div className="flex flex-col gap-2 flex-shrink-0">
        <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
        <div className="h-8 bg-gray-200 rounded-lg w-20"></div>
      </div>
    </div>
  </div>
)

const SkeletonDesktopCard = ({ index = 0 }: { index?: number }) => (
  <div
    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border-2 border-gray-200 p-6 shadow-xl skeleton-item"
    style={{ animationDelay: `${index * 250}ms` }}
  >
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 bg-gray-300 rounded"></div>
        <div className="h-5 bg-gray-300 rounded w-32"></div>
      </div>
      <div className="flex gap-2">
        <div className="h-10 bg-gray-300 rounded-lg w-24"></div>
        <div className="h-10 bg-gray-300 rounded-lg w-24"></div>
      </div>
    </div>
    <div className="bg-gray-300 rounded-2xl p-6 min-h-[280px]">
      <div className="flex justify-between mb-6">
        <div className="w-12 h-10 bg-gray-400 rounded-lg opacity-30"></div>
        <div className="h-8 bg-gray-400 rounded-lg w-16 opacity-30"></div>
      </div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-400 rounded w-24 opacity-30"></div>
        <div className="h-10 bg-gray-400 rounded w-48 opacity-30"></div>
      </div>
    </div>
  </div>
)

const SkeletonTransactionRow = ({ index = 0 }: { index?: number }) => (
  <div
    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 skeleton-item"
    style={{ animationDelay: `${(index + 3) * 150}ms` }}
  >
    <div className="flex items-center gap-4 flex-1">
      <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="h-3 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
    <div className="h-6 bg-gray-200 rounded w-20"></div>
  </div>
)

const LoadingSkeleton = () => (
  <>
    {/* INJECT STYLE GLOBAL KHUSUS UNTUK SKELETON */}
    <style jsx global>{`
      /* Grid Pattern - Background putih dengan pola halus */
      .bg-pattern-grid {
        background-color: #ffffff !important;
        background-image: 
          linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
        background-size: 40px 40px;
        background-position: center center;
      }
      
      /* Scrollbar hide utility */
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      
      /* Pastikan body tidak hitam saat loading */
      body {
        background-color: #ffffff !important;
      }
      
      /* Skeleton animations */
      @keyframes skeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      .skeleton-item {
        animation: skeleton-pulse 2s ease-in-out infinite;
        opacity: 0;
        animation-fill-mode: forwards;
      }
    `}</style>
    
    <div className="min-h-screen bg-pattern-grid">
      <Navbar />
      {/* Mobile Skeleton */}
      <div className="lg:hidden container mx-auto px-3 py-4">
        <div className="mb-4 skeleton-item" style={{ animationDelay: '0ms' }}>
          <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-xl"></div>
            <div className="h-5 bg-gray-200 rounded w-28"></div>
          </div>
        </div>
        <div className="h-20 bg-gray-200 rounded-xl mb-4 skeleton-item" style={{ animationDelay: '100ms' }}></div>
        <div className="space-y-3 mb-6">
          <SkeletonCard index={1} />
          <SkeletonCard index={2} />
        </div>
        <div className="h-12 bg-gray-200 rounded-xl mb-3 skeleton-item" style={{ animationDelay: '600ms' }}></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <SkeletonTransactionRow key={i} index={i} />
          ))}
        </div>
      </div>
      {/* Desktop Skeleton */}
      <div className="hidden lg:block container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 skeleton-item" style={{ animationDelay: '0ms' }}>
          <div className="h-4 bg-gray-200 rounded w-48 mb-3"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div className="h-6 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded-xl w-40"></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <SkeletonDesktopCard index={1} />
          <SkeletonDesktopCard index={2} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden skeleton-item" style={{ animationDelay: '800ms' }}>
          <div className="p-6 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="flex gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-gray-200 rounded-xl w-24"></div>
              ))}
            </div>
          </div>
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <SkeletonTransactionRow key={i} index={i + 5} />
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
)

export default function BalancePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [realBalance, setRealBalance] = useState(0)
  const [demoBalance, setDemoBalance] = useState(0)
  const [allTransactions, setAllTransactions] = useState<CombinedTransaction[]>([])
  const [selectedAccount, setSelectedAccount] = useState<AccountType | 'all'>('all')
  const [transactionAccount, setTransactionAccount] = useState<AccountType>('demo')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showDeposit, setShowDeposit] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadData()
  }, [user])

  useEffect(() => {
    setCurrentPage(1)
  }, [selectedAccount])

  const loadData = async () => {
    try {
      setInitialLoading(true)
      // ✅ PERBAIKAN: Load balance, balance history, deposit history, dan profile secara parallel
      const [balancesRes, historyRes, depositHistoryRes, profileRes] = await Promise.all([
        api.getBothBalances(),
        api.getBalanceHistory(1, 100),
        api.getDepositHistory().catch(err => {
          console.log('⚠️ Deposit history not available:', err)
          return null
        }),
        api.getProfile()
      ])

      // Set balances
      const balances = balancesRes?.data || balancesRes
      setRealBalance(balances?.realBalance || 0)
      setDemoBalance(balances?.demoBalance || 0)

      // ============================================
      // ✅ GABUNGKAN TRANSAKSI DARI BALANCE DAN MIDTRANS
      // ============================================
      // 1. Ambil transaksi dari balance (filter hanya deposit dan withdrawal)
      const balanceTransactions: CombinedTransaction[] = (historyRes?.data?.transactions || historyRes?.transactions || [])
        .filter((tx: any) => {
          const txType = tx.type.toLowerCase()
          return txType === 'deposit' || txType === 'withdrawal'
        })
        .map((tx: any) => ({
          id: tx.id,
          type: tx.type.toLowerCase(),
          amount: tx.amount,
          accountType: tx.accountType || 'demo',
          description: tx.description,
          createdAt: tx.createdAt,
          source: 'balance' as const
        }))

      // 2. Ambil deposit dari Midtrans
      let midtransDeposits: MidtransDeposit[] = []
      if (depositHistoryRes) {
        midtransDeposits = (depositHistoryRes as any)?.data?.deposits ||
          (depositHistoryRes as any)?.deposits || []
      }

      // 3. Convert Midtrans deposits ke format CombinedTransaction (hanya yang sukses)
      const midtransTransactions: CombinedTransaction[] = midtransDeposits
        .filter((deposit: MidtransDeposit) => deposit.status === 'success')
        .map((deposit: MidtransDeposit) => ({
          id: deposit.id,
          type: 'deposit' as const,
          amount: deposit.amount,
          accountType: 'real' as const, // Midtrans selalu ke real account
          description: deposit.description || 'Top up via payment gateway',
          createdAt: deposit.completedAt || deposit.createdAt,
          status: deposit.status,
          payment_type: deposit.payment_type,
          source: 'midtrans' as const
        }))

      // 4. Gabungkan kedua array
      const combinedTransactions = [...balanceTransactions, ...midtransTransactions]

      // 5. Remove potential duplicates
      const uniqueTransactions = combinedTransactions.filter((tx, index, self) => {
        const isDuplicate = self.findIndex(t => {
          if (t.id === tx.id) return true // Same ID
          if (t.type !== tx.type) return false
          if (t.amount !== tx.amount) return false
          if (t.accountType !== tx.accountType) return false
          // Check if created within 1 minute of each other
          const timeDiff = Math.abs(
            new Date(t.createdAt).getTime() - new Date(tx.createdAt).getTime()
          )
          return timeDiff < 60000 // Within 1 minute
        })
        return isDuplicate === index
      })

      // 6. Sort by date (newest first)
      uniqueTransactions.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      // ✅ Log untuk debugging
      console.log('📊 Transaction Summary:')
      console.log('  - Balance transactions:', balanceTransactions.length)
      console.log('  - Midtrans deposits:', midtransTransactions.length)
      console.log('  - Combined (after dedup):', uniqueTransactions.length)

      setAllTransactions(uniqueTransactions)

      // Set profile
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
      toast.error('Failed to load wallet data')
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
        description: `Top up to demo account`,
      })
      toast.success(`Demo top up successful!`)
      setShowDeposit(false)
      setAmount('')
      loadData() // Reload data setelah deposit
    } catch (error) {
      toast.error('Demo top up failed')
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [10000, 50000, 100000, 250000, 500000, 1000000]

  // Filter berdasarkan account type yang dipilih
  const filteredTransactions = selectedAccount === 'all'
    ? allTransactions
    : allTransactions.filter(t => t.accountType === selectedAccount)

  const totalItems = filteredTransactions.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const displayedTransactions = filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      document.getElementById('transaction-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (!user) return null
  if (initialLoading) return <LoadingSkeleton />

  const statusInfo = profile?.statusInfo
  const profitBonus = statusInfo ? getStatusProfitBonus(statusInfo.current) : 0

  return (
    <>
      <StaggerStyles />
      <div className="min-h-screen bg-pattern-grid">
        <Navbar />
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
          {/* Header */}
          <div className="mb-4 sm:mb-6 stagger-item" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
              <span>Dashboard</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Keuangan</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Dompet Saya</h1>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Kelola Dana Real Dan Demo Anda</p>
                </div>
              </div>
              {statusInfo && (
                <div className={`hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl text-white shadow-2xl border-2 border-white/30 stagger-item ${
                  statusInfo.current === 'standard' ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                    statusInfo.current === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-orange-600' :
                      'bg-gradient-to-r from-purple-400 to-pink-600'
                }`} style={{ animationDelay: '50ms' }}>
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
            <div className="lg:hidden mb-4 sm:mb-6 stagger-item" style={{ animationDelay: '50ms' }}>
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
          {/* MOBILE VERSION - Side by Side Layout */}
          {/* ============================================ */}
          <div className="lg:hidden mb-4 sm:mb-6">
            <div className="space-y-3">
              {/* Real Account Card - Side by Side */}
              <div
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm stagger-item"
                style={{ animationDelay: '100ms' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        Akun Real
                        <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-bold">REAL</span>
                      </div>
                      {profitBonus > 0 && (
                        <div className="text-xs text-green-600 font-semibold">+{profitBonus}% bonus</div>
                      )}
                      <div className="text-lg font-bold text-gray-900 break-all leading-tight">
                        {formatCurrency(realBalance)}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link
                      href="/payment"
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors whitespace-nowrap"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      Top Up
                    </Link>
                    <Link
                      href="/withdrawal"
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors whitespace-nowrap"
                    >
                      <ArrowUpFromLine className="w-3.5 h-3.5" />
                      Penarikan
                    </Link>
                  </div>
                </div>
              </div>

              {/* Demo Account Card - Side by Side */}
              <div
                className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm stagger-item"
                style={{ animationDelay: '200ms' }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        Akun Demo
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold">DEMO</span>
                      </div>
                      <div className="text-xs text-blue-600 font-semibold">Practice</div>
                      <div className="text-lg font-bold text-gray-900 break-all leading-tight">
                        {formatCurrency(demoBalance)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setTransactionAccount('demo')
                      setShowDeposit(true)
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-500 text-white rounded-lg text-xs font-semibold hover:bg-blue-600 transition-colors flex-shrink-0"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    Isi Ulang
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* DESKTOP VERSION - Enhanced Realistic Cards */}
          {/* ============================================ */}
          <div className="hidden lg:block mb-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Real Account Desktop Card */}
              <div
                className="bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 rounded-3xl border-2 border-emerald-200 p-6 shadow-xl stagger-item"
                style={{ animationDelay: '100ms' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    Akun Real
                    {profitBonus > 0 && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-lg border border-green-500/30 text-xs font-bold text-green-700">
                        <Award className="w-3 h-3" />
                        +{profitBonus}%
                      </span>
                    )}
                  </h2>
                  <div className="flex gap-2">
                    <Link
                      href="/payment"
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
                    >
                      <ArrowDownToLine className="w-4 h-4" />
                      Top Up
                    </Link>
                    <Link
                      href="/withdrawal"
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
                    >
                      <ArrowUpFromLine className="w-4 h-4" />
                      Penarikan
                    </Link>
                  </div>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-green-700 rounded-2xl p-6 shadow-2xl min-h-[280px]">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl translate-y-24 -translate-x-24"></div>
                  </div>
                  <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}></div>
                  <div className="absolute inset-0 card-shimmer"></div>
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="relative w-14 h-11">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 rounded-lg shadow-xl"></div>
                        <div className="absolute inset-[3px] bg-gradient-to-br from-amber-300 to-amber-500 rounded-md"></div>
                        <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-[1px] p-[6px]">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="bg-amber-600/20 rounded-[1px]"></div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-row items-end gap-2">
                        <Wifi className="w-6 h-6 text-white/60 rotate-90" />
                        <div className="px-3 py-1.5 bg-white/20 backdrop-blur-xl rounded-lg border border-white/30">
                          <span className="text-xs font-black text-white tracking-widest">REAL</span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-auto">
                      <div className="text-white/70 text-xs font-bold tracking-widest mb-2">SALDO SAAT INI</div>
                      <div className="text-3xl font-black text-white tracking-tight break-all mb-2" style={{ fontFamily: 'monospace' }}>
                        {formatCurrency(realBalance)}
                      </div>
                      {profitBonus > 0 && (
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
                          <Award className="w-3 h-3 text-amber-300" />
                          <span className="text-xs font-bold text-white">+{profitBonus}% Profit Bonus Active</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex items-end justify-between">
                      <div className="flex-1">
                        <div className="text-white/60 text-[10px] font-bold tracking-widest mb-1">CARD HOLDER</div>
                        <div className="text-sm font-black text-white uppercase tracking-wider truncate">
                          {user.email.split('@')[0].substring(0, 15)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-white/60 text-[10px] font-bold tracking-widest">MASA BERLAKU</div>
                        <div className="text-sm font-black text-white tracking-wider">12/28</div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-white/40 text-xs tracking-widest">
                        •••• •••• •••• {Math.floor(Math.random() * 9000 + 1000)}
                      </div>
                      <div className="flex gap-1">
                        <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded border border-white/30 flex items-center justify-center">
                          <span className="text-xs font-black text-blue-600">REALCARD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Demo Account Desktop Card */}
              <div
                className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border-2 border-blue-200 p-6 shadow-xl stagger-item"
                style={{ animationDelay: '200ms' }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Akun Demo
                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-lg border border-blue-500/30 text-xs font-bold text-blue-700">
                      Practice
                    </span>
                  </h2>
                  <button
                    onClick={() => { setTransactionAccount('demo'); setShowDeposit(true) }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-md transition-colors"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    Isi Ulang
                  </button>
                </div>
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl p-6 shadow-2xl min-h-[280px]">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl translate-y-24 -translate-x-24"></div>
                  </div>
                  <div className="absolute inset-0 opacity-5" style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                  }}></div>
                  <div className="absolute inset-0 card-shimmer"></div>
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                      <div className="relative w-14 h-11">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-200 via-amber-300 to-amber-400 rounded-lg shadow-xl"></div>
                        <div className="absolute inset-[3px] bg-gradient-to-br from-amber-300 to-amber-500 rounded-md"></div>
                        <div className="absolute inset-0 grid grid-cols-4 grid-rows-3 gap-[1px] p-[6px]">
                          {[...Array(12)].map((_, i) => (
                            <div key={i} className="bg-amber-600/20 rounded-[1px]"></div>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-row items-end gap-2">
                        <Wifi className="w-6 h-6 text-white/60 rotate-90" />
                        <div className="px-3 py-1.5 bg-white/20 backdrop-blur-xl rounded-lg border border-white/30">
                          <span className="text-xs font-black text-white tracking-widest">DEMO</span>
                        </div>
                      </div>
                    </div>
                    <div className="mb-auto">
                      <div className="text-white/70 text-xs font-bold tracking-widest mb-2">SALDO SAAT INI</div>
                      <div className="text-3xl font-black text-white tracking-tight break-all mb-2" style={{ fontFamily: 'monospace' }}>
                        {formatCurrency(demoBalance)}
                      </div>
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 backdrop-blur-sm rounded-md border border-white/20">
                        <span className="text-xs font-bold text-white">Practice Trading Account</span>
                      </div>
                    </div>
                    <div className="mt-6 flex items-end justify-between">
                      <div className="flex-1">
                        <div className="text-white/60 text-[10px] font-bold tracking-widest mb-1">CARD HOLDER</div>
                        <div className="text-sm font-black text-white uppercase tracking-wider truncate">
                          {user.email.split('@')[0].substring(0, 15)}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-white/60 text-[10px] font-bold tracking-widest">MASA BERLAKU</div>
                        <div className="text-sm font-black text-white tracking-wider">12/28</div>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-white/40 text-xs tracking-widest">
                        •••• •••• •••• {Math.floor(Math.random() * 9000 + 1000)}
                      </div>
                      <div className="flex gap-1">
                        <div className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded border border-white/30 flex items-center justify-center">
                          <span className="text-xs font-black text-purple-600">DEMOCARD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* Transaction History - UPDATED */}
          {/* ============================================ */}
          <div
            id="transaction-list"
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm stagger-item"
            style={{ animationDelay: '300ms' }}
          >
            <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                Riwayat Transaksi
                {allTransactions.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-auto">
                    ({filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''})
                  </span>
                )}
              </h2>
              {/* Account Filter */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'all' as const, label: 'Semua', count: allTransactions.length },
                  { id: 'real' as const, label: 'Real', count: allTransactions.filter(t => t.accountType === 'real').length },
                  { id: 'demo' as const, label: 'Demo', count: allTransactions.filter(t => t.accountType === 'demo').length },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedAccount(filter.id)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                      selectedAccount === filter.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label} ({filter.count})
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-5 lg:p-6">
              {displayedTransactions.length === 0 ? (
                <div className="text-center py-12 px-4 stagger-item" style={{ animationDelay: '400ms' }}>
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Wallet className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">No transactions yet</h3>
                  <p className="text-sm text-gray-500">
                    {selectedAccount === 'all'
                      ? 'Your wallet activity will appear here'
                      : `No ${selectedAccount} account transactions yet`
                    }
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 sm:space-y-3">
                    {displayedTransactions.map((tx, index) => (
                      <div
                        key={`${tx.source}-${tx.id}`}
                        className="flex items-center justify-between p-3 sm:p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100 gap-3 stagger-item"
                        style={{ animationDelay: `${(index + 4) * 50}ms` }}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
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
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <div className="font-semibold text-gray-900 capitalize text-sm">
                                {tx.type === 'deposit' ? 'Top Up' : 'Withdraw'}
                              </div>
                              <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                tx.accountType === 'real' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {tx.accountType.toUpperCase()}
                              </span>
                              {tx.status && tx.status !== 'success' && (
                                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                  tx.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    tx.status === 'failed' ? 'bg-red-100 text-red-700' :
                                      'bg-gray-100 text-gray-700'
                                }`}>
                                  {tx.status.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(tx.createdAt)}
                            </div>
                            {tx.description && (
                              <div className="text-xs text-gray-400 mt-0.5 truncate">
                                {tx.description}
                              </div>
                            )}
                            {tx.payment_type && (
                              <div className="text-xs text-purple-600 mt-0.5 font-medium">
                                via {tx.payment_type.replace(/_/g, ' ')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`text-base sm:text-lg font-bold flex-shrink-0 ${
                          tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 pt-6 border-t border-gray-200 stagger-item" style={{ animationDelay: `${(displayedTransactions.length + 4) * 50}ms` }}>
                      <div className="flex items-center justify-between gap-4 md:hidden">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className={`flex items-center justify-center gap-1 px-4 py-3 rounded-xl text-sm font-bold flex-1 ${
                            currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white'
                          }`}
                        >
                          <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        <div className="flex flex-col items-center bg-gray-100 rounded-lg px-4 py-2">
                          <span className="text-xs text-gray-500 font-bold">{currentPage} / {totalPages}</span>
                        </div>
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className={`flex items-center justify-center gap-1 px-4 py-3 rounded-xl text-sm font-bold flex-1 ${
                            currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white'
                          }`}
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="hidden md:flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let pageNum
                            if (totalPages <= 5) {
                              pageNum = i + 1
                            } else if (currentPage <= 3) {
                              pageNum = i + 1
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i
                            } else {
                              pageNum = currentPage - 2 + i
                            }
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`w-10 h-10 rounded-lg text-sm font-medium ${
                                  currentPage === pageNum ? 'bg-blue-500 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                                }`}
                              >
                                {pageNum}
                              </button>
                            )
                          })}
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Demo Modal */}
          {showDeposit && transactionAccount === 'demo' && (
            <>
              <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowDeposit(false)} />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Add Demo Funds</h2>
                    <button onClick={() => setShowDeposit(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (IDR)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        className="w-full text-center text-2xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl py-3 focus:border-blue-500 focus:bg-white outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {quickAmounts.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setAmount(preset.toString())}
                          className={`py-2 rounded-xl text-sm font-semibold ${
                            amount === preset.toString() ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}K`}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleDemoDeposit}
                      disabled={loading}
                      className="w-full bg-blue-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</> : 'Confirm'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}