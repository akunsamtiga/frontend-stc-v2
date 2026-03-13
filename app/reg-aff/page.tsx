// app/reg-aff/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore, useAuthHydration } from '@/store/auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'

// ── Apple Light system tokens ─────────────────────────────────────────────────
const SYS = {
  blue:     '#007aff',
  green:    '#34c759',
  bg:       '#f2f2f7',
  card:     '#ffffff',
  label:    '#000000',
  label2:   'rgba(60,60,67,0.60)',
  label3:   'rgba(60,60,67,0.30)',
  sep:      'rgba(60,60,67,0.20)',
  fill:     'rgba(120,120,128,0.16)',
  fill2:    'rgba(120,120,128,0.08)',
  red:      '#ff3b30',
  shadow:   '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)',
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconCheck = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5 12.5L9.5 17L19 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const IconEye = ({ off = false }) => off ? (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
) : (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
  </svg>
)

const IconWhatsapp = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.522 5.847L.057 23.009a.75.75 0 00.933.934l5.162-1.466A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.796 9.796 0 01-4.988-1.365l-.358-.213-3.714 1.055 1.056-3.713-.214-.358A9.817 9.817 0 012.182 12C2.182 6.568 6.568 2.182 12 2.182c5.432 0 9.818 4.386 9.818 9.818 0 5.432-4.386 9.818-9.818 9.818z" />
  </svg>
)

const IconMail = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
    <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
)

// ── Success modal — iOS light bottom sheet ────────────────────────────────────
function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.22 } }}
        style={{
          background: 'rgba(0,0,0,0.28)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full overflow-hidden"
          style={{
            background: SYS.card,
            borderRadius: '28px 28px 0 0',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)',
            boxShadow: '0 -2px 40px rgba(0,0,0,0.10)',
          }}
          initial={{ y: '100%' }}
          animate={{ y: 0, transition: { type: 'spring', stiffness: 72, damping: 18 } }}
          exit={{ y: '100%', transition: { type: 'spring', stiffness: 110, damping: 24 } }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-[5px] rounded-full" style={{ background: SYS.fill }} />
          </div>

          <div className="px-5 pt-3 pb-2 mx-auto w-full" style={{ maxWidth: 480 }}>

            {/* Icon */}
            <motion.div
              className="mx-auto mb-5 flex items-center justify-center"
              style={{
                width: 68, height: 68, borderRadius: '50%',
                background: 'rgba(52,199,89,0.12)',
                flexShrink: 0,
              }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 130, damping: 14, delay: 0.08 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 180, damping: 13, delay: 0.2 }}
              >
                <IconCheck size={32} color={SYS.green} />
              </motion.div>
            </motion.div>

            {/* Heading */}
            <motion.h2
              className="text-center font-semibold mb-2"
              style={{ color: SYS.label, letterSpacing: '-0.025em', fontSize: 'clamp(18px, 5vw, 22px)' }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              Akun berhasil dibuat
            </motion.h2>

            <motion.p
              className="text-center leading-relaxed mb-5"
              style={{ color: SYS.label2, fontSize: 'clamp(13px, 3.5vw, 15px)' }}
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
              className="rounded-2xl overflow-hidden mb-4"
              style={{ background: SYS.bg }}
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
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(52,199,89,0.15)' }}
                  >
                    <IconCheck size={11} color={SYS.green} />
                  </div>
                  <span style={{ color: SYS.label2, fontSize: 'clamp(12px, 3.5vw, 14px)' }}>{item}</span>
                </div>
              ))}
            </motion.div>

            {/* Actions */}
            <motion.div
              className="flex flex-col gap-2"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.31 }}
            >
              <a
                href="https://wa.me/6285701866916?text=Halo%20Stouch%2C%20saya%20baru%20saja%20membuat%20akun%20dan%20ingin%20mengajukan%20permohonan%20sebagai%20affiliator."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-2xl font-semibold transition-opacity active:opacity-70"
                style={{
                  background: SYS.green,
                  color: '#fff',
                  padding: '14px 16px',
                  fontSize: 'clamp(14px, 4vw, 15px)',
                }}
              >
                <IconWhatsapp />
                Daftar via WhatsApp
              </a>

              <a
                href="mailto:support@stouch.id?subject=Permohonan%20Affiliator&body=Halo%20Stouch%2C%20saya%20baru%20saja%20membuat%20akun%20dan%20ingin%20mengajukan%20permohonan%20sebagai%20affiliator."
                className="flex items-center justify-center gap-2 w-full rounded-2xl font-medium transition-opacity active:opacity-70"
                style={{
                  background: SYS.fill,
                  color: SYS.label,
                  padding: '14px 16px',
                  fontSize: 'clamp(14px, 4vw, 15px)',
                }}
              >
                <IconMail />
                Kirim via Email
              </a>

              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px" style={{ background: SYS.sep }} />
                <span style={{ color: SYS.label3, fontSize: 12 }}>atau</span>
                <div className="flex-1 h-px" style={{ background: SYS.sep }} />
              </div>

              <button
                onClick={onClose}
                className="w-full rounded-2xl font-medium transition-opacity active:opacity-70"
                style={{
                  background: SYS.fill2,
                  color: SYS.label2,
                  padding: '14px 16px',
                  fontSize: 'clamp(14px, 4vw, 15px)',
                }}
              >
                Lanjut ke akun
              </button>
            </motion.div>

            {/* Guide */}
            <motion.div
              className="mt-5 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Link
                href="/panduan-affiliator"
                style={{ color: SYS.blue, fontSize: 12 }}
                className="transition-opacity active:opacity-60"
              >
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
  const router      = useRouter()
  const { setAuth } = useAuthStore()
  const hydrated    = useAuthHydration()
  const user        = useAuthStore(s => s.user)

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

  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const ref = p.get('ref')?.trim()
    if (!ref) return
    if (ref.startsWith('AFF')) setAffCode(ref)
    else setRefCode(ref)
  }, [])

  const criteria = [
    { label: '8+ karakter',    met: password.length >= 8 },
    { label: 'Huruf besar',    met: /[A-Z]/.test(password) },
    { label: 'Huruf kecil',    met: /[a-z]/.test(password) },
    { label: 'Angka / simbol', met: /[\d\W]/.test(password) },
  ]
  const score         = criteria.filter(c => c.met).length
  const strengthLabel = ['', 'Lemah', 'Cukup', 'Bagus', 'Kuat'][score]
  const strengthColor = [SYS.fill, SYS.red, '#ff9500', '#ffcc00', SYS.green][score]

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
        <div className="w-5 h-5 rounded-full border-2 border-black/10 border-t-black/40 animate-spin" />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center"
      style={{
        background: SYS.bg,
        padding: 'max(env(safe-area-inset-top, 0px), 32px) 20px max(env(safe-area-inset-bottom, 0px), 40px)',
      }}
    >
      {/* Wordmark */}
      <motion.div
        className="mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <span style={{
          color: SYS.label3,
          fontSize: 11,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}>
          Stouch.id
        </span>
      </motion.div>

      {/* Content */}
      <motion.div
        className="w-full"
        style={{ maxWidth: 420 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
      >
        {/* Heading */}
        <div className="text-center mb-7">
          <h1 style={{
            color: SYS.label,
            fontSize: 'clamp(28px, 8vw, 36px)',
            fontWeight: 700,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
          }}>
            Buat Akun
          </h1>
          <p className="mt-2" style={{ color: SYS.label2, fontSize: 'clamp(14px, 4vw, 16px)' }}>
            Bergabung dan mulai trading hari ini
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Input card */}
          <div
            className="rounded-2xl overflow-hidden mb-3"
            style={{ background: SYS.card, boxShadow: SYS.shadow }}
          >
            {/* Email */}
            <div className="px-4" style={{ borderBottom: `0.5px solid ${SYS.sep}` }}>
              <label
                className="block"
                style={{
                  color: SYS.label3,
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  paddingTop: 12,
                  paddingBottom: 4,
                }}
              >
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
                className="w-full bg-transparent focus:outline-none"
                style={{
                  color: SYS.label,
                  fontSize: 'clamp(15px, 4vw, 17px)',
                  caretColor: SYS.blue,
                  paddingBottom: 14,
                }}
              />
            </div>

            {/* Password */}
            <div className="px-4">
              <label
                className="block"
                style={{
                  color: SYS.label3,
                  fontSize: 11,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  paddingTop: 12,
                  paddingBottom: 4,
                }}
              >
                Password
              </label>
              <div className="flex items-center" style={{ paddingBottom: 14 }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  className="flex-1 min-w-0 bg-transparent focus:outline-none"
                  style={{
                    color: SYS.label,
                    fontSize: 'clamp(15px, 4vw, 17px)',
                    caretColor: SYS.blue,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="flex-shrink-0 ml-3 transition-opacity active:opacity-40"
                  style={{ color: SYS.label3 }}
                >
                  <IconEye off={showPw} />
                </button>
              </div>
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
                transition={{ duration: 0.2 }}
              >
                <div className="flex gap-1.5 mb-2">
                  {[0,1,2,3].map(i => (
                    <motion.div
                      key={i}
                      className="flex-1 rounded-full"
                      style={{ height: 3 }}
                      animate={{ background: i < score ? strengthColor : SYS.fill }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {criteria.map(c => (
                      <span
                        key={c.label}
                        className="transition-colors duration-300"
                        style={{ color: c.met ? SYS.green : SYS.label3, fontSize: 11 }}
                      >
                        {c.met ? '✓ ' : '· '}{c.label}
                      </span>
                    ))}
                  </div>
                  {score > 0 && (
                    <span className="flex-shrink-0 font-semibold" style={{ color: strengthColor, fontSize: 11 }}>
                      {strengthLabel}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Terms */}
          <div className="mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="flex-shrink-0" style={{ marginTop: 2 }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => { setAgreed(e.target.checked); if (e.target.checked) setTermWarn(false) }}
                  className="sr-only"
                />
                <div
                  className="flex items-center justify-center transition-all duration-200"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: agreed ? SYS.blue : SYS.fill,
                    outline: termWarn && !agreed ? `1.5px solid ${SYS.red}` : 'none',
                    outlineOffset: 1,
                  }}
                >
                  {agreed && <IconCheck size={12} color="#fff" />}
                </div>
              </div>
              <span className="leading-relaxed" style={{ color: SYS.label2, fontSize: 'clamp(12px, 3.5vw, 14px)' }}>
                Saya menyetujui{' '}
                <a href="/agreement" onClick={e => e.stopPropagation()} style={{ color: SYS.blue }}>
                  Syarat &amp; Ketentuan
                </a>{' '}
                dan{' '}
                <a href="/privacy" onClick={e => e.stopPropagation()} style={{ color: SYS.blue }}>
                  Kebijakan Privasi
                </a>
              </span>
            </label>
            <AnimatePresence>
              {termWarn && !agreed && (
                <motion.p
                  className="mt-2"
                  style={{ color: SYS.red, fontSize: 12, paddingLeft: 34 }}
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
            className="w-full rounded-2xl font-semibold transition-opacity active:opacity-80 disabled:opacity-40"
            style={{
              background: SYS.blue,
              color: '#fff',
              padding: '16px 20px',
              fontSize: 'clamp(15px, 4vw, 17px)',
              letterSpacing: '-0.01em',
              boxShadow: '0 4px 16px rgba(0,122,255,0.28)',
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2.5">
                <span className="inline-block w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                Memproses...
              </span>
            ) : 'Buat Akun'}
          </button>
        </form>

        {/* Benefits */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {['Demo Rp 10 juta', 'Profit 95%', 'Withdrawal cepat'].map(t => (
            <div key={t} className="flex items-center gap-1.5">
              <IconCheck size={12} color={SYS.green} />
              <span style={{ color: SYS.label3, fontSize: 12 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Guide */}
        <div className="mt-4 flex items-center justify-center">
          <Link href="/panduan-affiliator" style={{ color: SYS.label3, fontSize: 12 }}>
            Panduan program affiliator
          </Link>
        </div>
      </motion.div>

      {/* Sign in */}
      <motion.p
        className="mt-8"
        style={{ color: SYS.label3, fontSize: 'clamp(12px, 3.5vw, 14px)' }}
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