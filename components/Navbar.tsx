'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { UserProfile } from '@/types'
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [logoPhase, setLogoPhase] = useState<'stc-logo-in' | 'stc-text-in' | 'stc-hold' | 'stc-text-out' | 'stc-logo-out' | 'stockity-logo-in' | 'stockity-text-in' | 'stockity-hold' | 'stockity-text-out' | 'stockity-logo-out'>('stc-logo-in')

  // Fetch user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) return
      
      try {
        const response = await api.getProfile()
        const profile = (response as any)?.data as UserProfile || response as UserProfile
        
        if (profile && 'user' in profile && 'statusInfo' in profile) {
          setUserProfile(profile)
        }
      } catch (error) {
        console.error('Failed to load user profile:', error)
      }
    }

    loadUserProfile()
  }, [user?.id])

  useEffect(() => {
    const phaseTimings = {
      'stc-logo-in': 800,
      'stc-text-in': 800,
      'stc-hold': 8000,
      'stc-text-out': 800,
      'stc-logo-out': 800,
      'stockity-logo-in': 800,
      'stockity-text-in': 800,
      'stockity-hold': 4000,
      'stockity-text-out': 800,
      'stockity-logo-out': 800,
    }

    const nextPhase = {
      'stc-logo-in': 'stc-text-in',
      'stc-text-in': 'stc-hold',
      'stc-hold': 'stc-text-out',
      'stc-text-out': 'stc-logo-out',
      'stc-logo-out': 'stockity-logo-in',
      'stockity-logo-in': 'stockity-text-in',
      'stockity-text-in': 'stockity-hold',
      'stockity-hold': 'stockity-text-out',
      'stockity-text-out': 'stockity-logo-out',
      'stockity-logo-out': 'stc-logo-in',
    } as const

    const timeout = setTimeout(() => {
      setLogoPhase(nextPhase[logoPhase])
    }, phaseTimings[logoPhase])

    return () => clearTimeout(timeout)
  }, [logoPhase])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const isActive = (path: string) => pathname === path

  const navLinks = [
    { path: '/trading', label: 'Trading', icon: BarChart3 },
    { path: '/history', label: 'Riwayat', icon: History },
    { path: '/balance', label: 'Keuangan', icon: Wallet },
    { path: '/profile', label: 'Profil', icon: User },
  ]

  if (!user) return null

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo dengan animasi sequence */}
          <div 
            className="relative h-8 w-48 overflow-visible cursor-pointer"
            onClick={() => router.push('/trading')}
          >
            {/* Stouch - hanya visible di fase STC */}
            {logoPhase.startsWith('stc-') && (
              <div className="flex items-center gap-3 absolute left-0 top-0">
                {/* Logo STC */}
                <div className={`relative w-8 h-8 flex-shrink-0 overflow-visible ${
                  logoPhase === 'stc-logo-in' ? 'animate-logo-bounce-in' :
                  logoPhase === 'stc-logo-out' ? 'animate-logo-bounce-out' : 
                  'opacity-100'
                }`}>
                  <Image
                    src="/stc-logo.png"
                    alt="Stouch"
                    fill
                    className="object-contain rounded-md"
                    priority
                  />
                </div>
                
                {/* Text STC - hanya show setelah logo in */}
                {(logoPhase !== 'stc-logo-in' && logoPhase !== 'stc-logo-out') && (
                  <div className="flex overflow-hidden">
                    <span className={`text-lg font-bold text-gray-900 whitespace-nowrap ${
                      logoPhase === 'stc-text-in' ? 'animate-text-slide-in' :
                      logoPhase === 'stc-text-out' ? 'animate-text-slide-out' : 
                      'opacity-100 translate-x-0'
                    }`}>
                      Stouch
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* By Stockity - hanya visible di fase Stockity */}
            {logoPhase.startsWith('stockity-') && (
              <div className="flex items-center gap-3 absolute left-0 top-0">
                {/* Logo Stockity */}
                <div className={`relative w-8 h-8 flex-shrink-0 overflow-visible ${
                  logoPhase === 'stockity-logo-in' ? 'animate-logo-bounce-in' :
                  logoPhase === 'stockity-logo-out' ? 'animate-logo-bounce-out' : 
                  'opacity-100'
                }`}>
                  <Image
                    src="/stockity.png"
                    alt="Stockity"
                    fill
                    className="object-contain rounded-md"
                    priority
                  />
                </div>
                
                {/* Text Stockity - hanya show setelah logo in */}
                {(logoPhase !== 'stockity-logo-in' && logoPhase !== 'stockity-logo-out') && (
                  <div className="flex overflow-hidden">
                    <span className={`text-lg font-bold text-gray-900 whitespace-nowrap ${
                      logoPhase === 'stockity-text-in' ? 'animate-text-slide-in' :
                      logoPhase === 'stockity-text-out' ? 'animate-text-slide-out' : 
                      'opacity-100 translate-x-0'
                    }`}>
                      By Stockity
                    </span>
                  </div>
                )}
              </div>
            )}
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
                      ? 'bg-blue-50 text-blue-600'
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
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </button>
            )}
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:block relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{user.email.split('@')[0]}</div>
              {userProfile?.profileInfo?.avatar?.url ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-gray-200">
                  <Image
                    src={userProfile.profileInfo.avatar.url}
                    alt={user.email}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flat-avatar">
                  {user.email[0].toUpperCase()}
                </div>
              )}
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-flat-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900 truncate mb-1">{user.email}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {user.role.replace('_', ' ')} | {user.status.toUpperCase()}
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left text-red-600"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Keluar</span>
                  </button>
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
                {userProfile?.profileInfo?.avatar?.url ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-gray-200">
                    <Image
                      src={userProfile.profileInfo.avatar.url}
                      alt={user.email}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flat-avatar">
                    {user.email[0].toUpperCase()}
                  </div>
                )}
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
                        ? 'bg-blue-50 text-blue-600'
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
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Admin</span>
                </button>
              )}
            </div>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200 space-y-1">              
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 hover:bg-red-100 rounded-lg transition-colors text-red-600"
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

        .animate-slide-left {
          animation: slide-left 0.3s ease-out;
        }
      `}</style>
    </nav>
  )
}