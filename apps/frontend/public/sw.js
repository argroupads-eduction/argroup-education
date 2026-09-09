const CACHE = 'ar-group-shell-v12';
/** Do not precache `/` — homepage changes often; stale HTML causes hydration mismatches. */
const PRECACHE = [
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.png',
  '/favicon-48x48.png',
  '/favicon-96x96.png',
  '/apple-touch-icon.png',
  '/ar-browser-icon.png',
  '/ar-notification-icon.png',
  '/icons/ar-notification-192.png',
  '/icons/ar-notification-512.png',
];

function isLocalHost() {
  const h = self.location.hostname;
  return h === 'localhost' || h === '127.0.0.1' || h === '[::1]';
}

function absoluteUrl(path) {
  try {
    const base = self.registration && self.registration.scope
      ? self.registration.scope
      : self.location.origin + '/';
    return new URL(path, base).href;
  } catch {
    return path;
  }
}

self.addEventListener('install', (event) => {
  if (isLocalHost()) {
    event.waitUntil(self.skipWaiting().then(() => self.registration.unregister()));
    return;
  }
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  if (isLocalHost()) {
    event.waitUntil(
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
        .then(() => self.registration.unregister())
    );
    return;
  }
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => (k === CACHE ? undefined : caches.delete(k)))))
      .then(() => caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Dev: never intercept — stale documents cause hydration mismatches.
  if (isLocalHost()) return;

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

  // Never cache HTML navigations — stale document + fresh/old JS causes hydration errors.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Dev/HMR bundles must always hit the network.
  if (url.pathname.startsWith('/_next/')) {
    return;
  }
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'AR Group of Education',
    body: 'You have a new update.',
    url: '/',
    tag: 'ar-group',
    icon: '',
    image: '',
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

  const defaultIcon = absoluteUrl('/icons/ar-notification-192.png');
  const icon = data.icon && /^https?:\/\//i.test(data.icon) ? data.icon : defaultIcon;
  const badge = absoluteUrl('/icons/ar-notification-192.png');
  const image =
    data.image && /^https?:\/\//i.test(data.image) ? data.image : undefined;

  event.waitUntil(
    self.registration.showNotification(data.title || 'AR Group of Education', {
      body: data.body || '',
      icon,
      badge,
      ...(image ? { image } : {}),
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
