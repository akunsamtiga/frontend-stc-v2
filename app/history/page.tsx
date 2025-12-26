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
  RefreshCw
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
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flat-section-header">
          <div>
            <h1 className="flat-section-title">Trading History</h1>
            <p className="flat-section-description">Your complete activity</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flat-btn flat-btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="flat-stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-600" />
              </div>
              <span className="flat-stat-label">Total</span>
            </div>
            <div className="flat-stat-value">{stats.total}</div>
          </div>

          <div className="flat-stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <span className="flat-stat-label">Won</span>
            </div>
            <div className="flat-stat-value text-green-600">{stats.won}</div>
          </div>

          <div className="flat-stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <span className="flat-stat-label">Lost</span>
            </div>
            <div className="flat-stat-value text-red-600">{stats.lost}</div>
          </div>

          <div className="flat-stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="flat-stat-label">Win Rate</span>
            </div>
            <div className="flat-stat-value text-yellow-600">{winRate}%</div>
          </div>
        </div>

        {/* Total P&L */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="flat-card text-center">
            <div className="text-sm text-gray-500 mb-2">Total Profit & Loss</div>
            <div className={`text-5xl font-bold font-mono ${
              totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500 font-medium">Filter:</span>
          </div>
          {['all', 'ACTIVE', 'WON', 'LOST'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              {f !== 'all' && ` (${f === 'ACTIVE' ? stats.active : f === 'WON' ? stats.won : stats.lost})`}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="flat-card">
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg mb-2">
                {filter === 'all' ? 'No trades yet' : `No ${filter.toLowerCase()} trades`}
              </p>
              <p className="text-sm text-gray-400">Your trading history will appear here</p>
            </div>
          ) : (
            <div>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-500 border-b border-gray-200">
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
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-0"
                      >
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium text-gray-900">{order.asset_name}</div>
                          <div className="text-xs text-gray-500">+{order.profitRate}%</div>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {order.direction === 'CALL' ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                              <TrendingUp className="w-3 h-3 text-green-600" />
                              <span className="text-xs font-medium text-green-700">CALL</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 border border-red-200 rounded-full">
                              <TrendingDown className="w-3 h-3 text-red-600" />
                              <span className="text-xs font-medium text-red-700">PUT</span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-mono text-gray-900">{formatCurrency(order.amount)}</td>
                        <td className="py-4 px-6 text-right font-mono text-sm text-gray-600">
                          {order.entry_price.toFixed(3)} → {order.exit_price ? order.exit_price.toFixed(3) : '—'}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                            <Clock className="w-3 h-3" />
                            {order.duration}m
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`flat-badge ${
                            order.status === 'WON' ? 'flat-badge-success' :
                            order.status === 'LOST' ? 'flat-badge-danger' :
                            order.status === 'ACTIVE' ? 'flat-badge-primary' :
                            'flat-badge-neutral'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className={`py-4 px-6 text-right font-mono font-bold ${
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
              <div className="lg:hidden space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flat-card"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          order.direction === 'CALL' ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          {order.direction === 'CALL' ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{order.asset_name}</div>
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
                      
                      <span className={`flat-badge ${
                        order.status === 'WON' ? 'flat-badge-success' :
                        order.status === 'LOST' ? 'flat-badge-danger' :
                        order.status === 'ACTIVE' ? 'flat-badge-primary' :
                        'flat-badge-neutral'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Amount</div>
                        <div className="font-mono text-gray-900">{formatCurrency(order.amount)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Duration</div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-900">{order.duration}m</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Entry</div>
                        <div className="font-mono text-sm text-gray-900">{order.entry_price.toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Exit</div>
                        <div className="font-mono text-sm text-gray-900">
                          {order.exit_price ? order.exit_price.toFixed(3) : '—'}
                        </div>
                      </div>
                    </div>

                    {order.profit !== null && order.profit !== undefined && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-sm text-gray-500">P&L</span>
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}