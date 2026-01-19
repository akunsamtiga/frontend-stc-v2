'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { toast } from 'sonner'
import { 
  Shield, CheckCircle, XCircle, Clock, User, 
  CreditCard, Camera, RefreshCw, Search,
  Eye, Calendar
} from 'lucide-react'
import type { PendingVerifications, VerifyDocumentRequest } from '@/types'

export default function AdminVerificationsPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [verifications, setVerifications] = useState<PendingVerifications | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'ktp' | 'selfie'>('ktp')
  const [searchQuery, setSearchQuery] = useState('')
  
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
      }
    } catch (error: any) {
      console.error('Failed to load verifications:', error)
      toast.error(error?.message || 'Failed to load verifications')
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  const handleVerifyKTP = async (userId: string, approve: boolean) => {
    if (!approve && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
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
        ? 'KTP verified successfully!' 
        : 'KTP verification rejected'
      )
      
      setReviewingKTP(null)
      setRejectionReason('')
      setAdminNotes('')
      
      await loadVerifications()
      
    } catch (error: any) {
      console.error('Verify KTP error:', error)
      toast.error(error?.message || 'Failed to process verification')
    } finally {
      setProcessing(false)
    }
  }

  const handleVerifySelfie = async (userId: string, approve: boolean) => {
    if (!approve && !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
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
        ? 'Selfie verified successfully!' 
        : 'Selfie verification rejected'
      )
      
      setReviewingSelfie(null)
      setRejectionReason('')
      setAdminNotes('')
      
      await loadVerifications()
      
    } catch (error: any) {
      console.error('Verify Selfie error:', error)
      toast.error(error?.message || 'Failed to process verification')
    } finally {
      setProcessing(false)
    }
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
              <p className="text-gray-600">Loading verifications...</p>
            </div>
          </div>
        </div>
      </div>
    )
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
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Verification Management</h1>
                <p className="text-sm text-gray-500">Review and approve user verifications</p>
              </div>
            </div>
            
            <button
              onClick={() => loadVerifications(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="font-medium">
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-sm text-gray-500">Total Pending</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {verifications?.summary.total || 0}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">KTP Pending</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {verifications?.summary.totalPendingKTP || 0}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">Selfie Pending</span>
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {verifications?.summary.totalPendingSelfie || 0}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setSelectedTab('ktp')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === 'ktp'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              KTP Verification ({filteredKTP.length})
            </div>
          </button>
          
          <button
            onClick={() => setSelectedTab('selfie')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedTab === 'selfie'
                ? 'bg-purple-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Selfie Verification ({filteredSelfie.length})
            </div>
          </button>
        </div>

        {/* Content */}
        {selectedTab === 'ktp' ? (
          <div className="space-y-4">
            {filteredKTP.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No pending KTP verifications</p>
              </div>
            ) : (
              filteredKTP.map((verification) => (
                <div key={verification.userId} className="bg-white rounded-xl p-6 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{verification.fullName || 'No Name'}</h3>
                        <p className="text-sm text-gray-500">{verification.email}</p>
                        {verification.documentNumber && (
                          <p className="text-xs text-gray-400 mt-1">
                            {verification.documentType?.toUpperCase()}: {verification.documentNumber}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Uploaded: {new Date(verification.uploadedAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setReviewingKTP(verification)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </div>

                  {/* Photo Previews */}
                  <div className="grid grid-cols-2 gap-4">
                    {verification.photoFront && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Front Photo</p>
                        <img
                          src={verification.photoFront.url}
                          alt="KTP Front"
                          className="w-full h-40 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                    {verification.photoBack && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Back Photo</p>
                        <img
                          src={verification.photoBack.url}
                          alt="KTP Back"
                          className="w-full h-40 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSelfie.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No pending selfie verifications</p>
              </div>
            ) : (
              filteredSelfie.map((verification) => (
                <div key={verification.userId} className="bg-white rounded-xl p-6 border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{verification.fullName || 'No Name'}</h3>
                        <p className="text-sm text-gray-500">{verification.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            Uploaded: {new Date(verification.uploadedAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => setReviewingSelfie(verification)}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </div>

                  {/* Selfie Preview */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Selfie Photo</p>
                    <img
                      src={verification.photoUrl}
                      alt="Selfie"
                      className="w-full max-w-md h-64 object-cover rounded-lg border border-gray-200"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Review KTP Verification</h2>
                <button
                  onClick={() => setReviewingKTP(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{reviewingKTP.fullName || 'No Name'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{reviewingKTP.email}</p>
                  </div>
                  {reviewingKTP.documentNumber && (
                    <div>
                      <p className="text-gray-500">Document Number</p>
                      <p className="font-medium">{reviewingKTP.documentNumber}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-gray-500">Uploaded</p>
                    <p className="font-medium">
                      {new Date(reviewingKTP.uploadedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Document Photos</h3>
                <div className="grid grid-cols-2 gap-4">
                  {reviewingKTP.photoFront && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Front Photo</p>
                      <img
                        src={reviewingKTP.photoFront.url}
                        alt="KTP Front"
                        className="w-full h-64 object-contain bg-gray-100 rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                  {reviewingKTP.photoBack && (
                    <div>
                      <p className="text-sm text-gray-500 mb-2">Back Photo</p>
                      <img
                        src={reviewingKTP.photoBack.url}
                        alt="KTP Back"
                        className="w-full h-64 object-contain bg-gray-100 rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this verification..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Rejection Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (Required if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Photo is unclear, document expired, etc."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleVerifyKTP(reviewingKTP.userId, true)}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  {processing ? 'Processing...' : 'Approve'}
                </button>
                
                <button
                  onClick={() => handleVerifyKTP(reviewingKTP.userId, false)}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  {processing ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selfie Review Modal */}
      {reviewingSelfie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Review Selfie Verification</h2>
                <button
                  onClick={() => setReviewingSelfie(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-900 mb-2">User Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="font-medium">{reviewingSelfie.fullName || 'No Name'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">{reviewingSelfie.email}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-500">Uploaded</p>
                    <p className="font-medium">
                      {new Date(reviewingSelfie.uploadedAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Selfie Photo */}
              <div>
                <h3 className="font-bold text-gray-900 mb-4">Selfie Photo</h3>
                <img
                  src={reviewingSelfie.photoUrl}
                  alt="Selfie"
                  className="w-full max-h-96 object-contain bg-gray-100 rounded-lg border border-gray-200"
                />
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this verification..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />
              </div>

              {/* Rejection Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason (Required if rejecting)
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g., Face not clear, not matching ID, etc."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => handleVerifySelfie(reviewingSelfie.userId, true)}
                  disabled={processing}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  {processing ? 'Processing...' : 'Approve'}
                </button>
                
                <button
                  onClick={() => handleVerifySelfie(reviewingSelfie.userId, false)}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  {processing ? 'Processing...' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}