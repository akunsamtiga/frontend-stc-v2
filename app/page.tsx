'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  Lock,
  TrendingDown,
  Target,
  ChevronRight,
  X,
  Sparkles,
  Activity,
  DollarSign
} from 'lucide-react'

// Live Trading Ticker Component
const LiveTradingTicker = () => {
  const [trades, setTrades] = useState([
    { user: 'Ahmad***', asset: 'EUR/USD', profit: 8500, time: '2s ago' },
    { user: 'Siti***', asset: 'BTC/USD', profit: 12300, time: '5s ago' },
    { user: 'Budi***', asset: 'IDX_STC', profit: 5800, time: '8s ago' },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      const names = ['Ahmad***', 'Siti***', 'Budi***', 'Rina***', 'Deni***', 'Maya***']
      const assets = ['EUR/USD', 'BTC/USD', 'IDX_STC', 'GBP/JPY', 'XAU/USD']
      
      const newTrade = {
        user: names[Math.floor(Math.random() * names.length)],
        asset: assets[Math.floor(Math.random() * assets.length)],
        profit: Math.floor(Math.random() * 15000) + 3000,
        time: 'just now'
      }

      setTrades(prev => [newTrade, ...prev.slice(0, 2)])
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="absolute top-24 right-8 w-72 bg-[#0a0e17]/95 backdrop-blur-xl border border-gray-800/50 rounded-2xl p-4 shadow-2xl z-10 animate-slide-in-right">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span className="text-xs font-semibold text-gray-300">Live Trades</span>
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
    // Initialize with random bars
    const initialBars = Array.from({ length: 30 }, () => Math.random() * 80 + 20)
    setBars(initialBars)

    // Update last bar every second
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
const FloatingPriceCard = ({ symbol, price, change, delay }: any) => (
  <div 
    className="absolute bg-[#0a0e17]/95 backdrop-blur-xl border border-gray-800/50 rounded-xl p-3 shadow-2xl animate-float"
    style={{ animationDelay: `${delay}s` }}
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

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
        toast.error('Invalid response from server')
        return
      }

      setAuth(userData, token)
      api.setToken(token)

      toast.success(response.message || 'Login successful!')
      router.replace('/trading')
    } catch (error: any) {
      const errorMessage = 
        error.response?.data?.error || 
        error.response?.data?.message ||
        error.message || 
        'Authentication failed'
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: 'Active Traders', value: '50K+', icon: Users },
    { label: 'Daily Volume', value: '$2.5M', icon: DollarSign },
    { label: 'Win Rate', value: '87%', icon: Target },
    { label: 'Countries', value: '150+', icon: Globe },
  ]

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Execute trades in milliseconds with zero lag',
      gradient: 'from-yellow-500/20 to-orange-500/20'
    },
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Military-grade encryption protects your funds',
      gradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Advanced charts and market insights',
      gradient: 'from-purple-500/20 to-pink-500/20'
    },
    {
      icon: Award,
      title: 'Up to 95% Profit',
      description: 'Industry-leading returns on trades',
      gradient: 'from-green-500/20 to-emerald-500/20'
    },
  ]

  const testimonials = [
    {
      name: 'Ahmad Rizki',
      role: 'Professional Trader',
      content: 'Game-changing platform! Fast, reliable, and profitable. I\'ve been consistently winning for 6 months.',
      rating: 5,
      avatar: '👨‍💼',
      profit: '+285%'
    },
    {
      name: 'Siti Nurhaliza',
      role: 'Part-Time Trader',
      content: 'As a beginner, the interface made trading easy. Great support and educational resources helped me succeed!',
      rating: 5,
      avatar: '👩‍💻',
      profit: '+142%'
    },
    {
      name: 'Budi Santoso',
      role: 'Experienced Investor',
      content: 'Best trading platform I\'ve used. Speed, security, and profit rates are unmatched in the industry.',
      rating: 5,
      avatar: '👨‍🎓',
      profit: '+378%'
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                  STC AutoTrade
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-[10px] text-gray-500">LIVE</span>
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all"></span>
              </a>
              <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                How It Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all"></span>
              </a>
              <a href="#testimonials" className="text-sm text-gray-400 hover:text-white transition-colors relative group">
                Reviews
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500 group-hover:w-full transition-all"></span>
              </a>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsLogin(true)
                  setShowAuthModal(true)
                }}
                className="hidden sm:block px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsLogin(false)
                  setShowAuthModal(true)
                }}
                className="relative px-6 py-2.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg text-sm font-semibold text-white shadow-lg overflow-hidden group"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
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
                <span className="text-sm font-medium">Trusted by 50,000+ traders</span>
              </div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold leading-tight">
                Trade Binary Options with
                <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400 animate-gradient">
                  Lightning Speed
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-400 leading-relaxed">
                Execute trades in <span className="text-emerald-400 font-semibold">milliseconds</span>, 
                earn up to <span className="text-blue-400 font-semibold">95% profit</span>, 
                and trade with <span className="text-cyan-400 font-semibold">confidence 24/7</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => {
                    setIsLogin(false)
                    setShowAuthModal(true)
                  }}
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl text-lg font-semibold text-white overflow-hidden shadow-2xl"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Start Trading Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                </button>

                <button className="group px-8 py-4 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-gray-600 rounded-xl text-lg font-semibold transition-all backdrop-blur-sm">
                  <span className="flex items-center gap-2">
                    <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Watch Demo
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
              {/* Live Trades Ticker */}
              <LiveTradingTicker />

              {/* Floating Price Cards */}
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
                {/* Header */}
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

                {/* Chart */}
                <div className="bg-[#0a0e17] rounded-2xl mb-6 overflow-hidden border border-gray-800/50">
                  <AnimatedTradingChart />
                </div>

                {/* Trade Buttons */}
                <div className="grid grid-cols-2 gap-4">
                  <button className="group relative bg-gradient-to-br from-emerald-500/20 to-green-500/20 hover:from-emerald-500/30 hover:to-green-500/30 border border-emerald-500/30 rounded-xl p-6 transition-all overflow-hidden">
                    <div className="absolute inset-0 bg-emerald-500/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2 relative z-10 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-lg text-emerald-400 relative z-10">CALL</div>
                    <div className="text-xs text-gray-400 relative z-10">+95% Profit</div>
                  </button>

                  <button className="group relative bg-gradient-to-br from-red-500/20 to-pink-500/20 hover:from-red-500/30 hover:to-pink-500/30 border border-red-500/30 rounded-xl p-6 transition-all overflow-hidden">
                    <div className="absolute inset-0 bg-red-500/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                    <TrendingDown className="w-8 h-8 text-red-400 mx-auto mb-2 relative z-10 group-hover:scale-110 transition-transform" />
                    <div className="font-bold text-lg text-red-400 relative z-10">PUT</div>
                    <div className="text-xs text-gray-400 relative z-10">+95% Profit</div>
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
              Why Choose <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">STC AutoTrade</span>?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience trading reimagined with cutting-edge technology
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-32 relative">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Trusted by <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Thousands</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See what successful traders say about us
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
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
                    {testimonials[activeTestimonial].profit} Returns
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
                    className={`h-2 rounded-full transition-all ${
                      index === activeTestimonial 
                        ? 'bg-gradient-to-r from-blue-500 to-emerald-500 w-8' 
                        : 'bg-gray-700 w-2 hover:bg-gray-600'
                    }`}
                  />
                ))}
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
                Ready to Start Your Trading Journey?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join 50,000+ successful traders. Start earning in less than 2 minutes!
              </p>

              <button
                onClick={() => {
                  setIsLogin(false)
                  setShowAuthModal(true)
                }}
                className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl text-lg font-semibold text-white shadow-2xl overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Create Free Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f1419] border-t border-gray-800/50 py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center text-gray-400 text-sm">
            <p>© 2025 STC AutoTrade. All rights reserved.</p>
            <div className="flex items-center justify-center gap-6 mt-4">
              <Globe className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
              <Shield className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
              <Lock className="w-5 h-5 hover:text-white transition-colors cursor-pointer" />
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#0f1419] border border-gray-800/50 rounded-2xl max-w-md w-full p-8 animate-scale-in backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
            
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold mb-2">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </h2>
              <p className="text-gray-400">
                {isLogin ? 'Sign in to continue trading' : 'Create your account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="w-full bg-[#0a0e17] border-gray-700 px-4 py-3 rounded-lg focus:border-blue-500 transition-colors"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={loading}
                  className="w-full bg-[#0a0e17] border-gray-700 px-4 py-3 rounded-lg focus:border-blue-500 transition-colors"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full relative px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg text-lg font-semibold text-white shadow-lg overflow-hidden group"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : (
                  <>
                    <span className="relative z-10">{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
                className="text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>

            {isLogin && (
              <div className="mt-6 p-4 bg-[#0a0e17] rounded-lg border border-gray-800/50">
                <div className="text-xs text-gray-400 mb-2">Demo Credentials:</div>
                <div className="text-xs font-mono space-y-1 text-gray-300">
                  <div>Email: superadmin@trading.com</div>
                  <div>Pass: SuperAdmin123!</div>
                </div>
              </div>
            )}
          </div>
        </div>
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

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
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