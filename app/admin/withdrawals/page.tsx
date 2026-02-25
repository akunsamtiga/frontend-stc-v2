// app/admin/withdrawals/page.tsx
'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { 
  WithdrawalRequest, WithdrawalSummary,
  formatWithdrawalStatus, WITHDRAWAL_CONFIG
} from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  ArrowLineUp, CheckCircle, XCircle, Clock, 
  FileText, Shield, Camera, Eye, 
  ArrowsClockwise, User, CreditCard,
  Wallet, Warning, X
} from 'phosphor-react'
import { toast } from 'sonner'
import { motion, type Variants } from 'framer-motion'

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'completed'

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
        radial-gradient(ellipse 80% 60% at 10% 20%, rgba(99,102,241,0.14) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 85% 10%, rgba(16,185,129,0.10) 0%, transparent 55%),
        radial-gradient(ellipse 70% 60% at 70% 80%, rgba(245,158,11,0.07) 0%, transparent 55%),
        radial-gradient(ellipse 50% 40% at 20% 85%, rgba(239,68,68,0.06) 0%, transparent 50%);
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

export default function AdminWithdrawalsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [summary, setSummary] = useState<WithdrawalSummary | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    if (user.role !== 'super_admin' && user.role !== 'admin') { router.push('/trading'); return }
    loadData()
  }, [user, statusFilter])

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      setLoading(true)
      const filter = statusFilter === 'all' ? undefined : statusFilter
      const response = await api.getAllWithdrawalRequests(filter)
      const data = response?.data || response
      setRequests(data?.requests || [])
      setSummary(data?.summary || null)
      setLastUpdated(new Date())
    } catch (error) {
      toast.error('Gagal memuat permintaan penarikan')
    } finally { setLoading(false); if (showRefreshing) setRefreshing(false) }
  }

  const handleViewDetail = async (request: WithdrawalRequest) => {
    try {
      const response = await api.getWithdrawalRequestById(request.id)
      const detailData = response?.data || response
      setSelectedRequest(detailData?.request || request)
      setShowDetailModal(true)
    } catch {
      setSelectedRequest(request)
      setShowDetailModal(true)
    }
  }

  const handleApprove = (approve: boolean) => {
    if (!selectedRequest) return
    if (!approve && !rejectionReason.trim()) { toast.error('Alasan penolakan wajib diisi'); return }
    setShowApproveModal(true)
  }

  const confirmApproval = async () => {
    if (!selectedRequest) return
    setProcessing(true)
    try {
      const isApproval = !rejectionReason.trim()
      await api.approveWithdrawal(selectedRequest.id, { approve: isApproval, adminNotes: adminNotes || undefined, rejectionReason: rejectionReason || undefined })
      toast.success(isApproval ? 'Penarikan berhasil disetujui!' : 'Penarikan ditolak')
      setShowApproveModal(false); setShowDetailModal(false)
      setSelectedRequest(null); setAdminNotes(''); setRejectionReason('')
      loadData()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal memproses penarikan')
    } finally { setProcessing(false) }
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', icon: Clock }
      case 'approved': return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: CheckCircle }
      case 'completed': return { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', icon: CheckCircle }
      case 'rejected': return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: XCircle }
      default: return { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400', icon: FileText }
    }
  }

  const getStatusLabel = (status: string) => ({ pending: 'Menunggu', approved: 'Disetujui', completed: 'Selesai', rejected: 'Ditolak' }[status] || status)

  const statsData = summary ? [
    { label: 'Total', val: summary.total, color: 'text-slate-100', bg: 'bg-indigo-500/15', icon: <FileText className="w-5 h-5 text-indigo-400" weight="duotone" /> },
    { label: 'Menunggu', val: summary.pending, color: 'text-yellow-400', bg: 'bg-yellow-500/15', icon: <Clock className="w-5 h-5 text-yellow-400" weight="duotone" /> },
    { label: 'Disetujui', val: summary.approved, color: 'text-blue-400', bg: 'bg-blue-500/15', icon: <CheckCircle className="w-5 h-5 text-blue-400" weight="duotone" /> },
    { label: 'Selesai', val: summary.completed, color: 'text-green-400', bg: 'bg-green-500/15', icon: <CheckCircle className="w-5 h-5 text-green-400" weight="duotone" /> },
    { label: 'Ditolak', val: summary.rejected, color: 'text-red-400', bg: 'bg-red-500/15', icon: <XCircle className="w-5 h-5 text-red-400" weight="duotone" /> },
  ] : []

  if (loading && !refreshing) return (
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
            <div className="grid grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
                  <div><div className="h-3 bg-white/10 rounded w-12 mb-1"></div><div className="h-5 bg-white/10 rounded w-8"></div></div>
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
                <span className="text-slate-100 font-medium">Penarikan</span>
              </motion.div>
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-9 h-9 bg-gradient-to-br from-indigo-400/80 to-emerald-500/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30 border border-white/20"
                  whileHover={{ rotate: 90, scale: 1.1 }} transition={{ ...SPRING }}>
                  <ArrowLineUp className="w-5 h-5 text-white" weight="duotone" />
                </motion.div>
                <div>
                  <AnimatedHeadline text="Manajemen Penarikan" className="text-2xl sm:text-3xl font-bold text-slate-100" style={{ letterSpacing: '-0.03em' }} />
                  <motion.p className="text-slate-400 text-sm mt-0.5" variants={fadeUp}>
                    {lastUpdated ? `Diperbarui ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Tinjau dan setujui penarikan pengguna'}
                  </motion.p>
                </div>
              </div>
            </motion.div>
            <motion.div variants={scaleIn}>
              <motion.button onClick={() => loadData(true)} disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 glass-input rounded-xl text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <ArrowsClockwise className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} weight="bold" />
                {refreshing ? 'Memperbarui...' : 'Perbarui'}
              </motion.button>
            </motion.div>
          </motion.div>

          {/* ── Stats ── */}
          {summary && (
            <Reveal className="glass-card rounded-2xl p-5 mb-6">
              <motion.div className="grid grid-cols-2 lg:grid-cols-5 gap-4" variants={stagger(0.07)} initial="hidden" animate="visible">
                {statsData.map((s, i) => (
                  <motion.div key={i} className="flex items-center gap-3" variants={fadeUp} whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                    <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
                    <div>
                      <div className="text-xs font-medium text-slate-400 mb-0.5">{s.label}</div>
                      <div className={`text-lg font-bold ${s.color}`}><CountUp to={s.val} /></div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </Reveal>
          )}

          {/* ── Filter Tabs + count ── */}
          <motion.div className="flex items-center justify-between mb-6"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.15 }}>
            <div className="flex gap-1 glass-input rounded-xl p-1 flex-wrap">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'pending', label: 'Menunggu' },
                { id: 'approved', label: 'Disetujui' },
                { id: 'completed', label: 'Selesai' },
                { id: 'rejected', label: 'Ditolak' },
              ].map(({ id, label }) => (
                <button key={id} onClick={() => setStatusFilter(id as StatusFilter)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === id ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                  {statusFilter === id && <motion.div className="absolute inset-0 rounded-lg bg-indigo-600 shadow-md" layoutId="withdrawalFilter" transition={{ ...SPRING }} />}
                  <span className="relative z-10">{label}</span>
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 font-medium">{requests.length} permintaan</div>
          </motion.div>

          {/* ── Requests List ── */}
          <Reveal className="glass-card rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" weight="duotone" />
              <h2 className="text-sm font-semibold text-slate-100">
                {statusFilter === 'all' ? 'Semua Permintaan' : `Permintaan ${getStatusLabel(statusFilter)}`}
              </h2>
            </div>
            <div className="p-4">
              {loading ? (
                <div className="text-center py-12">
                  <ArrowsClockwise className="w-7 h-7 animate-spin text-slate-500 mx-auto mb-3" weight="bold" />
                  <p className="text-sm text-slate-500">Memuat permintaan...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-14">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
                    <FileText className="w-7 h-7 text-indigo-400" weight="duotone" />
                  </div>
                  <p className="text-sm font-semibold text-slate-100 mb-1">Tidak ada permintaan</p>
                  <p className="text-sm text-slate-500">{statusFilter === 'all' ? 'Belum ada permintaan penarikan' : `Tidak ada permintaan ${getStatusLabel(statusFilter)}`}</p>
                </div>
              ) : (
                <motion.div className="space-y-3" variants={stagger(0.04)} initial="hidden" animate="visible">
                  {requests.map((request) => {
                    const statusStyle = getStatusStyle(request.status)
                    const StatusIcon = statusStyle.icon
                    const isPending = request.status === 'pending'
                    return (
                      <motion.div key={request.id} variants={fadeUp}
                        className="glass-sub rounded-2xl p-4 transition-all hover:border-white/15">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <User className="w-4 h-4 text-slate-500 flex-shrink-0" weight="duotone" />
                              <span className="text-sm font-semibold text-slate-100 truncate">{request.userName || request.userEmail}</span>
                              <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold border flex items-center gap-1 ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
                                <StatusIcon className="w-3 h-3" weight="duotone" />
                                {getStatusLabel(request.status)}
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-slate-100 mb-1">{formatCurrency(request.amount)}</div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <span>{formatDate(request.createdAt)}</span>
                              <span>•</span>
                              <span>Saldo: {formatCurrency(request.currentBalance)}</span>
                            </div>
                          </div>
                          <motion.button onClick={() => handleViewDetail(request)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-semibold transition-all border border-indigo-500/20 ml-3"
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Eye className="w-4 h-4" weight="duotone" />
                            <span className="hidden sm:inline">Detail</span>
                          </motion.button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {request.bankAccount && (
                            <div className="bg-white/4 rounded-xl p-3 border border-white/6">
                              <div className="flex items-center gap-1 text-xs text-slate-500 mb-1">
                                <CreditCard className="w-3 h-3" weight="duotone" />Rekening Bank
                              </div>
                              <div className="text-sm font-semibold text-slate-100">{request.bankAccount.bankName}</div>
                              <div className="text-xs text-slate-400">{request.bankAccount.accountNumber}</div>
                            </div>
                          )}
                          <div className="bg-white/4 rounded-xl p-3 border border-white/6">
                            <div className="text-xs text-slate-500 mb-1.5">Verifikasi</div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className={`flex items-center gap-1 ${request.ktpVerified ? 'text-green-400' : 'text-slate-500'}`}>
                                <Shield className="w-3 h-3" weight="duotone" />KTP
                              </span>
                              <span className={`flex items-center gap-1 ${request.selfieVerified ? 'text-green-400' : 'text-slate-500'}`}>
                                <Camera className="w-3 h-3" weight="duotone" />Selfie
                              </span>
                            </div>
                          </div>
                        </div>
                        {isPending && (
                          <div className="flex gap-2">
                            <motion.button
                              onClick={() => { setSelectedRequest(request); setRejectionReason(''); handleApprove(true) }}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 rounded-xl text-sm font-semibold transition-all"
                              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <CheckCircle className="w-4 h-4" weight="bold" />Setujui
                            </motion.button>
                            <motion.button
                              onClick={() => { setSelectedRequest(request); setAdminNotes(''); setRejectionReason(''); setShowDetailModal(true) }}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl text-sm font-semibold transition-all"
                              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                              <XCircle className="w-4 h-4" weight="bold" />Tolak
                            </motion.button>
                          </div>
                        )}
                        {request.rejectionReason && (
                          <div className="mt-2 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                            <Warning className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" weight="duotone" />
                            <div>
                              <div className="text-xs font-semibold text-red-400 mb-0.5">Alasan Penolakan:</div>
                              <div className="text-xs text-red-300">{request.rejectionReason}</div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </motion.div>
              )}
            </div>
          </Reveal>
        </div>

        {/* ── Detail Modal ── */}
        {showDetailModal && selectedRequest && (
          <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowDetailModal(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
              <motion.div className="w-full max-w-2xl glass-modal rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ ...SPRING }}>
                <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between sticky top-0 glass-modal z-10">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-100">Detail Permintaan Penarikan</h2>
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${getStatusStyle(selectedRequest.status).bg} ${getStatusStyle(selectedRequest.status).border} ${getStatusStyle(selectedRequest.status).text}`}>
                      {getStatusLabel(selectedRequest.status)}
                    </span>
                  </div>
                  <button onClick={() => setShowDetailModal(false)}
                    className="w-8 h-8 flex items-center justify-center glass-sub rounded-lg text-slate-400 hover:text-white transition-all">
                    <X className="w-4 h-4" weight="bold" />
                  </button>
                </div>
                <div className="p-5 sm:p-6 space-y-5">
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Jumlah Penarikan</div>
                    <div className="text-3xl font-bold text-slate-100">{formatCurrency(selectedRequest.amount)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><div className="text-xs text-slate-500 mb-1">Email Pengguna</div><div className="text-sm font-semibold text-slate-100">{selectedRequest.userEmail}</div></div>
                    <div><div className="text-xs text-slate-500 mb-1">Nama Lengkap</div><div className="text-sm font-semibold text-slate-100">{selectedRequest.userName || '-'}</div></div>
                  </div>
                  {selectedRequest.bankAccount && (
                    <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                      <div className="flex items-center gap-2 mb-3">
                        <CreditCard className="w-4 h-4 text-indigo-400" weight="duotone" />
                        <span className="text-sm font-semibold text-indigo-400">Detail Rekening Bank</span>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between"><span className="text-slate-500">Bank:</span><span className="font-semibold text-slate-100">{selectedRequest.bankAccount.bankName}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Nomor Rekening:</span><span className="font-semibold text-slate-100">{selectedRequest.bankAccount.accountNumber}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Nama Pemilik:</span><span className="font-semibold text-slate-100">{selectedRequest.bankAccount.accountHolderName}</span></div>
                      </div>
                    </div>
                  )}
                  <div className="glass-sub rounded-xl p-4">
                    <div className="text-sm font-semibold text-slate-100 mb-3">Status Verifikasi</div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { ok: selectedRequest.ktpVerified, label: selectedRequest.ktpVerified ? 'KTP Terverifikasi' : 'KTP Belum', icon: Shield },
                        { ok: selectedRequest.selfieVerified, label: selectedRequest.selfieVerified ? 'Selfie Terverifikasi' : 'Selfie Belum', icon: Camera },
                        { ok: selectedRequest.currentBalance >= selectedRequest.amount, label: selectedRequest.currentBalance >= selectedRequest.amount ? 'Saldo Cukup' : 'Saldo Kurang', icon: Wallet },
                      ].map((item, i) => {
                        const Icon = item.icon
                        return (
                          <div key={i} className="text-center">
                            <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center border ${item.ok ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                              <Icon className={`w-5 h-5 ${item.ok ? 'text-green-400' : 'text-red-400'}`} weight="duotone" />
                            </div>
                            <div className="text-xs font-semibold text-slate-300">{item.label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="glass-sub rounded-xl p-3">
                      <div className="text-xs text-slate-500 mb-1">Saldo Saat Ini</div>
                      <div className="text-lg font-bold text-slate-100">{formatCurrency(selectedRequest.currentBalance)}</div>
                    </div>
                    <div className="glass-sub rounded-xl p-3">
                      <div className="text-xs text-slate-500 mb-1">Saldo Setelah Penarikan</div>
                      <div className="text-lg font-bold text-slate-300">{formatCurrency(selectedRequest.currentBalance - selectedRequest.amount)}</div>
                    </div>
                  </div>
                  {selectedRequest.description && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Keterangan</div>
                      <div className="text-sm text-slate-100 glass-sub rounded-xl p-3">{selectedRequest.description}</div>
                    </div>
                  )}
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Tanggal Permintaan</div>
                    <div className="text-sm font-semibold text-slate-100">{formatDate(selectedRequest.createdAt)}</div>
                  </div>
                  {selectedRequest.status === 'pending' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Catatan Admin (Opsional)</label>
                        <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Tambahkan catatan internal..."
                          className="w-full glass-input rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 text-sm resize-none transition-all" rows={2} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1.5">Alasan Penolakan <span className="text-red-400">(Wajib jika menolak)</span></label>
                        <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Masukkan alasan penolakan..."
                          className="w-full glass-input rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 text-sm resize-none transition-all" rows={3} />
                      </div>
                      <div className="flex gap-3">
                        <motion.button onClick={() => handleApprove(true)} disabled={!selectedRequest.ktpVerified || !selectedRequest.selfieVerified}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/15 hover:bg-green-500/25 disabled:bg-white/5 disabled:text-slate-500 text-green-400 border border-green-500/30 disabled:border-white/10 rounded-xl font-semibold text-sm transition-all"
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <CheckCircle className="w-5 h-5" weight="bold" />Setujui & Proses
                        </motion.button>
                        <motion.button onClick={() => handleApprove(false)} disabled={!rejectionReason.trim()}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/15 hover:bg-red-500/25 disabled:bg-white/5 disabled:text-slate-500 text-red-400 border border-red-500/30 disabled:border-white/10 rounded-xl font-semibold text-sm transition-all"
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <XCircle className="w-5 h-5" weight="bold" />Tolak Permintaan
                        </motion.button>
                      </div>
                    </>
                  )}
                  {selectedRequest.rejectionReason && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                      <Warning className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" weight="duotone" />
                      <div><div className="font-semibold text-red-400 mb-1 text-sm">Alasan Penolakan:</div><div className="text-sm text-red-300">{selectedRequest.rejectionReason}</div></div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* ── Confirmation Modal ── */}
        {showApproveModal && selectedRequest && (
          <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div className="w-full max-w-md glass-modal rounded-2xl shadow-2xl p-6"
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ ...SPRING }}>
                <div className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center border ${rejectionReason ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                  {rejectionReason
                    ? <XCircle className="w-7 h-7 text-red-400" weight="bold" />
                    : <CheckCircle className="w-7 h-7 text-green-400" weight="bold" />}
                </div>
                <h3 className="text-lg font-bold text-slate-100 text-center mb-2">
                  {rejectionReason ? 'Tolak Penarikan?' : 'Setujui Penarikan?'}
                </h3>
                <p className="text-sm text-slate-400 text-center mb-6">
                  {rejectionReason
                    ? 'Permintaan penarikan akan ditolak dan pengguna akan diberitahu.'
                    : `Ini akan menyetujui dan memproses penarikan ${formatCurrency(selectedRequest.amount)} ke ${selectedRequest.userEmail}.`}
                </p>
                <div className="flex gap-3">
                  <motion.button onClick={() => setShowApproveModal(false)} disabled={processing}
                    className="flex-1 px-4 py-3 glass-input hover:bg-white/10 text-slate-300 rounded-xl font-semibold text-sm transition-all"
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Batal</motion.button>
                  <motion.button onClick={confirmApproval} disabled={processing}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition-all border disabled:opacity-50 ${rejectionReason ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30' : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30'}`}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {processing
                      ? <><ArrowsClockwise className="w-4 h-4 animate-spin" weight="bold" />Memproses...</>
                      : rejectionReason
                        ? <><XCircle className="w-4 h-4" weight="bold" />Konfirmasi Penolakan</>
                        : <><CheckCircle className="w-4 h-4" weight="bold" />Konfirmasi Persetujuan</>}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </>
  )
}