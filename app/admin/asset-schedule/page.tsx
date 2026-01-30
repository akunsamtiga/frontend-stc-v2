// app/admin/asset-schedule/page.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { 
  Calendar, TrendingUp, TrendingDown, Clock, AlertCircle, 
  CheckCircle, XCircle, Ban, Plus, Filter, Search, RefreshCw,
  Edit, Trash2, Play, X, ChevronLeft, ChevronRight, Download,
  BarChart3, Activity
} from 'lucide-react'
import { toast } from 'sonner'
import type { 
  AssetSchedule, 
  CreateAssetScheduleRequest,
  UpdateAssetScheduleRequest,
  GetAssetSchedulesQuery,
  AssetScheduleStatistics,
  AssetScheduleTrend,
  AssetScheduleTimeframe,
  AssetScheduleStatus,
  Asset
} from '@/types'
import {
  formatScheduledTime,
  formatScheduledDate,
  formatScheduledTimeOnly,
  getTimeUntilExecution,
  getStatusBadgeInfo,
  getTrendBadgeInfo,
  getTimeframeLabel,
  canEditSchedule,
  canCancelSchedule,
  canExecuteSchedule,
  canDeleteSchedule,
  validateScheduleData,
  downloadSchedulesCSV
} from '@/lib/asset-schedule'

const StatCardSkeleton = () => (
  <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </div>
    <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
    <div className="h-3 bg-gray-200 rounded w-16"></div>
  </div>
)

const TableSkeleton = () => (
  <div className="bg-white rounded-xl border border-gray-100">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {[...Array(7)].map((_, i) => (
              <th key={i} className="px-4 py-3">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i} className="border-b border-gray-100">
              {[...Array(7)].map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

export default function AssetSchedulePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  // State
  const [schedules, setSchedules] = useState<AssetSchedule[]>([])
  const [statistics, setStatistics] = useState<AssetScheduleStatistics | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Pagination
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  // Filters
  const [filters, setFilters] = useState<GetAssetSchedulesQuery>({
  page: 1,
  limit: 10
})
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<AssetSchedule | null>(null)
  const [formData, setFormData] = useState<CreateAssetScheduleRequest>({
    assetSymbol: '',
    scheduledTime: '',
    trend: 'buy',
    timeframe: '1m',
    notes: '',
    isActive: true
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Auto-refresh for countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render untuk update countdown
      setSchedules(prev => [...prev])
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      router.push('/trading')
      return
    }
    
    loadData()
    loadAssets()
  }, [user, router, filters])

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      
      const [schedulesRes, statsRes] = await Promise.all([
        api.getAssetSchedules(filters),
        api.getAssetScheduleStatistics()
      ])

      if (schedulesRes?.data) {
        setSchedules(schedulesRes.data.data || [])
        if (schedulesRes.data.pagination) {
          setPage(schedulesRes.data.pagination.page)
          setTotalPages(schedulesRes.data.pagination.totalPages)
          setTotal(schedulesRes.data.pagination.total)
        }
      }

      if (statsRes?.data) {
        setStatistics(statsRes.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load schedules')
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  const loadAssets = async () => {
    try {
      const response = await api.getAssets()
      if (response?.data) {
        // Handle both array and object response formats
        const assetsData = Array.isArray(response.data) 
          ? response.data 
          : response.data.assets || []
        setAssets(assetsData)
      }
    } catch (error) {
      console.error('Failed to load assets:', error)
    }
  }

  const handleRefresh = () => {
    loadData(true)
  }

  const handleFilterChange = (key: keyof GetAssetSchedulesQuery, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page on filter change
    }))
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    handleFilterChange('assetSymbol', searchTerm)
  }

  const handleCreateSchedule = async () => {
    try {
      setSubmitting(true)
      setFormErrors([])

      // Validate
      const validation = validateScheduleData({
        assetSymbol: formData.assetSymbol,
        scheduledTime: formData.scheduledTime,
        trend: formData.trend,
        timeframe: formData.timeframe
      })

      if (!validation.valid) {
        setFormErrors(validation.errors)
        toast.error('Please fix the errors')
        return
      }

      const response = await api.createAssetSchedule(formData)
      
      if (response?.data) {
        toast.success('Schedule created successfully')
        setShowCreateModal(false)
        resetForm()
        loadData()
      }
    } catch (error: any) {
      console.error('Failed to create schedule:', error)
      toast.error(error?.response?.data?.message || 'Failed to create schedule')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateSchedule = async () => {
    if (!selectedSchedule) return

    try {
      setSubmitting(true)
      setFormErrors([])

      const updateData: UpdateAssetScheduleRequest = {
        scheduledTime: formData.scheduledTime,
        trend: formData.trend,
        timeframe: formData.timeframe,
        notes: formData.notes,
        isActive: formData.isActive
      }

      const response = await api.updateAssetSchedule(selectedSchedule.id, updateData)
      
      if (response?.data) {
        toast.success('Schedule updated successfully')
        setShowEditModal(false)
        setSelectedSchedule(null)
        resetForm()
        loadData()
      }
    } catch (error: any) {
      console.error('Failed to update schedule:', error)
      toast.error(error?.response?.data?.message || 'Failed to update schedule')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSchedule = async (schedule: AssetSchedule) => {
    if (!confirm(`Delete schedule for ${schedule.assetSymbol}?`)) return

    try {
      await api.deleteAssetSchedule(schedule.id)
      toast.success('Schedule deleted successfully')
      loadData()
    } catch (error: any) {
      console.error('Failed to delete schedule:', error)
      toast.error(error?.response?.data?.message || 'Failed to delete schedule')
    }
  }

  const handleCancelSchedule = async (schedule: AssetSchedule) => {
    if (!confirm(`Cancel schedule for ${schedule.assetSymbol}?`)) return

    try {
      await api.cancelAssetSchedule(schedule.id)
      toast.success('Schedule cancelled successfully')
      loadData()
    } catch (error: any) {
      console.error('Failed to cancel schedule:', error)
      toast.error(error?.response?.data?.message || 'Failed to cancel schedule')
    }
  }

  const handleExecuteSchedule = async (schedule: AssetSchedule) => {
    if (!confirm(`Execute schedule for ${schedule.assetSymbol} now?`)) return

    try {
      await api.executeAssetScheduleNow(schedule.id)
      toast.success('Schedule executed successfully')
      loadData()
    } catch (error: any) {
      console.error('Failed to execute schedule:', error)
      toast.error(error?.response?.data?.message || 'Failed to execute schedule')
    }
  }

  const openCreateModal = () => {
    resetForm()
    setShowCreateModal(true)
  }

  const openEditModal = (schedule: AssetSchedule) => {
    setSelectedSchedule(schedule)
    setFormData({
      assetSymbol: schedule.assetSymbol,
      scheduledTime: schedule.scheduledTime,
      trend: schedule.trend,
      timeframe: schedule.timeframe,
      notes: schedule.notes || '',
      isActive: schedule.isActive
    })
    setShowEditModal(true)
  }

  const resetForm = () => {
    setFormData({
      assetSymbol: '',
      scheduledTime: '',
      trend: 'buy',
      timeframe: '1m',
      notes: '',
      isActive: true
    })
    setFormErrors([])
  }

  const handleExportCSV = () => {
    downloadSchedulesCSV(schedules, `asset-schedules-${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('CSV exported successfully')
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 lg:py-8 max-w-7xl">
          <div className="mb-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          <TableSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-500" />
                Asset Schedule
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Schedule and manage asset trends for market manipulation
              </p>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Total</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-gray-900">
                {statistics.total}
              </div>
              <p className="text-xs text-gray-500 mt-1">All schedules</p>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Pending</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-yellow-600">
                {statistics.pending}
              </div>
              <p className="text-xs text-gray-500 mt-1">Awaiting execution</p>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Executed</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-green-600">
                {statistics.executed}
              </div>
              <p className="text-xs text-gray-500 mt-1">Successfully ran</p>
            </div>

            <div className="bg-white rounded-xl p-4 md:p-5 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Active</span>
              </div>
              <div className="text-2xl md:text-3xl font-bold text-purple-600">
                {statistics.activeSchedules}
              </div>
              <p className="text-xs text-gray-500 mt-1">Currently active</p>
            </div>
          </div>
        )}

        {/* Filters & Actions */}
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by asset symbol..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </form>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filters.status || 'all'}
                onChange={(e) => handleFilterChange('status', e.target.value as any)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="executed">Executed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={filters.trend || ''}
                onChange={(e) => handleFilterChange('trend', e.target.value || undefined)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Trends</option>
                <option value="buy">Buy (Naik)</option>
                <option value="sell">Sell (Turun)</option>
              </select>

              <select
                value={filters.timeframe || ''}
                onChange={(e) => handleFilterChange('timeframe', e.target.value || undefined)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Timeframes</option>
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
                <option value="1d">1 Day</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
              
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Scheduled Time
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Countdown
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Trend
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Timeframe
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      No schedules found
                    </td>
                  </tr>
                ) : (
                  schedules.map((schedule) => {
                    const statusInfo = getStatusBadgeInfo(schedule.status)
                    const trendInfo = getTrendBadgeInfo(schedule.trend)
                    const timeUntil = getTimeUntilExecution(schedule.scheduledTime)

                    return (
                      <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{schedule.assetSymbol}</div>
                          {schedule.notes && (
                            <div className="text-xs text-gray-500 mt-1">{schedule.notes}</div>
                          )}
                        </td>
                        
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">
                            {formatScheduledDate(schedule.scheduledTime)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatScheduledTimeOnly(schedule.scheduledTime)}
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {schedule.status === 'pending' && !timeUntil.isPast ? (
                            <div className={`text-sm font-medium ${
                              timeUntil.total < 5 * 60 * 1000 ? 'text-red-600' :
                              timeUntil.total < 30 * 60 * 1000 ? 'text-orange-600' :
                              timeUntil.total < 60 * 60 * 1000 ? 'text-yellow-600' :
                              'text-gray-600'
                            }`}>
                              {timeUntil.formatted}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${trendInfo.className}`}>
                            <span>{trendInfo.icon}</span>
                            {trendInfo.label}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">
                            {getTimeframeLabel(schedule.timeframe)}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.className}`}>
                            <span>{statusInfo.icon}</span>
                            {statusInfo.label}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {canEditSchedule(schedule) && (
                              <button
                                onClick={() => openEditModal(schedule)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            {canExecuteSchedule(schedule) && (
                              <button
                                onClick={() => handleExecuteSchedule(schedule)}
                                className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Execute Now"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                            )}

                            {canCancelSchedule(schedule) && (
                              <button
                                onClick={() => handleCancelSchedule(schedule)}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors"
                                title="Cancel"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}

                            {canDeleteSchedule(schedule) && (
                              <button
                                onClick={() => handleDeleteSchedule(schedule)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} schedules
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFilterChange('page', page - 1)}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <span className="text-sm text-gray-600">
                  Page {page} of {totalPages}
                </span>
                
                <button
                  onClick={() => handleFilterChange('page', page + 1)}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create Schedule</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 mb-1">Please fix the following errors:</p>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                        {formErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Symbol *
                  </label>
                  <select
                    value={formData.assetSymbol}
                    onChange={(e) => setFormData({ ...formData, assetSymbol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Asset</option>
                    {assets.map((asset) => (
                      <option key={asset.id} value={asset.symbol}>
                        {asset.symbol} - {asset.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledTime.slice(0, 16)}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: new Date(e.target.value).toISOString() })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trend *
                  </label>
                  <select
                    value={formData.trend}
                    onChange={(e) => setFormData({ ...formData, trend: e.target.value as AssetScheduleTrend })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="buy">📈 Buy (Naik)</option>
                    <option value="sell">📉 Sell (Turun)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeframe *
                  </label>
                  <select
                    value={formData.timeframe}
                    onChange={(e) => setFormData({ ...formData, timeframe: e.target.value as AssetScheduleTimeframe })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1m">1 Minute</option>
                    <option value="5m">5 Minutes</option>
                    <option value="15m">15 Minutes</option>
                    <option value="30m">30 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="4h">4 Hours</option>
                    <option value="1d">1 Day</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Add notes about this schedule..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Active (schedule will run automatically)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSchedule}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Edit Schedule</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedSchedule(null)
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formErrors.length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 mb-1">Please fix the following errors:</p>
                      <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                        {formErrors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asset Symbol
                  </label>
                  <input
                    type="text"
                    value={formData.assetSymbol}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">Asset cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledTime.slice(0, 16)}
                    onChange={(e) => setFormData({ ...formData, scheduledTime: new Date(e.target.value).toISOString() })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trend *
                  </label>
                  <select
                    value={formData.trend}
                    onChange={(e) => setFormData({ ...formData, trend: e.target.value as AssetScheduleTrend })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="buy">📈 Buy (Naik)</option>
                    <option value="sell">📉 Sell (Turun)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Timeframe *
                  </label>
                  <select
                    value={formData.timeframe}
                    onChange={(e) => setFormData({ ...formData, timeframe: e.target.value as AssetScheduleTimeframe })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1m">1 Minute</option>
                    <option value="5m">5 Minutes</option>
                    <option value="15m">15 Minutes</option>
                    <option value="30m">30 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="4h">4 Hours</option>
                    <option value="1d">1 Day</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Add notes about this schedule..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActiveEdit"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActiveEdit" className="text-sm text-gray-700">
                    Active (schedule will run automatically)
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedSchedule(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSchedule}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Updating...' : 'Update Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}