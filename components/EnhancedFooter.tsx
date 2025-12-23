'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  Globe, 
  Shield, 
  Lock,
  Mail,
  MapPin,
  Phone,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  ArrowRight,
  CheckCircle,
  Award,
  Zap,
  Clock,
  CreditCard,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { toast } from 'sonner'

export default function EnhancedFooter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)
    setTimeout(() => {
      toast.success('Successfully subscribed to newsletter!')
      setEmail('')
      setLoading(false)
    }, 1000)
  }

  const footerLinks = {
    platform: [
      { label: 'Trading', href: '/trading' },
      { label: 'Assets', href: '#assets' },
      { label: 'Mobile App', href: '#mobile' },
      { label: 'API Docs', href: '#api' },
    ],
    company: [
      { label: 'About Us', href: '#about' },
      { label: 'Careers', href: '#careers' },
      { label: 'Blog', href: '#blog' },
      { label: 'Contact', href: '#contact' },
    ],
    resources: [
      { label: 'Help Center', href: '#help' },
      { label: 'Trading Guide', href: '#guide' },
      { label: 'Tutorials', href: '#tutorials' },
      { label: 'Community', href: '#community' },
    ],
    legal: [
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Risk Warning', href: '#risk' },
      { label: 'Licenses', href: '#licenses' },
    ],
  }

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' },
    { icon: Youtube, href: '#', label: 'YouTube' },
  ]

  const trustBadges = [
    { icon: Shield, text: 'SSL Secured' },
    { icon: Lock, text: 'Bank-Level Security' },
    { icon: Award, text: 'Licensed' },
    { icon: CheckCircle, text: 'Verified' },
  ]

  const features = [
    { icon: Zap, text: '0.01s' },
    { icon: Clock, text: '24/7' },
    { icon: CreditCard, text: 'Instant' },
    { icon: Globe, text: '150+' },
  ]

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <footer className="relative bg-gradient-to-b from-[#0a0e17] to-[#050810] border-t border-gray-800/50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Top Section - Newsletter */}
        <div className="py-12 sm:py-16 border-b border-gray-800/50">
          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Newsletter */}
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Stay Updated</h3>
                  <p className="text-sm text-gray-400">Get the latest trading insights</p>
                </div>
              </div>

              <form onSubmit={handleSubscribe} className="flex gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 bg-[#0f1419] border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-700 hover:border-gray-600 rounded-lg font-semibold text-white transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      Subscribe
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-[#0f1419] border border-gray-800/50 rounded-xl p-4 text-center hover:border-blue-500/30 transition-all"
                >
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <feature.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-xs font-medium text-gray-300">{feature.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile Layout - Simplified */}
          <div className="lg:hidden text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold">Stay Updated</h3>
                <p className="text-xs text-gray-400">Latest trading insights</p>
              </div>
            </div>

            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email"
                className="flex-1 bg-[#0f1419] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2.5 bg-[#1a1f2e] hover:bg-[#232936] border border-gray-700 rounded-lg font-medium text-white transition-all disabled:opacity-50"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12 sm:py-16">
          {/* Desktop Grid */}
          <div className="hidden lg:grid grid-cols-6 gap-8">
            {/* Brand Column */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                  STC AutoTrade
                </span>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Professional binary options trading platform. Fast, secure, and reliable.
              </p>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {trustBadges.map((badge, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
                    <badge.icon className="w-4 h-4 text-emerald-400" />
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-[#0f1419] border border-gray-800 rounded-lg flex items-center justify-center hover:bg-[#1a1f2e] hover:border-blue-500/30 transition-all"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            {Object.entries(footerLinks).map(([key, links], index) => (
              <div key={key}>
                <h4 className="text-sm font-bold mb-4 text-gray-300 capitalize">{key}</h4>
                <ul className="space-y-2.5">
                  {links.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Mobile Accordion */}
          <div className="lg:hidden space-y-3">
            {/* Brand */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                  STC AutoTrade
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                Professional binary options trading
              </p>

              {/* Social Links Mobile */}
              <div className="flex items-center justify-center gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="w-10 h-10 bg-[#0f1419] border border-gray-800 rounded-lg flex items-center justify-center hover:bg-[#1a1f2e] transition-all"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Accordion Sections */}
            {Object.entries(footerLinks).map(([key, links]) => (
              <div key={key} className="border border-gray-800/50 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between p-4 bg-[#0f1419] hover:bg-[#1a1f2e] transition-colors"
                >
                  <span className="text-sm font-bold capitalize">{key}</span>
                  {expandedSection === key ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>
                
                {expandedSection === key && (
                  <div className="p-4 pt-0 bg-[#0a0e17]">
                    <ul className="space-y-2">
                      {links.map((link, i) => (
                        <li key={i}>
                          <a
                            href={link.href}
                            className="text-sm text-gray-400 hover:text-blue-400 transition-colors block py-1"
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Info - Simplified for Mobile */}
        <div className="py-6 border-t border-gray-800/50">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-gray-400 text-xs">Location</div>
                <div className="font-medium text-gray-300 text-xs sm:text-sm">Jakarta, ID</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <div className="text-gray-400 text-xs">Email</div>
                <a href="mailto:support@stcautotrade.com" className="font-medium text-gray-300 hover:text-blue-400 transition-colors text-xs sm:text-sm">
                  support@stcautotrade.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <Phone className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div>
                <div className="text-gray-400 text-xs">Support</div>
                <a href="tel:+6281234567890" className="font-medium text-gray-300 hover:text-blue-400 transition-colors text-xs sm:text-sm">
                  +62 812-3456-7890
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-800/50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
              © {new Date().getFullYear()} STC AutoTrade. All rights reserved.
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-emerald-400" />
                <span>SSL</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-blue-400" />
                <span>PCI DSS</span>
              </div>
              <div className="flex items-center gap-1">
                <Award className="w-3 h-3 text-yellow-400" />
                <span>Licensed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Warning - Compact Mobile */}
        <div className="pb-6">
          <div className="bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/20 rounded-xl p-3 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <Shield className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-yellow-400 mb-1">Risk Warning</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Trading involves substantial risk. Only invest capital you can afford to lose.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}