// components/TradingChart.tsx
'use client'

import { useEffect, useRef, useState, useCallback, memo, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { createChart, ColorType, CrosshairMode, IChartApi, ISeriesApi, UTCTimestamp, LineStyle } from 'lightweight-charts'
import { useTradingStore, useTradingActions } from '@/store/trading'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { fetchHistoricalData, prefetchMultipleTimeframes } from '@/lib/firebase'
import { websocketService } from '@/lib/websocket'
import type { OHLCUpdate } from '@/lib/websocket'
import { BinaryOrder, TIMEFRAMES, Timeframe as TimeframeType } from '@/types'
import { database, ref, get } from '@/lib/firebase'
import { formatPriceAuto } from '@/lib/utils'

function formatPrice4(price: number, assetType: string): string {
  const raw = formatPriceAuto(price, assetType)
  const parts = raw.split('.')
  if (parts.length < 2) return raw
  return parts[0] + '.' + parts[1].slice(0, 4)
}
import dynamic from 'next/dynamic'
import { Maximize2, Minimize2, RefreshCw, Activity, ChevronDown, Server, Clock, BarChart2, X, Search } from 'lucide-react'
import { PencilSimpleLine, ChartLine } from 'phosphor-react'
import DrawingTools from '@/components/DrawingTools'
import AssetIcon from '@/components/common/AssetIcon'
import OrderPriceTracker from '@/components/OrderPriceTracker'
import CandleCountdown from '@/components/CandleCountdown'
import { useChartPriceScale } from '@/hooks/useChartPriceScale'
import {
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  calculateATR,
  calculateWMA,
  calculateADX,
  calculateCCI,
  calculateParabolicSAR,
  calculateWilliamsR,
  calculateOBV,
  calculateIchimoku,
  calculateVWAP,
  calculateKeltnerChannels,
  calculateDonchianChannels,
  calculateMFI,
  calculateAroon,
  calculateSupertrend,
  calculateTRIX,
  calculateElderRay,
  CandleData as IndicatorCandleData
} from '@/lib/indicators'

function toWIBTimestamp(timestamp: number): number {
  const date = new Date(timestamp * 1000);
  const wibString = date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  const wibDate = new Date(wibString);
  return Math.floor(wibDate.getTime() / 1000);
}

function formatWIBTime(timestamp: number, showSeconds: boolean = false): string {
  const date = new Date(timestamp * 1000);
  const wibDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));

  const hours = String(wibDate.getHours()).padStart(2, '0');
  const minutes = String(wibDate.getMinutes()).padStart(2, '0');
  const seconds = String(wibDate.getSeconds()).padStart(2, '0');

  return showSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`;
}

function formatWIBDateTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const wibDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));

  const day = String(wibDate.getDate()).padStart(2, '0');
  const month = String(wibDate.getMonth() + 1).padStart(2, '0');
  const year = wibDate.getFullYear();
  const hours = String(wibDate.getHours()).padStart(2, '0');
  const minutes = String(wibDate.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

type AssetTypeFilter = 'all' | 'forex' | 'crypto' | 'stock' | 'commodity' | 'index'

const ASSET_TYPE_META: Record<AssetTypeFilter, {
  label: string
  activeBg: string
  activeBorder: string
  activeText: string
}> = {
  all:       { label: 'Semua',     activeBg: 'bg-slate-600',       activeBorder: 'border-slate-400',   activeText: 'text-white'       },
  forex:     { label: 'Forex',     activeBg: 'bg-blue-500/30',     activeBorder: 'border-blue-400',    activeText: 'text-blue-300'    },
  crypto:    { label: 'Crypto',    activeBg: 'bg-orange-500/30',   activeBorder: 'border-orange-400',  activeText: 'text-orange-300'  },
  stock:     { label: 'Stocks',    activeBg: 'bg-emerald-500/30',  activeBorder: 'border-emerald-400', activeText: 'text-emerald-300' },
  commodity: { label: 'Komoditas', activeBg: 'bg-yellow-500/30',   activeBorder: 'border-yellow-400',  activeText: 'text-yellow-300'  },
  index:     { label: 'Indeks',    activeBg: 'bg-purple-500/30',   activeBorder: 'border-purple-400',  activeText: 'text-purple-300'  },
}

const TypeFilterChips = memo(({
  activeFilter,
  onFilterChange,
  assetCounts,
  availableTypes,
  isLightMode,
}: {
  activeFilter: AssetTypeFilter
  onFilterChange: (f: AssetTypeFilter) => void
  assetCounts: Record<string, number>
  availableTypes: AssetTypeFilter[]
  isLightMode?: boolean
}) => {
  const types: AssetTypeFilter[] = ['all', ...availableTypes]

  const midPoint = Math.ceil(types.length / 2)
  const row1 = types.slice(0, midPoint)
  const row2 = types.slice(midPoint)

  // Solid color mapping for light mode active chips
  const LIGHT_ACTIVE_STYLE: Record<AssetTypeFilter, { bg: string; border: string }> = {
    all:       { bg: '#475569', border: '#475569' },
    forex:     { bg: '#3b82f6', border: '#3b82f6' },
    crypto:    { bg: '#f97316', border: '#f97316' },
    stock:     { bg: '#10b981', border: '#10b981' },
    commodity: { bg: '#ca8a04', border: '#ca8a04' },
    index:     { bg: '#8b5cf6', border: '#8b5cf6' },
  }

  const renderChip = (type: AssetTypeFilter) => {
    const meta = ASSET_TYPE_META[type]
    const count = type === 'all'
      ? Object.values(assetCounts).reduce((a, b) => a + b, 0)
      : (assetCounts[type] || 0)
    const isActive = activeFilter === type

    if (isLightMode) {
      const lm = LIGHT_ACTIVE_STYLE[type]
      return (
        <button
          key={type}
          onClick={(e) => { e.stopPropagation(); onFilterChange(type) }}
          style={isActive
            ? { backgroundColor: lm.bg, borderColor: lm.border, color: '#ffffff' }
            : { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', color: '#475569' }
          }
          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold border transition-all duration-150"
        >
          <span>{meta.label}</span>
          {count > 0 && (
            <span style={{
              fontSize: '9px', padding: '1px 4px', borderRadius: '4px',
              backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
              color: isActive ? '#ffffff' : '#64748b',
            }}>
              {count}
            </span>
          )}
        </button>
      )
    }

    return (
      <button
        key={type}
        onClick={(e) => { e.stopPropagation(); onFilterChange(type) }}
        className={`
          flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded-md
          text-[11px] font-semibold border transition-all duration-150
          ${isActive
            ? `${meta.activeBg} ${meta.activeBorder} ${meta.activeText}`
            : 'bg-[#1a1f2e] border-gray-700/50 text-gray-400 hover:border-gray-500 hover:text-gray-300'
          }
        `}
      >
        <span>{meta.label}</span>
        {count > 0 && (
          <span className={`text-[9px] px-1 py-0.5 rounded ${isActive ? 'bg-white/10' : 'bg-gray-700/60'}`}>
            {count}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        {row1.map(renderChip)}
      </div>
      {row2.length > 0 && (
        <div className="flex gap-1.5">
          {row2.map(renderChip)}
        </div>
      )}
    </div>
  )
})

TypeFilterChips.displayName = 'TypeFilterChips'

const IndicatorControls = dynamic(() => import('./IndicatorControls'), { ssr: false })

type ChartType = 'line' | 'candle'
type Timeframe = TimeframeType

interface TradingChartProps {
  activeOrders?: BinaryOrder[]
  currentPrice?: number
  assets?: any[]
  onAssetSelect?: (asset: any) => void
  isLightMode?: boolean
}

interface IndicatorConfig {

  sma?: { enabled: boolean; period: number; color: string }
  ema?: { enabled: boolean; period: number; color: string }
  wma?: { enabled: boolean; period: number; color: string }
  bollinger?: { enabled: boolean; period: number; stdDev: number; colorUpper: string; colorMiddle: string; colorLower: string }
  keltner?: { enabled: boolean; emaPeriod: number; atrPeriod: number; multiplier: number }
  donchian?: { enabled: boolean; period: number }
  ichimoku?: { enabled: boolean; tenkanPeriod: number; kijunPeriod: number; senkouBPeriod: number }
  vwap?: { enabled: boolean; color: string }
  parabolicSar?: { enabled: boolean; accelerationFactor: number; maxAF: number }
  supertrend?: { enabled: boolean; period: number; multiplier: number }


  rsi?: { enabled: boolean; period: number; overbought: number; oversold: number }
  macd?: { enabled: boolean; fastPeriod: number; slowPeriod: number; signalPeriod: number }
  stochastic?: { enabled: boolean; kPeriod: number; dPeriod: number; overbought: number; oversold: number }
  atr?: { enabled: boolean; period: number }
  adx?: { enabled: boolean; period: number }
  cci?: { enabled: boolean; period: number }
  williamsR?: { enabled: boolean; period: number }
  mfi?: { enabled: boolean; period: number }
  aroon?: { enabled: boolean; period: number }
  trix?: { enabled: boolean; period: number }
  obv?: { enabled: boolean }
  elderRay?: { enabled: boolean; period: number }
}

const DEFAULT_INDICATOR_CONFIG: IndicatorConfig = {
  sma: { enabled: false, period: 20, color: '#3b82f6' },
  ema: { enabled: false, period: 20, color: '#f59e0b' },
  wma: { enabled: false, period: 20, color: '#8b5cf6' },
  bollinger: { enabled: false, period: 20, stdDev: 2, colorUpper: '#ef4444', colorMiddle: '#6b7280', colorLower: '#10b981' },
  keltner: { enabled: false, emaPeriod: 20, atrPeriod: 10, multiplier: 2 },
  donchian: { enabled: false, period: 20 },
  ichimoku: { enabled: false, tenkanPeriod: 9, kijunPeriod: 26, senkouBPeriod: 52 },
  vwap: { enabled: false, color: '#06b6d4' },
  parabolicSar: { enabled: false, accelerationFactor: 0.02, maxAF: 0.2 },
  supertrend: { enabled: false, period: 10, multiplier: 3 },
  rsi: { enabled: false, period: 14, overbought: 70, oversold: 30 },
  macd: { enabled: false, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
  stochastic: { enabled: false, kPeriod: 14, dPeriod: 3, overbought: 80, oversold: 20 },
  atr: { enabled: false, period: 14 },
  adx: { enabled: false, period: 14 },
  cci: { enabled: false, period: 20 },
  williamsR: { enabled: false, period: 14 },
  mfi: { enabled: false, period: 14 },
  aroon: { enabled: false, period: 25 },
  trix: { enabled: false, period: 14 },
  obv: { enabled: false },
  elderRay: { enabled: false, period: 13 }
}

interface CandleData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
  isCompleted?: boolean
}

interface AnimatedCandle extends CandleData {
  targetHigh: number
  targetLow: number
  targetClose: number
  isAnimating: boolean
}

const ChartSkeleton = memo(({ timeframe, assetSymbol, isLightMode }: { timeframe: Timeframe; assetSymbol: string; isLightMode?: boolean }) => {
  const bg        = isLightMode ? '#f0f5ff' : '#0a0e17'
  const pulse     = isLightMode ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.07)'
  const pulseDim  = isLightMode ? 'rgba(59,130,246,0.07)' : 'rgba(255,255,255,0.04)'
  const border    = isLightMode ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.05)'
  const gridLine  = isLightMode ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.05)'
  const shimmer   = isLightMode ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.05)'
  const textMain  = isLightMode ? '#475569' : '#d1d5db'
  const textSub   = isLightMode ? '#94a3b8' : '#6b7280'
  const spinOuter = isLightMode ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.08)'

  return (
    <div className="absolute inset-0 z-30 flex flex-col" style={{ background: bg }}>
      <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: pulse }} />
          <div className="space-y-2">
            <div className="h-4 w-24 rounded animate-pulse" style={{ background: pulse }} />
            <div className="h-3 w-16 rounded animate-pulse" style={{ background: pulseDim }} />
          </div>
        </div>
        <div className="h-6 w-32 rounded animate-pulse" style={{ background: pulse }} />
      </div>

      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0 opacity-100">
          <div className="h-full w-full" style={{
            backgroundImage: `
              linear-gradient(to right, ${gridLine} 1px, transparent 1px),
              linear-gradient(to bottom, ${gridLine} 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="absolute inset-0 animate-shimmer" style={{
          background: `linear-gradient(to right, transparent, ${shimmer}, transparent)`
        }} />

        <div className="absolute inset-0 flex items-end justify-center pb-20 px-10 gap-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="rounded-sm animate-pulse"
              style={{
                width: '8px',
                height: `${Math.random() * 60 + 20}%`,
                background: pulse,
                animationDelay: `${i * 0.05}s`
              }}
            />
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 rounded-full" style={{ borderColor: spinOuter }} />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-500/30 rounded-full border-t-blue-500 animate-spin" />
            <div className="absolute inset-0 m-auto w-8 h-8 bg-blue-500/20 rounded-full animate-ping" />
          </div>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm font-medium" style={{ color: textMain }}>
              Loading {timeframe} Chart
            </p>
            <p className="text-xs" style={{ color: textSub }}>
              {assetSymbol}
            </p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes scale-in {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.15s ease-out;
        }
      `}</style>
    </div>
  )
})

ChartSkeleton.displayName = 'ChartSkeleton'

function calculateSMA(data: Array<{ time: UTCTimestamp; close: number }>, period: number): Array<{ time: UTCTimestamp; value: number }> {
  const result: Array<{ time: UTCTimestamp; value: number }> = []

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close
    }
    result.push({ time: data[i].time, value: sum / period })
  }

  return result
}

function calculateEMA(data: Array<{ time: UTCTimestamp; close: number }>, period: number): Array<{ time: UTCTimestamp; value: number }> {
  const result: Array<{ time: UTCTimestamp; value: number }> = []
  const multiplier = 2 / (period + 1)

  let sum = 0
  for (let i = 0; i < Math.min(period, data.length); i++) {
    sum += data[i].close
  }
  let ema = sum / Math.min(period, data.length)

  if (data.length >= period) {
    result.push({ time: data[period - 1].time, value: ema })
  }

  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema
    result.push({ time: data[i].time, value: ema })
  }

  return result
}

function calculateBollingerBands(
  data: Array<{ time: UTCTimestamp; close: number }>,
  period: number,
  stdDev: number
): {
  upper: Array<{ time: UTCTimestamp; value: number }>
  middle: Array<{ time: UTCTimestamp; value: number }>
  lower: Array<{ time: UTCTimestamp; value: number }>
} {
  const upper: Array<{ time: UTCTimestamp; value: number }> = []
  const middle: Array<{ time: UTCTimestamp; value: number }> = []
  const lower: Array<{ time: UTCTimestamp; value: number }> = []

  for (let i = period - 1; i < data.length; i++) {
    let sum = 0
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close
    }
    const sma = sum / period

    let squaredDiffSum = 0
    for (let j = 0; j < period; j++) {
      const diff = data[i - j].close - sma
      squaredDiffSum += diff * diff
    }
    const sd = Math.sqrt(squaredDiffSum / period)

    const time = data[i].time
    upper.push({ time, value: sma + (stdDev * sd) })
    middle.push({ time, value: sma })
    lower.push({ time, value: sma - (stdDev * sd) })
  }

  return { upper, middle, lower }
}

class LoadingStateManager {
  private isLoading = false
  private loadingTimeouts: NodeJS.Timeout[] = []
  private updateCallback: ((loading: boolean) => void) | null = null

  setCallback(callback: (loading: boolean) => void) {
    this.updateCallback = callback
  }

  setLoading(loading: boolean, delay: number = 0) {
    this.clearTimeouts()

    if (delay > 0) {
      const timeout = setTimeout(() => {
        this.isLoading = loading
        this.updateCallback?.(loading)
      }, delay)
      this.loadingTimeouts.push(timeout)
    } else {
      this.isLoading = loading
      this.updateCallback?.(loading)
    }
  }

  getLoading(): boolean {
    return this.isLoading
  }

  clearTimeouts() {
    this.loadingTimeouts.forEach(t => clearTimeout(t))
    this.loadingTimeouts = []
  }

  reset() {
    this.clearTimeouts()
    this.isLoading = false
    this.updateCallback?.(false)
  }
}

class SmoothCandleAnimator {
  private currentCandle: AnimatedCandle | null = null
  private animationFrame: number | null = null
  private duration: number = 300
  private startTime: number = 0
  private onUpdate: (candle: CandleData) => void
  private initialHigh: number = 0
  private initialLow: number = 0
  private initialClose: number = 0

  constructor(onUpdate: (candle: CandleData) => void, duration: number = 300) {
    this.onUpdate = onUpdate
    this.duration = duration
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  updateCandle(newCandle: CandleData) {
    if (!this.currentCandle || this.currentCandle.timestamp !== newCandle.timestamp) {
      this.currentCandle = {
        ...newCandle,
        targetHigh: newCandle.high,
        targetLow: newCandle.low,
        targetClose: newCandle.close,
        isAnimating: false,
      }

      this.onUpdate({
        timestamp: newCandle.timestamp,
        open: newCandle.open,
        high: newCandle.high,
        low: newCandle.low,
        close: newCandle.close,
        volume: newCandle.volume,
      })

      return
    }

    const hasChanges =
      this.currentCandle.high !== newCandle.high ||
      this.currentCandle.low !== newCandle.low ||
      this.currentCandle.close !== newCandle.close

    if (!hasChanges) return

    this.initialHigh = this.currentCandle.high
    this.initialLow = this.currentCandle.low
    this.initialClose = this.currentCandle.close

    this.currentCandle.targetHigh = newCandle.high
    this.currentCandle.targetLow = newCandle.low
    this.currentCandle.targetClose = newCandle.close
    this.currentCandle.volume = newCandle.volume
    this.currentCandle.isAnimating = true

    this.startAnimation()
  }

  private startAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }

    this.startTime = performance.now()

    const animate = (currentTime: number) => {
      if (!this.currentCandle || !this.currentCandle.isAnimating) return

      const elapsed = currentTime - this.startTime
      const progress = Math.min(elapsed / this.duration, 1)
      const easedProgress = this.easeOutCubic(progress)

      const newHigh = this.lerp(this.initialHigh, this.currentCandle.targetHigh, easedProgress)
      const newLow = this.lerp(this.initialLow, this.currentCandle.targetLow, easedProgress)
      const newClose = this.lerp(this.initialClose, this.currentCandle.targetClose, easedProgress)

      this.currentCandle.high = Math.max(newHigh, this.currentCandle.open, newClose)
      this.currentCandle.low = Math.min(newLow, this.currentCandle.open, newClose)
      this.currentCandle.close = newClose

      this.onUpdate({
        timestamp: this.currentCandle.timestamp,
        open: this.currentCandle.open,
        high: this.currentCandle.high,
        low: this.currentCandle.low,
        close: this.currentCandle.close,
        volume: this.currentCandle.volume,
      })

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate)
      } else {
        this.currentCandle.isAnimating = false
        this.animationFrame = null

        this.currentCandle.high = this.currentCandle.targetHigh
        this.currentCandle.low = this.currentCandle.targetLow
        this.currentCandle.close = this.currentCandle.targetClose

        this.onUpdate({
          timestamp: this.currentCandle.timestamp,
          open: this.currentCandle.open,
          high: this.currentCandle.targetHigh,
          low: this.currentCandle.targetLow,
          close: this.currentCandle.targetClose,
          volume: this.currentCandle.volume,
        })
      }
    }

    this.animationFrame = requestAnimationFrame(animate)
  }

  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t
  }

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  reset() {
    this.stop()
    this.currentCandle = null
  }
}

const GLOBAL_DATA_CACHE = new Map<string, {
  data: any[]
  timestamp: number
  timeframe: Timeframe
}>()

const CACHE_TTL = 300000
const STALE_CACHE_TTL = 600000

function getCachedData(assetId: string, timeframe: Timeframe): any[] | null {
  const key = `${assetId}-${timeframe}`
  const cached = GLOBAL_DATA_CACHE.get(key)
  if (!cached) return null
  const now = Date.now()
  const age = now - cached.timestamp

  if (age > CACHE_TTL) {
    if (age > STALE_CACHE_TTL) {
      GLOBAL_DATA_CACHE.delete(key)
      return null
    }
    return cached.data
  }
  return cached.data
}

function setCachedData(assetId: string, timeframe: Timeframe, data: any[]) {
  const key = `${assetId}-${timeframe}`
  GLOBAL_DATA_CACHE.set(key, {
    data,
    timestamp: Date.now(),
    timeframe
  })

  if (GLOBAL_DATA_CACHE.size > 100) {
    const entries = Array.from(GLOBAL_DATA_CACHE.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
    const toDelete = entries.slice(0, 25)
    toDelete.forEach(([key]) => GLOBAL_DATA_CACHE.delete(key))
  }
}

function cleanAssetPath(path: string): string {
  if (!path) return ''
  if (path.endsWith('/current_price')) {
    path = path.replace('/current_price', '')
  }
  path = path.replace(/\/$/, '')
  if (!path.startsWith('/')) {
    path = '/' + path
  }
  return path
}

function getTimeframeSeconds(timeframe: Timeframe): number {
  const map: Record<Timeframe, number> = {
    '1s': 1,
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400
  }
  return map[timeframe] || 60
}

function getBarPeriodTimestamp(timestamp: number, timeframe: Timeframe): number {
  const seconds = getTimeframeSeconds(timeframe)



  return Math.floor(timestamp / seconds) * seconds
}

async function checkSimulatorStatus(assetPath: string): Promise<{
  isRunning: boolean
  hasCurrentPrice: boolean
  hasOHLC: boolean
  message: string
}> {
  if (typeof window === 'undefined' || !database) {
    return {
      isRunning: false,
      hasCurrentPrice: false,
      hasOHLC: false,
      message: 'Firebase not initialized'
    }
  }

  try {
    const basePath = cleanAssetPath(assetPath)

    const priceRef = ref(database, `${basePath}/current_price`)
    const priceSnapshot = await get(priceRef)
    const hasCurrentPrice = priceSnapshot.exists()

    const ohlcRef = ref(database, `${basePath}/ohlc_1m`)
    const ohlcSnapshot = await get(ohlcRef)
    const hasOHLC = ohlcSnapshot.exists()

    const isRunning = hasCurrentPrice && hasOHLC

    let message = ''
    if (!hasCurrentPrice && !hasOHLC) {
      message = 'Market offline - no data found'
    } else if (!hasCurrentPrice) {
      message = 'Missing current_price data'
    } else if (!hasOHLC) {
      message = 'Missing OHLC data'
    } else {
      message = 'Market online'
    }

    return { isRunning, hasCurrentPrice, hasOHLC, message }
  } catch (error) {
    return {
      isRunning: false,
      hasCurrentPrice: false,
      hasOHLC: false,
      message: 'Check failed: ' + (error as Error).message
    }
  }
}

const RealtimeClock = memo(({ nowMs, isLightMode }: { nowMs: number; isLightMode?: boolean }) => {
  const time = new Date(nowMs)

  const timeStr = time.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  })


  const wib = new Date(time.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const day = String(wib.getDate()).padStart(2, '0')
  const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
  const month = monthNames[wib.getMonth()]
  const year = wib.getFullYear()
  const dateStr = `${day} ${month} ${year}`

  return (
    <div
      className="absolute top-16 left-2 z-10 rounded-full px-3 py-1.5"
      style={isLightMode
        ? { background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
        : { background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }
      }
    >
      <div className="flex items-center gap-2">
        <div style={{ fontSize: '0.75rem', fontWeight: 300, color: isLightMode ? '#1e293b' : '#ffffff' }}>
          {timeStr} <span style={{ color: isLightMode ? '#94a3b8' : '#d1d5db' }}> | </span> {dateStr}
        </div>
      </div>
    </div>
  )
})

RealtimeClock.displayName = 'RealtimeClock'

const PriceDisplay = memo(({
  asset,
  price,
  onClick,
  showMenu,
  assets,
  onSelectAsset,
  isLightMode,
}: any) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [assetTypeFilter, setAssetTypeFilter] = useState<AssetTypeFilter>('all')
  const [isClosing, setIsClosing] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  if (!asset || !price) return null

  const hasChange = price.change !== undefined && price.change !== 0
  const formattedPrice = formatPrice4(price.price, asset.type)


  const assetCountsByType = useMemo(() => {
    const counts: Record<string, number> = {}
    assets.forEach((a: any) => {
      if (a.type) counts[a.type] = (counts[a.type] || 0) + 1
    })
    return counts
  }, [assets])


  const availableAssetTypes = useMemo((): AssetTypeFilter[] => {
    return (Object.keys(assetCountsByType) as AssetTypeFilter[]).filter(
      t => assetCountsByType[t] > 0
    )
  }, [assetCountsByType])


  const filteredAssets = useMemo(() => {
    let result = assets


    if (assetTypeFilter !== 'all') {
      result = result.filter((a: any) => a.type === assetTypeFilter)
    }


    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((assetItem: any) =>
        assetItem.symbol?.toLowerCase().includes(query) ||
        assetItem.name?.toLowerCase().includes(query)
      )
    }

    return result
  }, [assets, searchQuery, assetTypeFilter])


  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onClick()
      setIsClosing(false)
      setSearchQuery('')
      setAssetTypeFilter('all')
    }, 200)
  }, [onClick])


  useEffect(() => {
    if (!showMenu) {
      setSearchQuery('')
      setAssetTypeFilter('all')
      setSelectedIndex(0)
    }
  }, [showMenu])


  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredAssets.length])


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredAssets.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev =>
          prev < filteredAssets.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
        break
      case 'Enter':
        e.preventDefault()
        if (filteredAssets[selectedIndex]) {
          onSelectAsset(filteredAssets[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        handleClose()
        break
    }
  }

  return (
    <div className="absolute top-2 left-2 z-20">
      {}
      <div className="lg:hidden flex items-center">
        <button
          data-tutorial="asset-selector"
          onClick={onClick}
          className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 hover:bg-black/50 transition-all flex items-center gap-2"
        >
          {asset && <AssetIcon asset={asset} size="sm" />}
          <span className="text-sm font-semibold text-white">{asset.symbol}</span>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
        </button>

        <div className="px-3 py-2 flex items-center gap-2">
          <span className="text-sm font-bold text-white">{formattedPrice}</span>
          {hasChange && (
            <span className={`text-xs font-semibold ${price.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {price.change >= 0 ? '▲' : '▼'} {price.change >= 0 ? '+' : ''}{price.change.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {}
      <div className="hidden lg:flex items-center gap-1">
        <div className="bg-black/20 backdrop-blur-md border border-white/10 rounded-full px-4 py-2.5 flex items-center gap-2">
          {asset && <AssetIcon asset={asset} size="sm" />}
          <span className="text-sm font-semibold text-white">{asset.symbol}</span>
        </div>

        <div className="px-4 py-2 flex items-center gap-2">
          <span className="text-xl font-bold text-white">{formattedPrice}</span>
          {hasChange && (
            <span className={`text-sm font-semibold ${price.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {price.change >= 0 ? '▲' : '▼'} {price.change >= 0 ? '+' : ''}{price.change.toFixed(2)}%
            </span>
          )}
        </div>
      </div>

      {showMenu && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 lg:hidden ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
            style={{ zIndex: 9998, backgroundColor: 'rgba(0,0,0,0.45)' }}
            onClick={handleClose}
          />

          {/* Popup panel — portal renders outside chart stacking context */}
          <div
            className={`fixed top-[60px] left-4 w-[calc(100vw-32px)] max-w-[320px] rounded-lg shadow-2xl lg:hidden flex flex-col ${
              isClosing ? 'animate-dropdown-out' : 'animate-dropdown-in'
            }`}
            style={{
              zIndex: 9999,
              maxHeight: 'calc(100vh - 120px)',
              backgroundColor: isLightMode ? '#ffffff' : '#0f1419',
              border: `1px solid ${isLightMode ? 'rgba(0,0,0,0.1)' : 'rgba(55,65,81,0.5)'}`,
            }}
          >
            {/* Search + filter header */}
            <div
              className="p-3 sticky top-0 z-10"
              style={{
                borderBottom: `1px solid ${isLightMode ? 'rgba(0,0,0,0.08)' : 'rgba(55,65,81,0.5)'}`,
                backgroundColor: isLightMode ? '#ffffff' : '#0f1419',
              }}
            >
              <div className="relative flex items-center gap-2 mb-2 px-2 py-1.5">
                <Search className={`w-3.5 h-3.5 flex-shrink-0 ${isLightMode ? 'text-slate-400' : 'text-gray-400'}`} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Cari aset..."
                  className={`flex-1 text-xs outline-none border-0 ring-0 bg-transparent ${isLightMode ? 'text-slate-800 placeholder:text-slate-400' : 'text-white'}`}
                  onClick={(e) => e.stopPropagation()}
                />
                {searchQuery && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSearchQuery('')
                      searchInputRef.current?.focus()
                    }}
                    className={`transition-colors ${isLightMode ? 'text-slate-400 hover:text-slate-600' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {availableAssetTypes.length > 1 && (
                <div onClick={(e) => e.stopPropagation()}>
                  <TypeFilterChips
                    activeFilter={assetTypeFilter}
                    onFilterChange={setAssetTypeFilter}
                    assetCounts={assetCountsByType}
                    availableTypes={availableAssetTypes}
                    isLightMode={isLightMode}
                  />
                </div>
              )}
            </div>

            {/* Asset list */}
            <div className="overflow-y-auto max-h-[300px]">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((assetItem: any, index: number) => (
                  <button
                    key={assetItem.id}
                    onClick={() => { onSelectAsset(assetItem) }}
                    onMouseEnter={() => {
                      setSelectedIndex(index)
                      if (assetItem.realtimeDbPath) {
                        prefetchMultipleTimeframes(assetItem.realtimeDbPath, ['1m', '5m'])
                          .catch(err => console.log('Prefetch failed:', err))
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 transition-colors border-b last:border-0 ${
                      isLightMode
                        ? (index === selectedIndex || assetItem.id === asset?.id ? 'bg-blue-50' : 'hover:bg-gray-50')
                        : `hover:bg-[#1a1f2e] border-gray-800/30 ${index === selectedIndex ? 'bg-[#1a1f2e] ring-1 ring-blue-500/30' : ''} ${assetItem.id === asset?.id ? 'bg-[#1a1f2e]/50' : ''}`
                    }`}
                    style={isLightMode ? { borderColor: 'rgba(0,0,0,0.06)' } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <AssetIcon asset={assetItem} size="xs" />
                      <div className="text-left">
                        <div className={`text-sm font-medium ${isLightMode ? 'text-slate-800' : ''}`}>{assetItem.symbol}</div>
                        <div className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>{assetItem.name}</div>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-emerald-500">+{assetItem.profitRate}%</div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <div className="text-2xl mb-2 opacity-50">🔍</div>
                  <p className={`text-xs ${isLightMode ? 'text-slate-400' : 'text-gray-500'}`}>
                    {searchQuery
                      ? 'Aset tidak ditemukan'
                      : `Tidak ada ${ASSET_TYPE_META[assetTypeFilter]?.label || ''} tersedia`
                    }
                  </p>
                  {assetTypeFilter !== 'all' && !searchQuery && (
                    <button
                      onClick={() => setAssetTypeFilter('all')}
                      className="mt-2 text-[11px] text-blue-400 hover:text-blue-300 underline"
                    >
                      Tampilkan semua
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
})

PriceDisplay.displayName = 'PriceDisplay'

const OHLCDisplay = memo(({
  data,
  visible
}: {
  data: {
    time: number
    open: number
    high: number
    low: number
    close: number
  } | null
  visible: boolean
}) => {
  if (!visible || !data) return null

  const date = new Date(data.time * 1000)
  const timeStr = date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta'
  })

  const formatOHLCPrice = (price: number) => {
    if (price >= 1000) return price.toFixed(2)
    if (price >= 1) return price.toFixed(6)
    return price.toFixed(8)
  }

  return (
    <div className="absolute bottom-20 left-2 z-10 bg-[#0a0e17] border border-gray-800/50 rounded-lg px-3 py-2 text-xs">
      <div className="flex items-center gap-1 text-gray-400 mb-1">
        <Clock className="w-3 h-3" />
        <span>{timeStr} WIB</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 w-3">O:</span>
          <span className="text-white">{formatOHLCPrice(data.open)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 w-3">H:</span>
          <span className="text-emerald-400">{formatOHLCPrice(data.high)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 w-3">L:</span>
          <span className="text-rose-400">{formatOHLCPrice(data.low)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-gray-500 w-3">C:</span>
          <span className="text-blue-400">{formatOHLCPrice(data.close)}</span>
        </div>
      </div>
    </div>
  )
})

OHLCDisplay.displayName = 'OHLCDisplay'

const SimulatorStatus = memo(({
  status,
  onRetry
}: {
  status: { isRunning: boolean; message: string } | null
  onRetry: () => void
}) => {
  if (!status || status.isRunning) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e17]/95 z-20">
      <div className="text-center max-w-md px-6">
        <div className="w-16 h-16 bg-rose-500/10 border-2 border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <Server className="w-8 h-8 text-rose-400" />
        </div>

        <div className="text-lg font-bold text-rose-400 mb-2">
          Market Not Available
        </div>

        <div className="text-sm text-gray-400 mb-1">
          {status.message}
        </div>

        <div className="text-xs text-gray-500 mb-6">
          Loading to view real-time data
        </div>

        <button onClick={onRetry} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" />
          Check Again
        </button>
      </div>
    </div>
  )
})

SimulatorStatus.displayName = 'SimulatorStatus'

const MobileControls = memo(({
  timeframe,
  chartType,
  isLoading,
  onTimeframeChange,
  onChartTypeChange,
  onFitContent,
  onRefresh,
  onOpenIndicators,
  onToggleDrawing,
  drawingEnabled,
  nowSeconds,
  isLightMode,
}: any) => {
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false)
  const [showChartTypeMenu, setShowChartTypeMenu] = useState(false)
  const timeframeRef = useRef<HTMLDivElement>(null)
  const chartTypeRef = useRef<HTMLDivElement>(null)

  const timeframes: Timeframe[] = ['1s', '1m', '5m', '15m', '30m', '1h', '4h', '1d']


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeframeRef.current && !timeframeRef.current.contains(event.target as Node)) {
        setShowTimeframeMenu(false)
      }
      if (chartTypeRef.current && !chartTypeRef.current.contains(event.target as Node)) {
        setShowChartTypeMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])


  const TIMEFRAME_SECONDS_MAP: Record<string, number> = {
    '1s': 1, '1m': 60, '5m': 300, '15m': 900,
    '30m': 1800, '1h': 3600, '4h': 14400, '1d': 86400,
  }
  const intervalSecs = TIMEFRAME_SECONDS_MAP[timeframe] ?? 60
  const countdownSecs = intervalSecs - (nowSeconds % intervalSecs)

  const formatCd = (secs: number) => {
    if (timeframe === '1s') return `00:${String(secs).padStart(2, '0')}`
    return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
  }

  // Light mode uses inline styles with !important via a <style> tag to avoid Tailwind conflicts
  const pillStyle = isLightMode
    ? { backgroundColor: 'rgba(255,255,255,0.95)', border: '1.5px solid #94a3b8', boxShadow: '0 1px 4px rgba(0,0,0,0.12)', backdropFilter: 'blur(4px)' }
    : undefined
  const pillClass = isLightMode
    ? 'bg-white/95 backdrop-blur-sm shadow-sm'
    : 'bg-gray-900/80 backdrop-blur-sm border border-gray-700/50'

  const btnInactive = isLightMode ? 'text-slate-600 hover:text-slate-900 hover:bg-gray-100' : 'text-gray-300 hover:bg-gray-800/80'
  const btnActive   = 'bg-blue-500 !text-white shadow-sm'
  const dropdownStyle = isLightMode
    ? { backgroundColor: '#ffffff', border: '1.5px solid #94a3b8', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }
    : undefined
  const dropdownClass = isLightMode ? 'bg-white shadow-lg' : 'bg-[#0f1419] border border-gray-800/50 shadow-2xl'
  const dropdownItem = (active: boolean) => active
    ? btnActive
    : isLightMode ? 'bg-gray-100 text-slate-700 hover:bg-gray-200' : 'bg-[#1a1f2e] text-gray-300 hover:bg-[#232936]'

  return (
    <div className="lg:hidden absolute bottom-10 left-2 z-10 flex items-center gap-2">
      {/* Timeframe pill */}
      <div className="relative" ref={timeframeRef}>
        <button
          onClick={() => { setShowTimeframeMenu(!showTimeframeMenu); setShowChartTypeMenu(false) }}
          disabled={isLoading}
          style={pillStyle}
          className={`h-10 px-3 rounded-full hover:brightness-95 transition-all disabled:opacity-50 flex items-center gap-1.5 ${pillClass}`}
          title="Timeframe"
        >
          <Clock className={`w-4 h-4 ${isLightMode ? 'text-blue-500' : 'text-blue-400'}`} />
          <span className={`text-sm font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{timeframe}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTimeframeMenu ? 'rotate-180' : ''} ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`} />
        </button>

        {showTimeframeMenu && (
          <div style={dropdownStyle} className={`absolute bottom-full left-0 mb-1 rounded-lg overflow-hidden min-w-[160px] animate-scale-in ${dropdownClass}`}>
            <div className="p-2">
              <div className={`text-[10px] font-semibold mb-1.5 px-1 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>SELECT TIMEFRAME</div>
              <div className="grid grid-cols-2 gap-1">
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => { onTimeframeChange(tf); setShowTimeframeMenu(false) }}
                    disabled={isLoading}
                    className={`px-2 py-1.5 text-xs font-bold rounded transition-all disabled:opacity-50 ${dropdownItem(timeframe === tf)}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart type pill */}
      <div className="relative" ref={chartTypeRef}>
        <button
          onClick={() => { setShowChartTypeMenu(!showChartTypeMenu); setShowTimeframeMenu(false) }}
          disabled={isLoading}
          style={pillStyle}
          className={`h-10 w-10 rounded-full hover:brightness-95 transition-all disabled:opacity-50 flex items-center justify-center ${pillClass}`}
          title={chartType === 'candle' ? 'Candlestick Chart' : 'Line Chart'}
        >
          {chartType === 'candle'
            ? <BarChart2 className={`w-4 h-4 ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`} />
            : <Activity  className={`w-4 h-4 ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`} />
          }
        </button>

        {showChartTypeMenu && (
          <div style={dropdownStyle} className={`absolute bottom-full left-0 mb-1 rounded-lg overflow-hidden min-w-[140px] animate-scale-in ${dropdownClass}`}>
            <div className="p-2">
              <div className={`text-[10px] font-semibold mb-1.5 px-1 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>CHART TYPE</div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { onChartTypeChange('candle'); setShowChartTypeMenu(false) }}
                  disabled={isLoading}
                  className={`px-3 py-2 text-xs font-semibold rounded transition-all flex items-center gap-2 ${dropdownItem(chartType === 'candle')}`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  Candlestick
                </button>
                <button
                  onClick={() => { onChartTypeChange('line'); setShowChartTypeMenu(false) }}
                  disabled={isLoading}
                  className={`px-3 py-2 text-xs font-semibold rounded transition-all flex items-center gap-2 ${dropdownItem(chartType === 'line')}`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Line
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Indicators pill */}
      <button
        onClick={onOpenIndicators}
        disabled={isLoading}
        style={pillStyle}
        className={`h-10 w-10 rounded-full hover:brightness-95 transition-all disabled:opacity-50 flex items-center justify-center ${pillClass}`}
        title="Indicators"
      >
        <ChartLine weight="bold" className={`w-4 h-4 ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`} />
      </button>

      {/* Drawing tools pill */}
      <button
        onClick={onToggleDrawing}
        disabled={isLoading}
        style={drawingEnabled
          ? { backgroundColor: '#3b82f6', border: '1.5px solid #3b82f6', boxShadow: '0 1px 4px rgba(59,130,246,0.4)' }
          : pillStyle
        }
        className={`h-10 w-10 rounded-full hover:brightness-95 transition-all disabled:opacity-50 flex items-center justify-center ${drawingEnabled ? '' : pillClass}`}
        title="Drawing Tools"
      >
        <PencilSimpleLine weight="bold" className={`w-4 h-4 ${drawingEnabled ? 'text-white' : isLightMode ? 'text-slate-700' : 'text-gray-300'}`} />
      </button>

      {/* Countdown pill */}
      <div
        style={pillStyle}
        className={`h-10 px-3 rounded-full flex items-center gap-1 ${pillClass}`}
      >
        <span className={`text-sm font-light tabular-nums ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
          {formatCd(countdownSecs)}
        </span>
      </div>
    </div>
  )
})

MobileControls.displayName = 'MobileControls'

const DesktopControls = memo(({
  timeframe,
  chartType,
  isLoading,
  onTimeframeChange,
  onChartTypeChange,
  onFitContent,
  onRefresh,
  onToggleFullscreen,
  onOpenIndicators,
  onToggleDrawing,
  drawingEnabled,
  isFullscreen,
  isLightMode,
}: any) => {
  const [showTimeframeMenu, setShowTimeframeMenu] = useState(false)
  const timeframeRef = useRef<HTMLDivElement>(null)

  const timeframes: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d']

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeframeRef.current && !timeframeRef.current.contains(event.target as Node)) {
        setShowTimeframeMenu(false)
      }
    }

    if (showTimeframeMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTimeframeMenu])

  const toolbarBg    = isLightMode ? 'bg-white/90 backdrop-blur-md border border-gray-200 shadow-sm' : 'bg-black/20 backdrop-blur-md border border-white/10'
  const btnInactive  = isLightMode ? 'text-slate-600 hover:text-slate-900 hover:bg-gray-100' : 'text-gray-300 hover:text-white hover:bg-white/10'
  const btnActive    = 'bg-blue-500 !text-white shadow-sm'
  const dropdownBg   = isLightMode ? 'bg-white border border-gray-200 shadow-lg' : 'bg-[#0f1419] border border-gray-800/50 shadow-2xl'
  const dropdownItem = (active: boolean) => active
    ? btnActive
    : isLightMode ? 'text-slate-700 hover:bg-gray-100' : 'text-gray-300 hover:bg-[#1a1f2e]'

  return (
    <div className="hidden lg:block absolute top-2 right-24 z-10">
      <div className="flex items-center gap-2">
        {/* Timeframe */}
        <div className="relative" ref={timeframeRef}>
          <button
            onClick={() => setShowTimeframeMenu(!showTimeframeMenu)}
            disabled={isLoading}
            className={`p-2.5 rounded-full hover:brightness-95 transition-all flex items-center gap-1.5 disabled:opacity-50 ${toolbarBg}`}
            title="Timeframe"
          >
            <Clock className={`w-5 h-5 ${isLightMode ? 'text-blue-500' : 'text-gray-300'}`} />
            <span className={`text-base font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{timeframe}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showTimeframeMenu ? 'rotate-180' : ''} ${isLightMode ? 'text-slate-400' : 'text-gray-400'}`} />
          </button>

          {showTimeframeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowTimeframeMenu(false)} />
              <div className={`absolute top-full right-0 mt-1 rounded-lg z-50 overflow-hidden min-w-[120px] ${dropdownBg}`}>
                {timeframes.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => { onTimeframeChange(tf); setShowTimeframeMenu(false) }}
                    disabled={isLoading}
                    className={`w-full px-4 py-2.5 text-left text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${dropdownItem(timeframe === tf)}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Chart type */}
        <div className={`flex items-center gap-1 rounded-full p-1 ${toolbarBg}`}>
          <button
            onClick={() => onChartTypeChange('candle')}
            disabled={isLoading}
            className={`p-2 rounded-full transition-all ${chartType === 'candle' ? btnActive : btnInactive}`}
            title="Candlestick"
          >
            <BarChart2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onChartTypeChange('line')}
            disabled={isLoading}
            className={`p-2 rounded-full transition-all ${chartType === 'line' ? btnActive : btnInactive}`}
            title="Line"
          >
            <Activity className="w-5 h-5" />
          </button>
        </div>

        {/* Tools */}
        <div className={`flex items-center gap-1 rounded-full p-1 ${toolbarBg}`}>
          <button
            onClick={onOpenIndicators}
            disabled={isLoading}
            className={`p-2 rounded-full transition-colors disabled:opacity-50 ${btnInactive}`}
            title="Indicators"
          >
            <ChartLine weight="bold" className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleDrawing}
            disabled={isLoading}
            className={`p-2 rounded-full transition-colors disabled:opacity-50 ${drawingEnabled ? btnActive : btnInactive}`}
            title="Drawing Tools"
          >
            <PencilSimpleLine weight="bold" className="w-5 h-5" />
          </button>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`p-2 rounded-full transition-colors disabled:opacity-50 ${btnInactive}`}
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onToggleFullscreen}
            className={`p-2 rounded-full transition-colors ${btnInactive}`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  )
})

DesktopControls.displayName = 'DesktopControls'

const TradingChart = memo(({ activeOrders = [], currentPrice, assets = [], onAssetSelect, isLightMode = false }: TradingChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const lineSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const candleAnimatorRef = useRef<SmoothCandleAnimator | null>(null)
  const { setChart, setSeries, priceToPixel } = useChartPriceScale()




  const [nowMs, setNowMs] = useState<number>(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 100)
    return () => clearInterval(id)
  }, [])
  const nowSeconds = Math.floor(nowMs / 1000)


  const savedVisibleRangeRef = useRef<{ from: number; to: number } | null>(null)
  const targetVisibleRangeRef = useRef<{ from: number; to: number } | null>(null)
  const preservePositionModeRef = useRef<boolean>(false)
  const positionRestoreAttemptsRef = useRef<number>(0)


  const safeSetChartData = useCallback((
    candleData: Array<{ time: UTCTimestamp; open: number; high: number; low: number; close: number }>,
    options: {
      preservePosition?: boolean;
      skipDefaultZoom?: boolean;
    } = {}
  ) => {
    const {
      preservePosition = true,
      skipDefaultZoom = false
    } = options;

    if (!chartRef.current || !candleSeriesRef.current || !lineSeriesRef.current) {
      return;
    }

    let savedRange: { from: number; to: number } | null = null;


    if (preservePosition) {
      try {
        const timeScale = chartRef.current.timeScale();
        const visibleRange = timeScale.getVisibleLogicalRange();
        if (visibleRange) {
          savedRange = { from: visibleRange.from, to: visibleRange.to };
          targetVisibleRangeRef.current = savedRange;
          preservePositionModeRef.current = true;
          positionRestoreAttemptsRef.current = 0;
        }
      } catch (error) {
        console.warn('Failed to save position:', error);
      }
    }


    try {
      candleSeriesRef.current.setData(candleData);
      lineSeriesRef.current.setData(candleData.map(bar => ({
        time: bar.time,
        value: bar.close
      })));
    } catch (error) {
      console.error('Failed to update chart data:', error);
      return;
    }


    const attemptRestore = (attempt: number = 0) => {
      const timeScale = chartRef.current?.timeScale();
      if (!timeScale) return;

      try {
        if (savedRange && preservePosition) {
          timeScale.setVisibleLogicalRange(savedRange);
        } else if (!skipDefaultZoom && !preservePositionModeRef.current) {

          if (candleData.length > 60) {
            timeScale.setVisibleLogicalRange({
              from: candleData.length - 60,
              to: candleData.length - 1
            });
          } else {
            timeScale.fitContent();
          }
        }
      } catch (error) {
        console.warn(`Failed to restore/set position (attempt ${attempt + 1}):`, error);
      }
    };


    requestAnimationFrame(() => attemptRestore(0));


    if (preservePosition && savedRange) {
      setTimeout(() => attemptRestore(1), 100);
      setTimeout(() => {
        attemptRestore(2);
        preservePositionModeRef.current = false;
      }, 300);
    }
  }, []);

  const smaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const emaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const bollingerUpperRef = useRef<ISeriesApi<"Line"> | null>(null)
  const bollingerMiddleRef = useRef<ISeriesApi<"Line"> | null>(null)
  const bollingerLowerRef = useRef<ISeriesApi<"Line"> | null>(null)


  const rsiChartRef = useRef<IChartApi | null>(null)
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
  const rsiOverboughtRef = useRef<ISeriesApi<"Line"> | null>(null)
  const rsiOversoldRef = useRef<ISeriesApi<"Line"> | null>(null)

  const macdChartRef = useRef<IChartApi | null>(null)
  const macdLineRef = useRef<ISeriesApi<"Line"> | null>(null)
  const macdSignalRef = useRef<ISeriesApi<"Line"> | null>(null)
  const macdHistogramRef = useRef<ISeriesApi<"Histogram"> | null>(null)

  const stochasticChartRef = useRef<IChartApi | null>(null)
  const stochasticKRef = useRef<ISeriesApi<"Line"> | null>(null)
  const stochasticDRef = useRef<ISeriesApi<"Line"> | null>(null)
  const stochasticOverboughtRef = useRef<ISeriesApi<"Line"> | null>(null)
  const stochasticOversoldRef = useRef<ISeriesApi<"Line"> | null>(null)

  const atrChartRef = useRef<IChartApi | null>(null)
  const atrSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)

  const rsiContainerRef = useRef<HTMLDivElement>(null)
  const macdContainerRef = useRef<HTMLDivElement>(null)
  const stochasticContainerRef = useRef<HTMLDivElement>(null)
  const atrContainerRef = useRef<HTMLDivElement>(null)


const wmaSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
const keltnerUpperRef = useRef<ISeriesApi<"Line"> | null>(null)
const keltnerMiddleRef = useRef<ISeriesApi<"Line"> | null>(null)
const keltnerLowerRef = useRef<ISeriesApi<"Line"> | null>(null)
const donchianUpperRef = useRef<ISeriesApi<"Line"> | null>(null)
const donchianMiddleRef = useRef<ISeriesApi<"Line"> | null>(null)
const donchianLowerRef = useRef<ISeriesApi<"Line"> | null>(null)
const ichimokuTenkanRef = useRef<ISeriesApi<"Line"> | null>(null)
const ichimokuKijunRef = useRef<ISeriesApi<"Line"> | null>(null)
const ichimokuSpanARef = useRef<ISeriesApi<"Line"> | null>(null)
const ichimokuSpanBRef = useRef<ISeriesApi<"Line"> | null>(null)
const vwapSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
const parabolicSarSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
const supertrendSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)

const adxChartRef = useRef<IChartApi | null>(null)
const adxSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
const adxContainerRef = useRef<HTMLDivElement>(null)

const cciChartRef = useRef<IChartApi | null>(null)
const cciSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
const cciContainerRef = useRef<HTMLDivElement>(null)

const williamsRChartRef = useRef<IChartApi | null>(null)
const williamsRSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
const williamsRContainerRef = useRef<HTMLDivElement>(null)

const mfiChartRef = useRef<IChartApi | null>(null)
const mfiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
const mfiContainerRef = useRef<HTMLDivElement>(null)

const aroonChartRef = useRef<IChartApi | null>(null)
const aroonUpRef = useRef<ISeriesApi<"Line"> | null>(null)
const aroonDownRef = useRef<ISeriesApi<"Line"> | null>(null)
const aroonContainerRef = useRef<HTMLDivElement>(null)

const trixChartRef = useRef<IChartApi | null>(null)
const trixSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
const trixContainerRef = useRef<HTMLDivElement>(null)

const obvChartRef = useRef<IChartApi | null>(null)
const obvSeriesRef = useRef<ISeriesApi<"Line"> | null>(null)
const obvContainerRef = useRef<HTMLDivElement>(null)

const elderRayChartRef = useRef<IChartApi | null>(null)
const elderRayBullRef = useRef<ISeriesApi<"Histogram"> | null>(null)
const elderRayBearRef = useRef<ISeriesApi<"Histogram"> | null>(null)
const elderRayContainerRef = useRef<HTMLDivElement>(null)

  // ===== LIGHT MODE THEME EFFECT =====
  useEffect(() => {
    const darkTheme = {
      layout: { background: { type: ColorType.Solid, color: 'rgba(10, 14, 23, 0)' }, textColor: '#9ca3af' },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.12)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.12)' },
      },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
      timeScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
    }
    const lightTheme = {
      layout: { background: { type: ColorType.Solid, color: 'rgba(248, 250, 252, 0)' }, textColor: '#374151' },
      grid: {
        vertLines: { color: 'rgba(0, 0, 0, 0.07)' },
        horzLines: { color: 'rgba(0, 0, 0, 0.07)' },
      },
      rightPriceScale: { borderColor: 'rgba(0, 0, 0, 0.15)' },
      timeScale: { borderColor: 'rgba(0, 0, 0, 0.15)' },
    }
    const theme = isLightMode ? lightTheme : darkTheme
    const subGridTheme = isLightMode
      ? { ...lightTheme, grid: { vertLines: { color: 'rgba(0,0,0,0.04)' }, horzLines: { color: 'rgba(0,0,0,0.04)' } } }
      : { ...darkTheme, grid: { vertLines: { color: 'rgba(255,255,255,0.05)' }, horzLines: { color: 'rgba(255,255,255,0.05)' } } }

    const allCharts = [
      chartRef.current,
      rsiChartRef.current,
      macdChartRef.current,
      stochasticChartRef.current,
      atrChartRef.current,
      adxChartRef.current,
      cciChartRef.current,
      williamsRChartRef.current,
      mfiChartRef.current,
      aroonChartRef.current,
      trixChartRef.current,
      obvChartRef.current,
      elderRayChartRef.current,
    ]
    allCharts.forEach((c, i) => {
      if (c) {
        try { c.applyOptions(i === 0 ? theme : subGridTheme) } catch (_) {}
      }
    })
  }, [isLightMode])

  const isMountedRef = useRef(false)
  const cleanupFunctionsRef = useRef<Array<() => void>>([])
  const currentBarRef = useRef<CandleData | null>(null)
  const lastUpdateTimeRef = useRef<number>(0)
  const previousAssetIdRef = useRef<string | null>(null)
  const previousTimeframeRef = useRef<Timeframe>('1m')

  const loadingManagerRef = useRef(new LoadingStateManager())

  const { selectedAsset } = useTradingStore()
  const { setSelectedAsset } = useTradingActions()
  const storeAssets = useTradingStore(state => state.assets)
  const availableAssets = assets.length > 0 ? assets : storeAssets || []

  const [chartType, setChartType] = useState<ChartType>('candle')
  const [timeframe, setTimeframe] = useState<Timeframe>('1m')
  const [isLoading, setIsLoading] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [openingPrice, setOpeningPrice] = useState<number | null>(null)
  const [simulatorStatus, setSimulatorStatus] = useState<any>(null)
  const [showIndicators, setShowIndicators] = useState(false)
  const [indicatorConfig, setIndicatorConfig] = useState<IndicatorConfig>(DEFAULT_INDICATOR_CONFIG)
  const [ohlcData, setOhlcData] = useState<any>(null)
  const [showOhlc, setShowOhlc] = useState(false)
  const [showAssetMenu, setShowAssetMenu] = useState(false)

  const [prefetchedAssets, setPrefetchedAssets] = useState<Set<string>>(new Set())
  const [currentChartData, setCurrentChartData] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)
  const [showDrawingTools, setShowDrawingTools] = useState(false)
  const [drawingPanelOpen, setDrawingPanelOpen] = useState(false)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const [referralCopied, setReferralCopied] = useState(false)
  const [referralCode, setReferralCode] = useState<string | null>(null)
  const [referralLoading, setReferralLoading] = useState(false)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    loadingManagerRef.current.setCallback(setIsLoading)

    return () => {
      loadingManagerRef.current.reset()
    }
  }, [])

  const addCleanup = useCallback((fn: () => void) => {
    cleanupFunctionsRef.current.push(fn)
  }, [])

  const cleanupAll = useCallback(() => {
    loadingManagerRef.current.reset()

    cleanupFunctionsRef.current.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    })
    cleanupFunctionsRef.current = []

    currentBarRef.current = null
    lastUpdateTimeRef.current = 0
  }, [])

  const isLoadingDataRef = useRef(false)

  const checkSimulator = useCallback(async () => {
    if (!selectedAsset?.realtimeDbPath) return

    const status = await checkSimulatorStatus(selectedAsset.realtimeDbPath)
    setSimulatorStatus(status)
  }, [selectedAsset?.realtimeDbPath])

  const toggleFullscreen = useCallback(async () => {
    const container = fullscreenContainerRef.current
    if (!container) return

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const prefetchAllTimeframes = useCallback(async (assetId: string, assetPath: string) => {
    if (prefetchedAssets.has(assetId)) {
      return
    }

    try {
      const allTimeframes = [...TIMEFRAMES]
      const timeframesToPrefetch = allTimeframes.filter(tf => tf !== timeframe)

      const prefetchPromises = timeframesToPrefetch.map(tf =>
        fetchHistoricalData(assetPath, tf as Timeframe)
          .then(data => {
            if (data.length > 0) {
              setCachedData(assetId, tf as Timeframe, data)
            }
            return { timeframe: tf, success: true, bars: data.length }
          })
          .catch(error => {
            return { timeframe: tf, success: false, error: error.message }
          })
      )

      await Promise.allSettled(prefetchPromises)

      setPrefetchedAssets(prev => new Set(prev).add(assetId))

    } catch (error) {
      console.error('Full prefetch error:', error)
    }
  }, [prefetchedAssets, timeframe])

  useEffect(() => {
    if (!selectedAsset?.realtimeDbPath) return

    const prefetch = async () => {
      const assetPath = cleanAssetPath(selectedAsset.realtimeDbPath!)
      const criticalTimeframes = ['1m', '5m', '15m']

      await prefetchMultipleTimeframes(assetPath, criticalTimeframes as Timeframe[])
        .catch(err => console.log('Critical prefetch failed:', err.message))
    }

    const timer = setTimeout(prefetch, 500)
    return () => clearTimeout(timer)
  }, [selectedAsset?.id, selectedAsset?.realtimeDbPath])

  const fetchCurrentPriceImmediately = useCallback(async () => {
    if (!selectedAsset?.realtimeDbPath) return

    try {
      const assetPath = cleanAssetPath(selectedAsset.realtimeDbPath)
      const priceData = await get(ref(database, `${assetPath}/current_price`))

      if (priceData.exists()) {
        const data = priceData.val()
        setLastPrice(data.price)
        setOpeningPrice(data.price)
        lastUpdateTimeRef.current = Date.now()
      }
    } catch (error) {
      console.warn('Immediate price fetch failed:', error)
    }
  }, [selectedAsset?.realtimeDbPath])

  useEffect(() => {
    if (selectedAsset && isInitialized) {
      fetchCurrentPriceImmediately()
    }
  }, [selectedAsset?.id, isInitialized, fetchCurrentPriceImmediately])


  useEffect(() => {
    if (!selectedAsset?.id || !isInitialized) return
    if (!candleSeriesRef.current || !lineSeriesRef.current) return

    const assetId = selectedAsset.id
    let lastCompletedTimestamp: number | null = null


    const completedBarsSet = new Set<number>()

    const handleOHLCUpdate = (data: OHLCUpdate) => {
      const currentBar = data.currentBars?.[timeframe]
      const completedBar = data.completedBars?.[timeframe]


      if (completedBar && completedBar.timestamp !== lastCompletedTimestamp) {
        lastCompletedTimestamp = completedBar.timestamp
        completedBarsSet.add(completedBar.timestamp)


        const cacheKey = `${assetId}-${timeframe}`
        GLOBAL_DATA_CACHE.delete(cacheKey)


        try {
          const completedChartCandle = {
            time: completedBar.timestamp as UTCTimestamp,
            open: completedBar.open,
            high: completedBar.high,
            low: completedBar.low,
            close: completedBar.close,
          }
          candleSeriesRef.current?.update(completedChartCandle)
          lineSeriesRef.current?.update({
            time: completedChartCandle.time,
            value: completedChartCandle.close,
          })
        } catch (error) {
          console.warn('Completed bar update error:', error)
        }
      }


      if (!currentBar) return

      const barTimestamp = currentBar.timestamp


      if (completedBarsSet.has(barTimestamp)) return

      const isNewBar = !currentBarRef.current || currentBarRef.current.timestamp !== barTimestamp

      if (isNewBar) {
        currentBarRef.current = {
          timestamp: barTimestamp,
          open: currentBar.open,
          high: currentBar.high,
          low: currentBar.low,
          close: currentBar.close,
          volume: currentBar.volume || 0,
        }
      } else {
        currentBarRef.current = {
          ...currentBarRef.current!,
          high: Math.max(currentBarRef.current!.high, currentBar.high),
          low: Math.min(currentBarRef.current!.low, currentBar.low),
          close: currentBar.close,
          volume: currentBar.volume || 0,
        }
      }

      if (!currentBarRef.current) return

      if (candleAnimatorRef.current) {
        candleAnimatorRef.current.updateCandle(currentBarRef.current)
      } else {
        try {
          candleSeriesRef.current?.update({
            time: currentBarRef.current.timestamp as UTCTimestamp,
            open: currentBarRef.current.open,
            high: currentBarRef.current.high,
            low: currentBarRef.current.low,
            close: currentBarRef.current.close,
          })
          lineSeriesRef.current?.update({
            time: currentBarRef.current.timestamp as UTCTimestamp,
            value: currentBarRef.current.close,
          })
        } catch (error) {
          console.warn('Live bar update error:', error)
        }
      }

      setLastPrice(currentBar.close)
      lastUpdateTimeRef.current = Date.now()
    }

    const unsubscribe = websocketService.subscribeToOHLC(assetId, handleOHLCUpdate)

    return () => {
      unsubscribe()
      completedBarsSet.clear()
    }
  }, [selectedAsset?.id, timeframe, isInitialized])


  useEffect(() => {
    if (isMountedRef.current) return

    const container = chartContainerRef.current
    if (!container) return

    const { width, height } = container.getBoundingClientRect()
    if (width === 0 || height === 0) return

    isMountedRef.current = true

    try {
      const chart = createChart(container, {
        width,
        height,
        layout: { background: { type: ColorType.Solid, color: 'rgba(10, 14, 23, 0)' }, textColor: '#9ca3af' },
        grid: {
          vertLines: { color: 'rgba(255, 255, 255, 0.12)', style: 0, visible: true },
          horzLines: { color: 'rgba(255, 255, 255, 0.12)', style: 0, visible: true }
        },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
        timeScale: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
          timeVisible: true,
          secondsVisible: timeframe === '1s' || timeframe === '1m',
          tickMarkFormatter: (time: UTCTimestamp, tickMarkType: any, locale: string) => {

            const date = new Date((time as number) * 1000);
            const wibDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));

            const hours = String(wibDate.getHours()).padStart(2, '0');
            const minutes = String(wibDate.getMinutes()).padStart(2, '0');
            const seconds = String(wibDate.getSeconds()).padStart(2, '0');
            const day = String(wibDate.getDate()).padStart(2, '0');
            const month = String(wibDate.getMonth() + 1).padStart(2, '0');


            if (timeframe === '1s' || timeframe === '1m' || timeframe === '5m') {
              return `${hours}:${minutes}${timeframe === '1s' ? ':' + seconds : ''}`;
            } else if (timeframe === '1d') {
              return `${day}/${month}`;
            } else {
              return `${hours}:${minutes}`;
            }
          }
        },
        localization: {
          locale: 'id-ID',
          dateFormat: 'dd/MM/yyyy',

          timeFormatter: (time: UTCTimestamp) => {
            return formatWIBTime(time as number, timeframe === '1s');
          }
        }
      })

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#10b981',
        downColor: '#ef4444',
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
        visible: chartType === 'candle',
        priceFormat: {
          type: 'price',
          precision: 4,
          minMove: 0.0001,
        },
      })

      const lineSeries = chart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        visible: chartType === 'line',
        priceFormat: {
          type: 'price',
          precision: 4,
          minMove: 0.0001,
        },
      })

      chart.subscribeCrosshairMove((param) => {
        if (!param || !param.point || !param.time) {
          setShowOhlc(false)
          return
        }

        const data = candleSeries.dataByIndex(Math.round(param.logical as number))
        if (data && 'open' in data && 'high' in data && 'low' in data && 'close' in data) {
          setOhlcData({
            time: param.time as number,
            open: (data as any).open,
            high: (data as any).high,
            low: (data as any).low,
            close: (data as any).close
          })
          setShowOhlc(true)
        } else {
          setShowOhlc(false)
        }
      })

      chartRef.current = chart
      candleSeriesRef.current = candleSeries
      lineSeriesRef.current = lineSeries

      setChart(chart)
      setSeries(chartType === 'candle' ? candleSeries : lineSeries)

      candleAnimatorRef.current = new SmoothCandleAnimator(
        (animatedCandle) => {
          const chartCandle = {
            time: animatedCandle.timestamp as UTCTimestamp,
            open: animatedCandle.open,
            high: animatedCandle.high,
            low: animatedCandle.low,
            close: animatedCandle.close,
          }

          try {
            candleSeriesRef.current?.update(chartCandle)
            lineSeriesRef.current?.update({
              time: chartCandle.time,
              value: chartCandle.close
            })
          } catch (e) {
            console.warn('Chart update error:', e)
          }
        },
        300
      )

      setIsInitialized(true)

      const handleResize = () => {
        if (container && chart) {
          const { width, height } = container.getBoundingClientRect()
          if (width > 0 && height > 0) {
            chart.applyOptions({ width, height })
          }
        }
      }

      window.addEventListener('resize', handleResize)
      addCleanup(() => window.removeEventListener('resize', handleResize))

      return () => {
        cleanupAll()
        isMountedRef.current = false
        setIsInitialized(false)

        // Null out refs BEFORE chart.remove() agar DrawingTools tidak
        // memanggil method pada series/chart yang sudah di-dispose → "Object is disposed"
        candleSeriesRef.current = null
        lineSeriesRef.current = null
        chartRef.current = null

        if (smaSeriesRef.current) { try { chart.removeSeries(smaSeriesRef.current) } catch (_) {} smaSeriesRef.current = null }
        if (emaSeriesRef.current) { try { chart.removeSeries(emaSeriesRef.current) } catch (_) {} emaSeriesRef.current = null }
        if (bollingerUpperRef.current) { try { chart.removeSeries(bollingerUpperRef.current) } catch (_) {} bollingerUpperRef.current = null }
        if (bollingerMiddleRef.current) { try { chart.removeSeries(bollingerMiddleRef.current) } catch (_) {} bollingerMiddleRef.current = null }
        if (bollingerLowerRef.current) { try { chart.removeSeries(bollingerLowerRef.current) } catch (_) {} bollingerLowerRef.current = null }

        try {
          candleAnimatorRef.current?.stop()
          chart.remove()
        } catch (e) {
          console.error('Chart removal error:', e)
        }
      }
    } catch (err: any) {
      console.error('Chart init error:', err)
      isMountedRef.current = false
    }
  }, [chartType, addCleanup, cleanupAll, setChart, setSeries])


  useEffect(() => {
    if (!isInitialized) return

    const hasOscillators =
      indicatorConfig.rsi?.enabled ||
      indicatorConfig.macd?.enabled ||
      indicatorConfig.stochastic?.enabled ||
      indicatorConfig.atr?.enabled ||
      indicatorConfig.adx?.enabled ||
      indicatorConfig.cci?.enabled ||
      indicatorConfig.williamsR?.enabled ||
      indicatorConfig.mfi?.enabled ||
      indicatorConfig.aroon?.enabled ||
      indicatorConfig.trix?.enabled ||
      indicatorConfig.obv?.enabled ||
      indicatorConfig.elderRay?.enabled

    if (!hasOscillators) {

      if (rsiChartRef.current) {
        rsiChartRef.current.remove()
        rsiChartRef.current = null
        rsiSeriesRef.current = null
        rsiOverboughtRef.current = null
        rsiOversoldRef.current = null
      }
      if (macdChartRef.current) {
        macdChartRef.current.remove()
        macdChartRef.current = null
        macdLineRef.current = null
        macdSignalRef.current = null
        macdHistogramRef.current = null
      }
      if (stochasticChartRef.current) {
        stochasticChartRef.current.remove()
        stochasticChartRef.current = null
        stochasticKRef.current = null
        stochasticDRef.current = null
        stochasticOverboughtRef.current = null
        stochasticOversoldRef.current = null
      }
      if (atrChartRef.current) {
        atrChartRef.current.remove()
        atrChartRef.current = null
        atrSeriesRef.current = null
      }
      return
    }

    const chartOptions = {
      layout: { background: { type: ColorType.Solid, color: 'rgba(10, 14, 23, 0)' }, textColor: '#9ca3af' },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)', style: 0, visible: true },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)', style: 0, visible: true }
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: 'rgba(255, 255, 255, 0.1)' },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.1)',
        timeVisible: true,
        secondsVisible: timeframe === '1s' || timeframe === '1m',
        visible: false,
        tickMarkFormatter: (time: UTCTimestamp, tickMarkType: any, locale: string) => {

          const date = new Date((time as number) * 1000);
          const wibDate = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));

          const hours = String(wibDate.getHours()).padStart(2, '0');
          const minutes = String(wibDate.getMinutes()).padStart(2, '0');
          const seconds = String(wibDate.getSeconds()).padStart(2, '0');
          const day = String(wibDate.getDate()).padStart(2, '0');
          const month = String(wibDate.getMonth() + 1).padStart(2, '0');


          if (timeframe === '1s' || timeframe === '1m' || timeframe === '5m') {
            return `${hours}:${minutes}${timeframe === '1s' ? ':' + seconds : ''}`;
          } else if (timeframe === '1d') {
            return `${day}/${month}`;
          } else {
            return `${hours}:${minutes}`;
          }
        }
      },
      localization: {
        locale: 'id-ID',
        dateFormat: 'dd/MM/yyyy',

        timeFormatter: (time: UTCTimestamp) => {
          return formatWIBTime(time as number, timeframe === '1s');
        }
      }
    }


    if (indicatorConfig.rsi?.enabled && rsiContainerRef.current && !rsiChartRef.current) {
      const { width } = rsiContainerRef.current.getBoundingClientRect()
      const rsiChart = createChart(rsiContainerRef.current, {
        ...chartOptions,
        width,
        height: 120
      })

      const rsiSeries = rsiChart.addLineSeries({
        color: '#8b5cf6',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true
      })

      const overboughtLine = rsiChart.addLineSeries({
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false
      })

      const oversoldLine = rsiChart.addLineSeries({
        color: '#10b981',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false
      })

      rsiChart.timeScale().fitContent()
      if (chartRef.current) {
        rsiChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
          const range = rsiChart.timeScale().getVisibleLogicalRange()
          if (range && chartRef.current) {
            chartRef.current.timeScale().setVisibleLogicalRange(range)
          }
        })
      }

      rsiChartRef.current = rsiChart
      rsiSeriesRef.current = rsiSeries
      rsiOverboughtRef.current = overboughtLine
      rsiOversoldRef.current = oversoldLine
    }


    if (indicatorConfig.macd?.enabled && macdContainerRef.current && !macdChartRef.current) {
      const { width } = macdContainerRef.current.getBoundingClientRect()
      const macdChart = createChart(macdContainerRef.current, {
        ...chartOptions,
        width,
        height: 120
      })

      const macdLine = macdChart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true
      })

      const signalLine = macdChart.addLineSeries({
        color: '#f59e0b',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true
      })

      const histogram = macdChart.addHistogramSeries({
        color: '#60a5fa',
        priceLineVisible: false,
        lastValueVisible: false
      })

      macdChart.timeScale().fitContent()
      if (chartRef.current) {
        macdChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
          const range = macdChart.timeScale().getVisibleLogicalRange()
          if (range && chartRef.current) {
            chartRef.current.timeScale().setVisibleLogicalRange(range)
          }
        })
      }

      macdChartRef.current = macdChart
      macdLineRef.current = macdLine
      macdSignalRef.current = signalLine
      macdHistogramRef.current = histogram
    }


    if (indicatorConfig.stochastic?.enabled && stochasticContainerRef.current && !stochasticChartRef.current) {
      const { width } = stochasticContainerRef.current.getBoundingClientRect()
      const stochChart = createChart(stochasticContainerRef.current, {
        ...chartOptions,
        width,
        height: 120
      })

      const kLine = stochChart.addLineSeries({
        color: '#3b82f6',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true
      })

      const dLine = stochChart.addLineSeries({
        color: '#f59e0b',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true
      })

      const overboughtLine = stochChart.addLineSeries({
        color: '#ef4444',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false
      })

      const oversoldLine = stochChart.addLineSeries({
        color: '#10b981',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false
      })

      stochChart.timeScale().fitContent()
      if (chartRef.current) {
        stochChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
          const range = stochChart.timeScale().getVisibleLogicalRange()
          if (range && chartRef.current) {
            chartRef.current.timeScale().setVisibleLogicalRange(range)
          }
        })
      }

      stochasticChartRef.current = stochChart
      stochasticKRef.current = kLine
      stochasticDRef.current = dLine
      stochasticOverboughtRef.current = overboughtLine
      stochasticOversoldRef.current = oversoldLine
    }


    if (indicatorConfig.atr?.enabled && atrContainerRef.current && !atrChartRef.current) {
      const { width } = atrContainerRef.current.getBoundingClientRect()
      const atrChart = createChart(atrContainerRef.current, {
        ...chartOptions,
        width,
        height: 120
      })

      const atrSeries = atrChart.addLineSeries({
        color: '#ec4899',
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true
      })

      atrChart.timeScale().fitContent()
      if (chartRef.current) {
        atrChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
          const range = atrChart.timeScale().getVisibleLogicalRange()
          if (range && chartRef.current) {
            chartRef.current.timeScale().setVisibleLogicalRange(range)
          }
        })
      }

      atrChartRef.current = atrChart
      atrSeriesRef.current = atrSeries
    }

    if (indicatorConfig.adx?.enabled && adxContainerRef.current && !adxChartRef.current) {
  const { width } = adxContainerRef.current.getBoundingClientRect()
  const adxChart = createChart(adxContainerRef.current, {
    ...chartOptions,
    width,
    height: 120
  })

  const adxSeries = adxChart.addLineSeries({
    color: '#3b82f6',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: true
  })

  adxChart.timeScale().fitContent()
  if (chartRef.current) {
    adxChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      const range = adxChart.timeScale().getVisibleLogicalRange()
      if (range && chartRef.current) {
        chartRef.current.timeScale().setVisibleLogicalRange(range)
      }
    })
  }

  adxChartRef.current = adxChart
  adxSeriesRef.current = adxSeries
}

if (indicatorConfig.cci?.enabled && cciContainerRef.current && !cciChartRef.current) {
  const { width } = cciContainerRef.current.getBoundingClientRect()
  const cciChart = createChart(cciContainerRef.current, {
    ...chartOptions,
    width,
    height: 120
  })

  const cciSeries = cciChart.addLineSeries({
    color: '#f59e0b',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: true
  })

  cciChart.timeScale().fitContent()
  if (chartRef.current) {
    cciChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      const range = cciChart.timeScale().getVisibleLogicalRange()
      if (range && chartRef.current) {
        chartRef.current.timeScale().setVisibleLogicalRange(range)
      }
    })
  }

  cciChartRef.current = cciChart
  cciSeriesRef.current = cciSeries
}

if (indicatorConfig.williamsR?.enabled && williamsRContainerRef.current && !williamsRChartRef.current) {
  const { width } = williamsRContainerRef.current.getBoundingClientRect()
  const williamsRChart = createChart(williamsRContainerRef.current, {
    ...chartOptions,
    width,
    height: 120
  })

  const williamsRSeries = williamsRChart.addLineSeries({
    color: '#10b981',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: true
  })

  williamsRChart.timeScale().fitContent()
  if (chartRef.current) {
    williamsRChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      const range = williamsRChart.timeScale().getVisibleLogicalRange()
      if (range && chartRef.current) {
        chartRef.current.timeScale().setVisibleLogicalRange(range)
      }
    })
  }

  williamsRChartRef.current = williamsRChart
  williamsRSeriesRef.current = williamsRSeries
}

if (indicatorConfig.mfi?.enabled && mfiContainerRef.current && !mfiChartRef.current) {
  const { width } = mfiContainerRef.current.getBoundingClientRect()
  const mfiChart = createChart(mfiContainerRef.current, {
    ...chartOptions,
    width,
    height: 120
  })

  const mfiSeries = mfiChart.addLineSeries({
    color: '#8b5cf6',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: true
  })

  mfiChart.timeScale().fitContent()
  if (chartRef.current) {
    mfiChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      const range = mfiChart.timeScale().getVisibleLogicalRange()
      if (range && chartRef.current) {
        chartRef.current.timeScale().setVisibleLogicalRange(range)
      }
    })
  }

  mfiChartRef.current = mfiChart
  mfiSeriesRef.current = mfiSeries
}

if (indicatorConfig.aroon?.enabled && aroonContainerRef.current && !aroonChartRef.current) {
  const { width } = aroonContainerRef.current.getBoundingClientRect()
  const aroonChart = createChart(aroonContainerRef.current, {
    ...chartOptions,
    width,
    height: 120
  })

  const aroonUpSeries = aroonChart.addLineSeries({
    color: '#10b981',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: true
  })

  const aroonDownSeries = aroonChart.addLineSeries({
    color: '#ef4444',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: true
  })

  aroonChart.timeScale().fitContent()
  if (chartRef.current) {
    aroonChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      const range = aroonChart.timeScale().getVisibleLogicalRange()
      if (range && chartRef.current) {
        chartRef.current.timeScale().setVisibleLogicalRange(range)
      }
    })
  }

  aroonChartRef.current = aroonChart
  aroonUpRef.current = aroonUpSeries
  aroonDownRef.current = aroonDownSeries
}

if (indicatorConfig.trix?.enabled && trixContainerRef.current && !trixChartRef.current) {
  const { width } = trixContainerRef.current.getBoundingClientRect()
  const trixChart = createChart(trixContainerRef.current, {
    ...chartOptions,
    width,
    height: 120
  })

  const trixSeries = trixChart.addLineSeries({
    color: '#ec4899',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: true
  })

  trixChart.timeScale().fitContent()
  if (chartRef.current) {
    trixChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      const range = trixChart.timeScale().getVisibleLogicalRange()
      if (range && chartRef.current) {
        chartRef.current.timeScale().setVisibleLogicalRange(range)
      }
    })
  }

  trixChartRef.current = trixChart
  trixSeriesRef.current = trixSeries
}

if (indicatorConfig.obv?.enabled && obvContainerRef.current && !obvChartRef.current) {
  const { width } = obvContainerRef.current.getBoundingClientRect()
  const obvChart = createChart(obvContainerRef.current, {
    ...chartOptions,
    width,
    height: 120
  })

  const obvSeries = obvChart.addLineSeries({
    color: '#06b6d4',
    lineWidth: 2,
    priceLineVisible: false,
    lastValueVisible: true
  })

  obvChart.timeScale().fitContent()
  if (chartRef.current) {
    obvChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      const range = obvChart.timeScale().getVisibleLogicalRange()
      if (range && chartRef.current) {
        chartRef.current.timeScale().setVisibleLogicalRange(range)
      }
    })
  }

  obvChartRef.current = obvChart
  obvSeriesRef.current = obvSeries
}

if (indicatorConfig.elderRay?.enabled && elderRayContainerRef.current && !elderRayChartRef.current) {
  const { width } = elderRayContainerRef.current.getBoundingClientRect()
  const elderRayChart = createChart(elderRayContainerRef.current, {
    ...chartOptions,
    width,
    height: 120
  })

  const elderRayBullSeries = elderRayChart.addHistogramSeries({
    color: '#10b981',
    priceLineVisible: false
  })

  const elderRayBearSeries = elderRayChart.addHistogramSeries({
    color: '#ef4444',
    priceLineVisible: false
  })

  elderRayChart.timeScale().fitContent()
  if (chartRef.current) {
    elderRayChart.timeScale().subscribeVisibleLogicalRangeChange(() => {
      const range = elderRayChart.timeScale().getVisibleLogicalRange()
      if (range && chartRef.current) {
        chartRef.current.timeScale().setVisibleLogicalRange(range)
      }
    })
  }

  elderRayChartRef.current = elderRayChart
  elderRayBullRef.current = elderRayBullSeries
  elderRayBearRef.current = elderRayBearSeries
}


    const handleResize = () => {
      if (rsiChartRef.current && rsiContainerRef.current) {
        const { width } = rsiContainerRef.current.getBoundingClientRect()
        rsiChartRef.current.applyOptions({ width, height: 120 })
      }
      if (macdChartRef.current && macdContainerRef.current) {
        const { width } = macdContainerRef.current.getBoundingClientRect()
        macdChartRef.current.applyOptions({ width, height: 120 })
      }
      if (stochasticChartRef.current && stochasticContainerRef.current) {
        const { width } = stochasticContainerRef.current.getBoundingClientRect()
        stochasticChartRef.current.applyOptions({ width, height: 120 })
      }
      if (atrChartRef.current && atrContainerRef.current) {
        const { width } = atrContainerRef.current.getBoundingClientRect()
        atrChartRef.current.applyOptions({ width, height: 120 })
      }
      if (adxChartRef.current && adxContainerRef.current) {
        const { width } = adxContainerRef.current.getBoundingClientRect()
        adxChartRef.current.applyOptions({ width, height: 120 })
      }
      if (cciChartRef.current && cciContainerRef.current) {
        const { width } = cciContainerRef.current.getBoundingClientRect()
        cciChartRef.current.applyOptions({ width, height: 120 })
      }
      if (williamsRChartRef.current && williamsRContainerRef.current) {
        const { width } = williamsRContainerRef.current.getBoundingClientRect()
        williamsRChartRef.current.applyOptions({ width, height: 120 })
      }
      if (mfiChartRef.current && mfiContainerRef.current) {
        const { width } = mfiContainerRef.current.getBoundingClientRect()
        mfiChartRef.current.applyOptions({ width, height: 120 })
      }
      if (aroonChartRef.current && aroonContainerRef.current) {
        const { width } = aroonContainerRef.current.getBoundingClientRect()
        aroonChartRef.current.applyOptions({ width, height: 120 })
      }
      if (trixChartRef.current && trixContainerRef.current) {
        const { width } = trixContainerRef.current.getBoundingClientRect()
        trixChartRef.current.applyOptions({ width, height: 120 })
      }
      if (obvChartRef.current && obvContainerRef.current) {
        const { width } = obvContainerRef.current.getBoundingClientRect()
        obvChartRef.current.applyOptions({ width, height: 120 })
      }
      if (elderRayChartRef.current && elderRayContainerRef.current) {
        const { width } = elderRayContainerRef.current.getBoundingClientRect()
        elderRayChartRef.current.applyOptions({ width, height: 120 })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [
    isInitialized,
    indicatorConfig.rsi?.enabled,
    indicatorConfig.macd?.enabled,
    indicatorConfig.stochastic?.enabled,
    indicatorConfig.atr?.enabled,
    indicatorConfig.adx?.enabled,
    indicatorConfig.cci?.enabled,
    indicatorConfig.williamsR?.enabled,
    indicatorConfig.mfi?.enabled,
    indicatorConfig.aroon?.enabled,
    indicatorConfig.trix?.enabled,
    indicatorConfig.obv?.enabled,
    indicatorConfig.elderRay?.enabled
  ])


  useEffect(() => {
    if (!candleSeriesRef.current || !lineSeriesRef.current || !chartRef.current) return
    if (currentChartData.length === 0) return

    try {
      if (chartType === 'candle') {
        lineSeriesRef.current.applyOptions({ visible: false })
        candleSeriesRef.current.setData(currentChartData as any)
        candleSeriesRef.current.applyOptions({ visible: true })

        setSeries(candleSeriesRef.current)
      } else {
        candleSeriesRef.current.applyOptions({ visible: false })
        const lineData = currentChartData.map(bar => ({
          time: bar.time,
          value: bar.close
        }))
        lineSeriesRef.current.setData(lineData as any)
        lineSeriesRef.current.applyOptions({ visible: true })

        setSeries(lineSeriesRef.current)
      }


      requestAnimationFrame(() => {
        if (chartRef.current && currentChartData.length > 60) {
          const timeScale = chartRef.current.timeScale()
          timeScale.setVisibleLogicalRange({
            from: currentChartData.length - 60,
            to: currentChartData.length - 1
          })
        } else if (chartRef.current) {
          chartRef.current.timeScale().fitContent()
        }
      })
    } catch (error) {
      console.error('Chart type switch error:', error)
    }
  }, [chartType, currentChartData, setSeries])

  useEffect(() => {
    if (!showIndicators && candleSeriesRef.current && lineSeriesRef.current && chartRef.current) {
      const timer = setTimeout(() => {
        setChartType(prev => prev)
      }, 150)

      return () => clearTimeout(timer)
    }
  }, [showIndicators])


  useEffect(() => {
    if (!chartRef.current || currentChartData.length === 0) return

    const chart = chartRef.current

    if (indicatorConfig.sma?.enabled) {
      if (!smaSeriesRef.current) {
        smaSeriesRef.current = chart.addLineSeries({
          color: indicatorConfig.sma.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }

      const smaData = calculateSMA(currentChartData, indicatorConfig.sma.period)
      smaSeriesRef.current.setData(smaData)
      smaSeriesRef.current.applyOptions({
        color: indicatorConfig.sma.color,
        visible: true
      })
    } else if (smaSeriesRef.current) {
      smaSeriesRef.current.applyOptions({ visible: false })
    }

    if (indicatorConfig.ema?.enabled) {
      if (!emaSeriesRef.current) {
        emaSeriesRef.current = chart.addLineSeries({
          color: indicatorConfig.ema.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }

      const emaData = calculateEMA(currentChartData, indicatorConfig.ema.period)
      emaSeriesRef.current.setData(emaData)
      emaSeriesRef.current.applyOptions({
        color: indicatorConfig.ema.color,
        visible: true
      })
    } else if (emaSeriesRef.current) {
      emaSeriesRef.current.applyOptions({ visible: false })
    }

    if (indicatorConfig.bollinger?.enabled) {
      const { upper, middle, lower } = calculateBollingerBands(
        currentChartData,
        indicatorConfig.bollinger.period,
        indicatorConfig.bollinger.stdDev
      )

      if (!bollingerUpperRef.current) {
        bollingerUpperRef.current = chart.addLineSeries({
          color: indicatorConfig.bollinger.colorUpper,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }
      if (!bollingerMiddleRef.current) {
        bollingerMiddleRef.current = chart.addLineSeries({
          color: indicatorConfig.bollinger.colorMiddle,
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }
      if (!bollingerLowerRef.current) {
        bollingerLowerRef.current = chart.addLineSeries({
          color: indicatorConfig.bollinger.colorLower,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }

      bollingerUpperRef.current.setData(upper)
      bollingerMiddleRef.current.setData(middle)
      bollingerLowerRef.current.setData(lower)

      bollingerUpperRef.current.applyOptions({ visible: true, color: indicatorConfig.bollinger.colorUpper })
      bollingerMiddleRef.current.applyOptions({ visible: true, color: indicatorConfig.bollinger.colorMiddle })
      bollingerLowerRef.current.applyOptions({ visible: true, color: indicatorConfig.bollinger.colorLower })
    } else {
      if (bollingerUpperRef.current) bollingerUpperRef.current.applyOptions({ visible: false })
      if (bollingerMiddleRef.current) bollingerMiddleRef.current.applyOptions({ visible: false })
      if (bollingerLowerRef.current) bollingerLowerRef.current.applyOptions({ visible: false })
    }


    if (indicatorConfig.wma?.enabled) {
      if (!wmaSeriesRef.current) {
        wmaSeriesRef.current = chart.addLineSeries({
          color: indicatorConfig.wma.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }


      const wmaIndicatorData: IndicatorCandleData[] = currentChartData.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume
      }))

      const wmaData = calculateWMA(wmaIndicatorData, indicatorConfig.wma.period)
      const wmaChartData = wmaData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.value
      }))

      wmaSeriesRef.current.setData(wmaChartData)
      wmaSeriesRef.current.applyOptions({
        color: indicatorConfig.wma.color,
        visible: true
      })
    } else if (wmaSeriesRef.current) {
      wmaSeriesRef.current.applyOptions({ visible: false })
    }


    if (indicatorConfig.keltner?.enabled) {
      const keltnerIndicatorData: IndicatorCandleData[] = currentChartData.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume
      }))

      const keltnerData = calculateKeltnerChannels(
        keltnerIndicatorData,
        indicatorConfig.keltner.emaPeriod,
        indicatorConfig.keltner.atrPeriod,
        indicatorConfig.keltner.multiplier
      )

      if (!keltnerUpperRef.current) {
        keltnerUpperRef.current = chart.addLineSeries({
          color: '#ef4444',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }
      if (!keltnerMiddleRef.current) {
        keltnerMiddleRef.current = chart.addLineSeries({
          color: '#6b7280',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }
      if (!keltnerLowerRef.current) {
        keltnerLowerRef.current = chart.addLineSeries({
          color: '#10b981',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }

      const upperData = keltnerData.map((d: any) => ({
        time: d.time as UTCTimestamp,
        value: d.upper
      }))
      const middleData = keltnerData.map((d: any) => ({
        time: d.time as UTCTimestamp,
        value: d.middle
      }))
      const lowerData = keltnerData.map((d: any) => ({
        time: d.time as UTCTimestamp,
        value: d.lower
      }))

      keltnerUpperRef.current.setData(upperData)
      keltnerMiddleRef.current.setData(middleData)
      keltnerLowerRef.current.setData(lowerData)

      keltnerUpperRef.current.applyOptions({ visible: true })
      keltnerMiddleRef.current.applyOptions({ visible: true })
      keltnerLowerRef.current.applyOptions({ visible: true })
    } else {
      if (keltnerUpperRef.current) keltnerUpperRef.current.applyOptions({ visible: false })
      if (keltnerMiddleRef.current) keltnerMiddleRef.current.applyOptions({ visible: false })
      if (keltnerLowerRef.current) keltnerLowerRef.current.applyOptions({ visible: false })
    }


    if (indicatorConfig.donchian?.enabled) {
      const donchianIndicatorData: IndicatorCandleData[] = currentChartData.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume
      }))

      const donchianData = calculateDonchianChannels(
        donchianIndicatorData,
        indicatorConfig.donchian.period
      )

      if (!donchianUpperRef.current) {
        donchianUpperRef.current = chart.addLineSeries({
          color: '#ef4444',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }
      if (!donchianMiddleRef.current) {
        donchianMiddleRef.current = chart.addLineSeries({
          color: '#6b7280',
          lineWidth: 1,
          lineStyle: 2,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }
      if (!donchianLowerRef.current) {
        donchianLowerRef.current = chart.addLineSeries({
          color: '#10b981',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }

      const upperData = donchianData.map((d: any) => ({
        time: d.time as UTCTimestamp,
        value: d.upper
      }))
      const middleData = donchianData.map((d: any) => ({
        time: d.time as UTCTimestamp,
        value: d.middle
      }))
      const lowerData = donchianData.map((d: any) => ({
        time: d.time as UTCTimestamp,
        value: d.lower
      }))

      donchianUpperRef.current.setData(upperData)
      donchianMiddleRef.current.setData(middleData)
      donchianLowerRef.current.setData(lowerData)

      donchianUpperRef.current.applyOptions({ visible: true })
      donchianMiddleRef.current.applyOptions({ visible: true })
      donchianLowerRef.current.applyOptions({ visible: true })
    } else {
      if (donchianUpperRef.current) donchianUpperRef.current.applyOptions({ visible: false })
      if (donchianMiddleRef.current) donchianMiddleRef.current.applyOptions({ visible: false })
      if (donchianLowerRef.current) donchianLowerRef.current.applyOptions({ visible: false })
    }


    if (indicatorConfig.ichimoku?.enabled) {
      const ichimokuIndicatorData: IndicatorCandleData[] = currentChartData.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume
      }))

      const ichimokuData = calculateIchimoku(
        ichimokuIndicatorData,
        indicatorConfig.ichimoku.tenkanPeriod,
        indicatorConfig.ichimoku.kijunPeriod,
        indicatorConfig.ichimoku.senkouBPeriod
      )

      if (!ichimokuTenkanRef.current) {
        ichimokuTenkanRef.current = chart.addLineSeries({
          color: '#3b82f6',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }
      if (!ichimokuKijunRef.current) {
        ichimokuKijunRef.current = chart.addLineSeries({
          color: '#ef4444',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }
      if (!ichimokuSpanARef.current) {
        ichimokuSpanARef.current = chart.addLineSeries({
          color: '#10b981',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }
      if (!ichimokuSpanBRef.current) {
        ichimokuSpanBRef.current = chart.addLineSeries({
          color: '#f59e0b',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }

      const tenkanData = ichimokuData.map((d: any) => ({
        time: d.time as UTCTimestamp,
        value: d.tenkanSen
      }))
      const kijunData = ichimokuData.map((d: any) => ({
        time: d.time as UTCTimestamp,
        value: d.kijunSen
      }))
      const spanAData = ichimokuData.map((d: any) => ({
        time: d.time as UTCTimestamp,
        value: d.senkouSpanA
      }))
      const spanBData = ichimokuData.map((d: any) => ({
        time: d.time as UTCTimestamp,
        value: d.senkouSpanB
      }))

      ichimokuTenkanRef.current.setData(tenkanData)
      ichimokuKijunRef.current.setData(kijunData)
      ichimokuSpanARef.current.setData(spanAData)
      ichimokuSpanBRef.current.setData(spanBData)

      ichimokuTenkanRef.current.applyOptions({ visible: true })
      ichimokuKijunRef.current.applyOptions({ visible: true })
      ichimokuSpanARef.current.applyOptions({ visible: true })
      ichimokuSpanBRef.current.applyOptions({ visible: true })
    } else {
      if (ichimokuTenkanRef.current) ichimokuTenkanRef.current.applyOptions({ visible: false })
      if (ichimokuKijunRef.current) ichimokuKijunRef.current.applyOptions({ visible: false })
      if (ichimokuSpanARef.current) ichimokuSpanARef.current.applyOptions({ visible: false })
      if (ichimokuSpanBRef.current) ichimokuSpanBRef.current.applyOptions({ visible: false })
    }


    if (indicatorConfig.vwap?.enabled) {
      if (!vwapSeriesRef.current) {
        vwapSeriesRef.current = chart.addLineSeries({
          color: indicatorConfig.vwap.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }

      const vwapIndicatorData: IndicatorCandleData[] = currentChartData.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume
      }))

      const vwapData = calculateVWAP(vwapIndicatorData)
      const vwapChartData = vwapData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.value
      }))

      vwapSeriesRef.current.setData(vwapChartData)
      vwapSeriesRef.current.applyOptions({
        color: indicatorConfig.vwap.color,
        visible: true
      })
    } else if (vwapSeriesRef.current) {
      vwapSeriesRef.current.applyOptions({ visible: false })
    }


    if (indicatorConfig.parabolicSar?.enabled) {
      if (!parabolicSarSeriesRef.current) {
        parabolicSarSeriesRef.current = chart.addLineSeries({
          color: '#f59e0b',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          lineStyle: 2
        })
      }

      const sarIndicatorData: IndicatorCandleData[] = currentChartData.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume
      }))

      const sarData = calculateParabolicSAR(
        sarIndicatorData,
        indicatorConfig.parabolicSar.accelerationFactor,
        indicatorConfig.parabolicSar.maxAF
      )
      const sarChartData = sarData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.value
      }))

      parabolicSarSeriesRef.current.setData(sarChartData)
      parabolicSarSeriesRef.current.applyOptions({ visible: true })
    } else if (parabolicSarSeriesRef.current) {
      parabolicSarSeriesRef.current.applyOptions({ visible: false })
    }


    if (indicatorConfig.supertrend?.enabled) {
      if (!supertrendSeriesRef.current) {
        supertrendSeriesRef.current = chart.addLineSeries({
          color: '#10b981',
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false
        })
      }

      const supertrendIndicatorData: IndicatorCandleData[] = currentChartData.map(d => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume
      }))

      const supertrendData = calculateSupertrend(
        supertrendIndicatorData,
        indicatorConfig.supertrend.period,
        indicatorConfig.supertrend.multiplier
      )
      const supertrendChartData = supertrendData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.value
      }))

      supertrendSeriesRef.current.setData(supertrendChartData)
      supertrendSeriesRef.current.applyOptions({ visible: true })
    } else if (supertrendSeriesRef.current) {
      supertrendSeriesRef.current.applyOptions({ visible: false })
    }

  }, [indicatorConfig, currentChartData])


  useEffect(() => {
    if (currentChartData.length === 0) return

    const indicatorData: IndicatorCandleData[] = currentChartData.map(d => ({
      time: d.time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume
    }))


    if (indicatorConfig.rsi?.enabled && rsiSeriesRef.current) {
      const rsiData = calculateRSI(indicatorData, indicatorConfig.rsi.period)
      const rsiChartData = rsiData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.value
      }))

      rsiSeriesRef.current.setData(rsiChartData)


      if (rsiChartData.length > 0 && rsiOverboughtRef.current && rsiOversoldRef.current) {
        const overboughtData = rsiChartData.map(d => ({
          time: d.time,
          value: indicatorConfig.rsi!.overbought
        }))
        const oversoldData = rsiChartData.map(d => ({
          time: d.time,
          value: indicatorConfig.rsi!.oversold
        }))

        rsiOverboughtRef.current.setData(overboughtData)
        rsiOversoldRef.current.setData(oversoldData)
      }

      rsiChartRef.current?.timeScale().fitContent()
    }


    if (indicatorConfig.macd?.enabled && macdLineRef.current && macdSignalRef.current && macdHistogramRef.current) {
      const macdData = calculateMACD(
        indicatorData,
        indicatorConfig.macd.fastPeriod,
        indicatorConfig.macd.slowPeriod,
        indicatorConfig.macd.signalPeriod
      )

      const macdLineData = macdData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.macd
      }))

      const macdSignalData = macdData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.signal
      }))

      const macdHistogramData = macdData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.histogram,
        color: d.histogram >= 0 ? '#26a69a' : '#ef5350'
      }))

      macdLineRef.current.setData(macdLineData)
      macdSignalRef.current.setData(macdSignalData)
      macdHistogramRef.current.setData(macdHistogramData as any)

      macdChartRef.current?.timeScale().fitContent()
    }


    if (indicatorConfig.stochastic?.enabled && stochasticKRef.current && stochasticDRef.current) {
      const stochData = calculateStochastic(
        indicatorData,
        indicatorConfig.stochastic.kPeriod,
        indicatorConfig.stochastic.dPeriod
      )

      const kData = stochData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.k
      }))

      const dData = stochData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.d
      }))

      stochasticKRef.current.setData(kData)
      stochasticDRef.current.setData(dData)


      if (kData.length > 0 && stochasticOverboughtRef.current && stochasticOversoldRef.current) {
        const overboughtData = kData.map(d => ({
          time: d.time,
          value: indicatorConfig.stochastic!.overbought
        }))
        const oversoldData = kData.map(d => ({
          time: d.time,
          value: indicatorConfig.stochastic!.oversold
        }))

        stochasticOverboughtRef.current.setData(overboughtData)
        stochasticOversoldRef.current.setData(oversoldData)
      }

      stochasticChartRef.current?.timeScale().fitContent()
    }


    if (indicatorConfig.atr?.enabled && atrSeriesRef.current) {
      const atrData = calculateATR(indicatorData, indicatorConfig.atr.period)
      const atrChartData = atrData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.value
      }))

      atrSeriesRef.current.setData(atrChartData)
      atrChartRef.current?.timeScale().fitContent()
    }


    if (indicatorConfig.adx?.enabled && adxSeriesRef.current) {
      const adxData = calculateADX(indicatorData, indicatorConfig.adx.period)
      const adxChartData = adxData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.adx
      }))

      adxSeriesRef.current.setData(adxChartData)
      adxChartRef.current?.timeScale().fitContent()
    }


    if (indicatorConfig.cci?.enabled && cciSeriesRef.current) {
      const cciData = calculateCCI(indicatorData, indicatorConfig.cci.period)
      const cciChartData = cciData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.value
      }))

      cciSeriesRef.current.setData(cciChartData)
      cciChartRef.current?.timeScale().fitContent()
    }


    if (indicatorConfig.williamsR?.enabled && williamsRSeriesRef.current) {
      const williamsRData = calculateWilliamsR(indicatorData, indicatorConfig.williamsR.period)
      const williamsRChartData = williamsRData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.value
      }))

      williamsRSeriesRef.current.setData(williamsRChartData)
      williamsRChartRef.current?.timeScale().fitContent()
    }


    if (indicatorConfig.mfi?.enabled && mfiSeriesRef.current) {
      const mfiData = calculateMFI(indicatorData, indicatorConfig.mfi.period)
      const mfiChartData = mfiData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.value
      }))

      mfiSeriesRef.current.setData(mfiChartData)
      mfiChartRef.current?.timeScale().fitContent()
    }


    if (indicatorConfig.aroon?.enabled && aroonUpRef.current && aroonDownRef.current) {
      const aroonData = calculateAroon(indicatorData, indicatorConfig.aroon.period)

      const aroonUpData = aroonData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.aroonUp
      }))

      const aroonDownData = aroonData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.aroonDown
      }))

      aroonUpRef.current.setData(aroonUpData)
      aroonDownRef.current.setData(aroonDownData)
      aroonChartRef.current?.timeScale().fitContent()
    }


    if (indicatorConfig.trix?.enabled && trixSeriesRef.current) {
      const trixData = calculateTRIX(indicatorData, indicatorConfig.trix.period)
      const trixChartData = trixData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.value
      }))

      trixSeriesRef.current.setData(trixChartData)
      trixChartRef.current?.timeScale().fitContent()
    }


    if (indicatorConfig.obv?.enabled && obvSeriesRef.current) {
      const obvData = calculateOBV(indicatorData)
      const obvChartData = obvData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.value
      }))

      obvSeriesRef.current.setData(obvChartData)
      obvChartRef.current?.timeScale().fitContent()
    }


    if (indicatorConfig.elderRay?.enabled && elderRayBullRef.current && elderRayBearRef.current) {
      const elderRayData = calculateElderRay(indicatorData, indicatorConfig.elderRay.period)

      const bullData = elderRayData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.bullPower,
        color: d.bullPower >= 0 ? '#10b981' : '#ef4444'
      }))

      const bearData = elderRayData.map(d => ({
        time: d.time as UTCTimestamp,
        value: d.bearPower,
        color: d.bearPower >= 0 ? '#10b981' : '#ef4444'
      }))

      elderRayBullRef.current.setData(bullData as any)
      elderRayBearRef.current.setData(bearData as any)
      elderRayChartRef.current?.timeScale().fitContent()
    }

  }, [indicatorConfig, currentChartData])


  useEffect(() => {
    if (!selectedAsset || !isInitialized || !candleSeriesRef.current || !lineSeriesRef.current) {
      return
    }

    const isAssetChange = previousAssetIdRef.current !== selectedAsset.id
    const isTimeframeChange = previousTimeframeRef.current !== timeframe

    if (isAssetChange || isTimeframeChange) {
      setIsLoading(true)
      previousAssetIdRef.current = selectedAsset.id
      previousTimeframeRef.current = timeframe


      if (isAssetChange) {
        setCurrentChartData([])
        candleSeriesRef.current.setData([])
        lineSeriesRef.current.setData([])
        currentBarRef.current = null




        candleAnimatorRef.current?.reset()


        TIMEFRAMES.forEach(tf => {
          const cacheKey = `${selectedAsset.id}-${tf}`
          GLOBAL_DATA_CACHE.delete(cacheKey)
        })
      }

      if (isTimeframeChange) {

        const cacheKey = `${selectedAsset.id}-${timeframe}`
        GLOBAL_DATA_CACHE.delete(cacheKey)
        currentBarRef.current = null


        candleAnimatorRef.current?.stop()
      }
    }

    isLoadingDataRef.current = true
    let isCancelled = false

    const processAndDisplayData = (data: any[]) => {
      if (data.length > 0 && !isCancelled) {



        candleAnimatorRef.current?.stop()


        const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp)


        if (currentBarRef.current && sortedData.length > 0) {
          const lastHistoricalTimestamp = sortedData[sortedData.length - 1].timestamp
          const liveBarTimestamp = currentBarRef.current.timestamp

          if (lastHistoricalTimestamp === liveBarTimestamp) {

            const mergedBar = {
              ...sortedData[sortedData.length - 1],
              high: Math.max(
                sortedData[sortedData.length - 1].high,
                currentBarRef.current.high
              ),
              low: Math.min(
                sortedData[sortedData.length - 1].low,
                currentBarRef.current.low
              ),
              close: currentBarRef.current.close,

              volume: Math.max(
                sortedData[sortedData.length - 1].volume || 0,
                currentBarRef.current.volume || 0
              )
            }

            sortedData[sortedData.length - 1] = mergedBar
            console.log('✅ Merged live bar with historical:', mergedBar.close)
          } else if (liveBarTimestamp > lastHistoricalTimestamp) {

            sortedData.push({
              timestamp: currentBarRef.current.timestamp,
              open: currentBarRef.current.open,
              high: currentBarRef.current.high,
              low: currentBarRef.current.low,
              close: currentBarRef.current.close,
              volume: currentBarRef.current.volume || 0
            })
          }
        }

        const candleData = sortedData.map((bar: any) => ({
          time: bar.timestamp as UTCTimestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close
        }))

        setCurrentChartData(candleData)


        const isManualRefresh = savedVisibleRangeRef.current !== null;

        safeSetChartData(candleData, {
          preservePosition: isManualRefresh,
          skipDefaultZoom: false
        });


        if (isManualRefresh) {
          savedVisibleRangeRef.current = null;
        }

        const lastBar = sortedData[sortedData.length - 1]
        if (!currentBarRef.current) {
          currentBarRef.current = {
            timestamp: lastBar.timestamp,
            open: lastBar.open,
            high: lastBar.high,
            low: lastBar.low,
            close: lastBar.close,
            volume: lastBar.volume || 0
          }
        }

        setOpeningPrice(sortedData[0].open)
        setLastPrice(lastBar.close)
      }
    }

    const loadHistoricalData = async () => {
      try {
        const assetPath = cleanAssetPath(selectedAsset.realtimeDbPath || `/${selectedAsset.symbol.toLowerCase()}`)

        const cachedData = getCachedData(selectedAsset.id, timeframe)

        if (cachedData && cachedData.length > 0 && !isAssetChange) {
          processAndDisplayData(cachedData)
          setIsLoading(false)

          setTimeout(async () => {
            if (isCancelled) return
            const freshData = await fetchHistoricalData(assetPath, timeframe)
            if (freshData.length > 0 && !isCancelled) {
              setCachedData(selectedAsset.id, timeframe, freshData)
              if (JSON.stringify(freshData) !== JSON.stringify(cachedData)) {
                processAndDisplayData(freshData)
              }
            }
          }, 100)
        } else {
          const minLoadTime = new Promise(resolve => setTimeout(resolve, 600))
          const dataPromise = fetchHistoricalData(assetPath, timeframe)

          const [data] = await Promise.all([dataPromise, minLoadTime])

          if (!isCancelled) {
            setCachedData(selectedAsset.id, timeframe, data)
            processAndDisplayData(data)
          }
        }
      } catch (error) {
        console.error('Historical data load error:', error)
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
          isLoadingDataRef.current = false
        }
      }
    }

    const initializeData = async () => {
      await checkSimulator().catch(err => console.log('Market check failed:', err))
      await loadHistoricalData()
    }

    initializeData()

    return () => {
      isCancelled = true
      isLoadingDataRef.current = false
    }
  }, [selectedAsset?.id, timeframe, isInitialized, checkSimulator])

  useEffect(() => {
    if (isLoading) {
      const safetyTimeout = setTimeout(() => {
        if (loadingManagerRef.current.getLoading()) {
          setIsLoading(false)
        }
      }, 10000)

      return () => clearTimeout(safetyTimeout)
    }
  }, [isLoading])

  useEffect(() => {
    if (!selectedAsset || !isInitialized || isLoading || prefetchedAssets.has(selectedAsset.id)) {
      return
    }

    const assetPath = cleanAssetPath(selectedAsset.realtimeDbPath || `/${selectedAsset.symbol.toLowerCase()}`)

    const prefetchTimer = setTimeout(() => {
      prefetchAllTimeframes(selectedAsset.id, assetPath)
    }, 2000)

    return () => clearTimeout(prefetchTimer)
  }, [selectedAsset?.id, isInitialized, isLoading, prefetchedAssets, prefetchAllTimeframes])

  const handleRefresh = useCallback(() => {
    if (!selectedAsset) return


    if (chartRef.current) {
      try {
        const visibleRange = chartRef.current.timeScale().getVisibleLogicalRange()
        if (visibleRange) {
          savedVisibleRangeRef.current = {
            from: visibleRange.from,
            to: visibleRange.to
          }
          console.log('💾 Saved visible range:', savedVisibleRangeRef.current)
        }
      } catch (error) {
        console.warn('Failed to save visible range:', error)
        savedVisibleRangeRef.current = null
      }
    }


    const cacheKey = `${selectedAsset.id}-${timeframe}`
    GLOBAL_DATA_CACHE.delete(cacheKey)


    currentBarRef.current = null

    setPrefetchedAssets(prev => {
      const newSet = new Set(prev)
      newSet.delete(selectedAsset.id)
      return newSet
    })

    checkSimulator()


    const currentAsset = selectedAsset
    useTradingStore.setState({ selectedAsset: null })
    setTimeout(() => {
      useTradingStore.setState({ selectedAsset: currentAsset })
    }, 100)
  }, [selectedAsset, timeframe, checkSimulator])

  const handleFitContent = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }, [])

  const handleTimeframeChange = useCallback((tf: Timeframe) => {
    setTimeframe(tf)
  }, [])

  const handleChartTypeChange = useCallback((type: ChartType) => {
    setChartType(type)
  }, [])

  const handleOpenIndicators = useCallback(() => {
    setShowIndicators(true)
  }, [])

  const handleCloseIndicators = useCallback(() => {
    setShowIndicators(false)

    setTimeout(() => {
      if (chartRef.current) {
        chartRef.current.timeScale().fitContent()
      }
    }, 200)
  }, [])

  const calculatePriceChange = useCallback(() => {
    if (!lastPrice || !openingPrice || openingPrice === 0) return 0
    return ((lastPrice - openingPrice) / openingPrice) * 100
  }, [lastPrice, openingPrice])

  const handleAssetSelect = useCallback((asset: any) => {
    setSelectedAsset(asset)
    onAssetSelect?.(asset)
    setShowAssetMenu(false)
  }, [setSelectedAsset, onAssetSelect])

  if (!selectedAsset) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: isLightMode ? '#fafcff' : '#0a0e17' }}>
        <div className="text-center text-gray-500">
          <Activity className="w-16 h-16 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Select an asset to view chart</p>
        </div>
      </div>
    )
  }

  const currentPriceData = {
    price: lastPrice || 0,
    change: calculatePriceChange(),
    datetime: new Date().toISOString()
  }

  const hasOscillators =
    indicatorConfig.rsi?.enabled ||
    indicatorConfig.macd?.enabled ||
    indicatorConfig.stochastic?.enabled ||
    indicatorConfig.atr?.enabled ||
    indicatorConfig.adx?.enabled ||
    indicatorConfig.cci?.enabled ||
    indicatorConfig.williamsR?.enabled ||
    indicatorConfig.mfi?.enabled ||
    indicatorConfig.aroon?.enabled ||
    indicatorConfig.trix?.enabled ||
    indicatorConfig.obv?.enabled ||
    indicatorConfig.elderRay?.enabled

  const oscillatorCount = [
    indicatorConfig.rsi?.enabled,
    indicatorConfig.macd?.enabled,
    indicatorConfig.stochastic?.enabled,
    indicatorConfig.atr?.enabled,
    indicatorConfig.adx?.enabled,
    indicatorConfig.cci?.enabled,
    indicatorConfig.williamsR?.enabled,
    indicatorConfig.mfi?.enabled,
    indicatorConfig.aroon?.enabled,
    indicatorConfig.trix?.enabled,
    indicatorConfig.obv?.enabled,
    indicatorConfig.elderRay?.enabled
  ].filter(Boolean).length

  const mainChartHeight = hasOscillators
    ? `calc(100% - ${oscillatorCount * 140}px)`
    : '100%'

  return (
    <>
    <div ref={fullscreenContainerRef} className={`relative h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`} style={{ ...(showReferralModal ? { filter: 'blur(5px)', transition: 'filter 0.25s ease' } : { filter: 'none', transition: 'filter 0.25s ease' }), background: isLightMode ? '#fafcff' : (isFullscreen ? '#0a0e17' : undefined) }}>
      <div className="relative" style={{ height: mainChartHeight }}>
        <PriceDisplay
        asset={selectedAsset}
        price={currentPriceData}
        onClick={() => setShowAssetMenu(!showAssetMenu)}
        showMenu={showAssetMenu}
        assets={availableAssets}
        onSelectAsset={handleAssetSelect}
        isLightMode={isLightMode}
      />
      <RealtimeClock nowMs={nowMs} isLightMode={isLightMode} />

      {}
      <div className="absolute top-24 left-1 z-10">
        <style jsx>{`
          .gpt-omni-brutalist-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border: 2px solid #000000;
            border-radius: 14px;
            padding: 0;
            text-decoration: none;
            color: #000000;
            font-weight: bold;
            position: relative;
            box-shadow: 3px 3px 0px #000000;
            overflow: hidden;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            height: 60px;
            width: 60px;
            cursor: pointer;
            background-color: #ff6b35;
            transform: scale(0.60);
          }
          @keyframes gpt-omni-shimmer {
            0% { transform: translateX(-200%) skewX(-15deg); opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { transform: translateX(400%) skewX(-15deg); opacity: 0; }
          }
          .gpt-omni-brutalist-btn::after {
            content: "";
            position: absolute;
            top: -20%;
            left: 0;
            width: 65%;
            height: 140%;
            background: linear-gradient(
              105deg,
              transparent 20%,
              rgba(255,255,255,0.08) 35%,
              rgba(255,255,255,0.38) 50%,
              rgba(255,255,255,0.08) 65%,
              transparent 80%
            );
            animation: gpt-omni-shimmer 3.6s ease-in-out infinite;
            z-index: 3;
            pointer-events: none;
          }
          .gpt-omni-brutalist-btn::before {
            content: "";
            position: absolute;
            left: 50%;
            bottom: -150%;
            width: 300%;
            height: 300%;
            border-radius: 50%;
            transform: translateX(-50%) scale(0);
            transition: transform 0.6s cubic-bezier(0.19, 1, 0.22, 1);
            z-index: 1;
            background-color: #ff8c42;
          }
          .gpt-omni-brutalist-btn:hover::before {
            transform: translateX(-50%) scale(1);
          }
          .gpt-omni-brutalist-btn:hover {
            transform: scale(0.9) translate(2px, 2px);
            box-shadow: 6px 6px 0px #000000;
            opacity: 1;
          }
          .gpt-omni-brutalist-btn:hover::after {
            animation: gpt-omni-shimmer 2s ease-in-out infinite;
          }
          .gpt-omni-brutalist-btn:active {
            transform: scale(1) translate(1px, 1px);
            box-shadow: 2px 2px 0px #000000;
          }
          .gpt-omni-logo-circle {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 2;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            background-color: #ffffff;
          }
          .gpt-omni-logo-svg {
            width: 24px;
            height: 24px;
            transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
          @keyframes gpt-omni-spin {
            0% {
              transform: translate(-50%, -50%) rotate(0deg);
            }
            100% {
              transform: translate(-50%, -50%) rotate(360deg);
            }
          }
          .gpt-omni-brutalist-btn:hover .gpt-omni-logo-circle {
            animation: gpt-omni-spin 5s linear infinite;
            width: 26px;
            height: 26px;
            top: 30%;
          }
          .gpt-omni-brutalist-btn:hover .gpt-omni-logo-svg {
            transform: scale(0.75);
          }
          .gpt-omni-btn-text {
            display: flex;
            flex-direction: column;
            align-items: center;
            line-height: 1;
            transition: all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            text-align: center;
            opacity: 0;
            transform: translateY(15px);
            z-index: 2;
            position: absolute;
            bottom: 8px;
            left: 0;
            right: 0;
            color: #ffffff;
          }
          .gpt-omni-btn-text span:first-child {
            font-size: 8px;
            font-weight: 500;
            margin-bottom: 0px;
          }
          .gpt-omni-btn-text span:last-child {
            font-size: 9px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #ffffff;
          }
          .gpt-omni-brutalist-btn:hover .gpt-omni-btn-text {
            opacity: 1;
            transform: translateY(0);
          }
          @media (hover: hover) and (pointer: fine) {
            .gpt-omni-brutalist-btn:hover {
              transform: scale(0.9) translate(2px, 2px);
              box-shadow: 6px 6px 0px #000000;
            }
          }
        `}</style>
        <button
          className="gpt-omni-brutalist-btn"
          onClick={async () => {
            setShowReferralModal(true)
            if (!referralCode) {
              setReferralLoading(true)
              try {
                const response = await api.getProfile()
                let data: any = null
                if (response && typeof response === 'object') {
                  if ('data' in response && (response as any).data) data = (response as any).data
                  else if ('affiliate' in response) data = response
                }
                const code = data?.affiliate?.referralCode || data?.user?.referralCode || null
                setReferralCode(code)
              } catch (e) {
                console.error('Failed to fetch referral code', e)
              } finally {
                setReferralLoading(false)
              }
            }
          }}
        >
          <div className="gpt-omni-logo-circle">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ff6b35"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="gpt-omni-logo-svg"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="gpt-omni-btn-text">
            <span>Referral</span>
            <span>Program</span>
          </div>
        </button>

        {}
        <style jsx global>{`
          @keyframes ref-backdrop-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes ref-modal-in {
            from { opacity: 0; transform: scale(0.82) translateY(24px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes ref-code-glow {
            0%, 100% { box-shadow: 0 0 8px rgba(255,107,53,0.25); }
            50% { box-shadow: 0 0 22px rgba(255,107,53,0.65); }
          }
          @keyframes ref-spin {
            to { transform: rotate(360deg); }
          }
          .ref-backdrop { animation: ref-backdrop-in 0.22s ease forwards; }
          .ref-modal-box { animation: ref-modal-in 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
          .ref-code-box { animation: ref-code-glow 2.5s ease-in-out infinite; }
          .ref-spin { animation: ref-spin 0.9s linear infinite; }
          .ref-close-btn:hover { background: rgba(255,107,53,0.22) !important; color: #ff6b35 !important; }
          .ref-copy-btn:hover { filter: brightness(1.15); transform: scale(1.04); }
        `}</style>
      </div>

      <DesktopControls
        timeframe={timeframe}
        chartType={chartType}
        isLoading={isLoading}
        onTimeframeChange={handleTimeframeChange}
        onChartTypeChange={handleChartTypeChange}
        onFitContent={handleFitContent}
        onRefresh={handleRefresh}
        onToggleFullscreen={toggleFullscreen}
        onOpenIndicators={handleOpenIndicators}
        onToggleDrawing={() => {
          if (!showDrawingTools) setShowDrawingTools(true) // mount sekali, jangan unmount agar drawings tidak hilang
          setDrawingPanelOpen(o => !o)
        }}
        drawingEnabled={drawingPanelOpen}
        isFullscreen={isFullscreen}
        isLightMode={isLightMode}
      />

      <MobileControls
        timeframe={timeframe}
        chartType={chartType}
        isLoading={isLoading}
        onTimeframeChange={handleTimeframeChange}
        onChartTypeChange={handleChartTypeChange}
        onFitContent={handleFitContent}
        onRefresh={handleRefresh}
        onOpenIndicators={handleOpenIndicators}
        onToggleDrawing={() => {
          if (!showDrawingTools) setShowDrawingTools(true)
          setDrawingPanelOpen(o => !o)
        }}
        drawingEnabled={drawingPanelOpen}
        nowSeconds={nowSeconds}
        isLightMode={isLightMode}
      />

      <SimulatorStatus status={simulatorStatus} onRetry={checkSimulator} />

      <OHLCDisplay data={ohlcData} visible={showOhlc} />

      {/* Background map image — 20% opacity, responsive per device */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: isMobile ? 'url(/petawhitehp.png)' : 'url(/petawhitepc.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.35,
          zIndex: 0,
          filter: isLightMode ? 'invert(1)' : 'none',
        }}
      />

      <div ref={chartContainerRef} className="absolute inset-0" style={{ background: isLightMode ? 'rgba(248,251,255,0.90)' : 'rgba(10, 14, 23, 0.85)', zIndex: 1 }} />

      <DrawingTools
        chartRef={chartRef}
        seriesRef={candleSeriesRef}
        containerRef={chartContainerRef}
        enabled={drawingPanelOpen}
        panelOpen={drawingPanelOpen}
        onPanelClose={() => setDrawingPanelOpen(false)}
      />

      {activeOrders && activeOrders.length > 0 && currentPriceData.price > 0 && (
        <OrderPriceTracker
          orders={activeOrders}
          currentPrice={currentPriceData.price}
          chartContainerRef={chartContainerRef}
          priceToPixel={priceToPixel}
          showProfitAnimation={!isMobile}
          showPricePath={!isMobile}
          highlightWinning={true}
          compactMode={isMobile}
          nowSeconds={nowSeconds}
        />
      )}

      {isLoading && (
        <ChartSkeleton
          timeframe={timeframe}
          assetSymbol={selectedAsset?.symbol || ''}
          isLightMode={isLightMode}
        />
      )}

      {}
      <div className="hidden lg:block absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <CandleCountdown timeframe={timeframe} nowSeconds={nowSeconds} isLightMode={isLightMode} />
      </div>
    </div>

    {}
    {indicatorConfig.rsi?.enabled && (
      <div className="border-t border-gray-800/30" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : undefined }}>
        <div className="px-2 py-1 text-xs font-medium" style={{ background: isLightMode ? '#fafcff' : '#0f1419', color: isLightMode ? '#64748b' : '#9ca3af' }}>RSI ({indicatorConfig.rsi.period})</div>
        <div ref={rsiContainerRef} className="relative h-[120px]" style={{ background: isLightMode ? '#fafcff' : '#0a0e17' }} />
      </div>
    )}

    {indicatorConfig.macd?.enabled && (
      <div className="border-t border-gray-800/30" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : undefined }}>
        <div className="px-2 py-1 text-xs font-medium" style={{ background: isLightMode ? '#fafcff' : '#0f1419', color: isLightMode ? '#64748b' : '#9ca3af' }}>MACD ({indicatorConfig.macd.fastPeriod},{indicatorConfig.macd.slowPeriod},{indicatorConfig.macd.signalPeriod})</div>
        <div ref={macdContainerRef} className="relative h-[120px]" style={{ background: isLightMode ? '#fafcff' : '#0a0e17' }} />
      </div>
    )}

    {indicatorConfig.stochastic?.enabled && (
      <div className="border-t border-gray-800/30" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : undefined }}>
        <div className="px-2 py-1 text-xs font-medium" style={{ background: isLightMode ? '#fafcff' : '#0f1419', color: isLightMode ? '#64748b' : '#9ca3af' }}>Stochastic ({indicatorConfig.stochastic.kPeriod},{indicatorConfig.stochastic.dPeriod})</div>
        <div ref={stochasticContainerRef} className="relative h-[120px]" style={{ background: isLightMode ? '#fafcff' : '#0a0e17' }} />
      </div>
    )}

    {indicatorConfig.atr?.enabled && (
      <div className="border-t border-gray-800/30" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : undefined }}>
        <div className="px-2 py-1 text-xs font-medium" style={{ background: isLightMode ? '#fafcff' : '#0f1419', color: isLightMode ? '#64748b' : '#9ca3af' }}>ATR ({indicatorConfig.atr.period})</div>
        <div ref={atrContainerRef} className="relative h-[120px]" style={{ background: isLightMode ? '#fafcff' : '#0a0e17' }} />
      </div>
    )}

    {indicatorConfig.adx?.enabled && (
      <div className="border-t border-gray-800/30" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : undefined }}>
        <div className="px-2 py-1 text-xs font-medium" style={{ background: isLightMode ? '#fafcff' : '#0f1419', color: isLightMode ? '#64748b' : '#9ca3af' }}>ADX ({indicatorConfig.adx.period})</div>
        <div ref={adxContainerRef} className="relative h-[120px]" style={{ background: isLightMode ? '#fafcff' : '#0a0e17' }} />
      </div>
    )}

    {indicatorConfig.cci?.enabled && (
      <div className="border-t border-gray-800/30" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : undefined }}>
        <div className="px-2 py-1 text-xs font-medium" style={{ background: isLightMode ? '#fafcff' : '#0f1419', color: isLightMode ? '#64748b' : '#9ca3af' }}>CCI ({indicatorConfig.cci.period})</div>
        <div ref={cciContainerRef} className="relative h-[120px]" style={{ background: isLightMode ? '#fafcff' : '#0a0e17' }} />
      </div>
    )}

    {indicatorConfig.williamsR?.enabled && (
      <div className="border-t border-gray-800/30" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : undefined }}>
        <div className="px-2 py-1 text-xs font-medium" style={{ background: isLightMode ? '#fafcff' : '#0f1419', color: isLightMode ? '#64748b' : '#9ca3af' }}>Williams %R ({indicatorConfig.williamsR.period})</div>
        <div ref={williamsRContainerRef} className="relative h-[120px]" style={{ background: isLightMode ? '#fafcff' : '#0a0e17' }} />
      </div>
    )}

    {indicatorConfig.mfi?.enabled && (
      <div className="border-t border-gray-800/30" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : undefined }}>
        <div className="px-2 py-1 text-xs font-medium" style={{ background: isLightMode ? '#fafcff' : '#0f1419', color: isLightMode ? '#64748b' : '#9ca3af' }}>MFI ({indicatorConfig.mfi.period})</div>
        <div ref={mfiContainerRef} className="relative h-[120px]" style={{ background: isLightMode ? '#fafcff' : '#0a0e17' }} />
      </div>
    )}

    {indicatorConfig.aroon?.enabled && (
      <div className="border-t border-gray-800/30" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : undefined }}>
        <div className="px-2 py-1 text-xs font-medium" style={{ background: isLightMode ? '#fafcff' : '#0f1419', color: isLightMode ? '#64748b' : '#9ca3af' }}>Aroon ({indicatorConfig.aroon.period})</div>
        <div ref={aroonContainerRef} className="relative h-[120px]" style={{ background: isLightMode ? '#fafcff' : '#0a0e17' }} />
      </div>
    )}

    {indicatorConfig.trix?.enabled && (
      <div className="border-t border-gray-800/30" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : undefined }}>
        <div className="px-2 py-1 text-xs font-medium" style={{ background: isLightMode ? '#fafcff' : '#0f1419', color: isLightMode ? '#64748b' : '#9ca3af' }}>TRIX ({indicatorConfig.trix.period})</div>
        <div ref={trixContainerRef} className="relative h-[120px]" style={{ background: isLightMode ? '#fafcff' : '#0a0e17' }} />
      </div>
    )}

    {indicatorConfig.obv?.enabled && (
      <div className="border-t border-gray-800/30" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : undefined }}>
        <div className="px-2 py-1 text-xs font-medium" style={{ background: isLightMode ? '#fafcff' : '#0f1419', color: isLightMode ? '#64748b' : '#9ca3af' }}>OBV</div>
        <div ref={obvContainerRef} className="relative h-[120px]" style={{ background: isLightMode ? '#fafcff' : '#0a0e17' }} />
      </div>
    )}

    {indicatorConfig.elderRay?.enabled && (
      <div className="border-t border-gray-800/30" style={{ borderColor: isLightMode ? 'rgba(0,0,0,0.1)' : undefined }}>
        <div className="px-2 py-1 text-xs font-medium" style={{ background: isLightMode ? '#fafcff' : '#0f1419', color: isLightMode ? '#64748b' : '#9ca3af' }}>Elder Ray ({indicatorConfig.elderRay.period})</div>
        <div ref={elderRayContainerRef} className="relative h-[120px]" style={{ background: isLightMode ? '#fafcff' : '#0a0e17' }} />
      </div>
    )}

    <IndicatorControls
        isOpen={showIndicators}
        onClose={handleCloseIndicators}
        config={indicatorConfig}
        onChange={setIndicatorConfig}
      />
    </div>

    {}
    {typeof document !== 'undefined' && showReferralModal && createPortal(
      <div
        className="ref-backdrop"
        style={{
          position: 'fixed', inset: 0, zIndex: 2147483647,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backgroundColor: 'rgba(0,0,0,0.72)',
        }}
        onClick={() => setShowReferralModal(false)}
      >
        <div
          className="ref-modal-box"
          style={{
            background: 'linear-gradient(150deg, #1c2033 0%, #12161f 100%)',
            border: '2px solid #ff6b35',
            borderRadius: '20px',
            padding: '28px 30px 24px',
            minWidth: '300px', maxWidth: '390px', width: '90vw',
            boxShadow: '8px 8px 0px #ff6b35, 0 24px 64px rgba(0,0,0,0.6)',
            position: 'relative',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {}
          <button
            className="ref-close-btn"
            onClick={() => setShowReferralModal(false)}
            style={{
              position: 'absolute', top: '13px', right: '13px',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '7px', color: '#999', fontSize: '13px',
              cursor: 'pointer', width: '28px', height: '28px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
            }}
          >✕</button>

          {}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div style={{
              width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0,
              background: 'linear-gradient(135deg, #ff6b35, #ff9a5c)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(255,107,53,0.45)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <div>
              <div style={{ color: '#ff6b35', fontWeight: 800, fontSize: '16px' }}>Program Referral</div>
              <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>Ajak teman & raih bonus bersama</div>
            </div>
          </div>

          {}
          <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,107,53,0.35), transparent)', marginBottom: '18px' }} />

          {}
          <div style={{ color: '#777', fontSize: '10.5px', fontWeight: 700, letterSpacing: '1.8px', marginBottom: '10px' }}>
            KODE REFERRAL KAMU
          </div>

          {}
          <div
            className="ref-code-box"
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              background: '#0c1018',
              border: '2px solid #ff6b35',
              borderRadius: '12px',
              padding: '14px 16px',
              marginBottom: '12px',
            }}
          >
            {referralLoading ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg className="ref-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6b35" strokeWidth="2.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                <span style={{ color: '#555', fontSize: '13px' }}>Memuat kode referral...</span>
              </div>
            ) : (
              <span style={{
                flex: 1, fontFamily: 'monospace', fontSize: '22px', fontWeight: 900,
                color: referralCode ? '#fff' : '#444',
                letterSpacing: '4px',
              }}>
                {referralCode ?? '—'}
              </span>
            )}
            <button
              className="ref-copy-btn"
              onClick={() => {
                if (referralCode) {
                  navigator.clipboard.writeText(referralCode)
                  setReferralCopied(true)
                  setTimeout(() => setReferralCopied(false), 2000)
                }
              }}
              disabled={!referralCode || referralLoading}
              style={{
                background: referralCopied ? '#22c55e' : 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                border: 'none', borderRadius: '8px',
                padding: '8px 14px', color: '#fff',
                fontWeight: 700, fontSize: '12px',
                cursor: referralCode ? 'pointer' : 'not-allowed',
                opacity: !referralCode || referralLoading ? 0.4 : 1,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap', flexShrink: 0,
              }}
            >
              {referralCopied ? '✓ Disalin!' : 'Salin'}
            </button>
          </div>

          {}
          {referralCode && (
            <div style={{
              background: 'rgba(255,107,53,0.07)',
              border: '1px solid rgba(255,107,53,0.18)',
              borderRadius: '10px',
              padding: '10px 14px',
              marginBottom: '14px',
            }}>
              <div style={{ color: '#666', fontSize: '10px', fontWeight: 700, letterSpacing: '1.2px', marginBottom: '5px' }}>LINK REFERRAL</div>
              <div style={{ color: '#bbb', fontSize: '11px', wordBreak: 'break-all', fontFamily: 'monospace', lineHeight: 1.5 }}>
                {typeof window !== 'undefined' ? `${window.location.origin}/?ref=${referralCode}` : `/?ref=${referralCode}`}
              </div>
            </div>
          )}

          <div style={{ color: '#4a5060', fontSize: '11px', textAlign: 'center' }}>
            🎁 Bagikan kode ini ke teman untuk mendapatkan bonus referral!
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  )
})

TradingChart.displayName = 'TradingChart'

if (typeof document !== 'undefined') {
  const styleId = 'trading-chart-animations'
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      @keyframes dropdown-in {
        from {
          opacity: 0;
          transform: translateY(-8px) scale(0.96);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      @keyframes dropdown-out {
        from {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
        to {
          opacity: 0;
          transform: translateY(-8px) scale(0.96);
        }
      }
      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fade-out {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      .animate-dropdown-in {
        animation: dropdown-in 0.2s cubic-bezier(0.16, 1, 0.3, 1);
      }
      .animate-dropdown-out {
        animation: dropdown-out 0.2s cubic-bezier(0.4, 0, 1, 1);
      }
      .animate-fade-in {
        animation: fade-in 0.2s ease-out;
      }
      .animate-fade-out {
        animation: fade-out 0.2s ease-in;
      }
    `
    document.head.appendChild(style)
  }
}

export default TradingChart