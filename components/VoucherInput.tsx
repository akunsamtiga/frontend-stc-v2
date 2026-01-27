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
  externalCode?: string  // Code from parent (AvailableVouchers)
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
  
  // ✅ NEW: Track if code is from external source
  const isExternalRef = useRef(false)

  console.log('📝 [VoucherInput] External code changed:', externalCode)
  console.log('📝 [VoucherInput] Current code:', code)

  // ✅ FIXED: Sync with external code WITHOUT validation
  useEffect(() => {
    if (externalCode && externalCode !== code) {
      console.log('✅ [VoucherInput] Syncing with external code:', externalCode)
      setCode(externalCode)
      isExternalRef.current = true
      
      // ✅ CHANGED: Don't validate! Parent already did it
      // Just set result as valid (visual feedback only)
      setResult({
        valid: true,
        message: 'Voucher selected from list',
      })
    } else if (!externalCode && code) {
      // Parent cleared the voucher
      console.log('🧹 [VoucherInput] Clearing voucher')
      setCode('')
      setResult(null)
      isExternalRef.current = false
    }
  }, [externalCode])

  const validateVoucher = useCallback(
    async (voucherCode: string, amount: number) => {
      if (!voucherCode || amount <= 0) {
        setResult(null)
        onVoucherApplied(null)
        return
      }

      console.log('🔍 [VoucherInput] Validating:', voucherCode, 'for amount:', amount)

      setLoading(true)
      try {
        const res = await api.validateVoucher(voucherCode.toUpperCase(), amount)
        console.log('✅ [VoucherInput] Validation result:', res)
        
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
        console.error('❌ [VoucherInput] Validation error:', error)
        setResult({ valid: false, message: 'Error validating voucher' })
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
    isExternalRef.current = false // User is typing manually
    
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

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        Voucher Code (Optional)
      </label>
      
      <div className="relative">
        <input
          type="text"
          value={code}
          onChange={handleChange}
          disabled={disabled || loading}
          placeholder="Enter voucher code (e.g., BONUS10)"
          className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 font-semibold uppercase tracking-wider transition-all ${
            result?.valid 
              ? 'border-green-500 bg-green-50 text-green-700' 
              : result && !result.valid
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white'
          } disabled:opacity-50`}
        />
        
        <Tag className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
          result?.valid ? 'text-green-500' : result && !result.valid ? 'text-red-500' : 'text-gray-400'
        }`} />
        
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-500 animate-spin" />
        )}
        
        {!loading && code && (
          <button
            onClick={clearVoucher}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
        
        {!loading && result?.valid && (
          <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
        )}
      </div>

      {result && (
        <div className={`text-sm flex items-center gap-2 ${
          result.valid ? 'text-green-600' : 'text-red-600'
        }`}>
          {result.valid ? (
            <>
              <Check className="w-4 h-4" />
              <span>
                {isExternalRef.current ? (
                  'Voucher selected from list'
                ) : result.bonusAmount ? (
                  <>
                    Voucher valid! Bonus: <strong>Rp {result.bonusAmount?.toLocaleString()}</strong>
                    {result.voucher?.type === 'percentage' && (
                      <span className="text-xs ml-1">({result.voucher.value}%)</span>
                    )}
                  </>
                ) : (
                  'Voucher valid!'
                )}
              </span>
            </>
          ) : (
            <>
              <X className="w-4 h-4" />
              <span>{result.message}</span>
            </>
          )}
        </div>
      )}
    </div>
  )
}