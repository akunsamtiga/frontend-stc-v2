// app/admin/vouchers/page.tsx 
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import CreateVoucherModal from '@/components/CreateVoucherModal'
import { Voucher, VoucherStatistics } from '@/types'
import { 
  Tag, Plus, Edit2, Trash2, BarChart3, Search, Filter,
  Loader2, CheckCircle, XCircle, Calendar, Users, DollarSign,
  TrendingUp, AlertCircle, RefreshCw, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'

interface VoucherWithStats extends Voucher {
  statistics?: {
    totalUsed: number
    totalBonusGiven: number
    remainingUses: number | null
  }
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
)

export default function VoucherManagementPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [vouchers, setVouchers] = useState<VoucherWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [voucherStats, setVoucherStats] = useState<VoucherStatistics | null>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [limit] = useState(20)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      router.push('/dashboard')
      return
    }
    loadVouchers()
  }, [user, router, filterActive, currentPage])

  const loadVouchers = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      setLoading(true)
      
      const options: any = { page: currentPage, limit: 20 }
      
      if (filterActive !== 'all') {
        options.isActive = filterActive === 'active'
      }
      
      const response: any = await api.getAllVouchers(options)
      
      let vouchersData: Voucher[] = []
      let paginationData: any = null
      
      if (response?.data) {
        if (response.data.data?.vouchers && Array.isArray(response.data.data.vouchers)) {
          vouchersData = response.data.data.vouchers
          paginationData = response.data.data.pagination
        }
        else if (response.data.vouchers && Array.isArray(response.data.vouchers)) {
          vouchersData = response.data.vouchers
          paginationData = response.data.pagination
        }
        else if (Array.isArray(response.data)) {
          vouchersData = response.data
        }
      }
      else if (response?.vouchers && Array.isArray(response.vouchers)) {
        vouchersData = response.vouchers
        paginationData = response.pagination
      }
      
      setVouchers(vouchersData)
      setLastUpdated(new Date())
      
      if (paginationData) {
        setTotalPages(paginationData.totalPages || 1)
      } else {
        setTotalPages(1)
      }
      
    } catch (error: any) {
      console.error('Gagal memuat voucher:', error)
      
      if (error.response?.status === 404) {
        toast.error('Endpoint voucher tidak ditemukan')
      } else if (error.response?.status === 401) {
        toast.error('Autentikasi gagal. Silakan login kembali.')
        router.push('/')
      } else if (error.response?.status === 403) {
        toast.error('Akses ditolak')
        router.push('/dashboard')
      } else {
        toast.error(error.message || 'Gagal memuat voucher')
      }
      
      setVouchers([])
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadVouchers(true)
  }

  const loadVoucherStatistics = async (voucherId: string) => {
    try {
      const response: any = await api.getVoucherStatistics(voucherId)
      
      let statsData: VoucherStatistics | null = null
      
      if (response?.data?.data?.voucher && response?.data?.data?.statistics) {
        statsData = response.data.data
      } else if (response?.data?.voucher && response?.data?.statistics) {
        statsData = response.data
      } else if (response?.voucher && response?.statistics) {
        statsData = response as VoucherStatistics
      }
      
      if (statsData) {
        setVoucherStats(statsData)
        setShowStatsModal(true)
      } else {
        toast.error('Data statistik tidak tersedia')
      }
    } catch (error: any) {
      console.error('Gagal memuat statistik:', error)
      toast.error(error.message || 'Gagal memuat statistik voucher')
    }
  }

  const handleCreateVoucher = () => {
    setEditingVoucher(null)
    setShowCreateModal(true)
  }

  const handleEditVoucher = (voucher: Voucher) => {
    setEditingVoucher(voucher)
    setShowCreateModal(true)
  }

  const handleDeleteVoucher = async (voucherId: string) => {
    if (user?.role !== 'super_admin') {
      toast.error('Hanya Super Admin yang dapat menghapus voucher')
      return
    }

    if (!confirm('Apakah Anda yakin ingin menghapus voucher ini?')) {
      return
    }

    try {
      await api.deleteVoucher(voucherId)
      toast.success('Voucher berhasil dihapus')
      loadVouchers()
    } catch (error: any) {
      console.error('Gagal menghapus voucher:', error)
      toast.error(error.message || 'Gagal menghapus voucher')
    }
  }

  const handleModalSuccess = () => {
    loadVouchers()
  }

  const getStatusBadge = (voucher: Voucher) => {
    const now = new Date()
    const validFrom = new Date(voucher.validFrom)
    const validUntil = new Date(voucher.validUntil)
    
    if (!voucher.isActive) {
      return (
        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-white/5 text-slate-400 border border-white/10 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Nonaktif
        </span>
      )
    }
    
    if (now < validFrom) {
      return (
        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Terjadwal
        </span>
      )
    }
    
    if (now > validUntil) {
      return (
        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Kadaluarsa
        </span>
      )
    }
    
    if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
      return (
        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Batas Tercapai
        </span>
      )
    }
    
    return (
      <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Aktif
      </span>
    )
  }

  const filteredVouchers = vouchers.filter(voucher => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return voucher.code.toLowerCase().includes(query) ||
             voucher.description?.toLowerCase().includes(query)
    }
    return true
  })

  if (loading && vouchers.length === 0) {
    return <LoadingSkeleton />
  }

  const colorClasses: Record<string, { bg: string, icon: string, hover: string }> = {
    purple: { bg: 'bg-sky-500/10', icon: 'text-sky-400', hover: 'hover:bg-sky-500/20' },
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', hover: 'hover:bg-blue-500/20' },
    green: { bg: 'bg-green-500/10', icon: 'text-green-400', hover: 'hover:bg-green-500/20' },
    yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-400', hover: 'hover:bg-yellow-500/20' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Manajemen Voucher</h1>
            <p className="text-sm text-slate-400">Buat dan kelola voucher deposit</p>
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
              onClick={handleCreateVoucher}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Buat Voucher
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-sky-500/20 flex items-center justify-center">
                <Tag className="w-4 h-4 text-sky-400" />
              </div>
              <span className="text-xs text-slate-400">Total Voucher</span>
            </div>
            <div className="text-2xl font-bold text-white">{vouchers.length}</div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-xs text-slate-400">Aktif</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {vouchers.filter(v => v.isActive).length}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-slate-400">Total Penggunaan</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {vouchers.reduce((sum, v) => sum + v.usedCount, 0)}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-yellow-500/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-xs text-slate-400">Total Bonus</span>
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {formatCurrency(vouchers.reduce((sum, v) => sum + (v.value * v.usedCount), 0))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan kode atau deskripsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:bg-white/10 transition-all text-white placeholder-slate-500 text-sm"
            />
          </div>

          <div className="inline-flex bg-white/5 rounded-lg p-1 backdrop-blur-sm border border-white/10">
            <button
              onClick={() => { setFilterActive('all'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                filterActive === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => { setFilterActive('active'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                filterActive === 'active'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => { setFilterActive('inactive'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                filterActive === 'inactive'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nonaktif
            </button>
          </div>
        </div>

        {/* Vouchers List */}
        {filteredVouchers.length === 0 ? (
          <div className="bg-white/5 rounded-lg p-12 text-center border border-white/10 backdrop-blur-sm">
            <Tag className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Tidak ada voucher</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery 
                ? 'Coba ubah kata kunci pencarian'
                : 'Mulai dengan membuat voucher pertama Anda'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateVoucher}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
              >
                Buat Voucher Pertama
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredVouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="bg-white/5 rounded-lg p-5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-indigo-500/30 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold font-mono text-white">
                        {voucher.code}
                      </span>
                      {getStatusBadge(voucher)}
                    </div>
                    
                    {voucher.description && (
                      <p className="text-sm text-slate-400 mb-3">{voucher.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">
                          {voucher.type === 'percentage' 
                            ? `${voucher.value}% Bonus`
                            : `${formatCurrency(voucher.value)} Tetap`
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">
                          Min: {formatCurrency(voucher.minDeposit)}
                        </span>
                      </div>
                      
                      {voucher.type === 'percentage' && voucher.maxBonusAmount && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-300">
                            Max: {formatCurrency(voucher.maxBonusAmount)}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">
                          {voucher.eligibleStatuses.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadVoucherStatistics(voucher.id)}
                      className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors"
                      title="Lihat Statistik"
                    >
                      <BarChart3 className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleEditVoucher(voucher)}
                      className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    
                    {user?.role === 'super_admin' && (
                      <button
                        onClick={() => handleDeleteVoucher(voucher.id)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-slate-500">Digunakan:</span>
                      <span className="ml-2 font-semibold text-white">
                        {voucher.usedCount}
                        {voucher.maxUses && ` / ${voucher.maxUses}`}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-slate-500">Per Pengguna:</span>
                      <span className="ml-2 font-semibold text-white">
                        {voucher.maxUsesPerUser}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-500">
                    <div>Mulai: {formatDate(voucher.validFrom)}</div>
                    <div>Sampai: {formatDate(voucher.validUntil)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sebelumnya
            </button>
            
            <span className="px-4 py-2 text-sm text-slate-400">
              Halaman {currentPage} dari {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <CreateVoucherModal
          onClose={() => {
            setShowCreateModal(false)
            setEditingVoucher(null)
          }}
          onSuccess={handleModalSuccess}
          voucher={editingVoucher}
        />
      )}

      {/* Statistics Modal */}
      {showStatsModal && voucherStats && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowStatsModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-white/10">
              <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900 z-10">
                <h2 className="text-xl font-bold text-white">Statistik Voucher</h2>
                <button
                  onClick={() => {
                    setShowStatsModal(false)
                    setVoucherStats(null)
                  }}
                  className="p-2 hover:bg-white/5 text-slate-400 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="text-2xl font-bold font-mono text-white mb-2">
                    {voucherStats.voucher.code}
                  </div>
                  <div className="text-sm text-slate-400">
                    {voucherStats.voucher.type === 'percentage' 
                      ? `${voucherStats.voucher.value}% Bonus`
                      : `${formatCurrency(voucherStats.voucher.value)} Bonus Tetap`
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                    <div className="text-sm text-blue-400 mb-1">Total Digunakan</div>
                    <div className="text-2xl font-bold text-white">
                      {voucherStats.statistics.totalUsed}
                    </div>
                    {voucherStats.statistics.remainingUses !== null && (
                      <div className="text-xs text-blue-400 mt-1">
                        {voucherStats.statistics.remainingUses} tersisa
                      </div>
                    )}
                  </div>

                  <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                    <div className="text-sm text-green-400 mb-1">Total Bonus Diberikan</div>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(voucherStats.statistics.totalBonusGiven)}
                    </div>
                  </div>

                  <div className="bg-sky-500/10 rounded-xl p-4 border border-sky-500/20">
                    <div className="text-sm text-sky-400 mb-1">Total Deposit</div>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(voucherStats.statistics.totalDepositAmount)}
                    </div>
                  </div>

                  <div className="bg-orange-500/10 rounded-xl p-4 border border-orange-500/20">
                    <div className="text-sm text-orange-400 mb-1">Rata-rata Bonus</div>
                    <div className="text-2xl font-bold text-white">
                      {formatCurrency(voucherStats.statistics.averageBonus)}
                    </div>
                  </div>
                </div>

                {voucherStats.recentUsages && voucherStats.recentUsages.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-white mb-3">Penggunaan Terbaru</h3>
                    <div className="space-y-2">
                      {voucherStats.recentUsages.map((usage) => (
                        <div
                          key={usage.id}
                          className="bg-white/5 rounded-lg p-3 text-sm border border-white/10"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-semibold text-white">
                              {usage.userEmail}
                            </span>
                            <span className="text-slate-400">
                              {formatDate(usage.usedAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>
                              Deposit: {formatCurrency(usage.depositAmount)}
                            </span>
                            <span className="text-green-400 font-semibold">
                              Bonus: +{formatCurrency(usage.bonusAmount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}