'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BinaryOrder } from '@/types'
import { formatCurrency, formatDate, getOrderStatusColor } from '@/lib/utils'
import { X, TrendingUp, TrendingDown, Clock, Filter, RefreshCw } from 'lucide-react'

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
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] lg:w-[420px] bg-background-secondary border-l border-gray-700 z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-700 flex items-center justify-between flex-shrink-0 bg-background-tertiary">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Order History
            </h2>
            <p className="text-xs text-gray-400 mt-1">Your trading activity</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="p-4 border-b border-gray-700 bg-background flex-shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
            <div className="text-center p-3 bg-background-secondary rounded-lg border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Total</div>
              <div className="text-xl font-bold">{stats.total}</div>
            </div>
            <div className="text-center p-3 bg-background-secondary rounded-lg border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Won</div>
              <div className="text-xl font-bold text-success">{stats.won}</div>
            </div>
            <div className="text-center p-3 bg-background-secondary rounded-lg border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Lost</div>
              <div className="text-xl font-bold text-danger">{stats.lost}</div>
            </div>
            <div className="text-center p-3 bg-background-secondary rounded-lg border border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Active</div>
              <div className="text-xl font-bold text-blue-400">{stats.active}</div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-background-secondary rounded-lg border border-gray-700">
              <div className="text-xs text-gray-400">Win Rate</div>
              <div className="text-lg font-bold">{winRate}%</div>
            </div>
            <div className="p-2 bg-background-secondary rounded-lg border border-gray-700">
              <div className="text-xs text-gray-400">Total P/L</div>
              <div className={`text-lg font-bold font-mono ${
                totalProfit >= 0 ? 'text-success' : 'text-danger'
              }`}>
                {totalProfit >= 0 ? '+' : ''}{formatCurrency(totalProfit)}
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-gray-700 bg-background-secondary flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400 font-medium">Filter Status:</span>
            </div>
            <button
              onClick={loadOrders}
              disabled={loading}
              className="p-1.5 hover:bg-background-tertiary rounded transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'ACTIVE', 'WON', 'LOST'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-primary text-white shadow-lg'
                    : 'bg-background-tertiary text-gray-400 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3"></div>
              <div className="text-sm">Loading orders...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <div className="text-sm">
                {filter === 'all' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
              </div>
              <div className="text-xs mt-2">Start trading to see your history</div>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-background-tertiary rounded-lg p-3 sm:p-4 border border-gray-700 hover:border-gray-600 transition-all hover:shadow-lg"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {order.direction === 'CALL' ? (
                        <div className="p-1.5 bg-success/20 rounded-lg">
                          <TrendingUp className="w-4 h-4 text-success" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-danger/20 rounded-lg">
                          <TrendingDown className="w-4 h-4 text-danger" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm">{order.asset_name}</div>
                        <div className="text-xs text-gray-400">{order.direction}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center justify-end gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {order.duration}m
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs mb-2">
                    <div className="bg-background rounded-lg p-2">
                      <div className="text-gray-400 mb-1">Amount</div>
                      <div className="font-mono font-semibold">{formatCurrency(order.amount)}</div>
                    </div>
                    <div className="bg-background rounded-lg p-2">
                      <div className="text-gray-400 mb-1">Entry Price</div>
                      <div className="font-mono">{order.entry_price.toFixed(3)}</div>
                    </div>
                    {order.exit_price && (
                      <>
                        <div className="bg-background rounded-lg p-2">
                          <div className="text-gray-400 mb-1">Exit Price</div>
                          <div className="font-mono">{order.exit_price.toFixed(3)}</div>
                        </div>
                        <div className="bg-background rounded-lg p-2">
                          <div className="text-gray-400 mb-1">Profit/Loss</div>
                          <div className={`font-mono font-semibold ${
                            order.profit && order.profit > 0 ? 'text-success' : 
                            order.profit && order.profit < 0 ? 'text-danger' : ''
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
                  <div className="text-xs text-gray-500 border-t border-gray-700 pt-2 flex items-center justify-between">
                    <span>{formatDate(order.createdAt)}</span>
                    {order.profitRate > 0 && (
                      <span className="text-primary font-medium">
                        {order.profitRate}% rate
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0 bg-background-tertiary">
          <button
            onClick={onClose}
            className="w-full btn btn-secondary py-2.5"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </>
  )
}