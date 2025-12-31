'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import Navbar from '@/components/Navbar'
import { 
  User, 
  Mail, 
  Shield, 
  Calendar,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Save,
  LogOut,
  CheckCircle2,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'

const ProfileCardSkeleton = () => (
  <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm animate-pulse">
    <div className="flex flex-col items-center text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 mb-3 sm:mb-4"></div>
      <div className="h-4 sm:h-5 bg-gray-200 rounded w-32 sm:w-40 mb-2"></div>
      <div className="h-5 sm:h-6 bg-gray-200 rounded w-24 sm:w-32 mb-3"></div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-200"></div>
        <div className="h-3 bg-gray-200 rounded w-20 sm:w-24"></div>
      </div>
    </div>
  </div>
)

const NavigationSkeleton = () => (
  <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 p-2 shadow-sm space-y-2 animate-pulse">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-10 sm:h-12 bg-gray-100 rounded-lg"></div>
    ))}
  </div>
)

const InfoCardSkeleton = () => (
  <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 animate-pulse">
    <div className="flex items-center gap-3 sm:gap-4">
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-lg sm:rounded-xl flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <div className="h-3 bg-gray-200 rounded w-16 sm:w-20 mb-2"></div>
        <div className="h-3 sm:h-4 bg-gray-200 rounded w-24 sm:w-32"></div>
      </div>
      <div className="h-5 sm:h-6 bg-gray-200 rounded w-16 sm:w-20 flex-shrink-0"></div>
    </div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#fafafa]">
    <Navbar />
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
      <div className="mb-4 sm:mb-6 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-32 sm:w-48 mb-2 sm:mb-3"></div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-lg sm:rounded-xl"></div>
          <div className="flex-1">
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-32 sm:w-40 mb-1 sm:mb-2"></div>
            <div className="h-3 sm:h-4 bg-gray-200 rounded w-40 sm:w-56"></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-4 space-y-4 sm:space-y-6">
          <ProfileCardSkeleton />
          <NavigationSkeleton />
          <div className="h-10 sm:h-12 bg-gray-200 rounded-lg sm:rounded-xl animate-pulse"></div>
        </div>

        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200 animate-pulse">
              <div className="h-4 sm:h-5 bg-gray-200 rounded w-32 sm:w-40 mb-1 sm:mb-2"></div>
              <div className="h-3 sm:h-4 bg-gray-200 rounded w-48 sm:w-64"></div>
            </div>

            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {[...Array(4)].map((_, i) => (
                <InfoCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showMobileNav, setShowMobileNav] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [emailNotifs, setEmailNotifs] = useState(true)
  const [tradeAlerts, setTradeAlerts] = useState(true)
  const [soundEffects, setSoundEffects] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    const timer = setTimeout(() => {
      setInitialLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [user, router])

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success('Password updated successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      toast.error('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.push('/')
  }

  if (!user) return null

  if (initialLoading) {
    return <LoadingSkeleton />
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Bell }
  ]

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* Breadcrumb & Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Account</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Account Settings</h1>
              <p className="text-xs sm:text-sm text-gray-500">Manage your profile and preferences</p>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div className="lg:hidden mb-4 sm:mb-6">
          <button
            onClick={() => setShowMobileNav(!showMobileNav)}
            className="w-full flex items-center justify-between p-3 sm:p-4 bg-white border border-gray-200 rounded-lg sm:rounded-xl touch-manipulation active:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              {tabs.find(t => t.id === activeTab)?.icon && (
                <>
                  {React.createElement(tabs.find(t => t.id === activeTab)!.icon, {
                    className: "w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0"
                  })}
                  <span className="font-medium text-sm sm:text-base text-gray-900 truncate">
                    {tabs.find(t => t.id === activeTab)?.label}
                  </span>
                </>
              )}
            </div>
            <svg
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform flex-shrink-0 ${showMobileNav ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showMobileNav && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg sm:rounded-xl p-1.5 sm:p-2 space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id)
                      setShowMobileNav(false)
                    }}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all touch-manipulation text-sm sm:text-base ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Sidebar - Desktop Only */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4 sm:space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-3xl font-bold text-white mb-4">
                  {user.email[0].toUpperCase()}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 break-all px-2">{user.email}</h3>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium text-blue-700 mb-3">
                  <Shield className="w-4 h-4" />
                  {user.role.replace('_', ' ')}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {user.isActive ? 'Active Account' : 'Inactive Account'}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-red-600 border-2 border-red-200 rounded-xl font-semibold hover:bg-red-50 active:bg-red-100 transition-all shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 xl:col-span-9">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Profile Information</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Your account details and status</p>
                </div>

                <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                  {/* Email */}
                  <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 hover:border-gray-300 active:border-gray-400 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5 sm:mb-1 font-medium">Email Address</div>
                        <div className="text-sm sm:text-base font-semibold text-gray-900 truncate">{user.email}</div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 bg-green-50 border border-green-200 rounded-full flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                        <span className="text-xs font-bold text-green-700 hidden sm:inline">Verified</span>
                        <span className="text-xs font-bold text-green-700 sm:hidden">✓</span>
                      </div>
                    </div>
                  </div>

                  {/* Account Type */}
                  <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 hover:border-gray-300 active:border-gray-400 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5 sm:mb-1 font-medium">Account Type</div>
                        <div className="text-sm sm:text-base font-semibold text-gray-900 capitalize">{user.role.replace('_', ' ')}</div>
                      </div>
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 hover:border-gray-300 active:border-gray-400 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${
                        user.isActive ? 'bg-green-50' : 'bg-red-50'
                      }`}>
                        <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5 sm:mb-1 font-medium">Account Status</div>
                        <div className={`text-sm sm:text-base font-semibold ${user.isActive ? 'text-green-700' : 'text-red-700'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 hover:border-gray-300 active:border-gray-400 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5 sm:mb-1 font-medium">Member Since</div>
                        <div className="text-sm sm:text-base font-semibold text-gray-900">
                          {new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Security Settings</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Keep your account secure</p>
                </div>

                <div className="p-4 sm:p-5 md:p-6">
                  <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-6">
                    {/* Current Password */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none transition-colors"
                          placeholder="Enter current password"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 active:text-gray-700 transition-colors touch-manipulation p-2"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        New Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Enter new password"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-2 flex items-center gap-2">
                        <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                        Must be at least 8 characters
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                        Confirm New Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white py-2.5 sm:py-3 md:py-3.5 rounded-lg sm:rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                          Update Password
                        </>
                      )}
                    </button>
                  </form>

                  {/* 2FA Section */}
                  <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
                    <div className="p-4 sm:p-5 md:p-6 bg-amber-50 border border-amber-200 rounded-lg sm:rounded-xl">
                      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm sm:text-base text-gray-900 mb-0.5 sm:mb-1">Two-Factor Authentication</h4>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Add an extra layer of security to your account</p>
                          <button className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white text-sm rounded-lg font-semibold shadow-sm transition-colors touch-manipulation">
                            Enable 2FA
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Preferences</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Customize your experience</p>
                </div>

                <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                  {/* Email Notifications */}
                  <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 hover:border-gray-300 active:border-gray-400 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base text-gray-900 mb-0.5 sm:mb-1">Email Notifications</div>
                          <div className="text-xs sm:text-sm text-gray-500">Receive trading alerts via email</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 touch-manipulation">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={emailNotifs}
                          onChange={(e) => setEmailNotifs(e.target.checked)}
                        />
                        <div className="w-11 h-6 sm:w-14 sm:h-8 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] sm:after:top-[3px] after:left-[2px] sm:after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-7 sm:after:w-7 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* Trade Alerts */}
                  <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 hover:border-gray-300 active:border-gray-400 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base text-gray-900 mb-0.5 sm:mb-1">Trade Alerts</div>
                          <div className="text-xs sm:text-sm text-gray-500">Get notified on trade outcomes</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 touch-manipulation">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={tradeAlerts}
                          onChange={(e) => setTradeAlerts(e.target.checked)}
                        />
                        <div className="w-11 h-6 sm:w-14 sm:h-8 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] sm:after:top-[3px] after:left-[2px] sm:after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-7 sm:after:w-7 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  </div>

                  {/* Sound Effects */}
                  <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 hover:border-gray-300 active:border-gray-400 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                          <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base text-gray-900 mb-0.5 sm:mb-1">Sound Effects</div>
                          <div className="text-xs sm:text-sm text-gray-500">Play sounds on trade events</div>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 touch-manipulation">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={soundEffects}
                          onChange={(e) => setSoundEffects(e.target.checked)}
                        />
                        <div className="w-11 h-6 sm:w-14 sm:h-8 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] sm:after:top-[3px] after:left-[2px] sm:after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-7 sm:after:w-7 after:transition-all peer-checked:bg-blue-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Logout Button */}
        <div className="lg:hidden mt-4 sm:mt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 md:py-3.5 bg-white text-red-600 border-2 border-red-200 rounded-lg sm:rounded-xl font-semibold hover:bg-red-50 active:bg-red-100 transition-all shadow-sm touch-manipulation text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}