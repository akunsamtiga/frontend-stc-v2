'use client'

import { use, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Eye, EyeOff, Lock, CheckCircle2, ArrowRight,
  Loader2, ShieldCheck, UserPlus,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { showError, showSuccess } from '@/lib/toast-manager'

interface Props {
  params: Promise<{ code: string }>
}

interface FormState {
  email: string
  password: string
  referralCode: string
}

interface FieldErrors {
  email?: string
  password?: string
}

// ─── Password strength ────────────────────────────────────────────────────────

function getPasswordStrength(password: string): number {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[\d\W]/.test(password)) score++
  return score
}

const STRENGTH_LABEL = ['', 'Lemah', 'Cukup', 'Baik', 'Kuat']
const STRENGTH_COLOR = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e']

// ─── Component ────────────────────────────────────────────────────────────────

export default function RefPage({ params }: Props) {
  const { code } = use(params)  // ← React.use() untuk client component
  const router = useRouter()
  const { setAuth, isAuthenticated } = useAuthStore()
  const affiliateCode = code.toUpperCase()

  const [form, setForm] = useState<FormState>({ email: '', password: '', referralCode: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [inviterName, setInviterName] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  // Fetch nama pengundang
  useEffect(() => {
    api.getAffiliatorPublicInfo(affiliateCode)
      .then((res: any) => setInviterName(res.data?.name ?? null))
      .catch(() => setInviterName(null))
  }, [affiliateCode])

  const strength = getPasswordStrength(form.password)

  // Redirect jika sudah login
  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard')
  }, [isAuthenticated, router])

  // Focus email saat mount
  useEffect(() => {
    emailRef.current?.focus()
  }, [])

  const validate = (): boolean => {
    const next: FieldErrors = {}
    if (!form.email.trim()) {
      next.email = 'Email wajib diisi'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Format email tidak valid'
    }
    if (!form.password) {
      next.password = 'Password wajib diisi'
    } else if (form.password.length < 8) {
      next.password = 'Password minimal 8 karakter'
    } else if (strength < 3) {
      next.password = 'Password harus mengandung huruf besar, huruf kecil, dan angka/simbol'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name as keyof FieldErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate() || isLoading) return

    setIsLoading(true)
    try {
      const res = await api.register(
        form.email.trim().toLowerCase(),
        form.password,
        form.referralCode.trim() || undefined,
        affiliateCode,
      )
      const { user, token } = res.data

      setAuth(user, token)
      setIsDone(true)

      showSuccess('Akun berhasil dibuat!', {
        description: `Selamat datang, ${user.profile?.fullName || user.email}`,
      })

      setTimeout(() => router.replace('/dashboard'), 1500)
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Registrasi gagal. Silakan coba lagi.'
      showError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────
  if (isDone) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/30 flex items-center justify-center animate-bounce-once">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <p className="text-white text-2xl font-bold">Selamat datang!</p>
          <p className="text-slate-400 text-sm">Mengarahkan ke dashboard…</p>
        </div>
      </div>
    )
  }

  // ── Main form ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col">

      {/* Background ambience */}
      <div className="fixed inset-0 pointer-events-none select-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.04] blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] translate-x-1/2 translate-y-1/2 rounded-full bg-sky-500/[0.04] blur-[120px]" />
        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative flex flex-col items-center justify-center flex-1 px-4 py-14">

        {/* Logo */}
        <Link href="/" className="mb-8 group flex items-center gap-1.5">
          <span className="text-2xl font-black tracking-tight text-white group-hover:text-emerald-400 transition-colors duration-200">
            Stouch<span className="text-emerald-400">.</span>id
          </span>
        </Link>

        {/* Invite badge */}
        <div className="mb-5 inline-flex items-center gap-2.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-2.5 text-sm text-emerald-300 shadow-lg shadow-emerald-500/5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            {inviterName
              ? <>Diundang oleh&nbsp;<span className="font-bold text-white">{inviterName}</span></>
              : <>Diundang via kode&nbsp;<span className="font-mono font-bold text-white tracking-[0.15em]">{affiliateCode}</span></>
            }
          </span>
        </div>

        {/* Card */}
        <div className="w-full max-w-[440px] rounded-2xl border border-white/[0.06] bg-[#0d1524]/90 backdrop-blur-2xl shadow-2xl shadow-black/60 overflow-hidden">

          {/* Card header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/[0.05]">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center ring-1 ring-emerald-500/25">
                <UserPlus className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Buat Akun Baru</h1>
            </div>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Sudah punya akun?{' '}
              <Link
                href="/login"
                className="text-emerald-400 hover:text-emerald-300 transition-colors font-medium underline underline-offset-2 decoration-emerald-400/40"
              >
                Masuk di sini
              </Link>
            </p>
          </div>

          {/* Form body */}
          <form onSubmit={handleSubmit} noValidate className="px-8 py-7 space-y-5">

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Email
              </label>
              <input
                ref={emailRef}
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="nama@email.com"
                autoComplete="email"
                disabled={isLoading}
                className={`
                  w-full rounded-xl border bg-[#131e30] px-4 py-3 text-sm text-white
                  placeholder-slate-600 outline-none transition-all duration-200
                  focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${errors.email
                    ? 'border-red-500/50 focus:ring-red-500/20'
                    : 'border-white/[0.08] hover:border-white/[0.14]'
                  }
                `}
              />
              {errors.email && (
                <p className="text-xs text-red-400 flex items-center gap-1.5 mt-1">
                  <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 8 karakter"
                  autoComplete="new-password"
                  disabled={isLoading}
                  className={`
                    w-full rounded-xl border bg-[#131e30] px-4 py-3 pr-11 text-sm text-white
                    placeholder-slate-600 outline-none transition-all duration-200
                    focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${errors.password
                      ? 'border-red-500/50 focus:ring-red-500/20'
                      : 'border-white/[0.08] hover:border-white/[0.14]'
                    }
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  disabled={isLoading}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="space-y-1.5 mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="h-[3px] flex-1 rounded-full transition-all duration-300"
                        style={{
                          backgroundColor: i <= strength
                            ? STRENGTH_COLOR[strength]
                            : 'rgba(255,255,255,0.07)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px]" style={{ color: STRENGTH_COLOR[strength] }}>
                    Kekuatan: {STRENGTH_LABEL[strength]}
                  </p>
                </div>
              )}

              {errors.password && (
                <p className="text-xs text-red-400 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Referral code (opsional, dari teman) */}
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                Kode Referral Teman{' '}
                <span className="normal-case font-normal text-slate-700">(opsional)</span>
              </label>
              <input
                type="text"
                name="referralCode"
                value={form.referralCode}
                onChange={handleChange}
                placeholder="Contoh: REF123ABC"
                disabled={isLoading}
                className="w-full rounded-xl border border-white/[0.08] hover:border-white/[0.14] bg-[#131e30] px-4 py-3
                  text-sm text-white placeholder-slate-600 outline-none transition-all duration-200
                  focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50
                  disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Affiliate code — locked */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                <Lock className="w-3 h-3" />
                Kode Affiliate
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={affiliateCode}
                  readOnly
                  tabIndex={-1}
                  className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 pr-11
                    font-mono text-sm font-bold text-emerald-300 tracking-[0.2em]
                    outline-none cursor-not-allowed select-none"
                />
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500/40" />
              </div>
              <p className="text-[11px] text-slate-600">
                Kode ini sudah terhubung otomatis dari link undangan kamu.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full mt-1 flex items-center justify-center gap-2.5
                rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600
                px-6 py-3.5 text-sm font-bold text-black
                transition-all duration-200
                shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/35
                disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
              "
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Membuat akun…
                </>
              ) : (
                <>
                  Daftar Sekarang
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-7">
            <p className="text-center text-[11px] text-slate-700 leading-relaxed">
              Dengan mendaftar kamu menyetujui{' '}
              <Link href="/terms" className="text-slate-500 hover:text-white transition-colors underline underline-offset-2">
                Syarat & Ketentuan
              </Link>{' '}
              dan{' '}
              <Link href="/privacy" className="text-slate-500 hover:text-white transition-colors underline underline-offset-2">
                Kebijakan Privasi
              </Link>{' '}
              Stouch.id
            </p>
          </div>
        </div>

        {/* Bonus note */}
        <div className="mt-6 flex items-center gap-2 text-xs text-slate-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60 shrink-0" />
          Akun baru mendapat saldo demo Rp 10.000.000 untuk latihan trading
        </div>

      </div>
    </div>
  )
}