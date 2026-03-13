// app/LandingPageClient.tsx — CLIENT COMPONENT
// Komponen ini dirender dari app/page.tsx (server component)
// Semua logika interaktif, auth modal, dan animasi ada di sini
'use client'

import dynamic from 'next/dynamic'
import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore, useAuthHydration } from '@/store/auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'
const DemoTradingTutorial = dynamic(
  () => import('@/components/DemoTradingTutorial'),
  { ssr: false }
)
import {
  TrendUp,
  TrendDown,
  Lightning,
  Shield,
  Clock,
  ChartBar,
  Medal,
  Users,
  ArrowRight,
  Star,
  Globe,
  Target,
  X,
  Sparkle,
  Activity,
  UserPlus,
  CurrencyDollar,
  CaretLeft,
  CaretRight,
  ShieldCheckered,
  Eye,
  EyeSlash,
  SquaresFour,
  ChartLineUp,
  LockSimple,
} from "phosphor-react";
import {
  subscribeToCryptoPrices,
  generateLiveTrade,
  getRecentTrades,
  realTradeToLiveTrade,
  getMarketStats,
  formatCryptoPrice,
  formatChangePercent,
  CryptoPriceData,
  LiveTradeData,
  MarketStats,
} from '@/lib/crypto-price'
import { signInWithGoogle, getIdToken, isRedirectPending } from '@/lib/firebase-auth'
const EnhancedFooter = dynamic(
  () => import('@/components/EnhancedFooter'),
  { ssr: false }
)

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (delay = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1], delay },
  }),
}

const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: (delay = 0) => ({
    opacity: 1, x: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay },
  }),
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.88 },
  visible: (delay = 0) => ({
    opacity: 1, scale: 1,
    transition: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1], delay },
  }),
}

const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
}

const cardHover = {
  rest: { scale: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  hover: { scale: 1.025, y: -4, transition: { duration: 0.2, ease: 'easeOut' } },
  tap: { scale: 0.975, transition: { duration: 0.1 } },
}

const btnHover = {
  rest: { scale: 1 },
  hover: { scale: 1.04, transition: { duration: 0.18, ease: 'easeOut' } },
  tap: { scale: 0.96, transition: { duration: 0.1 } },
}

async function loadGSAP() {
  const { gsap } = await import('gsap')
  const { ScrollTrigger } = await import('gsap/ScrollTrigger')
  gsap.registerPlugin(ScrollTrigger)
  return { gsap, ScrollTrigger }
}

function splitTextToWordSpans(el: HTMLElement): HTMLSpanElement[] {
  const originalText = el.textContent || ''
  el.textContent = ''
  return originalText.split(' ').filter(Boolean).map((word, i, arr) => {
    const span = document.createElement('span')
    span.textContent = i < arr.length - 1 ? word + '\u00A0' : word
    span.style.display = 'inline-block'
    span.style.overflow = 'hidden'
    el.appendChild(span)
    return span
  })
}

interface RevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'left' | 'right' | 'fade'
}
function Reveal({ children, className = '', delay = 0, direction = 'up' }: RevealProps) {
  const initial = {
    opacity: 0,
    ...(direction === 'up'    ? { y: 32 }  :
        direction === 'left'  ? { x: -32 } :
        direction === 'right' ? { x: 32 }  : {}),
  }
  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: delay / 1000 }}
    >
      {children}
    </motion.div>
  )
}

const charContainer = {
  hidden: {},
  visible: (delay = 0) => ({
    transition: { staggerChildren: 0.08, delayChildren: delay },
  }),
}
const charItem = {
  hidden: { opacity: 0, y: 10, filter: 'blur(10px)' },
  visible: {
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { duration: 1.0, ease: [0.16, 1, 0.3, 1] },
  },
}

interface CharRevealProps {
  text: string
  className?: string
  delaySeconds?: number
  as?: 'span' | 'div'
}
function CharReveal({ text, className = '', delaySeconds = 0, as: Tag = 'span' }: CharRevealProps) {
  const [started, setStarted] = React.useState(false)
  React.useEffect(() => {
    const t = setTimeout(() => setStarted(true), delaySeconds * 1000)
    return () => clearTimeout(t)
  }, [delaySeconds])
  return (
    <motion.span
      className={`inline-block ${className}`}
      variants={charContainer}
      initial="hidden"
      animate={started ? 'visible' : 'hidden'}
      custom={0}
    >
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          variants={charItem}
          style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : undefined }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.span>
  )
}

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

function generateGridLines(
  width: number,
  height: number,
  seed = 42,
  minGap = 28,
  maxGap = 180
): { xs: number[]; ys: number[] } {
  const rng = seededRandom(seed)
  const xs: number[] = [0]
  const ys: number[] = [0]


  const steps = [minGap, minGap * 2, minGap * 4]

  let x = 0
  while (x < width) {
    const r = rng()
    const step = r < 0.5 ? steps[0] : r < 0.78 ? steps[1] : steps[2]
    x += step
    if (x < width) xs.push(x)
  }
  xs.push(width)

  let y = 0
  while (y < height) {
    const r = rng()
    const step = r < 0.5 ? steps[0] : r < 0.78 ? steps[1] : steps[2]
    y += step
    if (y < height) ys.push(y)
  }
  ys.push(height)

  return { xs, ys }
}

interface RandomGridProps {
  seed?: number
  opacity?: number
  lineColor?: string
  className?: string
}

function RandomGrid({
  seed = 42,
  opacity = 0.06,
  lineColor = 'rgba(255,255,255,0.6)',
  className = '',
}: RandomGridProps) {

  const W = 1200
  const H = 900
  const { xs, ys } = generateGridLines(W, H, seed)

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      style={{ opacity }}
      aria-hidden
    >
      {}
      {xs.map((x, i) => (
        <line
          key={`v${i}`}
          x1={x} y1={0} x2={x} y2={H}
          stroke={lineColor}
          strokeWidth={0.5}
        />
      ))}
      {}
      {ys.map((y, i) => (
        <line
          key={`h${i}`}
          x1={0} y1={y} x2={W} y2={y}
          stroke={lineColor}
          strokeWidth={0.5}
        />
      ))}
    </svg>
  )
}

const BASE_STATS = [
  { label: 'Unduhan', value: '1 jt+', rawValue: 1, suffix: 'jt+', icon: Users },
  { label: 'Volume Harian', value: '$10B+', rawValue: 10, suffix: 'B+', icon: CurrencyDollar, isVolume: true },
  { label: 'Realtime', value: '24/7', rawValue: 24, suffix: '/7', icon: Clock },
  { label: 'Negara', value: '15+', rawValue: 15, suffix: '+', icon: Globe },
]

const features = [
  {
    icon: Lightning,
    title: 'Eksekusi Kilat',
    description: 'Eksekusi order dalam milidetik',
    gradient: 'from-emerald-500/20 to-blue-600/20',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
  {
    icon: Shield,
    title: 'Keamanan Tinggi',
    description: 'Enkripsi tingkat tinggi melindungi dana Anda',
    gradient: 'from-sky-500/20 to-cyan-500/20',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30'
  },
  {
    icon: ChartBar,
    title: 'Analisis Real-Time',
    description: 'Chart disediakan langsung dari Tradingview',
    gradient: 'from-violet-500/20 to-pink-500/20',
    color: 'text-violet-400',
    bgColor: 'bg-violet-500/10',
    borderColor: 'border-violet-500/30'
  },
  {
    icon: Medal,
    title: 'Profit Hingga 100%',
    description: 'Keuntungan maksimal dibanding platform lain',
    gradient: 'from-emerald-500/20 to-emerald-500/20',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30'
  },
]

const TICKER_SYMBOLS: Array<{ binance: string; display: string }> = [
  { binance: 'BTCUSDT', display: 'BTC/USD' },
  { binance: 'ETHUSDT', display: 'ETH/USD' },
  { binance: 'BNBUSDT', display: 'BNB/USD' },
]

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null
  const max = Math.max(...data) || 1
  return (
    <div className="flex items-end gap-[2px] h-6">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all duration-500"
          style={{
            height: `${Math.max(15, (v / max) * 100)}%`,
            background: i === data.length - 1
              ? 'rgba(52,211,153,0.9)'
              : `rgba(52,211,153,${0.25 + (i / data.length) * 0.45})`,
          }}
        />
      ))}
    </div>
  )
}

const CryptoSVGs: Record<string, (size: number) => React.ReactElement> = {
  BTC: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F7931A"/>
      <path d="M22.3 14.4c.3-2.1-1.3-3.2-3.5-4l.7-2.8-1.7-.4-.7 2.7-1.4-.3.7-2.7-1.7-.4-.7 2.7-1.1-.3-2.3-.6-.4 1.8s1.3.3 1.2.3c.7.2.8.6.8 1l-.8 3.3v.2l-1.1 4.4c-.1.2-.3.5-.7.4-.1 0-1.2-.3-1.2-.3l-.8 2 2.2.5 1.2.3-.7 2.8 1.7.4.7-2.8 1.4.3-.7 2.8 1.7.4.7-2.8c2.9.5 5.1.3 6-2.3.7-2-.1-3.2-1.5-3.9 1.1-.3 1.9-1 2.1-2.5zm-3.8 5.3c-.5 2-4 .9-5.1.7l.9-3.6c1.1.3 4.7.8 4.2 2.9zm.5-5.4c-.5 1.8-3.4.9-4.4.7l.8-3.3c1 .3 4.1.7 3.6 2.6z" fill="white"/>
    </svg>
  ),
  ETH: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#627EEA"/>
      <path d="M16 5v8.22l6.96 3.11L16 5z" fill="white" fillOpacity="0.6"/>
      <path d="M16 5L9.04 16.33 16 13.22V5z" fill="white"/>
      <path d="M16 21.97v5.03l6.96-9.63L16 21.97z" fill="white" fillOpacity="0.6"/>
      <path d="M16 27v-5.03l-6.96-4.6L16 27z" fill="white"/>
      <path d="M16 20.67l6.96-4.34L16 13.22v7.45z" fill="white" fillOpacity="0.2"/>
      <path d="M9.04 16.33L16 20.67V13.22l-6.96 3.11z" fill="white" fillOpacity="0.6"/>
    </svg>
  ),
  BNB: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F3BA2F"/>
      <path d="M12.12 14.05L16 10.17l3.89 3.89 2.26-2.26L16 5.65 9.86 11.8l2.26 2.25zM5.65 16l2.26-2.26 2.26 2.26-2.26 2.26L5.65 16zm6.47 1.95L16 21.83l3.89-3.89 2.26 2.25L16 26.35l-6.14-6.14-.01-.01 2.27-2.25zm9.97-1.95l2.26-2.26 2.26 2.26-2.26 2.26L22.09 16zm-3.56 0L16 13.47l-1.91 1.91-.22.22-.45.45.01.01-.01.01 2.58 2.59 2.59-2.59-.01-.01z" fill="white"/>
    </svg>
  ),
  SOL: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#9945FF"/>
      <path d="M9.5 20.5h13.6l-2.8 2.8H6.7l2.8-2.8zm0-11.8h13.6l-2.8 2.8H6.7l2.8-2.8zm11.1 5.9l2.8-2.8H9.3L6.5 14.6h14.1z" fill="white"/>
    </svg>
  ),
  XRP: (size) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#346AA9"/>
      <path d="M22 8h2.6l-5.5 5.4c-1.7 1.7-4.5 1.7-6.2 0L7.4 8H10l4.2 4.1c1 1 2.6 1 3.6 0L22 8zm.6 16H20l-4.2-4.1c-1-1-2.6-1-3.6 0L8 24H5.4l5.5-5.4c1.7-1.7 4.5-1.7 6.2 0L22.6 24z" fill="white"/>
    </svg>
  ),
}

const CRYPTO_COLORS: Record<string, string> = {
  BTC: '#F7931A', ETH: '#627EEA', BNB: '#F3BA2F',
  SOL: '#9945FF', XRP: '#346AA9', ADA: '#0033AD',
  DOT: '#E6007A', MATIC: '#8247E5',
}

function CryptoIcon({ symbol, size = 32, className = '' }: { symbol: string; size?: number; className?: string }) {
  const sym = symbol.toUpperCase()
  const SvgIcon = CryptoSVGs[sym]

  if (SvgIcon) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        {SvgIcon(size)}
      </span>
    )
  }


  const bg = CRYPTO_COLORS[sym] ?? '#4B5563'
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full text-white font-bold flex-shrink-0 ${className}`}
      style={{ width: size, height: size, background: bg, fontSize: Math.round(size * 0.36) }}
    >
      {sym.slice(0, 2)}
    </span>
  )
}

function maskUsername(name: string): string {
  if (!name || name.length <= 4) return name
  return name.slice(0, 4) + '***'
}

const LiveCryptoTicker = () => {
  const [trades, setTrades] = useState<LiveTradeData[]>([])
  const [totalCount, setTotalCount] = useState(1284)
  const [activityBars, setActivityBars] = useState<number[]>([40, 55, 38, 70, 52, 65, 48, 60])

  useEffect(() => {
    let active = true

    const fetchAndUpdate = async () => {
      const sym = TICKER_SYMBOLS[Math.floor(Math.random() * TICKER_SYMBOLS.length)]
      const realTrades = await getRecentTrades(sym.binance, 3)
      if (!active) return

      const newTrade = realTrades.length > 0
        ? realTradeToLiveTrade(realTrades[realTrades.length - 1], sym.display)
        : generateLiveTrade(sym.display, 0)

      setTrades(prev => [newTrade, ...prev.slice(0, 4)])
      setTotalCount(prev => prev + Math.floor(Math.random() * 4 + 1))
      setActivityBars(prev => {
        const next = [...prev.slice(1), Math.floor(Math.random() * 60 + 30)]
        return next
      })
    }

    fetchAndUpdate()
    const interval = setInterval(fetchAndUpdate, 4000)
    return () => { active = false; clearInterval(interval) }
  }, [])

  const buyCount = trades.filter(t => t.direction === 'BUY').length
  const sellCount = trades.filter(t => t.direction === 'SELL').length
  const total = buyCount + sellCount || 1
  const buyPct = Math.round((buyCount / total) * 100)

  return (
    <div className="hidden lg:block absolute bottom-28 right-6 w-72 bg-[#080c14] border border-gray-800/60 rounded-2xl shadow-2xl z-10 animate-slide-in-right overflow-hidden">

      {}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-800/60">
        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" />
        <span className="text-xs font-bold text-gray-200 tracking-wide">Transaksi Live</span>
        <span className="ml-auto text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">REAL</span>
      </div>

      {}
      <div className="grid grid-cols-3 divide-x divide-gray-800/60 border-b border-gray-800/60">
        <div className="px-3 py-2 text-center">
          <div className="text-[10px] text-gray-500 mb-0.5">Transaksi</div>
          <div className="text-xs font-bold text-white">{totalCount.toLocaleString('id-ID')}</div>
        </div>
        <div className="px-3 py-2 text-center">
          <div className="text-[10px] text-gray-500 mb-0.5">BUY</div>
          <div className="text-xs font-bold text-emerald-400">{buyPct}%</div>
        </div>
        <div className="px-3 py-2 text-center">
          <div className="text-[10px] text-gray-500 mb-0.5">SELL</div>
          <div className="text-xs font-bold text-red-400">{100 - buyPct}%</div>
        </div>
      </div>

      {}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] text-emerald-400 font-semibold">BUY {buyPct}%</span>
          <span className="text-[9px] text-red-400 font-semibold">SELL {100 - buyPct}%</span>
        </div>
        <div className="w-full h-1.5 bg-red-500/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${buyPct}%` }}
          />
        </div>
      </div>

      {}
      <div className="px-4 pb-3">
        <div className="text-[9px] text-gray-600 mb-1">Aktivitas (8 siklus terakhir)</div>
        <MiniSparkline data={activityBars} />
      </div>

      {}
      <div className="px-4 pb-1 space-y-1.5 max-h-[220px] overflow-hidden">
        {trades.map((trade, i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-2 rounded-lg border transition-all duration-300 ${
              i === 0
                ? 'bg-emerald-500/8 border-emerald-500/25'
                : 'bg-white/[0.02] border-white/5'
            }`}
            style={{ opacity: 1 - i * 0.15 }}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CryptoIcon symbol={trade.asset.split('/')[0]} size={24} className="flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-[11px] font-semibold text-gray-200 truncate">{maskUsername(trade.user)}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] text-gray-500">{trade.asset}</span>
                  {trade.direction && (
                    <span className={`text-[8px] font-bold px-1 py-px rounded ${
                      trade.direction === 'BUY'
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : 'bg-red-500/15 text-red-400'
                    }`}>
                      {trade.direction}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-[11px] font-bold text-emerald-400">
                +Rp {(trade.profit / 1000).toFixed(0)}K
              </div>
              <div className="text-[9px] text-gray-600">{trade.time}</div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="px-4 py-2.5 border-t border-gray-800/60 flex items-center justify-between mt-1">
        <span className="text-[9px] text-gray-600">Data from Binance</span>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-[9px] text-emerald-500/70">Live</span>
        </div>
      </div>
    </div>
  )
}

interface FloatingCryptoPriceCardProps {
  symbol: string
  delay: number
  style: React.CSSProperties
}

const FloatingCryptoPriceCard = ({ symbol, delay, style }: FloatingCryptoPriceCardProps) => {
  const [priceData, setPriceData] = useState<CryptoPriceData | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToCryptoPrices(
      [symbol],
      (prices) => {
        if (prices[symbol]) {
          setPriceData(prices[symbol])
        }
      },
      5000
    )

    return () => unsubscribe()
  }, [symbol])

  if (!priceData) {
    return (
      <div
        className="hidden lg:block absolute bg-[#0a0e17] border border-gray-800/50 rounded-xl p-3 shadow-xl"
        style={{ animationDelay: `${delay}s`, ...style }}
      >
        <div className="animate-pulse">
          <div className="h-3 bg-gray-700 rounded w-16 mb-2"></div>
          <div className="h-5 bg-gray-700 rounded w-20 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-12"></div>
        </div>
      </div>
    )
  }

  const isPositive = priceData.changePercent24h >= 0

  return (
    <div
      className="hidden lg:block absolute bg-[#0a0e17] border border-gray-800/50 rounded-xl p-3 shadow-xl min-w-[130px]"
      style={{ animationDelay: `${delay}s`, ...style }}
    >
      <div className="flex items-center gap-2 mb-2">
        <CryptoIcon symbol={symbol} size={24} />
        <span className="text-xs text-gray-400 font-medium">{priceData.symbol}</span>
      </div>
      <div className="text-lg font-bold mb-1">
        ${formatCryptoPrice(priceData.price)}
      </div>
      <div className={`text-xs font-semibold flex items-center gap-1 ${
        isPositive ? 'text-emerald-400' : 'text-red-400'
      }`}>
        {isPositive ? <TrendUp className="w-3 h-3" weight="bold" /> : <TrendDown className="w-3 h-3" weight="bold" />}
        {formatChangePercent(priceData.changePercent24h)}
      </div>
    </div>
  )
}

const LiveCryptoChart = () => {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC')
  const [priceData, setPriceData] = useState<CryptoPriceData | null>(null)
  const [priceHistory, setPriceHistory] = useState<number[]>([])
  const [mobileTrades, setMobileTrades] = useState<LiveTradeData[]>([])


  const pollInterval = typeof window !== 'undefined' && window.innerWidth < 1024 ? 10000 : 3000

  useEffect(() => {
    setPriceHistory([])

    const unsubscribe = subscribeToCryptoPrices(
      [selectedCrypto],
      (newPrices) => {
        if (newPrices[selectedCrypto]) {
          const data = newPrices[selectedCrypto]
          setPriceData(data)

          setPriceHistory(prev => {
            const newHistory = [...prev, data.price]
            return newHistory.slice(-30)
          })
        }
      },
      pollInterval
    )

    return () => unsubscribe()
  }, [selectedCrypto])

  useEffect(() => {
    let active = true

    const fetchMobileTrades = async () => {
      const sym = TICKER_SYMBOLS[Math.floor(Math.random() * TICKER_SYMBOLS.length)]
      const realTrades = await getRecentTrades(sym.binance, 2)

      if (!active) return

      if (realTrades.length > 0) {
        const latest = realTrades[realTrades.length - 1]
        const liveTrade = realTradeToLiveTrade(latest, sym.display)
        setMobileTrades(prev => [liveTrade, ...prev.slice(0, 1)])
      } else {
        const fallback = generateLiveTrade(sym.display, 0)
        setMobileTrades(prev => [fallback, ...prev.slice(0, 1)])
      }
    }

    fetchMobileTrades()
    const interval = setInterval(fetchMobileTrades, 4000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const maxPrice = Math.max(...priceHistory, 1)
  const minPrice = Math.min(...priceHistory, 0)
  const priceRange = maxPrice - minPrice || 1

  return (
    <div className="relative bg-[#0d1220] border border-gray-800/50 rounded-3xl p-6 shadow-xl hover:scale-[1.01] transition-transform duration-200">
      <div className="flex gap-2 mb-4">
        {['BTC', 'ETH', 'BNB'].map(crypto => (
          <button
            key={crypto}
            onClick={() => setSelectedCrypto(crypto)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCrypto === crypto
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
            }`}
          >
            <CryptoIcon symbol={crypto} size={16} />
            {crypto}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-[#0a0e17] border border-gray-700/50 p-1.5">
            <CryptoIcon symbol={selectedCrypto} size={40} className="w-full h-full" />
          </div>
          <div>
            <div className="text-sm text-gray-400">{priceData?.symbol || `${selectedCrypto}/USD`}</div>
            <div className="text-3xl font-bold">
              {priceData ? `$${formatCryptoPrice(priceData.price)}` : 'Loading...'}
            </div>
          </div>
        </div>
        {priceData && (
          <div className="text-right">
            <div className={`flex items-center gap-1 text-lg font-semibold ${
              priceData.changePercent24h >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {priceData.changePercent24h >= 0 ? (
                <TrendUp className="w-5 h-5" weight="bold" />
              ) : (
                <TrendDown className="w-5 h-5" weight="bold" />
              )}
              {formatChangePercent(priceData.changePercent24h)}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              Live
            </div>
          </div>
        )}
      </div>

      <div className="hidden sm:block bg-[#0a0e17] rounded-2xl mb-6 overflow-hidden border border-gray-800/50">
        <div className="h-64 flex items-end justify-between gap-1 p-4">
          {priceHistory.length > 0 ? (
            priceHistory.map((price, i) => {
              const height = ((price - minPrice) / priceRange) * 80 + 20
              return (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-emerald-500/50 to-sky-500/50 rounded-t transition-all duration-500 ease-out"
                  style={{
                    height: `${height}%`,
                    opacity: i < 5 ? 0.3 : 1
                  }}
                />
              )
            })
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
              Loading chart data...
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <button className="group relative bg-gradient-to-br from-emerald-500/20 to-emerald-500/20 hover:from-emerald-500/30 hover:to-emerald-500/30 border border-emerald-500/30 rounded-xl p-4 sm:p-6 transition-colors overflow-hidden">
          <TrendUp className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 mx-auto mb-1 sm:mb-2 group-hover:scale-110 transition-transform" weight="bold" />
          <div className="font-bold text-base sm:text-lg text-emerald-400">BELI</div>
          <div className="text-[10px] sm:text-xs text-gray-400">Profit +95%</div>
        </button>

        <button className="group relative bg-gradient-to-br from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 rounded-xl p-4 sm:p-6 transition-colors overflow-hidden">
          <TrendDown className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 mx-auto mb-1 sm:mb-2 group-hover:scale-110 transition-transform" weight="bold" />
          <div className="font-bold text-base sm:text-lg text-red-400">JUAL</div>
          <div className="text-[10px] sm:text-xs text-gray-400">Profit +95%</div>
        </button>
      </div>

      <div className="lg:hidden mt-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-gray-300">Transaksi Live</span>
        </div>
        <div className="space-y-2">
          {mobileTrades.map((trade, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/10 transition-all duration-500 animate-fade-in-up"
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <CryptoIcon symbol={trade.asset.split('/')[0]} size={22} className="flex-shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-200 truncate">{maskUsername(trade.user)}</div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-400">{trade.asset}</span>
                    {trade.direction && (
                      <span className={`text-[9px] font-bold ${trade.direction === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {trade.direction}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right ml-3">
                <div className="text-xs font-bold text-emerald-400">+Rp {trade.profit.toLocaleString('id-ID')}</div>
                <div className="text-[9px] text-gray-500">{trade.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LandingPageClient() {
  const router = useRouter()
  const { user, setAuth } = useAuthStore()
  const hydrated = useAuthHydration()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isClosingModal, setIsClosingModal] = useState(false)

  const closeAuthModal = () => {
    setIsClosingModal(true)

    setTimeout(() => {
      setShowAuthModal(false)
      setIsClosingModal(false)
      setAgreedToTerms(false)
      setShowTermsWarning(false)
    }, 400)
  }


  useEffect(() => {

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024

    let ctx: any
    let cleanup: (() => void) | undefined
    loadGSAP().then(({ gsap, ScrollTrigger }) => {


      const reveal = (targets: string | HTMLElement | HTMLElement[], vars: gsap.TweenVars, trigger?: Element | string) => {
        gsap.from(targets, {
          ...vars,
          immediateRender: false,
          scrollTrigger: {
            trigger: trigger ?? (typeof targets === 'string' ? targets : undefined),
            start: 'top 87%',
            once: true,
            ...(vars.scrollTrigger as object ?? {}),
          },
        })
      }

      ctx = gsap.context(() => {




        const heroTitleEl = document.querySelector<HTMLElement>('.gsap-hero-title-line1')
        const heroAccentEl = document.querySelector<HTMLElement>('.gsap-hero-title-accent')


        gsap.set('.gsap-hero-badge',   { opacity: 0, y: 16, scale: 0.9 })
        gsap.set('.gsap-hero-desc',    { opacity: 0, y: 30 })
        gsap.set('.gsap-hero-buttons', { opacity: 0 })
        gsap.set('.gsap-hero-stats',   { opacity: 0 })
        gsap.set('.gsap-hero-chart',   { opacity: 0, x: isMobile ? 40 : 60, scale: 0.94 })

        const heroTl = gsap.timeline({ defaults: { ease: 'expo.out' } })

        if (heroTitleEl && heroAccentEl) {

          const titleWords = splitTextToWordSpans(heroTitleEl)
          heroTitleEl.style.opacity = '1'
          heroTitleEl.style.transform = 'none'




          gsap.set(heroAccentEl, { opacity: 0, y: 50, scale: 0.75 })

          heroTl
            .to('.gsap-hero-badge',   { opacity: 1, y: 0, scale: 1, duration: 0.65 }, 0.05)
            .fromTo(titleWords,
              { opacity: 0, y: 45, rotateX: -25 },
              { opacity: 1, y: 0, rotateX: 0, duration: 0.75, stagger: 0.12, ease: 'expo.out', transformOrigin: 'bottom center' },
              0.2)
            .to(heroAccentEl,
              { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: 'back.out(2)' },
              0.48)
            .to('.gsap-hero-desc',        { opacity: 1, y: 0, duration: 0.7 }, 0.55)
            .to('.gsap-hero-buttons',     { opacity: 1, duration: 0.55, ease: 'power2.out' }, 0.75)
            .to('.gsap-hero-stats',       { opacity: 1, duration: 0.5 }, 0.9)
            .to('.gsap-hero-chart',       { opacity: 1, x: 0, scale: 1, duration: 1.1, ease: 'power3.out' }, 0.2)
        } else {

          heroTl
            .to('.gsap-hero-badge',       { opacity: 1, y: 0, scale: 1, duration: 0.65 }, 0.05)
            .to('.gsap-hero-title',       { opacity: 1, y: 0, duration: 1.05, ease: 'power4.out' }, 0.2)
            .to('.gsap-hero-title span',  { opacity: 1, scale: 1, duration: 0.7, ease: 'back.out(2)' }, 0.55)
            .to('.gsap-hero-desc',        { opacity: 1, y: 0, duration: 0.7 }, 0.5)
            .to('.gsap-hero-buttons',     { opacity: 1, duration: 0.55, ease: 'power2.out' }, 0.72)
            .to('.gsap-hero-stats',       { opacity: 1, duration: 0.5 }, 0.88)
            .to('.gsap-hero-chart',       { opacity: 1, x: 0, scale: 1, duration: 1.1, ease: 'power3.out' }, 0.2)
        }




        gsap.utils.toArray<HTMLElement>('.gsap-float-blob').forEach((blob, i) => {
          const yRange = 18 + i * 8
          const xRange = 12 + i * 5
          const dur    = 5 + i * 1.5
          gsap.to(blob, {
            y: `+=${yRange}`,
            x: `+=${xRange}`,
            duration: dur,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            delay: i * 0.8,
          })
        })




        gsap.utils.toArray<HTMLElement>('.gsap-orb').forEach((orb, i) => {
          const tl = gsap.timeline({ repeat: -1, yoyo: true, delay: i * 1.2 })
          tl.to(orb, { y: -24, x: 12, scale: 1.08, duration: 3.5 + i, ease: 'sine.inOut' })
            .to(orb, { y: 12, x: -8, scale: 0.94, duration: 4 + i, ease: 'sine.inOut' })
        })




        gsap.utils.toArray<HTMLElement>('.gsap-counter').forEach(el => {
          const end    = parseFloat(el.dataset.count || '0')
          const prefix = el.dataset.prefix || ''
          const suffix = el.dataset.suffix || ''
          const isFloat = String(end).includes('.')
          const obj     = { val: 0 }

          ScrollTrigger.create({
            trigger: el,
            start: 'top 90%',
            once: true,
            onEnter: () => {
              gsap.to(obj, {
                val: end,
                duration: 2,
                ease: 'power2.out',
                onUpdate: () => {
                  const display = isFloat ? obj.val.toFixed(1) : Math.round(obj.val)
                  el.textContent = `${prefix}${display}${suffix}`
                },
              })
            },
          })
        })




        gsap.utils.toArray<HTMLElement>('.gsap-parallax-img').forEach((el, i) => {
          const depth = i % 2 === 0 ? -40 : 40
          gsap.to(el, {
            y: depth,
            ease: 'none',
            scrollTrigger: {
              trigger: el.closest('section') || el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.2,
            },
          })
        })




        gsap.set('.gsap-navbar', { opacity: 0, y: -40 })
        gsap.to('.gsap-navbar', { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.02 })

        // ── Section 1 image blur-in ───────────────────────────
        const s1Imgs = gsap.utils.toArray<HTMLElement>('.gsap-s1-img')
        if (s1Imgs.length) {
          gsap.set(s1Imgs, { opacity: 0, scale: 1.12, filter: 'blur(36px)' })
          gsap.to(s1Imgs, {
            opacity: 0.8,
            scale: 1,
            filter: 'blur(0px)',
            duration: 3.0,
            ease: 'power4.out',
            delay: 0.05,
          })
        }

        // ── Section 1 text: berurutan satu per satu ──────────
        const s1Els = gsap.utils.toArray<HTMLElement>('.gsap-s1')
        if (s1Els.length) {
          gsap.set(s1Els, { opacity: 0, filter: 'blur(16px)', y: 24 })
          gsap.to(s1Els, {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            duration: 1.0,
            ease: 'expo.out',
            stagger: { each: 0.55, from: 'start' },
            delay: 0.6,
          })
        }

        // ── Section 2 image + text blur-in (ScrollTrigger) ──
        const s2Imgs = gsap.utils.toArray<HTMLElement>('.gsap-s2-img')
        if (s2Imgs.length) {
          gsap.set(s2Imgs, { opacity: 0, scale: 1.1, filter: 'blur(30px)' })
          gsap.to(s2Imgs, {
            opacity: 0.85,
            scale: 1,
            filter: 'blur(0px)',
            duration: 2.5,
            ease: 'power4.out',
            scrollTrigger: { trigger: '.gsap-s2-section', start: 'top 85%', once: true },
          })
        }
        const s2Els = gsap.utils.toArray<HTMLElement>('.gsap-s2')
        if (s2Els.length) {
          gsap.set(s2Els, { opacity: 0, y: 30, filter: 'blur(12px)' })
          gsap.to(s2Els, {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 1.2,
            ease: 'expo.out',
            stagger: { each: 0.5, from: 'start' },
            scrollTrigger: { trigger: '.gsap-s2-section', start: 'top 75%', once: true },
          })
        }

        // ── Section 3 image + text blur-in (ScrollTrigger) ──
        const s3Imgs = gsap.utils.toArray<HTMLElement>('.gsap-s3-img')
        if (s3Imgs.length) {
          gsap.set(s3Imgs, { opacity: 0, scale: 1.1, filter: 'blur(30px)' })
          gsap.to(s3Imgs, {
            opacity: 0.85, scale: 1, filter: 'blur(0px)',
            duration: 2.5, ease: 'power4.out',
            scrollTrigger: { trigger: '.gsap-s3-section', start: 'top 85%', once: true },
          })
        }
        const s3Els = gsap.utils.toArray<HTMLElement>('.gsap-s3')
        if (s3Els.length) {
          gsap.set(s3Els, { opacity: 0, y: 30, filter: 'blur(12px)' })
          gsap.to(s3Els, {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 1.2, ease: 'expo.out',
            scrollTrigger: { trigger: '.gsap-s3-section', start: 'top 75%', once: true },
          })
        }




        gsap.utils.toArray<HTMLElement>('.gsap-section-header').forEach(el => {
          gsap.set(el, { opacity: 0, y: 50 })
          gsap.to(el, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 92%', once: true },
          })
        })




        gsap.utils.toArray<HTMLElement>('.gsap-step-card').forEach((card, i) => {
          const xVal = isMobile ? (i % 2 === 0 ? -40 : 40) : (i % 2 === 0 ? -80 : 80)
          gsap.set(card, { opacity: 0, x: xVal, y: 30 })
          gsap.to(card, {
            opacity: 1, x: 0, y: 0,
            duration: 1.0, ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 88%', once: true },
          })
        })




        gsap.utils.toArray<HTMLElement>('.gsap-payment-grid').forEach(grid => {
          gsap.set(grid.children as unknown as HTMLElement[], { opacity: 0, y: 40, scale: 0.88, rotation: -2 })
          gsap.to(grid.children as unknown as HTMLElement[], {
            opacity: 1, y: 0, scale: 1, rotation: 0,
            stagger: { amount: 0.5, from: 'start' },
            duration: 0.65, ease: 'back.out(1.6)',
            scrollTrigger: { trigger: grid, start: 'top 92%', once: true },
          })
        })




        gsap.utils.toArray<HTMLElement>('.gsap-partner-row').forEach((row, i) => {
          const isEven = i % 2 === 0


          const imgWrap = row.querySelector<HTMLElement>('.gsap-partner-img')
          if (imgWrap) {
            const xOffset = isMobile ? (isEven ? -50 : 50) : (isEven ? -100 : 100)
            gsap.set(imgWrap, { opacity: 0, x: xOffset, scale: 0.88, rotation: isEven ? -4 : 4 })
            gsap.to(imgWrap, {
              opacity: 1, x: 0, scale: 1, rotation: 0,
              duration: 1.2, ease: 'power4.out',
              scrollTrigger: { trigger: row, start: 'top 88%', once: true },
            })
          }


          const logoBadge = row.querySelector<HTMLElement>('.gsap-partner-logo')
          if (logoBadge) {
            gsap.set(logoBadge, { opacity: 0, x: 30, scale: 0.8 })
            gsap.to(logoBadge, {
              opacity: 1, x: 0, scale: 1,
              duration: 0.7, ease: 'back.out(2)',
              scrollTrigger: { trigger: row, start: 'top 88%', once: true },
              delay: 0.25,
            })
          }


          const heading = row.querySelector<HTMLElement>('.gsap-partner-heading')
          if (heading) {
            gsap.set(heading, { opacity: 0, y: 40 })
            gsap.to(heading, {
              opacity: 1, y: 0,
              duration: 0.85, ease: 'power3.out',
              scrollTrigger: { trigger: row, start: 'top 88%', once: true },
              delay: 0.35,
            })
          }


          const desc = row.querySelector<HTMLElement>('.gsap-partner-desc')
          if (desc) {
            gsap.set(desc, { opacity: 0, y: 25 })
            gsap.to(desc, {
              opacity: 1, y: 0,
              duration: 0.75, ease: 'power3.out',
              scrollTrigger: { trigger: row, start: 'top 88%', once: true },
              delay: 0.48,
            })
          }


          const btn = row.querySelector<HTMLElement>('.gsap-partner-btn')
          if (btn) {
            gsap.set(btn, { opacity: 0, y: 20, scale: 0.9 })
            gsap.to(btn, {
              opacity: 1, y: 0, scale: 1,
              duration: 0.6, ease: 'back.out(1.8)',
              scrollTrigger: { trigger: row, start: 'top 88%', once: true },
              delay: 0.6,
            })
          }
        })




        const affiliateHeader = document.querySelector<HTMLElement>('.gsap-affiliate-header')
        if (affiliateHeader) {
          const badge = affiliateHeader.querySelector<HTMLElement>('.gsap-aff-badge')
          const title = affiliateHeader.querySelector<HTMLElement>('.gsap-aff-title')
          const desc = affiliateHeader.querySelector<HTMLElement>('.gsap-aff-desc')
          if (badge) { gsap.set(badge, { opacity: 0, y: 20, scale: 0.85 }); gsap.to(badge, { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(2)', scrollTrigger: { trigger: affiliateHeader, start: 'top 92%', once: true } }) }
          if (title) { gsap.set(title, { opacity: 0, y: 50 }); gsap.to(title, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: affiliateHeader, start: 'top 92%', once: true }, delay: 0.15 }) }
          if (desc)  { gsap.set(desc,  { opacity: 0, y: 30 }); gsap.to(desc,  { opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', scrollTrigger: { trigger: affiliateHeader, start: 'top 92%', once: true }, delay: 0.3 }) }
        }




        const affiliateCards = gsap.utils.toArray<HTMLElement>('.gsap-affiliate-card')
        if (affiliateCards.length) {
          gsap.set(affiliateCards, { opacity: 0, y: 60, scale: 0.88 })
          gsap.to(affiliateCards, {
            opacity: 1, y: 0, scale: 1,
            stagger: 0.18, duration: 0.85, ease: 'back.out(1.8)',
            scrollTrigger: { trigger: affiliateCards[0], start: 'top 92%', once: true },
          })
        }




        gsap.utils.toArray<HTMLElement>('.gsap-affiliate-steps-grid').forEach(grid => {
          const children = Array.from(grid.children) as HTMLElement[]
          children.forEach((child, idx) => {

            const icon = child.querySelector<HTMLElement>('.gsap-step-icon')
            const title = child.querySelector<HTMLElement>('.gsap-step-title')
            const desc = child.querySelector<HTMLElement>('.gsap-step-desc')
            gsap.set(child, { opacity: 0, y: 45, x: -15 })
            gsap.to(child, {
              opacity: 1, y: 0, x: 0,
              duration: 0.75, ease: 'power3.out',
              scrollTrigger: { trigger: grid, start: 'top 92%', once: true },
              delay: idx * 0.13,
            })
            if (icon)  { gsap.set(icon,  { opacity: 0, scale: 0.5, rotation: -20 }); gsap.to(icon,  { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(2)', scrollTrigger: { trigger: grid, start: 'top 92%', once: true }, delay: idx * 0.13 + 0.2 }) }
            if (title) { gsap.set(title, { opacity: 0, y: 10 }); gsap.to(title, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', scrollTrigger: { trigger: grid, start: 'top 92%', once: true }, delay: idx * 0.13 + 0.3 }) }
            if (desc)  { gsap.set(desc,  { opacity: 0, y: 8 }); gsap.to(desc,  { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', scrollTrigger: { trigger: grid, start: 'top 92%', once: true }, delay: idx * 0.13 + 0.38 }) }
          })
        })




        const ctaEl = document.querySelector('.gsap-cta-section') as HTMLElement
        if (ctaEl) {
          gsap.set(ctaEl, { opacity: 0, y: 80, scale: 0.94 })
          gsap.to(ctaEl, {
            opacity: 1, y: 0, scale: 1,
            duration: 1.1, ease: 'power4.out',
            scrollTrigger: { trigger: ctaEl, start: 'top 92%', once: true },
          })

          const ctaBadge = ctaEl.querySelector<HTMLElement>('.gsap-cta-badge')
          const ctaTitle = ctaEl.querySelector<HTMLElement>('.gsap-cta-title')
          const ctaDesc  = ctaEl.querySelector<HTMLElement>('.gsap-cta-desc')
          const ctaBtn   = ctaEl.querySelector<HTMLElement>('.gsap-cta-btn')
          const ctaStats = ctaEl.querySelector<HTMLElement>('.gsap-cta-stats')
          if (ctaBadge) { gsap.set(ctaBadge, { opacity: 0, scale: 0.8 }); gsap.to(ctaBadge, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', scrollTrigger: { trigger: ctaEl, start: 'top 92%', once: true }, delay: 0.4 }) }
          if (ctaTitle) { gsap.set(ctaTitle, { opacity: 0, y: 35 }); gsap.to(ctaTitle, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: ctaEl, start: 'top 92%', once: true }, delay: 0.55 }) }
          if (ctaDesc)  { gsap.set(ctaDesc,  { opacity: 0, y: 25 }); gsap.to(ctaDesc,  { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', scrollTrigger: { trigger: ctaEl, start: 'top 92%', once: true }, delay: 0.68 }) }
          if (ctaBtn)   { gsap.set(ctaBtn,   { opacity: 0, scale: 0.85 }); gsap.to(ctaBtn,   { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.8)', scrollTrigger: { trigger: ctaEl, start: 'top 92%', once: true }, delay: 0.82 }) }
          if (ctaStats) {
            const statsItems = Array.from(ctaStats.children) as HTMLElement[]
            gsap.set(statsItems, { opacity: 0, y: 20 })
            gsap.to(statsItems, { opacity: 1, y: 0, stagger: 0.12, duration: 0.5, ease: 'power2.out', scrollTrigger: { trigger: ctaEl, start: 'top 92%', once: true }, delay: 1.0 })
          }
        }

        // ── Section 1 scroll-driven cinematic animation ──────
        const s1Section = document.querySelector<HTMLElement>('.s1-section')
        if (s1Section) {
          const t1    = s1Section.querySelector<HTMLElement>('.s1-title-1')
          const t2    = s1Section.querySelector<HTMLElement>('.s1-title-2')
          const btn   = s1Section.querySelector<HTMLElement>('.s1-btn')
          const boxes = Array.from(s1Section.querySelectorAll<HTMLElement>('.s1-box-1,.s1-box-2,.s1-box-3,.s1-box-4'))

          if (t1)  gsap.set(t1,  { opacity: 0, x: -80, skewX: -8 })
          if (t2)  gsap.set(t2,  { opacity: 0, x:  80, skewX:  8 })
          if (btn) gsap.set(btn, { opacity: 0, scale: 0.7, y: 20 })
          boxes.forEach((b, i) => {
            gsap.set(b, { opacity: 0, y: i % 2 === 0 ? 40 : -40, rotateZ: i % 2 === 0 ? -6 : 6, scale: 0.85 })
          })

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: s1Section,
              start: 'top 85%',
              end: 'center 40%',
              scrub: 1.4,
            },
          })

          tl.to(t1,  { opacity: 1, x: 0, skewX: 0, duration: 1,   ease: 'power3.out' }, 0)
            .to(t2,  { opacity: 1, x: 0, skewX: 0, duration: 1,   ease: 'power3.out' }, 0.25)
            .to(btn, { opacity: 1, scale: 1, y: 0,  duration: 0.7, ease: 'back.out(2)' }, 0.55)
            .to(boxes[0], { opacity: 1, y: 0, rotateZ: 0, scale: 1, duration: 0.6, ease: 'back.out(1.6)' }, 0.70)
            .to(boxes[1], { opacity: 1, y: 0, rotateZ: 0, scale: 1, duration: 0.6, ease: 'back.out(1.6)' }, 0.82)
            .to(boxes[2], { opacity: 1, y: 0, rotateZ: 0, scale: 1, duration: 0.6, ease: 'back.out(1.6)' }, 0.94)
            .to(boxes[3], { opacity: 1, y: 0, rotateZ: 0, scale: 1, duration: 0.6, ease: 'back.out(1.6)' }, 1.06)
        }

      })

      cleanup = () => ctx?.revert()
    })
    return () => cleanup?.()
  }, [])

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)

  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [logoPhase, setLogoPhase] = useState<'stc-logo-in' | 'stc-text-in' | 'stc-hold' | 'stc-text-out' | 'stc-logo-out' | 'stockity-logo-in' | 'stockity-text-in' | 'stockity-hold' | 'stockity-text-out' | 'stockity-logo-out'>('stc-logo-in')
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [showDemoTutorial, setShowDemoTutorial] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTermsWarning, setShowTermsWarning] = useState(false)


  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    setIsDesktop(window.innerWidth >= 1024)
  }, [])


  const [stats, setStats] = useState(BASE_STATS)
  useEffect(() => {
    getMarketStats().then(mktStats => {
      if (mktStats.totalVolumeUSD > 0) {
        setStats(prev => prev.map(s =>
          s.isVolume
            ? { ...s, value: mktStats.totalVolumeFormatted, rawValue: Math.round(mktStats.totalVolumeUSD / 1_000_000_000) }
            : s
        ))
      }
    })
  }, [])


  const [referralCode, setReferralCode] = useState<string>('')
  const [affiliateCode, setAffiliateCode] = useState<string>('')
  const [hasReferralCode, setHasReferralCode] = useState(false)


  useEffect(() => {
    if (hydrated && user) {
      router.push('/trading')
    }
  }, [user, router, hydrated])


  const savedScrollY = useRef(0)

  useEffect(() => {
    if (showAuthModal) {
      savedScrollY.current = window.scrollY
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'
    } else {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
      window.scrollTo(0, savedScrollY.current)
    }
    return () => {
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''
    }
  }, [showAuthModal])


  useEffect(() => {
    if (typeof window === 'undefined') return


    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')

    if (refCode && refCode.trim() !== '') {
      const trimmed = refCode.trim()

      if (trimmed.startsWith('AFF')) {
        // Affiliate program code — kirim sebagai affiliateCode
        setAffiliateCode(trimmed)
        console.log('✅ Affiliate code detected:', trimmed)
        toast.info(`Kode affiliate: ${trimmed}`, {
          description: 'Anda akan terdaftar sebagai undangan affiliator',
          duration: 5000
        })
      } else {
        // Referral code biasa (sistem lama)
        setReferralCode(trimmed)
        console.log('✅ Referral code detected:', trimmed)
        toast.info(`Kode referral: ${trimmed}`, {
          description: 'Anda akan mendapatkan bonus saat mendaftar',
          duration: 5000
        })
      }

      setHasReferralCode(true)
      setIsLogin(false)
      setShowAuthModal(true)
    }
  }, [])


  useEffect(() => {
    const phaseTimings = {
      'stc-logo-in': 800,
      'stc-text-in': 800,
      'stc-hold': 8000,
      'stc-text-out': 800,
      'stc-logo-out': 800,
      'stockity-logo-in': 800,
      'stockity-text-in': 800,
      'stockity-hold': 4000,
      'stockity-text-out': 800,
      'stockity-logo-out': 800,
    }

    const nextPhase = {
      'stc-logo-in': 'stc-text-in',
      'stc-text-in': 'stc-hold',
      'stc-hold': 'stc-text-out',
      'stc-text-out': 'stc-logo-out',
      'stc-logo-out': 'stockity-logo-in',
      'stockity-logo-in': 'stockity-text-in',
      'stockity-text-in': 'stockity-hold',
      'stockity-hold': 'stockity-text-out',
      'stockity-text-out': 'stockity-logo-out',
      'stockity-logo-out': 'stc-logo-in',
    } as const

    const timeout = setTimeout(() => {
      setLogoPhase(nextPhase[logoPhase])
    }, phaseTimings[logoPhase])

    return () => clearTimeout(timeout)
  }, [logoPhase])


  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])


  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])





  useEffect(() => {
    if (typeof window === 'undefined') return

    if (isRedirectPending()) {
      const redirectTime = localStorage.getItem('google_auth_redirect_time')
      const timeDiff = Date.now() - parseInt(redirectTime || '0')
      if (timeDiff > 2 * 60 * 1000) {
        localStorage.removeItem('google_auth_redirect_pending')
        localStorage.removeItem('google_auth_redirect_time')
        sessionStorage.removeItem('google_auth_initiated')
      }
    }
  }, [])


  // ✅ SEO FIX: Jangan return spinner/null sebelum hydration
  // Saat SSR (hydrated=false, user=null): render halaman penuh supaya Googlebot bisa index konten
  // Saat post-hydration + user ada: tampilkan spinner sebentar sambil redirect ke /trading
  // Sebelumnya kode ini menyebabkan Googlebot hanya melihat spinner kosong (tidak ada konten)
  if (hydrated && user) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }


  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }
    if (isRightSwipe) {
      setActiveFeature((prev) => (prev === 0 ? features.length - 1 : prev - 1))
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreedToTerms) {
      setShowTermsWarning(true)
      return
    }
    setShowTermsWarning(false)
    setLoading(true)

    try {
      const response = isLogin
        ? await api.login(email, password)
        : await api.register(email, password, referralCode || undefined, affiliateCode || undefined)

      const userData = response.user || response.data?.user
      const token = response.token || response.data?.token

      if (!userData || !token) {
        toast.error('Respon tidak valid dari server')
        return
      }

      setAuth(userData, token)
      api.setToken(token)


      if (!isLogin && response.data?.affiliate) {
        const affiliate = response.data.affiliate
        toast.success('Akun berhasil dibuat!', {
          description: affiliate.referredBy
            ? `Dirujuk oleh: ${affiliate.referredBy}.`
            : 'Selamat bergabung!',
          duration: 5000
        })
      } else {
        toast.success(response.message || 'Login berhasil!')
      }

      router.push('/trading')
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Autentikasi gagal'

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }


  const handleGoogleSignIn = async () => {
    if (!agreedToTerms) {
      setShowTermsWarning(true)
      return
    }
    setShowTermsWarning(false)
    setLoadingGoogle(true)

    try {
      console.log('🔄 Starting Google Sign-In...')

      const result = await signInWithGoogle()

      if (!result || !result.user) {
        console.log('🔄 Redirecting to Google...')
        return
      }

      console.log('✅ Google authentication successful')

      const idToken = await getIdToken(result.user)
      console.log('✅ ID Token obtained')


      console.log('📤 Sending to backend with referral:', referralCode || 'none', '| affiliate:', affiliateCode || 'none')
      const response = await api.googleSignIn(idToken, referralCode || undefined, affiliateCode || undefined)

      const userData = response.user || response.data?.user
      const token = response.token || response.data?.token

      if (!userData || !token) {
        throw new Error('Invalid response from server')
      }

      console.log('✅ Backend authentication successful')

      setAuth(userData, token)
      api.setToken(token)


      const isNewUser = response.data?.isNewUser || false
      const affiliate = response.data?.affiliate

      let message = isNewUser ? 'Akun berhasil dibuat! Selamat datang!' : 'Selamat datang kembali!'

      if (affiliate?.referredBy) {
        toast.success(message, {
          description: `Dirujuk oleh: ${affiliate.referredBy}.`,
          duration: 5000
        })
      } else {
        toast.success(message)
      }

      setShowAuthModal(false)
      router.push('/trading')

    } catch (error: any) {
      console.error('❌ Google Sign-In failed:', error)

      if (error.code === 'auth/popup-blocked' ||
          error.code === 'auth/popup-closed-by-user' ||
          error.code === 'auth/cancelled-popup-request') {
        console.log('🔄 Redirecting to Google for authentication...')
        return
      }

      let errorMessage = 'Login dengan Google gagal'

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    } finally {
      setLoadingGoogle(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#0a0e17] text-white overflow-hidden">
      {}
      <div className="fixed inset-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-sky-950/40 via-transparent to-emerald-950/30" />
      </div>

      {}
      <nav className="gsap-navbar fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">

            {}
            <div className="relative h-10 w-52 overflow-visible">
              {}
              {logoPhase.startsWith('stc-') && (
                <div className="flex items-center gap-3 absolute left-0 top-0">
                  <div className={`relative w-10 h-10 flex-shrink-0 overflow-visible rounded-md ${
                    logoPhase === 'stc-logo-in' ? 'animate-logo-bounce-in' :
                    logoPhase === 'stc-logo-out' ? 'animate-logo-bounce-out' :
                    'opacity-100'
                  }`}>
                    <Image
                      src="/stc-logo1.png"
                      alt="Stouch"
                      fill
                      sizes="40px"
                      className="object-contain rounded-full bg-[#2A324B]/50"
                      priority
                    />
                  </div>

                  {(logoPhase !== 'stc-logo-in' && logoPhase !== 'stc-logo-out') && (
                    <div className="flex overflow-hidden">
                      <span className={`text-xl font-bold text-white whitespace-nowrap ${
                        logoPhase === 'stc-text-in' ? 'animate-text-slide-in' :
                        logoPhase === 'stc-text-out' ? 'animate-text-slide-out' :
                        'opacity-100 translate-x-0'
                      }`}>
                        Stouch
                      </span>
                    </div>
                  )}
                </div>
              )}

              {}
              {logoPhase.startsWith('stockity-') && (
                <div className="flex items-center gap-3 absolute left-0 top-0">
                  <div className={`relative w-10 h-10 flex-shrink-0 overflow-visible rounded-md ${
                    logoPhase === 'stockity-logo-in' ? 'animate-logo-bounce-in' :
                    logoPhase === 'stockity-logo-out' ? 'animate-logo-bounce-out' :
                    'opacity-100'
                  }`}>
                    <Image
                      src="/stockity.png"
                      alt="Stockity"
                      fill
                      sizes="40px"
                      className="object-contain rounded-md"
                      priority
                    />
                  </div>

                  {(logoPhase !== 'stockity-logo-in' && logoPhase !== 'stockity-logo-out') && (
                    <div className="flex overflow-hidden">
                      <span className={`text-xl font-semibold text-white whitespace-nowrap ${
                        logoPhase === 'stockity-text-in' ? 'animate-text-slide-in' :
                        logoPhase === 'stockity-text-out' ? 'animate-text-slide-out' :
                        'opacity-100 translate-x-0'
                      }`}>
                        By Stockity
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {}
            <div className="hidden md:flex items-center gap-8">
              <a href="#payment" className="text-sm text-gray-300 hover:text-white transition-colors relative group">
                Pembayaran
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-sky-500 to-emerald-500 group-hover:w-full transition-all"></span>
              </a>
              <a href="#how-it-works" className="text-sm text-gray-300 hover:text-white transition-colors relative group">
                Cara Kerja
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-sky-500 to-emerald-500 group-hover:w-full transition-all"></span>
              </a>
            </div>

            {}
            <div className="flex items-center gap-2">
              {/* Tombol Masuk dengan shimmer topup style — hidden di mobile */}
              <div className="relative rounded-lg overflow-hidden group p-px hidden md:block">
                {/* Layer 1: conic shimmer utama */}
                <div
                  className="absolute inset-[-100%]"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, transparent 35%, rgba(255,255,255,0.15) 42%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.15) 58%, transparent 65%, transparent 85%, rgba(255,255,255,0.08) 92%, rgba(255,255,255,0.4) 100%)',
                    animation: 'spin-variable 4s ease-in-out infinite',
                  }}
                />
                {/* Layer 2: glow blur */}
                <div
                  className="absolute inset-[-100%] blur-sm"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0%, transparent 38%, rgba(16,185,129,0.4) 50%, transparent 62%, transparent 100%)',
                    animation: 'spin-variable 4s ease-in-out infinite',
                  }}
                />
                {/* Bg dasar */}
                <div className="absolute inset-[1px] rounded-lg bg-[#111318]" />
                <div className="absolute inset-[1px] rounded-lg bg-white/0 group-hover:bg-white/5 transition-colors duration-300" />
                <button
                  onClick={() => { setIsLogin(true); setShowAuthModal(true) }}
                  className="relative z-10 flex items-center gap-2 px-5 py-2.5 bg-transparent rounded-[6px] text-sm font-semibold text-white transition-all duration-300"
                >
                  Masuk
                </button>
              </div>

              {/* Tombol Daftar — style asli */}
              <button
                onClick={() => { setIsLogin(false); setShowAuthModal(true) }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#111318] hover:bg-[#1a1f28] rounded-lg text-sm font-semibold text-white shadow-lg transition-colors border border-gray-700/60"
              >
                <UserPlus className="w-4 h-4" weight="bold" />
                Daftar
              </button>
            </div>

          </div>
        </div>
      </nav>

      {/* ── Section 1 ─────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center bg-black overflow-hidden md:pt-0 md:mt-20">

        {/* Gambar mobile: best1.jpg (1:1), desktop: best1pc.jpeg */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/best1.jpg"
            alt="Stouch background"
            className="gsap-s1-img block md:hidden w-full h-full"
            style={{ opacity: 0, objectFit: 'cover', objectPosition: '50% 20%' }}
          />
          <img
            src="/best1pc.jpeg"
            alt="Stouch background"
            className="gsap-s1-img hidden md:block w-full h-full" style={{ opacity: 0, objectFit: "cover" }}
          />
        </div>

        {/* Gradasi hitam atas */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
        {/* Gradasi hitam bawah */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />

        {/* Content */}
        <div className="relative z-10 w-full h-full min-h-screen">

          {/* Mobile: center */}
          <div className="flex flex-col items-center justify-center text-center h-full min-h-screen px-6 gap-10 md:hidden">
            <h2 className="gsap-s1 text-4xl font-extrabold text-white" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)', opacity: 0 }}>
              <span className="block text-xl whitespace-nowrap font-bold">
                <CharReveal text="Semua investasi dikelola dengan" delaySeconds={1} />
              </span>
              <span className="block text-xl whitespace-nowrap font-light">
                <CharReveal text="mudah dan aman dalam satu platform." delaySeconds={2} />
              </span>
            </h2>
            <motion.button
              onClick={() => { setIsLogin(true); setShowAuthModal(true) }}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="gsap-s1 btn-glow inline-flex items-center justify-center w-48 py-3.5 bg-gradient-to-r from-emerald-800 to-emerald-500 hover:from-emerald-700 hover:to-emerald-400 rounded-xl text-base font-normal text-white shadow-lg shadow-emerald-900/40" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)', opacity: 0 }}
            >
              Login Sekarang
            </motion.button>
            <div className="gsap-s1 flex flex-row gap-2 flex-wrap justify-center" style={{ opacity: 0 }}>
              {[
                { label: 'Antarmuka intuitif',      icon: <SquaresFour className="w-3 h-3 text-white flex-shrink-0" weight="fill" /> },
                { label: '20+ aset',               icon: <ChartLineUp className="w-3 h-3 text-white flex-shrink-0" weight="bold" /> },
                { label: 'Terenkripsi',          icon: <LockSimple className="w-3 h-3 text-white flex-shrink-0" weight="bold" /> },
                { label: 'Berlisensi', icon: <Medal className="w-3 h-3 text-white flex-shrink-0" weight="fill" /> },
              ].map((item) => (
                <div key={item.label} className="flex flex-row items-center gap-1 bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 backdrop-blur-sm whitespace-nowrap">
                  {item.icon}
                  <span className="text-[10px] font-light text-white">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: center */}
          <div className="hidden md:flex flex-col items-center justify-center text-center h-full min-h-screen px-16 gap-10">
            <h2 className="gsap-s1 text-5xl font-bold text-white" style={{ textShadow: '0 2px 12px rgba(0,0,0,0.5)', opacity: 0 }}>
              <span className="inline-block px-3 py-1 rounded-lg mb-1 backdrop-blur-xl" style={{ background: 'linear-gradient(to right, rgb(0, 0, 0), rgba(255, 255, 255, 0))' }}>
                <span className="shimmer-title-stouch">Stouch</span>
                <span className="shimmer-title-id">.id</span>
              </span>
              <span className="block font-light">
                <CharReveal text="Membuat investasi menjadi jelas" delaySeconds={1.6} />
              </span>
            </h2>
            <motion.button
              onClick={() => { setIsLogin(true); setShowAuthModal(true) }}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="gsap-s1 btn-glow inline-flex items-center justify-center w-52 py-3.5 bg-gradient-to-r from-emerald-800 to-emerald-500 hover:from-emerald-700 hover:to-emerald-400 rounded-xl text-base font-normal text-white shadow-lg shadow-emerald-900/40" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)', opacity: 0 }}
            >
              Login Sekarang
            </motion.button>
            <div className="gsap-s1 flex flex-row gap-2 flex-wrap justify-center" style={{ opacity: 0 }}>
              {[
                { label: 'Antarmuka intuitif',      icon: <SquaresFour className="w-3 h-3 text-white flex-shrink-0" weight="fill" /> },
                { label: '20+ aset',               icon: <ChartLineUp className="w-3 h-3 text-white flex-shrink-0" weight="bold" /> },
                { label: 'Terenkripsi',          icon: <LockSimple className="w-3 h-3 text-white flex-shrink-0" weight="bold" /> },
                { label: 'Berlisensi', icon: <Medal className="w-3 h-3 text-white flex-shrink-0" weight="fill" /> },
              ].map((item) => (
                <div key={item.label} className="flex flex-row items-center gap-1 bg-black/50 border border-white/10 rounded-lg px-2.5 py-1.5 backdrop-blur-sm hover:bg-black/60 hover:border-emerald-500/30 transition-colors whitespace-nowrap">
                  {item.icon}
                  <span className="text-[10px] font-light text-white">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Section Placeholder 2 ─────────────────────────── */}
      <section className="gsap-s2-section relative min-h-[70vh] md:min-h-screen flex items-center justify-center bg-black overflow-hidden">

        {/* Gambar mobile: best2.jpeg, desktop: best2pc.jpeg */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src="/best2.jpeg"
            alt="Stouch background section 2"
            className="gsap-s2-img block md:hidden w-full h-full"
            style={{ opacity: 0, objectFit: 'cover', objectPosition: '50% 30%' }}
          />
          <img
            src="/best2pc.jpeg"
            alt="Stouch background section 2"
            className="gsap-s2-img hidden md:block w-full h-full" style={{ opacity: 0, objectFit: "cover" }}
          />
        </div>

        {/* Gradasi hitam atas */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
        {/* Gradasi hitam bawah */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />

        {/* Konten section 2 */}
        <div className="relative z-20 flex flex-col items-center justify-start w-full h-full min-h-[70vh] md:min-h-screen pt-24 md:pt-36 px-6 text-center">
          {/* Angka super besar */}
          <div
            className="gsap-s2 text-[clamp(3.5rem,13vw,10rem)] font-black leading-none tracking-tighter text-white"
            style={{ opacity: 0, textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}
          >
            1.000.000
          </div>

          {/* Teks di bawah */}
          <div
            className="gsap-s2 mt-4 md:mt-16 text-base sm:text-xl font-light tracking-widest uppercase text-white"
            style={{ opacity: 0, textShadow: '0 2px 20px rgba(0,0,0,0.9), 0 1px 8px rgba(0,0,0,0.8)' }}
          >
            pengguna dari 15+ negara memakai kami
          </div>
        </div>
      </section>

      {/* ── Section Placeholder 3 ─────────────────────────── */}
      <section className="gsap-s3-section relative min-h-[70vh] md:min-h-screen flex items-center justify-center bg-black overflow-hidden pb-8 md:pb-32">

        {/* Gambar mobile: best3.jpeg, desktop: best3pc.jpeg */}
        <div className="absolute inset-0">
          <img
            src="/best3.jpeg"
            alt="Stouch background section 3"
            className="gsap-s3-img block md:hidden w-full h-full"
            style={{ opacity: 0, objectFit: 'cover', objectPosition: '50% 30%' }}
          />
          <img
            src="/best3pc.jpeg"
            alt="Stouch background section 3"
            className="gsap-s3-img hidden md:block w-full h-full"
            style={{ opacity: 0, objectFit: 'cover', objectPosition: '50% 50%' }}
          />
        </div>

        {/* Gradasi hitam atas */}
        <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-black via-black/80 to-transparent pointer-events-none z-10" />
        {/* Gradasi bawah sync ke hero section (hitam) */}
        <div className="absolute inset-x-0 bottom-0 h-64 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, #000 0%, rgba(0,0,0,0.85) 40%, transparent 100%)' }}
        />

        {/* Konten section 3 */}
        <div className="relative z-20 flex flex-col items-center justify-start w-full h-full min-h-[70vh] md:min-h-screen pt-12 px-6 text-center">
          <div
            className="gsap-s3 text-2xl sm:text-4xl md:text-5xl font-bold text-white leading-tight"
            style={{ opacity: 0, textShadow: '0 2px 24px rgba(0,0,0,0.8), 0 1px 8px rgba(0,0,0,0.6)' }}
          >
            Berbagai pilihan metode pembayaran
          </div>
        </div>
      </section>

      {}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden" style={{ background: '#000' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0d1320] to-[#080c16]" />
          {}
          <RandomGrid seed={11} opacity={0.07} />
          {}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 -left-24 w-[380px] h-[380px] bg-teal-500/8 rounded-full blur-[90px]" />
          <div className="absolute bottom-0 right-0 w-[420px] h-[420px] bg-blue-600/8 rounded-full blur-[110px]" />
          <div className="absolute bottom-1/2 right-1/4 w-[260px] h-[260px] bg-sky-500/7 rounded-full blur-[80px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {}
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="gsap-hero-badge inline-flex items-center gap-2 px-1">
                  <span className="text-xs sm:text-sm font-medium shimmer-date">1 Februari – 31 Maret</span>
                </div>
                <h1 className="gsap-hero-title text-4xl sm:text-5xl md:text-6xl font-extrabold leading-none" style={{ opacity: 1 }}>
                  <span className="gsap-hero-title-line1 inline">Raih Bonus</span>
                  <span className="block mt-0" aria-hidden="false">
                    <span
                      className="gsap-hero-title-accent font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400 animate-gradient bg-[length:200%_auto]"
                      style={{ display: 'inline-block' }}
                    >
                      Deposit 100%
                    </span>
                  </span>
                </h1>
              </div>

              <p className="gsap-hero-desc text-lg sm:text-xl text-gray-400 leading-relaxed">
                Tersedia berbagai aset <span className="text-emerald-600 font-semibold">global</span>,
                dapatkan profit hingga <span className="text-teal-600 font-semibold">100%</span>,
                dan penarikan secepat <span className="text-amber-600 font-semibold">kilat.</span>
              </p>

              <div className="gsap-hero-buttons flex flex-row gap-3 sm:gap-4">
                <motion.button
                  className="btn-glow group flex-none px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 rounded-xl text-sm sm:text-lg font-semibold text-white shadow-lg shadow-emerald-900/40"
                  onClick={() => setShowDemoTutorial(true)}
                  whileHover={{ scale: 1.04, y: -1 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="hidden sm:inline">Coba Demo Gratis</span>
                    <span className="sm:hidden">Demo Gratis</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
                  </span>
                </motion.button>
              </div>

              {}
              <div className="gsap-hero-stats hidden sm:grid grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="text-center cursor-default bg-slate-900/80 rounded-xl p-3 border border-emerald-500/10 hover:border-emerald-500/25 transition-colors"
                  >
                    <stat.icon className="w-6 h-6 text-sky-300 mx-auto mb-2" weight="bold" />
                    <div
                      className="gsap-counter text-xl font-bold"
                      data-count={stat.rawValue}
                      data-prefix={stat.isVolume ? '$' : ''}
                      data-suffix={stat.suffix}
                    >
                      {stat.value}
                    </div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {}
            <div className="gsap-hero-chart relative">
              {}
              {isDesktop && <LiveCryptoTicker />}

              {isDesktop && (
                <FloatingCryptoPriceCard
                  symbol="BTC"
                  delay={0}
                  style={{ top: '10%', left: '-10%' }}
                />
              )}
              {isDesktop && (
                <FloatingCryptoPriceCard
                  symbol="ETH"
                  delay={0.5}
                  style={{ top: '60%', left: '-5%' }}
                />
              )}
              {isDesktop && (
                <FloatingCryptoPriceCard
                  symbol="BNB"
                  delay={1}
                  style={{ bottom: '10%', right: '-10%' }}
                />
              )}

              <LiveCryptoChart />
            </div>
          </div>
        </div>
        {}
        {isDesktop && (
          <div className="absolute left-0 bottom-0 w-2/5 h-2/5 opacity-15 pointer-events-none z-0">
            <Image
              src="/ai1.png"
              alt=""
              fill
              sizes="40vw"
              className="object-contain object-left-bottom"
            />
          </div>
        )}
      </section>

      {}
      <div className="section-glow-line" />

      {}
      <section id="how-it-works" className="py-16 sm:py-20 relative overflow-hidden">
        {}
        <div className="absolute inset-0 pointer-events-none">
          <RandomGrid seed={27} opacity={0.06} />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_50%,rgba(139,92,246,0.05),transparent)]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6">
          <div className="gsap-section-header text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6">
              <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-violet-400">Mulai dalam 3 langkah mudah</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
              Cara Kerja Platform
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Trading menjadi sangat mudah dengan teknologi kami
            </p>
          </div>

          {}
          <div className="hidden lg:block max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 timeline-line"></div>

              <div className="space-y-24">
                {}
                <div className="gsap-step-card relative flex items-center">
                  <div className="w-[calc(50%-3rem)] mr-auto">
                    <motion.div
                      className="glass-card step-card-inner rounded-2xl p-8 hover:border-violet-500/40"
                      initial={{ opacity: 0, x: -40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ scale: 1.025, y: -4 }}
                      whileTap={{ scale: 0.975 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-violet-500/10 border border-violet-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 text-violet-400" weight="bold" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">Daftar & Verifikasi</h3>
                          <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            Buat akun dalam 2 menit. Verifikasi identitas untuk keamanan tinggi dan mulai dengan akun demo gratis.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs text-violet-400">Registrasi cepat</span>
                            <span className="px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs text-violet-400">Demo Rp10.000.000</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="absolute left-1/2 -translate-x-1/2 z-10">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-violet-500/60 step-ring-violet"></div>
                      <div className="absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-violet-500/50 flex items-center justify-center">
                        <span className="text-xl font-bold text-violet-400">1</span>
                      </div>
                    </div>
                  </div>

                </div>

                {}
                <div className="gsap-step-card relative flex items-center flex-row-reverse">
                  <div className="w-[calc(50%-3rem)] ml-auto">
                    <motion.div
                      className="glass-card step-card-inner rounded-2xl p-8 hover:border-pink-500/40"
                      initial={{ opacity: 0, x: 40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ scale: 1.025, y: -4 }}
                      whileTap={{ scale: 0.975 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-pink-500/10 border border-pink-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <CurrencyDollar className="w-6 h-6 text-pink-400" weight="bold" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">Deposit & Pilih Strategi</h3>
                          <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            Deposit mulai dari Rp 50.000 didukung berbagai metode pembayaran. Pilih strategi trading sesuai profil risiko Anda.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-xs text-pink-400">Minimal deposit rendah</span>
                            <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-xs text-pink-400">Alat lengkap</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="absolute left-1/2 -translate-x-1/2 z-10">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-pink-500/60 step-ring-pink"></div>
                      <div className="absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-pink-500/50 flex items-center justify-center">
                        <span className="text-xl font-bold text-pink-400">2</span>
                      </div>
                    </div>
                  </div>

                </div>

                {}
                <div className="gsap-step-card relative flex items-center">
                  <div className="w-[calc(50%-3rem)] mr-auto">
                    <motion.div
                      className="glass-card step-card-inner rounded-2xl p-8 hover:border-sky-500/40"
                      initial={{ opacity: 0, x: -40 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ scale: 1.025, y: -4 }}
                      whileTap={{ scale: 0.975 }}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <TrendUp className="w-6 h-6 text-sky-400" weight="bold" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">Trading & Hasilkan Profit</h3>
                          <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            Pasar trading buka 24/7. Pantau profit real-time dan tarik keuntungan kapan saja.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-xs text-sky-400">Trading 24/7</span>
                            <span className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-full text-xs text-sky-400">Profit sampai 100%</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="absolute left-1/2 -translate-x-1/2 z-10">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-sky-500/60 step-ring-sky"></div>
                      <div className="absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-sky-500/50 flex items-center justify-center">
                        <span className="text-xl font-bold text-sky-400">3</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {}
          <div className="lg:hidden space-y-8">
            {[
              {
                icon: Users,
                title: 'Daftar & Verifikasi',
                desc: 'Buat akun dalam 2 menit. Verifikasi identitas untuk keamanan tinggi dan mulai dengan akun demo gratis.',
                color: 'violet',
                num: 1,
                img: '/1.png',
                tags: ['Registrasi cepat', 'Demo Rp10.000.000'],
              },
              {
                icon: CurrencyDollar,
                title: 'Deposit & Pilih Strategi',
                desc: 'Deposit mulai dari Rp 50.000 didukung berbagai metode pembayaran. Pilih strategi trading sesuai profil risiko Anda.',
                color: 'pink',
                num: 2,
                img: '/2.png',
                tags: ['Minimal deposit rendah', 'Alat lengkap'],
              },
              {
                icon: TrendUp,
                title: 'Trading & Hasilkan Profit',
                desc: 'Pasar trading buka 24/7. Pantau profit real-time dan tarik keuntungan kapan saja.',
                color: 'sky',
                num: 3,
                img: '/3.png',
                tags: ['Trading 24/7', 'Profit sampai 100%'],
              },
            ].map((step, i) => (
              <motion.div
                key={i}
                className="relative"
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
              >
                {i < 2 && (
                  <div className="absolute left-7 -bottom-8 w-px h-8 timeline-line opacity-60" />
                )}
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className={`w-14 h-14 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-full flex items-center justify-center step-ring-${step.color}`}>
                      <span className={`text-lg font-bold text-${step.color}-400`}>{step.num}</span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="glass-card rounded-2xl overflow-hidden relative">
                      {/* Image anchored to far right, contained, bigger for step 1 */}
                      <div
                        className="absolute inset-y-0 pointer-events-none"
                        style={{ right: '-5%', width: step.num === 1 ? '75%' : '85%' }}
                      >
                        <Image
                          src={step.img}
                          alt={step.title}
                          fill
                          className="object-contain opacity-10"
                          style={{
                            objectPosition: '100% center',
                            transform: step.num === 1 ? 'scale(1.5) translateX(28%)' : 'scale(1.4) translateX(12%)',
                            transformOrigin: 'right center',
                          }}
                        />
                      </div>
                      {/* Horizontal gradient: dark left → transparent right */}
                      <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to right, rgba(10,14,23,0.75) 0%, rgba(10,14,23,0.6) 30%, rgba(10,14,23,0.4) 55%, transparent 100%)' }} />
                      {/* Content on top */}
                      <div className="relative z-10 p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-9 h-9 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-lg flex items-center justify-center flex-shrink-0`}>
                            <step.icon className={`w-4 h-4 text-${step.color}-400`} weight="bold" />
                          </div>
                          <h3 className="font-bold text-base">{step.title}</h3>
                        </div>
                        <p className="text-sm text-gray-400 leading-relaxed mb-3">{step.desc}</p>
                        <div className="flex flex-wrap gap-2">
                          {step.tags.map((tag, t) => (
                            <span
                              key={t}
                              className={`px-3 py-1 bg-${step.color}-500/10 border border-${step.color}-500/20 rounded-full text-xs text-${step.color}-400`}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

{}
<div className="section-glow-line" />

{}
<section id="payment" className="py-16 sm:py-20 relative overflow-visible">
  {}
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {}
    <RandomGrid seed={79} opacity={0.06} />
    {}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_15%_50%,rgba(239,68,68,0.22),transparent)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_50%,rgba(34,197,94,0.20),transparent)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_85%_50%,rgba(99,102,241,0.22),transparent)]" />
  </div>

  <div className="container mx-auto px-4 sm:px-6 relative z-10">
    {}
    <div className="gsap-section-header text-center mb-12">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
        <span className="text-xs font-medium text-emerald-400">Berbagai Metode Pembayaran</span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
        Deposit & Penarikan Mudah
      </h2>
      <p className="text-sm text-gray-400 max-w-xl mx-auto">
        Berbagai pilihan metode pembayaran untuk kemudahan transaksi Anda
      </p>
    </div>

    {}
    <div className="hidden lg:block max-w-5xl mx-auto space-y-3 sm:space-y-4">
      <div className="gsap-payment-grid grid grid-cols-6 gap-4">
        {[
          { name: 'Mandiri', logo: '/mandiri.webp' },
          { name: 'BRI', logo: '/bri.webp' },
          { name: 'BNI', logo: '/bni.webp' },
          { name: 'GoPay', logo: '/gopay.webp' },
          { name: 'OVO', logo: '/ovo.webp' },
          { name: 'DANA', logo: '/dana.webp' },
        ].map((item) => (
          <div key={item.name} className="payment-card group bg-white border border-gray-200 rounded-xl p-6 relative overflow-hidden">
            {}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg" />

            <div className="relative z-10">
              <div className="relative h-12 flex items-center justify-center">
                <Image
                  src={item.logo}
                  alt={item.name}
                  width={120}
                  height={40}
                  sizes="(max-width: 1024px) 0px, 120px"
                  className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="gsap-payment-grid grid grid-cols-5 gap-4">
        {[
          { name: 'QRIS', logo: '/qris.png' },
          { name: 'Visa', logo: '/visa.webp' },
          { name: 'Mastercard', logo: '/mastercard.webp' },
          { name: 'Bitcoin', logo: '/bitcoin.webp' },
          { name: 'BCA', logo: '/bca.webp' },
        ].map((item) => (
          <div key={item.name} className="payment-card group bg-white border border-gray-200 rounded-xl p-6 relative overflow-hidden">
            {}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg" />

            <div className="relative z-10">
              <div className="relative h-12 flex items-center justify-center">
                <Image
                  src={item.logo}
                  alt={item.name}
                  width={120}
                  height={40}
                  sizes="(max-width: 1024px) 0px, 120px"
                  className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {}
    <div className="lg:hidden space-y-3 overflow-hidden marquee-fade">
      {}
      <div className="relative">
        <div className="flex overflow-hidden">
          <div className="flex gap-3 animate-marquee-left">
            {[
              { name: 'DANA', logo: '/dana.webp' },
              { name: 'OVO', logo: '/ovo.webp' },
              { name: 'GoPay', logo: '/gopay.webp' },
              { name: 'BNI', logo: '/bni.webp' },
              { name: 'BRI', logo: '/bri.webp' },
              { name: 'Mandiri', logo: '/mandiri.webp' },
              { name: 'QRIS', logo: '/qris.png' },
              { name: 'Visa', logo: '/visa.webp' },
              { name: 'Mastercard', logo: '/mastercard.webp' },
              { name: 'Bitcoin', logo: '/bitcoin.webp' },
              { name: 'BCA', logo: '/bca.webp' },

              { name: 'DANA2', logo: '/dana.webp' },
              { name: 'OVO2', logo: '/ovo.webp' },
              { name: 'GoPay2', logo: '/gopay.webp' },
              { name: 'BNI2', logo: '/bni.webp' },
              { name: 'BRI2', logo: '/bri.webp' },
              { name: 'Mandiri2', logo: '/mandiri.webp' },
              { name: 'QRIS2', logo: '/qris.png' },
              { name: 'Visa2', logo: '/visa.webp' },
              { name: 'Mastercard2', logo: '/mastercard.webp' },
              { name: 'Bitcoin2', logo: '/bitcoin.webp' },
              { name: 'BCA2', logo: '/bca.webp' },
            ].map((item) => (
              <div key={item.name} className="flex-shrink-0 w-28 bg-white border border-gray-200 rounded-xl p-4">
                <div className="relative h-10 flex items-center justify-center">
                  <Image
                    src={item.logo}
                    alt={item.name.replace(/\d+$/, '')}
                    width={100}
                    height={40}
                    className="h-full w-auto object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {}
      <div className="relative">
        <div className="flex overflow-hidden">
          <div className="flex gap-3 animate-marquee-right">
            {[
              { name: 'BCA', logo: '/bca.webp' },
              { name: 'Bitcoin', logo: '/bitcoin.webp' },
              { name: 'Mastercard', logo: '/mastercard.webp' },
              { name: 'Visa', logo: '/visa.webp' },
              { name: 'QRIS', logo: '/qris.png' },
              { name: 'Mandiri', logo: '/mandiri.webp' },
              { name: 'BRI', logo: '/bri.webp' },
              { name: 'BNI', logo: '/bni.webp' },
              { name: 'GoPay', logo: '/gopay.webp' },
              { name: 'OVO', logo: '/ovo.webp' },
              { name: 'DANA', logo: '/dana.webp' },

              { name: 'BCA2', logo: '/bca.webp' },
              { name: 'Bitcoin2', logo: '/bitcoin.webp' },
              { name: 'Mastercard2', logo: '/mastercard.webp' },
              { name: 'Visa2', logo: '/visa.webp' },
              { name: 'QRIS2', logo: '/qris.png' },
              { name: 'Mandiri2', logo: '/mandiri.webp' },
              { name: 'BRI2', logo: '/bri.webp' },
              { name: 'BNI2', logo: '/bni.webp' },
              { name: 'GoPay2', logo: '/gopay.webp' },
              { name: 'OVO2', logo: '/ovo.webp' },
              { name: 'DANA2', logo: '/dana.webp' },
            ].map((item) => (
              <div key={item.name} className="flex-shrink-0 w-28 bg-white border border-gray-200 rounded-xl p-4">
                <div className="relative h-10 flex items-center justify-center">
                  <Image
                    src={item.logo}
                    alt={item.name.replace(/\d+$/, '')}
                    width={100}
                    height={40}
                    className="h-full w-auto object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {}
    <div className="mt-12 text-center relative z-10">
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full">
        <span className="text-xs text-gray-400 font-light">
          Seluruh transaksi Anda kini diproteksi tinggi dengan teknologi enkripsi SSL 256-bit
        </span>
      </div>
    </div>
  </div>
</section>

      {}
<section className="relative py-12 sm:py-16 lg:py-20 bg-[#0d1422] overflow-hidden">
  {}
  <div className="absolute inset-0 pointer-events-none">
    {}
    <RandomGrid seed={63} opacity={0.06} />

    <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_30%_50%,rgba(16,185,129,0.06),transparent)]" />
  </div>

  <div className="container mx-auto px-3 sm:px-4 lg:px-6 relative z-10">
    <div className="max-w-7xl mx-auto">
      {}
      <div className="gsap-partner-row grid grid-cols-2 gap-3 sm:gap-6 lg:gap-12 items-center mb-12 sm:mb-16 lg:mb-24">
        {}
        <div className="relative">
          <div className="gsap-partner-img relative aspect-[1/1] m-1 sm:m-4 lg:m-0 rounded-xl sm:rounded-2xl lg:rounded-3xl overflow-hidden gsap-parallax-img">
            <Image
              src="/v1.webp"
              alt="Stockity x LindungiHutan"
              fill
              sizes="(max-width: 640px) 45vw, (max-width: 1024px) 45vw, 560px"
              className="object-cover object-top lg:p-0"
            />
          </div>
        </div>

        {}
        <div className="space-y-2 sm:space-y-4 lg:space-y-6">
          {}
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="gsap-partner-logo relative w-16 h-6 sm:w-24 sm:h-9 lg:w-32 lg:h-12 bg-white rounded-md sm:rounded-lg overflow-hidden">
              <Image
                src="/lindungihutan.png"
                alt="LindungiHutan"
                fill
                sizes="(max-width: 640px) 64px, (max-width: 1024px) 96px, 128px"
                className="object-contain object-center p-1 sm:p-1.5 lg:p-2"
              />
            </div>
          </div>

          {}
          {/* Mobile heading */}
          <h2 className="gsap-partner-heading block sm:hidden text-base font-bold leading-tight">
            Bersama ubah dunia!
          </h2>
          {/* Desktop heading */}
          <h2 className="gsap-partner-heading hidden sm:block sm:text-2xl lg:text-4xl xl:text-5xl font-bold leading-tight">
            Bersama kita mengubah dunia!
          </h2>

          {}
          {/* Mobile desc */}
          <p className="gsap-partner-desc block sm:hidden text-xs text-gray-400 leading-relaxed">
            9.000 pohon & 4 terumbu karang ditanam bersama LindungiHutan.
          </p>
          {/* Desktop desc */}
          <p className="gsap-partner-desc hidden sm:block sm:text-sm lg:text-lg text-gray-400 leading-relaxed">
            Tahun ini, Stockity telah menanam 9.000 pohon dan 4 terumbu karang bekerja sama dengan LindungiHutan
          </p>

          {}
          <a href="https://stockity.id/id/ad/ecostockity?utm_source=ecostockity_new&utm_medium=marprod&utm_campaign=main_page_banner&a=&ac=main_page_banner" target="_blank" rel="noopener noreferrer">
            <button className="gsap-partner-btn group inline-flex items-center mt-6 gap-1 sm:gap-2 lg:gap-3 px-3 py-1.5 sm:px-6 sm:py-3 lg:px-8 lg:py-4 bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 rounded-lg sm:rounded-xl text-[10px] sm:text-base lg:text-lg font-semibold text-white transition-all shadow-lg hover:shadow-emerald-500/30">
              <span>Selengkapnya</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
            </button>
          </a>
        </div>
      </div>

      {}
      <div className="gsap-partner-row mb-12 sm:mb-16 lg:mb-24">
        <div className="grid grid-cols-[1fr_1fr] sm:grid-cols-[2fr_1fr] gap-3 sm:gap-6 lg:gap-8 items-center">
          {}
          <div className="space-y-2 sm:space-y-3 lg:space-y-4 text-right sm:text-left">
            {/* Mobile heading */}
            <h3 className="gsap-partner-heading block sm:hidden text-base font-bold leading-tight">
              Platform andalan profesional!
            </h3>
            {/* Desktop heading */}
            <h3 className="gsap-partner-heading hidden sm:block sm:text-2xl lg:text-4xl xl:text-5xl font-bold leading-tight">
              Platform yang diandalkan oleh para profesional!
            </h3>

            {/* Mobile desc */}
            <p className="gsap-partner-desc block sm:hidden text-xs text-gray-400 leading-relaxed">
              Penghargaan Platform Terpercaya Indonesia 2024.
            </p>
            {/* Desktop desc */}
            <p className="gsap-partner-desc hidden sm:block sm:text-sm lg:text-lg text-gray-400 leading-relaxed">
              Penghargaan Platform Perdagangan Paling Andal di Indonesia 2024 berkomitmen terhadap keamanan, efisiensi, dan inovasi.
            </p>
          </div>

          {}
          <div className="p-4 sm:p-0">
            <div className="gsap-partner-img relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden">
              <Image
                src="/sa.webp"
                alt="Stockity Platform"
                fill
                sizes="(max-width: 640px) 30vw, (max-width: 1024px) 25vw, 280px"
                className="object-contain p-6"
              />
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="gsap-partner-row">
        <div className="grid grid-cols-[1fr_1fr] sm:grid-cols-[1fr_2fr] gap-3 sm:gap-6 lg:gap-8 items-center">
          {}
          <div className="p-4 sm:p-0">
            <div className="gsap-partner-img relative aspect-square rounded-xl sm:rounded-2xl overflow-hidden">
              <Image
                src="/il4.png"
                alt="Stockity Platform"
                fill
                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 33vw, 400px"
                className="object-contain p-0 sm:p-4 lg:p-4"
              />
            </div>
          </div>

          {}
          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            {/* Mobile heading */}
            <h3 className="gsap-partner-heading block sm:hidden text-base font-bold leading-tight">
              Trading realtime 24 jam!
            </h3>
            {/* Desktop heading */}
            <h3 className="gsap-partner-heading hidden sm:block sm:text-2xl lg:text-4xl xl:text-5xl font-bold leading-tight">
              Akses trading realtime 24 jam tanpa tutup!
            </h3>

            {/* Mobile desc */}
            <p className="gsap-partner-desc block sm:hidden text-xs text-gray-400 leading-relaxed">
              Produktif kapan saja & di mana saja!
            </p>
            {/* Desktop desc */}
            <p className="gsap-partner-desc hidden sm:block sm:text-sm lg:text-lg text-gray-400 leading-relaxed">
              Buat setiap antrean, kemacetan lalu lintas, dan minum-minum kopi menjadi produktif untuk Anda!
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

            {}
<section className="py-16 sm:py-20 relative overflow-hidden">
  {}
  <div className="absolute inset-0 pointer-events-none">
    <RandomGrid seed={97} opacity={0.055} />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_65%_50%_at_70%_40%,rgba(16,185,129,0.05),transparent)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_20%_70%,rgba(14,165,233,0.04),transparent)]" />
  </div>
  <div className="container mx-auto px-4 sm:px-6">
    {}
    <div className="gsap-affiliate-header gsap-section-header text-center mb-16">
      <div className="gsap-aff-badge inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
        <span className="text-sm font-medium text-emerald-400">Program Referral</span>
      </div>
      <h2 className="gsap-aff-title text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
        Undang Teman,<br />Dapatkan Hingga <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-400">Rp 400.000</span>
      </h2>
      <p className="gsap-aff-desc text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
        Setelah mendaftar, Anda dapat mengundang teman dan menerima <span className="text-emerald-400 font-semibold">Rp 25.000 hingga Rp 400.000</span> ke akun riil Anda untuk setiap orang.
      </p>
    </div>

    {}
    <div className="grid grid-cols-2 gap-3 sm:gap-5 max-w-3xl mx-auto mb-16">

      {}
      <motion.div
        className="gsap-affiliate-card group relative rounded-2xl sm:rounded-3xl overflow-hidden"
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-white/[0.01]" />
        <div className="absolute inset-0 backdrop-blur-xl" />
        {}
        <div className="absolute -top-6 -left-6 w-32 h-32 bg-emerald-500/25 rounded-full blur-2xl" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl" />
        {}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-white/10 group-hover:border-emerald-400/25 transition-colors duration-400" />
        {}
        <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 p-5 sm:p-7">
          {}
          <div className="flex items-center gap-2 mb-5 sm:mb-6">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center">
              <Medal className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-300" weight="fill" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-emerald-300/90 tracking-wider uppercase">VIP</span>
          </div>

          {}
          <div className="mb-1">
            <span className="text-2xl sm:text-4xl font-black text-white tracking-tight">Rp 400rb</span>
          </div>
          <p className="text-[10px] sm:text-xs text-white/35 font-medium mb-5 sm:mb-6">per trader diundang</p>
        </div>
      </motion.div>

      {}
      <motion.div
        className="gsap-affiliate-card group relative rounded-2xl sm:rounded-3xl overflow-hidden"
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {}
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-white/[0.01]" />
        <div className="absolute inset-0 backdrop-blur-xl" />
        {}
        <div className="absolute -top-6 -right-6 w-32 h-32 bg-sky-500/20 rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-400/10 rounded-full blur-2xl" />
        {}
        <div className="absolute inset-0 rounded-2xl sm:rounded-3xl border border-white/10 group-hover:border-sky-400/25 transition-colors duration-400" />
        {}
        <div className="absolute top-0 inset-x-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />

        <div className="relative z-10 p-5 sm:p-7">
          {}
          <div className="flex items-center gap-2 mb-5 sm:mb-6">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/20 border border-sky-400/20 flex items-center justify-center">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-sky-300" weight="fill" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-sky-300/90 tracking-wider uppercase">Standart & Gold</span>
          </div>

          {}
          <div className="mb-1">
            <span className="text-2xl sm:text-4xl font-black text-white tracking-tight">Rp 100rb</span>
          </div>
          <p className="text-[10px] sm:text-xs text-white/35 font-medium mb-5 sm:mb-6">per trader diundang</p>
        </div>
      </motion.div>

    </div>

    {}
    <div className="max-w-4xl mx-auto mb-16">
      <div className="text-center mb-10 sm:mb-12">
        <h3 className="text-xl sm:text-2xl sm:text-3xl font-bold">
          Maksimalkan Keuntungan Anda
        </h3>
        <p className="text-sm text-gray-500 mt-2">4 langkah mudah untuk mulai menghasilkan</p>
      </div>

      {}
      <div className="gsap-affiliate-steps-grid hidden md:grid md:grid-cols-4 gap-6">
        {[
          {
            num: '1',
            icon: Users,
            title: 'Temukan Teman',
            desc: 'Yang sudah trading di Stouch',
            color: 'emerald'
          },
          {
            num: '2',
            icon: UserPlus,
            title: 'Daftar dengan Link',
            desc: 'Gunakan tautan rujukan mereka',
            color: 'emerald'
          },
          {
            num: '3',
            icon: CurrencyDollar,
            title: 'Deposit & Bonus',
            desc: 'Dapatkan Rp 25.000 untuk deposit pertama',
            color: 'emerald'
          },
          {
            num: '4',
            icon: TrendUp,
            title: 'Undang & Raih',
            desc: 'Dapatkan hingga Rp 400.000 lebih',
            color: 'emerald'
          }
        ].map((step, i) => (
          <div key={i} className="relative">
            {i < 3 && (
              <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-700 to-gray-800"></div>
            )}

            <div className="glass-card gradient-border relative rounded-2xl p-6 group">
              <div className="absolute -top-4 left-6">
                <div className={`w-8 h-8 bg-${step.color}-500/20 border-2 border-${step.color}-500/50 rounded-full flex items-center justify-center`}>
                  <span className={`text-sm font-bold text-${step.color}-400`}>{step.num}</span>
                </div>
              </div>

              <div className={`gsap-step-icon w-12 h-12 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-xl flex items-center justify-center mb-4 mt-2 group-hover:scale-110 transition-transform`}>
                <step.icon className={`w-6 h-6 text-${step.color}-400`} weight="bold" />
              </div>

              <h4 className="gsap-step-title font-bold mb-2">{step.title}</h4>
              <p className="gsap-step-desc text-sm text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="md:hidden space-y-0">
        {[
          { num: '1', icon: Users,          title: 'Temukan Teman',      desc: 'Cari teman yang sudah trading di Stouch',      highlight: null },
          { num: '2', icon: UserPlus,        title: 'Daftar dengan Link', desc: 'Gunakan tautan referral untuk mendaftar',       highlight: null },
          { num: '3', icon: CurrencyDollar,  title: 'Deposit & Bonus',   desc: 'Dapatkan bonus Rp 25.000 dari teman yang deposit pertama ', highlight: 'Rp 25.000' },
          { num: '4', icon: TrendUp,         title: 'Undang & Raih',     desc: 'Kumpulkan hingga Rp 400.000 per trader ',        highlight: 'Rp 400.000' },
        ].map((step, i, arr) => (
          <div key={i} className="relative flex gap-4">
            {}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/40 flex items-center justify-center z-10">
                <span className="text-sm font-bold text-emerald-400">{step.num}</span>
              </div>
              {i < arr.length - 1 && (
                <div className="w-px flex-1 mt-1 mb-1 bg-gradient-to-b from-emerald-500/30 to-transparent min-h-[32px]" />
              )}
            </div>

            {}
            <div className={`flex-1 pb-5 ${i === arr.length - 1 ? 'pb-0' : ''}`}>
              <div className="bg-[#0d1220] border border-white/5 rounded-2xl p-4 hover:border-emerald-500/20 transition-colors group">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                    <step.icon className="w-4 h-4 text-emerald-400" weight="bold" />
                  </div>
                  <h4 className="font-semibold text-sm text-white">{step.title}</h4>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed pl-11">
                  {step.highlight
                    ? step.desc.replace(step.highlight, '')
                    : step.desc}
                  {step.highlight && (
                    <span className="text-emerald-400 font-semibold">{step.highlight}</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {}
    <div className="gsap-cta-section relative max-w-4xl mx-auto glass-card rounded-3xl overflow-hidden border-emerald-500/15">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-500/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(16,185,129,0.07),transparent)]" />

        {}
        <div className="block absolute left-[-110] md:left-[-140] bottom-50 w-3/5 h-full opacity-20 pointer-events-none z-0 lg:left-[-21%] lg:w-1/2 lg:opacity-20">
          <Image
            src="/ai2.png"
            alt=""
            fill
            sizes="(max-width: 768px) 60vw, 50vw"
            className="object-contain object-left-bottom scale-105"
          />
        </div>
      </div>

      <div className="relative z-10 p-6 sm:p-8 sm:p-12 text-center">
        <div className="gsap-cta-badge inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4 sm:mb-6">
          <span className="text-xs sm:text-sm font-medium text-emerald-400">Program Affiliator</span>
        </div>

        <h3 className="gsap-cta-title text-xl sm:text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
          Jadilah Mitra Resmi Stouch
        </h3>

        <p className="gsap-cta-desc text-sm sm:text-lg text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Ajak trader baru ke platform dan dapatkan <span className="text-emerald-400 font-semibold">penghasilan tambahan</span>
        </p>

        <div className="gsap-cta-btn flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            onClick={() => window.open('https://wa.me/6285701866916', '_blank')}
            className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 rounded-xl font-semibold text-white transition-all shadow-lg shadow-emerald-900/40"
          >
            <span className="flex items-center justify-center gap-2">
              Daftar Sekarang
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" weight="bold" />
            </span>
          </button>
        </div>

        <div className="gsap-cta-stats grid grid-cols-3 gap-3 sm:gap-6 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-800/50">
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-emerald-400 mb-1">Free</div>
            <div className="text-[10px] sm:text-xs text-gray-500">No Admin Fees</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-emerald-400 mb-1">∞</div>
            <div className="text-[10px] sm:text-xs text-gray-500">Unlimited Earning</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-2xl font-bold text-emerald-400 mb-1">24/7</div>
            <div className="text-[10px] sm:text-xs text-gray-500">Support</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      {}
      <EnhancedFooter />

      {showDemoTutorial && (
        <DemoTradingTutorial onClose={() => setShowDemoTutorial(false)} />
      )}

      {}
      {}
{showAuthModal && (
  <>
    <div
      className={`fixed inset-0 bg-black/60 backdrop-blur-md z-50 ${isClosingModal ? 'animate-fade-out' : 'animate-fade-in'}`}
      onClick={closeAuthModal}
    />

    {}
    <div className={`fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-gradient-to-b from-[#0f1419] to-[#0a0e17] z-50 shadow-2xl flex flex-col ${isClosingModal ? 'animate-slide-right' : 'animate-slide-left'}`}>
      {}
      <div className="flex-shrink-0 bg-[#0f1419] border-b border-gray-800/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/stc-logo1.png"
                alt="Stouch"
                fill
                sizes="40px"
                className="object-contain rounded-md"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold">Stouch</h2>
              <p className="text-xs text-gray-400">Platform Trading Profesional</p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" weight="bold" />
          </button>
        </div>
      </div>

      {}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-6">
          {}
          <div className="flex gap-2 p-1 bg-[#0a0e17] rounded-xl mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                isLogin
                  ? 'bg-[#1e293b] text-white shadow-lg border border-gray-700'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              Masuk
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                !isLogin
                  ? 'bg-[#1e293b] text-white shadow-lg border border-gray-700'
                  : 'text-gray-400 hover:text-white border border-transparent'
              }`}
            >
              Daftar
            </button>
          </div>

          {}
          {hasReferralCode && !isLogin && (
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-xl animate-fade-in-up">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <CurrencyDollar className="w-5 h-5 text-emerald-400" weight="bold" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-emerald-400">Kode Referral</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs text-emerald-300">
                      {referralCode}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Daftar sekarang untuk mendapatkan bonus dan komisi Anda!
                  </p>
                </div>
              </div>
            </div>
          )}

          {}
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">
              {isLogin ? 'Selamat Datang Kembali!' : 'Buat Akun'}
            </h3>
            <p className="text-gray-400">
              {isLogin
                ? 'Masuk untuk melanjutkan trading'
                : hasReferralCode
                  ? 'Bergabung dengan bonus referral'
                  : 'Bergabung dengan ribuan trader sukses'}
            </p>
          </div>

          {}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Alamat Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anda@example.com"
                required
                disabled={loading}
                className="w-full bg-[#0a0e17] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full bg-[#0a0e17] border border-gray-800 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {!isLogin && password.length > 0 && (() => {
                const criteria = [
                  { label: '8+ karakter',    met: password.length >= 8 },
                  { label: 'Huruf besar',    met: /[A-Z]/.test(password) },
                  { label: 'Huruf kecil',    met: /[a-z]/.test(password) },
                  { label: 'Angka / simbol', met: /[\d\W]/.test(password) },
                ]
                const score = criteria.filter(c => c.met).length
                const strengthLabel  = score === 0 ? '' : score === 1 ? 'Lemah' : score === 2 ? 'Cukup' : score === 3 ? 'Bagus' : 'Kuat'
                const strengthColor  = score <= 1 ? '#ef4444' : score === 2 ? '#f59e0b' : score === 3 ? '#eab308' : '#10b981'
                const barColors = (i: number) => {
                  if (i >= score) return 'rgba(255,255,255,0.07)'
                  if (score <= 1) return '#ef4444'
                  if (score === 2) return i === 0 ? '#ef4444' : '#f59e0b'
                  if (score === 3) return i === 0 ? '#ef4444' : i === 1 ? '#f59e0b' : '#eab308'
                  return '#10b981'
                }
                return (
                  <div className="mt-3 space-y-3">
                    {/* Strength bar */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-500">Kekuatan Password</span>
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
                            style={{ background: barColors(i), boxShadow: i < score ? `0 0 6px ${barColors(i)}80` : 'none' }}
                          />
                        ))}
                      </div>
                    </div>
                    {/* Criteria chips */}
                    <div className="grid grid-cols-2 gap-1.5">
                      {criteria.map((c) => (
                        <div
                          key={c.label}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all duration-300"
                          style={{
                            background: c.met ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${c.met ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.06)'}`,
                          }}
                        >
                          <span
                            className="flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all duration-300"
                            style={{ background: c.met ? '#10b981' : 'rgba(255,255,255,0.1)' }}
                          >
                            {c.met
                              ? <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4L3 5.5L6.5 2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              : <svg width="6" height="6" viewBox="0 0 6 6" fill="none"><path d="M1.5 1.5L4.5 4.5M4.5 1.5L1.5 4.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" strokeLinecap="round"/></svg>
                            }
                          </span>
                          <span
                            className="text-[10px] font-medium transition-colors duration-300"
                            style={{ color: c.met ? '#34d399' : 'rgba(255,255,255,0.35)' }}
                          >
                            {c.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>

            {}
            {!isLogin && !hasReferralCode && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Kode Referral / Affiliate <span className="text-gray-500">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={affiliateCode || referralCode}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase()
                    if (val.startsWith('AFF')) {
                      setAffiliateCode(val)
                      setReferralCode('')
                    } else {
                      setReferralCode(val)
                      setAffiliateCode('')
                    }
                  }}
                  placeholder="Contoh: WUTJ8JGX atau AFFAB12CD34"
                  disabled={loading}
                  className="w-full bg-[#0a0e17] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"

                />
                <p className="mt-1 text-xs text-gray-500">
                  {affiliateCode
                    ? ''
                    : 'Masukkan kode referral dari teman Anda untuk mendapatkan bonus'}
                </p>
                {affiliateCode && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-xl animate-fade-in-up">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-emerald-400" weight="bold" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-emerald-400">Kode Affiliate</span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs text-emerald-300">
                            {affiliateCode}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">
                          Anda akan terdaftar sebagai undangan affiliator
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {}
            <label className="flex items-start gap-3 mt-6 mb-1 cursor-pointer group">
              <div className="relative flex-shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked)
                    if (e.target.checked) setShowTermsWarning(false)
                  }}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${
                  agreedToTerms
                    ? 'bg-emerald-500 border-emerald-500'
                    : showTermsWarning
                      ? 'border-red-500 bg-transparent'
                      : 'border-gray-600 bg-transparent group-hover:border-gray-400'
                }`}>
                  {agreedToTerms && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-gray-400 leading-relaxed">
                Dengan melanjutkan, Anda menyetujui{' '}
                <a href="/agreement" onClick={e => e.stopPropagation()} className="text-sky-400 hover:text-sky-300 underline">Syarat & Ketentuan</a>
                {' '}dan{' '}
                <a href="/privacy" onClick={e => e.stopPropagation()} className="text-sky-400 hover:text-sky-300 underline">Kebijakan Privasi</a> kami
              </span>
            </label>

            {}
            {showTermsWarning && (
              <p className="text-xs text-red-400 mb-3 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Harap centang persetujuan Syarat &amp; Ketentuan terlebih dahulu
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 bg-[#1e293b] hover:bg-[#334155] rounded-lg text-lg font-semibold text-white transition-colors border border-gray-700 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Memproses...
                </span>
              ) : (
                <span>{isLogin ? 'Masuk' : 'Buat Akun'}</span>
              )}
            </button>
          </form>

          {!isLogin && (
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300">Akun demo gratis Rp 10.000.000</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 bg-sky-500/20 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-gray-300">Tanpa kartu kredit</span>
              </div>
              {hasReferralCode && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                    <CurrencyDollar className="w-4 h-4 text-emerald-400" weight="bold" />
                  </div>
                  <span className="text-emerald-400 font-medium">Bonus referral aktif!</span>
                </div>
              )}
            </div>
          )}

          {}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0f1419] text-gray-400">Atau lanjutkan dengan</span>
            </div>
          </div>

          {}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading || loadingGoogle}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0e17] border border-gray-800 rounded-lg hover:bg-[#1a1f2e] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loadingGoogle ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                <span className="text-sm font-medium">Menghubungkan...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  {}
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="text-sm font-medium">Google</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </>
)}

      <style jsx>{`
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&display=swap');

      /* ══════════════════════════════════════════════════════
         PREMIUM CSS — Stouch.id Landing Page
      ══════════════════════════════════════════════════════ */

      .duration-350 { transition-duration: 350ms; }

      /* ── GSAP safety fallback ──────────────────────────────
         Jika GSAP gagal load / timeout, elemen tetap terlihat
         setelah 2.5 detik via animasi CSS sederhana.          */
      .gsap-navbar,
      .gsap-hero-badge,
      .gsap-hero-desc,
      .gsap-hero-buttons,
      .gsap-hero-stats,
      .gsap-hero-chart,
      .gsap-section-header,
      .gsap-step-card,
      .gsap-partner-row,
      .gsap-affiliate-card,
      .gsap-cta-section {
        animation: gsap-fallback-reveal 0s 2.5s forwards;
      }
      @keyframes gsap-fallback-reveal {
        to { opacity: 1 !important; transform: none !important; }
      }

      /* ── Shimmer emerald-blue premium text ────────────────── */
      @keyframes shimmer-sweep {
        0%   { background-position: 200% center; }
        100% { background-position: -200% center; }
      }
      .shimmer-date {
        background: linear-gradient(90deg,
          #047857 0%, #10b981 15%, #34d399 30%,
          #99f6e4 45%, #e0fdf4 50%,
          #99f6e4 55%, #34d399 70%, #10b981 85%, #047857 100%
        );
        background-size: 300% 100%;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: shimmer-sweep 4s linear infinite;
      }

      /* ── Gradient text animation ───────────────────────── */
      @keyframes animate-gradient {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      .animate-gradient { animation: animate-gradient 4s ease infinite; }

      /* ── Infinite marquee ──────────────────────────────── */
      @keyframes marquee-left  { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
      @keyframes marquee-right { from { transform: translateX(-50%); } to { transform: translateX(0); } }
      .animate-marquee-left  { animation: marquee-left  55s linear infinite; width: max-content; }
      .animate-marquee-right { animation: marquee-right 55s linear infinite; width: max-content; }

      /* animate-float & animate-pulse-slow removed — these animated large
         blurred elements causing GPU layer thrashing. */

      /* ── Modal/slide animations ────────────────────────── */
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes spin-variable {
        0%   { transform: rotate(0deg); }
        30%  { transform: rotate(60deg); }
        55%  { transform: rotate(110deg); }
        65%  { transform: rotate(250deg); }
        80%  { transform: rotate(300deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes slide-left    { from { transform: translateX(100%); } to { transform: translateX(0); } }
      @keyframes slide-right   { from { transform: translateX(0); }    to { transform: translateX(100%); } }
      @keyframes fade-in       { from { opacity: 0; }  to { opacity: 1; } }
      @keyframes fade-out      { from { opacity: 1; }  to { opacity: 0; } }
      @keyframes fade-in-up    { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes slide-in-right{ from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }
      .animate-slide-left    { animation: slide-left     0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards; will-change: transform; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      .animate-slide-right   { animation: slide-right    0.32s cubic-bezier(0.4, 0, 1, 1)    forwards; will-change: transform; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
      .animate-fade-in       { animation: fade-in        0.28s ease-out forwards; will-change: opacity; }
      .animate-fade-out      { animation: fade-out       0.32s ease-in  forwards; will-change: opacity; }
      .animate-fade-in-up    { animation: fade-in-up     0.5s  ease-out forwards; will-change: transform, opacity; backface-visibility: hidden; }
      .animate-slide-in-right{ animation: slide-in-right 0.5s  ease-out forwards; will-change: transform, opacity; backface-visibility: hidden; }

      /* ── Logo animations ───────────────────────────────── */
      @keyframes logo-bounce-in  { 0% { transform: scale(0.3) rotate(-15deg); opacity: 0; } 60% { transform: scale(1.15) rotate(5deg); opacity: 1; } 100% { transform: scale(1) rotate(0deg); opacity: 1; } }
      @keyframes logo-bounce-out { 0% { transform: scale(1) rotate(0deg); opacity: 1; } 40% { transform: scale(1.1) rotate(-5deg); opacity: 0.8; } 100% { transform: scale(0.3) rotate(15deg); opacity: 0; } }
      @keyframes text-slide-in   { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
      @keyframes text-slide-out  { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(20px); } }
      .animate-logo-bounce-in  { animation: logo-bounce-in  0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      .animate-logo-bounce-out { animation: logo-bounce-out 0.5s ease-in forwards; }
      .animate-text-slide-in   { animation: text-slide-in   0.4s ease-out forwards; }
      .animate-text-slide-out  { animation: text-slide-out  0.4s ease-in  forwards; }

      /* ── Mobile: nonaktifkan backdrop-blur & animasi berat ─ */
      @media (max-width: 1023px) {
        /* backdrop-filter + transform animation = flicker di HP */
        .gsap-affiliate-card > div[class*="backdrop-blur"],
        .gsap-affiliate-card > .backdrop-blur-xl {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        /* Floating blobs — tidak perlu di mobile */
        .gsap-float-blob { animation: none !important; }
        /* Orbs — terlalu berat untuk mobile */
        .gsap-orb { animation: none !important; transform: none !important; }
      }

      /* ── Scrollbar — premium gradient ──────────────────── */
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: #060911; }
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #0ea5e9, #10b981);
        border-radius: 3px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(to bottom, #38bdf8, #34d399);
      }
      .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      .hide-scrollbar::-webkit-scrollbar { display: none; }

      /* ── Smooth scroll ─────────────────────────────────── */
      html { scroll-behavior: smooth; }

      /* ══════════════════════════════════════════════════════
         PREMIUM EFFECTS
      ══════════════════════════════════════════════════════ */

      /* Solid dark card — same look, zero backdrop-filter cost */
      .glass-card {
        background: linear-gradient(135deg, #0f141f 0%, #0a0e17 100%);
        border: 1px solid rgba(255,255,255,0.07);
        box-shadow: 0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04);
        transition: border-color 0.25s ease, box-shadow 0.25s ease, transform 0.2s ease;
      }
      .glass-card:hover {
        border-color: rgba(255,255,255,0.11);
        box-shadow: 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06);
        transform: translateY(-2px);
      }

      /* Simplified button hover — no pseudo-element paint */
      .btn-glow {
        transition: transform 0.18s ease, box-shadow 0.2s ease, filter 0.2s ease;
      }
      .btn-glow:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 24px rgba(16,185,129,0.4), 0 2px 8px rgba(16,185,129,0.15);
        filter: brightness(1.08);
      }
      .btn-glow:active { transform: scale(0.98); }

      /* Gradient border glow on hover */
      .gradient-border {
        position: relative;
        background-clip: padding-box;
      }
      .gradient-border::before {
        content: '';
        position: absolute;
        inset: -1px;
        border-radius: inherit;
        background: linear-gradient(135deg, rgba(14,165,233,0.0), rgba(16,185,129,0.0));
        transition: background 0.4s ease;
        z-index: -1;
      }
      .gradient-border:hover::before {
        background: linear-gradient(135deg, rgba(14,165,233,0.4), rgba(16,185,129,0.4));
      }

      /* Section divider glow line */
      .section-glow-line {
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(14,165,233,0.3), rgba(16,185,129,0.3), transparent);
      }

      /* noise-overlay removed — SVG feTurbulence filter is CPU-intensive */

      /* Premium stat counter glow */
      .stat-value {
        background: linear-gradient(135deg, #fff 50%, rgba(255,255,255,0.7) 100%);
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: none;
      }

      /* Step card premium border */
      .step-card-inner {
        position: relative;
        transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
      }
      .step-card-inner:hover {
        transform: translateY(-4px);
      }

      /* Animated ring for step numbers */
      @keyframes ring-pulse {
        0%   { box-shadow: 0 0 0 0   rgba(139,92,246,0.5); }
        70%  { box-shadow: 0 0 0 14px rgba(139,92,246,0); }
        100% { box-shadow: 0 0 0 0   rgba(139,92,246,0); }
      }
      .step-ring-violet { animation: ring-pulse 2.5s ease-out infinite; }

      @keyframes ring-pulse-pink {
        0%   { box-shadow: 0 0 0 0   rgba(236,72,153,0.5); }
        70%  { box-shadow: 0 0 0 14px rgba(236,72,153,0); }
        100% { box-shadow: 0 0 0 0   rgba(236,72,153,0); }
      }
      .step-ring-pink { animation: ring-pulse-pink 2.5s ease-out 0.4s infinite; }

      @keyframes ring-pulse-sky {
        0%   { box-shadow: 0 0 0 0   rgba(14,165,233,0.5); }
        70%  { box-shadow: 0 0 0 14px rgba(14,165,233,0); }
        100% { box-shadow: 0 0 0 0   rgba(14,165,233,0); }
      }
      .step-ring-sky { animation: ring-pulse-sky 2.5s ease-out 0.8s infinite; }

      /* Premium line connector */
      .timeline-line {
        background: linear-gradient(to bottom,
          rgba(139,92,246,0.5),
          rgba(236,72,153,0.5),
          rgba(14,165,233,0.5)
        );
      }

      /* Affiliate card premium glow */
      .affiliate-card-premium {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
      }
      .affiliate-card-premium:hover {
        transform: translateY(-6px) scale(1.01);
        box-shadow: 0 20px 60px rgba(16,185,129,0.15), 0 0 0 1px rgba(16,185,129,0.2);
      }

      /* CTA premium gradient border */
      @keyframes cta-glow {
        0%, 100% { opacity: 0.5; }
        50%  { opacity: 1; }
      }
      .cta-glow-ring {
        animation: cta-glow 3s ease-in-out infinite;
      }

      /* Payment logo card */
      .payment-card {
        transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
      }
      .payment-card:hover {
        transform: translateY(-3px) scale(1.04);
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        border-color: rgba(14,165,233,0.3) !important;
      }

      /* Partnership image reveal */
      .partner-image-wrap {
        position: relative;
        overflow: hidden;
      }
      .partner-image-wrap::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(14,165,233,0.05), rgba(16,185,129,0.05));
        pointer-events: none;
      }

      /* ── Word-split perspective for GSAP text animation ───── */
      .gsap-hero-title-line1,
      .gsap-hero-title-accent {
        perspective: 600px;
        transform-style: preserve-3d;
      }

      /* ── Decorative orbs — animated by GSAP ─────────────── */
      .gsap-orb { pointer-events: none; }

      /* ── Counter text pop ────────────────────────────────── */
      .gsap-counter {
        font-variant-numeric: tabular-nums;
        will-change: contents;
      }

      /* ── Framer Motion will-change hint ─────────────────── */
      [data-motion-component] { will-change: transform, opacity; }

      /* ── Stouch.id title shimmer ─────────────────────────── */
      @keyframes title-shimmer {
        0%   { background-position: 150% center; }
        100% { background-position: -150% center; }
      }
      .shimmer-title-stouch {
        background: linear-gradient(90deg,
          #e2fdf0 0%,
          #ffffff 15%,
          #ffffff 35%,
          #f0fff8 42%,
          #ccfce7 47%,
          #ffffff 52%,
          #ffffff 70%,
          #e2fdf0 100%
        );
        background-size: 250% auto;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: title-shimmer 6s ease-in-out infinite;
      }
      .shimmer-title-id {
        background: linear-gradient(90deg,
          #34d399 0%,
          #6ee7b7 15%,
          #a7f3d0 30%,
          #ecfdf5 42%,
          #ffffff 47%,
          #ecfdf5 52%,
          #6ee7b7 70%,
          #34d399 100%
        );
        background-size: 250% auto;
        background-clip: text;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        animation: title-shimmer 6s ease-in-out infinite;
        animation-delay: 0.7s;
      }

      /* Fade top/bottom edges for marquee */
      .marquee-fade {
        mask-image: linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%);
        -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 8%, black 92%, transparent 100%);
      }
    `}</style>
    </div>
  )
}