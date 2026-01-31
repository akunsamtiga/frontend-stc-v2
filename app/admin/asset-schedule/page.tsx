// app/admin/asset-schedule/page.tsx - SIMPLE FIXED VERSION
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { assetScheduleApi, assetsApi } from '@/lib/api-wrapper'
import Navbar from '@/components/Navbar'
import { 
  Calendar, Clock, AlertCircle, CheckCircle, XCircle, Ban, Plus, 
  RefreshCw, Edit, Trash2, Play, X, Download
} from 'lucide-react'
import { toast } from 'sonner'
import type { 
  AssetSchedule, 
  CreateAssetScheduleRequest,
  UpdateAssetScheduleRequest,
  GetAssetSchedulesQuery,
  AssetScheduleStatistics,
  Asset
} from '@/types'
import {
  formatScheduledTime,
  getTimeUntilExecution,
  getStatusBadgeInfo,
  getTrendBadgeInfo,
  getTimeframeLabel,
  validateScheduleData,
  downloadSchedulesCSV
} from '@/lib/asset-schedule'

// ✅ Helper functions for datetime-local conversion
function isoToDatetimeLocal(isoString: string): string {
  if (!isoString) return ''
  
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function datetimeLocalToISO(datetimeLocal: string): string {
  if (!datetimeLocal) return ''
  
  // Create date in LOCAL timezone (not UTC)
  const date = new Date(datetimeLocal)
  return date.toISOString()
}

export default function AssetSchedulePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [schedules, setSchedules] = useState<AssetSchedule[]>([])
  const [statistics, setStatistics] = useState<AssetScheduleStatistics | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  
  const [filters, setFilters] = useState<GetAssetSchedulesQuery>({
    page: 1,
    limit: 10
  })
  
  const [showCreateModal, setShowCreateModal] = useState(false)
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

  useEffect(() => {
    const interval = setInterval(() => {
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
      
      console.log('📡 Loading schedules...', filters)
      
      const [schedulesRes, statsRes] = await Promise.all([
        assetScheduleApi.getSchedules(filters).catch((err: any) => {
          console.error('Schedules API error:', err)
          return { data: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } }
        }),
        assetScheduleApi.getStatistics().catch((err: any) => {
          console.error('Stats API error:', err)
          return { total: 0, pending: 0, executed: 0, failed: 0, cancelled: 0, activeSchedules: 0, upcomingToday: 0, upcomingThisWeek: 0 }
        })
      ])

      console.log('📦 Schedules response:', schedulesRes)
      console.log('📊 Stats response:', statsRes)

      if (schedulesRes?.data) {
        setSchedules(schedulesRes.data.data || [])
        if (schedulesRes.data.pagination) {
          setPage(schedulesRes.data.pagination.page)
          setTotalPages(schedulesRes.data.pagination.totalPages)
          setTotal(schedulesRes.data.pagination.total)
        }
      }

      if (statsRes) {
        setStatistics(statsRes as AssetScheduleStatistics)
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
      console.log('🔄 Loading assets...')
      const response = await assetsApi.getAll()
      
      console.log('📦 Assets response:', response)
      
      if (!response || !response.data) {
        console.warn('⚠️ No assets data received')
        setAssets([])
        return
      }

      let assetsData: Asset[] = []

      if (Array.isArray(response.data)) {
        assetsData = response.data
      } else if (response.data.assets && Array.isArray(response.data.assets)) {
        assetsData = response.data.assets
      } else if ((response.data as any).data && Array.isArray((response.data as any).data)) {
        assetsData = (response.data as any).data
      } else {
        console.warn('⚠️ Unknown assets response format:', response.data)
        assetsData = []
      }

      console.log(`✅ Loaded ${assetsData.length} assets`)
      setAssets(assetsData)
      
    } catch (error) {
      console.error('❌ Failed to load assets:', error)
      toast.error('Failed to load assets list')
      setAssets([])
    }
  }

  const handleRefresh = () => {
    loadData(true)
  }

  const handleCreateSchedule = async () => {
    try {
      setSubmitting(true)
      setFormErrors([])

      const validation = validateScheduleData(formData)
      if (!validation.valid) {
        setFormErrors(validation.errors)
        return
      }

      await assetScheduleApi.create(formData)
      
      toast.success('Schedule created successfully')
      setShowCreateModal(false)
      setFormData({
        assetSymbol: '',
        scheduledTime: '',
        trend: 'buy',
        timeframe: '1m',
        notes: '',
        isActive: true
      })
      
      loadData()
    } catch (error: any) {
      console.error('Failed to create schedule:', error)
      toast.error(error.response?.data?.message || 'Failed to create schedule')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule?')) return

    try {
      await assetScheduleApi.delete(id)
      toast.success('Schedule deleted successfully')
      loadData()
    } catch (error: any) {
      console.error('Failed to delete schedule:', error)
      toast.error(error.response?.data?.message || 'Failed to delete schedule')
    }
  }

  const handleExportCSV = () => {
    downloadSchedulesCSV(schedules, `asset-schedules-${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('Schedules exported successfully')
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600" />
                Asset Schedule Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage automated trading schedules for assets
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleExportCSV}
                disabled={schedules.length === 0}
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Total</div>
              <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{statistics.pending}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Executed</div>
              <div className="text-2xl font-bold text-green-600">{statistics.executed}</div>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <div className="text-sm text-gray-600 mb-1">Failed</div>
              <div className="text-2xl font-bold text-red-600">{statistics.failed}</div>
            </div>
          </div>
        )}

        {/* Schedules Table */}
        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : schedules.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No schedules found</h3>
            <p className="text-gray-600 mb-6">Create your first schedule to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Schedule
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Asset</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Countdown</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Trend</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schedules.map((schedule) => {
                    const statusInfo = getStatusBadgeInfo(schedule.status)
                    const trendInfo = getTrendBadgeInfo(schedule.trend)
                    const timeUntil = getTimeUntilExecution(schedule.scheduledTime)

                    return (
                      <tr key={schedule.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-900">{schedule.assetSymbol}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-900">{formatScheduledTime(schedule.scheduledTime)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`text-sm font-medium ${timeUntil.isPast ? 'text-gray-400' : 'text-blue-600'}`}>
                            {timeUntil.formatted}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${trendInfo.className}`}>
                            {trendInfo.icon} {trendInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusInfo.className}`}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create New Schedule</h2>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asset Symbol *</label>
                  <select
                    value={formData.assetSymbol}
                    onChange={(e) => setFormData({ ...formData, assetSymbol: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Asset</option>
                    {Array.isArray(assets) && assets.length > 0 ? (
                      assets.map((asset) => (
                        <option key={asset.id} value={asset.symbol}>
                          {asset.symbol} - {asset.name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No assets available</option>
                    )}
                  </select>
                  {assets.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">⚠️ No assets loaded. Please refresh.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time *</label>
                  <input
                    type="datetime-local"
                    value={isoToDatetimeLocal(formData.scheduledTime)}
                    min={isoToDatetimeLocal(new Date().toISOString())}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      scheduledTime: datetimeLocalToISO(e.target.value) 
                    })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    🕐 Your timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Trend *</label>
                  <select
                    value={formData.trend}
                    onChange={(e) => setFormData({ ...formData, trend: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="buy">📈 Buy</option>
                    <option value="sell">📉 Sell</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe *</label>
                  <select
                    value={formData.timeframe}
                    onChange={(e) => setFormData({ ...formData, timeframe: e.target.value as any })}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Add notes..."
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
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}