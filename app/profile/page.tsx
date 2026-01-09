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
  ChevronRight, AlertCircle, Home, Building, Globe, Loader2, ShieldCheck,
  UserCheck, Briefcase, X, Menu
} from 'lucide-react'
import { toast } from 'sonner'
import type { UserProfile, UserProfileInfo, UpdateProfileRequest, ChangePasswordRequest } from '@/types'
import { STATUS_CONFIG, calculateProfileCompletion } from '@/types'
import { getStatusGradient, getStatusIcon, formatStatusInfo, getAllStatusTiers, calculateStatusProgress, formatDepositRequirement } from '@/lib/status-utils'

// ===================================
// SKELETON COMPONENTS
// ===================================

const SkeletonTabs = () => (
  <div className="space-y-1 animate-pulse">
    {[...Array(9)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-3">
        <div className="w-5 h-5 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
    ))}
  </div>
)

const SkeletonCard = () => (
  <div className="bg-white rounded-xl border border-gray-200 animate-pulse">
    <div className="p-6 border-b border-gray-200">
      <div className="h-6 bg-gray-200 rounded w-40 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </div>
    <div className="p-6 space-y-4">
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
      <div>
        <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#fafafa]">
    <Navbar />
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
      <div className="mb-6 animate-pulse">
        <div className="h-3 bg-gray-200 rounded w-48 mb-3"></div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        {/* Sidebar Skeleton */}
        <div className="hidden md:block md:col-span-4 lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <SkeletonTabs />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="col-span-1 md:col-span-8 lg:col-span-9">
          <SkeletonCard />
        </div>
      </div>
    </div>
  </div>
)

// ===================================
// MAIN COMPONENT
// ===================================

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  
  // Tabs
  const [activeTab, setActiveTab] = useState('overview')
  
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
      const data = response?.data || response
      
      if (!data) throw new Error('No profile data received')

      setProfile(data)
      
      if (data.profileInfo) {
        setProfileInfo(data.profileInfo)
        
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
      await api.updateProfile({ address: addressData })
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
      await api.updateProfile({ identityDocument: identityData })
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
      await api.updateProfile({ bankAccount: bankData })
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
      await api.updateProfile({ settings })
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
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const handleUploadAvatar = async (file: File) => {
    try {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return false
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return false
      }

      const uploadToast = toast.loading('Uploading avatar...')
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
      return true
    } catch (error) {
      toast.error('Failed to process image')
      return false
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

  const statusInfo = profile?.statusInfo
  const affiliateInfo = profile?.affiliate

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'identity', label: 'Identity', icon: FileText },
    { id: 'bank', label: 'Bank', icon: CreditCard },
    { id: 'status', label: 'Status', icon: Award },
    { id: 'affiliate', label: 'Affiliate', icon: Users },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Settings }
  ]

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4 md:space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden">
                    {profileInfo?.avatar?.url ? (
                      <img src={profileInfo.avatar.url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-2xl md:text-3xl font-bold">
                        {user.email[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors shadow-lg border-2 md:border-4 border-white">
                    <Camera className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      if (e.target.files?.[0]) handleUploadAvatar(e.target.files[0])
                    }} />
                  </label>
                </div>

                {/* Info */}
                <div className="flex-1 w-full">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
                    {profileInfo?.personal?.fullName || user?.email}
                  </h2>
                  <p className="text-sm md:text-base text-gray-600 mb-3 break-all">{user?.email}</p>
                  
                  {statusInfo && (
                    <div className={`inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg md:rounded-xl text-white shadow-lg text-sm md:text-base ${
                      statusInfo.current === 'standard' ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                      statusInfo.current === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-orange-600' :
                      'bg-gradient-to-r from-purple-400 to-pink-600'
                    }`}>
                      {React.createElement(getStatusIcon(statusInfo.current), { className: "w-4 h-4 md:w-5 md:h-5" })}
                      <span className="font-semibold">{statusInfo.current.toUpperCase()}</span>
                      <span className="opacity-90">{statusInfo.profitBonus}% Bonus</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Completion */}
            {profileInfo && profileInfo.completion < 100 && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Complete Your Profile</h3>
                    <p className="text-xs md:text-sm text-blue-700">Unlock all features by completing your profile</p>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-blue-600">{profileInfo.completion}%</div>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 md:h-3">
                  <div 
                    className="h-2 md:h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500" 
                    style={{ width: `${profileInfo.completion}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
                <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">Real Balance</div>
                <div className="text-lg md:text-2xl font-bold text-gray-900">
                  Rp {(profile?.balances?.real ?? 0).toLocaleString('id-ID')}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
                <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">Demo Balance</div>
                <div className="text-lg md:text-2xl font-bold text-gray-900">
                  Rp {(profile?.balances?.demo ?? 0).toLocaleString('id-ID')}
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4 md:p-6">
                <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">Total Orders</div>
                <div className="text-lg md:text-2xl font-bold text-gray-900">
                  {profile?.statistics?.combined?.totalOrders ?? 0}
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 md:mb-4">Verification Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4">
                {[
                  { label: 'Email', verified: profileInfo?.verification?.emailVerified, icon: Mail },
                  { label: 'Phone', verified: profileInfo?.verification?.phoneVerified, icon: Phone },
                  { label: 'Identity', verified: profileInfo?.verification?.identityVerified, icon: FileText },
                  { label: 'Bank', verified: profileInfo?.verification?.bankVerified, icon: CreditCard }
                ].map((item) => (
                  <div key={item.label} className={`flex items-center gap-3 p-3 md:p-4 rounded-lg md:rounded-xl border-2 ${item.verified ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <item.icon className={`w-4 h-4 md:w-5 md:h-5 ${item.verified ? 'text-green-600' : 'text-gray-400'}`} />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                      <div className={`text-xs font-medium ${item.verified ? 'text-green-600' : 'text-gray-500'}`}>
                        {item.verified ? 'Verified' : 'Not Verified'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'personal':
        return (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Personal Information</h3>
                <p className="text-xs md:text-sm text-gray-500">Your basic personal details</p>
              </div>
              {!editingPersonal ? (
                <button onClick={() => setEditingPersonal(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditingPersonal(false)} disabled={savingSection === 'personal'} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={handleUpdatePersonal} disabled={savingSection === 'personal'} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
                    {savingSection === 'personal' ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                {editingPersonal ? (
                  <input type="text" value={personalData.fullName} onChange={(e) => setPersonalData({ ...personalData, fullName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="Enter your full name" />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{profileInfo?.personal?.fullName || '-'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                {editingPersonal ? (
                  <input type="tel" value={personalData.phoneNumber} onChange={(e) => setPersonalData({ ...personalData, phoneNumber: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="+62..." />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{profileInfo?.personal?.phoneNumber || '-'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date of Birth</label>
                {editingPersonal ? (
                  <input type="date" value={personalData.dateOfBirth} onChange={(e) => setPersonalData({ ...personalData, dateOfBirth: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                    {profileInfo?.personal?.dateOfBirth ? new Date(profileInfo.personal.dateOfBirth).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Gender</label>
                {editingPersonal ? (
                  <select value={personalData.gender} onChange={(e) => setPersonalData({ ...personalData, gender: e.target.value as any })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors">
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium capitalize">{profileInfo?.personal?.gender || '-'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nationality</label>
                {editingPersonal ? (
                  <input type="text" value={personalData.nationality} onChange={(e) => setPersonalData({ ...personalData, nationality: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="e.g., Indonesian" />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{profileInfo?.personal?.nationality || '-'}</div>
                )}
              </div>
            </div>
          </div>
        )

      case 'address':
        return (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Address Information</h3>
                <p className="text-xs md:text-sm text-gray-500">Your residential address</p>
              </div>
              {!editingAddress ? (
                <button onClick={() => setEditingAddress(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditingAddress(false)} disabled={savingSection === 'address'} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={handleUpdateAddress} disabled={savingSection === 'address'} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
                    {savingSection === 'address' ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Street Address</label>
                {editingAddress ? (
                  <input type="text" value={addressData.street} onChange={(e) => setAddressData({ ...addressData, street: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="Jl. Merdeka No. 123" />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{addressData.street || '-'}</div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                  {editingAddress ? (
                    <input type="text" value={addressData.city} onChange={(e) => setAddressData({ ...addressData, city: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="Jakarta" />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{addressData.city || '-'}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Province</label>
                  {editingAddress ? (
                    <input type="text" value={addressData.province} onChange={(e) => setAddressData({ ...addressData, province: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="DKI Jakarta" />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{addressData.province || '-'}</div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                  {editingAddress ? (
                    <input type="text" value={addressData.postalCode} onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="12345" />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{addressData.postalCode || '-'}</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                  {editingAddress ? (
                    <input type="text" value={addressData.country} onChange={(e) => setAddressData({ ...addressData, country: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="Indonesia" />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{addressData.country || '-'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )

      case 'identity':
        return (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Identity Verification</h3>
                <p className="text-xs md:text-sm text-gray-500">Verify your identity for higher limits</p>
              </div>
              {!editingIdentity ? (
                <button onClick={() => setEditingIdentity(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditingIdentity(false)} disabled={savingSection === 'identity'} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={handleUpdateIdentity} disabled={savingSection === 'identity'} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
                    {savingSection === 'identity' ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Document Type</label>
                {editingIdentity ? (
                  <select value={identityData.type} onChange={(e) => setIdentityData({ ...identityData, type: e.target.value as any })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors">
                    <option value="ktp">KTP</option>
                    <option value="passport">Passport</option>
                    <option value="sim">SIM</option>
                  </select>
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium uppercase">{identityData.type || '-'}</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Document Number</label>
                {editingIdentity ? (
                  <input type="text" value={identityData.number} onChange={(e) => setIdentityData({ ...identityData, number: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="Enter document number" />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{identityData.number || '-'}</div>
                )}
              </div>
              
              {profileInfo?.identity?.isVerified && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">Identity Verified</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'bank':
        return (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Bank Account</h3>
                <p className="text-xs md:text-sm text-gray-500">Add your bank account for withdrawals</p>
              </div>
              {!editingBank ? (
                <button onClick={() => setEditingBank(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  <Edit2 className="w-4 h-4" /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditingBank(false)} disabled={savingSection === 'bank'} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                    Cancel
                  </button>
                  <button onClick={handleUpdateBank} disabled={savingSection === 'bank'} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
                    {savingSection === 'bank' ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
                  </button>
                </div>
              )}
            </div>
            
            <div className="p-4 md:p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name</label>
                {editingBank ? (
                  <input type="text" value={bankData.bankName} onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="e.g., Bank Mandiri" />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{bankData.bankName || '-'}</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Number</label>
                {editingBank ? (
                  <input type="text" value={bankData.accountNumber} onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="1234567890" />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{bankData.accountNumber || '-'}</div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Account Holder Name</label>
                {editingBank ? (
                  <input type="text" value={bankData.accountHolderName} onChange={(e) => setBankData({ ...bankData, accountHolderName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" placeholder="John Doe" />
                ) : (
                  <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">{bankData.accountHolderName || '-'}</div>
                )}
              </div>
              
              {profileInfo?.bankAccount?.isVerified && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-semibold text-green-900">Bank Account Verified</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      case 'status':
        if (!statusInfo) return null

        const safeStatus = ['standard', 'gold', 'vip'].includes(statusInfo.current) 
          ? statusInfo.current 
          : 'standard'

        const progressInfo = calculateStatusProgress(statusInfo.totalDeposit, safeStatus)
        const allTiers = getAllStatusTiers()

        return (
          <div className="space-y-4 md:space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Your Status</h3>
              <div className={`flex flex-col sm:flex-row items-center sm:items-center gap-4 p-4 md:p-6 rounded-xl text-white ${
                statusInfo.current === 'standard' ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                statusInfo.current === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-orange-600' :
                'bg-gradient-to-r from-purple-400 to-pink-600'
              }`}>
                {React.createElement(getStatusIcon(statusInfo.current), { className: "w-10 h-10 md:w-12 md:h-12" })}
                <div className="text-center sm:text-left">
                  <div className="text-xl md:text-2xl font-bold mb-1">{statusInfo.current.toUpperCase()}</div>
                  <div className="opacity-90 text-sm md:text-base">{formatStatusInfo(statusInfo)}</div>
                </div>
              </div>
            </div>

            {/* Progress to Next Status */}
            {progressInfo.next && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">Progress to Next Status</h3>
                <div className="mb-4">
                  <div className="flex justify-between text-xs md:text-sm mb-2">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold">{progressInfo.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 md:h-3">
                    <div className={`h-2 md:h-3 rounded-full transition-all duration-500 ${
                      statusInfo.current === 'standard' ? 'bg-gradient-to-r from-gray-400 to-gray-600' :
                      statusInfo.current === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-orange-600' :
                      'bg-gradient-to-r from-purple-400 to-pink-600'
                    }`} style={{ width: `${progressInfo.progress}%` }}>
                    </div>
                  </div>
                </div>
                <p className="text-xs md:text-sm text-gray-600">
                  Deposit <span className="font-bold">{formatDepositRequirement(progressInfo.depositNeeded)}</span> more to unlock {STATUS_CONFIG[progressInfo.next].label} status!
                </p>
              </div>
            )}

            {/* All Status Tiers */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">All Status Tiers</h3>
              <div className="space-y-3">
                {allTiers.map(({ status, config, icon: Icon }) => {
                  const isCurrent = status === statusInfo.current
                  const isUnlocked = STATUS_CONFIG[status].minDeposit <= statusInfo.totalDeposit
                  
                  return (
                    <div key={status} className={`p-3 md:p-4 border-2 rounded-xl ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-6 md:w-6 md:h-6 ${isCurrent || isUnlocked ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div>
                            <div className="font-semibold text-gray-900 text-sm md:text-base">{config.label}</div>
                            <div className="text-xs md:text-sm text-gray-600">Bonus: {config.profitBonus}</div>
                          </div>
                        </div>
                        <div className="text-xs md:text-sm font-semibold text-gray-900">
                          {formatDepositRequirement(config.minDeposit)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )

      case 'affiliate':
        if (!affiliateInfo) return null

        return (
          <div className="space-y-4 md:space-y-6">
            {/* Affiliate Overview */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Affiliate Program</h3>
              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div className="text-center p-3 md:p-4 bg-gray-50 rounded-xl">
                  <div className="text-xl md:text-3xl font-bold text-gray-900">{affiliateInfo.totalReferrals}</div>
                  <div className="text-xs md:text-sm text-gray-600 mt-1">Total Referrals</div>
                </div>
                <div className="text-center p-3 md:p-4 bg-green-50 rounded-xl">
                  <div className="text-xl md:text-3xl font-bold text-green-600">{affiliateInfo.completedReferrals}</div>
                  <div className="text-xs md:text-sm text-gray-600 mt-1">Completed</div>
                </div>
                <div className="text-center p-3 md:p-4 bg-yellow-50 rounded-xl">
                  <div className="text-xl md:text-3xl font-bold text-yellow-600">{affiliateInfo.pendingReferrals}</div>
                  <div className="text-xs md:text-sm text-gray-600 mt-1">Pending</div>
                </div>
              </div>
            </div>

            {/* Referral Link */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">Your Referral Link</h3>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-mono text-xs md:text-sm break-all">
                  {`${window.location.origin}/?ref=${affiliateInfo.referralCode}`}
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/?ref=${affiliateInfo.referralCode}`)
                    setCopied(true)
                    toast.success('Referral link copied!')
                    setTimeout(() => setCopied(false), 2000)
                  }}
                  className="px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors flex-shrink-0 flex sm:block justify-center"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs md:text-sm text-gray-600 mt-3">
                Share this link to earn <span className="font-bold">Rp 25,000</span> per successful referral!
              </p>
            </div>

            {/* Commission Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4">Commission Earned</h3>
              <div className="flex items-center gap-4">
                <Gift className="w-10 h-10 md:w-12 md:h-12 text-yellow-500" />
                <div>
                  <div className="text-xl md:text-3xl font-bold text-gray-900">{formatDepositRequirement(affiliateInfo.totalCommission)}</div>
                  <div className="text-xs md:text-sm text-gray-600">Total Commission</div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'security':
        return (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Security Settings</h3>
              <p className="text-xs md:text-sm text-gray-500">Change your password</p>
            </div>

            <form onSubmit={handleChangePassword} className="p-4 md:p-6 space-y-4 md:space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Current Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors pr-12" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">New Password</label>
                <input type={showPassword ? 'text' : 'password'} value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Confirm New Password</label>
                <input type={showPassword ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" required />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Changing Password...</> : 'Change Password'}
              </button>
            </form>
          </div>
        )

      case 'preferences':
        return (
          <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 mb-4 md:mb-6">
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Preferences</h3>
                <p className="text-xs md:text-sm text-gray-500">Customize your experience</p>
              </div>
              <button onClick={handleUpdateSettings} disabled={savingSection === 'settings'} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
                {savingSection === 'settings' ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save</>}
              </button>
            </div>

            <div className="space-y-4 md:space-y-6">
              {/* Notifications */}
              <div>
                <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Notifications</h4>
                <div className="space-y-2 md:space-y-3">
                  <label className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <span className="text-sm text-gray-700 font-medium">Email Notifications</span>
                    <input type="checkbox" checked={settings.emailNotifications} onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  </label>
                  <label className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <span className="text-sm text-gray-700 font-medium">SMS Notifications</span>
                    <input type="checkbox" checked={settings.smsNotifications} onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  </label>
                  <label className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                    <span className="text-sm text-gray-700 font-medium">Trading Alerts</span>
                    <input type="checkbox" checked={settings.tradingAlerts} onChange={(e) => setSettings({ ...settings, tradingAlerts: e.target.checked })} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                  </label>
                </div>
              </div>

              {/* Language & Timezone */}
              <div>
                <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3">Regional Settings</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
                    <select value={settings.language} onChange={(e) => setSettings({ ...settings, language: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors">
                      <option value="id">Bahasa Indonesia</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
                    <input type="text" value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-2 md:mb-3">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">Profile</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-xs md:text-sm text-gray-500">Profile completion: {profileInfo?.completion ?? 0}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* Sidebar - Tabs */}
          <div className="col-span-1 md:col-span-4 lg:col-span-3">
            {/* Mobile Horizontal Tabs */}
            <div className="md:hidden bg-white rounded-xl border border-gray-200 p-2 mb-4">
              <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm flex-shrink-0 ${
                          activeTab === tab.id
                            ? 'bg-blue-500 text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{tab.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Desktop/Tablet Vertical Tabs */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 p-2 sticky top-4">
              <div className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                        activeTab === tab.id
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm">{tab.label}</span>
                    </button>
                  )
                })}
                
                {/* Logout Button */}
                <div className="pt-2 mt-2 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all text-left"
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="col-span-1 md:col-span-8 lg:col-span-9">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  )
}