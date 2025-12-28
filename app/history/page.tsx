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
  ChevronRight
} from 'lucide-react'

export default function HistoryPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [orders, setOrders] = useState<BinaryOrder[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<'all' | 'real' | 'demo'>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Pagination states
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
    setCurrentPage(1) // Reset to first page when filter changes
  }

  if (!user) return null

  const stats = {
    total: totalOrders,
    won: orders.filter(o => o.status === 'WON').length,
    lost: orders.filter(o => o.status === 'LOST').length,
    active: orders.filter(o => o.status === 'ACTIVE').length,
  }

  const winRate = totalOrders > 0 ? ((stats.won / totalOrders) * 100).toFixed(1) : '0'
  const totalProfit = orders.reduce((sum, o) => sum + (o.profit || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-gray-500">Loading history...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">History</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Trading History</h1>
                <p className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages} • {totalOrders} total trades
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Total P&L */}
          <div className={`lg:col-span-1 ${
            totalProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          } rounded-xl p-4 border`}>
            <div className="flex items-center gap-2 mb-2">
              <Award className={`w-4 h-4 ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <span className="text-xs font-medium text-gray-600">Total P&L</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${
              totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
            </div>
            {accountFilter !== 'all' && (
              <div className="text-xs text-gray-500 mt-1">
                {accountFilter === 'real' ? 'Real' : 'Demo'} Account
              </div>
            )}
          </div>

          {/* Total Trades */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-gray-600">Total Trades</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>

          {/* Won */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-gray-600">Won</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.won}</div>
          </div>

          {/* Lost */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span className="text-xs font-medium text-gray-600">Lost</span>
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.lost}</div>
          </div>

          {/* Win Rate */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-yellow-600" />
              <span className="text-xs font-medium text-gray-600">Win Rate</span>
            </div>
            <div className="text-2xl font-bold text-yellow-600">{winRate}%</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Account Type Filter */}
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
                  <button
                    key={account.id}
                    onClick={() => handleFilterChange(account.id, 'account')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      accountFilter === account.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden lg:block w-px h-8 bg-gray-200"></div>

            {/* Status Filter */}
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
                  <button
                    key={f.id}
                    onClick={() => handleFilterChange(f.id, 'status')}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === f.id
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
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
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
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
                      <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">Time</th>
                      <th className="text-left text-xs font-semibold text-gray-600 py-3 px-4">Asset</th>
                      <th className="text-center text-xs font-semibold text-gray-600 py-3 px-4">Account</th>
                      <th className="text-center text-xs font-semibold text-gray-600 py-3 px-4">Type</th>
                      <th className="text-right text-xs font-semibold text-gray-600 py-3 px-4">Amount</th>
                      <th className="text-center text-xs font-semibold text-gray-600 py-3 px-4">Entry Price</th>
                      <th className="text-center text-xs font-semibold text-gray-600 py-3 px-4">Exit Price</th>
                      <th className="text-center text-xs font-semibold text-gray-600 py-3 px-4">Duration</th>
                      <th className="text-center text-xs font-semibold text-gray-600 py-3 px-4">Status</th>
                      <th className="text-right text-xs font-semibold text-gray-600 py-3 px-4">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr 
                        key={order.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <CalendarClock className="w-3.5 h-3.5 text-gray-400" />
                            {new Date(order.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-sm text-gray-900">{order.asset_name}</div>
                          <div className="text-xs text-green-600">+{order.profitRate}%</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold ${
                            (order.accountType || 'demo') === 'real'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            <Wallet className="w-3 h-3" />
                            {(order.accountType || 'demo').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
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
                        <td className="py-3 px-4 text-right font-mono text-sm font-semibold text-gray-900">
                          {formatCurrency(order.amount)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono text-sm text-gray-900 font-semibold">
                            {order.entry_price.toFixed(3)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`font-mono text-sm font-semibold ${
                            order.exit_price ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {order.exit_price ? order.exit_price.toFixed(3) : '—'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 rounded text-xs text-gray-700">
                            <Clock className="w-3 h-3" />
                            {order.duration}m
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                            order.status === 'WON' ? 'bg-green-100 text-green-700' :
                            order.status === 'LOST' ? 'bg-red-100 text-red-700' :
                            order.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {order.profit !== null && order.profit !== undefined ? (
                            <span className={`font-mono text-sm font-bold ${
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
              <div className="lg:hidden space-y-3 p-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-gray-50 border border-gray-100 rounded-xl p-3 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          order.direction === 'CALL' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {order.direction === 'CALL' ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-bold text-gray-900">{order.asset_name}</div>
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
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
                      
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                        order.status === 'WON' ? 'bg-green-100 text-green-700' :
                        order.status === 'LOST' ? 'bg-red-100 text-red-700' :
                        order.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div className="bg-white rounded-lg p-2">
                        <div className="text-xs text-gray-500 mb-1">Amount</div>
                        <div className="text-sm font-mono font-semibold text-gray-900">{formatCurrency(order.amount)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <div className="text-xs text-gray-500 mb-1">Duration</div>
                        <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                          <Clock className="w-3 h-3" />
                          {order.duration}m
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <div className="text-xs text-gray-500 mb-1">Entry</div>
                        <div className="font-mono text-sm font-semibold text-gray-900">{order.entry_price.toFixed(3)}</div>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <div className="text-xs text-gray-500 mb-1">Exit</div>
                        <div className="font-mono text-sm font-semibold text-gray-900">
                          {order.exit_price ? order.exit_price.toFixed(3) : '—'}
                        </div>
                      </div>
                    </div>

                    {order.profit !== null && order.profit !== undefined && (
                      <div className="bg-white rounded-lg p-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">Profit/Loss</span>
                        <span className={`font-mono font-bold text-lg ${
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
                <div className="border-t border-gray-200 px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} trades
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span className="text-sm font-medium hidden sm:inline">Previous</span>
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {[...Array(totalPages)].map((_, index) => {
                          const page = index + 1
                          // Show first page, last page, current page, and pages around current
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
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
                        className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="text-sm font-medium hidden sm:inline">Next</span>
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