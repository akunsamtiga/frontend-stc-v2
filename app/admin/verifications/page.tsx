// app/admin/verifications/page.tsx
'use client'

import { useEffect, useState } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { toast } from 'sonner'
import { 
  Shield, CheckCircle, XCircle, Clock, User, 
  CreditCard, Camera, ArrowsClockwise, MagnifyingGlass,
  Eye, CalendarBlank, X
} from 'phosphor-react'
import type { PendingVerifications, VerifyDocumentRequest } from '@/types'
import { motion, type Variants } from 'framer-motion'

type VerificationTab = 'ktp' | 'selfie'

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
        radial-gradient(ellipse 80% 60% at 10% 20%, rgba(6,182,212,0.14) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 85% 10%, rgba(99,102,241,0.12) 0%, transparent 55%),
        radial-gradient(ellipse 70% 60% at 70% 80%, rgba(16,185,129,0.08) 0%, transparent 55%),
        radial-gradient(ellipse 50% 40% at 20% 85%, rgba(139,92,246,0.07) 0%, transparent 50%);
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

export default function AdminVerificationsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [verifications, setVerifications] = useState<PendingVerifications | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState<VerificationTab>('ktp')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [reviewingKTP, setReviewingKTP] = useState<any>(null)
  const [reviewingSelfie, setReviewingSelfie] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    if (user.role !== 'super_admin' && user.role !== 'admin') { router.push('/trading'); return }
    loadVerifications()
  }, [user, router])

  const loadVerifications = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      const response = await api.getPendingVerifications()
      if (response?.data) { setVerifications(response.data); setLastUpdated(new Date()) }
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memuat verifikasi')
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  const handleVerifyKTP = async (userId: string, approve: boolean) => {
    if (!approve && !rejectionReason.trim()) { toast.error('Alasan penolakan wajib diisi'); return }
    try {
      setProcessing(true)
      await api.verifyKTP(userId, { approve, adminNotes: adminNotes.trim() || undefined, rejectionReason: approve ? undefined : rejectionReason.trim() })
      toast.success(approve ? 'KTP berhasil diverifikasi!' : 'Verifikasi KTP ditolak')
      setReviewingKTP(null); setRejectionReason(''); setAdminNotes('')
      await loadVerifications()
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memproses verifikasi')
    } finally { setProcessing(false) }
  }

  const handleVerifySelfie = async (userId: string, approve: boolean) => {
    if (!approve && !rejectionReason.trim()) { toast.error('Alasan penolakan wajib diisi'); return }
    try {
      setProcessing(true)
      await api.verifySelfie(userId, { approve, adminNotes: adminNotes.trim() || undefined, rejectionReason: approve ? undefined : rejectionReason.trim() })
      toast.success(approve ? 'Selfie berhasil diverifikasi!' : 'Verifikasi selfie ditolak')
      setReviewingSelfie(null); setRejectionReason(''); setAdminNotes('')
      await loadVerifications()
    } catch (error: any) {
      toast.error(error?.message || 'Gagal memproses verifikasi')
    } finally { setProcessing(false) }
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  if (loading) return (
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
            <div className="grid grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
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

  const ktpList = verifications?.ktpVerifications || []
  const selfieList = verifications?.selfieVerifications || []
  const filteredKTP = ktpList.filter(v => v.email.toLowerCase().includes(searchQuery.toLowerCase()) || v.fullName?.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredSelfie = selfieList.filter(v => v.email.toLowerCase().includes(searchQuery.toLowerCase()) || v.fullName?.toLowerCase().includes(searchQuery.toLowerCase()))

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
                <span className="text-slate-100 font-medium">Verifikasi</span>
              </motion.div>
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-9 h-9 bg-gradient-to-br from-cyan-400/80 to-indigo-500/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-500/30 border border-white/20"
                  whileHover={{ rotate: 90, scale: 1.1 }} transition={{ ...SPRING }}>
                  <Shield className="w-5 h-5 text-white" weight="duotone" />
                </motion.div>
                <div>
                  <AnimatedHeadline text="Manajemen Verifikasi" className="text-2xl sm:text-3xl font-bold text-slate-100" style={{ letterSpacing: '-0.03em' }} />
                  <motion.p className="text-slate-400 text-sm mt-0.5" variants={fadeUp}>
                    {lastUpdated ? `Diperbarui ${lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : 'Tinjau dan setujui verifikasi pengguna'}
                  </motion.p>
                </div>
              </div>
            </motion.div>
            <motion.div variants={scaleIn}>
              <motion.button onClick={() => loadVerifications(true)} disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2.5 glass-input rounded-xl text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                <ArrowsClockwise className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} weight="bold" />
                {refreshing ? 'Memperbarui...' : 'Perbarui'}
              </motion.button>
            </motion.div>
          </motion.div>

          {/* ── Stats ── */}
          <Reveal className="glass-card rounded-2xl p-5 mb-6">
            <motion.div className="grid grid-cols-3 gap-4 lg:gap-6" variants={stagger(0.08)} initial="hidden" animate="visible">
              {[
                { icon: <Clock className="w-5 h-5 text-yellow-400" weight="duotone" />, bg: 'bg-yellow-500/15', label: 'Total Menunggu', val: verifications?.summary.total || 0, color: 'text-slate-100' },
                { icon: <CreditCard className="w-5 h-5 text-blue-400" weight="duotone" />, bg: 'bg-blue-500/15', label: 'KTP Menunggu', val: verifications?.summary.totalPendingKTP || 0, color: 'text-blue-400' },
                { icon: <Camera className="w-5 h-5 text-cyan-400" weight="duotone" />, bg: 'bg-cyan-500/15', label: 'Selfie Menunggu', val: verifications?.summary.totalPendingSelfie || 0, color: 'text-cyan-400' },
              ].map((s, i) => (
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

          {/* ── Search + Tabs ── */}
          <motion.div className="flex flex-col sm:flex-row gap-3 mb-6"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.15 }}>
            <div className="relative flex-1">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" weight="bold" />
              <input type="text" placeholder="Cari berdasarkan email atau nama..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 glass-input rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all" />
            </div>
            <div className="flex gap-1 glass-input rounded-xl p-1">
              {([
                { key: 'ktp' as const, label: 'KTP', icon: CreditCard, count: filteredKTP.length, active: 'bg-blue-600' },
                { key: 'selfie' as const, label: 'Selfie', icon: Camera, count: filteredSelfie.length, active: 'bg-cyan-600' },
              ]).map(({ key, label, icon: Icon, count, active }) => (
                <button key={key} onClick={() => setSelectedTab(key)}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTab === key ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                  {selectedTab === key && (
                    <motion.div className={`absolute inset-0 rounded-lg ${active} shadow-md`} layoutId="verifyTabPill" transition={{ ...SPRING }} />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" weight={selectedTab === key ? 'fill' : 'regular'} />
                    {label}
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${selectedTab === key ? 'bg-white/20' : 'bg-white/10 text-slate-500'}`}>{count}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* ── Content ── */}
          {selectedTab === 'ktp' ? (
            filteredKTP.length === 0 ? (
              <Reveal className="glass-card rounded-2xl p-12 text-center">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                  <CreditCard className="w-7 h-7 text-blue-400" weight="duotone" />
                </div>
                <p className="text-slate-400">Tidak ada verifikasi KTP yang menunggu</p>
              </Reveal>
            ) : (
              <motion.div className="space-y-3" variants={stagger(0.05)} initial="hidden" animate="visible">
                {filteredKTP.map((verification) => (
                  <motion.div key={verification.userId} variants={fadeUp} className="glass-card rounded-2xl p-5"
                    whileHover={{ y: -1, transition: { duration: 0.15 } }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 bg-blue-500/15 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                          <User className="w-5 h-5 text-blue-400" weight="duotone" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-100">{verification.fullName || 'Tanpa Nama'}</h3>
                          <p className="text-sm text-slate-400">{verification.email}</p>
                          {verification.documentNumber && (
                            <p className="text-xs text-slate-500 mt-0.5">{verification.documentType?.toUpperCase()}: {verification.documentNumber}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <CalendarBlank className="w-3.5 h-3.5 text-slate-500" weight="duotone" />
                            <span className="text-xs text-slate-500">Diunggah: {new Date(verification.uploadedAt).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                      <motion.button onClick={() => setReviewingKTP(verification)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm font-medium transition-all"
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                        <Eye className="w-4 h-4" weight="duotone" /> Tinjau
                      </motion.button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {verification.photoFront && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1.5">Foto Depan</p>
                          <img src={verification.photoFront.url} alt="KTP Depan" className="w-full h-40 object-cover rounded-xl border border-white/10" />
                        </div>
                      )}
                      {verification.photoBack && (
                        <div>
                          <p className="text-xs text-slate-500 mb-1.5">Foto Belakang</p>
                          <img src={verification.photoBack.url} alt="KTP Belakang" className="w-full h-40 object-cover rounded-xl border border-white/10" />
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )
          ) : (
            filteredSelfie.length === 0 ? (
              <Reveal className="glass-card rounded-2xl p-12 text-center">
                <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/20">
                  <Camera className="w-7 h-7 text-cyan-400" weight="duotone" />
                </div>
                <p className="text-slate-400">Tidak ada verifikasi selfie yang menunggu</p>
              </Reveal>
            ) : (
              <motion.div className="space-y-3" variants={stagger(0.05)} initial="hidden" animate="visible">
                {filteredSelfie.map((verification) => (
                  <motion.div key={verification.userId} variants={fadeUp} className="glass-card rounded-2xl p-5"
                    whileHover={{ y: -1, transition: { duration: 0.15 } }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 bg-cyan-500/15 rounded-full flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                          <User className="w-5 h-5 text-cyan-400" weight="duotone" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-100">{verification.fullName || 'Tanpa Nama'}</h3>
                          <p className="text-sm text-slate-400">{verification.email}</p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <CalendarBlank className="w-3.5 h-3.5 text-slate-500" weight="duotone" />
                            <span className="text-xs text-slate-500">Diunggah: {new Date(verification.uploadedAt).toLocaleDateString('id-ID')}</span>
                          </div>
                        </div>
                      </div>
                      <motion.button onClick={() => setReviewingSelfie(verification)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg text-sm font-medium transition-all"
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                        <Eye className="w-4 h-4" weight="duotone" /> Tinjau
                      </motion.button>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1.5">Foto Selfie</p>
                      <img src={verification.photoUrl} alt="Selfie" className="w-full max-w-sm h-64 object-cover rounded-xl border border-white/10" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )
          )}
        </div>

        {/* ── KTP Review Modal ── */}
        {reviewingKTP && (
          <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setReviewingKTP(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div className="w-full max-w-4xl glass-modal rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ ...SPRING }}>
                <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 glass-modal z-10">
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-blue-400" weight="duotone" />
                    </div>
                    Tinjau Verifikasi KTP
                  </h2>
                  <button onClick={() => setReviewingKTP(null)} className="w-8 h-8 flex items-center justify-center glass-sub rounded-lg hover:border-white/20 text-slate-400 hover:text-white transition-all">
                    <X className="w-4 h-4" weight="bold" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="glass-sub rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Informasi Pengguna</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-slate-500 text-xs">Nama</p><p className="font-medium text-slate-100">{reviewingKTP.fullName || 'Tanpa Nama'}</p></div>
                      <div><p className="text-slate-500 text-xs">Email</p><p className="font-medium text-slate-100">{reviewingKTP.email}</p></div>
                      {reviewingKTP.documentNumber && (<div><p className="text-slate-500 text-xs">Nomor Dokumen</p><p className="font-medium text-slate-100">{reviewingKTP.documentNumber}</p></div>)}
                      <div><p className="text-slate-500 text-xs">Diunggah</p><p className="font-medium text-slate-100">{new Date(reviewingKTP.uploadedAt).toLocaleString('id-ID')}</p></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {reviewingKTP.photoFront && (<div><p className="text-xs text-slate-500 mb-2">Foto Depan</p><img src={reviewingKTP.photoFront.url} alt="KTP Depan" className="w-full h-64 object-contain glass-sub rounded-xl border border-white/10" /></div>)}
                    {reviewingKTP.photoBack && (<div><p className="text-xs text-slate-500 mb-2">Foto Belakang</p><img src={reviewingKTP.photoBack.url} alt="KTP Belakang" className="w-full h-64 object-contain glass-sub rounded-xl border border-white/10" /></div>)}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Catatan Admin (Opsional)</label>
                    <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Tambahkan catatan..." className="w-full glass-input rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 text-sm resize-none transition-all" rows={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Alasan Penolakan <span className="text-red-400">(Wajib jika menolak)</span></label>
                    <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Contoh: Foto buram, dokumen kadaluarsa, dll." className="w-full glass-input rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 text-sm resize-none transition-all" rows={3} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleVerifyKTP(reviewingKTP.userId, true)} disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 rounded-xl font-semibold text-sm transition-all disabled:opacity-50">
                      <CheckCircle className="w-5 h-5" weight="bold" />
                      {processing ? 'Memproses...' : 'Setujui'}
                    </button>
                    <button onClick={() => handleVerifyKTP(reviewingKTP.userId, false)} disabled={processing || !rejectionReason.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl font-semibold text-sm transition-all disabled:opacity-50">
                      <XCircle className="w-5 h-5" weight="bold" />
                      {processing ? 'Memproses...' : 'Tolak'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}

        {/* ── Selfie Review Modal ── */}
        {reviewingSelfie && (
          <>
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setReviewingSelfie(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div className="w-full max-w-2xl glass-modal rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ ...SPRING }}>
                <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 glass-modal z-10">
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <div className="w-7 h-7 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Camera className="w-4 h-4 text-cyan-400" weight="duotone" />
                    </div>
                    Tinjau Verifikasi Selfie
                  </h2>
                  <button onClick={() => setReviewingSelfie(null)} className="w-8 h-8 flex items-center justify-center glass-sub rounded-lg hover:border-white/20 text-slate-400 hover:text-white transition-all">
                    <X className="w-4 h-4" weight="bold" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <div className="glass-sub rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Informasi Pengguna</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><p className="text-slate-500 text-xs">Nama</p><p className="font-medium text-slate-100">{reviewingSelfie.fullName || 'Tanpa Nama'}</p></div>
                      <div><p className="text-slate-500 text-xs">Email</p><p className="font-medium text-slate-100">{reviewingSelfie.email}</p></div>
                      <div className="col-span-2"><p className="text-slate-500 text-xs">Diunggah</p><p className="font-medium text-slate-100">{new Date(reviewingSelfie.uploadedAt).toLocaleString('id-ID')}</p></div>
                    </div>
                  </div>
                  <div><p className="text-xs text-slate-500 mb-2">Foto Selfie</p><img src={reviewingSelfie.photoUrl} alt="Selfie" className="w-full max-h-96 object-contain glass-sub rounded-xl border border-white/10" /></div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Catatan Admin (Opsional)</label>
                    <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Tambahkan catatan..." className="w-full glass-input rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 text-sm resize-none transition-all" rows={3} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Alasan Penolakan <span className="text-red-400">(Wajib jika menolak)</span></label>
                    <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Contoh: Wajah tidak jelas, tidak cocok dengan KTP, dll." className="w-full glass-input rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 text-sm resize-none transition-all" rows={3} />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => handleVerifySelfie(reviewingSelfie.userId, true)} disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 rounded-xl font-semibold text-sm transition-all disabled:opacity-50">
                      <CheckCircle className="w-5 h-5" weight="bold" />{processing ? 'Memproses...' : 'Setujui'}
                    </button>
                    <button onClick={() => handleVerifySelfie(reviewingSelfie.userId, false)} disabled={processing || !rejectionReason.trim()}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-xl font-semibold text-sm transition-all disabled:opacity-50">
                      <XCircle className="w-5 h-5" weight="bold" />{processing ? 'Memproses...' : 'Tolak'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </div>
    </>
  )
}