'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { BinaryOrder } from '@/types'
import { formatCurrency, formatDate, getOrderStatusColor } from '@/lib/utils'
import { TrendingUp, TrendingDown, Clock, Filter } from 'lucide-react'

export default function HistoryPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [orders, setOrders] = useState<BinaryOrder[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }

    loadOrders()
  }, [user, filter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const status = filter === 'all' ? undefined : filter
      const response = await api.getOrders(status)
      
      // Fix: Handle response structure correctly
      const ordersList = response?.data?.orders || response?.orders || []
      setOrders(ordersList)
    } catch (error) {
      console.error('Failed to load orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const stats = {
    total: orders.length,
    won: orders.filter(o => o.status === 'WON').length,
    lost: orders.filter(o => o.status === 'LOST').length,
    active: orders.filter(o => o.status === 'ACTIVE').length,
  }

  const winRate = stats.total > 0 ? ((stats.won / stats.total) * 100).toFixed(1) : '0'

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-6">Order History</h1>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Total Orders</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Won</div>
            <div className="text-2xl font-bold text-success">{stats.won}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Lost</div>
            <div className="text-2xl font-bold text-danger">{stats.lost}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-400 mb-1">Win Rate</div>
            <div className="text-2xl font-bold">{winRate}%</div>
          </div>
        </div>

        {/* Filter */}
        <div className="card mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Filter:</span>
          </div>
          <div className="flex gap-2">
            {['all', 'ACTIVE', 'WON', 'LOST'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  filter === f
                    ? 'bg-primary text-white'
                    : 'bg-background-tertiary text-gray-400 hover:bg-gray-700'
                }`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="card">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {filter === 'all' ? 'No orders yet' : `No ${filter.toLowerCase()} orders found`}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-sm text-gray-400">Time</th>
                    <th className="text-left py-3 px-4 text-sm text-gray-400">Asset</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Direction</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-400">Amount</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-400">Entry</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-400">Exit</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Duration</th>
                    <th className="text-center py-3 px-4 text-sm text-gray-400">Status</th>
                    <th className="text-right py-3 px-4 text-sm text-gray-400">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-700/50 hover:bg-background-tertiary transition-colors">
                      <td className="py-3 px-4 text-sm">{formatDate(order.createdAt)}</td>
                      <td className="py-3 px-4">{order.asset_name}</td>
                      <td className="py-3 px-4 text-center">
                        {order.direction === 'CALL' ? (
                          <span className="inline-flex items-center gap-1 text-success">
                            <TrendingUp className="w-4 h-4" />
                            CALL
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-danger">
                            <TrendingDown className="w-4 h-4" />
                            PUT
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{formatCurrency(order.amount)}</td>
                      <td className="py-3 px-4 text-right font-mono">{order.entry_price.toFixed(3)}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        {order.exit_price ? order.exit_price.toFixed(3) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-gray-400">
                          <Clock className="w-3 h-3" />
                          {order.duration}m
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`font-semibold ${getOrderStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-right font-mono font-bold ${
                        order.profit && order.profit > 0 ? 'text-success' : 
                        order.profit && order.profit < 0 ? 'text-danger' : ''
                      }`}>
                        {order.profit !== null && order.profit !== undefined ? formatCurrency(order.profit) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}