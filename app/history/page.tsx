'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { BinaryOrder } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Filter,
  Wallet,
  RefreshCw,
  BarChart3,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Activity,
  DollarSign,
  Target
} from 'lucide-react'
import { toast, Toaster } from 'sonner'

const ITEMS_PER_PAGE = 10

// Animation variants
const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.25, ease: "easeOut" }
  }
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
}

const slideIn: Variants = {
  hidden: { x: -15, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { duration: 0.25 }
  }
}

// ============================================
// STYLES COMPONENT - Pattern sama seperti Balance
// ============================================
const GlobalStyles = () => (
  <style jsx global>{`
    /* Grid Pattern - Background putih, pattern kotak-kotak gelap 8% opacity, jarak lebar */
    .bg-pattern-grid {
      background-color: #ffffff;
      background-image: 
        linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
      background-size: 40px 40px;
      background-position: center center;
    }

    /* Alternative: Grid dengan jarak 48px */
    .bg-pattern-grid-48 {
      background-color: #ffffff;
      background-image: 
        linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
      background-size: 48px 48px;
      background-position: center center;
    }

    /* Alternative: Grid dengan jarak 56px */
    .bg-pattern-grid-56 {
      background-color: #ffffff;
      background-image: 
        linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
      background-size: 56px 56px;
      background-position: center center;
    }

    /* Scrollbar hide utility */
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
)

// Skeleton components
const MobileStatCardSkeleton = () => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse flex-shrink-0 w-28">
    <div className="w-5 h-5 bg-gray-200 rounded-lg mx-auto mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-12 mx-auto mb-1"></div>
    <div className="h-3 bg-gray-200 rounded w-8 mx-auto"></div>
  </div>
)

const DesktopStatCardSkeleton = () => (
  <motion.div 
    className="bg-white rounded-xl p-4 md:p-5 border border-gray-100"
    variants={slideIn}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-lg"></div>
      <div className="h-3 bg-gray-200 rounded w-20 md:w-24"></div>
    </div>
    <div className="h-8 md:h-10 bg-gray-200 rounded w-16 md:w-20 mb-1 md:mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-12 md:w-16"></div>
  </motion.div>
)

const DesktopTableRowSkeleton = () => (
  <motion.tr className="border-b border-gray-100" variants={slideIn}>
    {[...Array(10)].map((_, i) => (
      <td key={i} className="py-4 px-4">
        <div className="h-4 bg-gray-200 rounded w-16 md:w-20 mx-auto"></div>
      </td>
    ))}
  </motion.tr>
)

const LoadingSkeleton = () => (
  <>
    {/* INJECT STYLE GLOBAL KHUSUS UNTUK SKELETON */}
    <style jsx global>{`
      /* Grid Pattern - Background putih dengan pola halus */
      .bg-pattern-grid {
        background-color: #ffffff !important;
        background-image: 
          linear-gradient(rgba(0, 0, 0, 0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, 0.08) 1px, transparent 1px);
        background-size: 40px 40px;
        background-position: center center;
      }
      
      /* Scrollbar hide utility */
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      
      /* Pastikan body tidak hitam saat loading */
      body {
        background-color: #ffffff !important;
      }
    `}</style>
    
    <div className="min-h-screen bg-pattern-grid">
      <Navbar />
      <Toaster position="top-right" />
      
      {/* Mobile Skeleton */}
      <div className="md:hidden container mx-auto px-3 py-4">
        <div className="mb-4">
          <div className="h-3 bg-gray-200 rounded w-36 mb-2"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-xl"></div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-28 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-36"></div>
              </div>
            </div>
            <div className="h-9 bg-gray-200 rounded-lg w-20"></div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {[...Array(5)].map((_, i) => <MobileStatCardSkeleton key={i} />)}
        </div>

        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between gap-3 animate-pulse">
              <div className="w-9 h-9 bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>

        <div className="h-24"></div>
      </div>

      {/* Desktop Skeleton */}
      <div className="hidden md:block container mx-auto px-4 py-6">
        <motion.div className="mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <div className="h-3 bg-gray-200 rounded w-48 mb-3"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
              <div>
                <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
          </div>
        </motion.div>

        <motion.div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6" variants={staggerContainer} initial="hidden" animate="visible">
          {[...Array(5)].map((_, i) => <DesktopStatCardSkeleton key={i} />)}
        </motion.div>

        <motion.div className="bg-white rounded-xl border border-gray-200 overflow-hidden" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <table className="w-full">
            <thead>
              <motion.tr className="bg-gray-50 border-b border-gray-200" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                {[...Array(10)].map((_, i) => (
                  <th key={i} className="text-left text-xs font-semibold text-gray-600 py-4 px-4">
                    <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
                  </th>
                ))}
              </motion.tr>
            </thead>
            <tbody>
              {[...Array(10)].map((_, i) => <DesktopTableRowSkeleton key={i} />)}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  </>
)

export default function HistoryPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  // State untuk semua data (fetched sekali)
  const [allOrders, setAllOrders] = useState<BinaryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<'all' | 'real' | 'demo'>('all')
  
  // Pagination state (client-side)
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch semua data sekali (tanpa pagination params)
  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadAllOrders()
  }, [user])

  // Reset ke page 1 ketika filter berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, accountFilter])

  const loadAllOrders = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      else setLoading(true)
      
      // Fetch SEMUA data tanpa limit/page
      const status = statusFilter === 'all' ? undefined : statusFilter
      const response = await api.getOrders(
        status, 
        undefined, // page - tidak dikirim ke API
        undefined, // limit - tidak dikirim ke API (atau set 9999)
        accountFilter === 'all' ? undefined : accountFilter
      )
      
      const ordersList = response?.data?.orders || response?.orders || []
      setAllOrders(ordersList)
      
    } catch (error) {
      console.error('Gagal memuat pesanan:', error)
      toast.error('Gagal memuat riwayat trading', {
        style: { background: '#ef4444', color: '#fff' }
      })
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  // Client-side filtering & pagination logic
  const filteredOrders = useMemo(() => {
    let result = [...allOrders]
    
    // Filter berdasarkan status (jika belum difilter di API)
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter)
    }
    
    // Filter berdasarkan account type
    if (accountFilter !== 'all') {
      result = result.filter(order => order.accountType === accountFilter)
    }
    
    // Sort by date desc
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    return result
  }, [allOrders, statusFilter, accountFilter])

  // Slice untuk pagination
  const totalItems = filteredOrders.length
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const displayedOrders = filteredOrders.slice(startIndex, endIndex)

  const handleRefresh = async () => {
    await loadAllOrders(true)
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleFilterChange = (filter: string, type: 'status' | 'account') => {
    if (type === 'status') {
      setStatusFilter(filter)
    } else {
      setAccountFilter(filter as 'all' | 'real' | 'demo')
    }
  }

  // Stats berdasarkan filtered data (atau allOrders untuk global stats)
  const stats = useMemo(() => {
    return {
      total: filteredOrders.length,
      won: filteredOrders.filter(o => o.status === 'WON').length,
      lost: filteredOrders.filter(o => o.status === 'LOST').length,
      active: filteredOrders.filter(o => o.status === 'ACTIVE').length,
    }
  }, [filteredOrders])

  const totalProfit = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.profit || 0), 0)
  }, [filteredOrders])

  const winRate = stats.total > 0 ? ((stats.won / stats.total) * 100).toFixed(1) : '0'

  if (!user) return null
  if (loading) return <LoadingSkeleton />

  return (
    <>
      <GlobalStyles />
      <div className="min-h-screen bg-pattern-grid">
        <Navbar />
        <Toaster position="top-right" />
        
        {/* MOBILE VIEW */}
        <motion.div 
          className="md:hidden container mx-auto px-3 py-4 pb-28"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {/* Header */}
          <motion.div className="mb-4" variants={fadeIn} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Riwayat Trading</h1>
                  <p className="text-xs text-gray-500">
                    {stats.total} transaksi • Hal {currentPage}/{totalPages}
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

          {/* Horizontal Stats */}
          <motion.div className="flex gap-3 overflow-x-auto pb-2 mb-4 scrollbar-hide snap-x" variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div className="bg-white rounded-xl p-3 border border-gray-100 flex-shrink-0 w-36 snap-start flex flex-col justify-center" variants={fadeIn} whileTap={{ scale: 0.98 }}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  <DollarSign className={`w-4 h-4 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <span className="text-[10px] font-medium text-gray-500">Total P&L</span>
              </div>
              <div className={`text-base font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
              </div>
            </motion.div>

            <motion.div className="bg-white rounded-xl p-3 border border-gray-100 flex-shrink-0 w-28 snap-start flex flex-col justify-center items-center text-center" variants={fadeIn} whileTap={{ scale: 0.98 }}>
              <Activity className="w-5 h-5 text-blue-600 mb-1" />
              <div className="text-lg font-bold text-gray-900">{stats.total}</div>
              <div className="text-[10px] text-gray-500">Transaksi</div>
            </motion.div>

            <motion.div className="bg-white rounded-xl p-3 border border-gray-100 flex-shrink-0 w-24 snap-start flex flex-col justify-center items-center text-center" variants={fadeIn} whileTap={{ scale: 0.98 }}>
              <TrendingUp className="w-5 h-5 text-green-600 mb-1" />
              <div className="text-lg font-bold text-green-600">{stats.won}</div>
              <div className="text-[10px] text-gray-500">Menang</div>
            </motion.div>

            <motion.div className="bg-white rounded-xl p-3 border border-gray-100 flex-shrink-0 w-24 snap-start flex flex-col justify-center items-center text-center" variants={fadeIn} whileTap={{ scale: 0.98 }}>
              <TrendingDown className="w-5 h-5 text-red-600 mb-1" />
              <div className="text-lg font-bold text-red-600">{stats.lost}</div>
              <div className="text-[10px] text-gray-500">Kalah</div>
            </motion.div>

            <motion.div className="bg-white rounded-xl p-3 border border-gray-100 flex-shrink-0 w-28 snap-start flex flex-col justify-center items-center text-center mr-1" variants={fadeIn} whileTap={{ scale: 0.98 }}>
              <Target className="w-5 h-5 text-yellow-600 mb-1" />
              <div className="text-lg font-bold text-yellow-600">{winRate}%</div>
              <div className="text-[10px] text-gray-500">Win Rate</div>
            </motion.div>
          </motion.div>

          {/* Filters */}
          <motion.div className="mb-4 space-y-3" variants={fadeIn} initial="hidden" animate="visible">
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-xs font-medium text-gray-600">Akun:</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[{ id: 'all', label: 'Semua' }, { id: 'real', label: 'Real' }, { id: 'demo', label: 'Demo' }].map((account) => (
                  <motion.button
                    key={account.id}
                    onClick={() => handleFilterChange(account.id, 'account')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                      accountFilter === account.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {account.label}
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
                {[{ id: 'all', label: 'Semua' }, { id: 'ACTIVE', label: 'Aktif' }, { id: 'WON', label: 'Menang' }, { id: 'LOST', label: 'Kalah' }].map((f) => (
                  <motion.button
                    key={f.id}
                    onClick={() => handleFilterChange(f.id, 'status')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                      statusFilter === f.id ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                    }`}
                    whileTap={{ scale: 0.95 }}
                  >
                    {f.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Orders List */}
          <motion.div className="space-y-2" variants={staggerContainer} initial="hidden" animate="visible">
            <AnimatePresence>
              {displayedOrders.length === 0 ? (
                <motion.div className="text-center py-8 px-4 bg-white rounded-xl border border-gray-100" variants={fadeIn}>
                  <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">Tidak ada transaksi</h3>
                  <p className="text-xs text-gray-500">Coba sesuaikan filter Anda</p>
                </motion.div>
              ) : (
                displayedOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    className="bg-white border border-gray-100 rounded-xl p-3 flex items-center justify-between gap-3"
                    variants={slideIn}
                    whileTap={{ backgroundColor: 'rgb(249 250 251)' }}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${order.direction === 'CALL' ? 'bg-green-100' : 'bg-red-100'}`}>
                      {order.direction === 'CALL' ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-sm font-bold text-gray-900 truncate">{order.asset_name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${(order.accountType || 'demo') === 'real' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {(order.accountType || 'demo').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500">
                        <span>{formatCurrency(order.amount)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{order.duration}m</span>
                        <span>•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.status === 'WON' ? 'bg-green-100 text-green-700' : order.status === 'LOST' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>{order.status === 'WON' ? 'MENANG' : order.status === 'LOST' ? 'KALAH' : 'AKTIF'}</span>
                      {order.profit !== null && order.profit !== undefined ? (
                        <span className={`text-xs font-bold ${order.profit > 0 ? 'text-green-600' : order.profit < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                          {order.profit > 0 ? '+' : ''}{formatCurrency(order.profit)}
                        </span>
                      ) : <span className="text-xs text-gray-400">Tertunda</span>}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <motion.div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 px-4 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-50 md:hidden" variants={fadeIn} initial="hidden" animate="visible">
            <div className="max-w-md mx-auto flex items-center justify-between gap-4">
              <motion.button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`flex items-center justify-center gap-1 px-5 py-3 rounded-xl text-sm font-bold transition-all min-w-[80px] ${
                  currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white border-2 border-blue-600 text-blue-600 shadow-sm active:scale-95'
                }`}
                whileTap={currentPage !== 1 ? { scale: 0.95 } : undefined}
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </motion.button>

              <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg px-4 py-2 min-w-[70px]">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Hal</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-gray-900">{currentPage}</span>
                  <span className="text-gray-400 text-sm font-medium">/</span>
                  <span className="text-sm font-bold text-gray-500">{totalPages}</span>
                </div>
              </div>

              <motion.button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`flex items-center justify-center gap-1 px-5 py-3 rounded-xl text-sm font-bold transition-all min-w-[80px] ${
                  currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 active:scale-95'
                }`}
                whileTap={currentPage !== totalPages ? { scale: 0.95 } : undefined}
              >
                Next <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* DESKTOP VIEW */}
        <motion.div className="hidden md:block container mx-auto px-4 py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          {/* Desktop Header */}
          <motion.div className="mb-6" variants={fadeIn} initial="hidden" animate="visible">
            <motion.div className="flex items-center gap-2 text-sm text-gray-500 mb-3" variants={staggerContainer}>
              <motion.span variants={fadeIn}>Dasbor</motion.span>
              <span>/</span>
              <motion.span variants={fadeIn} className="text-gray-900 font-medium">Riwayat</motion.span>
            </motion.div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md" whileHover={{ rotate: 90 }}>
                  <BarChart3 className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <motion.h1 className="text-2xl font-bold text-gray-900" variants={fadeIn}>Riwayat Trading</motion.h1>
                  <motion.p className="text-sm text-gray-500" variants={fadeIn}>
                    Menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems} transaksi • Halaman {currentPage} dari {totalPages}
                  </motion.p>
                </div>
              </div>
              
              <motion.button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 px-4 py-2 bg-white text-black border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-medium" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Memperbarui...' : 'Perbarui'}
              </motion.button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm" variants={staggerContainer} initial="hidden" animate="visible">
            <motion.div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6" variants={staggerContainer}>
              <motion.div className="flex items-center gap-4" variants={fadeIn} whileHover={{ scale: 1.02 }}>
                <motion.div className={`w-10 h-10 rounded-lg flex items-center justify-center ${totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`} whileHover={{ rotate: 360 }}>
                  <DollarSign className={`w-5 h-5 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                </motion.div>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Total P&L</div>
                  <div className={`text-lg font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
                  </div>
                </div>
              </motion.div>

              <motion.div className="flex items-center gap-4" variants={fadeIn} whileHover={{ scale: 1.02 }}>
                <motion.div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center" whileHover={{ rotate: 360 }}>
                  <Activity className="w-5 h-5 text-blue-600" />
                </motion.div>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Total Transaksi</div>
                  <div className="text-lg font-bold text-gray-900">{stats.total}</div>
                </div>
              </motion.div>

              <motion.div className="flex items-center gap-4" variants={fadeIn} whileHover={{ scale: 1.02 }}>
                <motion.div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center" whileHover={{ rotate: 360 }}>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </motion.div>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Menang</div>
                  <div className="text-lg font-bold text-green-600">{stats.won}</div>
                </div>
              </motion.div>

              <motion.div className="flex items-center gap-4" variants={fadeIn} whileHover={{ scale: 1.02 }}>
                <motion.div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center" whileHover={{ rotate: 360 }}>
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </motion.div>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Kalah</div>
                  <div className="text-lg font-bold text-red-600">{stats.lost}</div>
                </div>
              </motion.div>

              <motion.div className="flex items-center gap-4" variants={fadeIn} whileHover={{ scale: 1.02 }}>
                <motion.div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center" whileHover={{ rotate: 360 }}>
                  <Target className="w-5 h-5 text-yellow-600" />
                </motion.div>
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-1">Win Rate</div>
                  <div className="text-lg font-bold text-yellow-600">{winRate}%</div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Filters */}
          <motion.div className="bg-white rounded-xl p-5 border border-gray-200 mb-6 shadow-sm" variants={fadeIn} initial="hidden" animate="visible">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-medium">Akun:</span>
                </div>
                <div className="flex gap-2">
                  {[{ id: 'all', label: 'Semua' }, { id: 'real', label: 'Real' }, { id: 'demo', label: 'Demo' }].map((account) => (
                    <motion.button key={account.id} onClick={() => handleFilterChange(account.id, 'account')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${accountFilter === account.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {account.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 font-medium">Status:</span>
                </div>
                <div className="flex gap-2">
                  {[{ id: 'all', label: 'Semua' }, { id: 'ACTIVE', label: 'Aktif' }, { id: 'WON', label: 'Menang' }, { id: 'LOST', label: 'Kalah' }].map((f) => (
                    <motion.button key={f.id} onClick={() => handleFilterChange(f.id, 'status')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === f.id ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700'}`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      {f.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Table */}
          <motion.div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm" variants={fadeIn} initial="hidden" animate="visible">
            {displayedOrders.length === 0 ? (
              <motion.div className="text-center py-12 px-4" variants={fadeIn}>
                <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tidak ada transaksi</h3>
                <p className="text-gray-500 mb-4">Coba sesuaikan filter Anda</p>
              </motion.div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <motion.tr className="bg-gray-50 border-b border-gray-200">
                        {['Waktu', 'Aset', 'Akun', 'Tipe', 'Jumlah', 'Masuk', 'Keluar', 'Durasi', 'Status', 'P&L'].map((header) => (
                          <th key={header} className="text-left text-xs font-semibold text-gray-600 py-4 px-4">{header}</th>
                        ))}
                      </motion.tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {displayedOrders.map((order) => (
                          <motion.tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <CalendarClock className="w-4 h-4 text-gray-400" />
                                {new Date(order.createdAt).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-semibold text-sm text-gray-900">{order.asset_name}</div>
                              <div className="text-xs text-green-600">+{order.profitRate}%</div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${(order.accountType || 'demo') === 'real' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                <Wallet className="w-3 h-3" />{(order.accountType || 'demo').toUpperCase()}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              {order.direction === 'CALL' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold"><TrendingUp className="w-3 h-3" />CALL</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold"><TrendingDown className="w-3 h-3" />PUT</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-right text-sm font-semibold text-gray-900">{formatCurrency(order.amount)}</td>
                            <td className="py-4 px-4 text-center"><span className="text-sm font-semibold">{order.entry_price.toFixed(3)}</span></td>
                            <td className="py-4 px-4 text-center"><span className={`text-sm font-semibold ${order.exit_price ? 'text-gray-900' : 'text-gray-400'}`}>{order.exit_price ? order.exit_price.toFixed(3) : '—'}</span></td>
                            <td className="py-4 px-4 text-center"><span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-xs text-gray-700"><Clock className="w-3 h-3" />{order.duration}m</span></td>
                            <td className="py-4 px-4 text-center">
                              <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${order.status === 'WON' ? 'bg-green-100 text-green-700' : order.status === 'LOST' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                {order.status === 'WON' ? 'MENANG' : order.status === 'LOST' ? 'KALAH' : 'AKTIF'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              {order.profit !== null && order.profit !== undefined ? (
                                <span className={`text-sm font-bold ${order.profit > 0 ? 'text-green-600' : order.profit < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                                  {order.profit > 0 ? '+' : ''}{formatCurrency(order.profit)}
                                </span>
                              ) : <span className="text-gray-400">—</span>}
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                </div>

                {/* Desktop Pagination */}
                {totalPages > 1 && (
                  <motion.div className="border-t border-gray-200 px-4 py-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Menampilkan {startIndex + 1} sampai {Math.min(endIndex, totalItems)} dari {totalItems} transaksi
                      </div>
                      
                      <div className="flex items-center gap-2 text-black">
                        <motion.button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 text-sm font-medium" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <ChevronLeft className="w-4 h-4" /> Sebelumnya
                        </motion.button>
                        
                        <div className="flex items-center gap-1">
                          {[...Array(totalPages)].map((_, index) => {
                            const page = index + 1
                            const isNearCurrent = page >= currentPage - 1 && page <= currentPage + 1
                            if (page === 1 || page === totalPages || isNearCurrent) {
                              return (
                                <motion.button key={page} onClick={() => handlePageChange(page)} className={`min-w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium ${currentPage === page ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-700'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                  {page}
                                </motion.button>
                              )
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                              return <span key={page} className="px-2 text-gray-400">...</span>
                            }
                            return null
                          })}
                        </div>
                        
                        <motion.button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 text-sm font-medium" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
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