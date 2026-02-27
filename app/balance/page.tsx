'use client'
import React, { useEffect, useState, useRef } from 'react'
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
  CreditCard, Loader2, ChevronLeft, ChevronRight, Clock
} from 'lucide-react'
import { motion, AnimatePresence, useInView, type Variants } from 'framer-motion'

const STATUS_BADGE_IMG: Record<string, string> = {
  standard: '/std.png',
  gold: '/gold.png',
  vip: '/vip.png',
}
import { toast } from 'sonner'

// ── Framer Motion Primitives ──────────────────────────────────
const SPRING = { type: 'spring', stiffness: 80, damping: 20 } as const

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING } },
}
const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0, transition: { ...SPRING } },
}
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.93 },
  visible: { opacity: 1, scale: 1, transition: { ...SPRING } },
}
const stagger = (delay = 0.07): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.03 } },
})

function Reveal({ children, variants = fadeUp, delay = 0, className = '' }: {
  children: React.ReactNode; variants?: Variants; delay?: number; className?: string
}) {
  return (
    <motion.div className={className} variants={variants} initial="hidden"
      whileInView="visible" viewport={{ once: true, margin: '-60px' }}
      transition={{ delay }}>
      {children}
    </motion.div>
  )
}

function AnimatedHeadline({ text, className }: { text: string; className?: string }) {
  return (
    <motion.h1 className={className} variants={stagger(0.08)} initial="hidden" animate="visible">
      {text.split(' ').map((word, i) => (
        <motion.span key={i} className="inline-block mr-[0.25em]"
          variants={{ hidden: { opacity: 0, y: 22, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...SPRING } } }}>
          {word}
        </motion.span>
      ))}
    </motion.h1>
  )
}

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

const GlobalStyles = () => (
  <style jsx global>{`
    /* ── Background grid — matches affiliate page ─────────────── */
    .bg-pattern-grid {
      background-color: #f5f6f8;
      background-image:
        linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    body { background-color: #f5f6f8 !important; }

    /* ── Entrance animations ─────────────────────────────────── */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeLeft {
      from { opacity: 0; transform: translateX(-12px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }
    .stagger-item       { animation: fadeUp  0.4s cubic-bezier(0.22,1,0.36,1) both; opacity:0; }
    .stagger-item-scale { animation: popIn   0.35s cubic-bezier(0.22,1,0.36,1) both; opacity:0; }
    .tx-row-enter       { animation: fadeLeft 0.3s cubic-bezier(0.22,1,0.36,1) both; opacity:0; }
    .sparkle-in         { animation: popIn   0.4s cubic-bezier(0.22,1,0.36,1) both; opacity:0; }

    /* ── Skeleton ────────────────────────────────────────────── */
    @keyframes sk-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
    .skeleton-item { animation: sk-pulse 1.8s ease-in-out infinite; opacity:0; animation-fill-mode:forwards; }

    /* ── Card shine (fires once on load) ─────────────────────── */
    @keyframes shine-once {
      0%   { transform: translateX(-100%) skewX(-15deg); opacity:0; }
      15%  { opacity:1; }
      85%  { opacity:1; }
      100% { transform: translateX(300%)  skewX(-15deg); opacity:0; }
    }
    .card-shine {
      position:absolute; inset:0;
      background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%);
      animation: shine-once 0.7s ease-out 0.4s both;
      pointer-events:none; z-index:5;
    }
    .card-shine-delay { animation-delay: 0.65s; }

    /* ── Balance card hover ───────────────────────────────────── */
    .balance-card {
      transition: transform 0.25s cubic-bezier(0.22,1,0.36,1),
                  box-shadow 0.25s cubic-bezier(0.22,1,0.36,1);
      will-change: transform;
    }
    .balance-card:hover {
      transform: translateY(-4px) scale(1.01);
      box-shadow: 0 20px 40px rgba(0,0,0,0.22);
    }

    /* ── Pending dots ─────────────────────────────────────────── */
    @keyframes blink { 0%,80%,100%{opacity:0.3} 40%{opacity:1} }
    .dot-1 { animation: blink 1.2s infinite 0s;   }
    .dot-2 { animation: blink 1.2s infinite 0.2s; }
    .dot-3 { animation: blink 1.2s infinite 0.4s; }

    /* ── Buttons ──────────────────────────────────────────────── */
    .btn-ripple { transition: transform 0.1s ease, opacity 0.1s ease; }
    .btn-ripple:hover  { opacity: 0.88; }
    .btn-ripple:active { transform: scale(0.97); }

    /* ── TX row hover ─────────────────────────────────────────── */
    .tx-row { transition: transform 0.15s ease; }
    .tx-row:hover { transform: translateX(2px); }

    /* ── Modal close rotate ───────────────────────────────────── */
    .close-btn { transition: transform 0.2s ease; }
    .close-btn:hover { transform: rotate(90deg); }

    .scrollbar-hide::-webkit-scrollbar { display:none; }
    .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
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

// SkeletonBalanceCard — mirrors the actual gradient balance card layout
const SkeletonBalanceCard = ({ index = 0 }: { index?: number }) => (
  <div className="skeleton-item rounded-2xl shadow-xl overflow-hidden" style={{ animationDelay: `${index * 250}ms` }}>
    <div className="bg-gray-200 p-5 flex items-center gap-4">
      <div className="w-12 h-12 bg-gray-300 rounded-2xl flex-shrink-0"></div>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-300 rounded w-20"></div>
        <div className="h-7 bg-gray-300 rounded w-36"></div>
        <div className="h-2 bg-gray-300 rounded w-24"></div>
      </div>
      <div className="flex flex-col gap-2 flex-shrink-0">
        <div className="h-8 bg-gray-300 rounded-xl w-20"></div>
        <div className="h-8 bg-gray-300 rounded-xl w-20"></div>
      </div>
    </div>
    <div className="h-1 bg-gray-300"></div>
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
        background-color: #f5f6f8 !important;
        background-image:
          linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
        background-size: 40px 40px;
      }
      .scrollbar-hide::-webkit-scrollbar { display: none; }
      .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      body { background-color: #f5f6f8 !important; }
      @keyframes skeleton-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      .skeleton-item { animation: skeleton-pulse 1.8s ease-in-out infinite; opacity: 0; animation-fill-mode: forwards; }
    `}</style>
    <div className="min-h-screen bg-pattern-grid">
      <Navbar />
      {/* Same container as real content: max-w-5xl px-4 py-6 */}
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Header — matches: breadcrumb + icon + title */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="skeleton-item" style={{ animationDelay: '0ms' }}>
            <div className="h-3 bg-gray-200 rounded w-40 mb-2"></div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gray-200 rounded-xl flex-shrink-0"></div>
              <div>
                <div className="h-7 bg-gray-200 rounded w-40 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-52"></div>
              </div>
            </div>
          </div>
          <div className="h-14 w-36 bg-gray-200 rounded-xl skeleton-item" style={{ animationDelay: '100ms' }}></div>
        </div>

        {/* Balance cards — matches: grid-cols-1 sm:grid-cols-2 gap-4 mb-6 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <SkeletonBalanceCard index={0} />
          <SkeletonBalanceCard index={1} />
        </div>

        {/* Transaction section — matches: bg-white rounded-xl border */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden skeleton-item" style={{ animationDelay: '600ms' }}>
          <div className="p-4 sm:p-5 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-44 mb-4"></div>
            {/* Filter tabs */}
            <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-9 bg-gray-200 rounded-lg w-24"></div>
              ))}
            </div>
          </div>
          <div className="p-4 sm:p-5 space-y-2 sm:space-y-3">
            {[...Array(5)].map((_, i) => <SkeletonTransactionRow key={i} index={i} />)}
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
      // ✅ Selalu redirect ke Web B agar Midtrans terbuka di halaman payment khusus
      if (tx.snap_token) {
        const B_COM_URL = (process.env.NEXT_PUBLIC_B_COM_URL || 'https://pintuweb.id').replace(/\/$/, '')
        const paymentUrl = `${B_COM_URL}/payment?token=${encodeURIComponent(tx.snap_token)}&orderId=${encodeURIComponent(tx.order_id)}`
        window.open(paymentUrl, '_blank', 'noopener,noreferrer')
        toast.info('Halaman pembayaran dibuka di tab baru.')
        setContinuingPaymentId(null)
        return
      }

      // Fallback: gunakan snap_redirect_url jika snap_token tidak tersedia
      if (tx.snap_redirect_url) {
        window.open(tx.snap_redirect_url, '_blank', 'noopener,noreferrer')
        toast.info('Halaman pembayaran dibuka di tab baru.')
        setContinuingPaymentId(null)
        return
      }

      // Kalau keduanya tidak ada, cek status transaksi
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
      <GlobalStyles />
      <div className="min-h-screen bg-pattern-grid relative">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">

          {/* Header */}
          <motion.div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            initial="hidden" animate="visible" variants={stagger(0.1)}>
            <motion.div variants={fadeLeft}>
              <motion.div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1" variants={fadeUp}>
                <span>Dashboard</span><span>/</span>
                <span className="text-gray-900 font-medium">Keuangan</span>
              </motion.div>
              <div className="flex items-center gap-3">
                <motion.div className="w-14 h-14 flex items-center justify-center flex-shrink-0"
                  whileHover={{ scale: 1.1, rotate: 8 }} transition={{ duration: 0.2 }}>
                  <Image src="/dompet.png" alt="Dompet" width={56} height={56} className="w-14 h-14 object-contain" />
                </motion.div>
                <div>
                  <AnimatedHeadline text="Dompet Saya" className="text-2xl sm:text-3xl font-bold text-gray-900" />
                  <motion.p className="text-gray-500 text-sm mt-0.5" variants={fadeUp}>Kelola Dana Real Dan Demo Anda</motion.p>
                </div>
              </div>
            </motion.div>
            {statusInfo && (
              <motion.div variants={scaleIn}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-white shadow-xl border border-white/30 ${
                  statusInfo.current === 'standard' ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                  statusInfo.current === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-orange-600' :
                  'bg-gradient-to-r from-purple-400 to-pink-600'
                }`}
                whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
                <Image src={STATUS_BADGE_IMG[statusInfo.current] ?? '/std.png'} alt={statusInfo.current} width={44} height={44} className="w-10 h-10 object-contain drop-shadow-lg" />
                <div className="text-sm">
                  <div className="font-bold">{statusInfo.current.toUpperCase()}</div>
                  <div className="text-xs opacity-90">+{profitBonus}% Bonus</div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Pending Banner */}
          {pendingDeposits.length > 0 && (
            <motion.div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING }}>
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
            </motion.div>
          )}


          {/* ============================================ */}
          {/* BALANCE CARDS — unified responsive grid     */}
          {/* ============================================ */}
          <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.2 }}>

            {/* Real Account */}
            <div className="balance-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 shadow-xl">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/10 rounded-full" />
              <div className="absolute top-1/2 right-16 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2" />
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
              <div className="card-shine" />
              <div className="relative z-10 p-5 flex items-center gap-4">
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
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                    <AnimatedBalance amount={realBalance} started={countUpStarted} />
                  </div>
                  <div className="text-[10px] text-white/40 font-semibold tracking-widest mt-0.5 uppercase">Saldo Tersedia</div>
                </div>
                <div className="flex-shrink-0 flex flex-col gap-2">
                  <Link href="/payment" className="btn-ripple flex items-center justify-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm">
                    Top Up
                  </Link>
                  {realBalance >= 100000 ? (
                    <Link href="/withdrawal" className="btn-ripple flex items-center justify-center gap-1.5 px-3 py-2 bg-black/20 hover:bg-black/30 border border-white/20 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm">
                      Tarik Dana
                    </Link>
                  ) : (
                    <div className="relative group">
                      <button
                        disabled
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-black/20 border border-white/20 text-white/60 rounded-xl text-xs font-bold whitespace-nowrap cursor-not-allowed"
                      >
                        Tarik Dana
                      </button>
                      <div className="absolute bottom-full right-0 mb-2 w-44 bg-gray-900 text-white text-[10px] rounded-lg px-2.5 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                        Minimal saldo Rp 100.000 untuk tarik dana
                        <div className="absolute top-full right-3 border-4 border-transparent border-t-gray-900" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-white/0 via-white/30 to-white/0" />
            </div>

            {/* Demo Account */}
            <div className="balance-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 shadow-xl">
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-white/10 rounded-full" />
              <div className="absolute top-1/2 right-16 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2" />
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
              <div className="card-shine card-shine-delay" />
              <div className="relative z-10 p-5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black text-white/70 tracking-widest uppercase">Akun Demo</span>
                    <span className="text-[10px] font-black text-blue-200 bg-white/10 border border-white/20 px-2 py-0.5 rounded-full">
                      Latihan
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
                    <AnimatedBalance amount={demoBalance} started={countUpStarted} />
                  </div>
                  <div className="text-[10px] text-white/40 font-semibold tracking-widest mt-0.5 uppercase">Saldo Latihan</div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => { setTransactionAccount('demo'); setShowDeposit(true) }}
                    className="btn-ripple flex items-center justify-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap backdrop-blur-sm"
                  >
                    Isi Ulang
                  </button>
                </div>
              </div>
              <div className="h-1 bg-gradient-to-r from-white/0 via-white/30 to-white/0" />
            </div>

          </motion.div>

          {/* TRANSACTION HISTORY */}
          <Reveal className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-5 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Riwayat Transaksi
                  {allTransactions.length > 0 && (
                    <span className="text-xs font-normal text-gray-400 ml-1">({filteredTransactions.length})</span>
                  )}
                </h2>
              </div>
              {/* Filter tabs — affiliate pill style */}
              <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1 overflow-x-auto">
                {[
                  { id: 'all' as const, label: 'Semua', count: allTransactions.length },
                  { id: 'real' as const, label: 'Real', count: allTransactions.filter(t => t.accountType === 'real').length },
                  { id: 'demo' as const, label: 'Demo', count: allTransactions.filter(t => t.accountType === 'demo').length },
                ].map(filter => (
                  <motion.button key={filter.id} onClick={() => setSelectedAccount(filter.id)}
                    className={`relative flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      selectedAccount === filter.id ? 'text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {selectedAccount === filter.id && (
                      <motion.div className="absolute inset-0 bg-blue-600 rounded-lg shadow-md"
                        layoutId="txFilterPill" transition={{ ...SPRING }} />
                    )}
                    <span className="relative z-10">{filter.label} ({filter.count})</span>
                  </motion.button>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-5">
              {displayedTransactions.length === 0 ? (
                <motion.div className="text-center py-12 px-4" variants={scaleIn} initial="hidden" animate="visible">
                  <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Wallet className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Belum ada transaksi</h3>
                  <p className="text-sm text-gray-500">
                    {selectedAccount === 'all' ? 'Aktivitas dompet Anda akan muncul di sini' : `Belum ada transaksi akun ${selectedAccount}`}
                  </p>
                </motion.div>
              ) : (
                <>
                  <motion.div className="space-y-2 sm:space-y-3"
                    variants={stagger(0.04)} initial="hidden" animate="visible">
                    <AnimatePresence>
                    {displayedTransactions.map((tx, index) => {
                      const isPending = tx.status === 'pending'
                      const isFailed = tx.status === 'failed' || tx.status === 'expired'
                      const isContinuing = continuingPaymentId === tx.id
                      return (
                        <motion.div key={`${tx.source}-${tx.id}`}
                          variants={fadeLeft}
                          whileHover={{ x: 3, transition: { duration: 0.15 } }}
                          className={`tx-row flex items-center justify-between p-3 sm:p-4 rounded-xl transition-colors border gap-3 ${
                            isPending ? 'bg-amber-50 border-amber-200 hover:bg-amber-100' :
                            isFailed ? 'bg-red-50 border-red-100 hover:bg-red-100' :
                            'hover:bg-gray-50 border-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {(() => {
                              const pt = (tx.payment_type || '').toLowerCase()
                              const paymentImg =
                                pt.includes('dana')    ? '/dana.webp' :
                                pt.includes('gopay')   ? '/gopay.webp' :
                                pt.includes('permata') ? '/permata.webp' :
                                pt.includes('bri')     ? '/bri.webp' :
                                pt.includes('mandiri') ? '/mandiri.webp' :
                                pt.includes('cimb')    ? '/cimb.webp' :
                                pt.includes('bni')     ? '/bni.webp' :
                                pt.includes('bsi')     ? '/bsi.webp' :
                                pt.includes('qris')    ? '/qris1.png' :
                                null
                              if (paymentImg && !isPending) {
                                return (
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border border-gray-100 overflow-hidden transition-transform duration-200 hover:scale-110">
                                    <Image src={paymentImg} alt={tx.payment_type || ''} width={48} height={48} className="w-full h-full object-contain p-1" />
                                  </div>
                                )
                              }
                              return (
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white border border-gray-100 overflow-hidden transition-transform duration-200 hover:scale-110">
                                  <Image src="/dompet.png" alt="dompet" width={48} height={48} className="w-full h-full object-contain p-1" />
                                </div>
                              )
                            })()}
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
                              {tx.description && <div className="text-xs text-gray-400 mt-0.5 truncate"></div>}
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
                                {isContinuing ? <><Loader2 className="w-3 h-3 animate-spin" /> Memuat...</> : 'Lanjutkan'}
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                    </AnimatePresence>
                  </motion.div>

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
          </Reveal>

          {/* Demo Modal */}
          <AnimatePresence>
          {showDeposit && transactionAccount === 'demo' && (
            <>
              <motion.div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowDeposit(false)} />
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl max-h-[90vh] overflow-y-auto"
                  initial={{ opacity: 0, scale: 0.8, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 40 }} transition={{ ...SPRING }}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h2 className="text-lg font-bold text-gray-900">Add Demo Funds</h2>
                      <motion.button onClick={() => setShowDeposit(false)} className="text-gray-400 hover:text-gray-700"
                        whileHover={{ rotate: 90, scale: 1.1 }} transition={{ duration: 0.2 }}>
                        <X className="w-5 h-5" />
                      </motion.button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1.5">Amount (IDR)</label>
                        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                          className="w-full text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl py-3 focus:border-blue-400 focus:bg-white outline-none transition-all" />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {quickAmounts.map((preset) => (
                          <motion.button key={preset} onClick={() => setAmount(preset.toString())}
                            className={`btn-ripple py-2 rounded-xl text-sm font-semibold ${amount === preset.toString() ? 'bg-blue-500 text-white shadow-md shadow-blue-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            {preset >= 1000000 ? `${preset / 1000000}M` : `${preset / 1000}K`}
                          </motion.button>
                        ))}
                      </div>
                      <div className="flex gap-3 mt-2">
                        <motion.button onClick={() => setShowDeposit(false)}
                          className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl font-semibold text-sm transition-colors"
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          Batal
                        </motion.button>
                        <motion.button onClick={handleDemoDeposit} disabled={loading}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-colors"
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Confirm'}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
          </AnimatePresence>

        </div>
      </div>
    </>
  )
}