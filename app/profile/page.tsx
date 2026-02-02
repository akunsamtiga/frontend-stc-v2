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
  <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50">
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

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const validatePhone = (phone: string) => /^\+?[\d\s-()]{10,}$/.test(phone)
const validatePassword = (password: string) => ({
  minLength: password.length >= 8,
  hasUpperCase: /[A-Z]/.test(password),
  hasLowerCase: /[a-z]/.test(password),
  hasNumber: /\d/.test(password),
  hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
})

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debounced
}

const PasswordStrengthMeter = ({ password }: { password: string }) => {
  if (!password) return null
  
  const checks = validatePassword(password)
  const strength = Object.values(checks).filter(Boolean).length
  const colors = ['bg-red-500', 'bg-yellow-500', 'bg-sky-500', 'bg-emerald-500']
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
            {passed ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-red-400" />}
            <span className={passed ? 'text-emerald-600' : 'text-gray-400'}>
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
        className="w-full pl-10 pr-4 py-3 bg-gray-100 border border-gray-300 rounded-xl focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors text-sm"
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

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  
  const [activeTab, setActiveTab] = useState('overview')
  
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [savingSection, setSavingSection] = useState<string | null>(null)
  const [autoSaving, setAutoSaving] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileInfo, setProfileInfo] = useState<UserProfileInfo | null>(null)
  const [ktpFrontFile, setKtpFrontFile] = useState<File | null>(null)
  const [ktpBackFile, setKtpBackFile] = useState<File | null>(null)
  const [ktpFrontPreview, setKtpFrontPreview] = useState<string | null>(null)
  const [ktpBackPreview, setKtpBackPreview] = useState<string | null>(null)

  const [editingPersonal, setEditingPersonal] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  const [editingIdentity, setEditingIdentity] = useState(false)
  const [editingBank, setEditingBank] = useState(false)
  
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
  
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    tradingAlerts: true,
    twoFactorEnabled: false,
    language: 'id',
    timezone: 'Asia/Jakarta'
  })
  
  const [copied, setCopied] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

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
      
      let data: UserProfile | null = null
      
      if (response && typeof response === 'object') {
        if ('data' in response && response.data) {
          data = response.data as UserProfile
        } 
        else if ('user' in response && 'statusInfo' in response) {
          data = response as UserProfile
        }
      }
      
      if (!data) {
        throw new Error('No profile data received')
      }

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
      toast.error(error?.message || 'Failed to load profile', {
        style: { background: '#ef4444', color: '#fff' }
      })
    } finally {
      setInitialLoading(false)
    }
  }

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

  const handleBlur = (field: string, value: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, value)
    setFormErrors(prev => ({ ...prev, [field]: error }))
  }

  const compressImage = async (file: File, maxSizeMB: number = 0.5): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const img = new Image()
        
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          
          const maxDimension = 1920
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = (height / width) * maxDimension
              width = maxDimension
            } else {
              width = (width / height) * maxDimension
              height = maxDimension
            }
          }
          
          canvas.width = width
          canvas.height = height
          
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                })
                
                console.log('🗜️ Compression:', {
                  original: `${(file.size / 1024).toFixed(2)} KB`,
                  compressed: `${(compressedFile.size / 1024).toFixed(2)} KB`,
                  reduction: `${(((file.size - compressedFile.size) / file.size) * 100).toFixed(1)}%`
                })
                
                resolve(compressedFile)
              } else {
                reject(new Error('Compression failed'))
              }
            },
            'image/jpeg',
            0.7
          )
        }
        
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

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

  const uploadKTP = async (photoFront: File, photoBack?: File | null): Promise<boolean> => {
    try {
      console.log('📸 Starting KTP upload...')
      
      if (!photoFront.type.startsWith('image/')) {
        toast.error('Front photo must be an image file')
        return false
      }

      if (photoBack && !photoBack.type.startsWith('image/')) {
        toast.error('Back photo must be an image file')
        return false
      }

      setUpdating(true)
      const uploadToast = toast.loading('Compressing and uploading KTP photos...')

      try {
        console.log('🗜️ Compressing front photo...')
        const compressedFront = await compressImage(photoFront, 0.5)
        
        let compressedBack: File | undefined
        if (photoBack) {
          console.log('🗜️ Compressing back photo...')
          compressedBack = await compressImage(photoBack, 0.5)
        }

        console.log('📄 Converting to base64...')
        const photoFrontBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            if (reader.result) {
              const base64 = reader.result as string
              console.log('✅ Front photo converted:', {
                size: `${(base64.length / 1024).toFixed(2)} KB`,
                type: compressedFront.type
              })
              resolve(base64)
            } else {
              reject(new Error('Failed to read front photo'))
            }
          }
          reader.onerror = () => reject(new Error('Failed to read front photo'))
          reader.readAsDataURL(compressedFront)
        })

        const uploadData: any = {
          photoFront: {
            url: photoFrontBase64,
            fileSize: compressedFront.size,
            mimeType: compressedFront.type
          }
        }

        if (compressedBack) {
          const photoBackBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              if (reader.result) {
                const base64 = reader.result as string
                console.log('✅ Back photo converted:', {
                  size: `${(base64.length / 1024).toFixed(2)} KB`,
                  type: compressedBack.type
                })
                resolve(base64)
              } else {
                reject(new Error('Failed to read back photo'))
              }
            }
            reader.onerror = () => reject(new Error('Failed to read back photo'))
            reader.readAsDataURL(compressedBack)
          })

          uploadData.photoBack = {
            url: photoBackBase64,
            fileSize: compressedBack.size,
            mimeType: compressedBack.type
          }
        }

        console.log('📤 Sending to API...')
        
        const response = await api.uploadKTP(uploadData)
        
        console.log('✅ Upload successful:', response)
        
        toast.success('KTP photos uploaded! Waiting for admin verification.', {
          id: uploadToast
        })
        
        setKtpFrontFile(null)
        setKtpBackFile(null)
        setKtpFrontPreview(null)
        setKtpBackPreview(null)
        
        await loadProfile()
        return true
        
      } catch (uploadError: any) {
        console.error('❌ Upload error:', uploadError)
        
        let errorMessage = 'Failed to upload KTP photos'
        
        if (uploadError?.response?.status === 413) {
          errorMessage = 'Image too large. Please use a smaller image.'
        } else if (uploadError?.response?.status === 500) {
          errorMessage = 'Server error. Please try again or use a smaller image.'
        } else if (uploadError?.response?.status === 502) {
          errorMessage = 'Upload timeout. Image might be too large.'
        } else if (uploadError?.response?.data?.error) {
          errorMessage = uploadError.response.data.error
        } else if (uploadError?.message) {
          errorMessage = uploadError.message
        }
        
        toast.error(errorMessage, { id: uploadToast })
        return false
      }
      
    } catch (error: any) {
      console.error('❌ KTP upload failed:', error)
      toast.error(error?.message || 'Failed to process photos')
      return false
    } finally {
      setUpdating(false)
    }
  }

  const uploadSelfie = async (file: File): Promise<boolean> => {
    try {
      console.log('🤳 Starting selfie upload...', {
        size: file.size,
        type: file.type
      })
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file', {
          style: { background: '#ef4444', color: '#fff' }
        })
        return false
      }

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
        console.log('📄 Converting selfie to base64...')
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            if (reader.result) {
              console.log('✅ Selfie converted')
              resolve(reader.result as string)
            } else {
              reject(new Error('Failed to read selfie'))
            }
          }
          reader.onerror = () => reject(new Error('Failed to read selfie'))
          reader.readAsDataURL(file)
        })

        console.log('📤 Sending to API...')
        await api.uploadSelfie({
          url: base64,
          fileSize: file.size,
          mimeType: file.type
        })
        
        console.log('✅ Upload successful!')
        toast.success('Selfie uploaded! Waiting for admin verification.', {
          id: uploadToast,
          style: { background: '#10b981', color: '#fff' }
        })
        
        await loadProfile()
        return true
        
      } catch (uploadError: any) {
        console.error('❌ Upload error:', uploadError)
        console.error('Error details:', {
          message: uploadError?.message,
          response: uploadError?.response?.data,
          status: uploadError?.response?.status
        })
        
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
      console.error('❌ Selfie upload failed:', error)
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
  ]

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
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow overflow-hidden"
                whileHover={{ y: -2 }}
              >
                <div className="flex items-start sm:items-center gap-4">
                  <motion.div 
                    className="relative flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-lg overflow-hidden">
                      {profileInfo?.avatar?.url ? (
                        <img src={profileInfo.avatar.url} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <motion.span 
                          className="text-white text-2xl sm:text-3xl font-bold"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                          {user.email[0].toUpperCase()}
                        </motion.span>
                      )}
                    </div>
                    <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-sky-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-sky-600 transition-all shadow-lg border-2 border-white group">
                      <Camera className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform" />
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                        if (e.target.files?.[0]) handleUploadAvatar(e.target.files[0])
                      }} />
                    </label>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <motion.h2 
                      className="text-lg sm:text-xl font-bold text-gray-900 mb-1 leading-tight"
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
                          <ShieldCheck className="inline-block w-4 h-4 sm:w-5 sm:h-5 ml-2 text-sky-500 align-middle" />
                        )}
                      </motion.span>
                    </motion.h2>
                    <motion.p 
                      className="text-sm text-gray-600 break-all mb-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      {user?.email}
                    </motion.p>
                    
                    {statusInfo && (
                      <motion.div 
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-white shadow-lg text-sm bg-gradient-to-r ${getStatusGradient(statusInfo.current)}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                        whileHover={{ scale: 1.02 }}
                      >
                        {React.createElement(getStatusIcon(statusInfo.current), { className: "w-4 h-4" })}
                        <span className="font-semibold">{statusInfo.current.toUpperCase()}</span>
                        <span className="opacity-90">{statusInfo.profitBonus}% Bonus</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>

              {profileInfo && profileInfo.completion < 100 && (
                <motion.div 
                  className="bg-gradient-to-r from-sky-50 to-sky-100 border border-sky-200 rounded-xl p-4 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-sky-900 mb-1 text-sm flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Complete Your Profile
                      </h3>
                      <p className="text-xs text-sky-700">Unlock all features by completing your profile</p>
                    </div>
                    <motion.div 
                      className="text-xl sm:text-2xl font-bold text-sky-600"
                      key={profileInfo.completion}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      {profileInfo.completion}%
                    </motion.div>
                  </div>
                  <div className="w-full bg-sky-200 rounded-full h-2 overflow-hidden">
                    <motion.div 
                      className="h-2 rounded-full bg-gradient-to-r from-sky-500 to-sky-600" 
                      initial={{ width: 0 }}
                      animate={{ width: `${profileInfo.completion}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                    />
                  </div>
                </motion.div>
              )}

              <motion.div 
                className="grid grid-cols-2 gap-3"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {[
                  { 
                    label: 'Real Balance', 
                    value: `Rp ${(profile?.balances?.real ?? 0).toLocaleString('id-ID')}`, 
                    icon: CreditCard, 
                    color: 'text-emerald-600' 
                  },
                  { 
                    label: 'Demo Balance', 
                    value: `Rp ${(profile?.balances?.demo ?? 0).toLocaleString('id-ID')}`, 
                    icon: TrendingUp, 
                    color: 'text-sky-600' 
                  },
                  { 
                    label: 'Total Orders', 
                    value: profile?.statistics?.combined?.totalOrders ?? 0, 
                    icon: Briefcase, 
                    color: 'text-violet-600' 
                  }
                ].map((stat, i) => (
                  <motion.div 
                    key={stat.label}
                    className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    variants={fadeInUp}
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-xs text-gray-600 mb-1">{stat.label}</div>
                        <motion.div 
                          className={`text-lg font-bold text-gray-900 ${stat.color}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 + i * 0.1 }}
                        >
                          {stat.value}
                        </motion.div>
                      </div>
                      <stat.icon className={`w-6 h-6 text-gray-200 ${stat.color}`} />
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.7 }}
              >
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-sky-500" />
                  Verification Status
                </h3>
                <motion.div 
                  className="grid grid-cols-2 gap-2"
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
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 text-sm ${
                        item.verified 
                          ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-50' 
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                    >
                      <motion.div
                        animate={item.verified ? { rotate: 360 } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        <item.icon className={`w-5 h-5 ${item.verified ? 'text-emerald-600' : 'text-gray-400'}`} />
                      </motion.div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 text-xs">{item.label}</div>
                        <motion.div 
                          className={`text-xs font-medium flex items-center gap-1 ${
                            item.verified ? 'text-emerald-600' : 'text-gray-500'
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
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-sky-50 to-white">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Personal Information</h3>
                  <p className="text-xs text-gray-500">Your basic personal details</p>
                </div>
                <AnimatePresence mode="wait">
                  {!editingPersonal ? (
                    <motion.button 
                      onClick={() => setEditingPersonal(true)} 
                      className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-lg hover:from-sky-600 hover:to-sky-700 transition-all shadow-md text-xs font-medium"
                      whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(59, 130, 246, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit2 className="w-3 h-3" /> Edit
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
                          loadProfile()
                        }} 
                        disabled={savingSection === 'personal'} 
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-xs font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button 
                        onClick={handleUpdatePersonal} 
                        disabled={savingSection === 'personal'} 
                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-lg hover:from-sky-600 hover:to-sky-700 transition-all disabled:opacity-50 shadow-md text-xs font-medium"
                        whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(59, 130, 246, 0.3)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {savingSection === 'personal' ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3" /> Save
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.div 
                className="p-4 space-y-4"
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
                            className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors text-sm ${
                              formErrors[field.key] && touchedFields[field.key]
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-300 focus:border-sky-500'
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
                            className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors text-sm ${
                              formErrors[field.key] && touchedFields[field.key]
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-300 focus:border-sky-500'
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
                        className="px-3 py-3 bg-gray-100 rounded-xl text-gray-900 font-medium border border-gray-200 text-sm"
                        whileHover={{ backgroundColor: 'rgb(243 244 246)' }}
                      >
                        {field.key === 'dateOfBirth' && (personalData as any)[field.key]
                          ? new Date((personalData as any)[field.key]).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                          : (personalData as any)[field.key] || '-'}
                      </motion.div>
                    )}
                    {autoSaving === 'personal' && (
                      <motion.div 
                        className="mt-1 text-xs text-sky-600 flex items-center gap-1"
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
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Address Information</h3>
                  <p className="text-xs text-gray-500">Your residential address</p>
                </div>
                <AnimatePresence mode="wait">
                  {!editingAddress ? (
                    <motion.button 
                      onClick={() => setEditingAddress(true)} 
                      className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md text-xs font-medium"
                      whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(16, 185, 129, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit2 className="w-3 h-3" /> Edit
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
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-xs font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button 
                        onClick={handleUpdateAddress} 
                        disabled={savingSection === 'address'} 
                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-md text-xs font-medium"
                        whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(16, 185, 129, 0.3)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {savingSection === 'address' ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3" /> Save
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.div 
                className="p-4 space-y-4"
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
                        className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm ${
                          formErrors.street && touchedFields.street
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-300 focus:border-emerald-500'
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
                    <div className="px-3 py-3 bg-gray-100 rounded-xl text-gray-900 font-medium border border-gray-200 text-sm">
                      {addressData.street || '-'}
                    </div>
                  )}
                </motion.div>
                
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3" variants={fadeInUp}>
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
                          className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm ${
                            formErrors.city && touchedFields.city
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-gray-300 focus:border-emerald-500'
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
                      <div className="px-3 py-3 bg-gray-100 rounded-xl text-gray-900 font-medium border border-gray-200 text-sm">
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
                          className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm ${
                            formErrors.province && touchedFields.province
                              ? 'border-red-300 focus:border-red-500'
                              : 'border-gray-300 focus:border-emerald-500'
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
                      <div className="px-3 py-3 bg-gray-100 rounded-xl text-gray-900 font-medium border border-gray-200 text-sm">
                        {addressData.province || '-'}
                      </div>
                    )}
                  </div>
                </motion.div>
                
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-3" variants={fadeInUp}>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Postal Code</label>
                    {editingAddress ? (
                      <input
                        type="text"
                        value={addressData.postalCode}
                        onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })}
                        className="w-full px-3 py-3 bg-gray-100 border border-gray-300 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm"
                        placeholder="12345"
                      />
                    ) : (
                      <div className="px-3 py-3 bg-gray-100 rounded-xl text-gray-900 font-medium border border-gray-200 text-sm">
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
                        className="w-full px-3 py-3 bg-gray-100 border border-gray-300 rounded-xl focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm"
                        placeholder="Indonesia"
                      />
                    ) : (
                      <div className="px-3 py-3 bg-gray-100 rounded-xl text-gray-900 font-medium border border-gray-200 text-sm">
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
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-violet-50 to-white">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-violet-500" />
                    Identity Verification
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {editingIdentity ? 'Upload documents to verify your identity' : 'Your identity documents'}
                  </p>
                </div>
                <AnimatePresence mode="wait">
                  {!editingIdentity ? (
                    <motion.button 
                      onClick={() => setEditingIdentity(true)} 
                      className="flex items-center gap-1.5 px-3 py-2 bg-white border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-50 transition-all shadow-sm text-xs font-medium"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </motion.button>
                  ) : (
                    <motion.div 
                      className="flex gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <motion.button 
                        onClick={() => {
                          setEditingIdentity(false)
                          setKtpFrontFile(null)
                          setKtpBackFile(null)
                          setKtpFrontPreview(null)
                          setKtpBackPreview(null)
                          loadProfile()
                        }} 
                        disabled={updating} 
                        className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-xs font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button 
                        onClick={() => {
                          if (identityData.number !== profileInfo?.identity?.number) {
                            handleUpdateIdentity()
                          }
                          setEditingIdentity(false)
                        }} 
                        disabled={updating || (!ktpFrontFile && !profileInfo?.identity?.photoFront)} 
                        className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-xs font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {updating ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Done</span>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.div 
                className="p-4 space-y-6"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={fadeInUp} className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    ID Number <span className="text-red-500">*</span>
                  </label>
                  {editingIdentity ? (
                    <input
                      type="text"
                      value={identityData.number}
                      onChange={(e) => setIdentityData({ ...identityData, number: e.target.value })}
                      className="w-full px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all text-sm"
                      placeholder="Enter your KTP/Passport number"
                    />
                  ) : (
                    <div className="px-3 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 font-medium text-sm flex items-center justify-between">
                      <span>{identityData.number || '-'}</span>
                      {profileInfo?.identity?.isVerified && (
                        <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>

                <motion.div variants={fadeInUp} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-violet-500" />
                      ID Document Photos
                    </h4>
                    {profileInfo?.identity?.isVerified && !editingIdentity && (
                      <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <span className="text-xs font-medium text-gray-500">Front Side</span>
                      <div className="relative">
                        {profileInfo?.identity?.photoFront && !editingIdentity ? (
                          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                            <img 
                              src={profileInfo.identity.photoFront.url} 
                              alt="KTP Front"
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        ) : editingIdentity && ktpFrontPreview ? (
                          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-violet-300 bg-gray-100">
                            <img 
                              src={ktpFrontPreview} 
                              alt="KTP Front Preview"
                              className="w-full h-full object-cover" 
                            />
                            <button
                              onClick={() => {
                                setKtpFrontFile(null)
                                setKtpFrontPreview(null)
                              }}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : editingIdentity ? (
                          <label className="flex flex-col items-center justify-center aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-violet-400 hover:bg-gray-50 transition-colors bg-gray-100">
                            <Camera className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-600 font-medium">Upload Front</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">Max 2MB</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setKtpFrontFile(file)
                                  const reader = new FileReader()
                                  reader.onloadend = () => setKtpFrontPreview(reader.result as string)
                                  reader.readAsDataURL(file)
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="flex flex-col items-center justify-center aspect-[4/3] border border-gray-200 rounded-lg bg-gray-100 text-gray-400">
                            <FileText className="w-8 h-8 mb-1 opacity-50" />
                            <span className="text-xs">Not uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-medium text-gray-500">Back Side (Optional)</span>
                      <div className="relative">
                        {profileInfo?.identity?.photoBack && !editingIdentity ? (
                          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                            <img 
                              src={profileInfo.identity.photoBack.url} 
                              alt="KTP Back"
                              className="w-full h-full object-cover" 
                            />
                          </div>
                        ) : editingIdentity && ktpBackPreview ? (
                          <div className="relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-violet-300 bg-gray-100">
                            <img 
                              src={ktpBackPreview} 
                              alt="KTP Back Preview"
                              className="w-full h-full object-cover" 
                            />
                            <button
                              onClick={() => {
                                setKtpBackFile(null)
                                setKtpBackPreview(null)
                              }}
                              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : editingIdentity ? (
                          <label className="flex flex-col items-center justify-center aspect-[4/3] border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-violet-400 hover:bg-gray-50 transition-colors bg-gray-100">
                            <Camera className="w-8 h-8 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-600 font-medium">Upload Back</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">Max 2MB</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setKtpBackFile(file)
                                  const reader = new FileReader()
                                  reader.onloadend = () => setKtpBackPreview(reader.result as string)
                                  reader.readAsDataURL(file)
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="flex flex-col items-center justify-center aspect-[4/3] border border-gray-200 rounded-lg bg-gray-100 text-gray-400">
                            <FileText className="w-8 h-8 mb-1 opacity-50" />
                            <span className="text-xs">Not uploaded</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {editingIdentity && (ktpFrontFile || ktpBackFile) && (
                    <motion.button
                      onClick={async () => {
                        if (ktpFrontFile) {
                          const success = await uploadKTP(ktpFrontFile, ktpBackFile)
                          if (success) {
                            setEditingIdentity(false)
                          }
                        }
                      }}
                      disabled={updating || !ktpFrontFile}
                      className="w-full py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium shadow-sm"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {updating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          Upload {ktpBackFile ? 'Both Photos' : 'Front Photo'}
                        </>
                      )}
                    </motion.button>
                  )}
                </motion.div>

                <motion.div variants={fadeInUp} className="space-y-3 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-violet-500" />
                      Selfie Verification
                    </h4>
                    {profileInfo?.selfie?.isVerified && !editingIdentity && (
                      <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2 py-1 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>

                  <div className="relative max-w-[200px] mx-auto sm:mx-0">
                    {profileInfo?.selfie && !editingIdentity ? (
                      <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
                        <img 
                          src={profileInfo.selfie.url} 
                          alt="Selfie"
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ) : editingIdentity ? (
                      <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-violet-400 hover:bg-gray-50 transition-colors bg-gray-100 max-w-[200px]">
                        {profileInfo?.selfie ? (
                          <>
                            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2" />
                            <span className="text-xs text-emerald-600 font-medium text-center px-4">Selfie already uploaded</span>
                            <span className="text-[10px] text-gray-400 mt-1">Click to change</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-10 h-10 text-gray-400 mb-2" />
                            <span className="text-xs text-gray-600 font-medium">Tap to upload selfie</span>
                            <span className="text-[10px] text-gray-400 mt-0.5">Max 1MB</span>
                          </>
                        )}
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
                    ) : (
                      <div className="flex flex-col items-center justify-center aspect-square border border-gray-200 rounded-lg bg-gray-100 text-gray-400 max-w-[200px]">
                        <UserCheck className="w-10 h-10 mb-2 opacity-50" />
                        <span className="text-xs">Not uploaded</span>
                      </div>
                    )}
                  </div>
                </motion.div>

                {!editingIdentity && !profileInfo?.identity?.isVerified && (
                  <motion.div 
                    variants={fadeInUp}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      Please complete your identity verification to unlock all features. Click Edit to upload your documents.
                    </p>
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
              <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-white">
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-1">Bank Account</h3>
                  <p className="text-xs text-gray-500">Add your bank account for withdrawals</p>
                </div>
                <AnimatePresence mode="wait">
                  {!editingBank ? (
                    <motion.button 
                      onClick={() => setEditingBank(true)} 
                      className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md text-xs font-medium"
                      whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(16, 185, 129, 0.3)" }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit2 className="w-3 h-3" /> Edit
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
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-xs font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button 
                        onClick={handleUpdateBank} 
                        disabled={savingSection === 'bank'} 
                        className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-md text-xs font-medium"
                        whileHover={{ scale: 1.02, boxShadow: "0 5px 15px rgba(16, 185, 129, 0.3)" }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {savingSection === 'bank' ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" /> Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-3 h-3" /> Save
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.div 
                className="p-4 space-y-4"
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
                        className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm ${
                          formErrors.bankName && touchedFields.bankName
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-300 focus:border-emerald-500'
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
                    <div className="px-3 py-3 bg-gray-100 rounded-xl text-gray-900 font-medium border border-gray-200 text-sm">
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
                        className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm ${
                          formErrors.accountNumber && touchedFields.accountNumber
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-300 focus:border-emerald-500'
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
                    <div className="px-3 py-3 bg-gray-100 rounded-xl text-gray-900 font-medium border border-gray-200 text-sm">
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
                        className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm ${
                          formErrors.accountHolderName && touchedFields.accountHolderName
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-300 focus:border-emerald-500'
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
                    <div className="px-3 py-3 bg-gray-100 rounded-xl text-gray-900 font-medium border border-gray-200 text-sm">
                      {bankData.accountHolderName || '-'}
                    </div>
                  )}
                </motion.div>
                
                {profileInfo?.bankAccount?.isVerified && (
                  <motion.div 
                    className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                    variants={fadeInUp}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring" }}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-900">Bank Account Verified</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'status' && statusInfo && (
            <motion.div 
              className="space-y-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6"
                variants={fadeInUp}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-r ${getStatusGradient(statusInfo.current)} flex items-center justify-center shadow-sm`}>
                      {React.createElement(getStatusIcon(statusInfo.current), { className: "w-7 h-7 text-white" })}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-0.5">Current Status</p>
                      <h3 className="text-xl font-bold text-gray-900 mb-0.5">{statusInfo.current.toUpperCase()}</h3>
                      <p className="text-sm font-medium text-emerald-600">Bonus +{statusInfo.profitBonus}%</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="text-left sm:text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Total Deposit</p>
                      <p className="text-base font-semibold text-gray-900">{formatDepositRequirement(statusInfo.totalDeposit)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current).next && (
                <motion.div 
                  className="bg-white rounded-xl border border-gray-200 p-4"
                  variants={fadeInUp}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-sky-500" />
                      <span className="text-sm font-semibold text-gray-900">
                        Progress to {STATUS_CONFIG[calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current).next!].label}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-sky-600">
                      {calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current).progress}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <motion.div 
                      className="h-full rounded-full bg-sky-500" 
                      initial={{ width: 0 }}
                      animate={{ width: `${calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current).progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Need {formatDepositRequirement(calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current).depositNeeded)} more to upgrade
                  </p>
                </motion.div>
              )}

              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4"
                variants={fadeInUp}
              >
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  All Status Tiers
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {getAllStatusTiers().map(({ status, config, icon: Icon }) => {
                    const isCurrent = status === statusInfo.current
                    const isUnlocked = STATUS_CONFIG[status].minDeposit <= statusInfo.totalDeposit
                    
                    return (
                      <motion.div 
                        key={status}
                        className={`relative p-4 rounded-lg border transition-all ${
                          isCurrent 
                            ? 'border-sky-500 bg-sky-50/50' 
                            : isUnlocked
                            ? 'border-emerald-200 bg-emerald-50/30'
                            : 'border-gray-100 bg-gray-50/50'
                        }`}
                        whileHover={{ scale: 1.01 }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isCurrent ? 'bg-sky-100 text-sky-600' : 
                            isUnlocked ? 'bg-emerald-100 text-emerald-600' : 
                            'bg-gray-200 text-gray-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${isCurrent ? 'text-sky-900' : 'text-gray-900'}`}>
                              {config.label}
                            </p>
                          </div>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-white bg-sky-500 px-2 py-0.5 rounded-full">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Profit Bonus</span>
                            <span className="font-semibold text-gray-900">{config.profitBonus}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-500">Min Deposit</span>
                            <span className="font-semibold text-gray-900">{formatDepositRequirement(config.minDeposit)}</span>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'affiliate' && affiliateInfo && (
            <motion.div 
              className="space-y-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                variants={fadeInUp}
                whileHover={{ y: -2 }}
              >
                <h3 className="text-base font-bold text-gray-900 mb-3 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-violet-500" />
                  Affiliate Program
                </h3>
                <motion.div 
                  className="grid grid-cols-3 gap-3"
                  variants={staggerContainer}
                >
                  {[
                    { label: 'Total Referrals', value: affiliateInfo.totalReferrals, color: 'text-gray-900', bg: 'bg-gray-100' },
                    { label: 'Completed', value: affiliateInfo.completedReferrals, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Pending', value: affiliateInfo.pendingReferrals, color: 'text-yellow-600', bg: 'bg-yellow-50' }
                  ].map((stat, i) => (
                    <motion.div 
                      key={stat.label}
                      className={`text-center p-3 ${stat.bg} rounded-lg border border-gray-200`}
                      variants={fadeInUp}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <motion.div 
                        className={`text-xl font-bold ${stat.color}`}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", delay: i * 0.1 }}
                      >
                        {stat.value}
                      </motion.div>
                      <div className="text-xs text-gray-600 mt-1">{stat.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                variants={fadeInUp}
                whileHover={{ y: -2 }}
              >
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                  <Share2 className="w-5 h-5 mr-2 text-sky-500" />
                  Your Referral Link
                </h3>
                <motion.div 
                  className="flex flex-col gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <motion.div 
                    className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-black font-mono text-xs break-all"
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
                    className="w-full px-3 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span className="font-medium">{copied ? 'Copied!' : 'Copy Link'}</span>
                  </motion.button>
                </motion.div>
                <motion.p 
                  className="text-xs text-gray-600 mt-2 flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Gift className="w-4 h-4 text-yellow-500" />
                  Share this link to earn <span className="font-bold">Rp 25,000</span> per successful referral!
                </motion.p>
              </motion.div>

              <motion.div 
                className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg transition-shadow"
                variants={fadeInUp}
                whileHover={{ y: -2 }}
              >
                <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
                  <Gift className="w-5 h-5 mr-2 text-yellow-500" />
                  Commission Earned
                </h3>
                <motion.div 
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div>
                    <motion.div 
                      className="text-xl font-bold text-gray-900"
                      key={affiliateInfo.totalCommission}
                      initial={{ scale: 1.2 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring" }}
                    >
                      {formatDepositRequirement(affiliateInfo.totalCommission)}
                    </motion.div>
                    <div className="text-xs text-gray-600">Total Commission</div>
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
              <div className="p-4 bg-red-50">
                <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-red-500" />
                  Security Settings
                </h3>
                <p className="text-xs text-gray-500">Change your password & security preferences</p>
              </div>

              <motion.form 
                onSubmit={handleChangePassword} 
                className="p-4 space-y-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={fadeInUp}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="w-full pl-10 pr-10 py-3 bg-gray-100 border border-gray-300 rounded-xl focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                      className="w-full pl-10 pr-10 py-3 bg-gray-100 border border-gray-300 rounded-xl focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={passwordData.newPassword} />
                </motion.div>

                <motion.div variants={fadeInUp}>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="w-full pl-10 pr-10 py-3 bg-gray-100 border border-gray-300 rounded-xl focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-colors text-sm"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" /> Change Password
                    </>
                  )}
                </motion.button>
              </motion.form>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50">
      <Navbar />
      <Toaster position="top-right" expand={true} />
      
      <div className="container mx-auto px-3 py-8 max-w-7xl">
        <motion.div 
          className="mb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
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
            className="flex mt-2 items-center gap-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-md"
              whileHover={{ rotate: 90, scale: 1.05 }}
              transition={{ type: "spring" }}
            >
              <Settings className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">My Profile</h1>
              <motion.p 
                className="text-xs text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Profile completion: <span className="font-semibold">{profileInfo?.completion ?? 0}%</span>
              </motion.p>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <motion.div 
            className="col-span-1 md:hidden"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm mb-4 overflow-hidden">
              <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {tabs.map((tab, i) => {
                    const Icon = tab.icon
                    return (
                      <motion.button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs flex-shrink-0 ${
                          activeTab === tab.id
                            ? 'bg-sky-500 text-white shadow-md'
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
            </div>
          </motion.div>

          <motion.div 
            className="hidden md:block md:col-span-4 lg:col-span-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-white rounded-xl border border-gray-200 p-2 sticky top-4 shadow-sm">
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
                          ? 'bg-sky-500 text-white shadow-md'
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
                
                <motion.div 
                  className="pt-2 mt-2 border-t border-gray-200"
                  variants={fadeInUp}
                  transition={{ delay: tabs.length * 0.05 }}
                >
                  <motion.button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all text-left"
                    whileHover={{ x: 5 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">Logout</span>
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

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