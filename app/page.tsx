// app/(landing)/page.tsx - ✅ OPTIMIZED: Mobile & Tablet Responsiveness
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
  ChevronRight,
  ShieldCheck,
  Menu
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
    <div className="relative bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border border-gray-800/50 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl hover:scale-[1.02] transition-transform duration-300">
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

      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3 sm:gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs sm:text-sm text-gray-400">{priceData?.symbol || `${selectedCrypto}/USD`}</div>
            <div className="text-xl sm:text-3xl font-bold">
              {priceData ? `$${formatCryptoPrice(priceData.price)}` : 'Loading...'}
            </div>
          </div>
        </div>
        {priceData && (
          <div className="text-right">
            <div className={`flex items-center gap-1 text-sm sm:text-lg font-semibold ${
              priceData.changePercent24h >= 0 ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {priceData.changePercent24h >= 0 ? (
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              {formatChangePercent(priceData.changePercent24h)}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1 justify-end">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              Live
            </div>
          </div>
        )}
      </div>

      <div className="hidden sm:block bg-[#0a0e17] rounded-2xl mb-4 sm:mb-6 overflow-hidden border border-gray-800/50">
        <div className="h-48 sm:h-64 flex items-end justify-between gap-1 p-4">
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

      <div className="grid grid-cols-2 gap-2 sm:gap-4">
        <button className="group relative bg-gradient-to-br from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-500/30 rounded-xl p-4 sm:p-6 transition-colors overflow-hidden">
          <TrendingUp className="w-5 h-5 sm:w-8 sm:h-8 text-emerald-400 mx-auto mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-sm sm:text-lg text-emerald-400">BELI</div>
          <div className="text-[10px] sm:text-xs text-gray-400">Profit +95%</div>
        </button>

        <button className="group relative bg-gradient-to-br from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 rounded-xl p-4 sm:p-6 transition-colors overflow-hidden">
          <TrendingDown className="w-5 h-5 sm:w-8 sm:h-8 text-red-400 mx-auto mb-1 sm:mb-2 group-hover:scale-110 transition-transform" />
          <div className="font-bold text-sm sm:text-lg text-red-400">JUAL</div>
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
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
  }, [features.length])

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
            ? `Dirujuk oleh: ${affiliate.referredBy}.`
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

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
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

      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1f2e]/95 backdrop-blur-xl border-b border-gray-700/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            
            {/* Logo with animation */}
            <div className="relative h-10 sm:h-12 w-44 sm:w-52 overflow-visible">
              {/* STC AutoTrade */}
              {logoPhase.startsWith('stc-') && (
                <div className="flex items-center gap-2 sm:gap-3 absolute left-0 top-0">
                  <div className={`relative w-8 sm:w-10 h-8 sm:h-10 flex-shrink-0 overflow-visible ${
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
                      <span className={`text-sm sm:text-xl font-bold text-white whitespace-nowrap ${
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
                <div className="flex items-center gap-2 sm:gap-3 absolute left-0 top-0">
                  <div className={`relative w-8 sm:w-10 h-8 sm:h-10 flex-shrink-0 overflow-visible ${
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
                      <span className={`text-sm sm:text-xl font-bold text-white whitespace-nowrap ${
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
            <div className="hidden md:flex items-center gap-4 lg:gap-8">
              <a href="#payment" className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors relative group">
                Pembayaran
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all"></span>
              </a>
              <a href="#how-it-works" className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors relative group">
                Cara Kerja
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all"></span>
              </a>
            </div>

            {/* Auth Button & Mobile Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  setIsLogin(false)
                  setShowAuthModal(true)
                }}
                className="hidden sm:flex items-center gap-2 px-4 sm:px-6 py-2 bg-[#2d3748] hover:bg-[#3d4758] rounded-lg text-xs sm:text-sm font-semibold text-white shadow-lg transition-colors border border-gray-600"
              >
                <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                Daftar
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden absolute top-16 left-0 right-0 bg-[#1a1f2e]/95 backdrop-blur-xl border-t border-gray-700/50 p-4 space-y-3 animate-fade-in-up">
              <a 
                href="#payment" 
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('payment')
                }}
                className="block py-2 px-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Pembayaran
              </a>
              <a 
                href="#how-it-works" 
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('how-it-works')
                }}
                className="block py-2 px-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                Cara Kerja
              </a>
              <button
                onClick={() => {
                  setIsLogin(false)
                  setShowAuthModal(true)
                  setMobileMenuOpen(false)
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2d3748] hover:bg-[#3d4758] rounded-lg text-sm font-semibold text-white shadow-lg transition-colors border border-gray-600 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                Daftar
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 sm:pt-32 pb-12 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1f2e] via-[#0f1419] to-[#0a0e17]"></div>
          <div className="absolute top-0 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-blue-600/10 rounded-full blur-[80px] sm:blur-[100px]"></div>
          <div className="absolute bottom-0 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-cyan-600/8 rounded-full blur-[80px] sm:blur-[100px]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-purple-600/8 rounded-full blur-[80px] sm:blur-[100px]"></div>
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(59, 130, 246, 0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59, 130, 246, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '40px 40px sm:60px 60px',
            }}
          ></div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-6 sm:space-y-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Raih Bonus
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400 animate-gradient bg-[length:200%_auto]">
                  Deposit 100%
                </span>
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed">
                Tersedia berbagai aset <span className="text-emerald-400 font-semibold">global</span>, 
                dapatkan profit hingga <span className="text-blue-400 font-semibold">100%</span>, 
                dan penarikan secepat <span className="text-cyan-400 font-semibold">kilat</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setIsLogin(true)
                    setShowAuthModal(true)
                  }}
                  className="group w-full sm:w-auto flex-1 sm:flex-none px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-sm sm:text-lg font-semibold text-white transition-colors shadow-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="hidden sm:inline">Masuk untuk Trading</span>
                    <span className="sm:hidden">Masuk</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <button className="group w-full sm:w-auto flex-1 sm:flex-none px-6 py-3 sm:py-4 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-gray-600 rounded-xl text-sm sm:text-lg font-semibold transition-colors backdrop-blur-sm">
                  <span className="flex items-center justify-center gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Lihat Demo</span>
                    <span className="sm:hidden">Demo</span>
                  </span>
                </button>
              </div>

              {/* Stats Row - Mobile Collapsed */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 sm:pt-8">
                {stats.map((stat, index) => (
                  <div 
                    key={index} 
                    className="text-center transform hover:scale-105 transition-transform cursor-default bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-gray-800/50"
                  >
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 mx-auto mb-1.5 sm:mb-2" />
                    <div className="text-lg sm:text-xl font-bold">{stat.value}</div>
                    <div className="text-[10px] sm:text-xs text-gray-500">{stat.label}</div>
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
        {/* AI Image Layer */}
        <div className="hidden lg:block absolute left-0 bottom-0 w-2/5 h-2/5 opacity-15 pointer-events-none z-0">
          <Image
            src="/ai1.png"
            alt=""
            fill
            className="object-contain object-left-bottom"
            priority
          />
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-16 lg:py-20 relative border-t border-purple-800/50 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-20 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-4 sm:mb-6">
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-medium text-purple-400">Mulai dalam 3 langkah mudah</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-6 tracking-tight">
              Cara Kerja Platform
            </h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
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
                    <div className="bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-6 sm:p-8 hover:border-purple-500/30 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold mb-2">Daftar & Verifikasi</h3>
                          <p className="text-sm sm:text-base text-gray-400 leading-relaxed mb-4">
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
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                      <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping opacity-75"></div>
                      <div className="absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-purple-500/50 flex items-center justify-center">
                        <span className="text-lg sm:text-xl font-bold text-purple-400">1</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative flex items-center flex-row-reverse">
                  <div className="w-[calc(50%-3rem)] ml-auto">
                    <div className="bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-6 sm:p-8 hover:border-pink-500/30 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-500/10 border border-pink-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold mb-2">Deposit & Pilih Strategi</h3>
                          <p className="text-sm sm:text-base text-gray-400 leading-relaxed mb-4">
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
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                      <div className="absolute inset-0 bg-pink-500/20 rounded-full animate-ping opacity-75" style={{ animationDelay: '0.5s' }}></div>
                      <div className="absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-pink-500/50 flex items-center justify-center">
                        <span className="text-lg sm:text-xl font-bold text-pink-400">2</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative flex items-center">
                  <div className="w-[calc(50%-3rem)] mr-auto">
                    <div className="bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-6 sm:p-8 hover:border-blue-500/30 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold mb-2">Trading & Hasilkan Profit</h3>
                          <p className="text-sm sm:text-base text-gray-400 leading-relaxed mb-4">
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
                    <div className="relative w-14 h-14 sm:w-16 sm:h-16">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-75" style={{ animationDelay: '1s' }}></div>
                      <div className="absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-blue-500/50 flex items-center justify-center">
                        <span className="text-lg sm:text-xl font-bold text-blue-400">3</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tablet Timeline */}
          <div className="hidden md:block lg:hidden max-w-3xl mx-auto">
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-purple-500/20 via-pink-500/20 to-blue-500/20"></div>
              <div className="space-y-8">
                {[...features].map((feature, index) => (
                  <div key={index} className="relative flex gap-6">
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-[#0a0e17] rounded-full border-2 border-purple-500/50 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg sm:text-xl font-bold text-purple-400">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1 bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-6 hover:border-purple-500/30 transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-6 h-6 text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg sm:text-xl font-bold mb-2">{feature.title}</h3>
                          <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-4">
            {[...features].map((feature, index) => (
              <div key={index} className="flex gap-4 relative">
                {index < 3 && <div className="absolute left-7 top-16 w-px h-8 bg-gray-800"></div>}
                
                <div className="flex-shrink-0">
                  <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-purple-400">{index + 1}</span>
                  </div>
                </div>
                
                <div className="flex-1 bg-[#0a0e17] border border-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-purple-400" />
                    </div>
                    <h3 className="font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

{/* Payment Methods */}
<section id="payment" className="py-12 sm:py-16 lg:py-20 relative border-t border-orange-800/30 overflow-visible">
  {/* Animated gradient background layers */}
  <div className="absolute inset-0 pointer-events-none overflow-visible">
    {/* Layer 1 - Blue/Purple gradient blob */}
    <div className="absolute top-1/3 left-1/3 w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] bg-gradient-to-r from-blue-500/25 via-purple-500/25 to-pink-500/25 rounded-full blur-[50px] sm:blur-[60px] animate-float" style={{ animationDelay: '0s' }} />
    
    {/* Layer 2 - Green/Cyan gradient blob */}
    <div className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] sm:w-[300px] sm:h-[300px] bg-gradient-to-r from-green-500/25 via-cyan-500/25 to-teal-500/25 rounded-full blur-[50px] sm:blur-[60px] animate-float" style={{ animationDelay: '2s' }} />
    
    {/* Layer 3 - Orange/Red gradient blob */}
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] sm:w-[350px] sm:h-[350px] bg-gradient-to-r from-orange-500/30 via-red-500/30 to-amber-500/30 rounded-full blur-[60px] sm:blur-[70px] animate-float" style={{ animationDelay: '4s' }} />
    
    {/* Subtle grid overlay */}
    <div className="absolute inset-0 opacity-[0.02]" style={{
      backgroundImage: `
        linear-gradient(rgba(59, 130, 246, 0.3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px sm:80px 80px',
    }} />
  </div>
  
  <div className="container mx-auto px-4 sm:px-6 relative z-10">
    {/* Header */}
    <div className="text-center mb-8 sm:mb-12">
      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-4 sm:mb-6">
        <span className="text-xs font-medium text-yellow-400">Berbagai Metode Pembayaran</span>
      </div>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 tracking-tight">
        Deposit & Penarikan Mudah
      </h2>
      <p className="text-sm sm:text-base text-gray-400 max-w-xl mx-auto">
        Berbagai pilihan metode pembayaran untuk kemudahan transaksi Anda
      </p>
    </div>

    {/* Desktop Grid */}
    <div className="hidden sm:block max-w-5xl mx-auto space-y-3 sm:space-y-4">
      <div className="grid grid-cols-6 gap-3 sm:gap-4">
        {[
          { name: 'Mandiri', logo: '/mandiri.webp' },
          { name: 'BRI', logo: '/bri.webp' },
          { name: 'BNI', logo: '/bni.webp' },
          { name: 'GoPay', logo: '/gopay.webp' },
          { name: 'OVO', logo: '/ovo.webp' },
          { name: 'DANA', logo: '/dana.webp' },
        ].map((item) => (
          <div key={item.name} className="group bg-white border border-gray-200 rounded-xl p-4 sm:p-6 transition-all hover:shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg" />
            
            <div className="relative z-10">
              <div className="relative h-10 sm:h-12 flex items-center justify-center">
                <Image 
                  src={item.logo} 
                  alt={item.name}
                  width={100}
                  height={40}
                  className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-3 sm:gap-4">
        {[
          { name: 'QRIS', logo: '/qris.png' },
          { name: 'Visa', logo: '/visa.webp' },
          { name: 'Mastercard', logo: '/mastercard.webp' },
          { name: 'Bitcoin', logo: '/bitcoin.webp' },
          { name: 'BCA', logo: '/bca.webp' },
        ].map((item) => (
          <div key={item.name} className="group bg-white border border-gray-200 rounded-xl p-4 sm:p-6 transition-all hover:shadow-md relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 via-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg" />
            
            <div className="relative z-10">
              <div className="relative h-10 sm:h-12 flex items-center justify-center">
                <Image 
                  src={item.logo} 
                  alt={item.name}
                  width={100}
                  height={40}
                  className="h-full w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Mobile Scrollable Grid */}
    <div className="sm:hidden space-y-3">
      {/* Baris 1 - 6 logo pertama */}
      <div className="relative">
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0e17] to-transparent z-10 pointer-events-none"></div>
        
        <div className="overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex gap-3 px-1">
            {[
              { name: 'DANA', logo: '/dana.webp' },
              { name: 'OVO', logo: '/ovo.webp' },
              { name: 'GoPay', logo: '/gopay.webp' },
              { name: 'BNI', logo: '/bni.webp' },
              { name: 'BRI', logo: '/bri.webp' },
              { name: 'Mandiri', logo: '/mandiri.webp' },
            ].map((item) => (
              <div key={item.name} className="flex-shrink-0 w-24 sm:w-28 bg-white border border-gray-200 rounded-xl p-3">
                <div className="relative h-10 sm:h-12 flex items-center justify-center">
                  <Image 
                    src={item.logo} 
                    alt={item.name}
                    width={80}
                    height={40}
                    className="h-full w-auto object-contain"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Baris 2 - 5 logo terakhir */}
      <div className="relative">
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0a0e17] to-transparent z-10 pointer-events-none"></div>
        
        <div className="overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex gap-3 px-1">
            {[
              { name: 'QRIS', logo: '/qris.png' },
              { name: 'Visa', logo: '/visa.webp' },
              { name: 'Mastercard', logo: '/mastercard.webp' },
              { name: 'Bitcoin', logo: '/bitcoin.webp' },
              { name: 'BCA', logo: '/bca.webp' },
            ].map((item) => (
              <div key={item.name} className="flex-shrink-0 w-24 sm:w-28 bg-white border border-gray-200 rounded-xl p-3">
                <div className="relative h-10 sm:h-12 flex items-center justify-center">
                  <Image 
                    src={item.logo} 
                    alt={item.name}
                    width={80}
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

    {/* Security Badge */}
    <div className="mt-8 sm:mt-12 text-center relative z-10">
      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
        <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-400" />              
        <span className="text-[10px] sm:text-xs text-white font-medium">
          Semua transaksi telah dilindungi enkripsi SSL 256-bit
        </span>
      </div>
    </div>
  </div>
</section>


      {/* Stockity x LindungiHutan Partnership */}
      <section className="py-12 sm:py-16 lg:py-20 bg-[#242837] border-t border-blue-800/30 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-green-500/10 rounded-full blur-[80px] sm:blur-[100px] animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-blue-500/10 rounded-full blur-[80px] sm:blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
              {/* Left - Image */}
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-2xl lg:rounded-3xl overflow-hidden">
                  <Image
                    src="/pohon.webp"
                    alt="Stockity x LindungiHutan"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>

              {/* Right - Content */}
              <div className="space-y-4 sm:space-y-6">
                {/* Logos */}
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="relative w-28 sm:w-32 h-10 sm:h-12 bg-white rounded-lg overflow-hidden">
                    <Image
                      src="/lindungihutan.png"
                      alt="LindungiHutan"
                      fill
                      className="object-contain object-center p-2"
                    />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                  Bersama kita mengubah dunia!
                </h2>

                {/* Description */}
                <div className="space-y-3 sm:space-y-4">
                  <p className="text-sm sm:text-base lg:text-lg text-gray-500 leading-relaxed">
                    Tahun ini, Stockity telah menanam 9.000 pohon dan 4 terumbu karang bekerja sama dengan LindungiHutan
                  </p>
                </div>

                {/* CTA Button */}
                <button className="group inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl text-sm sm:text-lg font-semibold text-white transition-all shadow-lg hover:shadow-blue-500/25">
                  <span>Selengkapnya</span>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Impact Stats - Mobile */}
                <div className="lg:hidden grid grid-cols-2 gap-3 sm:gap-4 pt-6">
                  <div className="bg-[#0a0e17] border border-gray-800/50 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-lg sm:text-xl font-bold text-green-400">9,000</div>
                        <div className="text-[10px] sm:text-xs text-gray-400">Pohon</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#0a0e17] border border-gray-800/50 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                        </svg>
                      </div>
                      <div>
                        <div className="text-lg sm:text-xl font-bold text-blue-400">4</div>
                        <div className="text-[10px] sm:text-xs text-gray-400">Terumbu</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* New Container - Simple Layout */}
            <div className="max-w-7xl mx-auto mt-16 sm:mt-24 lg:mt-32">
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-center">
                {/* Left - 75% */}
                <div className="flex-1 lg:w-[75%] space-y-3 sm:space-y-4">
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                    Platform yang diandalkan oleh para profesional!
                  </h3>

                  <p className="text-sm sm:text-base lg:text-lg text-gray-500 leading-relaxed pr-0 lg:pr-12">
                    Penghargaan Platform Perdagangan Paling Andal di Indonesia 2024 berkomitmen terhadap keamanan, efisiensi, dan inovasi.
                  </p>
                </div>

                {/* Right - 25% */}
                <div className="lg:w-[25%] w-full max-w-xs lg:max-w-none">
                  <div className="relative aspect-square rounded-2xl overflow-hidden">
                    <Image
                      src="/sa.webp"
                      alt="Stockity Platform"
                      fill
                      className="object-contain p-4 sm:p-6"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto mt-16 sm:mt-20 lg:mt-24">
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-center">
                {/* Left - 30% */}
                <div className="lg:order-1 lg:w-[30%] w-full max-w-xs lg:max-w-none order-2">
                  <div className="relative aspect-square rounded-2xl overflow-hidden">
                    <Image
                      src="/il4.png"
                      alt="Stockity Platform"
                      fill
                      className="object-contain p-4 sm:p-6"
                    />
                  </div>
                </div>
                {/* Right - 70% */}
                <div className="flex-1 lg:w-[70%] space-y-3 sm:space-y-4 order-1 lg:order-2">
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                    Akses trading realtime 24 jam tanpa tutup!
                  </h3>

                  <p className="text-sm sm:text-base lg:text-lg text-gray-500 leading-relaxed pr-0 lg:pr-12">
                    Buat setiap antrean, kemacetan lalul lintas, dan minum-minum kopi menjadi produktif untuk Anda!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Affiliate Program */}
<section className="py-12 sm:py-16 lg:py-20 relative border-t border-green-800/30">
  <div className="container mx-auto px-4 sm:px-6">
    {/* Header */}
    <div className="text-center mb-10 sm:mb-16 animate-fade-in-up">
      <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4 sm:mb-6">
        <span className="text-xs sm:text-sm font-medium text-emerald-400">Program Affiliate</span>
      </div>
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-6 px-4 tracking-tight">
        Undang Teman,<br className="hidden sm:block" />Dapatkan Hingga <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-400">Rp 400.000</span>
      </h2>
      <p className="text-sm sm:text-base lg:text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
        Setelah mendaftar, Anda dapat mengundang teman dan menerima<br className="hidden sm:block"/><span className="text-emerald-400 font-semibold">Rp 25.000 hingga Rp 400.000</span> ke akun riil Anda untuk setiap orang.
      </p>
    </div>

    {/* Reward Cards */}
    <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto mb-10 sm:mb-16">
      {/* VIP Card */}
      <div className="group relative bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-3 sm:mb-4">
            <Award className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-emerald-400">Pengguna VIP</span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
            <span className="text-3xl sm:text-4xl font-bold text-emerald-400">Rp 400.000</span>
            <span className="text-gray-500 text-sm">/trader</span>
          </div>
          
          <p className="text-gray-400 text-sm leading-relaxed">
            Untuk setiap trader baru yang Anda undang sebagai member VIP atau Platinum
          </p>
        </div>
      </div>

      {/* Standard & Gold Card */}
      <div className="group relative bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border border-blue-500/30 rounded-2xl sm:rounded-3xl p-6 sm:p-8 hover:border-blue-500/50 transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-full mb-3 sm:mb-4">
            <Star className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400">Pengguna Standard & Gold</span>
          </div>
          
          <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
            <span className="text-3xl sm:text-4xl font-bold text-blue-400">Rp 100.000</span>
            <span className="text-gray-500 text-sm">/trader</span>
          </div>
          
          <p className="text-gray-400 text-sm leading-relaxed">
            Untuk setiap trader baru yang Anda undang sebagai member Standard atau Gold
          </p>

        </div>
      </div>
    </div>

    {/* How It Works */}
    <div className="max-w-4xl mx-auto mb-10 sm:mb-16">
      <h3 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12">
        Maksimalkan Keuntungan Anda dengan Program Affiliate
      </h3>

      {/* Desktop Timeline */}
      <div className="hidden md:grid md:grid-cols-4 gap-4 sm:gap-6">
        {[
          {
            num: '1',
            icon: Users,
            title: 'Temukan Teman',
            desc: 'Yang sudah trading di STC',
            color: 'green'
          },
          {
            num: '2',
            icon: UserPlus,
            title: 'Daftar dengan Link',
            desc: 'Gunakan tautan rujukan mereka',
            color: 'green'
          },
          {
            num: '3',
            icon: DollarSign,
            title: 'Deposit & Bonus',
            desc: 'Dapatkan Rp 25.000 untuk deposit pertama',
            color: 'green'
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
            
            <div className="relative bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-4 sm:p-6 hover:border-gray-700 transition-all group">
              <div className="absolute -top-3 sm:-top-4 left-6">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 bg-${step.color}-500/20 border-2 border-${step.color}-500/50 rounded-full flex items-center justify-center`}>
                  <span className={`text-sm font-bold text-${step.color}-400`}>{step.num}</span>
                </div>
              </div>

              <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-xl flex items-center justify-center mb-3 sm:mb-4 mt-2 group-hover:scale-110 transition-transform`}>
                <step.icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${step.color}-400`} />
              </div>

              <h4 className="font-bold mb-1 sm:mb-2 text-sm sm:text-base">{step.title}</h4>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Steps */}
      <div className="md:hidden space-y-3">
        {[
          { num: '1', icon: Users, title: 'Temukan Teman', desc: 'Yang sudah trading di STC', color: 'blue' },
          { num: '2', icon: UserPlus, title: 'Daftar dengan Link', desc: 'Gunakan tautan rujukan mereka', color: 'purple' },
          { num: '3', icon: DollarSign, title: 'Deposit & Bonus', desc: 'Dapatkan Rp 25.000 untuk deposit pertama', color: 'yellow' },
          { num: '4', icon: TrendingUp, title: 'Undang & Raih', desc: 'Dapatkan hingga Rp 400.000 lebih', color: 'green' }
        ].map((step, i) => (
          <div key={i} className="flex gap-4 relative">
            {i < 3 && <div className="absolute left-7 top-16 w-px h-8 bg-gray-800"></div>}
            
            <div className="flex-shrink-0">
              <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/30 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-purple-400">{step.num}</span>
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
    <div className="relative max-w-4xl mx-auto bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border border-gray-800/50 rounded-2xl sm:rounded-3xl overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-green-500/5"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-emerald-500/10 rounded-full blur-[80px] sm:blur-[100px]"></div>
      </div>

      <div className="relative z-10 p-6 sm:p-8 lg:p-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4 sm:mb-6">
          <Award className="w-4 h-4 text-emerald-400" />
          <span className="text-xs sm:text-sm font-medium text-emerald-400">Partner Program</span>
        </div>

        <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
          Jadilah Mitra Resmi STC
        </h3>
        
        <p className="text-sm sm:text-base lg:text-lg text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto">
          Ajak trader baru ke platform dan dapatkan <span className="text-emerald-400 font-semibold">penghasilan tambahan</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <button
            onClick={() => {
              setIsLogin(false)
              setShowAuthModal(true)
            }}
            className="group px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-emerald-500/25"
          >
            <span className="flex items-center justify-center gap-2">
              Daftar Sekarang
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12 pt-6 border-t border-gray-800/50">
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mb-1">Free</div>
            <div className="text-[10px] sm:text-xs text-gray-500">No Admin Fees</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mb-1">∞</div>
            <div className="text-[10px] sm:text-xs text-gray-500">Unlimited Earning</div>
          </div>
          <div className="text-center">
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 mb-1">24/7</div>
            <div className="text-[10px] sm:text-xs text-gray-500">Support</div>
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
            <div className="sticky top-0 z-10 bg-gradient-to-b from-[#0f1419] to-transparent backdrop-blur-xl border-b border-gray-800/50 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 sm:w-10 h-8 sm:h-10">
                    <Image
                      src="/stc-logo.png"
                      alt="STC AutoTrade"
                      fill
                      className="object-contain rounded-md"
                    />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-xl font-bold">STC AutoTrade</h2>
                    <p className="text-[10px] sm:text-xs text-gray-400">Platform Trading Profesional</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {/* Mode Toggle */}
              <div className="flex gap-2 p-1 bg-[#0a0e17] rounded-xl mb-4 sm:mb-6">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm ${
                    isLogin
                      ? 'bg-[#1e293b] text-white shadow-lg border border-gray-700'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Masuk
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm ${
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
                <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/30 rounded-xl animate-fade-in-up">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs sm:text-sm font-semibold text-emerald-400">Kode Referral</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 rounded text-xs font-mono text-emerald-300">
                          {referralCode}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-400">
                        Daftar sekarang untuk mendapatkan bonus dan komisi Anda!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Header Text */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-2xl font-bold mb-2">
                  {isLogin ? 'Selamat Datang Kembali!' : 'Buat Akun'}
                </h3>
                <p className="text-xs sm:text-base text-gray-400">
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
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="anda@example.com"
                    required
                    disabled={loading}
                    className="w-full bg-[#0a0e17] border border-gray-800 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full bg-[#0a0e17] border border-gray-800 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                  />
                  
                  {!isLogin && (
                    <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-transparent rounded-lg">
                      <p className="text-[11px] sm:text-xs text-blue-400 font-medium mb-1">Password harus memiliki:</p>
                      <ul className="text-[11px] sm:text-xs text-gray-400 space-y-1">
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
                      <p className="text-[11px] sm:text-xs text-gray-500 mt-2">
                        Contoh: <span className="text-green-400">SecurePass123!</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* ✅ NEW: Manual Referral Code Input (jika belum ada di URL) */}
                {!isLogin && !hasReferralCode && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-2">
                      Kode Referral <span className="text-gray-500">(Opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: WUTJ8JGX"
                      disabled={loading}
                      className="w-full bg-[#0a0e17] border border-gray-800 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm font-mono"
                      maxLength={8}
                    />
                    <p className="mt-1 text-[10px] sm:text-xs text-gray-500">
                      Masukkan kode referral dari teman Anda untuk mendapatkan bonus
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 sm:py-3.5 bg-[#1e293b] hover:bg-[#334155] rounded-lg text-base sm:text-lg font-semibold text-white transition-colors border border-gray-700 shadow-lg disabled:opacity-50 mt-4 sm:mt-6"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                      Memproses...
                    </span>
                  ) : (
                    <span>{isLogin ? 'Masuk' : 'Buat Akun'}</span>
                  )}
                </button>
              </form>

              {!isLogin && (
                <div className="mt-4 sm:mt-6 space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-3 text-xs sm:text-sm">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300">Akun demo gratis Rp 10.000.000</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs sm:text-sm">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300">Tanpa kartu kredit</span>
                  </div>
                  {hasReferralCode && (
                    <div className="flex items-center gap-3 text-xs sm:text-sm">
                      <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-emerald-400 font-medium">Bonus referral aktif!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Social Login */}
              <div className="relative my-4 sm:my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 sm:px-4 bg-[#0f1419] text-gray-500 text-xs sm:text-sm">Atau lanjutkan dengan</span>
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading || loadingGoogle}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-[#0a0e17] border border-gray-800 rounded-lg hover:bg-[#1a1f2e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loadingGoogle ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-gray-400"></div>
                    <span className="text-xs sm:text-sm font-medium">Menghubungkan...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-xs sm:text-sm font-medium">Google</span>
                  </>
                )}
              </button>

              {/* Terms */}
              <p className="mt-4 sm:mt-6 text-[10px] sm:text-xs text-center text-gray-500 leading-relaxed">
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
        width: 6px;
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

          @keyframes float {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -30px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
    }
    
    .animate-float {
      animation: float 12s ease-in-out infinite;
    }
  
    `}</style>
    </div>
  )
}