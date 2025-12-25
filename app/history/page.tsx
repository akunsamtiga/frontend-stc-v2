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
  ChevronRight
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
            <div className="w-12 h-12 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-gray-400">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header - Clean */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 tracking-tight">Trading History</h1>
            <p className="text-gray-400">Your complete activity</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-gray-800/50 hover:border-gray-700 rounded-xl transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Stats - Minimal Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-sm text-gray-400">Total</span>
            </div>
            <div className="text-3xl font-bold">{stats.total}</div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">Won</span>
            </div>
            <div className="text-3xl font-bold text-green-400">{stats.won}</div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-sm text-gray-400">Lost</span>
            </div>
            <div className="text-3xl font-bold text-red-400">{stats.lost}</div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-sm text-gray-400">Win Rate</span>
            </div>
            <div className="text-3xl font-bold text-yellow-400">{winRate}%</div>
          </div>
        </div>

        {/* Total P&L - Centered Card */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent border border-gray-800/50 rounded-2xl p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent rounded-2xl blur-2xl -z-10"></div>
            
            <div className="text-center">
              <div className="text-sm text-gray-400 mb-2">Total Profit & Loss</div>
              <div className={`text-5xl font-bold font-mono ${
                totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
              </div>
            </div>
          </div>
        </div>

        {/* Filter - Minimal Pills */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 flex-shrink-0">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500">Filter:</span>
          </div>
          {['all', 'ACTIVE', 'WON', 'LOST'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-gray-800/50'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              {f !== 'all' && ` (${f === 'ACTIVE' ? stats.active : f === 'WON' ? stats.won : stats.lost})`}
            </button>
          ))}
        </div>

        {/* Orders List - Clean */}
        <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-20">
              <Activity className="w-16 h-16 mx-auto mb-4 text-gray-700 opacity-20" />
              <p className="text-gray-400 text-lg mb-2">
                {filter === 'all' ? 'No trades yet' : `No ${filter.toLowerCase()} trades`}
              </p>
              <p className="text-sm text-gray-500">Your trading history will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/30">
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500">
                      <th className="py-4 px-6 font-medium">Time</th>
                      <th className="py-4 px-6 font-medium">Asset</th>
                      <th className="py-4 px-6 font-medium text-center">Type</th>
                      <th className="py-4 px-6 font-medium text-right">Amount</th>
                      <th className="py-4 px-6 font-medium text-right">Entry → Exit</th>
                      <th className="py-4 px-6 font-medium text-center">Time</th>
                      <th className="py-4 px-6 font-medium text-center">Status</th>
                      <th className="py-4 px-6 font-medium text-right">P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/30">
                    {orders.map((order) => (
                      <tr 
                        key={order.id}
                        className="hover:bg-[#1a1f2e] transition-colors cursor-default"
                      >
                        <td className="py-4 px-6 text-sm text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-medium">{order.asset_name}</div>
                          <div className="text-xs text-gray-500">+{order.profitRate}%</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            {order.direction === 'CALL' ? (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 rounded-full">
                                <TrendingUp className="w-3 h-3 text-green-400" />
                                <span className="text-xs font-medium text-green-400">CALL</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 rounded-full">
                                <TrendingDown className="w-3 h-3 text-red-400" />
                                <span className="text-xs font-medium text-red-400">PUT</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-mono">{formatCurrency(order.amount)}</td>
                        <td className="py-4 px-6 text-right font-mono text-sm text-gray-400">
                          {order.entry_price.toFixed(3)} → {order.exit_price ? order.exit_price.toFixed(3) : '—'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800/50 rounded text-xs text-gray-400">
                              <Clock className="w-3 h-3" />
                              {order.duration}m
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'WON' ? 'bg-green-500/10 text-green-400' :
                              order.status === 'LOST' ? 'bg-red-500/10 text-red-400' :
                              order.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-400' :
                              'bg-gray-500/10 text-gray-400'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </td>
                        <td className={`py-4 px-6 text-right font-mono font-bold ${
                          order.profit && order.profit > 0 ? 'text-green-400' : 
                          order.profit && order.profit < 0 ? 'text-red-400' : 
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
                    className="group bg-[#1a1f2e] hover:bg-[#232936] border border-gray-800/50 hover:border-gray-700 rounded-xl p-4 transition-all cursor-default"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          order.direction === 'CALL' ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          {order.direction === 'CALL' ? (
                            <TrendingUp className="w-5 h-5 text-green-400" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{order.asset_name}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.status === 'WON' ? 'bg-green-500/10 text-green-400' :
                          order.status === 'LOST' ? 'bg-red-500/10 text-red-400' :
                          order.status === 'ACTIVE' ? 'bg-blue-500/10 text-blue-400' :
                          'bg-gray-500/10 text-gray-400'
                        }`}>
                          {order.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Amount</div>
                        <div className="font-mono">{formatCurrency(order.amount)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Duration</div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span>{order.duration}m</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Entry</div>
                        <div className="font-mono text-sm">{order.entry_price.toFixed(3)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Exit</div>
                        <div className="font-mono text-sm">
                          {order.exit_price ? order.exit_price.toFixed(3) : '—'}
                        </div>
                      </div>
                    </div>

                    {order.profit !== null && order.profit !== undefined && (
                      <div className="mt-3 pt-3 border-t border-gray-800/50 flex items-center justify-between">
                        <span className="text-sm text-gray-400">P&L</span>
                        <span className={`font-mono font-bold text-lg ${
                          order.profit > 0 ? 'text-green-400' : 
                          order.profit < 0 ? 'text-red-400' : 
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