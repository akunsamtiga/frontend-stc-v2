'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import { 
  User, Mail, Shield, Calendar, Lock, Bell, Eye, EyeOff, Save, LogOut,
  CheckCircle2, Settings, Award, Crown, TrendingUp, Users, Copy, Check,
  Gift, Share2, MapPin, CreditCard, FileText, Camera, Phone, Edit2,
  ChevronRight, AlertCircle, Home, Building, Globe, Loader2, ShieldCheck,
  UserCheck, Briefcase, X, Menu, Info, Eye as EyeIcon, CheckSquare, Square
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import type { UserProfile, UserProfileInfo, UpdateProfileRequest, ChangePasswordRequest } from '@/types'
import { STATUS_CONFIG, calculateProfileCompletion } from '@/types'
import { getStatusGradient, getStatusIcon, formatStatusInfo, getAllStatusTiers, calculateStatusProgress, formatDepositRequirement } from '@/lib/status-utils'

// ===================================
// ENHANCED COMPONENTS
// ===================================

// Animation Variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" }
  }
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
}

const slideIn: Variants = {
  hidden: { x: -20, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.3 } }
}

const scaleIn: Variants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.2 } }
}

// Enhanced Skeleton with shimmer effect
const SkeletonTabs = () => (
  <motion.div 
    className="space-y-1"
    initial="hidden"
    animate="visible"
    variants={staggerContainer}
  >
    {[...Array(9)].map((_, i) => (
      <motion.div key={i} variants={fadeInUp}>
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-5 h-5 bg-gray-200 rounded shimmer"></div>
          <div className="h-4 bg-gray-200 rounded w-24 shimmer"></div>
        </div>
      </motion.div>
    ))}
  </motion.div>
)

const SkeletonCard = () => (
  <motion.div 
    className="bg-white rounded-xl border border-gray-200"
    initial="hidden"
    animate="visible"
    variants={fadeInUp}
  >
    <div className="p-6 border-b border-gray-200">
      <div className="h-6 bg-gray-200 rounded w-40 mb-2 shimmer"></div>
      <div className="h-4 bg-gray-200 rounded w-32 shimmer"></div>
    </div>
    <div className="p-6 space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-24 mb-2 shimmer"></div>
          <div className="h-12 bg-gray-200 rounded shimmer"></div>
        </div>
      ))}
    </div>
  </motion.div>
)

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
    <Navbar />
    <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="h-3 bg-gray-200 rounded w-48 mb-3 shimmer"></div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-xl shimmer"></div>
          <div>
            <div className="h-6 bg-gray-200 rounded w-32 mb-2 shimmer"></div>
            <div className="h-4 bg-gray-200 rounded w-48 shimmer"></div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
        <div className="hidden md:block md:col-span-4 lg:col-span-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <SkeletonTabs />
          </div>
        </div>
        <div className="col-span-1 md:col-span-8 lg:col-span-9">
          <SkeletonCard />
        </div>
      </div>
    </div>
  </div>
)

// Validation Utilities
const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const validatePhone = (phone: string) => /^\+?[\d\s-()]{10,}$/.test(phone)
const validatePassword = (password: string) => ({
  minLength: password.length >= 8,
  hasUpperCase: /[A-Z]/.test(password),
  hasLowerCase: /[a-z]/.test(password),
  hasNumber: /\d/.test(password),
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
})

// Custom Hooks
const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debounced
}

// Enhanced Components
const PasswordStrengthMeter = ({ password }: { password: string }) => {
  if (!password) return null
  
  const checks = validatePassword(password)
  const strength = Object.values(checks).filter(Boolean).length
  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']
  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  
  return (
    <motion.div 
      className="mt-2"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
    >
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div 
          className={`h-full ${colors[strength - 1] || 'bg-red-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${(strength / 5) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <p className="text-xs text-gray-600 mt-1">{labels[strength - 1] || 'Very Weak'}</p>
      <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
        {Object.entries(checks).map(([key, passed]) => (
          <motion.div 
            key={key} 
            className="flex items-center gap-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            {passed ? <Check className="w-3 h-3 text-green-500" /> : <X className="w-3 h-3 text-red-400" />}
            <span className={passed ? 'text-green-600' : 'text-gray-400'}>
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

const PhoneInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let phone = e.target.value.replace(/\D/g, '')
    if (phone.startsWith('0')) phone = '+62' + phone.slice(1)
    if (!phone.startsWith('+') && phone) phone = '+' + phone
    
    onChange(phone)
  }

  return (
    <div className="relative">
      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
        placeholder="+62..."
      />
    </div>
  )
}

const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false)
  
  return (
    <div className="relative inline-block ml-2">
      <Info 
        className="w-4 h-4 text-gray-400 cursor-help" 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50"
          >
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">{title}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onConfirm}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

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
  const [autoSaving, setAutoSaving] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false) // ✅ TAMBAHKAN INI

  // Profile data
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileInfo, setProfileInfo] = useState<UserProfileInfo | null>(null)
  const [ktpFrontFile, setKtpFrontFile] = useState<File | null>(null)
  const [ktpBackFile, setKtpBackFile] = useState<File | null>(null)
  
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
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  
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
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  
  // Form validation states
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  // FIX: Move style injection to useEffect
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .shimmer {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }
      
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `
    document.head.appendChild(style)
    
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    loadProfile()
  }, [user, router])

  // Auto-save functionality for personal info
  const debouncedPersonalData = useDebounce(JSON.stringify(personalData), 1000)
  useEffect(() => {
    if (editingPersonal && Object.values(personalData).some(v => v)) {
      setAutoSaving('personal')
      setTimeout(() => setAutoSaving(null), 1000)
    }
  }, [debouncedPersonalData, editingPersonal])

  const loadProfile = async () => {
  try {
    setInitialLoading(true)
    const response = await api.getProfile()
    
    // ✅ FIX: Properly extract UserProfile from response
    let data: UserProfile | null = null
    
    if (response && typeof response === 'object') {
      // Check if it's wrapped in ApiResponse (has data property)
      if ('data' in response && response.data) {
        data = response.data as UserProfile
      } 
      // Otherwise, response itself is UserProfile (has user property)
      else if ('user' in response && 'statusInfo' in response) {
        data = response as UserProfile
      }
    }
    
    if (!data) {
      throw new Error('No profile data received')
    }

    setProfile(data)
    
    // ✅ FIX: Safely access profileInfo
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
    toast.error(error?.message || 'Failed to load profile', {
      style: { background: '#ef4444', color: '#fff' }
    })
  } finally {
    setInitialLoading(false)
  }
}

  // Validation functions
  const validateField = useCallback((field: string, value: string): string => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required'
        if (value.trim().length < 3) return 'Must be at least 3 characters'
        return ''
      case 'phoneNumber':
        if (!value) return 'Phone number is required'
        if (!validatePhone(value)) return 'Invalid phone format'
        return ''
      case 'dateOfBirth':
        if (!value) return 'Date of birth is required'
        const age = new Date().getFullYear() - new Date(value).getFullYear()
        if (age < 18) return 'Must be at least 18 years old'
        return ''
      case 'street':
      case 'city':
      case 'province':
        if (!value.trim()) return 'This field is required'
        return ''
      case 'accountNumber':
        if (!value.trim()) return 'Account number is required'
        if (!/^\d+$/.test(value)) return 'Must contain only numbers'
        return ''
      case 'accountHolderName':
        if (!value.trim()) return 'Account holder name is required'
        return ''
      case 'identityNumber':
        if (!value.trim()) return 'Document number is required'
        return ''
      default:
        return ''
    }
  }, [])

  const validateForm = useCallback((data: Record<string, string>, fields: string[]) => {
    const errors: Record<string, string> = {}
    fields.forEach(field => {
      const error = validateField(field, data[field] || '')
      if (error) errors[field] = error
    })
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }, [validateField])

  // Auto-validate on blur
  const handleBlur = (field: string, value: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, value)
    setFormErrors(prev => ({ ...prev, [field]: error }))
  }

  // Enhanced update handlers
  const handleUpdatePersonal = async () => {
    const isValid = validateForm({
      fullName: personalData.fullName,
      phoneNumber: personalData.phoneNumber,
      dateOfBirth: personalData.dateOfBirth
    }, ['fullName', 'phoneNumber', 'dateOfBirth'])

    if (!isValid) {
      toast.error('Please fix the errors before saving', {
        style: { background: '#ef4444', color: '#fff' }
      })
      return
    }

    setSavingSection('personal')
    try {
      await api.updateProfile({
        fullName: personalData.fullName || undefined,
        phoneNumber: personalData.phoneNumber || undefined,
        dateOfBirth: personalData.dateOfBirth || undefined,
        gender: personalData.gender || undefined,
        nationality: personalData.nationality || undefined
      })
      
      toast.success('Personal information updated!', {
        style: { background: '#10b981', color: '#fff' }
      })
      
      // Exit edit mode with animation
      setEditingPersonal(false)
      setTimeout(() => loadProfile(), 300)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update', {
        style: { background: '#ef4444', color: '#fff' }
      })
    } finally {
      setSavingSection(null)
    }
  }

  const handleUpdateAddress = async () => {
    const isValid = validateForm({
      street: addressData.street,
      city: addressData.city,
      province: addressData.province
    }, ['street', 'city', 'province'])

    if (!isValid) {
      toast.error('Please fill all required fields', {
        style: { background: '#ef4444', color: '#fff' }
      })
      return
    }

    setSavingSection('address')
    try {
      await api.updateProfile({ address: addressData })
      toast.success('Address updated!', {
        style: { background: '#10b981', color: '#fff' }
      })
      setEditingAddress(false)
      setTimeout(() => loadProfile(), 300)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update', {
        style: { background: '#ef4444', color: '#fff' }
      })
    } finally {
      setSavingSection(null)
    }
  }

  const handleUpdateIdentity = async () => {
    const isValid = validateForm({
      identityNumber: identityData.number
    }, ['identityNumber'])

    if (!isValid) {
      toast.error('Please enter a valid document number', {
        style: { background: '#ef4444', color: '#fff' }
      })
      return
    }

    setSavingSection('identity')
    try {
      await api.updateProfile({ identityDocument: identityData })
      toast.success('Identity document updated!', {
        style: { background: '#10b981', color: '#fff' }
      })
      setEditingIdentity(false)
      setTimeout(() => loadProfile(), 300)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update', {
        style: { background: '#ef4444', color: '#fff' }
      })
    } finally {
      setSavingSection(null)
    }
  }

  const handleUpdateBank = async () => {
    const isValid = validateForm({
      bankName: bankData.bankName,
      accountNumber: bankData.accountNumber,
      accountHolderName: bankData.accountHolderName
    }, ['bankName', 'accountNumber', 'accountHolderName'])

    if (!isValid) {
      toast.error('Please fill all bank account fields', {
        style: { background: '#ef4444', color: '#fff' }
      })
      return
    }

    setSavingSection('bank')
    try {
      await api.updateProfile({ bankAccount: bankData })
      toast.success('Bank account updated!', {
        style: { background: '#10b981', color: '#fff' }
      })
      setEditingBank(false)
      setTimeout(() => loadProfile(), 300)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update', {
        style: { background: '#ef4444', color: '#fff' }
      })
    } finally {
      setSavingSection(null)
    }
  }

  const handleUpdateSettings = async () => {
    setSavingSection('settings')
    try {
      await api.updateProfile({ settings })
      toast.success('Settings updated!', {
        style: { background: '#10b981', color: '#fff' }
      })
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update', {
        style: { background: '#ef4444', color: '#fff' }
      })
    } finally {
      setSavingSection(null)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const passwordChecks = validatePassword(passwordData.newPassword)
    const strength = Object.values(passwordChecks).filter(Boolean).length
    
    if (strength < 4) {
      toast.error('Password must meet at least 4 requirements', {
        style: { background: '#ef4444', color: '#fff' }
      })
      return
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match', {
        style: { background: '#ef4444', color: '#fff' }
      })
      return
    }

    setLoading(true)
    try {
      await api.changePassword(passwordData)
      toast.success('Password changed successfully!', {
        style: { background: '#10b981', color: '#fff' }
      })
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordErrors([])
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to change password', {
        style: { background: '#ef4444', color: '#fff' }
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadAvatar = async (file: File) => {
    try {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file', {
          style: { background: '#ef4444', color: '#fff' }
        })
        return false
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB', {
          style: { background: '#ef4444', color: '#fff' }
        })
        return false
      }

      const uploadToast = toast.loading('Uploading avatar...', {
        style: { background: '#f59e0b', color: '#fff' }
      })
      const reader = new FileReader()
      
      reader.onloadend = async () => {
        try {
          const url = reader.result as string
          await api.uploadAvatar({ url })
          toast.success('Avatar uploaded!', {
            id: uploadToast,
            style: { background: '#10b981', color: '#fff' }
          })
          await loadProfile()
        } catch (error) {
          toast.error('Failed to upload avatar', {
            id: uploadToast,
            style: { background: '#ef4444', color: '#fff' }
          })
        }
      }
      
      reader.onerror = () => {
        toast.error('Failed to read image file', {
          id: uploadToast,
          style: { background: '#ef4444', color: '#fff' }
        })
      }
      
      reader.readAsDataURL(file)
      return true
    } catch (error) {
      toast.error('Failed to process image', {
        style: { background: '#ef4444', color: '#fff' }
      })
      return false
    }
  }

  // ✅ NEW: Upload KTP photos handler
  const uploadKTP = async (photoFront: File, photoBack?: File | null): Promise<boolean> => {
  try {
    console.log('ðŸ"¸ Starting KTP upload...', {
      frontSize: photoFront.size,
      frontType: photoFront.type,
      hasBack: !!photoBack
    })
    
    // Validate file types
    if (!photoFront.type.startsWith('image/')) {
      toast.error('Front photo must be an image file', {
        style: { background: '#ef4444', color: '#fff' }
      })
      return false
    }

    // Validate file size (2MB)
    if (photoFront.size > 2 * 1024 * 1024) {
      toast.error('Front photo size must be less than 2MB', {
        style: { background: '#ef4444', color: '#fff' }
      })
      return false
    }

    // Validate back photo if provided
    if (photoBack) {
      if (!photoBack.type.startsWith('image/')) {
        toast.error('Back photo must be an image file', {
          style: { background: '#ef4444', color: '#fff' }
        })
        return false
      }
      if (photoBack.size > 2 * 1024 * 1024) {
        toast.error('Back photo size must be less than 2MB', {
          style: { background: '#ef4444', color: '#fff' }
        })
        return false
      }
    }

    setUpdating(true)
    const uploadToast = toast.loading('Uploading KTP photos...', {
      style: { background: '#f59e0b', color: '#fff' }
    })

    try {
      // Convert front photo to base64
      console.log('ðŸ"„ Converting front photo to base64...')
      const photoFrontBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          if (reader.result) {
            console.log('âœ… Front photo converted')
            resolve(reader.result as string)
          } else {
            reject(new Error('Failed to read front photo'))
          }
        }
        reader.onerror = () => reject(new Error('Failed to read front photo'))
        reader.readAsDataURL(photoFront)
      })

      const uploadData: any = {
        photoFront: {
          url: photoFrontBase64,
          fileSize: photoFront.size,
          mimeType: photoFront.type
        }
      }

      // Convert back photo if provided
      if (photoBack) {
        console.log('ðŸ"„ Converting back photo to base64...')
        const photoBackBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            if (reader.result) {
              console.log('âœ… Back photo converted')
              resolve(reader.result as string)
            } else {
              reject(new Error('Failed to read back photo'))
            }
          }
          reader.onerror = () => reject(new Error('Failed to read back photo'))
          reader.readAsDataURL(photoBack)
        })

        uploadData.photoBack = {
          url: photoBackBase64,
          fileSize: photoBack.size,
          mimeType: photoBack.type
        }
      }

      console.log('ðŸ"¤ Sending to API...', {
        hasFront: !!uploadData.photoFront,
        hasBack: !!uploadData.photoBack
      })
      
      await api.uploadKTP(uploadData)
      
      console.log('âœ… Upload successful!')
      toast.success('KTP photos uploaded! Waiting for admin verification.', {
        id: uploadToast,
        style: { background: '#10b981', color: '#fff' }
      })
      
      await loadProfile()
      return true
      
    } catch (uploadError: any) {
      console.error('âŒ Upload error:', uploadError)
      console.error('Error details:', {
        message: uploadError?.message,
        response: uploadError?.response?.data,
        status: uploadError?.response?.status
      })
      
      // More specific error messages
      const errorMessage = uploadError?.response?.data?.error 
        || uploadError?.response?.data?.message
        || uploadError?.message 
        || 'Failed to upload KTP photos'
      
      toast.error(errorMessage, {
        id: uploadToast,
        style: { background: '#ef4444', color: '#fff' }
      })
      return false
    }
    
  } catch (error: any) {
    console.error('âŒ KTP upload failed:', error)
    toast.error(error?.message || 'Failed to process photos', {
      style: { background: '#ef4444', color: '#fff' }
    })
    return false
  } finally {
    setUpdating(false)
  }
}


  // ✅ NEW: Upload selfie handler
  const uploadSelfie = async (file: File): Promise<boolean> => {
  try {
    console.log('ðŸ"¸ Starting selfie upload...', {
      size: file.size,
      type: file.type
    })
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file', {
        style: { background: '#ef4444', color: '#fff' }
      })
      return false
    }

    // Validate file size (1MB for selfie)
    if (file.size > 1 * 1024 * 1024) {
      toast.error('Selfie size must be less than 1MB', {
        style: { background: '#ef4444', color: '#fff' }
      })
      return false
    }

    setUpdating(true)
    const uploadToast = toast.loading('Uploading selfie...', {
      style: { background: '#f59e0b', color: '#fff' }
    })

    try {
      // Convert to base64
      console.log('ðŸ"„ Converting selfie to base64...')
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          if (reader.result) {
            console.log('âœ… Selfie converted')
            resolve(reader.result as string)
          } else {
            reject(new Error('Failed to read selfie'))
          }
        }
        reader.onerror = () => reject(new Error('Failed to read selfie'))
        reader.readAsDataURL(file)
      })

      console.log('ðŸ"¤ Sending to API...')
      await api.uploadSelfie({
        url: base64,
        fileSize: file.size,
        mimeType: file.type
      })
      
      console.log('âœ… Upload successful!')
      toast.success('Selfie uploaded! Waiting for admin verification.', {
        id: uploadToast,
        style: { background: '#10b981', color: '#fff' }
      })
      
      await loadProfile()
      return true
      
    } catch (uploadError: any) {
      console.error('âŒ Upload error:', uploadError)
      console.error('Error details:', {
        message: uploadError?.message,
        response: uploadError?.response?.data,
        status: uploadError?.response?.status
      })
      
      // More specific error messages
      const errorMessage = uploadError?.response?.data?.error 
        || uploadError?.response?.data?.message
        || uploadError?.message 
        || 'Failed to upload selfie'
      
      toast.error(errorMessage, {
        id: uploadToast,
        style: { background: '#ef4444', color: '#fff' }
      })
      return false
    }
    
  } catch (error: any) {
    console.error('âŒ Selfie upload failed:', error)
    toast.error(error?.message || 'Failed to process photo', {
      style: { background: '#ef4444', color: '#fff' }
    })
    return false
  } finally {
    setUpdating(false)
  }
}

  
  const handleLogout = () => {
    setShowLogoutModal(true)
  }

  const confirmLogout = () => {
    logout()
    setShowLogoutModal(false)
    toast.success('Logged out successfully', {
      style: { background: '#10b981', color: '#fff' }
    })
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
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-4 md:space-y-6">
              {/* Profile Header */}
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow"
                whileHover={{ y: -2 }}
              >
                <div className="flex flex-col sm:flex-row items-start gap-4 md:gap-6">
                  {/* Avatar */}
                  <motion.div 
                    className="relative flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center overflow-hidden shadow-lg">
                      {profileInfo?.avatar?.url ? (
                        <img src={profileInfo.avatar.url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <motion.span 
                          className="text-white text-2xl md:text-3xl font-bold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                          {user.email[0].toUpperCase()}
                        </motion.span>
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-all shadow-lg border-2 md:border-4 border-white group">
                      <Camera className="w-4 h-4 md:w-5 md:h-5 text-white group-hover:scale-110 transition-transform" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        if (e.target.files?.[0]) handleUploadAvatar(e.target.files[0])
                      }} />
                    </label>
                  </motion.div>

                  {/* Info */}
                  <div className="flex-1 w-full">
                    <motion.h2 
                      className="text-xl md:text-2xl font-bold text-gray-900 mb-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {profileInfo?.personal?.fullName || user?.email}
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {profileInfo?.verification?.identityVerified && (
                          <ShieldCheck className="inline-block w-5 h-5 ml-2 text-blue-500" />
                        )}
                      </motion.span>
                    </motion.h2>
                    <motion.p 
                      className="text-sm md:text-base text-gray-600 mb-3 break-all"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {user?.email}
                    </motion.p>
                    
                    {statusInfo && (
                      <motion.div 
                        className={`inline-flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-lg md:rounded-xl text-white shadow-lg text-sm md:text-base ${getStatusGradient(statusInfo.current)}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        whileHover={{ scale: 1.02 }}
                      >
                        {React.createElement(getStatusIcon(statusInfo.current), { className: "w-4 h-4 md:w-5 md:h-5" })}
                        <span className="font-semibold">{statusInfo.current.toUpperCase()}</span>
                        <span className="opacity-90">{statusInfo.profitBonus}% Bonus</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Profile Completion */}
              {profileInfo && profileInfo.completion < 100 && (
                <motion.div 
                  className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 md:p-6 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-1 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Complete Your Profile
                      </h3>
                      <p className="text-xs md:text-sm text-blue-700">Unlock all features by completing your profile</p>
                    </div>
                    <motion.div 
                      className="text-2xl md:text-3xl font-bold text-blue-600"
                      key={profileInfo.completion}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      {profileInfo.completion}%
                    </motion.div>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2 md:h-3 overflow-hidden">
                    <motion.div 
                      className="h-2 md:h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600" 
                      initial={{ width: 0 }}
                      animate={{ width: `${profileInfo.completion}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}

              {/* Quick Stats Grid */}
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {[
                  { label: 'Real Balance', value: `Rp ${(profile?.balances?.real ?? 0).toLocaleString('id-ID')}`, icon: CreditCard, color: 'text-green-600' },
                  { label: 'Demo Balance', value: `Rp ${(profile?.balances?.demo ?? 0).toLocaleString('id-ID')}`, icon: TrendingUp, color: 'text-blue-600' },
                  { label: 'Total Orders', value: profile?.statistics?.combined?.totalOrders ?? 0, icon: Briefcase, color: 'text-purple-600' }
                ].map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    className="bg-white border border-gray-200 rounded-xl p-4 md:p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    variants={fadeInUp}
                    whileHover={{ y: -3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">{stat.label}</div>
                        <motion.div 
                          className={`text-lg md:text-2xl font-bold text-gray-900 ${stat.color}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                        >
                          {stat.value}
                        </motion.div>
                      </div>
                      <stat.icon className={`w-8 h-8 md:w-10 md:h-10 text-gray-200`} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Verification Status */}
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.7 }}
              >
                <h3 className="text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-500" />
                  Verification Status
                </h3>
                <motion.div 
                  className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-4"
                  variants={staggerContainer}
                >
                  {[
                    { label: 'Email', verified: profileInfo?.verification?.emailVerified, icon: Mail },
                    { label: 'Phone', verified: profileInfo?.verification?.phoneVerified, icon: Phone },
                    { label: 'Identity', verified: profileInfo?.verification?.identityVerified, icon: FileText },
                    { label: 'Bank', verified: profileInfo?.verification?.bankVerified, icon: CreditCard }
                  ].map((item, i) => (
                    <motion.div 
                      key={item.label}
                      variants={fadeInUp}
                      className={`flex items-center gap-3 p-3 md:p-4 rounded-xl border-2 transition-all ${
                        item.verified 
                          ? 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 hover:border-green-300' 
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <motion.div
                        animate={item.verified ? { rotate: 360 } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <item.icon className={`w-5 h-6 md:w-6 md:h-6 ${item.verified ? 'text-green-600' : 'text-gray-400'}`} />
                      </motion.div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{item.label}</div>
                        <motion.div 
                          className={`text-xs font-medium flex items-center gap-1 ${
                            item.verified ? 'text-green-600' : 'text-gray-500'
                          }`}
                          whileHover={{ x: item.verified ? 5 : 0 }}
                        >
                          {item.verified ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {item.verified ? 'Verified' : 'Not Verified'}
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          )}

          {activeTab === 'personal' && (
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 bg-gradient-to-r from-blue-50 to-white">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Personal Information</h3>
                  <p className="text-xs md:text-sm text-gray-500">Your basic personal details</p>
                </div>
                <AnimatePresence mode="wait">
                  {!editingPersonal ? (
                    <motion.button 
                      onClick={() => setEditingPersonal(true)} 
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md"
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </motion.button>
                  ) : (
                    <motion.div 
                      className="flex gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.button 
                        onClick={() => {
                          setEditingPersonal(false)
                          loadProfile() // Reset data
                        }} 
                        disabled={savingSection === 'personal'} 
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button 
                        onClick={handleUpdatePersonal} 
                        disabled={savingSection === 'personal'} 
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 shadow-md"
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {savingSection === 'personal' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" /> Save Changes
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.div 
                className="p-4 md:p-6 space-y-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {[
                  { 
                    label: 'Full Name', 
                    key: 'fullName', 
                    type: 'text',
                    required: true,
                    info: 'Enter your legal name as per ID'
                  },
                  { 
                    label: 'Phone Number', 
                    key: 'phoneNumber', 
                    type: 'custom',
                    component: PhoneInput,
                    required: true
                  },
                  { 
                    label: 'Date of Birth', 
                    key: 'dateOfBirth', 
                    type: 'date',
                    required: true
                  },
                  { 
                    label: 'Gender', 
                    key: 'gender', 
                    type: 'select',
                    options: [
                      { value: '', label: 'Select gender' },
                      { value: 'male', label: 'Male' },
                      { value: 'female', label: 'Female' },
                      { value: 'other', label: 'Other' }
                    ]
                  },
                  { 
                    label: 'Nationality', 
                    key: 'nationality', 
                    type: 'text',
                    info: 'e.g., Indonesian, Malaysian'
                  }
                ].map((field) => (
                  <motion.div key={field.key} variants={fadeInUp}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                      {field.info && <InfoTooltip text={field.info} />}
                    </label>
                    {editingPersonal ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {field.type === 'custom' && field.component ? (
                          <field.component
                            value={(personalData as any)[field.key]}
                            onChange={(value: string) => setPersonalData({ ...personalData, [field.key]: value })}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={(personalData as any)[field.key]}
                            onChange={(e) => setPersonalData({ ...personalData, [field.key]: e.target.value })}
                            onBlur={(e) => handleBlur(field.key, e.target.value)}
                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none transition-colors ${
                              formErrors[field.key] && touchedFields[field.key]
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-200 focus:border-blue-500'
                            }`}
                          >
                            {field.options?.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            value={(personalData as any)[field.key]}
                            onChange={(e) => setPersonalData({ ...personalData, [field.key]: e.target.value })}
                            onBlur={(e) => handleBlur(field.key, e.target.value)}
                            className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none transition-colors ${
                              formErrors[field.key] && touchedFields[field.key]
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-200 focus:border-blue-500'
                            }`}
                            placeholder={`Enter your ${field.label.toLowerCase()}`}
                          />
                        )}
                        {formErrors[field.key] && touchedFields[field.key] && (
                          <motion.p 
                            className="mt-1 text-sm text-red-600 flex items-center gap-1"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <AlertCircle className="w-4 h-4" />
                            {formErrors[field.key]}
                          </motion.p>
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium border-2 border-transparent"
                        whileHover={{ backgroundColor: 'rgb(249 250 251)' }}
                      >
                        {field.key === 'dateOfBirth' && (personalData as any)[field.key]
                          ? new Date((personalData as any)[field.key]).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                          : (personalData as any)[field.key] || '-'}
                      </motion.div>
                    )}
                    {autoSaving === 'personal' && (
                      <motion.div 
                        className="mt-1 text-xs text-blue-600 flex items-center gap-1"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <Save className="w-3 h-3 animate-pulse" />
                        Auto-saving...
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'address' && (
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 bg-gradient-to-r from-green-50 to-white">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Address Information</h3>
                  <p className="text-xs md:text-sm text-gray-500">Your residential address</p>
                </div>
                <AnimatePresence mode="wait">
                  {!editingAddress ? (
                    <motion.button 
                      onClick={() => setEditingAddress(true)} 
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md"
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </motion.button>
                  ) : (
                    <motion.div 
                      className="flex gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.button 
                        onClick={() => {
                          setEditingAddress(false)
                          loadProfile()
                        }} 
                        disabled={savingSection === 'address'} 
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button 
                        onClick={handleUpdateAddress} 
                        disabled={savingSection === 'address'} 
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-md"
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {savingSection === 'address' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" /> Save Changes
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.div 
                className="p-4 md:p-6 space-y-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={fadeInUp}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  {editingAddress ? (
                    <>
                      <input
                        type="text"
                        value={addressData.street}
                        onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                        onBlur={(e) => handleBlur('street', e.target.value)}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none transition-colors ${
                          formErrors.street && touchedFields.street
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-green-500'
                        }`}
                        placeholder="Jl. Merdeka No. 123"
                      />
                      {formErrors.street && touchedFields.street && (
                        <motion.p 
                          className="mt-1 text-sm text-red-600 flex items-center gap-1"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.street}
                        </motion.p>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                      {addressData.street || '-'}
                    </div>
                  )}
                </motion.div>
                
                <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={fadeInUp}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    {editingAddress ? (
                      <>
                        <input
                          type="text"
                          value={addressData.city}
                          onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                          onBlur={(e) => handleBlur('city', e.target.value)}
                          className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none transition-colors ${
                            formErrors.city && touchedFields.city
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-gray-200 focus:border-green-500'
                          }`}
                          placeholder="Jakarta"
                        />
                        {formErrors.city && touchedFields.city && (
                          <motion.p 
                            className="mt-1 text-sm text-red-600 flex items-center gap-1"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <AlertCircle className="w-4 h-4" />
                            {formErrors.city}
                          </motion.p>
                        )}
                      </>
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                        {addressData.city || '-'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Province <span className="text-red-500">*</span>
                    </label>
                    {editingAddress ? (
                      <>
                        <input
                          type="text"
                          value={addressData.province}
                          onChange={(e) => setAddressData({ ...addressData, province: e.target.value })}
                          onBlur={(e) => handleBlur('province', e.target.value)}
                          className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none transition-colors ${
                            formErrors.province && touchedFields.province
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-gray-200 focus:border-green-500'
                          }`}
                          placeholder="DKI Jakarta"
                        />
                        {formErrors.province && touchedFields.province && (
                          <motion.p 
                            className="mt-1 text-sm text-red-600 flex items-center gap-1"
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <AlertCircle className="w-4 h-4" />
                            {formErrors.province}
                          </motion.p>
                        )}
                      </>
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                        {addressData.province || '-'}
                      </div>
                    )}
                  </div>
                </motion.div>
                
                <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-4" variants={fadeInUp}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                    {editingAddress ? (
                      <input
                        type="text"
                        value={addressData.postalCode}
                        onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                        placeholder="12345"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                        {addressData.postalCode || '-'}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
                    {editingAddress ? (
                      <input
                        type="text"
                        value={addressData.country}
                        onChange={(e) => setAddressData({ ...addressData, country: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                        placeholder="Indonesia"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                        {addressData.country || '-'}
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'identity' && (
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 bg-gradient-to-r from-purple-50 to-white">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Identity Verification</h3>
                  <p className="text-xs md:text-sm text-gray-500">Verify your identity for higher limits</p>
                </div>
                <AnimatePresence mode="wait">
                  {!editingIdentity ? (
                    <motion.button 
                      onClick={() => setEditingIdentity(true)} 
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all shadow-md"
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(147, 51, 234, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </motion.button>
                  ) : (
                    <motion.div 
                      className="flex gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.button 
                        onClick={() => {
                          setEditingIdentity(false)
                          loadProfile()
                        }} 
                        disabled={savingSection === 'identity'} 
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button 
                        onClick={handleUpdateIdentity} 
                        disabled={savingSection === 'identity'} 
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 shadow-md"
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(147, 51, 234, 0.3)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {savingSection === 'identity' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" /> Save Changes
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.div 
                className="p-4 md:p-6 space-y-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                      {/* ✅ SECTION UPLOAD KTP */}
      <motion.div variants={fadeInUp} className="border-t pt-4">
        <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <Camera className="w-5 h-5 mr-2 text-purple-500" />
          Upload KTP Photos
        </h4>
        
        {/* Front Photo */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Front Photo <span className="text-red-500">*</span>
          </label>
          {profileInfo?.identity?.photoFront ? (
            <div className="relative">
              <img 
                src={profileInfo.identity.photoFront.url} 
                alt="KTP Front"
                className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
              />
              {profileInfo.identity.isVerified ? (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Verified
                </div>
              ) : (
                <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Pending Verification
                </div>
              )}
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition-colors bg-gray-50">
              <Camera className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Click to upload front photo</span>
              <span className="text-xs text-gray-500 mt-1">Max 2MB (JPG, PNG, WEBP)</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    // Store temporarily
                    setKtpFrontFile(e.target.files[0])
                  }
                }}
              />
            </label>
          )}
        </div>

        {/* Back Photo */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Back Photo (Optional)
          </label>
          {profileInfo?.identity?.photoBack ? (
            <img 
              src={profileInfo.identity.photoBack.url} 
              alt="KTP Back"
              className="w-full h-48 object-cover rounded-xl border-2 border-gray-200"
            />
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition-colors bg-gray-50">
              <Camera className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Click to upload back photo</span>
              <span className="text-xs text-gray-500 mt-1">Max 2MB (JPG, PNG, WEBP)</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setKtpBackFile(e.target.files[0])
                  }
                }}
              />
            </label>
          )}
        </div>

        {/* Upload Button */}
        {(ktpFrontFile || ktpBackFile) && !profileInfo?.identity?.photoFront && (
          <motion.button
            onClick={async () => {
              if (ktpFrontFile) {
                const success = await uploadKTP(ktpFrontFile, ktpBackFile)
                if (success) {
                  setKtpFrontFile(null)
                  setKtpBackFile(null)
                }
              }
            }}
            disabled={updating}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {updating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                Upload KTP Photos
              </>
            )}
          </motion.button>
        )}
      </motion.div>

      {/* ✅ SECTION UPLOAD SELFIE */}
      <motion.div variants={fadeInUp} className="border-t pt-4">
        <h4 className="text-base font-semibold text-gray-900 mb-3 flex items-center">
          <UserCheck className="w-5 h-5 mr-2 text-purple-500" />
          Upload Selfie Verification
        </h4>
        
        {profileInfo?.selfie ? (
          <div className="relative">
            <img 
              src={profileInfo.selfie.url} 
              alt="Selfie"
              className="w-full h-64 object-cover rounded-xl border-2 border-gray-200"
            />
            {profileInfo.selfie.isVerified ? (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Verified
              </div>
            ) : (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Pending Verification
              </div>
            )}
          </div>
        ) : (
          <>
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-purple-500 transition-colors bg-gray-50">
              <UserCheck className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">Click to upload selfie</span>
              <span className="text-xs text-gray-500 mt-1">Max 1MB (JPG, PNG, WEBP)</span>
              <span className="text-xs text-gray-500">Clear face photo required</span>
              <input 
                type="file" 
                accept="image/*" 
                className="hidden"
                onChange={async (e) => {
                  if (e.target.files?.[0]) {
                    await uploadSelfie(e.target.files[0])
                  }
                }}
                disabled={updating}
              />
            </label>
          </>
        )}
      </motion.div>
                
                <motion.div variants={fadeInUp}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Document Number <span className="text-red-500">*</span>
                  </label>
                  {editingIdentity ? (
                    <>
                      <input
                        type="text"
                        value={identityData.number}
                        onChange={(e) => setIdentityData({ ...identityData, number: e.target.value })}
                        onBlur={(e) => handleBlur('identityNumber', e.target.value)}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none transition-colors ${
                          formErrors.identityNumber && touchedFields.identityNumber
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-purple-500'
                        }`}
                        placeholder="Enter document number"
                      />
                      {formErrors.identityNumber && touchedFields.identityNumber && (
                        <motion.p 
                          className="mt-1 text-sm text-red-600 flex items-center gap-1"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.identityNumber}
                        </motion.p>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                      {identityData.number || '-'}
                    </div>
                  )}
                </motion.div>
                
                {profileInfo?.identity?.isVerified && (
                  <motion.div 
                    className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl"
                    variants={fadeInUp}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </motion.div>
                      <span className="text-sm font-semibold text-green-900">Identity Verified</span>
                      <ShieldCheck className="w-5 h-5 text-green-600 ml-auto" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'bank' && (
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0 bg-gradient-to-r from-emerald-50 to-white">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Bank Account</h3>
                  <p className="text-xs md:text-sm text-gray-500">Add your bank account for withdrawals</p>
                </div>
                <AnimatePresence mode="wait">
                  {!editingBank ? (
                    <motion.button 
                      onClick={() => setEditingBank(true)} 
                      className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all shadow-md"
                      whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit2 className="w-4 h-4" /> Edit
                    </motion.button>
                  ) : (
                    <motion.div 
                      className="flex gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.button 
                        onClick={() => {
                          setEditingBank(false)
                          loadProfile()
                        }} 
                        disabled={savingSection === 'bank'} 
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button 
                        onClick={handleUpdateBank} 
                        disabled={savingSection === 'bank'} 
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all disabled:opacity-50 shadow-md"
                        whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(16, 185, 129, 0.3)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {savingSection === 'bank' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" /> Save Changes
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.div 
                className="p-4 md:p-6 space-y-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={fadeInUp}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  {editingBank ? (
                    <>
                      <input
                        type="text"
                        value={bankData.bankName}
                        onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                        onBlur={(e) => handleBlur('bankName', e.target.value)}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none transition-colors ${
                          formErrors.bankName && touchedFields.bankName
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-emerald-500'
                        }`}
                        placeholder="e.g., Bank Mandiri"
                      />
                      {formErrors.bankName && touchedFields.bankName && (
                        <motion.p 
                          className="mt-1 text-sm text-red-600 flex items-center gap-1"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.bankName}
                        </motion.p>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                      {bankData.bankName || '-'}
                    </div>
                  )}
                </motion.div>
                
                <motion.div variants={fadeInUp}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  {editingBank ? (
                    <>
                      <input
                        type="text"
                        value={bankData.accountNumber}
                        onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                        onBlur={(e) => handleBlur('accountNumber', e.target.value)}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none transition-colors ${
                          formErrors.accountNumber && touchedFields.accountNumber
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-emerald-500'
                        }`}
                        placeholder="1234567890"
                      />
                      {formErrors.accountNumber && touchedFields.accountNumber && (
                        <motion.p 
                          className="mt-1 text-sm text-red-600 flex items-center gap-1"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.accountNumber}
                        </motion.p>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                      {bankData.accountNumber ? `•••••${bankData.accountNumber.slice(-4)}` : '-'}
                    </div>
                  )}
                </motion.div>
                
                <motion.div variants={fadeInUp}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Holder Name <span className="text-red-500">*</span>
                  </label>
                  {editingBank ? (
                    <>
                      <input
                        type="text"
                        value={bankData.accountHolderName}
                        onChange={(e) => setBankData({ ...bankData, accountHolderName: e.target.value })}
                        onBlur={(e) => handleBlur('accountHolderName', e.target.value)}
                        className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:outline-none transition-colors ${
                          formErrors.accountHolderName && touchedFields.accountHolderName
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-200 focus:border-emerald-500'
                        }`}
                        placeholder="John Doe"
                      />
                      {formErrors.accountHolderName && touchedFields.accountHolderName && (
                        <motion.p 
                          className="mt-1 text-sm text-red-600 flex items-center gap-1"
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.accountHolderName}
                        </motion.p>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-xl text-gray-900 font-medium">
                      {bankData.accountHolderName || '-'}
                    </div>
                  )}
                </motion.div>
                
                {profileInfo?.bankAccount?.isVerified && (
                  <motion.div 
                    className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl"
                    variants={fadeInUp}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                      >
                        <ShieldCheck className="w-5 h-5 text-green-600" />
                      </motion.div>
                      <span className="text-sm font-semibold text-green-900">Bank Account Verified</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'status' && statusInfo && (
            <motion.div 
              className="space-y-4 md:space-y-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Current Status */}
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow"
                variants={fadeInUp}
                whileHover={{ y: -2 }}
              >
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-yellow-500" />
                  Your Status
                </h3>
                <motion.div 
                  className={`flex flex-col sm:flex-row items-center sm:items-center gap-4 p-4 md:p-6 rounded-xl text-white shadow-xl ${getStatusGradient(statusInfo.current)}`}
                  whileHover={{ scale: 1.01 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    {React.createElement(getStatusIcon(statusInfo.current), { className: "w-10 h-10 md:w-12 md:h-12" })}
                  </motion.div>
                  <div className="text-center sm:text-left">
                    <div className="text-xl md:text-2xl font-bold mb-1">{statusInfo.current.toUpperCase()}</div>
                    <div className="opacity-90 text-sm md:text-base">{formatStatusInfo(statusInfo)}</div>
                  </div>
                </motion.div>
              </motion.div>

              {/* Progress to Next Status */}
              {calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current).next && (
                <motion.div 
                  className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow"
                  variants={fadeInUp}
                  whileHover={{ y: -2 }}
                >
                  <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                    Progress to Next Status
                  </h3>
                  <div className="mb-4">
                    <div className="flex justify-between text-xs md:text-sm mb-2">
                      <span className="text-gray-600">Progress</span>
                      <motion.span 
                        className="font-semibold"
                        key={calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current).progress}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring" }}
                      >
                        {calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current).progress}%
                      </motion.span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 md:h-3 overflow-hidden">
                      <motion.div 
                        className={`h-2 md:h-3 rounded-full bg-gradient-to-r ${
                          statusInfo.current === 'standard' ? 'from-gray-400 to-gray-600' :
                          statusInfo.current === 'gold' ? 'from-yellow-400 to-orange-600' :
                          'from-purple-400 to-pink-600'
                        }`} 
                        initial={{ width: 0 }}
                        animate={{ width: `${calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current).progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600">
                    Deposit <span className="font-bold">{formatDepositRequirement(calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current).depositNeeded)}</span> more to unlock {STATUS_CONFIG[calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current).next!].label} status!
                  </p>
                </motion.div>
              )}

              {/* All Status Tiers */}
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow"
                variants={fadeInUp}
              >
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                  All Status Tiers
                </h3>
                <motion.div 
                  className="space-y-3"
                  variants={staggerContainer}
                >
                  {getAllStatusTiers().map(({ status, config, icon: Icon }, i) => {
                    const isCurrent = status === statusInfo.current
                    const isUnlocked = STATUS_CONFIG[status].minDeposit <= statusInfo.totalDeposit
                    
                    return (
                      <motion.div 
                        key={status}
                        className={`p-3 md:p-4 border-2 rounded-xl transition-all ${
                          isCurrent 
                            ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 shadow-md' 
                            : isUnlocked
                            ? 'border-green-300 bg-gradient-to-r from-green-50 to-emerald-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                        variants={fadeInUp}
                        whileHover={{ 
                          scale: isCurrent ? 1.02 : 1.01,
                          boxShadow: isCurrent ? "0 10px 25px rgba(59, 130, 246, 0.2)" : "0 5px 15px rgba(0,0,0,0.05)"
                        }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <motion.div
                              animate={isCurrent ? { scale: [1, 1.1, 1] } : {}}
                              transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                            >
                              <Icon className={`w-5 h-6 md:w-6 md:h-6 ${isCurrent || isUnlocked ? 'text-blue-600' : 'text-gray-400'}`} />
                            </motion.div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm md:text-base">{config.label}</div>
                              <div className="text-xs md:text-sm text-gray-600">Bonus: {config.profitBonus}%</div>
                            </div>
                          </div>
                          <div className="text-xs md:text-sm font-semibold text-gray-900">
                            {formatDepositRequirement(config.minDeposit)}
                          </div>
                        </div>
                        {isCurrent && (
                          <motion.div 
                            className="mt-2 text-xs text-blue-600 font-medium"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          >
                            ✨ Current Status
                          </motion.div>
                        )}
                      </motion.div>
                    )
                  })}
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'affiliate' && affiliateInfo && (
            <motion.div 
              className="space-y-4 md:space-y-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Affiliate Overview */}
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow"
                variants={fadeInUp}
                whileHover={{ y: -2 }}
              >
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-500" />
                  Affiliate Program
                </h3>
                <motion.div 
                  className="grid grid-cols-3 gap-3 md:gap-4"
                  variants={staggerContainer}
                >
                  {[
                    { label: 'Total Referrals', value: affiliateInfo.totalReferrals, color: 'text-gray-900', bg: 'bg-gray-50' },
                    { label: 'Completed', value: affiliateInfo.completedReferrals, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Pending', value: affiliateInfo.pendingReferrals, color: 'text-yellow-600', bg: 'bg-yellow-50' }
                  ].map((stat, i) => (
                    <motion.div 
                      key={stat.label}
                      className={`text-center p-3 md:p-4 ${stat.bg} rounded-xl`}
                      variants={fadeInUp}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <motion.div 
                        className={`text-xl md:text-3xl font-bold ${stat.color}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", delay: i * 0.1 }}
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              {/* Referral Link */}
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow"
                variants={fadeInUp}
                whileHover={{ y: -2 }}
              >
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center">
                  <Share2 className="w-5 h-5 mr-2 text-blue-500" />
                  Your Referral Link
                </h3>
                <motion.div 
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div 
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-black font-mono text-xs md:text-sm break-all relative"
                    whileHover={{ backgroundColor: 'rgb(249 250 251)' }}
                  >
                    {typeof window !== 'undefined' && `${window.location.origin}/?ref=${affiliateInfo.referralCode}`}
                  </motion.div>
                  <motion.button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(`${window.location.origin}/?ref=${affiliateInfo.referralCode}`)
                        setCopied(true)
                        toast.success('Referral link copied!', {
                          style: { background: '#10b981', color: '#fff' }
                        })
                        setTimeout(() => setCopied(false), 2000)
                      }
                    }}
                    className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all flex-shrink-0 flex sm:block justify-center"
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(59, 130, 246, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <AnimatePresence mode="wait">
                      {copied ? (
                        <motion.div
                          key="copied"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0, rotate: 180 }}
                          transition={{ type: "spring" }}
                        >
                          <Check className="w-5 h-5" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: "spring" }}
                        >
                          <Copy className="w-5 h-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
                <motion.p 
                  className="text-xs md:text-sm text-gray-600 mt-3 flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Gift className="w-4 h-4 text-yellow-500" />
                  Share this link to earn <span className="font-bold">Rp 25,000</span> per successful referral!
                </motion.p>
              </motion.div>

              {/* Commission Info */}
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4 md:p-6 hover:shadow-lg transition-shadow"
                variants={fadeInUp}
                whileHover={{ y: -2 }}
              >
                <h3 className="text-base md:text-lg font-bold text-gray-900 mb-3 md:mb-4 flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-yellow-500" />
                  Commission Earned
                </h3>
                <motion.div 
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Gift className="w-10 h-10 md:w-12 md:h-12 text-yellow-500" />
                  </motion.div>
                  <div>
                    <motion.div 
                      className="text-xl md:text-3xl font-bold text-gray-900"
                      key={affiliateInfo.totalCommission}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      {formatDepositRequirement(affiliateInfo.totalCommission)}
                    </motion.div>
                    <div className="text-xs md:text-sm text-gray-600">Total Commission</div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
                <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-red-500" />
                  Security Settings
                </h3>
                <p className="text-xs md:text-sm text-gray-500">Change your password & security preferences</p>
              </div>

              <motion.form 
                onSubmit={handleChangePassword} 
                className="p-4 md:p-6 space-y-4 md:space-y-6"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={fadeInUp}>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        setPasswordData({ ...passwordData, newPassword: e.target.value })
                        const checks = validatePassword(e.target.value)
                        const errors = Object.entries(checks)
                          .filter(([_, passed]) => !passed)
                          .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim())
                        setPasswordErrors(errors)
                      }}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={passwordData.newPassword} />
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-red-500 focus:outline-none transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <motion.p 
                      className="mt-1 text-sm text-red-600 flex items-center gap-1"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <AlertCircle className="w-4 h-4" />
                      Passwords do not match
                    </motion.p>
                  )}
                </motion.div>

                <motion.button 
                  type="submit" 
                  disabled={loading} 
                  className="w-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                  whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(239, 68, 68, 0.3)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Changing Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" /> Change Password
                    </>
                  )}
                </motion.button>
              </motion.form>
            </motion.div>
          )}

          {activeTab === 'preferences' && (
            <motion.div 
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="p-4 md:p-6 bg-gradient-to-r from-indigo-50 to-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1 flex items-center">
                      <Settings className="w-5 h-5 mr-2 text-indigo-500" />
                      Preferences
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500">Customize your experience</p>
                  </div>
                  <motion.button 
                    onClick={handleUpdateSettings} 
                    disabled={savingSection === 'settings'} 
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-md"
                    whileHover={{ scale: 1.02, boxShadow: "0 10px 25px rgba(99, 102, 241, 0.3)" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {savingSection === 'settings' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save Changes
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              <motion.div 
                className="p-4 md:p-6 space-y-4 md:space-y-6"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {/* Notifications */}
                <motion.div variants={fadeInUp} className="pb-4 border-b border-gray-100">
                  <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Bell className="w-5 h-5 mr-2 text-indigo-500" />
                    Notifications
                  </h4>
                  <motion.div 
                    className="space-y-2 md:space-y-3"
                    variants={staggerContainer}
                  >
                    {[
                      { key: 'emailNotifications', label: 'Email Notifications' },
                      { key: 'smsNotifications', label: 'SMS Notifications' },
                      { key: 'tradingAlerts', label: 'Trading Alerts' }
                    ].map((item, i) => (
                      <motion.label 
                        key={item.key}
                        className="flex items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                        variants={fadeInUp}
                        whileHover={{ scale: 1.01 }}
                      >
                        <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                        <motion.input
                          type="checkbox"
                          checked={(settings as any)[item.key]}
                          onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                          className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                          whileTap={{ scale: 0.9 }}
                        />
                      </motion.label>
                    ))}
                  </motion.div>
                </motion.div>

                {/* Language & Timezone */}
                <motion.div variants={fadeInUp}>
                  <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-indigo-500" />
                    Regional Settings
                  </h4>
                  <motion.div 
                    className="space-y-4"
                    variants={staggerContainer}
                  >
                    <motion.div variants={fadeInUp}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Language</label>
                      <select
                        value={settings.language}
                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                      >
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                      </select>
                    </motion.div>
                    <motion.div variants={fadeInUp}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
                      <input
                        type="text"
                        value={settings.timezone}
                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      <Toaster position="top-right" expand={true} />
      
      <div className="container mx-auto px-3 md:px-4 py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <motion.div 
          className="mb-4 md:mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 mb-2 md:mb-3">
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              Dashboard
            </motion.span>
            <span>/</span>
            <motion.span 
              className="text-gray-900 font-medium"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Profile
            </motion.span>
          </div>
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md"
              whileHover={{ rotate: 90, scale: 1.05 }}
              transition={{ type: "spring" }}
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Profile</h1>
              <motion.p 
                className="text-xs md:text-sm text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Profile completion: <span className="font-semibold">{profileInfo?.completion ?? 0}%</span>
              </motion.p>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* Sidebar - Tabs */}
          <motion.div 
            className="col-span-1 md:col-span-4 lg:col-span-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Mobile Horizontal Tabs */}
            <motion.div 
              className="md:hidden bg-white rounded-xl border border-gray-200 p-2 mb-4 shadow-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {tabs.map((tab, i) => {
                    const Icon = tab.icon
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm flex-shrink-0 ${
                          activeTab === tab.id
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.05 }}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{tab.label}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>

            {/* Desktop/Tablet Vertical Tabs */}
            <motion.div 
              className="hidden md:block bg-white rounded-xl border border-gray-200 p-2 sticky top-4 shadow-sm"
              whileHover={{ boxShadow: "0 10px 25px rgba(0,0,0,0.05)" }}
            >
              <motion.div 
                className="space-y-1"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {tabs.map((tab, i) => {
                  const Icon = tab.icon
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      whileHover={{ x: activeTab === tab.id ? 0 : 5 }}
                      whileTap={{ scale: 0.98 }}
                      variants={fadeInUp}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="font-medium text-sm">{tab.label}</span>
                    </motion.button>
                  )
                })}
                
                {/* Logout Button */}
                <motion.div 
                  className="pt-2 mt-2 border-t border-gray-200"
                  variants={fadeInUp}
                  transition={{ delay: tabs.length * 0.05 }}
                >
                  <motion.button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all text-left"
                    whileHover={{ x: 5, backgroundColor: 'rgb(254 242 242)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">Logout</span>
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            className="col-span-1 md:col-span-8 lg:col-span-9"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <ConfirmationModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
        title="Confirm Logout"
        message="Are you sure you want to logout? You will be redirected to the homepage."
      />
    </div>
  )
}