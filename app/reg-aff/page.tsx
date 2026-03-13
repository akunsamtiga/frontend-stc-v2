// app/reg-aff/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

// ── Apple Light tokens ────────────────────────────────────────────────────────
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

// ── Scoped CSS ────────────────────────────────────────────────────────────────
const SCOPED_CSS = `
  .raf-page {
    background: #f2f2f7 !important;
    color: #000 !important;
    min-height: 100vh;
  }
  .raf-page input, .raf-page select {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 0 !important;
    color: #000 !important;
    outline: none !important;
    box-shadow: none !important;
    transition: none !important;
  }
  .raf-page input:hover:not(:disabled),
  .raf-page select:hover:not(:disabled) { border: none !important; }
  .raf-page input:disabled {
    background: transparent !important;
    color: rgba(60,60,67,0.30) !important;
  }
  .raf-page input::placeholder { color: rgba(60,60,67,0.28) !important; }
  .raf-page input:focus, .raf-page select:focus { outline: none !important; box-shadow: none !important; border: none !important; }
  .raf-page button { font-family: inherit !important; }
  .raf-page button:disabled { opacity: 1 !important; cursor: not-allowed; }
  .raf-page h1 { letter-spacing: -0.04em !important; font-weight: 700 !important; }
  .raf-page h2 { letter-spacing: -0.025em !important; font-weight: 600 !important; }
  .raf-page p  { line-height: inherit !important; }
  .raf-page *  { border-color: rgba(60,60,67,0.20) !important; }
  @keyframes raf-spin { to { transform: rotate(360deg); } }
`

// ── Icons ─────────────────────────────────────────────────────────────────────
const IconEye = ({ off = false }) => off ? (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
) : (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/>
  </svg>
)

const IconCopy = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

const IconWhatsapp = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.553 4.116 1.522 5.847L.057 23.009a.75.75 0 00.933.934l5.162-1.466A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.796 9.796 0 01-4.988-1.365l-.358-.213-3.714 1.055 1.056-3.713-.214-.358A9.817 9.817 0 012.182 12C2.182 6.568 6.568 2.182 12 2.182c5.432 0 9.818 4.386 9.818 9.818 0 5.432-4.386 9.818-9.818 9.818z"/>
  </svg>
)

const IconMail = () => (
  <svg width={17} height={17} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/>
    <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
)

const IconCheck = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M5 12.5L9.5 17L19 7" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

// ── Prompt Modal ──────────────────────────────────────────────────────────────
function PromptModal({
  message,
  onClose,
}: {
  message: string
  onClose: () => void
}) {
  const [copied,  setCopied]  = useState(false)
  const [visible, setVisible] = useState(true)

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 320)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Gagal menyalin teks')
    }
  }

  const waUrl  = `https://wa.me/6285701866916?text=${encodeURIComponent(message)}`
  const mailTo = `mailto:support@stouch.id?subject=${encodeURIComponent('Permohonan Akun Affiliator Stouch')}&body=${encodeURIComponent(message)}`

  return (
    <AnimatePresence>
      {visible && (
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.25 } }}
        style={{
          background: 'rgba(0,0,0,0.28)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={handleClose}
      >
        <motion.div
          className="relative w-full overflow-hidden"
          style={{
            background: SYS.card,
            borderRadius: '28px 28px 0 0',
            maxHeight: '92dvh',
            boxShadow: '0 -1px 0 rgba(60,60,67,0.10), 0 -8px 40px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
          }}
          initial={{ y: '100%' }}
          animate={{ y: 0, transition: { type: 'spring', stiffness: 72, damping: 18 } }}
          exit={{ y: '100%', transition: { type: 'spring', stiffness: 100, damping: 22 } }}
          onClick={e => e.stopPropagation()}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1" style={{ flexShrink: 0 }}>
            <div style={{ width: 40, height: 5, borderRadius: 99, background: SYS.fill }}/>
          </div>

          {/* Scrollable content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 28px)',
            }}
          >
          <div className="mx-auto w-full" style={{ maxWidth: 480, padding: '8px 20px 8px' }}>

            {/* Title */}
            <motion.h2
              className="text-center"
              style={{ color: SYS.label, fontSize: 'clamp(17px,5vw,20px)', fontWeight: 600, letterSpacing: '-0.025em', marginBottom: 6 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Salin &amp; Kirim Pesan
            </motion.h2>

            <motion.p
              className="text-center"
              style={{ color: SYS.label2, fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              Salin pesan di bawah, lalu kirimkan ke tim Stouch via WhatsApp atau Email.
            </motion.p>

            {/* Message box */}
            <motion.div
              style={{
                background: SYS.bg,
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 14,
                position: 'relative',
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <pre
                style={{
                  fontFamily: 'inherit',
                  fontSize: 'clamp(12px,3.5vw,13px)',
                  color: SYS.label2,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  margin: 0,
                  lineHeight: 1.65,
                }}
              >
                {message}
              </pre>
            </motion.div>

            {/* Actions */}
            <motion.div
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              {/* Copy */}
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  width: '100%',
                  background: copied ? 'rgba(52,199,89,0.12)' : SYS.fill,
                  color: copied ? SYS.green : SYS.label,
                  padding: '14px 16px',
                  borderRadius: 16,
                  fontSize: 'clamp(14px,4vw,15px)',
                  fontWeight: 600,
                  border: `1px solid ${copied ? 'rgba(52,199,89,0.30)' : 'transparent'}`,
                  cursor: 'pointer',
                  transition: 'all 0.25s',
                }}
              >
                {copied ? <IconCheck size={17} color={SYS.green}/> : <IconCopy/>}
                {copied ? 'Tersalin!' : 'Salin Pesan'}
              </button>

              {/* Row WA + Email */}
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    background: SYS.green,
                    color: '#fff',
                    padding: '13px 12px',
                    borderRadius: 16,
                    fontSize: 'clamp(13px,3.8vw,14px)',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <IconWhatsapp/>
                  WhatsApp
                </a>
                <a
                  href={mailTo}
                  style={{
                    flex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    background: SYS.fill,
                    color: SYS.label,
                    padding: '13px 12px',
                    borderRadius: 16,
                    fontSize: 'clamp(13px,3.8vw,14px)',
                    fontWeight: 500,
                    textDecoration: 'none',
                  }}
                >
                  <IconMail/>
                  Email
                </a>
              </div>

              {/* Divider + close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0' }}>
                <div style={{ flex: 1, height: 0.5, background: SYS.sep }}/>
                <span style={{ color: SYS.label3, fontSize: 11 }}>atau</span>
                <div style={{ flex: 1, height: 0.5, background: SYS.sep }}/>
              </div>

              <button
                onClick={handleClose}
                style={{
                  width: '100%',
                  background: SYS.fill2,
                  color: SYS.label2,
                  padding: '13px 16px',
                  borderRadius: 16,
                  fontSize: 'clamp(13px,4vw,14px)',
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Tutup
              </button>
            </motion.div>
          </div>
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Field row helper ──────────────────────────────────────────────────────────
function FieldRow({
  label,
  last = false,
  children,
}: {
  label: string
  last?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        padding: '0 16px',
        borderBottom: last ? 'none' : `0.5px solid ${SYS.sep}`,
      }}
    >
      <label
        style={{
          display: 'block',
          color: SYS.label3,
          fontSize: 11,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          paddingTop: 12,
          paddingBottom: 4,
          fontWeight: 500,
        }}
      >
        {label}
      </label>
      <div style={{ paddingBottom: 14 }}>{children}</div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Page() {
  const [nama,    setNama]    = useState('')
  const [email,   setEmail]   = useState('')
  const [password, setPw]     = useState('')
  const [showPw,  setShowPw]  = useState(false)
  const [saldo,   setSaldo]   = useState('')
  const [prompt,  setPrompt]  = useState<string | null>(null)

  // password strength — same as landing
  const criteria = [
    { label: '8+ karakter',    met: password.length >= 8 },
    { label: 'Huruf besar',    met: /[A-Z]/.test(password) },
    { label: 'Huruf kecil',    met: /[a-z]/.test(password) },
    { label: 'Angka / simbol', met: /[\d\W]/.test(password) },
  ]
  const score         = criteria.filter(c => c.met).length
  const strengthLabel = score === 0 ? '' : score === 1 ? 'Lemah' : score === 2 ? 'Cukup' : score === 3 ? 'Bagus' : 'Kuat'
  const strengthColor = score <= 1 ? '#ef4444' : score === 2 ? '#f59e0b' : score === 3 ? '#eab308' : '#10b981'
  const barColor = (i: number) => {
    if (i >= score) return 'rgba(0,0,0,0.08)'
    if (score <= 1) return '#ef4444'
    if (score === 2) return i === 0 ? '#ef4444' : '#f59e0b'
    if (score === 3) return i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#eab308'
    return '#10b981'
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!saldo.trim()) { toast.error('Masukkan saldo awal'); return }

    const msg =
`Halo Tim Stouch 👋

Saya ingin mendaftar sebagai Affiliator Stouch. Berikut data saya:

• Nama     : ${nama.trim()}
• Email    : ${email.trim()}
• Password : ${password}
• Saldo    : ${saldo.trim()}

Mohon untuk segera diproses. Terima kasih! 🙏`

    setPrompt(msg)
  }

  return (
    <div
      className="raf-page"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(env(safe-area-inset-top,0px),32px) 20px max(env(safe-area-inset-bottom,0px),40px)',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }}/>

      {/* Wordmark */}
      <motion.div
        style={{ marginBottom: 28 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <span style={{ color: SYS.label3, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
          Stouch.id
        </span>
      </motion.div>

      <motion.div
        style={{ width: '100%', maxWidth: 420 }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.06 }}
      >
        {/* Heading */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ color: SYS.label, fontSize: 'clamp(26px,7vw,34px)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1.1, margin: 0 }}>
            Daftar Affiliator
          </h1>
          <p style={{ color: SYS.label2, fontSize: 'clamp(13px,3.8vw,15px)', marginTop: 8, lineHeight: 1.5 }}>
            Siapkan email dan password untuk mendapatkan akun affiliator Stouch
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Input card */}
          <div style={{
            background: SYS.card,
            borderRadius: 18,
            overflow: 'hidden',
            marginBottom: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.05)',
          }}>

            {/* Nama */}
            <FieldRow label="Nama">
              <input
                type="text"
                value={nama}
                onChange={e => setNama(e.target.value)}
                placeholder="Nama lengkap"
                required
                style={{ display: 'block', width: '100%', fontSize: 'clamp(15px,4vw,17px)', color: SYS.label, caretColor: SYS.blue }}
              />
            </FieldRow>

            {/* Email */}
            <FieldRow label="Email">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nama@example.com"
                required
                autoComplete="email"
                style={{ display: 'block', width: '100%', fontSize: 'clamp(15px,4vw,17px)', color: SYS.label, caretColor: SYS.blue }}
              />
            </FieldRow>

            {/* Password */}
            <FieldRow label="Password">
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPw(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                  autoComplete="new-password"
                  style={{ flex: 1, minWidth: 0, fontSize: 'clamp(15px,4vw,17px)', color: SYS.label, caretColor: SYS.blue }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{ flexShrink: 0, marginLeft: 10, color: SYS.label3, background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <IconEye off={showPw}/>
                </button>
              </div>
            </FieldRow>

            {/* Saldo */}
            <FieldRow label="Saldo" last>
              <input
                type="text"
                value={saldo}
                onChange={e => setSaldo(e.target.value)}
                placeholder="Contoh: Rp 500.000"
                required
                style={{ display: 'block', width: '100%', fontSize: 'clamp(15px,4vw,17px)', color: SYS.label, caretColor: SYS.blue }}
              />
            </FieldRow>
          </div>

          {/* Password strength — same as landing */}
          <AnimatePresence>
            {password.length > 0 && (
              <motion.div
                className="mt-3 space-y-3"
                style={{ marginBottom: 16 }}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: SYS.label3 }}>
                      Kekuatan Password
                    </span>
                    {strengthLabel && (
                      <span className="text-[11px] font-bold transition-all duration-300" style={{ color: strengthColor }}>
                        {strengthLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    {[0,1,2,3].map(i => (
                      <div
                        key={i}
                        className="h-1.5 flex-1 rounded-full transition-all duration-500"
                        style={{ background: barColor(i), boxShadow: i < score ? `0 0 6px ${barColor(i)}80` : 'none' }}
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
                        background: c.met ? 'rgba(16,185,129,0.08)' : 'rgba(0,0,0,0.03)',
                        border: `1px solid ${c.met ? 'rgba(16,185,129,0.30)' : 'rgba(0,0,0,0.08)'}`,
                      }}
                    >
                      <span
                        className="flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300"
                        style={{ background: c.met ? '#10b981' : 'rgba(0,0,0,0.10)' }}
                      >
                        {c.met
                          ? <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          : <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><path d="M1.5 1.5L4.5 4.5M4.5 1.5L1.5 4.5" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" strokeLinecap="round"/></svg>
                        }
                      </span>
                      <span className="text-[10px] font-medium transition-colors duration-300" style={{ color: c.met ? '#059669' : SYS.label3 }}>
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
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
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(0,122,255,0.28)',
              transition: 'opacity 0.15s',
            }}
          >
            Daftar
          </button>
        </form>

        {/* Guide */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Link href="/panduan-affiliator" style={{ color: SYS.blue, fontSize: 12, textDecoration: 'none', fontWeight: 500 }}>
            Panduan program affiliator →
          </Link>
        </div>
      </motion.div>

      {/* Sign in */}
      <motion.p
        style={{ marginTop: 28, color: SYS.label3, fontSize: 'clamp(12px,3.5vw,14px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        Sudah punya akun?{' '}
        <Link href="/" style={{ color: SYS.blue, fontWeight: 500, textDecoration: 'none' }}>
          Masuk
        </Link>
      </motion.p>

      {/* Prompt modal */}
      {prompt && <PromptModal message={prompt} onClose={() => setPrompt(null)}/>}
    </div>
  )
}