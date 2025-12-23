'use client'

import { useState } from 'react'
import { 
  TrendingUp, 
  Mail,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Shield,
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
      { label: 'Terms', href: '#terms' },
      { label: 'Privacy', href: '#privacy' },
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
        {/* Newsletter Section - Desktop */}
        <div className="hidden md:block py-12 sm:py-16 border-b border-gray-800/50">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
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
                  className="px-6 py-3 bg-[#1e293b] hover:bg-[#334155] rounded-lg font-semibold text-white transition-colors border border-gray-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <span className="flex items-center gap-2">
                      Subscribe
                      <Send className="w-4 h-4" />
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="py-12 sm:py-16">
          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand Column */}
            <div className="col-span-2 animate-fade-in-up">
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
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-[#0f1419] border border-gray-800 rounded-lg flex items-center justify-center hover:bg-[#1a1f2e] hover:border-blue-500/30 transition-all group"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors" />
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
                      className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                    >
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
                      className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                    >
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
                      className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                    >
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
                      className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile Accordion */}
          <div className="md:hidden space-y-4">
            {/* Brand */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                    STC AutoTrade
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-gray-500">LIVE</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                Professional binary options trading platform.
              </p>
            </div>

            {/* Newsletter - Mobile */}
            <div className="mb-6 pb-6 border-b border-gray-800/50">
              <form onSubmit={handleSubscribe} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full bg-[#0f1419] border border-gray-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-[#1e293b] hover:bg-[#334155] rounded-lg text-sm font-semibold text-white transition-colors border border-gray-700 disabled:opacity-50"
                >
                  {loading ? 'Subscribing...' : 'Subscribe to Newsletter'}
                </button>
              </form>
            </div>

            {/* Accordion Sections */}
            {Object.entries(footerLinks).map(([key, links]) => (
              <div key={key} className="border-b border-gray-800/50">
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between py-3 text-left"
                >
                  <span className="font-semibold text-gray-200 capitalize">{key}</span>
                  {expandedSection === key ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedSection === key && (
                  <ul className="pb-4 space-y-2">
                    {links.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-sm text-gray-400 hover:text-blue-400 transition-colors block py-1"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}

            {/* Social Links - Mobile */}
            <div className="pt-4">
              <h4 className="text-sm font-semibold mb-3 text-gray-300">Follow Us</h4>
              <div className="flex items-center gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-[#0f1419] border border-gray-800 rounded-lg flex items-center justify-center hover:bg-[#1a1f2e] hover:border-blue-500/30 transition-all"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5 text-gray-400" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-800/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500 text-center md:text-left">
              <p>© {new Date().getFullYear()} STC AutoTrade. All rights reserved.</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span>Licensed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Warning - Simplified for Mobile */}
        <div className="pb-6">
          <div className="bg-gradient-to-r from-yellow-500/5 to-orange-500/5 border border-yellow-500/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h5 className="text-xs font-bold text-yellow-400 mb-1">Risk Warning</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Trading involves risk. Only invest what you can afford to lose. Past performance doesn't guarantee future results.
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