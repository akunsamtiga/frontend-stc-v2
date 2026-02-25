// app/admin/assets/page.tsx
'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import AssetFormModal from '@/components/admin/AssetFormModal'
import AssetDetailModal from '@/components/admin/AssetDetailModal'
import DeleteConfirmModal from '@/components/admin/DeleteConfirmModal'
import { 
  Package, 
  Plus, 
  PencilSimple, 
  Trash,
  CheckCircle,
  XCircle,
  Activity,
  Eye,
  Lightning,
  CurrencyCircleDollar,
  ArrowsClockwise
} from 'phosphor-react'
import { toast } from 'sonner'
import { TimezoneUtil } from '@/lib/utils'
import type { Asset } from '@/types'
import { motion, type Variants } from 'framer-motion'

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
        radial-gradient(ellipse 80% 60% at 10% 20%, rgba(99,102,241,0.16) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 85% 10%, rgba(16,185,129,0.10) 0%, transparent 55%),
        radial-gradient(ellipse 70% 60% at 70% 80%, rgba(6,182,212,0.08) 0%, transparent 55%),
        radial-gradient(ellipse 50% 40% at 20% 85%, rgba(245,158,11,0.07) 0%, transparent 50%);
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
    .stat-card { transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease; }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-icon { transition: transform 0.2s ease; }
    .stat-card:hover .stat-icon { transform: scale(1.12); }
    .glow-indigo { box-shadow: 0 0 20px rgba(99,102,241,0.25), var(--glass-shadow); }
    .glow-green  { box-shadow: 0 0 20px rgba(16,185,129,0.20), var(--glass-shadow); }
    .glow-red    { box-shadow: 0 0 20px rgba(239,68,68,0.20),  var(--glass-shadow); }
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
      border: 1px solid rgba(255,255,255,0.10);
    }
  `}</style>
)

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
const stagger = (d = 0.06): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: d, delayChildren: 0.04 } },
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

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
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
        const ease = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(ease * to))
        if (p < 1) requestAnimationFrame(tick)
        else setVal(to)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [to])
  return <span ref={ref}>{val.toLocaleString('id-ID')}{suffix}</span>
}

const StatCardSkeleton = () => (
  <div className="bg-white/5 rounded-xl p-3 border border-white/10 animate-pulse">
    <div className="h-3 bg-white/10 rounded w-12 mb-2"></div>
    <div className="h-6 bg-white/10 rounded w-10"></div>
  </div>
)

const AssetCardSkeleton = () => (
  <div className="bg-white/5 border border-white/10 rounded-xl p-3 animate-pulse">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white/10 rounded-xl flex-shrink-0"></div>
      <div className="flex-1">
        <div className="h-4 bg-white/10 rounded w-32 mb-2"></div>
        <div className="h-3 bg-white/10 rounded w-48"></div>
      </div>
      <div className="flex gap-1">
        <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
        <div className="w-8 h-8 bg-white/10 rounded-lg"></div>
      </div>
    </div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="bg-pattern-grid min-h-screen relative">
    <GlobalStyles />
    <Navbar />
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-5 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-40 mb-1.5"></div>
        <div className="h-3 bg-white/10 rounded w-56"></div>
      </div>
      <div className="grid grid-cols-4 gap-2 mb-5">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => <AssetCardSkeleton key={i} />)}
      </div>
    </div>
  </div>
)

export default function AdminAssetsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'normal' | 'crypto'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    if (user.role !== 'super_admin' && user.role !== 'admin') { router.push('/trading'); return }
    loadAssets()
  }, [user, router])

  const loadAssets = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      setLoading(true)
      const response = await api.getAssets(false)
      const assetData = response?.data || response
      setAssets(assetData.assets || [])
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Gagal memuat aset:', error)
      toast.error('Gagal memuat aset')
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  const handleRefresh       = () => loadAssets(true)
  const handleCreate        = () => { setSelectedAsset(null); setShowCreateModal(true) }
  const handleEdit          = (a: Asset) => { setSelectedAsset(a); setShowEditModal(true) }
  const handleViewDetail    = (a: Asset) => { setSelectedAsset(a); setShowDetailModal(true) }
  const handleDelete        = (a: Asset) => { setSelectedAsset(a); setShowDeleteModal(true) }
  const handleCreateSuccess = () => { setShowCreateModal(false); loadAssets(); toast.success('Aset berhasil dibuat') }
  const handleEditSuccess   = () => { setShowEditModal(false); loadAssets(); toast.success('Aset berhasil diperbarui') }

  const handleDeleteConfirm = async () => {
    if (!selectedAsset) return
    try {
      await api.deleteAsset(selectedAsset.id)
      setShowDeleteModal(false)
      setSelectedAsset(null)
      loadAssets()
      toast.success('Aset berhasil dihapus')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal menghapus aset')
    }
  }

  const getAssetCategory = (a: Asset): 'normal' | 'crypto' => a.category || 'normal'

  const filteredAssets = assets.filter((a) => {
    if (categoryFilter !== 'all' && getAssetCategory(a) !== categoryFilter) return false
    if (statusFilter === 'active' && !a.isActive) return false
    if (statusFilter === 'inactive' && a.isActive) return false
    return true
  })

  const stats = {
    total:     assets.length,
    active:    assets.filter(a => a.isActive).length,
    crypto:    assets.filter(a => getAssetCategory(a) === 'crypto').length,
    ultraFast: assets.filter(a => a.tradingSettings?.allowedDurations.includes(0.0167)).length,
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null
  if (loading && !refreshing) return <LoadingSkeleton />

  return (
    <>
      <GlobalStyles />
      <div className="bg-pattern-grid min-h-screen relative">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">

        {/* ── HEADER ── */}
        <motion.div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial="hidden" animate="visible" variants={stagger(0.1)}>
          <motion.div variants={fadeLeft}>
            <motion.div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1" variants={fadeUp}>
              <span>Dasbor</span><span>/</span><span>Admin</span><span>/</span>
              <span className="text-slate-100 font-medium">Aset</span>
            </motion.div>
            <div className="flex items-center gap-3">
              <motion.div
                className="w-9 h-9 bg-gradient-to-br from-indigo-400/80 to-emerald-500/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30 border border-white/20"
                whileHover={{ rotate: 90, scale: 1.1 }} transition={{ ...SPRING }}>
                <Package className="w-5 h-5 text-white" weight="duotone" />
              </motion.div>
              <div>
                <AnimatedHeadline
                  text="Manajemen Aset"
                  className="text-2xl sm:text-3xl font-bold text-slate-100"
                  style={{ letterSpacing: '-0.03em' }}
                />
                <motion.p className="text-slate-400 text-sm mt-0.5" variants={fadeUp}>
                  {lastUpdated ? `Diperbarui ${TimezoneUtil.formatDateTime(lastUpdated)}` : 'Konfigurasi aset trading dan pengaturan'}
                </motion.p>
              </div>
            </div>
          </motion.div>
          <motion.div variants={scaleIn} className="flex items-center gap-2">
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 glass-input rounded-xl text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            >
              <ArrowsClockwise className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} weight="bold" />
              {refreshing ? 'Memperbarui...' : 'Perbarui'}
            </motion.button>
            <motion.button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
              whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(99,102,241,0.4)' }} whileTap={{ scale: 0.96 }}
            >
              <Plus className="w-4 h-4" weight="bold" />
              Tambah Aset
            </motion.button>
          </motion.div>
        </motion.div>

        {/* ── STATS — 4 kolom, 1 baris ── */}
        <Reveal className="glass-card rounded-2xl p-5 mb-6">
          <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
            variants={stagger(0.08)} initial="hidden" animate="visible">
            {[
              { label: 'Total',      value: stats.total,     color: 'text-slate-100',  iconBg: 'bg-blue-500/15',   icon: <Package              className="w-5 h-5 text-blue-400"    weight="duotone" /> },
              { label: 'Aktif',      value: stats.active,    color: 'text-emerald-400', iconBg: 'bg-green-500/15',  icon: <CheckCircle          className="w-5 h-5 text-emerald-400"   weight="duotone" /> },
              { label: 'Crypto',     value: stats.crypto,    color: 'text-orange-400', iconBg: 'bg-orange-500/15', icon: <CurrencyCircleDollar className="w-5 h-5 text-orange-400"  weight="duotone" /> },
              { label: 'Ultra-Fast', value: stats.ultraFast, color: 'text-yellow-400', iconBg: 'bg-yellow-500/15', icon: <Lightning            className="w-5 h-5 text-yellow-400"  weight="duotone" /> },
            ].map((s) => (
              <motion.div key={s.label} className="flex items-center gap-4" variants={fadeUp}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                <div className={`w-10 h-10 ${s.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-0.5">{s.label}</div>
                  <div className={`text-lg font-bold ${s.color}`}><CountUp to={s.value} /></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* ── FILTERS ── */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {/* Filter Kategori */}
          <div className="flex items-center gap-0.5 glass-input rounded-xl p-1">
            {(['all', 'normal', 'crypto'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  categoryFilter === cat
                    ? cat === 'crypto' ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'Semua' : cat === 'normal' ? 'Normal' : 'Crypto'}
              </button>
            ))}
          </div>

          {/* Filter Status */}
          <div className="flex items-center gap-0.5 glass-input rounded-xl p-1">
            {(['all', 'active', 'inactive'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                  statusFilter === st
                    ? st === 'active' ? 'bg-green-600 text-white shadow-sm'
                      : st === 'inactive' ? 'bg-slate-600 text-white shadow-sm'
                      : 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st === 'all' ? 'Semua' : st === 'active' ? 'Aktif' : 'Nonaktif'}
              </button>
            ))}
          </div>

          <span className="ml-auto text-sm text-slate-500">
            {filteredAssets.length} / {assets.length} aset
          </span>
        </div>

        {/* ── ASSET LIST ── */}
        {loading ? (
          <div className="text-center py-14">
            <ArrowsClockwise className="w-7 h-7 animate-spin text-slate-500 mx-auto mb-3" weight="bold" />
            <p className="text-sm text-slate-400">Memuat aset...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10">
            <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/10">
              <Package className="w-7 h-7 text-slate-500" weight="duotone" />
            </div>
            <p className="text-sm font-semibold text-white mb-1">
              {assets.length === 0 ? 'Belum ada aset' : 'Tidak ada hasil'}
            </p>
            <p className="text-sm text-slate-500 mb-5">
              {assets.length === 0 ? 'Tambahkan aset trading pertama' : 'Coba ubah filter pencarian'}
            </p>
            {/* DISABLED: Tombol Create Asset (empty state)
            {assets.length === 0 && user.role === 'super_admin' && (
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" weight="bold" />
                Tambah Aset
              </button>
            )}
            */}
          </div>
        ) : (
          <motion.div className="space-y-2"
            variants={stagger(0.04)} initial="hidden" animate="visible">
            {filteredAssets.map((asset) => {
              const hasUltraFast  = asset.tradingSettings?.allowedDurations.includes(0.0167)
              const assetCategory = getAssetCategory(asset)

              return (
                <motion.div
                  key={asset.id}
                  variants={fadeUp}
                  className="glass-card rounded-2xl overflow-hidden"
                  whileHover={{ y: -1, transition: { duration: 0.15 } }}
                >
                  {/* Baris utama */}
                  <div className="flex items-center gap-3 p-3">
                    {/* Ikon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      asset.isActive ? 'bg-green-500/10' : 'bg-white/5'
                    }`}>
                      <Package
                        className={`w-5 h-5 ${asset.isActive ? 'text-green-400' : 'text-slate-500'}`}
                        weight="duotone"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Baris nama */}
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-white">{asset.name}</span>
                        <span className="text-sm text-slate-500">({asset.symbol})</span>
                      </div>

                      {/* Baris badges & meta */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Status */}
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-sm font-semibold border ${
                          asset.isActive
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : 'bg-red-500/10   text-red-400   border-red-500/20'
                        }`}>
                          {asset.isActive
                            ? <><CheckCircle className="w-2.5 h-2.5" weight="fill" /> Aktif</>
                            : <><XCircle    className="w-2.5 h-2.5" weight="fill" /> Nonaktif</>
                          }
                        </span>

                        {/* Kategori */}
                        {assetCategory === 'crypto'
                          ? <span className="inline-flex items-center px-1.5 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded text-sm font-semibold">₿ Crypto</span>
                          : <span className="inline-flex items-center px-1.5 py-0.5 bg-blue-500/10   border border-blue-500/20   text-blue-400   rounded text-sm font-semibold">📊 Normal</span>
                        }

                        {/* Ultra-fast */}
                        {hasUltraFast && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded text-sm font-semibold">
                            <Lightning className="w-2.5 h-2.5" weight="fill" /> 1s
                          </span>
                        )}

                        {/* Profit */}
                        <span className="inline-flex items-center gap-0.5 text-sm text-slate-400">
                          <Activity className="w-3 h-3" weight="duotone" />
                          {asset.profitRate}%
                        </span>

                        {/* Data source — desktop only */}
                        <span className="text-sm text-slate-500 capitalize hidden sm:inline">{asset.dataSource}</span>

                        {/* Crypto pair */}
                        {asset.cryptoConfig && (
                          <span className="text-sm font-semibold text-slate-300">
                            {asset.cryptoConfig.baseCurrency}/{asset.cryptoConfig.quoteCurrency}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Tombol aksi */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleViewDetail(asset)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/20 transition-colors"
                        title="Detail"
                      >
                        <Eye className="w-4 h-4" weight="duotone" />
                      </button>
                      {user.role === 'super_admin' && (
                        <>
                          <button
                            onClick={() => handleEdit(asset)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors"
                            title="Edit"
                          >
                            <PencilSimple className="w-4 h-4" weight="duotone" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                            title="Hapus"
                          >
                            <Trash className="w-4 h-4" weight="duotone" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Baris bawah: info order */}
                  {asset.tradingSettings && (
                    <div className="flex items-center gap-0 border-t border-white/[0.06] divide-x divide-white/[0.06]">
                      {[
                        { label: 'Min', value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, notation: 'compact' }).format(asset.tradingSettings.minOrderAmount) },
                        { label: 'Max', value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, notation: 'compact' }).format(asset.tradingSettings.maxOrderAmount) },
                        { label: 'Durasi', value: `${asset.tradingSettings.allowedDurations.length} opsi` },
                      ].map((item) => (
                        <div key={item.label} className="flex-1 px-3 py-2 text-center">
                          <div className="text-sm text-slate-500 uppercase tracking-wide mb-0.5">{item.label}</div>
                          <div className="text-sm font-semibold text-slate-300">{item.value}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <AssetFormModal mode="create" onClose={() => setShowCreateModal(false)} onSuccess={handleCreateSuccess} />
      )}
      {showEditModal && selectedAsset && (
        <AssetFormModal mode="edit" asset={selectedAsset} onClose={() => setShowEditModal(false)} onSuccess={handleEditSuccess} />
      )}
      {showDetailModal && selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setShowDetailModal(false)}
          onEdit={user.role === 'super_admin' ? () => { setShowDetailModal(false); handleEdit(selectedAsset) } : undefined}
        />
      )}
      {showDeleteModal && selectedAsset && (
        <DeleteConfirmModal
          title="Hapus Aset"
          message={`Apakah Anda yakin ingin menghapus "${selectedAsset.name}"? Tindakan ini tidak dapat dibatalkan.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => { setShowDeleteModal(false); setSelectedAsset(null) }}
        />
      )}
    </div>
    </>
  )
}