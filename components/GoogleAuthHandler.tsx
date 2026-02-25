// components/GoogleAuthHandler.tsx
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

    if (user) {
      console.log('ℹ️ User already authenticated, skipping redirect check')
      return
    }


    if (isProcessing.current) {
      console.log('ℹ️ Already processing redirect')
      return
    }


    if (!isRedirectPending()) {
      return
    }

    console.log('🔍 Google redirect pending detected, processing...')

    const processRedirectResult = async () => {

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


        const loadingToast = toast.loading('Menyelesaikan login...')


        const idToken = await getIdToken(result.user)


        const urlParams = new URLSearchParams(window.location.search)
        const referralCode = urlParams.get('ref') || undefined


        const response = await api.googleSignIn(idToken, referralCode)

        const userData = response.user || response.data?.user
        const token = response.token || response.data?.token

        if (!userData || !token) {
          throw new Error('Invalid response from server')
        }


        setAuth(userData, token)
        api.setToken(token)


        const message = response.data?.isNewUser
          ? 'Akun berhasil dibuat! Selamat datang!'
          : 'Selamat datang kembali!'

        toast.success(message, { id: loadingToast })


        const cleanUrl = window.location.pathname
        window.history.replaceState({}, '', cleanUrl)


        await new Promise(resolve => setTimeout(resolve, 500))


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


        const cleanUrl = window.location.pathname
        window.history.replaceState({}, '', cleanUrl)

      } finally {
        isProcessing.current = false
      }
    }


    processRedirectResult()
  }, [user, setAuth, router])


  return null
}