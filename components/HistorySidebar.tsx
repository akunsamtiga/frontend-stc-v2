'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BinaryOrder } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { X, TrendingUp, TrendingDown, Clock, RefreshCw, Filter } from 'lucide-react'

interface HistorySidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function HistorySidebar({ isOpen, onClose }: HistorySidebarProps) {
  const [orders, setOrders] = useState<BinaryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

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

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" 
        onClick={onClose}
      />

      {/* Sidebar */}
      <div className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-[#0f1419] border-l border-gray-800/50 z-50 flex flex-col animate-slide-left shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800/50">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Trade History</h2>
          </div>
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
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400">Filter:</span>
          </div>
          <div className="flex gap-2 mt-2">
            {['all', 'ACTIVE', 'WON', 'LOST'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936]'
                }`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-3"></div>
                <div className="text-sm text-gray-400">Loading history...</div>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">
                  {filter === 'all' ? 'No trades yet' : `No ${filter.toLowerCase()} trades`}
                </p>
              </div>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-[#1a1f2e] border border-gray-800/50 rounded-xl p-4 hover:bg-[#232936] transition-all"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      order.direction === 'CALL' 
                        ? 'bg-green-500/20 border border-green-500/30' 
                        : 'bg-red-500/20 border border-red-500/30'
                    }`}>
                      {order.direction === 'CALL' ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-400" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{order.asset_name}</div>
                      <div className="text-xs text-gray-400">{formatDate(order.createdAt)}</div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${
                    order.status === 'WON' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    order.status === 'LOST' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    order.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                  }`}>
                    {order.status}
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Amount</span>
                    <span className="font-mono font-semibold">{formatCurrency(order.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Entry Price</span>
                    <span className="font-mono">{order.entry_price.toFixed(3)}</span>
                  </div>
                  {order.exit_price && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Exit Price</span>
                      <span className="font-mono">{order.exit_price.toFixed(3)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Duration</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.duration}m
                    </span>
                  </div>
                  {order.profit !== null && order.profit !== undefined && (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                      <span className="text-gray-400 font-medium">Profit/Loss</span>
                      <span className={`font-mono font-bold text-sm ${
                        order.profit > 0 ? 'text-green-400' : 
                        order.profit < 0 ? 'text-red-400' : 
                        'text-gray-400'
                      }`}>
                        {order.profit > 0 ? '+' : ''}{formatCurrency(order.profit)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-left {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slide-left {
          animation: slide-left 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  )
}