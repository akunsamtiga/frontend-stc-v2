// components/ServiceWorkerRegistrar.tsx - ✅ Register Service Worker
'use client'

import { useEffect } from 'react'

/**
 * ✅ ServiceWorkerRegistrar - Register service worker for caching
 * This enables offline support and faster loading from cache
 */
export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return
    
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      console.log('🔧 Service Worker: Supported')
      
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker: Registered successfully', registration.scope)
          
          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60000) // Check every minute
        })
        .catch((error) => {
          console.error('❌ Service Worker: Registration failed:', error)
        })
      
      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker: Controller changed (new version activated)')
      })
    } else {
      console.warn('⚠️ Service Worker: Not supported in this browser')
    }
    
    // Cleanup function
    return () => {
      console.log('🧹 Service Worker: Component unmounted')
    }
  }, [])

  // This component renders nothing
  return null
}

/**
 * ✅ Utility function to clear service worker cache
 * Call this from Settings or Admin panel
 */
export async function clearServiceWorkerCache(): Promise<boolean> {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      const messageChannel = new MessageChannel()
      
      // Send clear cache message to service worker
      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      )
      
      // Wait for response
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log('✅ Service Worker: Cache cleared')
            resolve(true)
          } else {
            console.error('❌ Service Worker: Cache clear failed')
            resolve(false)
          }
        }
      })
    } catch (error) {
      console.error('❌ Service Worker: Error clearing cache:', error)
      return false
    }
  }
  
  return false
}