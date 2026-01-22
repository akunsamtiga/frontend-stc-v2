'use client'

import { useEffect, useState } from 'react'
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
  ArrowRight,
  DollarSign,
  Target
} from 'lucide-react'
import { toast, Toaster } from 'sonner'

// Simplified animation variants for mobile performance
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

// Mobile-optimized skeleton loader
const MobileStatCardSkeleton = () => (
  <div className="bg-white rounded-xl p-4 border border-gray-100 animate-pulse">
    <div className="flex items-center justify-between mb-2">
      <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
      <div className="h-3 bg-gray-200 rounded w-12"></div>
    </div>
    <div className="h-6 bg-gray-200 rounded w-20 mb-1"></div>
    <div className="h-3 bg-gray-200 rounded w-16"></div>
  </div>
)

const MobileCardSkeleton = () => (
  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2 flex-1">
        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
      <div className="h-5 bg-gray-200 rounded w-12"></div>
    </div>
    <div className="grid grid-cols-2 gap-2 mb-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-2">
          <div className="h-2 bg-gray-200 rounded w-12 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-lg p-2">
      <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
      <div className="h-4 bg-gray-200 rounded w-20"></div>
    </div>
  </div>
)

const DesktopStatCardSkeleton = () => (
  <motion.div 
    className="bg-white rounded-xl p-4 md:p-5 border border-gray-100"
    variants={slideIn}
    initial="hidden"
    animate="visible"
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
  <motion.tr 
    className="border-b border-gray-100"
    variants={slideIn}
    initial="hidden"
    animate="visible"
  >
    {[...Array(10)].map((_, i) => (
      <td key={i} className="py-4 px-4">
        <div className="h-4 bg-gray-200 rounded w-16 md:w-20 mx-auto"></div>
      </td>
    ))}
  </motion.tr>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <Navbar />
    <Toaster position="top-right" />
    
    {/* Mobile Skeleton */}
    <div className="md:hidden container mx-auto px-3 py-4">
      {/* Header */}
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

      {/* Mobile Filter Skeleton */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-200 rounded-lg w-20 flex-shrink-0"></div>
          ))}
        </div>
      </div>

      {/* Mobile Stats Grid */}
      <div className="grid grid-cols-1 gap-3 mb-4">
        {[...Array(5)].map((_, i) => (
          <MobileStatCardSkeleton key={i} />
        ))}
      </div>

      {/* Mobile Card Skeletons */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <MobileCardSkeleton key={i} />
        ))}
      </div>
    </div>

    {/* Desktop Skeleton */}
    <div className="hidden md:block container mx-auto px-4 py-6">
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
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

      <motion.div 
        className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6 mb-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {[...Array(5)].map((_, i) => (
          <DesktopStatCardSkeleton key={i} />
        ))}
      </motion.div>

      <motion.div 
        className="bg-white rounded-xl border border-gray-200 overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <table className="w-full">
          <thead>
            <motion.tr 
              className="bg-gray-50 border-b border-gray-200"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[...Array(10)].map((_, i) => (
                <th key={i} className="text-left text-xs font-semibold text-gray-600 py-4 px-4">
                  <div className="h-3 bg-gray-200 rounded w-16 mx-auto"></div>
                </th>
              ))}
            </motion.tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, i) => (
              <DesktopTableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
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
      if (showRefreshing) setRefreshing(false)
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
      
      {/* MOBILE VIEW (< md) */}
      <motion.div 
        className="md:hidden container mx-auto px-3 py-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {/* Simplified Header */}
        <motion.div 
          className="mb-4"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Trading History</h1>
                <p className="text-xs text-gray-500">
                  Page {currentPage} of {totalPages}
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
              Refresh
            </motion.button>
          </div>
        </motion.div>

        {/* Simplified Stats Cards */}
        <motion.div 
          className="grid grid-cols-1 gap-2 mb-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between"
            variants={fadeIn}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <DollarSign className={`w-5 h-5 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500">Total P&L</div>
                <motion.div 
                  className={`text-sm font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Trades', value: stats.total, icon: Activity },
              { label: 'Won', value: stats.won, icon: TrendingUp, color: 'text-green-600' },
              { label: 'Lost', value: stats.lost, icon: TrendingDown, color: 'text-red-600' },
              { label: 'Win Rate', value: `${winRate}%`, icon: Target, color: 'text-yellow-600' },
            ].map((stat, i) => {
              const Icon = stat.icon
              return (
                <motion.div 
                  key={stat.label}
                  className="bg-white rounded-xl p-3 border border-gray-100 text-center"
                  variants={fadeIn}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-1 ${stat.color || 'text-gray-600'}`} />
                  <div className="text-xs text-gray-500 mb-0.5">{stat.label}</div>
                  <motion.div 
                    className="text-sm font-bold text-gray-900"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                  >
                    {stat.value}
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Simplified Filters */}
        <motion.div 
          className="mb-4"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <span className="text-xs font-medium text-gray-600">Account:</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'real', label: 'Real' },
                { id: 'demo', label: 'Demo' }
              ].map((account) => (
                <motion.button
                  key={account.id}
                  onClick={() => handleFilterChange(account.id, 'account')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                    accountFilter === account.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 active:bg-gray-200'
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
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'ACTIVE', label: 'Active' },
                { id: 'WON', label: 'Won' },
                { id: 'LOST', label: 'Lost' }
              ].map((f) => (
                <motion.button
                  key={f.id}
                  onClick={() => handleFilterChange(f.id, 'status')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex-shrink-0 ${
                    statusFilter === f.id
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-100 text-gray-700 active:bg-gray-200'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {f.label}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Mobile Cards */}
        <motion.div 
          className="space-y-3"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {orders.length === 0 ? (
              <motion.div 
                className="text-center py-8 px-4 bg-white rounded-xl border border-gray-100"
                variants={fadeIn}
              >
                <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900 mb-1">No trades yet</h3>
                <p className="text-xs text-gray-500">Your trading history will appear here</p>
              </motion.div>
            ) : (
              orders.map((order) => (
                <motion.div
                  key={order.id}
                  className="bg-white border border-gray-100 rounded-xl p-3 overflow-hidden"
                  variants={slideIn}
                  whileTap={{ backgroundColor: 'rgb(249 250 251)' }}
                  transition={{ duration: 0.1 }}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        order.direction === 'CALL' ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {order.direction === 'CALL' ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <div className="text-sm font-bold text-gray-900 truncate">{order.asset_name}</div>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            (order.accountType || 'demo') === 'real'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {(order.accountType || 'demo').toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <CalendarClock className="w-3 h-3" />
                          {new Date(order.createdAt).toLocaleDateString('id-ID', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-1 rounded text-[11px] font-bold ${
                      order.status === 'WON' ? 'bg-green-100 text-green-700' :
                      order.status === 'LOST' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="grid grid-cols-2 gap-2 mb-2 text-xs mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-gray-500 mb-0.5">Amount</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(order.amount)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-gray-500 mb-0.5">Duration</div>
                      <div className="font-semibold text-gray-900 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {order.duration}m
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-gray-500 mb-0.5">Entry</div>
                      <div className="font-semibold text-gray-900">{order.entry_price.toFixed(3)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-gray-500 mb-0.5">Exit</div>
                      <div className="font-semibold text-gray-900">
                        {order.exit_price ? order.exit_price.toFixed(3) : '—'}
                      </div>
                    </div>
                  </div>

                  {/* Profit/Loss */}
                  {order.profit !== null && order.profit !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Profit/Loss</span>
                        <span className={`text-sm font-bold ${
                          order.profit > 0 ? 'text-green-600' : 
                          order.profit < 0 ? 'text-red-600' : 
                          'text-gray-500'
                        }`}>
                          {order.profit > 0 ? '+' : ''}{formatCurrency(order.profit)}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>

        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <motion.div 
            className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <motion.button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 disabled:opacity-50"
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </motion.button>
            
            <span className="text-xs text-gray-500 font-medium">
              {currentPage} / {totalPages}
            </span>
            
            <motion.button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 disabled:opacity-50"
              whileTap={{ scale: 0.95 }}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* DESKTOP VIEW (md+) */}
      <motion.div 
        className="hidden md:block container mx-auto px-4 py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Desktop Header */}
        <motion.div 
          className="mb-6"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="flex items-center gap-2 text-sm text-gray-500 mb-3"
            variants={staggerContainer}
          >
            <motion.span variants={fadeIn}>Dashboard</motion.span>
            <span>/</span>
            <motion.span variants={fadeIn} className="text-gray-900 font-medium">History</motion.span>
          </motion.div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md"
                whileHover={{ rotate: 90 }}
              >
                <BarChart3 className="w-5 h-5 text-white" />
              </motion.div>
              <div>
                <motion.h1 
                  className="text-2xl font-bold text-gray-900"
                  variants={fadeIn}
                >
                  Trading History
                </motion.h1>
                <motion.p 
                  className="text-sm text-gray-500"
                  variants={fadeIn}
                >
                  Page {currentPage} of {totalPages} • {totalOrders} total trades
                </motion.p>
              </div>
            </div>
            
            <motion.button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </motion.button>
          </div>
        </motion.div>

        {/* Desktop Stats Cards */}
        <motion.div 
          className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Total P&L */}
            <motion.div 
              className="flex items-center gap-4"
              variants={fadeIn}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}
                whileHover={{ rotate: 360 }}
              >
                <DollarSign className={`w-5 h-5 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </motion.div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Total P&L</div>
                <div className={`text-lg font-bold ${
                  totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
                </div>
              </div>
            </motion.div>

            {/* Total Trades */}
            <motion.div 
              className="flex items-center gap-4"
              variants={fadeIn}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
              >
                <Activity className="w-5 h-5 text-blue-600" />
              </motion.div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Total Trades</div>
                <div className="text-lg font-bold text-gray-900">{stats.total}</div>
              </div>
            </motion.div>

            {/* Won */}
            <motion.div 
              className="flex items-center gap-4"
              variants={fadeIn}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
              >
                <TrendingUp className="w-5 h-5 text-green-600" />
              </motion.div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Won</div>
                <div className="text-lg font-bold text-green-600">{stats.won}</div>
              </div>
            </motion.div>

            {/* Lost */}
            <motion.div 
              className="flex items-center gap-4"
              variants={fadeIn}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
              >
                <TrendingDown className="w-5 h-5 text-red-600" />
              </motion.div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Lost</div>
                <div className="text-lg font-bold text-red-600">{stats.lost}</div>
              </div>
            </motion.div>

            {/* Win Rate */}
            <motion.div 
              className="flex items-center gap-4"
              variants={fadeIn}
              whileHover={{ scale: 1.02 }}
            >
              <motion.div 
                className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center"
                whileHover={{ rotate: 360 }}
              >
                <Target className="w-5 h-5 text-yellow-600" />
              </motion.div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-1">Win Rate</div>
                <div className="text-lg font-bold text-yellow-600">{winRate}%</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Desktop Filters */}
        <motion.div 
          className="bg-white rounded-xl p-5 border border-gray-200 mb-6 shadow-sm"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 font-medium">Account:</span>
              </div>
              <div className="flex gap-2">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'real', label: 'Real' },
                  { id: 'demo', label: 'Demo' }
                ].map((account) => (
                  <motion.button
                    key={account.id}
                    onClick={() => handleFilterChange(account.id, 'account')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      accountFilter === account.id
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
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
                {[
                  { id: 'all', label: 'All' },
                  { id: 'ACTIVE', label: 'Active' },
                  { id: 'WON', label: 'Won' },
                  { id: 'LOST', label: 'Lost' }
                ].map((f) => (
                  <motion.button
                    key={f.id}
                    onClick={() => handleFilterChange(f.id, 'status')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      statusFilter === f.id
                        ? 'bg-gray-700 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {f.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Desktop Table */}
        <motion.div 
          className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          {orders.length === 0 ? (
            <motion.div 
              className="text-center py-12 px-4"
              variants={fadeIn}
            >
              <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No trades yet</h3>
              <p className="text-gray-500 mb-4">Your trading history will appear here</p>
              <motion.button
                onClick={() => router.push('/trading')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Activity className="w-5 h-5" />
                Start Trading
              </motion.button>
            </motion.div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <motion.tr 
                      className="bg-gray-50 border-b border-gray-200"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {['Time', 'Asset', 'Account', 'Type', 'Amount', 'Entry', 'Exit', 'Duration', 'Status', 'P&L'].map((header) => (
                        <th key={header} className="text-left text-xs font-semibold text-gray-600 py-4 px-4">
                          {header}
                        </th>
                      ))}
                    </motion.tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {orders.map((order) => (
                        <motion.tr
                          key={order.id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          whileHover={{ backgroundColor: 'rgb(249 250 251)' }}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2 text-xs text-gray-600">
                              <CalendarClock className="w-4 h-4 text-gray-400 flex-shrink-0" />
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
                            <span className="text-sm font-semibold">
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
                            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                              order.status === 'WON' ? 'bg-green-100 text-green-700' :
                              order.status === 'LOST' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {order.profit !== null && order.profit !== undefined ? (
                              <span className={`text-sm font-bold ${
                                order.profit > 0 ? 'text-green-600' : 
                                order.profit < 0 ? 'text-red-600' : 
                                'text-gray-500'
                              }`}>
                                {order.profit > 0 ? '+' : ''}{formatCurrency(order.profit)}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} trades
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 text-sm font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </motion.button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const page = index + 1
                          const isNearCurrent = page >= currentPage - 1 && page <= currentPage + 1
                          
                          if (page === 1 || page === totalPages || isNearCurrent) {
                            return (
                              <motion.button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`min-w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {page}
                              </motion.button>
                            )
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <span key={page} className="px-2 text-gray-400">...</span>
                            )
                          }
                          return null
                        })}
                      </div>
                      
                      <motion.button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 text-sm font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
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
  )
}