// app/admin/asset-schedule/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { assetScheduleApi, assetsApi } from '@/lib/api-wrapper'
import Navbar from '@/components/Navbar'
import { 
  Calendar, Clock, Warning, CheckCircle, XCircle, Prohibit, Plus, 
  ArrowsClockwise, PencilSimple, Trash, Play, X, DownloadSimple,
  Copy, Info, CaretLeft, CaretRight, TrashSimple
} from 'phosphor-react'
import { toast } from 'sonner'
import { TimezoneUtil } from '@/lib/utils'
import type { 
  AssetSchedule, 
  CreateAssetScheduleRequest,
  UpdateAssetScheduleRequest,
  GetAssetSchedulesQuery,
  AssetScheduleStatistics,
  Asset,
  AssetScheduleTrend,
  AssetScheduleTimeframe
} from '@/types'
import {
  formatScheduledTime,
  getTimeUntilExecution,
  getStatusBadgeInfo,
  getTrendBadgeInfo,
  getTimeframeLabel,
  validateScheduleData,
  downloadSchedulesCSV
} from '@/lib/asset-schedule'
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
        radial-gradient(ellipse 80% 60% at 10% 20%, rgba(99,102,241,0.16) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 85% 10%, rgba(6,182,212,0.12) 0%, transparent 55%),
        radial-gradient(ellipse 70% 60% at 70% 80%, rgba(139,92,246,0.08) 0%, transparent 55%),
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
      border: 1px solid rgba(255,255,255,0.10);
      color: white;
    }
    .glass-input:focus { outline: none; border-color: rgba(99,102,241,0.5); }
    .glass-modal {
      background: rgba(6,9,24,0.92);
      backdrop-filter: blur(28px) saturate(180%);
      border: 1px solid rgba(255,255,255,0.10);
    }
    select.glass-input option, select option { background: #0f1229; }
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

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const [val, setVal] = React.useState(0)
  const triggered = React.useRef(false)
  React.useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting || triggered.current) return
      triggered.current = true
      const start = performance.now()
      const tick = (now: number) => {
        const p = Math.min((now - start) / 900, 1)
        const ease = 1 - Math.pow(1 - p, 3)
        setVal(Math.round(ease * to))
        if (p < 1) requestAnimationFrame(tick)
        else setVal(to)
      }
      requestAnimationFrame(tick)
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [to])
  return <span ref={ref}>{val.toLocaleString('id-ID')}{suffix}</span>
}

// ============================================
// BULK SCHEDULE PARSER (Inline)
// ============================================

interface ParsedBulkSchedule {
  hour: number
  minute: number
  trend: AssetScheduleTrend
  isValid: boolean
  error?: string
  raw: string
}

function parseBulkScheduleLine(
  input: string,
  defaultTrend: AssetScheduleTrend = 'buy'
): ParsedBulkSchedule {
  const raw = input.trim()
  
  if (!raw) {
    return {
      hour: 0,
      minute: 0,
      trend: defaultTrend,
      isValid: false,
      error: 'Input kosong',
      raw
    }
  }

  const patterns = [
    {
      regex: /^(\d{1,2})[:.](\d{2})\s+([bs]|sell|buy|jual|beli)$/i,
      timeGroup: [1, 2] as [number, number],
      trendGroup: 3
    },
    {
      regex: /^(\d{1,2})[:.](\d{2})$/,
      timeGroup: [1, 2] as [number, number],
      trendGroup: null
    },
    {
      regex: /^(\d{1,2})\s+([bs]|sell|buy|jual|beli)$/i,
      timeGroup: [1, null] as [number, null],
      trendGroup: 2,
      defaultMinute: 0
    }
  ]

  for (const pattern of patterns) {
    const match = raw.match(pattern.regex)
    if (match) {
      const hourStr = match[pattern.timeGroup[0]!]
      const minuteStr = pattern.timeGroup[1] ? match[pattern.timeGroup[1]] : String((pattern as any).defaultMinute || 0)
      
      const hour = parseInt(hourStr, 10)
      const minute = parseInt(minuteStr, 10)

      if (hour < 0 || hour > 23) {
        return { hour, minute, trend: defaultTrend, isValid: false, error: `Jam tidak valid: ${hour}`, raw }
      }

      if (minute < 0 || minute > 59) {
        return { hour, minute, trend: defaultTrend, isValid: false, error: `Menit tidak valid: ${minute}`, raw }
      }

      let trend: AssetScheduleTrend = defaultTrend
      if (pattern.trendGroup !== null) {
        const trendStr = match[pattern.trendGroup].toLowerCase()
        trend = parseTrend(trendStr)
      }

      return { hour, minute, trend, isValid: true, raw }
    }
  }

  return {
    hour: 0, minute: 0, trend: defaultTrend,
    isValid: false,
    error: 'Format tidak valid. Contoh: "12:12 s", "12.12 sell", "12:12"',
    raw
  }
}

function parseTrend(trendStr: string): AssetScheduleTrend {
  const sellKeywords = ['s', 'sell', 'jual', 'turun', 'down', 'short']
  const buyKeywords = ['b', 'buy', 'beli', 'naik', 'up', 'long']
  
  const normalized = trendStr.toLowerCase().trim()
  
  if (sellKeywords.some(k => normalized.includes(k))) return 'sell'
  if (buyKeywords.some(k => normalized.includes(k))) return 'buy'
  
  return 'buy'
}

function parseBulkScheduleInput(
  input: string,
  defaultTrend: AssetScheduleTrend = 'buy'
): { valid: ParsedBulkSchedule[]; invalid: ParsedBulkSchedule[]; total: number } {
  const lines = input.split('\n').map(line => line.trim()).filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'))

  const valid: ParsedBulkSchedule[] = []
  const invalid: ParsedBulkSchedule[] = []

  for (const line of lines) {
    const parsed = parseBulkScheduleLine(line, defaultTrend)
    if (parsed.isValid) valid.push(parsed)
    else invalid.push(parsed)
  }

  return { valid, invalid, total: lines.length }
}

function convertToScheduleRequests(
  parsed: ParsedBulkSchedule[],
  assetSymbol: string,
  baseDate: Date,
  timeframe: AssetScheduleTimeframe = '1m',
  notes: string = ''
): Array<{
  assetSymbol: string
  scheduledTime: string
  trend: AssetScheduleTrend
  timeframe: AssetScheduleTimeframe
  notes: string
  isActive: boolean
}> {
  return parsed.map(p => {
    const scheduledDate = new Date(baseDate)
    scheduledDate.setHours(p.hour, p.minute, 0, 0)
    
    const now = new Date()
    if (scheduledDate < now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1)
    }

    return {
      assetSymbol,
      scheduledTime: scheduledDate.toISOString(),
      trend: p.trend,
      timeframe,
      notes,
      isActive: true
    }
  })
}

function formatParsedPreview(parsed: ParsedBulkSchedule[]): string {
  if (parsed.length === 0) return 'Tidak ada data valid'
  return parsed.map(p => {
    const timeStr = `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`
    const trendStr = p.trend === 'buy' ? '📈 BUY' : '📉 SELL'
    return `${timeStr} ${trendStr}`
  }).join('\n')
}

// ============================================
// BULK MODAL COMPONENT (Inline)
// ============================================

function BulkScheduleModal({
  isOpen,
  onClose,
  assets,
  onSubmit,
  submitting = false
}: {
  isOpen: boolean
  onClose: () => void
  assets: Asset[]
  onSubmit: (schedules: Array<{
    assetSymbol: string
    scheduledTime: string
    trend: AssetScheduleTrend
    timeframe: AssetScheduleTimeframe
    notes: string
    isActive: boolean
  }>) => Promise<void>
  submitting?: boolean
}) {
  const [selectedAsset, setSelectedAsset] = useState<string>('')
  const [bulkInput, setBulkInput] = useState<string>('')
  const [defaultTrend, setDefaultTrend] = useState<AssetScheduleTrend>('buy')
  const [timeframe, setTimeframe] = useState<AssetScheduleTimeframe>('1m')
  const [notes, setNotes] = useState<string>('')
  const [showPreview, setShowPreview] = useState(false)
  const [showExamples, setShowExamples] = useState(false)

  const parsedResult = useMemo(() => {
    if (!bulkInput.trim()) return null
    return parseBulkScheduleInput(bulkInput, defaultTrend)
  }, [bulkInput, defaultTrend])

  const handleSubmit = async () => {
    if (!selectedAsset) { toast.error('Pilih aset terlebih dahulu'); return }
    if (!parsedResult || parsedResult.valid.length === 0) { toast.error('Tidak ada jadwal valid'); return }
    if (parsedResult.invalid.length > 0) {
      if (!confirm(`Ada ${parsedResult.invalid.length} baris invalid. Lanjutkan dengan ${parsedResult.valid.length} yang valid?`)) return
    }

    const schedules = convertToScheduleRequests(parsedResult.valid, selectedAsset, new Date(), timeframe, notes)
    await onSubmit(schedules)
  }

  const insertExample = () => {
    const examples = `07:28 s
07:32 b
07:36 s
07:40 b
07:44 s`
    
    setBulkInput(examples)
    setShowExamples(false)
    toast.success('Contoh dimasukkan')
  }

  const clearInput = () => {
    setBulkInput('')
    setShowPreview(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!submitting ? onClose : undefined} />
      <div className="relative glass-modal rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 glass-modal border-b border-white/10 p-6 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-indigo-400" weight="bold" />
                Bulk Create Schedule
              </h2>
              <p className="text-sm text-slate-400 mt-1">Buat multiple jadwal sekaligus</p>
            </div>
            <button onClick={onClose} disabled={submitting} className="p-2 glass-sub hover:border-white/20 text-slate-400 rounded-lg disabled:opacity-50 transition-all">
              <X className="w-5 h-5" weight="bold" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Pilih Aset <span className="text-red-400">*</span>
            </label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:bg-white/10 transition-all text-white"
            >
              <option value="" className="bg-slate-900 text-slate-500">-- Pilih Aset --</option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.symbol} className="bg-slate-900">
                  {asset.symbol} - {asset.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Timeframe</label>
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as AssetScheduleTimeframe)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 text-white text-sm"
            >
              <option value="1m" className="bg-slate-900">1 Menit</option>
              <option value="5m" className="bg-slate-900">5 Menit</option>
              <option value="15m" className="bg-slate-900">15 Menit</option>
              <option value="30m" className="bg-slate-900">30 Menit</option>
              <option value="1h" className="bg-slate-900">1 Jam</option>
              <option value="4h" className="bg-slate-900">4 Jam</option>
              <option value="1d" className="bg-slate-900">1 Hari</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Default trend: Buy (jika tidak disebutkan di input)
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Bulk Input <span className="text-red-400">*</span></label>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowExamples(!showExamples)} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                  <Info className="w-4 h-4" /> Contoh
                </button>
                <button onClick={insertExample} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                  <Copy className="w-4 h-4" /> Insert
                </button>
              </div>
            </div>

            {showExamples && (
              <div className="mb-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                <p className="text-xs text-indigo-300 font-medium mb-2">Format yang didukung:</p>
                <ul className="text-xs text-slate-300 space-y-1 font-mono">
                  <li>• 07:28 s → 07:28 Sell 📉</li>
                  <li>• 07:32 b → 07:32 Buy 📈</li>
                  <li>• 07:36 sell → 07:36 Sell 📉</li>
                  <li>• 07:40 buy → 07:40 Buy 📈</li>
                  <li>• 07:44 S → 07:44 Sell 📉</li>
                  <li>• 07:48 B → 07:48 Buy 📈</li>
                  <li>• 07:52 → 07:52 Buy 📈 (default)</li>
                </ul>
                <p className="text-xs text-slate-400 mt-2">
                  <strong>s/sell/jual/turun</strong> = Sell | <strong>b/buy/beli/naik</strong> = Buy
                </p>
              </div>
            )}

            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={`Masukkan jadwal, satu per baris:
07:28 s
07:32 b
07:36 s
07:40 b
07:44 s`}
              rows={10}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:bg-white/10 text-white placeholder-slate-500 font-mono text-sm resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500">{bulkInput.split('\n').filter(l => l.trim()).length} baris</p>
              <button onClick={clearInput} className="text-xs text-red-400 hover:text-red-300">Clear</button>
            </div>
          </div>

          {parsedResult && parsedResult.valid.length > 0 && (
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <button 
                onClick={() => setShowPreview(!showPreview)} 
                className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {parsedResult.invalid.length === 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-400" weight="fill" />
                  ) : (
                    <Warning className="w-5 h-5 text-yellow-400" weight="fill" />
                  )}
                  <span className="text-sm font-medium text-white">
                    Preview: {parsedResult.valid.length} jadwal valid
                    {parsedResult.invalid.length > 0 && `, ${parsedResult.invalid.length} invalid`}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{showPreview ? 'Sembunyikan' : 'Tampilkan'}</span>
              </button>

              {showPreview && (
                <div className="p-4 bg-slate-950/50">
                  <div className="mb-4">
                    <p className="text-xs font-medium text-green-400 mb-2">
                      ✅ Jadwal yang akan dibuat ({parsedResult.valid.length}):
                    </p>
                    <div className="bg-black/30 rounded overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-white/5 text-slate-400">
                          <tr>
                            <th className="px-3 py-2 text-left">No</th>
                            <th className="px-3 py-2 text-left">Waktu</th>
                            <th className="px-3 py-2 text-left">Trend</th>
                            <th className="px-3 py-2 text-left">Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {parsedResult.valid.map((item, idx) => {
                            const isFromInput = item.raw.toLowerCase().match(/[bs]|sell|buy|jual|beli/)
                            const trendIcon = item.trend === 'buy' ? '📈' : '📉'
                            const trendColor = item.trend === 'buy' ? 'text-green-400' : 'text-red-400'
                            const trendLabel = item.trend === 'buy' ? 'BUY' : 'SELL'
                            
                            return (
                              <tr key={idx} className="hover:bg-white/5">
                                <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                                <td className="px-3 py-2 text-white font-mono">
                                  {String(item.hour).padStart(2, '0')}:{String(item.minute).padStart(2, '0')}
                                </td>
                                <td className={`px-3 py-2 font-bold ${trendColor}`}>
                                  {trendIcon} {trendLabel}
                                </td>
                                <td className="px-3 py-2 text-slate-500 text-xs">
                                  {isFromInput ? 'Dari input' : 'Default (buy)'}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-green-400 font-bold">📈 BUY:</span>
                      <span className="text-white">{parsedResult.valid.filter(v => v.trend === 'buy').length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-red-400 font-bold">📉 SELL:</span>
                      <span className="text-white">{parsedResult.valid.filter(v => v.trend === 'sell').length}</span>
                    </div>
                  </div>

                  {parsedResult.invalid.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-xs font-medium text-red-400 mb-2">❌ Invalid ({parsedResult.invalid.length}):</p>
                      <ul className="text-xs text-slate-400 space-y-1">
                        {parsedResult.invalid.map((item, idx) => (
                          <li key={idx} className="font-mono">"{item.raw}" → {item.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Catatan (opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan untuk semua jadwal..."
              rows={2}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 text-white text-sm resize-none"
            />
          </div>
        </div>

        <div className="sticky bottom-0 bg-slate-900 border-t border-white/10 p-6 flex gap-3">
          <button onClick={onClose} disabled={submitting} className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-lg disabled:opacity-50">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !selectedAsset || !parsedResult || parsedResult.valid.length === 0}
            className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Membuat...</>
            ) : (
              <><Plus className="w-4 h-4" weight="bold" /> Buat {parsedResult?.valid.length || 0} Jadwal</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function isoToDatetimeLocal(isoString: string): string {
  if (!isoString) return ''
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function datetimeLocalToISO(datetimeLocal: string): string {
  if (!datetimeLocal) return ''
  const date = new Date(datetimeLocal)
  return date.toISOString()
}

const StatCardSkeleton = () => (
  <div className="bg-white/5 rounded-lg p-4 border border-white/10 animate-pulse backdrop-blur-sm">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-8 h-8 bg-white/10 rounded"></div>
      <div className="h-4 bg-white/10 rounded w-20"></div>
    </div>
    <div className="h-6 bg-white/10 rounded w-24"></div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[length:24px_24px] bg-center pointer-events-none"></div>
    <Navbar />
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="mb-6 animate-pulse">
        <div className="h-7 bg-white/10 rounded w-48 mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-64"></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
    </div>
  </div>
)

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function AssetSchedulePage() {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  
  const [schedules, setSchedules] = useState<AssetSchedule[]>([])
  const [statistics, setStatistics] = useState<AssetScheduleStatistics | null>(null)
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  
  // Pagination state - client-side only, no limit
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  
  const [filters, setFilters] = useState<GetAssetSchedulesQuery>({})
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  
  // Form states
  const [formData, setFormData] = useState<CreateAssetScheduleRequest>({
    assetSymbol: '',
    scheduledTime: '',
    trend: 'buy',
    timeframe: '1m',
    notes: '',
    isActive: true
  })
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setSchedules(prev => [...prev]), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!user) { router.push('/'); return }
    if (user.role !== 'super_admin' && user.role !== 'admin') { router.push('/trading'); return }
    
    loadData()
    loadAssets()
  }, [user, router])

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true)
      
      const [schedulesRes, statsRes] = await Promise.all([
        assetScheduleApi.getSchedules({}).catch((err: any) => {
          console.error('Schedules API error:', err)
          return { data: { data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } } }
        }),
        assetScheduleApi.getStatistics().catch((err: any) => {
          console.error('Stats API error:', err)
          return null
        })
      ])

      if (schedulesRes?.data) {
        setSchedules(schedulesRes.data.data || [])
      }

      // ✅ FIX: Response chain berlapis dua:
      // 1. NestJS global interceptor membungkus return service → { success, data: <hasil_service> }
      // 2. Axios interceptor unwrap response.data → statsRes = { success, data: { success, data: { total, ... } } }
      //
      // Sehingga stats yang sebenarnya ada di statsRes.data.data
      // (sama seperti schedules yang sudah benar pakai schedulesRes.data.data)
      const statsData = (statsRes as any)?.data?.data
      if (statsData && typeof statsData.total === 'number') {
        setStatistics(statsData as AssetScheduleStatistics)
      } else if ((statsRes as any)?.data && typeof (statsRes as any).data.total === 'number') {
        // Fallback: kalau hanya single-wrap
        setStatistics((statsRes as any).data as AssetScheduleStatistics)
      } else if (statsRes && typeof (statsRes as any).total === 'number') {
        // Fallback: kalau tidak ter-wrap sama sekali
        setStatistics(statsRes as unknown as AssetScheduleStatistics)
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error('Gagal memuat data:', error)
      toast.error('Gagal memuat jadwal')
    } finally {
      setLoading(false)
      if (showRefreshing) setRefreshing(false)
    }
  }

  const loadAssets = async () => {
    try {
      const response = await assetsApi.getAll()
      if (!response || !response.data) { setAssets([]); return }

      let assetsData: Asset[] = []
      if (Array.isArray(response.data)) assetsData = response.data
      else if (response.data.assets && Array.isArray(response.data.assets)) assetsData = response.data.assets
      else if ((response.data as any).data && Array.isArray((response.data as any).data)) assetsData = (response.data as any).data

      setAssets(assetsData)
    } catch (error) {
      console.error('Gagal memuat aset:', error)
      toast.error('Gagal memuat daftar aset')
      setAssets([])
    }
  }

  const handleRefresh = () => loadData(true)

  // Client-side pagination
  const totalItems = schedules.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedSchedules = schedules.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleCreateSchedule = async () => {
    try {
      setSubmitting(true)
      setFormErrors([])

      const validation = validateScheduleData(formData)
      if (!validation.valid) { setFormErrors(validation.errors); return }

      await assetScheduleApi.create(formData)
      toast.success('Jadwal berhasil dibuat')
      setShowCreateModal(false)
      setFormData({ assetSymbol: '', scheduledTime: '', trend: 'buy', timeframe: '1m', notes: '', isActive: true })
      loadData()
    } catch (error: any) {
      console.error('Gagal membuat jadwal:', error)
      toast.error(error.response?.data?.message || 'Gagal membuat jadwal')
    } finally {
      setSubmitting(false)
    }
  }

  // BULK CREATE HANDLER
  const handleBulkCreate = async (schedules: Array<{
    assetSymbol: string
    scheduledTime: string
    trend: AssetScheduleTrend
    timeframe: AssetScheduleTimeframe
    notes: string
    isActive: boolean
  }>) => {
    try {
      setBulkSubmitting(true)
      let successCount = 0
      let failCount = 0

      for (const schedule of schedules) {
        try {
          await assetScheduleApi.create(schedule)
          successCount++
        } catch (error) {
          console.error('Failed to create schedule:', error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} jadwal berhasil dibuat`)
        loadData()
        setShowBulkModal(false)
      }
      if (failCount > 0) toast.error(`${failCount} jadwal gagal dibuat`)
    } catch (error) {
      console.error('Bulk create error:', error)
      toast.error('Gagal membuat jadwal bulk')
    } finally {
      setBulkSubmitting(false)
    }
  }

  // DELETE ALL HANDLER
  const handleDeleteAll = async () => {
    if (schedules.length === 0) {
      toast.error('Tidak ada jadwal untuk dihapus')
      return
    }

    const confirmDelete = window.confirm(
      `⚠️ PERINGATAN!\n\nAnda akan menghapus SEMUA ${schedules.length} jadwal yang ada.\nTindakan ini TIDAK DAPAT dibatalkan.\n\nLanjutkan?`
    )

    if (!confirmDelete) return

    const confirmAgain = window.confirm(
      `Konfirmasi terakhir:\n\nHapus ${schedules.length} jadwal secara permanen?`
    )

    if (!confirmAgain) return

    try {
      setDeletingAll(true)
      let successCount = 0
      let failCount = 0

      for (const schedule of schedules) {
        try {
          await assetScheduleApi.delete(schedule.id)
          successCount++
        } catch (error) {
          console.error('Failed to delete schedule:', schedule.id, error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} jadwal berhasil dihapus`)
        setCurrentPage(1)
        loadData()
      }
      if (failCount > 0) toast.error(`${failCount} jadwal gagal dihapus`)
    } catch (error) {
      console.error('Delete all error:', error)
      toast.error('Gagal menghapus jadwal')
    } finally {
      setDeletingAll(false)
    }
  }

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return
    try {
      await assetScheduleApi.delete(id)
      toast.success('Jadwal berhasil dihapus')
      loadData()
    } catch (error: any) {
      console.error('Gagal menghapus jadwal:', error)
      toast.error(error.response?.data?.message || 'Gagal menghapus jadwal')
    }
  }

  const handleExportCSV = () => {
    downloadSchedulesCSV(schedules, `jadwal-aset-${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('Jadwal berhasil diekspor')
  }

  if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) return null
  if (loading && !refreshing) return <LoadingSkeleton />

  const getTrendLabel = (trend: string) => trend === 'buy' ? 'Beli' : 'Jual'
  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = { 'pending': 'Menunggu', 'executed': 'Dijalankan', 'failed': 'Gagal', 'cancelled': 'Dibatalkan' }
    return labels[status] || status
  }

  return (
    <>
      <GlobalStyles />
      <div className="bg-pattern-grid min-h-screen relative">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-6 relative z-10">
        {/* Header */}
        <motion.div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          initial="hidden" animate="visible" variants={stagger(0.1)}>
          <motion.div variants={fadeLeft}>
            <motion.div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1" variants={fadeUp}>
              <span>Dasbor</span><span>/</span><span>Admin</span><span>/</span>
              <span className="text-slate-100 font-medium">Jadwal Aset</span>
            </motion.div>
            <div className="flex items-center gap-3">
              <motion.div
                className="w-9 h-9 bg-gradient-to-br from-indigo-400/80 to-cyan-500/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30 border border-white/20"
                whileHover={{ rotate: 90, scale: 1.1 }} transition={{ ...SPRING }}>
                <Calendar className="w-5 h-5 text-white" weight="duotone" />
              </motion.div>
              <div>
                <AnimatedHeadline
                  text="Manajemen Jadwal Aset"
                  className="text-2xl sm:text-3xl font-bold text-slate-100"
                  style={{ letterSpacing: '-0.03em' }}
                />
                <motion.p className="text-slate-400 text-sm mt-0.5" variants={fadeUp}>
                  {lastUpdated ? `Diperbarui ${TimezoneUtil.formatDateTime(lastUpdated)}` : 'Kelola jadwal trading otomatis untuk aset'}
                </motion.p>
              </div>
            </div>
          </motion.div>
          <motion.div variants={scaleIn} className="flex items-center gap-2 flex-wrap">
            {schedules.length > 0 && (
              <motion.button 
                onClick={handleDeleteAll} 
                disabled={deletingAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 rounded-xl font-medium transition-all text-sm disabled:opacity-50"
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              >
                {deletingAll ? (
                  <><ArrowsClockwise className="w-4 h-4 animate-spin" weight="bold" /> Menghapus...</>
                ) : (
                  <><TrashSimple className="w-4 h-4" weight="bold" /> Hapus Semua</>
                )}
              </motion.button>
            )}
            <button onClick={handleRefresh} disabled={refreshing || deletingAll} className="flex items-center gap-2 px-4 py-2 glass-input rounded-xl transition-all text-sm disabled:opacity-50 text-slate-200 hover:bg-white/10">
              <ArrowsClockwise className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} weight="bold" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button onClick={handleExportCSV} disabled={schedules.length === 0 || deletingAll} className="flex items-center gap-2 px-4 py-2 glass-input rounded-xl transition-all text-sm disabled:opacity-50 text-slate-200 hover:bg-white/10">
              <DownloadSimple className="w-4 h-4" weight="bold" />
              <span className="hidden sm:inline">Ekspor</span>
            </button>
            <button onClick={() => setShowCreateModal(true)} disabled={deletingAll} className="flex items-center gap-2 px-4 py-2 glass-input text-slate-200 rounded-xl font-medium transition-all text-sm disabled:opacity-50 hover:bg-white/10">
              <Plus className="w-4 h-4" weight="bold" />
              <span className="hidden sm:inline">Single</span>
            </button>
            <motion.button onClick={() => setShowBulkModal(true)} disabled={deletingAll} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all text-sm disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              whileHover={{ scale: 1.04, boxShadow: '0 0 20px rgba(99,102,241,0.4)' }} whileTap={{ scale: 0.96 }}>
              <Plus className="w-4 h-4" weight="bold" />
              Bulk
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Statistics */}
        {statistics && (
          <Reveal className="glass-card rounded-2xl p-5 mb-6">
            <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-4"
              variants={stagger(0.07)} initial="hidden" animate="visible">
              {[
                { icon: <Calendar className="w-5 h-5 text-blue-400" weight="duotone" />, bg: 'bg-blue-500/15', label: 'Total', value: statistics.total, color: 'text-slate-100' },
                { icon: <Clock className="w-5 h-5 text-yellow-400" weight="duotone" />, bg: 'bg-yellow-500/15', label: 'Menunggu', value: statistics.pending, color: 'text-yellow-400' },
                { icon: <CheckCircle className="w-5 h-5 text-green-400" weight="duotone" />, bg: 'bg-green-500/15', label: 'Dijalankan', value: statistics.executed, color: 'text-emerald-400' },
                { icon: <XCircle className="w-5 h-5 text-red-400" weight="duotone" />, bg: 'bg-red-500/15', label: 'Gagal', value: statistics.failed, color: 'text-red-400' },
              ].map((s) => (
                <motion.div key={s.label} variants={fadeUp}
                  className="flex items-center gap-3"
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}>
                  <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>{s.icon}</div>
                  <div>
                    <div className="text-xs font-medium text-slate-400 mb-0.5">{s.label}</div>
                    <div className={`text-lg font-bold ${s.color}`}><CountUp to={s.value} /></div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </Reveal>
        )}

        {/* Schedules Table */}
        <motion.div className="glass-card rounded-2xl overflow-hidden"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING, delay: 0.1 }}>
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-400" weight="duotone" />
              <h2 className="text-sm font-semibold text-slate-100">Daftar Jadwal</h2>
              <span className="text-xs text-slate-500 ml-2">({totalItems} total)</span>
            </div>
            
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Tampilkan:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1) }}
                className="px-2 py-1 glass-input rounded text-xs"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="text-center py-12">
                <ArrowsClockwise className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" weight="bold" />
                <p className="text-sm text-slate-400">Memuat jadwal...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center mx-auto mb-4 border border-white/10">
                  <Calendar className="w-8 h-8 text-slate-500" weight="duotone" />
                </div>
                <h3 className="text-sm font-semibold text-slate-100 mb-2">Tidak ada jadwal</h3>
                <p className="text-sm text-slate-400 mb-6">Buat jadwal pertama Anda untuk memulai</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => setShowCreateModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-medium transition-colors text-sm">
                    <Plus className="w-5 h-5" weight="bold" /> Single
                  </button>
                  <button onClick={() => setShowBulkModal(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm">
                    <Plus className="w-5 h-5" weight="bold" /> Bulk Create
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="glass-sub border-b border-white/10">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Aset</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Waktu</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Hitung Mundur</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Tren</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {paginatedSchedules.map((schedule) => {
                        const timeUntil = getTimeUntilExecution(schedule.scheduledTime)
                        return (
                          <tr key={schedule.id} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3"><div className="font-semibold text-white">{schedule.assetSymbol}</div></td>
                            <td className="px-4 py-3"><div className="text-sm text-slate-300">{formatScheduledTime(schedule.scheduledTime)}</div></td>
                            <td className="px-4 py-3"><div className={`text-sm font-medium ${timeUntil.isPast ? 'text-slate-500' : 'text-indigo-400'}`}>{timeUntil.formatted}</div></td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${schedule.trend === 'buy' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                {schedule.trend === 'buy' ? '📈' : '📉'} {getTrendLabel(schedule.trend)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold border ${
                                schedule.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                schedule.status === 'executed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                schedule.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-slate-500/10 text-slate-400 border-slate-500/20'
                              }`}>
                                {getStatusLabel(schedule.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => handleDeleteSchedule(schedule.id)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors" title="Hapus">
                                <Trash className="w-4 h-4" weight="duotone" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="text-xs text-slate-400">
                      Menampilkan {startIndex + 1}-{Math.min(endIndex, totalItems)} dari {totalItems} jadwal
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        <CaretLeft className="w-4 h-4 text-white" weight="bold" />
                      </button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum = i + 1
                          if (totalPages > 5) {
                            if (currentPage > 3) {
                              pageNum = currentPage - 2 + i
                            }
                            if (pageNum > totalPages) pageNum = totalPages - (4 - i)
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                                currentPage === pageNum
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white/5 hover:bg-white/10 text-slate-300'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        })}
                      </div>
                      
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                      >
                        <CaretRight className="w-4 h-4 text-white" weight="bold" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Single Create Modal */}
      {showCreateModal && (
        <>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" onClick={() => setShowCreateModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="glass-modal rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ ...SPRING }}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Buat Jadwal Baru</h2>
                  <button onClick={() => setShowCreateModal(false)} className="p-1 glass-sub hover:border-white/20 text-slate-400 rounded-lg transition-all"><X className="w-5 h-5" weight="bold" /></button>
                </div>

                {formErrors.length > 0 && (
                  <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Warning className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" weight="duotone" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-400 mb-1">Perbaiki kesalahan:</p>
                        <ul className="text-sm text-red-300 list-disc list-inside space-y-1">{formErrors.map((error, idx) => <li key={idx}>{error}</li>)}</ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Simbol Aset *</label>
                    <select
                      value={formData.assetSymbol}
                      onChange={(e) => setFormData({ ...formData, assetSymbol: e.target.value })}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-indigo-500 focus:bg-white/10 transition-all text-white text-sm"
                    >
                      <option value="" className="bg-slate-900">Pilih Aset</option>
                      {assets.map((asset) => (
                        <option key={asset.id} value={asset.symbol} className="bg-slate-900">{asset.symbol} - {asset.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Waktu Jadwal *</label>
                    <input
                      type="datetime-local"
                      value={isoToDatetimeLocal(formData.scheduledTime)}
                      min={isoToDatetimeLocal(new Date().toISOString())}
                      onChange={(e) => setFormData({ ...formData, scheduledTime: datetimeLocalToISO(e.target.value) })}
                      className="w-full px-3 py-2 glass-input rounded-lg transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Tren *</label>
                    <select
                      value={formData.trend}
                      onChange={(e) => setFormData({ ...formData, trend: e.target.value as any })}
                      className="w-full px-3 py-2 glass-input rounded-lg transition-all text-sm"
                    >
                      <option value="buy">📈 Beli</option>
                      <option value="sell">📉 Jual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Kerangka Waktu *</label>
                    <select
                      value={formData.timeframe}
                      onChange={(e) => setFormData({ ...formData, timeframe: e.target.value as any })}
                      className="w-full px-3 py-2 glass-input rounded-lg transition-all text-sm"
                    >
                      <option value="1m">1 Menit</option>
                      <option value="5m">5 Menit</option>
                      <option value="15m">15 Menit</option>
                      <option value="30m">30 Menit</option>
                      <option value="1h">1 Jam</option>
                      <option value="4h">4 Jam</option>
                      <option value="1d">1 Hari</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Catatan</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      placeholder="Tambahkan catatan..."
                      className="w-full px-3 py-2 glass-input rounded-lg transition-all text-sm resize-none placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 glass-sub hover:border-white/20 text-slate-300 rounded-xl transition-all">Batal</button>
                  <button onClick={handleCreateSchedule} disabled={submitting} className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20">
                    {submitting ? 'Membuat...' : 'Buat'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* BULK CREATE MODAL */}
      <BulkScheduleModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        assets={assets}
        onSubmit={handleBulkCreate}
        submitting={bulkSubmitting}
      />
    </div>
    </>
  )
}