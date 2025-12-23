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
  CreditCard
} from 'lucide-react'
import { toast } from 'sonner'

export default function EnhancedFooter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }

    setLoading(true)
    // Simulate API call
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
      { label: 'Pricing', href: '#pricing' },
      { label: 'Features', href: '#features' },
    ],
    company: [
      { label: 'About Us', href: '#about' },
      { label: 'Careers', href: '#careers' },
      { label: 'Blog', href: '#blog' },
      { label: 'Press Kit', href: '#press' },
      { label: 'Contact', href: '#contact' },
      { label: 'Partners', href: '#partners' },
    ],
    resources: [
      { label: 'Help Center', href: '#help' },
      { label: 'Trading Guide', href: '#guide' },
      { label: 'Video Tutorials', href: '#tutorials' },
      { label: 'Webinars', href: '#webinars' },
      { label: 'Community', href: '#community' },
      { label: 'Status', href: '#status' },
    ],
    legal: [
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Cookie Policy', href: '#cookies' },
      { label: 'Risk Warning', href: '#risk' },
      { label: 'Licenses', href: '#licenses' },
      { label: 'Compliance', href: '#compliance' },
    ],
  }

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:text-blue-400' },
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:text-sky-400' },
    { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:text-pink-400' },
    { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:text-blue-500' },
    { icon: Youtube, href: '#', label: 'YouTube', color: 'hover:text-red-500' },
  ]

  const trustBadges = [
    { icon: Shield, text: 'SSL Secured' },
    { icon: Lock, text: 'Bank-Level Security' },
    { icon: Award, text: 'Licensed & Regulated' },
    { icon: CheckCircle, text: 'Verified Platform' },
  ]

  const features = [
    { icon: Zap, text: '0.01s Execution' },
    { icon: Clock, text: '24/7 Trading' },
    { icon: CreditCard, text: 'Instant Deposits' },
    { icon: Globe, text: '150+ Countries' },
  ]

  return (
    <footer className="relative bg-gradient-to-b from-[#0a0e17] to-[#050810] border-t border-gray-800/50 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Top Section - Newsletter & Features */}
        <div className="py-12 sm:py-16 border-b border-gray-800/50">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Newsletter */}
            <div className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-emerald-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                  <Mail className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Stay Updated</h3>
                  <p className="text-sm text-gray-400">Get the latest trading insights & market updates</p>
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
                  className="group relative px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg font-semibold text-white shadow-lg overflow-hidden disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <>
                        Subscribe
                        <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>
              </form>

              <p className="text-xs text-gray-500 mt-3">
                By subscribing, you agree to our Privacy Policy and consent to receive updates.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group bg-gradient-to-br from-[#0f1419] to-[#0a0e17] border border-gray-800/50 rounded-xl p-4 hover:border-blue-500/30 transition-all text-center"
                >
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-500/20 transition-colors">
                    <feature.icon className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-xs font-medium text-gray-300">{feature.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-3 lg:col-span-2 animate-fade-in-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    STC AutoTrade
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-gray-500">LIVE TRADING</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-400 leading-relaxed mb-6">
                Professional binary options trading platform. Fast, secure, and reliable. 
                Trade with confidence 24/7 with industry-leading execution speeds.
              </p>

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {trustBadges.map((badge, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-xs text-gray-400"
                  >
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
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 bg-[#0f1419] border border-gray-800 rounded-lg flex items-center justify-center hover:bg-[#1a1f2e] transition-all ${social.color} group`}
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links Columns */}
            <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h4 className="text-sm font-bold mb-4 text-gray-300">Platform</h4>
              <ul className="space-y-2.5">
                {footerLinks.platform.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-blue-400 transition-colors inline-flex items-center gap-1 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <h4 className="text-sm font-bold mb-4 text-gray-300">Company</h4>
              <ul className="space-y-2.5">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-blue-400 transition-colors inline-flex items-center gap-1 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <h4 className="text-sm font-bold mb-4 text-gray-300">Resources</h4>
              <ul className="space-y-2.5">
                {footerLinks.resources.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-blue-400 transition-colors inline-flex items-center gap-1 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <h4 className="text-sm font-bold mb-4 text-gray-300">Legal</h4>
              <ul className="space-y-2.5">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-blue-400 transition-colors inline-flex items-center gap-1 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Info Bar */}
        <div className="py-6 border-t border-b border-gray-800/50">
          <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="flex items-center gap-3 text-sm animate-fade-in-up">
              <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-gray-400 text-xs">Headquarters</div>
                <div className="font-medium text-gray-300">Jakarta, Indonesia</div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-gray-400 text-xs">Email</div>
                <a href="mailto:support@stcautotrade.com" className="font-medium text-gray-300 hover:text-blue-400 transition-colors">
                  support@stcautotrade.com
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="text-gray-400 text-xs">24/7 Support</div>
                <a href="tel:+6281234567890" className="font-medium text-gray-300 hover:text-blue-400 transition-colors">
                  +62 812-3456-7890
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500 text-center md:text-left animate-fade-in-up">
              <p className="mb-1">
                © {new Date().getFullYear()} STC AutoTrade. All rights reserved.
              </p>
              <p className="text-xs">
                Designed & Built with <span className="text-red-400">❤</span> in Indonesia
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-500 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>256-bit SSL</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" />
                <span>PCI DSS</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <span>ISO 27001</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-yellow-400" />
                <span>Licensed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Warning */}
        <div className="pb-6">
          <div className="bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/20 rounded-xl p-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-bold text-yellow-400 mb-1">Risk Warning</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Trading binary options involves substantial risk and may not be suitable for all investors. 
                  Past performance is not indicative of future results. Please ensure you fully understand the 
                  risks involved and seek independent financial advice if necessary. You should only invest 
                  capital you can afford to lose.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
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

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.05;
          }
          50% {
            opacity: 0.15;
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </footer>
  )
}