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

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flat-section-header">
          <div>
            <h1 className="flat-section-title flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              Admin Dashboard
            </h1>
            <p className="flat-section-description">System overview and management</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="flat-stat-card hover:shadow-flat-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <span className="flat-stat-label">Total Users</span>
            </div>
            <div className="flat-stat-value">{stats?.users.total || 0}</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats?.users.active || 0} active
            </div>
          </div>

          {/* Total Orders */}
          <div className="flat-stat-card hover:shadow-flat-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-600" />
              </div>
              <span className="flat-stat-label">Total Orders</span>
            </div>
            <div className="flat-stat-value">{stats?.trading.totalOrders || 0}</div>
            <div className="text-sm text-gray-500 mt-1">
              {stats?.trading.activeOrders || 0} active
            </div>
          </div>

          {/* Win Rate */}
          <div className="flat-stat-card hover:shadow-flat-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <span className="flat-stat-label">Win Rate</span>
            </div>
            <div className="flat-stat-value">{stats?.trading.winRate || 0}%</div>
            <div className="text-sm text-green-600 mt-1">
              {stats?.trading.wonOrders || 0} wins
            </div>
          </div>

          {/* Net Flow */}
          <div className="flat-stat-card hover:shadow-flat-lg transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="flat-stat-label">Net Flow</span>
            </div>
            <div className="flat-stat-value text-2xl">
              {new Intl.NumberFormat('id-ID', { 
                style: 'currency', 
                currency: 'IDR',
                minimumFractionDigits: 0,
                notation: 'compact'
              }).format(stats?.financial.netFlow || 0)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Deposits - Withdrawals
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group flat-card hover:shadow-flat-lg transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-${action.color}-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-6 h-6 text-${action.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-500">{action.description}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trading & Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trading Stats */}
          <div className="flat-card">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Trading Statistics
            </h2>
            <div className="space-y-0">
              <div className="flat-list-item">
                <span className="text-gray-600">Total Volume</span>
                <span className="font-mono font-bold text-gray-900">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(stats?.trading.totalVolume || 0)}
                </span>
              </div>
              <div className="flat-list-item">
                <span className="text-gray-600">Total Profit</span>
                <span className={`font-mono font-bold ${
                  (stats?.trading.totalProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0 
                  }).format(stats?.trading.totalProfit || 0)}
                </span>
              </div>
              <div className="flat-list-item">
                <span className="text-gray-600">Won Orders</span>
                <span className="font-mono font-bold text-green-600">
                  {stats?.trading.wonOrders || 0}
                </span>
              </div>
              <div className="flat-list-item">
                <span className="text-gray-600">Lost Orders</span>
                <span className="font-mono font-bold text-red-600">
                  {stats?.trading.lostOrders || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Stats */}
          <div className="flat-card">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              Financial Overview
            </h2>
            <div className="space-y-0">
              <div className="flat-list-item">
                <span className="text-gray-600">Total Deposits</span>
                <span className="font-mono font-bold text-green-600">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(stats?.financial.totalDeposits || 0)}
                </span>
              </div>
              <div className="flat-list-item">
                <span className="text-gray-600">Total Withdrawals</span>
                <span className="font-mono font-bold text-red-600">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact'
                  }).format(stats?.financial.totalWithdrawals || 0)}
                </span>
              </div>
              <div className="flat-list-item">
                <span className="text-gray-600">Net Flow</span>
                <span className={`font-mono font-bold ${
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

        {/* System Health */}
        <div className="flat-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              System Health
            </h2>
            <Link 
              href="/admin/users"
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors font-medium"
            >
              View All Users
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {((stats?.users.active || 0) / (stats?.users.total || 1) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600">Active Users</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {stats?.trading.winRate || 0}%
              </div>
              <div className="text-xs text-gray-600">Win Rate</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {stats?.trading.activeOrders || 0}
              </div>
              <div className="text-xs text-gray-600">Active Orders</div>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <div className="text-3xl font-bold text-yellow-600 mb-1">
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