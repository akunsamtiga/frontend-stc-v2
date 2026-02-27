// components/TradingTutorial.tsx
'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X, ArrowRight, ArrowLeft,
  TrendingUp, DollarSign, Clock,
  Target, BarChart2, Zap, Check,
} from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Step {
  target: string   // matches data-tutorial="..."
  title: string
  icon: React.ComponentType<{ style?: React.CSSProperties }>
  placement: 'top' | 'bottom' | 'left' | 'right'
  padding?: number
  // Desktop (≥1024): full text
  description: string
  tips: string[]
  // Tablet (640–1023): shorter text
  descriptionTablet?: string
  tipsTablet?: string[]
  // Mobile (<640): minimal text
  descriptionMobile?: string
  tipsMobile?: string[]
}

interface Rect { top: number; left: number; width: number; height: number }

export interface TradingTutorialProps {
  onComplete: () => void
  onSkip: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Steps — every step highlights a real element via data-tutorial="..."
// ─────────────────────────────────────────────────────────────────────────────

const STEPS: Step[] = [
  {
    target: 'asset-selector',
    title: 'Pilih Aset Trading',
    icon: BarChart2,
    placement: 'bottom',
    padding: 8,
    // Desktop
    description: 'Klik di sini untuk memilih aset yang ingin kamu tradingkan — tersedia 15 aset dari kategori Forex, Crypto, Komoditas, Saham, dan Indeks.',
    tips: [
      'Tersedia 15 aset: Forex, Crypto, Komoditas, Saham & Indeks',
      'Contoh: XAU/USD (Gold +87%), EUR/USD, MSFT, NG/USD',
      'Angka % = profit rate yang kamu terima jika prediksi benar',
    ],
    // Tablet
    descriptionTablet: 'Pilih dari 15 aset — Forex, Crypto, Komoditas, Saham, dan Indeks.',
    tipsTablet: [
      'Contoh: XAU/USD (Gold +87%), EUR/USD, MSFT',
      'Angka % = profit rate jika prediksi benar',
    ],
    // Mobile
    descriptionMobile: 'Pilih aset trading dari 15 pilihan tersedia.',
    tipsMobile: [
      'Gold +87%, EUR/USD, MSFT tersedia',
    ],
  },
  {
    target: 'account-type',
    title: 'Akun Demo & Real',
    icon: DollarSign,
    placement: 'bottom',
    padding: 8,
    // Desktop
    description: 'Switch antara akun Demo (uang virtual) dan akun Real (uang sungguhan) kapan saja di sini.',
    tips: [
      'Demo: Rp 10 juta virtual, aman untuk latihan',
      'Real: butuh deposit, profit bisa ditarik',
      'Selalu latihan di Demo dulu sebelum Real',
    ],
    // Tablet
    descriptionTablet: 'Switch antara Demo (virtual) dan Real (sungguhan) di sini.',
    tipsTablet: [
      'Demo: Rp 10 juta virtual untuk latihan',
      'Latihan Demo dulu sebelum ke akun Real',
    ],
    // Mobile
    descriptionMobile: 'Pilih akun Demo atau Real di sini.',
    tipsMobile: [
      'Demo = virtual, Real = uang sungguhan',
    ],
  },
  {
    target: 'chart-area',
    title: 'Chart Harga Real-Time',
    icon: TrendingUp,
    placement: 'right',
    padding: 10,
    // Desktop
    description: 'Chart ini menampilkan pergerakan harga secara live. Analisis arah tren sebelum membuka posisi.',
    tips: [
      'Ubah timeframe: 1s, 1m, 5m, 15m, dll',
      'Aktifkan indikator MA, RSI, atau MACD',
      'Garis horizontal = level harga entry aktif',
    ],
    // Tablet
    descriptionTablet: 'Pantau pergerakan harga live dan analisis tren sebelum trading.',
    tipsTablet: [
      'Ubah timeframe: 1s, 1m, 5m, 15m...',
      'Garis horizontal = harga entry aktif',
    ],
    // Mobile
    descriptionMobile: 'Chart harga live untuk analisis tren.',
    tipsMobile: [
      'Ganti timeframe sesuai strategi',
    ],
  },
  {
    target: 'duration-selector',
    title: 'Durasi Kontrak',
    icon: Clock,
    placement: 'left',
    padding: 8,
    // Desktop
    description: 'Pilih berapa lama kontrak kamu berlangsung. Setelah durasi habis, hasilnya otomatis ditentukan.',
    tips: [
      '1–3 menit: cepat, cocok untuk scalping',
      '5–15 menit: analisis lebih stabil',
      '30–60 menit: ikuti tren yang lebih besar',
    ],
    // Tablet
    descriptionTablet: 'Tentukan durasi kontrak. Hasil ditentukan otomatis saat waktu habis.',
    tipsTablet: [
      '1–3 menit: scalping cepat',
      '5–15 menit: lebih stabil & akurat',
    ],
    // Mobile
    descriptionMobile: 'Pilih durasi kontrak trading kamu.',
    tipsMobile: [
      '1m scalping, 5–15m lebih stabil',
    ],
  },
  {
    target: 'amount-input',
    title: 'Jumlah Investasi',
    icon: Zap,
    placement: 'left',
    padding: 8,
    // Desktop
    description: 'Tentukan berapa rupiah yang kamu investasikan per transaksi. Profit dihitung dari jumlah ini.',
    tips: [
      'Minimal Rp 10.000 per transaksi',
      'Estimasi profit tampil otomatis di bawah',
      'Gunakan preset angka untuk lebih cepat',
    ],
    // Tablet
    descriptionTablet: 'Isi jumlah investasi per transaksi. Profit dihitung dari nominal ini.',
    tipsTablet: [
      'Minimal Rp 10.000 per transaksi',
      'Estimasi profit tampil otomatis',
    ],
    // Mobile
    descriptionMobile: 'Masukkan nominal investasi per order.',
    tipsMobile: [
      'Minimal Rp 10.000',
    ],
  },
  {
    target: 'trade-buttons',
    title: 'BUY atau SELL',
    icon: Target,
    placement: 'left',
    padding: 8,
    // Desktop
    description: 'Tombol eksekusi. Tekan BUY kalau prediksi harga naik, SELL kalau prediksi harga turun saat kontrak berakhir.',
    tips: [
      'BUY (CALL) → harga harus naik dari entry',
      'SELL (PUT) → harga harus turun dari entry',
      'Profit langsung masuk saldo jika benar',
    ],
    // Tablet
    descriptionTablet: 'Tekan BUY jika prediksi naik, SELL jika prediksi turun.',
    tipsTablet: [
      'BUY → prediksi harga naik',
      'SELL → prediksi harga turun',
    ],
    // Mobile
    descriptionMobile: 'BUY = naik, SELL = turun.',
    tipsMobile: [
      'Profit masuk saldo jika prediksi benar',
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip dimensions & positioning
// ─────────────────────────────────────────────────────────────────────────────

const TW_DESKTOP = 320   // tooltip width desktop
const TW_TABLET  = 280   // tooltip width tablet
const TW_MOBILE  = 240   // tooltip width mobile
const TH = 295    // tooltip height estimate
const GAP = 16    // gap between spotlight edge and tooltip

function getTooltipWidth(vpW: number) {
  if (vpW >= 1024) return TW_DESKTOP
  if (vpW >= 640)  return TW_TABLET
  return TW_MOBILE
}

function calcPos(rect: Rect, pad: number, preferred: Step['placement'], vpW: number, vpH: number) {
  const TW = getTooltipWidth(vpW)
  const sT = rect.top  - pad
  const sB = rect.top  + rect.height + pad
  const sL = rect.left - pad
  const sR = rect.left + rect.width  + pad
  const cx = rect.left + rect.width  / 2
  const cy = rect.top  + rect.height / 2

  const clL = (x: number) => Math.min(Math.max(x, 10), vpW - TW - 10)
  const clT = (y: number) => Math.min(Math.max(y, 10), vpH - TH - 10)

  const order = [preferred, 'bottom', 'top', 'right', 'left'] as Step['placement'][]
  const seen  = new Set<string>()

  for (const p of order) {
    if (seen.has(p)) continue
    seen.add(p)
    if (p === 'bottom' && sB + TH + GAP <= vpH) return { t: sB + GAP,      l: clL(cx - TW / 2), p: 'bottom' as const }
    if (p === 'top'    && sT - TH - GAP >= 0)   return { t: sT - TH - GAP, l: clL(cx - TW / 2), p: 'top'    as const }
    if (p === 'right'  && sR + TW + GAP <= vpW) return { t: clT(cy - TH/2), l: sR + GAP,         p: 'right'  as const }
    if (p === 'left'   && sL - TW - GAP >= 0)   return { t: clT(cy - TH/2), l: sL - TW - GAP,    p: 'left'   as const }
  }

  // last resort: bottom-center clamped
  return { t: clT(sB + GAP), l: clL(cx - TW / 2), p: 'bottom' as const }
}

// ─────────────────────────────────────────────────────────────────────────────
// Arrow pointing from tooltip toward the spotlight
// ─────────────────────────────────────────────────────────────────────────────

function Arrow({ p }: { p: 'top' | 'bottom' | 'left' | 'right' }) {
  const solid = '1px solid rgba(55,85,155,0.4)'
  const none  = '1px solid transparent'
  const base: React.CSSProperties = {
    position: 'absolute', width: 12, height: 12,
    background: '#141c2e', transform: 'rotate(45deg)',
    borderTop: solid, borderRight: solid, borderBottom: solid, borderLeft: solid,
    zIndex: 0,
  }
  const variants: Record<string, React.CSSProperties> = {
    // tooltip is BELOW the element → arrow points UP from top of tooltip
    bottom: { top: -7,    left: '50%', marginLeft: -6, borderBottom: none, borderRight: none },
    // tooltip is ABOVE the element → arrow points DOWN from bottom of tooltip
    top:    { bottom: -7, left: '50%', marginLeft: -6, borderTop: none,    borderLeft: none  },
    // tooltip is to the RIGHT → arrow points LEFT from left of tooltip
    right:  { left: -7,   top: '50%',  marginTop: -6,  borderBottom: none, borderLeft: none  },
    // tooltip is to the LEFT → arrow points RIGHT from right of tooltip
    left:   { right: -7,  top: '50%',  marginTop: -6,  borderTop: none,    borderRight: none },
  }
  return <div style={{ ...base, ...variants[p] }} />
}

// ─────────────────────────────────────────────────────────────────────────────
// Tooltip Card
// ─────────────────────────────────────────────────────────────────────────────

interface CardProps {
  step: Step; idx: number; total: number
  isLast: boolean; fading: boolean; vpW: number
  onNext(): void; onPrev(): void; onSkip(): void; onDot(i: number): void
}

function Card({ step, idx, total, isLast, fading, vpW, onNext, onPrev, onSkip, onDot }: CardProps) {
  const Icon = step.icon

  // Pick responsive content based on viewport width
  const isTablet  = vpW >= 640 && vpW < 1024
  const isMobile  = vpW < 640
  const TW = getTooltipWidth(vpW)

  const desc = isMobile
    ? (step.descriptionMobile ?? step.description)
    : isTablet
      ? (step.descriptionTablet ?? step.description)
      : step.description

  const tips = isMobile
    ? (step.tipsMobile ?? step.tips)
    : isTablet
      ? (step.tipsTablet ?? step.tips)
      : step.tips

  // Scale font sizes down on smaller screens
  const fs = isMobile ? 10.5 : isTablet ? 11 : 11.5
  const titleFs = isMobile ? 12 : isTablet ? 12.5 : 13

  return (
    <div style={{
      width: TW, borderRadius: 14, overflow: 'hidden',
      background: 'linear-gradient(155deg,#161f32 0%,#0d1321 100%)',
      border: '1px solid rgba(55,85,155,0.45)',
      boxShadow: '0 24px 60px rgba(0,0,0,0.8), 0 0 0 0.5px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)',
      opacity: fading ? 0 : 1,
      transform: fading ? 'translateY(8px) scale(0.97)' : 'translateY(0) scale(1)',
      transition: 'opacity 0.18s ease, transform 0.2s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {/* Accent line */}
      <div style={{ height: 2, background: 'linear-gradient(90deg,#2563eb,#06b6d4,#10b981)' }} />

      {/* Progress dots */}
      <div style={{ padding: '11px 14px 3px', display: 'flex', alignItems: 'center', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <button key={i} onClick={() => onDot(i)} style={{
            height: 4, width: i === idx ? 24 : 7, borderRadius: 99,
            border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.25s',
            background: i < idx
              ? 'rgba(59,130,246,0.5)'
              : i === idx ? '#3b82f6' : 'rgba(255,255,255,0.1)',
          }} />
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 9.5, color: '#364558', fontVariantNumeric: 'tabular-nums' }}>
          {idx + 1}/{total}
        </span>
      </div>

      <div style={{ padding: isMobile ? '6px 12px 12px' : '7px 14px 14px' }}>
        {/* Header */}
        <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 8 }}>
          {!isMobile && (
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(37,99,235,0.14)', border: '1px solid rgba(59,130,246,0.24)',
            }}>
              <Icon style={{ width: 15, height: 15, color: '#60a5fa' }} />
            </div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ margin: '0 0 1px', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#2d5fa8' }}>
              Langkah {idx + 1} dari {total}
            </p>
            <h3 style={{ margin: 0, fontSize: titleFs, fontWeight: 700, color: '#eef2ff', lineHeight: 1.3 }}>
              {step.title}
            </h3>
          </div>
          <button onClick={onSkip} style={{
            width: 22, height: 22, border: 'none', cursor: 'pointer', flexShrink: 0,
            borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'transparent', color: '#2f3e55', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'rgba(255,255,255,0.08)'; el.style.color = '#6b7fa0' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = 'transparent'; el.style.color = '#2f3e55' }}>
            <X style={{ width: 11, height: 11 }} />
          </button>
        </div>

        {/* Description */}
        <p style={{ margin: '0 0 9px', fontSize: fs, color: '#7d90a8', lineHeight: 1.65 }}>
          {desc}
        </p>

        {/* Tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 4 : 5, marginBottom: 12 }}>
          {tips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
              <div style={{
                width: 15, height: 15, borderRadius: 4, flexShrink: 0, marginTop: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(37,99,235,0.13)', border: '1px solid rgba(59,130,246,0.22)',
              }}>
                <Check style={{ width: 8, height: 8, color: '#60a5fa' }} />
              </div>
              <span style={{ fontSize: fs - 0.5, color: '#a8bcd0', lineHeight: 1.55 }}>{tip}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 7 }}>
          {idx > 0 && (
            <button onClick={onPrev} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '7px 12px', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.09)',
              background: 'rgba(255,255,255,0.05)',
              color: '#6b7fa0', fontSize: fs, fontWeight: 500, cursor: 'pointer', transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}>
              <ArrowLeft style={{ width: 11, height: 11 }} />
              Kembali
            </button>
          )}
          <button onClick={onNext} style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '7px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: isLast
              ? 'linear-gradient(135deg,#059669,#10b981)'
              : 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
            boxShadow: isLast
              ? '0 4px 14px rgba(16,185,129,0.3)'
              : '0 4px 14px rgba(59,130,246,0.3)',
            color: '#fff', fontSize: fs, fontWeight: 600, transition: 'filter 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.filter = 'brightness(1.12)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.filter = ''}>
            {isLast
              ? <><Check style={{ width: 11, height: 11 }} />&nbsp;Mulai Trading!</>
              : <>Lanjutkan&nbsp;<ArrowRight style={{ width: 11, height: 11 }} /></>
            }
          </button>
        </div>

        {!isLast && (
          <button onClick={onSkip} style={{
            width: '100%', marginTop: 9, background: 'none', border: 'none',
            fontSize: 10, color: '#253040', cursor: 'pointer', transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#5a7090'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = '#253040'}>
            Lewati tutorial
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export default function TradingTutorial({ onComplete, onSkip }: TradingTutorialProps) {
  const [idx, setIdx]         = useState(0)
  const [fading, setFading]   = useState(false)
  const [rect, setRect]       = useState<Rect | null>(null)
  const [vp, setVp]           = useState({ w: 1440, h: 900 })
  const [mounted, setMounted] = useState(false)
  const rafRef                = useRef<number | null>(null)

  const step   = STEPS[idx]
  const isLast = idx === STEPS.length - 1
  const pad    = step.padding ?? 8

  // Mount guard for createPortal
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // Measure the highlighted element
  const measure = useCallback(() => {
    if (typeof window === 'undefined') return
    setVp({ w: window.innerWidth, h: window.innerHeight })
    const el = document.querySelector(`[data-tutorial="${step.target}"]`)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step.target])

  // Re-measure after step changes (80ms delay so DOM settles)
  useEffect(() => {
    const t = setTimeout(measure, 80)
    return () => clearTimeout(t)
  }, [measure])

  // Re-measure on resize/scroll
  useEffect(() => {
    const h = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(measure)
    }
    window.addEventListener('resize', h)
    window.addEventListener('scroll', h, true)
    return () => {
      window.removeEventListener('resize', h)
      window.removeEventListener('scroll', h, true)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [measure])

  // Scroll target into view
  useEffect(() => {
    const el = document.querySelector(`[data-tutorial="${step.target}"]`) as HTMLElement | null
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [step.target])

  // Navigate with fade
  const goTo = useCallback((next: number) => {
    setFading(true)
    setTimeout(() => {
      setIdx(next)
      setFading(false)
    }, 180)
  }, [])

  const handleNext = useCallback(() => { isLast ? onComplete() : goTo(idx + 1) }, [isLast, onComplete, goTo, idx])
  const handlePrev = useCallback(() => { if (idx > 0) goTo(idx - 1) }, [idx, goTo])
  const handleDot  = useCallback((i: number) => { if (i !== idx) goTo(i) }, [idx, goTo])

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext()
      else if (e.key === 'ArrowLeft') handlePrev()
      else if (e.key === 'Escape') onSkip()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [handleNext, handlePrev, onSkip])

  const pos = useMemo(() => {
    if (!rect) return null
    return calcPos(rect, pad, step.placement, vp.w, vp.h)
  }, [rect, pad, step.placement, vp])

  if (!mounted) return null

  // Spotlight box geometry
  const sX = rect ? rect.left   - pad     : 0
  const sY = rect ? rect.top    - pad     : 0
  const sW = rect ? rect.width  + pad * 2 : 0
  const sH = rect ? rect.height + pad * 2 : 0
  const sR = 10  // border-radius of the spotlight hole

  const cardProps: CardProps = {
    step, idx, total: STEPS.length, isLast, fading, vpW: vp.w,
    onNext: handleNext, onPrev: handlePrev, onSkip, onDot: handleDot,
  }

  return createPortal(
    <>
      {/* ── SVG: dark overlay with transparent cutout ─────────────────────── */}
      <svg style={{
        position: 'fixed', inset: 0, zIndex: 9990,
        width: '100%', height: '100%',
        pointerEvents: 'none', overflow: 'visible',
      }}>
        <defs>
          {/* Mask: white everywhere EXCEPT the spotlight hole (black = transparent) */}
          <mask id="stc-spotlight-mask">
            <rect width={vp.w} height={vp.h} fill="white" />
            {rect && (
              <rect
                x={sX} y={sY} width={sW} height={sH} rx={sR}
                fill="black"
                style={{ transition: 'x 0.38s cubic-bezier(0.22,1,0.36,1), y 0.38s cubic-bezier(0.22,1,0.36,1), width 0.38s cubic-bezier(0.22,1,0.36,1), height 0.38s cubic-bezier(0.22,1,0.36,1)' }}
              />
            )}
          </mask>
        </defs>

        {/* Dark overlay (with cutout hole applied by mask) */}
        <rect width={vp.w} height={vp.h} fill="rgba(0,0,0,0.72)" mask="url(#stc-spotlight-mask)" />

        {/* Soft glow behind the spotlight border */}
        {rect && (
          <rect
            x={sX - 4} y={sY - 4} width={sW + 8} height={sH + 8}
            rx={sR + 4} fill="none"
            stroke="rgba(59,130,246,0.2)" strokeWidth={16}
            style={{
              filter: 'blur(12px)',
              transition: 'x 0.38s cubic-bezier(0.22,1,0.36,1), y 0.38s cubic-bezier(0.22,1,0.36,1), width 0.38s, height 0.38s',
            }}
          />
        )}

        {/* Animated dashed border around spotlight */}
        {rect && (
          <rect
            x={sX} y={sY} width={sW} height={sH} rx={sR}
            fill="none" stroke="rgba(99,160,255,0.9)" strokeWidth={1.5}
            strokeDasharray="8 4"
            style={{
              transition: 'x 0.38s cubic-bezier(0.22,1,0.36,1), y 0.38s cubic-bezier(0.22,1,0.36,1), width 0.38s, height 0.38s',
            }}
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-24" dur="1.1s" repeatCount="indefinite" />
          </rect>
        )}
      </svg>

      {/* ── Backdrop: click outside spotlight → skip ──────────────────────── */}
      {rect && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9991, cursor: 'default' }}
          onClick={(e) => {
            const { clientX: x, clientY: y } = e
            // Only skip if click is outside the spotlight hole
            const inside = x >= sX && x <= sX + sW && y >= sY && y <= sY + sH
            if (!inside) onSkip()
          }}
        />
      )}

      {/* ── Pulse ring around the spotlight ───────────────────────────────── */}
      {rect && (
        <div style={{
          position: 'fixed', zIndex: 9992, pointerEvents: 'none',
          top: sY - 5, left: sX - 5,
          width: sW + 10, height: sH + 10,
          borderRadius: sR + 5,
          animation: 'stc-pulse 2s ease-out infinite',
          transition: 'top 0.38s cubic-bezier(0.22,1,0.36,1), left 0.38s cubic-bezier(0.22,1,0.36,1), width 0.38s, height 0.38s',
        }} />
      )}

      {/* ── Step number badge (top-right corner of spotlight) ─────────────── */}
      {rect && (
        <div style={{
          position: 'fixed', zIndex: 9994, pointerEvents: 'none',
          top: Math.max(6, sY - 13),
          left: Math.min(sX + sW - 13, vp.w - 32),
          transition: 'top 0.38s cubic-bezier(0.22,1,0.36,1), left 0.38s cubic-bezier(0.22,1,0.36,1)',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
            boxShadow: '0 0 0 2.5px #090d17, 0 0 12px rgba(59,130,246,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10.5, fontWeight: 700, color: '#fff',
          }}>
            {idx + 1}
          </div>
        </div>
      )}

      {/* ── Tooltip card with arrow ────────────────────────────────────────── */}
      {pos && rect && (
        <div style={{
          position: 'fixed', zIndex: 9993, pointerEvents: 'auto',
          top: pos.t, left: pos.l,
        }}>
          <Card {...cardProps} />
          <Arrow p={pos.p} />
        </div>
      )}

      {/* ── Keyboard shortcut hint ─────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 9995, pointerEvents: 'none',
        display: 'flex', gap: 14, alignItems: 'center',
        opacity: fading ? 0 : 0.38, transition: 'opacity 0.3s',
      }}>
        {[['←', 'Kembali'], ['→', 'Lanjut'], ['Esc', 'Skip']].map(([key, label]) => (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#7a8ca4' }}>
            <kbd style={{
              padding: '2px 5px', borderRadius: 4, fontSize: 9, fontFamily: 'monospace',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#7a8ca4',
            }}>{key}</kbd>
            {label}
          </div>
        ))}
      </div>

      {/* ── CSS animations ─────────────────────────────────────────────────── */}
      <style>{`
        @keyframes stc-pulse {
          0%   { box-shadow: 0 0 0 0    rgba(99,160,255,0.55); }
          70%  { box-shadow: 0 0 0 12px rgba(99,160,255,0); }
          100% { box-shadow: 0 0 0 0    rgba(99,160,255,0); }
        }
      `}</style>
    </>,
    document.body
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook — manage tutorial state + localStorage
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'stc_tutorial_v3'

export function useTradingTutorial() {
  const [showTutorial, setShowTutorial] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setShowTutorial(true), 900)
      return () => clearTimeout(t)
    }
  }, [])

  const completeTutorial = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1')
    setShowTutorial(false)
  }, [])

  const skipTutorial = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1')
    setShowTutorial(false)
  }, [])

  const resetTutorial = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setShowTutorial(true)
  }, [])

  return { showTutorial, completeTutorial, skipTutorial, resetTutorial }
}