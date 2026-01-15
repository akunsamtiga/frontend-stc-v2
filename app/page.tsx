// app/(landing)/page.tsx - ✅ FIXED: Referral Code Support
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { 
  TrendingUp, 
  Zap, 
  Shield, 
  Clock, 
  BarChart3,
  Award,
  Users,
  ArrowRight,
  Star,
  Globe,
  TrendingDown,
  Target,
  X,
  Sparkles,
  Activity,
  UserPlus,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import {
  subscribeToCryptoPrices,
  generateLiveTrade,
  formatCryptoPrice,
  formatChangePercent,
  CryptoPriceData,
  LiveTradeData
} from '@/lib/crypto-price'
import { signInWithGoogle, getIdToken, isRedirectPending } from '@/lib/firebase-auth'
import EnhancedFooter from '@/components/EnhancedFooter'

// ===================================
// DATA CONSTANTS
// ===================================
const stats = [
  { label: 'Pengguna', value: '1 jt+', icon: Users },
  { label: 'Volume Harian', value: '$10 B', icon: DollarSign },
  { label: 'Win Rate', value: '100%', icon: Target },
  { label: 'Negara', value: '15+', icon: Globe },
]

const features = [
  {
    icon: Zap,
    title: 'Eksekusi Kilat',
    description: 'Eksekusi order dalam milidetik',
    gradient: 'from-yellow-500/20 to-orange-500/20',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30'
  },
  {
    icon: Shield,
    title: 'Keamanan Maksimal',
    description: 'Enkripsi tingkat tinggi melindungi dana Anda',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30'
  },
  {
    icon: BarChart3,
    title: 'Analisis Real-Time',
    description: 'Chart disediakan langsung dari Tradingview',
    gradient: 'from-purple-500/20 to-pink-500/20',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30'
  },
  {
    icon: Award,
    title: 'Profit Hingga 100%',
    description: 'Keuntungan maksimal dibanding platform lain',
    gradient: 'from-green-500/20 to-emerald-500/20',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30'
  },
]

const testimonials = [
  {
    name: 'Ahmad Rizki',
    role: 'Trader Profesional',
    content: 'Platform yang mengubah permainan! Cepat, handal, dan menguntungkan. Saya konsisten profit selama 6 bulan.',
    rating: 5,
    avatar: '👨‍💼',
    profit: '+285%',
    location: 'Jakarta',
    duration: '6 bulan'
  },
  {
    name: 'Siti Nurhaliza',
    role: 'Trader Paruh Waktu',
    content: 'Sebagai pemula, tampilan interface memudahkan trading. Dukungan hebat dan materi edukasi membantu saya sukses!',
    rating: 5,
    avatar: '👩‍💻',
    profit: '+142%',
    location: 'Surabaya',
    duration: '3 bulan'
  },
  {
    name: 'Budi Santoso',
    role: 'Investor Berpengalaman',
    content: 'Platform trading terbaik yang pernah saya gunakan. Kecepatan, keamanan, dan tingkat profit tak tertandingi.',
    rating: 5,
    avatar: '👨‍🎓',
    profit: '+378%',
    location: 'Bandung',
    duration: '1 tahun'
  },
]

const dummyTrades = [
  { user: 'kingtrader88', asset: 'BTC/USD', profit: 2450000, time: 'Baru saja' },
  { user: 'moon_hunter', asset: 'ETH/USD', profit: 1850000, time: '1 menit lalu' },
  { user: 'trader_pro21', asset: 'BNB/USD', profit: 950000, time: '2 menit lalu' },
  { user: 'master_mind', asset: 'BTC/USD', profit: 3200000, time: '3 menit lalu' },
  { user: 'hodl4life', asset: 'ETH/USD', profit: 1650000, time: '4 menit lalu' },
  { user: 'profit_seeker', asset: 'BNB/USD', profit: 780000, time: '5 menit lalu' },
  { user: 'diamond_hands', asset: 'BTC/USD', profit: 2980000, time: '6 menit lalu' },
  { user: 'fire_warrior', asset: 'ETH/USD', profit: 1420000, time: '7 menit lalu' },
  { user: 'swift_ninja', asset: 'BNB/USD', profit: 890000, time: '8 menit lalu' },
  { user: 'bullrun2024', asset: 'BTC/USD', profit: 2750000, time: '9 menit lalu' },
  { user: 'satoshi_fan', asset: 'ETH/USD', profit: 1950000, time: '10 menit lalu' },
  { user: 'whale_alert', asset: 'BNB/USD', profit: 1120000, time: '11 menit lalu' },
  { user: 'defi_king', asset: 'BTC/USD', profit: 3450000, time: '12 menit lalu' },
  { user: 'moon_boy', asset: 'ETH/USD', profit: 1680000, time: '13 menit lalu' },
  { user: 'alpha_trader', asset: 'BNB/USD', profit: 920000, time: '14 menit lalu' },
  { user: 'lambo_soon', asset: 'BTC/USD', profit: 2850000, time: '15 menit lalu' },
  { user: 'degen_ape', asset: 'ETH/USD', profit: 1780000, time: '16 menit lalu' },
  { user: 'paper_hands', asset: 'BNB/USD', profit: 1050000, time: '17 menit lalu' },
  { user: 'rekt_veteran', asset: 'BTC/USD', profit: 3100000, time: '18 menit lalu' },
  { user: 'pumpit_up', asset: 'ETH/USD', profit: 1520000, time: '19 menit lalu' },
  { user: 'gem_hunter99', asset: 'BNB/USD', profit: 850000, time: '20 menit lalu' },
  { user: 'stack_lord', asset: 'BTC/USD', profit: 2650000, time: '21 menit lalu' },
  { user: 'alt_season', asset: 'ETH/USD', profit: 1890000, time: '22 menit lalu' },
  { user: 'wagmi_bro', asset: 'BNB/USD', profit: 980000, time: '23 menit lalu' },
  { user: 'wen_moon', asset: 'BTC/USD', profit: 3350000, time: '24 menit lalu' },
  { user: 'buy_the_dip', asset: 'ETH/USD', profit: 1720000, time: '25 menit lalu' },
  { user: 'chart_wizard', asset: 'BNB/USD', profit: 1180000, time: '26 menit lalu' },
  { user: 'bull_gang', asset: 'BTC/USD', profit: 2920000, time: '27 menit lalu' },
  { user: 'legendary_ape', asset: 'ETH/USD', profit: 1580000, time: '28 menit lalu' },
  { user: 'to_the_moon', asset: 'BNB/USD', profit: 890000, time: '29 menit lalu' },
]

// ===================================
// LIVE CRYPTO TRADING TICKER
// ===================================
const LiveCryptoTicker = () => {
  const [trades, setTrades] = useState<LiveTradeData[]>([])
  const [prices, setPrices] = useState<Record<string, CryptoPriceData>>({})

  useEffect(() => {
    const unsubscribe = subscribeToCryptoPrices(
      ['BTC', 'ETH', 'BNB'],
      (newPrices) => {
        setPrices(newPrices)
      },
      5000
    )

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const cryptos = ['BTC/USD', 'ETH/USD', 'BNB/USD']
    
    const interval = setInterval(() => {
      const randomCrypto = cryptos[Math.floor(Math.random() * cryptos.length)]
      const cryptoKey = randomCrypto.split('/')[0]
      const currentPrice = prices[cryptoKey]?.price || 0
      
      const newTrade = generateLiveTrade(randomCrypto, currentPrice)
      setTrades(prev => [newTrade, ...prev.slice(0, 2)])
    }, 3500)

    return () => clearInterval(interval)
  }, [prices])

  return (
    <div className="hidden lg:block absolute bottom-32 right-8 w-72 bg-[#0a0e17]/95 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 shadow-2xl z-10 animate-slide-in-right">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs font-semibold text-gray-300">Transaksi Live</span>
      </div>
      <div className="space-y-2">
        {trades.map((trade, i) => (
          <div 
            key={i}
            className="flex items-center justify-between p-2 bg-green-500/5 border border-green-500/20 rounded-lg animate-fade-in-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-200">{trade.user}</div>
              <div className="text-[10px] text-gray-400">{trade.asset}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-green-400">+Rp {trade.profit.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500">{trade.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ===================================
// FLOATING CRYPTO PRICE CARD
// ===================================
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
        className="hidden lg:block absolute bg-[#0a0e17]/95 backdrop-blur-xl border border-gray-800/50 rounded-xl p-3 shadow-2xl animate-float"
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
      className="hidden lg:block absolute bg-[#0a0e17]/95 backdrop-blur-xl border border-gray-800/50 rounded-xl p-3 shadow-2xl animate-float"
      style={{ animationDelay: `${delay}s`, ...style }}
    >
      <div className="text-xs text-gray-400 mb-1">{priceData.symbol}</div>
      <div className="text-lg font-bold mb-1">
        ${formatCryptoPrice(priceData.price)}
      </div>
      <div className={`text-xs font-semibold flex items-center gap-1 ${
        isPositive ? 'text-green-400' : 'text-red-400'
      }`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {formatChangePercent(priceData.changePercent24h)}
      </div>
    </div>
  )
}

// ===================================
// LIVE CRYPTO CHART
// ===================================
const LiveCryptoChart = () => {
  const [selectedCrypto, setSelectedCrypto] = useState('BTC')
  const [priceData, setPriceData] = useState<CryptoPriceData | null>(null)
  const [priceHistory, setPriceHistory] = useState<number[]>([])
  const [currentTradeIndex, setCurrentTradeIndex] = useState(0)

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
      3000
    )

    return () => unsubscribe()
  }, [selectedCrypto])

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTradeIndex((prev) => {
        return (prev + 1) % dummyTrades.length
      })
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  const maxPrice = Math.max(...priceHistory, 1)
  const minPrice = Math.min(...priceHistory, 0)
  const priceRange = maxPrice - minPrice || 1

  const currentTrades = [
    dummyTrades[currentTradeIndex],
    dummyTrades[(currentTradeIndex + 1) % dummyTrades.length]
  ]

  return (
    <div className="relative bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border border-gray-800/50 rounded-3xl p-6 shadow-2xl backdrop-blur-xl hover:scale-[1.02] transition-transform duration-300">
      <div className="flex gap-2 mb-4">
        {['BTC', 'ETH', 'BNB'].map(crypto => (
          <button
            key={crypto}
            onClick={() => setSelectedCrypto(crypto)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedCrypto === crypto
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50'
            }`}
          >
            {crypto}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
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
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
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
                  className="flex-1 bg-gradient-to-t from-emerald-500/50 to-blue-500/50 rounded-t transition-all duration-500 ease-out"
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
        <button className="group relative bg-gradient-to-br from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-500/30 rounded-xl p-4 sm:p-6 transition-colors overflow-hidden">
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 mx-auto mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-base sm:text-lg text-emerald-400">BELI</div>
          <div className="text-[10px] sm:text-xs text-gray-400">Profit +95%</div>
        </button>

        <button className="group relative bg-gradient-to-br from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 rounded-xl p-4 sm:p-6 transition-colors overflow-hidden">
          <TrendingDown className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 mx-auto mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-base sm:text-lg text-red-400">JUAL</div>
          <div className="text-[10px] sm:text-xs text-gray-400">Profit +95%</div>
        </button>
      </div>

      <div className="sm:hidden mt-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-xs font-semibold text-gray-300">Transaksi Live</span>
        </div>
        <div className="space-y-2">
          {currentTrades.map((trade, i) => (
            <div 
              key={`${currentTradeIndex}-${i}`}
              className="flex items-center justify-between p-2.5 bg-green-500/5 border border-green-500/20 rounded-lg hover:bg-green-500/10 transition-all duration-500 animate-fade-in-up"
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-200 truncate">{trade.user}</div>
                <div className="text-[10px] text-gray-400">{trade.asset}</div>
              </div>
              <div className="text-right ml-3">
                <div className="text-xs font-bold text-green-400">+Rp {trade.profit.toLocaleString()}</div>
                <div className="text-[9px] text-gray-500">{trade.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ===================================
// MAIN LANDING PAGE COMPONENT
// ===================================
export default function LandingPage() {
  const router = useRouter()
  const { user, setAuth } = useAuthStore()
  
  // ✅ ALL useState hooks at the top
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [activeFeature, setActiveFeature] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [logoPhase, setLogoPhase] = useState<'stc-logo-in' | 'stc-text-in' | 'stc-hold' | 'stc-text-out' | 'stc-logo-out' | 'stockity-logo-in' | 'stockity-text-in' | 'stockity-hold' | 'stockity-text-out' | 'stockity-logo-out'>('stc-logo-in')
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  
  // ✅ NEW: Referral code state
  const [referralCode, setReferralCode] = useState<string>('')
  const [hasReferralCode, setHasReferralCode] = useState(false)

  // ✅ Effect 1: Check auth timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsCheckingAuth(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // ✅ Effect 2: Redirect if authenticated
  useEffect(() => {
    if (!isCheckingAuth && user) {
      console.log('ℹ️ User already authenticated, redirecting...')
      router.push('/trading')
    }
  }, [user, router, isCheckingAuth])

  // ✅ NEW Effect 3: Read referral code from URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    // Read ?ref=WUTJ8JGX from URL
    const urlParams = new URLSearchParams(window.location.search)
    const refCode = urlParams.get('ref')
    
    if (refCode && refCode.trim() !== '') {
      setReferralCode(refCode.trim())
      setHasReferralCode(true)
      console.log('✅ Referral code detected:', refCode)
      
      // Show toast
      toast.info(`Kode referral: ${refCode}`, {
        description: 'Anda akan mendapatkan bonus saat mendaftar',
        duration: 5000
      })
    }
  }, [])

  // Effect 3: Logo animation
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

  // Effect 4: Auto carousel for testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Effect 5: Auto carousel for features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Effect 6: Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 20,
        y: (e.clientY / window.innerHeight) * 20
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // ✅ NOW do conditional rendering AFTER all hooks
  if (isCheckingAuth || isRedirectPending()) {
    return (
      <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">
            {isRedirectPending() ? 'Menyelesaikan login...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (user) return null

  // ✅ Event handlers
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
    setLoading(true)

    try {
      const response = isLogin
        ? await api.login(email, password)
        : await api.register(email, password, referralCode || undefined) // ✅ KIRIM referralCode!

      const userData = response.user || response.data?.user
      const token = response.token || response.data?.token

      if (!userData || !token) {
        toast.error('Respon tidak valid dari server')
        return
      }

      setAuth(userData, token)
      api.setToken(token)

      // ✅ Show affiliate info if available
      if (!isLogin && response.data?.affiliate) {
        const affiliate = response.data.affiliate
        toast.success('Akun berhasil dibuat!', {
          description: affiliate.referredBy 
            ? `Dirujuk oleh: ${affiliate.referredBy}. Komisi menunggu deposit pertama.`
            : 'Selamat bergabung!',
          duration: 5000
        })
      } else {
        toast.success(response.message || 'Login berhasil!')
      }

      router.replace('/trading')
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

  // ✅ FIXED: handleGoogleSignIn sudah OK (sudah ada referralCode)
  const handleGoogleSignIn = async () => {
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

      // ✅ Use referralCode from state (already read from URL)
      console.log('📤 Sending to backend with referral:', referralCode || 'none')
      const response = await api.googleSignIn(idToken, referralCode || undefined)
      
      const userData = response.user || response.data?.user
      const token = response.token || response.data?.token

      if (!userData || !token) {
        throw new Error('Invalid response from server')
      }

      console.log('✅ Backend authentication successful')

      setAuth(userData, token)
      api.setToken(token)

      // ✅ Show affiliate info
      const isNewUser = response.data?.isNewUser || false
      const affiliate = response.data?.affiliate
      
      let message = isNewUser ? 'Akun berhasil dibuat! Selamat datang!' : 'Selamat datang kembali!'
      
      if (affiliate?.referredBy) {
        toast.success(message, {
          description: `Dirujuk oleh: ${affiliate.referredBy}. Komisi menunggu deposit pertama.`,
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
    <div className="min-h-screen bg-[#0a0e17] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow"
          style={{
            transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)`
          }}
        />
        <div 
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] animate-pulse-slow"
          style={{
            transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)`,
            animationDelay: '1s'
          }}
        />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-05"></div>

        {/* AI Image Layer */}
        <div className="hidden lg:block absolute left-0 bottom-0 w-2/5 h-2/5 opacity-25 pointer-events-none z-0">
          <Image
            src="/ai1.png"
            alt=""
            fill
            className="object-contain object-left-bottom"
            priority
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1f2e]/95 backdrop-blur-xl border-b border-gray-700/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo with animation */}
            <div className="relative h-12 w-52 overflow-visible">
              {/* STC AutoTrade */}
              {logoPhase.startsWith('stc-') && (
                <div className="flex items-center gap-3 absolute left-0 top-0">
                  <div className={`relative w-10 h-10 flex-shrink-0 overflow-visible ${
                    logoPhase === 'stc-logo-in' ? 'animate-logo-bounce-in' :
                    logoPhase === 'stc-logo-out' ? 'animate-logo-bounce-out' : 
                    'opacity-100'
                  }`}>
                    <Image
                      src="/stc-logo.png"
                      alt="STC AutoTrade"
                      fill
                      className="object-contain rounded-md"
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
                        STC AutoTrade
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* By Stockity */}
              {logoPhase.startsWith('stockity-') && (
                <div className="flex items-center gap-3 absolute left-0 top-0">
                  <div className={`relative w-10 h-10 flex-shrink-0 overflow-visible ${
                    logoPhase === 'stockity-logo-in' ? 'animate-logo-bounce-in' :
                    logoPhase === 'stockity-logo-out' ? 'animate-logo-bounce-out' : 
                    'opacity-100'
                  }`}>
                    <Image
                      src="/stockity.png"
                      alt="Stockity"
                      fill
                      className="object-contain rounded-md"
                      priority
                    />
                  </div>
                  
                  {(logoPhase !== 'stockity-logo-in' && logoPhase !== 'stockity-logo-out') && (
                    <div className="flex overflow-hidden">
                      <span className={`text-xl font-bold text-white whitespace-nowrap ${
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

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-300 hover:text-white transition-colors relative group">
                Fitur
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all"></span>
              </a>
              <a href="#how-it-works" className="text-sm text-gray-300 hover:text-white transition-colors relative group">
                Cara Kerja
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all"></span>
              </a>
              <a href="#testimonials" className="text-sm text-gray-300 hover:text-white transition-colors relative group">
                Testimoni
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all"></span>
              </a>
            </div>

            {/* Auth Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsLogin(false)
                  setShowAuthModal(true)
                }}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#2d3748] hover:bg-[#3d4758] rounded-lg text-sm font-semibold text-white shadow-lg transition-colors border border-gray-600"
              >
                <UserPlus className="w-4 h-4" />
                Daftar
              </button>
            </div>
            
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1f2e] via-[#0f1419] to-[#0a0e17]"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/8 rounded-full blur-[100px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/8 rounded-full blur-[100px]"></div>
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          ></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight">
                Raih Bonus
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400 animate-gradient bg-[length:200%_auto]">
                  Deposit 100%
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-400 leading-relaxed">
                Tersedia berbagai aset <span className="text-emerald-400 font-semibold">global</span>, 
                dapatkan profit hingga <span className="text-blue-400 font-semibold">100%</span>, 
                dan sangat mudah bagi <span className="text-cyan-400 font-semibold">pemula</span>.
              </p>

              <div className="flex flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setIsLogin(true)
                    setShowAuthModal(true)
                  }}
                  className="group flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-sm sm:text-lg font-semibold text-white transition-colors shadow-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="hidden sm:inline">Masuk untuk Trading</span>
                    <span className="sm:hidden">Masuk</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <button className="group flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-gray-600 rounded-xl text-sm sm:text-lg font-semibold transition-colors backdrop-blur-sm">
                  <span className="flex items-center justify-center gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Lihat Demo</span>
                    <span className="sm:hidden">Demo</span>
                  </span>
                </button>
              </div>

              {/* Stats Row */}
              <div className="hidden sm:grid grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <div 
                    key={index} 
                    className="text-center transform hover:scale-105 transition-transform cursor-default bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-gray-800/50"
                  >
                    <stat.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-xl font-bold">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Real Crypto Components */}
            <div className="relative">
              <LiveCryptoTicker />

              <FloatingCryptoPriceCard 
                symbol="BTC" 
                delay={0}
                style={{ top: '10%', left: '-10%' }}
              />
              <FloatingCryptoPriceCard 
                symbol="ETH" 
                delay={0.5}
                style={{ top: '60%', left: '-5%' }}
              />
              <FloatingCryptoPriceCard 
                symbol="BNB" 
                delay={1}
                style={{ bottom: '10%', right: '-10%' }}
              />

              <LiveCryptoChart />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 relative border-t border-blue-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-400">Teknologi Terdepan</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
              Menghadirkan Solusi
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Platform dengan teknologi dan keamanan terbaik
            </p>
          </div>

          {/* Desktop Grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300 overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <div className={`inline-flex w-14 h-14 ${feature.bgColor} ${feature.borderColor} border-2 rounded-2xl items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>

                  <h3 className="text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>

                  <div className={`h-1 w-12 ${feature.bgColor} rounded-full mt-6 group-hover:w-20 transition-all duration-300`}></div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Carousel */}
          <div className="sm:hidden relative">
            <div 
              className="relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative min-h-[110px]">
                {features.map((feature, index) => {
                  const isActive = index === activeFeature
                  const offset = index - activeFeature
                  
                  return (
                    <div 
                      key={index}
                      className={`absolute inset-0 transition-all duration-500 ease-out ${
                        isActive 
                          ? 'opacity-100 scale-100 z-30 translate-x-0' 
                          : offset === -1
                          ? 'opacity-0 scale-95 z-10 -translate-x-full'
                          : offset === 1
                          ? 'opacity-0 scale-95 z-10 translate-x-full'
                          : 'opacity-0 scale-90 z-0'
                      }`}
                    >
                      <div className="mx-4 h-full">
                        <div className={`relative h-full bg-[#0a0e17] border ${feature.borderColor} rounded-xl p-3 overflow-hidden`}>
                          <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5`}></div>
                          
                          <div className="relative h-full flex flex-col">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`flex-shrink-0 w-12 h-12 ${feature.bgColor} ${feature.borderColor} border rounded-xl flex items-center justify-center`}>
                                <feature.icon className={`w-6 h-6 ${feature.color}`} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1.5">
                                  <h3 className="text-base font-bold tracking-tight leading-tight">{feature.title}</h3>
                                  <div className={`flex-shrink-0 w-6 h-6 ${feature.bgColor} rounded-md flex items-center justify-center border ${feature.borderColor}`}>
                                    <span className={`text-xs font-bold ${feature.color}`}>{index + 1}</span>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-gray-400 leading-snug">{feature.description}</p>
                              </div>
                            </div>

                            <div className={`h-1 w-16 ${feature.bgColor} rounded-full mt-3 opacity-60`}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Progress Dots */}
            <div className="mt-5 px-4">
              <div className="flex items-center justify-center gap-2">
                {features.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className="transition-all duration-300"
                  >
                    <div className={`transition-all duration-300 rounded-full ${
                      index === activeFeature 
                        ? `w-7 h-1.5 ${feature.bgColor}` 
                        : 'w-1.5 h-1.5 bg-gray-700 hover:bg-gray-600'
                    }`}></div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 text-center text-xs text-gray-500">
              Swipe untuk melihat lebih banyak
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-20 relative border-t border-purple-800/50 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-20 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-purple-400">Mulai dalam 3 langkah mudah</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
              Cara Kerja Platform
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Trading menjadi sangat mudah dengan teknologi kami
            </p>
          </div>

          {/* Desktop Timeline */}
          <div className="hidden lg:block max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-purple-500/20 via-pink-500/20 to-blue-500/20"></div>

              <div className="space-y-24">
                {/* Step 1 */}
                <div className="relative flex items-center">
                  <div className="w-[calc(50%-3rem)] mr-auto">
                    <div className="bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-8 hover:border-purple-500/30 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Users className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">Daftar & Verifikasi</h3>
                          <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            Buat akun dalam 2 menit. Verifikasi identitas untuk keamanan maksimal dan mulai dengan akun demo gratis.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-400">Registrasi cepat</span>
                            <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-400">Demo Rp10.000.000</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-1/2 -translate-x-1/2 z-10">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping opacity-75"></div>
                      <div className="absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-purple-500/50 flex items-center justify-center">
                        <span className="text-xl font-bold text-purple-400">1</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-center flex-row-reverse">
                  <div className="w-[calc(50%-3rem)] ml-auto">
                    <div className="bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-8 hover:border-pink-500/30 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-pink-500/10 border border-pink-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-6 h-6 text-pink-400" />
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
                    </div>
                  </div>

                  <div className="absolute left-1/2 -translate-x-1/2 z-10">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-pink-500/50 flex items-center justify-center">
                        <span className="text-xl font-bold text-pink-400">2</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-center">
                  <div className="w-[calc(50%-3rem)] mr-auto">
                    <div className="bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-8 hover:border-blue-500/30 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold mb-2">Trading & Hasilkan Profit</h3>
                          <p className="text-gray-400 text-sm leading-relaxed mb-4">
                            Pasar trading buka 24/7. Pantau profit real-time dan tarik keuntungan kapan saja.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400">Trading 24/7</span>
                            <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400">Profit sampai 100%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute left-1/2 -translate-x-1/2 z-10">
                    <div className="relative w-16 h-16">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
                      <div className="absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-blue-500/50 flex items-center justify-center">
                        <span className="text-xl font-bold text-blue-400">3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden space-y-6">
            {[
              { icon: Users, title: 'Daftar & Verifikasi', desc: 'Buat akun dalam 2 menit dengan verifikasi aman', color: 'purple', num: 1 },
              { icon: DollarSign, title: 'Deposit & Pilih Strategi', desc: 'Deposit minimal Rp 100K dan pilih strategi auto trading', color: 'pink', num: 2 },
              { icon: TrendingUp, title: 'Trading & Profit', desc: 'Sistem trading otomatis 24/7 dengan profit hingga 95%', color: 'blue', num: 3 }
            ].map((step, i) => (
              <div key={i} className="flex gap-4 relative">
                {i < 2 && <div className="absolute left-7 top-16 w-px h-6 bg-gray-800"></div>}
                
                <div className="flex-shrink-0">
                  <div className={`w-14 h-14 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-full flex items-center justify-center`}>
                    <span className={`text-lg font-bold text-${step.color}-400`}>{step.num}</span>
                  </div>
                </div>
                
                <div className="flex-1 bg-[#0a0e17] border border-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-lg flex items-center justify-center`}>
                      <step.icon className={`w-5 h-5 text-${step.color}-400`} />
                    </div>
                    <h3 className="font-bold">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 relative border-t border-blue-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="relative bg-[#0a0e17] border border-gray-800/50 rounded-3xl overflow-hidden">
            <div className="absolute inset-0">
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Desktop */}
            <div className="hidden sm:block relative z-10 px-16 py-20 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-400">Platform Trading Terbaik</span>
              </div>

              <h2 className="text-5xl font-bold mb-6 tracking-tight">
                Mulai Trading Hari Ini
              </h2>
              
              <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
                Telah dipakai dan diunduh sebanyak 1.000.000+ pengguna di Playstore
              </p>

              <button
                onClick={() => {
                  setIsLogin(true)
                  setShowAuthModal(true)
                }}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-gray-800/50">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">1 jt+</div>
                  <div className="text-xs text-gray-500">Pengguna Aktif</div>
                </div>
                <div className="w-px h-10 bg-gray-800"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">$10 B</div>
                  <div className="text-xs text-gray-500">Volume Harian</div>
                </div>
                <div className="w-px h-10 bg-gray-800"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">100%</div>
                  <div className="text-xs text-gray-500">Max Profit</div>
                </div>
              </div>
            </div>

            {/* Mobile */}
            <div className="sm:hidden relative z-10 p-8 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-blue-400">Platform Terpercaya</span>
              </div>

              <h2 className="text-3xl font-bold mb-4 tracking-tight">
                Mulai Trading<br />Hari Ini
              </h2>
              
              <p className="text-sm text-gray-400 mb-8">
                Bergabung dengan 50.000+ trader profesional
              </p>

              <button
                onClick={() => {
                  setIsLogin(true)
                  setShowAuthModal(true)
                }}
                className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 active:bg-gray-200 transition-all shadow-lg"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-800/50">
                <div className="text-center">
                  <div className="text-xl font-bold mb-0.5">1 jt+</div>
                  <div className="text-[10px] text-gray-500">Trader</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold mb-0.5">$10 B</div>
                  <div className="text-[10px] text-gray-500">Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold mb-0.5">100%</div>
                  <div className="text-[10px] text-gray-500">Profit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Payment Methods */}
      <section className="py-16 sm:py-20 relative border-t border-yellow-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-6">
              <Shield className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-xs font-medium text-yellow-400">Metode Pembayaran Aman</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 tracking-tight">
              Deposit & Penarikan Mudah
            </h2>
            <p className="text-sm text-gray-400 max-w-xl mx-auto">
              Berbagai pilihan metode pembayaran untuk kemudahan transaksi Anda
            </p>
          </div>

          {/* Desktop Grid */}
          <div className="hidden sm:block max-w-5xl mx-auto space-y-3 sm:space-y-4">
            <div className="grid grid-cols-6 gap-4">
              {[
                { name: 'Mandiri', logo: '/mandiri.webp' },
                { name: 'BRI', logo: '/bri.webp' },
                { name: 'BNI', logo: '/bni.webp' },
                { name: 'GoPay', logo: '/gopay.webp' },
                { name: 'OVO', logo: '/ovo.webp' },
                { name: 'DANA', logo: '/dana.webp' },
              ].map((item) => (
                <div key={item.name} className="bg-white border border-gray-200 rounded-xl p-6 transition-all hover:shadow-md">
                  <div className="relative h-12 flex items-center justify-center">
                    <Image 
                      src={item.logo} 
                      alt={item.name}
                      width={120}
                      height={40}
                      className="h-full w-auto object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-5 gap-4">
              {[
                { name: 'LinkAja', logo: '/linkaja.webp' },
                { name: 'Visa', logo: '/visa.webp' },
                { name: 'Mastercard', logo: '/mastercard.webp' },
                { name: 'Bitcoin', logo: '/bitcoin.webp' },
                { name: 'BCA', logo: '/bca.webp' },
              ].map((item) => (
                <div key={item.name} className="bg-white border border-gray-200 rounded-xl p-6 transition-all hover:shadow-md">
                  <div className="relative h-12 flex items-center justify-center">
                    <Image 
                      src={item.logo} 
                      alt={item.name}
                      width={120}
                      height={40}
                      className="h-full w-auto object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Scrollable Grid */}
<div className="sm:hidden space-y-3">
  {/* Baris 1 - 6 logo pertama (dari kanan ke kiri: DANA, OVO, GoPay, BNI, BRI, Mandiri) */}
  <div className="relative">
    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0e17] to-transparent z-10 pointer-events-none"></div>
    
    <div className="overflow-x-auto pb-2 hide-scrollbar">
      <div className="flex gap-3 px-4">
        {[
          { name: 'DANA', logo: '/dana.webp' },
          { name: 'OVO', logo: '/ovo.webp' },
          { name: 'GoPay', logo: '/gopay.webp' },
          { name: 'BNI', logo: '/bni.webp' },
          { name: 'BRI', logo: '/bri.webp' },
          { name: 'Mandiri', logo: '/mandiri.webp' },
        ].map((item) => (
          <div key={item.name} className="flex-shrink-0 w-28 bg-white border border-gray-200 rounded-xl p-4">
            <div className="relative h-12 flex items-center justify-center">
              <Image 
                src={item.logo} 
                alt={item.name}
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

  {/* Baris 2 - 5 logo terakhir (gradient kanan, scroll dari kiri) */}
  <div className="relative">
    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0e17] to-transparent z-10 pointer-events-none"></div>
    
    <div className="overflow-x-auto pb-2 hide-scrollbar">
      <div className="flex gap-3 px-4">
        {[
          { name: 'LinkAja', logo: '/linkaja.webp' },
          { name: 'Visa', logo: '/visa.webp' },
          { name: 'Mastercard', logo: '/mastercard.webp' },
          { name: 'Bitcoin', logo: '/bitcoin.webp' },
          { name: 'BCA', logo: '/bca.webp' },
        ].map((item) => (
          <div key={item.name} className="flex-shrink-0 w-28 bg-white border border-gray-200 rounded-xl p-4">
            <div className="relative h-12 flex items-center justify-center">
              <Image 
                src={item.logo} 
                alt={item.name}
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

  {/* Indikator scroll */}
  <div className="text-center">
    <p className="text-xs text-gray-500">← Geser untuk melihat lebih banyak →</p>
  </div>
</div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-medium">
                Semua transaksi telah dilindungi enkripsi SSL 256-bit
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Affiliate Program */}
<section className="py-16 sm:py-20 relative border-t border-emerald-800/50">
  <div className="container mx-auto px-4 sm:px-6">
    {/* Header */}
    <div className="text-center mb-16 animate-fade-in-up">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-sm font-medium text-emerald-400">Program Rujukan</span>
      </div>
      <h2 className="text-4xl sm:text-5xl font-bold mb-6 px-12 tracking-tight">
        Undang Teman,<br />Dapatkan Hingga <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-400">Rp 400.000</span>
      </h2>
      <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
        Setelah mendaftar dan melakukan deposit, Anda dapat mengundang teman dan menerima<br/><span className="text-emerald-400 font-semibold">Rp 25.000 hingga Rp 400.000</span> ke akun riil Anda untuk setiap orang.
      </p>
    </div>

    {/* Reward Cards */}
    <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
      {/* VIP Card */}
      <div className="group relative bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border border-emerald-500/30 rounded-3xl p-8 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-4">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Pengguna VIP</span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-emerald-400">Rp 400.000</span>
            <span className="text-gray-500">/trader</span>
          </div>
          
          <p className="text-gray-400 text-sm leading-relaxed">
            Untuk setiap trader baru yang Anda undang sebagai member VIP atau Platinum
          </p>
        </div>
      </div>

      {/* Standard & Gold Card */}
      <div className="group relative bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border border-blue-500/30 rounded-3xl p-8 hover:border-blue-500/50 transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full mb-4">
            <Star className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">Pengguna Standard & Gold</span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-4xl font-bold text-blue-400">Rp 100.000</span>
            <span className="text-gray-500">/trader</span>
          </div>
          
          <p className="text-gray-400 text-sm leading-relaxed">
            Untuk setiap trader baru yang Anda undang sebagai member Standard atau Gold
          </p>

        </div>
      </div>
    </div>

    {/* How It Works */}
    <div className="max-w-4xl mx-auto mb-16">
      <h3 className="text-2xl sm:text-3xl font-bold text-center mb-12">
        Maksimalkan Keuntungan Anda dengan Program Rujukan
      </h3>

      {/* Desktop Timeline */}
      <div className="hidden md:grid md:grid-cols-4 gap-6">
        {[
          {
            num: '1',
            icon: Users,
            title: 'Temukan Teman',
            desc: 'Yang sudah trading di STC',
            color: 'blue'
          },
          {
            num: '2',
            icon: UserPlus,
            title: 'Daftar dengan Link',
            desc: 'Gunakan tautan rujukan mereka',
            color: 'purple'
          },
          {
            num: '3',
            icon: DollarSign,
            title: 'Deposit & Bonus',
            desc: 'Dapatkan Rp 25.000 untuk deposit pertama',
            color: 'yellow'
          },
          {
            num: '4',
            icon: TrendingUp,
            title: 'Undang & Raih',
            desc: 'Dapatkan hingga Rp 400.000 lebih',
            color: 'green'
          }
        ].map((step, i) => (
          <div key={i} className="relative">
            {i < 3 && (
              <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-700 to-gray-800"></div>
            )}
            
            <div className="relative bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700 transition-all group">
              <div className="absolute -top-4 left-6">
                <div className={`w-8 h-8 bg-${step.color}-500/20 border-2 border-${step.color}-500/50 rounded-full flex items-center justify-center`}>
                  <span className={`text-sm font-bold text-${step.color}-400`}>{step.num}</span>
                </div>
              </div>

              <div className={`w-12 h-12 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-xl flex items-center justify-center mb-4 mt-2 group-hover:scale-110 transition-transform`}>
                <step.icon className={`w-6 h-6 text-${step.color}-400`} />
              </div>

              <h4 className="font-bold mb-2">{step.title}</h4>
              <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Steps */}
      <div className="md:hidden space-y-4">
        {[
          { num: '1', icon: Users, title: 'Temukan Teman', desc: 'Yang sudah trading di STC', color: 'blue' },
          { num: '2', icon: UserPlus, title: 'Daftar dengan Link', desc: 'Gunakan tautan rujukan mereka', color: 'purple' },
          { num: '3', icon: DollarSign, title: 'Deposit & Bonus', desc: 'Dapatkan Rp 25.000 untuk deposit pertama', color: 'yellow' },
          { num: '4', icon: TrendingUp, title: 'Undang & Raih', desc: 'Dapatkan hingga Rp 400.000 lebih', color: 'green' }
        ].map((step, i) => (
          <div key={i} className="flex gap-4 relative">
            {i < 3 && <div className="absolute left-7 top-16 w-px h-8 bg-gray-800"></div>}
            
            <div className="flex-shrink-0">
              <div className={`w-14 h-14 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-full flex items-center justify-center`}>
                <span className={`text-lg font-bold text-${step.color}-400`}>{step.num}</span>
              </div>
            </div>
            
            <div className="flex-1 bg-[#0a0e17] border border-gray-800/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-lg flex items-center justify-center`}>
                  <step.icon className={`w-5 h-5 text-${step.color}-400`} />
                </div>
                <h4 className="font-bold">{step.title}</h4>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Partner CTA */}
    <div className="relative max-w-4xl mx-auto bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border border-gray-800/50 rounded-3xl overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[100px]"></div>
        
        {/* AI2 Image Layer */}
        <div className="hidden lg:block absolute left-[-21%] bottom-0 w-1/2 h-full opacity-20 pointer-events-none z-0">
          <Image
            src="/ai2.png"
            alt=""
            fill
            className="object-contain object-right-bottom scale-105"
          />
        </div>
      </div>

      <div className="relative z-10 p-8 sm:p-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
          <Award className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">Partner Program</span>
        </div>

        <h3 className="text-3xl sm:text-4xl font-bold mb-4">
          Jadilah Mitra Resmi STC
        </h3>
        
        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
          Ajak trader baru ke platform dan dapatkan <span className="text-emerald-400 font-semibold">penghasilan tambahan</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => {
              setIsLogin(false)
              setShowAuthModal(true)
            }}
            className="group px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-emerald-500/25"
          >
            <span className="flex items-center justify-center gap-2">
              Daftar Sekarang
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-gray-800/50">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400 mb-1">Free</div>
            <div className="text-xs text-gray-500">No Admin Fees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400 mb-1">∞</div>
            <div className="text-xs text-gray-500">Unlimited Earning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400 mb-1">24/7</div>
            <div className="text-xs text-gray-500">Support</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


      {/* Footer */}
      <EnhancedFooter />

      {/* Auth Modal */}
      {showAuthModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" 
            onClick={() => setShowAuthModal(false)}
          />

          <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-gradient-to-b from-[#0f1419] to-[#0a0e17] z-50 animate-slide-left shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-b from-[#0f1419] to-transparent backdrop-blur-xl border-b border-gray-800/50 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <Image
                      src="/stc-logo.png"
                      alt="STC AutoTrade"
                      fill
                      className="object-contain rounded-md"
                    />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">STC AutoTrade</h2>
                    <p className="text-xs text-gray-400">Platform Trading Profesional</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 bg-[#0a0e17] rounded-xl mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    isLogin
                      ? 'bg-[#1e293b] text-white shadow-lg border border-gray-700'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Masuk
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    !isLogin
                      ? 'bg-[#1e293b] text-white shadow-lg border border-gray-700'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Daftar
                </button>
              </div>

              {/* ✅ NEW: Referral Code Banner */}
              {hasReferralCode && !isLogin && (
                <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl animate-fade-in-up">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-emerald-400">Kode Referral Terdeteksi</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs font-mono text-emerald-300">
                          {referralCode}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        Daftar sekarang untuk mendapatkan bonus dan komisi untuk yang mereferensikan Anda!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Header Text */}
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

              {/* Form */}
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
                    className="w-full bg-[#0a0e17] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full bg-[#0a0e17] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  
                  {!isLogin && (
                    <div className="mt-6 p-3 bg-transparent rounded-lg">
                      <p className="text-xs text-blue-400 font-medium mb-1">Password harus memiliki:</p>
                      <ul className="text-xs text-gray-400 space-y-1">
                        <li className={password.length >= 8 ? 'text-green-400' : ''}>
                          • Minimal 8 karakter
                        </li>
                        <li className={/[A-Z]/.test(password) ? 'text-green-400' : ''}>
                          • Minimal 1 huruf besar (A-Z)
                        </li>
                        <li className={/[a-z]/.test(password) ? 'text-green-400' : ''}>
                          • Minimal 1 huruf kecil (a-z)
                        </li>
                        <li className={/[\d\W]/.test(password) ? 'text-green-400' : ''}>
                          • Minimal 1 angka atau karakter khusus
                        </li>
                      </ul>
                      <p className="text-xs text-gray-500 mt-2">
                        Contoh: <span className="text-green-400">SecurePass123!</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* ✅ NEW: Manual Referral Code Input (jika belum ada di URL) */}
                {!isLogin && !hasReferralCode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Kode Referral <span className="text-gray-500">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: WUTJ8JGX"
                      disabled={loading}
                      className="w-full bg-[#0a0e17] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all font-mono"
                      maxLength={8}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Masukkan kode referral dari teman Anda untuk mendapatkan bonus
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3.5 bg-[#1e293b] hover:bg-[#334155] rounded-lg text-lg font-semibold text-white transition-colors border border-gray-700 shadow-lg disabled:opacity-50 mt-6"
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
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300">Tanpa kartu kredit</span>
                  </div>
                  {hasReferralCode && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-emerald-400 font-medium">Bonus referral aktif!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Social Login */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#0f1419] text-gray-400">Atau lanjutkan dengan</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading || loadingGoogle}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0e17] border border-gray-800 rounded-lg hover:bg-[#1a1f2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingGoogle ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400"></div>
                    <span className="text-sm font-medium">Menghubungkan...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      {/* Google icon paths */}
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-sm font-medium">Google</span>
                  </>
                )}
              </button>

              {/* Terms */}
              <p className="mt-6 text-xs text-center text-gray-500 leading-relaxed">
                Dengan melanjutkan, Anda menyetujui{' '}
                <a href="https://stockity.id/information/agreement " className="text-blue-400 hover:text-blue-300">Syarat & Ketentuan</a>
                {' '}dan{' '}
                <a href="https://stockity.id/information/privacy " className="text-blue-400 hover:text-blue-300">Kebijakan Privasi</a> kami
              </p>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
      @keyframes gradient {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }

      @keyframes pulse-slow {
        0%, 100% { opacity: 0.05; }
        50% { opacity: 0.15; }
      }

      @keyframes fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes fade-in-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slide-in-right {
        from {
          opacity: 0;
          transform: translateX(50px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      @keyframes slide-left {
        from {
          transform: translateX(100%);
        }
        to {
          transform: translateX(0);
        }
      }

      @keyframes text-slide-out {
        0% {
          transform: translateX(0);
          opacity: 1;
        }
        100% {
          transform: translateX(-100%);
          opacity: 0;
        }
      }

      @keyframes text-slide-in {
        0% {
          transform: translateX(-100%);
          opacity: 0;
        }
        100% {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes logo-bounce-out {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        40% {
          transform: scale(1.15);
          opacity: 1;
        }
        100% {
          transform: scale(0);
          opacity: 0;
        }
      }

      @keyframes logo-bounce-in {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        60% {
          transform: scale(1.25);
          opacity: 1;
        }
        80% {
          transform: scale(0.95);
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      .animate-gradient {
        background-size: 200% 200%;
        animation: gradient 3s ease infinite;
      }

      .animate-float {
        animation: float 6s ease-in-out infinite;
      }

      .animate-pulse-slow {
        animation: pulse-slow 4s ease-in-out infinite;
      }

      .animate-fade-in {
        animation: fade-in 0.3s ease-out;
      }

      .animate-fade-in-up {
        animation: fade-in-up 0.6s ease-out;
      }

      .animate-slide-in-right {
        animation: slide-in-right 0.8s ease-out;
      }

      .animate-slide-left {
        animation: slide-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .animate-text-slide-out {
        animation: text-slide-out 1s ease-in-out forwards;
      }

      .animate-text-slide-in {
        animation: text-slide-in 1s ease-in-out forwards;
      }

      .animate-logo-bounce-out {
        animation: logo-bounce-out 1s ease-in-out forwards;
      }

      .animate-logo-bounce-in {
        animation: logo-bounce-in 1s ease-in-out forwards;
      }

      html {
        scroll-behavior: smooth;
      }

      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }

      ::-webkit-scrollbar {
        width: 8px;
      }

      ::-webkit-scrollbar-track {
        background: #0a0e17;
      }

      ::-webkit-scrollbar-thumb {
        background: linear-gradient(to bottom, #3b82f6, #10b981);
        border-radius: 4px;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(to bottom, #2563eb, #059669);
      }
    `}</style>
    </div>
  )
}