// app/admin/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { SystemStatistics } from '@/types'
import { TimezoneUtil } from '@/lib/utils'
import {
  Users, TrendUp, CurrencyDollar, Activity,
  ArrowUpRight, Package, Calendar, Tag, Shield,
  ArrowLineUp, ArrowsClockwise, CaretRight, Target, Info,
  ShareNetwork, ChartBar, Warning,
} from 'phosphor-react'
import { motion, AnimatePresence, useInView, type Variants } from 'framer-motion'

type AccountFilter = 'real' | 'demo'

// ── Global Styles ──────────────────────────────────────────────
const GlobalStyles = () => (
  <style jsx global>{`
    :root {
      --glass-bg: rgba(255,255,255,0.04);
      --glass-bg-hover: rgba(255,255,255,0.08);
      --glass-border: rgba(255,255,255,0.09);
      --glass-border-hover: rgba(255,255,255,0.18);
      --glass-shadow: 0 8px 32px rgba(0,0,0,0.4);
      --glass-shadow-hover: 0 16px 48px rgba(0,0,0,0.5);
    }
    .bg-pattern-grid {
      background-color: #060918;
      background-image: none;
      position: relative;
    }
    .bg-pattern-grid::before {
      content: '';
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 10% 20%, rgba(99,102,241,0.18) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 85% 10%, rgba(139,92,246,0.14) 0%, transparent 55%),
        radial-gradient(ellipse 70% 60% at 70% 80%, rgba(6,182,212,0.10) 0%, transparent 55%),
        radial-gradient(ellipse 50% 40% at 20% 85%, rgba(16,185,129,0.08) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }
    .bg-pattern-grid::after {
      content: '';
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px);
      background-size: 48px 48px;
      pointer-events: none;
      z-index: 0;
    }
    body { background-color: #060918 !important; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes sk-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
    .sk { animation: sk-pulse 1.8s ease-in-out infinite; }

    /* ── Glass card base ── */
    .glass-card {
      background: var(--glass-bg);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid var(--glass-border);
      box-shadow: var(--glass-shadow), inset 0 1px 0 rgba(255,255,255,0.06);
      transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s cubic-bezier(0.22,1,0.36,1);
    }
    .glass-card:hover {
      background: var(--glass-bg-hover);
      border-color: var(--glass-border-hover);
      box-shadow: var(--glass-shadow-hover), inset 0 1px 0 rgba(255,255,255,0.10);
    }
    .glass-sub {
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.07);
    }
    .glass-input {
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.10);
    }
    .stat-card { transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease; }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-icon { transition: transform 0.2s ease; }
    .stat-card:hover .stat-icon { transform: scale(1.12); }

    /* ── Glow accents ── */
    .glow-indigo { box-shadow: 0 0 20px rgba(99,102,241,0.25), var(--glass-shadow); }
    .glow-green  { box-shadow: 0 0 20px rgba(16,185,129,0.20), var(--glass-shadow); }
    .glow-red    { box-shadow: 0 0 20px rgba(239,68,68,0.20),  var(--glass-shadow); }
  `}</style>
)

// ── Motion primitives ──────────────────────────────────────────
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

function AnimatedHeadline({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.h1 className={className} style={style}
      variants={stagger(0.07)} initial="hidden" animate="visible">
      {text.split(' ').map((word, i) => (
        <motion.span key={i}
          variants={{ hidden: { opacity: 0, y: 30, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...SPRING } } }}
          className="inline-block mr-[0.25em]">{word}
        </motion.span>
      ))}
    </motion.h1>
  )
}

function CountUp({ to, suffix = '', prefix = '', decimals = 0 }: { to: number; suffix?: string; prefix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [val, setVal] = useState(0)
  const triggered = useRef(false)
  useEffect(() => {
    if (!inView || triggered.current) return
    triggered.current = true
    let start: number
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 900, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(parseFloat((to * eased).toFixed(decimals)))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, to])
  return <span ref={ref}>{prefix}{decimals > 0 ? val.toFixed(decimals) : Math.round(val)}{suffix}</span>
}

function formatRupiah(n: number, compact = false) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
    ...(compact ? { notation: 'compact' as const, maximumFractionDigits: 1 } : {})
  }).format(n)
}

// ── Skeleton ───────────────────────────────────────────────────
const LoadingSkeleton = () => (
  <>
    <GlobalStyles />
    <div className="min-h-screen bg-pattern-grid">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* header */}
        <div className="mb-8 flex items-center justify-between sk">
          <div>
            <div className="h-4 bg-white/10 rounded w-32 mb-2" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/10 rounded-xl" />
              <div>
                <div className="h-7 bg-white/10 rounded w-44 mb-1" />
                <div className="h-4 bg-white/10 rounded w-52" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 bg-white/10 rounded-xl w-32" />
            <div className="h-9 bg-white/10 rounded-xl w-28" />
          </div>
        </div>
        {/* stats row */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 sk" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="w-10 h-10 bg-white/10 rounded-lg flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3 bg-white/10 rounded w-20 mb-2" />
                  <div className="h-6 bg-white/10 rounded w-16 mb-1" />
                  <div className="h-3 bg-white/10 rounded w-14" />
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* financial */}
        <div className="glass-card rounded-2xl p-5 mb-6 sk" style={{ animationDelay: '200ms' }}>
          <div className="h-4 bg-white/10 rounded w-36 mb-4" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-sub rounded-xl p-4">
                <div className="h-3 bg-white/10 rounded w-24 mb-2" />
                <div className="h-5 bg-white/10 rounded w-20" />
              </div>
            ))}
          </div>
        </div>
        {/* quick actions */}
        <div className="h-4 bg-white/10 rounded w-24 mb-3 sk" style={{ animationDelay: '300ms' }} />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-3 flex items-center gap-3 sk" style={{ animationDelay: `${300 + i * 60}ms` }}>
              <div className="w-10 h-10 bg-white/10 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-white/10 rounded w-16 mb-1" />
                <div className="h-3 bg-white/10 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
        {/* health + withdrawal */}
        {[...Array(2)].map((_, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 mb-4 sk" style={{ animationDelay: `${600 + i * 100}ms` }}>
            <div className="h-4 bg-white/10 rounded w-32 mb-4" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, j) => (
                <div key={j} className="glass-sub text-center p-3 rounded-xl">
                  <div className="h-8 bg-white/10 rounded w-12 mx-auto mb-1" />
                  <div className="h-3 bg-white/10 rounded w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
)

// ── Component ──────────────────────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<SystemStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('real')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    if (user.role !== 'super_admin' && user.role !== 'admin') { router.push('/trading'); return }
    loadStats()
  }, [user, router])

  const loadStats = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      const response = await api.getSystemStatistics()
      let statsData: SystemStatistics | null = null
      if (response && typeof response === 'object') {
        if ('data' in response && response.data) statsData = response.data as SystemStatistics
        else if ('users' in response && 'realAccount' in response) statsData = response as SystemStatistics
      }
      if (statsData) { setStats(statsData); setLastUpdated(new Date()) }
      else console.error('Invalid statistics data received')
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null
  if (loading) return <LoadingSkeleton />

  if (!stats) return (
    <>
      <GlobalStyles />
      <div className="min-h-screen bg-pattern-grid">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-6">
          <motion.div className="text-center py-20" variants={scaleIn} initial="hidden" animate="visible">
            <div className="w-14 h-14 glass-sub rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <Warning className="w-7 h-7 text-red-400" weight="duotone" />
            </div>
            <p className="text-slate-400 mb-4">Gagal memuat statistik</p>
            <motion.button onClick={() => loadStats()}
              className="px-5 py-2.5 bg-indigo-500/80 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors text-sm"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              Coba Lagi
            </motion.button>
          </motion.div>
        </div>
      </div>
    </>
  )

  const filteredStats = accountFilter === 'real'
    ? { trading: stats.realAccount.trading, financial: stats.realAccount.financial }
    : { trading: stats.demoAccount.trading, financial: stats.demoAccount.financial }

  const colorMap: Record<string, { bg: string; icon: string; hover: string; glowHover?: string }> = {
    indigo: { bg: 'bg-indigo-500/15', icon: 'text-indigo-300', hover: '', glowHover: 'hover:shadow-[0_0_24px_rgba(99,102,241,0.3)]' },
    purple: { bg: 'bg-purple-500/15', icon: 'text-purple-300', hover: '', glowHover: 'hover:shadow-[0_0_24px_rgba(168,85,247,0.3)]' },
    blue:   { bg: 'bg-blue-500/15',   icon: 'text-blue-300',   hover: '', glowHover: 'hover:shadow-[0_0_24px_rgba(59,130,246,0.3)]' },
    green:  { bg: 'bg-green-500/15',  icon: 'text-green-300',  hover: '', glowHover: 'hover:shadow-[0_0_24px_rgba(34,197,94,0.3)]' },
    cyan:   { bg: 'bg-cyan-500/15',   icon: 'text-cyan-300',   hover: '', glowHover: 'hover:shadow-[0_0_24px_rgba(6,182,212,0.3)]' },
    orange: { bg: 'bg-orange-500/15', icon: 'text-orange-300', hover: '', glowHover: 'hover:shadow-[0_0_24px_rgba(249,115,22,0.3)]' },
    pink:   { bg: 'bg-pink-500/15',   icon: 'text-pink-300',   hover: '', glowHover: 'hover:shadow-[0_0_24px_rgba(236,72,153,0.3)]' },
    red:    { bg: 'bg-red-500/15',    icon: 'text-red-300',    hover: '', glowHover: 'hover:shadow-[0_0_24px_rgba(239,68,68,0.3)]' },
    violet: { bg: 'bg-violet-500/15', icon: 'text-violet-300', hover: '', glowHover: 'hover:shadow-[0_0_24px_rgba(139,92,246,0.3)]' },
  }

  const quickActions = [
    { title: 'Users',       description: 'Kelola pengguna',         icon: Users,        href: '/admin/users',          color: 'indigo' },
    { title: 'Assets',      description: 'Atur aset trading',       icon: Package,      href: '/admin/assets',         color: 'purple' },
    { title: 'Schedule',    description: 'Jadwal trend aset',       icon: Calendar,     href: '/admin/asset-schedule', color: 'blue' },
    { title: 'Voucher',     description: 'Kelola voucher',          icon: Tag,          href: '/admin/vouchers',       color: 'green' },
    { title: 'Verifikasi',  description: 'Review KTP & Selfie',     icon: Shield,       href: '/admin/verifications',  color: 'cyan',   badge: (stats as any)?.verifications?.pending },
    { title: 'Penarikan',   description: 'Request withdraw',        icon: ArrowLineUp,  href: '/admin/withdrawals',    color: 'orange' },
    { title: 'Information', description: 'Kelola informasi',        icon: Info,         href: '/admin/information',    color: 'pink' },
    { title: 'AutoLose',    description: 'Kontrol sistem lose',     icon: Target,       href: '/admin/auto-lose',      color: 'red' },
    { title: 'Affiliator',  description: 'Kelola program afiliasi', icon: ShareNetwork, href: '/admin/affiliators',    color: 'violet', badge: (stats as any)?.affiliators?.pendingWithdrawals },
  ]

  return (
    <>
      <GlobalStyles />
      <div className="min-h-screen bg-pattern-grid">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">

          {/* ── Header ── */}
          <motion.div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            initial="hidden" animate="visible" variants={stagger(0.1)}>
            <motion.div variants={fadeLeft}>
              <motion.div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1" variants={fadeUp}>
                <span>Dasbor</span><span>/</span>
                <span className="text-slate-100 font-medium">Admin</span>
              </motion.div>
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-9 h-9 bg-gradient-to-br from-indigo-400/80 to-violet-500/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30 border border-white/20"
                  whileHover={{ rotate: 90, scale: 1.1 }} transition={{ ...SPRING }}>
                  <ChartBar className="w-5 h-5 text-white" weight="duotone" />
                </motion.div>
                <div>
                  <AnimatedHeadline
                    text="Dashboard Admin"
                    className="text-2xl sm:text-3xl font-bold text-slate-100"
                    style={{ letterSpacing: '-0.03em' }}
                  />
                  <motion.p className="text-slate-400 text-sm mt-0.5" variants={fadeUp}>
                    {lastUpdated
                      ? `Diperbarui ${TimezoneUtil.formatDateTime(lastUpdated)}`
                      : 'Statistik sistem & aktivitas pengguna'}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            {/* Filter + Refresh */}
            <motion.div variants={scaleIn} className="flex items-center gap-2 flex-wrap">
              <div className="flex gap-1 glass-input rounded-xl p-1">
                {(['real', 'demo'] as const).map((f) => (
                  <motion.button key={f}
                    onClick={() => setAccountFilter(f)}
                    className={`relative px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${accountFilter === f ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                    whileTap={{ scale: 0.96 }}>
                    {accountFilter === f && (
                      <motion.div
                        className={`absolute inset-0 rounded-lg shadow-md ${f === 'real' ? 'bg-green-600' : 'bg-blue-600'}`}
                        layoutId="adminFilterPill" transition={{ ...SPRING }} />
                    )}
                    <span className="relative z-10 capitalize">{f}</span>
                  </motion.button>
                ))}
              </div>
              <motion.button onClick={() => loadStats(true)} disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 glass-input rounded-xl text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.04, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} whileTap={{ scale: 0.96 }}>
                <ArrowsClockwise className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} weight="bold" />
                {refreshing ? 'Memperbarui...' : 'Perbarui'}
              </motion.button>
            </motion.div>
          </motion.div>

          {/* ── Stats Row ── */}
          <Reveal className="glass-card rounded-2xl p-5 mb-6">
            <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
              variants={stagger(0.08)} initial="hidden" animate="visible">
              {[
                {
                  icon: <Users className="w-5 h-5 text-indigo-400" weight="duotone" />,
                  bg: 'bg-indigo-500/15', label: 'Total Users',
                  val: stats.users.total, sub: `${stats.users.active} aktif`, subColor: 'text-indigo-400',
                },
                {
                  icon: <Target className="w-5 h-5 text-purple-400" weight="duotone" />,
                  bg: 'bg-purple-500/15', label: 'Total Orders',
                  val: filteredStats.trading.totalOrders,
                  sub: `${filteredStats.trading.winRate}% win rate`, subColor: 'text-emerald-400',
                },
                {
                  icon: <TrendUp className="w-5 h-5 text-blue-400" weight="duotone" />,
                  bg: 'bg-blue-500/15', label: 'Total Volume',
                  valText: formatRupiah(filteredStats.trading.totalVolume, true),
                  sub: 'volume trading', subColor: 'text-slate-500',
                },
                {
                  icon: <CurrencyDollar className="w-5 h-5 text-emerald-400" weight="duotone" />,
                  bg: 'bg-green-500/15', label: 'Net Flow',
                  valText: formatRupiah(filteredStats.financial.netFlow, true),
                  valColor: filteredStats.financial.netFlow >= 0 ? 'text-emerald-400' : 'text-red-400',
                  sub: filteredStats.financial.netFlow >= 0 ? '▲ positif' : '▼ negatif',
                  subColor: filteredStats.financial.netFlow >= 0 ? 'text-emerald-400' : 'text-red-400',
                },
              ].map((s, i) => (
                <motion.div key={i} className="stat-card flex items-center gap-4" variants={fadeUp}
                  whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', transition: { duration: 0.2 } }}>
                  <div className={`stat-icon w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    {s.icon}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-0.5">{s.label}</div>
                    <div className={`text-lg font-bold ${(s as any).valColor ?? 'text-slate-100'}`}>
                      {(s as any).val != null ? <CountUp to={(s as any).val} /> : (s as any).valText}
                    </div>
                    <div className={`text-xs ${s.subColor} mt-0.5`}>{s.sub}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </Reveal>

          {/* ── Ringkasan Keuangan ── */}
          <Reveal className="glass-card rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-100">Ringkasan Keuangan</h2>
              <span className="text-xs text-slate-300 capitalize glass-sub px-2.5 py-1 rounded-full">
                {accountFilter} account
              </span>
            </div>
            <motion.div className="grid grid-cols-3 gap-4"
              variants={stagger(0.07)} initial="hidden" animate="visible">
              {[
                { label: 'Total Deposit',    val: filteredStats.financial.totalDeposits,    color: 'text-emerald-400',  bg: 'bg-green-500/8',  border: 'border-white/8',  icon: <ArrowUpRight className="w-4 h-4 text-emerald-400" weight="bold" /> },
                { label: 'Total Withdrawal', val: filteredStats.financial.totalWithdrawals,  color: 'text-red-400',    bg: 'bg-red-500/8',    border: 'border-white/8',    icon: <ArrowLineUp  className="w-4 h-4 text-red-400"   weight="bold" /> },
                { label: 'Total Profit',     val: filteredStats.trading.totalProfit,         color: 'text-indigo-400', bg: 'bg-indigo-500/8', border: 'border-white/8', icon: <TrendUp      className="w-4 h-4 text-indigo-400" weight="bold" /> },
              ].map(({ label, val, color, bg, border, icon }) => (
                <motion.div key={label} variants={fadeUp}
                  className={`glass-sub rounded-xl p-4 ${bg} ${border}`}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    {icon}
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                  <div className={`text-base font-bold ${color}`}>{formatRupiah(val, true)}</div>
                </motion.div>
              ))}
            </motion.div>
          </Reveal>

          {/* ── Menu Cepat ── */}
          <div className="mb-6">
            <motion.h2 className="text-sm font-semibold text-slate-100 mb-3"
              variants={fadeLeft} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              Menu Cepat
            </motion.h2>
            <motion.div className="grid grid-cols-2 md:grid-cols-3 gap-3"
              variants={stagger(0.05)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
              {quickActions.map((action, idx) => {
                const c = colorMap[action.color]
                const Icon = action.icon
                return (
                  <motion.div key={idx} variants={fadeUp}
                    whileHover={{ y: -3, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.97 }}>
                    <Link href={action.href}
                      className={`group relative block glass-card rounded-2xl p-3 ${c.glowHover ?? ""}`}>
                      <div className="flex items-center gap-3">
                        <motion.div className={`w-10 h-10 ${c.bg} rounded-lg flex items-center justify-center flex-shrink-0`}
                          whileHover={{ scale: 1.12, rotate: 6 }} transition={{ duration: 0.2 }}>
                          <Icon className={`w-5 h-5 ${c.icon}`} weight="duotone" />
                        </motion.div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors truncate">
                            {action.title}
                          </h3>
                          <p className="text-xs text-slate-500 truncate">{action.description}</p>
                        </div>
                        <CaretRight className="w-4 h-4 text-white/20 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition-all flex-shrink-0" weight="bold" />
                      </div>
                      {action.badge && action.badge > 0 && (
                        <motion.div
                          className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 bg-red-500/80 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow"
                          initial={{ scale: 0 }} animate={{ scale: 1 }}
                          transition={{ ...SPRING, delay: 0.3 + idx * 0.04 }}>
                          {action.badge}
                        </motion.div>
                      )}
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>

          {/* ── System Health ── */}
          <Reveal className="glass-card rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-100">System Health</h2>
              <Link href="/admin/users"
                className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1 transition-colors">
                Lihat Semua <CaretRight className="w-3 h-3" weight="bold" />
              </Link>
            </div>
            <motion.div className="grid grid-cols-4 gap-3"
              variants={stagger(0.07)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {[
                { label: 'Active Rate',   val: Math.round((stats.users.active / stats.users.total) * 100), suffix: '%', color: 'text-indigo-400', bg: 'bg-indigo-500/8',  border: 'border-white/8' },
                { label: 'Win Rate',      val: filteredStats.trading.winRate,                               suffix: '%', color: 'text-emerald-400',  bg: 'bg-green-500/8',  border: 'border-white/8' },
                { label: 'Active Orders', val: filteredStats.trading.activeOrders,                          suffix: '',  color: 'text-purple-400', bg: 'bg-purple-500/8', border: 'border-white/8' },
                { label: 'Admins',        val: stats.users.admins,                                          suffix: '',  color: 'text-orange-400', bg: 'bg-orange-500/8', border: 'border-white/8' },
              ].map(({ label, val, suffix, color, bg, border }) => (
                <motion.div key={label} variants={fadeUp}
                  className={`glass-sub text-center p-3 rounded-xl ${bg} ${border}`}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                  <div className={`text-2xl font-bold ${color} mb-0.5`}>
                    <CountUp to={val} suffix={suffix} />
                  </div>
                  <div className="text-xs text-slate-500 leading-tight">{label}</div>
                </motion.div>
              ))}
            </motion.div>
          </Reveal>

          {/* ── Request Penarikan ── */}
          {stats?.withdrawal && (
            <Reveal className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-100">Request Penarikan</h2>
                <Link href="/admin/withdrawals"
                  className="text-xs text-red-300 hover:text-red-200 flex items-center gap-1 transition-colors">
                  Kelola <CaretRight className="w-3 h-3" weight="bold" />
                </Link>
              </div>
              <motion.div className="grid grid-cols-4 gap-3 mb-3"
                variants={stagger(0.07)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                {[
                  { label: 'Pending',  val: stats.withdrawal?.pending   ?? 0, color: 'text-yellow-400', bg: 'bg-yellow-500/10', urgent: (stats.withdrawal?.pending ?? 0) > 0 },
                  { label: 'Approved', val: stats.withdrawal?.approved  ?? 0, color: 'text-blue-400',   bg: 'bg-blue-500/10',   urgent: false },
                  { label: 'Selesai',  val: stats.withdrawal?.completed ?? 0, color: 'text-emerald-400', bg: 'bg-green-500/10', urgent: false },
                  { label: 'Ditolak', val: stats.withdrawal?.rejected  ?? 0, color: 'text-red-400',    bg: 'bg-red-500/10',    urgent: false },
                ].map(({ label, val, color, bg, urgent }) => (
                  <motion.div key={label} variants={fadeUp}
                    className={`glass-sub text-center p-3 ${bg} rounded-xl ${urgent ? 'ring-2 ring-yellow-400/50 ring-offset-transparent' : ''}`}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                    <div className={`text-2xl font-bold ${color} mb-0.5`}>
                      <CountUp to={val} />
                    </div>
                    <div className="text-xs text-slate-500 leading-tight">{label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {(stats.withdrawal?.totalAmount ?? 0) > 0 && (
                <motion.div
                  className="flex items-center justify-between p-3 glass-sub rounded-xl"
                  variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <span className="text-xs text-slate-400">Total Ditarik</span>
                  <span className="text-base font-bold text-red-400">
                    {formatRupiah(stats.withdrawal?.totalAmount ?? 0, true)}
                  </span>
                </motion.div>
              )}
            </Reveal>
          )}

        </div>
      </div>
    </>
  )
}