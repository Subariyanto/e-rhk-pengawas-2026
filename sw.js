// Service worker — network-first untuk file aplikasi sendiri (selalu update),
// cache-first untuk CDN. Kalau gagal network, fallback ke cache (offline-friendly).
const CACHE = 'erhk-2026-v5-2026-06-12-r9';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/lib/store.js',
  './js/lib/idb_store.js',
  './js/lib/auth.js',
  './js/lib/aktivasi.js',
  './js/lib/tier.js',
  './js/lib/codes.js',
  './js/lib/pengawas_registry.js',
  './js/lib/util.js',
  './js/lib/router.js',
  './js/lib/ui.js',
  './js/lib/gen_html.js',
  './js/lib/gen_pdf.js',
  './js/lib/gen_docx.js',
  './js/lib/gen_zip.js',
  './js/data/master_rhk.js',
  './js/data/narasi.js',
  './js/data/template_kegiatan.js',
  './js/pages/login.js',
  './js/pages/register.js',
  './js/pages/dashboard.js',
  './js/pages/identitas.js',
  './js/pages/master_rhk.js',
  './js/pages/madrasah.js',
  './js/pages/kegiatan.js',
  './js/pages/eviden.js',
  './js/pages/arsip.js',
  './js/pages/rekap.js',
  './js/pages/laporan_triwulan.js',
  './js/pages/admin_users.js',
  './js/pages/admin_aktivasi.js',
  './js/pages/admin_pembelian.js',
  './js/pages/beli_lisensi.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  // Pre-cache shell, but skip waiting so new SW activates immediately
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    try { await c.addAll(SHELL); } catch (_) {}
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Network-first for our own origin (always pull latest)
  if (url.origin === location.origin) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const c = await caches.open(CACHE);
        c.put(req, fresh.clone()).catch(() => {});
        return fresh;
      } catch (_) {
        const cached = await caches.match(req);
        if (cached) return cached;
        const fallback = await caches.match('./index.html');
        return fallback || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // Cache-first for CDN (fast & offline-friendly)
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) {
      // refresh in background
      fetch(req).then(r => caches.open(CACHE).then(c => c.put(req, r.clone()))).catch(() => {});
      return cached;
    }
    try {
      const fresh = await fetch(req);
      const c = await caches.open(CACHE);
      c.put(req, fresh.clone()).catch(() => {});
      return fresh;
    } catch (_) {
      return new Response('Offline', { status: 503 });
    }
  })());
});
