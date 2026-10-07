/* Generated during npm run build. Do not edit the copy in build/. */
const CACHE_NAME = __CACHE_NAME__;
const ASSETS = __ASSET_URLS__;
const ASSET_SET = new Set(ASSETS);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      // Do not activate a partly downloaded release or Netlify's HTML fallback
      // masquerading as a missing model or script.
      for (const url of ASSETS) {
        const response = await fetch(new Request(url, { cache: 'reload' }));
        if (!response.ok || (url !== '/index.html' &&
          (response.headers.get('content-type') || '').includes('text/html'))) {
          throw new Error(`Offline download failed: ${url}`);
        }
        await cache.put(url, response);
      }
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
    // Updates wait for all existing tabs to close to avoid mixing releases.
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith('neidx-offline-') && name !== CACHE_NAME) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  const key = request.mode === 'navigate' ? '/index.html' : url.pathname;
  if (!ASSET_SET.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match(key);
    return response || fetch(request);
  })());
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'OFFLINE_STATUS' && event.ports[0]) {
    event.waitUntil((async () => {
      const cache = await caches.open(CACHE_NAME);
      const resources = await Promise.all(ASSETS.map(url => cache.match(url)));
      event.ports[0].postMessage({ ready: resources.every(Boolean) });
    })());
  }
});
