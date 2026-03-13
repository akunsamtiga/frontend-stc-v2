// app/reg-aff/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, useAuthHydration } from '@/store/auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'

// ── Apple system tokens ───────────────────────────────────────────────────────
const SYS = {
  blue:      '#0a84ff',
  green:     '#30d158',
  bg:        '#000000',
  card:      '#1c1c1e',
  label:     '#ffffff',
  label2:    'rgba(235,235,245,0.60)',
  label3:    'rgba(235,235,245,0.30)',
  sep:       'rgba(84,84,88,0.55)',
  fill:      'rgba(118,118,128,0.20)',
  fill2:     'rgba(118,118,128,0.12)',
  red:       '#ff453a',
}

// ── Minimal inline icons ──────────────────────────────────────────────────────
const IconCheck = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M5 12.5L9.5 17L19 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconEye = ({ off = false, size = 18 }) => off ? (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
) : (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

const IconWhatsapp = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.522 5.847L.057 23.009a.75.75 0 00.933.934l5.162-1.466A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.796 9.796 0 01-4.988-1.365l-.358-.213-3.714 1.055 1.056-3.713-.214-.358A9.817 9.817 0 012.182 12C2.182 6.568 6.568 2.182 12 2.182c5.432 0 9.818 4.386 9.818 9.818 0 5.432-4.386 9.818-9.818 9.818z" />
  </svg>
)

const IconMail = ({ size = 17 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

const IconBook = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

// ── Success modal — iOS bottom sheet ─────────────────────────────────────────
function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.22 } }}
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full sm:max-w-[360px] sm:rounded-3xl overflow-hidden"
          style={{
            background: SYS.card,
            borderRadius: '28px 28px 0 0',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)',
          }}
          initial={{ y: '100%' }}
          animate={{ y: 0, transition: { type: 'spring', stiffness: 70, damping: 18 } }}
          exit={{ y: '100%', transition: { type: 'spring', stiffness: 110, damping: 24 } }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3.5 pb-2">
            <div className="w-10 h-[5px] rounded-full" style={{ background: SYS.fill }} />
          </div>

          <div className="px-6 pt-3 pb-2">

            {/* Icon */}
            <motion.div
              className="mx-auto mb-5 w-[68px] h-[68px] rounded-full flex items-center justify-center"
              style={{ background: 'rgba(48,209,88,0.14)' }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 130, damping: 14, delay: 0.08 }}
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 13, delay: 0.2 }}
              >
                <IconCheck size={32} color={SYS.green} />
              </motion.div>
            </motion.div>

            {/* Heading */}
            <motion.h2
              className="text-center text-[20px] font-semibold mb-1.5"
              style={{ color: SYS.label, letterSpacing: '-0.03em' }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              Akun berhasil dibuat
            </motion.h2>

            <motion.p
              className="text-center text-[14px] leading-relaxed mb-6"
              style={{ color: SYS.label2 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.21 }}
            >
              Ingin bergabung sebagai{' '}
              <span style={{ color: SYS.label, fontWeight: 500 }}>affiliator Stouch</span>{' '}
              dan dapatkan komisi dari setiap trader yang kamu ajak?
            </motion.p>

            {/* Benefit rows */}
            <motion.div
              className="rounded-2xl overflow-hidden mb-5"
              style={{ background: SYS.fill2 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26 }}
            >
              {[
                'Komisi hingga 40% per transaksi',
                'Dashboard real-time & laporan lengkap',
                'Cairkan komisi kapan saja',
              ].map((item, i, arr) => (
                <div
                  key={item}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderBottom: i < arr.length - 1 ? `0.5px solid ${SYS.sep}` : 'none' }}
                >
                  <div
                    className="flex-shrink-0 w-[20px] h-[20px] rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(48,209,88,0.16)' }}
                  >
                    <IconCheck size={11} color={SYS.green} />
                  </div>
                  <span className="text-[13px]" style={{ color: SYS.label2 }}>{item}</span>
                </div>
              ))}
            </motion.div>

            {/* Actions */}
            <motion.div
              className="flex flex-col gap-2.5"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.31 }}
            >
              <a
                href="https://wa.me/6285701866916?text=Halo%20Stouch%2C%20saya%20baru%20saja%20membuat%20akun%20dan%20ingin%20mengajukan%20permohonan%20sebagai%20affiliator."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2.5 w-full py-[14px] rounded-[16px] text-[15px] font-semibold transition-opacity active:opacity-70"
                style={{ background: SYS.green, color: '#000' }}
              >
                <IconWhatsapp size={18} />
                Daftar via WhatsApp
              </a>

              <a
                href="mailto:support@stouch.id?subject=Permohonan%20Affiliator&body=Halo%20Stouch%2C%20saya%20baru%20saja%20membuat%20akun%20dan%20ingin%20mengajukan%20permohonan%20sebagai%20affiliator."
                className="flex items-center justify-center gap-2.5 w-full py-[14px] rounded-[16px] text-[15px] font-medium transition-opacity active:opacity-70"
                style={{ background: SYS.fill, color: SYS.label }}
              >
                <IconMail size={17} />
                Kirim via Email
              </a>

              {/* Hairline divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px" style={{ background: SYS.sep }} />
                <span className="text-[12px]" style={{ color: SYS.label3 }}>atau</span>
                <div className="flex-1 h-px" style={{ background: SYS.sep }} />
              </div>

              <button
                onClick={onClose}
                className="w-full py-[14px] rounded-[16px] text-[15px] font-medium transition-opacity active:opacity-70"
                style={{ background: SYS.fill2, color: SYS.label2 }}
              >
                Lanjut ke akun
              </button>
            </motion.div>

            {/* Guide link */}
            <motion.div
              className="mt-5 flex items-center justify-center gap-1.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <span style={{ color: SYS.label3 }}><IconBook /></span>
              <Link href="/panduan-affiliator" className="text-[12px] transition-opacity active:opacity-60" style={{ color: SYS.blue }}>
                Panduan program affiliator
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Page() {
  const router   = useRouter()
  const { setAuth } = useAuthStore()
  const hydrated = useAuthHydration()
  const user     = useAuthStore(s => s.user)

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [affCode,  setAffCode]  = useState('')
  const [refCode,  setRefCode]  = useState('')
  const [agreed,   setAgreed]   = useState(false)
  const [termWarn, setTermWarn] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [success,  setSuccess]  = useState(false)

  useEffect(() => {
    if (hydrated && user) router.push('/trading')
  }, [user, hydrated, router])

  // Silently capture ?ref= from URL
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const ref = p.get('ref')?.trim()
    if (!ref) return
    if (ref.startsWith('AFF')) setAffCode(ref)
    else setRefCode(ref)
  }, [])

  // Password strength
  const criteria = [
    { label: '8+ karakter',    met: password.length >= 8 },
    { label: 'Huruf besar',    met: /[A-Z]/.test(password) },
    { label: 'Huruf kecil',    met: /[a-z]/.test(password) },
    { label: 'Angka / simbol', met: /[\d\W]/.test(password) },
  ]
  const score  = criteria.filter(c => c.met).length
  const strengthLabel = ['', 'Lemah', 'Cukup', 'Bagus', 'Kuat'][score]
  const strengthColor = [SYS.fill, SYS.red, '#ff9f0a', '#ffd60a', SYS.green][score]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed) { setTermWarn(true); return }
    setTermWarn(false)
    setLoading(true)
    try {
      const res      = await api.register(email, password, refCode || undefined, affCode || undefined)
      const userData = res.user || res.data?.user
      const token    = res.token || res.data?.token
      if (!userData || !token) { toast.error('Respon tidak valid dari server'); return }
      setAuth(userData, token)
      api.setToken(token)
      setSuccess(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.message || err.message || 'Pendaftaran gagal')
    } finally {
      setLoading(false)
    }
  }

  if (hydrated && user && !success) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: SYS.bg }}>
        <div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: SYS.bg }}
    >
      {/* Wordmark */}
      <motion.div
        className="mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <span
          className="text-[11px] font-semibold"
          style={{ color: SYS.label3, letterSpacing: '0.2em', textTransform: 'uppercase' }}
        >
          Stouch.id
        </span>
      </motion.div>

      <motion.div
        className="w-full max-w-[360px]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
      >
        {/* Heading */}
        <div className="text-center mb-8">
          <h1
            className="text-[34px] font-bold mb-2"
            style={{ color: SYS.label, letterSpacing: '-0.04em' }}
          >
            Buat Akun
          </h1>
          <p className="text-[15px]" style={{ color: SYS.label2 }}>
            Bergabung dan mulai trading hari ini
          </p>
        </div>

        {/* Grouped inputs — Apple Settings style */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl overflow-hidden mb-3" style={{ background: SYS.card }}>
            {/* Email row */}
            <div className="flex items-center px-4 py-0" style={{ minHeight: 52 }}>
              <label className="text-[15px] w-24 flex-shrink-0" style={{ color: SYS.label }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@example.com"
                required
                disabled={loading}
                autoComplete="email"
                className="flex-1 bg-transparent text-[15px] text-right focus:outline-none"
                style={{ color: SYS.label, caretColor: SYS.blue }}
              />
            </div>
            <div className="ml-4" style={{ height: '0.5px', background: SYS.sep }} />
            {/* Password row */}
            <div className="flex items-center px-4 py-0" style={{ minHeight: 52 }}>
              <label className="text-[15px] w-24 flex-shrink-0" style={{ color: SYS.label }}>
                Password
              </label>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                autoComplete="new-password"
                className="flex-1 bg-transparent text-[15px] text-right focus:outline-none"
                style={{ color: SYS.label, caretColor: SYS.blue }}
              />
              <button
                type="button"
                onClick={() => setShowPw(p => !p)}
                className="ml-2 flex-shrink-0 transition-opacity active:opacity-40"
                style={{ color: SYS.label3 }}
              >
                <IconEye off={showPw} size={17} />
              </button>
            </div>
          </div>

          {/* Password strength */}
          <AnimatePresence>
            {password.length > 0 && (
              <motion.div
                className="mb-4 px-1"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
              >
                {/* Bar */}
                <div className="flex gap-1 mb-2">
                  {[0,1,2,3].map(i => (
                    <motion.div
                      key={i}
                      className="h-[3px] flex-1 rounded-full"
                      animate={{ background: i < score ? strengthColor : SYS.fill }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
                {/* Criteria + label */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                    {criteria.map(c => (
                      <span
                        key={c.label}
                        className="text-[11px] transition-colors duration-300"
                        style={{ color: c.met ? SYS.green : SYS.label3 }}
                      >
                        {c.met ? '✓ ' : '· '}{c.label}
                      </span>
                    ))}
                  </div>
                  {score > 0 && (
                    <span
                      className="text-[11px] font-semibold flex-shrink-0 ml-3"
                      style={{ color: strengthColor }}
                    >
                      {strengthLabel}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Terms */}
          <div className="mb-6 px-1">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="flex-shrink-0 mt-0.5">
                <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); if (e.target.checked) setTermWarn(false) }} className="sr-only" />
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200"
                  style={{
                    background: agreed ? SYS.blue : SYS.fill,
                    outline: termWarn && !agreed ? `1.5px solid ${SYS.red}` : 'none',
                  }}
                >
                  {agreed && <IconCheck size={11} color="#fff" />}
                </div>
              </div>
              <span className="text-[13px] leading-relaxed" style={{ color: SYS.label2 }}>
                Saya menyetujui{' '}
                <a href="/agreement" onClick={e => e.stopPropagation()} style={{ color: SYS.blue }}>
                  Syarat &amp; Ketentuan
                </a>{' '}dan{' '}
                <a href="/privacy" onClick={e => e.stopPropagation()} style={{ color: SYS.blue }}>
                  Kebijakan Privasi
                </a>
              </span>
            </label>
            <AnimatePresence>
              {termWarn && !agreed && (
                <motion.p
                  className="mt-2 ml-8 text-[12px]"
                  style={{ color: SYS.red }}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  Harap setujui syarat dan ketentuan untuk melanjutkan
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl text-[15px] font-semibold transition-opacity active:opacity-75 disabled:opacity-40"
            style={{ background: SYS.blue, color: '#fff', letterSpacing: '-0.01em' }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                Memproses...
              </span>
            ) : 'Buat Akun'}
          </button>
        </form>

        {/* Benefits */}
        <div className="mt-6 flex items-center justify-center gap-6">
          {['Demo Rp 10 juta', 'Profit 95%', 'Withdrawal cepat'].map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <IconCheck size={11} color={SYS.green} />
              <span className="text-[12px]" style={{ color: SYS.label3 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Guide */}
        <div className="mt-4 flex items-center justify-center gap-1.5">
          <span style={{ color: SYS.label3 }}><IconBook /></span>
          <Link href="/panduan-affiliator" className="text-[12px]" style={{ color: SYS.label3 }}>
            Panduan program affiliator
          </Link>
        </div>
      </motion.div>

      {/* Sign in */}
      <motion.p
        className="mt-10 text-[13px]"
        style={{ color: SYS.label3 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        Sudah punya akun?{' '}
        <Link href="/" className="font-medium" style={{ color: SYS.blue }}>
          Masuk
        </Link>
      </motion.p>

      {/* Success sheet */}
      {success && (
        <SuccessModal onClose={() => { setSuccess(false); router.push('/trading') }} />
      )}
    </div>
  )
}