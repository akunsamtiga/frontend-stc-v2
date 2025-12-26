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
  CalendarClock
} from 'lucide-react'

export default function HistoryPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [orders, setOrders] = useState<BinaryOrder[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadOrders()
  }, [user, filter])

  const loadOrders = async () => {
    try {
      const status = filter === 'all' ? undefined : filter
      const response = await api.getOrders(status, 1, 100)
      
      const ordersList = response?.data?.orders || response?.orders || []
      setOrders(ordersList)
    } catch (error) {
      console.error('Failed to load orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadOrders()
  }

  if (!user) return null

  const stats = {
    total: orders.length,
    won: orders.filter(o => o.status === 'WON').length,
    lost: orders.filter(o => o.status === 'LOST').length,
    active: orders.filter(o => o.status === 'ACTIVE').length,
  }

  const winRate = stats.total > 0 ? ((stats.won / stats.total) * 100).toFixed(1) : '0'
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header with Breadcrumb */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">History</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Trading History</h1>
                <p className="text-gray-500">Track your trading performance</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* Stats Cards - Enhanced */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Total Trades</div>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Won</div>
                <div className="text-3xl font-bold text-green-600">{stats.won}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Lost</div>
                <div className="text-3xl font-bold text-red-600">{stats.lost}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Win Rate</div>
                <div className="text-3xl font-bold text-yellow-600">{winRate}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Total P&L Card - Featured */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className={`relative overflow-hidden rounded-3xl p-8 shadow-xl ${
            totalProfit >= 0 
              ? 'bg-gradient-to-br from-green-500 to-emerald-500' 
              : 'bg-gradient-to-br from-red-500 to-rose-500'
          }`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative z-10 text-center">
              <div className="flex items-center justify-center gap-2 text-white/80 mb-2">
                <Award className="w-5 h-5" />
                <span className="text-sm font-medium">Total Profit & Loss</span>
              </div>
              <div className="text-5xl md:text-6xl font-bold text-white font-mono">
                {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-600 font-semibold">Filter:</span>
          </div>
          {[
            { id: 'all', label: 'All Trades', count: stats.total },
            { id: 'ACTIVE', label: 'Active', count: stats.active },
            { id: 'WON', label: 'Won', count: stats.won },
            { id: 'LOST', label: 'Lost', count: stats.lost }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                filter === f.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Activity className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter === 'all' ? 'No trades yet' : `No ${filter.toLowerCase()} trades`}
              </h3>
              <p className="text-gray-500 mb-6">Your trading history will appear here</p>
              {filter === 'all' && (
                <button
                  onClick={() => router.push('/trading')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
                >
                  <Activity className="w-5 h-5" />
                  Start Trading
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-600 border-b border-gray-100 bg-gray-50">
                      <th className="py-4 px-6">Time</th>
                      <th className="py-4 px-6">Asset</th>
                      <th className="py-4 px-6 text-center">Type</th>
                      <th className="py-4 px-6 text-right">Amount</th>
                      <th className="py-4 px-6 text-right">Entry → Exit</th>
                      <th className="py-4 px-6 text-center">Duration</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr 
                        key={order.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CalendarClock className="w-4 h-4 text-gray-400" />
                            {new Date(order.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-gray-900">{order.asset_name}</div>
                          <div className="text-xs text-green-600 font-medium">+{order.profitRate}% profit rate</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {order.direction === 'CALL' ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-xl">
                              <TrendingUp className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-bold text-green-700">CALL</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-xl">
                              <TrendingDown className="w-4 h-4 text-red-600" />
                              <span className="text-xs font-bold text-red-700">PUT</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-semibold text-gray-900">{formatCurrency(order.amount)}</td>
                        <td className="py-4 px-6 text-right font-mono text-sm text-gray-600">
                          <span className="text-blue-600">{order.entry_price.toFixed(3)}</span>
                          {' → '}
                          <span className={order.exit_price ? (order.status === 'WON' ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}>
                            {order.exit_price ? order.exit_price.toFixed(3) : '—'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700">
                            <Clock className="w-3 h-3" />
                            {order.duration}m
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold ${
                            order.status === 'WON' ? 'bg-green-100 text-green-700' :
                            order.status === 'LOST' ? 'bg-red-100 text-red-700' :
                            order.status === 'ACTIVE' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className={`py-4 px-6 text-right font-mono font-bold text-lg ${
                          order.profit && order.profit > 0 ? 'text-green-600' : 
                          order.profit && order.profit < 0 ? 'text-red-600' : 
                          'text-gray-500'
                        }`}>
                          {order.profit !== null && order.profit !== undefined ? (
                            <>{order.profit > 0 ? '+' : ''}{formatCurrency(order.profit)}</>
                          ) : '—'}
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
                    className="bg-gray-50 border border-gray-100 rounded-2xl p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          order.direction === 'CALL' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {order.direction === 'CALL' ? (
                            <TrendingUp className="w-6 h-6 text-green-600" />
                          ) : (
                            <TrendingDown className="w-6 h-6 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{order.asset_name}</div>
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
                      <div className="bg-white rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">Amount</div>
                        <div className="font-mono font-semibold text-gray-900">{formatCurrency(order.amount)}</div>
                      </div>
                      <div className="bg-white rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">Duration</div>
                        <div className="flex items-center gap-1 font-semibold text-gray-900">
                          <Clock className="w-3 h-3" />
                          {order.duration}m
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">Entry</div>
                        <div className="font-mono text-sm font-semibold text-gray-900">{order.entry_price.toFixed(3)}</div>
                      </div>
                      <div className="bg-white rounded-xl p-3">
                        <div className="text-xs text-gray-500 mb-1">Exit</div>
                        <div className="font-mono text-sm font-semibold text-gray-900">
                          {order.exit_price ? order.exit_price.toFixed(3) : '—'}
                        </div>
                      </div>
                    </div>

                    {order.profit !== null && order.profit !== undefined && (
                      <div className="bg-white rounded-xl p-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">Profit/Loss</span>
                        <span className={`font-mono font-bold text-xl ${
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}