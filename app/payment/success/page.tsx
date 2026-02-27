'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { CheckCircle, ArrowRight, Wallet, Clock, ReceiptText } from 'lucide-react'

const SPRING = { type: 'spring', stiffness: 80, damping: 20 } as const

function SuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const user = useAuthStore((state) => state.user)

  const orderId = searchParams.get('orderId') || ''

  const [deposit, setDeposit] = useState<any>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/'); return }
    if (!orderId) { router.push('/payment'); return }
    fetchData()
  }, [user, orderId])

  const fetchData = async () => {
    try {
      const [statusRes, balanceRes] = await Promise.allSettled([
        api.checkMidtransDepositStatus(orderId),
        api.getBothBalances(),
      ])

      if (statusRes.status === 'fulfilled') {
        const dep = (statusRes.value as any)?.data?.deposit || (statusRes.value as any)?.deposit
        if (dep) setDeposit(dep)
      }

      if (balanceRes.status === 'fulfilled') {
        const b = balanceRes.value as any
        const realBal = b?.data?.realBalance ?? b?.realBalance ?? null
        setBalance(realBal)
      }
    } catch (err) {
      console.error('Gagal memuat data:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(dateString))
  }

  const getPaymentLabel = (type?: string) => {
    if (!type) return '-'
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-[#f5f6f8]">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-10">

        {/* Success Card */}
        <motion.div
          className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING }}
        >
          {/* Top gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500" />

          <div className="p-8">
            {/* Icon */}
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ ...SPRING, delay: 0.15 }}
            >
              <div className="relative">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" strokeWidth={1.5} />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-green-300"
                  initial={{ scale: 1, opacity: 0.8 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 0.5 }}
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h1>
              <p className="text-sm text-gray-500">
                Top Up Anda telah diproses. Saldo sudah dikreditkan ke akun Anda.
              </p>
            </motion.div>

            {/* Detail rows */}
            <motion.div
              className="bg-gray-50 rounded-xl border border-gray-100 divide-y divide-gray-100 mb-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.28 }}
            >
              {/* Amount */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm text-gray-500 font-medium">Jumlah Top Up</span>
                <span className="text-sm font-bold text-gray-900">
                  {loading ? (
                    <span className="w-20 h-4 bg-gray-200 rounded animate-pulse inline-block" />
                  ) : deposit?.amount ? (
                    `+${formatCurrency(deposit.amount)}`
                  ) : '-'}
                </span>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm text-gray-500 font-medium">Status</span>
                <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                  Berhasil
                </span>
              </div>

              {/* Order ID */}
              <div className="flex items-center justify-between px-4 py-3.5 gap-4">
                <span className="text-sm text-gray-500 font-medium flex-shrink-0">Order ID</span>
                <code className="text-xs text-gray-600 bg-white border border-gray-200 px-2.5 py-1 rounded-lg font-mono truncate max-w-[180px]">
                  {orderId || '-'}
                </code>
              </div>

              {/* Payment method */}
              {deposit?.payment_type && (
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-sm text-gray-500 font-medium">Metode Bayar</span>
                  <span className="text-sm font-semibold text-gray-700">
                    {getPaymentLabel(deposit.payment_type)}
                  </span>
                </div>
              )}

              {/* Date */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm text-gray-500 font-medium">Waktu</span>
                <span className="text-sm text-gray-700">
                  {loading ? (
                    <span className="w-28 h-4 bg-gray-200 rounded animate-pulse inline-block" />
                  ) : formatDate(deposit?.completedAt || deposit?.createdAt)}
                </span>
              </div>

              {/* Current balance */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm text-gray-500 font-medium">Saldo Real</span>
                <span className="text-sm font-bold text-emerald-600">
                  {loading ? (
                    <span className="w-24 h-4 bg-gray-200 rounded animate-pulse inline-block" />
                  ) : balance !== null ? formatCurrency(balance) : '-'}
                </span>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING, delay: 0.35 }}
            >
              <Link
                href="/balance"
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white py-3.5 px-6 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg"
              >
                <Wallet className="w-4 h-4" />
                Lihat Dompet
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/payment"
                className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 px-6 rounded-xl font-bold text-sm transition-all"
              >
                <ReceiptText className="w-4 h-4" />
                Top Up Lagi
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.p
          className="text-center text-xs text-gray-400 mt-5 flex items-center justify-center gap-1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Clock className="w-3 h-3" />
          Jika saldo belum masuk dalam 5 menit, hubungi support kami.
        </motion.p>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}