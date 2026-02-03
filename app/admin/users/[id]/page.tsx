// app/admin/users/[id]/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { 
  ArrowLeft,
  User,
  Mail,
  Shield,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface UserDetail {
  user: {
    id: string
    email: string
    role: string
    isActive: boolean
    createdAt: string
  }
  balanceHistory: {
    transactions: any[]
    summary: {
      totalDeposits: number
      totalWithdrawals: number
      netDeposits: number
      transactionCount: number
    }
  }
  tradingHistory: {
    orders: any[]
    statistics: {
      totalOrders: number
      activeOrders: number
      wonOrders: number
      lostOrders: number
      winRate: number
      totalProfit: number
    }
  }
}

const StatCardSkeleton = () => (
  <div className="bg-white/5 rounded-lg p-4 border border-white/10 animate-pulse backdrop-blur-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-white/10 rounded-xl"></div>
      <div className="h-3 bg-white/10 rounded w-24"></div>
    </div>
    <div className="h-8 bg-white/10 rounded w-20 mb-2"></div>
    <div className="h-3 bg-white/10 rounded w-16"></div>
  </div>
)

const TransactionSkeleton = () => (
  <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-white/10 rounded-xl"></div>
      <div>
        <div className="h-4 bg-white/10 rounded w-24 mb-2"></div>
        <div className="h-3 bg-white/10 rounded w-32"></div>
      </div>
    </div>
    <div className="h-5 bg-white/10 rounded w-20"></div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <Navbar />
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-32 mb-3"></div>
      </div>
      
      <div className="bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-emerald-500/20 border border-indigo-500/30 rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white/10 rounded-full"></div>
          <div className="flex-1">
            <div className="h-6 bg-white/10 rounded w-40 mb-3"></div>
            <div className="flex gap-3">
              <div className="h-4 bg-white/10 rounded w-24"></div>
              <div className="h-4 bg-white/10 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <div className="h-14 border-b border-white/10"></div>
        <div className="p-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <TransactionSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  </div>
)

export default function AdminUserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const user = useAuthStore((state) => state.user)
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null)
  const [tradingStats, setTradingStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'balance' | 'trading'>('balance')

  const userId = params?.id as string

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      router.push('/trading')
      return
    }
    
    if (!userId) return
    
    loadUserDetail()
  }, [user, userId, router])

  const loadUserDetail = async () => {
    try {
      setLoading(true)
      const [historyResponse, statsResponse] = await Promise.all([
        api.getUserHistory(userId),
        api.getUserTradingStats(userId)
      ])
      
      setUserDetail(historyResponse?.data || historyResponse)
      setTradingStats(statsResponse?.data || statsResponse)
    } catch (error) {
      console.error('Gagal memuat detail pengguna:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  if (loading) {
    return <LoadingSkeleton />
  }

  if (!userDetail) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-16">
            <p className="text-slate-400 mb-6">Pengguna tidak ditemukan</p>
            <button
              onClick={() => router.push('/admin/users')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-semibold transition-all text-white"
            >
              Kembali ke Pengguna
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.push('/admin/users')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali ke Pengguna</span>
        </button>

        {/* User Info Card */}
        <div className="bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-emerald-500/20 border border-indigo-500/30 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-3 text-white">{userDetail.user.email}</h1>
              
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-medium text-indigo-400 capitalize">
                    {userDetail.user.role.replace('_', ' ')}
                  </span>
                </div>
                
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  userDetail.user.isActive 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-red-500/20 border border-red-500/30'
                }`}>
                  {userDetail.user.isActive ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    userDetail.user.isActive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {userDetail.user.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-400">
                    Anggota sejak {new Date(userDetail.user.createdAt).toLocaleDateString('id-ID', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm text-slate-400">Total Deposit</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(userDetail.balanceHistory.summary.totalDeposits)}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-sm text-slate-400">Total Penarikan</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(userDetail.balanceHistory.summary.totalWithdrawals)}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-slate-400">Total Order</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {userDetail.tradingHistory.statistics.totalOrders}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-slate-400">Win Rate</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {userDetail.tradingHistory.statistics.winRate}%
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden backdrop-blur-sm">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('balance')}
              className={`flex-1 py-4 px-6 font-medium transition-all ${
                activeTab === 'balance'
                  ? 'bg-white/5 text-white border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Riwayat Saldo
            </button>
            <button
              onClick={() => setActiveTab('trading')}
              className={`flex-1 py-4 px-6 font-medium transition-all ${
                activeTab === 'trading'
                  ? 'bg-white/5 text-white border-b-2 border-indigo-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Riwayat Trading
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'balance' ? (
              <div className="space-y-3">
                {userDetail.balanceHistory.transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-slate-500 opacity-20" />
                    <p className="text-slate-400">Tidak ada transaksi saldo</p>
                  </div>
                ) : (
                  userDetail.balanceHistory.transactions.slice(0, 10).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          tx.type === 'deposit' ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          {tx.type === 'deposit' ? (
                            <TrendingUp className="w-5 h-5 text-green-400" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white capitalize">{tx.type}</div>
                          <div className="text-sm text-slate-400">{formatDate(tx.createdAt)}</div>
                          {tx.description && (
                            <div className="text-xs text-slate-500 mt-1">{tx.description}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className={`text-xl font-bold ${
                          tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {tx.type === 'deposit' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Trading Stats by Asset */}
                {tradingStats && Object.keys(tradingStats.byAsset).length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-4 text-white">Performa per Aset</h3>
                    <div className="space-y-3">
                      {Object.entries(tradingStats.byAsset).map(([asset, stats]: [string, any]) => (
                        <div
                          key={asset}
                          className="p-4 bg-white/5 border border-white/10 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-white">{asset}</span>
                            <span className="text-sm text-slate-400">
                              {stats.total} order
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-slate-400 mb-1">Menang</div>
                              <div className="font-bold text-green-400">{stats.won}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 mb-1">Kalah</div>
                              <div className="font-bold text-red-400">{stats.lost}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 mb-1">Profit</div>
                              <div className={`font-bold ${
                                stats.profit >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {formatCurrency(stats.profit)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Orders */}
                <div>
                  <h3 className="text-lg font-bold mb-4 text-white">Order Terbaru</h3>
                  <div className="space-y-3">
                    {userDetail.tradingHistory.orders.slice(0, 10).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all"
                      >
                        <div className="flex items-center gap-4">
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
                            <div className="font-medium text-white">{order.asset_name}</div>
                            <div className="text-sm text-slate-400">
                              {formatDate(order.createdAt)} • {order.duration}m
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            order.status === 'WON' ? 'text-green-400' :
                            order.status === 'LOST' ? 'text-red-400' :
                            'text-slate-400'
                          }`}>
                            {order.profit !== null ? (
                              <>{order.profit >= 0 ? '+' : ''}{formatCurrency(order.profit)}</>
                            ) : '-'}
                          </div>
                          <div className={`text-xs ${
                            order.status === 'WON' ? 'text-green-400' :
                            order.status === 'LOST' ? 'text-red-400' :
                            order.status === 'ACTIVE' ? 'text-blue-400' :
                            'text-slate-400'
                          }`}>
                            {order.status === 'WON' ? 'MENANG' : 
                             order.status === 'LOST' ? 'KALAH' : 
                             order.status === 'ACTIVE' ? 'AKTIF' : order.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}