// public/sw.js - ✅ COMPLETE VERSION - Aggressive Caching for Fast Chart Loading

const CACHE_VERSION = 'v4'
const CACHE_NAME = `trading-chart-${CACHE_VERSION}`
const STATIC_CACHE = `static-${CACHE_VERSION}`
const FIREBASE_CACHE = `firebase-${CACHE_VERSION}`

// ✅ Static assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/stc-logo.png',
  '/stc.ico',
]

// ============================================
// INSTALL EVENT - Pre-cache static files
// ============================================
self.addEventListener('install', (event) => {
  console.log('✅ SW: Installing', CACHE_VERSION)
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('✅ SW: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('✅ SW: Installation complete')
        return self.skipWaiting() // Activate immediately
      })
      .catch(error => {
        console.error('❌ SW: Installation failed:', error)
      })
  )
})

// ============================================
// ACTIVATE EVENT - Clean old caches
// ============================================
self.addEventListener('activate', (event) => {
  console.log('✅ SW: Activating', CACHE_VERSION)
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old versions
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== FIREBASE_CACHE) {
              console.log('🗑️ SW: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('✅ SW: Activation complete')
        return self.clients.claim() // Take control immediately
      })
  )
})

// ============================================
// FETCH EVENT - Route requests to strategies
// ============================================
self.addEventListener('fetch', (event) => {
  const url = event.request.url
  const method = event.request.method
  
  // Only handle GET requests
  if (method !== 'GET') {
    return
  }
  
  // Firebase Realtime Database - AGGRESSIVE CACHE
  if (url.includes('firebaseio.com')) {
    event.respondWith(handleFirebaseRequest(event.request))
    return
  }
  
  // Static assets - Cache first
  if (url.match(/\.(png|jpg|jpeg|svg|ico|css|js|woff|woff2|ttf|eot)$/)) {
    event.respondWith(handleStaticRequest(event.request))
    return
  }
  
  // API calls - Network first with fallback
  if (url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request))
    return
  }
  
  // Default - Network first
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  )
})

// ============================================
// STRATEGY 1: Firebase - Cache First + Stale-While-Revalidate
// ============================================
async function handleFirebaseRequest(request) {
  try {
    const cache = await caches.open(FIREBASE_CACHE)
    const cached = await cache.match(request)
    
    // ✅ Return cached IMMEDIATELY (ultra fast!)
    if (cached) {
      const cacheAge = getCacheAge(cached)
      console.log(`⚡ CACHE HIT (Firebase) - Age: ${cacheAge}ms:`, 
        request.url.slice(-50))
      
      // ✅ Background update if cache is getting old (>10s)
      if (cacheAge > 10000) {
        fetchAndCache(request, cache).catch(() => {
          console.log('Background update failed (non-critical)')
        })
      }
      
      return cached
    }
    
    // No cache - fetch and cache
    console.log('📡 FETCH (Firebase):', request.url.slice(-50))
    return await fetchAndCache(request, cache)
    
  } catch (error) {
    console.error('❌ Firebase request failed:', error)
    
    // Try to return stale cache as last resort
    const staleCache = await caches.match(request)
    if (staleCache) {
      console.log('⚠️ Using stale cache (fallback)')
      return staleCache
    }
    
    throw error
  }
}

// ============================================
// STRATEGY 2: Static Assets - Cache First
// ============================================
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE)
    const cached = await cache.match(request)
    
    if (cached) {
      console.log('⚡ CACHE HIT (Static):', request.url.split('/').pop())
      return cached
    }
    
    // Fetch and cache
    const response = await fetch(request)
    
    if (response.ok) {
      cache.put(request, response.clone())
      console.log('💾 CACHED (Static):', request.url.split('/').pop())
    }
    
    return response
    
  } catch (error) {
    console.error('❌ Static request failed:', error)
    
    // Try cache as fallback
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    
    throw error
  }
}

// ============================================
// STRATEGY 3: API - Network First with Timeout
// ============================================
async function handleApiRequest(request) {
  try {
    // Network with 5s timeout
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 5000)
      )
    ])
    
    return response
    
  } catch (error) {
    console.log('⚠️ API failed, trying cache:', request.url)
    
    // Fallback to cache
    const cached = await caches.match(request)
    if (cached) {
      console.log('✅ Using cached API response')
      return cached
    }
    
    throw error
  }
}

// ============================================
// HELPER: Fetch and cache with error handling
// ============================================
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      // Clone before caching (response can only be read once)
      const clonedResponse = response.clone()
      
      // Add timestamp header for cache age tracking
      const headers = new Headers(clonedResponse.headers)
      headers.set('sw-cached-time', Date.now().toString())
      
      const cachedResponse = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: headers
      })
      
      cache.put(request, cachedResponse)
      console.log('💾 CACHED:', request.url.slice(-50))
    }
    
    return response
    
  } catch (error) {
    console.error('❌ Fetch failed:', error)
    throw error
  }
}

// ============================================
// HELPER: Get cache age
// ============================================
function getCacheAge(response) {
  const cachedTime = response.headers.get('sw-cached-time')
  
  if (!cachedTime) {
    // Fallback to Date header
    const dateHeader = response.headers.get('date')
    if (dateHeader) {
      const date = new Date(dateHeader)
      return Date.now() - date.getTime()
    }
    return 0
  }
  
  return Date.now() - parseInt(cachedTime)
}

// ============================================
// MESSAGE EVENT - Manual cache control
// ============================================
self.addEventListener('message', (event) => {
  if (!event.data) return
  
  const { type } = event.data
  
  // Clear all caches
  if (type === 'CLEAR_CACHE') {
    console.log('🗑️ Clearing all caches...')
    
    caches.keys().then(names => {
      return Promise.all(
        names.map(name => caches.delete(name))
      )
    }).then(() => {
      console.log('✅ All caches cleared')
      event.ports[0]?.postMessage({ success: true })
    }).catch(error => {
      console.error('❌ Cache clear failed:', error)
      event.ports[0]?.postMessage({ success: false, error: error.message })
    })
  }
  
  // Skip waiting (activate new SW immediately)
  if (type === 'SKIP_WAITING') {
    console.log('⏭️ Skipping waiting, activating new SW...')
    self.skipWait()
  }
  
  // Prefetch URLs
  if (type === 'PREFETCH' && event.data.urls) {
    console.log('🔄 Prefetching URLs:', event.data.urls.length)
    
    const urls = event.data.urls
    caches.open(FIREBASE_CACHE).then(cache => {
      return Promise.all(
        urls.map(url => 
          fetch(url)
            .then(response => {
              if (response.ok) {
                cache.put(url, response)
              }
            })
            .catch(() => console.log('Prefetch failed:', url))
        )
      )
    }).then(() => {
      console.log('✅ Prefetch complete')
    })
  }
})

// ============================================
// PERIODIC CLEANUP - Every 30 minutes
// ============================================
setInterval(() => {
  caches.open(FIREBASE_CACHE).then(cache => {
    cache.keys().then(keys => {
      const now = Date.now()
      let deletedCount = 0
      
      keys.forEach(key => {
        cache.match(key).then(response => {
          if (response) {
            const age = getCacheAge(response)
            
            // Delete if older than 5 minutes
            if (age > 5 * 60 * 1000) {
              cache.delete(key)
              deletedCount++
            }
          }
        })
      })
      
      if (deletedCount > 0) {
        console.log(`🗑️ Cleaned ${deletedCount} old cache entries`)
      }
    })
  })
}, 30 * 60 * 1000) // Every 30 minutes

console.log('✅ Service Worker', CACHE_VERSION, 'loaded - AGGRESSIVE CACHING MODE')
console.log('⚡ Strategies: Firebase (Cache-First), Static (Cache-First), API (Network-First)')