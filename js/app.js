// App bootstrap, route definitions, splash
(function () {
  function bootRoutes() {
    Router.on('/login', () => Page.Login());
    Router.on('/register', () => Page.Register());
    Router.on('/', () => Page.Dashboard(), { requireAuth: true });
    Router.on('/dashboard', () => Page.Dashboard(), { requireAuth: true });
    Router.on('/identitas', () => Page.Identitas(), { requireAuth: true });
    Router.on('/master-rhk', () => Page.MasterRHK(), { requireAuth: true });
    Router.on('/master-rhk/:id', (p) => Page.MasterRHKDetail(p.id), { requireAuth: true });
    Router.on('/madrasah', () => Page.Madrasah(), { requireAuth: true });
    Router.on('/kegiatan', () => Page.KegiatanList(), { requireAuth: true });
    Router.on('/kegiatan/baru', () => Page.KegiatanForm(null), { requireAuth: true });
    Router.on('/kegiatan/:id', (p) => Page.KegiatanForm(p.id), { requireAuth: true });
    Router.on('/eviden', () => Page.EvidenIndex(), { requireAuth: true });
    Router.on('/eviden/:rhkId', (p) => Page.EvidenForRHK(p.rhkId), { requireAuth: true });
    Router.on('/eviden/preview/:id', (p) => Page.EvidenPreview(p.id), { requireAuth: true });
    Router.on('/arsip', () => Page.Arsip(), { requireAuth: true });
    Router.on('/rekap', () => Page.Rekap(), { requireAuth: true });
    Router.on('/admin/users', () => Page.AdminUsers(), { requireAuth: true, role: 'admin' });
  }

  async function boot() {
    await Auth.ensureAdminSeeded();
    bootRoutes();
    document.getElementById('app-loading').classList.add('d-none');
    document.getElementById('app').classList.remove('d-none');
    if (!location.hash) location.hash = '#/';
    Router.dispatch();
  }

  // Service worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }

  // Global error handler — surface any runtime error so the user sees it
  window.addEventListener('error', (e) => {
    try {
      console.error('Uncaught error:', e.error || e.message, e.filename, e.lineno);
      if (window.UI && UI.toast) UI.toast('Error: ' + (e.error?.message || e.message), 'danger');
    } catch (_) {}
  });
  window.addEventListener('unhandledrejection', (e) => {
    try {
      console.error('Unhandled rejection:', e.reason);
      if (window.UI && UI.toast) UI.toast('Error promise: ' + (e.reason?.message || e.reason), 'danger');
    } catch (_) {}
  });

  document.addEventListener('DOMContentLoaded', boot);

  window.Page = window.Page || {};
})();
