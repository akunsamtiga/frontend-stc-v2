'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { LogOut, User, Settings, Wallet, Menu, X, TrendingUp } from 'lucide-react'
import { useState } from 'react'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  if (!user) return null

  const isActive = (path: string) => pathname === path

  const navLinks = [
    { href: '/trading', label: 'Trading' },
    { href: '/history', label: 'History' },
    { href: '/balance', label: 'Balance' },
  ]

  if (user.role === 'super_admin' || user.role === 'admin') {
    navLinks.push({ href: '/admin', label: 'Admin' })
  }

  return (
    <nav className="bg-[#0f1419] border-b border-gray-800/50 sticky top-0 z-40 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/trading" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="hidden sm:block font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              STC AutoTrade
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive(link.href) || (link.href === '/admin' && pathname.startsWith('/admin'))
                    ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-[#1a1f2e]'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop User Menu */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a1f2e] transition-all"
            >
              <div className="text-right">
                <div className="text-xs text-gray-400">{user.role}</div>
                <div className="text-sm font-medium truncate max-w-[150px]">{user.email}</div>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-[#1a1f2e] border border-gray-800/50 rounded-lg shadow-2xl py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-800/50">
                    <div className="text-sm font-medium truncate">{user.email}</div>
                    <div className="text-xs text-gray-400 mt-1 capitalize">{user.role.replace('_', ' ')}</div>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#232936] transition-all"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Profile Settings</span>
                  </Link>
                  <div className="border-t border-gray-800/50 mt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-all w-full text-left text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#1a1f2e] transition-colors"
            aria-label="Toggle menu"
          >
            {showMobileMenu ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed top-16 right-0 bottom-0 w-64 bg-[#0f1419] border-l border-gray-800/50 z-50 md:hidden overflow-y-auto animate-slide-left">
            <div className="p-4">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-800/50">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.email}</div>
                  <div className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 mb-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setShowMobileMenu(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-all',
                      isActive(link.href) || (link.href === '/admin' && pathname.startsWith('/admin'))
                        ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-[#1a1f2e]'
                    )}
                  >
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="pt-6 border-t border-gray-800/50 space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#1a1f2e] transition-all"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-sm">Profile Settings</span>
                </Link>
                <button
                  onClick={() => {
                    setShowMobileMenu(false)
                    handleLogout()
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 transition-all w-full text-left text-red-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slide-left {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }

        .animate-slide-left {
          animation: slide-left 0.3s ease-out;
        }
      `}</style>
    </nav>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}