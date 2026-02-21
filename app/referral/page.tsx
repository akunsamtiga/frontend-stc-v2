'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  UserPlus,
  RefreshCw,
  Copy,
  Check,
  Users,
  DollarSign,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Activity,
  Share2,
  Filter,
  CircleDollarSign,
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import { formatCurrency } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AffiliateSummary {
  totalReferrals: number
  completedReferrals: number
  pendingReferrals: number
  totalCommission: number
  commissionBreakdown: {
    fromStandard: number
    fromGold: number
    fromVIP: number
  }
}

interface AffiliateReferral {
  id: string
  referee_id: string
  refereeEmail: string
  refereeStatus: 'standard' | 'gold' | 'vip'
  status: 'completed' | 'pending'
  commission_amount: number
  completed_at: string | null
  createdAt: string
}

// ─── Animation variants ───────────────────────────────────────────────────────

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

// ─── Global Styles ────────────────────────────────────────────────────────────

const GlobalStyles = () => (
  <style jsx global>{`
    @keyframes grid-shimmer-up {
      0%   { background-position: center 130%, center center, center center; }
      100% { background-position: center -30%, center center, center center; }
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
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    body { background-color: #ffffff !important; }
  `}</style>
)

// ─── Skeletons ────────────────────────────────────────────────────────────────

const SkeletonBlock = ({ w = 'w-20', h = 'h-4' }: { w?: string; h?: string }) => (
  <div className={`${h} ${w} bg-gray-200 rounded animate-pulse`} />
)

const LoadingSkeleton = () => (
  <>
    <GlobalStyles />
    <div className="min-h-screen bg-pattern-grid">
      <Navbar />
      <Toaster position="top-right" />

      {/* Skeleton Mobile */}
      <div className="md:hidden container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl">
        <div className="mb-4">
          {/* Breadcrumb skeleton */}
          <SkeletonBlock w="w-32" h="h-3" />
          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-8 bg-gray-200 rounded-xl animate-pulse" />
            <div className="space-y-1">
              <SkeletonBlock w="w-32" h="h-5" />
              <SkeletonBlock w="w-40" h="h-3" />
            </div>
          </div>
        </div>
        <div className="h-28 bg-gray-200 rounded-xl animate-pulse mb-4" />
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 animate-pulse flex-shrink-0 w-28 h-20" />
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 animate-pulse">
              <div className="w-9 h-9 bg-gray-200 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <SkeletonBlock w="w-24" />
                <SkeletonBlock w="w-32" h="h-3" />
              </div>
              <SkeletonBlock w="w-16" h="h-6" />
            </div>
          ))}
        </div>
      </div>

      {/* Skeleton Desktop */}
      <div className="hidden md:block container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
            <div className="space-y-2">
              <SkeletonBlock w="w-40" h="h-6" />
              <SkeletonBlock w="w-52" />
            </div>
          </div>
          <SkeletonBlock w="w-28" h="h-10" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <SkeletonBlock w="w-20" h="h-3" />
                  <SkeletonBlock w="w-16" h="h-6" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <SkeletonBlock w="w-32" h="h-8" />
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[...Array(5)].map((_, i) => (
                  <th key={i} className="py-4 px-4">
                    <SkeletonBlock w="w-16" h="h-3" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(8)].map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="py-4 px-4">
                      <SkeletonBlock />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </>
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 10

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })

const COMMISSION_PER_REFEREE_STATUS: Record<string, number> = {
  standard: 25_000,
  gold: 100_000,
  vip: 400_000,
}

const STATUS_BADGE: Record<string, string> = {
  completed: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
}
const STATUS_LABEL: Record<string, string> = {
  completed: 'Selesai',
  pending: 'Menunggu Deposit',
}
const REFEREE_STATUS_BADGE: Record<string, string> = {
  standard: 'bg-gray-100 text-gray-600',
  gold: 'bg-yellow-100 text-yellow-700',
  vip: 'bg-purple-100 text-purple-700',
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReferralPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [referralCode, setReferralCode] = useState<string>('')
  const [summary, setSummary] = useState<AffiliateSummary | null>(null)
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([])

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    if (!user) router.push('/')
  }, [user, router])

  useEffect(() => {
    if (user) fetchAll()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  const fetchAll = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const client = (api as any).client

      const [profileRes, affiliateRes] = await Promise.allSettled([
        api.getProfile(),
        client.get('/user/affiliate'),
      ])

      if (profileRes.status === 'fulfilled') {
        const p = profileRes.value
        const profileData = p?.data ?? p
        const userData = profileData?.user ?? profileData
        setReferralCode(userData?.referralCode ?? '')
      }

      if (affiliateRes.status === 'fulfilled') {
        const a = affiliateRes.value
        const affiliateData = a?.data ?? a
        setSummary(affiliateData?.summary ?? null)
        const list = affiliateData?.referrals ?? []
        setReferrals(Array.isArray(list) ? list : [])
      } else {
        toast.error('Gagal memuat data referral')
      }
    } catch (error) {
      console.error('fetchAll referral error:', error)
      toast.error('Gagal memuat data referral')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  const handleRefresh = useCallback(() => fetchAll(true), [fetchAll])

  const referralLink = typeof window !== 'undefined' && referralCode
    ? `${window.location.origin}/register?ref=${referralCode}`
    : ''

  const copyCode = useCallback(() => {
    if (!referralCode) return
    navigator.clipboard.writeText(referralCode).then(() => {
      setCopiedCode(true)
      toast.success('Kode referral disalin!')
      setTimeout(() => setCopiedCode(false), 2000)
    })
  }, [referralCode])

  const copyLink = useCallback(() => {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopiedLink(true)
      toast.success('Link referral disalin!')
      setTimeout(() => setCopiedLink(false), 2000)
    })
  }, [referralLink])

  const shareWhatsApp = useCallback(() => {
    if (!referralCode) return
    const text = encodeURIComponent(
      `Hei! Bergabunglah di Stouch dan mulai trading binary option!\n\nKode referral: *${referralCode}*\nDaftar di: ${referralLink}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }, [referralCode, referralLink])

  const filteredReferrals = useMemo(() => {
    let r = [...referrals]
    if (statusFilter !== 'all') r = r.filter((x) => x.status === statusFilter)
    return r.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [referrals, statusFilter])

  const totalItems = filteredReferrals.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const displayed = filteredReferrals.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  const handlePageChange = useCallback((p: number) => {
    if (p >= 1 && p <= totalPages) {
      setCurrentPage(p)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [totalPages])

  if (!user) return null
  if (loading) return <LoadingSkeleton />

  return (
    <>
      <GlobalStyles />
      <div className="min-h-screen bg-pattern-grid">
        <Navbar />
        <Toaster position="top-right" />

        {/* ══════════════════════════════════════════════════
            MOBILE VIEW
        ══════════════════════════════════════════════════ */}
        <motion.div
          className="md:hidden container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-7xl pb-28"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <motion.div className="mb-4" variants={fadeIn} initial="hidden" animate="visible">
            {/* ✅ Breadcrumb Mobile */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <span>Dasbor</span>
              <span>/</span>
              <span className="text-gray-900 font-medium">Undang Teman</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Undang Teman</h1>
                  <p className="text-xs text-gray-500">
                    {summary?.totalReferrals ?? 0} referral · {summary?.completedReferrals ?? 0} selesai
                  </p>
                </div>
              </div>
              <motion.button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-2.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 active:bg-gray-100"
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                Perbarui
              </motion.button>
            </div>
          </motion.div>

          {/* Referral Code Card */}
          <motion.div
            className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm"
            variants={fadeIn} initial="hidden" animate="visible"
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Kode Referralmu</p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 font-mono text-base font-bold text-blue-600 tracking-widest">
                {referralCode || '—'}
              </div>
              <motion.button
                onClick={copyCode}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                  copiedCode ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-700 active:bg-gray-50'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Tersalin' : 'Salin'}
              </motion.button>
            </div>
            <div className="flex gap-2">
              <motion.button
                onClick={copyLink}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold border transition-all ${
                  copiedLink ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-700'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Salin Link
              </motion.button>
              <motion.button
                onClick={shareWhatsApp}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold bg-green-500 text-white"
                whileTap={{ scale: 0.95 }}
              >
                <Share2 className="w-3.5 h-3.5" /> WhatsApp
              </motion.button>
            </div>
          </motion.div>

          {/* Stats horizontal scroll */}
          <motion.div
            className="flex gap-3 overflow-x-auto mb-4 scrollbar-visible snap-x"
            variants={staggerContainer} initial="hidden" animate="visible"
          >
            {[
              {
                icon: <CircleDollarSign className="w-4 h-4 text-green-600" />,
                bg: 'bg-green-100',
                label: 'Total Komisi',
                value: formatCurrency(summary?.totalCommission ?? 0),
                color: 'text-green-600',
              },
              {
                icon: <Users className="w-4 h-4 text-blue-600" />,
                bg: 'bg-blue-100',
                label: 'Total Referral',
                value: String(summary?.totalReferrals ?? 0),
                color: 'text-blue-600',
              },
              {
                icon: <TrendingUp className="w-4 h-4 text-purple-600" />,
                bg: 'bg-purple-100',
                label: 'Selesai',
                value: String(summary?.completedReferrals ?? 0),
                color: 'text-purple-600',
              },
              {
                icon: <Clock className="w-4 h-4 text-yellow-600" />,
                bg: 'bg-yellow-100',
                label: 'Pending',
                value: String(summary?.pendingReferrals ?? 0),
                color: 'text-yellow-600',
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="bg-white rounded-xl p-3 border border-gray-100 flex-shrink-0 w-32 snap-start"
                variants={fadeIn} whileTap={{ scale: 0.98 }}
              >
                <div className={`w-7 h-7 ${s.bg} rounded-lg flex items-center justify-center mb-2`}>{s.icon}</div>
                <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Commission breakdown */}
          {summary && (summary.commissionBreakdown.fromGold > 0 || summary.commissionBreakdown.fromVIP > 0) && (
            <motion.div
              className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 text-xs text-blue-700"
              variants={fadeIn} initial="hidden" animate="visible"
            >
              <p className="font-semibold mb-1">Rincian Komisi</p>
              <div className="flex gap-4">
                <span>Standard: {formatCurrency(summary.commissionBreakdown.fromStandard)}</span>
                <span>Gold: {formatCurrency(summary.commissionBreakdown.fromGold)}</span>
                <span>VIP: {formatCurrency(summary.commissionBreakdown.fromVIP)}</span>
              </div>
            </motion.div>
          )}

          {/* Filter chips */}
          <motion.div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide" variants={fadeIn} initial="hidden" animate="visible">
            {[['all', 'Semua'], ['completed', 'Selesai'], ['pending', 'Menunggu Deposit']].map(([id, label]) => (
              <motion.button
                key={id}
                onClick={() => setStatusFilter(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all ${
                  statusFilter === id ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                {label}
              </motion.button>
            ))}
          </motion.div>

          {/* Referral List */}
          <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="visible">
            <AnimatePresence>
              {displayed.length === 0 ? (
                <motion.div className="text-center py-8 bg-white rounded-xl border border-gray-100" variants={fadeIn}>
                  <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-900">Belum ada referral</p>
                  <p className="text-xs text-gray-500 mt-1">Ajak temanmu daftar dan lakukan deposit!</p>
                </motion.div>
              ) : (
                displayed.map((r) => (
                  <motion.div
                    key={r.id}
                    className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3"
                    variants={slideIn}
                    whileTap={{ backgroundColor: 'rgb(249 250 251)' }}
                  >
                    <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.refereeEmail}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${REFEREE_STATUS_BADGE[r.refereeStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                          {r.refereeStatus}
                        </span>
                        <span className="text-[10px] text-gray-400">{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-xs font-bold ${r.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                        {r.status === 'completed'
                          ? `+${formatCurrency(r.commission_amount)}`
                          : `~${formatCurrency(COMMISSION_PER_REFEREE_STATUS[r.refereeStatus] ?? 25_000)}`}
                      </p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50 md:hidden"
            variants={fadeIn} initial="hidden" animate="visible"
          >
            <div className="max-w-md mx-auto flex items-center justify-between gap-4">
              <motion.button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center gap-1 px-5 py-3 rounded-xl text-sm font-bold min-w-[80px] ${
                  currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-2 border-blue-600 text-blue-600'
                }`}
                whileTap={currentPage !== 1 ? { scale: 0.95 } : undefined}
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </motion.button>
              <div className="flex flex-col items-center bg-gray-100 rounded-lg px-4 py-2 min-w-[70px]">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Hal</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-gray-900">{currentPage}</span>
                  <span className="text-gray-400 text-sm">/</span>
                  <span className="text-sm font-bold text-gray-500">{totalPages}</span>
                </div>
              </div>
              <motion.button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center gap-1 px-5 py-3 rounded-xl text-sm font-bold min-w-[80px] ${
                  currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                }`}
                whileTap={currentPage !== totalPages ? { scale: 0.95 } : undefined}
              >
                Next <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════
            DESKTOP VIEW
        ══════════════════════════════════════════════════ */}
        <motion.div
          className="hidden md:block container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Breadcrumb + Header */}
          <motion.div className="mb-6" variants={fadeIn} initial="hidden" animate="visible">
            <motion.div className="flex items-center gap-2 text-sm text-gray-500 mb-3" variants={staggerContainer}>
              <motion.span variants={fadeIn}>Dasbor</motion.span>
              <span>/</span>
              <motion.span variants={fadeIn} className="text-gray-900 font-medium">Undang Teman</motion.span>
            </motion.div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md"
                  whileHover={{ rotate: 90 }}
                >
                  <UserPlus className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <motion.h1 className="text-2xl font-bold text-gray-900" variants={fadeIn}>Program Referral</motion.h1>
                  <motion.p className="text-sm text-gray-500" variants={fadeIn}>
                    {summary?.totalReferrals ?? 0} total referral · {summary?.completedReferrals ?? 0} selesai · {summary?.pendingReferrals ?? 0} menunggu deposit
                  </motion.p>
                </div>
              </div>
              <motion.button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-white text-black border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Memperbarui...' : 'Perbarui'}
              </motion.button>
            </div>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm"
            variants={staggerContainer} initial="hidden" animate="visible"
          >
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              <motion.div className="flex items-center gap-4" variants={fadeIn} whileHover={{ scale: 1.02 }}>
                <motion.div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center" whileHover={{ rotate: 360 }}>
                  <CircleDollarSign className="w-5 h-5 text-green-600" />
                </motion.div>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Total Komisi</div>
                  <div className="text-lg font-bold text-green-600">{formatCurrency(summary?.totalCommission ?? 0)}</div>
                </div>
              </motion.div>

              <motion.div className="flex items-center gap-4" variants={fadeIn} whileHover={{ scale: 1.02 }}>
                <motion.div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center" whileHover={{ rotate: 360 }}>
                  <Users className="w-5 h-5 text-blue-600" />
                </motion.div>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Total Referral</div>
                  <div className="text-lg font-bold text-gray-900">{String(summary?.totalReferrals ?? 0)}</div>
                </div>
              </motion.div>

              <motion.div className="flex items-center gap-4" variants={fadeIn} whileHover={{ scale: 1.02 }}>
                <motion.div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center" whileHover={{ rotate: 360 }}>
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </motion.div>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Referral Selesai</div>
                  <div className="text-lg font-bold text-purple-600">{String(summary?.completedReferrals ?? 0)}</div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Referral Code Card */}
          <motion.div
            className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm"
            variants={fadeIn} initial="hidden" animate="visible"
          >
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Kode & Link Referralmu</p>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 font-mono text-xl font-bold text-blue-600 tracking-widest">
                {referralCode || '—'}
              </div>
              <motion.button
                onClick={copyCode}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  copiedCode ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? 'Tersalin!' : 'Salin Kode'}
              </motion.button>
              <motion.button
                onClick={copyLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                  copiedLink ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedLink ? 'Link Tersalin!' : 'Salin Link'}
              </motion.button>
              <motion.button
                onClick={shareWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                <Share2 className="w-4 h-4" /> Bagikan WhatsApp
              </motion.button>
            </div>
            {referralLink && (
              <p className="text-xs text-gray-400 mt-2 font-mono truncate max-w-lg">{referralLink}</p>
            )}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1.5">
                Komisi ditentukan berdasarkan <strong className="text-gray-700">total deposit teman yang kamu undang</strong>:
              </p>
              <div className="flex items-center gap-6 text-xs flex-wrap">
                <span className="text-gray-600">
                  Standard (deposit awal): <strong className="text-gray-800">{formatCurrency(25_000)}</strong>
                </span>
                <span className="text-yellow-700">
                  Gold: <strong>{formatCurrency(100_000)}</strong>
                </span>
                <span className="text-purple-700">
                  VIP: <strong>{formatCurrency(400_000)}</strong>
                </span>
              </div>
            </div>
          </motion.div>

          {/* Table */}
          <motion.div
            className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
            variants={fadeIn} initial="hidden" animate="visible"
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
              <p className="text-sm font-semibold text-gray-900">Daftar Referral ({totalItems})</p>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                {[['all', 'Semua'], ['completed', 'Selesai'], ['pending', 'Menunggu Deposit']].map(([id, label]) => (
                  <motion.button
                    key={id}
                    onClick={() => setStatusFilter(id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      statusFilter === id ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  >
                    {label}
                  </motion.button>
                ))}
              </div>
            </div>

            {displayed.length === 0 ? (
              <motion.div className="text-center py-14 px-4" variants={fadeIn}>
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum ada referral</h3>
                <p className="text-sm text-gray-500">Bagikan kode referralmu dan ajak teman untuk mendaftar!</p>
              </motion.div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {['Email Teman', 'Tanggal Daftar', 'Status Akun Teman', 'Komisi Didapat', 'Status Referral'].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold text-gray-600 py-4 px-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {displayed.map((r) => (
                          <motion.tr
                            key={r.id}
                            className="border-b border-gray-100 hover:bg-gray-50"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                          >
                            <td className="py-4 px-4 font-semibold text-sm text-gray-900">{r.refereeEmail}</td>
                            <td className="py-4 px-4 text-sm text-gray-600">{formatDate(r.createdAt)}</td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-bold capitalize ${REFEREE_STATUS_BADGE[r.refereeStatus] ?? 'bg-gray-100 text-gray-500'}`}>
                                {r.refereeStatus}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-sm font-bold">
                              {r.status === 'completed' ? (
                                <span className="text-green-600">+{formatCurrency(r.commission_amount)}</span>
                              ) : (
                                <span className="text-gray-400" title={`Estimasi jika teman deposit hingga status ${r.refereeStatus}`}>
                                  ~{formatCurrency(COMMISSION_PER_REFEREE_STATUS[r.refereeStatus] ?? 25_000)}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                {STATUS_LABEL[r.status] ?? r.status}
                              </span>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Desktop Pagination */}
                {totalPages > 1 && (
                  <motion.div
                    className="border-t border-gray-200 px-4 py-5"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Menampilkan {startIndex + 1}–{Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} dari {totalItems} referral
                      </div>
                      <div className="flex items-center gap-2 text-black">
                        <motion.button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 text-sm font-medium"
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        >
                          <ChevronLeft className="w-4 h-4" /> Sebelumnya
                        </motion.button>
                        <div className="flex items-center gap-1">
                          {[...Array(totalPages)].map((_, index) => {
                            const page = index + 1
                            const isNear = page >= currentPage - 1 && page <= currentPage + 1
                            if (page === 1 || page === totalPages || isNear) {
                              return (
                                <motion.button
                                  key={page}
                                  onClick={() => handlePageChange(page)}
                                  className={`min-w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium ${
                                    currentPage === page ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-700'
                                  }`}
                                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                >
                                  {page}
                                </motion.button>
                              )
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                              return <span key={page} className="px-2 text-gray-400">...</span>
                            }
                            return null
                          })}
                        </div>
                        <motion.button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 text-sm font-medium"
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        >
                          Selanjutnya <ChevronRight className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}