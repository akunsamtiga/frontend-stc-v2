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
  TrendingUp, AlertCircle
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

export default function VoucherManagementPage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [vouchers, setVouchers] = useState<VoucherWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null)
  const [voucherStats, setVoucherStats] = useState<VoucherStatistics | null>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      router.push('/dashboard')
      return
    }
    loadVouchers()
  }, [user, router, filterActive, currentPage])

  const loadVouchers = async () => {
    try {
      setLoading(true)
      const options: any = { page: currentPage, limit: 20 }
      
      if (filterActive !== 'all') {
        options.isActive = filterActive === 'active'
      }
      
      console.log('🔍 Loading vouchers with options:', options)
      
      const response: any = await api.getAllVouchers(options)
      
      console.log('📦 Full response:', response)
      
      // ✅ CORRECT: Based on actual backend structure
      // Backend returns nested structure: response.data.data.vouchers
      let vouchersData: Voucher[] = []
      let paginationData: any = null
      
      if (response?.data) {
        console.log('📦 response.data:', response.data)
        console.log('📦 response.data keys:', Object.keys(response.data))
        
        // Check for nested data.data structure (actual backend format)
        if (response.data.data?.vouchers && Array.isArray(response.data.data.vouchers)) {
          console.log('✅ Found vouchers at response.data.data.vouchers (nested)')
          vouchersData = response.data.data.vouchers
          paginationData = response.data.data.pagination
        }
        // Check if response.data has vouchers property directly
        else if (response.data.vouchers && Array.isArray(response.data.vouchers)) {
          console.log('✅ Found vouchers at response.data.vouchers')
          vouchersData = response.data.vouchers
          paginationData = response.data.pagination
        }
        // Check if response.data itself is the vouchers/pagination object
        else if (Array.isArray(response.data)) {
          console.log('✅ response.data is array directly')
          vouchersData = response.data
        }
        else {
          console.log('⚠️ Unexpected data structure:', response.data)
        }
      }
      // Fallback: check if response has vouchers directly
      else if (response?.vouchers && Array.isArray(response.vouchers)) {
        console.log('✅ Found vouchers at response.vouchers (direct)')
        vouchersData = response.vouchers
        paginationData = response.pagination
      }
      
      console.log('📊 Loaded vouchers count:', vouchersData.length)
      console.log('📊 First voucher:', vouchersData[0])
      console.log('📄 Pagination:', paginationData)
      
      setVouchers(vouchersData)
      
      if (paginationData) {
        setTotalPages(paginationData.totalPages || 1)
      } else {
        setTotalPages(1)
      }
      
    } catch (error: any) {
      console.error('❌ Load vouchers error:', error)
      console.error('❌ Error response:', error.response)
      
      if (error.response?.status === 404) {
        toast.error('Voucher endpoint not found')
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.')
        router.push('/')
      } else if (error.response?.status === 403) {
        toast.error('Access denied')
        router.push('/dashboard')
      } else {
        toast.error(error.message || 'Failed to load vouchers')
      }
      
      setVouchers([])
    } finally {
      setLoading(false)
    }
  }

  const loadVoucherStatistics = async (voucherId: string) => {
    try {
      const response: any = await api.getVoucherStatistics(voucherId)
      
      let statsData: VoucherStatistics | null = null
      
      // Handle nested response structure (same as vouchers)
      if (response?.data?.data?.voucher && response?.data?.data?.statistics) {
        console.log('✅ Found stats at response.data.data (nested)')
        statsData = response.data.data
      } else if (response?.data?.voucher && response?.data?.statistics) {
        console.log('✅ Found stats at response.data')
        statsData = response.data
      } else if (response?.voucher && response?.statistics) {
        console.log('✅ Found stats at response (direct)')
        statsData = response as VoucherStatistics
      }
      
      if (statsData) {
        setVoucherStats(statsData)
        setShowStatsModal(true)
      } else {
        console.log('⚠️ No statistics data in response:', response)
        toast.error('No statistics data available')
      }
    } catch (error: any) {
      console.error('Load statistics error:', error)
      toast.error(error.message || 'Failed to load voucher statistics')
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
      toast.error('Only Super Admin can delete vouchers')
      return
    }

    if (!confirm('Are you sure you want to delete this voucher?')) {
      return
    }

    try {
      await api.deleteVoucher(voucherId)
      toast.success('Voucher deleted successfully')
      loadVouchers()
    } catch (error: any) {
      console.error('Delete voucher error:', error)
      toast.error(error.message || 'Failed to delete voucher')
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
        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Inactive
        </span>
      )
    }
    
    if (now < validFrom) {
      return (
        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-700 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          Scheduled
        </span>
      )
    }
    
    if (now > validUntil) {
      return (
        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-red-100 text-red-700 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Expired
        </span>
      )
    }
    
    if (voucher.maxUses && voucher.usedCount >= voucher.maxUses) {
      return (
        <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-orange-100 text-orange-700 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Limit Reached
        </span>
      )
    }
    
    return (
      <span className="px-2 py-1 rounded-lg text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
        <CheckCircle className="w-3 h-3" />
        Active
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
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading vouchers...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Voucher Management</h1>
                <p className="text-sm text-gray-600">Create and manage deposit vouchers</p>
              </div>
            </div>
            
            <button
              onClick={handleCreateVoucher}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
            >
              <Plus className="w-5 h-5" />
              Create Voucher
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by code or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select
                  value={filterActive}
                  onChange={(e) => {
                    setFilterActive(e.target.value as any)
                    setCurrentPage(1)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Vouchers</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Vouchers List */}
        {filteredVouchers.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vouchers found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search query'
                : 'Get started by creating your first voucher'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateVoucher}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                Create First Voucher
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredVouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold font-mono text-gray-900">
                        {voucher.code}
                      </span>
                      {getStatusBadge(voucher)}
                    </div>
                    
                    {voucher.description && (
                      <p className="text-sm text-gray-600 mb-3">{voucher.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {voucher.type === 'percentage' 
                            ? `${voucher.value}% Bonus`
                            : `Rp ${voucher.value.toLocaleString()} Fixed`
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          Min: Rp {voucher.minDeposit.toLocaleString()}
                        </span>
                      </div>
                      
                      {voucher.type === 'percentage' && voucher.maxBonusAmount && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            Max: Rp {voucher.maxBonusAmount.toLocaleString()}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">
                          {voucher.eligibleStatuses.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => loadVoucherStatistics(voucher.id)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="View Statistics"
                    >
                      <BarChart3 className="w-5 h-5 text-gray-600" />
                    </button>
                    
                    <button
                      onClick={() => handleEditVoucher(voucher)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5 text-blue-600" />
                    </button>
                    
                    {user?.role === 'super_admin' && (
                      <button
                        onClick={() => handleDeleteVoucher(voucher.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Used:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {voucher.usedCount}
                        {voucher.maxUses && ` / ${voucher.maxUses}`}
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Per User:</span>
                      <span className="ml-2 font-semibold text-gray-900">
                        {voucher.maxUsesPerUser}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <div>Valid: {formatDate(voucher.validFrom)}</div>
                    <div>Until: {formatDate(voucher.validUntil)}</div>
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
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">Voucher Statistics</h2>
              <button
                onClick={() => {
                  setShowStatsModal(false)
                  setVoucherStats(null)
                }}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-2xl font-bold font-mono mb-2">
                  {voucherStats.voucher.code}
                </div>
                <div className="text-sm text-gray-600">
                  {voucherStats.voucher.type === 'percentage' 
                    ? `${voucherStats.voucher.value}% Bonus`
                    : `Rp ${voucherStats.voucher.value.toLocaleString()} Fixed Bonus`
                  }
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-sm text-blue-600 mb-1">Total Used</div>
                  <div className="text-2xl font-bold text-blue-900">
                    {voucherStats.statistics.totalUsed}
                  </div>
                  {voucherStats.statistics.remainingUses !== null && (
                    <div className="text-xs text-blue-600 mt-1">
                      {voucherStats.statistics.remainingUses} remaining
                    </div>
                  )}
                </div>

                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-sm text-green-600 mb-1">Total Bonus Given</div>
                  <div className="text-2xl font-bold text-green-900">
                    Rp {voucherStats.statistics.totalBonusGiven.toLocaleString()}
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="text-sm text-purple-600 mb-1">Total Deposits</div>
                  <div className="text-2xl font-bold text-purple-900">
                    Rp {voucherStats.statistics.totalDepositAmount.toLocaleString()}
                  </div>
                </div>

                <div className="bg-orange-50 rounded-xl p-4">
                  <div className="text-sm text-orange-600 mb-1">Average Bonus</div>
                  <div className="text-2xl font-bold text-orange-900">
                    Rp {voucherStats.statistics.averageBonus.toLocaleString()}
                  </div>
                </div>
              </div>

              {voucherStats.recentUsages && voucherStats.recentUsages.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Recent Usages</h3>
                  <div className="space-y-2">
                    {voucherStats.recentUsages.map((usage) => (
                      <div
                        key={usage.id}
                        className="bg-gray-50 rounded-lg p-3 text-sm"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900">
                            {usage.userEmail}
                          </span>
                          <span className="text-gray-600">
                            {formatDate(usage.usedAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>
                            Deposit: Rp {usage.depositAmount.toLocaleString()}
                          </span>
                          <span className="text-green-600 font-semibold">
                            Bonus: +Rp {usage.bonusAmount.toLocaleString()}
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
      )}
    </div>
  )
}