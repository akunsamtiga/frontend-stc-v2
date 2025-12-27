'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import EnhancedFooter from '@/components/EnhancedFooter'
import Image from 'next/image'
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
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

// Live Trading Ticker Component with more data
const LiveTradingTicker = () => {
  const [trades, setTrades] = useState([
    { user: 'Ahmad***', asset: 'EUR/USD', profit: 8500, time: '2 detik lalu' },
    { user: 'Siti***', asset: 'BTC/USD', profit: 12300, time: '5 detik lalu' },
    { user: 'Budi***', asset: 'IDX_STC', profit: 5800, time: '8 detik lalu' },
  ])

  useEffect(() => {
    const names = [
      'Ahmad***', 'Siti***', 'Budi***', 'Rina***', 'Deni***', 'Maya***',
      'Andi***', 'Fitri***', 'Joko***', 'Dewi***', 'Agus***', 'Lina***',
      'Rudi***', 'Nur***', 'Hadi***', 'Sari***', 'Yudi***', 'Tini***'
    ]
    const assets = [
      'EUR/USD', 'BTC/USD', 'IDX_STC', 'GBP/JPY', 'XAU/USD',
      'USD/JPY', 'ETH/USD', 'AUD/USD', 'NZD/USD', 'USD/CHF',
      'EUR/GBP', 'BTC/ETH', 'LTC/USD', 'XRP/USD', 'DOT/USD'
    ]
    
    const interval = setInterval(() => {
      const newTrade = {
        user: names[Math.floor(Math.random() * names.length)],
        asset: assets[Math.floor(Math.random() * assets.length)],
        profit: Math.floor(Math.random() * 20000) + 2500,
        time: 'baru saja'
      }

      setTrades(prev => [newTrade, ...prev.slice(0, 2)])
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="hidden lg:block absolute top-24 right-8 w-72 bg-[#0a0e17]/95 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 shadow-2xl z-10 animate-slide-in-right">
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

// Animated Trading Chart Preview
const AnimatedTradingChart = () => {
  const [bars, setBars] = useState<number[]>([])

  useEffect(() => {
    const initialBars = Array.from({ length: 30 }, () => Math.random() * 80 + 20)
    setBars(initialBars)

    const interval = setInterval(() => {
      setBars(prev => {
        const newBars = [...prev.slice(1), Math.random() * 80 + 20]
        return newBars
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-64 flex items-end justify-between gap-1 p-4">
      {bars.map((height, i) => (
        <div
          key={i}
          className="flex-1 bg-gradient-to-t from-emerald-500/50 to-blue-500/50 rounded-t transition-all duration-1000 ease-out"
          style={{ 
            height: `${height}%`,
            opacity: i < 5 ? 0.3 : 1
          }}
        />
      ))}
    </div>
  )
}

// Floating Price Cards
const FloatingPriceCard = ({ symbol, price, change, delay, style }: any) => (
  <div 
    className="hidden lg:block absolute bg-[#0a0e17]/95 backdrop-blur-xl border border-gray-800/50 rounded-xl p-3 shadow-2xl animate-float"
    style={{ animationDelay: `${delay}s`, ...style }}
  >
    <div className="text-xs text-gray-400 mb-1">{symbol}</div>
    <div className="text-lg font-bold font-mono mb-1">{price}</div>
    <div className={`text-xs font-semibold flex items-center gap-1 ${
      change > 0 ? 'text-green-400' : 'text-red-400'
    }`}>
      {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {change > 0 ? '+' : ''}{change}%
    </div>
  </div>
)

export default function LandingPage() {
  const router = useRouter()
  const { user, setAuth } = useAuthStore()
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

  useEffect(() => {
    if (user) {
      router.push('/trading')
    }
  }, [user, router])

  // Auto carousel for testimonials
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

  // Mouse parallax effect
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

  // Touch handlers for swipe
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
        : await api.register(email, password)

      const userData = response.user || response.data?.user
      const token = response.token || response.data?.token

      if (!userData || !token) {
        toast.error('Respon tidak valid dari server')
        return
      }

      setAuth(userData, token)
      api.setToken(token)

      toast.success(response.message || 'Login berhasil!')
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

  const stats = [
    { label: 'Trader Aktif', value: '50K+', icon: Users },
    { label: 'Volume Harian', value: '$2.5M', icon: DollarSign },
    { label: 'Win Rate', value: '87%', icon: Target },
    { label: 'Negara', value: '150+', icon: Globe },
  ]

  const features = [
    {
      icon: Zap,
      title: 'Eksekusi Kilat',
      description: 'Eksekusi order dalam milidetik tanpa lag',
      gradient: 'from-yellow-500/20 to-orange-500/20',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30'
    },
    {
      icon: Shield,
      title: 'Keamanan Maksimal',
      description: 'Enkripsi tingkat militer melindungi dana Anda',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      icon: BarChart3,
      title: 'Analisis Real-Time',
      description: 'Chart canggih dan wawasan pasar terkini',
      gradient: 'from-purple-500/20 to-pink-500/20',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    },
    {
      icon: Award,
      title: 'Profit Hingga 95%',
      description: 'Keuntungan terbaik di industri trading',
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

  if (user) return null

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
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e17]/80 backdrop-blur-xl border-b border-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/stc-logo.png"
                  alt="STC AutoTrade"
                  fill
                  className="object-contain transform group-hover:scale-110 transition-transform rounded-md"
                  priority
                />
              </div>
              <div>
                <span className="text-xl font-bold text-white">
                  STC AutoTrade
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                Fitur
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all"></span>
              </a>
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                Cara Kerja
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all"></span>
              </a>
              <a href="#testimonials" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                Testimoni
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all"></span>
              </a>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsLogin(true)
                  setShowAuthModal(true)
                }}
                className="px-6 py-2.5 bg-[#1e293b] hover:bg-[#334155] rounded-lg text-sm font-semibold text-white shadow-lg transition-colors border border-gray-700"
              >
                Masuk
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-emerald-500/20 border border-blue-500/30 rounded-full backdrop-blur-sm animate-slide-in-left">
                <Sparkles className="w-4 h-4 text-blue-400 animate-spin-slow" />
                <span className="text-sm font-medium">Dipercaya 50.000+ trader</span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight">
                Trading Binary Option dengan
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400 animate-gradient">
                  Kecepatan Kilat
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-400 leading-relaxed">
                Eksekusi order dalam <span className="text-emerald-400 font-semibold">milidetik</span>, 
                dapatkan profit hingga <span className="text-blue-400 font-semibold">95%</span>, 
                dan trading dengan <span className="text-cyan-400 font-semibold">percaya diri 24/7</span>.
              </p>

              <div className="flex flex-row gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    setIsLogin(true)
                    setShowAuthModal(true)
                  }}
                  className="group flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 bg-[#1e293b] hover:bg-[#334155] rounded-xl text-sm sm:text-lg font-semibold text-white transition-colors border border-gray-700 shadow-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="hidden sm:inline">Masuk untuk Trading</span>
                    <span className="sm:hidden">Masuk</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <button className="group flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-gray-600 rounded-xl text-sm sm:text-lg font-semibold transition-all backdrop-blur-sm">
                  <span className="flex items-center justify-center gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Lihat Demo</span>
                    <span className="sm:hidden">Demo</span>
                  </span>
                </button>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <div 
                    key={index} 
                    className="text-center transform hover:scale-110 transition-transform cursor-default"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <stat.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-xl font-bold">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Trading Platform Preview */}
            <div className="relative animate-fade-in-right">
              <LiveTradingTicker />

              <FloatingPriceCard 
                symbol="EUR/USD" 
                price="1.0856" 
                change={2.3} 
                delay={0}
                style={{ top: '10%', left: '-10%' }}
              />
              <FloatingPriceCard 
                symbol="BTC/USD" 
                price="68,342" 
                change={-1.2} 
                delay={0.5}
                style={{ top: '60%', left: '-5%' }}
              />
              <FloatingPriceCard 
                symbol="IDX_STC" 
                price="7,289" 
                change={0.8} 
                delay={1}
                style={{ bottom: '10%', right: '-10%' }}
              />

              {/* Main Trading Interface */}
              <div className="relative bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border border-gray-800/50 rounded-3xl p-6 shadow-2xl backdrop-blur-xl transform hover:scale-105 transition-transform duration-500">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">EUR/USD</div>
                      <div className="text-3xl font-bold font-mono">1.0856</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-emerald-400 text-lg font-semibold">
                      <TrendingUp className="w-5 h-5" />
                      +2.3%
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                      Live
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a0e17] rounded-2xl mb-6 overflow-hidden border border-gray-800/50">
                  <AnimatedTradingChart />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="group relative bg-gradient-to-br from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-500/30 rounded-xl p-6 transition-all overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2 relative z-10 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-lg text-emerald-400 relative z-10">BELI</div>
                    <div className="text-xs text-gray-400 relative z-10">Profit +95%</div>
                  </button>

                  <button className="group relative bg-gradient-to-br from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 rounded-xl p-6 transition-all overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2 relative z-10 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-lg text-red-400 relative z-10">JUAL</div>
                    <div className="text-xs text-gray-400 relative z-10">Profit +95%</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Modern Minimalist */}
<section id="features" className="py-20 sm:py-32 relative">
  <div className="container mx-auto px-4 sm:px-6">
    {/* Header */}
    <div className="text-center mb-16 animate-fade-in-up">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
        <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-blue-400">Teknologi Terdepan</span>
      </div>
      <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
        Mengapa Memilih Kami
      </h2>
      <p className="text-lg text-gray-400 max-w-2xl mx-auto">
        Platform trading dengan teknologi dan keamanan terbaik
      </p>
    </div>

    {/* Desktop Grid - Clean Cards */}
    <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map((feature, index) => (
        <div 
          key={index}
          className="group relative bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300 overflow-hidden"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Subtle hover gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
          
          <div className="relative z-10">
            {/* Icon */}
            <div className={`inline-flex w-14 h-14 ${feature.bgColor} ${feature.borderColor} border-2 rounded-2xl items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <feature.icon className={`w-7 h-7 ${feature.color}`} />
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>

            {/* Bottom accent */}
            <div className={`h-1 w-12 ${feature.bgColor} rounded-full mt-6 group-hover:w-20 transition-all duration-300`}></div>
          </div>
        </div>
      ))}
    </div>

    {/* Mobile - Modern Stack with Clean Indicators */}
    {/* Mobile - Compact Stack */}
    <div className="sm:hidden relative">
      <div 
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative min-h-[220px]">
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
                  <div className="relative h-full bg-[#0a0e17] border border-gray-800/50 rounded-xl p-5 overflow-hidden">
                    {/* Subtle bg gradient */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5`}></div>
                    
                    <div className="relative h-full flex flex-col">
                      {/* Header: Icon + Number */}
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 ${feature.bgColor} ${feature.borderColor} border rounded-xl flex items-center justify-center`}>
                          <feature.icon className={`w-6 h-6 ${feature.color}`} />
                        </div>
                        <div className={`w-7 h-7 ${feature.bgColor} rounded-lg flex items-center justify-center border ${feature.borderColor}`}>
                          <span className={`text-xs font-bold ${feature.color}`}>{index + 1}</span>
                        </div>
                      </div>

                      {/* Content - Compact */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold tracking-tight mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                      </div>

                      {/* Bottom accent - thinner */}
                      <div className={`h-0.5 w-16 ${feature.bgColor} rounded-full mt-4`}></div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Clean Progress Dots */}
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

      {/* Swipe hint */}
      <div className="mt-3 text-center text-xs text-gray-500">
        Swipe untuk melihat lebih banyak
      </div>
    </div>
  </div>
</section>


{/* How It Works - Modern Clean Timeline */}
<section id="how-it-works" className="py-20 sm:py-32 relative overflow-hidden">
  <div className="container mx-auto px-4 sm:px-6">
    {/* Header */}
    <div className="text-center mb-20 animate-fade-in-up">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
        <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-purple-400">Mulai dalam 3 langkah mudah</span>
      </div>
      <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
        Cara Kerja Platform
      </h2>
      <p className="text-lg text-gray-400 max-w-2xl mx-auto">
        Trading menjadi mudah dengan sistem otomatis kami
      </p>
    </div>

    {/* Desktop - Modern Timeline */}
    <div className="hidden lg:block max-w-5xl mx-auto">
      <div className="relative">
        {/* Clean vertical line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-purple-500/20 via-pink-500/20 to-blue-500/20"></div>

        <div className="space-y-24">
          {/* Step 1 - Left */}
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
                      <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs text-purple-400">Demo $10K</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Number circle - minimalist */}
            <div className="absolute left-1/2 -translate-x-1/2 z-10">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping opacity-75"></div>
                <div className="absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-purple-500/50 flex items-center justify-center">
                  <span className="text-xl font-bold text-purple-400">1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2 - Right */}
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
                      Deposit mulai dari Rp 100.000. Pilih strategi trading otomatis sesuai profil risiko Anda.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-xs text-pink-400">Minimal rendah</span>
                      <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 rounded-full text-xs text-pink-400">Auto trading</span>
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

          {/* Step 3 - Left */}
          <div className="relative flex items-center">
            <div className="w-[calc(50%-3rem)] mr-auto">
              <div className="bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-8 hover:border-blue-500/30 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Trading & Profit</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">
                      Sistem kami trading otomatis 24/7. Pantau profit real-time dan tarik keuntungan kapan saja.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400">Trading 24/7</span>
                      <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-400">Profit 95%</span>
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

    {/* Mobile - Clean Vertical */}
    <div className="lg:hidden space-y-6">
      {[
        { icon: Users, title: 'Daftar & Verifikasi', desc: 'Buat akun dalam 2 menit dengan verifikasi aman', color: 'purple', num: 1 },
        { icon: DollarSign, title: 'Deposit & Pilih Strategi', desc: 'Deposit minimal Rp 100K dan pilih strategi auto trading', color: 'pink', num: 2 },
        { icon: TrendingUp, title: 'Trading & Profit', desc: 'Sistem trading otomatis 24/7 dengan profit hingga 95%', color: 'blue', num: 3 }
      ].map((step, i) => (
        <div key={i} className="flex gap-4 relative">
          {i < 2 && <div className="absolute left-7 top-16 w-px h-6 bg-gray-800"></div>}
          
          <div className="flex-shrink-0">
            <div className={`relative w-14 h-14 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-full flex items-center justify-center`}>
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

{/* Testimonials - Modern Clean Design */}
<section id="testimonials" className="py-20 sm:py-32 relative">
  <div className="container mx-auto px-4 sm:px-6">
    {/* Header */}
    <div className="text-center mb-16">
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6">
        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-emerald-400">Testimoni Trader</span>
      </div>
      <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
        Dipercaya Ribuan Trader
      </h2>
      <p className="text-lg text-gray-400 max-w-2xl mx-auto">
        Lihat apa kata trader sukses tentang kami
      </p>
    </div>

    {/* Desktop - Single Card */}
    <div className="hidden sm:block max-w-3xl mx-auto">
      <div className="relative bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-12">
        <div className="text-center">
          {/* Avatar */}
          <div className="text-6xl mb-6">{testimonials[activeTestimonial].avatar}</div>
          
          {/* Stars */}
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>

          {/* Quote */}
          <p className="text-xl text-gray-200 mb-8 leading-relaxed">
            "{testimonials[activeTestimonial].content}"
          </p>

          {/* Stats inline */}
          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Keuntungan</div>
              <div className="text-lg font-bold text-emerald-400">
                {testimonials[activeTestimonial].profit}
              </div>
            </div>
            <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="text-sm text-gray-400 mb-1">Durasi</div>
              <div className="text-lg font-bold text-blue-400">
                {testimonials[activeTestimonial].duration}
              </div>
            </div>
          </div>

          {/* User info */}
          <div className="pt-6 border-t border-gray-800/50">
            <div className="font-bold text-lg mb-1">
              {testimonials[activeTestimonial].name}
            </div>
            <div className="text-gray-400 text-sm">
              {testimonials[activeTestimonial].role}
            </div>
          </div>
        </div>

        {/* Progress dots - minimal */}
        <div className="flex justify-center gap-2 mt-8">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveTestimonial(index)}
              className="transition-all duration-300"
            >
              <div className={`rounded-full transition-all ${
                index === activeTestimonial 
                  ? 'bg-gradient-to-r from-blue-500 to-emerald-500 w-8 h-2' 
                  : 'bg-gray-700 hover:bg-gray-600 w-2 h-2'
              }`}></div>
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Mobile - Clean Card */}
    <div className="sm:hidden">
      <div className="relative">
        {testimonials.map((testimonial, index) => (
          <div 
            key={index}
            className={`transition-all duration-500 ${
              index === activeTestimonial 
                ? 'opacity-100 scale-100 relative z-10' 
                : 'opacity-0 scale-95 absolute inset-0 pointer-events-none'
            }`}
          >
            <div className="mx-4 bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-5xl">{testimonial.avatar}</div>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              {/* Quote */}
              <p className="text-base text-gray-200 leading-relaxed mb-6 italic">
                "{testimonial.content}"
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-gray-800/50">
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">Keuntungan</div>
                  <div className="text-lg font-bold text-emerald-400">{testimonial.profit}</div>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-center">
                  <div className="text-xs text-gray-400 mb-1">Durasi</div>
                  <div className="text-lg font-bold text-blue-400">{testimonial.duration}</div>
                </div>
              </div>

              {/* User info */}
              <div>
                <h4 className="font-bold text-lg mb-1">{testimonial.name}</h4>
                <p className="text-sm text-gray-400">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Controls */}
      <div className="flex items-center justify-between mt-6 px-4">
        <button
          onClick={() => setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
          className="w-10 h-10 bg-[#1e293b] hover:bg-[#334155] rounded-lg flex items-center justify-center transition-all border border-gray-700"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex gap-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveTestimonial(index)}
              className="transition-all duration-300"
            >
              {index === activeTestimonial ? (
                <div className="w-8 h-2 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"></div>
              ) : (
                <div className="w-2 h-2 bg-gray-700 hover:bg-gray-600 rounded-full"></div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={() => setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
          className="w-10 h-10 bg-[#1e293b] hover:bg-[#334155] rounded-lg flex items-center justify-center transition-all border border-gray-700"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Counter */}
      <div className="mt-4 text-center">
        <span className="text-xs text-gray-500">
          {activeTestimonial + 1} / {testimonials.length}
        </span>
      </div>
    </div>
  </div>
</section>

      {/* CTA Section */}
{/* CTA Section - Modern Futuristic */}
      <section className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="relative bg-[#0a0e17] border border-gray-800/50 rounded-3xl overflow-hidden">
            {/* Futuristic Grid Background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}></div>
              
              {/* Subtle Gradient Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Desktop Content */}
            <div className="hidden sm:block relative z-10 px-16 py-20 text-center">
              {/* Top Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-400">Platform Trading Terpercaya</span>
              </div>

              {/* Heading */}
              <h2 className="text-5xl font-bold mb-6 tracking-tight">
                Mulai Trading Hari Ini
              </h2>
              
              {/* Subtitle */}
              <p className="text-lg text-gray-400 mb-10 max-w-xl mx-auto">
                Bergabung dengan 50.000+ trader profesional di seluruh dunia
              </p>

              {/* CTA Button */}
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

              {/* Trust Indicators - Minimal */}
              <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-gray-800/50">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">50K+</div>
                  <div className="text-xs text-gray-500">Trader Aktif</div>
                </div>
                <div className="w-px h-10 bg-gray-800"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">$2.5M</div>
                  <div className="text-xs text-gray-500">Volume Harian</div>
                </div>
                <div className="w-px h-10 bg-gray-800"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">95%</div>
                  <div className="text-xs text-gray-500">Max Profit</div>
                </div>
              </div>
            </div>

            {/* Mobile Content */}
            <div className="sm:hidden relative z-10 p-8 text-center">
              {/* Top Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-blue-400">Platform Terpercaya</span>
              </div>

              {/* Heading */}
              <h2 className="text-3xl font-bold mb-4 tracking-tight">
                Mulai Trading<br />Hari Ini
              </h2>
              
              {/* Subtitle */}
              <p className="text-sm text-gray-400 mb-8">
                Bergabung dengan 50.000+ trader profesional
              </p>

              {/* CTA Button */}
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

              {/* Trust Indicators - Compact */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-800/50">
                <div className="text-center">
                  <div className="text-xl font-bold mb-0.5">50K+</div>
                  <div className="text-[10px] text-gray-500">Trader</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold mb-0.5">$2.5M</div>
                  <div className="text-[10px] text-gray-500">Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold mb-0.5">95%</div>
                  <div className="text-[10px] text-gray-500">Profit</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

{/* Payment Methods Section */}
      <section className="py-16 sm:py-20 relative border-t border-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500/10 border border-gray-500/20 rounded-full mb-6">
              <Shield className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs font-medium text-gray-400">Metode Pembayaran Aman</span>
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
            {/* Baris 1 - 6 items */}
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

            {/* Baris 2 - 5 items */}
            <div className="grid grid-cols-5 gap-4">
              {[
                { name: 'LinkAja', logo: '/linkaja.webp' },
                { name: 'Visa', logo: '/visa.webp' },
                { name: 'Mastercard', logo: '/mastercard.webp' },
                { name: 'Bitcoin', logo: '/bitcoin.webp' },
                { name: 'Ethereum', logo: '/ethereum.webp' },
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

          {/* Mobile Marquee */}
          <div className="sm:hidden overflow-hidden relative">
            {/* Gradient overlays */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0e17] to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0e17] to-transparent z-10"></div>
            
            <div className="flex gap-3 animate-marquee">
              {/* First set */}
              {[
                { name: 'BCA', logo: '/bca.webp' },
                { name: 'Mandiri', logo: '/mandiri.webp' },
                { name: 'BRI', logo: '/bri.webp' },
                { name: 'BNI', logo: '/bni.webp' },
                { name: 'GoPay', logo: '/gopay.webp' },
                { name: 'OVO', logo: '/ovo.webp' },
                { name: 'DANA', logo: '/dana.webp' },
                { name: 'LinkAja', logo: '/linkaja.webp' },
                { name: 'Visa', logo: '/visa.webp' },
                { name: 'Mastercard', logo: '/mastercard.webp' },
                { name: 'Bitcoin', logo: '/bitcoin.webp' },
              ].map((item, idx) => (
                <div key={`first-${idx}`} className="flex-shrink-0 w-24 bg-white border border-gray-200 rounded-lg p-3">
                  <div className="relative h-10 flex items-center justify-center">
                    <Image 
                      src={item.logo} 
                      alt={item.name}
                      width={80}
                      height={32}
                      className="h-full w-auto object-contain"
                    />
                  </div>
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {[
                { name: 'BCA', logo: '/bca.webp' },
                { name: 'Mandiri', logo: '/mandiri.webp' },
                { name: 'BRI', logo: '/bri.webp' },
                { name: 'BNI', logo: '/bni.webp' },
                { name: 'GoPay', logo: '/gopay.webp' },
                { name: 'OVO', logo: '/ovo.webp' },
                { name: 'DANA', logo: '/dana.webp' },
                { name: 'LinkAja', logo: '/linkaja.webp' },
                { name: 'Visa', logo: '/visa.webp' },
                { name: 'Mastercard', logo: '/mastercard.webp' },
                { name: 'Bitcoin', logo: '/bitcoin.webp' },
              ].map((item, idx) => (
                <div key={`second-${idx}`} className="flex-shrink-0 w-24 bg-white border border-gray-200 rounded-lg p-3">
                  <div className="relative h-10 flex items-center justify-center">
                    <Image 
                      src={item.logo} 
                      alt={item.name}
                      width={80}
                      height={32}
                      className="h-full w-auto object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-xs text-green-400 font-medium">
                Semua transaksi dilindungi enkripsi SSL 256-bit
              </span>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <EnhancedFooter />

      {/* Auth Sidebar */}
      {showAuthModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-fade-in" 
            onClick={() => setShowAuthModal(false)}
          />

          <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-gradient-to-b from-[#0f1419] to-[#0a0e17] z-50 animate-slide-left shadow-2xl overflow-y-auto">
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

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">
                  {isLogin ? 'Selamat Datang Kembali!' : 'Buat Akun'}
                </h3>
                <p className="text-gray-400">
                  {isLogin 
                    ? 'Masuk untuk melanjutkan trading' 
                    : 'Bergabung dengan ribuan trader sukses'}
                </p>
              </div>

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
                    autoComplete="current-password"
                  />
                </div>

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

              {isLogin && (
                <div className="mt-6 p-4 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-blue-400 mb-1">Akun Demo</div>
                      <div className="text-xs text-gray-400 space-y-1">
                        <div>Email: <span className="text-gray-300 font-mono">superadmin@trading.com</span></div>
                        <div>Pass: <span className="text-gray-300 font-mono">SuperAdmin123!</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-[#0f1419] text-gray-400">Atau lanjutkan dengan</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0e17] border border-gray-800 rounded-lg hover:bg-[#1a1f2e] transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="text-sm font-medium">Google</span>
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0e17] border border-gray-800 rounded-lg hover:bg-[#1a1f2e] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                  <span className="text-sm font-medium">Facebook</span>
                </button>
              </div>

              {!isLogin && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300">Akun demo gratis $10,000</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300">Tanpa kartu kredit</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-6 h-6 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-300">Dukungan pelanggan 24/7</span>
                  </div>
                </div>
              )}

              <p className="mt-6 text-xs text-center text-gray-500 leading-relaxed">
                Dengan melanjutkan, Anda menyetujui{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">Syarat & Ketentuan</a>
                {' '}dan{' '}
                <a href="#" className="text-blue-400 hover:text-blue-300">Kebijakan Privasi</a> kami
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

        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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

        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
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

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
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

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-fade-in-right {
          animation: fade-in-right 0.8s ease-out;
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.6s ease-out;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out;
        }

        .animate-slide-left {
          animation: slide-left 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        html {
          scroll-behavior: smooth;
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