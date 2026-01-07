// lib/firebase-auth.ts - Firebase Authentication Configuration
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

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
}

// Initialize Firebase
let app: FirebaseApp
let auth: Auth
let googleProvider: GoogleAuthProvider

if (typeof window !== 'undefined') {
  try {
    // Initialize Firebase App
    if (!getApps().length) {
      app = initializeApp(firebaseConfig)
    } else {
      app = getApps()[0]
    }

    // Initialize Auth
    auth = getAuth(app)
    
    // Configure Google Provider
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
 * Sign in with Google using Popup
 * Best for desktop and most reliable
 */
export async function signInWithGooglePopup(): Promise<UserCredential> {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth not initialized')
  }

  try {
    const result = await signInWithPopup(auth, googleProvider)
    console.log('✅ Google Sign-In successful (popup)')
    return result
  } catch (error: any) {
    console.error('❌ Google Sign-In error (popup):', error)
    throw error
  }
}

/**
 * Sign in with Google using Redirect
 * Better for mobile devices
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  if (!auth || !googleProvider) {
    throw new Error('Firebase Auth not initialized')
  }

  try {
    await signInWithRedirect(auth, googleProvider)
    console.log('✅ Google Sign-In redirect initiated')
  } catch (error: any) {
    console.error('❌ Google Sign-In error (redirect):', error)
    throw error
  }
}

/**
 * Get redirect result after returning from Google Sign-In
 * Call this on page load
 */
export async function handleGoogleRedirectResult(): Promise<UserCredential | null> {
  if (!auth) {
    throw new Error('Firebase Auth not initialized')
  }

  try {
    const result = await getRedirectResult(auth)
    if (result) {
      console.log('✅ Google Sign-In successful (redirect result)')
      return result
    }
    return null
  } catch (error: any) {
    console.error('❌ Google redirect result error:', error)
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
 * Detect if user is on mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
}

/**
 * Main Google Sign-In function with automatic method selection
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  // Use redirect for mobile, popup for desktop
  if (isMobileDevice()) {
    await signInWithGoogleRedirect()
    // Redirect will happen, so we return a promise that never resolves
    return new Promise(() => {})
  } else {
    return signInWithGooglePopup()
  }
}

export { auth, googleProvider }