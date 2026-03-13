// app/reg-aff/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, useAuthHydration } from '@/store/auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Eye,
  EyeSlash,
  UserPlus,
  X,
  WhatsappLogo,
  EnvelopeSimple,
  CheckCircle,
  BookOpen,
  Star,
  ArrowRight,
  Confetti,
} from 'phosphor-react'

// ── Motion variants ───────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: 0.25 } },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.88, y: 30 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring', stiffness: 90, damping: 18 },
  },
  exit: { opacity: 0, scale: 0.94, y: 16, transition: { duration: 0.2 } },
}

const stagger = (i: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.18 + i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
})

// ── Success Modal ─────────────────────────────────────────────────────────────

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:px-4"
        variants={backdropVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        style={{ background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full sm:max-w-md overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #0c1628 0%, #111827 50%, #0c1628 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset',
            borderRadius: '24px 24px 0 0',
          }}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={e => e.stopPropagation()}
        >
          {/* Decorative top glow bar */}
          <div
            className="absolute top-0 left-0 right-0 h-px"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.6) 30%, rgba(56,189,248,0.6) 70%, transparent 100%)',
            }}
          />

          {/* Background sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[
              { top: '12%', left: '8%', size: 3, delay: 0.3 },
              { top: '20%', right: '10%', size: 2, delay: 0.5 },
              { top: '60%', left: '5%', size: 2, delay: 0.7 },
              { top: '75%', right: '8%', size: 3, delay: 0.4 },
              { top: '40%', left: '92%', size: 2, delay: 0.6 },
            ].map((s, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: s.size, height: s.size,
                  top: s.top, left: (s as any).left, right: (s as any).right,
                  background: i % 2 === 0 ? '#34d399' : '#38bdf8',
                }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0.5, 1, 0], scale: [0, 1, 0.8, 1, 0] }}
                transition={{ delay: s.delay, duration: 2.5, repeat: Infinity, repeatDelay: 1.5 }}
              />
            ))}
          </div>

          <div className="relative p-7 pb-8">
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
            >
              <X size={16} weight="bold" />
            </button>

            {/* Icon cluster */}
            <motion.div
              className="mx-auto mb-5 relative w-20 h-20"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 130, damping: 14, delay: 0.1 }}
            >
              {/* Outer ring */}
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'rgba(16,185,129,0.06)',
                  border: '1px solid rgba(16,185,129,0.15)',
                }}
              />
              {/* Inner glow */}
              <div
                className="absolute inset-2.5 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.08))',
                  border: '1px solid rgba(16,185,129,0.3)',
                  boxShadow: '0 0 20px rgba(16,185,129,0.2)',
                }}
              >
                <CheckCircle size={30} weight="fill" className="text-emerald-400" />
              </div>
              {/* Confetti mini icon */}
              <motion.div
                className="absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  boxShadow: '0 4px 12px rgba(245,158,11,0.4)',
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 150, damping: 12, delay: 0.35 }}
              >
                <Star size={13} weight="fill" className="text-white" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.div className="text-center mb-1" {...stagger(0)}>
              <h2
                className="text-2xl font-bold text-white"
                style={{ letterSpacing: '-0.03em' }}
              >
                Selamat Bergabung! 🎉
              </h2>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              className="text-sm text-gray-400 text-center mb-6 leading-relaxed"
              {...stagger(1)}
            >
              Akun Stouch kamu berhasil dibuat. Jadilah bagian dari program{' '}
              <span className="text-emerald-400 font-semibold">Affiliator Stouch</span>{' '}
              dan raih penghasilan tambahan bersama kami.
            </motion.p>

            {/* Info card */}
            <motion.div
              className="rounded-2xl p-4 mb-5"
              style={{
                background: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.14)',
              }}
              {...stagger(2)}
            >
              <p className="text-[11px] font-semibold text-emerald-400 uppercase tracking-widest mb-3">
                Keuntungan Jadi Affiliator
              </p>
              <div className="space-y-2">
                {[
                  'Komisi hingga 40% dari setiap transaksi undangan',
                  'Dashboard real-time untuk pantau performa',
                  'Penarikan komisi kapan saja tanpa batas minimum',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div
                      className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
                      style={{ background: 'rgba(16,185,129,0.2)' }}
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3 5.5L6.5 2" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <span className="text-xs text-gray-300 leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA buttons */}
            <motion.div className="flex flex-col gap-2.5" {...stagger(3)}>
              {/* WhatsApp — primary */}
              <a
                href="https://wa.me/6285701866916?text=Halo%20Stouch%2C%20saya%20baru%20saja%20membuat%20akun%20dan%20ingin%20mengajukan%20permohonan%20sebagai%20affiliator."
                target="_blank"
                rel="noopener noreferrer"
                className="group relative flex items-center justify-center gap-2.5 w-full px-5 py-3.5 rounded-xl font-semibold text-sm overflow-hidden transition-all"
                style={{
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  boxShadow: '0 8px 24px rgba(22,163,74,0.35)',
                  color: '#ffffff',
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                />
                <WhatsappLogo size={18} weight="fill" />
                Daftar Jadi Affiliator via WhatsApp
                <ArrowRight size={15} weight="bold" className="ml-auto opacity-60 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Email — secondary */}
              <a
                href="mailto:support@stouch.id?subject=Permohonan%20Affiliator&body=Halo%20Stouch%2C%20saya%20baru%20saja%20membuat%20akun%20dan%20ingin%20mengajukan%20permohonan%20sebagai%20affiliator."
                className="group flex items-center justify-center gap-2.5 w-full px-5 py-3 rounded-xl font-medium text-sm transition-all"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  color: '#94a3b8',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'
                  ;(e.currentTarget as HTMLElement).style.color = '#cbd5e1'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                  ;(e.currentTarget as HTMLElement).style.color = '#94a3b8'
                }}
              >
                <EnvelopeSimple size={16} weight="bold" />
                Kirim via Email
              </a>

              {/* Skip */}
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-1.5 text-xs text-gray-600 hover:text-gray-400 transition-colors mt-0.5 py-1"
              >
                Lewati, lanjut ke akun saya
                <ArrowRight size={12} />
              </button>
            </motion.div>

            {/* Bottom guide link */}
            <motion.div
              className="mt-5 pt-4 flex items-center justify-center gap-1.5"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
              {...stagger(4)}
            >
              <BookOpen size={12} className="text-gray-600" />
              <Link
                href="/panduan-affiliator"
                className="text-[11px] text-gray-600 hover:text-sky-400 transition-colors"
              >
                Baca panduan program affiliator selengkapnya
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Page() {
  const router = useRouter()
  const { setAuth } = useAuthStore()
  const hydrated = useAuthHydration()
  const user = useAuthStore(s => s.user)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [affiliateCode, setAffiliateCode] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTermsWarning, setShowTermsWarning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)

  // If already logged in, go to trading
  useEffect(() => {
    if (hydrated && user) router.push('/trading')
  }, [user, hydrated, router])

  // Read ?ref= from URL silently (no UI field shown)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')?.trim()
    if (ref) {
      if (ref.startsWith('AFF')) setAffiliateCode(ref)
      else setReferralCode(ref)
    }
  }, [])

  // Password strength
  const criteria = [
    { label: '8+ karakter', met: password.length >= 8 },
    { label: 'Huruf besar', met: /[A-Z]/.test(password) },
    { label: 'Huruf kecil', met: /[a-z]/.test(password) },
    { label: 'Angka / simbol', met: /[\d\W]/.test(password) },
  ]
  const score = criteria.filter(c => c.met).length
  const strengthLabel = score === 0 ? '' : score === 1 ? 'Lemah' : score === 2 ? 'Cukup' : score === 3 ? 'Bagus' : 'Kuat'
  const strengthColor = score <= 1 ? '#ef4444' : score === 2 ? '#f59e0b' : score === 3 ? '#eab308' : '#10b981'
  const barColor = (i: number) => {
    if (i >= score) return 'rgba(255,255,255,0.07)'
    if (score <= 1) return '#ef4444'
    if (score === 2) return i === 0 ? '#ef4444' : '#f59e0b'
    if (score === 3) return i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#eab308'
    return '#10b981'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreedToTerms) { setShowTermsWarning(true); return }
    setShowTermsWarning(false)
    setLoading(true)
    try {
      const response = await api.register(
        email,
        password,
        referralCode || undefined,
        affiliateCode || undefined,
      )
      const userData = response.user || response.data?.user
      const token = response.token || response.data?.token
      if (!userData || !token) { toast.error('Respon tidak valid dari server'); return }
      setAuth(userData, token)
      api.setToken(token)
      setShowSuccessModal(true)
    } catch (error: any) {
      toast.error(
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Pendaftaran gagal',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleModalClose = () => {
    setShowSuccessModal(false)
    router.push('/trading')
  }

  if (hydrated && user && !showSuccessModal) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #060b14 0%, #0a0e17 60%, #080d1a 100%)' }}
    >
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(56,189,248,0.05) 0%, transparent 70%)',
        }}
      />

      <motion.div
        className="relative w-full max-w-md"
        variants={fadeUp}
        initial="hidden"
        animate="visible"
      >
        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(15,23,42,0.95)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header */}
          <div className="mb-7 text-center">
            <motion.div
              className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14, delay: 0.1 }}
            >
              <UserPlus size={22} weight="bold" className="text-emerald-400" />
            </motion.div>
            <h1
              className="text-2xl font-bold text-white mb-1.5"
              style={{ letterSpacing: '-0.03em' }}
            >
              Buat Akun
            </h1>
            <p className="text-sm text-gray-400">
              Bergabunglah dengan ribuan trader sukses di Stouch
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="anda@example.com"
                required
                disabled={loading}
                className="w-full bg-[#0a0e17] border border-gray-800 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full bg-[#0a0e17] border border-gray-800 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Password strength */}
              {password.length > 0 && (
                <motion.div
                  className="mt-3 space-y-3"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.25 }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">
                        Kekuatan Password
                      </span>
                      {strengthLabel && (
                        <span className="text-[11px] font-bold" style={{ color: strengthColor }}>
                          {strengthLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3].map(i => (
                        <div
                          key={i}
                          className="h-1.5 flex-1 rounded-full transition-all duration-500"
                          style={{ background: barColor(i) }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {criteria.map(c => (
                      <div
                        key={c.label}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-300"
                        style={{
                          background: c.met ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${c.met ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        }}
                      >
                        <span
                          className="flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                          style={{ background: c.met ? '#10b981' : 'rgba(255,255,255,0.1)' }}
                        >
                          {c.met
                            ? <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            : <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><path d="M1.5 1.5L4.5 4.5M4.5 1.5L1.5 4.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round" /></svg>
                          }
                        </span>
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: c.met ? '#34d399' : 'rgba(255,255,255,0.35)' }}
                        >
                          {c.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Terms */}
            <label className="flex items-start gap-3 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={e => { setAgreedToTerms(e.target.checked); if (e.target.checked) setShowTermsWarning(false) }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                  agreedToTerms
                    ? 'bg-emerald-500 border-emerald-500'
                    : showTermsWarning
                      ? 'border-red-500 bg-transparent'
                      : 'border-gray-600 bg-transparent group-hover:border-gray-400'
                }`}>
                  {agreedToTerms && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-400 leading-relaxed">
                Dengan melanjutkan, Anda menyetujui{' '}
                <a href="/agreement" onClick={e => e.stopPropagation()} className="text-sky-400 hover:text-sky-300 underline">
                  Syarat &amp; Ketentuan
                </a>{' '}
                dan{' '}
                <a href="/privacy" onClick={e => e.stopPropagation()} className="text-sky-400 hover:text-sky-300 underline">
                  Kebijakan Privasi
                </a>{' '}
                kami
              </span>
            </label>

            {showTermsWarning && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 -mt-2">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Harap centang persetujuan Syarat &amp; Ketentuan terlebih dahulu
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 rounded-xl text-base font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: loading ? '#1e293b' : 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(14,165,233,0.25)',
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Memproses...
                </span>
              ) : (
                'Buat Akun'
              )}
            </button>
          </form>

          {/* Benefits strip */}
          <div className="mt-6 grid grid-cols-2 gap-2">
            {[
              'Akun demo Rp 10.000.000',
              'Profit hingga 95%',
              'Penarikan cepat',
              'Support 24/7',
            ].map(text => (
              <div key={text} className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                {text}
              </div>
            ))}
          </div>

          {/* Panduan link */}
          <div
            className="mt-6 pt-5 text-center"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <Link
              href="/panduan-affiliator"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-sky-400 transition-colors"
            >
              <BookOpen size={13} />
              panduan program affiliator
            </Link>
          </div>
        </div>

        {/* Sudah punya akun */}
        <p className="mt-5 text-center text-xs text-gray-600">
          Sudah punya akun?{' '}
          <Link href="/" className="text-sky-400 hover:text-sky-300 transition-colors font-medium">
            Masuk di sini
          </Link>
        </p>
      </motion.div>

      {/* Success Modal */}
      {showSuccessModal && <SuccessModal onClose={handleModalClose} />}
    </div>
  )
}