'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  CaretDown,
  CaretUp,
} from 'phosphor-react'
import { toast } from 'sonner'

export default function EnhancedFooter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const handleSubscribe = () => {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubscribe()
    }
  }

  const footerLinks = {
    platform: [
      { label: 'Status', href: 'https://stockity.id/information/pricing' },
      { label: 'Tentang Kami', href: 'https://stockity.id/information/about' },
      { label: 'Pusat Bantuan', href: 'https://supportnow.zendesk.com/hc/id?utm_source=hc_burger_menu&utm_medium=referral&utm_campaign=not_logged_in' },
      { label: 'Turnamen', href: 'https://stockity.id/information/tournaments' },
    ],
    legal: [
      { label: 'Kebijakan AML', href: 'https://stockity.id/id/static/aml-policy-stockity.pdf' },
      { label: 'Perjanjian Klien', href: 'https://stockity.id/information/agreement' },
      { label: 'Perjanjian Copy Trading', href: 'https://stockity.id/information/copy-trading-agreement' },
    ],
  }

  const socialLinks = [
    {
      href: 'https://www.facebook.com/profile.php?id=61576277923484',
      label: 'Facebook',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      hoverBg: 'hover:bg-blue-500/20',
      hoverBorder: 'hover:border-blue-400/40',
      glow: 'hover:shadow-blue-500/20',
      icon: 'https://cdn.simpleicons.org/facebook/60a5fa',
    },
    {
      href: 'https://www.instagram.com/stockity_id/',
      label: 'Instagram',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
      hoverBg: 'hover:bg-pink-500/20',
      hoverBorder: 'hover:border-pink-400/40',
      glow: 'hover:shadow-pink-500/20',
      icon: 'https://cdn.simpleicons.org/instagram/f472b6',
    },
    {
      href: 'https://t.me/+gj1bIkhkGRBhNzIy',
      label: 'Telegram',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      hoverBg: 'hover:bg-sky-500/20',
      hoverBorder: 'hover:border-sky-400/40',
      glow: 'hover:shadow-sky-500/20',
      icon: 'https://cdn.simpleicons.org/telegram/38bdf8',
    },
    {
      href: 'https://www.youtube.com/@Stockity_channel',
      label: 'YouTube',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      hoverBg: 'hover:bg-red-500/20',
      hoverBorder: 'hover:border-red-400/40',
      glow: 'hover:shadow-red-500/20',
      icon: 'https://cdn.simpleicons.org/youtube/f87171',
    },
    {
      href: 'https://www.tiktok.com/@stockity_indonesian',
      label: 'TikTok',
      bg: 'bg-white/5',
      border: 'border-white/10',
      hoverBg: 'hover:bg-white/10',
      hoverBorder: 'hover:border-white/20',
      glow: 'hover:shadow-white/10',
      icon: 'https://cdn.simpleicons.org/tiktok/d1d5db',
    },
  ]

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <footer className="relative bg-[#0E111A] border-t border-gray-800/50 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="py-12 sm:py-16">
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand */}
            <div className="lg:col-span-2">
              <Link href="/" className="inline-flex items-center gap-3 mb-6 group">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <Image
                    src="/stc-logo1.png"
                    alt="Stouch"
                    fill
                    className="object-contain transform group-hover:scale-105 transition-transform rounded-md"
                    priority
                  />
                </div>
                <div>
                  <span className="text-lg font-bold text-white">Stouch.id</span>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[10px] tracking-wider">
                      <span className="text-gray-400 lowercase mr-1">powered by</span>
                      <span className="text-blue-400 font-bold">Stockity</span>
                    </span>
                  </div>
                </div>
              </Link>

              <p className="text-sm text-gray-400 leading-relaxed mb-2">
                Platform disediakan oleh Stockity yang merupakan broker online berlinsensi dan teregulasi.
              </p>
              <p className="text-xs text-gray-700 leading-relaxed lg:pr-12 mb-6">
                Beralamat di International Business Centre, Suite 8, Pot 820/104, Route Elluk, Port Vila, Vanuatu
              </p>
              {/* Social */}
              <div className="flex items-center gap-2">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`
                      group relative w-10 h-10 flex items-center justify-center rounded-xl
                      ${social.bg} ${social.border} ${social.hoverBg} ${social.hoverBorder}
                      border backdrop-blur-sm
                      transition-all duration-300 ease-out
                      hover:scale-110 hover:-translate-y-0.5
                      hover:shadow-lg ${social.glow}
                    `}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={social.icon}
                      alt={social.label}
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain"
                    />
                  </a>
                ))}
              </div>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:block">
              <h4 className="text-sm font-semibold mb-4 text-gray-200">Platform</h4>
              <ul className="space-y-2.5">
                {footerLinks.platform.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors inline-block"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden md:block">
              <h4 className="text-sm font-semibold mb-4 text-gray-200">Legal</h4>
              <ul className="space-y-2.5">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 hover:text-white transition-colors inline-block"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mobile Accordion */}
          <div className="md:hidden mt-8 space-y-3">
            {Object.entries(footerLinks).map(([key, links]) => (
              <div key={key} className="border-b border-gray-800/50 pb-3 last:border-0">
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full flex items-center justify-between text-left py-2"
                >
                  <span className="text-sm font-semibold text-gray-200 capitalize">{key}</span>
                  {expandedSection === key ? (
                    <CaretUp size={16} className="text-gray-400" />
                  ) : (
                    <CaretDown size={16} className="text-gray-400" />
                  )}
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    expandedSection === key ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
                >
                  <ul className="mt-3 space-y-2 pl-2">
                    {links.map((link, index) => (
                      <li key={index}>
                        <a
                          href={link.href}
                          className="text-sm text-gray-400 hover:text-white transition-colors inline-block py-1"
                        >
                          {link.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-1 pb-4 border-t border-gray-800/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500 text-center md:text-left">
              © 2022 - {new Date().getFullYear()} Stouch by Stockity. All rights reserved.
            </div>

            <div className="hidden md:flex items-center gap-4 text-xs text-gray-500">
              <Image
                src="/ssl.png"
                alt="SSL Secured"
                width={60}
                height={60}
                className="object-contain"
              />

              <div className="w-px h-8 bg-gray-800"></div>

              <Image
                src="/license.webp"
                alt="Licensed"
                width={35}
                height={35}
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}