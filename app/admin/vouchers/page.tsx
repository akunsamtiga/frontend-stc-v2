'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, Search, Edit2, Trash2, Tag, TrendingUp, 
  DollarSign, Users, Calendar, X, Loader2
} from 'lucide-react'
import { api } from '@/lib/api'
import { Voucher, VoucherStatistics, VoucherUsage } from '@/types'
import { toast } from 'sonner'
import CreateVoucherModal from '@/components/CreateVoucherModal'

export default function AdminVouchersPage() {
  const router = useRouter()
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null)
  const [statistics, setStatistics] = useState<VoucherStatistics | null>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)

  useEffect(() => {
    loadVouchers()
  }, [])

  const loadVouchers = async () => {
    try {
      const res = await api.getAllVouchers()
      setVouchers(res.data?.vouchers || [])
    } catch (error) {
      toast.error('Failed to load vouchers')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this voucher?')) return
    
    try {
      await api.deleteVoucher(id)
      loadVouchers()
    } catch (error) {
      toast.error('Failed to delete voucher')
    }
  }

  const viewStatistics = async (voucher: Voucher) => {
    try {
      const res = await api.getVoucherStatistics(voucher.id)
      if (res.data) {
        setStatistics(res.data)
        setSelectedVoucher(voucher)
        setShowStatsModal(true)
      }
    } catch (error) {
      toast.error('Failed to load statistics')
    }
  }

  const handleEdit = (voucher: Voucher) => {
    setSelectedVoucher(voucher)
    setShowCreateModal(true)
  }

  const handleCloseModal = () => {
    setShowCreateModal(false)
    setSelectedVoucher(null)
  }

  const filteredVouchers = vouchers.filter(v => 
    v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voucher Management</h1>
            <p className="text-gray-600">Create and manage deposit vouchers</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Create Voucher
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{vouchers.length}</div>
                <div className="text-xs text-gray-500">Total Vouchers</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {vouchers.filter(v => v.isActive).length}
                </div>
                <div className="text-xs text-gray-500">Active</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {vouchers.reduce((sum, v) => sum + v.usedCount, 0)}
                </div>
                <div className="text-xs text-gray-500">Total Usage</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {vouchers.filter(v => v.maxUses && v.usedCount >= v.maxUses).length}
                </div>
                <div className="text-xs text-gray-500">Fully Used</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vouchers..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Code</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Value</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Usage</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Valid Until</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredVouchers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No vouchers found
                  </td>
                </tr>
              ) : (
                filteredVouchers.map((voucher) => (
                  <tr key={voucher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{voucher.code}</div>
                      {voucher.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">
                          {voucher.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        voucher.type === 'percentage' 
                          ? 'bg-purple-100 text-purple-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {voucher.type === 'percentage' ? '%' : 'Fixed'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold">
                        {voucher.type === 'percentage' 
                          ? `${voucher.value}%` 
                          : `Rp ${voucher.value.toLocaleString()}`
                        }
                      </div>
                      {voucher.maxBonusAmount && (
                        <div className="text-xs text-gray-500">
                          Max: Rp {voucher.maxBonusAmount.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {voucher.usedCount} / {voucher.maxUses || '∞'}
                      </div>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full mt-1">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ 
                            width: `${voucher.maxUses 
                              ? (voucher.usedCount / voucher.maxUses) * 100 
                              : 0
                            }%` 
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        voucher.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {voucher.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(voucher.validUntil).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => viewStatistics(voucher)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                          title="Statistics"
                        >
                          <TrendingUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(voucher)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(voucher.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateVoucherModal 
          onClose={handleCloseModal}
          onSuccess={loadVouchers}
          voucher={selectedVoucher}
        />
      )}

      {showStatsModal && statistics && selectedVoucher && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Voucher Statistics</h2>
                <p className="text-sm text-gray-500">{selectedVoucher.code}</p>
              </div>
              <button 
                onClick={() => setShowStatsModal(false)} 
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-blue-600">
                    {statistics.statistics.totalUsed}
                  </div>
                  <div className="text-sm text-blue-700">Total Used</div>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-green-600">
                    Rp {statistics.statistics.totalBonusGiven.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700">Total Bonus Given</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-purple-600">
                    Rp {statistics.statistics.totalDepositAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-700">Total Deposit Amount</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl">
                  <div className="text-2xl font-bold text-orange-600">
                    Rp {Math.round(statistics.statistics.averageBonus).toLocaleString()}
                  </div>
                  <div className="text-sm text-orange-700">Average Bonus</div>
                </div>
              </div>

              {statistics.recentUsages.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Recent Usage</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {statistics.recentUsages.map((usage: VoucherUsage) => (
                      <div key={usage.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-semibold text-sm">{usage.userEmail}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(usage.usedAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm text-green-600">
                            +Rp {usage.bonusAmount.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Deposit: Rp {usage.depositAmount.toLocaleString()}
                          </div>
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