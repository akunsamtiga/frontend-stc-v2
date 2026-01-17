// public/sw.js - ✅ Cache Firebase data for offline support & faster loading

const CACHE_NAME = 'trading-chart-v2' // Increment version when updating
const urlsToCache = [
  '/',
  '/stc-logo.png',
  '/stc.ico',
]

// ✅ Install Event - Cache static assets
self.addEventListener('install', (event) => {
  console.log('✅ Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('✅ Service Worker: Caching static files')
      return cache.addAll(urlsToCache)
    }).then(() => {
      console.log('✅ Service Worker: Installation complete')
      return self.skipWaiting() // Activate immediately
    })
  )
})

// ✅ Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Service Worker: Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('✅ Service Worker: Activation complete')
      return self.clients.claim() // Take control immediately
    })
  )
})

// ✅ Fetch Event - Cache Firebase Realtime DB queries
self.addEventListener('fetch', (event) => {
  const url = event.request.url
  
  // Only cache Firebase Realtime Database requests
  if (url.includes('firebaseio.com')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          // Return cached version (FAST!)
          console.log('⚡ Cache HIT:', url)
          return response
        }
        
        // Fetch from network and cache
        return fetch(event.request).then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseToCache = response.clone()
            
            caches.open(CACHE_NAME).then((cache) => {
              console.log('💾 Caching:', url)
              cache.put(event.request, responseToCache)
            })
          }
          
          return response
        }).catch((error) => {
          console.error('❌ Fetch failed:', error)
          // Return cached version even if expired (better than nothing)
          return caches.match(event.request)
        })
      })
    )
  } else {
    // For non-Firebase requests, use network first
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request)
      })
    )
  }
})

// ✅ Message Event - Clear cache on demand
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('🗑️ Clearing cache...')
    
    caches.delete(CACHE_NAME).then(() => {
      console.log('✅ Cache cleared')
      event.ports[0].postMessage({ success: true })
    })
  }
})