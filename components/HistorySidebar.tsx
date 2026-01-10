// components/HistorySidebar.tsx - ✅ UPDATED: Display 1s duration properly

'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BinaryOrder } from '@/types'
import { formatCurrency, formatDate, getDurationDisplay } from '@/lib/utils'
import { X, TrendingUp, TrendingDown, Clock, RefreshCw, Filter, Wallet } from 'lucide-react'

interface HistorySidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function HistorySidebar({ isOpen, onClose }: HistorySidebarProps) {
  const [orders, setOrders] = useState<BinaryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<'all' | 'real' | 'demo'>('all')

  useEffect(() => {
    if (isOpen) {
      loadOrders()
    }
  }, [isOpen, statusFilter, accountFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter
      const response = await api.getOrders(status, 1, 50)
      
      let ordersList = response?.data?.orders || response?.orders || []
      
      if (accountFilter !== 'all') {
        ordersList = ordersList.filter((o: BinaryOrder) => o.accountType === accountFilter)
      }
      
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

        {/* Stats Summary */}
        <div className="p-4 border-b border-gray-800/50 bg-[#0a0e17]">
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-[#1a1f2e] rounded-lg p-2 text-center border border-gray-800/50">
              <div className="text-xs text-gray-400 mb-1">Total</div>
              <div className="text-lg font-bold">{stats.total}</div>
            </div>
            <div className="bg-green-500/10 rounded-lg p-2 text-center border border-green-500/20">
              <div className="text-xs text-gray-400 mb-1">Won</div>
              <div className="text-lg font-bold text-green-400">{stats.won}</div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-2 text-center border border-red-500/20">
              <div className="text-xs text-gray-400 mb-1">Lost</div>
              <div className="text-lg font-bold text-red-400">{stats.lost}</div>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-2 text-center border border-blue-500/20">
              <div className="text-xs text-gray-400 mb-1">Active</div>
              <div className="text-lg font-bold text-blue-400">{stats.active}</div>
            </div>
          </div>
        </div>

        {/* Account Type Filter */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center gap-2 text-xs mb-2">
            <Wallet className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400 font-medium">Account Type:</span>
          </div>
          <div className="flex gap-2">
            {[
              { id: 'all', label: 'All', color: 'gray' },
              { id: 'real', label: 'Real', color: 'green' },
              { id: 'demo', label: 'Demo', color: 'blue' }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setAccountFilter(type.id as any)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  accountFilter === type.id
                    ? type.id === 'real'
                      ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                      : type.id === 'demo'
                      ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter */}
        <div className="p-4 border-b border-gray-800/50">
          <div className="flex items-center gap-2 text-xs mb-2">
            <Filter className="w-3 h-3 text-gray-400" />
            <span className="text-gray-400 font-medium">Status:</span>
          </div>
          <div className="flex gap-2">
            {['all', 'ACTIVE', 'WON', 'LOST'].map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === f
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-[#1a1f2e] text-gray-400 hover:bg-[#232936] border border-gray-800/50'
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
                  {statusFilter === 'all' && accountFilter === 'all' 
                    ? 'No trades yet' 
                    : `No ${statusFilter !== 'all' ? statusFilter.toLowerCase() : ''} trades ${accountFilter !== 'all' ? `in ${accountFilter} account` : ''}`}
                </p>
              </div>
            </div>
          ) : (
            orders.map((order) => {
              {/* ✅ UPDATED: Format duration display with 1s support */}
              const durationDisplay = getDurationDisplay(order.duration)
              const isUltraFast = order.duration < 1 // Less than 1 minute
              
              return (
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
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold">{order.asset_name}</div>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            order.accountType === 'real'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          }`}>
                            {order.accountType?.toUpperCase() || 'DEMO'}
                          </span>
                        </div>
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
                      <span className="font-semibold">{formatCurrency(order.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Entry Price</span>
                      <span className="">{order.entry_price.toFixed(3)}</span>
                    </div>
                    {order.exit_price && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Exit Price</span>
                        <span className="">{order.exit_price.toFixed(3)}</span>
                      </div>
                    )}
                    
                    {/* ✅ UPDATED: Duration display with ultra-fast indicator */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Duration</span>
                      <span className="flex items-center gap-1">
                        {isUltraFast && <span className="text-yellow-400">⚡</span>}
                        <Clock className="w-3 h-3" />
                        {durationDisplay}
                        {isUltraFast && (
                          <span className="text-[10px] text-yellow-400 font-bold">FAST</span>
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Profit Rate</span>
                      <span className="text-green-400 font-semibold">+{order.profitRate}%</span>
                    </div>
                    {order.profit !== null && order.profit !== undefined && (
                      <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                        <span className="text-gray-400 font-medium">Profit/Loss</span>
                        <span className={`font-bold text-sm ${
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
              )
            })
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-left {
          from { 
            transform: translateX(100%); 
            opacity: 0;
          }
          to { 
            transform: translateX(0); 
            opacity: 1;
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

        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(75, 85, 99, 0.5);
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(75, 85, 99, 0.7);
        }
      `}</style>
    </>
  )
}