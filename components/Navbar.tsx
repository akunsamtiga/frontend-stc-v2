'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Image from 'next/image'
import { 
  History,
  Wallet,
  Settings,
  LogOut,
  BarChart3,
  Shield,
  Menu,
  X,
  ChevronDown
} from 'lucide-react'

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

  const isActive = (path: string) => pathname === path

  const navLinks = [
    { path: '/trading', label: 'Trading', icon: BarChart3 },
    { path: '/history', label: 'Riwayat', icon: History },
    { path: '/balance', label: 'Saldo', icon: Wallet },
  ]

  if (!user) return null

  return (
    <nav className="bg-[#0f1419] border-b border-gray-800/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push('/trading')}>
            <div className="relative w-8 h-8 flex-shrink-0">
              <Image
                src="/stc-logo.png"
                alt="STC AutoTrade"
                fill
                className="object-contain transform group-hover:scale-110 transition-transform rounded-md"
                priority
              />
            </div>
            <div>
              <span className="font-bold text-lg text-white">
                STC AutoTrade
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.path}
                  onClick={() => router.push(link.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(link.path)
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1f2e]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </button>
              )
            })}

            {/* Admin Link */}
            {(user.role === 'super_admin' || user.role === 'admin') && (
              <button
                onClick={() => router.push('/admin')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname.startsWith('/admin')
                    ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-[#1a1f2e]'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}
          </div>

          {/* User Menu */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a1f2e] transition-all"
            >
              <div className="text-right">
                <div className="text-sm font-medium">{user.email}</div>
                <div className="text-xs text-gray-400">{user.role}</div>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold">{user.email[0].toUpperCase()}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#1a1f2e] border border-gray-800/50 rounded-lg shadow-2xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800/30">
                    <div className="text-sm font-medium truncate">{user.email}</div>
                    <div className="text-xs text-gray-400 mt-1 capitalize">{user.role.replace('_', ' ')}</div>
                  </div>
                  <button
                    onClick={() => {
                      router.push('/profile')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#232936] transition-colors text-left"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm">Pengaturan</span>
                  </button>
                  <div className="border-t border-gray-800/30">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-left text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm">Keluar</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="md:hidden p-2 rounded-lg hover:bg-[#1a1f2e] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/80 z-50 animate-fade-in" 
            onClick={() => setShowMobileMenu(false)} 
          />
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-[#0f1419] border-l border-gray-800/50 z-50 p-4 animate-slide-left overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">Menu</h3>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-[#1a1f2e] rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="mb-6 p-4 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-lg font-bold">{user.email[0].toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.email}</div>
                  <div className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-1 mb-6">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <button
                    key={link.path}
                    onClick={() => {
                      router.push(link.path)
                      setShowMobileMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive(link.path)
                        ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white hover:bg-[#1a1f2e]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </button>
                )
              })}

              {/* Admin Link */}
              {(user.role === 'super_admin' || user.role === 'admin') && (
                <button
                  onClick={() => {
                    router.push('/admin')
                    setShowMobileMenu(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    pathname.startsWith('/admin')
                      ? 'bg-gradient-to-r from-blue-500 to-emerald-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1f2e]'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Admin</span>
                </button>
              )}
            </div>

            {/* Settings & Logout */}
            <div className="pt-6 border-t border-gray-800/50 space-y-1">
              <button
                onClick={() => {
                  router.push('/profile')
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-[#1a1f2e] hover:bg-[#232936] rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Pengaturan</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg transition-colors text-red-400"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Keluar</span>
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slide-left {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-slide-left {
          animation: slide-left 0.3s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </nav>
  )
}