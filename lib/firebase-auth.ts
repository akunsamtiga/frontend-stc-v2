// lib/firebase-auth.ts 
import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  UserCredential
} from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

let app: FirebaseApp
let auth: Auth
let googleProvider: GoogleAuthProvider

if (typeof window !== 'undefined') {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }

    auth = getAuth(app)

    googleProvider = new GoogleAuthProvider()
    googleProvider.addScope('email')
    googleProvider.addScope('profile')
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    })



    try {
      const redirectTime = localStorage.getItem('google_auth_redirect_time')
      if (redirectTime) {
        const timeDiff = Date.now() - parseInt(redirectTime)

        if (timeDiff > 2 * 60 * 1000) {
          localStorage.removeItem('google_auth_redirect_pending')
          localStorage.removeItem('google_auth_redirect_time')
          sessionStorage.removeItem('google_auth_initiated')
          console.log('🧹 Cleared stale redirect state (expired)')
        }
      }
    } catch (_) {

    }

    console.log('✅ Firebase Auth initialized successfully')
  } catch (error) {
    console.error('❌ Firebase Auth initialization error:', error)
  }
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

function setRedirectState() {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem('google_auth_redirect_pending', 'true')
    localStorage.setItem('google_auth_redirect_time', Date.now().toString())
    sessionStorage.setItem('google_auth_initiated', 'true')
  } catch (error) {
    console.error('Failed to set redirect state:', error)
  }
}

function clearRedirectState() {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('google_auth_redirect_pending')
    localStorage.removeItem('google_auth_redirect_time')
    sessionStorage.removeItem('google_auth_initiated')
  } catch (error) {
    console.error('Failed to clear redirect state:', error)
  }
}

export function isRedirectPending(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const pending = localStorage.getItem('google_auth_redirect_pending')
    const redirectTime = localStorage.getItem('google_auth_redirect_time')

    if (!pending || !redirectTime) return false


    const timeDiff = Date.now() - parseInt(redirectTime)
    const isRecent = timeDiff < 2 * 60 * 1000

    if (!isRecent) {
      clearRedirectState()
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

export async function signInWithGooglePopup(): Promise<UserCredential> {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth not initialized')
  }

  try {
    const result = await signInWithPopup(auth, googleProvider)
    console.log('✅ Google Sign-In successful (popup)')
    clearRedirectState()
    return result
  } catch (error: any) {
    console.error('❌ Google Sign-In error (popup):', error)
    clearRedirectState()
    throw error
  }
}

export async function signInWithGoogleRedirect(): Promise<void> {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth not initialized')
  }

  try {
    console.log('🔄 Initiating Google Sign-In redirect...')


    setRedirectState()


    await new Promise(resolve => setTimeout(resolve, 100))

    await signInWithRedirect(auth, googleProvider)
    console.log('✅ Google Sign-In redirect initiated')
  } catch (error: any) {
    console.error('❌ Google Sign-In error (redirect):', error)
    clearRedirectState()
    throw error
  }
}

export async function handleGoogleRedirectResult(): Promise<UserCredential | null> {
  if (!auth) {
    throw new Error('Firebase Auth not initialized')
  }

  try {
    console.log('🔍 Checking for Google redirect result...')

    const result = await getRedirectResult(auth)

    if (result) {
      console.log('✅ Google Sign-In successful (redirect result)')
      clearRedirectState()
      return result
    }


    if (isRedirectPending()) {
      console.warn('⚠️ Redirect was pending but no result found')
      clearRedirectState()
    }

    return null
  } catch (error: any) {
    console.error('❌ Google redirect result error:', error)
    clearRedirectState()
    throw error
  }
}

export async function getIdToken(user: any): Promise<string> {
  try {
    const token = await user.getIdToken()
    return token
  } catch (error: any) {
    console.error('❌ Error getting ID token:', error)
    throw error
  }
}

export async function signInWithGoogle(): Promise<UserCredential> {
  const isMobile = isMobileDevice()

  console.log(`📱 Device type: ${isMobile ? 'Mobile' : 'Desktop'}`)


  try {
    console.log('🔄 Attempting popup sign-in...')
    const result = await signInWithGooglePopup()
    return result
  } catch (error: any) {
    console.error('❌ Popup failed:', error.code)


    if (
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request' ||
      isMobile
    ) {
      console.log('🔄 Falling back to redirect method...')
      await signInWithGoogleRedirect()

      return new Promise(() => {})
    }

    throw error
  }
}

export { auth, googleProvider }