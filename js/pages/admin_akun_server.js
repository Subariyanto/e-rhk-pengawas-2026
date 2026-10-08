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
  // Pesan alasan gagal (dipakai beberapa panel).
  function reasonMsg(r) {
    const m = {
      no_admin_key: 'Admin Key belum diisi.',
      invalid_admin_key: 'Admin Key salah.',
      network_error: 'Server tidak terjangkau.',
      not_found: 'Kode tidak ada di server.',
      has_account: 'Kode masih terpakai akun (hapus akunnya dulu).',
    };
    return m[(r && r.reason)] || ((r && r.reason) || 'gagal');
  }
  function codePrefix(c) {
    // Ambil prefix sebelum segmen acak pertama, mis. 'FULL-' / 'E-RHK-PENGAWAS-'
    const i = String(c).indexOf('-');
    return i > 0 ? String(c).slice(0, i + 1) : '';
  }

  Page.AdminAkunServer = function () {
    return renderPage('akun');
  };

  // Halaman khusus: Daftar Kode & status aktivasi
  Page.AdminKodeServer = function () {
    return renderPage('kode');
  };

  function renderPage(defaultTab) {
    const ready = !!(window.SupabaseSync && typeof SupabaseSync.adminListAccounts === 'function');
    const appSlug = (window.SupabaseSync && SupabaseSync.APP_SLUG) || 'e-rhk-pengawas';

    UI.shell('Akun & Kode Server', `
      <div class="alert alert-light border mb-3">
        <i class="bi bi-cloud-check text-primary"></i>
        Panel ini mengelola <strong>akun & kode</strong> di <em>Pusat Lisensi</em> (model <strong>1 kode = 1 akun</strong>).
        Akun server membuat pengguna bisa <strong>login dari perangkat mana pun</strong>. Data RHK tetap tersimpan lokal per perangkat.
        <div class="small text-muted mt-1">App slug: <code>${U.escapeHtml(appSlug)}</code></div>
      </div>

      ${!ready ? `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> Modul <code>SupabaseSync</code> belum termuat. Refresh halaman.</div>` : ''}

      <div class="card mb-3"><div class="card-body">
        <label class="form-label">Admin Key Pusat Lisensi</label>
        <div class="input-group mb-2">
          <input class="form-control" id="akKey" type="password" placeholder="PJWS-ADM-..." autocomplete="off" />
          <button class="btn btn-outline-secondary" id="akToggle" type="button"><i class="bi bi-eye"></i></button>
          <button class="btn btn-primary" id="akLoad" type="button"><i class="bi bi-arrow-clockwise"></i> Muat Data</button>
        </div>
        <div class="form-check">
          <input class="form-check-input" type="checkbox" id="akRemember" />
          <label class="form-check-label small" for="akRemember">Ingat key di perangkat ini (hanya perangkat admin)</label>
        </div>
        <div class="small text-muted mt-1">Key tidak dikirim ke mana pun kecuali ke Pusat Lisensi via HTTPS.</div>
      </div></div>

      <ul class="nav nav-tabs mb-3" id="akTabs">
        <li class="nav-item"><a class="nav-link${defaultTab === 'kode' ? '' : ' active'}" href="#" data-tab="akun"><i class="bi bi-people"></i> Akun</a></li>
        <li class="nav-item"><a class="nav-link${defaultTab === 'kode' ? ' active' : ''}" href="#" data-tab="kode"><i class="bi bi-upc-scan"></i> Kode</a></li>
      </ul>

      <div id="akStats" class="mb-2"></div>
      <div id="akPanelAkun"><div class="text-muted small">Muat data untuk melihat daftar akun.</div></div>
      <div id="akPanelKode" style="display:none;"><div class="text-muted small">Muat data untuk melihat daftar kode.</div></div>
    `);

    const keyInput = document.getElementById('akKey');
    const remember = document.getElementById('akRemember');
    keyInput.value = getKey();
    remember.checked = !!getKey();

    // Tab switching
    let activeTab = defaultTab === 'kode' ? 'kode' : 'akun';
    const panelAkun = document.getElementById('akPanelAkun');
    const panelKode = document.getElementById('akPanelKode');
    const listElAkun = panelAkun;
    const listElKode = panelKode;
    document.querySelectorAll('#akTabs a[data-tab]').forEach(a => a.addEventListener('click', (e) => {
      e.preventDefault();
      activeTab = a.dataset.tab;
      document.querySelectorAll('#akTabs a').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
      listElAkun.style.display = activeTab === 'akun' ? '' : 'none';
      listElKode.style.display = activeTab === 'kode' ? '' : 'none';
    }));

    document.getElementById('akToggle').addEventListener('click', () => {
      keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
    });

    document.getElementById('akLoad').addEventListener('click', load);

    function renderCodes(codes) {
      const total = codes.length;
      const used = codes.filter(c => c.account_username).length;
      const unused = total - used;
      const revoked = codes.filter(c => c.is_active === false).length;
      document.getElementById('akStats').innerHTML = `
        <div class="row g-2 mb-2">
          <div class="col-6 col-md-3"><div class="border rounded p-2 text-center"><div class="h5 mb-0">${total}</div><div class="small text-muted">Total kode</div></div></div>
          <div class="col-6 col-md-3"><div class="border rounded p-2 text-center"><div class="h5 mb-0 text-danger">${used}</div><div class="small text-muted">Sudah diaktivasi</div></div></div>
          <div class="col-6 col-md-3"><div class="border rounded p-2 text-center"><div class="h5 mb-0 text-success">${unused}</div><div class="small text-muted">Belum dipakai</div></div></div>
          <div class="col-6 col-md-3"><div class="border rounded p-2 text-center"><div class="h5 mb-0 text-secondary">${revoked}</div><div class="small text-muted">Dicabut</div></div></div>
        </div>`;

      const filter = String((document.getElementById('akCodeFilter') || {}).value || '').toUpperCase();
      const onlyUsed = !!(document.getElementById('akOnlyUsed') || {}).checked;
      let rows = codes.slice().sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
      if (filter) rows = rows.filter(c => (c.code || '').toUpperCase().includes(filter) || String(c.account_username || '').toUpperCase().includes(filter) || String(c.account_fullname || '').toUpperCase().includes(filter));
      if (onlyUsed) rows = rows.filter(c => !!c.account_username);

      document.getElementById('akPanelKode').innerHTML = `
        <div class="row g-2 align-items-end mb-2">
          <div class="col-md-6">
            <input class="form-control form-control-sm" id="akCodeFilter" placeholder="Cari kode / username / nama…" value="${U.escapeHtml(filter)}" />
          </div>
          <div class="col-md-6">
            <div class="form-check form-switch">
              <input class="form-check-input" type="checkbox" id="akOnlyUsed" ${onlyUsed ? 'checked' : ''} />
              <label class="form-check-label small" for="akOnlyUsed">Tampilkan hanya yang sudah diaktivasi</label>
            </div>
          </div>
        </div>
        <div class="card"><div class="table-responsive"><table class="table table-sm table-hover align-middle mb-0">
          <thead><tr>
            <th>Kode</th><th>Status</th><th>Diaktivasi oleh</th><th>Nama</th><th>Login terakhir</th><th>Dibuat</th><th class="text-end" style="width:7rem;">Aksi</th>
          </tr></thead>
          <tbody>
            ${rows.map(c => {
              const aktiv = !!c.account_username;
              const st = c.is_active === false ? '<span class="badge bg-secondary">dicabut</span>' : (aktiv ? '<span class="badge bg-danger">terpakai</span>' : '<span class="badge bg-success">tersedia</span>');
              return `<tr>
                <td style="font-family:'Courier New',monospace;font-size:.82em;">${U.escapeHtml(c.code)}${c.recipient ? `<div class="small text-muted">${U.escapeHtml(c.recipient)}</div>` : ''}</td>
                <td>${st}</td>
                <td style="font-family:'Courier New',monospace;font-size:.82em;">${U.escapeHtml(c.account_username || '—')}</td>
                <td>${U.escapeHtml(c.account_fullname || '—')}</td>
                <td class="small text-muted">${fmt(c.account_last_login)}</td>
                <td class="small text-muted">${fmt(c.created_at)}</td>
                <td class="text-end"><button class="btn btn-sm btn-outline-secondary" data-copy="${U.escapeHtml(c.code)}" title="Salin kode">📋</button></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table></div></div>
        <div class="small text-muted mt-2">Kode <strong>terpakai</strong> = sudah diaktivasi jadi akun (1 kode = 1 akun). Untuk membebaskan kode, hapus akunnya di tab <em>Akun</em>.</div>`;

      const f = document.getElementById('akCodeFilter');
      if (f) f.addEventListener('input', () => renderCodes(codes));
      const ou = document.getElementById('akOnlyUsed');
      if (ou) ou.addEventListener('change', () => renderCodes(codes));
      document.querySelectorAll('#akPanelKode button[data-copy]').forEach(b => b.addEventListener('click', () => {
        if (navigator.clipboard) navigator.clipboard.writeText(b.dataset.copy);
        UI.toast('Kode disalin: ' + b.dataset.copy, 'success');
      }));
    }

    async function load() {
      const key = String(keyInput.value || '').trim();
      if (!key) return UI.toast('Admin key kosong.', 'danger');
      if (remember.checked) setKey(key); else setKey('');
      const statsEl = document.getElementById('akStats');
      listElAkun.innerHTML = '<div class="text-muted small"><span class="spinner-border spinner-border-sm"></span> Memuat…</div>';
      listElKode.innerHTML = '<div class="text-muted small"><span class="spinner-border spinner-border-sm"></span> Memuat…</div>';
      statsEl.innerHTML = '';

      const [res, stats, codesRes] = await Promise.all([
        SupabaseSync.adminListAccounts(key, appSlug),
        SupabaseSync.adminGetAccountStats(key, appSlug),
        (SupabaseSync.adminListCodes ? SupabaseSync.adminListCodes(key, appSlug) : Promise.resolve(null)),
      ]);

      // Panel Kode (status aktivasi tiap kode)
      if (codesRes && codesRes.success === true) {
        renderCodes(codesRes.codes || []);
      } else if (codesRes) {
        listElKode.innerHTML = `<div class="alert alert-danger mb-0"><i class="bi bi-x-circle"></i> Gagal memuat daftar kode. ${U.escapeHtml(reasonMsg(codesRes))}</div>`;
      }

      let listEl = listElAkun;
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
