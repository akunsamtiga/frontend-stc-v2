// app/admin/asset-schedule/page.tsx
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { 
  Plus, RefreshCw, Edit2, Trash2, Ban, TrendingUp, TrendingDown, 
  MoreVertical, Eye, X, Calendar, Clock, User, CheckCircle2, 
  XCircle, Filter, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { 
  useAssetScheduleStore, 
  useScheduleActions, 
  useSchedules, 
  useScheduleStats, 
  useSchedulePagination, 
  useScheduleFilters, 
  useScheduleLoading 
} from '@/store/asset-schedule.store'
import type { 
  AssetSchedule, 
  CreateScheduleDto, 
  UpdateScheduleDto, 
  ScheduleTrend, 
  ScheduleStatus, 
  ScheduleTimeframe,
  ScheduleStats,
  SchedulePagination as PaginationType,
  ScheduleFilters as FiltersType
} from '@/types/asset-schedule.types'

// ============================================
// SCHEDULE STATS COMPONENT
// ============================================
interface ScheduleStatsCardProps {
  stats: ScheduleStats | null
  isLoading?: boolean
}

function ScheduleStatsCard({ stats, isLoading }: ScheduleStatsCardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-[#1a1f2e] rounded-xl p-6 border border-slate-700/50 animate-pulse">
            <div className="h-10 w-10 bg-slate-700 rounded-lg mb-4" />
            <div className="h-8 bg-slate-700 rounded mb-2" />
            <div className="h-4 bg-slate-700 rounded w-20" />
          </div>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const statItems = [
    {
      label: 'Total Schedules',
      value: stats.total,
      icon: Calendar,
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      iconColor: 'text-blue-400',
    },
    {
      label: "Today's Total",
      value: stats.todayTotal,
      icon: Clock,
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      iconColor: 'text-purple-400',
    },
    {
      label: 'Pending',
      value: stats.pending,
      icon: Clock,
      color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      iconColor: 'text-yellow-400',
    },
    {
      label: 'Executed',
      value: stats.executed,
      icon: CheckCircle2,
      color: 'bg-green-500/10 text-green-400 border-green-500/20',
      iconColor: 'text-green-400',
    },
    {
      label: 'Failed',
      value: stats.failed,
      icon: XCircle,
      color: 'bg-red-500/10 text-red-400 border-red-500/20',
      iconColor: 'text-red-400',
    },
    {
      label: 'Cancelled',
      value: stats.cancelled,
      icon: Ban,
      color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      iconColor: 'text-slate-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statItems.map((item, index) => {
        const Icon = item.icon
        return (
          <div
            key={index}
            className={`bg-[#1a1f2e] rounded-xl p-6 border ${item.color} transition-all hover:scale-105`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${item.color}`}>
                <Icon className={`w-5 h-5 ${item.iconColor}`} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {item.value.toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">{item.label}</div>
          </div>
        )
      })}
    </div>
  )
}

// ============================================
// SCHEDULE FILTERS COMPONENT
// ============================================
interface ScheduleFiltersProps {
  filters: FiltersType
  onFilterChange: (filters: Partial<FiltersType>) => void
  onResetFilters: () => void
  assets: string[]
}

const TIMEFRAMES: ScheduleTimeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d']

function ScheduleFilters({
  filters,
  onFilterChange,
  onResetFilters,
  assets,
}: ScheduleFiltersProps) {
  const hasActiveFilters = 
    filters.assetSymbol || 
    filters.trend || 
    filters.timeframe || 
    filters.status || 
    filters.isActive !== undefined ||
    filters.fromDate ||
    filters.toDate

  return (
    <div className="bg-[#1a1f2e] rounded-xl p-6 border border-slate-700/50 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-white">Filters</h3>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Asset Symbol */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Asset Symbol
          </label>
          <select
            value={filters.assetSymbol || ''}
            onChange={(e) => onFilterChange({ assetSymbol: e.target.value || undefined })}
            className="w-full bg-[#0f1419] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
          >
            <option value="">All Assets</option>
            {assets.map((asset) => (
              <option key={asset} value={asset}>
                {asset}
              </option>
            ))}
          </select>
        </div>

        {/* Trend */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Trend
          </label>
          <select
            value={filters.trend || ''}
            onChange={(e) => onFilterChange({ trend: e.target.value as ScheduleTrend || undefined })}
            className="w-full bg-[#0f1419] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
          >
            <option value="">All Trends</option>
            <option value="buy">Buy (Naik)</option>
            <option value="sell">Sell (Turun)</option>
          </select>
        </div>

        {/* Timeframe */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Timeframe
          </label>
          <select
            value={filters.timeframe || ''}
            onChange={(e) => onFilterChange({ timeframe: e.target.value as ScheduleTimeframe || undefined })}
            className="w-full bg-[#0f1419] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
          >
            <option value="">All Timeframes</option>
            {TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf}>
                {tf}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value as ScheduleStatus || undefined })}
            className="w-full bg-[#0f1419] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="executed">Executed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Active Status */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Active Status
          </label>
          <select
            value={filters.isActive === undefined ? '' : filters.isActive.toString()}
            onChange={(e) => {
              const value = e.target.value
              onFilterChange({ 
                isActive: value === '' ? undefined : value === 'true' 
              })
            }}
            className="w-full bg-[#0f1419] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
          >
            <option value="">All</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>

        {/* From Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            From Date
          </label>
          <input
            type="date"
            value={filters.fromDate ? filters.fromDate.split('T')[0] : ''}
            onChange={(e) => {
              const value = e.target.value
              onFilterChange({ 
                fromDate: value ? new Date(value).toISOString() : undefined 
              })
            }}
            className="w-full bg-[#0f1419] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />
        </div>

        {/* To Date */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            To Date
          </label>
          <input
            type="date"
            value={filters.toDate ? filters.toDate.split('T')[0] : ''}
            onChange={(e) => {
              const value = e.target.value
              onFilterChange({ 
                toDate: value ? new Date(value).toISOString() : undefined 
              })
            }}
            className="w-full bg-[#0f1419] border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors text-sm"
          />
        </div>
      </div>
    </div>
  )
}

// ============================================
// SCHEDULE TABLE COMPONENT
// ============================================
interface ScheduleTableProps {
  schedules: AssetSchedule[]
  isLoading?: boolean
  onEdit: (schedule: AssetSchedule) => void
  onDelete: (id: string) => void
  onCancel: (id: string) => void
  onView: (schedule: AssetSchedule) => void
}

function ScheduleTable({
  schedules,
  isLoading,
  onEdit,
  onDelete,
  onCancel,
  onView,
}: ScheduleTableProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const getStatusBadge = (status: AssetSchedule['status']) => {
    const styles = {
      pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      executed: 'bg-green-500/10 text-green-400 border-green-500/20',
      failed: 'bg-red-500/10 text-red-400 border-red-500/20',
      cancelled: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status.toUpperCase()}
      </span>
    )
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta'
    }).format(date)
  }

  const formatTimeRemaining = (scheduledTime: string) => {
    const now = new Date()
    const scheduled = new Date(scheduledTime)
    const diff = scheduled.getTime() - now.getTime()
    
    if (diff < 0) return 'Expired'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d ${hours % 24}h`
    }
    
    return `${hours}h ${minutes}m`
  }

  if (isLoading) {
    return (
      <div className="bg-[#1a1f2e] rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="animate-pulse p-8 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-700/30 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (schedules.length === 0) {
    return (
      <div className="bg-[#1a1f2e] rounded-xl border border-slate-700/50 p-12 text-center">
        <p className="text-slate-400">No schedules found</p>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1f2e] rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50 border-b border-slate-700/50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Scheduled Time
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Time Remaining
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Trend
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Timeframe
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {schedules.map((schedule) => (
              <tr 
                key={schedule.id} 
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-mono text-sm font-semibold text-white">
                    {schedule.assetSymbol}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-300">
                    {formatDateTime(schedule.scheduledTime)}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-medium ${
                    schedule.status === 'pending' 
                      ? formatTimeRemaining(schedule.scheduledTime) === 'Expired'
                        ? 'text-red-400'
                        : 'text-blue-400'
                      : 'text-slate-500'
                  }`}>
                    {schedule.status === 'pending' 
                      ? formatTimeRemaining(schedule.scheduledTime)
                      : '-'
                    }
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {schedule.trend === 'buy' ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={`text-sm font-medium ${
                      schedule.trend === 'buy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {schedule.trend === 'buy' ? 'Buy' : 'Sell'}
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-mono text-slate-300">
                    {schedule.timeframe}
                  </span>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(schedule.status)}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`w-2 h-2 rounded-full inline-block ${
                    schedule.isActive ? 'bg-green-500' : 'bg-slate-600'
                  }`} />
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="relative inline-block">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === schedule.id ? null : schedule.id)}
                      className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                    
                    {openMenuId === schedule.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-[#0f1419] border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                          <button
                            onClick={() => {
                              onView(schedule)
                              setOpenMenuId(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                          
                          {schedule.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  onEdit(schedule)
                                  setOpenMenuId(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-slate-300 hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit
                              </button>
                              
                              <button
                                onClick={() => {
                                  onCancel(schedule.id)
                                  setOpenMenuId(null)
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-yellow-400 hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                              >
                                <Ban className="w-4 h-4" />
                                Cancel
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => {
                              onDelete(schedule.id)
                              setOpenMenuId(null)
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-slate-700/50 transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================
// SCHEDULE PAGINATION COMPONENT
// ============================================
interface SchedulePaginationProps {
  pagination: PaginationType | null
  onPageChange: (page: number) => void
}

function SchedulePagination({ pagination, onPageChange }: SchedulePaginationProps) {
  if (!pagination || pagination.totalPages <= 1) return null

  const { page, totalPages, total } = pagination

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7
    
    if (totalPages <= maxVisible) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    
    if (page <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages)
    } else if (page >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', page - 1, page, page + 1, '...', totalPages)
    }
    
    return pages
  }

  return (
    <div className="flex items-center justify-between bg-[#1a1f2e] rounded-xl border border-slate-700/50 px-6 py-4">
      <div className="text-sm text-slate-400">
        Showing <span className="font-medium text-white">{((page - 1) * 50) + 1}</span> to{' '}
        <span className="font-medium text-white">
          {Math.min(page * 50, total)}
        </span> of{' '}
        <span className="font-medium text-white">{total}</span> schedules
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-2 rounded-lg border border-slate-700 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-slate-400" />
        </button>

        <div className="flex items-center gap-1">
          {getPageNumbers().map((pageNum, index) => (
            typeof pageNum === 'number' ? (
              <button
                key={index}
                onClick={() => onPageChange(pageNum)}
                className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-colors ${
                  pageNum === page
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:bg-slate-700/50'
                }`}
              >
                {pageNum}
              </button>
            ) : (
              <span key={index} className="px-2 text-slate-600">
                {pageNum}
              </span>
            )
          ))}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-2 rounded-lg border border-slate-700 hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-slate-400" />
        </button>
      </div>
    </div>
  )
}

// ============================================
// SCHEDULE DETAIL MODAL COMPONENT
// ============================================
interface ScheduleDetailModalProps {
  isOpen: boolean
  onClose: () => void
  schedule: AssetSchedule | null
}

function ScheduleDetailModal({
  isOpen,
  onClose,
  schedule,
}: ScheduleDetailModalProps) {
  if (!isOpen || !schedule) return null

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: 'Asia/Jakarta'
    }).format(date)
  }

  const getStatusColor = (status: AssetSchedule['status']) => {
    const colors = {
      pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
      executed: 'text-green-400 bg-green-500/10 border-green-500/20',
      failed: 'text-red-400 bg-red-500/10 border-red-500/20',
      cancelled: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    }
    return colors[status]
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1f2e] border-b border-slate-700/50 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Schedule Details</h2>
            <p className="text-sm text-slate-400 mt-1">ID: {schedule.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getStatusColor(schedule.status)}`}>
              {schedule.status.toUpperCase()}
            </span>
            {schedule.isActive ? (
              <span className="px-4 py-2 rounded-lg text-sm font-semibold border text-green-400 bg-green-500/10 border-green-500/20">
                ACTIVE
              </span>
            ) : (
              <span className="px-4 py-2 rounded-lg text-sm font-semibold border text-slate-400 bg-slate-500/10 border-slate-500/20">
                INACTIVE
              </span>
            )}
          </div>

          {/* Asset Info */}
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Schedule Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-400 mb-1">Asset Symbol</p>
                <p className="text-lg font-mono font-bold text-white">{schedule.assetSymbol}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-400 mb-1">Timeframe</p>
                <p className="text-lg font-mono font-semibold text-blue-400">{schedule.timeframe}</p>
              </div>
              
              <div className="col-span-2">
                <p className="text-sm text-slate-400 mb-2">Trend Direction</p>
                <div className="flex items-center gap-3">
                  {schedule.trend === 'buy' ? (
                    <>
                      <TrendingUp className="w-6 h-6 text-green-400" />
                      <span className="text-lg font-semibold text-green-400">BUY (Naik)</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-6 h-6 text-red-400" />
                      <span className="text-lg font-semibold text-red-400">SELL (Turun)</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Time Info */}
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              Timing
            </h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-400 mb-1">Scheduled Time</p>
                <p className="text-base text-white">{formatDateTime(schedule.scheduledTime)}</p>
              </div>
              
              <div>
                <p className="text-sm text-slate-400 mb-1">Created At</p>
                <p className="text-base text-white">{formatDateTime(schedule.createdAt)}</p>
              </div>
              
              {schedule.executedAt && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Executed At</p>
                  <p className="text-base text-white">{formatDateTime(schedule.executedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Creator Info */}
          <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-yellow-400" />
              Created By
            </h3>
            
            <div className="space-y-2">
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-base text-white">{schedule.createdByEmail}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">User ID</p>
                <p className="text-base font-mono text-slate-300">{schedule.createdBy}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {schedule.notes && (
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
              <h3 className="text-lg font-semibold text-white mb-3">Notes</h3>
              <p className="text-slate-300 leading-relaxed">{schedule.notes}</p>
            </div>
          )}

          {/* Execution Details */}
          {schedule.executionDetails && (
            <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/30">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                {schedule.executionDetails.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                Execution Details
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                {schedule.executionDetails.startPrice && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">Start Price</p>
                    <p className="text-lg font-mono font-semibold text-white">
                      ${schedule.executionDetails.startPrice.toFixed(2)}
                    </p>
                  </div>
                )}
                
                {schedule.executionDetails.endPrice && (
                  <div>
                    <p className="text-sm text-slate-400 mb-1">End Price</p>
                    <p className="text-lg font-mono font-semibold text-white">
                      ${schedule.executionDetails.endPrice.toFixed(2)}
                    </p>
                  </div>
                )}
                
                {schedule.executionDetails.priceChange !== undefined && (
                  <div className="col-span-2">
                    <p className="text-sm text-slate-400 mb-1">Price Change</p>
                    <p className={`text-lg font-mono font-semibold ${
                      schedule.executionDetails.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {schedule.executionDetails.priceChange >= 0 ? '+' : ''}
                      {schedule.executionDetails.priceChange.toFixed(2)}%
                    </p>
                  </div>
                )}
                
                {schedule.executionDetails.errorMessage && (
                  <div className="col-span-2">
                    <p className="text-sm text-slate-400 mb-1">Error Message</p>
                    <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                      {schedule.executionDetails.errorMessage}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#1a1f2e] border-t border-slate-700/50 p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// ASSET SCHEDULE MODAL COMPONENT
// ============================================
interface AssetScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateScheduleDto | UpdateScheduleDto) => Promise<void>
  schedule?: AssetSchedule | null
  assets: string[]
  isLoading?: boolean
}

function AssetScheduleModal({
  isOpen,
  onClose,
  onSubmit,
  schedule,
  assets,
  isLoading = false,
}: AssetScheduleModalProps) {
  const [formData, setFormData] = useState<CreateScheduleDto>({
    assetSymbol: '',
    scheduledTime: '',
    trend: 'buy',
    timeframe: '1m',
    notes: '',
    isActive: true,
  })

  useEffect(() => {
    if (schedule) {
      setFormData({
        assetSymbol: schedule.assetSymbol,
        scheduledTime: schedule.scheduledTime.slice(0, 16),
        trend: schedule.trend,
        timeframe: schedule.timeframe,
        notes: schedule.notes || '',
        isActive: schedule.isActive,
      })
    } else {
      const now = new Date()
      now.setMinutes(now.getMinutes() + 5)
      const defaultTime = now.toISOString().slice(0, 16)
      
      setFormData({
        assetSymbol: assets[0] || '',
        scheduledTime: defaultTime,
        trend: 'buy',
        timeframe: '1m',
        notes: '',
        isActive: true,
      })
    }
  }, [schedule, assets, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      scheduledTime: new Date(formData.scheduledTime).toISOString(),
    }
    
    await onSubmit(submitData)
  }

  const handleChange = (field: keyof CreateScheduleDto, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1f2e] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700/50 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-[#1a1f2e] border-b border-slate-700/50 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {schedule ? 'Edit Schedule' : 'Create New Schedule'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Asset Symbol */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Asset Symbol
            </label>
            <select
              value={formData.assetSymbol}
              onChange={(e) => handleChange('assetSymbol', e.target.value)}
              className="w-full bg-[#0f1419] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
              disabled={isLoading}
            >
              <option value="">Select Asset</option>
              {assets.map((asset) => (
                <option key={asset} value={asset}>
                  {asset}
                </option>
              ))}
            </select>
          </div>

          {/* Scheduled Time */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Scheduled Time
            </label>
            <input
              type="datetime-local"
              value={formData.scheduledTime}
              onChange={(e) => handleChange('scheduledTime', e.target.value)}
              className="w-full bg-[#0f1419] border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              required
              disabled={isLoading}
            />
            <p className="mt-1 text-xs text-slate-500">
              Schedule will execute at this time (WIB timezone)
            </p>
          </div>

          {/* Trend Direction */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Trend Direction
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleChange('trend', 'buy')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.trend === 'buy'
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
                disabled={isLoading}
              >
                <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
                <span className="block text-sm font-medium text-white">Buy (Naik)</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleChange('trend', 'sell')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.trend === 'sell'
                    ? 'border-red-500 bg-red-500/10'
                    : 'border-slate-700 hover:border-slate-600'
                }`}
                disabled={isLoading}
              >
                <TrendingDown className="w-6 h-6 mx-auto mb-2 text-red-500" />
                <span className="block text-sm font-medium text-white">Sell (Turun)</span>
              </button>
            </div>
          </div>

          {/* Timeframe */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeframe
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => handleChange('timeframe', tf)}
                  className={`py-2 px-3 rounded-lg border transition-all text-sm font-medium ${
                    formData.timeframe === tf
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                  disabled={isLoading}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add notes about this schedule..."
              rows={3}
              className="w-full bg-[#0f1419] border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
            <div>
              <p className="text-sm font-medium text-white">Active Status</p>
              <p className="text-xs text-slate-400 mt-1">
                {formData.isActive ? 'Schedule is active and will execute' : 'Schedule is inactive'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleChange('isActive', !formData.isActive)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                formData.isActive ? 'bg-green-500' : 'bg-slate-600'
              }`}
              disabled={isLoading}
            >
              <span
                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  formData.isActive ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : schedule ? 'Update Schedule' : 'Create Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// UPCOMING SCHEDULES WIDGET COMPONENT
// ============================================
function UpcomingSchedulesWidget() {
  const { token } = useAuthStore()
  const { upcomingSchedules, fetchUpcomingSchedules } = useAssetScheduleStore()
  
  // ✅ FIX: Use ref to prevent infinite loop in UpcomingSchedulesWidget
  const isFetchingRef = useRef(false)

  useEffect(() => {
    if (token && !isFetchingRef.current) {
      isFetchingRef.current = true
      fetchUpcomingSchedules(token).finally(() => {
        isFetchingRef.current = false
      })
      
      // Refresh every 5 minutes
      const interval = setInterval(() => {
        if (!isFetchingRef.current) {
          isFetchingRef.current = true
          fetchUpcomingSchedules(token).finally(() => {
            isFetchingRef.current = false
          })
        }
      }, 5 * 60 * 1000)
      
      return () => clearInterval(interval)
    }
  }, [token, fetchUpcomingSchedules])

  const formatTimeUntil = (scheduledTime: string) => {
    const now = new Date()
    const scheduled = new Date(scheduledTime)
    const diff = scheduled.getTime() - now.getTime()
    
    if (diff < 0) return 'Now'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    
    return `${minutes}m`
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    }).format(date)
  }

  if (upcomingSchedules.length === 0) {
    return (
      <div className="bg-[#1a1f2e] rounded-xl border border-slate-700/50 p-8">
        <div className="flex items-center gap-3 mb-6">
          <Clock className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Upcoming Schedules</h3>
          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full">
            Next 24h
          </span>
        </div>
        
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No upcoming schedules in the next 24 hours</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1a1f2e] rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <Clock className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Upcoming Schedules</h3>
          <span className="px-2 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-full">
            Next 24h
          </span>
          <span className="ml-auto text-sm text-slate-400">
            {upcomingSchedules.length} schedule{upcomingSchedules.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="divide-y divide-slate-700/50 max-h-[600px] overflow-y-auto">
        {upcomingSchedules.map((schedule) => (
          <div
            key={schedule.id}
            className="p-5 hover:bg-slate-800/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-bold text-white text-lg">
                    {schedule.assetSymbol}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {schedule.trend === 'buy' ? (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-md">
                        <TrendingUp className="w-3.5 h-3.5 text-green-400" />
                        <span className="text-xs font-semibold text-green-400">BUY</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 rounded-md">
                        <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-xs font-semibold text-red-400">SELL</span>
                      </div>
                    )}
                    
                    <span className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs font-mono rounded-md">
                      {schedule.timeframe}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{formatTime(schedule.scheduledTime)} WIB</span>
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span className="text-blue-400 font-medium">
                      in {formatTimeUntil(schedule.scheduledTime)}
                    </span>
                  </div>
                </div>

                {schedule.notes && (
                  <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                    {schedule.notes}
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2">
                {schedule.isActive ? (
                  <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-semibold rounded-full border border-green-500/20">
                    ACTIVE
                  </span>
                ) : (
                  <span className="px-2 py-1 bg-slate-500/10 text-slate-400 text-xs font-semibold rounded-full border border-slate-500/20">
                    INACTIVE
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================
// MAIN PAGE COMPONENT - ✅ FIXED VERSION
// ============================================
export default function AssetSchedulePage() {
  const { token } = useAuthStore()
  const schedules = useSchedules()
  const stats = useScheduleStats()
  const pagination = useSchedulePagination()
  const filters = useScheduleFilters()
  const { isLoading, isCreating, isUpdating } = useScheduleLoading()
  
  const {
    fetchSchedules,
    fetchStatistics,
    fetchUpcomingSchedules,
    createSchedule,
    updateSchedule,
    cancelSchedule,
    deleteSchedule,
    setFilters,
    resetFilters,
  } = useScheduleActions()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<AssetSchedule | null>(null)
  const [viewingSchedule, setViewingSchedule] = useState<AssetSchedule | null>(null)

  const [assets] = useState(['BTCUSD', 'ETHUSD', 'XAUUSD', 'EURUSD', 'GBPUSD'])

  // ✅ FIX: Use refs to track previous values and prevent infinite loop
  const prevFiltersRef = useRef<string>('')
  const isInitialMount = useRef(true)

  // ✅ FIX 1: Memoize loadData untuk menghindari re-creation
  const loadData = useCallback(async () => {
    if (!token) return
    
    console.log('📊 Loading all data...')
    await Promise.all([
      fetchSchedules(token),
      fetchStatistics(token),
      fetchUpcomingSchedules(token),
    ])
  }, [token, fetchSchedules, fetchStatistics, fetchUpcomingSchedules])

  // ✅ FIX 2: Initial load - hanya dipanggil sekali saat mount
  useEffect(() => {
    if (token && isInitialMount.current) {
      isInitialMount.current = false
      console.log('🚀 Initial data load')
      loadData()
    }
  }, [token, loadData])

  // ✅ FIX 3: Fetch schedules ketika filters berubah - DENGAN DEEP COMPARISON DAN DEBOUNCE
  useEffect(() => {
    if (!token) return

    // Serialize filters untuk comparison
    const currentFiltersStr = JSON.stringify(filters)
    
    // Skip jika filters tidak berubah (menghindari infinite loop)
    if (prevFiltersRef.current === currentFiltersStr) {
      return
    }

    // Update previous filters
    prevFiltersRef.current = currentFiltersStr

    // Fetch dengan debounce untuk menghindari terlalu banyak request
    const timeoutId = setTimeout(() => {
      console.log('🔄 Filters changed, fetching schedules:', filters)
      fetchSchedules(token)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [filters, token, fetchSchedules])

  const handleRefresh = () => {
    console.log('🔄 Manual refresh triggered')
    loadData()
  }

  // ✅ FIXED: Single handler that accepts union type
  const handleModalSubmit = async (data: CreateScheduleDto | UpdateScheduleDto) => {
    if (!token) return
    
    if (editingSchedule) {
      // Update mode
      const success = await updateSchedule(editingSchedule.id, data as UpdateScheduleDto, token)
      if (success) {
        setIsModalOpen(false)
        setEditingSchedule(null)
      }
    } else {
      // Create mode
      const success = await createSchedule(data as CreateScheduleDto, token)
      if (success) {
        setIsModalOpen(false)
        setEditingSchedule(null)
      }
    }
  }

  const handleEdit = (schedule: AssetSchedule) => {
    setEditingSchedule(schedule)
    setIsModalOpen(true)
  }

  const handleView = (schedule: AssetSchedule) => {
    setViewingSchedule(schedule)
    setIsDetailModalOpen(true)
  }

  const handleCancel = async (id: string) => {
    if (!token) return
    
    if (confirm('Are you sure you want to cancel this schedule?')) {
      await cancelSchedule(id, token)
    }
  }

  const handleDelete = async (id: string) => {
    if (!token) return
    
    if (confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      await deleteSchedule(id, token)
    }
  }

  const handlePageChange = (page: number) => {
    setFilters({ page })
  }

  const handleOpenCreateModal = () => {
    setEditingSchedule(null)
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Asset Schedule Management
            </h1>
            <p className="text-slate-400">
              Schedule asset trends for market manipulation
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={handleOpenCreateModal}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Schedule
            </button>
          </div>
        </div>

        {/* Statistics */}
        <ScheduleStatsCard stats={stats} isLoading={isLoading && !stats} />

        {/* Upcoming Schedules Widget */}
        <UpcomingSchedulesWidget />

        {/* Filters */}
        <ScheduleFilters
          filters={filters}
          onFilterChange={setFilters}
          onResetFilters={resetFilters}
          assets={assets}
        />

        {/* Table */}
        <ScheduleTable
          schedules={schedules}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCancel={handleCancel}
          onView={handleView}
        />

        {/* Pagination */}
        <SchedulePagination
          pagination={pagination}
          onPageChange={handlePageChange}
        />

        {/* Create/Edit Modal */}
        <AssetScheduleModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingSchedule(null)
          }}
          onSubmit={handleModalSubmit}
          schedule={editingSchedule}
          assets={assets}
          isLoading={isCreating || isUpdating}
        />

        {/* Detail Modal */}
        <ScheduleDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setViewingSchedule(null)
          }}
          schedule={viewingSchedule}
        />
      </div>
    </div>
  )
}