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
  <div className="bg-[#1a1f2e] border border-gray-800/50 rounded-2xl p-4 md:p-6 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-gray-700 rounded-xl"></div>
      <div className="h-3 bg-gray-700 rounded w-24"></div>
    </div>
    <div className="h-10 bg-gray-700 rounded w-20 mb-2"></div>
    <div className="h-3 bg-gray-700 rounded w-16"></div>
  </div>
)

const TransactionSkeleton = () => (
  <div className="flex items-center justify-between p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-gray-700 rounded-xl"></div>
      <div>
        <div className="h-4 bg-gray-700 rounded w-24 mb-2"></div>
        <div className="h-3 bg-gray-700 rounded w-32"></div>
      </div>
    </div>
    <div className="h-5 bg-gray-700 rounded w-20"></div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#0a0e17]">
    <Navbar />
    <div className="container mx-auto px-3 sm:px-4 py-4 md:py-6">
      <div className="mb-4 sm:mb-6 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-32 mb-3"></div>
        <div className="h-4 bg-gray-700 rounded w-48"></div>
      </div>
      
      <div className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-emerald-500/20 border border-blue-500/30 rounded-2xl p-6 md:p-8 mb-6 md:mb-8">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
          <div className="flex-1">
            <div className="h-6 bg-gray-700 rounded w-40 mb-3"></div>
            <div className="flex gap-3">
              <div className="h-4 bg-gray-700 rounded w-24"></div>
              <div className="h-4 bg-gray-700 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      
      <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl overflow-hidden">
        <div className="h-14 border-b border-gray-800/50"></div>
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
      console.error('Failed to load user detail:', error)
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
      <div className="min-h-screen bg-[#0a0e17]">
        <Navbar />
        <div className="container mx-auto px-3 sm:px-4 py-8">
          <div className="text-center py-16">
            <p className="text-gray-400 mb-6">User not found</p>
            <button
              onClick={() => router.push('/admin/users')}
              className="px-4 sm:px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold transition-all text-sm sm:text-base"
            >
              Back to Users
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => router.push('/admin/users')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4 sm:mb-6 transition-colors text-sm sm:text-base"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Back to Users</span>
        </button>

        {/* User Info Card */}
        <div className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-emerald-500/20 border border-blue-500/30 rounded-2xl p-4 sm:p-6 md:p-8 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 md:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-20 md:h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6 sm:w-10 sm:h-10 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 text-white">{userDetail.user.email}</h1>
              
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full">
                  <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                  <span className="text-xs sm:text-sm font-medium text-blue-400 capitalize">
                    {userDetail.user.role.replace('_', ' ')}
                  </span>
                </div>
                
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  userDetail.user.isActive 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-red-500/20 border border-red-500/30'
                }`}>
                  {userDetail.user.isActive ? (
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />
                  )}
                  <span className={`text-xs sm:text-sm font-medium ${
                    userDetail.user.isActive ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {userDetail.user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-full">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                  <span className="text-xs sm:text-sm text-gray-400">
                    Member since {new Date(userDetail.user.createdAt).toLocaleDateString('id-ID', { 
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-[#1a1f2e] border border-gray-800/50 rounded-2xl p-4 md:p-6 hover:bg-[#232936] transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">Total Deposits</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              {formatCurrency(userDetail.balanceHistory.summary.totalDeposits)}
            </div>
          </div>

          <div className="bg-[#1a1f2e] border border-gray-800/50 rounded-2xl p-4 md:p-6 hover:bg-[#232936] transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-sm text-gray-400">Total Withdrawals</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              {formatCurrency(userDetail.balanceHistory.summary.totalWithdrawals)}
            </div>
          </div>

          <div className="bg-[#1a1f2e] border border-gray-800/50 rounded-2xl p-4 md:p-6 hover:bg-[#232936] transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">Total Orders</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              {userDetail.tradingHistory.statistics.totalOrders}
            </div>
          </div>

          <div className="bg-[#1a1f2e] border border-gray-800/50 rounded-2xl p-4 md:p-6 hover:bg-[#232936] transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-gray-400">Win Rate</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-400">
              {userDetail.tradingHistory.statistics.winRate}%
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl overflow-hidden">
          <div className="flex border-b border-gray-800/50 overflow-x-auto">
            <button
              onClick={() => setActiveTab('balance')}
              className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 font-medium transition-all whitespace-nowrap ${
                activeTab === 'balance'
                  ? 'bg-[#1a1f2e] text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              } text-sm sm:text-base`}
            >
              Balance History
            </button>
            <button
              onClick={() => setActiveTab('trading')}
              className={`flex-1 py-3 sm:py-4 px-4 sm:px-6 font-medium transition-all whitespace-nowrap ${
                activeTab === 'trading'
                  ? 'bg-[#1a1f2e] text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              } text-sm sm:text-base`}
            >
              Trading History
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'balance' ? (
              <div className="space-y-3">
                {userDetail.balanceHistory.transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-600 opacity-20" />
                    <p className="text-gray-400">No balance transactions</p>
                  </div>
                ) : (
                  userDetail.balanceHistory.transactions.slice(0, 10).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-800/50 rounded-xl transition-all"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
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
                          <div className="text-xs sm:text-sm text-gray-400">{formatDate(tx.createdAt)}</div>
                          {tx.description && (
                            <div className="text-xs text-gray-500 mt-1">{tx.description}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                        <div className={`text-lg sm:text-xl font-bold font-mono ${
                          tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {tx.type === 'deposit' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600 hidden sm:block" />
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
                    <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white">Performance by Asset</h3>
                    <div className="space-y-3">
                      {Object.entries(tradingStats.byAsset).map(([asset, stats]: [string, any]) => (
                        <div
                          key={asset}
                          className="p-3 sm:p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium text-white">{asset}</span>
                            <span className="text-xs sm:text-sm text-gray-400">
                              {stats.total} orders
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                            <div>
                              <div className="text-gray-400 mb-1">Won</div>
                              <div className="font-bold text-green-400">{stats.won}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">Lost</div>
                              <div className="font-bold text-red-400">{stats.lost}</div>
                            </div>
                            <div>
                              <div className="text-gray-400 mb-1">Profit</div>
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
                  <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4 text-white">Recent Orders</h3>
                  <div className="space-y-3">
                    {userDetail.tradingHistory.orders.slice(0, 10).map((order) => (
                      <div
                        key={order.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-800/50 rounded-xl transition-all"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
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
                            <div className="text-xs sm:text-sm text-gray-400">
                              {formatDate(order.createdAt)} • {order.duration}m
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          <div className="text-right">
                            <div className={`text-base sm:text-lg font-bold font-mono ${
                              order.status === 'WON' ? 'text-green-400' :
                              order.status === 'LOST' ? 'text-red-400' :
                              'text-gray-400'
                            }`}>
                              {order.profit !== null ? (
                                <>{order.profit >= 0 ? '+' : ''}{formatCurrency(order.profit)}</>
                              ) : '-'}
                            </div>
                            <div className={`text-xs ${
                              order.status === 'WON' ? 'text-green-400' :
                              order.status === 'LOST' ? 'text-red-400' :
                              order.status === 'ACTIVE' ? 'text-blue-400' :
                              'text-gray-400'
                            }`}>
                              {order.status}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-600 hidden sm:block" />
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