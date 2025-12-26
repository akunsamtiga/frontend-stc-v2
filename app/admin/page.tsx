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
  ArrowUpRight,
  Settings,
  ChevronRight,
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
      color: 'emerald'
    }
  ]

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          </div>
          <p className="text-gray-400">System overview and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Users */}
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <span className="text-xs text-gray-500">Total Users</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.users.total || 0}</div>
            <div className="text-sm text-gray-400">
              {stats?.users.active || 0} active
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
              <span className="text-xs text-gray-500">Total Orders</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.trading.totalOrders || 0}</div>
            <div className="text-sm text-gray-400">
              {stats?.trading.activeOrders || 0} active
            </div>
          </div>

          {/* Win Rate */}
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="text-xs text-gray-500">Win Rate</span>
            </div>
            <div className="text-3xl font-bold mb-1">{stats?.trading.winRate || 0}%</div>
            <div className="text-sm text-emerald-400">
              {stats?.trading.wonOrders || 0} wins
            </div>
          </div>

          {/* Net Flow */}
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6 hover:border-yellow-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-400" />
              </div>
              <span className="text-xs text-gray-500">Net Flow</span>
            </div>
            <div className="text-3xl font-bold mb-1">
              {new Intl.NumberFormat('id-ID', { 
                style: 'currency', 
                currency: 'IDR',
                minimumFractionDigits: 0 
              }).format(stats?.financial.netFlow || 0)}
            </div>
            <div className="text-sm text-gray-400">
              Deposits - Withdrawals
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group bg-[#0f1419] border border-gray-800/50 hover:border-gray-700 rounded-2xl p-6 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 bg-${action.color}-500/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <action.icon className={`w-6 h-6 text-${action.color}-400`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold mb-1 group-hover:text-blue-400 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-400">{action.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Trading Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Trading Stats */}
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Trading Statistics
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-800/50">
                <span className="text-gray-400">Total Volume</span>
                <span className="font-mono font-bold">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0 
                  }).format(stats?.trading.totalVolume || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-800/50">
                <span className="text-gray-400">Total Profit</span>
                <span className={`font-mono font-bold ${
                  (stats?.trading.totalProfit || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0 
                  }).format(stats?.trading.totalProfit || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-800/50">
                <span className="text-gray-400">Won Orders</span>
                <span className="font-mono font-bold text-green-400">
                  {stats?.trading.wonOrders || 0}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-400">Lost Orders</span>
                <span className="font-mono font-bold text-red-400">
                  {stats?.trading.lostOrders || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Stats */}
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Financial Overview
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-800/50">
                <span className="text-gray-400">Total Deposits</span>
                <span className="font-mono font-bold text-green-400">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0 
                  }).format(stats?.financial.totalDeposits || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-800/50">
                <span className="text-gray-400">Total Withdrawals</span>
                <span className="font-mono font-bold text-red-400">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0 
                  }).format(stats?.financial.totalWithdrawals || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-gray-400">Net Flow</span>
                <span className={`font-mono font-bold ${
                  (stats?.financial.netFlow || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0 
                  }).format(stats?.financial.netFlow || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity - Placeholder */}
        <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              System Health
            </h2>
            <Link 
              href="/admin/users"
              className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
            >
              View All Users
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-[#1a1f2e] rounded-xl">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {((stats?.users.active || 0) / (stats?.users.total || 1) * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-400">Active Users</div>
            </div>
            
            <div className="text-center p-4 bg-[#1a1f2e] rounded-xl">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {stats?.trading.winRate || 0}%
              </div>
              <div className="text-xs text-gray-400">Win Rate</div>
            </div>
            
            <div className="text-center p-4 bg-[#1a1f2e] rounded-xl">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {stats?.trading.activeOrders || 0}
              </div>
              <div className="text-xs text-gray-400">Active Orders</div>
            </div>
            
            <div className="text-center p-4 bg-[#1a1f2e] rounded-xl">
              <div className="text-2xl font-bold text-yellow-400 mb-1">
                {stats?.users.admins || 0}
              </div>
              <div className="text-xs text-gray-400">Admins</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}