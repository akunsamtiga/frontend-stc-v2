'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import EnhancedFooter from '@/components/EnhancedFooter'
import Image from 'next/image'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
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
  ChevronRight,
  Check,
  CreditCard,
  Building2,
  Smartphone
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
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="hidden lg:block absolute top-24 right-8 w-72 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl z-10"
    >
      <div className="flex items-center gap-2 mb-3">
        <motion.div 
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 bg-emerald-400 rounded-full"
        />
        <span className="text-xs font-semibold text-gray-300">Transaksi Live</span>
      </div>
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {trades.map((trade, i) => (
            <motion.div
              key={`${trade.user}-${trade.time}-${i}`}
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-between p-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg"
            >
              <div className="flex-1">
                <div className="text-xs font-medium text-gray-200">{trade.user}</div>
                <div className="text-[10px] text-gray-400">{trade.asset}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400">+Rp {trade.profit.toLocaleString()}</div>
                <div className="text-[10px] text-gray-500">{trade.time}</div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
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
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${height}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex-1 bg-gradient-to-t from-emerald-500/50 to-blue-500/50 rounded-t"
          style={{ opacity: i < 5 ? 0.3 : 1 }}
        />
      ))}
    </div>
  )
}

// Floating Price Cards
const FloatingPriceCard = ({ symbol, price, change, delay, style }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ 
      opacity: 1, 
      scale: 1,
      y: [0, -10, 0]
    }}
    transition={{ 
      opacity: { duration: 0.5, delay },
      scale: { duration: 0.5, delay },
      y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    }}
    className="hidden lg:block absolute bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 shadow-2xl"
    style={style}
  >
    <div className="text-xs text-gray-400 mb-1">{symbol}</div>
    <div className="text-lg font-bold font-mono mb-1">{price}</div>
    <div className={`text-xs font-semibold flex items-center gap-1 ${
      change > 0 ? 'text-emerald-400' : 'text-red-400'
    }`}>
      {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {change > 0 ? '+' : ''}{change}%
    </div>
  </motion.div>
)

// Modern Trust Badge Component
const TrustBadge = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="inline-flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-emerald-500/10 border border-white/10 rounded-full backdrop-blur-xl"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="relative w-8 h-8"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-emerald-400 rounded-full opacity-20 blur-sm" />
        <div className="absolute inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
      </motion.div>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-white">50K+</span>
        <div className="w-px h-4 bg-white/20" />
        <span className="text-sm text-gray-300">Trader Dipercaya</span>
      </div>
      
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex items-center gap-1"
      >
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        ))}
      </motion.div>
    </motion.div>
  )
}

// Payment Methods Component
const PaymentMethods = () => {
  const methods = [
    { name: 'Bank Transfer', icon: Building2 },
    { name: 'E-Wallet', icon: Smartphone },
    { name: 'Credit Card', icon: CreditCard },
  ]

  const logos = [
    { name: 'BCA', color: 'from-blue-600 to-blue-400' },
    { name: 'Mandiri', color: 'from-yellow-600 to-yellow-400' },
    { name: 'BNI', color: 'from-orange-600 to-orange-400' },
    { name: 'BRI', color: 'from-blue-700 to-blue-500' },
    { name: 'OVO', color: 'from-purple-600 to-purple-400' },
    { name: 'GoPay', color: 'from-green-600 to-green-400' },
    { name: 'DANA', color: 'from-blue-500 to-cyan-400' },
    { name: 'Visa', color: 'from-blue-600 to-blue-400' },
    { name: 'Mastercard', color: 'from-red-600 to-orange-400' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="mt-16 pt-12 border-t border-white/10"
    >
      <div className="text-center mb-8">
        <h3 className="text-lg font-semibold text-white mb-2">Metode Pembayaran</h3>
        <p className="text-sm text-gray-400">Deposit aman dengan berbagai pilihan pembayaran</p>
      </div>

      {/* Desktop */}
      <div className="hidden sm:block">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {logos.map((logo, i) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className="group relative"
            >
              <div className={`w-24 h-14 bg-gradient-to-br ${logo.color} rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg border border-white/20 transition-all group-hover:shadow-xl`}>
                {logo.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile - Scrolling */}
      <div className="sm:hidden relative">
        <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
          {logos.map((logo, i) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="snap-center flex-shrink-0"
            >
              <div className={`w-20 h-12 bg-gradient-to-br ${logo.color} rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-lg border border-white/20`}>
                {logo.name}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-400"
      >
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Instan</span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span>Aman</span>
        </div>
        <div className="w-px h-4 bg-white/20" />
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span>Otomatis</span>
        </div>
      </motion.div>
    </motion.div>
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
  const [activeFeature, setActiveFeature] = useState(0)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])

  useEffect(() => {
    if (user) {
      router.push('/trading')
    }
  }, [user, router])

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
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"
        />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e17]/80 backdrop-blur-xl border-b border-white/10"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 group cursor-pointer"
            >
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
            </motion.div>

            <div className="hidden md:flex items-center gap-8">
              {['Fitur', 'Cara Kerja', 'Testimoni'].map((item, i) => (
                <motion.a
                  key={item}
                  href={`#${item.toLowerCase().replace(' ', '-')}`}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="text-sm text-gray-400 hover:text-white transition-colors relative group"
                >
                  {item}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all"></span>
                </motion.a>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsLogin(true)
                  setShowAuthModal(true)
                }}
                className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold text-white shadow-lg transition-colors border border-white/10"
              >
                Masuk
              </motion.button>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <TrustBadge />

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight"
              >
                Trading Binary Option dengan
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400"
                >
                  Kecepatan Kilat
                </motion.span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg sm:text-xl text-gray-400 leading-relaxed"
              >
                Eksekusi order dalam <span className="text-emerald-400 font-semibold">milidetik</span>, 
                dapatkan profit hingga <span className="text-blue-400 font-semibold">95%</span>, 
                dan trading dengan <span className="text-cyan-400 font-semibold">percaya diri 24/7</span>.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-row gap-3 sm:gap-4"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIsLogin(true)
                    setShowAuthModal(true)
                  }}
                  className="group flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl text-sm sm:text-lg font-semibold transition-all shadow-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="hidden sm:inline">Masuk untuk Trading</span>
                    <span className="sm:hidden">Masuk</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 rounded-xl text-sm sm:text-lg font-semibold transition-all backdrop-blur-sm"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Lihat Demo</span>
                    <span className="sm:hidden">Demo</span>
                  </span>
                </motion.button>
              </motion.div>

              {/* Stats Row */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                className="grid grid-cols-4 gap-4 pt-8"
              >
                {stats.map((stat, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.8 + index * 0.1 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="text-center cursor-default"
                  >
                    <stat.icon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-xl font-bold">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right - Trading Platform Preview */}
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="relative"
            >
              <LiveTradingTicker />

              <FloatingPriceCard 
                symbol="EUR/USD" 
                price="1.0856" 
                change={2.3} 
                delay={0.6}
                style={{ top: '10%', left: '-10%' }}
              />
              <FloatingPriceCard 
                symbol="BTC/USD" 
                price="68,342" 
                change={-1.2} 
                delay={0.8}
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
              <motion.div 
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
                className="relative bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-xl"
              >
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
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                      />
                      Live
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-2xl mb-6 overflow-hidden border border-white/10">
                  <AnimatedTradingChart />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative bg-gradient-to-br from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-500/30 rounded-xl p-6 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-emerald-500/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2 relative z-10 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-lg text-emerald-400 relative z-10">BELI</div>
                    <div className="text-xs text-gray-400 relative z-10">Profit +95%</div>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative bg-gradient-to-br from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 rounded-xl p-6 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-red-500/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2 relative z-10 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-lg text-red-400 relative z-10">JUAL</div>
                    <div className="text-xs text-gray-400 relative z-10">Profit +95%</div>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fitur" className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6"
            >
              <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-400">Teknologi Terdepan</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight"
            >
              Mengapa Memilih Kami
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg text-gray-400 max-w-2xl mx-auto"
            >
              Platform trading dengan teknologi dan keamanan terbaik
            </motion.p>
          </div>

          {/* Desktop Grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all duration-300 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="relative z-10">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`inline-flex w-14 h-14 ${feature.bgColor} ${feature.borderColor} border-2 rounded-2xl items-center justify-center mb-4`}
                  >
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </motion.div>

                  <h3 className="text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>

                  <motion.div 
                    initial={{ width: 48 }}
                    whileHover={{ width: 80 }}
                    className={`h-1 ${feature.bgColor} rounded-full mt-6`}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile */}
          <div className="sm:hidden relative">
            <div 
              className="relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative min-h-[220px]">
                <AnimatePresence mode="wait">
                  {features.map((feature, index) => {
                    const isActive = index === activeFeature
                    
                    return isActive ? (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3 }}
                        className="mx-4"
                      >
                        <div className="relative h-full bg-white/5 border border-white/10 rounded-xl p-5 overflow-hidden">
                          <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-5`}></div>
                          
                          <div className="relative h-full flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-12 h-12 ${feature.bgColor} ${feature.borderColor} border rounded-xl flex items-center justify-center`}>
                                <feature.icon className={`w-6 h-6 ${feature.color}`} />
                              </div>
                              <div className={`w-7 h-7 ${feature.bgColor} rounded-lg flex items-center justify-center border ${feature.borderColor}`}>
                                <span className={`text-xs font-bold ${feature.color}`}>{index + 1}</span>
                              </div>
                            </div>

                            <div className="flex-1">
                              <h3 className="text-lg font-bold tracking-tight mb-2">{feature.title}</h3>
                              <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                            </div>

                            <div className={`h-0.5 w-16 ${feature.bgColor} rounded-full mt-4`}></div>
                          </div>
                        </div>
                      </motion.div>
                    ) : null
                  })}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-5 px-4">
              <div className="flex items-center justify-center gap-2">
                {features.map((feature, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveFeature(index)}
                    className="transition-all duration-300"
                  >
                    <motion.div 
                      animate={{
                        width: index === activeFeature ? 28 : 6,
                        backgroundColor: index === activeFeature ? 'rgb(59 130 246)' : 'rgb(55 65 81)'
                      }}
                      className="h-1.5 rounded-full"
                    />
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
      <section id="cara-kerja" className="py-20 sm:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-20">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6"
            >
              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-purple-400">Mulai dalam 3 langkah mudah</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight"
            >
              Cara Kerja Platform
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-400 max-w-2xl mx-auto"
            >
              Trading menjadi mudah dengan sistem otomatis kami
            </motion.p>
          </div>

          {/* Desktop Timeline */}
          <div className="hidden lg:block max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-purple-500/20 via-pink-500/20 to-blue-500/20"></div>

              <div className="space-y-24">
                {[
                  { icon: Users, title: 'Daftar & Verifikasi', desc: 'Buat akun dalam 2 menit. Verifikasi identitas untuk keamanan maksimal dan mulai dengan akun demo gratis.', tags: ['Registrasi cepat', 'Demo $10K'], color: 'purple', num: 1, side: 'left' },
                  { icon: DollarSign, title: 'Deposit & Pilih Strategi', desc: 'Deposit mulai dari Rp 100.000. Pilih strategi trading otomatis sesuai profil risiko Anda.', tags: ['Minimal rendah', 'Auto trading'], color: 'pink', num: 2, side: 'right' },
                  { icon: TrendingUp, title: 'Trading & Profit', desc: 'Sistem kami trading otomatis 24/7. Pantau profit real-time dan tarik keuntungan kapan saja.', tags: ['Trading 24/7', 'Profit 95%'], color: 'blue', num: 3, side: 'left' }
                ].map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: step.side === 'left' ? -50 : 50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.2 }}
                    className="relative flex items-center"
                    style={{ flexDirection: step.side === 'right' ? 'row-reverse' : 'row' }}
                  >
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="w-[calc(50%-3rem)] mr-auto"
                      style={{ marginLeft: step.side === 'right' ? 'auto' : '0', marginRight: step.side === 'right' ? '0' : 'auto' }}
                    >
                      <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all">
                        <div className="flex items-start gap-4">
                          <div className={`w-12 h-12 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <step.icon className={`w-6 h-6 text-${step.color}-400`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-4">{step.desc}</p>
                            <div className="flex flex-wrap gap-2">
                              {step.tags.map((tag, j) => (
                                <span key={j} className={`px-3 py-1 bg-${step.color}-500/10 border border-${step.color}-500/20 rounded-full text-xs text-${step.color}-400`}>{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    <div className="absolute left-1/2 -translate-x-1/2 z-10">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.2 + 0.3 }}
                        className="relative w-16 h-16"
                      >
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                          className={`absolute inset-0 bg-${step.color}-500/20 rounded-full`}
                        />
                        <div className={`absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-${step.color}-500/50 flex items-center justify-center`}>
                          <span className={`text-xl font-bold text-${step.color}-400`}>{step.num}</span>
                        </div>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
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
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-4 relative"
              >
                {i < 2 && <div className="absolute left-7 top-16 w-px h-6 bg-gray-800"></div>}
                
                <div className="flex-shrink-0">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`relative w-14 h-14 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-full flex items-center justify-center`}
                  >
                    <span className={`text-lg font-bold text-${step.color}-400`}>{step.num}</span>
                  </motion.div>
                </div>
                
                <motion.div 
                  whileHover={{ x: 5 }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-lg flex items-center justify-center`}>
                      <step.icon className={`w-5 h-5 text-${step.color}-400`} />
                    </div>
                    <h3 className="font-bold">{step.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6"
            >
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-400">Testimoni Trader</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight"
            >
              Dipercaya Ribuan Trader
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-400 max-w-2xl mx-auto"
            >
              Lihat apa kata trader sukses tentang kami
            </motion.p>
          </div>

          {/* Desktop */}
          <div className="hidden sm:block max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="relative bg-white/5 border border-white/10 rounded-2xl p-12"
              >
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-6xl mb-6"
                  >
                    {testimonials[activeTestimonial].avatar}
                  </motion.div>
                  
                  <div className="flex justify-center gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      </motion.div>
                    ))}
                  </div>

                  <p className="text-xl text-gray-200 mb-8 leading-relaxed">
                    "{testimonials[activeTestimonial].content}"
                  </p>

                  <div className="flex items-center justify-center gap-6 mb-6">
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"
                    >
                      <div className="text-sm text-gray-400 mb-1">Keuntungan</div>
                      <div className="text-lg font-bold text-emerald-400">
                        {testimonials[activeTestimonial].profit}
                      </div>
                    </motion.div>
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                    >
                      <div className="text-sm text-gray-400 mb-1">Durasi</div>
                      <div className="text-lg font-bold text-blue-400">
                        {testimonials[activeTestimonial].duration}
                      </div>
                    </motion.div>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <div className="font-bold text-lg mb-1">
                      {testimonials[activeTestimonial].name}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {testimonials[activeTestimonial].role}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-2 mt-8">
                  {testimonials.map((_, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setActiveTestimonial(index)}
                      whileHover={{ scale: 1.2 }}
                      className="transition-all duration-300"
                    >
                      <motion.div 
                        animate={{
                          width: index === activeTestimonial ? 32 : 8,
                          backgroundColor: index === activeTestimonial ? 'rgb(16 185 129)' : 'rgb(55 65 81)'
                        }}
                        className="h-2 rounded-full"
                      />
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile */}
          <div className="sm:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="mx-4 bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="text-5xl">{testimonials[activeTestimonial].avatar}</div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>

                <p className="text-base text-gray-200 leading-relaxed mb-6 italic">
                  "{testimonials[activeTestimonial].content}"
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-white/10">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">Keuntungan</div>
                    <div className="text-lg font-bold text-emerald-400">{testimonials[activeTestimonial].profit}</div>
                  </div>
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1">Durasi</div>
                    <div className="text-lg font-bold text-blue-400">{testimonials[activeTestimonial].duration}</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-lg mb-1">{testimonials[activeTestimonial].name}</h4>
                  <p className="text-sm text-gray-400">{testimonials[activeTestimonial].role}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-6 px-4">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all border border-white/10"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    whileHover={{ scale: 1.2 }}
                    className="transition-all duration-300"
                  >
                    <motion.div 
                      animate={{
                        width: index === activeTestimonial ? 32 : 8,
                        backgroundColor: index === activeTestimonial ? 'rgb(16 185 129)' : 'rgb(55 65 81)'
                      }}
                      className="h-2 rounded-full"
                    />
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center transition-all border border-white/10"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>

            <div className="mt-4 text-center">
              <span className="text-xs text-gray-500">
                {activeTestimonial + 1} / {testimonials.length}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden"
          >
            <div className="absolute inset-0">
              <motion.div
                animate={{ 
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-emerald-500/5"
                style={{ backgroundSize: '200% 200%' }}
              />
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]"></div>
            </div>

            {/* Desktop */}
            <div className="hidden sm:block relative z-10 px-16 py-20 text-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8"
              >
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-blue-400">Platform Trading Terpercaya</span>
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-5xl font-bold mb-6 tracking-tight"
              >
                Mulai Trading Hari Ini
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-lg text-gray-400 mb-10 max-w-xl mx-auto"
              >
                Bergabung dengan 50.000+ trader profesional di seluruh dunia
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsLogin(true)
                  setShowAuthModal(true)
                }}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-white/10"
              >
                {[
                  { value: '50K+', label: 'Trader Aktif' },
                  { value: '$2.5M', label: 'Volume Harian' },
                  { value: '95%', label: 'Max Profit' }
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
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

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsLogin(true)
                  setShowAuthModal(true)
                }}
                className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 active:bg-gray-200 transition-all shadow-lg"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10">
                {[
                  { value: '50K+', label: 'Trader' },
                  { value: '$2.5M', label: 'Volume' },
                  { value: '95%', label: 'Profit' }
                ].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-xl font-bold mb-0.5">{stat.value}</div>
                    <div className="text-[10px] text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <PaymentMethods />
          </motion.div>
        </div>
      </section>

      <EnhancedFooter />

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-gradient-to-b from-[#0f1419] to-[#0a0e17] z-50 shadow-2xl overflow-y-auto"
            >
              <div className="sticky top-0 z-10 bg-gradient-to-b from-[#0f1419] to-transparent backdrop-blur-xl border-b border-white/10 p-6">
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
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAuthModal(false)}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              <div className="p-6">
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl mb-6">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      isLogin
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Masuk
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      !isLogin
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Daftar
                  </motion.button>
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
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      autoComplete="current-password"
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3.5 bg-white text-gray-900 hover:bg-gray-100 rounded-lg text-lg font-semibold transition-colors shadow-lg disabled:opacity-50 mt-6"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
                        Memproses...
                      </span>
                    ) : (
                      <span>{isLogin ? 'Masuk' : 'Buat Akun'}</span>
                    )}
                  </motion.button>
                </form>

                {isLogin && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6 p-4 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border border-blue-500/20 rounded-xl"
                  >
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
                  </motion.div>
                )}

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#0f1419] text-gray-400">Atau lanjutkan dengan</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-sm font-medium">Google</span>
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                    </svg>
                    <span className="text-sm font-medium">Facebook</span>
                  </motion.button>
                </div>

                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 space-y-3"
                  >
                    {[
                      { text: 'Akun demo gratis $10,000', color: 'emerald' },
                      { text: 'Tanpa kartu kredit', color: 'blue' },
                      { text: 'Dukungan pelanggan 24/7', color: 'purple' }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center gap-3 text-sm"
                      >
                        <div className={`w-6 h-6 bg-${item.color}-500/20 rounded-lg flex items-center justify-center`}>
                          <Check className={`w-4 h-4 text-${item.color}-400`} />
                        </div>
                        <span className="text-gray-300">{item.text}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

                <p className="mt-6 text-xs text-center text-gray-500 leading-relaxed">
                  Dengan melanjutkan, Anda menyetujui{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300">Syarat & Ketentuan</a>
                  {' '}dan{' '}
                  <a href="#" className="text-blue-400 hover:text-blue-300">Kebijakan Privasi</a> kami
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}