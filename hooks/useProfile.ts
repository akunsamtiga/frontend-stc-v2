// hooks/useProfile.ts - ✅ COMPLETE FIXED VERSION with Photo Upload

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import type { 
  UserProfile, 
  UserProfileInfo, 
  UpdateProfileRequest,
  ChangePasswordRequest 
} from '@/types'

interface UseProfileReturn {
  // Data
  profile: UserProfile | null
  profileInfo: UserProfileInfo | null
  
  // Loading states
  loading: boolean
  updating: boolean
  
  // Actions
  loadProfile: () => Promise<void>
  updateProfile: (data: UpdateProfileRequest) => Promise<boolean>
  changePassword: (data: ChangePasswordRequest) => Promise<boolean>
  uploadAvatar: (file: File) => Promise<boolean>
  uploadKTP: (photoFront: File, photoBack?: File) => Promise<boolean>
  uploadSelfie: (file: File) => Promise<boolean>

  // Phone verification (Firebase-based)
  verifyPhoneWithFirebaseToken: (idToken: string) => Promise<boolean>
  
  // Helper
  getCompletionPercentage: () => number
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileInfo, setProfileInfo] = useState<UserProfileInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  /**
   * Load profile data from API
   */
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      
      const response = await api.getProfile()
      
      // ✅ FIX: Properly extract UserProfile from ApiResponse
      let profileData: UserProfile
      
      // Check if response has a 'data' property (ApiResponse wrapper)
      if (response && 'data' in response && response.data) {
        profileData = response.data as UserProfile
      } else {
        // Response is already UserProfile
        profileData = response as UserProfile
      }
      
      if (!profileData) {
        throw new Error('No profile data received')
      }

      setProfile(profileData)
      
      if (profileData.profileInfo) {
        setProfileInfo(profileData.profileInfo)
      }
      
    } catch (error: any) {
      console.error('Failed to load profile:', error)
      toast.error(error?.message || 'Failed to load profile')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Update profile data
   */
  const updateProfile = useCallback(async (data: UpdateProfileRequest): Promise<boolean> => {
    try {
      setUpdating(true)
      
      await api.updateProfile(data)
      
      // Reload profile to get updated data
      await loadProfile()
      
      toast.success('Profile updated successfully!')
      return true
      
    } catch (error: any) {
      console.error('Failed to update profile:', error)
      toast.error(error?.response?.data?.error || 'Failed to update profile')
      return false
    } finally {
      setUpdating(false)
    }
  }, [loadProfile])

  /**
   * Change password
   */
  const changePassword = useCallback(async (data: ChangePasswordRequest): Promise<boolean> => {
    try {
      // Validate passwords match
      if (data.newPassword !== data.confirmPassword) {
        toast.error('Passwords do not match')
        return false
      }

      // Validate password length
      if (data.newPassword.length < 8) {
        toast.error('Password must be at least 8 characters')
        return false
      }

      setUpdating(true)
      
      await api.changePassword(data)
      
      toast.success('Password changed successfully!')
      return true
      
    } catch (error: any) {
      console.error('Failed to change password:', error)
      toast.error(error?.response?.data?.error || 'Failed to change password')
      return false
    } finally {
      setUpdating(false)
    }
  }, [])

  /**
   * Upload avatar image
   */
  const uploadAvatar = useCallback(async (file: File): Promise<boolean> => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return false
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB')
        return false
      }

      setUpdating(true)
      
      // Show uploading toast
      const uploadToast = toast.loading('Uploading avatar...')

      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        
        reader.onloadend = () => {
          const result = reader.result as string
          resolve(result)
        }
        
        reader.onerror = () => {
          reject(new Error('Failed to read image file'))
        }
        
        reader.readAsDataURL(file)
      })

      // Upload to API
      await api.uploadAvatar({ 
        url: base64,
        fileSize: file.size,
        mimeType: file.type
      })
      
      // Reload profile
      await loadProfile()
      
      toast.success('Avatar uploaded successfully!', { id: uploadToast })
      return true
      
    } catch (error: any) {
      console.error('Failed to upload avatar:', error)
      toast.error(error?.message || 'Failed to upload avatar')
      return false
    } finally {
      setUpdating(false)
    }
  }, [loadProfile])

  /**
   * ✅ NEW: Upload KTP photos (front & back)
   */
  const uploadKTP = useCallback(async (photoFront: File, photoBack?: File): Promise<boolean> => {
    try {
      // Validate front photo
      if (!photoFront.type.startsWith('image/')) {
        toast.error('Front photo must be an image file')
        return false
      }
      if (photoFront.size > 2 * 1024 * 1024) {
        toast.error('Front photo size must be less than 2MB')
        return false
      }

      // Validate back photo if provided
      if (photoBack) {
        if (!photoBack.type.startsWith('image/')) {
          toast.error('Back photo must be an image file')
          return false
        }
        if (photoBack.size > 2 * 1024 * 1024) {
          toast.error('Back photo size must be less than 2MB')
          return false
        }
      }

      setUpdating(true)
      const uploadToast = toast.loading('Uploading KTP photos...')

      // Convert front photo to base64
      const photoFrontBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
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

      // Convert back photo to base64 if provided
      if (photoBack) {
        const photoBackBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error('Failed to read back photo'))
          reader.readAsDataURL(photoBack)
        })

        uploadData.photoBack = {
          url: photoBackBase64,
          fileSize: photoBack.size,
          mimeType: photoBack.type
        }
      }

      // Upload to API
      await api.uploadKTP(uploadData)
      
      // Reload profile
      await loadProfile()
      
      toast.success('KTP photos uploaded successfully! Waiting for admin verification.', { id: uploadToast })
      return true
      
    } catch (error: any) {
      console.error('Failed to upload KTP:', error)
      toast.error(error?.response?.data?.error || 'Failed to upload KTP photos')
      return false
    } finally {
      setUpdating(false)
    }
  }, [loadProfile])

  /**
   * ✅ NEW: Upload selfie photo
   */
  const uploadSelfie = useCallback(async (file: File): Promise<boolean> => {
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file')
        return false
      }

      // Validate file size (max 1MB for selfie)
      if (file.size > 1 * 1024 * 1024) {
        toast.error('Selfie size must be less than 1MB')
        return false
      }

      setUpdating(true)
      const uploadToast = toast.loading('Uploading selfie...')

      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error('Failed to read selfie'))
        reader.readAsDataURL(file)
      })

      // Upload to API
      await api.uploadSelfie({
        url: base64,
        fileSize: file.size,
        mimeType: file.type
      })
      
      // Reload profile
      await loadProfile()
      
      toast.success('Selfie uploaded successfully! Waiting for admin verification.', { id: uploadToast })
      return true
      
    } catch (error: any) {
      console.error('Failed to upload selfie:', error)
      toast.error(error?.response?.data?.error || 'Failed to upload selfie')
      return false
    } finally {
      setUpdating(false)
    }
  }, [loadProfile])

  /**
   * Verify phone number using Firebase ID Token
   * Flow: Firebase signInWithPhoneNumber → confirm OTP → getIdToken() → call this
   */
  const verifyPhoneWithFirebaseToken = useCallback(async (idToken: string): Promise<boolean> => {
    try {
      if (!idToken) {
        toast.error('Firebase token tidak ditemukan')
        return false
      }

      setUpdating(true)
      await api.verifyPhone({ idToken })

      // Reload profile to reflect verified status
      await loadProfile()

      toast.success('Nomor telepon berhasil diverifikasi!')
      return true

    } catch (error: any) {
      console.error('Failed to verify phone:', error)
      toast.error(error?.response?.data?.error || 'Verifikasi gagal, coba lagi')
      return false
    } finally {
      setUpdating(false)
    }
  }, [loadProfile])

  /**
   * Get profile completion percentage
   */
  const getCompletionPercentage = useCallback((): number => {
    return profileInfo?.completion || 0
  }, [profileInfo])

  // Load profile on mount
  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  return {
    profile,
    profileInfo,
    loading,
    updating,
    loadProfile,
    updateProfile,
    changePassword,
    uploadAvatar,
    uploadKTP,      
    uploadSelfie,
    verifyPhoneWithFirebaseToken,
    getCompletionPercentage
  }
}

/**
 * Hook for form validation
 */
export function useProfileFormValidation() {
  const validateFullName = (name: string): string | null => {
    if (!name || name.trim().length === 0) {
      return 'Full name is required'
    }
    if (name.trim().length < 3) {
      return 'Full name must be at least 3 characters'
    }
    if (name.trim().length > 100) {
      return 'Full name must be less than 100 characters'
    }
    return null
  }

  const validatePhoneNumber = (phone: string): string | null => {
    if (!phone || phone.trim().length === 0) {
      return null // Optional field
    }
    
    // Indonesian phone number format
    const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/
    if (!phoneRegex.test(phone)) {
      return 'Invalid phone number format (e.g., +6281234567890)'
    }
    return null
  }

  const validateDateOfBirth = (date: string): string | null => {
    if (!date) {
      return null // Optional field
    }
    
    const birthDate = new Date(date)
    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    
    if (age < 17) {
      return 'You must be at least 17 years old'
    }
    if (age > 100) {
      return 'Invalid date of birth'
    }
    return null
  }

  const validateIdentityNumber = (number: string, type: 'ktp' | 'passport' | 'sim'): string | null => {
    if (!number || number.trim().length === 0) {
      return null // Optional field
    }

    switch (type) {
      case 'ktp':
        if (!/^\d{16}$/.test(number)) {
          return 'KTP must be 16 digits'
        }
        break
      case 'passport':
        if (!/^[A-Z0-9]{6,9}$/.test(number.toUpperCase())) {
          return 'Invalid passport number format'
        }
        break
      case 'sim':
        if (!/^\d{12}$/.test(number)) {
          return 'SIM must be 12 digits'
        }
        break
    }
    
    return null
  }

  const validateBankAccount = (accountNumber: string): string | null => {
    if (!accountNumber || accountNumber.trim().length === 0) {
      return null // Optional field
    }
    
    if (!/^\d{10,16}$/.test(accountNumber)) {
      return 'Bank account number must be 10-16 digits'
    }
    
    return null
  }

  return {
    validateFullName,
    validatePhoneNumber,
    validateDateOfBirth,
    validateIdentityNumber,
    validateBankAccount
  }
}