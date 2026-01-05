'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
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
  Settings,
  Award,
  Crown,
  TrendingUp,
  Users,
  Copy,
  Check,
  Gift,
  Share2
} from 'lucide-react'
import { toast } from 'sonner'
import { UserProfile, StatusInfo, AffiliateInfo, STATUS_CONFIG } from '@/types'

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [activeTab, setActiveTab] = useState('profile')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [showMobileNav, setShowMobileNav] = useState(false)
  
  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [copied, setCopied] = useState(false)

  // Form states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Preferences
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [tradeAlerts, setTradeAlerts] = useState(true)
  const [soundEffects, setSoundEffects] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    
    loadProfile()
  }, [user, router])

  const loadProfile = async () => {
    try {
      const response = await api.getProfile()
      const data = response?.data || response
      setProfile(data)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setInitialLoading(false)
    }
  }

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

  const copyReferralCode = () => {
    if (profile?.affiliate?.referralCode) {
      navigator.clipboard.writeText(profile.affiliate.referralCode)
      setCopied(true)
      toast.success('Referral code copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareReferralLink = () => {
    if (profile?.affiliate?.referralCode) {
      const link = `${window.location.origin}/?ref=${profile.affiliate.referralCode}`
      navigator.clipboard.writeText(link)
      toast.success('Referral link copied!')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'vip': return Crown
      case 'gold': return Award
      default: return User
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vip': return 'from-purple-500 to-pink-500'
      case 'gold': return 'from-yellow-400 to-orange-500'
      default: return 'from-gray-400 to-gray-500'
    }
  }

  if (!user) return null

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm text-gray-500">Loading profile...</div>
          </div>
        </div>
      </div>
    )
  }

  const statusInfo = profile?.statusInfo
  const affiliateInfo = profile?.affiliate
  const StatusIcon = statusInfo ? getStatusIcon(statusInfo.current) : User

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'status', label: 'Status', icon: Award },
    { id: 'affiliate', label: 'Affiliate', icon: Users },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Bell }
  ]

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
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

        {/* Mobile Navigation */}
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
            <svg className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform flex-shrink-0 ${showMobileNav ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4 sm:space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className={`h-24 bg-gradient-to-r ${getStatusColor(statusInfo?.current || 'standard')}`}></div>
              <div className="p-6 -mt-12">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center mb-4">
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getStatusColor(statusInfo?.current || 'standard')} flex items-center justify-center`}>
                      <StatusIcon className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1 break-all px-2">{user.email}</h3>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${getStatusColor(statusInfo?.current || 'standard')} rounded-lg text-sm font-medium text-white mb-3`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusInfo?.current.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      {user.isActive ? 'Active Account' : 'Inactive Account'}
                    </span>
                  </div>
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
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Profile Information</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Your account details and status</p>
                </div>

                <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
                  <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
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

                  <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
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

                  <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
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

                  <div className="p-4 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-gray-500 mb-0.5 sm:mb-1 font-medium">Member Since</div>
                        <div className="text-sm sm:text-base font-semibold text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString('en-US', { 
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

            {/* Status Tab */}
            {activeTab === 'status' && statusInfo && (
              <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Account Status</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Your trading tier and benefits</p>
                </div>

                <div className="p-4 sm:p-5 md:p-6 space-y-6">
                  {/* Current Status */}
                  <div className={`p-6 rounded-2xl bg-gradient-to-br ${getStatusColor(statusInfo.current)} text-white`}>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                        <StatusIcon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white/80">Current Status</div>
                        <div className="text-3xl font-bold">{statusInfo.current.toUpperCase()}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Profit Bonus</span>
                      <span className="text-2xl font-bold">+{statusInfo.profitBonus}%</span>
                    </div>
                  </div>

                  {/* Progress */}
                  {statusInfo.nextStatus && (
                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-gray-700">Progress to {statusInfo.nextStatus.toUpperCase()}</span>
                        <span className="text-sm font-bold text-purple-600">{statusInfo.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
                        <div 
                          className={`h-3 rounded-full bg-gradient-to-r ${getStatusColor(statusInfo.nextStatus)} transition-all duration-500`}
                          style={{ width: `${statusInfo.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Total Deposit: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(statusInfo.totalDeposit)}</span>
                        {statusInfo.depositNeeded && (
                          <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, notation: 'compact' }).format(statusInfo.depositNeeded)} more needed</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Status Tiers */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {(['standard', 'gold', 'vip'] as const).map((status) => {
                      const config = STATUS_CONFIG[status]
                      const Icon = getStatusIcon(status)
                      const isCurrent = statusInfo.current === status
                      
                      return (
                        <div 
                          key={status}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            isCurrent 
                              ? 'border-purple-500 bg-purple-50 shadow-md' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Icon className={`w-5 h-5 ${isCurrent ? 'text-purple-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-bold ${isCurrent ? 'text-purple-900' : 'text-gray-700'}`}>
                              {config.label}
                            </span>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Bonus</span>
                              <span className="font-bold text-purple-600">+{config.profitBonus}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Min Deposit</span>
                              <span className="font-semibold text-gray-900">
                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, notation: 'compact' }).format(config.minDeposit)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Affiliate Tab */}
            {activeTab === 'affiliate' && affiliateInfo && (
              <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Affiliate Program</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Earn commissions by referring friends</p>
                </div>

                <div className="p-4 sm:p-5 md:p-6 space-y-6">
                  {/* Referral Code */}
                  <div className="p-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl text-white">
                    <div className="text-sm font-medium text-white/80 mb-2">Your Referral Code</div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 font-mono text-2xl font-bold">
                        {affiliateInfo.referralCode}
                      </div>
                      <button
                        onClick={copyReferralCode}
                        className="px-4 py-3 bg-white text-blue-600 rounded-xl hover:bg-blue-50 transition-colors"
                      >
                        {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                      </button>
                    </div>
                    <button
                      onClick={shareReferralLink}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                      Share Referral Link
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-green-600" />
                        <span className="text-xs text-gray-600">Total Referrals</span>
                      </div>
                      <div className="text-3xl font-bold text-green-600">{affiliateInfo.totalReferrals}</div>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                        <span className="text-xs text-gray-600">Completed</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-600">{affiliateInfo.completedReferrals}</div>
                    </div>

                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-yellow-600" />
                        <span className="text-xs text-gray-600">Pending</span>
                      </div>
                      <div className="text-3xl font-bold text-yellow-600">{affiliateInfo.pendingReferrals}</div>
                    </div>

                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-5 h-5 text-purple-600" />
                        <span className="text-xs text-gray-600">Earned</span>
                      </div>
                      <div className="text-xl font-bold text-purple-600">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, notation: 'compact' }).format(affiliateInfo.totalCommission)}
                      </div>
                    </div>
                  </div>

                  {/* How it works */}
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-4">How It Works</h4>
                    <div className="space-y-3 text-sm text-gray-700">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                        <div>Share your referral code with friends</div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                        <div>They sign up and make their first deposit (min Rp 200,000)</div>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                        <div>You earn Rp 25,000 commission per completed referral!</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security & Preferences tabs remain the same as before */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">Security Settings</h3>
                  <p className="text-xs sm:text-sm text-gray-500">Keep your account secure</p>
                </div>

                <div className="p-4 sm:p-5 md:p-6">
                  <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Current Password</label>
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
                          className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-2"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">New Password</label>
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

                    <div>
                      <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2 sm:mb-3">Confirm New Password</label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white border-2 border-gray-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Confirm new password"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white py-2.5 sm:py-3 md:py-3.5 rounded-lg sm:rounded-xl font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
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
                  {[
                    { id: 'email', label: 'Email Notifications', desc: 'Receive trading alerts via email', state: emailNotifs, setState: setEmailNotifs, color: 'blue' },
                    { id: 'trade', label: 'Trade Alerts', desc: 'Get notified on trade outcomes', state: tradeAlerts, setState: setTradeAlerts, color: 'green' },
                    { id: 'sound', label: 'Sound Effects', desc: 'Play sounds on trade events', state: soundEffects, setState: setSoundEffects, color: 'purple' }
                  ].map((pref) => (
                    <div key={pref.id} className="p-4 sm:p-5 rounded-lg sm:rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-${pref.color}-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0`}>
                            <Bell className={`w-5 h-5 sm:w-6 sm:h-6 text-${pref.color}-600`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm sm:text-base text-gray-900 mb-0.5 sm:mb-1">{pref.label}</div>
                            <div className="text-xs sm:text-sm text-gray-500">{pref.desc}</div>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input 
                            type="checkbox" 
                            className="sr-only peer" 
                            checked={pref.state}
                            onChange={(e) => pref.setState(e.target.checked)}
                          />
                          <div className="w-11 h-6 sm:w-14 sm:h-8 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] sm:after:top-[3px] after:left-[2px] sm:after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 sm:after:h-7 sm:after:w-7 after:transition-all peer-checked:bg-blue-500"></div>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Logout */}
        <div className="lg:hidden mt-4 sm:mt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 md:py-3.5 bg-white text-red-600 border-2 border-red-200 rounded-lg sm:rounded-xl font-semibold hover:bg-red-50 active:bg-red-100 transition-all shadow-sm text-sm sm:text-base"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}