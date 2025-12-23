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
  Trophy,
  XCircle,
  Activity,
  ChevronDown,
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
      <div className="min-h-screen bg-[#0a0e17]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <div className="text-gray-400">Loading history...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Trading History</h1>
            <p className="text-sm text-gray-400">View your complete trading activity</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-800/50 rounded-lg transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 animate-fade-in-up">
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-xl p-4 hover:bg-[#1a1f2e] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-xs text-gray-400">Total Trades</div>
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-xl p-4 hover:bg-[#1a1f2e] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-xs text-gray-400">Won</div>
            </div>
            <div className="text-2xl font-bold text-green-400">{stats.won}</div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-xl p-4 hover:bg-[#1a1f2e] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-xs text-gray-400">Lost</div>
            </div>
            <div className="text-2xl font-bold text-red-400">{stats.lost}</div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-xl p-4 hover:bg-[#1a1f2e] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-xs text-gray-400">Win Rate</div>
            </div>
            <div className="text-2xl font-bold text-yellow-400">{winRate}%</div>
          </div>

          <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-xs text-gray-400">Total P&L</div>
            </div>
            <div className={`text-2xl font-bold font-mono ${
              totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-[#0f1419] border border-gray-800/50 rounded-xl p-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Filter by status:</span>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              {['all', 'ACTIVE', 'WON', 'LOST'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === f
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                  }`}
                >
                  {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
                  {f !== 'all' && (
                    <span className="ml-1.5 text-xs opacity-60">
                      ({f === 'ACTIVE' ? stats.active : f === 'WON' ? stats.won : stats.lost})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders Table/Cards */}
        <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-20" />
              <p className="text-gray-400 text-lg mb-2">
                {filter === 'all' ? 'No trades yet' : `No ${filter.toLowerCase()} trades`}
              </p>
              <p className="text-sm text-gray-500">
                Your trading history will appear here
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#1a1f2e] border-b border-gray-800/50">
                    <tr>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-gray-400">Time</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-gray-400">Asset</th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400">Direction</th>
                      <th className="text-right py-4 px-4 text-xs font-semibold text-gray-400">Amount</th>
                      <th className="text-right py-4 px-4 text-xs font-semibold text-gray-400">Entry</th>
                      <th className="text-right py-4 px-4 text-xs font-semibold text-gray-400">Exit</th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400">Duration</th>
                      <th className="text-center py-4 px-4 text-xs font-semibold text-gray-400">Status</th>
                      <th className="text-right py-4 px-4 text-xs font-semibold text-gray-400">Profit/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, index) => (
                      <tr 
                        key={order.id} 
                        className="border-b border-gray-800/30 hover:bg-[#1a1f2e] transition-all animate-fade-in-up"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="py-4 px-4 text-sm">{formatDate(order.createdAt)}</td>
                        <td className="py-4 px-4">
                          <div className="font-medium">{order.asset_name}</div>
                          <div className="text-xs text-gray-400">{order.profitRate}% rate</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {order.direction === 'CALL' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg">
                              <TrendingUp className="w-4 h-4 text-green-400" />
                              <span className="text-sm font-semibold text-green-400">CALL</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg">
                              <TrendingDown className="w-4 h-4 text-red-400" />
                              <span className="text-sm font-semibold text-red-400">PUT</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right font-mono font-semibold">{formatCurrency(order.amount)}</td>
                        <td className="py-4 px-4 text-right font-mono">{order.entry_price.toFixed(3)}</td>
                        <td className="py-4 px-4 text-right font-mono">
                          {order.exit_price ? order.exit_price.toFixed(3) : '-'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-700/30 rounded text-xs">
                            <Clock className="w-3 h-3" />
                            {order.duration}m
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                            order.status === 'WON' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            order.status === 'LOST' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            order.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                            'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className={`py-4 px-4 text-right font-mono font-bold ${
                          order.profit && order.profit > 0 ? 'text-green-400' : 
                          order.profit && order.profit < 0 ? 'text-red-400' : 
                          'text-gray-400'
                        }`}>
                          {order.profit !== null && order.profit !== undefined ? (
                            <>
                              {order.profit > 0 ? '+' : ''}{formatCurrency(order.profit)}
                            </>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden p-4 space-y-3">
                {orders.map((order, index) => (
                  <div
                    key={order.id}
                    className="bg-[#1a1f2e] border border-gray-800/50 rounded-xl p-4 animate-fade-in-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          order.direction === 'CALL' 
                            ? 'bg-green-500/20 border border-green-500/30' 
                            : 'bg-red-500/20 border border-red-500/30'
                        }`}>
                          {order.direction === 'CALL' ? (
                            <TrendingUp className="w-5 h-5 text-green-400" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold">{order.asset_name}</div>
                          <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        order.status === 'WON' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                        order.status === 'LOST' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        order.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {order.status}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Amount</div>
                        <div className="font-mono font-semibold">{formatCurrency(order.amount)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Duration</div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span className="font-semibold">{order.duration}m</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Entry Price</div>
                        <div className="font-mono">{order.entry_price.toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400 mb-1">Exit Price</div>
                        <div className="font-mono">
                          {order.exit_price ? order.exit_price.toFixed(3) : '-'}
                        </div>
                      </div>
                    </div>

                    {/* Profit/Loss */}
                    {order.profit !== null && order.profit !== undefined && (
                      <div className="mt-3 pt-3 border-t border-gray-800/50">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">Profit/Loss</span>
                          <span className={`font-mono font-bold text-lg ${
                            order.profit > 0 ? 'text-green-400' : 
                            order.profit < 0 ? 'text-red-400' : 
                            'text-gray-400'
                          }`}>
                            {order.profit > 0 ? '+' : ''}{formatCurrency(order.profit)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}