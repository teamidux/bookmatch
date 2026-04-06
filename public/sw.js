const CACHE = 'bookmatch-v3'

self.addEventListener('install', e => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  // ลบ cache เก่าทั้งหมด
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url)

  // 1. Navigation (HTML pages) — network เสมอ ห้าม cache
  //    เพื่อให้โค้ดใหม่หลัง deploy ทำงานได้ทันที
  if (e.request.mode === 'navigate') return

  // 2. API / Supabase — network เสมอ
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) return

  // 3. Next.js static bundles (/_next/static/) — cache-first
  //    ไฟล์เหล่านี้มี content hash ในชื่อ จึงปลอดภัยที่จะ cache
  if (url.pathname.startsWith('/_next/static/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached
        return fetch(e.request).then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()))
          return res
        })
      })
    )
    return
  }

  // 4. รูปภาพจาก Supabase Storage / OpenLibrary — cache-first 24h
  if (url.hostname.includes('supabase') || url.hostname.includes('openlibrary') || url.hostname.includes('googleapis')) {
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        caches.open(CACHE).then(c => c.put(e.request, res.clone()))
        return res
      }))
    )
    return
  }
})

// Push notification
self.addEventListener('push', e => {
  if (!e.data) return
  const data = e.data.json()
  e.waitUntil(
    self.registration.showNotification(data.title || 'BookMatch', {
      body: data.body || '',
      icon: '/api/icon?size=192',
      badge: '/api/icon?size=72',
      data: { url: data.url || '/' },
      tag: data.tag || 'bookmatch',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  const url = e.notification.data?.url || '/'
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(wins => {
      const match = wins.find(w => new URL(w.url).pathname === new URL(url, self.location.origin).pathname)
      if (match) return match.focus()
      return clients.openWindow(url)
    })
  )
})
