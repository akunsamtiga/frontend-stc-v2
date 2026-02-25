'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { 
  Plus, 
  PencilSimple, 
  Trash, 
  Eye,
  EyeSlash,
  MagnifyingGlass,
  Funnel,
  X,
  CaretRight,
  ArrowsClockwise,
  Warning,
  Megaphone,
  Newspaper,
  Wrench,
  Sparkle,
  Bell,
  PushPin,
  CalendarBlank,
  Users as UsersIcon,
  Target,
} from 'phosphor-react'
import { 
  Information, 
  InformationType, 
  InformationPriority,
  GetInformationQuery,
} from '@/types'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { TimezoneUtil } from '@/lib/utils'
import InformationFormModal from '@/components/admin/InformationFormModal'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import Navbar from '@/components/Navbar'
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
        radial-gradient(ellipse 60% 50% at 85% 10%, rgba(139,92,246,0.12) 0%, transparent 55%),
        radial-gradient(ellipse 70% 60% at 70% 80%, rgba(6,182,212,0.08) 0%, transparent 55%),
        radial-gradient(ellipse 50% 40% at 20% 85%, rgba(168,85,247,0.07) 0%, transparent 50%);
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
      color: white;
    }
    .glass-input::placeholder { color: rgba(148,163,184,0.4); }
    .glass-input:focus { outline: none; border-color: rgba(99,102,241,0.5); }
    select.glass-input option { background: #0f1229; }
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

// ✅ Type helpers
const getInformationTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    announcement: 'Pengumuman',
    promotion: 'Promosi',
    news: 'Berita',
    maintenance: 'Maintenance',
    update: 'Update',
    warning: 'Peringatan',
  }
  return labels[type] || type
}

const getInformationTypeIcon = (type: string) => {
  const icons: Record<string, any> = {
    announcement: Megaphone,
    promotion: Sparkle,
    news: Newspaper,
    maintenance: Wrench,
    update: Bell,
    warning: Warning,
  }
  const Icon = icons[type] || Megaphone
  return <Icon className="w-6 h-6" weight="duotone" />
}

const getInformationTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    announcement: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    promotion: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    news: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    maintenance: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    update: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return colors[type] || colors.announcement
}

const getInformationPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: 'Rendah',
    medium: 'Sedang',
    high: 'Tinggi',
    urgent: 'Mendesak',
  }
  return labels[priority] || priority
}

const getInformationPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    high: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return colors[priority] || colors.medium
}

export default function AdminInformationPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  
  const [information, setInformation] = useState<Information[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // Filter & Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<InformationType | ''>('')
  const [filterPriority, setFilterPriority] = useState<InformationPriority | ''>('')
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [filterPinned, setFilterPinned] = useState<boolean | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal State
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingInfo, setEditingInfo] = useState<Information | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingInfo, setDeletingInfo] = useState<Information | null>(null)

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin')) {
      router.push('/login')
    }
  }, [isAuthenticated, user, router])

  // Fetch information
  const fetchInformation = async () => {
    try {
      setLoading(true)
      
      const query: GetInformationQuery = {
        page: currentPage,
        limit: 20,
        search: searchQuery || undefined,
        type: filterType || undefined,
        priority: filterPriority || undefined,
        isActive: filterActive,
        isPinned: filterPinned,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }
      
      const result = await api.getAllInformation(query)
      
      // ✅ Defensive check: Ensure result.items is an array
      const items = Array.isArray(result?.items) ? result.items : []
      const pages = result?.totalPages || 1
      const total = result?.total || 0
      
      console.log('📊 Information fetched:', { items: items.length, pages, total })
      
      setInformation(items)
      setTotalPages(pages)
      setTotalItems(total)
    } catch (error) {
      console.error('❌ Failed to fetch information:', error)
      toast.error('Gagal memuat data informasi')
      // Reset to safe defaults on error
      setInformation([])
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'super_admin')) {
      fetchInformation()
    }
  }, [currentPage, searchQuery, filterType, filterPriority, filterActive, filterPinned, isAuthenticated, user])

  // Handlers
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setFilterType('')
    setFilterPriority('')
    setFilterActive(undefined)
    setFilterPinned(undefined)
    setCurrentPage(1)
  }

  const handleCreate = () => {
    setEditingInfo(null)
    setShowFormModal(true)
  }

  const handleEdit = (info: Information) => {
    setEditingInfo(info)
    setShowFormModal(true)
  }

  const handleDelete = (info: Information) => {
    setDeletingInfo(info)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingInfo) return
    
    try {
      await api.deleteInformation(deletingInfo.id)
      toast.success('Informasi berhasil dihapus')
      setShowDeleteDialog(false)
      setDeletingInfo(null)
      fetchInformation()
    } catch (error) {
      console.error('Failed to delete information:', error)
      toast.error('Gagal menghapus informasi')
    }
  }

  const handleToggleStatus = async (info: Information) => {
    try {
      await api.toggleInformationStatus(info.id)
      toast.success(`Informasi ${info.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
      fetchInformation()
    } catch (error) {
      console.error('Failed to toggle status:', error)
      toast.error('Gagal mengubah status')
    }
  }

  const handleFormSuccess = () => {
    setShowFormModal(false)
    setEditingInfo(null)
    fetchInformation()
  }

  if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin')) {
    return null
  }

  const hasActiveFilters = searchQuery || filterType || filterPriority || filterActive !== undefined || filterPinned !== undefined

  return (
    <>
      <GlobalStyles />
      <div className="bg-pattern-grid min-h-screen relative">
      {/* Pattern Overlay removed - handled by CSS */}

      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <motion.div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial="hidden" animate="visible" variants={stagger(0.1)}>
          <motion.div variants={fadeLeft}>
            <motion.div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1" variants={fadeUp}>
              <span>Dasbor</span><span>/</span><span>Admin</span><span>/</span>
              <span className="text-slate-100 font-medium">Informasi</span>
            </motion.div>
            <div className="flex items-center gap-3">
              <motion.div
                className="w-9 h-9 bg-gradient-to-br from-pink-400/80 to-indigo-500/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-pink-500/30 border border-white/20"
                whileHover={{ rotate: 90, scale: 1.1 }} transition={{ ...SPRING }}>
                <Megaphone className="w-5 h-5 text-white" weight="duotone" />
              </motion.div>
              <div>
                <AnimatedHeadline
                  text="Kelola Informasi"
                  className="text-2xl sm:text-3xl font-bold text-slate-100"
                  style={{ letterSpacing: '-0.03em' }}
                />
                <motion.p className="text-slate-400 text-sm mt-0.5" variants={fadeUp}>
                  Buat dan kelola pengumuman, promosi, dan informasi untuk pengguna
                </motion.p>
              </div>
            </div>
          </motion.div>
          <motion.div variants={scaleIn} className="flex items-center gap-2">
            <motion.button
              onClick={fetchInformation}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 glass-input rounded-xl text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            >
              <ArrowsClockwise className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} weight="bold" />
              {loading ? 'Memuat...' : 'Perbarui'}
            </motion.button>
            <motion.button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-500/20"
              whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(99,102,241,0.4)' }} whileTap={{ scale: 0.96 }}
            >
              <Plus className="w-4 h-4" weight="bold" />
              Buat Baru
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Stats Summary */}
        <Reveal className="glass-card rounded-2xl p-5 mb-6">
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6"
            variants={stagger(0.07)} initial="hidden" animate="visible">
            {[
              { label: 'Total Informasi', value: totalItems, color: 'text-slate-100', icon: <Newspaper className="w-5 h-5 text-indigo-400" weight="duotone" />, bg: 'bg-indigo-500/15' },
              { label: 'Aktif', value: information.filter(i => i.isActive).length, color: 'text-emerald-400', icon: <Eye className="w-5 h-5 text-emerald-400" weight="duotone" />, bg: 'bg-green-500/15' },
              { label: 'Pinned', value: information.filter(i => i.isPinned).length, color: 'text-yellow-400', icon: <PushPin className="w-5 h-5 text-yellow-400" weight="duotone" />, bg: 'bg-yellow-500/15' },
              { label: 'Halaman', value: totalPages, color: 'text-purple-400', icon: <Target className="w-5 h-5 text-purple-400" weight="duotone" />, bg: 'bg-purple-500/15' },
            ].map((s) => (
              <motion.div key={s.label} className="flex items-center gap-3" variants={fadeUp}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
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

        {/* Actions Bar */}
        <motion.div className="glass-card rounded-2xl p-5 mb-6"
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.15 }}>
          <div className="flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" weight="bold" />
                <input
                  type="text"
                  placeholder="Cari judul atau deskripsi..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 glass-input rounded-lg transition-all"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  showFilters || hasActiveFilters
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'glass-sub hover:border-white/20 text-slate-300'
                }`}
              >
                <Funnel className="w-5 h-5" weight="bold" />
                <span className="hidden sm:inline">Filter</span>
                {hasActiveFilters && (
                  <span className="bg-white text-indigo-600 text-xs px-1.5 py-0.5 rounded-full font-bold">•</span>
                )}
              </button>
              
              <motion.button
                onClick={handleCreate}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-5 h-5" weight="bold" />
                <span className="hidden sm:inline">Buat Baru</span>
              </motion.button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <motion.div className="mt-4 pt-4 border-t border-white/10"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Type Filter */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Tipe</label>
                  <select
                    value={filterType}
                    onChange={(e) => { setFilterType(e.target.value as InformationType | ''); setCurrentPage(1) }}
                    className="w-full px-3 py-2 glass-input rounded-lg text-sm"
                  >
                    <option value="">Semua Tipe</option>
                    <option value="announcement">Pengumuman</option>
                    <option value="promotion">Promosi</option>
                    <option value="news">Berita</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="update">Update</option>
                    <option value="warning">Peringatan</option>
                  </select>
                </div>

                {/* Priority Filter */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Prioritas</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => { setFilterPriority(e.target.value as InformationPriority | ''); setCurrentPage(1) }}
                    className="w-full px-3 py-2 glass-input rounded-lg text-sm"
                  >
                    <option value="">Semua Prioritas</option>
                    <option value="low">Rendah</option>
                    <option value="medium">Sedang</option>
                    <option value="high">Tinggi</option>
                    <option value="urgent">Mendesak</option>
                  </select>
                </div>

                {/* Active Filter */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Status</label>
                  <select
                    value={filterActive === undefined ? '' : filterActive ? 'true' : 'false'}
                    onChange={(e) => {
                      setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 py-2 glass-input rounded-lg text-sm"
                  >
                    <option value="">Semua Status</option>
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>

                {/* Pinned Filter */}
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Pinned</label>
                  <select
                    value={filterPinned === undefined ? '' : filterPinned ? 'true' : 'false'}
                    onChange={(e) => {
                      setFilterPinned(e.target.value === '' ? undefined : e.target.value === 'true')
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 py-2 glass-input rounded-lg text-sm"
                  >
                    <option value="">Semua</option>
                    <option value="true">Ya</option>
                    <option value="false">Tidak</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                >
                  <X className="w-4 h-4" weight="bold" />
                  Reset Filter
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Information List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-3"></div>
            <p className="text-slate-400 text-sm">Memuat data...</p>
          </div>
        ) : !Array.isArray(information) || information.length === 0 ? (
          <motion.div className="glass-card rounded-2xl p-12 text-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Megaphone className="w-16 h-16 text-slate-600 mx-auto mb-4" weight="duotone" />
            <p className="text-slate-400 mb-4">
              {hasActiveFilters ? 'Tidak ada informasi yang sesuai dengan filter' : 'Belum ada informasi'}
            </p>
            {!hasActiveFilters && (
              <motion.button
                onClick={handleCreate}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all inline-flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-5 h-5" weight="bold" />
                Buat Informasi Pertama
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div className="space-y-3"
            variants={stagger(0.05)} initial="hidden" animate="visible">
            {Array.isArray(information) && information.map((info) => (
              <motion.div key={info.id} variants={fadeUp}
                whileHover={{ y: -1, transition: { duration: 0.15 } }}>
                <InformationCard
                  information={info}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleStatus={handleToggleStatus}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 glass-sub hover:border-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      currentPage === pageNum
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'glass-sub hover:border-white/20 text-slate-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 glass-sub hover:border-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <InformationFormModal
          information={editingInfo}
          onClose={() => {
            setShowFormModal(false)
            setEditingInfo(null)
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Confirmation */}
      {showDeleteDialog && deletingInfo && (
        <ConfirmDialog
          title="Hapus Informasi"
          message={`Apakah Anda yakin ingin menghapus informasi "${deletingInfo.title}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Hapus"
          confirmVariant="danger"
          onConfirm={confirmDelete}
          onCancel={() => {
            setShowDeleteDialog(false)
            setDeletingInfo(null)
          }}
        />
      )}
    </div>
    </>
  )
}

// Information Card Component
interface InformationCardProps {
  information: Information
  onEdit: (info: Information) => void
  onDelete: (info: Information) => void
  onToggleStatus: (info: Information) => void
}

function InformationCard({ information, onEdit, onDelete, onToggleStatus }: InformationCardProps) {
  const TypeIcon = getInformationTypeIcon(information.type)
  
  return (
    <div className="glass-card rounded-2xl p-5 group">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Left: Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded flex items-center justify-center flex-shrink-0 ${getInformationTypeColor(information.type)}`}>
              {TypeIcon}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="text-lg font-bold text-white">{information.title}</h3>
                {information.isPinned && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded border border-yellow-500/30">
                    <PushPin className="w-3 h-3" weight="fill" />
                    Pinned
                  </span>
                )}
                <span className={`px-2 py-0.5 text-xs rounded border ${
                  information.isActive
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                }`}>
                  {information.isActive ? '● Aktif' : '○ Nonaktif'}
                </span>
              </div>
              
              {information.subtitle && (
                <p className="text-slate-300 text-sm mb-2">{information.subtitle}</p>
              )}
              
              <p className="text-slate-400 text-sm line-clamp-2">{information.description}</p>
              
              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`px-2 py-1 text-xs rounded border ${getInformationTypeColor(information.type)}`}>
                  {getInformationTypeLabel(information.type)}
                </span>
                <span className={`px-2 py-1 text-xs rounded border ${getInformationPriorityColor(information.priority)}`}>
                  {getInformationPriorityLabel(information.priority)}
                </span>
              </div>

              {/* Targeting Info */}
              {(information.targetUserStatus?.length || information.targetUserRoles?.length) && (
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <Target className="w-4 h-4" weight="duotone" />
                  <span>
                    {information.targetUserStatus?.length ? (
                      <span>Status: {information.targetUserStatus.join(', ')}</span>
                    ) : null}
                    {information.targetUserStatus?.length && information.targetUserRoles?.length ? ' • ' : null}
                    {information.targetUserRoles?.length ? (
                      <span>Role: {information.targetUserRoles.join(', ')}</span>
                    ) : null}
                  </span>
                </div>
              )}

              {/* Meta Info */}
              <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-3">
                <div className="flex items-center gap-1">
                  <CalendarBlank className="w-3.5 h-3.5" weight="duotone" />
                  {TimezoneUtil.formatDateTime(new Date(information.createdAt))}
                </div>
                {information.viewCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" weight="duotone" />
                    {information.viewCount}
                  </div>
                )}
                {information.clickCount !== undefined && (
                  <div className="flex items-center gap-1">
                    <CaretRight className="w-3.5 h-3.5" weight="bold" />
                    {information.clickCount}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex lg:flex-col gap-2 lg:w-auto">
          <button
            onClick={() => onToggleStatus(information)}
            className={`flex-1 lg:w-28 px-3 py-2 rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm ${
              information.isActive
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
            }`}
            title={information.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          >
            {information.isActive ? (
              <><Eye className="w-4 h-4" weight="bold" /> Aktif</>
            ) : (
              <><EyeSlash className="w-4 h-4" weight="bold" /> Off</>
            )}
          </button>
          
          <button
            onClick={() => onEdit(information)}
            className="flex-1 lg:w-28 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm"
            title="Edit"
          >
            <PencilSimple className="w-4 h-4" weight="bold" />
            <span>Edit</span>
          </button>
          
          <button
            onClick={() => onDelete(information)}
            className="flex-1 lg:w-28 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 text-sm"
            title="Hapus"
          >
            <Trash className="w-4 h-4" weight="bold" />
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </div>
  )
}