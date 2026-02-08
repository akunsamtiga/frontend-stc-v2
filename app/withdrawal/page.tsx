// app/(authenticated)/withdrawal/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { 
  WithdrawalRequest, 
  WithdrawalSummary,
  UserProfile,
  formatWithdrawalStatus,
  WITHDRAWAL_CONFIG
} from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { 
  ArrowUpFromLine, X, AlertCircle, CheckCircle, 
  XCircle, Clock, FileText, Loader2, AlertTriangle,
  Shield, CreditCard, Camera, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

export default function WithdrawalPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [requests, setRequests] = useState<WithdrawalRequest[]>([])
  const [summary, setSummary] = useState<WithdrawalSummary | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [realBalance, setRealBalance] = useState(0)
  
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadData()
  }, [user])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const [requestsRes, profileRes, balanceRes] = await Promise.all([
        api.getMyWithdrawalRequests(),
        api.getProfile(),
        api.getAccountBalance('real')
      ])
      
      // Extract requests
      const requestsData = requestsRes?.data || requestsRes
      setRequests(requestsData?.requests || [])
      setSummary(requestsData?.summary || null)
      
      // Extract profile
      let profileData: UserProfile | null = null
      if (profileRes && typeof profileRes === 'object') {
        if ('data' in profileRes && profileRes.data) {
          profileData = profileRes.data as UserProfile
        } else if ('user' in profileRes) {
          profileData = profileRes as UserProfile
        }
      }
      setProfile(profileData)
      
      // Extract balance
      const balanceData = balanceRes?.data || balanceRes
      setRealBalance(balanceData?.balance || 0)
      
    } catch (error) {
      console.error('Gagal memuat data penarikan:', error)
      toast.error('Gagal memuat data penarikan')
    } finally {
      setLoading(false)
    }
  }

  const canRequestWithdrawal = (): { can: boolean; reason?: string } => {
    if (!profile) {
      return { can: false, reason: 'Profil belum dimuat' }
    }

    const profileInfo = profile.profileInfo
    
    if (!profileInfo?.identity?.isVerified) {
      return { can: false, reason: 'Verifikasi KTP diperlukan' }
    }
    
    if (!profileInfo?.selfie?.isVerified) {
      return { can: false, reason: 'Verifikasi selfie diperlukan' }
    }
    
    if (!profileInfo?.bankAccount?.accountNumber) {
      return { can: false, reason: 'Rekening bank diperlukan' }
    }
    
    if (realBalance < WITHDRAWAL_CONFIG.MIN_AMOUNT) {
      return { 
        can: false, 
        reason: `Saldo minimum: ${formatCurrency(WITHDRAWAL_CONFIG.MIN_AMOUNT)}` 
      }
    }
    
    const hasPending = requests.some(r => r.status === 'pending')
    if (hasPending) {
      return { can: false, reason: 'Anda memiliki permintaan penarikan yang sedang diproses' }
    }
    
    return { can: true }
  }

  const handleRequestWithdrawal = async () => {
    const amt = parseFloat(amount)
    
    if (isNaN(amt) || amt <= 0) {
      toast.error('Jumlah tidak valid')
      return
    }
    
    if (amt < WITHDRAWAL_CONFIG.MIN_AMOUNT) {
      toast.error(`Minimum penarikan: ${formatCurrency(WITHDRAWAL_CONFIG.MIN_AMOUNT)}`)
      return
    }
    
    if (amt > realBalance) {
      toast.error('Saldo tidak mencukupi')
      return
    }

    setSubmitting(true)
    try {
      await api.requestWithdrawal({
        amount: amt,
        description: description || 'Permintaan penarikan'
      })
      
      toast.success('Permintaan penarikan berhasil diajukan!')
      setShowRequestModal(false)
      setAmount('')
      setDescription('')
      loadData()
      
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal mengajukan penarikan')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancelRequest = async (requestId: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan permintaan penarikan ini?')) {
      return
    }

    setCancelling(requestId)
    try {
      await api.cancelWithdrawalRequest(requestId)
      toast.success('Permintaan penarikan dibatalkan')
      loadData()
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Gagal membatalkan permintaan')
    } finally {
      setCancelling(null)
    }
  }

  const quickAmounts = [100000, 250000, 500000, 1000000, 2500000, 5000000]
    .filter(amt => amt <= realBalance && amt >= WITHDRAWAL_CONFIG.MIN_AMOUNT)

  if (!user) return null

  const { can: canRequest, reason: cantRequestReason } = canRequestWithdrawal()

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Penarikan</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <ArrowUpFromLine className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Penarikan</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Ajukan penarikan dari akun Real Anda</p>
              </div>
            </div>
            
            <button
              onClick={() => loadData()}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          </div>
        </div>

        {/* Balance & Request Button */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-xs sm:text-sm text-gray-500 mb-1">Saldo Tersedia</div>
                <div className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {formatCurrency(realBalance)}
                </div>
              </div>
              
              <button
                onClick={() => setShowRequestModal(true)}
                disabled={!canRequest}
                className="flex items-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors shadow-sm disabled:cursor-not-allowed"
              >
                <ArrowUpFromLine className="w-5 h-5" />
                <span>Ajukan Penarikan</span>
              </button>
            </div>

            {!canRequest && cantRequestReason && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">{cantRequestReason}</p>
              </div>
            )}

            {/* Requirements Checklist */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm font-semibold text-gray-900 mb-3">Persyaratan Penarikan:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { 
                    label: 'KTP Terverifikasi', 
                    met: profile?.profileInfo?.identity?.isVerified || false,
                    icon: Shield
                  },
                  { 
                    label: 'Selfie Terverifikasi', 
                    met: profile?.profileInfo?.selfie?.isVerified || false,
                    icon: Camera
                  },
                  { 
                    label: 'Rekening Bank Ditambahkan', 
                    met: !!profile?.profileInfo?.bankAccount?.accountNumber,
                    icon: CreditCard
                  },
                  { 
                    label: `Min. ${formatCurrency(WITHDRAWAL_CONFIG.MIN_AMOUNT)}`, 
                    met: realBalance >= WITHDRAWAL_CONFIG.MIN_AMOUNT,
                    icon: ArrowUpFromLine
                  },
                ].map((req, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    {req.met ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-300" />
                    )}
                    <span className={`text-xs sm:text-sm ${req.met ? 'text-gray-900' : 'text-gray-400'}`}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Requests List - Now appears directly after Balance section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">Riwayat Penarikan</h2>
            </div>
          </div>

          <div className="p-4 sm:p-5 lg:p-6">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Memuat riwayat penarikan...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">Belum ada penarikan</h3>
                <p className="text-sm sm:text-base text-gray-500">Anda belum pernah mengajukan penarikan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => {
                  const status = formatWithdrawalStatus(request)
                  
                  return (
                    <div
                      key={request.id}
                      className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg font-bold text-gray-900">
                              {formatCurrency(request.amount)}
                            </span>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${status.bgClass}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(request.createdAt)}
                          </div>
                        </div>

                        {status.canCancel && (
                          <button
                            onClick={() => handleCancelRequest(request.id)}
                            disabled={cancelling === request.id}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                          >
                            {cancelling === request.id ? 'Membatalkan...' : 'Batalkan'}
                          </button>
                        )}
                      </div>

                      {request.description && (
                        <div className="text-sm text-gray-600 mb-3">
                          {request.description}
                        </div>
                      )}

                      {request.bankAccount && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="text-xs text-gray-500 mb-1">Rekening Bank</div>
                          <div className="text-sm font-semibold text-gray-900">
                            {request.bankAccount.bankName} - {request.bankAccount.accountNumber}
                          </div>
                          <div className="text-xs text-gray-600">
                            {request.bankAccount.accountHolderName}
                          </div>
                        </div>
                      )}

                      {request.status === 'rejected' && request.rejectionReason && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-red-900 mb-1">Alasan Penolakan:</div>
                            <div className="text-sm text-red-800">{request.rejectionReason}</div>
                          </div>
                        </div>
                      )}

                      {request.status === 'completed' && request.reviewedAt && (
                        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-green-900 mb-1">Selesai</div>
                            <div className="text-xs text-green-800">
                              Diproses pada {formatDate(request.reviewedAt)}
                            </div>
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

      {/* Request Modal */}
      {showRequestModal && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowRequestModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-5 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-50 rounded-xl flex items-center justify-center">
                      <ArrowUpFromLine className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-bold text-gray-900">Ajukan Penarikan</h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Maks: {formatCurrency(realBalance)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-gray-100"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Jumlah (IDR)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    min={WITHDRAWAL_CONFIG.MIN_AMOUNT}
                    max={realBalance}
                    className="w-full text-center text-3xl font-bold bg-gray-50 border-2 border-gray-200 rounded-xl py-4 focus:border-red-500 focus:bg-white transition-all focus:outline-none"
                    autoFocus
                  />
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Minimum: {formatCurrency(WITHDRAWAL_CONFIG.MIN_AMOUNT)}
                  </div>
                </div>

                {quickAmounts.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Pilih Cepat</label>
                    <div className="grid grid-cols-3 gap-2">
                      {quickAmounts.map((preset) => (
                        <button
                          key={preset}
                          onClick={() => setAmount(preset.toString())}
                          className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                            amount === preset.toString()
                              ? 'bg-red-500 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                          }`}
                        >
                          {preset >= 1000000 ? `${preset/1000000}jt` : `${preset/1000}rb`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Keterangan (Opsional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Masukkan alasan penarikan..."
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 focus:border-red-500 focus:bg-white transition-all focus:outline-none resize-none"
                    rows={3}
                  />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-blue-900 mb-1">Waktu Pemrosesan</div>
                      <div className="text-xs text-blue-800">
                        Penarikan diproses dalam 1-2 hari kerja setelah disetujui admin.
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleRequestWithdrawal}
                  disabled={submitting}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Mengajukan...
                    </>
                  ) : (
                    'Ajukan Penarikan'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}