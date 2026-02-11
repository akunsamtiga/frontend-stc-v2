'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { SystemStatistics } from '@/types'
import { TimezoneUtil } from '@/lib/utils'
import { 
  Users, TrendUp, CurrencyDollar, Activity, 
  ArrowUpRight, Package, Calendar, Tag, Shield,
  ArrowLineUp,
  ArrowsClockwise, CaretRight, Target, Info
} from 'phosphor-react'

type AccountFilter = 'real' | 'demo'

const StatCardSkeleton = () => (
  <div className="bg-white/5 rounded-lg p-4 border border-white/10 animate-pulse backdrop-blur-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 bg-white/10 rounded"></div>
      <div className="h-4 bg-white/10 rounded w-20"></div>
    </div>
    <div className="h-6 bg-white/10 rounded w-24"></div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
    {/* Pattern Overlay */}
    <div 
      className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:24px_24px] bg-center pointer-events-none"
    ></div>
    
    <Navbar />
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 animate-pulse">
        <div className="h-7 bg-white/10 rounded w-48 mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-64"></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
        {/* Pattern Overlay */}
        <div 
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:24px_24px] bg-center pointer-events-none"
        ></div>
        
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-500/20 mb-3">
              <Activity className="w-7 h-7 text-red-400" weight="duotone" />
            </div>
            <p className="text-slate-300 mb-4">Gagal memuat statistik</p>
            <button 
              onClick={() => loadStats()}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
            >
              Coba Lagi
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
    } else {
      return {
        trading: stats.demoAccount.trading,
        financial: stats.demoAccount.financial
      }
    }
  }

  const filteredStats = getFilteredStats()

  const quickActions = [
    {
      title: 'Users',
      description: 'Kelola pengguna',
      icon: Users,
      href: '/admin/users',
      color: 'indigo'
    },
    {
      title: 'Assets',
      description: 'Atur aset trading',
      icon: Package,
      href: '/admin/assets',
      color: 'purple'
    },
    {
      title: 'Schedule',
      description: 'Jadwal trend aset',
      icon: Calendar,
      href: '/admin/asset-schedule',
      color: 'blue'
    },
    {
      title: 'Voucher',
      description: 'Kelola voucher',
      icon: Tag,
      href: '/admin/vouchers',
      color: 'green'
    },
    {
      title: 'Verifikasi',
      description: 'Review KTP & Selfie',
      icon: Shield,
      href: '/admin/verifications',
      color: 'cyan',
      badge: (stats as any)?.verifications?.pending
    },
    {
      title: 'Penarikan',
      description: 'Request withdraw',
      icon: ArrowLineUp,
      href: '/admin/withdrawals',
      color: 'orange'
    },
    {
      title: 'Information',
      description: 'Kelola informasi',
      icon: Info,
      href: '/admin/information',
      color: 'pink'
    },
  ]

  const colorClasses: Record<string, { bg: string, icon: string, hover: string }> = {
    indigo: { bg: 'bg-indigo-500/10', icon: 'text-indigo-400', hover: 'hover:bg-indigo-500/20' },
    purple: { bg: 'bg-purple-500/10', icon: 'text-purple-400', hover: 'hover:bg-purple-500/20' },
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', hover: 'hover:bg-blue-500/20' },
    green: { bg: 'bg-green-500/10', icon: 'text-green-400', hover: 'hover:bg-green-500/20' },
    cyan: { bg: 'bg-cyan-500/10', icon: 'text-cyan-400', hover: 'hover:bg-cyan-500/20' },
    orange: { bg: 'bg-orange-500/10', icon: 'text-orange-400', hover: 'hover:bg-orange-500/20' },
    pink: { bg: 'bg-pink-500/10', icon: 'text-pink-400', hover: 'hover:bg-pink-500/20' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
      {/* Pattern Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:24px_24px] bg-center pointer-events-none"
      ></div>
      
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-6 relative z-10">
        {/* Header with Account Filter */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>
              <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setAccountFilter('real')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    accountFilter === 'real'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Real
                </button>
                <button
                  onClick={() => setAccountFilter('demo')}
                  className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                    accountFilter === 'demo'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Demo
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Statistik sistem dan aktivitas pengguna
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-sm disabled:opacity-50"
          >
            <ArrowsClockwise 
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} 
              weight="bold"
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-xs text-slate-500 mb-4">
            Terakhir diperbarui: {TimezoneUtil.formatDateTime(lastUpdated)}
          </div>
        )}

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {/* Total Users */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-indigo-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-400" weight="duotone" />
              </div>
              <span className="text-xs text-slate-400">Total Users</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.users.total}</div>
            <div className="text-xs text-slate-500 mt-1">
              {stats.users.active} aktif
            </div>
          </div>

          {/* Total Orders */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-purple-500/10 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-400" weight="duotone" />
              </div>
              <span className="text-xs text-slate-400">Total Orders</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {filteredStats.trading.totalOrders}
            </div>
            <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" weight="bold" />
              {filteredStats.trading.winRate}% Win Rate
            </div>
          </div>

          {/* Total Volume */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-blue-500/10 flex items-center justify-center">
                <TrendUp className="w-5 h-5 text-blue-400" weight="duotone" />
              </div>
              <span className="text-xs text-slate-400">Total Volume</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {new Intl.NumberFormat('id-ID', { 
                style: 'currency', 
                currency: 'IDR',
                minimumFractionDigits: 0,
                notation: 'compact',
                maximumFractionDigits: 1
              }).format(filteredStats.trading.totalVolume)}
            </div>
          </div>

          {/* Net Flow */}
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center">
                <CurrencyDollar className="w-5 h-5 text-green-400" weight="duotone" />
              </div>
              <span className="text-xs text-slate-400">Net Flow</span>
            </div>
            <div className={`text-2xl font-bold ${
              filteredStats.financial.netFlow >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {new Intl.NumberFormat('id-ID', { 
                style: 'currency', 
                currency: 'IDR',
                minimumFractionDigits: 0,
                notation: 'compact',
                maximumFractionDigits: 1
              }).format(filteredStats.financial.netFlow)}
            </div>
          </div>
        </div>

        {/* Financial Summary - Compact Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
            <div className="text-xs text-slate-400 mb-1">Total Deposit</div>
            <div className="text-lg font-bold text-green-400">
              {new Intl.NumberFormat('id-ID', { 
                style: 'currency', 
                currency: 'IDR',
                minimumFractionDigits: 0,
                notation: 'compact',
                maximumFractionDigits: 1
              }).format(filteredStats.financial.totalDeposits)}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
            <div className="text-xs text-slate-400 mb-1">Total Withdrawal</div>
            <div className="text-lg font-bold text-red-400">
              {new Intl.NumberFormat('id-ID', { 
                style: 'currency', 
                currency: 'IDR',
                minimumFractionDigits: 0,
                notation: 'compact',
                maximumFractionDigits: 1
              }).format(filteredStats.financial.totalWithdrawals)}
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm">
            <div className="text-xs text-slate-400 mb-1">Total Profit</div>
            <div className="text-lg font-bold text-indigo-400">
              {new Intl.NumberFormat('id-ID', { 
                style: 'currency', 
                currency: 'IDR',
                minimumFractionDigits: 0,
                notation: 'compact',
                maximumFractionDigits: 1
              }).format(filteredStats.trading.totalProfit)}
            </div>
          </div>
        </div>

        {/* Quick Actions - Compact Grid */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Menu Cepat</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {quickActions.map((action, idx) => {
              const colors = colorClasses[action.color]
              const Icon = action.icon
              return (
                <Link
                  key={idx}
                  href={action.href}
                  className={`group bg-white/5 rounded-lg p-3 border border-white/10 backdrop-blur-sm ${colors.hover} transition-all relative`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded ${colors.bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} weight="duotone" />
                      {action.badge && action.badge > 0 && (
                        <div className="absolute top-1 left-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                          {action.badge}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-xs text-slate-400">{action.description}</p>
                    </div>
                    <CaretRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" weight="bold" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* System Health - Compact */}
        <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">System Health</h2>
            <Link 
              href="/admin/users"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Lihat Semua
              <CaretRight className="w-3 h-3" weight="bold" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-white/5 rounded border border-white/10">
              <div className="text-2xl font-bold text-indigo-400 mb-1">
                {Math.round((stats.users.active / stats.users.total) * 100)}%
              </div>
              <div className="text-xs text-slate-400">Active Rate</div>
            </div>
            
            <div className="text-center p-3 bg-white/5 rounded border border-white/10">
              <div className="text-2xl font-bold text-green-400 mb-1">
                {filteredStats.trading.winRate}%
              </div>
              <div className="text-xs text-slate-400">Win Rate</div>
            </div>
            
            <div className="text-center p-3 bg-white/5 rounded border border-white/10">
              <div className="text-2xl font-bold text-purple-400 mb-1">
                {filteredStats.trading.activeOrders}
              </div>
              <div className="text-xs text-slate-400">Active Orders</div>
            </div>
            
            <div className="text-center p-3 bg-white/5 rounded border border-white/10">
              <div className="text-2xl font-bold text-orange-400 mb-1">
                {stats.users.admins}
              </div>
              <div className="text-xs text-slate-400">Admins</div>
            </div>
          </div>
        </div>

        {/* Withdrawal Overview - Compact */}
        {stats?.withdrawal && (
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Request Penarikan</h2>
              <Link 
                href="/admin/withdrawals"
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                Kelola
                <CaretRight className="w-3 h-3" weight="bold" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
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
                  label: 'Selesai', 
                  value: stats.withdrawal?.completed ?? 0, 
                  color: 'green',
                  urgent: false
                },
                { 
                  label: 'Ditolak', 
                  value: stats.withdrawal?.rejected ?? 0, 
                  color: 'red',
                  urgent: false
                },
              ].map((stat, idx) => (
                <div 
                  key={idx} 
                  className={`p-3 rounded border ${
                    stat.color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/20' :
                    stat.color === 'blue' ? 'bg-blue-500/10 border-blue-500/20' :
                    stat.color === 'green' ? 'bg-green-500/10 border-green-500/20' :
                    'bg-red-500/10 border-red-500/20'
                  } ${stat.urgent ? 'animate-pulse' : ''}`}
                >
                  <div className={`text-2xl font-bold mb-1 ${
                    stat.color === 'yellow' ? 'text-yellow-400' :
                    stat.color === 'blue' ? 'text-blue-400' :
                    stat.color === 'green' ? 'text-green-400' :
                    'text-red-400'
                  }`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
            
            {(stats.withdrawal?.totalAmount ?? 0) > 0 && (
              <div className="p-3 bg-white/5 rounded border border-white/10 flex justify-between items-center">
                <span className="text-xs text-slate-400">Total Ditarik</span>
                <span className="text-base font-bold text-red-400">
                  {new Intl.NumberFormat('id-ID', { 
                    style: 'currency', 
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(stats.withdrawal?.totalAmount ?? 0)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}