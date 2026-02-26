'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { BinaryOrder } from '@/types'
import { formatCurrency } from '@/lib/utils'
import {
  TrendingUp, TrendingDown, Clock, Filter,
  Wallet, RefreshCw, BarChart3, CalendarClock,
  ChevronLeft, ChevronRight, Activity, DollarSign, Target
} from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence, useInView, type Variants } from 'framer-motion'
import { toast, Toaster } from 'sonner'

const ITEMS_PER_PAGE = 10


const GlobalStyles = () => (
  <style jsx global>{`
    /* Entrances — one-shot, GPU only */
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeLeft {
      from { opacity: 0; transform: translateX(-10px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes popIn {
      from { opacity: 0; transform: scale(0.95); }
      to   { opacity: 1; transform: scale(1); }
    }

    .anim-fade-up   { animation: fadeUp   0.4s cubic-bezier(0.22,1,0.36,1) both; opacity:0; }
    .anim-pop-in    { animation: popIn    0.35s cubic-bezier(0.22,1,0.36,1) both; opacity:0; }
    .anim-fade-left { animation: fadeLeft 0.3s cubic-bezier(0.22,1,0.36,1) both; opacity:0; }

    /* Skeleton — single pulse, opacity only */
    @keyframes sk-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
    .sk { animation: sk-pulse 1.8s ease-in-out infinite; }

    /* Static grid background — matches affiliate page */
    .bg-pattern-grid {
      background-color: #f5f6f8;
      background-image:
        linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    body { background-color: #f5f6f8 !important; }

    /* Stat card hover — pure CSS transition */
    .stat-card {
      transition: transform 0.2s cubic-bezier(0.22,1,0.36,1),
                  box-shadow 0.2s ease;
    }
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    }

    /* Stat icon — subtle scale, NO rotate */
    .stat-icon {
      transition: transform 0.2s ease;
    }
    .stat-card:hover .stat-icon { transform: scale(1.1); }

    /* Button press */
    .btn-press {
      transition: transform 0.1s ease, opacity 0.1s ease;
    }
    .btn-press:hover  { opacity: 0.88; }
    .btn-press:active { transform: scale(0.97); }

    /* Table row hover */
    .tr-hover {
      transition: background-color 0.12s ease;
    }
    .tr-hover:hover { background-color: rgb(249 250 251); }

    /* Mobile order row hover */
    .order-row {
      transition: transform 0.15s ease;
    }
    .order-row:active { transform: scale(0.99); background-color: rgb(249 250 251); }

    /* Filter button active */
    .filter-btn {
      transition: transform 0.1s ease, background-color 0.15s ease, color 0.15s ease;
    }
    .filter-btn:active { transform: scale(0.96); }

    /* Refresh spin — only when active */
    .spin { animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Pagination button */
    .page-btn {
      transition: transform 0.1s ease, background-color 0.15s ease;
    }
    .page-btn:not(:disabled):hover  { background-color: rgb(243 244 246); }
    .page-btn:not(:disabled):active { transform: scale(0.96); }

    .scrollbar-hide::-webkit-scrollbar { display:none; }
    .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
  `}</style>
)


const SPRING = { type: 'spring', stiffness: 80, damping: 20 } as const

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING } },
}
const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
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
    <motion.h1 className={className}
      variants={stagger(0.07)} initial="hidden" animate="visible">
      {text.split(' ').map((word, i) => (
        <motion.span key={i} className="inline-block mr-[0.25em]"
          variants={{ hidden: { opacity: 0, y: 24, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...SPRING } } }}>
          {word}
        </motion.span>
      ))}
    </motion.h1>
  )
}

function CountUp({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const [val, setVal] = React.useState(0)
  const triggered = React.useRef(false)
  React.useEffect(() => {
    if (!inView || triggered.current) return
    triggered.current = true
    let start: number
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 800, 1)
      setVal(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, to])
  return <span ref={ref}>{prefix}{val}{suffix}</span>
}


const MobileRowSkeleton = ({ i }: { i: number }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-3 sk" style={{ animationDelay: `${i * 60}ms` }}>
    <div className="w-9 h-9 bg-gray-200 rounded-lg flex-shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="h-4 bg-gray-200 rounded w-24" />
      <div className="h-3 bg-gray-200 rounded w-32" />
    </div>
    <div className="h-5 bg-gray-200 rounded w-14" />
  </div>
)

const DesktopTableRowSkeleton = ({ i }: { i: number }) => (
  <tr className="border-b border-gray-100 sk" style={{ animationDelay: `${i * 50}ms` }}>
    {[...Array(10)].map((_, j) => (
      <td key={j} className="py-4 px-4">
        <div className="h-4 bg-gray-200 rounded w-16 mx-auto" />
      </td>
    ))}
  </tr>
)

const LoadingSkeleton = () => (
  <>
    <style jsx global>{`
      body { background-color:#f5f6f8 !important; }
      .bg-pattern-grid {
        background-color:#f5f6f8;
        background-image:
          linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),
          linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px);
        background-size:40px 40px;
      }
      @keyframes sk-pulse{0%,100%{opacity:1}50%{opacity:0.45}}
      .sk{animation:sk-pulse 1.8s ease-in-out infinite;}
      .scrollbar-hide::-webkit-scrollbar{display:none}
      .scrollbar-hide{-ms-overflow-style:none;scrollbar-width:none}
    `}</style>
    <div className="min-h-screen bg-pattern-grid">
      <Navbar />
      <Toaster position="top-right" />


      <div className="md:hidden max-w-5xl mx-auto px-4 py-6">
        <div className="mb-4">
          <div className="h-3 bg-gray-200 rounded w-32 mb-2 sk" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-xl sk" />
              <div>
                <div className="h-5 bg-gray-200 rounded w-28 mb-1 sk" />
                <div className="h-3 bg-gray-200 rounded w-36 sk" />
              </div>
            </div>
            <div className="h-9 bg-gray-200 rounded-lg w-20 sk" />
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 mb-4 scrollbar-hide snap-x">

          <div className="bg-white rounded-xl p-3 border border-gray-100 flex-shrink-0 w-36 snap-start sk" style={{ animationDelay: '0ms' }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 bg-gray-200 rounded-lg" />
              <div className="h-3 bg-gray-200 rounded w-12" />
            </div>
            <div className="h-5 bg-gray-200 rounded w-24" />
          </div>

          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 flex-shrink-0 w-24 snap-start sk flex flex-col items-center" style={{ animationDelay: `${(i+1)*80}ms` }}>
              <div className="w-7 h-7 bg-gray-200 rounded-lg mb-1" />
              <div className="h-5 bg-gray-200 rounded w-10 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => <MobileRowSkeleton key={i} i={i} />)}
        </div>
      </div>


      <div className="hidden md:block max-w-5xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="h-3 bg-gray-200 rounded w-48 mb-3 sk" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl sk" />
              <div>
                <div className="h-6 bg-gray-200 rounded w-32 mb-2 sk" />
                <div className="h-4 bg-gray-200 rounded w-48 sk" />
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-24 sk" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 sk" style={{ animationDelay: `${i*80}ms` }}>
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div>
                  <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                  <div className="h-6 bg-gray-200 rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sk" style={{ animationDelay: '400ms' }}>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[...Array(10)].map((_, i) => (
                  <th key={i} className="py-4 px-4">
                    <div className="h-3 bg-gray-200 rounded w-16 mx-auto" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => <DesktopTableRowSkeleton key={i} i={i} />)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </>
)

export default function HistoryPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)

  const [allOrders, setAllOrders] = useState<BinaryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<'all' | 'real' | 'demo'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    loadAllOrders()
  }, [user])

  useEffect(() => { setCurrentPage(1) }, [statusFilter, accountFilter])

  const loadAllOrders = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      else setLoading(true)
      const status = statusFilter === 'all' ? undefined : statusFilter
      const response = await api.getOrders(
        status, undefined, undefined,
        accountFilter === 'all' ? undefined : accountFilter
      )
      setAllOrders(response?.data?.orders || response?.orders || [])
    } catch (error) {
      console.error('Gagal memuat pesanan:', error)
      toast.error('Gagal memuat riwayat trading', { style: { background: '#ef4444', color: '#fff' } })
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  const filteredOrders = useMemo(() => {
    let result = [...allOrders]
    if (statusFilter !== 'all') result = result.filter(o => o.status === statusFilter)
    if (accountFilter !== 'all') result = result.filter(o => o.accountType === accountFilter)
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return result
  }, [allOrders, statusFilter, accountFilter])

  const totalItems = filteredOrders.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const displayedOrders = filteredOrders.slice(startIndex, endIndex)

  const handleRefresh = () => loadAllOrders(true)

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFilterChange = (filter: string, type: 'status' | 'account') => {
    if (type === 'status') setStatusFilter(filter)
    else setAccountFilter(filter as 'all' | 'real' | 'demo')
  }

  const stats = useMemo(() => ({
    total: filteredOrders.length,
    won:   filteredOrders.filter(o => o.status === 'WON').length,
    lost:  filteredOrders.filter(o => o.status === 'LOST').length,
    active: filteredOrders.filter(o => o.status === 'ACTIVE').length,
  }), [filteredOrders])

  const totalProfit = useMemo(() => filteredOrders.reduce((s, o) => s + (o.profit || 0), 0), [filteredOrders])
  const winRate = stats.total > 0 ? ((stats.won / stats.total) * 100).toFixed(1) : '0'

  if (!user) return null
  if (loading) return <LoadingSkeleton />

  return (
    <>
      <GlobalStyles />
      <div className="min-h-screen bg-pattern-grid relative">
        <Navbar />
        <Toaster position="top-right" />


        <div className="md:hidden max-w-5xl mx-auto px-4 py-6 pb-28 anim-fade-up">


          <div className="mb-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
              <span>Dasbor</span><span>/</span>
              <span className="text-gray-900 font-medium">Riwayat</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-14 h-14 flex items-center justify-center">
                  <Image src="/riwayat.png" alt="Riwayat" width={56} height={56} className="w-14 h-14 object-contain" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Riwayat Trading</h1>
                  <p className="text-xs text-gray-500">{stats.total} transaksi • Hal {currentPage}/{totalPages}</p>
                </div>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="btn-press flex items-center gap-1.5 px-2.5 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'spin' : ''}`} />
                Perbarui
              </button>
            </div>
          </div>


          <div className="flex gap-3 overflow-x-auto mb-4 scrollbar-hide snap-x anim-pop-in" style={{ animationDelay: '60ms' }}>
            <div className="stat-card bg-gray-100 rounded-xl p-3 border border-gray-200 flex-shrink-0 w-36 snap-start flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-1">
                <div className={`stat-icon w-7 h-7 rounded-lg flex items-center justify-center ${totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <DollarSign className={`w-4 h-4 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <span className="text-[10px] font-medium text-gray-500">Total P&L</span>
              </div>
              <div className={`text-base font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
              </div>
            </div>

            {[
              { icon: <Activity className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', val: stats.total, label: 'Transaksi', color: 'text-gray-900' },
              { icon: <TrendingUp className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', val: stats.won, label: 'Menang', color: 'text-green-600' },
              { icon: <TrendingDown className="w-5 h-5 text-red-600" />, bg: 'bg-red-50', val: stats.lost, label: 'Kalah', color: 'text-red-600' },
              { icon: <Target className="w-5 h-5 text-yellow-600" />, bg: 'bg-yellow-50', val: `${winRate}%`, label: 'Win Rate', color: 'text-yellow-600' },
            ].map((s, i) => (
              <div key={i} className="stat-card bg-gray-100 rounded-xl p-3 border border-gray-200 flex-shrink-0 w-24 snap-start flex flex-col justify-center items-center text-center">
                <div className={`stat-icon w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-1`}>{s.icon}</div>
                <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
                <div className="text-[10px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>


          <div className="mb-4 space-y-3 anim-fade-up" style={{ animationDelay: '100ms' }}>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Akun:</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[{ id:'all', label:'Semua' }, { id:'real', label:'Real' }, { id:'demo', label:'Demo' }].map(a => (
                  <motion.button
                    key={a.id}
                    onClick={() => handleFilterChange(a.id, 'account')}
                    className={`relative filter-btn px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 overflow-hidden ${accountFilter === a.id ? 'text-white' : 'bg-gray-100 text-gray-700'}`}
                    whileTap={{ scale: 0.95 }}>
                    {accountFilter === a.id && <motion.div className="absolute inset-0 bg-blue-500 rounded-lg" layoutId="mobileAccountPill" transition={{ ...SPRING }} />}
                    <span className="relative z-10">{a.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Status:</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[{ id:'all', label:'Semua' }, { id:'ACTIVE', label:'Aktif' }, { id:'WON', label:'Menang' }, { id:'LOST', label:'Kalah' }].map(f => (
                  <motion.button
                    key={f.id}
                    onClick={() => handleFilterChange(f.id, 'status')}
                    className={`relative filter-btn px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 overflow-hidden ${statusFilter === f.id ? 'text-white' : 'bg-gray-100 text-gray-700'}`}
                    whileTap={{ scale: 0.95 }}>
                    {statusFilter === f.id && <motion.div className="absolute inset-0 bg-gray-700 rounded-lg" layoutId="mobileStatusPill" transition={{ ...SPRING }} />}
                    <span className="relative z-10">{f.label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>


          <div className="space-y-2">
            {displayedOrders.length === 0 ? (
              <div className="text-center py-8 px-4 bg-white rounded-xl border border-gray-100 anim-pop-in">
                <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Tidak ada transaksi</h3>
                <p className="text-xs text-gray-500">Coba sesuaikan filter Anda</p>
              </div>
            ) : displayedOrders.map((order, index) => (
              <div
                key={order.id}
                className="order-row anim-fade-left bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between gap-3"
                style={{ animationDelay: `${index * 40}ms` }}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border ${order.direction === 'CALL' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <Image
                    src={order.direction === 'CALL' ? '/buy.png' : '/sell.png'}
                    alt={order.direction === 'CALL' ? 'Buy' : 'Sell'}
                    width={36} height={36} className="w-full h-full object-contain p-0.5"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-bold text-gray-900 truncate">{order.asset_name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${(order.accountType||'demo')==='real' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {(order.accountType||'demo').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span>{formatCurrency(order.amount)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{order.duration}m</span>
                    <span>•</span>
                    <span>{new Date(order.createdAt).toLocaleDateString('id-ID', { month:'short', day:'numeric' })}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${order.status==='WON' ? 'bg-green-100 text-green-700' : order.status==='LOST' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                    {order.status==='WON' ? 'MENANG' : order.status==='LOST' ? 'KALAH' : 'AKTIF'}
                  </span>
                  {order.profit != null
                    ? <span className={`text-xs font-bold ${order.profit>0 ? 'text-green-600' : order.profit<0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {order.profit>0 ? '+' : ''}{formatCurrency(order.profit)}
                      </span>
                    : <span className="text-xs text-gray-400">Tertunda</span>}
                </div>
              </div>
            ))}
          </div>
        </div>


        {totalPages > 1 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50 md:hidden anim-fade-up">
            <div className="max-w-md mx-auto flex items-center justify-between gap-4">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`btn-press flex items-center justify-center gap-1 px-5 py-3 rounded-xl text-sm font-bold min-w-[80px] ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-2 border-blue-600 text-blue-600 shadow-sm'}`}
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg px-4 py-2 min-w-[70px]">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Hal</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-gray-900">{currentPage}</span>
                  <span className="text-gray-400 text-sm font-medium">/</span>
                  <span className="text-sm font-bold text-gray-500">{totalPages}</span>
                </div>
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`btn-press flex items-center justify-center gap-1 px-5 py-3 rounded-xl text-sm font-bold min-w-[80px] ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'}`}
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}


        <div className="hidden md:block max-w-5xl mx-auto px-4 py-6 relative z-10 anim-fade-up">


          <motion.div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            initial="hidden" animate="visible" variants={stagger(0.1)}>
            <motion.div variants={fadeLeft}>
              <motion.div className="flex items-center gap-2 text-xs text-gray-500 mb-1" variants={fadeUp}>
                <span>Dasbor</span><span>/</span>
                <span className="text-gray-900 font-medium">Riwayat</span>
              </motion.div>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
                  <Image src="/riwayat.png" alt="Riwayat" width={56} height={56} className="w-14 h-14 object-contain" />
                </div>
                <div>
                  <AnimatedHeadline text="Riwayat Trading" className="text-2xl sm:text-3xl font-bold text-gray-900" />
                  <motion.p className="text-gray-500 text-sm mt-0.5" variants={fadeUp}>
                    Menampilkan {startIndex + 1}–{Math.min(endIndex, totalItems)} dari {totalItems} transaksi
                  </motion.p>
                </div>
              </div>
            </motion.div>
            <motion.button variants={scaleIn}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              whileHover={{ scale: 1.04, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              whileTap={{ scale: 0.96 }}>
              <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'spin' : ''}`} />
              {refreshing ? 'Memperbarui...' : 'Perbarui'}
            </motion.button>
          </motion.div>


          <Reveal className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
            <motion.div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6"
              variants={stagger(0.08)} initial="hidden" animate="visible">
              {[
                { label:'Total P&L', val: `${totalProfit>=0?'+':''}${formatCurrency(totalProfit)}`, color: totalProfit>=0?'text-green-600':'text-red-600', isText: true },
                { label:'Total Transaksi', val: stats.total, color:'text-gray-900' },
                { label:'Menang', val: stats.won, color:'text-green-600' },
                { label:'Kalah', val: stats.lost, color:'text-red-600' },
                { label:'Win Rate', val: winRate, suffix: '%', color:'text-yellow-600' },
              ].map((s, i) => (
                <motion.div key={i} className="stat-card bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 flex flex-col justify-center" variants={fadeUp}
                  whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', transition: { duration: 0.2 } }}>
                  <div className="text-xs font-medium text-gray-500 mb-1">{s.label}</div>
                  <div className={`text-lg font-bold ${s.color}`}>
                    {s.isText ? s.val : <CountUp to={s.val as number} suffix={(s as any).suffix} />}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </Reveal>


          <Reveal className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 font-medium">Akun:</span>
                  </div>
                  <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1">
                    {[{ id:'all', label:'Semua' }, { id:'real', label:'Real' }, { id:'demo', label:'Demo' }].map(a => (
                      <motion.button key={a.id} onClick={() => handleFilterChange(a.id, 'account')}
                        className={`relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${accountFilter===a.id ? 'text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        {accountFilter===a.id && (
                          <motion.div className="absolute inset-0 bg-blue-600 rounded-lg shadow-md" layoutId="accountPill" transition={{ ...SPRING }} />
                        )}
                        <span className="relative z-10">{a.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 font-medium">Status:</span>
                  </div>
                  <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1">
                    {[{ id:'all', label:'Semua' }, { id:'ACTIVE', label:'Aktif' }, { id:'WON', label:'Menang' }, { id:'LOST', label:'Kalah' }].map(f => (
                      <motion.button key={f.id} onClick={() => handleFilterChange(f.id, 'status')}
                        className={`relative px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${statusFilter===f.id ? 'text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}`}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        {statusFilter===f.id && (
                          <motion.div className="absolute inset-0 bg-gray-700 rounded-lg shadow-md" layoutId="statusPill" transition={{ ...SPRING }} />
                        )}
                        <span className="relative z-10">{f.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>


          <Reveal className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {displayedOrders.length === 0 ? (
              <motion.div className="text-center py-12 px-4" variants={scaleIn} initial="hidden" animate="visible">
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada transaksi</h3>
                <p className="text-gray-500 mb-4">Coba sesuaikan filter Anda</p>
              </motion.div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {['Waktu','Aset','Akun','Tipe','Jumlah','Masuk','Keluar','Durasi','Status','P&L'].map(h => (
                          <th key={h} className="text-left text-xs font-semibold text-gray-600 py-4 px-4">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {displayedOrders.map((order, index) => (
                          <motion.tr
                            key={order.id}
                            className="tr-hover border-b border-gray-100"
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            transition={{ ...SPRING, delay: index * 0.03 }}
                            whileHover={{ backgroundColor: 'rgb(249,250,251)' }}
                          >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <CalendarClock className="w-4 h-4 text-gray-400" />
                              {new Date(order.createdAt).toLocaleDateString('id-ID', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-sm text-gray-900">{order.asset_name}</div>
                            <div className="text-xs text-green-600">+{order.profitRate}%</div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${(order.accountType||'demo')==='real' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              <Wallet className="w-3 h-3" />{(order.accountType||'demo').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {order.direction === 'CALL'
                              ? <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold"><Image src="/buy.png" alt="Buy" width={12} height={12} className="w-3 h-3 object-contain" />CALL</span>
                              : <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold"><Image src="/sell.png" alt="Sell" width={12} height={12} className="w-3 h-3 object-contain" />PUT</span>}
                          </td>
                          <td className="py-4 px-4 text-right text-sm font-semibold text-gray-900">{formatCurrency(order.amount)}</td>
                          <td className="py-4 px-4 text-center"><span className="text-sm font-semibold">{order.entry_price.toFixed(3)}</span></td>
                          <td className="py-4 px-4 text-center">
                            <span className={`text-sm font-semibold ${order.exit_price ? 'text-gray-900' : 'text-gray-400'}`}>
                              {order.exit_price ? order.exit_price.toFixed(3) : '—'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-xs text-gray-700">
                              <Clock className="w-3 h-3" />{order.duration}m
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${order.status==='WON' ? 'bg-green-100 text-green-700' : order.status==='LOST' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                              {order.status==='WON' ? 'MENANG' : order.status==='LOST' ? 'KALAH' : 'AKTIF'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {order.profit != null
                              ? <span className={`text-sm font-bold ${order.profit>0 ? 'text-green-600' : order.profit<0 ? 'text-red-600' : 'text-gray-500'}`}>
                                  {order.profit>0 ? '+' : ''}{formatCurrency(order.profit)}
                                </span>
                              : <span className="text-gray-400">—</span>}
                          </td>
                        </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>


                {totalPages > 1 && (
                  <div className="border-t border-gray-200 px-4 py-5">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Menampilkan {startIndex + 1} sampai {Math.min(endIndex, totalItems)} dari {totalItems} transaksi
                      </div>
                      <div className="flex items-center gap-2 text-black">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
                          className="page-btn flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 text-sm font-medium">
                          <ChevronLeft className="w-4 h-4" /> Sebelumnya
                        </button>
                        <div className="flex items-center gap-1">
                          {[...Array(totalPages)].map((_, index) => {
                            const page = index + 1
                            const near = page >= currentPage - 1 && page <= currentPage + 1
                            if (page === 1 || page === totalPages || near) {
                              return (
                                <button key={page} onClick={() => handlePageChange(page)}
                                  className={`page-btn min-w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium ${currentPage===page ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
                                  {page}
                                </button>
                              )
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                              return <span key={page} className="px-2 text-gray-400">...</span>
                            }
                            return null
                          })}
                        </div>
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
                          className="page-btn flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 text-sm font-medium">
                          Selanjutnya <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </Reveal>
        </div>
      </div>
    </>
  )
}