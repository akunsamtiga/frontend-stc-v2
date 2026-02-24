import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  hydrated: boolean
  setHydrated: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hydrated: false,
      
      setAuth: (user, token) => {
        console.log('🔐 Auth Store: Setting authentication', {
          email: user.email,
          role: user.role,
          tokenLength: token.length
        })
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
        }
        
        set({ 
          user, 
          token, 
          isAuthenticated: true 
        })
        
        console.log('✅ Auth Store: Authentication set successfully')
      },
      
      logout: () => {
        console.log('🚪 Auth Store: Logging out')
        
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('auth-storage')
          localStorage.removeItem('trading-storage')
        }
        
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false 
        })
        
        console.log('✅ Auth Store: Logged out successfully')
      },
      
      setHydrated: () => {
        set({ hydrated: true })
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') {
          return localStorage
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        }
      }),

      // ✅ FIX: onRehydrateStorage harus return fungsi yang menerima (state, error)
      // Signature yang salah = setHydrated tidak pernah dipanggil = isCheckingAuth stuck
      // 
      // SALAH (versi lama):
      //   onRehydrateStorage: () => (state) => {
      //     return () => { state?.setHydrated() }  ← return fungsi di dalam fungsi = tidak jalan
      //   }
      //
      // BENAR:
      //   onRehydrateStorage: () => (state, error) => {
      //     state?.setHydrated()  ← panggil langsung di callback
      //   }
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('❌ Auth Store: Rehydration error:', error)
          // ✅ Tetap set hydrated meskipun error, agar UI tidak stuck loading
          state?.setHydrated()
          return
        }

        console.log('✅ Auth Store: Rehydration complete', {
          hasUser: !!state?.user,
          hasToken: !!state?.token,
          isAuthenticated: state?.isAuthenticated
        })

        // ✅ Panggil setHydrated langsung — tidak di-wrap dalam return function
        state?.setHydrated()
      },
    }
  )
)

// Hook to wait for hydration
// Digunakan di page.tsx untuk menggantikan setTimeout(100ms) yang tidak akurat
export const useAuthHydration = () => {
  const hydrated = useAuthStore((state) => state.hydrated)
  return hydrated
}