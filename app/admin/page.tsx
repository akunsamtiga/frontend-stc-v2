'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { 
  Users, 
  Package, 
  TrendingUp, 
  DollarSign,
  Activity,
  Target,
  ArrowRight,
  Settings,
  BarChart3,
  Shield,
  RefreshCw
} from 'lucide-react'
import { SystemStatistics } from '@/types'

type AccountFilter = 'combined' | 'real' | 'demo'

const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
      <div className="h-3 bg-gray-200 rounded w-24"></div>
    </div>
    <div className="h-10 bg-gray-200 rounded w-20 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-16"></div>
  </div>
)

const QuickActionSkeleton = () => (
  <div className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-40"></div>
      </div>
      <div className="w-5 h-5 bg-gray-200 rounded flex-shrink-0"></div>
    </div>
  </div>
)

const StatRowSkeleton = () => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 animate-pulse">
    <div className="h-3 bg-gray-200 rounded w-24"></div>
    <div className="h-4 bg-gray-200 rounded w-32"></div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#fafafa]">
    <Navbar />
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
      <div className="mb-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
            <div>
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-56"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded-lg w-28"></div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="mb-6">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <QuickActionSkeleton key={i} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {[...Array(2)].map((_, idx) => (
          <div key={idx} className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-40 mb-6"></div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <StatRowSkeleton key={i} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

export default function AdminDashboard() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<SystemStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('combined')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      router.push('/trading')
      return
    }
    
    loadStats()
  }, [user, router])

  const loadStats = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      
      const response = await api.getSystemStatistics()
      const data = response?.data || response
      
      setStats(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadStats(true)
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  if (loading) {
    return <LoadingSkeleton />
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center py-12">
            <p className="text-gray-500">Failed to load statistics</p>
            <button 
              onClick={() => loadStats()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const getFilteredStats = () => {
    if (accountFilter === 'real') {
      return {
        trading: stats.realAccount.trading,
        financial: stats.realAccount.financial
      }
    } else if (accountFilter === 'demo') {
      return {
        trading: stats.demoAccount.trading,
        financial: stats.demoAccount.financial
      }
    } else {
      const realTrading = stats.realAccount.trading
      const demoTrading = stats.demoAccount.trading
      const realFinancial = stats.realAccount.financial
      const demoFinancial = stats.demoAccount.financial

      return {
        trading: {
          totalOrders: realTrading.totalOrders + demoTrading.totalOrders,
          activeOrders: realTrading.activeOrders + demoTrading.activeOrders,
          wonOrders: realTrading.wonOrders + demoTrading.wonOrders,
          lostOrders: realTrading.lostOrders + demoTrading.lostOrders,
          winRate: Math.round(
            ((realTrading.wonOrders + demoTrading.wonOrders) / 
            ((realTrading.wonOrders + demoTrading.wonOrders) + 
             (realTrading.lostOrders + demoTrading.lostOrders)) || 1) * 100
          ),
          totalVolume: realTrading.totalVolume + demoTrading.totalVolume,
          totalProfit: realTrading.totalProfit + demoTrading.totalProfit,
        },
        financial: {
          totalDeposits: realFinancial.totalDeposits + demoFinancial.totalDeposits,
          totalWithdrawals: realFinancial.totalWithdrawals + demoFinancial.totalWithdrawals,
          netFlow: realFinancial.netFlow + demoFinancial.netFlow,
        }
      }
    }
  }

  const filteredStats = getFilteredStats()

  const quickActions = [
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'blue'
    },
    {
      title: 'Asset Management',
      description: 'Configure trading assets',
      icon: Package,
      href: '/admin/assets',
      color: 'purple'
    },
    {
      title: 'System Settings',
      description: 'Platform configuration',
      icon: Settings,
      href: '/admin/settings',
      color: 'green'
    }
  ]

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500">System overview and management</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors disabled:opacity-50 touch-manipulation"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium hidden sm:inline">
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
          
          {lastUpdated && (
            <p className="text-xs text-gray-400 ml-[52px]">
              Last updated: {lastUpdated.toLocaleTimeString('id-ID')}
            </p>
          )}
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setAccountFilter('combined')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap touch-manipulation ${
              accountFilter === 'combined'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100 border border-gray-200'
            }`}
          >Combined
          </button>
          <button
            onClick={() => setAccountFilter('real')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap touch-manipulation ${
              accountFilter === 'real'
                ? 'bg-green-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100 border border-gray-200'
            }`}
          >Real Account
          </button>
          <button
            onClick={() => setAccountFilter('demo')}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap touch-manipulation ${
              accountFilter === 'demo'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100 border border-gray-200'
            }`}
          >Demo Account
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg active:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Total Users</span>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900">
              {stats.users.total}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.users.active} active
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg active:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Total Orders</span>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900">
              {filteredStats.trading.totalOrders}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {filteredStats.trading.activeOrders} active
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg active:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Win Rate</span>
            </div>
            <div className="text-3xl lg:text-4xl font-bold text-gray-900">
              {filteredStats.trading.winRate}%
            </div>
            <div className="text-sm text-green-600 mt-1">
              {filteredStats.trading.wonOrders} wins
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg active:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500 font-medium">Net Flow</span>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 break-all">
              {new Intl.NumberFormat('id-ID', { 
                style: 'currency', 
                currency: 'IDR',
                minimumFractionDigits: 0,
                notation: 'compact'
              }).format(filteredStats.financial.netFlow)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Deposits - Withdrawals
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group bg-white rounded-xl p-5 border border-gray-100 hover:shadow-lg active:shadow-xl transition-all touch-manipulation"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-${action.color}-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl p-5 sm:p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Trading Statistics
              {accountFilter !== 'combined' && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  accountFilter === 'real' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {accountFilter.toUpperCase()}
                </span>
              )}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Volume</span>
                <span className="text-base font-mono font-bold text-gray-900 break-all">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(filteredStats.trading.totalVolume)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Profit</span>
                <span className={`text-base font-mono font-bold break-all ${
                  filteredStats.trading.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(filteredStats.trading.totalProfit)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Won Orders</span>
                <span className="text-base font-mono font-bold text-green-600">
                  {filteredStats.trading.wonOrders}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-600">Lost Orders</span>
                <span className="text-base font-mono font-bold text-red-600">
                  {filteredStats.trading.lostOrders}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 sm:p-6 border border-gray-100 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Financial Overview
              {accountFilter !== 'combined' && (
                <span className={`text-xs px-2 py-1 rounded-full ${
                  accountFilter === 'real' 
                    ? 'bg-green-100 text-green-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {accountFilter.toUpperCase()}
                </span>
              )}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Deposits</span>
                <span className="text-base font-mono font-bold text-green-600 break-all">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(filteredStats.financial.totalDeposits)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Total Withdrawals</span>
                <span className="text-base font-mono font-bold text-red-600 break-all">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(filteredStats.financial.totalWithdrawals)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-600">Net Flow</span>
                <span className={`text-base font-mono font-bold break-all ${
                  filteredStats.financial.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(filteredStats.financial.netFlow)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 sm:p-6 border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              System Health
            </h2>
            <Link 
              href="/admin/users"
              className="text-sm text-blue-600 hover:text-blue-700 active:text-blue-800 flex items-center gap-1 transition-colors font-medium touch-manipulation"
            >
              View All Users
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {Math.round((stats.users.active / stats.users.total) * 100)}%
              </div>
              <div className="text-xs text-gray-600">Active Users</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {filteredStats.trading.winRate}%
              </div>
              <div className="text-xs text-gray-600">Win Rate</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {filteredStats.trading.activeOrders}
              </div>
              <div className="text-xs text-gray-600">Active Orders</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
                {stats.users.admins}
              </div>
              <div className="text-xs text-gray-600">Admins</div>
            </div>
          </div>
        </div>

        {accountFilter === 'combined' && (
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-5 sm:p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Account Comparison
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-5 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Real Account</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orders:</span>
                    <span className="font-bold">{stats.realAccount.trading.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win Rate:</span>
                    <span className="font-bold text-green-600">{stats.realAccount.trading.winRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Profit:</span>
                    <span className={`font-bold break-all ${stats.realAccount.trading.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {new Intl.NumberFormat('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                        notation: 'compact'
                      }).format(stats.realAccount.trading.totalProfit)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 border border-purple-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-gray-900">Demo Account</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Orders:</span>
                    <span className="font-bold">{stats.demoAccount.trading.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Win Rate:</span>
                    <span className="font-bold text-purple-600">{stats.demoAccount.trading.winRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Profit:</span>
                    <span className={`font-bold break-all ${stats.demoAccount.trading.totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {new Intl.NumberFormat('id-ID', { 
                        style: 'currency', 
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                        notation: 'compact'
                      }).format(stats.demoAccount.trading.totalProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}