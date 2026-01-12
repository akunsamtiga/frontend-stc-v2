'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { BinaryOrder } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Filter,
  Target,
  Activity,
  RefreshCw,
  Award,
  BarChart3,
  CalendarClock,
  Wallet,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { toast, Toaster } from 'sonner'

// ===================================
// ANIMATION VARIANTS
// ===================================

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

const scaleIn: Variants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    transition: { 
      duration: 0.2,
      type: "spring",
      stiffness: 260,
      damping: 20
    } 
  }
}

// ===================================
// SKELETON COMPONENTS
// ===================================

const StatCardSkeleton = () => (
  <motion.div 
    className="bg-white rounded-xl p-4 md:p-5 border border-gray-100"
    variants={scaleIn}
  >
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-lg shimmer"></div>
      <div className="h-3 bg-gray-200 rounded w-20 md:w-24"></div>
    </div>
    <div className="h-8 md:h-10 bg-gray-200 rounded w-16 md:w-20 mb-1 md:mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-12 md:w-16"></div>
  </motion.div>
)

const TableRowSkeleton = () => (
  <motion.tr 
    className="border-b border-gray-100"
    variants={fadeInUp}
  >
    <td className="py-4 px-4">
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
      <div className="h-3 bg-gray-200 rounded w-12"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div>
    </td>
    <td className="py-4 px-4">
      <div className="h-4 bg-gray-200 rounded w-24 ml-auto"></div>
    </td>
  </motion.tr>
)

const MobileCardSkeleton = () => (
  <motion.div 
    className="bg-gray-50 border border-gray-100 rounded-xl p-3 sm:p-4"
    variants={scaleIn}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="h-3.5 sm:h-4 bg-gray-200 rounded w-20 sm:w-24 mb-1.5 sm:mb-2"></div>
          <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-24 sm:w-32"></div>
        </div>
      </div>
      <div className="h-5 sm:h-6 bg-gray-200 rounded w-14 sm:w-16 flex-shrink-0 ml-2"></div>
    </div>
    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-2 sm:p-3">
          <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-12 sm:w-16 mb-1.5 sm:mb-2"></div>
          <div className="h-3.5 sm:h-4 bg-gray-200 rounded w-16 sm:w-20"></div>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-lg p-2 sm:p-3">
      <div className="h-2.5 sm:h-3 bg-gray-200 rounded w-16 sm:w-20 mb-1.5 sm:mb-2"></div>
      <div className="h-5 sm:h-6 bg-gray-200 rounded w-20 sm:w-24"></div>
    </div>
  </motion.div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <Navbar />
    <Toaster position="top-right" />
    <motion.div 
      className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <motion.div 
        className="mb-4 sm:mb-6"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="h-3 bg-gray-200 rounded w-36 sm:w-48 mb-2 sm:mb-3 shimmer"></div>
        <div className="flex items-center justify-between gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-xl"></div>
            <div>
              <div className="h-5 sm:h-6 bg-gray-200 rounded w-28 sm:w-40 mb-1.5 sm:mb-2"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-36 sm:w-56"></div>
            </div>
          </div>
          <div className="h-9 sm:h-10 bg-gray-200 rounded-lg w-24 sm:w-28"></div>
        </div>
      </motion.div>

      {/* Stats Skeleton */}
      <motion.div 
        className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6 shadow-sm"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6">
          {[...Array(5)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </motion.div>

      {/* Filters Skeleton */}
      <motion.div 
        className="bg-white rounded-xl p-3 sm:p-4 lg:p-5 border border-gray-200 mb-4 sm:mb-6 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
          <div className="w-full lg:w-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-20"></div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 sm:h-9 bg-gray-200 rounded-lg w-20 sm:w-24 flex-shrink-0"></div>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-auto">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gray-200 rounded"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-8 sm:h-9 bg-gray-200 rounded-lg w-20 sm:w-24 flex-shrink-0"></div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Table/Cards Skeleton */}
      <motion.div 
        className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {[...Array(10)].map((_, i) => (
                  <th key={i} className="text-left text-xs font-semibold text-gray-600 py-4 px-4">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(8)].map((_, i) => (
                <TableRowSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>

        <div className="lg:hidden space-y-2 sm:space-y-3 p-3 sm:p-4">
          {[...Array(5)].map((_, i) => (
            <MobileCardSkeleton key={i} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  </div>
)

export default function HistoryPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [orders, setOrders] = useState<BinaryOrder[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<'all' | 'real' | 'demo'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const itemsPerPage = 20

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadOrders()
  }, [user, statusFilter, accountFilter, currentPage])

  const loadOrders = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      
      const status = statusFilter === 'all' ? undefined : statusFilter
      const response = await api.getOrders(status, currentPage, itemsPerPage, accountFilter === 'all' ? undefined : accountFilter)
      
      const ordersList = response?.data?.orders || response?.orders || []
      const total = response?.data?.total || response?.total || ordersList.length
      
      setOrders(ordersList)
      setTotalOrders(total)
      setTotalPages(Math.ceil(total / itemsPerPage))
    } catch (error) {
      console.error('Failed to load orders:', error)
      toast.error('Failed to load trading history', {
        style: { background: '#ef4444', color: '#fff' }
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    await loadOrders(true)
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
    setCurrentPage(1)
  }

  if (!user) return null

  if (loading) {
    return <LoadingSkeleton />
  }

  const stats = {
    total: totalOrders,
    won: orders.filter(o => o.status === 'WON').length,
    lost: orders.filter(o => o.status === 'LOST').length,
    active: orders.filter(o => o.status === 'ACTIVE').length,
  }

  const winRate = totalOrders > 0 ? ((stats.won / totalOrders) * 100).toFixed(1) : '0'
  const totalProfit = orders.reduce((sum, o) => sum + (o.profit || 0), 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      <Toaster position="top-right" />
      
      <motion.div 
        className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <motion.div 
          className="mb-4 sm:mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div 
            className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.span variants={fadeInUp}>Dashboard</motion.span>
            <span>/</span>
            <motion.span variants={fadeInUp} className="text-gray-900 font-medium">History</motion.span>
          </motion.div>
          
          <motion.div 
            className="flex items-center justify-between gap-2"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 sm:gap-3">
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                whileHover={{ scale: 1.05, rotate: 90 }}
                transition={{ type: "spring" }}
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900"
                  variants={fadeInUp}
                >
                  Trading History
                </motion.h1>
                <motion.p 
                  className="text-xs sm:text-sm text-gray-500"
                  variants={fadeInUp}
                >
                  Page {currentPage} of {totalPages} • {totalOrders} total trades
                </motion.p>
              </div>
            </div>
            
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50 text-sm touch-manipulation shadow-sm"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-xs sm:text-sm font-medium text-gray-700">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Stats Card */}
        <motion.div 
          className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 lg:p-6 mb-4 sm:mb-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Total P&L */}
            <motion.div 
              className="flex items-center gap-3 sm:gap-4 col-span-2 md:col-span-1"
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <DollarSign className={`w-4 h-4 sm:w-5 sm:h-5 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Total P&L</div>
                <motion.div 
                  className={`text-base sm:text-lg font-bold truncate ${
                    totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
                </motion.div>
              </div>
            </motion.div>

            {/* Total Trades */}
            <motion.div 
              className="flex items-center gap-3 sm:gap-4"
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Total Trades</div>
                <motion.div 
                  className="text-base sm:text-lg font-bold text-gray-900"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {stats.total}
                </motion.div>
              </div>
            </motion.div>

            {/* Won */}
            <motion.div 
              className="flex items-center gap-3 sm:gap-4"
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Won</div>
                <motion.div 
                  className="text-base sm:text-lg font-bold text-green-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {stats.won}
                </motion.div>
              </div>
            </motion.div>

            {/* Lost */}
            <motion.div 
              className="flex items-center gap-3 sm:gap-4"
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Lost</div>
                <motion.div 
                  className="text-base sm:text-lg font-bold text-red-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  {stats.lost}
                </motion.div>
              </div>
            </motion.div>

            {/* Win Rate */}
            <motion.div 
              className="flex items-center gap-3 sm:gap-4"
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
              >
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-0.5 sm:mb-1">Win Rate</div>
                <motion.div 
                  className="text-base sm:text-lg font-bold text-yellow-600"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {winRate}%
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="bg-white rounded-xl p-3 sm:p-4 lg:p-5 border border-gray-200 mb-4 sm:mb-6 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
            {/* Account Filter */}
            <motion.div 
              className="w-full lg:w-auto"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                <span className="text-xs sm:text-sm text-gray-600 font-medium">Account:</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'real', label: 'Real' },
                  { id: 'demo', label: 'Demo' }
                ].map((account, i) => (
                  <motion.button
                    key={account.id}
                    onClick={() => handleFilterChange(account.id, 'account')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 touch-manipulation ${
                      accountFilter === account.id
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    variants={fadeInUp}
                    transition={{ delay: 0.5 + i * 0.05 }}
                  >
                    {account.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Status Filter */}
            <motion.div 
              className="w-full lg:w-auto"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <div className="flex items-center gap-2 mb-2">
                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                <span className="text-xs sm:text-sm text-gray-600 font-medium">Status:</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'ACTIVE', label: 'Active' },
                  { id: 'WON', label: 'Won' },
                  { id: 'LOST', label: 'Lost' }
                ].map((f, i) => (
                  <motion.button
                    key={f.id}
                    onClick={() => handleFilterChange(f.id, 'status')}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex-shrink-0 touch-manipulation ${
                      statusFilter === f.id
                        ? 'bg-gradient-to-r from-gray-700 to-gray-800 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    variants={fadeInUp}
                    transition={{ delay: 0.6 + i * 0.05 }}
                  >
                    {f.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Orders Table */}
        <motion.div 
          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {orders.length === 0 ? (
            <motion.div 
              className="text-center py-12 sm:py-16 lg:py-20 px-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring" }}
            >
              <motion.div 
                className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4"
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <Activity className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
              </motion.div>
              <motion.h3 
                className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {statusFilter === 'all' && accountFilter === 'all' 
                  ? 'No trades yet' 
                  : `No ${statusFilter !== 'all' ? statusFilter.toLowerCase() : ''} trades ${accountFilter !== 'all' ? `in ${accountFilter} account` : ''}`}
              </motion.h3>
              <motion.p 
                className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Your trading history will appear here
              </motion.p>
              <motion.button
                onClick={() => router.push('/trading')}
                className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                Start Trading
              </motion.button>
            </motion.div>
          ) : (
            <>
              {/* Desktop Table */}
              <motion.div 
                className="hidden lg:block overflow-x-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <table className="w-full">
                  <thead>
                    <motion.tr 
                      className="bg-gray-50 border-b border-gray-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      {['Time', 'Asset', 'Account', 'Type', 'Amount', 'Entry', 'Exit', 'Duration', 'Status', 'P&L'].map((header, i) => (
                        <motion.th 
                          key={header} 
                          className="text-left text-xs font-semibold text-gray-600 py-4 px-4"
                          initial={{ y: -10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.8 + i * 0.05 }}
                        >
                          {header}
                        </motion.th>
                      ))}
                    </motion.tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {orders.map((order, index) => (
                        <motion.tr
                          key={order.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.02 }}
                          whileHover={{ backgroundColor: 'rgb(249 250 251)' }}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <CalendarClock className="w-4 h-4 text-gray-400" />
                              {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-sm text-gray-900">{order.asset_name}</div>
                            <div className="text-xs text-green-600">+{order.profitRate}%</div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                              (order.accountType || 'demo') === 'real'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              <Wallet className="w-3 h-3" />
                              {(order.accountType || 'demo').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            {order.direction === 'CALL' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-bold">
                                <TrendingUp className="w-3 h-3" />
                                CALL
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-bold">
                                <TrendingDown className="w-3 h-3" />
                                PUT
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right text-sm font-semibold text-gray-900">
                            {formatCurrency(order.amount)}
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-sm text-gray-900 font-semibold">
                              {order.entry_price.toFixed(3)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={`text-sm font-semibold ${
                              order.exit_price ? 'text-gray-900' : 'text-gray-400'
                            }`}>
                              {order.exit_price ? order.exit_price.toFixed(3) : '—'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-xs text-gray-700">
                              <Clock className="w-3 h-3" />
                              {order.duration}m
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <motion.span 
                              className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                                order.status === 'WON' ? 'bg-green-100 text-green-700' :
                                order.status === 'LOST' ? 'bg-red-100 text-red-700' :
                                order.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}
                              whileHover={{ scale: 1.1 }}
                            >
                              {order.status}
                            </motion.span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {order.profit !== null && order.profit !== undefined ? (
                              <motion.span 
                                className={`text-sm font-bold ${
                                  order.profit > 0 ? 'text-green-600' : 
                                  order.profit < 0 ? 'text-red-600' : 
                                  'text-gray-500'
                                }`}
                                whileHover={{ scale: 1.05 }}
                              >
                                {order.profit > 0 ? '+' : ''}{formatCurrency(order.profit)}
                              </motion.span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>
              </motion.div>

              {/* Mobile & Tablet Cards */}
              <motion.div 
                className="lg:hidden space-y-2 sm:space-y-3 p-3 sm:p-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence>
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      className="bg-gray-50 border border-gray-100 rounded-xl p-3 sm:p-4 hover:shadow-md active:shadow-lg transition-shadow cursor-pointer"
                      variants={fadeInUp}
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <motion.div 
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              order.direction === 'CALL' ? 'bg-green-100' : 'bg-red-100'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            transition={{ type: "spring" }}
                          >
                            {order.direction === 'CALL' ? (
                              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                            ) : (
                              <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                            )}
                          </motion.div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <div className="text-sm sm:text-base font-bold text-gray-900 truncate">{order.asset_name}</div>
                              <motion.span 
                                className={`px-1.5 sm:px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${
                                  (order.accountType || 'demo') === 'real'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                                whileHover={{ scale: 1.05 }}
                              >
                                {(order.accountType || 'demo').toUpperCase()}
                              </motion.span>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        
                        <motion.span 
                          className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-bold flex-shrink-0 ml-2 ${
                            order.status === 'WON' ? 'bg-green-100 text-green-700' :
                            order.status === 'LOST' ? 'bg-red-100 text-red-700' :
                            order.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}
                          whileHover={{ scale: 1.1 }}
                        >
                          {order.status}
                        </motion.span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm mb-2 sm:mb-3">
                        <div className="bg-white rounded-lg p-2 sm:p-3">
                          <div className="text-xs text-gray-500 mb-0.5 sm:mb-1">Amount</div>
                          <div className="text-sm font-semibold text-gray-900 truncate">{formatCurrency(order.amount)}</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 sm:p-3">
                          <div className="text-xs text-gray-500 mb-0.5 sm:mb-1">Duration</div>
                          <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                            {order.duration}m
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-2 sm:p-3">
                          <div className="text-xs text-gray-500 mb-0.5 sm:mb-1">Entry</div>
                          <div className="text-sm font-semibold text-gray-900">{order.entry_price.toFixed(3)}</div>
                        </div>
                        <div className="bg-white rounded-lg p-2 sm:p-3">
                          <div className="text-xs text-gray-500 mb-0.5 sm:mb-1">Exit</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {order.exit_price ? order.exit_price.toFixed(3) : '—'}
                          </div>
                        </div>
                      </div>

                      {order.profit !== null && order.profit !== undefined && (
                        <motion.div 
                          className="bg-white rounded-lg p-2 sm:p-3 flex items-center justify-between"
                          whileHover={{ backgroundColor: 'rgb(249 250 251)' }}
                        >
                          <span className="text-xs font-semibold text-gray-600">Profit/Loss</span>
                          <motion.span 
                            className={`font-bold text-base sm:text-lg ${
                              order.profit > 0 ? 'text-green-600' : 
                              order.profit < 0 ? 'text-red-600' : 
                              'text-gray-500'
                            }`}
                            whileHover={{ scale: 1.05 }}
                          >
                            {order.profit > 0 ? '+' : ''}{formatCurrency(order.profit)}
                          </motion.span>
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <motion.div 
                  className="border-t border-gray-200 px-3 sm:px-4 py-4 sm:py-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                    <motion.div 
                      className="text-xs sm:text-sm text-gray-600 text-center sm:text-left order-2 sm:order-1"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} trades
                    </motion.div>
                    
                    <motion.div 
                      className="flex items-center gap-2 order-1 sm:order-2"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                    >
                      <motion.button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        variants={fadeInUp}
                      >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm font-medium hidden sm:inline">Previous</span>
                      </motion.button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const page = index + 1
                          const showOnMobile = page === 1 || page === totalPages || 
                                             (page >= currentPage - 1 && page <= currentPage + 1)
                          const showOnTablet = page === 1 || page === totalPages || 
                                              (page >= currentPage - 2 && page <= currentPage + 2)
                          
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <motion.button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`min-w-[36px] sm:min-w-[44px] h-9 sm:h-11 flex items-center justify-center rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                                } ${!showOnMobile ? 'hidden sm:flex' : ''}`}
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                variants={fadeInUp}
                                transition={{ delay: 0.9 + index * 0.02 }}
                              >
                                {page}
                              </motion.button>
                            )
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <motion.span 
                                key={page} 
                                className="px-1 sm:px-2 text-gray-400 hidden sm:inline"
                                variants={fadeInUp}
                                transition={{ delay: 0.9 + index * 0.02 }}
                              >
                                ...
                              </motion.span>
                            )
                          }
                          return null
                        })}
                      </div>
                      
                      <motion.button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-3 sm:px-4 py-2 sm:py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        variants={fadeInUp}
                      >
                        <span className="text-xs sm:text-sm font-medium hidden sm:inline">Next</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </motion.div>

        {/* Shimmer Style */}
        <style jsx>{`
          .shimmer {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
          
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </motion.div>
    </div>
  )
}