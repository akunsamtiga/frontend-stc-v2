// lib/firebase-auth.ts - FIXED VERSION with better mobile support
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

    console.log('✅ Firebase Auth initialized successfully')
  } catch (error) {
    console.error('❌ Firebase Auth initialization error:', error)
  }
}

/**
 * Detect if user is on mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * ✅ IMPROVED: Store redirect state before initiating redirect
 */
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

/**
 * ✅ IMPROVED: Clear redirect state
 */
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

/**
 * ✅ IMPROVED: Check if redirect is pending
 */
export function isRedirectPending(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const pending = localStorage.getItem('google_auth_redirect_pending')
    const redirectTime = localStorage.getItem('google_auth_redirect_time')
    
    if (!pending || !redirectTime) return false
    
    // Check if redirect is recent (within 5 minutes)
    const timeDiff = Date.now() - parseInt(redirectTime)
    const isRecent = timeDiff < 5 * 60 * 1000
    
    if (!isRecent) {
      clearRedirectState()
      return false
    }
    
    return true
  } catch (error) {
    return false
  }
}

/**
 * Sign in with Google using Popup
 */
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

/**
 * ✅ IMPROVED: Sign in with Google using Redirect with state tracking
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth not initialized')
  }

  try {
    console.log('🔄 Initiating Google Sign-In redirect...')
    
    // Set redirect state BEFORE initiating redirect
    setRedirectState()
    
    // Small delay to ensure localStorage is written
    await new Promise(resolve => setTimeout(resolve, 100))
    
    await signInWithRedirect(auth, googleProvider)
    console.log('✅ Google Sign-In redirect initiated')
  } catch (error: any) {
    console.error('❌ Google Sign-In error (redirect):', error)
    clearRedirectState()
    throw error
  }
}

/**
 * ✅ IMPROVED: Get redirect result with better error handling
 */
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
    
    // Check if we were expecting a redirect result
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

/**
 * Get ID Token from Firebase User
 */
export async function getIdToken(user: any): Promise<string> {
  try {
    const token = await user.getIdToken()
    return token
  } catch (error: any) {
    console.error('❌ Error getting ID token:', error)
    throw error
  }
}

/**
 * ✅ IMPROVED: Main Google Sign-In function with better mobile support
 * Try popup first, fallback to redirect only if popup fails
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  const isMobile = isMobileDevice()
  
  console.log(`📱 Device type: ${isMobile ? 'Mobile' : 'Desktop'}`)
  
  // Try popup first (works better for most cases)
  try {
    console.log('🔄 Attempting popup sign-in...')
    const result = await signInWithGooglePopup()
    return result
  } catch (error: any) {
    console.error('❌ Popup failed:', error.code)
    
    // If popup was blocked or closed, try redirect (especially for mobile)
    if (
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request' ||
      isMobile
    ) {
      console.log('🔄 Falling back to redirect method...')
      await signInWithGoogleRedirect()
      // Redirect will happen, return pending promise
      return new Promise(() => {})
    }
    
    throw error
  }
}

export { auth, googleProvider }