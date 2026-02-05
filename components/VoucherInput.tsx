'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Tag, Check, X, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

interface VoucherInputProps {
  depositAmount: number
  onVoucherApplied: (voucher: {
    code: string
    bonusAmount: number
    type: 'percentage' | 'fixed'
    value: number
  } | null) => void
  disabled?: boolean
  externalCode?: string
}

interface ValidationResult {
  valid: boolean
  message?: string
  bonusAmount?: number
  voucher?: {
    type: 'percentage' | 'fixed'
    value: number
  }
}

export default function VoucherInput({ 
  depositAmount, 
  onVoucherApplied,
  disabled = false,
  externalCode = ''
}: VoucherInputProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const isExternalRef = useRef(false)

  // Sync with external code
  useEffect(() => {
    if (externalCode && externalCode !== code) {
      setCode(externalCode)
      isExternalRef.current = true
      setResult({
        valid: true,
        message: 'Voucher dipilih',
      })
    } else if (!externalCode && code) {
      setCode('')
      setResult(null)
      isExternalRef.current = false
    }
  }, [externalCode, code])

  const validateVoucher = useCallback(
    async (voucherCode: string, amount: number) => {
      if (!voucherCode || amount <= 0) {
        setResult(null)
        onVoucherApplied(null)
        return
      }

      setLoading(true)
      try {
        const res = await api.validateVoucher(voucherCode.toUpperCase(), amount)
        const data = res.data || res
        
        const validationResult: ValidationResult = {
          valid: data.valid,
          message: data.message,
          bonusAmount: data.bonusAmount,
          voucher: data.voucher
        }
        
        setResult(validationResult)
        
        if (data.valid && data.voucher) {
          onVoucherApplied({
            code: voucherCode.toUpperCase(),
            bonusAmount: data.bonusAmount!,
            type: data.voucher.type,
            value: data.voucher.value
          })
        } else {
          onVoucherApplied(null)
        }
      } catch (error) {
        console.error('Validation error:', error)
        setResult({ valid: false, message: 'Kode voucher tidak valid' })
        onVoucherApplied(null)
      } finally {
        setLoading(false)
      }
    },
    [onVoucherApplied]
  )

  const debouncedValidate = useCallback(
    (() => {
      let timeout: NodeJS.Timeout
      return (voucherCode: string, amount: number) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => validateVoucher(voucherCode, amount), 500)
      }
    })(),
    [validateVoucher]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase()
    setCode(value)
    isExternalRef.current = false
    
    if (value.length >= 3) {
      debouncedValidate(value, depositAmount)
    } else {
      setResult(null)
      onVoucherApplied(null)
    }
  }

  const clearVoucher = () => {
    setCode('')
    setResult(null)
    onVoucherApplied(null)
    isExternalRef.current = false
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
          Kode Voucher
        </label>
        
        <div className="relative flex-1">
          <input
            type="text"
            value={code}
            onChange={handleChange}
            disabled={disabled || loading}
            placeholder="Opsional"
            className={`w-full pl-9 pr-9 py-2.5 rounded-lg border-2 font-medium uppercase tracking-wide transition-all text-sm ${
              result?.valid 
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                : result && !result.valid
                ? 'border-red-400 bg-red-50 text-red-700'
                : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 focus:border-blue-500'
            } focus:outline-none focus:ring-2 ${
              result?.valid
                ? 'focus:ring-emerald-200'
                : result && !result.valid
                ? 'focus:ring-red-200'
                : 'focus:ring-blue-200'
            } disabled:opacity-50 disabled:cursor-not-allowed placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-gray-400`}
          />
          
          <Tag className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 ${
            result?.valid 
              ? 'text-emerald-600' 
              : result && !result.valid
              ? 'text-red-500'
              : 'text-gray-400'
          }`} />
          
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {loading && (
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            )}
            
            {!loading && result?.valid && (
              <Check className="w-4 h-4 text-emerald-600" />
            )}
            
            {!loading && code && !result && (
              <button
                onClick={clearVoucher}
                className="p-0.5 hover:bg-gray-100 rounded-full transition-colors"
                type="button"
              >
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            )}
            
            {!loading && result && !result.valid && (
              <button
                onClick={clearVoucher}
                className="p-0.5 hover:bg-red-100 rounded-full transition-colors"
                type="button"
              >
                <X className="w-3.5 h-3.5 text-red-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Compact Validation Feedback */}
      {result && result.valid && result.bonusAmount && !isExternalRef.current && (
        <div className="flex items-center justify-between px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg ml-[110px]">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700">
              Voucher diterapkan
            </span>
          </div>
          <span className="text-sm font-bold text-emerald-700">
            +{formatCurrency(result.bonusAmount)}
          </span>
        </div>
      )}
      
      {result && !result.valid && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg ml-[110px]">
          <X className="w-3.5 h-3.5 text-red-600" />
          <span className="text-xs font-medium text-red-700">
            {result.message || 'Kode tidak valid'}
          </span>
        </div>
      )}
    </div>
  )
}