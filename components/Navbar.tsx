// components/Navbar.tsx
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
  User,
  UserPlus,
  Share2
} from 'lucide-react'

type LogoPhase = 'stc-logo-in' | 'stc-text-in' | 'stc-hold' | 'stc-text-out' | 'stc-logo-out' | 'stockity-logo-in' | 'stockity-text-in' | 'stockity-hold' | 'stockity-text-out' | 'stockity-logo-out'

// ── Module-level cache ─────────────────────────────────────────
// Persists across component re-mounts (navigasi antar halaman),
// sehingga tidak ada flash/jump saat Navbar di-mount ulang.
const _cache: {
  userProfile: UserProfile | null
  profileFetched: string | null   // simpan user.id yang sudah di-fetch
  isAffiliator: boolean
  affiliatorChecked: string | null
  logoPhase: LogoPhase
} = {
  userProfile: null,
  profileFetched: null,
  isAffiliator: false,
  affiliatorChecked: null,
  logoPhase: 'stc-logo-in',
}

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [isClosingMenu, setIsClosingMenu] = useState(false)

  // Init dari cache → tidak ada flash/jump saat re-mount
  const [userProfile, setUserProfile] = useState<UserProfile | null>(_cache.userProfile)
  const [isAffiliator, setIsAffiliator] = useState(_cache.isAffiliator)
  const [logoPhase, setLogoPhase] = useState<LogoPhase>(_cache.logoPhase)

  // Setter yang sekaligus update cache
  const updateLogoPhase = (phase: LogoPhase) => {
    _cache.logoPhase = phase
    setLogoPhase(phase)
  }

  // Fetch profile & affiliator — hanya sekali per user (skip jika cache valid)
  useEffect(() => {
    if (!user?.id) return

    if (_cache.profileFetched !== user.id) {
      _cache.profileFetched = user.id
      ;(async () => {
        try {
          const response = await api.getProfile()
          const profile = (response as any)?.data as UserProfile || response as UserProfile
          if (profile && 'user' in profile && 'statusInfo' in profile) {
            _cache.userProfile = profile
            setUserProfile(profile)
          }
        } catch (error) {
          console.error('Failed to load user profile:', error)
        }
      })()
    }

    if (_cache.affiliatorChecked !== user.id) {
      _cache.affiliatorChecked = user.id
      ;(async () => {
        try {
          await api.getMyAffiliatorProgram()
          _cache.isAffiliator = true
          setIsAffiliator(true)
        } catch {
          _cache.isAffiliator = false
          setIsAffiliator(false)
        }
      })()
    }
  }, [user?.id])

  useEffect(() => {
    const phaseTimings: Record<LogoPhase, number> = {
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

    const nextPhase: Record<LogoPhase, LogoPhase> = {
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
    }

    const timeout = setTimeout(() => {
      updateLogoPhase(nextPhase[logoPhase])
    }, phaseTimings[logoPhase])

    return () => clearTimeout(timeout)
  }, [logoPhase])

  const handleLogout = async () => {
    try {
      // Reset navbar cache agar user berikutnya tidak lihat data lama
      _cache.userProfile = null
      _cache.profileFetched = null
      _cache.isAffiliator = false
      _cache.affiliatorChecked = null
      _cache.logoPhase = 'stc-logo-in'

      api.removeToken()
      api.clearCache()
      logout()
      
      if (typeof window !== 'undefined') {
        localStorage.clear()
        sessionStorage.clear()
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
      router.replace('/')
    } catch (error) {
      console.error('Logout error:', error)
      router.replace('/')
    }
  }

  const closeMobileMenu = () => {
    setIsClosingMenu(true)
    setTimeout(() => {
      setShowMobileMenu(false)
      setIsClosingMenu(false)
    }, 280) // sedikit kurang dari durasi animasi 0.3s
  }

  const isActive = (path: string) => pathname === path
  const isAdmin = pathname.startsWith('/admin')

  // ── Theme tokens — swap seluruh palette saat di panel admin ──
  const t = isAdmin ? {
    nav:            'border-b border-white/10 bg-[#080c1e]',
    logoText:       'text-slate-100',
    navBtn:         'text-slate-200 hover:text-white hover:bg-white/[0.08]',
    navBtnActive:   'bg-indigo-500/20 text-indigo-300',
    userBtn:        '',
    userEmail:      'text-slate-100',
    chevron:        'text-slate-500',
    dropdown:       'bg-[rgba(10,14,30,0.96)] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.6)]',
    dropHeader:     'border-b border-white/[0.08]',
    dropTitle:      'text-slate-100',
    dropSub:        'text-slate-400',
    dropItem:       'text-slate-300 hover:bg-white/[0.08] hover:text-slate-100',
    dropItemActive: 'text-indigo-300 bg-indigo-500/15',
    dropDivider:    'border-t border-white/[0.08]',
    dropLogout:     'text-red-400 hover:bg-red-500/10',
    mobileMenuBtn:  'hover:bg-white/[0.08]',
    mobileIcon:     'text-slate-300',
    mobileDrawer:   'bg-[#080c1e] border-l border-white/10',
    mobileHeader:   'border-b border-white/10',
    mobileTitle:    'text-slate-100',
    mobileClose:    'hover:bg-white/[0.08]',
    mobileCloseIcon:'text-slate-400',
    mobileProfile:  'bg-[#0d1120] border-b border-white/10',
    mobileEmail:    'text-slate-100',
    mobileRole:     'text-slate-400',
    mobileLinkBtn:  'text-slate-200 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.10] hover:text-white hover:border-white/[0.18]',
    mobileLinkActive:'bg-indigo-500/25 text-indigo-200 border border-indigo-400/30',
    mobileFooter:   'border-t border-white/[0.08]',
    mobileLogout:   'text-red-300 bg-red-500/[0.10] border border-red-400/20 hover:bg-red-500/20 hover:border-red-400/40',
    ring:           'ring-white/15',
  } : {
    nav:            'bg-white border-b border-gray-200',
    logoText:       'text-gray-900',
    navBtn:         'text-gray-600 hover:text-gray-900 hover:bg-gray-50',
    navBtnActive:   'bg-blue-50 text-blue-600',
    userBtn:        'hover:bg-gray-50',
    userEmail:      'text-gray-900',
    chevron:        'text-gray-400',
    dropdown:       'bg-white border border-gray-200 shadow-flat-lg',
    dropHeader:     'border-b border-gray-100',
    dropTitle:      'text-gray-900',
    dropSub:        'text-gray-500',
    dropItem:       'text-gray-700 hover:bg-blue-50',
    dropItemActive: 'text-blue-600 bg-blue-50',
    dropDivider:    'border-t border-gray-100',
    dropLogout:     'text-red-600 hover:bg-red-50',
    mobileMenuBtn:  'hover:bg-gray-50',
    mobileIcon:     'text-gray-700',
    mobileDrawer:   'bg-white border-l border-gray-200',
    mobileHeader:   'border-b border-gray-200',
    mobileTitle:    'text-gray-900',
    mobileClose:    'hover:bg-gray-50',
    mobileCloseIcon:'text-gray-500',
    mobileProfile:  'bg-gray-50 border-b border-gray-200',
    mobileEmail:    'text-gray-900',
    mobileRole:     'text-gray-500',
    mobileLinkBtn:  'text-gray-700 hover:bg-gray-50',
    mobileLinkActive:'bg-blue-50 text-blue-600',
    mobileFooter:   'border-t border-gray-200',
    mobileLogout:   'text-red-600 bg-red-50 hover:bg-red-100',
    ring:           'ring-gray-200',
  }

  const navLinks = [
    { path: '/trading', label: 'Trading', icon: BarChart3 },
    { path: '/history', label: 'Riwayat', icon: History },
    { path: '/balance', label: 'Keuangan', icon: Wallet },
    { path: '/referral', label: 'Undang Teman', icon: UserPlus },
    ...(isAffiliator ? [{ path: '/affiliate', label: 'Affiliasi', icon: Share2 }] : []),
    { path: '/profile', label: 'Profil', icon: User },
  ]

  if (!user) return null

  return (
    <>
    <nav className={`${t.nav}`}>
      {/* Desktop: full-width layout tanpa container constraint */}
      <div className="hidden md:flex items-center h-16 px-6 gap-4">

        {/* Logo */}
        <div 
          className="relative h-10 w-44 flex-shrink-0 overflow-visible cursor-pointer"
          onClick={() => router.push('/trading')}
        >
          {/* Stouch - hanya visible di fase STC */}
          {logoPhase.startsWith('stc-') && (
            <div className="flex items-center gap-3 absolute left-0 top-0">
              <div className={`relative w-10 h-10 flex-shrink-0 overflow-visible ${
                logoPhase === 'stc-logo-in' ? 'animate-logo-bounce-in' :
                logoPhase === 'stc-logo-out' ? 'animate-logo-bounce-out' : 
                'opacity-100'
              }`}>
                <Image
                  src="/stc-logo1.png"
                  alt="Stouch"
                  fill
                  className="object-contain rounded-md"
                  priority
                />
              </div>
              
              {(logoPhase !== 'stc-logo-in' && logoPhase !== 'stc-logo-out') && (
                <div className="flex overflow-hidden">
                  <span className={`text-lg font-bold ${t.logoText} whitespace-nowrap ${
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
            <div className="flex items-center gap-3 absolute left-0 top-1">
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
              
              {(logoPhase !== 'stockity-logo-in' && logoPhase !== 'stockity-logo-out') && (
                <div className="flex overflow-hidden">
                  <span className={`text-lg font-bold ${t.logoText} whitespace-nowrap ${
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

        {/* Nav Links — flex-1 agar mengisi semua ruang tengah, merata */}
        <div className="flex-1 flex items-center justify-evenly">
          {navLinks.map((link) => {
            const Icon = link.icon
            return (
              <button
                key={link.path}
                onClick={() => router.push(link.path)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive(link.path) ? t.navBtnActive : t.navBtn}`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </button>
            )
          })}

        </div>


        {/* User Menu */}
        <div className="flex-shrink-0 relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${t.userBtn}`}
          >
            <div className={`text-sm font-medium ${t.userEmail}`}>{user.email.split('@')[0]}</div>
            {userProfile?.profileInfo?.avatar?.url ? (
              <div className={`relative w-8 h-8 rounded-full overflow-hidden ring-2 ${t.ring}`}>
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
            <ChevronDown className={`w-4 h-4 ${t.chevron} transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div className={`absolute top-full right-0 mt-2 w-64 rounded-lg z-50 overflow-hidden ${t.dropdown}`}>
                {/* User info */}
                <div className={`px-4 py-3 ${t.dropHeader}`}>
                  <div className={`text-sm font-medium ${t.dropTitle} truncate mb-1`}>{user.email}</div>
                  <div className={`text-xs ${t.dropSub} capitalize`}>
                    {user.role.replace('_', ' ')} | {user.status.toUpperCase()}
                  </div>
                </div>

                {/* Affiliate link */}
                {isAffiliator && (
                  <button
                    onClick={() => { router.push('/affiliate'); setShowUserMenu(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${isActive('/affiliate') ? t.dropItemActive : t.dropItem}`}
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Program Affiliasi</span>
                  </button>
                )}

                {/* Admin link */}
                {(user.role === 'super_admin' || user.role === 'admin') && (
                  <button
                    onClick={() => { router.push('/admin'); setShowUserMenu(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${pathname.startsWith('/admin') ? t.dropItemActive : t.dropItem}`}
                  >
                    <Shield className="w-4 h-4" />
                    <span className="text-sm font-medium">Panel Admin</span>
                  </button>
                )}

                {/* Divider */}
                <div className={t.dropDivider} />

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${t.dropLogout}`}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Keluar</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile: layout asli tetap dipertahankan */}
      <div className="md:hidden flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <div 
          className="relative h-10 w-48 overflow-visible cursor-pointer"
          onClick={() => router.push('/trading')}
        >
          {logoPhase.startsWith('stc-') && (
            <div className="flex items-center gap-3 absolute left-0 top-0">
              <div className={`relative w-10 h-10 flex-shrink-0 overflow-visible ${
                logoPhase === 'stc-logo-in' ? 'animate-logo-bounce-in' :
                logoPhase === 'stc-logo-out' ? 'animate-logo-bounce-out' : 
                'opacity-100'
              }`}>
                <Image src="/stc-logo1.png" alt="Stouch" fill className="object-contain rounded-md" priority />
              </div>
              {(logoPhase !== 'stc-logo-in' && logoPhase !== 'stc-logo-out') && (
                <div className="flex overflow-hidden">
                  <span className={`text-lg font-bold ${t.logoText} whitespace-nowrap ${
                    logoPhase === 'stc-text-in' ? 'animate-text-slide-in' :
                    logoPhase === 'stc-text-out' ? 'animate-text-slide-out' : 
                    'opacity-100 translate-x-0'
                  }`}>Stouch</span>
                </div>
              )}
            </div>
          )}
          {logoPhase.startsWith('stockity-') && (
            <div className="flex items-center gap-3 absolute left-0 top-1">
              <div className={`relative w-8 h-8 flex-shrink-0 overflow-visible ${
                logoPhase === 'stockity-logo-in' ? 'animate-logo-bounce-in' :
                logoPhase === 'stockity-logo-out' ? 'animate-logo-bounce-out' : 
                'opacity-100'
              }`}>
                <Image src="/stockity.png" alt="Stockity" fill className="object-contain rounded-md" priority />
              </div>
              {(logoPhase !== 'stockity-logo-in' && logoPhase !== 'stockity-logo-out') && (
                <div className="flex overflow-hidden">
                  <span className={`text-lg font-bold ${t.logoText} whitespace-nowrap ${
                    logoPhase === 'stockity-text-in' ? 'animate-text-slide-in' :
                    logoPhase === 'stockity-text-out' ? 'animate-text-slide-out' : 
                    'opacity-100 translate-x-0'
                  }`}>By Stockity</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(true)}
          className={`p-2 rounded-lg transition-colors ${t.mobileMenuBtn}`}
        >
          <Menu className={`w-6 h-6 ${t.mobileIcon}`} />
        </button>
      </div>

    </nav>

      {/* Mobile Menu Drawer — outside <nav> to escape stacking context */}
      {showMobileMenu && (
        <>
          <div 
            className={`fixed inset-0 bg-black/50 z-[50] ${isClosingMenu ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={closeMobileMenu} 
          />
          <div className={`fixed top-0 right-0 bottom-0 w-80 z-[60] overflow-y-auto ${t.mobileDrawer} ${isClosingMenu ? 'animate-slide-right' : 'animate-slide-left'}`}>
            <div className={`flex items-center justify-between p-4 ${t.mobileHeader}`}>
              <h3 className={`font-bold ${t.mobileTitle}`}>Menu</h3>
              <button 
                onClick={closeMobileMenu}
                className={`p-2 rounded-lg transition-colors ${t.mobileClose}`}
              >
                <X className={`w-5 h-5 ${t.mobileCloseIcon}`} />
              </button>
            </div>

            <div className={`p-4 ${t.mobileProfile}`}>
              <div className="flex items-center gap-3">
                {userProfile?.profileInfo?.avatar?.url ? (
                  <div className={`relative w-10 h-10 rounded-full overflow-hidden ring-2 ${t.ring}`}>
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
                  <div className={`text-sm font-medium ${t.mobileEmail} truncate`}>{user.email}</div>
                  <div className={`text-xs ${t.dropSub} capitalize`}>{user.role.replace('_', ' ')}</div>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <button
                    key={link.path}
                    onClick={() => {
                      router.push(link.path)
                      closeMobileMenu()
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(link.path) ? t.mobileLinkActive : t.mobileLinkBtn}`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{link.label}</span>
                  </button>
                )
              })}

              {(user.role === 'super_admin' || user.role === 'admin') && (
                <button
                  onClick={() => {
                    router.push('/admin')
                    closeMobileMenu()
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${pathname.startsWith('/admin') ? t.mobileLinkActive : t.mobileLinkBtn}`}
                >
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Panel Admin</span>
                </button>
              )}
            </div>

            <div className={`p-4 space-y-1 ${t.mobileFooter}`}>              
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${t.mobileLogout}`}
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Keluar</span>
              </button>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes slide-left {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slide-right {
          from { transform: translateX(0); }
          to { transform: translateX(100%); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        .animate-slide-left {
          animation: slide-left 0.3s ease-out forwards;
        }
        .animate-slide-right {
          animation: slide-right 0.3s ease-in forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
        .animate-fade-out {
          animation: fade-out 0.3s ease-in forwards;
        }
      `}</style>
    </>
  )
}