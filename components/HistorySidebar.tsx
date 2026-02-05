// components/HistorySidebar.tsx - Clean & Minimalist Design with Expandable Details

'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { BinaryOrder } from '@/types'
import { formatCurrency, formatDate, getDurationDisplay } from '@/lib/utils'
import { X, TrendingUp, TrendingDown, Clock, RefreshCw, ChevronDown } from 'lucide-react'

interface HistorySidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function HistorySidebar({ isOpen, onClose }: HistorySidebarProps) {
  const [orders, setOrders] = useState<BinaryOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [accountFilter, setAccountFilter] = useState<'all' | 'real' | 'demo'>('all')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  // State untuk mengontrol animasi keluar
  const [isClosing, setIsClosing] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      setShouldRender(true)
      loadOrders()
    } else if (shouldRender) {
      // Mulai animasi keluar
      setIsClosing(true)
      // Tunggu animasi selesai baru unmount
      const timer = setTimeout(() => {
        setShouldRender(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

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

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  // Handler untuk close dengan animasi
  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
    }, 250)
  }

  if (!shouldRender) return null

  const stats = {
    won: orders.filter(o => o.status === 'WON').length,
    lost: orders.filter(o => o.status === 'LOST').length,
    active: orders.filter(o => o.status === 'ACTIVE').length,
  }

  const winRate = stats.won + stats.lost > 0 
    ? ((stats.won / (stats.won + stats.lost)) * 100).toFixed(1)
    : '0.0'

  return (
    <>
      {/* Backdrop dengan animasi keluar */}
      <div 
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100 animate-fade-in'
        }`} 
        onClick={handleClose}
      />

      {/* Sidebar dengan animasi slide keluar */}
      <div className={`fixed top-0 right-0 bottom-0 w-[90vw] max-w-[380px] bg-[#0a0e17] border-l border-gray-800/30 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-out ${
        isClosing ? 'translate-x-full' : 'translate-x-0 animate-slide-left'
      }`}>
        
        {/* Header - Ultra Minimal */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center border border-blue-500/30">
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Riwayat</h2>
              <p className="text-xs text-gray-500">{orders.length} transaksi</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={loadOrders}
              disabled={loading}
              className="w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center transition-all"
              title="Segarkan"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-lg hover:bg-white/5 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Stats - Compact & Clean */}
        <div className="px-6 py-4 border-b border-gray-800/30 bg-gradient-to-b from-white/[0.02] to-transparent">
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold text-white mb-0.5">{winRate}%</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Tingkat Kemenangan</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-400 mb-0.5">{stats.won}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Menang</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-400 mb-0.5">{stats.lost}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Kalah</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-400 mb-0.5">{stats.active}</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider">Aktif</div>
            </div>
          </div>
        </div>

        {/* Filters - Minimal Pills */}
        <div className="px-6 py-3 space-y-3 border-b border-gray-800/30">
          {/* Account Filter */}
          <div className="flex gap-2">
            {[
              { id: 'real', label: 'Real' },
              { id: 'demo', label: 'Demo' }
            ].map((type) => (
              <button
                key={type.id}
                onClick={() => setAccountFilter(type.id as any)}
                className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  accountFilter === type.id
                    ? 'bg-white text-black shadow-lg'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {[
              { id: 'WON', label: 'Menang' },
              { id: 'LOST', label: 'Kalah' },
              { id: 'ACTIVE', label: 'Aktif' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`flex-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  statusFilter === f.id
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List - Clean & Compact */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-800 border-t-blue-500 mx-auto mb-3"></div>
                <div className="text-sm text-gray-500">Memuat...</div>
              </div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-sm text-gray-500">Tidak ada transaksi ditemukan</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((order) => {
                const durationDisplay = getDurationDisplay(order.duration)
                const isExpanded = expandedOrder === order.id
                const isUltraFast = order.duration < 1
                
                return (
                  <div
                    key={order.id}
                    className="group relative"
                  >
                    {/* Compact Order Item */}
                    <button
                      onClick={() => toggleExpand(order.id)}
                      className="w-full bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] rounded-xl p-3.5 transition-all text-left"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {/* Left: Icon + Asset */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            order.direction === 'CALL' 
                              ? 'bg-green-500/10 border border-green-500/20' 
                              : 'bg-red-500/10 border border-red-500/20'
                          }`}>
                            {order.direction === 'CALL' ? (
                              <TrendingUp className="w-4 h-4 text-green-400" />
                            ) : (
                              <TrendingDown className="w-4 h-4 text-red-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-sm text-white truncate">
                                {order.asset_name}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase flex-shrink-0 ${
                                order.accountType === 'real'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-blue-500/20 text-blue-400'
                              }`}>
                                {order.accountType || 'demo'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-gray-500">
                              <span>{formatCurrency(order.amount)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                {isUltraFast && <span className="text-yellow-400">⚡</span>}
                                {durationDisplay}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Profit/Loss + Expand Icon */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {order.profit !== null && order.profit !== undefined && (
                            <div className={`text-sm font-bold ${
                              order.profit > 0 ? 'text-green-400' : 
                              order.profit < 0 ? 'text-red-400' : 
                              'text-gray-400'
                            }`}>
                              {order.profit > 0 ? '+' : ''}{formatCurrency(order.profit)}
                            </div>
                          )}
                          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
                            isExpanded ? 'rotate-180' : ''
                          }`} />
                        </div>
                      </div>
                    </button>

                    {/* Expanded Details */}
                    <div className={`overflow-hidden transition-all duration-300 ${
                      isExpanded ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-4 space-y-3">
                        {/* Status Badge */}
                        <div className="flex items-center gap-2 pb-3 border-b border-white/[0.05]">
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            order.status === 'WON' ? 'bg-green-500/20 text-green-400' :
                            order.status === 'LOST' ? 'bg-red-500/20 text-red-400' :
                            order.status === 'ACTIVE' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {order.status}
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(order.createdAt)}</span>
                        </div>

                        {/* Details Grid */}
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between py-1">
                            <span className="text-gray-500">Harga Masuk</span>
                            <span className="font-medium text-white">{order.entry_price.toFixed(3)}</span>
                          </div>
                          
                          {order.exit_price && (
                            <div className="flex items-center justify-between py-1">
                              <span className="text-gray-500">Harga Keluar</span>
                              <span className="font-medium text-white">{order.exit_price.toFixed(3)}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-between py-1">
                            <span className="text-gray-500">Tingkat Keuntungan</span>
                            <span className="font-medium text-green-400">+{order.profitRate}%</span>
                          </div>

                          {order.profit !== null && order.profit !== undefined && (
                            <div className="flex items-center justify-between py-2 mt-2 pt-3 border-t border-white/[0.05]">
                              <span className="text-gray-400 font-medium">Total P&L</span>
                              <span className={`font-bold text-base ${
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
                    </div>
                  </div>
                )
              })}
            </div>
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
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-slide-left {
          animation: slide-left 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        /* Custom Scrollbar */
        .overflow-y-auto::-webkit-scrollbar {
          width: 4px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      `}</style>
    </>
  )
}