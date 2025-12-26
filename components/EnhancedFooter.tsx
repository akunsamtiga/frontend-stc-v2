'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
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
    { icon: Facebook, href: '#', label: 'Facebook', color: 'hover:text-blue-400' },
    { icon: Twitter, href: '#', label: 'Twitter', color: 'hover:text-blue-400' },
    { icon: Instagram, href: '#', label: 'Instagram', color: 'hover:text-pink-400' },
    { icon: Linkedin, href: '#', label: 'LinkedIn', color: 'hover:text-blue-500' },
    { icon: Youtube, href: '#', label: 'YouTube', color: 'hover:text-red-500' },
  ]

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <footer className="relative bg-[#0a0e17] border-t border-white/5 overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        {/* Main Content */}
        <div className="py-12 sm:py-16">
          <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
            {/* Brand Column */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-2"
            >
              <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="relative w-10 h-10 flex-shrink-0"
                >
                  <Image
                    src="/stc-logo.png"
                    alt="STC AutoTrade"
                    fill
                    className="object-contain rounded-md"
                    priority
                  />
                </motion.div>
                <div>
                  <span className="text-lg font-bold text-white">STC AutoTrade</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                    />
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider">Live Trading</span>
                  </div>
                </div>
              </Link>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-sm text-gray-400 leading-relaxed mb-6"
              >
                Platform trading binary option profesional dengan teknologi terdepan dan keamanan maksimal.
              </motion.p>

              {/* Newsletter Form */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  Subscribe to Newsletter
                </label>
                <form onSubmit={handleSubscribe}>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      disabled={loading}
                    />
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/10 hover:bg-white/20 rounded-md flex items-center justify-center transition-colors disabled:opacity-50"
                      aria-label="Subscribe"
                    >
                      {loading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </motion.button>
                  </div>
                </form>
              </motion.div>

              {/* Social Links */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-3"
              >
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ scale: 1.2, y: -3 }}
                    whileTap={{ scale: 0.9 }}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-gray-400 ${social.color} transition-all`}
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4" />
                  </motion.a>
                ))}
              </motion.div>
            </motion.div>

            {/* Links Columns - Desktop Only */}
            {Object.entries(footerLinks).map(([key, links], columnIndex) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 * (columnIndex + 1), duration: 0.6 }}
                className="hidden md:block"
              >
                <h4 className="text-sm font-semibold mb-4 text-gray-200 capitalize">{key}</h4>
                <ul className="space-y-2.5">
                  {links.map((link, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 * (columnIndex + 1) + 0.05 * index }}
                    >
                      <motion.a
                        href={link.href}
                        whileHover={{ x: 3, color: '#ffffff' }}
                        className="text-sm text-gray-400 transition-colors inline-block"
                      >
                        {link.label}
                      </motion.a>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Mobile Accordion */}
          <div className="md:hidden mt-8 space-y-3">
            {Object.entries(footerLinks).map(([key, links], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-white/5 pb-3 last:border-0"
              >
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between text-left py-2"
                >
                  <span className="text-sm font-semibold text-gray-200 capitalize">{key}</span>
                  <motion.div
                    animate={{ rotate: expandedSection === key ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {expandedSection === key && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <ul className="mt-3 space-y-2 pl-2">
                        {links.map((link, linkIndex) => (
                          <motion.li
                            key={linkIndex}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: linkIndex * 0.05 }}
                          >
                            <a
                              href={link.href}
                              className="text-sm text-gray-400 hover:text-white transition-colors inline-block py-1"
                            >
                              {link.label}
                            </a>
                          </motion.li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-6 border-t border-white/5"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500 text-center md:text-left">
              © {new Date().getFullYear()} STC AutoTrade. All rights reserved.
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>SSL Secured</span>
              </motion.div>
              <div className="w-px h-3 bg-white/10"></div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-blue-400" />
                <span>Licensed</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Risk Warning */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="pb-6"
        >
          <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Shield className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              </motion.div>
              <div className="flex-1">
                <h5 className="text-xs font-semibold text-yellow-400 mb-1">Risk Warning</h5>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Trading involves risk. Only invest what you can afford to lose. Past performance doesn't guarantee future results.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}