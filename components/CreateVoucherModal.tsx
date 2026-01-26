// components/CreateVoucherModal.tsx
'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface Props {
  onClose: () => void
  onSuccess: () => void
  voucher?: any // Voucher data for edit mode
}

export default function CreateVoucherModal({ onClose, onSuccess, voucher }: Props) {
  const isEdit = !!voucher
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    code: voucher?.code || '',
    type: voucher?.type || 'percentage',
    value: voucher?.value || 10,
    minDeposit: voucher?.minDeposit || 100000,
    eligibleStatuses: voucher?.eligibleStatuses || ['all'],
    maxUses: voucher?.maxUses || '',
    maxUsesPerUser: voucher?.maxUsesPerUser || 1,
    maxBonusAmount: voucher?.maxBonusAmount || '',
    isActive: voucher?.isActive ?? true,
    validFrom: voucher?.validFrom ? new Date(voucher.validFrom).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    validUntil: voucher?.validUntil ? new Date(voucher.validUntil).toISOString().split('T')[0] : '',
    description: voucher?.description || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        ...formData,
        maxUses: formData.maxUses ? parseInt(formData.maxUses as string) : undefined,
        maxBonusAmount: formData.maxBonusAmount ? parseInt(formData.maxBonusAmount as string) : undefined
      }

      if (isEdit) {
        await api.updateVoucher(voucher.id, data)
      } else {
        await api.createVoucher(data)
      }

      toast.success(`Voucher ${isEdit ? 'updated' : 'created'} successfully`)
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save voucher')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {isEdit ? 'Edit Voucher' : 'Create New Voucher'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border rounded-lg uppercase"
                placeholder="BONUS10"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Type *</label>
              <select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (IDR)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">
                Value {formData.type === 'percentage' ? '(%)' : '(IDR)'} *
              </label>
              <input
                type="number"
                required
                min="1"
                max={formData.type === 'percentage' ? 100 : undefined}
                value={formData.value}
                onChange={e => setFormData({...formData, value: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Min Deposit (IDR)</label>
              <input
                type="number"
                value={formData.minDeposit}
                onChange={e => setFormData({...formData, minDeposit: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          {formData.type === 'percentage' && (
            <div>
              <label className="block text-sm font-semibold mb-1">Max Bonus Cap (IDR)</label>
              <input
                type="number"
                value={formData.maxBonusAmount}
                onChange={e => setFormData({...formData, maxBonusAmount: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Optional"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Max Total Uses</label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={e => setFormData({...formData, maxUses: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Unlimited if empty"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Max Uses Per User</label>
              <input
                type="number"
                value={formData.maxUsesPerUser}
                onChange={e => setFormData({...formData, maxUsesPerUser: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Eligible Statuses</label>
            <select
              multiple
              value={formData.eligibleStatuses}
              onChange={e => {
                const values = Array.from(e.target.selectedOptions, option => option.value)
                setFormData({...formData, eligibleStatuses: values})
              }}
              className="w-full px-3 py-2 border rounded-lg h-24"
            >
              <option value="all">All Statuses</option>
              <option value="standard">Standard</option>
              <option value="gold">Gold</option>
              <option value="vip">VIP</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Valid From *</label>
              <input
                type="date"
                required
                value={formData.validFrom}
                onChange={e => setFormData({...formData, validFrom: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-1">Valid Until *</label>
              <input
                type="date"
                required
                value={formData.validUntil}
                onChange={e => setFormData({...formData, validUntil: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
              className="w-4 h-4"
            />
            <label htmlFor="isActive" className="text-sm font-semibold">Active</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}