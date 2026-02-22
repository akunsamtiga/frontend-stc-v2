'use client'

// app/status/PageClient.tsx
import { useState } from 'react'
import { Check, Lock, ChevronDown, ChevronUp } from 'lucide-react'
import PageNavbar from '@/components/PageNavbar'

// ─── Types & config ───────────────────────────────────────────────────────────

type Tier = 'standard' | 'gold' | 'vip'
const TIERS: Tier[] = ['standard', 'gold', 'vip']

const TIER_META: Record<Tier, {
  label: string
  accent: string
  accentDark: string
  light: string
  border: string
  badgeText: string
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
    label: 'Standard',
    accent: '#6b7280',
    accentDark: '#4b5563',
    light: '#f9fafb',
    border: '#e5e7eb',
    badgeText: 'Entry Level',
    minDeposit: 0,
    maxDeposit: 199999,
    profitBonus: 0,
    withdrawalLimit: 'Rp 5.000.000 / hari',
    withdrawalLimitNum: 5000000,
    withdrawalSpeed: '1–3 hari kerja',
    supportLevel: 'Email Support',
    supportDesc: 'Respon dalam 1×24 jam',
    historyDays: '30 hari',
    signalPremium: false,
    betaAccess: false,
    expressWithdrawal: false,
    dedicatedManager: false,
    weeklyAnalysis: false,
    perks: [
      { label: 'Akses semua aset',        desc: 'Forex, crypto, komoditas, dan indeks tanpa batasan' },
      { label: 'Demo account unlimited',   desc: 'Latihan tanpa risiko dengan saldo demo tak terbatas' },
      { label: 'Profit rate standar',      desc: 'Profit hingga 85% untuk setiap trade yang menang' },
      { label: 'Keamanan akun',            desc: 'Enkripsi SSL & proteksi saldo real-time' },
      { label: 'Riwayat 30 hari',          desc: 'Akses riwayat trading dan transaksi selama 30 hari' },
    ],
  },
  gold: {
    label: 'Gold',
    accent: '#d97706',
    accentDark: '#b45309',
    light: '#fffbeb',
    border: '#fde68a',
    badgeText: 'Populer',
    minDeposit: 200000,
    maxDeposit: 1599999,
    profitBonus: 5,
    withdrawalLimit: 'Rp 20.000.000 / hari',
    withdrawalLimitNum: 20000000,
    withdrawalSpeed: '< 12 jam',
    supportLevel: 'Live Chat Priority',
    supportDesc: 'Respon dalam 2 jam, prioritas antrian',
    historyDays: '90 hari',
    signalPremium: false,
    betaAccess: false,
    expressWithdrawal: false,
    dedicatedManager: false,
    weeklyAnalysis: true,
    perks: [
      { label: '+5% bonus profit',         desc: 'Tambahan 5% di atas profit rate standar setiap trade' },
      { label: 'Prioritas penarikan',      desc: 'Penarikan diproses lebih cepat dari antrian standard' },
      { label: 'Live chat priority',       desc: 'Akses live chat dengan prioritas respons lebih cepat' },
      { label: 'Riwayat 90 hari',          desc: 'Akses riwayat trading dan transaksi selama 90 hari' },
      { label: 'Analisis market mingguan', desc: 'Laporan analisis pasar dikirim setiap minggu' },
    ],
  },
  vip: {
    label: 'VIP',
    accent: '#7c3aed',
    accentDark: '#5b21b6',
    light: '#faf5ff',
    border: '#ddd6fe',
    badgeText: 'Eksklusif',
    minDeposit: 1600000,
    maxDeposit: null,
    profitBonus: 10,
    withdrawalLimit: 'Tidak terbatas',
    withdrawalLimitNum: null,
    withdrawalSpeed: '< 1 jam (ekspres)',
    supportLevel: 'Dedicated Manager',
    supportDesc: 'Account manager pribadi siap kapan saja',
    historyDays: 'Tidak terbatas',
    signalPremium: true,
    betaAccess: true,
    expressWithdrawal: true,
    dedicatedManager: true,
    weeklyAnalysis: true,
    perks: [
      { label: '+10% bonus profit',          desc: 'Tambahan 10% di atas profit rate standar setiap trade' },
      { label: 'Penarikan ekspres < 1 jam',  desc: 'Dana tiba di rekening dalam hitungan menit' },
      { label: 'Dedicated account manager',  desc: 'Satu manajer akun khusus siap membantu 7/24' },
      { label: 'Sinyal trading premium',     desc: 'Sinyal eksklusif dari analis berpengalaman setiap hari' },
      { label: 'Akses fitur beta',           desc: 'Coba fitur terbaru sebelum dirilis ke publik' },
      { label: 'Riwayat tak terbatas',       desc: 'Seluruh riwayat trading tersimpan permanen' },
    ],
  },
}

const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

// ─── Hero ─────────────────────────────────────────────────────────────────────

function PageHero() {
  return (
    <div className="py-10 sm:py-12 lg:py-16 text-center">
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 mb-5">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest">Program Eksklusif</span>
      </div>
      <h2
        className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4"
        style={{ letterSpacing: '-0.04em', lineHeight: 1.1 }}
      >
        Semakin tinggi tier,<br className="hidden sm:block" /> semakin besar keuntungan
      </h2>
      <p className="text-sm sm:text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
        Tingkatkan status akun kamu secara otomatis berdasarkan total akumulasi deposit.
        Nikmati bonus profit lebih tinggi, penarikan lebih cepat, dan layanan eksklusif di setiap tier.
      </p>
    </div>
  )
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatsStrip() {
  const stats = [
    { label: 'Bonus profit maks',    value: '+10%',      color: '#7c3aed' },
    { label: 'Kecepatan penarikan',  value: '< 1 jam',   color: '#d97706' },
    { label: 'Limit penarikan',      value: 'Unlimited', color: '#059669' },
    { label: 'Support tersedia',     value: '7 × 24',    color: '#2563eb' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-12">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-2xl p-4 sm:p-5 text-center" style={{ border: '1px solid #f0f0f0' }}>
          <p className="text-lg sm:text-xl font-bold mb-1" style={{ color: s.color, letterSpacing: '-0.02em' }}>{s.value}</p>
          <p className="text-[11px] text-gray-400">{s.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Tier card ────────────────────────────────────────────────────────────────

function TierCard({ tier }: { tier: Tier }) {
  const meta = TIER_META[tier]

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col h-full" style={{ border: `1px solid ${meta.border}` }}>
      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${meta.accent}, ${meta.accentDark})` }} />

      <div className="p-5 sm:p-6 flex flex-col flex-1" style={{ background: meta.light }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-900" style={{ letterSpacing: '-0.02em' }}>{meta.label}</h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${meta.accent}20`, color: meta.accent }}>
              {meta.badgeText}
            </span>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black" style={{ color: meta.accent, letterSpacing: '-0.04em' }}>
              {meta.profitBonus > 0 ? `+${meta.profitBonus}%` : '—'}
            </p>
            <p className="text-[10px] text-gray-400">bonus profit</p>
          </div>
        </div>

        {/* Deposit range */}
        <div className="rounded-xl px-4 py-3 mb-4 bg-white" style={{ border: `1px solid ${meta.border}` }}>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Rentang Deposit</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400">Minimum</p>
              <p className="text-sm font-bold text-gray-800">{meta.minDeposit === 0 ? 'Gratis' : formatIDR(meta.minDeposit)}</p>
            </div>
            <div className="w-px h-8 bg-gray-100" />
            <div className="text-right">
              <p className="text-[11px] text-gray-400">Maksimum</p>
              <p className="text-sm font-bold text-gray-800">{meta.maxDeposit === null ? 'Tak terbatas' : formatIDR(meta.maxDeposit)}</p>
            </div>
          </div>
        </div>

        {/* Key stats grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {[
            { label: 'Limit Tarik/Hari', value: meta.withdrawalLimit },
            { label: 'Kecepatan Tarik',  value: meta.withdrawalSpeed },
            { label: 'Support',           value: meta.supportLevel },
            { label: 'Riwayat Data',     value: meta.historyDays },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl p-3 bg-white" style={{ border: '1px solid #f0f0f0' }}>
              <p className="text-[10px] text-gray-400 font-medium mb-0.5">{label}</p>
              <p className="text-[12px] font-bold text-gray-700 leading-snug">{value}</p>
            </div>
          ))}
        </div>

        {/* Support note */}
        <div className="rounded-xl px-3.5 py-2.5 mb-5 text-[11px] leading-relaxed"
          style={{ background: `${meta.accent}08`, border: `1px solid ${meta.accent}20`, color: meta.accentDark }}>
          {meta.supportDesc}
        </div>

        {/* Perks list */}
        <div className="space-y-2.5 flex-1 mb-5">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Benefit Lengkap</p>
          {meta.perks.map((perk, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5" style={{ background: meta.accent }} />
              <div>
                <p className="text-xs font-semibold text-gray-700">{perk.label}</p>
                <p className="text-[11px] text-gray-400 leading-snug">{perk.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature flags */}
        <div className="pt-4" style={{ borderTop: '1px solid #f0f0f0' }}>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Fitur Eksklusif</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Sinyal Premium',    on: meta.signalPremium },
              { label: 'Fitur Beta',         on: meta.betaAccess },
              { label: 'Penarikan Ekspres', on: meta.expressWithdrawal },
              { label: 'Account Manager',   on: meta.dedicatedManager },
              { label: 'Analisis Mingguan', on: meta.weeklyAnalysis },
            ].map(f => (
              <div key={f.label} className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: f.on ? `${meta.accent}18` : '#f3f4f6' }}>
                  {f.on
                    ? <Check size={8} style={{ color: meta.accent }} />
                    : <Lock size={7} className="text-gray-300" />
                  }
                </div>
                <span className="text-[11px]" style={{ color: f.on ? '#374151' : '#d1d5db' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Comparison table ─────────────────────────────────────────────────────────

function ComparisonTable() {
  const sections: Array<{
    heading: string
    rows: Array<{ label: string; sublabel?: string; values: Record<Tier, string | boolean> }>
  }> = [
    {
      heading: 'Profit & Trading',
      rows: [
        { label: 'Bonus Profit',       sublabel: 'per trade',   values: { standard: 'Standar (0%)', gold: '+5%', vip: '+10%' } },
        { label: 'Profit Rate Maks',   sublabel: 'estimasi',    values: { standard: '~85%', gold: '~90%', vip: '~95%' } },
        { label: 'Demo Account',                                 values: { standard: 'Unlimited', gold: 'Unlimited', vip: 'Unlimited' } },
      ],
    },
    {
      heading: 'Penarikan',
      rows: [
        { label: 'Limit Harian',   sublabel: 'maks/hari',  values: { standard: 'Rp 5 jt', gold: 'Rp 20 jt', vip: 'Unlimited' } },
        { label: 'Kecepatan',      sublabel: 'estimasi',   values: { standard: '1–3 hr kerja', gold: '< 12 jam', vip: '< 1 jam' } },
        { label: 'Ekspres',                                values: { standard: false, gold: false, vip: true } },
      ],
    },
    {
      heading: 'Support & Layanan',
      rows: [
        { label: 'Tipe Support',    values: { standard: 'Email', gold: 'Live Chat', vip: 'Dedicated' } },
        { label: 'Waktu Respons',   values: { standard: '< 24 jam', gold: '< 2 jam', vip: 'Siap saat dibutuhkan' } },
        { label: 'Account Manager', values: { standard: false, gold: false, vip: true } },
      ],
    },
    {
      heading: 'Data & Fitur',
      rows: [
        { label: 'Riwayat Trading',   values: { standard: '30 hari', gold: '90 hari', vip: 'Tak terbatas' } },
        { label: 'Sinyal Premium',    values: { standard: false, gold: false, vip: true } },
        { label: 'Analisis Mingguan', values: { standard: false, gold: true, vip: true } },
        { label: 'Akses Beta',        values: { standard: false, gold: false, vip: true } },
      ],
    },
  ]

  return (
    <div className="rounded-2xl overflow-hidden w-full" style={{ border: '1px solid #f0f0f0' }}>
      <div className="grid grid-cols-4 bg-gray-50 sticky top-[57px] z-10" style={{ borderBottom: '1px solid #ebebeb' }}>
        <div className="p-3 sm:p-4" />
        {TIERS.map(tier => {
          const meta = TIER_META[tier]
          return (
            <div key={tier} className="p-3 sm:p-4 text-center">
              <p className="text-xs sm:text-sm font-bold" style={{ color: meta.accent }}>{meta.label}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{meta.badgeText}</p>
            </div>
          )
        })}
      </div>

      {sections.map((section, si) => (
        <div key={si}>
          <div className="px-3 sm:px-4 py-2.5 bg-gray-50/70"
            style={{ borderTop: si > 0 ? '1px solid #ebebeb' : 'none', borderBottom: '1px solid #f5f5f5' }}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{section.heading}</p>
          </div>
          {section.rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-4" style={{ borderTop: '1px solid #f8f8f8' }}>
              <div className="p-3 sm:p-4">
                <p className="text-[11px] sm:text-xs text-gray-600 font-medium leading-tight">{row.label}</p>
                {row.sublabel && <p className="text-[10px] text-gray-400">{row.sublabel}</p>}
              </div>
              {TIERS.map(tier => {
                const val  = row.values[tier]
                const meta = TIER_META[tier]
                return (
                  <div key={tier} className="p-3 sm:p-4 flex items-center justify-center text-center"
                    style={{ background: meta.light }}>
                    {typeof val === 'boolean' ? (
                      val
                        ? <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: `${meta.accent}15` }}>
                            <Check size={11} style={{ color: meta.accent }} />
                          </div>
                        : <div className="w-5 h-5 rounded-full flex items-center justify-center bg-gray-100">
                            <Lock size={9} className="text-gray-300" />
                          </div>
                    ) : (
                      <span className="text-[10px] sm:text-[11px] font-semibold leading-tight" style={{ color: meta.accent }}>
                        {val}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Deposit roadmap ──────────────────────────────────────────────────────────

function DepositRoadmap() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
      {TIERS.map((tier, i) => {
        const meta   = TIER_META[tier]
        const isLast = i === TIERS.length - 1

        return (
          <div key={tier} style={{ borderTop: i > 0 ? '1px solid #f5f5f5' : 'none' }}>
            <div className="p-4 sm:p-5" style={{ background: meta.light }}>
              <div className="flex gap-3 sm:gap-4">
                <div className="flex flex-col items-center pt-1">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black"
                    style={{ background: `${meta.accent}15`, border: `1.5px solid ${meta.accent}30`, color: meta.accent }}
                  >
                    {i + 1}
                  </div>
                  {!isLast && (
                    <div className="w-px mt-2 flex-1" style={{ background: `${meta.accent}20`, minHeight: 24 }} />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="text-sm font-bold" style={{ color: meta.accent }}>{meta.label}</p>
                      <p className="text-xs text-gray-500">{meta.badgeText}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-gray-400">Min. deposit</p>
                      <p className="text-sm font-bold text-gray-700">
                        {meta.minDeposit === 0 ? 'Gratis' : formatIDR(meta.minDeposit)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {[
                      { label: 'Bonus Profit', value: meta.profitBonus > 0 ? `+${meta.profitBonus}%` : 'Standar' },
                      { label: 'Limit Tarik',  value: meta.withdrawalLimit },
                      { label: 'Kec. Tarik',   value: meta.withdrawalSpeed },
                      { label: 'Support',       value: meta.supportLevel },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-white rounded-lg px-2.5 py-2" style={{ border: '1px solid #f0f0f0' }}>
                        <p className="text-[10px] text-gray-400">{label}</p>
                        <p className="text-[12px] font-semibold text-gray-700">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── How it works ─────────────────────────────────────────────────────────────

function HowItWorks() {
  const steps = [
    { n: '01', title: 'Daftar & verifikasi akun', desc: 'Buat akun, lengkapi profil, dan verifikasi identitas kamu.' },
    { n: '02', title: 'Lakukan deposit',           desc: 'Deposit ke akun real. Total akumulasi deposit menentukan tier kamu.' },
    { n: '03', title: 'Status naik otomatis',      desc: 'Sistem memperbarui status secara otomatis tanpa perlu request manual.' },
    { n: '04', title: 'Nikmati benefit tier',      desc: 'Bonus profit, penarikan lebih cepat, dan layanan eksklusif langsung aktif.' },
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {steps.map((step, i) => (
        <div key={i} className="bg-white rounded-2xl p-5" style={{ border: '1px solid #f0f0f0' }}>
          <p className="text-2xl font-black text-gray-100 mb-3" style={{ letterSpacing: '-0.04em' }}>{step.n}</p>
          <p className="text-sm font-bold text-gray-800 mb-1.5">{step.title}</p>
          <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Bonus example ────────────────────────────────────────────────────────────

function BonusExample() {
  const tradeAmount = 100000
  const baseRate    = 0.85
  const examples = TIERS.map(tier => {
    const meta   = TIER_META[tier]
    const rate   = baseRate + meta.profitBonus / 100
    const profit = tradeAmount * rate
    const total  = tradeAmount + profit
    return { tier, meta, rate, profit, total }
  })

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
      <div className="px-5 py-4 bg-gray-50" style={{ borderBottom: '1px solid #f0f0f0' }}>
        <p className="text-xs font-bold text-gray-700">Simulasi Trade WIN</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Modal: {formatIDR(tradeAmount)} · Profit rate standar 85%</p>
      </div>
      <div className="divide-y divide-gray-50">
        {examples.map(({ tier, meta, rate, profit, total }) => (
          <div key={tier} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs font-bold text-gray-800">{meta.label}</p>
              <p className="text-[11px] text-gray-400">Rate {(rate * 100).toFixed(0)}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">+{formatIDR(profit)}</p>
              <p className="text-[11px] text-gray-400">Total {formatIDR(total)}</p>
            </div>
          </div>
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
    { q: 'Berapa lama proses penarikan VIP?', a: 'Penarikan VIP diproses dalam waktu kurang dari 1 jam setelah pengajuan disetujui. Dana akan langsung masuk ke rekening bank yang sudah terverifikasi.' },
    { q: 'Apa itu sinyal trading premium?', a: 'Sinyal trading premium adalah rekomendasi arah (buy/sell) yang disiapkan oleh tim analis berpengalaman. Sinyal dikirim setiap hari dan hanya tersedia untuk member VIP.' },
    { q: 'Apakah ada biaya tambahan untuk tier Gold atau VIP?', a: 'Tidak ada biaya berlangganan atau biaya tambahan. Kamu hanya perlu memenuhi syarat minimum deposit akumulatif untuk mendapatkan status tersebut secara otomatis.' },
  ]

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl overflow-hidden" style={{ border: '1px solid #f0f0f0' }}>
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-4 sm:px-5 py-4 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm font-semibold text-gray-800 pr-4">{item.q}</span>
            {open === i
              ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" />
              : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />
            }
          </button>
          {open === i && (
            <div className="px-4 sm:px-5 pb-4" style={{ borderTop: '1px solid #f5f5f5' }}>
              <p className="text-xs text-gray-500 leading-relaxed pt-3">{item.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4 sm:mb-5">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  )
}

// ─── Client page export ───────────────────────────────────────────────────────

export default function StatusPageClient() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PageNavbar title="Status & Tier" subtitle="Informasi lengkap program tier" />
      <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 pb-20">

        <PageHero />
        <StatsStrip />

        <section className="mb-10 sm:mb-12">
          <SectionLabel title="Semua Tier" subtitle="Pilih tier yang sesuai dengan kebutuhan trading kamu" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 items-start">
            {TIERS.map(tier => <TierCard key={tier} tier={tier} />)}
          </div>
        </section>

        <section className="mb-10 sm:mb-12">
          <SectionLabel title="Cara Kerja" subtitle="Status naik otomatis — tidak perlu request manual" />
          <HowItWorks />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8 mb-10 sm:mb-12">
          <div className="lg:col-span-2">
            <SectionLabel title="Simulasi Keuntungan" subtitle="Beda tier, beda profit yang kamu dapat" />
            <BonusExample />
          </div>
          <div className="lg:col-span-3">
            <SectionLabel title="Perbandingan Lengkap" />
            <ComparisonTable />
          </div>
        </div>

        <section className="mb-10 sm:mb-12">
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