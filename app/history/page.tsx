'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { BinaryOrder } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
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
  DollarSign
} from 'lucide-react'

// Skeleton Components
const StatCardSkeleton = () => (
  <div className="flex items-center gap-4 animate-pulse">
    <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
    <div className="flex-1 min-w-0">
      <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
      <div className="h-6 bg-gray-200 rounded w-32"></div>
    </div>
  </div>
)

const TableRowSkeleton = () => (
  <tr className="border-b border-gray-100 animate-pulse">
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
  </tr>
)

const MobileCardSkeleton = () => (
  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
        <div>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
      <div className="h-6 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="grid grid-cols-2 gap-3 mb-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg p-3">
          <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-lg p-3">
      <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
      <div className="h-6 bg-gray-200 rounded w-24"></div>
    </div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#fafafa]">
    <Navbar />
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-48 mb-3"></div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
            <div>
              <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-56"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded-lg w-28"></div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[...Array(5)].map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6 animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-9 bg-gray-200 rounded-lg w-20"></div>
            ))}
          </div>
          <div className="flex gap-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 bg-gray-200 rounded-lg w-20"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {['Time', 'Asset', 'Account', 'Type', 'Amount', 'Entry', 'Exit', 'Duration', 'Status', 'P&L'].map((header) => (
                  <th key={header} className="text-left text-xs font-semibold text-gray-600 py-4 px-4">
                    {header}
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

        <div className="lg:hidden space-y-3 p-4">
          {[...Array(5)].map((_, i) => (
            <MobileCardSkeleton key={i} />
          ))}
        </div>
      </div>
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

  const loadOrders = async () => {
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter
      const response = await api.getOrders(status, currentPage, itemsPerPage, accountFilter === 'all' ? undefined : accountFilter)
      
      const ordersList = response?.data?.orders || response?.orders || []
      const total = response?.data?.total || response?.total || ordersList.length
      
      setOrders(ordersList)
      setTotalOrders(total)
      setTotalPages(Math.ceil(total / itemsPerPage))
    } catch (error) {
      console.error('Failed to load orders:', error)
      setOrders([])
      setTotalOrders(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    setCurrentPage(1)
    await loadOrders()
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
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">History</span>
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Trading History</h1>
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages} • {totalOrders} total trades
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium text-gray-700">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* Stats Card - Single Row for Desktop */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Total P&L */}
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                totalProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <DollarSign className={`w-5 h-5 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-1">Total P&L</div>
                <div className={`text-lg font-bold truncate ${
                  totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
                </div>
              </div>
            </div>

            {/* Total Trades */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-1">Total Trades</div>
                <div className="text-lg font-bold text-gray-900">{stats.total}</div>
              </div>
            </div>

            {/* Won */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-1">Won</div>
                <div className="text-lg font-bold text-green-600">{stats.won}</div>
              </div>
            </div>

            {/* Lost */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-1">Lost</div>
                <div className="text-lg font-bold text-red-600">{stats.lost}</div>
              </div>
            </div>

            {/* Win Rate */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-500 mb-1">Win Rate</div>
                <div className="text-lg font-bold text-yellow-600">{winRate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters - Single Row: Account Left, Status Right */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Account Filter - Left */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 font-medium">Account:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'real', label: 'Real' },
                  { id: 'demo', label: 'Demo' }
                ].map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleFilterChange(account.id, 'account')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      accountFilter === account.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                    }`}
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter - Right */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600 font-medium">Status:</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'ACTIVE', label: 'Active' },
                  { id: 'WON', label: 'Won' },
                  { id: 'LOST', label: 'Lost' }
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleFilterChange(f.id, 'status')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === f.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {orders.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Activity className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {statusFilter === 'all' && accountFilter === 'all' 
                  ? 'No trades yet' 
                  : `No ${statusFilter !== 'all' ? statusFilter.toLowerCase() : ''} trades ${accountFilter !== 'all' ? `in ${accountFilter} account` : ''}`}
              </h3>
              <p className="text-base text-gray-500 mb-6">Your trading history will appear here</p>
              {statusFilter === 'all' && accountFilter === 'all' && (
                <button
                  onClick={() => router.push('/trading')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 active:bg-blue-700 transition-colors"
                >
                  <Activity className="w-5 h-5" />
                  Start Trading
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left text-xs font-semibold text-gray-600 py-4 px-4">Time</th>
                      <th className="text-left text-xs font-semibold text-gray-600 py-4 px-4">Asset</th>
                      <th className="text-center text-xs font-semibold text-gray-600 py-4 px-4">Account</th>
                      <th className="text-center text-xs font-semibold text-gray-600 py-4 px-4">Type</th>
                      <th className="text-right text-xs font-semibold text-gray-600 py-4 px-4">Amount</th>
                      <th className="text-center text-xs font-semibold text-gray-600 py-4 px-4">Entry Price</th>
                      <th className="text-center text-xs font-semibold text-gray-600 py-4 px-4">Exit Price</th>
                      <th className="text-center text-xs font-semibold text-gray-600 py-4 px-4">Duration</th>
                      <th className="text-center text-xs font-semibold text-gray-600 py-4 px-4">Status</th>
                      <th className="text-right text-xs font-semibold text-gray-600 py-4 px-4">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr 
                        key={order.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
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
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                            order.status === 'WON' ? 'bg-green-100 text-green-700' :
                            order.status === 'LOST' ? 'bg-red-100 text-red-700' :
                            order.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-3 p-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-gray-50 border border-gray-100 rounded-xl p-4 hover:shadow-lg active:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          order.direction === 'CALL' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {order.direction === 'CALL' ? (
                            <TrendingUp className="w-6 h-6 text-green-600" />
                          ) : (
                            <TrendingDown className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-gray-900">{order.asset_name}</div>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                              (order.accountType || 'demo') === 'real'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {(order.accountType || 'demo').toUpperCase()}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        order.status === 'WON' ? 'bg-green-100 text-green-700' :
                        order.status === 'LOST' ? 'bg-red-100 text-red-700' :
                        order.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Amount</div>
                        <div className="text-sm font-semibold text-gray-900">{formatCurrency(order.amount)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Duration</div>
                        <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                          <Clock className="w-4 h-4" />
                          {order.duration}m
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Entry</div>
                        <div className="text-sm font-semibold text-gray-900">{order.entry_price.toFixed(3)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Exit</div>
                        <div className="text-sm font-semibold text-gray-900">
                          {order.exit_price ? order.exit_price.toFixed(3) : '—'}
                        </div>
                      </div>
                    </div>

                    {order.profit !== null && order.profit !== undefined && (
                      <div className="bg-white rounded-lg p-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Profit/Loss</span>
                        <span className={`font-bold text-lg ${
                          order.profit > 0 ? 'text-green-600' : 
                          order.profit < 0 ? 'text-red-600' : 
                          'text-gray-500'
                        }`}>
                          {order.profit > 0 ? '+' : ''}{formatCurrency(order.profit)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-gray-200 px-4 py-5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600 text-center sm:text-left">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} trades
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Previous</span>
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const page = index + 1
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`min-w-[44px] h-11 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          } else if (
                            page === currentPage - 2 ||
                            page === currentPage + 2
                          ) {
                            return (
                              <span key={page} className="px-2 text-gray-400">
                                ...
                              </span>
                            )
                          }
                          return null
                        })}
                      </div>
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="flex items-center gap-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="text-sm font-medium">Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}