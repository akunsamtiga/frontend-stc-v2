'use client'

import { useState, useEffect } from 'react'
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

// Extended Live Trading Data
const tradingData = [
  { user: 'Ahmad***', asset: 'EUR/USD', profit: 8500, time: '2 detik lalu' },
  { user: 'Siti***', asset: 'BTC/USD', profit: 12300, time: '5 detik lalu' },
  { user: 'Budi***', asset: 'IDX_STC', profit: 5800, time: '8 detik lalu' },
  { user: 'Rina***', asset: 'GBP/JPY', profit: 9200, time: '12 detik lalu' },
  { user: 'Deni***', asset: 'XAU/USD', profit: 15600, time: '15 detik lalu' },
  { user: 'Maya***', asset: 'USD/JPY', profit: 7400, time: '18 detik lalu' },
  { user: 'Faisal***', asset: 'EUR/GBP', profit: 11200, time: '22 detik lalu' },
  { user: 'Dewi***', asset: 'AUD/USD', profit: 6900, time: '25 detik lalu' },
  { user: 'Rudi***', asset: 'BTC/USD', profit: 18500, time: '28 detik lalu' },
  { user: 'Linda***', asset: 'IDX_STC', profit: 8100, time: '32 detik lalu' },
  { user: 'Arif***', asset: 'XAU/USD', profit: 13400, time: '35 detik lalu' },
  { user: 'Sari***', asset: 'EUR/USD', profit: 9800, time: '38 detik lalu' },
  { user: 'Hendra***', asset: 'GBP/USD', profit: 10500, time: '42 detik lalu' },
  { user: 'Putri***', asset: 'USD/CHF', profit: 7200, time: '45 detik lalu' },
  { user: 'Andi***', asset: 'BTC/USD', profit: 16800, time: '48 detik lalu' }
]

// Live Trading Ticker Component
const LiveTradingTicker = () => {
  const [trades, setTrades] = useState(tradingData.slice(0, 3))

  useEffect(() => {
    const interval = setInterval(() => {
      const randomTrade = tradingData[Math.floor(Math.random() * tradingData.length)]
      const newTrade = {
        ...randomTrade,
        time: 'baru saja',
        profit: Math.floor(Math.random() * 15000) + 3000
      }

      setTrades(prev => [newTrade, ...prev.slice(0, 2)])
    }, 4000)

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

  // Auto carousel for testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3)
    }, 5000)
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

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = (type: 'feature' | 'testimonial') => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (type === 'feature') {
      if (isLeftSwipe && activeFeature < features.length - 1) {
        setActiveFeature(prev => prev + 1)
      }
      if (isRightSwipe && activeFeature > 0) {
        setActiveFeature(prev => prev - 1)
      }
    } else {
      if (isLeftSwipe && activeTestimonial < testimonials.length - 1) {
        setActiveTestimonial(prev => prev + 1)
      }
      if (isRightSwipe && activeTestimonial > 0) {
        setActiveTestimonial(prev => prev - 1)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate API call
    setTimeout(() => {
      alert(isLogin ? 'Login berhasil!' : 'Registrasi berhasil!')
      setLoading(false)
      setShowAuthModal(false)
    }, 1500)
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
      color: 'yellow'
    },
    {
      icon: Shield,
      title: 'Keamanan Maksimal',
      description: 'Enkripsi tingkat militer melindungi dana Anda',
      gradient: 'from-blue-500/20 to-cyan-500/20',
      color: 'blue'
    },
    {
      icon: BarChart3,
      title: 'Analisis Real-Time',
      description: 'Chart canggih dan wawasan pasar terkini',
      gradient: 'from-purple-500/20 to-pink-500/20',
      color: 'purple'
    },
    {
      icon: Award,
      title: 'Profit Hingga 95%',
      description: 'Keuntungan terbaik di industri trading',
      gradient: 'from-green-500/20 to-emerald-500/20',
      color: 'green'
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
      badge: 'Pro Trader'
    },
    {
      name: 'Siti Nurhaliza',
      role: 'Trader Paruh Waktu',
      content: 'Sebagai pemula, tampilan interface memudahkan trading. Dukungan hebat dan materi edukasi membantu saya sukses!',
      rating: 5,
      avatar: '👩‍💻',
      profit: '+142%',
      badge: 'Rising Star'
    },
    {
      name: 'Budi Santoso',
      role: 'Investor Berpengalaman',
      content: 'Platform trading terbaik yang pernah saya gunakan. Kecepatan, keamanan, dan tingkat profit tak tertandingi.',
      rating: 5,
      avatar: '👨‍🎓',
      profit: '+378%',
      badge: 'Elite Investor'
    },
  ]

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
              <div className="relative w-10 h-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold">S</span>
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

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 animate-fade-in-up">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Mengapa Memilih <span className="text-white">STC AutoTrade</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Rasakan trading yang direvolusi dengan teknologi canggih
            </p>
          </div>

          {/* Desktop Grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border border-gray-800/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-500 overflow-hidden animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                
                <div className="relative z-10">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center mb-4 border border-blue-500/30 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Modern Mobile Card Stack */}
          <div className="sm:hidden">
            <div 
              className="relative"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd('feature')}
            >
              <div className="relative h-[420px]">
                {features.map((feature, index) => {
                  const isActive = index === activeFeature
                  const isPrev = index === activeFeature - 1
                  const isNext = index === activeFeature + 1
                  
                  let transform = 'translateX(100%) scale(0.9)'
                  let opacity = 0
                  let zIndex = 0

                  if (isActive) {
                    transform = 'translateX(0) scale(1)'
                    opacity = 1
                    zIndex = 30
                  } else if (isPrev) {
                    transform = 'translateX(-100%) scale(0.9)'
                    opacity = 0
                    zIndex = 10
                  } else if (isNext) {
                    transform = 'translateX(20%) scale(0.95)'
                    opacity = 0.3
                    zIndex = 20
                  }

                  return (
                    <div
                      key={index}
                      className="absolute inset-0 transition-all duration-500 ease-out"
                      style={{
                        transform,
                        opacity,
                        zIndex
                      }}
                    >
                      <div className="h-full bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border-2 border-gray-800/50 rounded-3xl p-8 shadow-2xl">
                        {/* Icon with glow */}
                        <div className="relative mb-6">
                          <div className={`absolute inset-0 bg-${feature.color}-500/20 rounded-2xl blur-xl`}></div>
                          <div className={`relative w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center border border-${feature.color}-500/30 mx-auto`}>
                            <feature.icon className={`w-10 h-10 text-${feature.color}-400`} />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="text-center space-y-4">
                          <h3 className="text-2xl font-bold">{feature.title}</h3>
                          <p className="text-gray-400 text-lg leading-relaxed">
                            {feature.description}
                          </p>
                        </div>

                        {/* Decorative elements */}
                        <div className="mt-8 flex justify-center gap-2">
                          <div className={`w-12 h-1 bg-gradient-to-r ${feature.gradient} rounded-full`}></div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Enhanced Navigation */}
              <div className="mt-8 space-y-4">
                {/* Progress dots */}
                <div className="flex justify-center gap-2">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveFeature(index)}
                      className={`transition-all duration-300 rounded-full ${
                        index === activeFeature 
                          ? 'bg-gradient-to-r from-blue-500 to-emerald-500 w-8 h-2' 
                          : 'bg-gray-700 w-2 h-2 hover:bg-gray-600'
                      }`}
                    />
                  ))}
                </div>

                {/* Feature counter */}
                <div className="text-center">
                  <span className="text-sm text-gray-400">
                    {activeFeature + 1} / {features.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Dipercaya <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Ribuan</span> Trader
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Lihat apa kata trader sukses tentang kami
            </p>
          </div>

          {/* Desktop Version */}
          <div className="hidden sm:block max-w-4xl mx-auto">
            <div className="relative bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border border-gray-800/50 rounded-3xl p-8 sm:p-12 backdrop-blur-xl">
              <div className="text-center animate-fade-in">
                <div className="text-6xl mb-6">{testimonials[activeTestimonial].avatar}</div>
                
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                  "{testimonials[activeTestimonial].content}"
                </p>

                <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-4">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-emerald-400">
                    {testimonials[activeTestimonial].profit} Keuntungan
                  </span>
                </div>

                <div className="font-semibold text-lg mb-1">
                  {testimonials[activeTestimonial].name}
                </div>
                <div className="text-gray-400">
                  {testimonials[activeTestimonial].role}
                </div>
              </div>

              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      index === activeTestimonial 
                        ? 'bg-blue-500 w-8' 
                        : 'bg-gray-700 w-1.5 hover:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Modern Mobile Testimonial Cards */}
          <div className="sm:hidden">
            <div 
              className="relative"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={() => handleTouchEnd('testimonial')}
            >
              <div className="relative h-[500px]">
                {testimonials.map((testimonial, index) => {
                  const isActive = index === activeTestimonial
                  const offset = index - activeTestimonial
                  
                  let transform = `translateX(${offset * 100}%) scale(${isActive ? 1 : 0.9})`
                  let opacity = isActive ? 1 : 0
                  let zIndex = isActive ? 20 : 10

                  return (
                    <div
                      key={index}
                      className="absolute inset-0 transition-all duration-500 ease-out px-4"
                      style={{
                        transform,
                        opacity,
                        zIndex
                      }}
                    >
                      <div className="h-full bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border-2 border-gray-800/50 rounded-3xl p-6 shadow-2xl overflow-hidden">
                        {/* Background decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl"></div>
                        
                        <div className="relative z-10 h-full flex flex-col">
                          {/* Header */}
                          <div className="text-center mb-6">
                            <div className="text-6xl mb-4">{testimonial.avatar}</div>
                            
                            {/* Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full mb-3">
                              <Award className="w-3 h-3 text-blue-400" />
                              <span className="text-xs font-semibold text-blue-400">{testimonial.badge}</span>
                            </div>

                            {/* Stars */}
                            <div className="flex justify-center gap-1 mb-3">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              ))}
                            </div>
                          </div>

                          {/* Quote */}
                          <div className="flex-1 flex items-center mb-6">
                            <div className="relative">
                              <div className="absolute -top-2 -left-2 text-4xl text-blue-500/20">"</div>
                              <p className="text-gray-300 text-base leading-relaxed px-4">
                                {testimonial.content}
                              </p>
                              <div className="absolute -bottom-4 -right-2 text-4xl text-blue-500/20 rotate-180">"</div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="space-y-3">
                            {/* Profit badge */}
                            <div className="flex justify-center">
                              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-full">
                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm font-bold text-emerald-400">
                                  {testimonial.profit} Keuntungan
                                </span>
                              </div>
                            </div>

                            {/* Name and role */}
                            <div className="text-center">
                              <div className="font-bold text-lg mb-1">{testimonial.name}</div>
                              <div className="text-sm text-gray-400">{testimonial.role}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Navigation */}
              <div className="mt-8 space-y-4">
                {/* Dots */}
                <div className="flex justify-center gap-2">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveTestimonial(index)}
                      className={`transition-all duration-300 rounded-full ${
                        index === activeTestimonial 
                          ? 'bg-gradient-to-r from-blue-500 to-emerald-500 w-8 h-2' 
                          : 'bg-gray-700 w-2 h-2'
                      }`}
                    />
                  ))}
                </div>

                {/* Counter */}
                <div className="text-center">
                  <span className="text-sm text-gray-400">
                    {activeTestimonial + 1} / {testimonials.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="relative bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-cyan-500/20 border border-blue-500/30 rounded-3xl p-8 sm:p-16 text-center overflow-hidden backdrop-blur-xl">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
            
            <div className="relative z-10">
              <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                Siap Memulai Perjalanan Trading Anda?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Bergabung dengan 50.000+ trader sukses. Mulai menghasilkan dalam waktu kurang dari 2 menit!
              </p>

              <button
                onClick={() => {
                  setIsLogin(true)
                  setShowAuthModal(true)
                }}
                className="group px-8 py-4 bg-[#1e293b] hover:bg-[#334155] rounded-xl text-lg font-semibold text-white transition-colors border border-gray-700 shadow-lg"
              >
                <span className="flex items-center gap-2">
                  Masuk Sekarang
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Auth Modal */}
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
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold">S</span>
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
                        <div>Email: <span className="text-gray-300 font-mono">demo@trading.com</span></div>
                        <div>Pass: <span className="text-gray-300 font-mono">demo123</span></div>
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