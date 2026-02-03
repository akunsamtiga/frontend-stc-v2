// app/(authenticated)/admin/withdrawals/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { 
  WithdrawalRequest, 
  WithdrawalSummary,
  formatWithdrawalStatus,
  WITHDRAWAL_CONFIG
} from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  ArrowUpFromLine, CheckCircle, XCircle, Clock, 
  FileText, Loader2, AlertCircle, User, CreditCard,
  Shield, Camera, Eye, RefreshCw, Filter, ChevronRight,
  Wallet, TrendingDown
} from 'lucide-react'
import { toast } from 'sonner'

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'completed'

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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[...Array(5)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
)

export default function AdminWithdrawalsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [summary, setSummary] = useState<WithdrawalSummary | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showApproveModal, setShowApproveModal] = useState(false)
  
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [processing, setProcessing] = useState(false)
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
    
    loadData()
  }, [user, statusFilter])

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      setLoading(true)
      
      const filter = statusFilter === 'all' ? undefined : statusFilter
      const response = await api.getAllWithdrawalRequests(filter)
      
      const data = response?.data || response
      setRequests(data?.requests || [])
      setSummary(data?.summary || null)
      setLastUpdated(new Date())
      
    } catch (error) {
      console.error('Gagal memuat penarikan:', error)
      toast.error('Gagal memuat permintaan penarikan')
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadData(true)
  }

  const handleViewDetail = async (request: WithdrawalRequest) => {
    try {
      const response = await api.getWithdrawalRequestById(request.id)
      const detailData = response?.data || response
      
      setSelectedRequest(detailData?.request || request)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Gagal memuat detail:', error)
      setSelectedRequest(request)
      setShowDetailModal(true)
    }
  }

  const handleApprove = (approve: boolean) => {
    if (!selectedRequest) return
    
    if (!approve && !rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi')
      return
    }
    
    setShowApproveModal(true)
  }

  const confirmApproval = async () => {
    if (!selectedRequest) return
    
    setProcessing(true)
    try {
      const isApproval = !rejectionReason.trim()
      
      await api.approveWithdrawal(selectedRequest.id, {
        approve: isApproval,
        adminNotes: adminNotes || undefined,
        rejectionReason: rejectionReason || undefined
      })
      
      toast.success(
        isApproval 
          ? 'Penarikan berhasil disetujui!' 
          : 'Penarikan ditolak'
      )
      
      setShowApproveModal(false)
      setShowDetailModal(false)
      setSelectedRequest(null)
      setAdminNotes('')
      setRejectionReason('')
      
      loadData()
      
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal memproses penarikan')
    } finally {
      setProcessing(false)
    }
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  if (loading && !refreshing) {
    return <LoadingSkeleton />
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', icon: 'text-yellow-400' }
      case 'approved': return { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', icon: 'text-blue-400' }
      case 'completed': return { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', icon: 'text-green-400' }
      case 'rejected': return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', icon: 'text-red-400' }
      default: return { bg: 'bg-slate-500/10', border: 'border-slate-500/20', text: 'text-slate-400', icon: 'text-slate-400' }
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu'
      case 'approved': return 'Disetujui'
      case 'completed': return 'Selesai'
      case 'rejected': return 'Ditolak'
      default: return status
    }
  }

  const statsData = summary ? [
    { label: 'Total', value: summary.total, color: 'blue', icon: FileText },
    { label: 'Menunggu', value: summary.pending, color: 'yellow', icon: Clock },
    { label: 'Disetujui', value: summary.approved, color: 'indigo', icon: CheckCircle },
    { label: 'Selesai', value: summary.completed, color: 'green', icon: CheckCircle },
    { label: 'Ditolak', value: summary.rejected, color: 'red', icon: XCircle },
  ] : []

  const colorClasses: Record<string, { bg: string, icon: string, hover: string }> = {
    blue: { bg: 'bg-blue-500/10', icon: 'text-blue-400', hover: 'hover:bg-blue-500/20' },
    indigo: { bg: 'bg-indigo-500/10', icon: 'text-indigo-400', hover: 'hover:bg-indigo-500/20' },
    yellow: { bg: 'bg-yellow-500/10', icon: 'text-yellow-400', hover: 'hover:bg-yellow-500/20' },
    green: { bg: 'bg-green-500/10', icon: 'text-green-400', hover: 'hover:bg-green-500/20' },
    red: { bg: 'bg-red-500/10', icon: 'text-red-400', hover: 'hover:bg-red-500/20' },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header - Compact */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Manajemen Penarikan</h1>
            <p className="text-sm text-slate-400">Tinjau dan setujui penarikan pengguna</p>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-slate-500">
                {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Summary Stats - Compact Grid */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {statsData.map((stat, idx) => {
              const colors = colorClasses[stat.color]
              const Icon = stat.icon
              return (
                <div 
                  key={idx} 
                  className={`bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded ${colors.bg} flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${colors.icon}`} />
                    </div>
                    <span className="text-xs text-slate-400">{stat.label}</span>
                  </div>
                  <div className={`text-2xl font-bold ${colors.icon}`}>
                    {stat.value}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Filter Toggle - Compact */}
        <div className="flex items-center justify-between">
          <div className="inline-flex bg-white/5 rounded-lg p-1 backdrop-blur-sm border border-white/10">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'pending', label: 'Menunggu' },
              { id: 'approved', label: 'Disetujui' },
              { id: 'completed', label: 'Selesai' },
              { id: 'rejected', label: 'Ditolak' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id as StatusFilter)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  statusFilter === filter.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-slate-500">
            {requests.length} permintaan
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white/5 rounded-lg border border-white/10 backdrop-blur-sm overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              <h2 className="text-base font-semibold text-white">
                {statusFilter === 'all' ? 'Semua Permintaan' : `Permintaan ${getStatusLabel(statusFilter)}`}
              </h2>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Memuat permintaan...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <FileText className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-base font-semibold text-white mb-2">Tidak ada permintaan</h3>
                <p className="text-sm text-slate-400">
                  {statusFilter === 'all' 
                    ? 'Belum ada permintaan penarikan' 
                    : `Tidak ada permintaan ${getStatusLabel(statusFilter)}`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => {
                  const status = formatWithdrawalStatus(request)
                  const isPending = request.status === 'pending'
                  const statusColors = getStatusColor(request.status)
                  
                  return (
                    <div
                      key={request.id}
                      className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <User className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-semibold text-white">
                              {request.userName || request.userEmail}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-bold border ${statusColors.bg} ${statusColors.border} ${statusColors.text}`}>
                              {getStatusLabel(request.status)}
                            </span>
                          </div>
                          
                          <div className="text-2xl font-bold text-white mb-1">
                            {formatCurrency(request.amount)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span>{formatDate(request.createdAt)}</span>
                            <span>•</span>
                            <span>Saldo: {formatCurrency(request.currentBalance)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleViewDetail(request)}
                          className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-medium transition-colors border border-indigo-500/20"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Detail</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {request.bankAccount && (
                          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                            <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                              <CreditCard className="w-3 h-3" />
                              Rekening Bank
                            </div>
                            <div className="text-sm font-semibold text-white">
                              {request.bankAccount.bankName}
                            </div>
                            <div className="text-xs text-slate-400">
                              {request.bankAccount.accountNumber}
                            </div>
                          </div>
                        )}

                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="text-xs text-slate-400 mb-1">Verifikasi</div>
                          <div className="flex items-center gap-3 text-xs">
                            {request.ktpVerified ? (
                              <span className="flex items-center gap-1 text-green-400">
                                <Shield className="w-3 h-3" />
                                KTP
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-1">
                                <Shield className="w-3 h-3" />
                                KTP
                              </span>
                            )}
                            {request.selfieVerified ? (
                              <span className="flex items-center gap-1 text-green-400">
                                <Camera className="w-3 h-3" />
                                Selfie
                              </span>
                            ) : (
                              <span className="text-slate-500 flex items-center gap-1">
                                <Camera className="w-3 h-3" />
                                Selfie
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {isPending && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setRejectionReason('')
                              handleApprove(true)
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg font-medium transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Setujui
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setAdminNotes('')
                              setRejectionReason('')
                              setShowDetailModal(true)
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg font-medium transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Tolak
                          </button>
                        </div>
                      )}

                      {request.rejectionReason && (
                        <div className="mt-3 flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-red-400 mb-1">Alasan Penolakan:</div>
                            <div className="text-sm text-red-300">{request.rejectionReason}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setShowDetailModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-white/10">
              <div className="p-5 sm:p-6 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Detail Permintaan Penarikan</h2>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getStatusColor(selectedRequest.status).bg} ${getStatusColor(selectedRequest.status).border} ${getStatusColor(selectedRequest.status).text}`}>
                    {getStatusLabel(selectedRequest.status)}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* Amount */}
                <div>
                  <div className="text-sm text-slate-400 mb-1">Jumlah Penarikan</div>
                  <div className="text-3xl font-bold text-white">
                    {formatCurrency(selectedRequest.amount)}
                  </div>
                </div>

                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Email Pengguna</div>
                    <div className="text-sm font-semibold text-white">{selectedRequest.userEmail}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Nama Lengkap</div>
                    <div className="text-sm font-semibold text-white">{selectedRequest.userName || '-'}</div>
                  </div>
                </div>

                {/* Bank Account */}
                {selectedRequest.bankAccount && (
                  <div className="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-5 h-5 text-indigo-400" />
                      <span className="font-semibold text-indigo-400">Detail Rekening Bank</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Bank:</span>
                        <span className="font-semibold text-white">{selectedRequest.bankAccount.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nomor Rekening:</span>
                        <span className="font-semibold text-white">{selectedRequest.bankAccount.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Nama Pemilik:</span>
                        <span className="font-semibold text-white">{selectedRequest.bankAccount.accountHolderName}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification Status */}
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="font-semibold text-white mb-3">Status Verifikasi</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center border ${
                        selectedRequest.ktpVerified ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                      }`}>
                        <Shield className={`w-6 h-6 ${
                          selectedRequest.ktpVerified ? 'text-green-400' : 'text-red-400'
                        }`} />
                      </div>
                      <div className="text-xs font-semibold text-slate-300">
                        {selectedRequest.ktpVerified ? 'KTP Terverifikasi' : 'KTP Belum Verifikasi'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center border ${
                        selectedRequest.selfieVerified ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                      }`}>
                        <Camera className={`w-6 h-6 ${
                          selectedRequest.selfieVerified ? 'text-green-400' : 'text-red-400'
                        }`} />
                      </div>
                      <div className="text-xs font-semibold text-slate-300">
                        {selectedRequest.selfieVerified ? 'Selfie Terverifikasi' : 'Selfie Belum Verifikasi'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center border ${
                        selectedRequest.currentBalance >= selectedRequest.amount ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                      }`}>
                        <Wallet className={`w-6 h-6 ${
                          selectedRequest.currentBalance >= selectedRequest.amount ? 'text-green-400' : 'text-red-400'
                        }`} />
                      </div>
                      <div className="text-xs font-semibold text-slate-300">
                        {selectedRequest.currentBalance >= selectedRequest.amount ? 'Saldo Cukup' : 'Saldo Kurang'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-slate-400 mb-1">Saldo Saat Ini</div>
                    <div className="text-lg font-bold text-white">{formatCurrency(selectedRequest.currentBalance)}</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-slate-400 mb-1">Saldo Setelah Penarikan</div>
                    <div className="text-lg font-bold text-slate-300">
                      {formatCurrency(selectedRequest.currentBalance - selectedRequest.amount)}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedRequest.description && (
                  <div>
                    <div className="text-sm text-slate-400 mb-1">Keterangan</div>
                    <div className="text-sm text-white bg-white/5 p-3 rounded-lg border border-white/10">
                      {selectedRequest.description}
                    </div>
                  </div>
                )}

                {/* Request Date */}
                <div>
                  <div className="text-xs text-slate-400 mb-1">Tanggal Permintaan</div>
                  <div className="text-sm font-semibold text-white">{formatDate(selectedRequest.createdAt)}</div>
                </div>

                {/* Action Buttons - Only for Pending */}
                {selectedRequest.status === 'pending' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Catatan Admin (Opsional)</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Tambahkan catatan internal..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-indigo-500 focus:bg-white/10 transition-all focus:outline-none resize-none text-white placeholder-slate-500"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-white mb-2">Alasan Penolakan (Wajib jika menolak)</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Masukkan alasan penolakan..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:border-red-500 focus:bg-white/10 transition-all focus:outline-none resize-none text-white placeholder-slate-500"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(true)}
                        disabled={!selectedRequest.ktpVerified || !selectedRequest.selfieVerified}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 disabled:bg-white/5 disabled:text-slate-500 text-green-400 border border-green-500/30 disabled:border-white/10 rounded-xl font-semibold transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Setujui & Proses
                      </button>
                      <button
                        onClick={() => handleApprove(false)}
                        disabled={!rejectionReason.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 disabled:bg-white/5 disabled:text-slate-500 text-red-400 border border-red-500/30 disabled:border-white/10 rounded-xl font-semibold transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                        Tolak Permintaan
                      </button>
                    </div>
                  </>
                )}

                {/* Rejection Info */}
                {selectedRequest.rejectionReason && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-400 mb-1">Alasan Penolakan:</div>
                        <div className="text-sm text-red-300">{selectedRequest.rejectionReason}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showApproveModal && selectedRequest && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60]" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-white/10">
              <div className="p-6">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border ${
                  rejectionReason ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'
                }`}>
                  {rejectionReason ? (
                    <XCircle className="w-8 h-8 text-red-400" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white text-center mb-2">
                  {rejectionReason ? 'Tolak Penarikan?' : 'Setujui Penarikan?'}
                </h3>
                
                <p className="text-sm text-slate-400 text-center mb-6">
                  {rejectionReason 
                    ? 'Permintaan penarikan akan ditolak dan pengguna akan diberitahu.'
                    : `Ini akan menyetujui dan memproses penarikan ${formatCurrency(selectedRequest.amount)} ke ${selectedRequest.userEmail}.`
                  }
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowApproveModal(false)}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl font-semibold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmApproval}
                    disabled={processing}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 border ${
                      rejectionReason 
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30' 
                        : 'bg-green-500/20 hover:bg-green-500/30 text-green-400 border-green-500/30'
                    }`}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        {rejectionReason ? (
                          <>
                            <XCircle className="w-5 h-5" />
                            Konfirmasi Penolakan
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Konfirmasi Persetujuan
                          </>
                        )}
                      </>
                    )}
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