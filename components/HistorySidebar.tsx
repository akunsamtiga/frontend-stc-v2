'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BinaryOrder } from '@/types'
import { formatCurrency, getOrderStatusColor } from '@/lib/utils'
import { X, TrendingUp, TrendingDown, Clock, RefreshCw, ChevronRight } from 'lucide-react'

interface HistorySidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function HistorySidebar({ isOpen, onClose }: HistorySidebarProps) {
  const [orders, setOrders] = useState<BinaryOrder[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadOrders()
    }
  }, [isOpen, filter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const status = filter === 'all' ? undefined : filter
      const response = await api.getOrders(status, 1, 50)
      
      const ordersList = response?.data?.orders || response?.orders || []
      setOrders(ordersList)
    } catch (error) {
      console.error('Failed to load orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const stats = {
    total: orders.length,
    won: orders.filter(o => o.status === 'WON').length,
    lost: orders.filter(o => o.status === 'LOST').length,
    active: orders.filter(o => o.status === 'ACTIVE').length,
  }

  const winRate = stats.total > 0 ? ((stats.won / stats.total) * 100).toFixed(1) : '0'
  const totalProfit = orders.reduce((sum, o) => sum + (o.profit || 0), 0)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-[#0f1419] border-l border-gray-800/50 z-50 flex flex-col shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="h-14 px-4 border-b border-gray-800/50 flex items-center justify-between flex-shrink-0">
          <h2 className="font-bold text-sm">Trade History</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={loadOrders}
              disabled={loading}
              className="p-2 hover:bg-[#1a1f2e] rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#1a1f2e] rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 py-3 border-b border-gray-800/50 bg-[#0a0e17] flex-shrink-0">
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="text-center p-2 bg-[#1a1f2e] rounded-lg">
              <div className="text-xs text-gray-400">Total</div>
              <div className="text-lg font-bold">{stats.total}</div>
            </div>
            <div className="text-center p-2 bg-[#1a1f2e] rounded-lg">
              <div className="text-xs text-gray-400">Won</div>
              <div className="text-lg font-bold text-green-400">{stats.won}</div>
            </div>
            <div className="text-center p-2 bg-[#1a1f2e] rounded-lg">
              <div className="text-xs text-gray-400">Lost</div>
              <div className="text-lg font-bold text-red-400">{stats.lost}</div>
            </div>
            <div className="text-center p-2 bg-[#1a1f2e] rounded-lg">
              <div className="text-xs text-gray-400">Active</div>
              <div className="text-lg font-bold text-blue-400">{stats.active}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex-1 p-2 bg-[#1a1f2e] rounded-lg text-center">
              <div className="text-xs text-gray-400">Win Rate</div>
              <div className="text-sm font-bold">{winRate}%</div>
            </div>
            <div className="flex-1 p-2 bg-[#1a1f2e] rounded-lg text-center">
              <div className="text-xs text-gray-400">Total P/L</div>
              <div className={`text-sm font-bold font-mono ${
                totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b border-gray-800/50 flex gap-2 flex-shrink-0 overflow-x-auto">
          {['all', 'ACTIVE', 'WON', 'LOST'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                filter === f
                  ? 'bg-blue-500 text-white'
                  : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
              <div className="text-sm">Loading...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <div className="text-sm">
                {filter === 'all' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#1a1f2e] rounded-lg p-3 border border-gray-800/50 hover:border-gray-700/50 transition-all"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${
                        order.direction === 'CALL' ? 'bg-green-500/20' : 'bg-red-500/20'
                      }`}>
                        {order.direction === 'CALL' ? (
                          <TrendingUp className="w-3 h-3 text-green-400" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-medium">{order.asset_name}</div>
                        <div className="text-[10px] text-gray-500">{order.direction}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                      </div>
                      <div className="text-[10px] text-gray-500 flex items-center justify-end gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {order.duration}m
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-2">
                    <div>
                      <div className="text-gray-500">Amount</div>
                      <div className="font-mono font-medium">{formatCurrency(order.amount)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Entry</div>
                      <div className="font-mono">{order.entry_price.toFixed(3)}</div>
                    </div>
                    {order.exit_price && (
                      <>
                        <div>
                          <div className="text-gray-500">Exit</div>
                          <div className="font-mono">{order.exit_price.toFixed(3)}</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Profit/Loss</div>
                          <div className={`font-mono font-bold ${
                            order.profit && order.profit > 0 ? 'text-green-400' : 
                            order.profit && order.profit < 0 ? 'text-red-400' : ''
                          }`}>
                            {order.profit !== null && order.profit !== undefined 
                              ? `${order.profit > 0 ? '+' : ''}${formatCurrency(order.profit)}`
                              : '-'}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="text-[10px] text-gray-600 border-t border-gray-800/50 pt-2 flex items-center justify-between">
                    <span>{new Date(order.createdAt).toLocaleString()}</span>
                    {order.profitRate > 0 && (
                      <span className="text-green-400 font-medium">{order.profitRate}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  )
}