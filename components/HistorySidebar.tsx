'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BinaryOrder } from '@/types'
import { formatCurrency, formatDate, getOrderStatusColor } from '@/lib/utils'
import { X, TrendingUp, TrendingDown, Clock, Filter } from 'lucide-react'

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

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40 lg:z-30"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 lg:left-14 bottom-0 w-full lg:w-96 bg-background-secondary border-l border-gray-700 z-50 lg:z-30 flex flex-col shadow-2xl animate-slide-in">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold">Order History</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats */}
        <div className="p-4 border-b border-gray-700 grid grid-cols-4 gap-2 flex-shrink-0">
          <div className="text-center p-2 bg-background-tertiary rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Total</div>
            <div className="text-lg font-bold">{stats.total}</div>
          </div>
          <div className="text-center p-2 bg-background-tertiary rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Won</div>
            <div className="text-lg font-bold text-success">{stats.won}</div>
          </div>
          <div className="text-center p-2 bg-background-tertiary rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Lost</div>
            <div className="text-lg font-bold text-danger">{stats.lost}</div>
          </div>
          <div className="text-center p-2 bg-background-tertiary rounded-lg">
            <div className="text-xs text-gray-400 mb-1">Active</div>
            <div className="text-lg font-bold text-blue-400">{stats.active}</div>
          </div>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">Filter:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {['all', 'ACTIVE', 'WON', 'LOST'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
              Loading...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {filter === 'all' ? 'No orders yet' : `No ${filter.toLowerCase()} orders`}
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-background-tertiary rounded-lg p-3 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {order.direction === 'CALL' ? (
                        <div className="p-1.5 bg-success/20 rounded">
                          <TrendingUp className="w-4 h-4 text-success" />
                        </div>
                      ) : (
                        <div className="p-1.5 bg-danger/20 rounded">
                          <TrendingDown className="w-4 h-4 text-danger" />
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-sm">{order.asset_name}</div>
                        <div className="text-xs text-gray-400">{order.direction}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                      </div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {order.duration}m
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                    <div>
                      <div className="text-gray-400">Amount</div>
                      <div className="font-mono font-semibold">{formatCurrency(order.amount)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Entry</div>
                      <div className="font-mono">{order.entry_price.toFixed(3)}</div>
                    </div>
                    {order.exit_price && (
                      <>
                        <div>
                          <div className="text-gray-400">Exit</div>
                          <div className="font-mono">{order.exit_price.toFixed(3)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">Profit</div>
                          <div className={`font-mono font-semibold ${
                            order.profit && order.profit > 0 ? 'text-success' : 
                            order.profit && order.profit < 0 ? 'text-danger' : ''
                          }`}>
                            {order.profit !== null && order.profit !== undefined 
                              ? formatCurrency(order.profit) 
                              : '-'}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Time */}
                  <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
                    {formatDate(order.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={loadOrders}
            disabled={loading}
            className="w-full btn btn-secondary py-2"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
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

        @media (min-width: 1024px) {
          @keyframes slide-in {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(0);
            }
          }
        }
      `}</style>
    </>
  )
}