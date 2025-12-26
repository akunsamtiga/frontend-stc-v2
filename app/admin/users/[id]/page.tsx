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
  XCircle
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

  if (!userDetail) {
    return (
      <div className="min-h-screen bg-[#0a0e17]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">User not found</p>
            <button
              onClick={() => router.push('/admin/users')}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-semibold transition-all"
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

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Back Button */}
        <button
          onClick={() => router.push('/admin/users')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Users</span>
        </button>

        {/* User Info Card */}
        <div className="bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-emerald-500/20 border border-blue-500/30 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-white" />
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-3">{userDetail.user.email}</h1>
              
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-blue-400 capitalize">
                    {userDetail.user.role.replace('_', ' ')}
                  </span>
                </div>
                
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
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
                    {userDetail.user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 rounded-full">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">
                    Member since {new Date(userDetail.user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-sm text-gray-400">Total Deposits</span>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(userDetail.balanceHistory.summary.totalDeposits)}
            </div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-sm text-gray-400">Total Withdrawals</span>
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(userDetail.balanceHistory.summary.totalWithdrawals)}
            </div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-sm text-gray-400">Total Orders</span>
            </div>
            <div className="text-2xl font-bold">
              {userDetail.tradingHistory.statistics.totalOrders}
            </div>
          </div>

          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm text-gray-400">Win Rate</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400">
              {userDetail.tradingHistory.statistics.winRate}%
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl overflow-hidden">
          <div className="flex border-b border-gray-800/50">
            <button
              onClick={() => setActiveTab('balance')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'balance'
                  ? 'bg-[#1a1f2e] text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Balance History
            </button>
            <button
              onClick={() => setActiveTab('trading')}
              className={`flex-1 py-4 px-6 font-medium transition-colors ${
                activeTab === 'trading'
                  ? 'bg-[#1a1f2e] text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Trading History
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'balance' ? (
              <div className="space-y-3">
                {userDetail.balanceHistory.transactions.length === 0 ? (
                  <div className="text-center py-16">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-700 opacity-20" />
                    <p className="text-gray-400">No balance transactions</p>
                  </div>
                ) : (
                  userDetail.balanceHistory.transactions.slice(0, 10).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-800/50 rounded-xl transition-all"
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
                          <div className="font-medium capitalize">{tx.type}</div>
                          <div className="text-sm text-gray-400">{formatDate(tx.createdAt)}</div>
                          {tx.description && (
                            <div className="text-xs text-gray-500 mt-1">{tx.description}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className={`text-xl font-bold font-mono ${
                          tx.type === 'deposit' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {tx.type === 'deposit' ? '+' : '-'}
                          {formatCurrency(tx.amount)}
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
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
                    <h3 className="text-lg font-bold mb-4">Performance by Asset</h3>
                    <div className="space-y-3">
                      {Object.entries(tradingStats.byAsset).map(([asset, stats]: [string, any]) => (
                        <div
                          key={asset}
                          className="p-4 bg-[#1a1f2e] border border-gray-800/50 rounded-xl"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-medium">{asset}</span>
                            <span className="text-sm text-gray-400">
                              {stats.total} orders
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
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
                  <h3 className="text-lg font-bold mb-4">Recent Orders</h3>
                  <div className="space-y-3">
                    {userDetail.tradingHistory.orders.slice(0, 10).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-800/50 rounded-xl transition-all"
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
                            <div className="font-medium">{order.asset_name}</div>
                            <div className="text-sm text-gray-400">
                              {formatDate(order.createdAt)} • {order.duration}m
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`text-lg font-bold font-mono ${
                            order.status === 'WON' ? 'text-green-400' :
                            order.status === 'LOST' ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                            {order.profit !== null ? (
                              <>{order.profit >= 0 ? '+' : ''}{formatCurrency(order.profit)}</>
                            ) : 'â€"'}
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