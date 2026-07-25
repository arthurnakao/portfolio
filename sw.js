const buildId = new URL(self.location.href).searchParams.get('buildId') || 'dev'
const CACHE_VERSION = `portfolio-pwa-${buildId}`
const APP_SHELL_CACHE = `shell-${CACHE_VERSION}`
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`
const PRECACHE_URLS = ["./","./index.html","./manifest.webmanifest","./logo.ico","./apple-touch-icon.png","./icon-192.png","./icon-512.png","./assets/index-Bs7Ifckd.js","./assets/CartoonProfile-PnEScOxJ.png","./assets/index-Dl90evj7.css"]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => ![APP_SHELL_CACHE, RUNTIME_CACHE].includes(cacheName))
          .map((cacheName) => caches.delete(cacheName)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(event.request.url)

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone()
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put('./', responseClone))
          return response
        })
        .catch(async () => {
          const cached = await caches.match('./')
          return cached || caches.match('./index.html')
        }),
    )
    return
  }

  if (requestUrl.origin !== self.location.origin) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          const responseClone = networkResponse.clone()
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(event.request, responseClone))
        }

        return networkResponse
      })
    }),
  )
})
