// app/balance/page.tsx
'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { Balance as BalanceType, AccountType, UserProfile } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getStatusProfitBonus } from '@/lib/status-utils'
import {
  Wallet, ArrowDownToLine, ArrowUpFromLine, X, Receipt,
  CreditCard, Loader2, ChevronLeft, ChevronRight, Clock,
  Play
} from 'lucide-react'

const STATUS_BADGE_IMG: Record<string, string> = {
  standard: '/std.png',
  gold: '/gold.png',
  vip: '/vip.png',
}
import { toast } from 'sonner'

const ITEMS_PER_PAGE = 10

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
  snap_token?: string
  snap_redirect_url?: string
}

interface CombinedTransaction {
  id: string
  type: 'deposit' | 'withdrawal'
  amount: number
  accountType: 'real' | 'demo'
  description?: string
  createdAt: string
  status?: string
  payment_type?: string
  source: 'balance' | 'midtrans'
  order_id?: string
  snap_token?: string
  snap_redirect_url?: string
}

// ============================================================
// COUNT-UP HOOK — animates a number from 0 → target
// ============================================================
function useCountUp(target: number, duration = 1200, started = false) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!started || target === 0) { setValue(target); return }
    const startTime = performance.now()

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [target, duration, started])

  return value
}

// Animated balance component
function AnimatedBalance({ amount, started }: { amount: number; started: boolean }) {
  const animatedAmount = useCountUp(amount, 1400, started)
  return <>{formatCurrency(animatedAmount)}</>
}

const StaggerStyles = () => (
  <style jsx global>{`
    /* ─── Entrances ─── */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-18px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.93); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes sparkle-in {
      0%   { opacity: 0; transform: scale(0.7) rotate(-8deg); }
      60%  { transform: scale(1.08) rotate(2deg); }
      100% { opacity: 1; transform: scale(1) rotate(0deg); }
    }

    .stagger-item {
      animation: fadeInUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      opacity: 0;
    }
    .stagger-item-scale {
      animation: scaleIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      opacity: 0;
    }
    .tx-row-enter {
      animation: slideInLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      opacity: 0;
    }
    .sparkle-in {
      animation: sparkle-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
      opacity: 0;
    }

    /* ─── Skeleton ─── */
    @keyframes skeleton-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
    .skeleton-item {
      animation: skeleton-pulse 2s ease-in-out infinite;
      opacity: 0;
      animation-fill-mode: forwards;
    }

    /* ─── Card shine ─── */
    @keyframes card-shine {
      0%   { transform: translateX(-150%) skewX(-18deg); }
      100% { transform: translateX(400%)  skewX(-18deg); }
    }
    .card-shine {
      position: absolute; top: 0; left: 0; bottom: 0; width: 30%;
      background: linear-gradient(
        90deg,
        transparent 0%,
        rgba(255,255,255,0.04) 20%,
        rgba(255,255,255,0.22) 50%,
        rgba(255,255,255,0.04) 80%,
        transparent 100%
      );
      animation: card-shine 5s ease-in-out infinite;
      pointer-events: none; z-index: 5;
    }
    .card-shine-delay { animation-delay: 2.5s; }

    /* ─── Background grid ─── */
    @keyframes grid-shimmer-up {
      0%   { background-position: center 130%, center center, center center; }
      100% { background-position: center -30%,  center center, center center; }
    }
    .bg-pattern-grid {
      background-color: #ffffff;
      background-image:
        linear-gradient(
          to top,
          rgba(255,255,255,1) 0%, rgba(255,255,255,1) 35%,
          rgba(255,255,255,0.4) 42%, rgba(255,255,255,0) 50%,
          rgba(255,255,255,0.4) 58%, rgba(255,255,255,1) 65%,
          rgba(255,255,255,1) 100%
        ),
        linear-gradient(rgba(0,0,0,0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.07) 1px, transparent 1px);
      background-size: 100% 220%, 40px 40px, 40px 40px;
      background-position: center 130%, center center, center center;
      animation: grid-shimmer-up 8s linear infinite;
    }

    /* ─── Floating glow on card icons ─── */
    @keyframes icon-float {
      0%, 100% { transform: translateY(0px);  box-shadow: 0 4px 16px rgba(255,255,255,0.15); }
      50%       { transform: translateY(-4px); box-shadow: 0 10px 28px rgba(255,255,255,0.25); }
    }
    .card-icon-float       { animation: icon-float 3s ease-in-out infinite; }
    .card-icon-float-delay { animation: icon-float 3s ease-in-out infinite 1.5s; }

    /* ─── 3D lift on balance cards ─── */
    .balance-card {
      transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
                  box-shadow 0.3s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .balance-card:hover {
      transform: translateY(-5px) scale(1.012);
      box-shadow: 0 24px 48px rgba(0,0,0,0.25);
    }

    /* ─── Pending badge glow pulse ─── */
    @keyframes pending-glow {
      0%, 100% { box-shadow: 0 0 0 0   rgba(245,158,11,0.4); }
      50%       { box-shadow: 0 0 0 8px rgba(245,158,11,0); }
    }
    .pending-glow { animation: pending-glow 2s ease-in-out infinite; }

    /* ─── Pending dots bounce ─── */
    @keyframes dot-bounce {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40%            { transform: scale(1.2); opacity: 1; }
    }
    .dot-1 { animation: dot-bounce 1.4s infinite ease-in-out 0s;    }
    .dot-2 { animation: dot-bounce 1.4s infinite ease-in-out 0.2s;  }
    .dot-3 { animation: dot-bounce 1.4s infinite ease-in-out 0.4s;  }

    /* ─── Button ripple ─── */
    .btn-ripple { position: relative; overflow: hidden; }
    .btn-ripple::after {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
      opacity: 0; transform: scale(0);
      transition: opacity 0.4s ease, transform 0.4s ease;
    }
    .btn-ripple:active::after {
      opacity: 1; transform: scale(2.5);
      transition: opacity 0s, transform 0s;
    }

    /* ─── Transaction row slide on hover ─── */
    .tx-row {
      transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1),
                  box-shadow 0.2s ease;
    }
    .tx-row:hover { transform: translateX(3px); }

    /* ─── Balance amount shimmer text ─── */
    @keyframes text-shimmer {
      0%   { background-position: -200% center; }
      100% { background-position:  200% center; }
    }
    .balance-amount {
      background: linear-gradient(
        90deg,
        rgba(255,255,255,0.8) 0%,
        rgba(255,255,255,1)   40%,
        rgba(255,255,255,0.8) 60%,
        rgba(255,255,255,1)   100%
      );
      background-size: 200% auto;
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
      animation: text-shimmer 3s linear infinite;
    }

    /* ─── Scrollbar hide ─── */
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
)

const SkeletonCard = ({ index = 0 }: { index?: number }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm skeleton-item" style={{ animationDelay: `${index * 200}ms` }}>
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
  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl border-2 border-gray-200 p-6 shadow-xl skeleton-item" style={{ animationDelay: `${index * 250}ms` }}>
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
  <div className="flex items-center justify-between p-4 rounded-xl border border-gray-100 skeleton-item" style={{ animationDelay: `${(index + 3) * 150}ms` }}>
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
    <style jsx global>{`
      .bg-pattern-grid {
        background-color: #ffffff !important;
        background-image:
          linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,1) 35%, rgba(255,255,255,0.4) 42%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.4) 58%, rgba(255,255,255,1) 65%, rgba(255,255,255,1) 100%),
          linear-gradient(rgba(0,0,0,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.08) 1px, transparent 1px);
        background-size: 100% 220%, 40px 40px, 40px 40px;
        background-position: center 130%, center center, center center;
      }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      body { background-color: #ffffff !important; }
      @keyframes skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      .skeleton-item { animation: skeleton-pulse 2s ease-in-out infinite; opacity: 0; animation-fill-mode: forwards; }
    `}</style>
    <div className="min-h-screen bg-pattern-grid">
      <Navbar />
      <div className="lg:hidden container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <div className="mb-4 skeleton-item" style={{ animationDelay: '0ms' }}>
          <div className="h-3 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-200 rounded-xl"></div>
            <div className="h-5 bg-gray-200 rounded w-28"></div>
          </div>
        </div>
        <div className="h-20 bg-gray-200 rounded-xl mb-4 skeleton-item" style={{ animationDelay: '100ms' }}></div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <SkeletonCard index={1} />
          <SkeletonCard index={2} />
        </div>
        <div className="h-12 bg-gray-200 rounded-xl mb-3 skeleton-item" style={{ animationDelay: '600ms' }}></div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <SkeletonTransactionRow key={i} index={i} />)}
        </div>
      </div>
      <div className="hidden lg:block container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
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
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-200 rounded-xl w-24"></div>)}
            </div>
          </div>
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <SkeletonTransactionRow key={i} index={i + 5} />)}
          </div>
        </div>
      </div>
    </div>
  </>
)

function loadMidtransSnap(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).snap) { resolve(); return }
    const existingScript = document.getElementById('midtrans-snap')
    if (existingScript) { existingScript.addEventListener('load', () => resolve()); return }
    const script = document.createElement('script')
    script.id = 'midtrans-snap'
    script.src = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true'
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '')
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Gagal memuat Midtrans'))
    document.head.appendChild(script)
  })
}

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
  const [continuingPaymentId, setContinuingPaymentId] = useState<string | null>(null)
  // triggers count-up animation after data loads
  const [countUpStarted, setCountUpStarted] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    loadData()
  }, [user])

  useEffect(() => { setCurrentPage(1) }, [selectedAccount])

  const loadData = async () => {
    try {
      setInitialLoading(true)
      const [balancesRes, historyRes, depositHistoryRes, profileRes] = await Promise.all([
        api.getBothBalances(),
        api.getBalanceHistory(1, 100),
        api.getDepositHistory().catch(err => { console.log('⚠️ Deposit history not available:', err); return null }),
        api.getProfile()
      ])

      const balances = balancesRes?.data || balancesRes
      setRealBalance(balances?.realBalance || 0)
      setDemoBalance(balances?.demoBalance || 0)

      const balanceTransactions: CombinedTransaction[] = (historyRes?.data?.transactions || historyRes?.transactions || [])
        .filter((tx: any) => { const t = tx.type.toLowerCase(); return t === 'deposit' || t === 'withdrawal' })
        .map((tx: any) => ({
          id: tx.id, type: tx.type.toLowerCase(), amount: tx.amount,
          accountType: tx.accountType || 'demo', description: tx.description,
          createdAt: tx.createdAt, source: 'balance' as const
        }))

      let midtransDeposits: MidtransDeposit[] = []
      if (depositHistoryRes) {
        midtransDeposits = (depositHistoryRes as any)?.data?.deposits || (depositHistoryRes as any)?.deposits || []
      }

      const midtransTransactions: CombinedTransaction[] = midtransDeposits.map((deposit: MidtransDeposit) => ({
        id: deposit.id, type: 'deposit' as const, amount: deposit.amount, accountType: 'real' as const,
        description: deposit.description || 'Top up via payment gateway',
        createdAt: deposit.completedAt || deposit.createdAt, status: deposit.status,
        payment_type: deposit.payment_type, source: 'midtrans' as const,
        order_id: deposit.order_id, snap_token: deposit.snap_token, snap_redirect_url: deposit.snap_redirect_url,
      }))

      const combinedTransactions = [...balanceTransactions, ...midtransTransactions]
      const uniqueTransactions = combinedTransactions.filter((tx, index, self) => {
        const isDuplicate = self.findIndex(t => {
          if (t.id === tx.id) return true
          if (t.type !== tx.type || t.amount !== tx.amount || t.accountType !== tx.accountType) return false
          return Math.abs(new Date(t.createdAt).getTime() - new Date(tx.createdAt).getTime()) < 60000
        })
        return isDuplicate === index
      })
      uniqueTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      setAllTransactions(uniqueTransactions)

      let profileData: UserProfile | null = null
      if (profileRes && typeof profileRes === 'object') {
        if ('data' in profileRes && profileRes.data) profileData = profileRes.data as UserProfile
        else if ('user' in profileRes && 'statusInfo' in profileRes) profileData = profileRes as UserProfile
      }
      if (profileData) setProfile(profileData)
    } catch (error) {
      console.error('Failed to load balance:', error)
      toast.error('Failed to load wallet data')
    } finally {
      setInitialLoading(false)
      // slight delay so cards animate in first, then count-up starts
      setTimeout(() => setCountUpStarted(true), 300)
    }
  }

  const handleContinuePayment = async (tx: CombinedTransaction) => {
    if (!tx.order_id) return
    setContinuingPaymentId(tx.id)
    try {
      if (tx.snap_token) {
        try {
          await loadMidtransSnap()
          const snap = (window as any).snap
          if (snap) {
            snap.pay(tx.snap_token, {
              onSuccess: () => { toast.success('Pembayaran berhasil! Saldo sedang diproses.'); loadData() },
              onPending: () => toast.info('Pembayaran sedang diproses.'),
              onError: () => toast.error('Pembayaran gagal. Silakan coba lagi.'),
              onClose: () => toast.info('Jendela pembayaran ditutup.'),
            })
            setContinuingPaymentId(null); return
          }
        } catch (err) { console.warn('Snap popup gagal, fallback ke redirect:', err) }
      }
      if (tx.snap_redirect_url) {
        window.open(tx.snap_redirect_url, '_blank', 'noopener,noreferrer')
        toast.info('Halaman pembayaran dibuka di tab baru.')
        setContinuingPaymentId(null); return
      }
      toast.info('Memeriksa status pembayaran...')
      const statusRes = await api.checkMidtransDepositStatus(tx.order_id!)
      const deposit = (statusRes as any)?.data?.deposit || (statusRes as any)?.deposit
      if (deposit?.status === 'success') { toast.success('Pembayaran sudah berhasil! Halaman akan diperbarui.'); loadData() }
      else if (deposit?.status === 'pending') toast.warning('Pembayaran masih tertunda. Silakan hubungi support jika butuh bantuan.')
      else toast.error('Tidak dapat melanjutkan pembayaran. Silakan buat deposit baru.')
    } catch (error) {
      console.error('Continue payment error:', error)
      toast.error('Gagal melanjutkan pembayaran')
    } finally { setContinuingPaymentId(null) }
  }

  const handleDemoDeposit = async () => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { toast.error('Invalid amount'); return }
    setLoading(true)
    try {
      await api.createBalanceEntry({ accountType: 'demo', type: 'deposit', amount: amt, description: `Top up to demo account` })
      toast.success(`Demo top up successful!`)
      setShowDeposit(false); setAmount(''); loadData()
    } catch (error) { toast.error('Demo top up failed') }
    finally { setLoading(false) }
  }

  const quickAmounts = [10000, 50000, 100000, 250000, 500000, 1000000]
  const filteredTransactions = selectedAccount === 'all' ? allTransactions : allTransactions.filter(t => t.accountType === selectedAccount)
  const totalItems = filteredTransactions.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const displayedTransactions = filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  const pendingDeposits = allTransactions.filter(t => t.source === 'midtrans' && t.status === 'pending')

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
              <span>Dashboard</span><span>/</span>
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
                <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl text-white shadow-2xl border-2 border-white/30 sparkle-in ${
                  statusInfo.current === 'standard' ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                  statusInfo.current === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-orange-600' :
                  'bg-gradient-to-r from-purple-400 to-pink-600'
                }`} style={{ animationDelay: '250ms' }}>
                  <Image src={STATUS_BADGE_IMG[statusInfo.current] ?? '/std.png'} alt={statusInfo.current} width={44} height={44} className="w-11 h-11 object-contain drop-shadow-lg" />
                  <div className="text-sm">
                    <div className="font-bold">{statusInfo.current.toUpperCase()}</div>
                    <div className="text-xs opacity-90">+{profitBonus}% Bonus</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pending Banner */}
          {pendingDeposits.length > 0 && (
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 stagger-item pending-glow" style={{ animationDelay: '60ms' }}>
              <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                  {pendingDeposits.length === 1 ? 'Ada 1 pembayaran yang belum selesai' : `Ada ${pendingDeposits.length} pembayaran yang belum selesai`}
                  <span className="flex gap-1 ml-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block dot-1" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block dot-2" />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block dot-3" />
                  </span>
                </p>
                <p className="text-xs text-amber-700 mt-0.5">Klik tombol <span className="font-bold">Lanjutkan</span> di riwayat transaksi untuk menyelesaikan pembayaran Anda.</p>
              </div>
            </div>
          )}

          {/* Mobile Status Badge */}
          {statusInfo && (
            <div className="lg:hidden mb-4 sm:mb-6 sparkle-in" style={{ animationDelay: '80ms' }}>
              <div className={`p-2 sm:p-3 rounded-xl text-white shadow-lg ${
                statusInfo.current === 'standard' ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                statusInfo.current === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-orange-600' :
                'bg-gradient-to-r from-purple-400 to-pink-600'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Image src={STATUS_BADGE_IMG[statusInfo.current] ?? '/std.png'} alt={statusInfo.current} width={56} height={56} className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-lg" />
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
          {/* MOBILE VERSION                              */}
          {/* ============================================ */}
          <div className="lg:hidden mb-4 sm:mb-6 stagger-item-scale" style={{ animationDelay: '100ms' }}>
            <div className="grid grid-cols-2 gap-2.5">

              {/* Real Account — Mobile */}
              <div className="balance-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 shadow-lg">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                <div className="absolute -bottom-3 -left-3 w-14 h-14 bg-white/10 rounded-full" />
                <div className="card-shine" />
                <div className="relative z-10 p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center card-icon-float">
                        <CreditCard className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-white/90 tracking-wide">REAL</span>
                    </div>
                    {profitBonus > 0 && (
                      <span className="text-[9px] font-black text-emerald-300 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/20">
                        +{profitBonus}%
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-[9px] font-semibold text-white/50 uppercase tracking-widest mb-0.5">Saldo</div>
                    <div className="text-base font-black leading-tight break-all balance-amount">
                      <AnimatedBalance amount={realBalance} started={countUpStarted} />
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Link href="/payment" className="btn-ripple flex-1 flex items-center justify-center py-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-lg text-[10px] font-bold transition-colors">
                      Top Up
                    </Link>
                    <Link href="/withdrawal" className="btn-ripple flex-1 flex items-center justify-center py-1.5 bg-black/20 hover:bg-black/30 border border-white/20 text-white rounded-lg text-[10px] font-bold transition-colors">
                      Tarik
                    </Link>
                  </div>
                </div>
              </div>

              {/* Demo Account — Mobile */}
              <div className="balance-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-lg">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                <div className="absolute -bottom-3 -left-3 w-14 h-14 bg-white/10 rounded-full" />
                <div className="card-shine card-shine-delay" />
                <div className="relative z-10 p-3 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center card-icon-float-delay">
                        <CreditCard className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-bold text-white/90 tracking-wide">DEMO</span>
                    </div>
                    <span className="text-[9px] font-black text-blue-200 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/20">
                      Latihan
                    </span>
                  </div>
                  <div>
                    <div className="text-[9px] font-semibold text-white/50 uppercase tracking-widest mb-0.5">Saldo</div>
                    <div className="text-base font-black leading-tight break-all balance-amount">
                      <AnimatedBalance amount={demoBalance} started={countUpStarted} />
                    </div>
                  </div>
                  <button
                    onClick={() => { setTransactionAccount('demo'); setShowDeposit(true) }}
                    className="btn-ripple w-full flex items-center justify-center gap-1 py-1.5 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-lg text-[10px] font-bold transition-colors"
                  >
                    Isi Ulang
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* ============================================ */}
          {/* DESKTOP VERSION                             */}
          {/* ============================================ */}
          <div className="hidden lg:block mb-6 stagger-item-scale" style={{ animationDelay: '100ms' }}>
            <div className="grid grid-cols-2 gap-5">

              {/* Real Account Desktop Card */}
              <div className="balance-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 shadow-xl">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
                <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/10 rounded-full" />
                <div className="absolute top-1/2 right-16 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2" />
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="card-shine" />
                <div className="relative z-10 p-5 flex items-center gap-5">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm card-icon-float">
                    <CreditCard className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-white/70 tracking-widest uppercase">Akun Real</span>
                      {profitBonus > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-200 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
                          <Image src={STATUS_BADGE_IMG[statusInfo?.current ?? 'standard'] ?? '/std.png'} alt="status" width={14} height={14} className="w-3.5 h-3.5 object-contain" />
                          +{profitBonus}% Bonus
                        </span>
                      )}
                    </div>
                    <div className="text-2xl font-black tracking-tight truncate balance-amount">
                      <AnimatedBalance amount={realBalance} started={countUpStarted} />
                    </div>
                    <div className="text-[10px] text-white/40 font-semibold tracking-widest mt-0.5 uppercase">Saldo Tersedia</div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <Link href="/payment" className="btn-ripple flex items-center justify-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm">
                      Top Up
                    </Link>
                    <Link href="/withdrawal" className="btn-ripple flex items-center justify-center gap-1.5 px-4 py-2 bg-black/20 hover:bg-black/30 border border-white/20 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm">
                      Tarik Dana
                    </Link>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-white/0 via-white/30 to-white/0" />
              </div>

              {/* Demo Account Desktop Card */}
              <div className="balance-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-xl">
                <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
                <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/10 rounded-full" />
                <div className="absolute top-1/2 right-16 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2" />
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="card-shine card-shine-delay" />
                <div className="relative z-10 p-5 flex items-center gap-5">
                  <div className="flex-shrink-0 w-14 h-14 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm card-icon-float-delay">
                    <Wallet className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-black text-white/70 tracking-widest uppercase">Akun Demo</span>
                      <span className="text-[10px] font-black text-blue-200 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
                        Practice
                      </span>
                    </div>
                    <div className="text-2xl font-black tracking-tight truncate balance-amount">
                      <AnimatedBalance amount={demoBalance} started={countUpStarted} />
                    </div>
                    <div className="text-[10px] text-white/40 font-semibold tracking-widest mt-0.5 uppercase">Saldo Latihan</div>
                  </div>
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => { setTransactionAccount('demo'); setShowDeposit(true) }}
                      className="btn-ripple flex items-center justify-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm"
                    >
                      Isi Ulang
                    </button>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-white/0 via-white/30 to-white/0" />
              </div>

            </div>
          </div>

          {/* TRANSACTION HISTORY */}
          <div id="transaction-list" className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm stagger-item" style={{ animationDelay: '300ms' }}>
            <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                Riwayat Transaksi
                {allTransactions.length > 0 && (
                  <span className="text-sm font-normal text-gray-500 ml-auto">({filteredTransactions.length} transaksi)</span>
                )}
              </h2>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'all' as const, label: 'Semua', count: allTransactions.length },
                  { id: 'real' as const, label: 'Real', count: allTransactions.filter(t => t.accountType === 'real').length },
                  { id: 'demo' as const, label: 'Demo', count: allTransactions.filter(t => t.accountType === 'demo').length },
                ].map(filter => (
                  <button key={filter.id} onClick={() => setSelectedAccount(filter.id)}
                    className={`btn-ripple px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 ${
                      selectedAccount === filter.id
                        ? 'bg-blue-500 text-white scale-105 shadow-md shadow-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}>
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
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Belum ada transaksi</h3>
                  <p className="text-sm text-gray-500">
                    {selectedAccount === 'all' ? 'Aktivitas dompet Anda akan muncul di sini' : `Belum ada transaksi akun ${selectedAccount}`}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-2 sm:space-y-3">
                    {displayedTransactions.map((tx, index) => {
                      const isPending = tx.status === 'pending'
                      const isFailed = tx.status === 'failed' || tx.status === 'expired'
                      const isContinuing = continuingPaymentId === tx.id
                      return (
                        <div key={`${tx.source}-${tx.id}`}
                          className={`tx-row tx-row-enter flex items-center justify-between p-3 sm:p-4 rounded-xl transition-colors border gap-3 ${
                            isPending ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' :
                            isFailed ? 'bg-red-50 border-red-100 hover:bg-red-100' :
                            'hover:bg-gray-50 border-gray-100'
                          }`}
                          style={{ animationDelay: `${(index + 4) * 60}ms` }}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 hover:scale-110 ${
                              isPending ? 'bg-amber-100' : isFailed ? 'bg-red-100' : tx.type === 'deposit' ? 'bg-green-50' : 'bg-red-50'
                            }`}>
                              {isPending ? <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" /> :
                               tx.type === 'deposit' ? <ArrowDownToLine className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" /> :
                               <ArrowUpFromLine className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <div className="font-semibold text-gray-900 capitalize text-sm">{tx.type === 'deposit' ? 'Top Up' : 'Withdraw'}</div>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${tx.accountType === 'real' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                  {tx.accountType.toUpperCase()}
                                </span>
                                {tx.status && (
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                                    tx.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                    tx.status === 'success' ? 'bg-green-100 text-green-700' :
                                    tx.status === 'failed' ? 'bg-red-100 text-red-700' :
                                    tx.status === 'expired' ? 'bg-gray-100 text-gray-600' : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {tx.status === 'pending' ? 'MENUNGGU' : tx.status === 'success' ? 'SUKSES' : tx.status === 'failed' ? 'GAGAL' : tx.status === 'expired' ? 'KADALUARSA' : tx.status.toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />{formatDate(tx.createdAt)}
                              </div>
                              {tx.description && <div className="text-xs text-gray-400 mt-0.5 truncate">{tx.description}</div>}
                              {tx.payment_type && <div className="text-xs text-purple-600 mt-0.5 font-medium">via {tx.payment_type.replace(/_/g, ' ')}</div>}
                              {isPending && <div className="text-xs text-amber-600 mt-0.5 font-medium">Klik "Lanjutkan" untuk menyelesaikan pembayaran</div>}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <div className={`text-base sm:text-lg font-bold ${
                              isPending ? 'text-amber-600' : isFailed ? 'text-gray-400' : tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </div>
                            {isPending && tx.source === 'midtrans' && (
                              <button onClick={() => handleContinuePayment(tx)} disabled={isContinuing}
                                className="btn-ripple flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
                                {isContinuing ? <><Loader2 className="w-3 h-3 animate-spin" /> Memuat...</> : <><Play className="w-3 h-3" /> Lanjutkan</>}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="mt-6 pt-6 border-t border-gray-200 stagger-item" style={{ animationDelay: `${(displayedTransactions.length + 4) * 50}ms` }}>
                      <div className="flex items-center justify-between gap-4 md:hidden">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                          className={`btn-ripple flex items-center justify-center gap-1 px-4 py-3 rounded-xl text-sm font-bold flex-1 transition-all ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:scale-105 active:scale-95'}`}>
                          <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        <div className="flex flex-col items-center bg-gray-100 rounded-lg px-4 py-2">
                          <span className="text-xs text-gray-500 font-bold">{currentPage} / {totalPages}</span>
                        </div>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                          className={`btn-ripple flex items-center justify-center gap-1 px-4 py-3 rounded-xl text-sm font-bold flex-1 transition-all ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-blue-600 text-white hover:scale-105 active:scale-95'}`}>
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="hidden md:flex items-center justify-between">
                        <div className="text-sm text-gray-600">Menampilkan {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} dari {totalItems}</div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="btn-ripple p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 transition-all hover:scale-110 active:scale-95">
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            let pageNum
                            if (totalPages <= 5) pageNum = i + 1
                            else if (currentPage <= 3) pageNum = i + 1
                            else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i
                            else pageNum = currentPage - 2 + i
                            return (
                              <button key={pageNum} onClick={() => handlePageChange(pageNum)}
                                className={`btn-ripple w-10 h-10 rounded-lg text-sm font-medium transition-all hover:scale-110 active:scale-95 ${currentPage === pageNum ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'border border-gray-200 hover:bg-gray-50 text-gray-700'}`}>
                                {pageNum}
                              </button>
                            )
                          })}
                          <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="btn-ripple p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 text-gray-700 transition-all hover:scale-110 active:scale-95">
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
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto stagger-item-scale">
                  <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Add Demo Funds</h2>
                    <button onClick={() => setShowDeposit(false)} className="btn-ripple p-2 hover:bg-gray-100 rounded-lg transition-all hover:rotate-90 duration-200">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (IDR)</label>
                      <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                        className="w-full text-center text-2xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl py-3 focus:border-blue-500 focus:bg-white outline-none transition-all" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {quickAmounts.map((preset) => (
                        <button key={preset} onClick={() => setAmount(preset.toString())}
                          className={`btn-ripple py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 ${amount === preset.toString() ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                          {preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}K`}
                        </button>
                      ))}
                    </div>
                    <button onClick={handleDemoDeposit} disabled={loading}
                      className="btn-ripple w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]">
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