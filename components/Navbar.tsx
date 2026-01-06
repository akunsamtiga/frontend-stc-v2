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
  ChevronDown,
  User
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
    { path: '/history', label: 'History', icon: History },
    { path: '/balance', label: 'Balance', icon: Wallet },
    { path: '/profile', label: 'Profile', icon: User }, // ⬅️ TAMBAHKAN INI

  ]

  if (!user) return null

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => router.push('/trading')}
          >
            <div className="relative w-8 h-8">
              <Image
                src="/stc-logo.png"
                alt="STC"
                fill
                className="object-contain rounded-md"
                priority
              />
            </div>
            <span className="font-bold text-lg text-gray-900">
              STC AutoTrade
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              return (
                <button
                  key={link.path}
                  onClick={() => router.push(link.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">{user.email.split('@')[0]}</div>
                <div className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</div>
              </div>
              <div className="flat-avatar">
                {user.email[0].toUpperCase()}
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-flat-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900 truncate">{user.email}</div>
                    <div className="text-xs text-gray-500 mt-1 capitalize">{user.role.replace('_', ' ')}</div>
                  </div>
                  <button
                    onClick={() => {
                      router.push('/profile')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">Settings</span>
                  </button>
                  <div className="border-t border-gray-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-50 animate-fade-in" 
            onClick={() => setShowMobileMenu(false)} 
          />
          <div className="fixed top-0 right-0 bottom-0 w-80 bg-white border-l border-gray-200 z-50 animate-slide-left overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Menu</h3>
              <button 
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flat-avatar">
                  {user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{user.email}</div>
                  <div className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</div>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="p-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <button
                    key={link.path}
                    onClick={() => {
                      router.push(link.path)
                      setShowMobileMenu(false)
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(link.path)
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    pathname.startsWith('/admin')
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Admin</span>
                </button>
              )}
            </div>

            {/* Settings & Logout */}
            <div className="p-4 border-t border-gray-200 space-y-1">
              <button
                onClick={() => {
                  router.push('/profile')
                  setShowMobileMenu(false)
                }}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-700" />
                <span className="font-medium text-gray-900">Settings</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-red-600"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
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

        .animate-slide-left {
          animation: slide-left 0.3s ease-out;
        }
      `}</style>
    </nav>
  )
}