'use client'

// ============================================================
// app/affiliate/page.tsx — Enhanced with Framer Motion
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  CurrencyDollar,
  Lock,
  LockOpen,
  ArrowLineUp,
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  ArrowsClockwise,
  Warning,
  ChartBar,
  ShareNetwork,
  X,
} from 'phosphor-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import {
  motion,
  useInView,
  AnimatePresence,
  type Variants,
} from 'framer-motion'
import type {
  AffiliatorDashboard,
  AffiliatorInvite,
  CommissionLog,
  CommissionWithdrawal,
  CommissionWithdrawalHistory,
  RequestCommissionWithdrawalDto,
} from '@/types'

// ── Global Styles ─────────────────────────────────────────────

const GlobalStyles = () => (
  <style jsx global>{`
    .bg-pattern-grid {
      background-color: #f5f6f8;
      background-image:
        linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    body { background-color: #f5f6f8 !important; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
)

// ── Motion config ─────────────────────────────────────────────

const SPRING = { type: 'spring', stiffness: 80, damping: 20 } as const

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING } },
}

const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { ...SPRING } },
}

const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { ...SPRING } },
}

const stagger = (delay = 0.08): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.04 } },
})

// Reveal wrapper
function Reveal({ children, variants = fadeUp, delay = 0, className = '' }: {
  children: React.ReactNode; variants?: Variants; delay?: number; className?: string
}) {
  return (
    <motion.div className={className} variants={variants} initial="hidden"
      whileInView="visible" viewport={{ once: true, margin: '-80px' }}
      transition={{ delay }}>
      {children}
    </motion.div>
  )
}

// Word-by-word headline
function AnimatedHeadline({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  const words = text.split(' ')
  return (
    <motion.h1 className={className} style={style}
      variants={stagger(0.07)} initial="hidden" animate="visible">
      {words.map((word, i) => (
        <motion.span key={i}
          variants={{ hidden: { opacity: 0, y: 30, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...SPRING } } }}
          className="inline-block mr-[0.25em]">{word}
        </motion.span>
      ))}
    </motion.h1>
  )
}

// Count-up
function CountUp({ to, suffix = '', prefix = '', decimals = 0 }: { to: number; suffix?: string; prefix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [val, setVal] = useState(0)
  const triggered = useRef(false)

  useEffect(() => {
    if (!inView || triggered.current) return
    triggered.current = true
    let start: number
    const duration = 900
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(parseFloat((to * eased).toFixed(decimals)))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, to])

  return <span ref={ref}>{prefix}{decimals > 0 ? val.toFixed(decimals) : Math.round(val)}{suffix}</span>
}

// ── Helpers ────────────────────────────────────────────────────

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function statusLabel(status: CommissionWithdrawal['status']): { label: string; cls: string; icon: React.ReactNode } {
  switch (status) {
    case 'pending':   return { label: 'Pending',  cls: 'bg-yellow-100 text-yellow-700 border-yellow-200',  icon: <Clock className="w-3.5 h-3.5" weight="fill" /> }
    case 'approved':  return { label: 'Approved', cls: 'bg-blue-100 text-blue-700 border-blue-200',        icon: <CheckCircle className="w-3.5 h-3.5" weight="fill" /> }
    case 'completed': return { label: 'Selesai',  cls: 'bg-green-100 text-green-700 border-green-200',    icon: <CheckCircle className="w-3.5 h-3.5" weight="fill" /> }
    case 'rejected':  return { label: 'Ditolak',  cls: 'bg-red-100 text-red-600 border-red-200',          icon: <XCircle className="w-3.5 h-3.5" weight="fill" /> }
  }
}

// ── Stats card component ──────────────────────────────────────

function StatCard({ label, value, numValue, prefix, suffix, icon: Icon, color, isText, delay }: any) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700', green: 'bg-green-100 text-green-700',
    purple: 'bg-purple-100 text-purple-700', orange: 'bg-orange-100 text-orange-700',
  }
  return (
    <motion.div variants={fadeUp}
      className="bg-white border border-gray-200 shadow-sm rounded-xl p-4"
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(139,92,246,0.15)', transition: { duration: 0.2 } }}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" weight="duotone" />
      </div>
      <p className={`font-bold ${isText ? 'text-base' : 'text-2xl'} text-gray-900`}>
        {numValue != null
          ? <CountUp to={numValue} prefix={prefix} suffix={suffix} />
          : value}
      </p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </motion.div>
  )
}

// ── Component ──────────────────────────────────────────────────

export default function AffiliatePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'invites' | 'commissions' | 'withdrawals'>('dashboard')
  const [dashboard, setDashboard] = useState<AffiliatorDashboard | null>(null)
  const [invites, setInvites] = useState<AffiliatorInvite[]>([])
  const [inviteSummary, setInviteSummary] = useState({ total: 0, deposited: 0, pending: 0 })
  const [commissions, setCommissions] = useState<CommissionLog[]>([])
  const [commissionDetails, setCommissionDetails] = useState<any>(null)
  const [withdrawalHistory, setWithdrawalHistory] = useState<CommissionWithdrawalHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [tabLoading, setTabLoading] = useState(false)
  const [error403, setError403] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawNote, setWithdrawNote] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.getMyAffiliatorProgram()
      setDashboard(res.data ?? null)
    } catch (err: any) {
      if (err?.response?.status === 403) setError403(true)
      else toast.error('Gagal memuat data program affiliator.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchDashboard() }, [fetchDashboard])

  const fetchInvites = useCallback(async () => {
    setTabLoading(true)
    try {
      const res = await api.getMyAffiliatorInvites()
      setInvites(res.data!.invites)
      setInviteSummary({ total: res.data!.total, deposited: res.data!.deposited, pending: res.data!.pending })
    } catch { toast.error('Gagal memuat daftar undangan.') }
    finally { setTabLoading(false) }
  }, [])

  const fetchCommissions = useCallback(async () => {
    setTabLoading(true)
    try {
      const res = await api.getMyCommissions()
      setCommissions(res.data!.commissionLogs)
      setCommissionDetails(res.data)
    } catch { toast.error('Gagal memuat riwayat komisi.') }
    finally { setTabLoading(false) }
  }, [])

  const fetchWithdrawals = useCallback(async () => {
    setTabLoading(true)
    try {
      const res = await api.getMyCommissionWithdrawals()
      setWithdrawalHistory(res.data ?? null)
    } catch { toast.error('Gagal memuat riwayat penarikan.') }
    finally { setTabLoading(false) }
  }, [])

  useEffect(() => {
    if (activeTab === 'invites' && invites.length === 0) fetchInvites()
    if (activeTab === 'commissions' && commissions.length === 0) fetchCommissions()
    if (activeTab === 'withdrawals' && !withdrawalHistory) fetchWithdrawals()
  }, [activeTab]) // eslint-disable-line

  const copyCode = () => {
    if (!dashboard?.affiliateCode) return
    navigator.clipboard.writeText(dashboard.affiliateCode)
    setCopied(true)
    toast.success('Kode referral disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount)
    if (!amount || amount < 50000) { toast.error('Minimal penarikan Rp 50.000'); return }
    setWithdrawLoading(true)
    try {
      await api.requestCommissionWithdrawal({ amount, note: withdrawNote || undefined } as RequestCommissionWithdrawalDto)
      toast.success('Request penarikan berhasil diajukan!')
      setShowWithdrawModal(false); setWithdrawAmount(''); setWithdrawNote('')
      fetchDashboard()
      if (activeTab === 'withdrawals') fetchWithdrawals()
    } catch {} finally { setWithdrawLoading(false) }
  }

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    try {
      await api.cancelCommissionWithdrawal(id)
      toast.success('Request penarikan dibatalkan.')
      fetchWithdrawals(); fetchDashboard()
    } catch {} finally { setCancellingId(null) }
  }

  // Loading — skeleton mirrors real layout
  if (loading) {
    return (
      <>
        <GlobalStyles />
        <style jsx global>{`
          @keyframes sk-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
          .sk { animation: sk-pulse 1.8s ease-in-out infinite; }
        `}</style>
        <div className="min-h-screen bg-pattern-grid">
          <Navbar />
          <div className="max-w-5xl mx-auto px-4 py-6">

            {/* Header: title + referral code card */}
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="sk">
                <div className="h-8 bg-gray-200 rounded w-52 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-72" />
              </div>
              <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 sk">
                <div>
                  <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-28" />
                </div>
                <div className="w-9 h-9 bg-gray-200 rounded-lg ml-2" />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1 mb-6 overflow-x-auto">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-9 bg-gray-200 rounded-lg flex-shrink-0 w-32 sk" style={{ animationDelay: `${i * 60}ms` }} />
              ))}
            </div>

            {/* Dashboard tab content */}
            {/* Stats grid: grid-cols-2 lg:grid-cols-4 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 sk" style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="w-9 h-9 bg-gray-200 rounded-lg mb-3" />
                  <div className="h-7 bg-gray-200 rounded w-20 mb-1" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              ))}
            </div>

            {/* Balance + unlock progress: grid lg:grid-cols-2 */}
            <div className="grid lg:grid-cols-2 gap-4">
              {/* Balance card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 sk" style={{ animationDelay: '320ms' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded" />
                    <div className="h-5 bg-gray-200 rounded w-28" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-20" />
                </div>
                <div className="h-9 bg-gray-200 rounded w-36 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-40 mb-4" />
                <div className="h-3 bg-gray-200 rounded w-48 mb-6" />
                <div className="h-10 bg-gray-200 rounded-xl w-full" />
              </div>

              {/* Unlock progress card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 sk" style={{ animationDelay: '400ms' }}>
                <div className="h-5 bg-gray-200 rounded w-36 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-56 mb-5" />
                <div className="flex items-end gap-2 mb-4">
                  <div className="h-10 bg-gray-200 rounded w-12" />
                  <div className="h-6 bg-gray-200 rounded w-8" />
                  <div className="h-4 bg-gray-200 rounded w-16" />
                </div>
                <div className="h-3 bg-gray-200 rounded-full w-full mb-3" />
                <div className="h-4 bg-gray-200 rounded w-40" />
              </div>
            </div>

          </div>
        </div>
      </>
    )
  }

  if (error403) {
    return (
      <>
        <GlobalStyles />
        <div className="min-h-screen bg-pattern-grid">
          <Navbar />
          <motion.div className="flex flex-col items-center justify-center min-h-[70vh] gap-4 px-4"
            initial="hidden" animate="visible" variants={stagger(0.1)}>
            <motion.div variants={scaleIn}
              className="w-24 h-24 rounded-full bg-purple-100 border border-purple-200 flex items-center justify-center">
              <ShareNetwork className="w-12 h-12 text-purple-500" weight="duotone" />
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-2xl font-bold text-gray-900">Program Affiliator Belum Aktif</motion.h2>
            <motion.p variants={fadeUp} className="text-gray-500 text-center max-w-md text-sm">
              Akun Anda belum terdaftar sebagai affiliator. Hubungi Super Admin untuk mendapatkan kode referral eksklusif.
            </motion.p>
            <motion.button variants={scaleIn} onClick={() => router.push('/')}
              className="mt-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors text-sm"
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              Kembali ke Beranda
            </motion.button>
          </motion.div>
        </div>
      </>
    )
  }

  if (!dashboard) return null

  const { affiliateCode, isCommissionUnlocked, revenueSharePercentage, balances, unlockProgress, stats } = dashboard

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: ChartBar },
    { key: 'invites',   label: `Undangan (${stats.totalInvited})`, icon: Users },
    { key: 'commissions', label: 'Komisi', icon: CurrencyDollar },
    { key: 'withdrawals', label: 'Penarikan', icon: ArrowLineUp },
  ] as const

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
            <AnimatedHeadline text="Program Affiliator"
              className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2"
              style={{ letterSpacing: '-0.03em' }} />
            <motion.p className="text-gray-500 text-sm mt-1" variants={fadeUp}>
              Undang pengguna baru dan dapatkan komisi dari trading mereka.
            </motion.p>
          </motion.div>

          {/* Referral code card */}
          <motion.div variants={scaleIn}
            className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3"
            whileHover={{ borderColor: 'rgb(139,92,246)', boxShadow: '0 0 24px rgba(139,92,246,0.15)', transition: { duration: 0.2 } }}>
            <div>
              <p className="text-xs text-gray-400">Kode Referral Anda</p>
              <p className="text-xl font-bold text-purple-600 tracking-widest">{affiliateCode}</p>
            </div>
            <motion.button onClick={copyCode}
              className="ml-2 p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 transition-colors"
              whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <AnimatePresence mode="wait">
                {copied
                  ? <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <CheckCircle className="w-5 h-5" weight="fill" />
                    </motion.span>
                  : <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Copy className="w-5 h-5" weight="bold" />
                    </motion.span>}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <motion.div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1 mb-6 overflow-x-auto"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.2 }}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <motion.button key={key} onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap relative ${
                activeTab === key ? 'text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              {activeTab === key && (
                <motion.div className="absolute inset-0 bg-purple-600 rounded-lg shadow-md"
                  layoutId="activeTab" transition={{ ...SPRING }} />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="w-4 h-4" weight={activeTab === key ? 'fill' : 'regular'} />
                {label}
              </span>
            </motion.button>
          ))}
        </motion.div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ ...SPRING }} className="space-y-5">

              {/* Stats grid */}
              <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3"
                variants={stagger(0.1)} initial="hidden" animate="visible">
                <StatCard label="Total Undangan" numValue={stats.totalInvited} icon={Users} color="blue" />
                <StatCard label="Sudah Deposit" numValue={stats.depositedInvites} icon={CheckCircle} color="green" />
                <StatCard label="Total Komisi" value={formatRupiah(stats.totalCommissionEarned)} icon={CurrencyDollar} color="purple" isText />
                <StatCard label="Sudah Dicairkan" value={formatRupiah(stats.totalCommissionWithdrawn)} icon={ArrowLineUp} color="orange" isText />
              </motion.div>

              {/* Balance + unlock progress */}
              <div className="grid lg:grid-cols-2 gap-4">

                {/* Balance card */}
                <Reveal variants={scaleIn}>
                  <motion.div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 h-full"
                    whileHover={{ borderColor: 'rgba(139,92,246,0.4)', transition: { duration: 0.2 } }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <motion.div initial={{ rotate: -90, scale: 0 }} animate={{ rotate: 0, scale: 1 }} transition={{ ...SPRING, delay: 0.3 }}>
                          {isCommissionUnlocked
                            ? <LockOpen className="w-5 h-5 text-green-600" weight="duotone" />
                            : <Lock className="w-5 h-5 text-yellow-600" weight="duotone" />}
                        </motion.div>
                        <h3 className="font-semibold text-gray-900">Saldo Komisi</h3>
                      </div>
                      <motion.span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                        isCommissionUnlocked
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}
                        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ ...SPRING, delay: 0.4 }}>
                        {isCommissionUnlocked ? 'Terbuka' : 'Terkunci'}
                      </motion.span>
                    </div>

                    <motion.p className="text-3xl font-bold text-gray-900 mb-1"
                      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...SPRING, delay: 0.35 }}>
                      {formatRupiah(balances.commissionBalance)}
                    </motion.p>
                    <p className="text-xs text-gray-400 mb-4">Saldo tersedia untuk dicairkan</p>

                    {balances.lockedCommissionBalance > 0 && (
                      <motion.div className="flex items-center gap-2 mb-4 text-sm text-yellow-600/80 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2"
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3 }}>
                        <Lock className="w-4 h-4 flex-shrink-0" weight="duotone" />
                        <span>{formatRupiah(balances.lockedCommissionBalance)} masih terkunci</span>
                      </motion.div>
                    )}

                    <p className="text-xs text-gray-400 mb-4">
                      Revenue share: <span className="text-purple-500 font-semibold">{revenueSharePercentage}%</span> dari kerugian invitee
                    </p>

                    <motion.button onClick={() => setShowWithdrawModal(true)}
                      disabled={!isCommissionUnlocked || balances.commissionBalance < 50000}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl font-semibold text-sm transition-colors"
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <ArrowLineUp className="w-4 h-4" weight="bold" />
                      Cairkan Komisi
                    </motion.button>
                  </motion.div>
                </Reveal>

                {/* Unlock progress */}
                <Reveal variants={scaleIn} delay={0.1}>
                  <motion.div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 h-full"
                    whileHover={{ borderColor: 'rgba(139,92,246,0.4)', transition: { duration: 0.2 } }}>
                    <h3 className="font-semibold text-gray-900 mb-1">Progress Unlock</h3>
                    <p className="text-xs text-gray-400 mb-5">
                      Undang {unlockProgress.required} user yang melakukan deposit untuk membuka saldo komisi.
                    </p>

                    <div className="flex items-end gap-2 mb-4">
                      <motion.span className="text-4xl font-bold text-gray-900"
                        initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...SPRING, delay: 0.4 }}>
                        <CountUp to={unlockProgress.current} />
                      </motion.span>
                      <span className="text-gray-500 text-lg mb-1">/ {unlockProgress.required}</span>
                      <span className="text-xs text-gray-400 mb-1.5">depositor</span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
                      <motion.div
                        className={`h-full rounded-full ${unlockProgress.isUnlocked ? 'bg-green-500' : 'bg-purple-500'}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(unlockProgress.percentage, 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      {unlockProgress.isUnlocked ? (
                        <motion.div className="flex items-center gap-2"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                          <CheckCircle className="w-4 h-4 text-green-600" weight="fill" />
                          <span className="text-green-600 font-medium">Komisi sudah terbuka!</span>
                        </motion.div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Warning className="w-4 h-4 text-yellow-600" weight="fill" />
                          <span className="text-gray-500 text-xs">{unlockProgress.message}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </Reveal>
              </div>
            </motion.div>
          )}

          {/* Invites tab */}
          {activeTab === 'invites' && (
            <motion.div key="invites" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ ...SPRING }}>
              <motion.div className="flex gap-3 mb-5 flex-wrap" variants={stagger(0.08)} initial="hidden" animate="visible">
                {[
                  { label: 'Total', value: inviteSummary.total, cls: 'bg-gray-100 text-gray-700 border-gray-200' },
                  { label: 'Sudah Deposit', value: inviteSummary.deposited, cls: 'bg-green-100 text-green-700 border-green-200' },
                  { label: 'Belum Deposit', value: inviteSummary.pending, cls: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
                ].map(({ label, value, cls }) => (
                  <motion.div key={label} variants={scaleIn}
                    className={`px-4 py-1.5 rounded-xl border text-sm font-medium ${cls}`}
                    whileHover={{ scale: 1.05 }}>
                    {label}: <span className="font-bold">{value}</span>
                  </motion.div>
                ))}
              </motion.div>

              {tabLoading ? (
                <div className="flex justify-center py-16">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <ArrowsClockwise className="w-8 h-8 text-purple-500" weight="bold" />
                  </motion.div>
                </div>
              ) : invites.length === 0 ? (
                <motion.div className="text-center py-16" variants={scaleIn} initial="hidden" animate="visible">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" weight="duotone" />
                  <p className="text-gray-500">Belum ada undangan. Bagikan kode referral Anda!</p>
                </motion.div>
              ) : (
                <motion.div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs text-gray-400">
                          <th className="text-left px-4 py-3">Email (masked)</th>
                          <th className="text-left px-4 py-3">Tanggal Daftar</th>
                          <th className="text-left px-4 py-3">Status Deposit</th>
                          <th className="text-left px-4 py-3">Deposit Pertama</th>
                          <th className="text-left px-4 py-3">Dihitung</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invites.map((inv, i) => (
                          <motion.tr key={inv.id}
                            className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? '' : 'bg-gray-50'}`}
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ ...SPRING, delay: i * 0.05 }}>
                            <td className="px-4 py-3 text-gray-700 font-mono text-xs">{inv.inviteeEmail}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(inv.createdAt)}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border font-medium ${
                                inv.hasDeposited ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                {inv.hasDeposited ? <CheckCircle className="w-3.5 h-3.5" weight="fill" /> : <Clock className="w-3.5 h-3.5" weight="fill" />}
                                {inv.hasDeposited ? 'Deposit' : 'Belum'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{inv.firstDepositAt ? formatDate(inv.firstDepositAt) : '—'}</td>
                            <td className="px-4 py-3">
                              {inv.isCountedForUnlock
                                ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ ...SPRING, delay: i * 0.05 + 0.2 }}>
                                    <CheckCircle className="w-4 h-4 text-green-600" weight="fill" />
                                  </motion.div>
                                : <span className="text-gray-400">—</span>}
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Commissions tab */}
          {activeTab === 'commissions' && (
            <motion.div key="commissions" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ ...SPRING }} className="space-y-4">
              {commissionDetails && (
                <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                  variants={stagger(0.08)} initial="hidden" animate="visible">
                  {[
                    { label: 'Saldo Tersedia', value: formatRupiah(commissionDetails.commissionBalance) },
                    { label: 'Total Diterima', value: formatRupiah(commissionDetails.totalEarned) },
                    { label: 'Total Dicairkan', value: formatRupiah(commissionDetails.totalWithdrawn) },
                    { label: 'Revenue Share', value: `${commissionDetails.revenueSharePercentage}%` },
                  ].map(({ label, value }) => (
                    <motion.div key={label} variants={fadeUp}
                      className="bg-white border border-gray-200 shadow-sm rounded-xl p-3"
                      whileHover={{ y: -3, borderColor: 'rgba(139,92,246,0.4)', transition: { duration: 0.2 } }}>
                      <p className="text-xs text-gray-400 mb-1">{label}</p>
                      <p className="text-base font-bold text-gray-900">{value}</p>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {tabLoading ? (
                <div className="flex justify-center py-16">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <ArrowsClockwise className="w-8 h-8 text-purple-500" weight="bold" />
                  </motion.div>
                </div>
              ) : commissions.length === 0 ? (
                <motion.div className="text-center py-16" variants={scaleIn} initial="hidden" animate="visible">
                  <CurrencyDollar className="w-12 h-12 text-gray-400 mx-auto mb-3" weight="duotone" />
                  <p className="text-gray-500">Belum ada riwayat komisi.</p>
                  <p className="text-gray-400 text-xs mt-1">Komisi masuk saat invitee mengalami loss pada akun real.</p>
                </motion.div>
              ) : (
                <motion.div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-xs text-gray-400">
                          <th className="text-left px-4 py-3">Tanggal</th>
                          <th className="text-right px-4 py-3">Order</th>
                          <th className="text-right px-4 py-3">Loss</th>
                          <th className="text-right px-4 py-3">%</th>
                          <th className="text-right px-4 py-3">Komisi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissions.map((log, i) => (
                          <motion.tr key={log.id}
                            className={`border-b border-gray-100 hover:bg-gray-50 ${i % 2 === 0 ? '' : 'bg-gray-50'}`}
                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ ...SPRING, delay: i * 0.04 }}>
                            <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(log.createdAt)}</td>
                            <td className="px-4 py-3 text-right text-gray-700 text-xs">{formatRupiah(log.orderAmount)}</td>
                            <td className="px-4 py-3 text-right text-red-500 text-xs">{formatRupiah(log.lossAmount)}</td>
                            <td className="px-4 py-3 text-right text-gray-500 text-xs">{log.commissionPercentage}%</td>
                            <td className="px-4 py-3 text-right text-green-600 font-semibold text-xs">{formatRupiah(log.commissionAmount)}</td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Withdrawals tab */}
          {activeTab === 'withdrawals' && (
            <motion.div key="withdrawals" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }} transition={{ ...SPRING }} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-wrap">
                  {withdrawalHistory && (
                    <>
                      <Reveal><div className="text-sm"><span className="text-gray-400">Saldo: </span><span className="text-gray-900 font-semibold">{formatRupiah(withdrawalHistory.commissionBalance)}</span></div></Reveal>
                      <Reveal delay={0.1}><div className="text-sm"><span className="text-gray-400">Total Dicairkan: </span><span className="text-gray-900 font-semibold">{formatRupiah(withdrawalHistory.totalWithdrawn)}</span></div></Reveal>
                    </>
                  )}
                </div>
                <motion.button onClick={() => setShowWithdrawModal(true)}
                  disabled={!isCommissionUnlocked || (withdrawalHistory ? withdrawalHistory.commissionBalance < 50000 : true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-100 disabled:text-gray-400 text-white rounded-xl font-semibold text-sm transition-colors"
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <ArrowLineUp className="w-4 h-4" weight="bold" />
                  Cairkan
                </motion.button>
              </div>

              {tabLoading ? (
                <div className="flex justify-center py-16">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <ArrowsClockwise className="w-8 h-8 text-purple-500" weight="bold" />
                  </motion.div>
                </div>
              ) : !withdrawalHistory || withdrawalHistory.withdrawals.length === 0 ? (
                <motion.div className="text-center py-16" variants={scaleIn} initial="hidden" animate="visible">
                  <ArrowLineUp className="w-12 h-12 text-gray-400 mx-auto mb-3" weight="duotone" />
                  <p className="text-gray-500">Belum ada riwayat penarikan.</p>
                </motion.div>
              ) : (
                <motion.div className="space-y-3" variants={stagger(0.07)} initial="hidden" animate="visible">
                  {withdrawalHistory.withdrawals.map((w) => {
                    const st = statusLabel(w.status)
                    return (
                      <motion.div key={w.id} variants={fadeUp}
                        className="bg-white border border-gray-200 shadow-sm rounded-xl p-4"
                        whileHover={{ borderColor: 'rgba(139,92,246,0.4)', y: -2, transition: { duration: 0.2 } }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-lg font-bold text-gray-900">{formatRupiah(w.amount)}</span>
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border font-medium ${st.cls}`}>
                                {st.icon}{st.label}
                              </span>
                            </div>
                            {w.bankAccount && (
                              <p className="text-xs text-gray-400">{w.bankAccount.bankName} · {w.bankAccount.accountNumber} · {w.bankAccount.accountHolderName}</p>
                            )}
                            {w.note && <p className="text-xs text-gray-400 mt-0.5">Catatan: {w.note}</p>}
                            {w.adminNotes && <p className="text-xs text-blue-500/80 mt-0.5">Admin: {w.adminNotes}</p>}
                            {w.rejectionReason && <p className="text-xs text-red-500 mt-0.5">Ditolak: {w.rejectionReason}</p>}
                            <p className="text-xs text-gray-400 mt-1">{formatDate(w.createdAt)}</p>
                          </div>
                          {w.status === 'pending' && (
                            <motion.button onClick={() => handleCancel(w.id)} disabled={cancellingId === w.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                              {cancellingId === w.id
                                ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><ArrowsClockwise className="w-3.5 h-3.5" weight="bold" /></motion.span>
                                : <X className="w-3.5 h-3.5" weight="bold" />}
                              Batal
                            </motion.button>
                          )}
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <>
            <motion.div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowWithdrawModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div className="w-full max-w-md bg-white rounded-2xl border border-gray-200 shadow-2xl"
                initial={{ opacity: 0, scale: 0.8, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 40 }} transition={{ ...SPRING }}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-900">Cairkan Komisi</h3>
                    <motion.button onClick={() => setShowWithdrawModal(false)}
                      className="text-gray-400 hover:text-gray-700"
                      whileHover={{ rotate: 90, scale: 1.1 }} transition={{ duration: 0.2 }}>
                      <X className="w-5 h-5" weight="bold" />
                    </motion.button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Jumlah Penarikan</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                        <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="50000" min={50000}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 text-sm" />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Minimal Rp 50.000 · Saldo tersedia: {formatRupiah(balances.commissionBalance)}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1.5">Catatan (opsional)</label>
                      <input type="text" value={withdrawNote} onChange={(e) => setWithdrawNote(e.target.value)}
                        placeholder="Mis: Penarikan bulan Februari"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 text-sm" />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs text-blue-700">
                      Penarikan akan masuk ke rekening bank terdaftar di profil Anda. Admin akan memproses dalam 1–3 hari kerja.
                    </div>
                    <div className="flex gap-3 mt-2">
                      <motion.button onClick={() => setShowWithdrawModal(false)}
                        className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 rounded-xl font-semibold text-sm transition-colors"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        Batal
                      </motion.button>
                      <motion.button onClick={handleWithdraw}
                        disabled={withdrawLoading || !withdrawAmount || Number(withdrawAmount) < 50000}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl font-semibold text-sm transition-colors"
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        {withdrawLoading
                          ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}><ArrowsClockwise className="w-4 h-4" weight="bold" /></motion.span>
                          : <ArrowLineUp className="w-4 h-4" weight="bold" />}
                        {withdrawLoading ? 'Memproses...' : 'Ajukan Penarikan'}
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
    </>
  )
}