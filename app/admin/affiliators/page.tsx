'use client'

// ============================================================
// app/admin/affiliators/page.tsx
// Halaman Admin untuk mengelola program Affiliator
// ============================================================

import { useState, useEffect, useCallback } from 'react'
import React from 'react'
import {
  Users,
  CurrencyDollar,
  ShareNetwork,
  CheckCircle,
  XCircle,
  Clock,
  ArrowsClockwise,
  MagnifyingGlass,
  Plus,
  Minus,
  Warning,
  ArrowLineUp,
  ToggleRight,
  ToggleLeft,
  X,
  PencilSimple,
  Link,
  Shuffle,
} from 'phosphor-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { motion, type Variants } from 'framer-motion'
import type {
  AffiliatorListItem,
  AdminCommissionWithdrawal,
  AssignAffiliatorDto,
  UpdateAffiliatorConfigDto,
  ApproveCommissionWithdrawalDto,
} from '@/types'

// ── Global Styles ──────────────────────────────────────────────
const GlobalStyles = () => (
  <style jsx global>{`
    :root {
      --glass-bg: rgba(255,255,255,0.04);
      --glass-bg-hover: rgba(255,255,255,0.08);
      --glass-border: rgba(255,255,255,0.09);
      --glass-border-hover: rgba(255,255,255,0.18);
      --glass-shadow: 0 8px 32px rgba(0,0,0,0.4);
      --glass-shadow-hover: 0 16px 48px rgba(0,0,0,0.5);
    }
    .bg-pattern-grid {
      background-color: #060918;
      background-image: none;
      position: relative;
    }
    .bg-pattern-grid::before {
      content: '';
      position: fixed;
      inset: 0;
      background:
        radial-gradient(ellipse 80% 60% at 10% 20%, rgba(139,92,246,0.16) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 85% 10%, rgba(99,102,241,0.12) 0%, transparent 55%),
        radial-gradient(ellipse 70% 60% at 70% 80%, rgba(6,182,212,0.08) 0%, transparent 55%),
        radial-gradient(ellipse 50% 40% at 20% 85%, rgba(168,85,247,0.07) 0%, transparent 50%);
      pointer-events: none;
      z-index: 0;
    }
    .bg-pattern-grid::after {
      content: '';
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px);
      background-size: 48px 48px;
      pointer-events: none;
      z-index: 0;
    }
    body { background-color: #060918 !important; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
    .stat-card { transition: transform 0.2s cubic-bezier(0.22,1,0.36,1), box-shadow 0.25s ease; }
    .stat-card:hover { transform: translateY(-2px); }
    .stat-icon { transition: transform 0.2s ease; }
    .stat-card:hover .stat-icon { transform: scale(1.12); }
    .glow-indigo { box-shadow: 0 0 20px rgba(99,102,241,0.25), var(--glass-shadow); }
    .glow-green  { box-shadow: 0 0 20px rgba(16,185,129,0.20), var(--glass-shadow); }
    .glow-red    { box-shadow: 0 0 20px rgba(239,68,68,0.20),  var(--glass-shadow); }
    .glass-card {
      background: var(--glass-bg);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid var(--glass-border);
      box-shadow: var(--glass-shadow), inset 0 1px 0 rgba(255,255,255,0.06);
      transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s cubic-bezier(0.22,1,0.36,1);
    }
    .glass-card:hover {
      background: var(--glass-bg-hover);
      border-color: var(--glass-border-hover);
      box-shadow: var(--glass-shadow-hover), inset 0 1px 0 rgba(255,255,255,0.10);
    }
    .glass-sub {
      background: rgba(255,255,255,0.04);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.07);
    }
    .glass-input {
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.10);
    }
    .glass-modal {
      background: rgba(6,9,24,0.92);
      backdrop-filter: blur(28px) saturate(180%);
      -webkit-backdrop-filter: blur(28px) saturate(180%);
      border: 1px solid rgba(255,255,255,0.10);
    }
  `}</style>
)

// ── Motion primitives ──────────────────────────────────────────
const SPRING = { type: 'spring', stiffness: 80, damping: 20 } as const
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { ...SPRING } },
}
const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { ...SPRING } },
}
const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { ...SPRING } },
}
const stagger = (delay = 0.06): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.04 } },
})

function Reveal({ children, variants = fadeUp, delay = 0, className = '' }: {
  children: React.ReactNode; variants?: Variants; delay?: number; className?: string
}) {
  return (
    <motion.div className={className} variants={variants} initial="hidden"
      whileInView="visible" viewport={{ once: true, margin: '-60px' }}
      transition={{ delay }}>
      {children}
    </motion.div>
  )
}

function AnimatedHeadline({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.h1 className={className} style={style}
      variants={stagger(0.07)} initial="hidden" animate="visible">
      {text.split(' ').map((word, i) => (
        <motion.span key={i}
          variants={{ hidden: { opacity: 0, y: 30, filter: 'blur(4px)' }, visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...SPRING } } }}
          className="inline-block mr-[0.25em]">{word}
        </motion.span>
      ))}
    </motion.h1>
  )
}

function CountUp({ to, suffix = '', prefix = '', decimals = 0 }: { to: number; suffix?: string; prefix?: string; decimals?: number }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [val, setVal] = React.useState(0)
  const triggered = React.useRef(false)
  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || triggered.current) return
      triggered.current = true
      const duration = 900
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / duration, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setVal(parseFloat((ease * to).toFixed(decimals)))
        if (p < 1) requestAnimationFrame(tick)
        else setVal(to)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [to, decimals])
  return <span ref={ref}>{prefix}{val.toLocaleString('id-ID')}{suffix}</span>
}

// ── Helpers ──────────────────────────────────────────────────

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function withdrawStatusMeta(status: string) {
  switch (status) {
    case 'pending':  return { label: 'Pending',  cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: <Clock className="w-3.5 h-3.5" weight="fill" /> }
    case 'approved': return { label: 'Approved', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30',     icon: <CheckCircle className="w-3.5 h-3.5" weight="fill" /> }
    case 'completed':return { label: 'Selesai',  cls: 'bg-green-500/15 text-green-400 border-green-500/30',  icon: <CheckCircle className="w-3.5 h-3.5" weight="fill" /> }
    case 'rejected': return { label: 'Ditolak',  cls: 'bg-red-500/15 text-red-400 border-red-500/30',       icon: <XCircle className="w-3.5 h-3.5" weight="fill" /> }
    default:         return { label: status,     cls: 'bg-slate-500/15 text-slate-400 border-slate-500/30',  icon: null }
  }
}

// ── Modal: Assign Affiliator ──────────────────────────────────
//
// PERUBAHAN: Tambah field "Kode Kustom" (opsional).
// Jika diisi → dikirim sebagai `customCode` ke backend.
// Jika kosong → backend auto-generate kode AFF+8char.
// Preview link langsung muncul saat admin ketik kode.

function AssignModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [userId, setUserId] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [revenueShare, setRevenueShare] = useState('50')
  const [unlockThreshold, setUnlockThreshold] = useState('5')
  const [initialRealBalance, setInitialRealBalance] = useState('')
  const [loading, setLoading] = useState(false)

  // Validasi format kode: hanya alfanumerik, tanda hubung, underscore
  const codeError = customCode && !/^[A-Za-z0-9_-]+$/.test(customCode)
    ? 'Hanya huruf, angka, - dan _'
    : customCode && (customCode.length < 3 || customCode.length > 20)
    ? 'Panjang 3–20 karakter'
    : ''

  // Normalize ke huruf besar untuk preview
  const previewCode = customCode.trim().toUpperCase()
  const shareLink = previewCode ? `stouch.id/ref/${previewCode}` : ''

  const handleAssign = async () => {
    if (!userId.trim()) { toast.error('User ID wajib diisi.'); return }
    if (codeError) { toast.error(codeError); return }
    setLoading(true)
    try {
      const dto: AssignAffiliatorDto = {
        unlockThreshold: Number(unlockThreshold),
        ...(customCode.trim() ? { customCode: customCode.trim().toUpperCase() } : {}),
        ...(initialRealBalance && Number(initialRealBalance) > 0 ? { initialRealBalance: Number(initialRealBalance) } : {}),
      }
      await api.adminAssignAffiliator(userId.trim(), dto)
      const balanceInfo = initialRealBalance && Number(initialRealBalance) > 0
        ? ` + saldo awal ${formatRupiah(Number(initialRealBalance))}`
        : ''
      toast.success(
        customCode.trim()
          ? `Affiliator berhasil! Kode: ${previewCode}${balanceInfo}`
          : `User berhasil dijadikan affiliator!${balanceInfo}`
      )
      onSuccess()
      onClose()
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md glass-modal rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...SPRING }}
        >
          <div className="p-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-purple-400" weight="bold" />
                </div>
                Assign Affiliator
              </h3>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg glass-sub hover:border-white/20 text-slate-400 hover:text-white transition-all">
                <X className="w-4 h-4" weight="bold" />
              </button>
            </div>

            <div className="space-y-4">
              {/* User ID */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">User ID</label>
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="user_abc123"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 text-sm font-mono transition-all"
                />
              </div>

              {/* Kode kustom — BARU */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5" weight="bold" />
                  Kode Affiliate Kustom
                  <span className="text-slate-600 font-normal">(opsional)</span>
                </label>
                <div className="relative">
                  <input
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    placeholder="Contoh: JOHNDOE atau BRAND2025"
                    maxLength={20}
                    className={`w-full glass-input rounded-xl px-4 py-2.5 pr-10 text-white placeholder:text-slate-600 
                      focus:outline-none text-sm font-mono uppercase tracking-wider transition-all
                      ${codeError
                        ? 'border-red-500/50 focus:border-red-500/60'
                        : customCode && !codeError
                        ? 'border-emerald-500/40 focus:border-emerald-500/60'
                        : 'focus:border-purple-500/50'
                      }`}
                  />
                  {/* Character counter */}
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 tabular-nums">
                    {customCode.length}/20
                  </span>
                </div>

                {/* Error */}
                {codeError && (
                  <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                    <Warning className="w-3 h-3" weight="fill" />
                    {codeError}
                  </p>
                )}

                {/* Auto-generate note */}
                {!customCode && (
                  <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1">
                    <Shuffle className="w-3 h-3" weight="bold" />
                    Biarkan kosong untuk generate otomatis (AFF + 8 karakter)
                  </p>
                )}

                {/* Link preview */}
                {previewCode && !codeError && (
                  <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/8 border border-emerald-500/20">
                    <Link className="w-3.5 h-3.5 text-emerald-400 shrink-0" weight="bold" />
                    <span className="text-xs text-emerald-300 font-mono tracking-wide truncate">
                      {shareLink}
                    </span>
                  </div>
                )}
              </div>

              {/* Unlock threshold — revenueSharePercentage dihapus karena @deprecated (sistem dinamis) */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Unlock Threshold</label>
                <input
                  type="number"
                  value={unlockThreshold}
                  onChange={(e) => setUnlockThreshold(e.target.value)}
                  min={1}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500/50 text-sm transition-all"
                />
                <p className="text-xs text-slate-600 mt-1">Min. depositor sebelum withdraw terbuka. Default: 5</p>
              </div>

              {/* Saldo awal real — BARU */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <CurrencyDollar className="w-3.5 h-3.5" weight="bold" />
                  Saldo Awal Real Account
                  <span className="text-slate-600 font-normal">(opsional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">Rp</span>
                  <input
                    type="number"
                    value={initialRealBalance}
                    onChange={(e) => setInitialRealBalance(e.target.value)}
                    placeholder="0"
                    min={1}
                    className={`w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-white placeholder:text-slate-600
                      focus:outline-none text-sm transition-all
                      ${initialRealBalance && Number(initialRealBalance) > 0
                        ? 'border-emerald-500/40 focus:border-emerald-500/60'
                        : 'focus:border-purple-500/50'
                      }`}
                  />
                </div>
                {initialRealBalance && Number(initialRealBalance) > 0 ? (
                  <p className="text-xs text-emerald-400 mt-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" weight="fill" />
                    Akan ditambahkan {formatRupiah(Number(initialRealBalance))} ke akun real saat assign
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 mt-1">Biarkan kosong jika tidak ingin memberi saldo awal</p>
                )}
              </div>

              {/* Info box */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl px-4 py-3 text-xs text-purple-300/80 space-y-1">
                <p>Komisi affiliator dihitung <strong>dinamis</strong> oleh backend:</p>
                <p className="text-slate-400">• <strong className="text-purple-300">2 bulan pertama</strong>: flat <strong className="text-purple-300">80%</strong> dari setiap kerugian invitee (real account) — berlaku dari invitee pertama.</p>
                <p className="text-slate-400">• <strong className="text-purple-300">Setelah 2 bulan</strong>: tier berdasarkan jumlah user aktif (30 hari) — 50% / 60% / 70% / 80%.</p>
                <p className="text-slate-500">Penarikan baru bisa dilakukan setelah minimal <strong>{unlockThreshold}</strong> invitee deposit terpenuhi.</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-2">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 glass-sub hover:border-white/20 text-slate-300 rounded-xl font-semibold text-sm transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleAssign}
                  disabled={loading || !!codeError}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-purple-500/20"
                >
                  {loading ? <ArrowsClockwise className="w-4 h-4 animate-spin" weight="bold" /> : <Plus className="w-4 h-4" weight="bold" />}
                  {loading ? 'Memproses...' : 'Assign'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}

// ── Modal: Edit Config ────────────────────────────────────────

function EditConfigModal({
  affiliator,
  onClose,
  onSuccess,
}: {
  affiliator: AffiliatorListItem
  onClose: () => void
  onSuccess: () => void
}) {
  const [revenueShare, setRevenueShare] = useState(String(affiliator.revenueSharePercentage))
  const [unlockThreshold, setUnlockThreshold] = useState(String(affiliator.unlockThreshold))
  const [isActive, setIsActive] = useState(affiliator.isActive)
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const dto: UpdateAffiliatorConfigDto = {
        revenueSharePercentage: Number(revenueShare),
        unlockThreshold: Number(unlockThreshold),
        isActive,
      }
      await api.adminUpdateAffiliatorConfig(affiliator.id, dto)
      toast.success('Konfigurasi affiliator diperbarui.')
      onSuccess()
      onClose()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md glass-modal rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...SPRING }}
        >
          <div className="p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <PencilSimple className="w-4 h-4 text-blue-400" weight="bold" />
                </div>
                Edit Konfigurasi
              </h3>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg glass-sub hover:border-white/20 text-slate-400 hover:text-white transition-all">
                <X className="w-4 h-4" weight="bold" />
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4">{affiliator.userEmail} · <span className="font-mono text-purple-300">{affiliator.affiliateCode}</span></p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Revenue Share (%)</label>
                  <input
                    type="number" value={revenueShare}
                    onChange={(e) => setRevenueShare(e.target.value)}
                    min={1} max={100}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Unlock Threshold</label>
                  <input
                    type="number" value={unlockThreshold}
                    onChange={(e) => setUnlockThreshold(e.target.value)}
                    min={1}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 glass-sub rounded-xl">
                <span className="text-sm text-slate-300">Status Program</span>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}
                >
                  {isActive ? <ToggleRight className="w-4 h-4" weight="fill" /> : <ToggleLeft className="w-4 h-4" weight="fill" />}
                  {isActive ? 'Aktif' : 'Nonaktif'}
                </button>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 text-xs text-blue-300/80 space-y-1">
                <p>Komisi dihitung <strong>dinamis</strong> — <strong>80% flat</strong> selama 2 bulan pertama, lalu tier <strong>50–80%</strong> berdasarkan jumlah user aktif 30 hari.</p>
                <p className="text-slate-500">Penarikan baru bisa dilakukan setelah <strong>{unlockThreshold}</strong> invitee deposit terpenuhi.</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 glass-sub hover:border-white/20 text-slate-300 rounded-xl font-semibold text-sm transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/20"
                >
                  {loading ? <ArrowsClockwise className="w-4 h-4 animate-spin" weight="bold" /> : <CheckCircle className="w-4 h-4" weight="bold" />}
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}

// ── Modal: Approve/Reject Commission Withdrawal ───────────────

function ApproveWithdrawModal({
  withdrawal,
  onClose,
  onSuccess,
}: {
  withdrawal: AdminCommissionWithdrawal
  onClose: () => void
  onSuccess: () => void
}) {
  const [rejectionReason, setRejectionReason] = useState('')
  const [adminNotes, setAdminNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = async (approve: boolean) => {
    if (!approve && !rejectionReason.trim()) {
      toast.error('Alasan penolakan wajib diisi.')
      return
    }
    setLoading(true)
    try {
      const dto: ApproveCommissionWithdrawalDto = {
        approve,
        adminNotes: adminNotes || undefined,
        rejectionReason: !approve ? rejectionReason : undefined,
      }
      await api.adminApproveCommissionWithdrawal(withdrawal.id, dto)
      toast.success(approve ? 'Penarikan disetujui!' : 'Penarikan ditolak.')
      onSuccess()
      onClose()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="w-full max-w-md glass-modal rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ ...SPRING }}
        >
          <div className="p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Review Penarikan Komisi</h3>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg glass-sub hover:border-white/20 text-slate-400 hover:text-white transition-all"><X className="w-4 h-4" weight="bold" /></button>
            </div>

            <div className="glass-sub rounded-xl p-4 mb-4 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Affiliator</span>
                <span className="text-slate-300">{withdrawal.affiliatorEmail || withdrawal.userEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Jumlah</span>
                <span className="text-white font-bold">{formatRupiah(withdrawal.amount)}</span>
              </div>
              {withdrawal.bankAccount && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Rekening</span>
                  <span className="text-slate-300 text-right">{withdrawal.bankAccount.bankName} · {withdrawal.bankAccount.accountNumber}</span>
                </div>
              )}
              {withdrawal.note && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Catatan</span>
                  <span className="text-slate-400 italic">{withdrawal.note}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Catatan Admin (opsional)</label>
                <input
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Approved and transferred"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Alasan Penolakan (wajib jika tolak)</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={2}
                  placeholder="Dokumen tidak valid / saldo tidak cukup"
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/40 text-sm resize-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handle(false)}
                disabled={loading || !rejectionReason.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/15 hover:bg-red-500/25 disabled:opacity-30 text-red-400 border border-red-500/30 rounded-xl font-semibold text-sm transition-all"
              >
                <XCircle className="w-4 h-4" weight="bold" />
                Tolak
              </button>
              <button
                onClick={() => handle(true)}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-500/15 hover:bg-green-500/25 disabled:opacity-30 text-green-400 border border-green-500/30 rounded-xl font-semibold text-sm transition-all"
              >
                {loading ? <ArrowsClockwise className="w-4 h-4 animate-spin" weight="bold" /> : <CheckCircle className="w-4 h-4" weight="bold" />}
                Setujui
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  )
}

// ── Main Page ─────────────────────────────────────────────────

export default function AdminAffiliatorsPage() {
  const [activeTab, setActiveTab] = useState<'affiliators' | 'withdrawals'>('affiliators')

  // Affiliators state
  const [affiliators, setAffiliators] = useState<AffiliatorListItem[]>([])
  const [affiliatorsLoading, setAffiliatorsLoading] = useState(true)
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')

  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState<AdminCommissionWithdrawal[]>([])
  const [withdrawSummary, setWithdrawSummary] = useState<any>(null)
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')

  // Modals
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [editTarget, setEditTarget] = useState<AffiliatorListItem | null>(null)
  const [reviewTarget, setReviewTarget] = useState<AdminCommissionWithdrawal | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  // ── Fetch affiliators ────────────────────────────────────

  const fetchAffiliators = useCallback(async () => {
    setAffiliatorsLoading(true)
    try {
      const res = await api.adminGetAllAffiliators({ isActive: filterActive })
      setAffiliators(res.data!.affiliators)
    } catch {
      toast.error('Gagal memuat daftar affiliator.')
    } finally {
      setAffiliatorsLoading(false)
    }
  }, [filterActive])

  useEffect(() => {
    fetchAffiliators()
  }, [fetchAffiliators])

  // ── Fetch withdrawals ────────────────────────────────────

  const fetchWithdrawals = useCallback(async () => {
    setWithdrawalsLoading(true)
    try {
      const res = await api.adminGetCommissionWithdrawals({ status: filterStatus || undefined })
      setWithdrawals(res.data!.withdrawals)
      setWithdrawSummary(res.data!.summary)
    } catch {
      toast.error('Gagal memuat daftar penarikan.')
    } finally {
      setWithdrawalsLoading(false)
    }
  }, [filterStatus])

  useEffect(() => {
    if (activeTab === 'withdrawals') fetchWithdrawals()
  }, [activeTab, fetchWithdrawals])

  // ── Revoke ───────────────────────────────────────────────

  const handleRevoke = async (aff: AffiliatorListItem) => {
    if (!confirm(`Cabut status affiliator ${aff.userEmail}?`)) return
    setRevokingId(aff.userId)
    try {
      await api.adminRevokeAffiliator(aff.userId)
      toast.success('Status affiliator dicabut.')
      fetchAffiliators()
    } catch {
    } finally {
      setRevokingId(null)
    }
  }

  // ── Filtered affiliators ─────────────────────────────────

  const filteredAffiliators = affiliators.filter((a) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return a.userEmail.toLowerCase().includes(q) || a.affiliateCode.toLowerCase().includes(q)
  })

  // ── Render ───────────────────────────────────────────────

  return (
    <>
      <GlobalStyles />
      <div className="bg-pattern-grid min-h-screen relative">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">

        {/* ── Header ──────────────────────────────────────── */}
        <motion.div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial="hidden" animate="visible" variants={stagger(0.1)}>
          <motion.div variants={fadeLeft}>
            <motion.div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1" variants={fadeUp}>
              <span>Dasbor</span><span>/</span><span>Admin</span><span>/</span>
              <span className="text-slate-100 font-medium">Affiliator</span>
            </motion.div>
            <div className="flex items-center gap-3">
              <motion.div
                className="w-9 h-9 bg-gradient-to-br from-purple-400/80 to-violet-500/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/30 border border-white/20"
                whileHover={{ rotate: 90, scale: 1.1 }} transition={{ ...SPRING }}>
                <ShareNetwork className="w-5 h-5 text-white" weight="duotone" />
              </motion.div>
              <div>
                <AnimatedHeadline
                  text="Manajemen Affiliator"
                  className="text-2xl sm:text-3xl font-bold text-slate-100"
                  style={{ letterSpacing: '-0.03em' }}
                />
                <motion.p className="text-slate-400 text-sm mt-0.5" variants={fadeUp}>
                  Assign, monitor, dan kelola penarikan komisi affiliator
                </motion.p>
              </div>
            </div>
          </motion.div>
          <motion.div variants={scaleIn}>
            <motion.button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-purple-500/20"
              whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(168,85,247,0.4)' }} whileTap={{ scale: 0.96 }}
            >
              <Plus className="w-4 h-4" weight="bold" />
              Assign Affiliator
            </motion.button>
          </motion.div>
        </motion.div>

        {/* ── Stats Summary ─────────────────────────────── */}
        <Reveal className="glass-card rounded-2xl p-5 mb-6">
          <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            variants={stagger(0.08)} initial="hidden" animate="visible">
            {[
              { icon: <ShareNetwork className="w-5 h-5 text-purple-400" weight="duotone" />, bg: 'bg-purple-500/15', label: 'Total Affiliator', val: affiliators.length },
              { icon: <ToggleRight className="w-5 h-5 text-green-400" weight="duotone" />, bg: 'bg-green-500/15', label: 'Aktif', val: affiliators.filter(a => a.isActive).length },
              { icon: <ToggleLeft className="w-5 h-5 text-slate-400" weight="duotone" />, bg: 'bg-slate-500/15', label: 'Nonaktif', val: affiliators.filter(a => !a.isActive).length },
              { icon: <ArrowLineUp className="w-5 h-5 text-yellow-400" weight="duotone" />, bg: 'bg-yellow-500/15', label: 'Pending Withdraw', val: withdrawSummary?.pending ?? 0 },
            ].map((s, i) => (
              <motion.div key={i} className="flex items-center gap-3" variants={fadeUp}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  {s.icon}
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-0.5">{s.label}</div>
                  <div className="text-lg font-bold text-slate-100"><CountUp to={s.val} /></div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        {/* ── Tabs ────────────────────────────────────────── */}
        <motion.div
          className="flex gap-1 glass-input rounded-xl p-1 mb-6 w-fit"
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.15 }}
        >
          {[
            { key: 'affiliators', label: 'Affiliators', icon: ShareNetwork },
            { key: 'withdrawals', label: 'Penarikan Komisi', icon: ArrowLineUp },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`relative flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {activeTab === key && (
                <motion.div className="absolute inset-0 rounded-lg bg-purple-600 shadow-md"
                  layoutId="affiliatorTabPill" transition={{ ...SPRING }} />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="w-4 h-4" weight={activeTab === key ? 'fill' : 'regular'} />
                {label}
                {key === 'withdrawals' && withdrawSummary?.pending > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold">
                    {withdrawSummary.pending}
                  </span>
                )}
              </span>
            </button>
          ))}
        </motion.div>

        {/* ════════════════════════════════════════════════ */}
        {/* Tab: Affiliators                                 */}
        {/* ════════════════════════════════════════════════ */}
        {activeTab === 'affiliators' && (
          <div>
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" weight="bold" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari email atau kode..."
                  className="w-full glass-input rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 transition-all"
                />
              </div>
              <select
                value={filterActive === undefined ? '' : String(filterActive)}
                onChange={(e) => setFilterActive(e.target.value === '' ? undefined : e.target.value === 'true')}
                className="glass-input text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500/50 transition-all"
              >
                <option value="">Semua Status</option>
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>

            {affiliatorsLoading ? (
              <div className="flex justify-center py-16">
                <ArrowsClockwise className="w-8 h-8 text-purple-400 animate-spin" weight="bold" />
              </div>
            ) : filteredAffiliators.length === 0 ? (
              <div className="text-center py-16">
                <ShareNetwork className="w-12 h-12 text-slate-600 mx-auto mb-3" weight="duotone" />
                <p className="text-slate-400">Belum ada affiliator.</p>
              </div>
            ) : (
              <motion.div className="space-y-3"
                variants={stagger(0.04)} initial="hidden" animate="visible">
                {filteredAffiliators.map((aff) => (
                  <motion.div
                    key={aff.id}
                    variants={fadeUp}
                    className="glass-card rounded-2xl p-4"
                    whileHover={{ y: -1, transition: { duration: 0.15 } }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Left info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-slate-100 font-semibold truncate">{aff.userEmail}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                            aff.isActive
                              ? 'bg-green-500/15 text-green-400 border-green-500/30'
                              : 'bg-red-500/15 text-red-400 border-red-500/30'
                          }`}>
                            {aff.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                          {aff.isCommissionUnlocked && (
                            <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-purple-500/15 text-purple-400 border-purple-500/30">
                              Bisa Tarik ✓
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                          <span className="font-mono text-purple-300/80 tracking-wider">{aff.affiliateCode}</span>
                          <span className="mx-1">·</span>
                          <span>{aff.revenueSharePercentage}% share <span className="text-slate-600">(snapshot)</span></span>
                          <span className="mx-1">·</span>
                          <span>Threshold: {aff.unlockThreshold}</span>
                          {/* Share link chip */}
                          <span className="mx-1">·</span>
                          <a
                            href={`https://stouch.id/ref/${aff.affiliateCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-emerald-400/70 hover:text-emerald-400 transition-colors"
                          >
                            <Link className="w-3 h-3" weight="bold" />
                            /ref/{aff.affiliateCode}
                          </a>
                        </div>

                        {/* Mini stats */}
                        <div className="flex gap-4 flex-wrap text-xs">
                          <div>
                            <span className="text-slate-500">Undangan: </span>
                            <span className="text-white font-medium">{aff.totalInvited}</span>
                            <span className="text-green-400"> ({aff.totalInvitedDeposited} deposit)</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Unlock: </span>
                            <span className={`font-medium ${aff.isCommissionUnlocked ? 'text-green-400' : 'text-yellow-400'}`}>
                              {aff.isCommissionUnlocked ? 'Terpenuhi ✓' : `${aff.totalInvitedDeposited}/${aff.unlockThreshold}`}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500">Total Komisi: </span>
                            <span className="text-purple-400 font-medium">{formatRupiah(aff.totalCommissionEarned)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Saldo: </span>
                            <span className="text-white font-medium">{formatRupiah(aff.commissionBalance)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setEditTarget(aff)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium transition-colors"
                        >
                          <PencilSimple className="w-3.5 h-3.5" weight="bold" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleRevoke(aff)}
                          disabled={revokingId === aff.userId || !aff.isActive}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-30 text-red-400 border border-red-500/30 rounded-lg text-xs font-medium transition-colors"
                        >
                          {revokingId === aff.userId ? (
                            <ArrowsClockwise className="w-3.5 h-3.5 animate-spin" weight="bold" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" weight="bold" />
                          )}
                          Cabut
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════ */}
        {/* Tab: Withdrawals                                 */}
        {/* ════════════════════════════════════════════════ */}
        {activeTab === 'withdrawals' && (
          <div>
            {/* Summary chips */}
            {withdrawSummary && (
              <div className="flex gap-3 mb-4 flex-wrap">
                {[
                  { label: 'Total', value: withdrawSummary.total, cls: 'border-white/10 text-slate-300 bg-slate-700/30' },
                  { label: 'Pending', value: withdrawSummary.pending, cls: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
                  { label: 'Approved', value: withdrawSummary.approved, cls: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
                  { label: 'Selesai', value: withdrawSummary.completed, cls: 'bg-green-500/10 text-green-400 border-green-500/30' },
                  { label: 'Ditolak', value: withdrawSummary.rejected, cls: 'bg-red-500/10 text-red-400 border-red-500/30' },
                ].map(({ label, value, cls }) => (
                  <div key={label} className={`px-4 py-1.5 rounded-xl border text-sm font-medium ${cls}`}>
                    {label}: <span className="font-bold">{value}</span>
                  </div>
                ))}
                <div className="px-4 py-1.5 rounded-xl border text-sm font-medium bg-purple-500/10 text-purple-400 border-purple-500/30">
                  Pending: <span className="font-bold">{formatRupiah(withdrawSummary.totalAmountPending ?? 0)}</span>
                </div>
                <div className="px-4 py-1.5 rounded-xl border text-sm font-medium bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                  Selesai: <span className="font-bold">{formatRupiah(withdrawSummary.totalAmountCompleted ?? 0)}</span>
                </div>
              </div>
            )}

            {/* Status filter */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {['', 'pending', 'approved', 'completed', 'rejected'].map((s) => (
                <button
                  key={s || 'all'}
                  onClick={() => setFilterStatus(s)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    filterStatus === s
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {s === '' ? 'Semua' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {withdrawalsLoading ? (
              <div className="flex justify-center py-16">
                <ArrowsClockwise className="w-8 h-8 text-purple-400 animate-spin" weight="bold" />
              </div>
            ) : withdrawals.length === 0 ? (
              <div className="text-center py-16">
                <ArrowLineUp className="w-12 h-12 text-slate-600 mx-auto mb-3" weight="duotone" />
                <p className="text-slate-400">Tidak ada request penarikan.</p>
              </div>
            ) : (
              <motion.div className="space-y-3"
                variants={stagger(0.04)} initial="hidden" animate="visible">
                {withdrawals.map((w) => {
                  const st = withdrawStatusMeta(w.status)
                  return (
                    <motion.div key={w.id} variants={fadeUp} className="glass-card rounded-2xl p-4"
                      whileHover={{ y: -1, transition: { duration: 0.15 } }}>
                      <div className="flex items-start gap-3 justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-white font-bold">{formatRupiah(w.amount)}</span>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs border font-medium ${st.cls}`}>
                              {st.icon}{st.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mb-0.5">
                            {w.affiliatorEmail || w.userEmail}
                          </p>
                          {w.bankAccount && (
                            <p className="text-xs text-slate-500">
                              {w.bankAccount.bankName} · {w.bankAccount.accountNumber} · {w.bankAccount.accountHolderName}
                            </p>
                          )}
                          {w.note && <p className="text-xs text-slate-500 mt-0.5 italic">"{w.note}"</p>}
                          {w.rejectionReason && (
                            <p className="text-xs text-red-400 mt-0.5">Ditolak: {w.rejectionReason}</p>
                          )}
                          {w.adminNotes && (
                            <p className="text-xs text-blue-400/80 mt-0.5">Admin: {w.adminNotes}</p>
                          )}
                          <p className="text-xs text-slate-600 mt-1">{formatDate(w.createdAt)}</p>
                        </div>

                        {w.status === 'pending' && (
                          <button
                            onClick={() => setReviewTarget(w)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/15 hover:bg-purple-500/25 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" weight="bold" />
                            Review
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>

      {/* Modals */}
      {showAssignModal && (
        <AssignModal
          onClose={() => setShowAssignModal(false)}
          onSuccess={fetchAffiliators}
        />
      )}
      {editTarget && (
        <EditConfigModal
          affiliator={editTarget}
          onClose={() => setEditTarget(null)}
          onSuccess={fetchAffiliators}
        />
      )}
      {reviewTarget && (
        <ApproveWithdrawModal
          withdrawal={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={fetchWithdrawals}
        />
      )}
    </>
  )
}