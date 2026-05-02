// FinNote Service Worker — Offline Cache + Push Notifications
const CACHE_NAME = 'finnote-v1'
const STATIC_ASSETS = [
  '/',
  '/images/logo-512.png'
]

// Install: pre-cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: Network-first for API, Cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and API requests — always go to network
  if (request.method !== 'GET' || url.pathname.startsWith('/api')) {
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const fetched = fetch(request).then((response) => {
        // Only cache successful same-origin responses
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
        }
        return response
      }).catch(() => cached) // If network fails, fall back to cache

      return cached || fetched
    })
  )
})

// ━━━━ Push Notifications ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

self.addEventListener('push', (event) => {
  let data = { title: 'FinNote', body: 'Bạn có thông báo mới' }

  try {
    if (event.data) {
      data = event.data.json()
    }
  } catch {
    // fallback: plain text
    if (event.data) {
      data.body = event.data.text()
    }
  }

  // Handle native app badge (iOS 16.4+ & Android)
  if (self.navigator && self.navigator.setAppBadge) {
    const unreadCount = data.unreadCount || 1 // Backend can pass unreadCount
    self.navigator.setAppBadge(unreadCount).catch(() => {})
  }

  const options = {
    body: data.body || '',
    icon: '/images/logo-512.png',
    badge: '/images/logo-512.png',
    tag: data.tag || 'finnote-default',
    data: {
      url: data.url || '/',
      ...data.data
    },
    // iOS-specific: keep notification visible
    requireInteraction: false,
    // Vibration pattern (Android / supported devices)
    vibrate: [100, 50, 100]
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'FinNote', options)
  )
})

// Handle notification click — open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  // Clear native app badge on click
  if (self.navigator && self.navigator.clearAppBadge) {
    self.navigator.clearAppBadge().catch(() => {})
  }

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus()
          client.navigate(targetUrl)
          return
        }
      }
      // Otherwise, open a new window
      return self.clients.openWindow(targetUrl)
    })
  )
})
