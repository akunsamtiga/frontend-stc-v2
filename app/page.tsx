'use client'

import { useState, useEffect } from 'react'
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
  Smartphone,
  Award,
  Users,
  DollarSign,
  CheckCircle,
  ArrowRight,
  PlayCircle,
  Star,
  Globe,
  Lock,
  TrendingDown,
  LineChart,
  PieChart,
  Target,
  ChevronRight
} from 'lucide-react'

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
    { label: 'Active Users', value: '50,000+', icon: Users },
    { label: 'Daily Trades', value: '1M+', icon: TrendingUp },
    { label: 'Success Rate', value: '87%', icon: Target },
    { label: 'Countries', value: '150+', icon: Globe },
  ]

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast Execution',
      description: 'Execute trades in milliseconds with our cutting-edge technology'
    },
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: 'Your funds are protected with advanced encryption and security protocols'
    },
    {
      icon: BarChart3,
      title: 'Real-Time Analytics',
      description: 'Access live market data and advanced charting tools'
    },
    {
      icon: Smartphone,
      title: 'Trade Anywhere',
      description: 'Seamless experience across desktop, tablet, and mobile devices'
    },
    {
      icon: Award,
      title: 'Up to 85% Profit',
      description: 'Industry-leading profit rates on successful trades'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Expert support team available around the clock'
    },
  ]

  const steps = [
    {
      number: '01',
      title: 'Create Account',
      description: 'Sign up in less than 2 minutes and verify your account'
    },
    {
      number: '02',
      title: 'Fund Your Account',
      description: 'Deposit funds securely using multiple payment methods'
    },
    {
      number: '03',
      title: 'Start Trading',
      description: 'Choose your asset, predict the direction, and place your trade'
    },
    {
      number: '04',
      title: 'Earn Profits',
      description: 'Watch your profits grow with every successful trade'
    },
  ]

  const testimonials = [
    {
      name: 'Ahmad Rizki',
      role: 'Professional Trader',
      content: 'STC AutoTrade has completely changed my trading experience. The platform is intuitive, fast, and reliable. I\'ve been profitable for 6 months straight!',
      rating: 5,
      avatar: '👨‍💼'
    },
    {
      name: 'Siti Nurhaliza',
      role: 'Part-Time Trader',
      content: 'As a beginner, I was worried about trading. But STC AutoTrade\'s simple interface and educational resources helped me learn quickly. Highly recommended!',
      rating: 5,
      avatar: '👩‍💻'
    },
    {
      name: 'Budi Santoso',
      role: 'Experienced Investor',
      content: 'I\'ve tried many platforms, but STC AutoTrade stands out with its speed, security, and excellent customer support. The profit rates are unbeatable!',
      rating: 5,
      avatar: '👨‍🎓'
    },
  ]

  if (user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-[#1e40af] to-[#047857] rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#1e40af] to-[#047857]">
                STC AutoTrade
              </span>
            </div>

            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Reviews</a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setIsLogin(true)
                  setShowAuthModal(true)
                }}
                className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsLogin(false)
                  setShowAuthModal(true)
                }}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-[#1e40af] to-[#047857] hover:from-[#1e3a8a] hover:to-[#065f46] rounded-lg text-sm sm:text-base font-semibold text-white transition-all shadow-lg hover:shadow-xl"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden">
        {/* Background Effects - DARKER */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1e40af]/10 via-[#047857]/10 to-transparent"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#1e40af]/30 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#047857]/30 rounded-full blur-[120px]"></div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e40af]/20 border border-[#1e40af]/30 rounded-full mb-6 sm:mb-8">
              <Award className="w-4 h-4 text-[#2563eb]" />
              <span className="text-sm font-medium">Trusted by 50,000+ traders worldwide</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
              Trade Binary Options with
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-[#1e40af] via-[#047857] to-[#16a34a]">
                Confidence & Speed
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
              Join the future of trading with our professional platform. Execute trades in milliseconds, 
              earn up to 85% profit, and trade with confidence 24/7.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 sm:mb-16">
              <button
                onClick={() => {
                  setIsLogin(false)
                  setShowAuthModal(true)
                }}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#1e40af] to-[#047857] hover:from-[#1e3a8a] hover:to-[#065f46] rounded-xl text-lg font-semibold text-white transition-all shadow-2xl hover:shadow-[#1e40af]/50 hover:scale-105 flex items-center justify-center gap-2"
              >
                Start Trading Now
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-gray-600 rounded-xl text-lg font-semibold transition-all flex items-center justify-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Watch Demo
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="bg-background-secondary/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 sm:p-6 hover:border-[#1e40af]/40 transition-colors">
                  <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-[#2563eb] mx-auto mb-2 sm:mb-3" />
                  <div className="text-2xl sm:text-3xl font-bold mb-1">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-32 bg-background-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Why Choose <span className="text-gradient-dark">STC AutoTrade</span>?
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              Experience the most advanced binary options trading platform with features designed for your success
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group bg-background-secondary border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-[#1e40af]/50 transition-all hover:shadow-2xl hover:shadow-[#1e40af]/10 hover:-translate-y-1"
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1e40af]/20 rounded-xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-[#1e40af]/30 transition-colors">
                  <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-[#2563eb]" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Start Trading in <span className="text-gradient-dark">4 Easy Steps</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              Get started with STC AutoTrade in minutes and begin your journey to financial freedom
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#1e40af]/50 to-[#047857]/50"></div>
                )}
                
                <div className="relative bg-background-secondary border border-gray-800 rounded-2xl p-6 sm:p-8 hover:border-[#1e40af]/50 transition-all">
                  <div className="absolute -top-4 left-6 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-[#1e40af] to-[#047857] rounded-xl flex items-center justify-center text-xl sm:text-2xl font-bold shadow-lg">
                    {step.number}
                  </div>

                  <div className="mt-8">
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{step.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12 sm:mt-16">
            <button
              onClick={() => {
                setIsLogin(false)
                setShowAuthModal(true)
              }}
              className="px-8 py-4 bg-gradient-to-r from-[#1e40af] to-[#047857] hover:from-[#1e3a8a] hover:to-[#065f46] rounded-xl text-lg font-semibold text-white transition-all shadow-xl hover:shadow-2xl hover:scale-105 inline-flex items-center gap-2"
            >
              Create Free Account
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Platform Showcase */}
      <section className="py-20 sm:py-32 bg-gradient-to-b from-background-secondary/30 to-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                Professional Trading Platform
              </h2>
              <p className="text-lg sm:text-xl text-gray-400 mb-8">
                Experience a trading platform built for speed, accuracy, and ease of use. 
                With real-time charts, advanced analytics, and instant execution, you have 
                everything you need to succeed.
              </p>

              <div className="space-y-4">
                {[
                  { icon: LineChart, text: 'Advanced charting tools' },
                  { icon: Lock, text: 'Secure and encrypted' },
                  { icon: Zap, text: 'Lightning-fast execution' },
                  { icon: PieChart, text: 'Portfolio analytics' },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#1e40af]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-[#2563eb]" />
                    </div>
                    <span className="text-lg">{item.text}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setIsLogin(false)
                  setShowAuthModal(true)
                }}
                className="mt-8 px-8 py-4 bg-white/5 hover:bg-white/10 border border-gray-700 hover:border-[#1e40af]/50 rounded-xl text-lg font-semibold transition-all inline-flex items-center gap-2"
              >
                Explore Platform
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[#1e40af]/30 to-[#047857]/30 rounded-3xl blur-3xl"></div>
              <div className="relative bg-background-secondary border border-gray-800 rounded-3xl p-4 shadow-2xl">
                <div className="bg-background rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#059669]/20 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-[#059669]" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">EUR/USD</div>
                        <div className="text-2xl font-bold font-mono">1.0856</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#059669] text-sm">+0.23%</div>
                      <div className="text-xs text-gray-400">Live</div>
                    </div>
                  </div>

                  <div className="h-48 bg-background-tertiary rounded-xl mb-6 flex items-end justify-around p-4">
                    {[40, 65, 45, 80, 55, 90, 70, 85, 60, 95].map((height, i) => (
                      <div key={i} className="w-full mx-1 bg-gradient-to-t from-[#059669]/50 to-[#059669] rounded-t" style={{ height: `${height}%` }}></div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#059669]/10 border border-[#059669]/30 rounded-xl p-4 text-center">
                      <TrendingUp className="w-6 h-6 text-[#059669] mx-auto mb-2" />
                      <div className="font-semibold">BUY</div>
                    </div>
                    <div className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-xl p-4 text-center">
                      <TrendingDown className="w-6 h-6 text-[#dc2626] mx-auto mb-2" />
                      <div className="font-semibold">SELL</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 sm:py-32 bg-background-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Trusted by <span className="text-gradient-dark">Thousands</span>
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
              See what our traders are saying about their experience with STC AutoTrade
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="relative bg-background-secondary border border-gray-800 rounded-3xl p-8 sm:p-12">
              <div className="text-center">
                <div className="text-6xl mb-6">{testimonials[activeTestimonial].avatar}</div>
                
                <div className="flex justify-center gap-1 mb-6">
                  {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                <p className="text-lg sm:text-xl text-gray-300 mb-6 leading-relaxed">
                  "{testimonials[activeTestimonial].content}"
                </p>

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
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === activeTestimonial 
                        ? 'bg-[#1e40af] w-8' 
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="relative bg-gradient-to-r from-[#1e40af]/30 via-[#047857]/30 to-[#16a34a]/30 border border-[#1e40af]/40 rounded-3xl p-8 sm:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#1e40af]/10 to-[#047857]/10 blur-3xl"></div>
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
                Ready to Start Your Trading Journey?
              </h2>
              <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of successful traders and start earning profits today. 
                Get started in less than 2 minutes!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  onClick={() => {
                    setIsLogin(false)
                    setShowAuthModal(true)
                  }}
                  className="w-full sm:w-auto px-8 py-4 bg-white text-background hover:bg-gray-100 rounded-xl text-lg font-semibold transition-all shadow-xl hover:shadow-2xl inline-flex items-center justify-center gap-2"
                >
                  Create Free Account
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-lg font-semibold transition-all">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background-secondary border-t border-gray-800 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#1e40af] to-[#047857] rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">STC AutoTrade</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Professional binary options trading platform for traders worldwide.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Trading</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Assets</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Analytics</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile App</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Risk Warning</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Licenses</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              © 2025 STC AutoTrade. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Shield className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Lock className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-background-secondary border border-gray-700 rounded-2xl max-w-md w-full p-6 sm:p-8 animate-scale-in">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                {isLogin ? 'Welcome Back' : 'Get Started'}
              </h2>
              <p className="text-gray-400">
                {isLogin ? 'Sign in to continue trading' : 'Create your account in seconds'}
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
                  className="w-full bg-background-tertiary border-gray-600 px-4 py-3 rounded-lg"
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
                  className="w-full bg-background-tertiary border-gray-600 px-4 py-3 rounded-lg"
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary py-3 text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </span>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                disabled={loading}
                className="text-[#2563eb] hover:text-[#1e40af] transition-colors disabled:opacity-50"
              >
                {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>

            <button
              onClick={() => setShowAuthModal(false)}
              disabled={loading}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>

            {isLogin && (
              <div className="mt-6 p-4 bg-background rounded-lg border border-gray-700">
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
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
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

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }

        .text-gradient-dark {
          background: linear-gradient(135deg, #1e40af 0%, #047857 50%, #16a34a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  )
}