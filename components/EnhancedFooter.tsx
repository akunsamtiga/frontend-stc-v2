'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CaretDown, CaretUp } from 'phosphor-react'
import { toast } from 'sonner'

// ─── Inline SVG icons — menghilangkan 5 HTTP request ke cdn.simpleicons.org ───
// Sebelumnya setiap ikon memicu fetch eksternal yang memperlambat LCP & TBT.
const IconFacebook = () => (
  <svg viewBox="0 0 24 24" fill="#60a5fa" className="w-5 h-5" aria-hidden="true">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
  </svg>
)

const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="url(#ig-gradient)" className="w-5 h-5" aria-hidden="true">
    <defs>
      <linearGradient id="ig-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#f09433" />
        <stop offset="25%" stopColor="#e6683c" />
        <stop offset="50%" stopColor="#dc2743" />
        <stop offset="75%" stopColor="#cc2366" />
        <stop offset="100%" stopColor="#bc1888" />
      </linearGradient>
    </defs>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
)

const IconTelegram = () => (
  <svg viewBox="0 0 24 24" fill="#38bdf8" className="w-5 h-5" aria-hidden="true">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
)

const IconYouTube = () => (
  <svg viewBox="0 0 24 24" fill="#f87171" className="w-5 h-5" aria-hidden="true">
    <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
  </svg>
)

const IconTikTok = () => (
  <svg viewBox="0 0 24 24" fill="#d1d5db" className="w-5 h-5" aria-hidden="true">
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
  </svg>
)

export default function EnhancedFooter() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const footerLinks = {
    platform: [
      { label: 'Status', href: '/status' },
      { label: 'Tentang Kami', href: '/about' },
      { label: 'Pusat Bantuan', href: '/help-center' },
    ],
    legal: [
      { label: 'Kebijakan AML', href: '/documents/aml_policy_stockity.en.pdf' },
      { label: 'Perjanjian Klien', href: '/agreement' },
      { label: 'Perjanjian Copy Trading', href: '/copytrading-agreement' },
    ],
  }

  const socialLinks = [
    {
      href: 'https://www.facebook.com/profile.php?id=61576277923484',
      label: 'Facebook',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      hover: 'hover:bg-blue-500/20 hover:border-blue-400/40 hover:shadow-blue-500/20',
      Icon: IconFacebook,
    },
    {
      href: 'https://www.instagram.com/stockity_id/',
      label: 'Instagram',
      bg: 'bg-pink-500/10',
      border: 'border-pink-500/20',
      hover: 'hover:bg-pink-500/20 hover:border-pink-400/40 hover:shadow-pink-500/20',
      Icon: IconInstagram,
    },
    {
      href: 'https://t.me/+gj1bIkhkGRBhNzIy',
      label: 'Telegram',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
      hover: 'hover:bg-sky-500/20 hover:border-sky-400/40 hover:shadow-sky-500/20',
      Icon: IconTelegram,
    },
    {
      href: 'https://www.youtube.com/@Stockity_channel',
      label: 'YouTube',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      hover: 'hover:bg-red-500/20 hover:border-red-400/40 hover:shadow-red-500/20',
      Icon: IconYouTube,
    },
    {
      href: 'https://www.tiktok.com/@stockity_indonesian',
      label: 'TikTok',
      bg: 'bg-white/5',
      border: 'border-white/10',
      hover: 'hover:bg-white/10 hover:border-white/20 hover:shadow-white/10',
      Icon: IconTikTok,
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

              {/* Social — ikon inline SVG, nol request HTTP eksternal */}
              <div className="flex items-center gap-2">
                {socialLinks.map(({ href, label, bg, border, hover, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className={`
                      group relative w-10 h-10 flex items-center justify-center rounded-xl
                      ${bg} ${border} ${hover}
                      border backdrop-blur-sm
                      transition-all duration-300 ease-out
                      hover:scale-110 hover:-translate-y-0.5 hover:shadow-lg
                    `}
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:block">
              <h4 className="text-sm font-semibold mb-4 text-gray-200">Platform</h4>
              <ul className="space-y-2.5">
                {footerLinks.platform.map((link) => (
                  <li key={link.label}>
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
                {footerLinks.legal.map((link) => (
                  <li key={link.label}>
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
                    {links.map((link) => (
                      <li key={link.label}>
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
                loading="lazy"
              />
              <div className="w-px h-8 bg-gray-800" />
              <Image
                src="/license.webp"
                alt="Licensed"
                width={35}
                height={35}
                className="object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}