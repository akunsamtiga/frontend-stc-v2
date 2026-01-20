const CACHE_VERSION = 'v4'
const CACHE_NAME = `trading-chart-${CACHE_VERSION}`
const STATIC_CACHE = `static-${CACHE_VERSION}`
const FIREBASE_CACHE = `firebase-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/stc-logo.png',
  '/stc.ico',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        return self.skipWaiting()
      })
      .catch(error => {
        console.error('Installation failed:', error)
      })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== STATIC_CACHE && 
                cacheName !== FIREBASE_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        return self.clients.claim()
      })
  )
})

self.addEventListener('fetch', (event) => {
  const url = event.request.url
  const method = event.request.method
  
  if (method !== 'GET') {
    return
  }
  
  if (url.includes('firebaseio.com')) {
    event.respondWith(handleFirebaseRequest(event.request))
    return
  }
  
  if (url.match(/\.(png|jpg|jpeg|svg|ico|css|js|woff|woff2|ttf|eot)$/)) {
    event.respondWith(handleStaticRequest(event.request))
    return
  }
  
  if (url.includes('/api/')) {
    event.respondWith(handleApiRequest(event.request))
    return
  }
  
  event.respondWith(
    fetch(event.request)
      .catch(() => caches.match(event.request))
  )
})

async function handleFirebaseRequest(request) {
  try {
    const cache = await caches.open(FIREBASE_CACHE)
    const cached = await cache.match(request)
    
    if (cached) {
      const cacheAge = getCacheAge(cached)
      console.log(`CACHE HIT (Firebase) - Age: ${cacheAge}ms:`, request.url.slice(-50))
      
      if (cacheAge > 10000) {
        fetchAndCache(request, cache).catch(() => {
          console.log('Background update failed')
        })
      }
      
      return cached
    }
    
    return await fetchAndCache(request, cache)
    
  } catch (error) {
    console.error('Firebase request failed:', error)
    
    const staleCache = await caches.match(request)
    if (staleCache) {
      console.log('Using stale cache')
      return staleCache
    }
    
    throw error
  }
}

async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE)
    const cached = await cache.match(request)
    
    if (cached) {
      console.log('CACHE HIT (Static):', request.url.split('/').pop())
      return cached
    }
    
    const response = await fetch(request)
    
    if (response.ok) {
      cache.put(request, response.clone())
      console.log('CACHED (Static):', request.url.split('/').pop())
    }
    
    return response
    
  } catch (error) {
    console.error('Static request failed:', error)
    
    const cached = await caches.match(request)
    if (cached) {
      return cached
    }
    
    throw error
  }
}

async function handleApiRequest(request) {
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 5000)
      )
    ])
    
    return response
    
  } catch (error) {
    console.log('API failed, trying cache:', request.url)
    
    const cached = await caches.match(request)
    if (cached) {
      console.log('Using cached API response')
      return cached
    }
    
    throw error
  }
}

async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request)
    
    if (response.ok) {
      const clonedResponse = response.clone()
      const headers = new Headers(clonedResponse.headers)
      headers.set('sw-cached-time', Date.now().toString())
      
      const cachedResponse = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: headers
      })
      
      cache.put(request, cachedResponse)
      console.log('CACHED:', request.url.slice(-50))
    }
    
    return response
    
  } catch (error) {
    console.error('Fetch failed:', error)
    throw error
  }
}

function getCacheAge(response) {
  const cachedTime = response.headers.get('sw-cached-time')
  
  if (!cachedTime) {
    const dateHeader = response.headers.get('date')
    if (dateHeader) {
      const date = new Date(dateHeader)
      return Date.now() - date.getTime()
    }
    return 0
  }
  
  return Date.now() - parseInt(cachedTime)
}

self.addEventListener('message', (event) => {
  if (!event.data) return
  
  const { type } = event.data
  
  if (type === 'CLEAR_CACHE') {
    console.log('Clearing all caches...')
    
    caches.keys().then(names => {
      return Promise.all(
        names.map(name => caches.delete(name))
      )
    }).then(() => {
      console.log('All caches cleared')
      event.ports[0]?.postMessage({ success: true })
    }).catch(error => {
      console.error('Cache clear failed:', error)
      event.ports[0]?.postMessage({ success: false, error: error.message })
    })
  }
  
  if (type === 'SKIP_WAITING') {
    console.log('Skipping waiting, activating new SW...')
    self.skipWaiting()
  }
  
  if (type === 'PREFETCH' && event.data.urls) {
    console.log('Prefetching URLs:', event.data.urls.length)
    
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
      console.log('Prefetch complete')
    })
  }
})

setInterval(() => {
  caches.open(FIREBASE_CACHE).then(cache => {
    cache.keys().then(keys => {
      const now = Date.now()
      let deletedCount = 0
      
      keys.forEach(key => {
        cache.match(key).then(response => {
          if (response) {
            const age = getCacheAge(response)
            
            if (age > 5 * 60 * 1000) {
              cache.delete(key)
              deletedCount++
            }
          }
        })
      })
      
      if (deletedCount > 0) {
        console.log(`Cleaned ${deletedCount} old cache entries`)
      }
    })
  })
}, 30 * 60 * 1000)

console.log('Service Worker', CACHE_VERSION, 'loaded - AGGRESSIVE CACHING MODE')