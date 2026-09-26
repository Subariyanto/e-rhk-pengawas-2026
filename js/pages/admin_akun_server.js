// Admin: Kelola Akun Server (Pusat Lisensi) — model "1 kode = 1 AKUN".
// Akun hidup di server (tabel app_accounts, project pusat-lisensi-aplikasi),
// sehingga akun yang sama bisa login dari perangkat mana pun.
//
// Panel ini memakai ADMIN KEY Pusat Lisensi (TIDAK di-hardcode di repo publik).
// Admin key diminta saat pertama dan disimpan lokal di perangkat admin saja.
(function () {
  const KEY_STORE = 'erhk2026_pusat_admin_key';

  function getKey() {
    try { return localStorage.getItem(KEY_STORE) || ''; } catch (e) { return ''; }
  }
  function setKey(v) {
    try { if (v) localStorage.setItem(KEY_STORE, v); else localStorage.removeItem(KEY_STORE); } catch (e) {}
  }
  function fmt(iso) {
    if (!iso) return '-';
    try { return new Date(iso).toLocaleString('id-ID'); } catch (e) { return iso; }
  }

  Page.AdminAkunServer = function () {
    const ready = !!(window.SupabaseSync && typeof SupabaseSync.adminListAccounts === 'function');
    const appSlug = (window.SupabaseSync && SupabaseSync.APP_SLUG) || 'e-rhk-pengawas';

    UI.shell('Akun Server', `
      <div class="alert alert-light border mb-3">
        <i class="bi bi-cloud-check text-primary"></i>
        Panel ini mengelola <strong>akun server</strong> di <em>Pusat Lisensi</em> (model <strong>1 kode = 1 akun</strong>).
        Akun server membuat pengguna bisa <strong>login dari perangkat mana pun</strong>. Data RHK tetap tersimpan lokal per perangkat.
        <div class="small text-muted mt-1">App slug: <code>${U.escapeHtml(appSlug)}</code></div>
      </div>

      ${!ready ? `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> Modul <code>SupabaseSync</code> belum termuat. Refresh halaman.</div>` : ''}

      <div class="card mb-3"><div class="card-body">
        <label class="form-label">Admin Key Pusat Lisensi</label>
        <div class="input-group mb-2">
          <input class="form-control" id="akKey" type="password" placeholder="PJWS-ADM-..." autocomplete="off" />
          <button class="btn btn-outline-secondary" id="akToggle" type="button"><i class="bi bi-eye"></i></button>
          <button class="btn btn-primary" id="akLoad" type="button"><i class="bi bi-arrow-clockwise"></i> Muat Akun</button>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="akRemember" />
          <label class="form-check-label small" for="akRemember">Ingat key di perangkat ini (hanya perangkat admin)</label>
        </div>
        <div class="small text-muted mt-1">Key tidak dikirim ke mana pun kecuali ke Pusat Lisensi via HTTPS.</div>
      </div></div>

      <div id="akStats" class="mb-2"></div>
      <div id="akList"><div class="text-muted small">Muat akun untuk melihat daftar.</div></div>
    `);

    const keyInput = document.getElementById('akKey');
    const remember = document.getElementById('akRemember');
    keyInput.value = getKey();
    remember.checked = !!getKey();

    document.getElementById('akToggle').addEventListener('click', () => {
      keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
    });

    document.getElementById('akLoad').addEventListener('click', load);

    async function load() {
      const key = String(keyInput.value || '').trim();
      if (!key) return UI.toast('Admin key kosong.', 'danger');
      if (remember.checked) setKey(key); else setKey('');
      const listEl = document.getElementById('akList');
      const statsEl = document.getElementById('akStats');
      listEl.innerHTML = '<div class="text-muted small"><span class="spinner-border spinner-border-sm"></span> Memuat…</div>';
      statsEl.innerHTML = '';

      const [res, stats] = await Promise.all([
        SupabaseSync.adminListAccounts(key, appSlug),
        SupabaseSync.adminGetAccountStats(key, appSlug),
      ]);

      if (!res || res.success !== true) {
        listEl.innerHTML = `<div class="alert alert-danger mb-0"><i class="bi bi-x-circle"></i> Gagal memuat. ${
          res && res.reason === 'invalid_admin_key'
            ? 'Admin key salah.'
            : 'Periksa koneksi / key, lalu coba lagi.'
        }</div>`;
        return;
      }

      const accounts = res.accounts || [];
      if (stats && stats.success) {
        statsEl.innerHTML = `
          <div class="row g-2 mb-2">
            <div class="col-6 col-md-3"><div class="border rounded p-2 text-center"><div class="h5 mb-0">${stats.total_accounts || 0}</div><div class="small text-muted">Total akun</div></div></div>
            <div class="col-6 col-md-3"><div class="border rounded p-2 text-center"><div class="h5 mb-0 text-success">${stats.active_accounts || 0}</div><div class="small text-muted">Aktif</div></div></div>
            <div class="col-6 col-md-3"><div class="border rounded p-2 text-center"><div class="h5 mb-0 text-danger">${stats.revoked_accounts || 0}</div><div class="small text-muted">Dicabut</div></div></div>
            <div class="col-6 col-md-3"><div class="border rounded p-2 text-center"><div class="h5 mb-0 text-primary">${stats.codes_with_account || 0}</div><div class="small text-muted">Kode terpakai</div></div></div>
          </div>`;
      }

      if (!accounts.length) {
        listEl.innerHTML = '<div class="alert alert-info mb-0">Belum ada akun server terdaftar.</div>';
        return;
      }

      listEl.innerHTML = `
        <div class="card"><div class="table-responsive"><table class="table table-sm table-hover align-middle mb-0">
          <thead><tr>
            <th>Username</th><th>Nama</th><th>Role</th><th>Status</th><th>Kode</th><th>Tier</th>
            <th>Login terakhir</th><th>Dibuat</th><th class="text-end" style="width:14rem;">Aksi</th>
          </tr></thead>
          <tbody>
            ${accounts.map(a => `
              <tr>
                <td style="font-family:'Courier New',monospace;font-size:.85em;">${U.escapeHtml(a.username)}</td>
                <td>${U.escapeHtml(a.fullname || '-')}${a.madrasah ? `<div class="small text-muted">${U.escapeHtml(a.madrasah)}</div>` : ''}</td>
                <td><span class="badge ${a.role === 'admin' ? 'bg-success' : 'bg-secondary'}">${U.escapeHtml(a.role || 'user')}</span></td>
                <td><span class="badge ${a.status === 'active' ? 'bg-success' : 'bg-danger'}">${a.status === 'active' ? 'aktif' : 'dicabut'}</span></td>
                <td style="font-family:'Courier New',monospace;font-size:.8em;">${U.escapeHtml(a.license_code || '-')}</td>
                <td>${U.escapeHtml(a.tier || '-')}</td>
                <td class="small text-muted">${fmt(a.last_login_at)}</td>
                <td class="small text-muted">${fmt(a.created_at)}</td>
                <td class="text-end">
                  ${a.status === 'active'
                    ? `<button class="btn btn-sm btn-outline-warning" data-revoke="${U.escapeHtml(a.id)}" title="Cabut akun">🚫</button>`
                    : `<button class="btn btn-sm btn-outline-success" data-reactivate="${U.escapeHtml(a.id)}" title="Aktifkan kembali">✅</button>`}
                  <button class="btn btn-sm btn-outline-secondary" data-reset="${U.escapeHtml(a.id)}" data-username="${U.escapeHtml(a.username)}" title="Reset password">🔑</button>
                  <button class="btn btn-sm btn-outline-danger" data-del="${U.escapeHtml(a.id)}" title="Hapus akun (kode bebas dipakai lagi)">🗑️</button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table></div></div>
        <div class="small text-muted mt-2">Dicabut = akun tidak bisa login, tapi data lokal di perangkat tidak dihapus. Hapus = kode aktivasi bebas dipakai akun baru.</div>
      `;

      listEl.querySelectorAll('button[data-revoke]').forEach(b => b.addEventListener('click', async () => {
        if (!await UI.confirmDialog('Cabut akun ini? Pengguna tidak bisa login lagi (data lokalnya tetap ada).')) return;
        const r = await SupabaseSync.adminRevokeAccount(key, b.dataset.revoke);
        UI.toast(r && r.success ? 'Akun dicabut.' : 'Gagal mencabut akun.', r && r.success ? 'success' : 'danger');
        load();
      }));
      listEl.querySelectorAll('button[data-reactivate]').forEach(b => b.addEventListener('click', async () => {
        const r = await SupabaseSync.adminReactivateAccount(key, b.dataset.reactivate);
        UI.toast(r && r.success ? 'Akun diaktifkan kembali.' : 'Gagal mengaktifkan akun.', r && r.success ? 'success' : 'danger');
        load();
      }));
      listEl.querySelectorAll('button[data-reset]').forEach(b => b.addEventListener('click', async () => {
        const u = b.dataset.username;
        const np = prompt('Password baru untuk akun "' + u + '" (min 6):');
        if (!np) return;
        if (String(np).length < 6) return UI.toast('Password minimal 6 karakter.', 'danger');
        const hash = await SupabaseSync.accountHash(u, np);
        if (!hash) return UI.toast('Gagal menghitung hash password.', 'danger');
        const r = await SupabaseSync.adminResetAccountPassword(key, b.dataset.reset, hash);
        UI.toast(r && r.success ? 'Password direset. Beri tahu pengguna password baru.' : 'Gagal reset password.', r && r.success ? 'success' : 'danger');
      }));
      listEl.querySelectorAll('button[data-del]').forEach(b => b.addEventListener('click', async () => {
        if (!await UI.confirmDialog('HAPUS akun ini dari server? Kode aktivasi menjadi bebas dipakai akun baru. Tindakan ini tidak bisa dibatalkan.')) return;
        const r = await SupabaseSync.adminDeleteAccount(key, b.dataset.del);
        UI.toast(r && r.success ? 'Akun dihapus.' : 'Gagal menghapus akun.', r && r.success ? 'success' : 'danger');
        load();
      }));
    }

    if (getKey()) load();
  };
})();
