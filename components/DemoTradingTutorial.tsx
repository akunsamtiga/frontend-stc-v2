'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  X, TrendingUp, TrendingDown, DollarSign, Clock, Target, Zap,
  CheckCircle2, ArrowRight, ArrowLeft, Minus, Plus, BarChart2,
  ChevronDown, AlertCircle, Play,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────────────────────────
   Types & Constants
───────────────────────────────────────────────────────────────────────────── */
interface DemoTradingTutorialProps { onClose: () => void }
interface Candle { o: number; h: number; l: number; c: number }

const ASSETS = [
  { symbol: 'XAU/USD', name: 'Gold',        profit: 87, price: 1921.45, seed: 7  },
  { symbol: 'EUR/USD', name: 'Euro/Dollar',  profit: 82, price: 1.0892,  seed: 13 },
  { symbol: 'BTC/USD', name: 'Bitcoin',      profit: 85, price: 68420.0, seed: 21 },
  { symbol: 'MSFT',    name: 'Microsoft',    profit: 79, price: 415.32,  seed: 5  },
]

const DURATIONS = ['1m', '2m', '3m', '5m', '10m', '15m']
const PRESETS   = [50000, 100000, 250000, 500000]

const STEPS = [
  {
    id: 'welcome', title: 'Selamat Datang!', icon: Zap, hl: '',
    desc: 'Latihan trading tanpa risiko dengan saldo demo Rp 10.000.000 gratis.',
    tips: ['Tidak perlu deposit', 'Profit hingga 95% per transaksi', 'Bebas latihan kapan saja'],
  },
  {
    id: 'asset', title: '1. Pilih Aset', icon: BarChart2, hl: 'asset',
    desc: 'Pilih dari 15+ pasangan aset: Forex, Crypto, Saham & Komoditas.',
    tips: ['Angka % menunjukkan profit rate', 'Gold & BTC paling populer'],
  },
  {
    id: 'duration', title: '2. Pilih Durasi', icon: Clock, hl: 'duration',
    desc: 'Durasi kontrak menentukan kapan hasil trading dihitung.',
    tips: ['1–3m: scalping cepat', '5–15m: tren lebih mudah dibaca'],
  },
  {
    id: 'amount', title: '3. Jumlah Investasi', icon: DollarSign, hl: 'amount',
    desc: 'Atur nominal per order. Estimasi profit dihitung otomatis.',
    tips: ['Minimal investasi Rp 10.000', 'Gunakan preset untuk lebih cepat'],
  },
  {
    id: 'trade', title: '4. Eksekusi Order', icon: Target, hl: 'trade',
    desc: 'Tekan BUY jika prediksi harga naik, SELL jika turun saat kontrak berakhir.',
    tips: ['Analisis chart sebelum order!', 'Profit masuk saldo jika prediksi benar'],
  },
  {
    id: 'finish', title: 'Siap Trading!', icon: CheckCircle2, hl: '',
    desc: 'Kamu sudah paham cara kerjanya. Latih terus di demo sebelum ke akun real.',
    tips: ['Konsistensi adalah kunci profit', 'Kelola risiko dengan bijak'],
  },
]

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
function genCandles(count: number, base: number, seed: number): Candle[] {
  let p = base, s = seed
  const rng = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
  return Array.from({ length: count }, () => {
    const o = p
    const move = (rng() - 0.48) * base * 0.006
    const c = o + move
    const wick = rng() * base * 0.003
    const h = Math.max(o, c) + wick
    const l = Math.min(o, c) - wick * rng()
    p = c
    return { o, h, l, c }
  })
}

const fmt = (p: number) => p >= 1000 ? p.toFixed(2) : p >= 1 ? p.toFixed(4) : p.toFixed(6)
const rp  = (n: number) => `Rp ${Math.abs(n).toLocaleString('id-ID')}`

/* ─────────────────────────────────────────────────────────────────────────────
   Chart Component
───────────────────────────────────────────────────────────────────────────── */
const CandleChart: React.FC<{ candles: Candle[]; live: Candle }> = ({ candles, live }) => {
  const all = [...candles, live]
  const W = 500, H = 130
  const prices = all.flatMap(c => [c.h, c.l])
  const hi = Math.max(...prices), lo = Math.min(...prices)
  const range = hi - lo || 1
  const pad = range * 0.05
  const toY = (v: number) => ((hi + pad - v) / (range + pad * 2)) * (H - 4) + 2
  const cw  = Math.max(2.5, (W / all.length) * 0.52)
  const gap  = W / all.length
  const last = all[all.length - 1]
  const lY   = toY(last.c)
  const lCol = last.c >= last.o ? '#10b981' : '#ef4444'

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {/* Horizontal grid */}
      {[0.2, 0.4, 0.6, 0.8].map(f => (
        <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}
      {/* Candles */}
      {all.map((c, i) => {
        const x   = gap * i + gap / 2
        const bull = c.c >= c.o
        const col  = bull ? '#10b981' : '#ef4444'
        const top  = Math.min(toY(c.o), toY(c.c))
        const bh   = Math.max(1.5, Math.abs(toY(c.o) - toY(c.c)))
        const isLast = i === all.length - 1
        return (
          <g key={i} opacity={i < 3 ? 0.4 + (i / all.length) * 0.6 : 1}>
            <line x1={x} x2={x} y1={toY(c.h)} y2={toY(c.l)} stroke={col} strokeWidth={isLast ? 1.5 : 0.8} />
            <rect x={x - cw / 2} y={top} width={cw} height={bh} fill={col} rx="0.5" />
          </g>
        )
      })}
      {/* Price line */}
      <line x1={0} x2={W} y1={lY} y2={lY} stroke={lCol} strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />
      {/* Price tag */}
      <rect x={W - 56} y={lY - 8} width={56} height={14} fill={lCol} rx="3" opacity="0.9" />
      <text x={W - 28} y={lY + 3} textAnchor="middle" fill="white" fontSize="8" fontWeight="600" fontFamily="monospace">
        {fmt(last.c)}
      </text>
    </svg>
  )
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────────────────────── */
export default function DemoTradingTutorial({ onClose }: DemoTradingTutorialProps) {
  const [step, setStep]                   = useState(0)
  const [assetIdx, setAssetIdx]           = useState(0)
  const [durIdx, setDurIdx]               = useState(2)
  const [amount, setAmount]               = useState(100000)
  const [balance, setBalance]             = useState(10000000)
  const [showMenu, setShowMenu]           = useState(false)
  const [live, setLive]                   = useState<Candle | null>(null)
  const [livePrice, setLivePrice]         = useState(0)
  const [priceDelta, setPriceDelta]       = useState(0)
  const [tradeState, setTradeState]       = useState<null|'pending'|'win'|'lose'>(null)
  const [fading, setFading]               = useState(false)
  const [clock, setClock]                 = useState('')

  const priceRef = useRef(0)
  const cache    = useRef<Candle[]>([])

  const asset  = ASSETS[assetIdx]
  const sd     = STEPS[step]
  const profit = Math.round(amount * asset.profit / 100)
  const pct    = ((step + 1) / STEPS.length) * 100
  const up     = priceDelta >= 0

  // Init candles on asset change
  useEffect(() => {
    cache.current    = genCandles(38, asset.price, asset.seed)
    priceRef.current = asset.price
    setLivePrice(asset.price)
    setPriceDelta(0)
    setLive({ o: asset.price, h: asset.price, l: asset.price, c: asset.price })
  }, [assetIdx, asset.price, asset.seed])

  // Simulate live price tick
  useEffect(() => {
    const id = setInterval(() => {
      const d  = (Math.random() - 0.489) * asset.price * 0.0005
      const np = priceRef.current + d
      priceRef.current = np
      setPriceDelta(d)
      setLivePrice(np)
      setLive(prev => !prev
        ? { o: np, h: np, l: np, c: np }
        : { o: prev.o, h: Math.max(prev.h, np), l: Math.min(prev.l, np), c: np })
    }, 800)
    return () => clearInterval(id)
  }, [assetIdx, asset.price])

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const goTo = useCallback((n: number) => {
    setFading(true)
    setTimeout(() => {
      setStep(Math.max(0, Math.min(STEPS.length - 1, n)))
      setFading(false)
    }, 150)
  }, [])

  const handleTrade = (dir: 'buy' | 'sell') => {
    if (step < 4 || tradeState) return
    setTradeState('pending')
    setTimeout(() => {
      const win = Math.random() > 0.4
      setTradeState(win ? 'win' : 'lose')
      setBalance(b => win ? b + profit : b - amount)
      setTimeout(() => setTradeState(null), 2200)
    }, 1500)
  }

  const ring = (id: string) => sd.hl === id
    ? 'outline outline-2 outline-blue-500 outline-offset-2 rounded-xl'
    : ''

  const isTradeStep = step >= 4

  /* ── Styles ─────────────────────────────────────────────────────────────── */
  const css = `
    .dtt-modal {
      position: fixed; inset: 0; z-index: 50;
      display: flex; align-items: flex-end; justify-content: center;
    }
    @media (min-width: 640px) {
      .dtt-modal { align-items: center; }
    }

    .dtt-card {
      position: relative;
      width: 100%; background: #0a0e17;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 25px 80px rgba(0,0,0,0.7);
      overflow: hidden;
      display: flex; flex-direction: column;
      border-radius: 20px 20px 0 0;
      height: 100dvh; max-height: 100dvh;
    }
    @media (min-width: 640px) {
      .dtt-card {
        border-radius: 20px;
        height: auto; max-height: 92vh;
        max-width: 1080px;
      }
    }

    .dtt-body {
      flex: 1; overflow: hidden;
      display: flex; flex-direction: column;
      min-height: 0;
    }
    @media (min-width: 1024px) {
      .dtt-body { flex-direction: row; }
    }

    /* Left panel — chart */
    .dtt-left {
      display: flex; flex-direction: column;
      background: #090d16;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      min-height: 0;
      /* mobile: takes ~60% of the body height */
      flex: 0 0 60%;
    }
    @media (min-width: 640px) {
      .dtt-left { flex: 0 0 58%; }
    }
    @media (min-width: 1024px) {
      .dtt-left {
        flex: 1 1 0;
        border-bottom: none;
        border-right: 1px solid rgba(255,255,255,0.06);
      }
    }

    /* Right panel — trading controls */
    .dtt-right {
      display: flex; flex-direction: column;
      background: #0c111c;
      border-top: 1px solid rgba(255,255,255,0.06);
      flex: 1 1 0;
      min-height: 0;
      overflow-y: auto;
    }
    @media (min-width: 1024px) {
      .dtt-right {
        width: 292px;
        flex: 0 0 292px;
        border-top: none;
        overflow-y: auto;
      }
    }

    /* Chart canvas */
    .dtt-chart { flex: 1; position: relative; overflow: hidden; min-height: 0; }

    /* Step info */
    .dtt-step-info {
      flex-shrink: 0;
      border-top: 1px solid rgba(255,255,255,0.06);
      padding: 10px 14px 12px;
      transition: opacity 0.15s, transform 0.15s;
    }
    .dtt-step-info.fading { opacity: 0; transform: translateY(4px); }

    /* Scrollbar in right panel */
    .dtt-right::-webkit-scrollbar { width: 3px; }
    .dtt-right::-webkit-scrollbar-track { background: transparent; }
    .dtt-right::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

    /* Pulse dot */
    @keyframes dtt-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.7); }
    }
    .dtt-pulse { animation: dtt-pulse 1.4s ease-in-out infinite; }

    /* Spin */
    @keyframes dtt-spin { to { transform: rotate(360deg); } }
    .dtt-spin { animation: dtt-spin 0.8s linear infinite; }

    /* Result fade-in */
    @keyframes dtt-pop {
      0%   { opacity: 0; transform: scale(0.85) translateY(12px); }
      70%  { opacity: 1; transform: scale(1.04) translateY(-2px); }
      100% { transform: scale(1) translateY(0); }
    }
    .dtt-pop { animation: dtt-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }

    /* Highlight ring pulse */
    @keyframes ring-glow {
      0%, 100% { outline-color: rgba(59,130,246,0.8); }
      50%       { outline-color: rgba(59,130,246,0.3); }
    }
    .dtt-ring { animation: ring-glow 1.6s ease-in-out infinite; }
  `

  return (
    <>
      <style>{css}</style>

      <div className="dtt-modal">
        {/* Backdrop */}
        <div
          onClick={onClose}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.78)',
            backdropFilter: 'blur(6px)',
          }}
        />

        {/* Card */}
        <div className="dtt-card">

          {/* Progress bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.06)', zIndex: 10 }}>
            <div style={{
              height: '100%',
              width: `${pct}%`,
              background: 'linear-gradient(90deg, #3b82f6, #10b981)',
              transition: 'width 0.4s ease',
              borderRadius: '0 2px 2px 0',
            }} />
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 10, right: 10, zIndex: 20,
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          >
            <X size={14} color="rgba(255,255,255,0.6)" />
          </button>

          {/* Body */}
          <div className="dtt-body">

            {/* ══ LEFT — Chart Panel ══════════════════════════════════════ */}
            <div className="dtt-left">

              {/* Toolbar */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
              }}>
                {/* Asset selector */}
                <div className={ring('asset')} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowMenu(v => !v)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 10, padding: '5px 10px',
                      cursor: 'pointer', transition: 'background 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: 'rgba(250,204,21,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 900, color: '#fde68a',
                    }}>
                      {asset.symbol[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1 }}>{asset.symbol}</div>
                      <div style={{ fontSize: 9, fontWeight: 600, color: '#10b981', lineHeight: 1, marginTop: 2 }}>+{asset.profit}%</div>
                    </div>
                    <ChevronDown size={11} color="rgba(255,255,255,0.35)" />
                  </button>

                  {showMenu && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0,
                      width: 180, background: '#0f1520',
                      border: '1px solid rgba(255,255,255,0.10)',
                      borderRadius: 12, overflow: 'hidden',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                      zIndex: 50,
                    }}>
                      {ASSETS.map((a, i) => (
                        <button
                          key={i}
                          onClick={() => { setAssetIdx(i); setShowMenu(false) }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', padding: '9px 12px',
                            borderBottom: i < ASSETS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                            background: i === assetIdx ? 'rgba(59,130,246,0.12)' : 'transparent',
                            cursor: 'pointer', transition: 'background 0.15s', textAlign: 'left',
                          }}
                          onMouseEnter={e => { if (i !== assetIdx) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                          onMouseLeave={e => { if (i !== assetIdx) e.currentTarget.style.background = 'transparent' }}
                        >
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: '#fff' }}>{a.symbol}</div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.40)', marginTop: 1 }}>{a.name}</div>
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#10b981' }}>+{a.profit}%</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div className="dtt-pulse" style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: up ? '#10b981' : '#ef4444',
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                    {fmt(livePrice)}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: up ? '#10b981' : '#ef4444' }}>
                    {up ? '▲' : '▼'} {Math.abs(priceDelta * 100 / (livePrice || 1)).toFixed(3)}%
                  </span>
                </div>

                {/* Timeframes + clock */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['1m', '5m', '15m'].map((tf, i) => (
                      <span key={tf} style={{
                        fontSize: 9, fontWeight: 600,
                        padding: '2px 6px', borderRadius: 5,
                        background: i === 1 ? 'rgba(59,130,246,0.18)' : 'transparent',
                        color: i === 1 ? '#60a5fa' : 'rgba(255,255,255,0.25)',
                        border: i === 1 ? '1px solid rgba(59,130,246,0.30)' : '1px solid transparent',
                      }}>
                        {tf}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                    {clock} WIB
                  </span>
                </div>
              </div>

              {/* Chart */}
              <div className="dtt-chart">
                {/* Grid background */}
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.028) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.028) 1px,transparent 1px)',
                  backgroundSize: '48px 36px',
                }} />
                {/* SVG */}
                <div style={{ position: 'absolute', inset: '4px 4px 20px 4px' }}>
                  {live && <CandleChart candles={cache.current} live={live} />}
                </div>
                {/* Time axis */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 12, right: 12,
                  display: 'flex', justifyContent: 'space-between',
                }}>
                  {['09:00','09:10','09:20','09:30','09:40','09:50'].map(t => (
                    <span key={t} style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)' }}>{t}</span>
                  ))}
                </div>
              </div>

              {/* Step Info */}
              <div className={`dtt-step-info${fading ? ' fading' : ''}`}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                    background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <sd.icon size={13} color="#60a5fa" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{sd.title}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', lineHeight: 1.4, marginTop: 3 }}>{sd.desc}</div>
                  </div>
                </div>

                {/* Tips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px', marginBottom: 10 }}>
                  {sd.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>
                      <div style={{ width: 3, height: 3, borderRadius: '50%', background: '#3b82f6', opacity: 0.7 }} />
                      {tip}
                    </div>
                  ))}
                </div>

                {/* Navigation */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => goTo(step - 1)}
                    disabled={step === 0}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500,
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: step === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)',
                      cursor: step === 0 ? 'not-allowed' : 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >
                    <ArrowLeft size={12} /> Kembali
                  </button>

                  {/* Dots */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {STEPS.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => goTo(i)}
                        style={{
                          borderRadius: 9999,
                          height: 5,
                          width: i === step ? 18 : 5,
                          background: i === step ? 'linear-gradient(to right, #3b82f6, #10b981)' : 'rgba(255,255,255,0.15)',
                          border: 'none', cursor: 'pointer', padding: 0,
                          transition: 'width 0.3s ease, background 0.3s ease',
                        }}
                      />
                    ))}
                  </div>

                  {step === STEPS.length - 1 ? (
                    <button
                      onClick={onClose}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: 'linear-gradient(135deg, #2563eb, #059669)',
                        border: 'none', color: '#fff', cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                      }}
                    >
                      <Play size={11} /> Mulai Trading
                    </button>
                  ) : (
                    <button
                      onClick={() => goTo(step + 1)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 600,
                        background: 'linear-gradient(135deg, #2563eb, #059669)',
                        border: 'none', color: '#fff', cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
                        transition: 'filter 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.12)')}
                      onMouseLeave={e => (e.currentTarget.style.filter = 'brightness(1)')}
                    >
                      Lanjut <ArrowRight size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ══ RIGHT — Trading Panel ════════════════════════════════════ */}
            <div className="dtt-right">

              {/* Balance */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                flexShrink: 0,
              }}>
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                    Saldo Demo
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{rp(balance)}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                    background: 'rgba(59,130,246,0.15)',
                    border: '1px solid rgba(59,130,246,0.30)',
                    color: '#60a5fa',
                  }}>DEMO</span>
                  <span style={{
                    fontSize: 9, fontWeight: 600, padding: '3px 8px', borderRadius: 999,
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.30)',
                  }}>REAL</span>
                </div>
              </div>

              {/* Duration */}
              <div className={ring('duration')} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
                  <Clock size={10} /> Durasi Kontrak
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4 }}>
                  {DURATIONS.map((d, i) => (
                    <button
                      key={d}
                      onClick={() => setDurIdx(i)}
                      style={{
                        padding: '6px 0', borderRadius: 7, fontSize: 10, fontWeight: 700,
                        background: i === durIdx ? '#1d4ed8' : 'rgba(255,255,255,0.04)',
                        border: i === durIdx ? '1px solid rgba(59,130,246,0.40)' : '1px solid rgba(255,255,255,0.07)',
                        color: i === durIdx ? '#fff' : 'rgba(255,255,255,0.40)',
                        cursor: 'pointer', transition: 'all 0.15s',
                        boxShadow: i === durIdx ? '0 2px 8px rgba(29,78,216,0.5)' : 'none',
                      }}
                    >{d}</button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div className={ring('amount')} style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 7 }}>
                  <DollarSign size={10} /> Jumlah Investasi
                </div>
                {/* Input row */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: '#141925', borderRadius: 8, padding: '6px 10px',
                  border: '1px solid rgba(255,255,255,0.08)', marginBottom: 6,
                }}>
                  <button onClick={() => setAmount(a => Math.max(10000, a - 10000))} style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Minus size={12} />
                  </button>
                  <div style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>{rp(amount)}</div>
                  <button onClick={() => setAmount(a => Math.min(1000000, a + 10000))} style={{ width: 22, height: 22, borderRadius: 5, background: 'rgba(255,255,255,0.07)', border: 'none', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Plus size={12} />
                  </button>
                </div>
                {/* Presets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 4 }}>
                  {PRESETS.map(p => (
                    <button
                      key={p}
                      onClick={() => setAmount(p)}
                      style={{
                        padding: '5px 0', borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: amount === p ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)',
                        border: amount === p ? '1px solid rgba(59,130,246,0.40)' : '1px solid rgba(255,255,255,0.07)',
                        color: amount === p ? '#60a5fa' : 'rgba(255,255,255,0.35)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                    >
                      {p >= 1000000 ? `${p/1000000}jt` : `${p/1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Profit estimate */}
              <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'rgba(16,185,129,0.07)',
                  border: '1px solid rgba(16,185,129,0.18)',
                  borderRadius: 10, padding: '9px 12px',
                }}>
                  <div>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Estimasi Profit</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>{rp(profit)}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 3 }}>Profit Rate</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>+{asset.profit}%</div>
                  </div>
                </div>
              </div>

              {/* BUY / SELL */}
              <div className={ring('trade')} style={{ padding: '10px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  <Target size={10} /> Prediksi Arah
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {/* BUY */}
                  <button
                    onClick={() => handleTrade('buy')}
                    disabled={!isTradeStep || !!tradeState}
                    style={{
                      padding: '16px 0', borderRadius: 12, border: 'none',
                      background: 'linear-gradient(145deg, #065f46, #10b981)',
                      cursor: isTradeStep && !tradeState ? 'pointer' : 'not-allowed',
                      opacity: isTradeStep ? 1 : 0.3,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      boxShadow: isTradeStep ? '0 4px 20px rgba(16,185,129,0.25)' : 'none',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (isTradeStep) e.currentTarget.style.filter = 'brightness(1.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
                  >
                    <TrendingUp size={18} color="#fff" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>BUY</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)' }}>Harga Naik ↑</span>
                  </button>

                  {/* SELL */}
                  <button
                    onClick={() => handleTrade('sell')}
                    disabled={!isTradeStep || !!tradeState}
                    style={{
                      padding: '16px 0', borderRadius: 12, border: 'none',
                      background: 'linear-gradient(145deg, #7f1d1d, #ef4444)',
                      cursor: isTradeStep && !tradeState ? 'pointer' : 'not-allowed',
                      opacity: isTradeStep ? 1 : 0.3,
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                      boxShadow: isTradeStep ? '0 4px 20px rgba(239,68,68,0.25)' : 'none',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { if (isTradeStep) e.currentTarget.style.filter = 'brightness(1.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.filter = 'brightness(1)' }}
                  >
                    <TrendingDown size={18} color="#fff" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>SELL</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.65)' }}>Harga Turun ↓</span>
                  </button>
                </div>

                {/* Hints */}
                {step === 4 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(234,179,8,0.08)',
                    border: '1px solid rgba(234,179,8,0.18)',
                    borderRadius: 8, padding: '7px 10px',
                  }}>
                    <AlertCircle size={13} color="#facc15" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: 'rgba(253,224,71,0.75)', lineHeight: 1.4 }}>
                      Analisis chart sebelum memilih arah trading!
                    </span>
                  </div>
                )}
                {step < 4 && (
                  <div style={{
                    textAlign: 'center', fontSize: 10,
                    color: 'rgba(255,255,255,0.18)', lineHeight: 1.4, padding: '4px 0',
                  }}>
                    Selesaikan tutorial terlebih dahulu untuk mengaktifkan trading
                  </div>
                )}
                {step === 5 && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.20)',
                    borderRadius: 8, padding: '8px 10px',
                  }}>
                    <CheckCircle2 size={13} color="#10b981" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: 'rgba(52,211,153,0.80)', lineHeight: 1.4 }}>
                      Tutorial selesai! Kamu siap trading.
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trade Result Overlay ─────────────────────────────────────────────── */}
      {tradeState && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.70)',
          backdropFilter: 'blur(6px)',
        }}>
          <div
            className="dtt-pop"
            style={{
              borderRadius: 20, padding: '32px 28px', textAlign: 'center',
              maxWidth: 280, width: '90%',
              background: tradeState === 'win'
                ? 'linear-gradient(145deg, #064e3b, #065f46)'
                : tradeState === 'lose'
                  ? 'linear-gradient(145deg, #450a0a, #7f1d1d)'
                  : '#0f1520',
              border: tradeState === 'win'
                ? '1px solid rgba(16,185,129,0.40)'
                : tradeState === 'lose'
                  ? '1px solid rgba(239,68,68,0.40)'
                  : '1px solid rgba(255,255,255,0.10)',
              boxShadow: tradeState === 'win'
                ? '0 20px 60px rgba(16,185,129,0.25)'
                : tradeState === 'lose'
                  ? '0 20px 60px rgba(239,68,68,0.25)'
                  : '0 20px 60px rgba(0,0,0,0.50)',
            }}
          >
            {tradeState === 'pending' && (
              <>
                <div className="dtt-spin" style={{
                  width: 44, height: 44, borderRadius: '50%', margin: '0 auto 16px',
                  border: '3px solid rgba(59,130,246,0.25)',
                  borderTopColor: '#3b82f6',
                }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Memproses order...</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.40)', marginTop: 6 }}>Mohon tunggu sebentar</div>
              </>
            )}
            {tradeState === 'win' && (
              <>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Prediksi Tepat!</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#10b981', marginBottom: 4 }}>+{rp(profit)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Profit masuk ke saldo demo</div>
              </>
            )}
            {tradeState === 'lose' && (
              <>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📉</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>Prediksi Kurang Tepat</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#ef4444', marginBottom: 4 }}>-{rp(amount)}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>Coba analisis chart lebih dalam</div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}