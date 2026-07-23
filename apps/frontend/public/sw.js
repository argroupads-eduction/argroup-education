/**
 * Service worker — PWA install + Web Push notifications.
 * Keep this file vanilla JS (served from /sw.js).
 */

const CACHE = 'ar-group-shell-v3';
const PRECACHE = ['/', '/manifest.webmanifest', '/ar-browser-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept media — Googlebot-Image and browsers must hit the network directly.
  if (
    /\.(?:png|jpe?g|webp|gif|svg|avif|ico|mp4|webm)(?:$|\?)/i.test(url.pathname) ||
    url.pathname.startsWith('/wp-content/') ||
    url.pathname.startsWith('/api/wp-media/') ||
    url.pathname.startsWith('/uploads/') ||
    url.pathname.startsWith('/states/')
  ) {
    return;
  }

  // Network-first for navigations; cache fallback for offline shell.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
  }
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'AR Group of Education',
    body: 'You have a new update.',
    url: '/',
    tag: 'ar-group',
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch {
    try {
      const text = event.data && event.data.text();
      if (text) data.body = text;
    } catch {
      /* ignore */
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'AR Group of Education', {
      body: data.body || '',
      icon: '/ar-browser-icon.png',
      badge: '/ar-browser-icon.png',
      tag: data.tag || 'ar-group',
      data: { url: data.url || '/' },
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
      return undefined;
    })
  );
});
