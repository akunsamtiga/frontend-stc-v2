'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { 
  User, Mail, Shield, Calendar, Lock, Bell, Eye, EyeOff, Save, LogOut,
  CheckCircle2, Settings, Award, Crown, TrendingUp, Users, Copy, Check,
  Gift, Share2, MapPin, CreditCard, FileText, Camera, Phone, Edit2,
  ChevronRight, AlertCircle, Home, Building, Globe, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import type { UserProfile, StatusInfo, AffiliateInfo, UserProfileInfo, UpdateProfileRequest } from '@/types'
import { getStatusGradient, getStatusIcon } from '@/lib/status-utils'

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  
  // Tabs
  const [activeTab, setActiveTab] = useState('overview')
  const [showMobileNav, setShowMobileNav] = useState(false)
  
  // Loading states
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [savingSection, setSavingSection] = useState<string | null>(null)
  
  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileInfo, setProfileInfo] = useState<UserProfileInfo | null>(null)
  
  // Edit states
  const [editingPersonal, setEditingPersonal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const [editingIdentity, setEditingIdentity] = useState(false)
  const [editingBank, setEditingBank] = useState(false)
  
  // Form data
  const [personalData, setPersonalData] = useState({
    fullName: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '' as 'male' | 'female' | 'other' | '',
    nationality: ''
  })
  
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Indonesia'
  })
  
  const [identityData, setIdentityData] = useState({
    type: 'ktp' as 'ktp' | 'passport' | 'sim',
    number: '',
    issuedDate: '',
    expiryDate: ''
  })
  
  const [bankData, setBankData] = useState({
    bankName: '',
    accountNumber: '',
    accountHolderName: ''
  })
  
  // Security
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  // Settings
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    tradingAlerts: true,
    twoFactorEnabled: false,
    language: 'id',
    timezone: 'Asia/Jakarta'
  })
  
  // Affiliate
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadProfile()
  }, [user, router])

  const loadProfile = async () => {
    try {
      setInitialLoading(true)
      const response = await api.getProfile()
      
      // Handle both response formats
      const data = response?.data || response
      
      if (!data) {
        throw new Error('No profile data received')
      }

      setProfile(data)
      
      // Set profile info with safe fallbacks
      if (data.profileInfo) {
        setProfileInfo(data.profileInfo)
        
        // Initialize form data with safe access
        setPersonalData({
          fullName: data.profileInfo.personal?.fullName || '',
          phoneNumber: data.profileInfo.personal?.phoneNumber || '',
          dateOfBirth: data.profileInfo.personal?.dateOfBirth || '',
          gender: data.profileInfo.personal?.gender || '',
          nationality: data.profileInfo.personal?.nationality || ''
        })
        
        if (data.profileInfo.address) {
          setAddressData({
            street: data.profileInfo.address.street || '',
            city: data.profileInfo.address.city || '',
            province: data.profileInfo.address.province || '',
            postalCode: data.profileInfo.address.postalCode || '',
            country: data.profileInfo.address.country || 'Indonesia'
          })
        }
        
        if (data.profileInfo.identity) {
          setIdentityData({
            type: data.profileInfo.identity.type || 'ktp',
            number: data.profileInfo.identity.number || '',
            issuedDate: '',
            expiryDate: ''
          })
        }
        
        if (data.profileInfo.bankAccount) {
          setBankData({
            bankName: data.profileInfo.bankAccount.bankName || '',
            accountNumber: data.profileInfo.bankAccount.accountNumber || '',
            accountHolderName: data.profileInfo.bankAccount.accountHolderName || ''
          })
        }
        
        if (data.profileInfo.settings) {
          setSettings(data.profileInfo.settings)
        }
      }
    } catch (error: any) {
      console.error('Failed to load profile:', error)
      toast.error(error?.message || 'Failed to load profile')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleUpdatePersonal = async () => {
    setSavingSection('personal')
    try {
      // Validate data
      if (personalData.fullName && personalData.fullName.trim().length < 3) {
        toast.error('Full name must be at least 3 characters')
        return
      }

      await api.updateProfile({
        fullName: personalData.fullName || undefined,
        phoneNumber: personalData.phoneNumber || undefined,
        dateOfBirth: personalData.dateOfBirth || undefined,
        gender: personalData.gender || undefined,
        nationality: personalData.nationality || undefined
      })
      
      toast.success('Personal information updated!')
      setEditingPersonal(false)
      await loadProfile()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update')
    } finally {
      setSavingSection(null)
    }
  }

  const handleUpdateAddress = async () => {
    setSavingSection('address')
    try {
      await api.updateProfile({
        address: addressData
      })
      
      toast.success('Address updated!')
      setEditingAddress(false)
      await loadProfile()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update')
    } finally {
      setSavingSection(null)
    }
  }

  const handleUpdateIdentity = async () => {
    setSavingSection('identity')
    try {
      await api.updateProfile({
        identityDocument: identityData
      })
      
      toast.success('Identity document updated!')
      setEditingIdentity(false)
      await loadProfile()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update')
    } finally {
      setSavingSection(null)
    }
  }

  const handleUpdateBank = async () => {
    setSavingSection('bank')
    try {
      await api.updateProfile({
        bankAccount: bankData
      })
      
      toast.success('Bank account updated!')
      setEditingBank(false)
      await loadProfile()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update')
    } finally {
      setSavingSection(null)
    }
  }

  const handleUpdateSettings = async () => {
    setSavingSection('settings')
    try {
      await api.updateProfile({
        settings
      })
      
      toast.success('Settings updated!')
      await loadProfile()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update')
    } finally {
      setSavingSection(null)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      await api.changePassword(passwordData)
      
      toast.success('Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadAvatar = async (file: File) => {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }

      // Show loading toast
      const uploadToast = toast.loading('Uploading avatar...')

      // Convert to base64
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const url = reader.result as string
          await api.uploadAvatar({ url })
          
          toast.success('Avatar uploaded!', { id: uploadToast })
          await loadProfile()
        } catch (error) {
          toast.error('Failed to upload avatar', { id: uploadToast })
        }
      }
      reader.onerror = () => {
        toast.error('Failed to read image file', { id: uploadToast })
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast.error('Failed to process image')
    }
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

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.push('/')
  }

  if (!user) return null

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-[#fafafa]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <div className="text-sm text-gray-500">Loading profile...</div>
          </div>
        </div>
      </div>
    )
  }

  const statusInfo = profile?.statusInfo
  const affiliateInfo = profile?.affiliate
  
  // ✅ Get the React component (not string)
  const StatusIcon = statusInfo ? getStatusIcon(statusInfo.current) : User

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'identity', label: 'Identity', icon: FileText },
    { id: 'bank', label: 'Bank Account', icon: CreditCard },
    { id: 'status', label: 'Status', icon: Award },
    { id: 'affiliate', label: 'Affiliate', icon: Users },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Settings }
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
            <span className="text-gray-900 font-medium">Profile</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">My Profile</h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Profile completion: {profileInfo?.completion || 0}%
              </p>
            </div>
          </div>
        </div>

        {/* Profile Completion Progress */}
        {profileInfo && profileInfo.completion < 100 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Complete Your Profile</h3>
                <p className="text-sm text-blue-700">
                  Get the full experience by completing your profile information
                </p>
              </div>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${profileInfo.completion}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Mobile Navigation */}
        <div className="lg:hidden mb-4 sm:mb-6">
          <button
            onClick={() => setShowMobileNav(!showMobileNav)}
            className="w-full flex items-center justify-between p-3 sm:p-4 bg-white border border-gray-200 rounded-lg sm:rounded-xl"
          >
            <div className="flex items-center gap-2 sm:gap-3">
              {React.createElement(tabs.find(t => t.id === activeTab)!.icon, {
                className: "w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
              })}
              <span className="font-medium text-sm sm:text-base text-gray-900">
                {tabs.find(t => t.id === activeTab)?.label}
              </span>
            </div>
            <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showMobileNav ? 'rotate-90' : ''}`} />
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
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base ${
                      activeTab === tab.id
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
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
              <div className={`h-24 bg-gradient-to-r ${getStatusGradient(statusInfo?.current || 'standard')}`}></div>
              <div className="p-6 -mt-12">
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center">
                      {profileInfo?.avatar?.url ? (
                        <img 
                          src={profileInfo.avatar.url} 
                          alt="Avatar" 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getStatusGradient(statusInfo?.current || 'standard')} flex items-center justify-center`}>
                          <StatusIcon className="w-10 h-10 text-white" />
                        </div>
                      )}
                    </div>
                    <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                      <Camera className="w-4 h-4 text-white" />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            handleUploadAvatar(e.target.files[0])
                          }
                        }}
                      />
                    </label>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {profileInfo?.personal?.fullName || user.email}
                  </h3>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${getStatusGradient(statusInfo?.current || 'standard')} rounded-lg text-sm font-medium text-white mb-3`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusInfo?.current.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                      {user.isActive ? 'Active' : 'Inactive'}
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

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-red-600 border-2 border-red-200 rounded-xl font-semibold hover:bg-red-50 transition-all shadow-sm"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-8 xl:col-span-9">
            {/* Overview Tab */}
            {activeTab === 'overview' && profileInfo && (
              <div className="space-y-6">
                {/* Verification Status */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Verification Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Email', verified: profileInfo.verification?.emailVerified, icon: Mail },
                      { label: 'Phone', verified: profileInfo.verification?.phoneVerified, icon: Phone },
                      { label: 'Identity', verified: profileInfo.verification?.identityVerified, icon: FileText },
                      { label: 'Bank', verified: profileInfo.verification?.bankVerified, icon: CreditCard }
                    ].map((item) => (
                      <div key={item.label} className={`p-4 rounded-xl border-2 ${item.verified ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <item.icon className={`w-5 h-5 ${item.verified ? 'text-green-600' : 'text-gray-400'}`} />
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                            <div className={`text-xs font-medium ${item.verified ? 'text-green-600' : 'text-gray-500'}`}>
                              {item.verified ? 'Verified' : 'Not Verified'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">
                        Verification Level: {(profileInfo.verification?.verificationLevel || 'unverified').toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700">
                      Complete all verifications to unlock full features
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setActiveTab('personal')}
                    className="p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                  >
                    <User className="w-8 h-8 text-blue-600 mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 mb-1">Personal Info</div>
                      <div className="text-sm text-gray-500">Update your details</div>
                    </div>
                  </button>

                  <button
                    onClick={() => setActiveTab('security')}
                    className="p-6 bg-white rounded-xl border border-gray-200 hover:border-red-300 hover:shadow-md transition-all group"
                  >
                    <Lock className="w-8 h-8 text-red-600 mb-3 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <div className="font-semibold text-gray-900 mb-1">Security</div>
                      <div className="text-sm text-gray-500">Change password</div>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Personal Info Tab */}
            {activeTab === 'personal' && profileInfo && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">Personal Information</h3>
                    <p className="text-sm text-gray-500">Your basic personal details</p>
                  </div>
                  {!editingPersonal ? (
                    <button
                      onClick={() => setEditingPersonal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingPersonal(false)}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        disabled={savingSection === 'personal'}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpdatePersonal}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                        disabled={savingSection === 'personal'}
                      >
                        {savingSection === 'personal' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                    {editingPersonal ? (
                      <input
                        type="text"
                        value={personalData.fullName}
                        onChange={(e) => setPersonalData({ ...personalData, fullName: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                        {profileInfo.personal?.fullName || '-'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                    {editingPersonal ? (
                      <input
                        type="tel"
                        value={personalData.phoneNumber}
                        onChange={(e) => setPersonalData({ ...personalData, phoneNumber: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="+62..."
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                        {profileInfo.personal?.phoneNumber || '-'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                    {editingPersonal ? (
                      <input
                        type="date"
                        value={personalData.dateOfBirth}
                        onChange={(e) => setPersonalData({ ...personalData, dateOfBirth: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                        {profileInfo.personal?.dateOfBirth ? new Date(profileInfo.personal.dateOfBirth).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : '-'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                    {editingPersonal ? (
                      <select
                        value={personalData.gender}
                        onChange={(e) => setPersonalData({ ...personalData, gender: e.target.value as any })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium capitalize">
                        {profileInfo.personal?.gender || '-'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nationality</label>
                    {editingPersonal ? (
                      <input
                        type="text"
                        value={personalData.nationality}
                        onChange={(e) => setPersonalData({ ...personalData, nationality: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                        placeholder="e.g., Indonesian"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                        {profileInfo.personal?.nationality || '-'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">Security Settings</h3>
                  <p className="text-sm text-gray-500">Change your password</p>
                </div>

                <form onSubmit={handleChangePassword} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors pr-12"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Confirm New Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Logout */}
        <div className="lg:hidden mt-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-red-600 border-2 border-red-200 rounded-xl font-semibold"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}