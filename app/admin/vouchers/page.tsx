// app/admin/vouchers/page.tsx 
'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import CreateVoucherModal from '@/components/CreateVoucherModal'
import { Voucher, VoucherStatistics } from '@/types'
import { 
  Tag, Plus, PencilSimple, Trash, ChartBar, MagnifyingGlass,
  ArrowsClockwise, CheckCircle, XCircle, Calendar, Users, CurrencyDollar,
  TrendUp, Warning, Info, X
} from 'phosphor-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { motion, type Variants } from 'framer-motion'

interface VoucherWithStats extends Voucher {
  statistics?: { totalUsed: number; totalBonusGiven: number; remainingUses: number | null }
}

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
        radial-gradient(ellipse 80% 60% at 10% 20%, rgba(139,92,246,0.13) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 85% 10%, rgba(99,102,241,0.12) 0%, transparent 55%),
        radial-gradient(ellipse 70% 60% at 70% 80%, rgba(250,204,21,0.07) 0%, transparent 55%),
        radial-gradient(ellipse 50% 40% at 20% 85%, rgba(16,185,129,0.07) 0%, transparent 50%);
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
    .glass-modal {
      background: rgba(6,9,24,0.92);
      backdrop-filter: blur(28px) saturate(180%);
      -webkit-backdrop-filter: blur(28px) saturate(180%);
      border: 1px solid rgba(255,255,255,0.10);
    }
  `}</style>
)

// ── Motion primitives ──────────────────────────────────────────
const SPRING = { type: 'spring', stiffness: 80, damping: 20 } as const
const fadeUp: Variants = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { ...SPRING } } }
const fadeLeft: Variants = { hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { ...SPRING } } }
const scaleIn: Variants = { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1, transition: { ...SPRING } } }
const stagger = (d = 0.06): Variants => ({ hidden: {}, visible: { transition: { staggerChildren: d, delayChildren: 0.04 } } })

function Reveal({ children, variants = fadeUp, delay = 0, className = '' }: {
  children: React.ReactNode; variants?: Variants; delay?: number; className?: string
}) {
  return (
    <motion.div className={className} variants={variants} initial="hidden"
      whileInView="visible" viewport={{ once: true, margin: '-60px' }} transition={{ delay }}>
      {children}
    </motion.div>
  )
}

function AnimatedHeadline({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.h1 className={className} style={style} variants={stagger(0.07)} initial="hidden" animate="visible">
      {text.split(' ').map((word, i) => (
        <motion.span key={i}
          variants={{ hidden: { opacity: 0, y: 30, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...SPRING } } }}
          className="inline-block mr-[0.25em]">{word}
        </motion.span>
      ))}
    </motion.h1>
  )
}

function CountUp({ to }: { to: number }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [val, setVal] = React.useState(0)
  const triggered = React.useRef(false)
  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || triggered.current) return
      triggered.current = true
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / 900, 1)
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * to))
        if (p < 1) requestAnimationFrame(tick)
        else setVal(to)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [to])
  return <span ref={ref}>{val}</span>
}

export default function VoucherManagementPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [vouchers, setVouchers] = useState<VoucherWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [voucherStats, setVoucherStats] = useState<VoucherStatistics | null>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) { router.push('/dashboard'); return }
    loadVouchers()
  }, [user, router, filterActive, currentPage])

  const loadVouchers = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      setLoading(true)
      const options: any = { page: currentPage, limit: 20 }
      if (filterActive !== 'all') options.isActive = filterActive === 'active'
      const response: any = await api.getAllVouchers(options)
      let vouchersData: Voucher[] = []
      let paginationData: any = null
      if (response?.data) {
        if (response.data.data?.vouchers && Array.isArray(response.data.data.vouchers)) { vouchersData = response.data.data.vouchers; paginationData = response.data.data.pagination }
        else if (response.data.vouchers && Array.isArray(response.data.vouchers)) { vouchersData = response.data.vouchers; paginationData = response.data.pagination }
        else if (Array.isArray(response.data)) vouchersData = response.data
      } else if (response?.vouchers && Array.isArray(response.vouchers)) { vouchersData = response.vouchers; paginationData = response.pagination }
      setVouchers(vouchersData)
      setLastUpdated(new Date())
      setTotalPages(paginationData?.totalPages || 1)
    } catch (error: any) {
      if (error.response?.status === 401) { toast.error('Autentikasi gagal'); router.push('/') }
      else if (error.response?.status === 403) { toast.error('Akses ditolak'); router.push('/dashboard') }
      else toast.error(error.message || 'Gagal memuat voucher')
      setVouchers([])
    } finally { setLoading(false); if (showRefreshing) setRefreshing(false) }
  }

  const loadVoucherStatistics = async (voucherId: string) => {
    try {
      const response: any = await api.getVoucherStatistics(voucherId)
      let statsData: VoucherStatistics | null = null
      if (response?.data?.data?.voucher && response?.data?.data?.statistics) statsData = response.data.data
      else if (response?.data?.voucher && response?.data?.statistics) statsData = response.data
      else if (response?.voucher && response?.statistics) statsData = response as VoucherStatistics
      if (statsData) { setVoucherStats(statsData); setShowStatsModal(true) }
      else toast.error('Data statistik tidak tersedia')
    } catch (error: any) { toast.error(error.message || 'Gagal memuat statistik voucher') }
  }

  const handleDeleteVoucher = async (voucherId: string) => {
    if (user?.role !== 'super_admin') { toast.error('Hanya Super Admin yang dapat menghapus voucher'); return }
    if (!confirm('Apakah Anda yakin ingin menghapus voucher ini?')) return
    try { await api.deleteVoucher(voucherId); toast.success('Voucher berhasil dihapus'); loadVouchers() }
    catch (error: any) { toast.error(error.message || 'Gagal menghapus voucher') }
  }

  const handleModalSuccess = () => loadVouchers()

  const getStatusBadge = (voucher: Voucher) => {
    const now = new Date(); const validFrom = new Date(voucher.validFrom); const validUntil = new Date(voucher.validUntil)
    if (!voucher.isActive) return <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-white/5 text-slate-400 border border-white/10 flex items-center gap-1"><XCircle className="w-3 h-3" weight="duotone" />Nonaktif</span>
    if (now < validFrom) return <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1"><Calendar className="w-3 h-3" weight="duotone" />Terjadwal</span>
    if (now > validUntil) return <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1"><Warning className="w-3 h-3" weight="duotone" />Kadaluarsa</span>
    if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) return <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1"><Warning className="w-3 h-3" weight="duotone" />Batas Tercapai</span>
    return <span className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1"><CheckCircle className="w-3 h-3" weight="duotone" />Aktif</span>
  }

  const filteredVouchers = vouchers.filter(v => !searchQuery || v.code.toLowerCase().includes(searchQuery.toLowerCase()) || v.description?.toLowerCase().includes(searchQuery.toLowerCase()))

  if (loading && vouchers.length === 0) return (
    <>
      <GlobalStyles />
      <div className="bg-pattern-grid min-h-screen"><Navbar />
        <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
          <div className="animate-pulse mb-8">
            <div className="h-4 bg-white/10 rounded w-48 mb-3"></div>
            <div className="h-8 bg-white/10 rounded w-64 mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-48"></div>
          </div>
          <div className="glass-card rounded-2xl p-5 mb-6">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
                  <div><div className="h-3 bg-white/10 rounded w-16 mb-1"></div><div className="h-5 bg-white/10 rounded w-10"></div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )

  return (
    <>
      <GlobalStyles />
      <div className="bg-pattern-grid min-h-screen relative">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">

          {/* ── Header ── */}
          <motion.div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            initial="hidden" animate="visible" variants={stagger(0.1)}>
            <motion.div variants={fadeLeft}>
              <motion.div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1" variants={fadeUp}>
                <span>Dasbor</span><span>/</span><span>Admin</span><span>/</span>
                <span className="text-slate-100 font-medium">Voucher</span>
              </motion.div>
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-9 h-9 bg-gradient-to-br from-violet-400/80 to-indigo-500/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/30 border border-white/20"
                  whileHover={{ rotate: 90, scale: 1.1 }} transition={{ ...SPRING }}>
                  <Tag className="w-5 h-5 text-white" weight="duotone" />
                </motion.div>
                <div>
                  <AnimatedHeadline text="Manajemen Voucher" className="text-2xl sm:text-3xl font-bold text-slate-100" style={{ letterSpacing: '-0.03em' }} />
                  <motion.p className="text-slate-400 text-sm mt-0.5" variants={fadeUp}>
                    {lastUpdated ? `Diperbarui ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Buat dan kelola voucher deposit'}
                  </motion.p>
                </div>
              </div>
            </motion.div>
            <motion.div className="flex items-center gap-2" variants={scaleIn}>
              <motion.button onClick={() => loadVouchers(true)} disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 glass-input rounded-xl text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <ArrowsClockwise className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} weight="bold" />
                <span className="hidden sm:inline">{refreshing ? 'Memperbarui...' : 'Perbarui'}</span>
              </motion.button>
              <motion.button onClick={() => { setEditingVoucher(null); setShowCreateModal(true) }}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-500/20"
                whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(139,92,246,0.4)' }} whileTap={{ scale: 0.96 }}>
                <Plus className="w-4 h-4" weight="bold" />
                Buat Voucher
              </motion.button>
            </motion.div>
          </motion.div>

          {/* ── Stats ── */}
          <Reveal className="glass-card rounded-2xl p-5 mb-6">
            <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6" variants={stagger(0.07)} initial="hidden" animate="visible">
              {[
                { icon: <Tag className="w-5 h-5 text-violet-400" weight="duotone" />, bg: 'bg-violet-500/15', label: 'Total Voucher', val: vouchers.length, color: 'text-slate-100' },
                { icon: <CheckCircle className="w-5 h-5 text-green-400" weight="duotone" />, bg: 'bg-green-500/15', label: 'Aktif', val: vouchers.filter(v => v.isActive).length, color: 'text-green-400' },
                { icon: <Users className="w-5 h-5 text-blue-400" weight="duotone" />, bg: 'bg-blue-500/15', label: 'Total Penggunaan', val: vouchers.reduce((s, v) => s + v.usedCount, 0), color: 'text-blue-400' },
                { icon: <CurrencyDollar className="w-5 h-5 text-yellow-400" weight="duotone" />, bg: 'bg-yellow-500/15', label: 'Total Bonus', val: vouchers.reduce((s, v) => s + (v.value * v.usedCount), 0), color: 'text-yellow-400', currency: true },
              ].map((s, i) => (
                <motion.div key={i} className="flex items-center gap-3" variants={fadeUp} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                  <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-0.5">{s.label}</div>
                    <div className={`text-lg font-bold ${s.color}`}>
                      {s.currency ? formatCurrency(s.val) : <CountUp to={s.val} />}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </Reveal>

          {/* ── Filters ── */}
          <motion.div className="flex flex-col sm:flex-row gap-3 mb-6"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.15 }}>
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" weight="bold" />
              <input type="text" placeholder="Cari kode atau deskripsi..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 glass-input rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-all" />
            </div>
            <div className="flex gap-1 glass-input rounded-xl p-1">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'active', label: 'Aktif' },
                { id: 'inactive', label: 'Nonaktif' },
              ].map(({ id, label }) => (
                <button key={id} onClick={() => { setFilterActive(id as any); setCurrentPage(1) }}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterActive === id ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                  {filterActive === id && <motion.div className="absolute inset-0 rounded-lg bg-violet-600 shadow-md" layoutId="voucherFilter" transition={{ ...SPRING }} />}
                  <span className="relative z-10">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Vouchers List ── */}
          {filteredVouchers.length === 0 ? (
            <Reveal className="glass-card rounded-2xl p-12 text-center">
              <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-violet-500/20">
                <Tag className="w-7 h-7 text-violet-400" weight="duotone" />
              </div>
              <h3 className="text-base font-semibold text-slate-100 mb-2">Tidak ada voucher</h3>
              <p className="text-sm text-slate-400 mb-5">{searchQuery ? 'Coba ubah kata kunci pencarian' : 'Mulai dengan membuat voucher pertama Anda'}</p>
              {!searchQuery && (
                <motion.button onClick={() => { setEditingVoucher(null); setShowCreateModal(true) }}
                  className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-semibold transition-all"
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  Buat Voucher Pertama
                </motion.button>
              )}
            </Reveal>
          ) : (
            <motion.div className="space-y-3" variants={stagger(0.05)} initial="hidden" animate="visible">
              {filteredVouchers.map((voucher) => (
                <motion.div key={voucher.id} variants={fadeUp} className="glass-card rounded-2xl p-5"
                  whileHover={{ y: -1, transition: { duration: 0.15 } }}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="text-xl font-bold text-slate-100 tracking-tight">{voucher.code}</span>
                        {getStatusBadge(voucher)}
                      </div>
                      {voucher.description && <p className="text-sm text-slate-400 mb-3">{voucher.description}</p>}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5">
                          <CurrencyDollar className="w-3.5 h-3.5 text-slate-500" weight="duotone" />
                          <span className="text-slate-300">{voucher.type === 'percentage' ? `${voucher.value}% Bonus` : `${formatCurrency(voucher.value)} Tetap`}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendUp className="w-3.5 h-3.5 text-slate-500" weight="duotone" />
                          <span className="text-slate-300">Min: {formatCurrency(voucher.minDeposit)}</span>
                        </div>
                        {voucher.type === 'percentage' && voucher.maxBonusAmount && (
                          <div className="flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5 text-slate-500" weight="duotone" />
                            <span className="text-slate-300">Max: {formatCurrency(voucher.maxBonusAmount)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-slate-500" weight="duotone" />
                          <span className="text-slate-300">{voucher.eligibleStatuses.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <motion.button onClick={() => loadVoucherStatistics(voucher.id)}
                        className="p-2 glass-sub hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-all" title="Statistik"
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                        <ChartBar className="w-4 h-4" weight="duotone" />
                      </motion.button>
                      <motion.button onClick={() => { setEditingVoucher(voucher); setShowCreateModal(true) }}
                        className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-all border border-indigo-500/20" title="Edit"
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                        <PencilSimple className="w-4 h-4" weight="duotone" />
                      </motion.button>
                      {user?.role === 'super_admin' && (
                        <motion.button onClick={() => handleDeleteVoucher(voucher.id)}
                          className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all border border-red-500/20" title="Hapus"
                          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                          <Trash className="w-4 h-4" weight="duotone" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/8">
                    <div className="flex items-center gap-5 text-sm">
                      <div>
                        <span className="text-slate-500">Digunakan: </span>
                        <span className="font-semibold text-slate-100">{voucher.usedCount}{voucher.maxUses && ` / ${voucher.maxUses}`}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Per Pengguna: </span>
                        <span className="font-semibold text-slate-100">{voucher.maxUsesPerUser}</span>
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 text-right">
                      <div>Mulai: {formatDate(voucher.validFrom)}</div>
                      <div>Sampai: {formatDate(voucher.validUntil)}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <Reveal className="mt-6 flex items-center justify-center gap-2">
              <motion.button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-4 py-2 glass-input rounded-xl text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Sebelumnya</motion.button>
              <span className="px-4 py-2 text-sm text-slate-400">Halaman {currentPage} dari {totalPages}</span>
              <motion.button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="px-4 py-2 glass-input rounded-xl text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm font-medium"
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Selanjutnya</motion.button>
            </Reveal>
          )}
        </div>

        {/* ── Create/Edit Modal ── */}
        {showCreateModal && (
          <CreateVoucherModal
            onClose={() => { setShowCreateModal(false); setEditingVoucher(null) }}
            onSuccess={handleModalSuccess}
            voucher={editingVoucher}
          />
        )}

        {/* ── Statistics Modal ── */}
        {showStatsModal && voucherStats && (
          <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowStatsModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div className="w-full max-w-2xl glass-modal rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ ...SPRING }}>
                <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 glass-modal z-10">
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 bg-violet-500/20 rounded-lg flex items-center justify-center">
                      <ChartBar className="w-4 h-4 text-violet-400" weight="duotone" />
                    </div>
                    Statistik Voucher
                  </h2>
                  <button onClick={() => { setShowStatsModal(false); setVoucherStats(null) }}
                    className="w-8 h-8 flex items-center justify-center glass-sub rounded-lg text-slate-400 hover:text-white transition-all">
                    <X className="w-4 h-4" weight="bold" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="glass-sub rounded-xl p-4">
                    <div className="text-2xl font-bold text-slate-100 mb-1">{voucherStats.voucher.code}</div>
                    <div className="text-sm text-slate-400">
                      {voucherStats.voucher.type === 'percentage' ? `${voucherStats.voucher.value}% Bonus` : `${formatCurrency(voucherStats.voucher.value)} Bonus Tetap`}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Total Digunakan', val: voucherStats.statistics.totalUsed, color: 'blue', sub: voucherStats.statistics.remainingUses !== null ? `${voucherStats.statistics.remainingUses} tersisa` : null },
                      { label: 'Total Bonus Diberikan', val: formatCurrency(voucherStats.statistics.totalBonusGiven), color: 'green' },
                      { label: 'Total Deposit', val: formatCurrency(voucherStats.statistics.totalDepositAmount), color: 'cyan' },
                      { label: 'Rata-rata Bonus', val: formatCurrency(voucherStats.statistics.averageBonus), color: 'orange' },
                    ].map((item, i) => (
                      <div key={i} className={`bg-${item.color}-500/10 rounded-xl p-4 border border-${item.color}-500/20`}>
                        <div className={`text-sm text-${item.color}-400 mb-1`}>{item.label}</div>
                        <div className="text-xl font-bold text-slate-100">{item.val}</div>
                        {item.sub && <div className={`text-xs text-${item.color}-400 mt-1`}>{item.sub}</div>}
                      </div>
                    ))}
                  </div>
                  {voucherStats.recentUsages && voucherStats.recentUsages.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-slate-100 mb-3">Penggunaan Terbaru</p>
                      <div className="space-y-2">
                        {voucherStats.recentUsages.map((usage) => (
                          <div key={usage.id} className="glass-sub rounded-xl p-3 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-200">{usage.userEmail}</span>
                              <span className="text-xs text-slate-500">{formatDate(usage.usedAt)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>Deposit: {formatCurrency(usage.depositAmount)}</span>
                              <span className="text-green-400 font-semibold">+{formatCurrency(usage.bonusAmount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </>
  )
}