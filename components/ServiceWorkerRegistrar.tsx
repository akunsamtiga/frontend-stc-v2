// components/ServiceWorkerRegistrar.tsx 
'use client'

import { useEffect, useState } from 'react'

export default function ServiceWorkerRegistrar() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {

    if (typeof window === 'undefined') return


    if (!('serviceWorker' in navigator)) {
      console.warn('⚠️ Service Worker: Not supported in this browser')
      return
    }

    console.log('🔧 Service Worker: Supported')


    registerServiceWorker()


    return () => {
      console.log('🧹 Service Worker: Component unmounted')
    }
  }, [])

  const registerServiceWorker = async () => {
    try {
      console.log('📝 Service Worker: Registering...')

      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })

      console.log('✅ Service Worker: Registered successfully', reg.scope)
      setRegistration(reg)


      reg.update().catch(err => {
        console.log('Initial update check failed (non-critical):', err)
      })


      const updateInterval = setInterval(() => {
        console.log('🔄 Service Worker: Checking for updates...')
        reg.update().catch(() => {
          console.log('Update check failed (non-critical)')
        })
      }, 30000)


      reg.addEventListener('updatefound', () => {
        console.log('🆕 Service Worker: Update found!')
        const newWorker = reg.installing

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✅ Service Worker: New version installed')
              setUpdateAvailable(true)


              setTimeout(() => {
                console.log('🔄 Service Worker: Auto-activating new version...')
                newWorker.postMessage({ type: 'SKIP_WAITING' })
                window.location.reload()
              }, 3000)
            }
          })
        }
      })


      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker: Controller changed (new version activated)')

      })


      return () => {
        clearInterval(updateInterval)
      }

    } catch (error) {
      console.error('❌ Service Worker: Registration failed:', error)
    }
  }


  return null
}

export async function clearAllCaches(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  try {
    console.log('🗑️ Clearing all caches...')


    if ('caches' in window) {
      const cacheNames = await caches.keys()

      await Promise.all(
        cacheNames.map(name => caches.delete(name))
      )

      console.log(`✅ Deleted ${cacheNames.length} cache(s)`)
    }


    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel()

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      )

      await new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          console.log('Service Worker cache clear:', event.data)
          resolve(event.data.success)
        }


        setTimeout(() => resolve(false), 5000)
      })
    }

    console.log('✅ All caches cleared successfully')
    return true

  } catch (error) {
    console.error('❌ Cache clear failed:', error)
    return false
  }
}

export async function prefetchUrls(urls: string[]): Promise<void> {
  if (typeof window === 'undefined') return

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'PREFETCH',
      urls,
    })

    console.log(`🔄 Prefetching ${urls.length} URLs via Service Worker`)
  }
}

export async function getCacheStats(): Promise<{
  cacheCount: number
  totalSize: number
  caches: Array<{ name: string; size: number; keys: number }>
}> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return { cacheCount: 0, totalSize: 0, caches: [] }
  }

  try {
    const cacheNames = await caches.keys()
    const cacheStats = await Promise.all(
      cacheNames.map(async (name) => {
        const cache = await caches.open(name)
        const keys = await cache.keys()

        let size = 0
        for (const key of keys) {
          const response = await cache.match(key)
          if (response) {
            const blob = await response.blob()
            size += blob.size
          }
        }

        return { name, size, keys: keys.length }
      })
    )

    const totalSize = cacheStats.reduce((sum, cache) => sum + cache.size, 0)

    return {
      cacheCount: cacheNames.length,
      totalSize,
      caches: cacheStats,
    }

  } catch (error) {
    console.error('Failed to get cache stats:', error)
    return { cacheCount: 0, totalSize: 0, caches: [] }
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()

    for (const registration of registrations) {
      await registration.unregister()
    }

    console.log('✅ Service Worker unregistered')
    return true

  } catch (error) {
    console.error('❌ Unregister failed:', error)
    return false
  }
}