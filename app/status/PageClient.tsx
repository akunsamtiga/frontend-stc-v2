// app/status/PageClient.tsx
'use client'

import { useState, useRef } from 'react'
import { Check, Lock, ChevronDown, Shield, Zap, Crown } from 'lucide-react'
import PageNavbar from '@/components/PageNavbar'
import {
  motion,
  useInView,
  type Variants,
} from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tier = 'standard' | 'gold' | 'vip'
const TIERS: Tier[] = ['standard', 'gold', 'vip']

// ─── Tier Color Palettes ──────────────────────────────────────────────────────
// Standard : coklat / chocolate
// Gold     : emas / amber-gold
// VIP      : perak / silver-graphite

const TIER_META: Record<Tier, {
  label: string
  accent: string        // primary color
  accentMid: string     // mid tone
  accentDark: string    // dark tone
  accentGlow: string    // rgba glow for shadows
  cardBg: string        // card background
  cardBorder: string    // card border
  headerBg: string      // header gradient
  headerText: string    // text on header
  chipBg: string        // badge chip bg
  chipText: string      // badge chip text
  statBg: string        // stat box bg
  statBorder: string
  badgeText: string
  icon: React.ElementType
  minDeposit: number
  maxDeposit: number | null
  profitBonus: number
  withdrawalLimit: string
  withdrawalLimitNum: number | null
  withdrawalSpeed: string
  supportLevel: string
  supportDesc: string
  historyDays: string
  signalPremium: boolean
  betaAccess: boolean
  expressWithdrawal: boolean
  dedicatedManager: boolean
  weeklyAnalysis: boolean
  perks: { label: string; desc: string }[]
}> = {
  standard: {
    label: 'Standard', badgeText: 'Entry Level', icon: Shield,
    // Coklat / warm chocolate
    accent: '#8B5E3C',
    accentMid: '#A0714F',
    accentDark: '#6B4226',
    accentGlow: 'rgba(139,94,60,0.22)',
    cardBg: '#FDFAF7',
    cardBorder: '#E8D5C4',
    headerBg: 'linear-gradient(135deg, #6B4226 0%, #A0714F 60%, #C49A6C 100%)',
    headerText: '#FDF5EE',
    chipBg: 'rgba(139,94,60,0.12)',
    chipText: '#6B4226',
    statBg: '#FFF8F2',
    statBorder: '#EDD9C5',
    minDeposit: 0, maxDeposit: 199999, profitBonus: 0,
    withdrawalLimit: 'Rp 1.000.000 / hari', withdrawalLimitNum: 1000000,
    withdrawalSpeed: '< 1 hari kerja', supportLevel: 'Email Support',
    supportDesc: 'Respon dalam 1×24 jam', historyDays: '30 hari',
    signalPremium: false, betaAccess: false, expressWithdrawal: false,
    dedicatedManager: false, weeklyAnalysis: false,
    perks: [
      { label: 'Akses semua aset', desc: 'Forex, crypto, komoditas, dan indeks tanpa batasan' },
      { label: 'Demo account unlimited', desc: 'Latihan tanpa risiko dengan saldo demo tak terbatas' },
      { label: 'Profit rate standar', desc: 'Profit hingga 85% untuk setiap trade yang menang' },
      { label: 'Keamanan akun', desc: 'Enkripsi SSL & proteksi saldo real-time' },
      { label: 'Riwayat 30 hari', desc: 'Akses riwayat trading dan transaksi selama 30 hari' },
    ],
  },

  gold: {
    label: 'Gold', badgeText: 'Populer', icon: Zap,
    // Emas / rich amber-gold
    accent: '#B8860B',
    accentMid: '#D4A017',
    accentDark: '#8B6508',
    accentGlow: 'rgba(184,134,11,0.28)',
    cardBg: '#FFFDF0',
    cardBorder: '#F0D060',
    headerBg: 'linear-gradient(135deg, #7A5500 0%, #C8960C 40%, #F0C030 75%, #E8B820 100%)',
    headerText: '#FFF8E0',
    chipBg: 'rgba(184,134,11,0.14)',
    chipText: '#7A5500',
    statBg: '#FFFAE8',
    statBorder: '#F0D878',
    minDeposit: 200000, maxDeposit: 1599999, profitBonus: 5,
    withdrawalLimit: 'Rp 2.000.000 / hari', withdrawalLimitNum: 2000000,
    withdrawalSpeed: '< 1 hari kerja', supportLevel: 'Live Chat Priority',
    supportDesc: 'Respon dalam 2 jam, prioritas antrian', historyDays: '90 hari',
    signalPremium: false, betaAccess: false, expressWithdrawal: false,
    dedicatedManager: false, weeklyAnalysis: true,
    perks: [
      { label: '+5% bonus profit', desc: 'Tambahan 5% di atas profit rate standar setiap trade' },
      { label: 'Prioritas penarikan', desc: 'Penarikan diproses lebih cepat dari antrian standard' },
      { label: 'Live chat priority', desc: 'Akses live chat dengan prioritas respons lebih cepat' },
      { label: 'Riwayat 90 hari', desc: 'Akses riwayat trading dan transaksi selama 90 hari' },
      { label: 'Analisis market mingguan', desc: 'Laporan analisis pasar dikirim setiap minggu' },
    ],
  },

  vip: {
    label: 'VIP', badgeText: 'Eksklusif', icon: Crown,
    // Perak / silver-graphite premium
    accent: '#6B7280',
    accentMid: '#9CA3AF',
    accentDark: '#374151',
    accentGlow: 'rgba(107,114,128,0.30)',
    cardBg: '#1C2128',
    cardBorder: '#4B5563',
    headerBg: 'linear-gradient(135deg, #111827 0%, #374151 40%, #6B7280 75%, #9CA3AF 100%)',
    headerText: '#F9FAFB',
    chipBg: 'rgba(156,163,175,0.18)',
    chipText: '#D1D5DB',
    statBg: '#252D38',
    statBorder: '#374151',
    minDeposit: 1600000, maxDeposit: null, profitBonus: 10,
    withdrawalLimit: 'Tidak terbatas', withdrawalLimitNum: null,
    withdrawalSpeed: '< 3 jam (ekspres)', supportLevel: 'Dedicated Manager',
    supportDesc: 'Account manager pribadi siap kapan saja', historyDays: 'Tidak terbatas',
    signalPremium: true, betaAccess: true, expressWithdrawal: true,
    dedicatedManager: true, weeklyAnalysis: true,
    perks: [
      { label: '+10% bonus profit', desc: 'Tambahan 10% di atas profit rate standar setiap trade' },
      { label: 'Penarikan ekspres < 3 jam', desc: 'Dana tiba di rekening dalam hitungan jam' },
      { label: 'Dedicated account manager', desc: 'Satu manajer akun khusus siap membantu 7/24' },
      { label: 'Sinyal trading premium', desc: 'Sinyal eksklusif dari analis berpengalaman setiap hari' },
      { label: 'Akses fitur beta', desc: 'Coba fitur terbaru sebelum dirilis ke publik' },
      { label: 'Riwayat tak terbatas', desc: 'Seluruh riwayat trading tersimpan permanen' },
    ],
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

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
const stagger = (delay = 0.08): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: delay, delayChildren: 0.04 } },
})

function Reveal({ children, variants = fadeUp, delay = 0, className = '' }: {
  children: React.ReactNode; variants?: Variants; delay?: number; className?: string
}) {
  return (
    <motion.div className={className} variants={variants}
      initial="hidden" whileInView="visible"
      viewport={{ once: true, margin: '-80px' }} transition={{ delay }}>
      {children}
    </motion.div>
  )
}

function AnimatedHeadline({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.h2 className={className} style={style}
      variants={stagger(0.07)} initial="hidden" whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}>
      {text.split(' ').map((word, i) => (
        <motion.span key={i} variants={{
          hidden: { opacity: 0, y: 30, filter: 'blur(4px)' },
          visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { ...SPRING } },
        }} className="inline-block mr-[0.25em]">{word}</motion.span>
      ))}
    </motion.h2>
  )
}

function CountUp({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [val, setVal] = useState(0)
  const triggered = useRef(false)
  if (inView && !triggered.current) {
    triggered.current = true
    let start: number
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / 900, 1)
      const eased = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(to * eased))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
  return <span ref={ref}>{prefix}{val}{suffix}</span>
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function PageHero() {
  return (
    <div style={{ padding: '40px 0 32px', textAlign: 'center' }}>
      <Reveal variants={scaleIn}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '99px',
          background: '#F3F4F6 !important', marginBottom: '20px',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#6B7280 !important', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Program Eksklusif
          </span>
        </div>
      </Reveal>
      <AnimatedHeadline
        text="Semakin tinggi tier, semakin besar keuntungan"
        className="text-3xl sm:text-4xl lg:text-5xl font-bold"
        style={{ color: '#111827', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '16px' }}
      />
      <Reveal delay={0.3}>
        <p style={{ fontSize: '15px', color: '#6B7280', maxWidth: '560px', margin: '0 auto', lineHeight: 1.7 }}>
          Tingkatkan status akun kamu secara otomatis berdasarkan total akumulasi deposit.
          Nikmati bonus profit lebih tinggi, penarikan lebih cepat, dan layanan eksklusif.
        </p>
      </Reveal>
    </div>
  )
}

// ─── Stats Strip ──────────────────────────────────────────────────────────────

function StatsStrip() {
  const stats = [
    { label: 'Bonus profit maks', value: '+10%', color: '#B8860B', num: 10, suffix: '%', prefix: '+' },
    { label: 'Kecepatan VIP', value: '< 3 jam', color: '#8B5E3C', num: 3, suffix: ' jam', prefix: '< ' },
    { label: 'Limit penarikan', value: 'Unlimited', color: '#374151', num: null },
    { label: 'Support tersedia', value: '7 × 24', color: '#6B7280', num: 7, suffix: ' × 24' },
  ]
  return (
    <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '40px' }}
      className="grid-cols-2 sm:grid-cols-4"
      variants={stagger(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
      {stats.map((s) => (
        <motion.div key={s.label} variants={fadeUp}
          style={{
            background: '#FFFFFF !important', borderRadius: '16px', padding: '18px 16px',
            textAlign: 'center', border: '1px solid #F0F0F0 !important',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
          whileHover={{ y: -3, boxShadow: `0 12px 32px ${s.color}22`, transition: { duration: 0.2 } }}>
          <p style={{ fontSize: '20px', fontWeight: 800, color: `${s.color} !important`, letterSpacing: '-0.03em', marginBottom: '4px' }}>
            {s.num != null ? <CountUp to={s.num} prefix={s.prefix} suffix={s.suffix} /> : s.value}
          </p>
          <p style={{ fontSize: '11px', color: '#9CA3AF !important', fontWeight: 500 }}>{s.label}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── Tier Card (REDESIGNED) ───────────────────────────────────────────────────

function TierCard({ tier, index }: { tier: Tier; index: number }) {
  const meta = TIER_META[tier]
  const isVip = tier === 'vip'
  const Icon = meta.icon

  return (
    <motion.div
      variants={fadeUp}
      style={{
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: `${meta.cardBg} !important`,
        border: `1.5px solid ${meta.cardBorder} !important`,
        boxShadow: `0 4px 24px ${meta.accentGlow}`,
        position: 'relative',
      }}
      whileHover={{
        y: -6,
        boxShadow: `0 24px 56px ${meta.accentGlow}`,
        transition: { duration: 0.25 },
      }}>

      {/* ── Shimmer overlay (VIP only) */}
      {isVip && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
          background: 'linear-gradient(135deg, rgba(156,163,175,0.04) 0%, transparent 50%, rgba(156,163,175,0.04) 100%)',
        }} />
      )}

      {/* ── Header block ─────────────────────────────── */}
      <div style={{
        background: `${meta.headerBg} !important`,
        padding: '24px 24px 20px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* subtle noise texture feel */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23ffffff\' fill-opacity=\'0.04\'/%3E%3C/svg%3E")',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
          <div>
            {/* Icon + tier name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <motion.div
                style={{
                  width: '32px', height: '32px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.18) !important',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.25) !important',
                }}
                initial={{ scale: 0, rotate: -20 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true }}
                transition={{ ...SPRING, delay: index * 0.15 + 0.1 }}>
                <Icon size={16} color={meta.headerText} />
              </motion.div>
              <h3 style={{
                fontSize: '18px', fontWeight: 800, color: `${meta.headerText} !important`,
                letterSpacing: '-0.03em', margin: 0,
              }}>{meta.label}</h3>
            </div>
            {/* Badge */}
            <span style={{
              display: 'inline-block',
              fontSize: '10px', fontWeight: 700,
              padding: '3px 10px', borderRadius: '99px',
              background: 'rgba(255,255,255,0.22) !important',
              color: `${meta.headerText} !important`,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.25) !important',
            }}>
              {meta.badgeText}
            </span>
          </div>

          {/* Profit bonus big number */}
          <motion.div style={{ textAlign: 'right' }}
            initial={{ opacity: 0, scale: 0.4 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ ...SPRING, delay: index * 0.15 + 0.25 }}>
            <p style={{
              fontSize: '36px', fontWeight: 900, lineHeight: 1,
              color: `${meta.headerText} !important`,
              letterSpacing: '-0.05em',
              textShadow: '0 2px 12px rgba(0,0,0,0.20)',
            }}>
              {meta.profitBonus > 0 ? `+${meta.profitBonus}%` : '—'}
            </p>
            <p style={{ fontSize: '10px', color: `${meta.headerText} !important`, opacity: 0.75, marginTop: '2px', fontWeight: 500 }}>
              bonus profit
            </p>
          </motion.div>
        </div>

        {/* Deposit range inside header */}
        <div style={{
          marginTop: '16px',
          background: 'rgba(0,0,0,0.18) !important',
          borderRadius: '12px',
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.10) !important',
        }}>
          <div>
            <p style={{ fontSize: '10px', color: `${meta.headerText} !important`, opacity: 0.65, marginBottom: '2px', fontWeight: 500 }}>Min. Deposit</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: `${meta.headerText} !important`, margin: 0 }}>
              {meta.minDeposit === 0 ? 'Gratis' : formatIDR(meta.minDeposit)}
            </p>
          </div>
          <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.2) !important' }} />
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '10px', color: `${meta.headerText} !important`, opacity: 0.65, marginBottom: '2px', fontWeight: 500 }}>Maks. Deposit</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: `${meta.headerText} !important`, margin: 0 }}>
              {meta.maxDeposit === null ? 'Tak terbatas' : formatIDR(meta.maxDeposit)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────── */}
      <div style={{ padding: '20px 24px 24px', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>

        {/* Stat grid */}
        <motion.div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}
          variants={stagger(0.06)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          {[
            { label: 'Limit Tarik/Hari', value: meta.withdrawalLimit },
            { label: 'Kecepatan Tarik', value: meta.withdrawalSpeed },
            { label: 'Support', value: meta.supportLevel },
            { label: 'Riwayat Data', value: meta.historyDays },
          ].map(({ label, value }) => (
            <motion.div key={label} variants={scaleIn} style={{
              background: `${meta.statBg} !important`,
              border: `1px solid ${meta.statBorder} !important`,
              borderRadius: '12px', padding: '10px 12px',
            }}>
              <p style={{ fontSize: '10px', fontWeight: 600, marginBottom: '3px', letterSpacing: '0.02em',
                color: isVip ? '#9CA3AF !important' : '#9CA3AF !important' }}>
                {label}
              </p>
              <p style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.3, margin: 0,
                color: isVip ? '#F3F4F6 !important' : `${meta.accentDark} !important` }}>
                {value}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Support desc pill */}
        <div style={{
          borderRadius: '10px', padding: '9px 12px', marginBottom: '18px',
          background: `${meta.chipBg} !important`,
          border: `1px solid ${isVip ? 'rgba(107,114,128,0.30)' : meta.cardBorder} !important`,
          fontSize: '11px', lineHeight: 1.5,
          color: isVip ? '#D1D5DB !important' : `${meta.accentDark} !important`,
          fontWeight: 500,
        }}>
          {meta.supportDesc}
        </div>

        {/* Perks list */}
        <motion.div style={{ flex: 1, marginBottom: '20px' }}
          variants={stagger(0.07)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: '12px',
            color: isVip ? '#6B7280 !important' : '#9CA3AF !important',
          }}>Benefit Lengkap</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {meta.perks.map((perk, i) => (
              <motion.div key={i} variants={fadeLeft} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <motion.div
                  style={{
                    width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0, marginTop: '1px',
                    background: `${meta.chipBg} !important`,
                    border: `1px solid ${isVip ? 'rgba(107,114,128,0.3)' : meta.cardBorder} !important`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                  initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                  transition={{ ...SPRING, delay: i * 0.06 }}>
                  <Check size={10} color={meta.accent} />
                </motion.div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, marginBottom: '1px',
                    color: isVip ? '#F3F4F6 !important' : '#1F2937 !important' }}>
                    {perk.label}
                  </p>
                  <p style={{ fontSize: '11px', lineHeight: 1.5, margin: 0,
                    color: isVip ? '#9CA3AF !important' : '#6B7280 !important' }}>
                    {perk.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Exclusive features */}
        <div style={{ borderTop: `1px solid ${isVip ? '#374151' : '#F0F0F0'} !important`, paddingTop: '16px' }}>
          <p style={{
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: '10px',
            color: isVip ? '#6B7280 !important' : '#9CA3AF !important',
          }}>Fitur Eksklusif</p>
          <motion.div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}
            variants={stagger(0.05)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {[
              { label: 'Sinyal Premium', on: meta.signalPremium },
              { label: 'Fitur Beta', on: meta.betaAccess },
              { label: 'Penarikan Ekspres', on: meta.expressWithdrawal },
              { label: 'Account Manager', on: meta.dedicatedManager },
              { label: 'Analisis Mingguan', on: meta.weeklyAnalysis },
            ].map(f => (
              <motion.div key={f.label} variants={fadeUp}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 0' }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '6px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: f.on
                    ? `${meta.chipBg} !important`
                    : (isVip ? 'rgba(255,255,255,0.04) !important' : '#F9FAFB !important'),
                  border: f.on
                    ? `1px solid ${isVip ? 'rgba(107,114,128,0.4)' : meta.cardBorder} !important`
                    : '1px solid transparent !important',
                }}>
                  {f.on
                    ? <Check size={10} color={meta.accent} />
                    : <Lock size={9} color={isVip ? '#4B5563' : '#D1D5DB'} />}
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: f.on ? 600 : 400,
                  color: f.on
                    ? (isVip ? '#E5E7EB !important' : `${meta.accentDark} !important`)
                    : (isVip ? '#4B5563 !important' : '#D1D5DB !important'),
                }}>{f.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Comparison Table ─────────────────────────────────────────────────────────

function ComparisonTable() {
  const sections = [
    {
      heading: 'Profit & Trading',
      rows: [
        { label: 'Bonus Profit', sublabel: 'per trade', values: { standard: 'Standar (0%)', gold: '+5%', vip: '+10%' } },
        { label: 'Profit Rate Maks', sublabel: 'estimasi', values: { standard: '~85%', gold: '~90%', vip: '~95%' } },
        { label: 'Demo Account', values: { standard: 'Unlimited', gold: 'Unlimited', vip: 'Unlimited' } },
      ],
    },
    {
      heading: 'Penarikan',
      rows: [
        { label: 'Limit Harian', sublabel: 'maks/hari', values: { standard: 'Rp 1 jt', gold: 'Rp 2 jt', vip: 'Unlimited' } },
        { label: 'Kecepatan', sublabel: 'estimasi', values: { standard: '< 1 hr kerja', gold: '< 1 hr kerja', vip: '< 3 jam' } },
        { label: 'Min. Penarikan', values: { standard: 'Rp 100.000', gold: 'Rp 100.000', vip: 'Rp 100.000' } },
        { label: 'Ekspres', values: { standard: false, gold: false, vip: true } },
      ],
    },
    {
      heading: 'Support & Layanan',
      rows: [
        { label: 'Tipe Support', values: { standard: 'Email', gold: 'Live Chat', vip: 'Dedicated' } },
        { label: 'Waktu Respons', values: { standard: '< 24 jam', gold: '< 2 jam', vip: 'Siap saat dibutuhkan' } },
        { label: 'Account Manager', values: { standard: false, gold: false, vip: true } },
      ],
    },
    {
      heading: 'Data & Fitur',
      rows: [
        { label: 'Riwayat Trading', values: { standard: '30 hari', gold: '90 hari', vip: 'Tak terbatas' } },
        { label: 'Sinyal Premium', values: { standard: false, gold: false, vip: true } },
        { label: 'Analisis Mingguan', values: { standard: false, gold: true, vip: true } },
        { label: 'Akses Beta', values: { standard: false, gold: false, vip: true } },
      ],
    },
  ]

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #F0F0F0 !important', background: '#FFFFFF !important' }}>
      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', background: '#F9FAFB !important', borderBottom: '1px solid #EBEBEB !important', position: 'sticky', top: '57px', zIndex: 10 }}>
        <div style={{ padding: '12px 16px' }} />
        {TIERS.map(tier => {
          const meta = TIER_META[tier]
          return (
            <div key={tier} style={{ padding: '12px 8px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', fontWeight: 800, color: `${meta.accent} !important`, margin: 0, letterSpacing: '-0.01em' }}>{meta.label}</p>
              <p style={{ fontSize: '10px', color: '#9CA3AF !important', marginTop: '2px' }}>{meta.badgeText}</p>
            </div>
          )
        })}
      </div>

      {sections.map((section, si) => (
        <motion.div key={si}
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }} transition={{ ...SPRING, delay: si * 0.08 }}>
          <div style={{
            padding: '10px 16px', background: '#F9FAFB !important',
            borderTop: si > 0 ? '1px solid #EBEBEB !important' : 'none',
            borderBottom: '1px solid #F5F5F5 !important',
          }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#9CA3AF !important', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{section.heading}</p>
          </div>
          {section.rows.map((row, ri) => (
            <motion.div key={ri} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderTop: '1px solid #F8F8F8 !important' }}
              initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.3, delay: ri * 0.05 }}>
              <div style={{ padding: '12px 16px' }}>
                <p style={{ fontSize: '11px', color: '#374151 !important', fontWeight: 600, margin: 0, lineHeight: 1.3 }}>{row.label}</p>
                {'sublabel' in row && row.sublabel && <p style={{ fontSize: '10px', color: '#9CA3AF !important', margin: '2px 0 0' }}>{row.sublabel}</p>}
              </div>
              {TIERS.map(tier => {
                const val = row.values[tier as Tier]
                const meta = TIER_META[tier]
                return (
                  <div key={tier} style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    {typeof val === 'boolean' ? (
                      val
                        ? <motion.div style={{
                            width: '22px', height: '22px', borderRadius: '7px',
                            background: `${meta.chipBg} !important`,
                            border: `1px solid ${meta.cardBorder} !important`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                            initial={{ scale: 0 }} whileInView={{ scale: 1 }}
                            viewport={{ once: true }} transition={{ ...SPRING }}>
                            <Check size={12} color={meta.accent} />
                          </motion.div>
                        : <div style={{ width: '22px', height: '22px', borderRadius: '7px', background: '#F9FAFB !important', border: '1px solid #F0F0F0 !important', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Lock size={10} color="#D1D5DB" />
                          </div>
                    ) : (
                      <span style={{ fontSize: '11px', fontWeight: 700, color: `${meta.accent} !important`, lineHeight: 1.3 }}>
                        {val as string}
                      </span>
                    )}
                  </div>
                )
              })}
            </motion.div>
          ))}
        </motion.div>
      ))}
    </div>
  )
}

// ─── Deposit Roadmap ──────────────────────────────────────────────────────────

function DepositRoadmap() {
  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #F0F0F0 !important' }}>
      {TIERS.map((tier, i) => {
        const meta = TIER_META[tier]
        const isLast = i === TIERS.length - 1
        const isVip = tier === 'vip'

        return (
          <motion.div key={tier}
            style={{ borderTop: i > 0 ? '1px solid #F5F5F5 !important' : 'none' }}
            initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }} transition={{ ...SPRING, delay: i * 0.12 }}>
            <div style={{
              padding: '20px',
              background: isVip ? '#1C2128 !important' : `${meta.cardBg} !important`,
            }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '4px' }}>
                  <motion.div style={{
                    width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 800,
                    background: `${meta.headerBg} !important`,
                    color: `${meta.headerText} !important`,
                    boxShadow: `0 4px 12px ${meta.accentGlow}`,
                  }}
                    initial={{ scale: 0, rotate: -90 }} whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }} transition={{ ...SPRING, delay: i * 0.12 + 0.1 }}>
                    {i + 1}
                  </motion.div>
                  {!isLast && (
                    <motion.div style={{ width: '2px', marginTop: '8px', flex: 1, background: `${meta.cardBorder} !important`, minHeight: '24px', borderRadius: '99px' }}
                      initial={{ scaleY: 0, originY: 0 }} whileInView={{ scaleY: 1 }}
                      viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.12 + 0.3, ease: 'easeOut' }} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: `${meta.accent} !important`, margin: '0 0 2px' }}>{meta.label}</p>
                      <p style={{ fontSize: '11px', color: isVip ? '#6B7280 !important' : '#9CA3AF !important', margin: 0 }}>{meta.badgeText}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '10px', color: isVip ? '#6B7280 !important' : '#9CA3AF !important', margin: '0 0 2px' }}>Min. deposit</p>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: isVip ? '#F3F4F6 !important' : '#111827 !important', margin: 0 }}>
                        {meta.minDeposit === 0 ? 'Gratis' : formatIDR(meta.minDeposit)}
                      </p>
                    </div>
                  </div>

                  <motion.div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}
                    variants={stagger(0.06)} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                    {[
                      { label: 'Bonus Profit', value: meta.profitBonus > 0 ? `+${meta.profitBonus}%` : 'Standar' },
                      { label: 'Limit Tarik', value: meta.withdrawalLimit },
                      { label: 'Kec. Tarik', value: meta.withdrawalSpeed },
                      { label: 'Support', value: meta.supportLevel },
                    ].map(({ label, value }) => (
                      <motion.div key={label} variants={scaleIn} style={{
                        background: `${meta.statBg} !important`,
                        border: `1px solid ${meta.statBorder} !important`,
                        borderRadius: '10px', padding: '8px 12px',
                      }}>
                        <p style={{ fontSize: '10px', color: isVip ? '#6B7280 !important' : '#9CA3AF !important', margin: '0 0 2px', fontWeight: 500 }}>{label}</p>
                        <p style={{ fontSize: '12px', fontWeight: 700, margin: 0, color: isVip ? '#F3F4F6 !important' : `${meta.accentDark} !important` }}>{value}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Daftar & verifikasi akun', desc: 'Buat akun, lengkapi profil, dan verifikasi identitas kamu.' },
    { n: '02', title: 'Lakukan deposit', desc: 'Deposit ke akun real. Total akumulasi deposit menentukan tier kamu.' },
    { n: '03', title: 'Status naik otomatis', desc: 'Sistem memperbarui status secara otomatis tanpa perlu request manual.' },
    { n: '04', title: 'Nikmati benefit tier', desc: 'Bonus profit, penarikan lebih cepat, dan layanan eksklusif langsung aktif.' },
  ]
  return (
    <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px' }}
      className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      variants={stagger(0.1)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}>
      {steps.map((step, i) => (
        <motion.div key={i} variants={{ hidden: { opacity: 0, y: 32 }, visible: { opacity: 1, y: 0, transition: { ...SPRING, delay: i * 0.1 } } }}
          style={{ background: '#FFFFFF !important', borderRadius: '16px', padding: '20px', border: '1px solid #F0F0F0 !important' }}
          whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.08)', transition: { duration: 0.2 } }}>
          <p style={{ fontSize: '28px', fontWeight: 900, color: '#F3F4F6 !important', letterSpacing: '-0.04em', marginBottom: '12px' }}>{step.n}</p>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#111827 !important', marginBottom: '6px' }}>{step.title}</p>
          <p style={{ fontSize: '12px', color: '#6B7280 !important', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── Bonus Example ────────────────────────────────────────────────────────────

function BonusExample() {
  const tradeAmount = 100000
  const baseRate = 0.85
  const examples = TIERS.map(tier => {
    const meta = TIER_META[tier]
    const rate = baseRate + meta.profitBonus / 100
    const profit = tradeAmount * rate
    const total = tradeAmount + profit
    return { tier, meta, rate, profit, total }
  })

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #F0F0F0 !important', background: '#FFFFFF !important' }}>
      <div style={{ padding: '16px 20px', background: '#F9FAFB !important', borderBottom: '1px solid #F0F0F0 !important' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#374151 !important', margin: '0 0 2px' }}>Simulasi Trade WIN</p>
        <p style={{ fontSize: '11px', color: '#9CA3AF !important', margin: 0 }}>Modal: {formatIDR(tradeAmount)} · Profit rate standar 85%</p>
      </div>
      <div>
        {examples.map(({ tier, meta, rate, profit, total }, i) => (
          <motion.div key={tier}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: i > 0 ? '1px solid #F5F5F5 !important' : 'none' }}
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ ...SPRING, delay: i * 0.1 }}
            whileHover={{ backgroundColor: `${meta.accentGlow}`, transition: { duration: 0.15 } }}>
            <div>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#111827 !important', margin: '0 0 2px' }}>{meta.label}</p>
              <p style={{ fontSize: '11px', color: `${meta.accent} !important`, margin: 0, fontWeight: 600 }}>Rate {(rate * 100).toFixed(0)}%</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: `${meta.accent} !important`, margin: '0 0 2px', letterSpacing: '-0.02em' }}>+{formatIDR(profit)}</p>
              <p style={{ fontSize: '11px', color: '#9CA3AF !important', margin: 0 }}>Total {formatIDR(total)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const items = [
    { q: 'Bagaimana cara naik tier?', a: 'Status naik otomatis berdasarkan total akumulasi deposit kamu — bukan deposit saldo saat ini. Setiap deposit yang kamu lakukan dihitung kumulatif. Tidak perlu request manual ke admin.' },
    { q: 'Apakah bonus profit berlaku untuk semua aset?', a: 'Ya. Bonus profit berlaku untuk semua aset trading yang tersedia di platform, termasuk forex, crypto, komoditas, dan indeks saham.' },
    { q: 'Apakah status bisa turun?', a: 'Status tidak turun meski saldo berkurang. Status hanya dihitung dari total historis deposit kamu. Jika kamu sudah Gold, kamu akan tetap Gold.' },
    { q: 'Berapa lama proses penarikan VIP?', a: 'Penarikan VIP diproses dalam waktu kurang dari 3 jam setelah pengajuan disetujui. Dana akan langsung masuk ke rekening bank yang sudah terverifikasi.' },
    { q: 'Apa itu sinyal trading premium?', a: 'Sinyal trading premium adalah rekomendasi arah (buy/sell) yang disiapkan oleh tim analis berpengalaman. Sinyal dikirim setiap hari dan hanya tersedia untuk member VIP.' },
    { q: 'Apakah ada biaya tambahan untuk tier Gold atau VIP?', a: 'Tidak ada biaya berlangganan atau biaya tambahan. Kamu hanya perlu memenuhi syarat minimum deposit akumulatif untuk mendapatkan status tersebut secara otomatis.' },
  ]

  return (
    <motion.div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
      variants={stagger(0.07)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-40px' }}>
      {items.map((item, i) => (
        <motion.div key={i} variants={fadeUp}
          style={{ background: '#FFFFFF !important', borderRadius: '14px', overflow: 'hidden', border: '1px solid #F0F0F0 !important' }}>
          <button onClick={() => setOpen(open === i ? null : i)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', textAlign: 'left', background: 'transparent !important',
              border: 'none !important', cursor: 'pointer',
            }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827 !important', paddingRight: '16px', lineHeight: 1.4 }}>{item.q}</span>
            <motion.span animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.25, ease: 'easeOut' }} style={{ flexShrink: 0 }}>
              <ChevronDown size={15} color="#9CA3AF" />
            </motion.span>
          </button>
          <motion.div initial={false}
            animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
            style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 20px 16px', borderTop: '1px solid #F5F5F5 !important' }}>
              <p style={{ fontSize: '12px', color: '#6B7280 !important', lineHeight: 1.7, margin: '12px 0 0' }}>{item.a}</p>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  )
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <Reveal variants={fadeLeft} className="mb-4 sm:mb-5">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <motion.div style={{ height: '1px', width: '32px', background: '#E5E7EB !important' }}
          initial={{ scaleX: 0, originX: 0 }} whileInView={{ scaleX: 1 }}
          viewport={{ once: true }} transition={{ duration: 0.4, ease: 'easeOut' }} />
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF !important', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>{title}</p>
      </div>
      {subtitle && <p style={{ fontSize: '12px', color: '#9CA3AF !important', marginTop: '2px', marginLeft: '4px' }}>{subtitle}</p>}
    </Reveal>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function StatusPageClient() {
  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB !important' }}>
      <PageNavbar title="Status & Tier" subtitle="Informasi lengkap program tier" />
      <main style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '0 24px 80px' }}>

        <PageHero />
        <StatsStrip />

        <section style={{ marginBottom: '48px' }}>
          <SectionLabel title="Semua Tier" subtitle="Pilih tier yang sesuai dengan kebutuhan trading kamu" />
          <motion.div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '20px', alignItems: 'start' }}
            className="grid-cols-1 sm:grid-cols-3"
            variants={stagger(0.15)} initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}>
            {TIERS.map((tier, i) => <TierCard key={tier} tier={tier} index={i} />)}
          </motion.div>
        </section>

        <section style={{ marginBottom: '48px' }}>
          <SectionLabel title="Cara Kerja" subtitle="Status naik otomatis — tidak perlu request manual" />
          <HowItWorks />
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '32px', marginBottom: '48px' }}
          className="grid-cols-1 lg:grid-cols-5">
          <div>
            <SectionLabel title="Simulasi Keuntungan" subtitle="Beda tier, beda profit yang kamu dapat" />
            <BonusExample />
          </div>
          <div>
            <SectionLabel title="Perbandingan Lengkap" />
            <ComparisonTable />
          </div>
        </div>

        <section style={{ marginBottom: '48px' }}>
          <SectionLabel title="Syarat & Detail Tier" subtitle="Informasi lengkap setiap level status" />
          <DepositRoadmap />
        </section>

        <section>
          <SectionLabel title="Pertanyaan Umum" subtitle="Hal-hal yang sering ditanyakan tentang program tier" />
          <FAQ />
        </section>

      </main>
    </div>
  )
}