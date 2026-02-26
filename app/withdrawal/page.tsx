// app/withdrawal/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import {
  WithdrawalRequest,
  WithdrawalSummary,
  UserProfile,
  formatWithdrawalStatus,
  WITHDRAWAL_CONFIG
} from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  ArrowUpFromLine, X, AlertCircle, CheckCircle,
  XCircle, Clock, FileText, Loader2, AlertTriangle,
  Shield, CreditCard, Camera, RefreshCw, ChevronRight
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { motion, AnimatePresence, Variants } from 'framer-motion'

// ─── Animation variants (same as referral page) ───────────────────────────────
const SPRING = { type: 'spring', stiffness: 80, damping: 20 } as const

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
}
const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
}
const slideIn: Variants = {
  hidden: { x: -15, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.25 } },
}
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING } },
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
  const staggerWords: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.03 } },
  }
  return (
    <motion.h1 className={className} variants={staggerWords} initial="hidden" animate="visible">
      {text.split(' ').map((word, i) => (
        <motion.span key={i} className="inline-block mr-[0.25em]"
          variants={{ hidden: { opacity: 0, y: 22, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...SPRING } } }}>
          {word}
        </motion.span>
      ))}
    </motion.h1>
  )
}

// ─── Global Styles ─────────────────────────────────────────────────────────────
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
  `}</style>
)

// ─── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonBlock = ({ w = 'w-20', h = 'h-4' }: { w?: string; h?: string }) => (
  <div className={`${h} ${w} bg-gray-200 rounded animate-pulse`} />
)

const LoadingSkeleton = () => (
  <>
    <GlobalStyles />
    <div className="min-h-screen bg-pattern-grid">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-200 rounded-xl animate-pulse" />
            <div className="space-y-2">
              <SkeletonBlock w="w-36" h="h-6" />
              <SkeletonBlock w="w-52" />
            </div>
          </div>
          <SkeletonBlock w="w-28" h="h-10" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="space-y-3">
            <SkeletonBlock w="w-full" h="h-20" />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => <SkeletonBlock key={i} w="w-full" h="h-10" />)}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100"><SkeletonBlock w="w-40" h="h-6" /></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 border-b border-gray-100 flex items-center gap-3">
              <SkeletonBlock w="w-10" h="h-10" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock w="w-32" />
                <SkeletonBlock w="w-24" h="h-3" />
              </div>
              <SkeletonBlock w="w-20" h="h-6" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </>
)

// ─── Main Component ────────────────────────────────────────────────────────────
export default function WithdrawalPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [summary, setSummary] = useState<WithdrawalSummary | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [realBalance, setRealBalance] = useState(0)

  const [showRequestModal, setShowRequestModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    loadData()
  }, [user])

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const [requestsRes, profileRes, balanceRes] = await Promise.all([
        api.getMyWithdrawalRequests(),
        api.getProfile(),
        api.getAccountBalance('real')
      ])

      const requestsData = requestsRes?.data || requestsRes
      setRequests(requestsData?.requests || [])
      setSummary(requestsData?.summary || null)

      let profileData: UserProfile | null = null
      if (profileRes && typeof profileRes === 'object') {
        if ('data' in profileRes && profileRes.data) profileData = profileRes.data as UserProfile
        else if ('user' in profileRes) profileData = profileRes as UserProfile
      }
      setProfile(profileData)

      const balanceData = balanceRes?.data || balanceRes
      setRealBalance(balanceData?.balance || 0)

    } catch (error) {
      console.error('Gagal memuat data penarikan:', error)
      toast.error('Gagal memuat data penarikan')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => loadData(true)

  const canRequestWithdrawal = (): { can: boolean; reason?: string } => {
    if (!profile) return { can: false, reason: 'Profil belum dimuat' }
    const pi = profile.profileInfo
    if (!pi?.identity?.isVerified) return { can: false, reason: 'Verifikasi KTP diperlukan' }
    if (!pi?.selfie?.isVerified) return { can: false, reason: 'Verifikasi selfie diperlukan' }
    if (!pi?.bankAccount?.accountNumber) return { can: false, reason: 'Rekening bank diperlukan' }
    if (realBalance < WITHDRAWAL_CONFIG.MIN_AMOUNT) return { can: false, reason: `Saldo minimum: ${formatCurrency(WITHDRAWAL_CONFIG.MIN_AMOUNT)}` }
    if (requests.some(r => r.status === 'pending')) return { can: false, reason: 'Ada permintaan penarikan yang sedang diproses' }
    return { can: true }
  }

  const handleRequestWithdrawal = async () => {
    const amt = parseFloat(amount)
    if (isNaN(amt) || amt <= 0) { toast.error('Jumlah tidak valid'); return }
    if (amt < WITHDRAWAL_CONFIG.MIN_AMOUNT) { toast.error(`Minimum penarikan: ${formatCurrency(WITHDRAWAL_CONFIG.MIN_AMOUNT)}`); return }
    if (amt > realBalance) { toast.error('Saldo tidak mencukupi'); return }

    setSubmitting(true)
    try {
      await api.requestWithdrawal({ amount: amt, description: description || 'Permintaan penarikan' })
      toast.success('Permintaan penarikan berhasil diajukan!')
      setShowRequestModal(false)
      setAmount('')
      setDescription('')
      loadData()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal mengajukan penarikan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan permintaan penarikan ini?')) return
    setCancelling(requestId)
    try {
      await api.cancelWithdrawalRequest(requestId)
      toast.success('Permintaan penarikan dibatalkan')
      loadData()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal membatalkan permintaan')
    } finally {
      setCancelling(null)
    }
  }

  const quickAmounts = [100000, 250000, 500000, 1000000, 2500000, 5000000]
    .filter(amt => amt <= realBalance && amt >= WITHDRAWAL_CONFIG.MIN_AMOUNT)

  if (!user) return null
  if (loading) return <LoadingSkeleton />

  const { can: canRequest, reason: cantRequestReason } = canRequestWithdrawal()

  const requirements = [
    { label: 'KTP Terverifikasi', met: profile?.profileInfo?.identity?.isVerified || false, icon: Shield },
    { label: 'Selfie Terverifikasi', met: profile?.profileInfo?.selfie?.isVerified || false, icon: Camera },
    { label: 'Rekening Bank', met: !!profile?.profileInfo?.bankAccount?.accountNumber, icon: CreditCard },
    { label: `Min. ${formatCurrency(WITHDRAWAL_CONFIG.MIN_AMOUNT)}`, met: realBalance >= WITHDRAWAL_CONFIG.MIN_AMOUNT, icon: ArrowUpFromLine },
  ]

  return (
    <>
      <GlobalStyles />
      <div className="min-h-screen bg-pattern-grid relative">
        <Navbar />
        <Toaster position="top-right" />

        <motion.div
          className="max-w-5xl mx-auto px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── Header ── */}
          <motion.div
            className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            initial="hidden" animate="visible" variants={stagger(0.1)}
          >
            <motion.div variants={slideIn}>
              <motion.div className="flex items-center gap-2 text-xs text-gray-500 mb-1" variants={fadeUp}>
                <span>Dasbor</span>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-900 font-medium">Penarikan</span>
              </motion.div>
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-9 h-9 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
                  whileHover={{ rotate: 90, scale: 1.1 }} transition={{ duration: 0.3 }}
                >
                  <ArrowUpFromLine className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <AnimatedHeadline text="Penarikan Dana" className="text-2xl sm:text-3xl font-bold text-gray-900" />
                  <motion.p className="text-gray-500 text-sm mt-0.5" variants={fadeUp}>
                    Saldo tersedia: <span className="font-semibold text-gray-700">{formatCurrency(realBalance)}</span>
                  </motion.p>
                </div>
              </div>
            </motion.div>

            <motion.button
              variants={scaleIn}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              whileHover={{ scale: 1.04, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              whileTap={{ scale: 0.96 }}
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Memperbarui...' : 'Perbarui'}
            </motion.button>
          </motion.div>

          {/* ── Balance Card ── */}
          <Reveal className="mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Saldo Tersedia</p>
                  <div className="text-3xl font-bold text-gray-900">{formatCurrency(realBalance)}</div>
                </div>
                <motion.button
                  onClick={() => setShowRequestModal(true)}
                  disabled={!canRequest}
                  className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-400 text-white rounded-xl font-semibold transition-all shadow-sm disabled:cursor-not-allowed"
                  whileHover={canRequest ? { scale: 1.02, boxShadow: '0 8px 20px rgba(239,68,68,0.3)' } : undefined}
                  whileTap={canRequest ? { scale: 0.98 } : undefined}
                >
                  <ArrowUpFromLine className="w-5 h-5" />
                  <span>Ajukan Penarikan</span>
                </motion.button>
              </div>

              {!canRequest && cantRequestReason && (
                <motion.div
                  className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4"
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <p className="text-sm text-amber-800 font-medium">{cantRequestReason}</p>
                </motion.div>
              )}

              {/* Requirements */}
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Persyaratan Penarikan</p>
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3" variants={staggerContainer} initial="hidden" animate="visible">
                  {requirements.map((req, idx) => (
                    <motion.div key={idx} className="flex items-center gap-2.5" variants={fadeUp}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${req.met ? 'bg-green-100' : 'bg-gray-100'}`}>
                        {req.met
                          ? <CheckCircle className="w-4 h-4 text-green-600" />
                          : <XCircle className="w-4 h-4 text-gray-400" />}
                      </div>
                      <span className={`text-sm font-medium ${req.met ? 'text-gray-800' : 'text-gray-400'}`}>{req.label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>
          </Reveal>

          {/* ── History ── */}
          <Reveal>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-gray-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">Riwayat Penarikan</h2>
                <span className="text-xs text-gray-400 font-normal">({requests.length})</span>
              </div>

              <div className="p-5">
                {requests.length === 0 ? (
                  <motion.div className="text-center py-14 px-4" variants={fadeIn} initial="hidden" animate="visible">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">Belum ada penarikan</h3>
                    <p className="text-sm text-gray-500">Anda belum pernah mengajukan penarikan</p>
                  </motion.div>
                ) : (
                  <motion.div className="space-y-3" variants={staggerContainer} initial="hidden" animate="visible">
                    <AnimatePresence>
                      {requests.map((request) => {
                        const status = formatWithdrawalStatus(request)
                        return (
                          <motion.div
                            key={request.id}
                            className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                            variants={slideIn}
                            whileHover={{ y: -1, boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg font-bold text-gray-900">{formatCurrency(request.amount)}</span>
                                  <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${status.bgClass}`}>{status.label}</span>
                                </div>
                                <div className="text-sm text-gray-500">{formatDate(request.createdAt)}</div>
                              </div>
                              {status.canCancel && (
                                <motion.button
                                  onClick={() => handleCancelRequest(request.id)}
                                  disabled={cancelling === request.id}
                                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                >
                                  {cancelling === request.id ? 'Membatalkan...' : 'Batalkan'}
                                </motion.button>
                              )}
                            </div>

                            {request.description && (
                              <div className="text-sm text-gray-600 mb-3">{request.description}</div>
                            )}

                            {request.bankAccount && (
                              <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                <div className="text-xs text-gray-500 mb-1">Rekening Bank</div>
                                <div className="text-sm font-semibold text-gray-900">
                                  {request.bankAccount.bankName} - {request.bankAccount.accountNumber}
                                </div>
                                <div className="text-xs text-gray-600">{request.bankAccount.accountHolderName}</div>
                              </div>
                            )}

                            {request.status === 'rejected' && request.rejectionReason && (
                              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-xs font-semibold text-red-900 mb-1">Alasan Penolakan:</div>
                                  <div className="text-sm text-red-800">{request.rejectionReason}</div>
                                </div>
                              </div>
                            )}

                            {request.status === 'completed' && request.reviewedAt && (
                              <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-xs font-semibold text-green-900 mb-1">Selesai</div>
                                  <div className="text-xs text-green-800">Diproses pada {formatDate(request.reviewedAt)}</div>
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </motion.div>
                )}
              </div>
            </div>
          </Reveal>
        </motion.div>

        {/* ── Request Modal ── */}
        <AnimatePresence>
          {showRequestModal && (
            <>
              <motion.div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowRequestModal(false)}
              />
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <motion.div
                  className="w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
                  initial={{ scale: 0.93, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.93, y: 20, opacity: 0 }}
                  transition={{ ...SPRING }}
                >
                  <div className="p-5 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 bg-gradient-to-r from-red-500 to-rose-600 rounded-xl flex items-center justify-center shadow-md">
                          <ArrowUpFromLine className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-gray-900">Ajukan Penarikan</h2>
                          <p className="text-xs text-gray-500">Maks: {formatCurrency(realBalance)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowRequestModal(false)}
                        className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Jumlah (IDR)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0"
                        min={WITHDRAWAL_CONFIG.MIN_AMOUNT}
                        max={realBalance}
                        className="w-full text-center text-3xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl py-4 focus:border-red-500 focus:bg-white transition-all focus:outline-none"
                        autoFocus
                      />
                      <div className="mt-2 text-xs text-gray-500 text-center">
                        Minimum: {formatCurrency(WITHDRAWAL_CONFIG.MIN_AMOUNT)}
                      </div>
                    </div>

                    {quickAmounts.length > 0 && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Pilih Cepat</label>
                        <div className="grid grid-cols-3 gap-2">
                          {quickAmounts.map((preset) => (
                            <motion.button
                              key={preset}
                              onClick={() => setAmount(preset.toString())}
                              className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                                amount === preset.toString()
                                  ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-sm'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                              }`}
                              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                            >
                              {preset >= 1000000 ? `${preset / 1000000}jt` : `${preset / 1000}rb`}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Keterangan (Opsional)</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Masukkan alasan penarikan..."
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 focus:border-red-500 focus:bg-white transition-all focus:outline-none resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="flex items-start gap-2">
                        <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-semibold text-blue-900 mb-1">Waktu Pemrosesan</div>
                          <div className="text-xs text-blue-800">Penarikan diproses dalam 1–2 hari kerja setelah disetujui admin.</div>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      onClick={handleRequestWithdrawal}
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-400 text-white py-4 rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                      whileHover={!submitting ? { scale: 1.01, boxShadow: '0 8px 20px rgba(239,68,68,0.3)' } : undefined}
                      whileTap={!submitting ? { scale: 0.99 } : undefined}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Mengajukan...
                        </>
                      ) : (
                        'Ajukan Penarikan'
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}