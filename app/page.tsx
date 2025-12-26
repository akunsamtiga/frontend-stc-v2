'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import EnhancedFooter from '@/components/EnhancedFooter'
import Image from 'next/image'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
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
  CheckCircle2,
  CreditCard,
  Building2,
  Smartphone
} from 'lucide-react'

// Modern Floating Particles Background
const FloatingParticles = () => {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 5
  }))

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-blue-500/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Modern Trust Badge with Motion
const ModernTrustBadge = () => {
  const [count, setCount] = useState(0)
  const targetCount = 50000

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = targetCount / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= targetCount) {
        setCount(targetCount)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="inline-flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/10 rounded-2xl shadow-lg hover:shadow-xl transition-shadow group"
    >
      {/* Animated Icon Container */}
      <motion.div 
        className="relative"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
        <div className="relative w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <Users className="w-5 h-5 text-white" />
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex flex-col">
        <motion.div 
          className="flex items-baseline gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 tabular-nums">
            {count.toLocaleString()}+
          </span>
        </motion.div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Trader Terpercaya
        </span>
      </div>

      {/* Pulse Effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl border-2 border-blue-500/50"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.5, 0, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.div>
  )
}

// Payment Methods Section
const PaymentMethods = () => {
  const paymentMethods = [
    { name: 'Visa', icon: CreditCard, color: 'from-blue-600 to-blue-400' },
    { name: 'Mastercard', icon: CreditCard, color: 'from-orange-600 to-red-500' },
    { name: 'Bank Transfer', icon: Building2, color: 'from-green-600 to-emerald-500' },
    { name: 'E-Wallet', icon: Smartphone, color: 'from-purple-600 to-pink-500' },
    { name: 'QRIS', icon: Smartphone, color: 'from-cyan-600 to-blue-500' },
  ]

  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="mt-12 pt-12 border-t border-gray-800/50"
    >
      <div className="text-center mb-8">
        <motion.p 
          className="text-sm text-gray-400 mb-6"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
        >
          Metode Pembayaran yang Didukung
        </motion.p>
        
        <div className="flex flex-wrap items-center justify-center gap-4">
          {paymentMethods.map((method, index) => (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.1 * index, duration: 0.4 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${method.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity rounded-xl`} />
              
              {/* Card */}
              <div className="relative px-6 py-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${method.color} rounded-lg flex items-center justify-center shadow-lg`}>
                    <method.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-300 group-hover:text-white transition-colors">
                    {method.name}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ delay: 0.6 }}
        className="flex items-center justify-center gap-6 text-xs text-gray-500"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-green-400" />
          <span>SSL Encrypted</span>
        </div>
        <div className="w-px h-4 bg-gray-700" />
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-400" />
          <span>PCI DSS Compliant</span>
        </div>
        <div className="w-px h-4 bg-gray-700" />
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          <span>Licensed & Regulated</span>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Live Trading Ticker with Motion
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
    ]
    const assets = [
      'EUR/USD', 'BTC/USD', 'IDX_STC', 'GBP/JPY', 'XAU/USD',
      'USD/JPY', 'ETH/USD', 'AUD/USD', 'NZD/USD', 'USD/CHF',
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
      transition={{ duration: 0.6, delay: 0.4 }}
      className="hidden lg:block absolute top-24 right-8 w-72 bg-[#0a0e17]/95 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 shadow-2xl z-10"
    >
      <div className="flex items-center gap-2 mb-3">
        <motion.div 
          className="w-2 h-2 bg-green-400 rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-xs font-semibold text-gray-300">Transaksi Live</span>
      </div>
      
      <AnimatePresence mode="popLayout">
        {trades.map((trade, i) => (
          <motion.div
            key={`${trade.user}-${trade.time}-${i}`}
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-between p-2 bg-green-500/5 border border-green-500/20 rounded-lg mb-2 last:mb-0"
          >
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-200">{trade.user}</div>
              <div className="text-[10px] text-gray-400">{trade.asset}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-green-400">+Rp {trade.profit.toLocaleString()}</div>
              <div className="text-[10px] text-gray-500">{trade.time}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

// Animated Trading Chart
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
          className="flex-1 bg-gradient-to-t from-emerald-500/50 to-blue-500/50 rounded-t"
          initial={{ height: 0 }}
          animate={{ height: `${height}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ opacity: i < 5 ? 0.3 : 1 }}
        />
      ))}
    </div>
  )
}

// Floating Price Cards with Motion
const FloatingPriceCard = ({ symbol, price, change, delay, style }: any) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.05, y: -5 }}
    className="hidden lg:block absolute bg-[#0a0e17]/95 backdrop-blur-xl border border-gray-800/50 rounded-xl p-3 shadow-2xl"
    style={style}
  >
    <div className="text-xs text-gray-400 mb-1">{symbol}</div>
    <div className="text-lg font-bold font-mono mb-1">{price}</div>
    <div className={`text-xs font-semibold flex items-center gap-1 ${
      change > 0 ? 'text-green-400' : 'text-red-400'
    }`}>
      {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {change > 0 ? '+' : ''}{change}%
    </div>
  </motion.div>
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

  const { scrollYProgress } = useScroll()
  const y = useTransform(scrollYProgress, [0, 1], [0, 100])

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
      {/* Animated Background with Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingParticles />
        <motion.div 
          className="absolute top-1/4 -left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px]"
          style={{ x: mousePosition.x, y: mousePosition.y }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity }}
        />
        <motion.div 
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]"
          style={{ x: -mousePosition.x, y: -mousePosition.y }}
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, delay: 1 }}
        />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-[#0a0e17]/80 backdrop-blur-xl border-b border-gray-800/50"
      >
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <motion.div 
              className="flex items-center gap-3 group cursor-pointer"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="relative w-10 h-10 flex-shrink-0">
                <Image
                  src="/stc-logo.png"
                  alt="STC AutoTrade"
                  fill
                  className="object-contain rounded-md"
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
                  className="text-sm text-gray-400 hover:text-white transition-colors relative group"
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  {item}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all"></span>
                </motion.a>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                onClick={() => {
                  setIsLogin(true)
                  setShowAuthModal(true)
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-sm font-semibold text-white shadow-lg transition-all"
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
              <ModernTrustBadge />

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight"
              >
                Trading Binary Option dengan
                <motion.span 
                  className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400"
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  style={{ backgroundSize: '200% 200%' }}
                >
                  Kecepatan Kilat
                </motion.span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg sm:text-xl text-gray-400 leading-relaxed"
              >
                Eksekusi order dalam <span className="text-emerald-400 font-semibold">milidetik</span>, 
                dapatkan profit hingga <span className="text-blue-400 font-semibold">95%</span>, 
                dan trading dengan <span className="text-cyan-400 font-semibold">percaya diri 24/7</span>.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-row gap-3 sm:gap-4"
              >
                <motion.button
                  onClick={() => {
                    setIsLogin(true)
                    setShowAuthModal(true)
                  }}
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl text-sm sm:text-lg font-semibold text-white transition-all shadow-lg"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span className="hidden sm:inline">Masuk untuk Trading</span>
                    <span className="sm:hidden">Masuk</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </motion.button>

                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="group flex-1 sm:flex-none px-4 sm:px-8 py-3 sm:py-4 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-gray-600 rounded-xl text-sm sm:text-lg font-semibold transition-all backdrop-blur-sm"
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
                transition={{ duration: 0.8, delay: 0.8 }}
                className="grid grid-cols-4 gap-4 pt-8"
              >
                {stats.map((stat, index) => (
                  <motion.div 
                    key={index}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="text-center cursor-default group"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1 + index * 0.1, type: "spring" }}
                    >
                      <stat.icon className="w-6 h-6 text-blue-400 mx-auto mb-2 group-hover:text-emerald-400 transition-colors" />
                      <div className="text-xl font-bold">{stat.value}</div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </motion.div>
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
                whileHover={{ scale: 1.02, rotateY: 2 }}
                transition={{ duration: 0.3 }}
                className="relative bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border border-gray-800/50 rounded-3xl p-6 shadow-2xl backdrop-blur-xl"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <motion.div 
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30"
                    >
                      <TrendingUp className="w-6 h-6 text-emerald-400" />
                    </motion.div>
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
                        animate={{ scale: [1, 1.3, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                      />
                      Live
                    </div>
                  </div>
                </div>

                <div className="bg-[#0a0e17] rounded-2xl mb-6 overflow-hidden border border-gray-800/50">
                  <AnimatedTradingChart />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-xl p-6 transition-all overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-emerald-500/20"
                      initial={{ y: "100%" }}
                      whileHover={{ y: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                    <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2 relative z-10 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-lg text-emerald-400 relative z-10">BELI</div>
                    <div className="text-xs text-gray-400 relative z-10">Profit +95%</div>
                  </motion.button>

                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-6 transition-all overflow-hidden"
                  >
                    <motion.div
                      className="absolute inset-0 bg-red-500/20"
                      initial={{ y: "100%" }}
                      whileHover={{ y: 0 }}
                      transition={{ duration: 0.3 }}
                    />
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
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: "spring" }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6"
            >
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-blue-400 rounded-full"
              />
              <span className="text-sm font-medium text-blue-400">Teknologi Terdepan</span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
              Mengapa Memilih Kami
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Platform trading dengan teknologi dan keamanan terbaik
            </p>
          </motion.div>

          {/* Desktop Grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group relative bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-6 hover:border-gray-700 transition-all duration-300 overflow-hidden cursor-pointer"
              >
                <motion.div 
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient}`}
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
                
                <div className="relative z-10">
                  <motion.div 
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                    className={`inline-flex w-14 h-14 ${feature.bgColor} ${feature.borderColor} border-2 rounded-2xl items-center justify-center mb-4`}
                  >
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </motion.div>

                  <h3 className="text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>

                  <motion.div 
                    className={`h-1 ${feature.bgColor} rounded-full mt-6`}
                    initial={{ width: 48 }}
                    whileHover={{ width: 80 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile Stack */}
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
                    if (index !== activeFeature) return null
                    
                    return (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.3 }}
                        className="mx-4"
                      >
                        <div className="relative h-full bg-[#0a0e17] border border-gray-800/50 rounded-xl p-5 overflow-hidden">
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
                    )
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
                        height: 6,
                      }}
                      className={`rounded-full ${
                        index === activeFeature ? feature.bgColor : 'bg-gray-700'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="cara-kerja" className="py-20 sm:py-32 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20"
          >
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6"
            >
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-purple-400 rounded-full"
              />
              <span className="text-sm font-medium text-purple-400">Mulai dalam 3 langkah mudah</span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
              Cara Kerja Platform
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Trading menjadi mudah dengan sistem otomatis kami
            </p>
          </motion.div>

          {/* Desktop Timeline */}
          <div className="hidden lg:block max-w-5xl mx-auto">
            <div className="relative">
              <motion.div 
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.5 }}
                className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2 bg-gradient-to-b from-purple-500/20 via-pink-500/20 to-blue-500/20 origin-top"
              />

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
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: i * 0.2 }}
                    className={`relative flex items-center ${step.side === 'right' ? 'flex-row-reverse' : ''}`}
                  >
                    <div className={`w-[calc(50%-3rem)] ${step.side === 'left' ? 'mr-auto' : 'ml-auto'}`}>
                      <motion.div 
                        whileHover={{ scale: 1.02, y: -5 }}
                        className={`bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-8 hover:border-${step.color}-500/30 transition-all`}
                      >
                        <div className="flex items-start gap-4">
                          <motion.div 
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.6 }}
                            className={`w-12 h-12 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-xl flex items-center justify-center flex-shrink-0`}
                          >
                            <step.icon className={`w-6 h-6 text-${step.color}-400`} />
                          </motion.div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed mb-4">{step.desc}</p>
                            <div className="flex flex-wrap gap-2">
                              {step.tags.map((tag, j) => (
                                <motion.span
                                  key={j}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  whileInView={{ opacity: 1, scale: 1 }}
                                  viewport={{ once: true }}
                                  transition={{ delay: 0.6 + j * 0.1 }}
                                  whileHover={{ scale: 1.05 }}
                                  className={`px-3 py-1 bg-${step.color}-500/10 border border-${step.color}-500/20 rounded-full text-xs text-${step.color}-400`}
                                >
                                  {tag}
                                </motion.span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <motion.div 
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.2, type: "spring" }}
                      className="absolute left-1/2 -translate-x-1/2 z-10"
                    >
                      <div className="relative w-16 h-16">
                        <motion.div 
                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                          className={`absolute inset-0 bg-${step.color}-500/20 rounded-full`}
                        />
                        <div className={`absolute inset-2 bg-[#0a0e17] rounded-full border-2 border-${step.color}-500/50 flex items-center justify-center`}>
                          <span className={`text-xl font-bold text-${step.color}-400`}>{step.num}</span>
                        </div>
                      </div>
                    </motion.div>
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-4 relative"
              >
                {i < 2 && (
                  <motion.div 
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="absolute left-7 top-16 w-px h-6 bg-gray-800 origin-top"
                  />
                )}
                
                <div className="flex-shrink-0">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                    className={`relative w-14 h-14 bg-${step.color}-500/10 border border-${step.color}-500/30 rounded-full flex items-center justify-center`}
                  >
                    <span className={`text-lg font-bold text-${step.color}-400`}>{step.num}</span>
                  </motion.div>
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
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimoni" className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <motion.div 
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring" }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-6"
            >
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
              />
              <span className="text-sm font-medium text-emerald-400">Testimoni Trader</span>
            </motion.div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6 tracking-tight">
              Dipercaya Ribuan Trader
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Lihat apa kata trader sukses tentang kami
            </p>
          </motion.div>

          {/* Desktop */}
          <div className="hidden sm:block max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTestimonial}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="relative bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-12"
              >
                <div className="text-center">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", duration: 0.6 }}
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

                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl text-gray-200 mb-8 leading-relaxed"
                  >
                    "{testimonials[activeTestimonial].content}"
                  </motion.p>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-6 mb-6"
                  >
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
                  </motion.div>

                  <div className="pt-6 border-t border-gray-800/50">
                    <div className="font-bold text-lg mb-1">
                      {testimonials[activeTestimonial].name}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {testimonials[activeTestimonial].role}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, index) => (
                <motion.button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  className="transition-all duration-300"
                >
                  <motion.div 
                    animate={{
                      width: index === activeTestimonial ? 32 : 8,
                      height: 8,
                    }}
                    className={`rounded-full ${
                      index === activeTestimonial 
                        ? 'bg-gradient-to-r from-blue-500 to-emerald-500' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
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
                className="mx-4 bg-[#0a0e17] border border-gray-800/50 rounded-2xl p-6"
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

                <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-gray-800/50">
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
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
                className="w-10 h-10 bg-[#1e293b] hover:bg-[#334155] rounded-lg flex items-center justify-center transition-all border border-gray-700"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>

              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <motion.div
                      animate={{
                        width: index === activeTestimonial ? 32 : 8,
                        height: 8,
                      }}
                      className={`rounded-full ${
                        index === activeTestimonial 
                          ? 'bg-gradient-to-r from-blue-500 to-emerald-500' 
                          : 'bg-gray-700'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
                className="w-10 h-10 bg-[#1e293b] hover:bg-[#334155] rounded-lg flex items-center justify-center transition-all border border-gray-700"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Payment Methods */}
      <section className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative bg-[#0a0e17] border border-gray-800/50 rounded-3xl overflow-hidden"
          >
            {/* Animated Grid Background */}
            <div className="absolute inset-0">
              <motion.div 
                animate={{ 
                  backgroundPosition: ['0px 0px', '40px 40px'],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0" 
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px'
                }}
              />
              
              <motion.div 
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.05, 0.1, 0.05],
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]"
              />
            </div>

            {/* Desktop Content */}
            <div className="hidden sm:block relative z-10 px-16 py-20 text-center">
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring" }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-8"
              >
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                />
                <span className="text-sm font-medium text-blue-400">Platform Trading Terpercaya</span>
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-5xl font-bold mb-6 tracking-tight"
              >
                Mulai Trading Hari Ini
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-lg text-gray-400 mb-10 max-w-xl mx-auto"
              >
                Bergabung dengan 50.000+ trader profesional di seluruh dunia
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <motion.button
                  onClick={() => {
                    setIsLogin(true)
                    setShowAuthModal(true)
                  }}
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-semibold shadow-lg transition-all"
                >
                  <span>Masuk Sekarang</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-gray-800/50"
              >
                {[
                  { label: 'Trader Aktif', value: '50K+' },
                  { label: 'Volume Harian', value: '$2.5M' },
                  { label: 'Max Profit', value: '95%' }
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                    whileHover={{ scale: 1.1, y: -5 }}
                    className="text-center"
                  >
                    <div className="text-2xl font-bold mb-1">{stat.value}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Mobile Content */}
            <div className="sm:hidden relative z-10 p-8 text-center">
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6"
              >
                <div className="w-1 h-1 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-blue-400">Platform Terpercaya</span>
              </motion.div>

              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-3xl font-bold mb-4 tracking-tight"
              >
                Mulai Trading<br />Hari Ini
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-sm text-gray-400 mb-8"
              >
                Bergabung dengan 50.000+ trader profesional
              </motion.p>

              <motion.button
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                onClick={() => {
                  setIsLogin(true)
                  setShowAuthModal(true)
                }}
                whileTap={{ scale: 0.95 }}
                className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold shadow-lg"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>

              <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-gray-800/50">
                {[
                  { label: 'Trader', value: '50K+' },
                  { label: 'Volume', value: '$2.5M' },
                  { label: 'Profit', value: '95%' }
                ].map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-xl font-bold mb-0.5">{stat.value}</div>
                    <div className="text-[10px] text-gray-500">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <PaymentMethods />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <EnhancedFooter />

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" 
              onClick={() => setShowAuthModal(false)}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-gradient-to-b from-[#0f1419] to-[#0a0e17] z-50 shadow-2xl overflow-y-auto"
            >
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
                <div className="flex gap-2 p-1 bg-[#0a0e17] rounded-xl mb-6">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      isLogin
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      !isLogin
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
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

                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    className="w-full px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg text-lg font-semibold text-white transition-all shadow-lg disabled:opacity-50 mt-6"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="rounded-full h-5 w-5 border-b-2 border-white"
                        />
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
                    <div className="w-full border-t border-gray-800"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#0f1419] text-gray-400">Atau lanjutkan dengan</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0e17] border border-gray-800 rounded-lg hover:bg-[#1a1f2e] transition-colors"
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
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-[#0a0e17] border border-gray-800 rounded-lg hover:bg-[#1a1f2e] transition-colors"
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
                      { icon: '✓', text: 'Akun demo gratis $10,000', color: 'emerald' },
                      { icon: '✓', text: 'Tanpa kartu kredit', color: 'blue' },
                      { icon: '✓', text: 'Dukungan pelanggan 24/7', color: 'purple' }
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                        className="flex items-center gap-3 text-sm"
                      >
                        <div className={`w-6 h-6 bg-${item.color}-500/20 rounded-lg flex items-center justify-center`}>
                          <span className={`text-${item.color}-400 font-bold`}>{item.icon}</span>
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