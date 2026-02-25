'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import React from 'react'
import { toast } from 'sonner'
import axios from 'axios'
import Navbar from '@/components/Navbar'
import {
  ArrowsClockwise,
  Lightning,
  Skull,
  ChartBar,
  ClipboardText,
  Gear,
  Warning,
  Info,
  Question,
  CheckCircle,
  XCircle,
  Timer,
  CurrencyDollar,
  Users,
  SortDescending,
  Percent,
  Eye,
} from 'phosphor-react'
import { motion, type Variants } from 'framer-motion'

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
        radial-gradient(ellipse 80% 60% at 10% 20%, rgba(239,68,68,0.12) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 85% 10%, rgba(99,102,241,0.12) 0%, transparent 55%),
        radial-gradient(ellipse 70% 60% at 70% 80%, rgba(245,158,11,0.07) 0%, transparent 55%),
        radial-gradient(ellipse 50% 40% at 20% 85%, rgba(16,185,129,0.07) 0%, transparent 50%);
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
      transition: background 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
    }
    .glass-card:hover {
      background: var(--glass-bg-hover);
      border-color: var(--glass-border-hover);
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
      border: 1px solid rgba(255,255,255,0.10);
      color: white;
    }
    .glass-input:focus { outline: none; border-color: rgba(99,102,241,0.5); }
  `}</style>
)

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
const stagger = (d = 0.06): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: d, delayChildren: 0.04 } },
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

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AutoLoseConfig {
  id: string
  isEnabled: boolean
  killerMode: boolean
  targetAccountType: 'demo' | 'real' | 'both'
  targetUserStatus: ('standard' | 'gold' | 'vip')[]
  minOrderAmount: number | null
  maxOrderAmount: number | null
  priorityMode: 'highest_amount' | 'all'
  losePercentage: number
  createdAt: string
  updatedAt: string
  updatedBy?: string
  updatedByEmail?: string
}

interface TrackerWindow {
  windowKey: string
  orderCount: number
  totalAmount: number
  topAmount: number
}

interface TrackerStats {
  activeWindows: number
  totalTrackedOrders: number
  windows: TrackerWindow[]
}

interface AutoLoseStatus {
  config: AutoLoseConfig
  trackerStats: TrackerStats
}

interface AutoLoseLog {
  id: string
  orderId: string
  userId: string
  userEmail?: string
  amount: number
  accountType: string
  userStatus: string
  reason: string
  windowKey?: string
  priority?: number
  createdAt: string
}

interface LogsResponse {
  logs: AutoLoseLog[]
  total: number
  page: number
  totalPages: number
}

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

function getAuthHeaders() {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('token') ?? '' : ''
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await axios.get(`${API_URL}${path}`, { headers: getAuthHeaders() })
  return res.data?.data ?? res.data
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await axios.post(`${API_URL}${path}`, body, { headers: getAuthHeaders() })
  return res.data?.data ?? res.data
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await axios.put(`${API_URL}${path}`, body, { headers: getAuthHeaders() })
  return res.data?.data ?? res.data
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatRupiah(n: number | null) {
  if (n === null) return '—'
  return 'Rp ' + n.toLocaleString('id-ID')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip Component
// ─────────────────────────────────────────────────────────────────────────────

function Tooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        className="text-slate-600 hover:text-slate-400 transition-colors"
      >
        <Question className="w-3.5 h-3.5" weight="fill" />
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-56 bg-slate-800 border border-white/10 text-slate-300 text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none leading-relaxed">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Info Box Component
// ─────────────────────────────────────────────────────────────────────────────

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300/80 leading-relaxed">
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" weight="fill" />
      <span>{children}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Toggle
// ─────────────────────────────────────────────────────────────────────────────

function Toggle({
  checked, onChange, disabled, size = 'md',
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const sizes = {
    sm: { track: 'w-8 h-4', thumb: 'w-3 h-3', translate: 'translate-x-4' },
    md: { track: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
    lg: { track: 'w-14 h-7', thumb: 'w-6 h-6', translate: 'translate-x-7' },
  }
  const s = sizes[size]
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex ${s.track} items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? 'bg-emerald-500' : 'bg-white/20'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`absolute left-0.5 ${s.thumb} rounded-full bg-white shadow transition-transform duration-200 ${checked ? s.translate : 'translate-x-0.5'}`} />
    </button>
  )
}

function Spinner({ size = 4 }: { size?: number }) {
  return (
    <svg className={`animate-spin w-${size} h-${size}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Config Form
// ─────────────────────────────────────────────────────────────────────────────

function ConfigForm({ config, onSaved }: { config: AutoLoseConfig; onSaved: () => void }) {
  const [form, setForm] = useState({
    targetAccountType: config.targetAccountType,
    targetUserStatus: config.targetUserStatus,
    minOrderAmount: config.minOrderAmount?.toString() ?? '',
    maxOrderAmount: config.maxOrderAmount?.toString() ?? '',
    priorityMode: config.priorityMode,
    losePercentage: config.losePercentage.toString(),
  })
  const [saving, setSaving] = useState(false)

  const toggleStatus = (s: 'standard' | 'gold' | 'vip') => {
    setForm((f) => ({
      ...f,
      targetUserStatus: f.targetUserStatus.includes(s)
        ? f.targetUserStatus.filter((x) => x !== s)
        : [...f.targetUserStatus, s],
    }))
  }

  const handleSave = async () => {
    if (form.targetUserStatus.length === 0) {
      toast.error('Pilih minimal satu target user status')
      return
    }
    try {
      setSaving(true)
      await apiPut('/auto-lose-system/config', {
        targetAccountType: form.targetAccountType,
        targetUserStatus: form.targetUserStatus,
        priorityMode: form.priorityMode,
        losePercentage: Number(form.losePercentage),
        minOrderAmount: form.minOrderAmount === '' ? null : Number(form.minOrderAmount),
        maxOrderAmount: form.maxOrderAmount === '' ? null : Number(form.maxOrderAmount),
      })
      toast.success('Konfigurasi berhasil disimpan')
      onSaved()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Gagal menyimpan konfigurasi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">

      {/* ── 1. Target Akun ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <CurrencyDollar className="w-4 h-4 text-slate-400" weight="duotone" />
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
            Target Akun
          </label>
          <Tooltip text="Pilih jenis akun yang akan dikenai sistem AutoLose. 'Demo' untuk akun latihan, 'Real' untuk akun uang nyata, 'Demo + Real' untuk keduanya sekaligus." />
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Tentukan akun mana yang akan dipengaruhi sistem ini. Hanya order dari jenis akun yang dipilih yang akan diproses.
        </p>
        <div className="flex gap-2 flex-wrap">
          {([
            { val: 'demo', label: 'Demo', desc: 'Akun latihan saja' },
            { val: 'real', label: 'Real', desc: 'Akun uang nyata saja' },
            { val: 'both', label: 'Demo + Real', desc: 'Semua jenis akun' },
          ] as const).map(({ val, label, desc }) => (
            <button
              key={val}
              onClick={() => setForm((f) => ({ ...f, targetAccountType: val }))}
              className={`flex flex-col items-start px-4 py-2.5 rounded-lg border transition-all ${
                form.targetAccountType === val
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              <span className="text-sm font-medium">{label}</span>
              <span className="text-[10px] opacity-60 mt-0.5">{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. Target User Status ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-4 h-4 text-slate-400" weight="duotone" />
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
            Target User Status
          </label>
          <Tooltip text="Pilih tier/level pengguna yang akan dikenai AutoLose. Anda bisa memilih lebih dari satu. Pengguna di luar status yang dipilih tidak akan terpengaruh." />
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Sistem hanya akan memproses order dari pengguna dengan status yang dicentang. Minimal pilih satu status.
        </p>
        <div className="flex gap-2 flex-wrap">
          {([
            { val: 'standard', label: 'Standard', desc: 'Pengguna reguler', activeClass: 'bg-slate-500/20 border-slate-400 text-white' },
            { val: 'gold', label: 'Gold', desc: 'Pengguna premium', activeClass: 'bg-yellow-500/20 border-yellow-400 text-yellow-300' },
            { val: 'vip', label: 'VIP', desc: 'Pengguna VIP', activeClass: 'bg-purple-500/20 border-purple-400 text-purple-300' },
          ] as const).map(({ val, label, desc, activeClass }) => {
            const active = form.targetUserStatus.includes(val)
            return (
              <button
                key={val}
                onClick={() => toggleStatus(val)}
                className={`flex flex-col items-start px-4 py-2.5 rounded-lg border transition-all ${
                  active ? activeClass : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{label}</span>
                  {active && <CheckCircle className="w-3.5 h-3.5" weight="fill" />}
                </div>
                <span className="text-[10px] opacity-60 mt-0.5">{desc}</span>
              </button>
            )
          })}
        </div>
        {form.targetUserStatus.length === 0 && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" weight="fill" />
            Minimal satu status harus dipilih
          </p>
        )}
      </div>

      {/* ── 3. Filter Amount ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <CurrencyDollar className="w-4 h-4 text-slate-400" weight="duotone" />
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
            Filter Nominal Order
          </label>
          <Tooltip text="Batasi AutoLose hanya untuk order dengan nominal tertentu. Order di luar rentang ini akan dilewati dan tidak di-lose." />
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Opsional. Gunakan filter ini untuk membatasi AutoLose hanya pada nominal order tertentu. Kosongkan kedua field untuk menarget semua nominal.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              key: 'minOrderAmount',
              label: 'Min. Nominal Order',
              placeholder: 'Tidak ada minimum',
              hint: 'Order di bawah nilai ini akan dilewati (tidak di-lose)',
            },
            {
              key: 'maxOrderAmount',
              label: 'Maks. Nominal Order',
              placeholder: 'Tidak ada batas',
              hint: 'Order di atas nilai ini akan dilewati (tidak di-lose)',
            },
          ].map(({ key, label, placeholder, hint }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-slate-400 mb-2">{label}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Rp</span>
                <input
                  type="number"
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
                />
              </div>
              <p className="text-[11px] text-slate-600 mt-1.5">{hint}</p>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <InfoBox>
            <strong>Contoh:</strong> Min = Rp 100.000 dan Maks = Rp 1.000.000 artinya hanya order senilai Rp 100 ribu–1 juta yang akan diproses AutoLose. Order di luar rentang tersebut dibiarkan normal.
          </InfoBox>
        </div>
      </div>

      {/* ── 4. Priority Mode ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <SortDescending className="w-4 h-4 text-slate-400" weight="duotone" />
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
            Priority Mode
          </label>
          <Tooltip text="Menentukan cara sistem memilih order mana yang di-lose dalam setiap jendela waktu (window). 'Highest Amount' lebih selektif, 'All' lebih agresif." />
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Sistem mengelompokkan order dalam jendela waktu tertentu (window). Mode ini menentukan order mana dalam window tersebut yang akan di-lose.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => setForm((f) => ({ ...f, priorityMode: 'highest_amount' }))}
            className={`p-4 rounded-lg border text-left transition-all ${
              form.priorityMode === 'highest_amount'
                ? 'bg-indigo-500/10 border-indigo-400'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${form.priorityMode === 'highest_amount' ? 'bg-indigo-400' : 'bg-slate-600'}`} />
              <span className={`text-sm font-semibold ${form.priorityMode === 'highest_amount' ? 'text-indigo-300' : 'text-slate-300'}`}>
                Highest Amount
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Hanya order dengan nominal terbesar dalam window yang akan di-lose. Jumlah order yang di-lose dikontrol oleh <strong className="text-slate-400">Lose Percentage</strong> di bawah.
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-500/70">
              <CheckCircle className="w-3 h-3" weight="fill" />
              Direkomendasikan — lebih natural & tidak mencurigakan
            </div>
          </button>

          <button
            onClick={() => setForm((f) => ({ ...f, priorityMode: 'all' }))}
            className={`p-4 rounded-lg border text-left transition-all ${
              form.priorityMode === 'all'
                ? 'bg-indigo-500/10 border-indigo-400'
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${form.priorityMode === 'all' ? 'bg-indigo-400' : 'bg-slate-600'}`} />
              <span className={`text-sm font-semibold ${form.priorityMode === 'all' ? 'text-indigo-300' : 'text-slate-300'}`}>
                All
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Semua order yang lolos filter (akun, status, nominal) dalam window akan di-lose tanpa seleksi lebih lanjut.
            </p>
            <div className="mt-2 flex items-center gap-1 text-[11px] text-orange-500/70">
              <Warning className="w-3 h-3" weight="fill" />
              Agresif — semua order yang memenuhi kriteria di-lose
            </div>
          </button>
        </div>
      </div>

      {/* ── 5. Lose Percentage ── */}
      <div className={form.priorityMode === 'all' ? 'opacity-40 pointer-events-none' : ''}>
        <div className="flex items-center gap-2 mb-1">
          <Percent className="w-4 h-4 text-slate-400" weight="duotone" />
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
            Lose Percentage
          </label>
          <span className="text-indigo-400 font-bold text-sm">{form.losePercentage}%</span>
          {form.priorityMode !== 'all' && (
            <Tooltip text="Persentase ini menentukan berapa persen order (dari yang terbesar) dalam setiap window yang akan di-lose. 10% berarti hanya 1 dari 10 order terbesar yang di-lose." />
          )}
        </div>
        <p className="text-xs text-slate-500 mb-3">
          {form.priorityMode === 'all'
            ? 'Pengaturan ini tidak aktif saat Priority Mode = All. Semua order sudah di-lose.'
            : 'Hanya berlaku saat Priority Mode = Highest Amount. Geser slider untuk mengatur persentase order terbesar yang akan di-lose dalam satu window.'}
        </p>

        <input
          type="range"
          min={1}
          max={100}
          value={form.losePercentage}
          onChange={(e) => setForm((f) => ({ ...f, losePercentage: e.target.value }))}
          className="w-full accent-emerald-500"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1 mb-3">
          <span>1% — hanya 1 order terbesar per window</span>
          <span>100% — semua order</span>
        </div>

        {form.priorityMode !== 'all' && (
          <InfoBox>
            Dengan nilai <strong>{form.losePercentage}%</strong>: jika ada 10 order dalam satu window, sistem akan memilih{' '}
            <strong>{Math.max(1, Math.ceil(10 * Number(form.losePercentage) / 100))} order</strong> dengan nominal terbesar untuk di-lose.
            Semakin kecil persentase, semakin sedikit dan selektif order yang di-lose.
          </InfoBox>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <p className="text-xs text-slate-600">
          Konfigurasi disimpan ke database dan langsung berlaku setelah sistem diaktifkan.
        </p>
        <button
          onClick={handleSave}
          disabled={saving || form.targetUserStatus.length === 0}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          {saving && <Spinner size={4} />}
          {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Tracker Panel
// ─────────────────────────────────────────────────────────────────────────────

function TrackerPanel({ stats }: { stats: TrackerStats }) {
  return (
    <div className="space-y-5">
      {/* Penjelasan singkat */}
      <InfoBox>
        <strong>Apa itu Order Tracker?</strong> Sistem mengelompokkan order aktif ke dalam <em>window</em> (jendela waktu). 
        Setiap window mewakili kelompok order yang masuk dalam rentang waktu tertentu. 
        Semakin banyak order dalam satu window, semakin tinggi potensi order yang di-lose berdasarkan konfigurasi yang aktif.
      </InfoBox>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-sub rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Timer className="w-4 h-4 text-blue-400" weight="duotone" />
            <span className="text-xs text-slate-500">Active Windows</span>
            <Tooltip text="Jumlah jendela waktu yang sedang aktif memantau order masuk. Setiap window mewakili kelompok order dalam periode waktu tertentu." />
          </div>
          <div className="text-2xl font-bold text-white">{stats.activeWindows}</div>
          <p className="text-[11px] text-slate-600 mt-1">
            {stats.activeWindows === 0 ? 'Tidak ada window aktif saat ini' : `${stats.activeWindows} jendela waktu sedang memantau`}
          </p>
        </div>
        <div className="glass-sub rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-indigo-400" weight="duotone" />
            <span className="text-xs text-slate-500">Tracked Orders</span>
            <Tooltip text="Total order yang sedang dipantau di semua window aktif. Order ini belum tentu di-lose — sistem masih mengevaluasi berdasarkan konfigurasi." />
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalTrackedOrders}</div>
          <p className="text-[11px] text-slate-600 mt-1">
            {stats.totalTrackedOrders === 0 ? 'Tidak ada order dalam tracking' : `${stats.totalTrackedOrders} order sedang dievaluasi`}
          </p>
        </div>
      </div>

      {/* Window list */}
      {stats.windows.length > 0 ? (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Detail Per Window</p>
            <Tooltip text="Setiap baris merupakan satu jendela waktu. Window Key adalah identifikasi unik window tersebut (biasanya kombinasi user/aset/waktu). 'Top' adalah order dengan nominal terbesar di window itu — kandidat utama yang akan di-lose." />
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {stats.windows.map((w) => (
              <div key={w.windowKey} className="glass-sub rounded-xl p-3 hover:border-white/15 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <code className="text-xs text-slate-400 font-mono">{w.windowKey}</code>
                    <p className="text-[11px] text-slate-600 mt-0.5">Identifikasi jendela waktu aktif</p>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    {w.orderCount} order
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white/5 rounded p-2">
                    <span className="text-slate-500 block mb-0.5">Total Volume</span>
                    <span className="text-slate-200 font-semibold">{formatRupiah(w.totalAmount)}</span>
                    <p className="text-[10px] text-slate-600 mt-0.5">Jumlah semua order dalam window</p>
                  </div>
                  <div className="bg-red-500/5 rounded p-2 border border-red-500/10">
                    <span className="text-slate-500 block mb-0.5">Order Terbesar</span>
                    <span className="text-red-400 font-semibold">{formatRupiah(w.topAmount)}</span>
                    <p className="text-[10px] text-slate-600 mt-0.5">Kandidat utama untuk di-lose</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-28 text-slate-600">
          <Timer className="w-8 h-8 mb-2 opacity-30" weight="duotone" />
          <p className="text-sm">Tidak ada window aktif saat ini</p>
          <p className="text-xs mt-1 opacity-60">Window akan muncul saat ada order masuk dan sistem aktif</p>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Logs Table
// ─────────────────────────────────────────────────────────────────────────────

function LogsTable() {
  const [logs, setLogs] = useState<AutoLoseLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 20

  const load = useCallback(async (p: number) => {
    try {
      setLoading(true)
      const data = await apiGet<LogsResponse>(`/auto-lose-system/logs?page=${p}&limit=${limit}`)
      setLogs(data.logs ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
    } catch {
      toast.error('Gagal memuat logs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(page) }, [page, load])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-600">
        <ClipboardText className="w-10 h-10 mb-2 opacity-40" weight="duotone" />
        <p className="text-sm">Belum ada log AutoLose</p>
        <p className="text-xs mt-1 opacity-60">Log akan muncul setiap kali sistem men-lose sebuah order</p>
      </div>
    )
  }

  return (
    <div>
      {/* Keterangan kolom */}
      <div className="mb-4">
        <InfoBox>
          Log ini mencatat setiap order yang berhasil di-lose oleh sistem. Kolom <strong>Alasan</strong> menjelaskan mengapa order tersebut dipilih, dan kolom <strong>Priority</strong> menunjukkan urutan prioritas order dalam windownya (angka lebih kecil = prioritas lebih tinggi).
        </InfoBox>
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-slate-500">{total} total log tercatat</span>
        <button
          onClick={() => load(page)}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <ArrowsClockwise className="w-3.5 h-3.5" weight="bold" />
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {[
                { label: 'Waktu', tip: 'Waktu order di-lose oleh sistem' },
                { label: 'User', tip: 'Email dan ID pengguna pemilik order' },
                { label: 'Amount', tip: 'Nominal order yang di-lose' },
                { label: 'Akun', tip: 'Jenis akun: Real (uang nyata) atau Demo (latihan)' },
                { label: 'Status', tip: 'Tier pengguna saat order dilakukan' },
                { label: 'Alasan', tip: 'Alasan teknis mengapa order ini dipilih untuk di-lose' },
                { label: 'Priority', tip: 'Urutan prioritas dalam window. #1 = order dengan nominal terbesar' },
              ].map(({ label, tip }) => (
                <th key={label} className="text-left px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
                    <Tooltip text={tip} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-slate-400 whitespace-nowrap text-xs">{formatDate(log.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="text-white text-xs font-medium">{log.userEmail ?? log.userId}</div>
                  <div className="text-slate-600 text-xs font-mono">{log.userId.slice(0, 8)}…</div>
                </td>
                <td className="px-4 py-3 text-red-400 font-semibold whitespace-nowrap">{formatRupiah(log.amount)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                    log.accountType === 'real'
                      ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                      : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  }`}>
                    {log.accountType}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                    log.userStatus === 'vip' ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'
                    : log.userStatus === 'gold' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                    : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
                  }`}>
                    {log.userStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px] truncate" title={log.reason}>
                  {log.reason}
                </td>
                <td className="px-4 py-3">
                  {log.priority != null ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-white/5 text-slate-300 border border-white/10">
                      #{log.priority}
                    </span>
                  ) : (
                    <span className="text-slate-700">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-white disabled:opacity-40 hover:bg-white/10 transition-colors"
          >
            ← Sebelumnya
          </button>
          <span className="text-xs text-slate-500">Halaman {page} dari {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-medium text-white disabled:opacity-40 hover:bg-white/10 transition-colors"
          >
            Selanjutnya →
          </button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AutoLoseSystemPage() {
  const [status, setStatus] = useState<AutoLoseStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [togglingKiller, setTogglingKiller] = useState(false)
  const [activeTab, setActiveTab] = useState<'config' | 'tracker' | 'logs'>('config')
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const loadStatus = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const data = await apiGet<{ data: AutoLoseStatus }>('/auto-lose-system/status')
      const unwrapped = (data as any)?.data ?? data
      setStatus(unwrapped as AutoLoseStatus)
    } catch {
      if (!silent) toast.error('Gagal memuat status AutoLose')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStatus()
    pollingRef.current = setInterval(() => loadStatus(true), 10000)
    return () => { if (pollingRef.current) clearInterval(pollingRef.current) }
  }, [loadStatus])

  const handleToggle = async () => {
    if (!status) return
    const newVal = !status.config.isEnabled
    try {
      setToggling(true)
      await apiPost('/auto-lose-system/toggle', { isEnabled: newVal })
      toast.success(newVal ? 'AutoLose System diaktifkan' : 'AutoLose System dinonaktifkan')
      await loadStatus(true)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Gagal mengubah status')
    } finally {
      setToggling(false)
    }
  }

  const handleKillerMode = async () => {
    if (!status) return
    const newVal = !status.config.killerMode
    try {
      setTogglingKiller(true)
      await apiPost('/auto-lose-system/killer-mode', { killerMode: newVal })
      toast.success(newVal ? 'Killer Mode AKTIF – semua order akan LOSE!' : 'Killer Mode dinonaktifkan')
      await loadStatus(true)
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Gagal mengubah Killer Mode')
    } finally {
      setTogglingKiller(false)
    }
  }

  const BgWrapper = ({ children }: { children: React.ReactNode }) => (
    <>
      <GlobalStyles />
      <div className="bg-pattern-grid min-h-screen relative">
        <Navbar />
        {children}
      </div>
    </>
  )

  if (loading) {
    return (
      <BgWrapper>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="text-slate-500 text-sm">Memuat AutoLose System…</p>
          </div>
        </div>
      </BgWrapper>
    )
  }

  if (!status) {
    return (
      <BgWrapper>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <p className="text-red-400 mb-3">Gagal memuat data</p>
            <button
              onClick={() => loadStatus()}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors text-sm"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </BgWrapper>
    )
  }

  const { config, trackerStats } = status

  return (
    <BgWrapper>
      <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">

        {/* ── Header ── */}
        <motion.div className="mb-8"
          initial="hidden" animate="visible" variants={stagger(0.1)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <motion.div variants={fadeLeft}>
              <motion.div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1" variants={fadeUp}>
                <span>Dasbor</span><span>/</span><span>Admin</span><span>/</span>
                <span className="text-slate-100 font-medium">AutoLose System</span>
              </motion.div>
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-9 h-9 bg-gradient-to-br from-red-400/80 to-orange-500/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/30 border border-white/20"
                  whileHover={{ rotate: 90, scale: 1.1 }} transition={{ ...SPRING }}>
                  <Lightning className="w-5 h-5 text-white" weight="duotone" />
                </motion.div>
                <div>
                  <AnimatedHeadline
                    text="AutoLose System"
                    className="text-2xl sm:text-3xl font-bold text-slate-100"
                    style={{ letterSpacing: '-0.03em' }}
                  />
                  <motion.p className="text-slate-400 text-sm mt-0.5" variants={fadeUp}>
                    Super Admin Control Panel — Semua perubahan berlaku secara real-time
                  </motion.p>
                </div>
              </div>
            </motion.div>
            <motion.div variants={scaleIn} className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 glass-input px-3 py-1.5 rounded-xl">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live — diperbarui setiap 10 detik
              </div>
              <motion.button
                onClick={() => loadStatus()}
                className="flex items-center gap-2 px-4 py-2.5 glass-input rounded-xl text-sm font-medium text-slate-200 hover:bg-white/10 transition-colors"
                title="Refresh data sekarang"
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              >
                <ArrowsClockwise className="w-4 h-4 text-slate-400" weight="bold" />
                Perbarui
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* ── Killer Mode Banner ── */}
        {config.killerMode && (
          <motion.div className="relative overflow-hidden rounded-xl border border-red-500/40 bg-red-950/30 p-4 mb-6"
            initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...SPRING }}>
            <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-transparent pointer-events-none" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <Skull className="w-8 h-8 text-red-400 animate-pulse flex-shrink-0 mt-0.5" weight="duotone" />
                <div>
                  <p className="text-sm font-bold text-red-300">KILLER MODE SEDANG AKTIF</p>
                  <p className="text-xs text-red-400/90 mt-1 leading-relaxed">
                    Mode ini memaksa <strong>semua order</strong> untuk LOSE, tanpa memandang filter akun, status, nominal, atau priority mode. 
                    Seluruh konfigurasi lainnya diabaikan selama Killer Mode aktif. 
                    Gunakan hanya dalam kondisi darurat.
                  </p>
                </div>
              </div>
              <button
                onClick={handleKillerMode}
                disabled={togglingKiller}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-all"
              >
                {togglingKiller && <Spinner size={4} />}
                Nonaktifkan
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Stats Cards ── */}
        <Reveal className="glass-card rounded-2xl p-5 mb-6">
          <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3"
            variants={stagger(0.06)} initial="hidden" animate="visible">
          {/* AutoLose Toggle */}
          <motion.div variants={fadeUp} className="glass-card rounded-xl p-4 col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">AutoLose Status</p>
                  <Tooltip text="Saklar utama sistem AutoLose. Saat OFF, semua order berjalan normal tanpa intervensi apapun. Saat ON, sistem mulai memproses order sesuai konfigurasi yang telah diatur." />
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xl font-bold ${config.isEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {config.isEnabled ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                  {config.isEnabled && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {config.isEnabled
                    ? 'Sistem sedang memantau dan memproses order secara aktif'
                    : 'Sistem tidak aktif — semua order berjalan normal'}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                {toggling && <Spinner size={4} />}
                <Toggle checked={config.isEnabled} onChange={handleToggle} disabled={toggling} size="lg" />
                <span className="text-[10px] text-slate-600">{config.isEnabled ? 'Klik untuk OFF' : 'Klik untuk ON'}</span>
              </div>
            </div>
          </motion.div>

          {/* Killer Mode */}
          <motion.div variants={fadeUp} className="glass-card rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <p className="text-xs text-slate-400 uppercase tracking-widest">Killer Mode</p>
                  <Tooltip text="Mode ekstrem yang men-lose SEMUA order tanpa filter. Mengabaikan semua konfigurasi lain. Hanya aktifkan saat benar-benar diperlukan. Membutuhkan AutoLose aktif terlebih dahulu." />
                </div>
                <span className={`text-xl font-bold ${config.killerMode ? 'text-red-400' : 'text-slate-500'}`}>
                  {config.killerMode ? 'ON' : 'OFF'}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  {config.killerMode ? 'Semua order di-lose!' : 'Filter normal berlaku'}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                {togglingKiller && <Spinner size={4} />}
                <Toggle
                  checked={config.killerMode}
                  onChange={handleKillerMode}
                  disabled={togglingKiller || !config.isEnabled}
                  size="md"
                />
                {!config.isEnabled && (
                  <span className="text-[10px] text-slate-600 text-center">Aktifkan sistem dulu</span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Priority Mode */}
          <motion.div variants={fadeUp} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-xs text-slate-400 uppercase tracking-widest">Priority Mode</p>
              <Tooltip text="Mode seleksi order aktif. 'Highest' = hanya order terbesar yang di-lose. 'All' = semua order yang lolos filter di-lose." />
            </div>
            <span className="text-xl font-bold text-white">
              {config.priorityMode === 'highest_amount' ? 'Highest' : 'All'}
            </span>
            <p className="text-xs text-slate-500 mt-1">
              {config.priorityMode === 'highest_amount'
                ? `Top ${config.losePercentage}% order terbesar per window`
                : 'Semua order yang lolos filter di-lose'}
            </p>
          </motion.div>
        </motion.div>
        </Reveal>

        {/* ── Quick Info ── */}
        <Reveal className="glass-card rounded-2xl p-5 mb-4">
          <motion.div className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            variants={stagger(0.05)} initial="hidden" animate="visible">
          {[
            {
              label: 'Target Akun',
              value: config.targetAccountType === 'both' ? 'Demo + Real' : config.targetAccountType.charAt(0).toUpperCase() + config.targetAccountType.slice(1),
              tip: 'Jenis akun yang sedang ditarget sistem',
            },
            {
              label: 'Target Status',
              value: config.targetUserStatus.length > 0
                ? config.targetUserStatus.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
                : '—',
              tip: 'Tier pengguna yang akan dikenai AutoLose',
            },
            {
              label: 'Min Amount',
              value: formatRupiah(config.minOrderAmount),
              tip: 'Nominal minimum order agar diproses. Order di bawah ini dilewati.',
            },
            {
              label: 'Maks Amount',
              value: formatRupiah(config.maxOrderAmount),
              tip: 'Nominal maksimum order agar diproses. Order di atas ini dilewati.',
            },
          ].map(({ label, value, tip }) => (
            <motion.div key={label} variants={fadeUp} className="glass-sub rounded-xl px-4 py-3"
              whileHover={{ y: -1, transition: { duration: 0.15 } }}>
              <div className="flex items-center gap-1 mb-1">
                <div className="text-xs text-slate-400 uppercase tracking-widest">{label}</div>
                <Tooltip text={tip} />
              </div>
              <p className="text-sm font-semibold text-white truncate">{value}</p>
            </motion.div>
          ))}
          </motion.div>
          <div className="text-xs text-slate-600 mt-3">
            Terakhir diubah: {formatDate(config.updatedAt)}
            {config.updatedByEmail && <span className="text-slate-700"> oleh {config.updatedByEmail}</span>}
          </div>
        </Reveal>

        {/* ── Tabs ── */}
        <div>
          <motion.div className="flex gap-1 glass-input rounded-xl p-1 w-fit mb-1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            {([
              { key: 'config', label: 'Konfigurasi', icon: Gear, desc: 'Atur target & filter' },
              { key: 'tracker', label: 'Tracker', icon: ChartBar, desc: 'Monitor window aktif' },
              { key: 'logs', label: 'Logs', icon: ClipboardText, desc: 'Riwayat order di-lose' },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === key ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {activeTab === key && (
                  <motion.div className="absolute inset-0 rounded-lg bg-white/10 shadow-sm"
                    layoutId="autoLoseTabPill" transition={{ ...SPRING }} />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" weight="duotone" />
                  {label}
                </span>
              </button>
            ))}
          </motion.div>
          <p className="text-xs text-slate-600 mb-4 pl-1">
            {activeTab === 'config' && 'Atur siapa dan order mana yang akan dikenai sistem AutoLose.'}
            {activeTab === 'tracker' && 'Pantau order yang sedang aktif diproses dalam jendela waktu (window).'}
            {activeTab === 'logs' && 'Lihat riwayat semua order yang telah berhasil di-lose oleh sistem.'}
          </p>

          {/* Config Tab */}
          {activeTab === 'config' && (
            <motion.div className="glass-card rounded-2xl p-5"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING }}>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">Konfigurasi AutoLose</h2>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Tentukan siapa yang ditarget, nominal berapa, dan bagaimana cara sistem memilih order untuk di-lose. 
                Konfigurasi ini disimpan ke database dan berlaku segera setelah tombol Simpan ditekan.
              </p>
              {!config.isEnabled && (
                <div className="mb-6 flex items-start gap-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-400">
                  <Warning className="w-4 h-4 mt-0.5 flex-shrink-0" weight="bold" />
                  <span>
                    AutoLose System sedang <strong>nonaktif</strong>. Kamu tetap bisa mengubah konfigurasi di sini — 
                    perubahan akan tersimpan dan langsung berlaku begitu sistem diaktifkan kembali dari toggle di atas.
                  </span>
                </div>
              )}
              <ConfigForm config={config} onSaved={() => loadStatus(true)} />
            </motion.div>
          )}

          {/* Tracker Tab */}
          {activeTab === 'tracker' && (
            <motion.div className="glass-card rounded-2xl p-5"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING }}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest">
                  Order Tracker (Real-time)
                </h2>
                <button
                  onClick={() => loadStatus(true)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                >
                  <ArrowsClockwise className="w-3.5 h-3.5" weight="bold" />
                  Refresh
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Tampilan real-time dari order yang sedang dipantau sistem dalam jendela waktu aktif (window). 
                Data ini diperbarui otomatis setiap 10 detik.
              </p>
              <TrackerPanel stats={trackerStats} />
            </motion.div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <motion.div className="glass-card rounded-2xl p-5"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING }}>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-widest mb-1">
                Riwayat AutoLose Logs
              </h2>
              <p className="text-xs text-slate-500 mb-5">
                Catatan lengkap setiap order yang telah di-lose oleh sistem. 
                Data ini berguna untuk audit, monitoring pola, dan verifikasi bahwa sistem bekerja sesuai konfigurasi.
              </p>
              <LogsTable />
            </motion.div>
          )}
        </div>
      </div>
    </BgWrapper>
  )
}