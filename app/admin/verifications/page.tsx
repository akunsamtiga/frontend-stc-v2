// app/admin/verifications/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { toast } from 'sonner'
import { 
  Shield, CheckCircle, XCircle, Clock, User, 
  CreditCard, Camera, RefreshCw, Search,
  Eye, Calendar, Loader2
} from 'lucide-react'
import type { PendingVerifications, VerifyDocumentRequest } from '@/types'

type VerificationTab = 'ktp' | 'selfie'

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
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[...Array(3)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
)

export default function AdminVerificationsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [verifications, setVerifications] = useState<PendingVerifications | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState<VerificationTab>('ktp')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Modal states
  const [reviewingKTP, setReviewingKTP] = useState<any>(null)
  const [reviewingSelfie, setReviewingSelfie] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      router.push('/trading')
      return
    }
    
    loadVerifications()
  }, [user, router])

  const loadVerifications = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      
      const response = await api.getPendingVerifications()
      
      if (response && response.data) {
        setVerifications(response.data)
        setLastUpdated(new Date())
      }
    } catch (error: any) {
      console.error('Gagal memuat verifikasi:', error)
      toast.error(error?.message || 'Gagal memuat verifikasi')
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    loadVerifications(true)
  }

  const handleVerifyKTP = async (userId: string, approve: boolean) => {
    if (!approve && !rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi')
      return
    }

    try {
      setProcessing(true)
      
      const data: VerifyDocumentRequest = {
        approve,
        adminNotes: adminNotes.trim() || undefined,
        rejectionReason: approve ? undefined : rejectionReason.trim()
      }

      await api.verifyKTP(userId, data)
      
      toast.success(approve 
        ? 'KTP berhasil diverifikasi!' 
        : 'Verifikasi KTP ditolak'
      )
      
      setReviewingKTP(null)
      setRejectionReason('')
      setAdminNotes('')
      
      await loadVerifications()
      
    } catch (error: any) {
      console.error('Gagal verifikasi KTP:', error)
      toast.error(error?.message || 'Gagal memproses verifikasi')
    } finally {
      setProcessing(false)
    }
  }

  const handleVerifySelfie = async (userId: string, approve: boolean) => {
    if (!approve && !rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi')
      return
    }

    try {
      setProcessing(true)
      
      const data: VerifyDocumentRequest = {
        approve,
        adminNotes: adminNotes.trim() || undefined,
        rejectionReason: approve ? undefined : rejectionReason.trim()
      }

      await api.verifySelfie(userId, data)
      
      toast.success(approve 
        ? 'Selfie berhasil diverifikasi!' 
        : 'Verifikasi selfie ditolak'
      )
      
      setReviewingSelfie(null)
      setRejectionReason('')
      setAdminNotes('')
      
      await loadVerifications()
      
    } catch (error: any) {
      console.error('Gagal verifikasi selfie:', error)
      toast.error(error?.message || 'Gagal memproses verifikasi')
    } finally {
      setProcessing(false)
    }
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  if (loading) {
    return <LoadingSkeleton />
  }

  const ktpList = verifications?.ktpVerifications || []
  const selfieList = verifications?.selfieVerifications || []

  const filteredKTP = ktpList.filter(v => 
    v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSelfie = selfieList.filter(v =>
    v.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Manajemen Verifikasi</h1>
            <p className="text-sm text-slate-400">Tinjau dan setujui verifikasi pengguna</p>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-yellow-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-yellow-400" />
              </div>
              <span className="text-xs text-slate-400">Total Menunggu</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {verifications?.summary.total || 0}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-xs text-slate-400">KTP Menunggu</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {verifications?.summary.totalPendingKTP || 0}
            </div>
          </div>

          <div className="bg-white/5 rounded-lg p-4 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded bg-sky-500/20 flex items-center justify-center">
                <Camera className="w-4 h-4 text-sky-400" />
              </div>
              <span className="text-xs text-slate-400">Selfie Menunggu</span>
            </div>
            <div className="text-2xl font-bold text-sky-400">
              {verifications?.summary.totalPendingSelfie || 0}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan email atau nama..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:bg-white/10 transition-all text-white placeholder-slate-500 text-sm"
          />
        </div>

        {/* Tabs */}
        <div className="inline-flex bg-white/5 rounded-lg p-1 backdrop-blur-sm border border-white/10">
          <button
            onClick={() => setSelectedTab('ktp')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              selectedTab === 'ktp'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            KTP ({filteredKTP.length})
          </button>
          
          <button
            onClick={() => setSelectedTab('selfie')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              selectedTab === 'selfie'
                ? 'bg-sky-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            Selfie ({filteredSelfie.length})
          </button>
        </div>

        {/* Content */}
        {selectedTab === 'ktp' ? (
          <div className="space-y-3">
            {filteredKTP.length === 0 ? (
              <div className="bg-white/5 rounded-lg p-12 text-center border border-white/10 backdrop-blur-sm">
                <CreditCard className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">Tidak ada verifikasi KTP yang menunggu</p>
              </div>
            ) : (
              filteredKTP.map((verification) => (
                <div key={verification.userId} className="bg-white/5 rounded-lg p-5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                        <User className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{verification.fullName || 'Tanpa Nama'}</h3>
                        <p className="text-sm text-slate-400">{verification.email}</p>
                        {verification.documentNumber && (
                          <p className="text-xs text-slate-500 mt-1">
                            {verification.documentType?.toUpperCase()}: {verification.documentNumber}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-xs text-slate-500">
                            Diunggah: {new Date(verification.uploadedAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setReviewingKTP(verification)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Tinjau
                    </button>
                  </div>

                  {/* Photo Previews */}
                  <div className="grid grid-cols-2 gap-4">
                    {verification.photoFront && (
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Foto Depan</p>
                        <img
                          src={verification.photoFront.url}
                          alt="KTP Depan"
                          className="w-full h-40 object-cover rounded-lg border border-white/10"
                        />
                      </div>
                    )}
                    {verification.photoBack && (
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Foto Belakang</p>
                        <img
                          src={verification.photoBack.url}
                          alt="KTP Belakang"
                          className="w-full h-40 object-cover rounded-lg border border-white/10"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSelfie.length === 0 ? (
              <div className="bg-white/5 rounded-lg p-12 text-center border border-white/10 backdrop-blur-sm">
                <Camera className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                <p className="text-slate-400">Tidak ada verifikasi selfie yang menunggu</p>
              </div>
            ) : (
              filteredSelfie.map((verification) => (
                <div key={verification.userId} className="bg-white/5 rounded-lg p-5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-sky-500/10 rounded-full flex items-center justify-center flex-shrink-0 border border-sky-500/20">
                        <User className="w-6 h-6 text-sky-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white">{verification.fullName || 'Tanpa Nama'}</h3>
                        <p className="text-sm text-slate-400">{verification.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-xs text-slate-500">
                            Diunggah: {new Date(verification.uploadedAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setReviewingSelfie(verification)}
                      className="flex items-center gap-2 px-4 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Tinjau
                    </button>
                  </div>

                  {/* Selfie Preview */}
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Foto Selfie</p>
                    <img
                      src={verification.photoUrl}
                      alt="Selfie"
                      className="w-full max-w-md h-64 object-cover rounded-lg border border-white/10"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* KTP Review Modal */}
      {reviewingKTP && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setReviewingKTP(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-slate-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-white/10">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Tinjau Verifikasi KTP</h2>
                  <button
                    onClick={() => setReviewingKTP(null)}
                    className="p-2 hover:bg-white/5 text-slate-400 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="font-bold text-white mb-3">Informasi Pengguna</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Nama</p>
                      <p className="font-medium text-white">{reviewingKTP.fullName || 'Tanpa Nama'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Email</p>
                      <p className="font-medium text-white">{reviewingKTP.email}</p>
                    </div>
                    {reviewingKTP.documentNumber && (
                      <div>
                        <p className="text-slate-400">Nomor Dokumen</p>
                        <p className="font-medium text-white">{reviewingKTP.documentNumber}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-400">Diunggah</p>
                      <p className="font-medium text-white">
                        {new Date(reviewingKTP.uploadedAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Photos */}
                <div>
                  <h3 className="font-bold text-white mb-4">Foto Dokumen</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {reviewingKTP.photoFront && (
                      <div>
                        <p className="text-sm text-slate-400 mb-2">Foto Depan</p>
                        <img
                          src={reviewingKTP.photoFront.url}
                          alt="KTP Depan"
                          className="w-full h-64 object-contain bg-white/5 rounded-lg border border-white/10"
                        />
                      </div>
                    )}
                    {reviewingKTP.photoBack && (
                      <div>
                        <p className="text-sm text-slate-400 mb-2">Foto Belakang</p>
                        <img
                          src={reviewingKTP.photoBack.url}
                          alt="KTP Belakang"
                          className="w-full h-64 object-contain bg-white/5 rounded-lg border border-white/10"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Catatan Admin (Opsional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Tambahkan catatan tentang verifikasi ini..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-blue-500 focus:bg-white/10 transition-all text-white placeholder-slate-500 resize-none"
                    rows={3}
                  />
                </div>

                {/* Rejection Reason */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Alasan Penolakan (Wajib jika menolak)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Contoh: Foto buram, dokumen kadaluarsa, dll."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-red-500 focus:bg-white/10 transition-all text-white placeholder-slate-500 resize-none"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerifyKTP(reviewingKTP.userId, true)}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {processing ? 'Memproses...' : 'Setujui'}
                  </button>
                  
                  <button
                    onClick={() => handleVerifyKTP(reviewingKTP.userId, false)}
                    disabled={processing || !rejectionReason.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    {processing ? 'Memproses...' : 'Tolak'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Selfie Review Modal */}
      {reviewingSelfie && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" onClick={() => setReviewingSelfie(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto border border-white/10">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">Tinjau Verifikasi Selfie</h2>
                  <button
                    onClick={() => setReviewingSelfie(null)}
                    className="p-2 hover:bg-white/5 text-slate-400 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* User Info */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h3 className="font-bold text-white mb-3">Informasi Pengguna</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400">Nama</p>
                      <p className="font-medium text-white">{reviewingSelfie.fullName || 'Tanpa Nama'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Email</p>
                      <p className="font-medium text-white">{reviewingSelfie.email}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-slate-400">Diunggah</p>
                      <p className="font-medium text-white">
                        {new Date(reviewingSelfie.uploadedAt).toLocaleString('id-ID')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Selfie Photo */}
                <div>
                  <h3 className="font-bold text-white mb-4">Foto Selfie</h3>
                  <img
                    src={reviewingSelfie.photoUrl}
                    alt="Selfie"
                    className="w-full max-h-96 object-contain bg-white/5 rounded-lg border border-white/10"
                  />
                </div>

                {/* Admin Notes */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Catatan Admin (Opsional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Tambahkan catatan tentang verifikasi ini..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-sky-500 focus:bg-white/10 transition-all text-white placeholder-slate-500 resize-none"
                    rows={3}
                  />
                </div>

                {/* Rejection Reason */}
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Alasan Penolakan (Wajib jika menolak)
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Contoh: Wajah tidak jelas, tidak cocok dengan KTP, dll."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-3 focus:border-red-500 focus:bg-white/10 transition-all text-white placeholder-slate-500 resize-none"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleVerifySelfie(reviewingSelfie.userId, true)}
                    disabled={processing}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="w-5 h-5" />
                    {processing ? 'Memproses...' : 'Setujui'}
                  </button>
                  
                  <button
                    onClick={() => handleVerifySelfie(reviewingSelfie.userId, false)}
                    disabled={processing || !rejectionReason.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    {processing ? 'Memproses...' : 'Tolak'}
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