'use client'
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import Navbar from '@/components/Navbar'
import { motion, AnimatePresence, Variants } from 'framer-motion'
import {
  User, Mail, Shield, Calendar, Bell, Save, LogOut,
  CheckCircle2, Settings, Award, Crown, TrendingUp, Copy, Check,
  MapPin, CreditCard, FileText, Camera, Phone, Edit2,
  ChevronRight, AlertCircle, Home, Building, Globe, Loader2, ShieldCheck,
  UserCheck, Briefcase, X, Menu, Info, CheckSquare, Square,
  UserPlus2,
  User2
} from 'lucide-react'
import { toast, Toaster } from 'sonner'
import type { UserProfile, UserProfileInfo, UpdateProfileRequest, ChangePasswordRequest } from '@/types'
import { STATUS_CONFIG, calculateProfileCompletion } from '@/types'
import { getStatusGradient, formatStatusInfo, calculateStatusProgress, formatDepositRequirement } from '@/lib/status-utils'
import { auth } from '@/lib/firebase-auth'
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth'

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
  <>
    {/* INJECT STYLE GLOBAL KHUSUS UNTUK SKELETON */}
    <style jsx global>{`
      /* Grid Pattern - Background sedikit gelap agar card terlihat */
      .bg-pattern-grid {
        background-color: #f0f2f5 !important;
        background-image: 
          linear-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0, 0, 0, 0.06) 1px, transparent 1px);
        background-size: 40px 40px;
        background-position: center center;
      }
      
      /* Scrollbar hide utility */
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      
      /* Pastikan body tidak hitam saat loading */
      body {
        background-color: #f0f2f5 !important;
      }
      
      /* Skeleton animations */
      @keyframes skeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
      .skeleton-item {
        animation: skeleton-pulse 2s ease-in-out infinite;
        opacity: 0;
        animation-fill-mode: forwards;
      }
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      .shimmer {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
      }
    `}</style>

    <div className="min-h-screen bg-pattern-grid">
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
  </>
)

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
const validatePhone = (phone: string) => /^\+?[\d\s-()]{10,}$/.test(phone)

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
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    tradingAlerts: true,
    twoFactorEnabled: false,
    language: 'id',
    timezone: 'Asia/Jakarta'
  })
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  // Firebase Phone Auth state
  const [showPhoneOTP, setShowPhoneOTP] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpCooldown, setOtpCooldown] = useState(0)
  const confirmationRef = useRef<ConfirmationResult | null>(null)
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null)
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null)

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

  // ─── Firebase Phone Auth handlers ────────────────────────────────────────

  const startOtpCooldown = useCallback((seconds = 60) => {
    setOtpCooldown(seconds)
    const interval = setInterval(() => {
      setOtpCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
  }, [])

  /**
   * Setup invisible reCAPTCHA and send OTP via Firebase
   */
  const handleSendPhoneOTP = useCallback(async () => {
    const phone = personalData.phoneNumber
    if (!phone) { toast.error('Masukkan nomor telepon terlebih dahulu'); return }
    if (!validatePhone(phone)) { toast.error('Format nomor telepon tidak valid (contoh: +6281234567890)'); return }

    // Guard: pastikan Firebase auth terinisialisasi
    if (!auth) {
      toast.error('Firebase belum siap, refresh halaman')
      return
    }

    setOtpLoading(true)
    try {
      // Cleanup reCAPTCHA lama
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear() } catch (_) {}
        recaptchaRef.current = null
      }

      // Pastikan container ada di DOM
      const container = document.getElementById('recaptcha-container')
      if (!container) {
        toast.error('Komponen halaman belum siap, coba lagi')
        return
      }

      // Buat RecaptchaVerifier baru
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          toast.error('reCAPTCHA kedaluwarsa, coba lagi')
          setOtpLoading(false)
        },
      })

      // Render verifier dulu secara eksplisit
      await verifier.render()
      recaptchaRef.current = verifier

      const result = await signInWithPhoneNumber(auth, phone, verifier)
      confirmationRef.current = result

      setOtpSent(true)
      setShowPhoneOTP(true)
      startOtpCooldown(60)
      toast.success(`Kode OTP dikirim ke ${phone}`)
    } catch (error: any) {
      console.error('Send OTP error:', error)

      // Cleanup reCAPTCHA agar bisa dicoba ulang
      if (recaptchaRef.current) {
        try { recaptchaRef.current.clear() } catch (_) {}
        recaptchaRef.current = null
      }

      const msg =
        error.code === 'auth/invalid-phone-number'    ? 'Nomor telepon tidak valid' :
        error.code === 'auth/too-many-requests'        ? 'Terlalu banyak percobaan, coba lagi nanti' :
        error.code === 'auth/captcha-check-failed'     ? 'Verifikasi reCAPTCHA gagal, refresh halaman' :
        error.code === 'auth/invalid-app-credential'   ? 'Konfigurasi Firebase belum diaktifkan. Hubungi admin.' :
        error.code === 'auth/quota-exceeded'           ? 'Kuota SMS habis, coba lagi nanti' :
        error.code === 'auth/missing-phone-number'     ? 'Nomor telepon tidak boleh kosong' :
        error.code === 'auth/app-not-authorized'       ? 'Aplikasi belum diotorisasi untuk Phone Auth' :
        error.message || 'Gagal mengirim OTP, coba lagi'
      toast.error(msg)
    } finally {
      setOtpLoading(false)
    }
  }, [personalData.phoneNumber, startOtpCooldown])

  /**
   * Confirm OTP → ambil Firebase idToken → kirim ke backend
   */
  const handleVerifyPhoneOTP = useCallback(async () => {
    if (!confirmationRef.current) { toast.error('Kirim OTP terlebih dahulu'); return }
    if (otpCode.length !== 6 || !/^\d+$/.test(otpCode)) {
      toast.error('Kode OTP harus 6 digit angka'); return
    }

    setOtpLoading(true)
    try {
      const userCredential = await confirmationRef.current.confirm(otpCode)
      const idToken = await userCredential.user.getIdToken()

      await api.verifyPhone({ idToken })
      await loadProfile()

      setShowPhoneOTP(false)
      setOtpCode('')
      setOtpSent(false)
      confirmationRef.current = null
      toast.success('Nomor telepon berhasil diverifikasi! ✓')
    } catch (error: any) {
      console.error('Verify OTP error:', error)
      const msg =
        error.code === 'auth/invalid-verification-code' ? 'Kode OTP salah, coba lagi' :
        error.code === 'auth/code-expired' ? 'Kode OTP sudah kedaluwarsa, kirim ulang' :
        error?.response?.data?.error || 'Verifikasi gagal'
      toast.error(msg)
    } finally {
      setOtpLoading(false)
    }
  }, [otpCode, loadProfile])

  // ─────────────────────────────────────────────────────────────────────────

  const validateField = useCallback((field: string, value: string): string => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Full name is required'
        if (value.trim().length < 3) return 'Harus minimal 3 karakter'
        return ''
      case 'phoneNumber':
        if (!value) return 'Phone number is required'
        if (!validatePhone(value)) return 'Invalid phone format'
        return ''
      case 'dateOfBirth':
        if (!value) return 'Date of birth is required'
        const age = new Date().getFullYear() - new Date(value).getFullYear()
        if (age < 18) return 'Harus minimal 18 years old'
        return ''
      case 'street':
      case 'city':
      case 'province':
        if (!value.trim()) return 'This field is required'
        return ''
      case 'accountNumber':
        if (!value.trim()) return 'Nomor rekening is required'
        if (!/^\d+$/.test(value)) return 'Must contain only angka'
        return ''
      case 'accountHolderName':
        if (!value.trim()) return 'Nama pemegang name is required'
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
                console.log('🖼️ Compression:', {
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
      toast.error(error.response?.data?.error || 'Gagal memperbarui', {
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
      toast.error(error.response?.data?.error || 'Gagal memperbarui', {
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
      toast.error(error.response?.data?.error || 'Gagal memperbarui', {
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
      toast.success('Rekening bank updated!', {
        style: { background: '#10b981', color: '#fff' }
      })
      setEditingBank(false)
      setTimeout(() => loadProfile(), 300)
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal memperbarui', {
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
      toast.error(error.response?.data?.error || 'Gagal memperbarui', {
        style: { background: '#ef4444', color: '#fff' }
      })
    } finally {
      setSavingSection(null)
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
          errorMessage = 'Server error. Silakan coba lagi or use a smaller image.'
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

  const tabs = [
    { id: 'overview', label: 'Ringkasan', icon: UserPlus2 },
    { id: 'personal', label: 'Info Pribadi', icon: User2 },
    { id: 'address', label: 'Alamat', icon: MapPin },
    { id: 'identity', label: 'Identitas', icon: FileText },
    { id: 'bank', label: 'Bank', icon: CreditCard },
    { id: 'status', label: 'Status', icon: Award },
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
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-3 gap-4"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {/* Kolom kiri — Identitas & Status */}
              <div className="lg:col-span-1 flex flex-col gap-4">
                {/* Kartu Profil */}
                <motion.div
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  variants={fadeInUp}
                >
                  {/* Banner header */}
                  <div className="h-16 bg-gradient-to-r from-sky-500 to-sky-600 relative">
                    <div className="absolute inset-0 opacity-10"
                      style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                    />
                  </div>
                  <div className="px-4 pb-4">
                    {/* Avatar */}
                    <div className="flex items-end gap-3 -mt-8 mb-3">
                      <motion.div className="relative flex-shrink-0" whileHover={{ scale: 1.05 }}>
                        <div className="w-16 h-16 rounded-2xl shadow-lg overflow-hidden border-2 border-white">
                          {profileInfo?.avatar?.url ? (
                            <img
                              src={profileInfo.avatar.url}
                              alt="Avatar"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement
                                img.style.display = 'none'
                                const fallback = img.nextElementSibling as HTMLElement
                                if (fallback) fallback.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div
                            className="flat-avatar w-full h-full rounded-2xl flex items-center justify-center text-2xl font-bold select-none"
                            style={{ display: profileInfo?.avatar?.url ? 'none' : 'flex' }}
                          >
                            {(user.email)[0].toUpperCase()}
                          </div>
                        </div>
                        <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-sky-600 transition-all shadow border-2 border-white group">
                          <Camera className="w-3 h-3 text-white group-hover:scale-110 transition-transform" />
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            if (e.target.files?.[0]) handleUploadAvatar(e.target.files[0])
                          }} />
                        </label>
                      </motion.div>
                      {statusInfo && (
                        <motion.div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-white text-xs font-semibold shadow bg-gradient-to-r ${getStatusGradient(statusInfo.current)}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3, type: 'spring' }}
                        >
                          <img
                            src={{ standard: '/std.png', gold: '/gold.png', vip: '/vip.png' }[statusInfo.current]}
                            alt={statusInfo.current}
                            className="w-3.5 h-3.5 object-contain"
                          />
                          {statusInfo.current.toUpperCase()}
                        </motion.div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h2 className="text-base font-bold text-gray-900 leading-tight truncate">
                          {profileInfo?.personal?.fullName || user?.email}
                        </h2>
                        {profileInfo?.verification?.identityVerified && (
                          <ShieldCheck className="w-4 h-4 text-sky-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 break-all">{user?.email}</p>
                      {statusInfo && (
                        <p className="text-xs text-emerald-600 font-medium mt-1">Bonus Profit: {statusInfo.profitBonus}</p>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Kelengkapan Profil */}
                {profileInfo && profileInfo.completion < 100 && (
                  <motion.div
                    className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4"
                    variants={fadeInUp}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <h3 className="font-semibold text-sky-900 text-sm flex items-center gap-1.5">
                          <TrendingUp className="w-4 h-4" />
                          Kelengkapan Profil
                        </h3>
                        <p className="text-xs text-sky-600 mt-0.5">Lengkapi profil untuk akses penuh</p>
                      </div>
                      <motion.div
                        className="text-2xl font-bold text-sky-600 tabular-nums"
                        key={profileInfo.completion}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring' }}
                      >
                        {profileInfo.completion}%
                      </motion.div>
                    </div>
                    <div className="w-full bg-sky-200 rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className="h-1.5 rounded-full bg-gradient-to-r from-sky-500 to-sky-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${profileInfo.completion}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Status Verifikasi */}
                <motion.div
                  className="bg-white rounded-xl border border-gray-200 p-4"
                  variants={fadeInUp}
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-sky-500" />
                    Status Verifikasi
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Email', verified: profileInfo?.verification?.emailVerified, icon: Mail },
                      { label: 'Nomor Telepon', verified: profileInfo?.verification?.phoneVerified, icon: Phone },
                      { label: 'Identitas', verified: profileInfo?.verification?.identityVerified, icon: FileText },
                      { label: 'Rekening Bank', verified: profileInfo?.verification?.bankVerified, icon: CreditCard },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className={`w-4 h-4 ${item.verified ? 'text-emerald-500' : 'text-gray-300'}`} />
                          <span className="text-sm text-gray-700">{item.label}</span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${item.verified ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {item.verified ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {item.verified ? 'Terverifikasi' : 'Belum'}
                        </span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Kolom kanan — Saldo & Statistik */}
              <div className="lg:col-span-2 flex flex-col gap-4">
                {/* Kartu Saldo */}
                <motion.div
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  variants={fadeInUp}
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-sky-500" />
                    <h3 className="text-sm font-bold text-gray-900">Saldo Akun</h3>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-gray-100">
                    {[
                      {
                        label: 'Saldo Riil',
                        value: `Rp ${(profile?.balances?.real ?? 0).toLocaleString('id-ID')}`,
                        icon: CreditCard,
                        desc: 'Dana aktif trading',
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50',
                      },
                      {
                        label: 'Saldo Demo',
                        value: `Rp ${(profile?.balances?.demo ?? 0).toLocaleString('id-ID')}`,
                        icon: TrendingUp,
                        desc: 'Akun latihan',
                        color: 'text-sky-600',
                        bg: 'bg-sky-50',
                      },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        className="p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                      >
                        <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center mb-2`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <p className="text-xs text-gray-500 mb-0.5">{item.label}</p>
                        <p className={`text-lg font-bold ${item.color} tabular-nums`}>{item.value}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Statistik Trading */}
                <motion.div
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  variants={fadeInUp}
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-violet-500" />
                    <h3 className="text-sm font-bold text-gray-900">Statistik Trading</h3>
                  </div>
                  <div className="grid grid-cols-3 divide-x divide-gray-100">
                    {[
                      {
                        label: 'Total Order',
                        value: profile?.statistics?.combined?.totalOrders ?? 0,
                        icon: Briefcase,
                        color: 'text-violet-600',
                        bg: 'bg-violet-50',
                      },
                      {
                        label: 'Order Menang',
                        value: profile?.statistics?.combined?.wonOrders ?? 0,
                        icon: CheckCircle2,
                        color: 'text-emerald-600',
                        bg: 'bg-emerald-50',
                      },
                      {
                        label: 'Order Kalah',
                        value: profile?.statistics?.combined?.lostOrders ?? 0,
                        icon: AlertCircle,
                        color: 'text-red-500',
                        bg: 'bg-red-50',
                      },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        className="p-4 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <p className={`text-xl font-bold ${item.color} tabular-nums`}>{item.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Informasi Akun */}
                <motion.div
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  variants={fadeInUp}
                >
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-bold text-gray-900">Informasi Akun</h3>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {[
                      {
                        label: 'Nama Lengkap',
                        value: profileInfo?.personal?.fullName || '—',
                        icon: User,
                      },
                      {
                        label: 'Nomor Telepon',
                        value: profileInfo?.personal?.phoneNumber || '—',
                        icon: Phone,
                      },
                      {
                        label: 'Tanggal Bergabung',
                        value: user?.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '—',
                        icon: Calendar,
                      },
                      {
                        label: 'Kewarganegaraan',
                        value: profileInfo?.personal?.nationality || '—',
                        icon: Globe,
                      },
                    ].map((row) => (
                      <div key={row.label} className="flex items-center gap-3 px-4 py-3">
                        <row.icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500 w-36 flex-shrink-0">{row.label}</span>
                        <span className="text-sm font-medium text-gray-800 truncate">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
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
                    info: 'Masukkan legal name as per ID'
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
                            className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors text-sm ${formErrors[field.key] && touchedFields[field.key]
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
                            className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20 transition-colors text-sm ${formErrors[field.key] && touchedFields[field.key]
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-gray-300 focus:border-sky-500'
                              }`}
                            placeholder={`Masukkan ${field.label.toLowerCase()}`}
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
                      field.key === 'phoneNumber' ? (
                        <div className="space-y-2">
                          {/* Tampilkan nomor + badge status */}
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex-1 min-w-0 px-3 py-3 bg-gray-100 rounded-xl text-gray-900 font-medium border border-gray-200 text-sm truncate">
                              {(personalData as any)[field.key] || '-'}
                            </div>
                            {(personalData as any)[field.key] && (
                              profileInfo?.verification?.phoneVerified ? (
                                <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200 whitespace-nowrap">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Terverifikasi
                                </span>
                              ) : (
                                <button
                                  onClick={() => setShowPhoneOTP(prev => !prev)}
                                  className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200 hover:bg-amber-100 transition-colors whitespace-nowrap"
                                >
                                  <Phone className="w-3.5 h-3.5" /> Verifikasi
                                </button>
                              )
                            )}
                          </div>

                          {/* OTP Panel — Firebase Phone Auth */}
                          <AnimatePresence>
                            {showPhoneOTP && !profileInfo?.verification?.phoneVerified && (
                              <motion.div
                                key="otp-panel"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-1 p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
                                  <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5" />
                                    Verifikasi Nomor Telepon via SMS OTP
                                  </p>

                                  {!otpSent ? (
                                    // Step 1 — Kirim OTP
                                    <button
                                      onClick={handleSendPhoneOTP}
                                      disabled={otpLoading}
                                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors"
                                    >
                                      {otpLoading
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengirim...</>
                                        : <><Phone className="w-4 h-4" /> Kirim Kode OTP</>
                                      }
                                    </button>
                                  ) : (
                                    // Step 2 — Input & konfirmasi OTP
                                    <div className="space-y-2">
                                      <p className="text-xs text-amber-700">
                                        Masukkan kode 6 digit yang dikirim ke{' '}
                                        <strong>{personalData.phoneNumber}</strong>
                                      </p>

                                      <div className="flex gap-2">
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          maxLength={6}
                                          value={otpCode}
                                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                          placeholder="• • • • • •"
                                          className="flex-1 px-3 py-2.5 bg-white border border-amber-300 rounded-lg text-center text-xl font-bold tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all"
                                        />
                                        <button
                                          onClick={handleVerifyPhoneOTP}
                                          disabled={otpLoading || otpCode.length !== 6}
                                          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
                                        >
                                          {otpLoading
                                            ? <Loader2 className="w-4 h-4 animate-spin" />
                                            : <CheckCircle2 className="w-4 h-4" />
                                          }
                                          Konfirmasi
                                        </button>
                                      </div>

                                      <div className="flex items-center justify-between pt-1">
                                        <button
                                          onClick={handleSendPhoneOTP}
                                          disabled={otpLoading || otpCooldown > 0}
                                          className="text-xs text-amber-700 hover:text-amber-900 disabled:opacity-40 disabled:cursor-not-allowed underline transition-colors"
                                        >
                                          {otpCooldown > 0
                                            ? `Kirim ulang dalam ${otpCooldown}s`
                                            : 'Kirim ulang OTP'}
                                        </button>
                                        <button
                                          onClick={() => { setShowPhoneOTP(false); setOtpCode(''); setOtpSent(false); confirmationRef.current = null }}
                                          className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                                        >
                                          Batal
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                      <motion.div
                        className="px-3 py-3 bg-gray-100 rounded-xl text-gray-900 font-medium border border-gray-200 text-sm"
                        whileHover={{ backgroundColor: 'rgb(243 244 246)' }}
                      >
                        {field.key === 'dateOfBirth' && (personalData as any)[field.key]
                          ? new Date((personalData as any)[field.key]).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
                          : (personalData as any)[field.key] || '-'}
                      </motion.div>
                      )
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
                        className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm ${formErrors.street && touchedFields.street
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
                          className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm ${formErrors.city && touchedFields.city
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
                          className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm ${formErrors.province && touchedFields.province
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
                    {editingIdentity ? 'Unggah dokumens to verify Anda identity' : 'Your identity documents'}
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
                      placeholder="Masukkan KTP/Paspor number"
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
                      <span className="text-xs font-medium text-gray-500">Back Side (Opsional)</span>
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
                      Please complete Anda identity verification to unlock all features. Click Edit to upload Anda documents.
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
                  <p className="text-xs text-gray-500">Add Anda bank account for withdrawals</p>
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
                        className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm ${formErrors.bankName && touchedFields.bankName
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
                        className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm ${formErrors.accountNumber && touchedFields.accountNumber
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
                        className={`w-full px-3 py-3 bg-gray-100 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors text-sm ${formErrors.accountHolderName && touchedFields.accountHolderName
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
          {activeTab === 'status' && statusInfo && (() => {
            const progress = calculateStatusProgress(statusInfo.totalDeposit, statusInfo.current)
            const statusTheme = {
              standard: {
                // Coklat / bronze-brown
                heroBg: 'from-stone-600 via-amber-900 to-stone-900',
                accent: 'from-amber-700 to-stone-600',
                glow: 'shadow-amber-900/40',
                badge: 'bg-amber-900/40 text-amber-100 border-amber-800/40',
                progressBar: 'from-amber-700 to-stone-600',
                ring: 'ring-amber-800/40',
                cardBorder: 'border-amber-200 bg-amber-50/60',
                activeDot: 'bg-amber-800',
                cardAccentText: 'text-amber-900',
                cardSubText: 'text-amber-700',
                unlockBg: 'bg-amber-50',
                unlockBorder: 'border-amber-100',
              },
              gold: {
                // Emas / golden
                heroBg: 'from-yellow-400 via-amber-400 to-yellow-600',
                accent: 'from-yellow-300 to-amber-400',
                glow: 'shadow-yellow-400/50',
                badge: 'bg-yellow-300/25 text-yellow-900 border-yellow-400/40',
                progressBar: 'from-yellow-300 to-amber-400',
                ring: 'ring-yellow-400/50',
                cardBorder: 'border-yellow-300 bg-yellow-50/70',
                activeDot: 'bg-yellow-500',
                cardAccentText: 'text-yellow-900',
                cardSubText: 'text-yellow-700',
                unlockBg: 'bg-yellow-50',
                unlockBorder: 'border-yellow-100',
              },
              vip: {
                // Silver / perak
                heroBg: 'from-slate-400 via-gray-500 to-slate-700',
                accent: 'from-slate-300 to-gray-400',
                glow: 'shadow-slate-400/50',
                badge: 'bg-white/20 text-white border-white/30',
                progressBar: 'from-slate-300 to-gray-400',
                ring: 'ring-slate-300/50',
                cardBorder: 'border-slate-300 bg-slate-50/70',
                activeDot: 'bg-slate-500',
                cardAccentText: 'text-slate-900',
                cardSubText: 'text-slate-600',
                unlockBg: 'bg-slate-50',
                unlockBorder: 'border-slate-100',
              },
            }
            const theme = statusTheme[statusInfo.current]
            const STATUS_IMAGES: Record<string, string> = {
              standard: '/std.png',
              gold: '/gold.png',
              vip: '/vip.png',
            }
            const tierBenefits = {
              standard: ['Akses trading penuh', 'Dukungan pelanggan standar', 'Penarikan reguler', 'Laporan performa bulanan'],
              gold: ['Semua benefit Standard', 'Bonus profit +5%', 'Prioritas penarikan', 'Manajer akun dedikasi', 'Laporan performa mingguan'],
              vip: ['Semua benefit Gold', 'Bonus profit +10%', 'Penarikan kilat 24 jam', 'Manajer akun VIP eksklusif', 'Sinyal trading premium', 'Akses fitur beta eksklusif'],
            }
            return (
              <motion.div
                className="space-y-4"
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {/* ── Hero Status Card ── */}
                <motion.div
                  className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.heroBg} p-5 sm:p-7 shadow-xl ${theme.glow}`}
                  variants={fadeInUp}
                >
                  {/* decorative circles */}
                  <div className="pointer-events-none absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/5" />
                  <div className="pointer-events-none absolute -right-2 bottom-4 w-24 h-24 rounded-full bg-white/5" />
                  <div className="pointer-events-none absolute left-1/2 -bottom-10 w-48 h-48 rounded-full bg-white/5" />

                  <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
                    {/* icon + name */}
                    <div className="flex items-center gap-4 flex-1">
                      <motion.div
                        className={`relative w-16 h-16 rounded-2xl bg-white/15 ring-2 ${theme.ring} flex items-center justify-center shadow-lg backdrop-blur-sm flex-shrink-0`}
                        initial={{ scale: 0, rotate: -15 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                      >
                        <img
                          src={STATUS_IMAGES[statusInfo.current]}
                          alt={statusInfo.current}
                          className="w-10 h-10 object-contain drop-shadow-lg"
                        />
                      </motion.div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">Status Keanggotaan</p>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none mb-1">
                          {STATUS_CONFIG[statusInfo.current].label}
                        </h2>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border backdrop-blur-sm ${theme.badge}`}>
                          {statusInfo.current === 'vip' ? '✦ MAX TIER' : `+${String(statusInfo.profitBonus).replace(/[^0-9.]/g, '')}% Profit Bonus`}
                        </span>
                      </div>
                    </div>

                    {/* stats row */}
                    <div className="flex items-center gap-4 sm:gap-6 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/10">
                      <div className="text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-0.5">Total Deposit</p>
                        <p className="text-base font-bold text-white leading-tight">{formatDepositRequirement(statusInfo.totalDeposit)}</p>
                      </div>
                      <div className="w-px h-8 bg-white/15 hidden sm:block" />
                      <div className="text-center">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-0.5">Bonus Profit</p>
                        <p className="text-base font-bold text-white leading-tight">+{String(statusInfo.profitBonus).replace(/[^0-9.]/g, '')}%</p>
                      </div>
                    </div>
                  </div>

                  {/* progress inside hero */}
                  {progress.next && (
                    <div className="relative mt-5 pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-white/70" />
                          <span className="text-xs font-semibold text-white/80">
                            Menuju {STATUS_CONFIG[progress.next].label}
                          </span>
                        </div>
                        <span className="text-xs font-black text-white">{progress.progress}%</span>
                      </div>
                      <div className="w-full bg-white/15 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${theme.accent}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.progress}%` }}
                          transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                        />
                      </div>
                      <p className="text-[11px] text-white/50 mt-1.5">
                        Butuh {formatDepositRequirement(progress.depositNeeded ?? 0)} lagi untuk naik tier
                      </p>
                    </div>
                  )}
                  {statusInfo.current === 'vip' && (
                    <div className="relative mt-5 pt-4 border-t border-white/10 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-yellow-300 flex-shrink-0" />
                      <p className="text-xs font-semibold text-white/80">Selamat! Anda telah mencapai tier tertinggi.</p>
                    </div>
                  )}
                </motion.div>

                {/* ── Tier Journey ── */}
                <motion.div
                  className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 shadow-sm"
                  variants={fadeInUp}
                >
                  <h3 className="text-sm font-bold text-gray-900 mb-5 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    Perjalanan Tier
                  </h3>

                  {/* milestone path */}
                  <div className="flex items-start gap-0 mb-6 relative">
                    {(['standard', 'gold', 'vip'] as const).map((tier, i) => {
                      const isReached = STATUS_CONFIG[tier].minDeposit <= statusInfo.totalDeposit
                      const isCurrent = tier === statusInfo.current
                      const dotTheme = statusTheme[tier]
                      return (
                        <React.Fragment key={tier}>
                          <div className="flex flex-col items-center flex-1 relative z-10">
                            <motion.div
                              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
                                isCurrent
                                  ? `${dotTheme.activeDot} border-transparent shadow-lg`
                                  : isReached
                                    ? 'bg-emerald-500 border-transparent'
                                    : 'bg-white border-gray-200'
                              }`}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 * i, type: 'spring' }}
                            >
                              <img
                                src={STATUS_IMAGES[tier]}
                                alt={tier}
                                className={`w-7 h-7 object-contain transition-all ${!isReached ? 'opacity-30 grayscale' : ''}`}
                              />
                            </motion.div>
                            <p className={`text-[11px] font-bold mt-2 ${isCurrent ? 'text-gray-900' : isReached ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {STATUS_CONFIG[tier].label}
                            </p>
                            {isCurrent && (
                              <motion.span
                                className="text-[9px] font-black uppercase tracking-wider text-white bg-sky-500 px-2 py-0.5 rounded-full mt-1"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                              >
                                Aktif
                              </motion.span>
                            )}
                            <p className={`text-[10px] mt-1 ${isReached ? 'text-gray-500' : 'text-gray-300'}`}>
                              {tier === 'standard' ? 'Gratis' : formatDepositRequirement(STATUS_CONFIG[tier].minDeposit)}
                            </p>
                          </div>
                          {i < 2 && (
                            <div className="flex-1 flex items-center justify-center mt-5 relative">
                              <div className="absolute w-full h-0.5 bg-gray-100" />
                              <motion.div
                                className="absolute left-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-300"
                                style={{ originX: 0 }}
                                initial={{ width: 0 }}
                                animate={{
                                  width: STATUS_CONFIG[(['standard', 'gold', 'vip'] as const)[i + 1]].minDeposit <= statusInfo.totalDeposit
                                    ? '100%'
                                    : progress.next === (['standard', 'gold', 'vip'] as const)[i + 1]
                                      ? `${progress.progress}%`
                                      : '0%'
                                }}
                                transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: 'easeOut' }}
                              />
                            </div>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </div>

                  {/* ── Tier Comparison Cards ── */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['standard', 'gold', 'vip'] as const).map((status, i) => {
                      const config = STATUS_CONFIG[status]
                      const isCurrent = status === statusInfo.current
                      const isUnlocked = STATUS_CONFIG[status].minDeposit <= statusInfo.totalDeposit
                      const cardTheme = statusTheme[status]
                      return (
                        <motion.div
                          key={status}
                          className={`relative rounded-xl border p-4 transition-all ${
                            isCurrent
                              ? `${cardTheme.cardBorder} ring-1 ${cardTheme.ring} shadow-md`
                              : isUnlocked
                                ? `${cardTheme.unlockBg} ${cardTheme.unlockBorder} border`
                                : 'border-gray-100 bg-gray-50/50'
                          }`}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 * i }}
                          whileHover={{ y: -2, transition: { duration: 0.15 } }}
                        >
                          {isCurrent && (
                            <div className="absolute top-2.5 right-2.5">
                              <span className={`text-[9px] font-black uppercase tracking-widest text-white bg-gradient-to-r ${cardTheme.accent} px-2 py-0.5 rounded-full shadow`}>
                                Aktif
                              </span>
                            </div>
                          )}
                          {!isUnlocked && (
                            <div className="absolute top-2.5 right-2.5">
                              <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Terkunci</span>
                            </div>
                          )}

                          {/* tier header */}
                          <div className={`w-11 h-11 rounded-xl mb-3 flex items-center justify-center bg-gradient-to-br ${cardTheme.accent}`}>
                            <img
                              src={STATUS_IMAGES[status]}
                              alt={status}
                              className={`w-7 h-7 object-contain ${!isUnlocked ? 'opacity-50 grayscale' : ''}`}
                            />
                          </div>
                          <p className={`text-sm font-black mb-0.5 ${isCurrent ? cardTheme.cardAccentText : isUnlocked ? cardTheme.cardAccentText : 'text-gray-400'}`}>
                            {config.label}
                          </p>
                          <p className={`text-xs font-semibold mb-3 ${isCurrent ? cardTheme.cardSubText : isUnlocked ? cardTheme.cardSubText : 'text-gray-300'}`}>
                            {config.profitBonus > 0 ? `+${config.profitBonus}% profit bonus` : 'Tanpa bonus'}
                          </p>

                          {/* divider */}
                          <div className="w-full h-px bg-gray-100 mb-3" />

                          {/* benefits */}
                          <ul className="space-y-1.5">
                            {tierBenefits[status].map((benefit, bi) => (
                              <motion.li
                                key={bi}
                                className="flex items-start gap-1.5"
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 + bi * 0.05 }}
                              >
                                <CheckCircle2 className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${isUnlocked ? cardTheme.cardSubText : 'text-gray-300'}`} />
                                <span className={`text-[11px] leading-snug ${isUnlocked ? 'text-gray-600' : 'text-gray-300'}`}>
                                  {benefit}
                                </span>
                              </motion.li>
                            ))}
                          </ul>

                          {/* min deposit badge */}
                          <div className={`mt-3 pt-3 border-t border-gray-100 flex items-center justify-between`}>
                            <span className="text-[10px] text-gray-400">Min. Deposit</span>
                            <span className={`text-[11px] font-bold ${isCurrent ? cardTheme.cardAccentText : isUnlocked ? cardTheme.cardSubText : 'text-gray-400'}`}>
                              {status === 'standard' ? 'Gratis' : formatDepositRequirement(config.minDeposit)}
                            </span>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </motion.div>

                {/* ── Info Banner ── */}
                <motion.div
                  className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 to-blue-50 p-4 flex items-start gap-3"
                  variants={fadeInUp}
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Info className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-sky-900 mb-0.5">Bagaimana cara naik tier?</p>
                    <p className="text-xs text-sky-700 leading-relaxed">
                      Tier Anda naik otomatis berdasarkan akumulasi total deposit. Tingkatkan deposit untuk mendapatkan bonus profit lebih tinggi dan akses fitur eksklusif.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )
          })()}
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="min-h-screen" style={{
      backgroundImage: `
    linear-gradient(rgba(0, 0, 0, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.06) 1px, transparent 1px)
  `,
      backgroundSize: '40px 40px',
      backgroundPosition: 'center center',
      backgroundColor: '#f0f2f5'
    }}>
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
              Dasbor
            </motion.span>
            <span>/</span>
            <motion.span
              className="text-gray-900 font-medium"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              Profil
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
              <h1 className="text-lg font-bold text-gray-900">Profil Saya</h1>
              <motion.p
                className="text-xs text-gray-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Kelengkapan profil: <span className="font-semibold">{profileInfo?.completion ?? 0}%</span>
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
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs flex-shrink-0 ${activeTab === tab.id
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
              {/* Mini user card */}
              <div className="flex items-center gap-3 px-3 py-3 mb-1 border-b border-gray-100">
                <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                  {profileInfo?.avatar?.url ? (
                    <img
                      src={profileInfo.avatar.url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement
                        img.style.display = 'none'
                        const fallback = img.nextElementSibling as HTMLElement
                        if (fallback) fallback.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div
                    className="flat-avatar w-full h-full rounded-xl flex items-center justify-center text-sm font-bold select-none"
                    style={{ display: profileInfo?.avatar?.url ? 'none' : 'flex' }}
                  >
                    {(user.email)[0].toUpperCase()}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 truncate">
                    {profileInfo?.personal?.fullName || user.email.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                </div>
              </div>
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
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${activeTab === tab.id
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
                    <span className="font-medium text-sm">Keluar</span>
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
        title="Konfirmasi Keluar"
        message="Apakah Anda yakin ingin keluar? Anda akan diarahkan ke beranda."
      />

      {/* Invisible reCAPTCHA container — diperlukan Firebase Phone Auth */}
      <div id="recaptcha-container" ref={recaptchaContainerRef} />
    </div>
  )
}