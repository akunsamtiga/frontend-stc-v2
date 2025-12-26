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
  Shield
} from 'lucide-react'

interface SystemStats {
  users: {
    total: number
    active: number
    admins: number
  }
  trading: {
    totalOrders: number
    activeOrders: number
    wonOrders: number
    lostOrders: number
    winRate: number
    totalVolume: number
    totalProfit: number
  }
  financial: {
    totalDeposits: number
    totalWithdrawals: number
    netFlow: number
  }
}

export default function AdminDashboard() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

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

  const loadStats = async () => {
    try {
      const response = await api.getSystemStatistics()
      setStats(response?.data || response)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-gray-500">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

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

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header - Responsive */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">System overview and management</p>
            </div>
          </div>
        </div>

        {/* Stats Grid - Responsive */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
          {/* Total Users */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">Total Users</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{stats?.users.total || 0}</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">
              {stats?.users.active || 0} active
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">Total Orders</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{stats?.trading.totalOrders || 0}</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">
              {stats?.trading.activeOrders || 0} active
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">Win Rate</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">{stats?.trading.winRate || 0}%</div>
            <div className="text-xs sm:text-sm text-green-600 mt-1">
              {stats?.trading.wonOrders || 0} wins
            </div>
          </div>

          {/* Net Flow */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              </div>
              <span className="text-xs sm:text-sm text-gray-500 font-medium">Net Flow</span>
            </div>
            <div className="text-lg sm:text-2xl font-bold text-gray-900">
              {new Intl.NumberFormat('id-ID', { 
                style: 'currency', 
                currency: 'IDR',
                minimumFractionDigits: 0,
                notation: 'compact'
              }).format(stats?.financial.netFlow || 0)}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">
              Deposits - Withdrawals
            </div>
          </div>
        </div>

        {/* Quick Actions - Responsive */}
        <div className="mb-4 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 hover:shadow-lg transition-all"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${action.color}-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                    <action.icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${action.color}-600`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500">{action.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trading & Financial Overview - Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8">
          {/* Trading Stats */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
              Trading Statistics
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100">
                <span className="text-xs sm:text-sm text-gray-600">Total Volume</span>
                <span className="text-sm sm:text-base font-mono font-bold text-gray-900">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(stats?.trading.totalVolume || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100">
                <span className="text-xs sm:text-sm text-gray-600">Total Profit</span>
                <span className={`text-sm sm:text-base font-mono font-bold ${
                  (stats?.trading.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0 
                  }).format(stats?.trading.totalProfit || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100">
                <span className="text-xs sm:text-sm text-gray-600">Won Orders</span>
                <span className="text-sm sm:text-base font-mono font-bold text-green-600">
                  {stats?.trading.wonOrders || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 sm:py-3">
                <span className="text-xs sm:text-sm text-gray-600">Lost Orders</span>
                <span className="text-sm sm:text-base font-mono font-bold text-red-600">
                  {stats?.trading.lostOrders || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Stats */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
              Financial Overview
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100">
                <span className="text-xs sm:text-sm text-gray-600">Total Deposits</span>
                <span className="text-sm sm:text-base font-mono font-bold text-green-600">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(stats?.financial.totalDeposits || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100">
                <span className="text-xs sm:text-sm text-gray-600">Total Withdrawals</span>
                <span className="text-sm sm:text-base font-mono font-bold text-red-600">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(stats?.financial.totalWithdrawals || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 sm:py-3">
                <span className="text-xs sm:text-sm text-gray-600">Net Flow</span>
                <span className={`text-sm sm:text-base font-mono font-bold ${
                  (stats?.financial.netFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(stats?.financial.netFlow || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Health - Responsive */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-100 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
              System Health
            </h2>
            <Link 
              href="/admin/users"
              className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors font-medium"
            >
              View All Users
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-1">
                {((stats?.users.active || 0) / (stats?.users.total || 1) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600">Active Users</div>
            </div>
            
            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-1">
                {stats?.trading.winRate || 0}%
              </div>
              <div className="text-xs text-gray-600">Win Rate</div>
            </div>
            
            <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-2xl sm:text-3xl font-bold text-purple-600 mb-1">
                {stats?.trading.activeOrders || 0}
              </div>
              <div className="text-xs text-gray-600">Active Orders</div>
            </div>
            
            <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="text-2xl sm:text-3xl font-bold text-yellow-600 mb-1">
                {stats?.users.admins || 0}
              </div>
              <div className="text-xs text-gray-600">Admins</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}