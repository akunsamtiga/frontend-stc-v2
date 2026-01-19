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
  Shield, Camera, Eye, RefreshCw, Filter
} from 'lucide-react'
import { toast } from 'sonner'

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'completed'

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
    
    loadData()
  }, [user, statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      
      const filter = statusFilter === 'all' ? undefined : statusFilter
      const response = await api.getAllWithdrawalRequests(filter)
      
      const data = response?.data || response
      setRequests(data?.requests || [])
      setSummary(data?.summary || null)
      
    } catch (error) {
      console.error('Failed to load withdrawals:', error)
      toast.error('Failed to load withdrawal requests')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (request: WithdrawalRequest) => {
    try {
      const response = await api.getWithdrawalRequestById(request.id)
      const detailData = response?.data || response
      
      setSelectedRequest(detailData?.request || request)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Failed to load request detail:', error)
      setSelectedRequest(request)
      setShowDetailModal(true)
    }
  }

  const handleApprove = (approve: boolean) => {
    if (!selectedRequest) return
    
    if (!approve && !rejectionReason.trim()) {
      toast.error('Rejection reason is required')
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
          ? 'Withdrawal approved and processed!' 
          : 'Withdrawal rejected'
      )
      
      setShowApproveModal(false)
      setShowDetailModal(false)
      setSelectedRequest(null)
      setAdminNotes('')
      setRejectionReason('')
      
      loadData()
      
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to process withdrawal')
    } finally {
      setProcessing(false)
    }
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
            <span>Admin</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Withdrawal Management</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <ArrowUpFromLine className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Withdrawal Requests</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Review and approve user withdrawals</p>
              </div>
            </div>
            
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {[
              { label: 'Total', value: summary.total, color: 'blue', icon: FileText },
              { label: 'Pending', value: summary.pending, color: 'yellow', icon: Clock },
              { label: 'Approved', value: summary.approved, color: 'blue', icon: CheckCircle },
              { label: 'Completed', value: summary.completed, color: 'green', icon: CheckCircle },
              { label: 'Rejected', value: summary.rejected, color: 'red', icon: XCircle },
            ].map((stat, idx) => {
              const Icon = stat.icon
              return (
                <div key={idx} className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 text-${stat.color}-600`} />
                    <span className="text-xs text-gray-500">{stat.label}</span>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-bold text-${stat.color}-600`}>
                    {stat.value}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">Filter by Status:</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'all', label: 'All Requests' },
              { id: 'pending', label: 'Pending' },
              { id: 'approved', label: 'Approved' },
              { id: 'completed', label: 'Completed' },
              { id: 'rejected', label: 'Rejected' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id as StatusFilter)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                  statusFilter === filter.id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                  {statusFilter === 'all' ? 'All Requests' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Requests`}
                </h2>
              </div>
              <div className="text-sm text-gray-500">
                {requests.length} request{requests.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 lg:p-6">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Loading requests...</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">No requests found</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  {statusFilter === 'all' 
                    ? 'No withdrawal requests yet' 
                    : `No ${statusFilter} requests`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => {
                  const status = formatWithdrawalStatus(request)
                  const isPending = request.status === 'pending'
                  
                  return (
                    <div
                      key={request.id}
                      className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-900">
                              {request.userName || request.userEmail}
                            </span>
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold border ${status.bgClass}`}>
                              {status.label}
                            </span>
                          </div>
                          
                          <div className="text-2xl font-bold text-gray-900 mb-1">
                            {formatCurrency(request.amount)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{formatDate(request.createdAt)}</span>
                            <span>•</span>
                            <span>Balance: {formatCurrency(request.currentBalance)}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleViewDetail(request)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Review</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {request.bankAccount && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                              <CreditCard className="w-3 h-3" />
                              Bank Account
                            </div>
                            <div className="text-sm font-semibold text-gray-900">
                              {request.bankAccount.bankName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {request.bankAccount.accountNumber}
                            </div>
                          </div>
                        )}

                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-500 mb-1">Verification Status</div>
                          <div className="flex items-center gap-2 text-xs">
                            {request.ktpVerified ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <Shield className="w-3 h-3" />
                                KTP ✓
                              </span>
                            ) : (
                              <span className="text-gray-400">KTP ✗</span>
                            )}
                            {request.selfieVerified ? (
                              <span className="flex items-center gap-1 text-green-600">
                                <Camera className="w-3 h-3" />
                                Selfie ✓
                              </span>
                            ) : (
                              <span className="text-gray-400">Selfie ✗</span>
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
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRequest(request)
                              setAdminNotes('')
                              setRejectionReason('')
                              setShowDetailModal(true)
                            }}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}

                      {request.rejectionReason && (
                        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-xs font-semibold text-red-900 mb-1">Rejection Reason:</div>
                            <div className="text-sm text-red-800">{request.rejectionReason}</div>
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowDetailModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-5 sm:p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Withdrawal Request Detail</h2>
                  <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${formatWithdrawalStatus(selectedRequest).bgClass}`}>
                    {formatWithdrawalStatus(selectedRequest).label}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* Amount */}
                <div>
                  <div className="text-sm text-gray-500 mb-1">Withdrawal Amount</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(selectedRequest.amount)}
                  </div>
                </div>

                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">User Email</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedRequest.userEmail}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Full Name</div>
                    <div className="text-sm font-semibold text-gray-900">{selectedRequest.userName || '-'}</div>
                  </div>
                </div>

                {/* Bank Account */}
                {selectedRequest.bankAccount && (
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">Bank Account Details</span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-blue-700">Bank:</span>
                        <span className="font-semibold text-blue-900">{selectedRequest.bankAccount.bankName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Account Number:</span>
                        <span className="font-semibold text-blue-900">{selectedRequest.bankAccount.accountNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-blue-700">Account Holder:</span>
                        <span className="font-semibold text-blue-900">{selectedRequest.bankAccount.accountHolderName}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verification Status */}
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="font-semibold text-gray-900 mb-3">Verification Status</div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        selectedRequest.ktpVerified ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Shield className={`w-6 h-6 ${
                          selectedRequest.ktpVerified ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div className="text-xs font-semibold">
                        {selectedRequest.ktpVerified ? 'KTP Verified' : 'KTP Not Verified'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        selectedRequest.selfieVerified ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <Camera className={`w-6 h-6 ${
                          selectedRequest.selfieVerified ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div className="text-xs font-semibold">
                        {selectedRequest.selfieVerified ? 'Selfie Verified' : 'Selfie Not Verified'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        selectedRequest.currentBalance >= selectedRequest.amount ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <CheckCircle className={`w-6 h-6 ${
                          selectedRequest.currentBalance >= selectedRequest.amount ? 'text-green-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div className="text-xs font-semibold">
                        {selectedRequest.currentBalance >= selectedRequest.amount ? 'Balance OK' : 'Insufficient'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Balance Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Current Balance</div>
                    <div className="text-lg font-bold text-gray-900">{formatCurrency(selectedRequest.currentBalance)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Balance After</div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatCurrency(selectedRequest.currentBalance - selectedRequest.amount)}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedRequest.description && (
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Description</div>
                    <div className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {selectedRequest.description}
                    </div>
                  </div>
                )}

                {/* Request Date */}
                <div>
                  <div className="text-xs text-gray-500 mb-1">Request Date</div>
                  <div className="text-sm font-semibold text-gray-900">{formatDate(selectedRequest.createdAt)}</div>
                </div>

                {/* Action Buttons - Only for Pending */}
                {selectedRequest.status === 'pending' && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Notes (Optional)</label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add internal notes..."
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 focus:border-blue-500 focus:bg-white transition-all focus:outline-none resize-none"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Rejection Reason (Required if rejecting)</label>
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Enter rejection reason..."
                        className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl p-3 focus:border-red-500 focus:bg-white transition-all focus:outline-none resize-none"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(true)}
                        disabled={!selectedRequest.ktpVerified || !selectedRequest.selfieVerified}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve & Process
                      </button>
                      <button
                        onClick={() => handleApprove(false)}
                        disabled={!rejectionReason.trim()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-xl font-semibold transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject Request
                      </button>
                    </div>
                  </>
                )}

                {/* Rejection Info */}
                {selectedRequest.rejectionReason && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-900 mb-1">Rejection Reason:</div>
                        <div className="text-sm text-red-800">{selectedRequest.rejectionReason}</div>
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
              <div className="p-6">
                <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                  rejectionReason ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  {rejectionReason ? (
                    <XCircle className="w-8 h-8 text-red-600" />
                  ) : (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                  {rejectionReason ? 'Reject Withdrawal?' : 'Approve Withdrawal?'}
                </h3>
                
                <p className="text-sm text-gray-600 text-center mb-6">
                  {rejectionReason 
                    ? 'This will reject the withdrawal request and notify the user.'
                    : `This will approve and process ${formatCurrency(selectedRequest.amount)} withdrawal to ${selectedRequest.userEmail}.`
                  }
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowApproveModal(false)}
                    disabled={processing}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmApproval}
                    disabled={processing}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 ${
                      rejectionReason 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {rejectionReason ? (
                          <>
                            <XCircle className="w-5 h-5" />
                            Confirm Rejection
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5" />
                            Confirm Approval
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