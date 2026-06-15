// App bootstrap, route definitions, splash
(function () {
  function bootRoutes() {
    Router.on('/login', () => Page.Login());
    Router.on('/register', () => Page.Register());
    Router.on('/beli-lisensi', () => Page.BeliLisensi());
    Router.on('/panduan', () => Page.Panduan(), { requireAuth: true });
    Router.on('/', () => Page.Dashboard(), { requireAuth: true });
    Router.on('/dashboard', () => Page.Dashboard(), { requireAuth: true });
    Router.on('/identitas', () => Page.Identitas(), { requireAuth: true });
    Router.on('/master-rhk', () => Page.MasterRHK(), { requireAuth: true });
    Router.on('/master-rhk/:id', (p) => Page.MasterRHKDetail(p.id), { requireAuth: true });
    Router.on('/skp-atasan', () => Page.SKPAtasan(), { requireAuth: true });
    Router.on('/matriks-peran-hasil', () => Page.MatriksPeranHasil(), { requireAuth: true });
    Router.on('/madrasah', () => Page.Madrasah(), { requireAuth: true });
    Router.on('/kegiatan', () => Page.KegiatanList(), { requireAuth: true });
    Router.on('/kegiatan/baru', () => Page.KegiatanForm(null), { requireAuth: true });
    Router.on('/kegiatan/:id', (p) => Page.KegiatanForm(p.id), { requireAuth: true });
    Router.on('/eviden', () => Page.EvidenIndex(), { requireAuth: true });
    Router.on('/eviden/:rhkId', (p) => Page.EvidenForRHK(p.rhkId), { requireAuth: true });
    Router.on('/eviden/preview/:id', (p) => Page.EvidenPreview(p.id), { requireAuth: true });
    Router.on('/arsip', () => Page.Arsip(), { requireAuth: true });
    Router.on('/rekap', () => Page.Rekap(), { requireAuth: true });
    Router.on('/laporan-triwulan', () => Page.LaporanTriwulan(), { requireAuth: true });
    Router.on('/periode', () => Page.Periode(), { requireAuth: true });
    Router.on('/backup', () => Page.Backup(), { requireAuth: true });
    Router.on('/admin/users', () => Page.AdminUsers(), { requireAuth: true, role: 'admin' });
    Router.on('/admin/aktivasi', () => Page.AdminAktivasi(), { requireAuth: true, role: 'admin' });
    Router.on('/admin/pembelian', () => Page.AdminPembelian(), { requireAuth: true, role: 'admin' });
  }

  async function boot() {
    try {
      await Auth.ensureAdminSeeded();
      // Migrasi data lama ke periode tahun aktif (master_rhk, kegiatan, eviden)
      try { Store.migrateLegacy && Store.migrateLegacy(); } catch (e) { console.warn('migrate legacy:', e); }
      // Pastikan admin user selalu tier='full'
      try { window.Tier && Tier.ensureAdminFullTier && Tier.ensureAdminFullTier(); } catch (e) {}
      // One-time migration: set fullExpiresAt untuk user FULL existing yang belum punya field ini
      try { window.Tier && Tier.migrateExistingFullUsers && Tier.migrateExistingFullUsers(); } catch (e) {}
      // Toggle body.trial-mode + inject watermark element supaya CSS print watermark aktif
      try { applyTrialWatermark(); } catch (e) {}
      // Load remote codes dari gh-pages (best-effort, async, jangan blocking).
      try {
        if (window.GithubSync && window.GithubSync.refreshFromPublic) {
          window.GithubSync.refreshFromPublic().catch(e => console.warn('[boot] remote codes refresh failed:', e.message));
        }
      } catch (e) {}
      bootRoutes();
    } catch (e) {
      console.error('boot error:', e);
    }
    // Always reveal app, even if init had warnings
    const ld = document.getElementById('app-loading'); if (ld) ld.classList.add('d-none');
    const ap = document.getElementById('app'); if (ap) ap.classList.remove('d-none');
    // Default landing: Dashboard (kecuali user buka deep link tertentu)
    if (!location.hash || location.hash === '#' || location.hash === '#/') {
      history.replaceState(null, '', '#/dashboard');
    }
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

  // Watermark TRIAL untuk cetak in-app (window.print()).
  // Mengandalkan CSS body.trial-mode + element .trial-watermark / .trial-watermark-band.
  function applyTrialWatermark() {
    const isTrial = !!(window.Tier && Tier.isTrialUser && Tier.isTrialUser());
    document.body.classList.toggle('trial-mode', isTrial);
    let band = document.getElementById('trialWmBand');
    let main = document.getElementById('trialWmMain');
    if (isTrial) {
      if (!band) {
        band = document.createElement('div');
        band.id = 'trialWmBand';
        band.className = 'trial-watermark-band';
        band.textContent = 'DOKUMEN VERSI TRIAL — TIDAK SAH UNTUK PENGGUNAAN RESMI';
        document.body.appendChild(band);
      }
      if (!main) {
        main = document.createElement('div');
        main.id = 'trialWmMain';
        main.className = 'trial-watermark';
        document.body.appendChild(main);
      }
    } else {
      band && band.remove();
      main && main.remove();
    }
  }
  window.applyTrialWatermark = applyTrialWatermark;

  // Refresh status watermark setiap kali user login/logout/upgrade
  window.addEventListener('storage', applyTrialWatermark);
  // Hook ke window.print untuk pastikan watermark up-to-date saat user pencet Ctrl+P
  window.addEventListener('beforeprint', applyTrialWatermark);

  window.Page = window.Page || {};
})();
