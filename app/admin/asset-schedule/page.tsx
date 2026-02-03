// app/admin/asset-schedule/page.tsx
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

// Helper functions for datetime-local conversion
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
  
  const date = new Date(datetimeLocal)
  return date.toISOString()
}

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
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
    <Navbar />
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6 animate-pulse">
        <div className="h-7 bg-white/10 rounded w-48 mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-64"></div>
      </div>
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
)

export default function AssetSchedulePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [schedules, setSchedules] = useState<AssetSchedule[]>([])
  const [statistics, setStatistics] = useState<AssetScheduleStatistics | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
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
      
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Gagal memuat data:', error)
      toast.error('Gagal memuat jadwal')
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  const loadAssets = async () => {
    try {
      const response = await assetsApi.getAll()
      
      if (!response || !response.data) {
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
      }

      setAssets(assetsData)
      
    } catch (error) {
      console.error('Gagal memuat aset:', error)
      toast.error('Gagal memuat daftar aset')
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
      
      toast.success('Jadwal berhasil dibuat')
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
      console.error('Gagal membuat jadwal:', error)
      toast.error(error.response?.data?.message || 'Gagal membuat jadwal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return

    try {
      await assetScheduleApi.delete(id)
      toast.success('Jadwal berhasil dihapus')
      loadData()
    } catch (error: any) {
      console.error('Gagal menghapus jadwal:', error)
      toast.error(error.response?.data?.message || 'Gagal menghapus jadwal')
    }
  }

  const handleExportCSV = () => {
    downloadSchedulesCSV(schedules, `jadwal-aset-${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('Jadwal berhasil diekspor')
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
    return null
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  const getTrendLabel = (trend: string) => {
    return trend === 'buy' ? 'Beli' : 'Jual'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'pending': 'Menunggu',
      'executed': 'Dijalankan',
      'failed': 'Gagal',
      'cancelled': 'Dibatalkan'
    }
    return labels[status] || status
  }

  const getTimeframeLabel = (tf: string) => {
    const labels: Record<string, string> = {
      '1m': '1 Menit',
      '5m': '5 Menit',
      '15m': '15 Menit',
      '30m': '30 Menit',
      '1h': '1 Jam',
      '4h': '4 Jam',
      '1d': '1 Hari'
    }
    return labels[tf] || tf
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Manajemen Jadwal Aset</h1>
            <p className="text-sm text-slate-400">Kelola jadwal trading otomatis untuk aset</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportCSV}
              disabled={schedules.length === 0}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              <Download className="w-4 h-4 inline mr-2" />
              Ekspor
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buat
            </button>
          </div>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="text-sm text-slate-400 mb-1">Total</div>
              <div className="text-2xl font-bold text-white">{statistics.total}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="text-sm text-slate-400 mb-1">Menunggu</div>
              <div className="text-2xl font-bold text-yellow-400">{statistics.pending}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="text-sm text-slate-400 mb-1">Dijalankan</div>
              <div className="text-2xl font-bold text-green-400">{statistics.executed}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
              <div className="text-sm text-slate-400 mb-1">Gagal</div>
              <div className="text-2xl font-bold text-red-400">{statistics.failed}</div>
            </div>
          </div>
        )}

        {/* Schedules Table */}
        {schedules.length === 0 ? (
          <div className="bg-white/5 rounded-lg p-12 text-center border border-white/10 backdrop-blur-sm">
            <Calendar className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Tidak ada jadwal</h3>
            <p className="text-slate-400 mb-6">Buat jadwal pertama Anda untuk memulai</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Buat Jadwal
            </button>
          </div>
        ) : (
          <div className="bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Aset</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Waktu</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Hitung Mundur</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Tren</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {schedules.map((schedule) => {
                    const timeUntil = getTimeUntilExecution(schedule.scheduledTime)

                    return (
                      <tr key={schedule.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{schedule.assetSymbol}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-300">{formatScheduledTime(schedule.scheduledTime)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className={`text-sm font-medium ${timeUntil.isPast ? 'text-slate-500' : 'text-indigo-400'}`}>
                            {timeUntil.formatted}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                            schedule.trend === 'buy' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {schedule.trend === 'buy' ? '📈' : '📉'} {getTrendLabel(schedule.trend)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                            schedule.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                            schedule.status === 'executed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            schedule.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-slate-500/10 text-slate-400 border-slate-500/20'
                          }`}>
                            {getStatusLabel(schedule.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Hapus"
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
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowCreateModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Buat Jadwal Baru</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 hover:bg-white/5 text-slate-400 rounded transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {formErrors.length > 0 && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-400 mb-1">Perbaiki kesalahan berikut:</p>
                        <ul className="text-sm text-red-300 list-disc list-inside space-y-1">
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
                    <label className="block text-sm font-medium text-slate-300 mb-1">Simbol Aset *</label>
                    <select
                      value={formData.assetSymbol}
                      onChange={(e) => setFormData({ ...formData, assetSymbol: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:bg-white/10 transition-all text-white text-sm"
                    >
                      <option value="" className="bg-slate-900">Pilih Aset</option>
                      {Array.isArray(assets) && assets.length > 0 ? (
                        assets.map((asset) => (
                          <option key={asset.id} value={asset.symbol} className="bg-slate-900">
                            {asset.symbol} - {asset.name}
                          </option>
                        ))
                      ) : (
                        <option value="" disabled className="bg-slate-900">Tidak ada aset tersedia</option>
                      )}
                    </select>
                    {assets.length === 0 && (
                      <p className="text-xs text-yellow-400 mt-1">⚠️ Tidak ada aset yang dimuat. Silakan refresh.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Waktu Jadwal *</label>
                    <input
                      type="datetime-local"
                      value={isoToDatetimeLocal(formData.scheduledTime)}
                      min={isoToDatetimeLocal(new Date().toISOString())}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        scheduledTime: datetimeLocalToISO(e.target.value) 
                      })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:bg-white/10 transition-all text-white text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      🕐 Zona waktu Anda: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Tren *</label>
                    <select
                      value={formData.trend}
                      onChange={(e) => setFormData({ ...formData, trend: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:bg-white/10 transition-all text-white text-sm"
                    >
                      <option value="buy" className="bg-slate-900">📈 Beli</option>
                      <option value="sell" className="bg-slate-900">📉 Jual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Kerangka Waktu *</label>
                    <select
                      value={formData.timeframe}
                      onChange={(e) => setFormData({ ...formData, timeframe: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:bg-white/10 transition-all text-white text-sm"
                    >
                      <option value="1m" className="bg-slate-900">1 Menit</option>
                      <option value="5m" className="bg-slate-900">5 Menit</option>
                      <option value="15m" className="bg-slate-900">15 Menit</option>
                      <option value="30m" className="bg-slate-900">30 Menit</option>
                      <option value="1h" className="bg-slate-900">1 Jam</option>
                      <option value="4h" className="bg-slate-900">4 Jam</option>
                      <option value="1d" className="bg-slate-900">1 Hari</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Catatan</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Tambahkan catatan..."
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:bg-white/10 transition-all text-white placeholder-slate-500 text-sm resize-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 border-white/10 rounded focus:ring-indigo-500 bg-white/5"
                    />
                    <label htmlFor="isActive" className="text-sm text-slate-300">
                      Aktif (jadwal akan berjalan otomatis)
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleCreateSchedule}
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {submitting ? 'Membuat...' : 'Buat'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}