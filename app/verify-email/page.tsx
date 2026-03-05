// app/verify-email/page.tsx
'use client'

import React, { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2, Mail, ArrowRight, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

type Status = 'loading' | 'success' | 'error' | 'already_verified'

// ── Inner component — pakai useSearchParams di sini ──────────────────────────
// Harus dipisah agar bisa dibungkus Suspense di parent.
function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const { isAuthenticated } = useAuthStore()

  const [status, setStatus] = useState<Status>('loading')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendSuccess, setResendSuccess] = useState(false)

  // ── Countdown timer resend ──────────────────────────────────────────────
  useEffect(() => {
    if (resendCooldown <= 0) return
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [resendCooldown])

  // ── Verify token on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Token verifikasi tidak ditemukan. Pastikan Anda membuka link yang benar dari email.')
      return
    }

    const doVerify = async () => {
      try {
        const res = await api.verifyEmail(token)
        const msg: string = (res as any)?.data?.message || (res as any)?.message || ''

        if (msg.toLowerCase().includes('sudah terverifikasi') || msg.toLowerCase().includes('already')) {
          setStatus('already_verified')
          setMessage('Email Anda sudah terverifikasi sebelumnya.')
        } else {
          setStatus('success')
          setMessage('Email Anda berhasil diverifikasi! Selamat datang.')
        }
      } catch (err: any) {
        const errMsg: string =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          'Token tidak valid atau sudah kadaluarsa.'
        setStatus('error')
        setMessage(errMsg)
      }
    }

    doVerify()
  }, [token])

  // ── Resend verification email ───────────────────────────────────────────
  const handleResend = useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/verify-email')
      return
    }

    setResending(true)
    try {
      await api.resendVerificationEmail()
      setResendSuccess(true)
      setResendCooldown(60)
    } catch (err: any) {
      const msg: string = err?.response?.data?.error || err?.message || 'Gagal mengirim ulang. Coba lagi nanti.'
      setMessage(msg)
    } finally {
      setResending(false)
    }
  }, [isAuthenticated, router])

  // ── Variants ────────────────────────────────────────────────────────────
  const SPRING = { type: 'spring', stiffness: 80, damping: 20 } as const

  const containerVariants = {
    hidden: { opacity: 0, y: 32, scale: 0.97 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { ...SPRING, delay: 0.05 } },
  }

  const iconVariants = {
    hidden: { scale: 0, rotate: -20 },
    visible: { scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 120, damping: 14, delay: 0.2 } },
  }

  // ── UI config per status ────────────────────────────────────────────────
  const config = {
    loading: {
      icon: <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />,
      iconBg: 'bg-sky-50',
      title: 'Memverifikasi Email...',
      subtitle: 'Mohon tunggu, sedang memproses token verifikasi Anda.',
      accent: 'from-sky-500 to-sky-600',
    },
    success: {
      icon: <CheckCircle2 className="w-12 h-12 text-emerald-500" />,
      iconBg: 'bg-emerald-50',
      title: 'Email Terverifikasi! 🎉',
      subtitle: message,
      accent: 'from-emerald-500 to-teal-500',
    },
    already_verified: {
      icon: <CheckCircle2 className="w-12 h-12 text-sky-500" />,
      iconBg: 'bg-sky-50',
      title: 'Sudah Terverifikasi',
      subtitle: message,
      accent: 'from-sky-500 to-sky-600',
    },
    error: {
      icon: <XCircle className="w-12 h-12 text-red-500" />,
      iconBg: 'bg-red-50',
      title: 'Verifikasi Gagal',
      subtitle: message,
      accent: 'from-red-500 to-rose-500',
    },
  }

  const current = config[status]

  return (
    <motion.div
      className="relative w-full max-w-md"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Accent bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${current.accent}`} />

        <div className="px-8 py-10 text-center">

          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Stouch.id</h1>
            <p className="text-xs text-gray-400 mt-0.5">Binary Option Trading Platform</p>
          </div>

          {/* Icon */}
          <motion.div
            className={`w-20 h-20 ${current.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm`}
            variants={iconVariants}
            initial="hidden"
            animate="visible"
          >
            {current.icon}
          </motion.div>

          {/* Title & subtitle */}
          <AnimatePresence mode="wait">
            <motion.div
              key={status}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{current.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed px-2">{current.subtitle}</p>
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="mt-8 space-y-3">

            {/* Success / already_verified → ke dashboard */}
            {(status === 'success' || status === 'already_verified') && (
              <motion.button
                onClick={() => router.push(isAuthenticated ? '/dashboard' : '/login')}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-white font-semibold text-sm bg-gradient-to-r ${current.accent} shadow-md hover:opacity-90 transition-opacity`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {isAuthenticated ? 'Ke Dashboard' : 'Login Sekarang'}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            )}

            {/* Error → resend atau login */}
            {status === 'error' && (
              <motion.div
                className="space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                {isAuthenticated ? (
                  resendSuccess ? (
                    <div className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-emerald-700">
                        Email terkirim!
                        {resendCooldown > 0 && (
                          <span className="font-normal text-emerald-600"> Kirim ulang dalam {resendCooldown}d</span>
                        )}
                      </span>
                    </div>
                  ) : (
                    <button
                      onClick={handleResend}
                      disabled={resending || resendCooldown > 0}
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 disabled:opacity-50 transition-colors shadow-md"
                    >
                      {resending ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                      ) : resendCooldown > 0 ? (
                        <><RefreshCw className="w-4 h-4" /> Kirim ulang dalam {resendCooldown}d</>
                      ) : (
                        <><Mail className="w-4 h-4" /> Kirim Ulang Email Verifikasi</>
                      )}
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600 transition-colors shadow-md"
                  >
                    Login untuk Kirim Ulang
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={() => router.push('/')}
                  className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Kembali ke Beranda
                </button>
              </motion.div>
            )}
          </div>

          {resendSuccess && (
            <motion.p
              className="mt-4 text-xs text-gray-400 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              Email baru telah dikirim. Periksa inbox dan folder spam Anda, lalu klik link verifikasi terbaru.
            </motion.p>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            Butuh bantuan?{' '}
            <a href="mailto:support@stouch.id" className="text-sky-500 hover:underline font-medium">
              support@stouch.id
            </a>
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Fallback saat Suspense loading ───────────────────────────────────────────
function LoadingFallback() {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 to-sky-600" />
      <div className="px-8 py-10 text-center">
        <div className="mb-8">
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Stouch.id</h1>
          <p className="text-xs text-gray-400 mt-0.5">Binary Option Trading Platform</p>
        </div>
        <div className="w-20 h-20 bg-sky-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Memuat...</h2>
        <p className="text-sm text-gray-500">Mohon tunggu sebentar.</p>
      </div>
    </div>
  )
}

// ── Page export — wajib bungkus Suspense karena pakai useSearchParams ─────────
export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-12">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <Suspense fallback={<LoadingFallback />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}