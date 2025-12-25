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
  ChevronRight,
  CheckCircle,
  Quote
} from 'lucide-react'

// Live Trading Ticker Component
const LiveTradingTicker = () => {
  const [trades, setTrades] = useState([
    { user: 'Ahmad***', asset: 'EUR/USD', profit: 8500, time: '2 detik lalu' },
    { user: 'Siti***', asset: 'BTC/USD', profit: 12300, time: '5 detik lalu' },
    { user: 'Budi***', asset: 'IDX_STC', profit: 5800, time: '8 detik lalu' },
  ])

  useEffect(() => {
    const names = [
      'Ahmad***', 'Siti***', 'Budi***', 'Rina***', 'Deni***', 'Maya***',
      'Andi***', 'Fitri***', 'Joko***', 'Dewi***', 'Agus***', 'Lina***'
    ]
    const assets = [
      'EUR/USD', 'BTC/USD', 'IDX_STC', 'GBP/JPY', 'XAU/USD',
      'USD/JPY', 'ETH/USD', 'AUD/USD'
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
    <div className="hidden lg:block absolute top-24 right-8 w-72 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-10">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs font-medium text-gray-300">Live Trades</span>
      </div>
      <div className="space-y-2">
        {trades.map((trade, i) => (
          <div 
            key={i}
            className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
          >
            <div className="flex-1">
              <div className="text-xs font-medium">{trade.user}</div>
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
      setBars(prev => [...prev.slice(1), Math.random() * 80 + 20])
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-64 flex items-end justify-between gap-1 p-4">
      {bars.map((height, i) => (
        <div
          key={i}
          className="flex-1 bg-gradient-to-t from-emerald-500/50 to-blue-500/50 rounded-t transition-all duration-1000"
          style={{ 
            height: `${height}%`,
            opacity: i < 5 ? 0.3 : 1
          }}
        />
      ))}
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const { user, setAuth } = useAuthStore()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  useEffect(() => {
    if (user) router.push('/trading')
  }, [user, router])

  // Auto carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

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
      description: 'Order diproses dalam milidetik tanpa delay'
    },
    {
      icon: Shield,
      title: 'Keamanan Terjamin',
      description: 'Enkripsi tingkat bank untuk semua transaksi'
    },
    {
      icon: BarChart3,
      title: 'Analisis Real-Time',
      description: 'Chart profesional dengan data pasar terkini'
    },
    {
      icon: Award,
      title: 'Profit Hingga 95%',
      description: 'ROI terbaik di industri binary options'
    },
  ]

  const testimonials = [
    {
      name: 'Ahmad Rizki',
      role: 'Professional Trader',
      content: 'Platform terbaik yang pernah saya gunakan. Eksekusi cepat dan profit konsisten.',
      profit: '+285%',
      duration: '6 bulan'
    },
    {
      name: 'Siti Nurhaliza',
      role: 'Part-time Trader',
      content: 'Interface yang mudah dipahami, cocok untuk pemula seperti saya. Support sangat membantu.',
      profit: '+142%',
      duration: '3 bulan'
    },
    {
      name: 'Budi Santoso',
      role: 'Experienced Investor',
      content: 'Kecepatan eksekusi dan reliability platform ini tidak tertandingi. Highly recommended!',
      profit: '+378%',
      duration: '1 tahun'
    },
  ]

  if (user) return null

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e17]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image src="/stc-logo.png" alt="STC" fill className="object-contain rounded-md" priority />
              </div>
              <span className="text-xl font-bold">STC AutoTrade</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Fitur</a>
              <a href="#testimonials" className="text-sm text-gray-400 hover:text-white transition-colors">Testimoni</a>
            </div>

            <button
              onClick={() => {
                setIsLogin(true)
                setShowAuthModal(true)
              }}
              className="px-6 py-2.5 bg-white text-[#0a0e17] hover:bg-gray-100 rounded-lg text-sm font-semibold transition-colors"
            >
              Masuk
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm">Dipercaya 50.000+ trader</span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight">
                Trading Binary Option
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                  Profesional
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-400 leading-relaxed">
                Platform trading dengan eksekusi kilat, profit hingga 95%, dan keamanan maksimal.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setIsLogin(true)
                    setShowAuthModal(true)
                  }}
                  className="group px-8 py-4 bg-white text-[#0a0e17] hover:bg-gray-100 rounded-xl text-lg font-semibold transition-all"
                >
                  <span className="flex items-center justify-center gap-2">
                    Mulai Trading
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>

                <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-lg font-semibold transition-all">
                  Lihat Demo
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <stat.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-xl font-bold">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <LiveTradingTicker />
              <div className="relative bg-white/5 border border-white/10 rounded-3xl p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
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
                  </div>
                </div>

                <div className="bg-[#0a0e17] rounded-2xl mb-6 overflow-hidden">
                  <AnimatedTradingChart />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button className="bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-xl p-6 transition-all">
                    <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    <div className="font-bold text-lg text-emerald-400">BUY</div>
                  </button>
                  <button className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl p-6 transition-all">
                    <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2" />
                    <div className="font-bold text-lg text-red-400">SELL</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* FEATURES SECTION - MINIMALIST CLEAN */}
      {/* ========================================= */}
      <section id="features" className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Mengapa STC AutoTrade?
            </h2>
            <p className="text-lg text-gray-400">
              Platform trading dengan teknologi terdepan dan pengalaman pengguna terbaik
            </p>
          </div>

          {/* Features Grid - Clean & Minimal */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative"
              >
                {/* Card */}
                <div className="relative h-full p-8 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all duration-300">
                  {/* Icon */}
                  <div className="mb-6">
                    <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-7 h-7 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>

                  {/* Hover Effect Line */}
                  <div className="absolute bottom-0 left-0 w-0 h-1 bg-gradient-to-r from-blue-400 to-emerald-400 group-hover:w-full transition-all duration-500"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-16 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-center gap-12">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-gray-400">Licensed & Regulated</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-gray-400">SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-gray-400">24/7 Support</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-gray-400">Instant Withdrawal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* TESTIMONIALS SECTION - CLEAN MINIMAL */}
      {/* ========================================= */}
      <section id="testimonials" className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Section Header */}
          <div className="text-center mb-16 max-w-2xl mx-auto">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Trusted by Thousands
            </h2>
            <p className="text-lg text-gray-400">
              Cerita sukses dari trader yang menggunakan platform kami
            </p>
          </div>

          {/* Testimonial Slider */}
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-12 backdrop-blur-xl">
              {/* Quote Icon */}
              <div className="absolute top-8 left-8 opacity-10">
                <Quote className="w-16 h-16" />
              </div>

              {/* Content */}
              <div className="relative z-10">
                {testimonials.map((testimonial, index) => (
                  <div
                    key={index}
                    className={`transition-all duration-500 ${
                      index === activeTestimonial
                        ? 'opacity-100 relative'
                        : 'opacity-0 absolute inset-0 pointer-events-none'
                    }`}
                  >
                    {/* Stars */}
                    <div className="flex justify-center gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>

                    {/* Quote */}
                    <p className="text-xl sm:text-2xl text-center mb-8 leading-relaxed">
                      "{testimonial.content}"
                    </p>

                    {/* Stats */}
                    <div className="flex justify-center gap-8 mb-8">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">{testimonial.profit}</div>
                        <div className="text-sm text-gray-400">Profit</div>
                      </div>
                      <div className="w-px bg-white/10"></div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{testimonial.duration}</div>
                        <div className="text-sm text-gray-400">Trading</div>
                      </div>
                    </div>

                    {/* Author */}
                    <div className="text-center">
                      <div className="font-bold text-lg mb-1">{testimonial.name}</div>
                      <div className="text-sm text-gray-400">{testimonial.role}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Dots */}
              <div className="flex justify-center gap-2 mt-8">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === activeTestimonial 
                        ? 'bg-white w-8' 
                        : 'bg-white/30 w-2 hover:bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================= */}
      {/* CTA SECTION - MINIMAL CLEAN */}
      {/* ========================================= */}
      <section className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main CTA Card */}
            <div className="relative bg-white/5 border border-white/10 rounded-3xl p-12 sm:p-16 backdrop-blur-xl overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '40px 40px'
                }}></div>
              </div>

              {/* Content */}
              <div className="relative z-10">
                <h2 className="text-4xl sm:text-5xl font-bold mb-6">
                  Siap Memulai Trading?
                </h2>
                <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
                  Bergabung dengan 50.000+ trader sukses. Dapatkan akun demo gratis $10,000.
                </p>

                <button
                  onClick={() => {
                    setIsLogin(true)
                    setShowAuthModal(true)
                  }}
                  className="group inline-flex items-center gap-3 px-10 py-5 bg-white text-[#0a0e17] hover:bg-gray-100 rounded-xl text-lg font-bold transition-all"
                >
                  Buat Akun Gratis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Benefits */}
                <div className="flex flex-wrap items-center justify-center gap-8 mt-10 pt-10 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm">Demo $10,000</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm">Tanpa Kartu Kredit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm">Setup 2 Menit</span>
                  </div>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
            onClick={() => setShowAuthModal(false)}
          />

          <div className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-[#0f1419] z-50 overflow-y-auto shadow-2xl">
            <div className="sticky top-0 z-10 bg-[#0f1419] border-b border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10">
                    <Image src="/stc-logo.png" alt="STC" fill className="object-contain rounded-md" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">STC AutoTrade</h2>
                    <p className="text-xs text-gray-400">Platform Trading Profesional</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5"
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
                    isLogin ? 'bg-white text-[#0a0e17]' : 'text-gray-400'
                  }`}
                >
                  Masuk
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                    !isLogin ? 'bg-white text-[#0a0e17]' : 'text-gray-400'
                  }`}
                >
                  Daftar
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">
                  {isLogin ? 'Selamat Datang Kembali!' : 'Buat Akun Baru'}
                </h3>
                <p className="text-gray-400">
                  {isLogin ? 'Masuk untuk melanjutkan trading' : 'Mulai trading dalam 2 menit'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="anda@example.com"
                    required
                    disabled={loading}
                    className="w-full bg-[#0a0e17] border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-white/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={loading}
                    className="w-full bg-[#0a0e17] border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-white/30 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3.5 bg-white text-[#0a0e17] hover:bg-gray-100 rounded-lg font-semibold transition-all disabled:opacity-50 mt-6"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#0a0e17]"></div>
                      Processing...
                    </span>
                  ) : (
                    <span>{isLogin ? 'Masuk' : 'Buat Akun'}</span>
                  )}
                </button>
              </form>

              {isLogin && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="text-sm font-semibold text-blue-400 mb-2">Demo Account</div>
                  <div className="text-xs space-y-1">
                    <div>Email: <span className="font-mono">superadmin@trading.com</span></div>
                    <div>Pass: <span className="font-mono">SuperAdmin123!</span></div>
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Akun demo $10,000 gratis</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Tanpa kartu kredit</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    <span>Support 24/7</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}