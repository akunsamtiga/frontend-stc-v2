// components/CreateVoucherModal.tsx 
'use client'

import React, { useState } from 'react'
import { X, Info } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface Props {
  onClose: () => void
  onSuccess: () => void
  voucher?: any
}

export default function CreateVoucherModal({ onClose, onSuccess, voucher }: Props) {
  const isEdit = !!voucher
  const [loading, setLoading] = useState(false)


  const getInitialEligibleStatuses = () => {
    if (!voucher?.eligibleStatuses) return ['all']


    if (typeof voucher.eligibleStatuses === 'string') {
      return [voucher.eligibleStatuses]
    }


    return voucher.eligibleStatuses
  }

  const [formData, setFormData] = useState({
    code: voucher?.code || '',
    type: voucher?.type || 'percentage',
    value: voucher?.value || 10,
    minDeposit: voucher?.minDeposit || 100000,
    eligibleStatuses: getInitialEligibleStatuses(),
    maxUses: voucher?.maxUses || '',
    maxUsesPerUser: voucher?.maxUsesPerUser || 1,
    maxBonusAmount: voucher?.maxBonusAmount || '',
    isActive: voucher?.isActive ?? true,
    validFrom: voucher?.validFrom
      ? new Date(voucher.validFrom).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    validUntil: voucher?.validUntil
      ? new Date(voucher.validUntil).toISOString().split('T')[0]
      : '',
    description: voucher?.description || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {

      if (new Date(formData.validUntil) <= new Date(formData.validFrom)) {
        toast.error('Valid Until must be after Valid From')
        setLoading(false)
        return
      }


      if (formData.eligibleStatuses.length === 0) {
        toast.error('Please select at least one eligible status')
        setLoading(false)
        return
      }

      const data = {
        ...formData,
        maxUses: formData.maxUses ? parseInt(formData.maxUses as string) : undefined,
        maxBonusAmount: formData.maxBonusAmount ? parseInt(formData.maxBonusAmount as string) : undefined,

        eligibleStatuses: Array.isArray(formData.eligibleStatuses)
          ? formData.eligibleStatuses
          : [formData.eligibleStatuses]
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


  const handleEligibleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, option => option.value)


    if (values.includes('all') && !formData.eligibleStatuses.includes('all')) {
      setFormData({...formData, eligibleStatuses: ['all']})
    }

    else if (values.length > 1 && formData.eligibleStatuses.includes('all')) {
      const filtered = values.filter(v => v !== 'all')
      setFormData({...formData, eligibleStatuses: filtered})
    }

    else if (values.length > 0) {
      setFormData({...formData, eligibleStatuses: values})
    }

    else {
      setFormData({...formData, eligibleStatuses: ['all']})
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold !text-gray-900">
            {isEdit ? 'Edit Voucher' : 'Create New Voucher'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full !text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 !text-gray-800">
                Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                className="w-full px-3 py-2 border rounded-lg uppercase focus:ring-2 focus:ring-blue-500 !text-gray-900"
                placeholder="BONUS10"
                maxLength={20}
              />
              <p className="text-xs !text-gray-500 mt-1">
                Max 20 characters, uppercase only
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 !text-gray-800">Type *</label>
              <select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 !text-gray-900"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (IDR)</option>
              </select>
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 !text-gray-800">
                Value {formData.type === 'percentage' ? '(%)' : '(IDR)'} *
              </label>
              <input
                type="number"
                required
                min="1"
                max={formData.type === 'percentage' ? 100 : undefined}
                value={formData.value}
                onChange={e => setFormData({...formData, value: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 !text-gray-900"
              />
              {formData.type === 'percentage' && (
                <p className="text-xs !text-gray-500 mt-1">
                  Max 100%
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 !text-gray-800">
                Min Deposit (IDR) *
              </label>
              <input
                type="number"
                required
                min="10000"
                value={formData.minDeposit}
                onChange={e => setFormData({...formData, minDeposit: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 !text-gray-900"
              />
              <p className="text-xs !text-gray-500 mt-1">
                Minimum: Rp 10,000
              </p>
            </div>
          </div>

          {}
          {formData.type === 'percentage' && (
            <div>
              <label className="block text-sm font-semibold mb-1 flex items-center gap-2 !text-gray-800">
                Max Bonus Cap (IDR)
                <span className="text-xs font-normal !text-gray-500">(Optional)</span>
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxBonusAmount}
                onChange={e => setFormData({...formData, maxBonusAmount: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 !text-gray-900"
                placeholder="e.g., 100000 for max Rp 100,000 bonus"
              />
              <p className="text-xs !text-gray-500 mt-1">
                Leave empty for unlimited bonus
              </p>
            </div>
          )}

          {}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 flex items-center gap-2 !text-gray-800">
                Max Total Uses
                <span className="text-xs font-normal !text-gray-500">(Optional)</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxUses}
                onChange={e => setFormData({...formData, maxUses: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 !text-gray-900"
                placeholder="Unlimited if empty"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 !text-gray-800">
                Max Uses Per User *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.maxUsesPerUser}
                onChange={e => setFormData({...formData, maxUsesPerUser: parseInt(e.target.value) || 1})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 !text-gray-900"
              />
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-semibold mb-1 !text-gray-800">
              Eligible User Statuses *
            </label>
            <select
              multiple
              value={formData.eligibleStatuses}
              onChange={handleEligibleStatusChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 h-28 !text-gray-900"
            >
              <option value="all">All Statuses (Everyone)</option>
              <option value="standard">Standard Only</option>
              <option value="gold">Gold Only</option>
              <option value="vip">VIP Only</option>
            </select>
            <div className="mt-2 flex items-start gap-2 text-xs !text-gray-500">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1 !text-gray-600">Selection Guide:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Hold Ctrl/Cmd to select multiple statuses</li>
                  <li>Selecting "All Statuses" will clear other selections</li>
                  <li>Current: <strong className="!text-gray-700">{formData.eligibleStatuses.join(', ')}</strong></li>
                </ul>
              </div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 !text-gray-800">Valid From *</label>
              <input
                type="date"
                required
                value={formData.validFrom}
                onChange={e => setFormData({...formData, validFrom: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 !text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 !text-gray-800">Valid Until *</label>
              <input
                type="date"
                required
                min={formData.validFrom}
                value={formData.validUntil}
                onChange={e => setFormData({...formData, validUntil: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 !text-gray-900"
              />
            </div>
          </div>

          {}
          <div>
            <label className="block text-sm font-semibold mb-1 !text-gray-800">
              Description
              <span className="text-xs font-normal !text-gray-500 ml-2">(Optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 !text-gray-900"
              rows={3}
              placeholder="e.g., New Year Promotion - Get 10% bonus on all deposits"
              maxLength={200}
            />
            <p className="text-xs !text-gray-500 mt-1">
              {formData.description.length}/200 characters
            </p>
          </div>

          {}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={e => setFormData({...formData, isActive: e.target.checked})}
              className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-semibold cursor-pointer !text-gray-800">
              Active
              <span className="text-xs font-normal !text-gray-500 ml-2">
                (Voucher can be used when active)
              </span>
            </label>
          </div>

          {}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-bold !text-blue-900 mb-2">Preview</h3>
            <div className="text-xs space-y-1 !text-blue-800">
              <p>• Code: <strong>{formData.code || 'N/A'}</strong></p>
              <p>• Type: <strong>{formData.type === 'percentage' ? `${formData.value}% Bonus` : `Rp ${formData.value.toLocaleString()} Fixed`}</strong></p>
              {formData.type === 'percentage' && formData.maxBonusAmount && (
                <p>• Max Bonus: <strong>Rp {parseInt(formData.maxBonusAmount as string).toLocaleString()}</strong></p>
              )}
              <p>• Min Deposit: <strong>Rp {formData.minDeposit.toLocaleString()}</strong></p>
              <p>• Eligible: <strong>{formData.eligibleStatuses.join(', ')}</strong></p>
              <p>• Max Uses: <strong>{formData.maxUses || 'Unlimited'}</strong></p>
              <p>• Status: <strong className={formData.isActive ? '!text-green-700' : '!text-red-700'}>
                {formData.isActive ? 'Active' : 'Inactive'}
              </strong></p>
            </div>
          </div>

          {}
          <div className="flex gap-3 pt-4 sticky bottom-0 bg-white border-t -mx-6 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 !text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 !text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Voucher' : 'Create Voucher')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}