// components/GoogleAuthHandler.tsx
// ✅ Component to handle Google redirect results globally
'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth'
import { api } from '@/lib/api'
import { 
  handleGoogleRedirectResult, 
  getIdToken,
  isRedirectPending 
} from '@/lib/firebase-auth'
import { toast } from 'sonner'

export default function GoogleAuthHandler() {
  const router = useRouter()
  const setAuth = useAuthStore((state) => state.setAuth)
  const user = useAuthStore((state) => state.user)
  const isProcessing = useRef(false)

  useEffect(() => {
    // Don't process if already authenticated
    if (user) {
      console.log('ℹ️ User already authenticated, skipping redirect check')
      return
    }

    // Don't process if already processing
    if (isProcessing.current) {
      console.log('ℹ️ Already processing redirect')
      return
    }

    // Check if redirect is pending
    if (!isRedirectPending()) {
      return
    }

    console.log('🔍 Google redirect pending detected, processing...')

    const processRedirectResult = async () => {
      // Prevent multiple simultaneous processing
      if (isProcessing.current) return
      isProcessing.current = true

      try {
        const result = await handleGoogleRedirectResult()
        
        if (!result || !result.user) {
          console.log('ℹ️ No redirect result found')
          isProcessing.current = false
          return
        }

        console.log('✅ Google redirect result received, authenticating...')
        
        // Show loading toast
        const loadingToast = toast.loading('Menyelesaikan login...')

        // Get ID token
        const idToken = await getIdToken(result.user)
        
        // Get referral code from URL if exists
        const urlParams = new URLSearchParams(window.location.search)
        const referralCode = urlParams.get('ref') || undefined

        // Authenticate with backend
        const response = await api.googleSignIn(idToken, referralCode)
        
        const userData = response.user || response.data?.user
        const token = response.token || response.data?.token

        if (!userData || !token) {
          throw new Error('Invalid response from server')
        }

        // Set authentication
        setAuth(userData, token)
        api.setToken(token)

        // Success message
        const message = response.data?.isNewUser 
          ? 'Akun berhasil dibuat! Selamat datang!' 
          : 'Selamat datang kembali!'
        
        toast.success(message, { id: loadingToast })

        // Clean up URL
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, '', cleanUrl)

        // Small delay before redirect
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Redirect to trading page
        router.push('/trading')
        
      } catch (error: any) {
        console.error('❌ Error processing Google redirect:', error)
        
        let errorMessage = 'Login gagal'
        
        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Login dibatalkan'
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.message) {
          errorMessage = error.message
        }
        
        toast.error(errorMessage)
        
        // Clean up URL on error
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, '', cleanUrl)
        
      } finally {
        isProcessing.current = false
      }
    }

    // Process redirect result
    processRedirectResult()
  }, [user, setAuth, router])

  // This component doesn't render anything
  return null
}