// app/admin/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { SystemStatistics } from '@/types'
import { 
  Shield, BarChart3, Target, DollarSign, Activity, ArrowRight,
  RefreshCw, ArrowUpFromLine as WithdrawIcon, Tag, Calendar,
  Users, Package, Settings
} from 'lucide-react'

// ✅ UPDATED: Hanya real dan demo saja
type AccountFilter = 'real' | 'demo'

const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-200 rounded-lg"></div>
      <div className="h-3 bg-gray-200 rounded w-20 md:w-24"></div>
    </div>
    <div className="h-8 md:h-10 bg-gray-200 rounded w-16 md:w-20 mb-1 md:mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-12 md:w-16"></div>
  </div>
)

const QuickActionSkeleton = () => (
  <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 animate-pulse">
    <div className="flex items-start gap-3 md:gap-4">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-200 rounded-lg flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="h-4 bg-gray-200 rounded w-28 md:w-32 mb-1 md:mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-32 md:w-40"></div>
      </div>
      <div className="w-4 h-4 md:w-5 md:h-5 bg-gray-200 rounded flex-shrink-0"></div>
    </div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#fafafa]">
    <Navbar />
    <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 lg:py-8 max-w-7xl">
      <div className="mb-4 md:mb-6 animate-pulse">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
            <div>
              <div className="h-6 md:h-8 bg-gray-200 rounded w-40 md:w-48 mb-1 md:mb-2"></div>
              <div className="h-3 md:h-4 bg-gray-200 rounded w-48 md:w-56"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded-lg w-24"></div>
        </div>
      </div>

      <div className="mb-4 md:mb-6">
        <div className="h-6 bg-gray-200 rounded w-32 mb-3 md:mb-4"></div>
        <div className="overflow-x-auto">
          <div className="flex gap-2 w-max pb-2">
            <div className="h-10 bg-gray-200 rounded-lg w-28"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-28"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="mb-4 md:mb-6">
        <div className="h-6 bg-gray-200 rounded w-32 mb-3 md:mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {[...Array(6)].map((_, i) => (
            <QuickActionSkeleton key={i} />
          ))}
        </div>
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
  // ✅ UPDATED: Default ke 'real' instead of 'combined'
  const [accountFilter, setAccountFilter] = useState<AccountFilter>('real')
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
      
      let statsData: SystemStatistics | null = null
      
      if (response && typeof response === 'object') {
        if ('data' in response && response.data) {
          statsData = response.data as SystemStatistics
        } 
        else if ('users' in response && 'realAccount' in response) {
          statsData = response as SystemStatistics
        }
      }
      
      if (statsData) {
        setStats(statsData)
        setLastUpdated(new Date())
      } else {
        console.error('Invalid statistics data received')
      }
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
        <div className="container mx-auto px-3 md:px-4 py-6 md:py-8 max-w-7xl">
          <div className="text-center py-8 md:py-12">
            <p className="text-gray-500">Failed to load statistics</p>
            <button 
              onClick={() => loadStats()}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ✅ UPDATED: Hapus logic combined, hanya real dan demo
  const getFilteredStats = () => {
    if (accountFilter === 'real') {
      return {
        trading: stats.realAccount.trading,
        financial: stats.realAccount.financial
      }
    } else {
      // demo
      return {
        trading: stats.demoAccount.trading,
        financial: stats.demoAccount.financial
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
      title: 'Asset Schedule',
      description: 'Schedule asset trends and market manipulation',
      icon: Calendar,
      href: '/admin/asset-schedule',
      color: 'green'
    },
    {
      title: 'Voucher Management',
      description: 'Create and manage deposit vouchers',
      icon: Tag,
      href: '/admin/vouchers',
      color: 'orange'
    },
    {
      title: 'Verification Management',
      description: 'Review KTP & Selfie verifications',
      icon: Shield,
      href: '/admin/verifications',
      color: 'indigo',
      badge: (stats as any)?.verifications?.pending ? (stats as any).verifications.pending : undefined
    },
    {
      title: 'Withdrawal Requests',
      description: 'Review and approve withdrawals',
      icon: WithdrawIcon,
      href: '/admin/withdrawals',
      color: 'red',
      badge: stats?.withdrawal?.pending && stats.withdrawal.pending > 0 ? stats.withdrawal.pending : undefined
    },
    {
      title: 'System Settings',
      description: 'Platform configuration',
      icon: Settings,
      href: '/admin/settings',
      color: 'gray'
    }
  ]

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 lg:py-8 max-w-7xl">
        <div className="mb-4 md:mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-blue-500" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs md:text-sm text-gray-500">System overview and management</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 md:px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 active:bg-blue-200 transition-colors disabled:opacity-50 text-sm touch-manipulation"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium hidden md:inline">
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>
          
          {lastUpdated && (
            <p className="text-xs text-gray-400 md:ml-[52px]">
              Last updated: {lastUpdated.toLocaleTimeString('id-ID')}
            </p>
          )}
        </div>

        {/* ✅ UPDATED: Hanya 2 tombol (Real & Demo), tidak ada Combined */}
        <div className="mb-4 md:mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setAccountFilter('real')}
            className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap touch-manipulation flex-shrink-0 ${
              accountFilter === 'real'
                ? 'bg-green-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100 border border-gray-200'
            }`}
          >
            Real Account
          </button>
          <button
            onClick={() => setAccountFilter('demo')}
            className={`px-3 md:px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap touch-manipulation flex-shrink-0 ${
              accountFilter === 'demo'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100 border border-gray-200'
            }`}
          >
            Demo Account
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 hover:shadow-lg active:shadow-xl transition-shadow touch-manipulation">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              </div>
              <span className="text-xs md:text-sm text-gray-500 font-medium">Total Users</span>
            </div>
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              {stats.users.total}
            </div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">
              {stats.users.active} active
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 hover:shadow-lg active:shadow-xl transition-shadow touch-manipulation">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
              </div>
              <span className="text-xs md:text-sm text-gray-500 font-medium">Total Orders</span>
            </div>
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              {filteredStats.trading.totalOrders}
            </div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">
              {filteredStats.trading.activeOrders} active
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 hover:shadow-lg active:shadow-xl transition-shadow touch-manipulation">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
              </div>
              <span className="text-xs md:text-sm text-gray-500 font-medium">Win Rate</span>
            </div>
            <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
              {filteredStats.trading.winRate}%
            </div>
            <div className="text-xs md:text-sm text-green-600 mt-1">
              {filteredStats.trading.wonOrders} wins
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 hover:shadow-lg active:shadow-xl transition-shadow touch-manipulation">
            <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
              </div>
              <span className="text-xs md:text-sm text-gray-500 font-medium">Net Flow</span>
            </div>
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 break-all">
              {new Intl.NumberFormat('id-ID', { 
                style: 'currency', 
                currency: 'IDR',
                minimumFractionDigits: 0,
                notation: 'compact'
              }).format(filteredStats.financial.netFlow)}
            </div>
            <div className="text-xs md:text-sm text-gray-500 mt-1">
              Deposits - Withdrawals
            </div>
          </div>
        </div>

        <div className="mb-4 md:mb-6">
          <h2 className="text-base md:text-lg lg:text-xl font-bold text-gray-900 mb-3 md:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon
              return (
                <Link
                  key={index}
                  href={action.href}
                  className="group bg-white rounded-xl p-4 md:p-5 border border-gray-100 hover:shadow-lg active:shadow-xl transition-all touch-manipulation"
                >
                  <div className="flex items-start gap-3 md:gap-4">
                    <div className={`w-10 h-10 md:w-12 md:h-12 bg-${action.color}-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                      <Icon className={`w-5 h-5 md:w-6 md:h-6 text-${action.color}-600`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm md:text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {action.title}
                        </h3>
                        {action.badge && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-gray-500">{action.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-xl p-4 md:p-5 lg:p-6 border border-gray-100 shadow-sm">
            <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Trading Statistics
              {/* ✅ UPDATED: Badge filter */}
              <span className={`text-xs px-2 py-1 rounded-full ${
                accountFilter === 'real' 
                  ? 'bg-green-100 text-green-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {accountFilter.toUpperCase()}
              </span>
            </h2>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-xs md:text-sm text-gray-600">Total Volume</span>
                <span className="text-sm md:text-base font-bold text-gray-900 break-all">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(filteredStats.trading.totalVolume)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-xs md:text-sm text-gray-600">Total Profit</span>
                <span className={`text-sm md:text-base font-bold break-all ${
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
                <span className="text-xs md:text-sm text-gray-600">Won Orders</span>
                <span className="text-sm md:text-base font-bold text-green-600">
                  {filteredStats.trading.wonOrders}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs md:text-sm text-gray-600">Lost Orders</span>
                <span className="text-sm md:text-base font-bold text-red-600">
                  {filteredStats.trading.lostOrders}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-5 lg:p-6 border border-gray-100 shadow-sm">
            <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Financial Overview
              {/* ✅ UPDATED: Badge filter */}
              <span className={`text-xs px-2 py-1 rounded-full ${
                accountFilter === 'real' 
                  ? 'bg-green-100 text-green-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {accountFilter.toUpperCase()}
              </span>
            </h2>
            <div className="space-y-3 md:space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-xs md:text-sm text-gray-600">Total Deposits</span>
                <span className="text-sm md:text-base font-bold text-green-600 break-all">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(filteredStats.financial.totalDeposits)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-xs md:text-sm text-gray-600">Total Withdrawals</span>
                <span className="text-sm md:text-base font-bold text-red-600 break-all">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(filteredStats.financial.totalWithdrawals)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-xs md:text-sm text-gray-600">Net Flow</span>
                <span className={`text-sm md:text-base font-bold break-all ${
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

        <div className="mt-4 md:mt-6 bg-white rounded-xl p-4 md:p-5 lg:p-6 border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-3 sm:gap-0">
            <h2 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-500" />
              System Health
            </h2>
            <Link 
              href="/admin/users"
              className="text-sm text-blue-600 hover:text-blue-700 active:text-blue-800 flex items-center gap-1 transition-colors font-medium"
            >
              View All Users
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="text-center p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                {Math.round((stats.users.active / stats.users.total) * 100)}%
              </div>
              <div className="text-xs text-gray-600">Active Users</div>
            </div>
            
            <div className="text-center p-3 md:p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                {filteredStats.trading.winRate}%
              </div>
              <div className="text-xs text-gray-600">Win Rate</div>
            </div>
            
            <div className="text-center p-3 md:p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">
                {filteredStats.trading.activeOrders}
              </div>
              <div className="text-xs text-gray-600">Active Orders</div>
            </div>
            
            <div className="text-center p-3 md:p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="text-2xl md:text-3xl font-bold text-yellow-600 mb-1">
                {stats.users.admins}
              </div>
              <div className="text-xs text-gray-600">Admins</div>
            </div>
          </div>
        </div>

        {stats?.withdrawal && (
          <div className="mt-4 md:mt-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 md:p-5 lg:p-6 border border-red-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
                <WithdrawIcon className="w-5 h-5 text-red-500" />
                Withdrawal Overview
              </h2>
              <Link 
                href="/admin/withdrawals"
                className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
              >
                Manage Requests
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                { 
                  label: 'Pending', 
                  value: stats.withdrawal?.pending ?? 0, 
                  color: 'yellow',
                  urgent: (stats.withdrawal?.pending ?? 0) > 0
                },
                { 
                  label: 'Approved', 
                  value: stats.withdrawal?.approved ?? 0, 
                  color: 'blue',
                  urgent: false
                },
                { 
                  label: 'Completed', 
                  value: stats.withdrawal?.completed ?? 0, 
                  color: 'green',
                  urgent: false
                },
                { 
                  label: 'Rejected', 
                  value: stats.withdrawal?.rejected ?? 0, 
                  color: 'red',
                  urgent: false
                },
              ].map((stat, idx) => (
                <div key={idx} className={`bg-white rounded-lg p-3 md:p-4 border-2 ${
                  stat.urgent ? 'border-yellow-300 animate-pulse' : 'border-gray-200'
                }`}>
                  <div className={`text-2xl md:text-3xl font-bold text-${stat.color}-600 mb-1`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-600">{stat.label}</div>
                  {stat.urgent && (
                    <div className="mt-1 text-[10px] text-yellow-600 font-semibold">
                      Needs Review!
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {(stats.withdrawal?.totalAmount ?? 0) > 0 && (
              <div className="mt-4 pt-4 border-t border-red-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Withdrawn:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {new Intl.NumberFormat('id-ID', { 
                      style: 'currency', 
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      notation: 'compact'
                    }).format(stats.withdrawal?.totalAmount ?? 0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ✅ REMOVED: Bagian Account Comparison yang hanya muncul saat combined */}
        
      </div>
    </div>
  )
}