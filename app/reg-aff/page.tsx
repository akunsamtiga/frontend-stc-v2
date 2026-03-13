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
  blue:   '#007aff',
  green:  '#34c759',
  bg:     '#f2f2f7',
  card:   '#ffffff',
  label:  '#000000',
  label2: 'rgba(60,60,67,0.60)',
  label3: 'rgba(60,60,67,0.30)',
  sep:    'rgba(60,60,67,0.20)',
  fill:   'rgba(120,120,128,0.16)',
  fill2:  'rgba(120,120,128,0.08)',
  red:    '#ff3b30',
}

// ── Scoped CSS — resets all globals.css conflicts inside .raf-page ───────────
const SCOPED_CSS = `
  /* Page bg — overrides body { bg-white } from globals */
  .raf-page {
    background: #f2f2f7 !important;
    color: #000000 !important;
    min-height: 100vh;
  }

  /* Inputs — overrides globals input { bg-white border border-gray-200 rounded-lg px-4 py-2.5 ... } */
  .raf-page input {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    color: #000000 !important;
    outline: none !important;
    box-shadow: none !important;
    ring: none !important;
    transition: none !important;
  }
  .raf-page input:hover:not(:disabled) {
    border: none !important;
  }
  .raf-page input:disabled {
    background: transparent !important;
    color: rgba(60,60,67,0.30) !important;
    cursor: not-allowed;
  }
  .raf-page input::placeholder {
    color: rgba(60,60,67,0.28) !important;
  }
  .raf-page input:focus {
    outline: none !important;
    ring: none !important;
    box-shadow: none !important;
    border: none !important;
  }

  /* Buttons — overrides globals button { transition-colors font-medium } and button:disabled { opacity-50 } */
  .raf-page button {
    font-family: inherit !important;
    letter-spacing: inherit !important;
  }
  .raf-page button:disabled {
    opacity: 1 !important;
    cursor: not-allowed;
  }

  /* Headings — overrides h1,h2... { font-bold; letter-spacing: -0.02em } */
  .raf-page h1 {
    letter-spacing: -0.04em !important;
    font-weight: 700 !important;
  }
  .raf-page h2 {
    letter-spacing: -0.025em !important;
    font-weight: 600 !important;
  }

  /* Paragraphs — overrides p { leading-relaxed } */
  .raf-page p {
    line-height: inherit !important;
  }

  /* Global * { border-gray-200 } bleeds border-color onto everything */
  .raf-page * {
    border-color: rgba(60,60,67,0.20) !important;
  }

  /* Scrollbar — light themed */
  .raf-page ::-webkit-scrollbar-track {
    background: #f2f2f7 !important;
  }
  .raf-page ::-webkit-scrollbar-thumb {
    background: rgba(60,60,67,0.20) !important;
  }
`

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

// ── Success modal ─────────────────────────────────────────────────────────────
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
            boxShadow: '0 -1px 0 rgba(60,60,67,0.12), 0 -8px 40px rgba(0,0,0,0.08)',
          }}
          initial={{ y: '100%' }}
          animate={{ y: 0, transition: { type: 'spring', stiffness: 72, damping: 18 } }}
          exit={{ y: '100%', transition: { type: 'spring', stiffness: 110, damping: 24 } }}
          onClick={e => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div style={{ width: 40, height: 5, borderRadius: 99, background: SYS.fill }} />
          </div>

          <div className="mx-auto w-full" style={{ maxWidth: 480, padding: '12px 20px 8px' }}>

            {/* Icon */}
            <motion.div
              className="mx-auto mb-5 flex items-center justify-center"
              style={{ width: 68, height: 68, borderRadius: '50%', background: 'rgba(52,199,89,0.12)', flexShrink: 0 }}
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

            {/* Title */}
            <motion.h2
              className="text-center"
              style={{ color: SYS.label, fontSize: 'clamp(18px,5vw,22px)', fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 8 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
            >
              Akun berhasil dibuat
            </motion.h2>

            <motion.p
              className="text-center"
              style={{ color: SYS.label2, fontSize: 'clamp(13px,3.5vw,15px)', lineHeight: 1.55, marginBottom: 20 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.21 }}
            >
              Ingin bergabung sebagai{' '}
              <span style={{ color: SYS.label, fontWeight: 500 }}>affiliator Stouch</span>{' '}
              dan dapatkan komisi dari setiap trader yang kamu ajak?
            </motion.p>

            {/* Benefits */}
            <motion.div
              style={{ background: SYS.bg, borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}
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
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px',
                    borderBottom: i < arr.length - 1 ? `0.5px solid ${SYS.sep}` : 'none',
                  }}
                >
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(52,199,89,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconCheck size={11} color={SYS.green} />
                  </div>
                  <span style={{ color: SYS.label2, fontSize: 'clamp(12px,3.5vw,14px)' }}>{item}</span>
                </div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.31 }}
            >
              <a
                href="https://wa.me/6285701866916?text=Halo%20Stouch%2C%20saya%20baru%20saja%20membuat%20akun%20dan%20ingin%20mengajukan%20permohonan%20sebagai%20affiliator."
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: SYS.green, color: '#fff',
                  padding: '14px 16px', borderRadius: 16,
                  fontSize: 'clamp(14px,4vw,15px)', fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <IconWhatsapp />
                Daftar via WhatsApp
              </a>

              <a
                href="mailto:support@stouch.id?subject=Permohonan%20Affiliator&body=Halo%20Stouch%2C%20saya%20baru%20saja%20membuat%20akun%20dan%20ingin%20mengajukan%20permohonan%20sebagai%20affiliator."
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: SYS.fill, color: SYS.label,
                  padding: '14px 16px', borderRadius: 16,
                  fontSize: 'clamp(14px,4vw,15px)', fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                <IconMail />
                Kirim via Email
              </a>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
                <div style={{ flex: 1, height: 0.5, background: SYS.sep }} />
                <span style={{ color: SYS.label3, fontSize: 12 }}>atau</span>
                <div style={{ flex: 1, height: 0.5, background: SYS.sep }} />
              </div>

              <button
                onClick={onClose}
                style={{
                  width: '100%', background: SYS.fill2, color: SYS.label2,
                  padding: '14px 16px', borderRadius: 16,
                  fontSize: 'clamp(14px,4vw,15px)', fontWeight: 500,
                  border: 'none', cursor: 'pointer',
                }}
              >
                Lanjut ke akun
              </button>
            </motion.div>

            {/* Guide */}
            <motion.div
              style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Link href="/panduan-affiliator" style={{ color: SYS.blue, fontSize: 12, textDecoration: 'none' }}>
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
      <div className="raf-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />
        <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.1)', borderTopColor: 'rgba(0,0,0,0.4)', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div
      className="raf-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(env(safe-area-inset-top, 0px), 32px) 20px max(env(safe-area-inset-bottom, 0px), 40px)',
      }}
    >
      {/* Scoped style overrides */}
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />

      {/* Wordmark */}
      <motion.div
        style={{ marginBottom: 32 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <span style={{ color: SYS.label3, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
          Stouch.id
        </span>
      </motion.div>

      {/* Card area */}
      <motion.div
        style={{ width: '100%', maxWidth: 420 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
      >
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ color: SYS.label, fontSize: 'clamp(28px,8vw,36px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0 }}>
            Buat Akun
          </h1>
          <p style={{ color: SYS.label2, fontSize: 'clamp(14px,4vw,16px)', marginTop: 8, lineHeight: 1.4 }}>
            Bergabung dan mulai trading hari ini
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Input group card */}
          <div style={{ background: SYS.card, borderRadius: 18, overflow: 'hidden', marginBottom: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.05)' }}>

            {/* Email */}
            <div style={{ padding: '12px 16px 0', borderBottom: `0.5px solid ${SYS.sep}` }}>
              <label style={{ display: 'block', color: SYS.label3, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 500 }}>
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
                style={{ display: 'block', width: '100%', paddingBottom: 14, fontSize: 'clamp(15px,4vw,17px)', color: SYS.label, caretColor: SYS.blue }}
              />
            </div>

            {/* Password */}
            <div style={{ padding: '12px 16px 0' }}>
              <label style={{ display: 'block', color: SYS.label3, fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, fontWeight: 500 }}>
                Password
              </label>
              <div style={{ display: 'flex', alignItems: 'center', paddingBottom: 14 }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  disabled={loading}
                  autoComplete="new-password"
                  style={{ flex: 1, minWidth: 0, fontSize: 'clamp(15px,4vw,17px)', color: SYS.label, caretColor: SYS.blue }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{ flexShrink: 0, marginLeft: 12, color: SYS.label3, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
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
                style={{ marginBottom: 16, padding: '0 4px' }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  {[0,1,2,3].map(i => (
                    <motion.div
                      key={i}
                      style={{ flex: 1, height: 3, borderRadius: 99 }}
                      animate={{ background: i < score ? strengthColor : SYS.fill }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 12px' }}>
                    {criteria.map(c => (
                      <span key={c.label} style={{ color: c.met ? SYS.green : SYS.label3, fontSize: 11, transition: 'color 0.3s' }}>
                        {c.met ? '✓ ' : '· '}{c.label}
                      </span>
                    ))}
                  </div>
                  {score > 0 && (
                    <span style={{ color: strengthColor, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                      {strengthLabel}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Terms */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
              <div style={{ flexShrink: 0, marginTop: 2 }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => { setAgreed(e.target.checked); if (e.target.checked) setTermWarn(false) }}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: agreed ? SYS.blue : SYS.fill,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  outline: termWarn && !agreed ? `1.5px solid ${SYS.red}` : 'none',
                  outlineOffset: 1,
                  transition: 'background 0.2s',
                }}>
                  {agreed && <IconCheck size={12} color="#fff" />}
                </div>
              </div>
              <span style={{ color: SYS.label2, fontSize: 'clamp(12px,3.5vw,14px)', lineHeight: 1.55 }}>
                Saya menyetujui{' '}
                <a href="/agreement" onClick={e => e.stopPropagation()} style={{ color: SYS.blue, textDecoration: 'none' }}>
                  Syarat &amp; Ketentuan
                </a>{' '}dan{' '}
                <a href="/privacy" onClick={e => e.stopPropagation()} style={{ color: SYS.blue, textDecoration: 'none' }}>
                  Kebijakan Privasi
                </a>
              </span>
            </label>
            <AnimatePresence>
              {termWarn && !agreed && (
                <motion.p
                  style={{ color: SYS.red, fontSize: 12, paddingLeft: 34, marginTop: 6, lineHeight: 1.4 }}
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
            style={{
              width: '100%',
              background: SYS.blue,
              color: '#fff',
              padding: '16px 20px',
              borderRadius: 16,
              fontSize: 'clamp(15px,4vw,17px)',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.55 : 1,
              boxShadow: loading ? 'none' : '0 4px 16px rgba(0,122,255,0.28)',
              transition: 'opacity 0.15s, box-shadow 0.15s',
            }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', display: 'inline-block', animation: 'raf-spin 0.8s linear infinite' }} />
                Memproses...
              </span>
            ) : 'Buat Akun'}
          </button>

          {/* Inline spinner keyframes */}
          <style dangerouslySetInnerHTML={{ __html: `@keyframes raf-spin { to { transform: rotate(360deg); } }` }} />
        </form>

        {/* Benefits */}
        <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '8px 20px' }}>
          {['Demo Rp 10 juta', 'Profit 95%', 'Withdrawal cepat'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <IconCheck size={12} color={SYS.green} />
              <span style={{ color: SYS.label3, fontSize: 12 }}>{t}</span>
            </div>
          ))}
        </div>

        {/* Guide */}
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Link href="/panduan-affiliator" style={{ color: SYS.label3, fontSize: 12, textDecoration: 'none' }}>
            Panduan program affiliator
          </Link>
        </div>
      </motion.div>

      {/* Sign in */}
      <motion.p
        style={{ marginTop: 32, color: SYS.label3, fontSize: 'clamp(12px,3.5vw,14px)', lineHeight: 1.4 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        Sudah punya akun?{' '}
        <Link href="/" style={{ color: SYS.blue, fontWeight: 500, textDecoration: 'none' }}>
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