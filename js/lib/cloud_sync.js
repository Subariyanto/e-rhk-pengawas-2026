// CloudSync — sinkronisasi data aplikasi ke Supabase Pusat Lisensi.
//
// Tujuan: data (identitas, madrasah, master_rhk, kegiatan, eviden) bisa dibuka
// dari PERANGKAT MANA PUN dengan akun yang sama — gratis, memakai project
// Supabase yang sudah dipakai untuk akun & kode aktivasi (tanpa OAuth Google).
//
// Prinsip: OFFLINE-FIRST.
//   * localStorage tetap sumber utama + cache (aplikasi tetap jalan offline).
//   * Cloud hanyalah cermin; saat login di perangkat baru, data ditarik dari cloud.
//   * Setiap perubahan lokal didorong ke cloud (debounce) saat online.
//
// Lampiran (foto/PDF) TIDAK diunggah ke cloud — gunakan LINK Google Drive yang
// sudah tersedia di kolom bukti dukung (hemat kuota, sesuai kesepakatan).
(function () {
  const APP_SLUG = (window.SupabaseSync && SupabaseSync.APP_SLUG) || 'e-rhk-pengawas';
  const DEBOUNCE_MS = 1500;
  const META_SCOPE = 'cloudmeta_v1';       // disimpan per-perangkat (Store global)
  const PERIODIC = ['master_rhk', 'kegiatan', 'eviden'];
  const WATCH_MS = 10000;
  const TOKEN_CHECK_MS = 30 * 60 * 1000;   // cek token tiap 30 menit
  const TOKEN_REFRESH_IF_LESS_H = 48;      // perpanjang bila sisa < 48 jam

  let _queue = new Map();      // "scope|periode" -> value (JS object)
  let _timer = null;
  let _busy = false;
  let _pendingFlush = false;
  let _lastUserKey = '';
  let _status = { state: 'idle', lastAt: null, lastError: null, pulled: 0, applied: 0, pushed: 0 };

  // ---------- config & akun ----------
  // PINDAH BERSIH KE VPS (keputusan Yanto 26 Okt 10:27):
  // Simpan perubahan HANYA ke VPS lewat fn_data_set/fn_data_get.
  // Server lama dipakai SEKALI saja: menarik data warisan saat migrasi.
  // localStorage tetap sumber utama & lapisan hidup (offline-first).
  function cfg() {
    const S = window.SupabaseSync || {};
    return { url: S.VPS_URL || '', key: S.VPS_ANON_KEY || '' };
  }
  function legacyCfg() {
    const S = window.SupabaseSync || {};
    return { url: S.PUSAT_URL || '', key: S.PUSAT_ANON_KEY || '' };
  }
  function vpsToken() {
    try {
      const S = window.SupabaseSync || {};
      return (S.vpsGetToken && S.vpsGetToken()) || '';
    } catch (e) { return ''; }
  }
  function currentUser() {
    try { return (window.Auth && Auth.currentUser) ? Auth.currentUser() : null; } catch (e) { return null; }
  }
  function usernameOf(u) {
    if (!u) return '';
    const nip = String(u.nip || '').replace(/[^0-9]/g, '');
    if (nip) return nip.toLowerCase();
    const em = String(u.email || '').trim().toLowerCase();
    if (em && !/@pengawas\.local$/.test(em)) return em;
    return '';
  }
  function passwordHashOf(u) { return (u && u.serverHash) ? String(u.serverHash) : ''; }
  function canSync() {
    const c = cfg();
    if (!c.url || !c.key) return false;
    const u = currentUser();
    if (!u || u.role === 'admin') return false;
    // VPS butuh token hasil login, bukan hash.
    return !!(usernameOf(u) && vpsToken());
  }
  function userPrefix(u) { return Store.PREFIX + 'u_' + (u ? u.id : '_anon_') + '_'; }
  function localKeyFor(u, scope, periode) {
    const p = parseInt(periode, 10) || 0;
    return userPrefix(u) + scope + (p > 0 ? '_' + p : '');
  }

  // ---------- meta (per-perangkat) ----------
  function readMeta() {
    try { return Store.getGlobal(META_SCOPE, {}) || {}; } catch (e) { return {}; }
  }
  function writeMeta(m) { try { Store.setGlobal(META_SCOPE, m); } catch (e) {} }
  function userMeta(meta, uk) {
    meta.users = meta.users || {};
    meta.users[uk] = meta.users[uk] || { scopes: {} };
    return meta.users[uk];
  }

  // ---------- RPC ----------
  // RPC ke VPS: apikey = anon key, Authorization = token user.
  // Wajib Content-Profile: edusmart (schema non-public).
  async function rpc(fn, args) {
    const c = cfg();
    const tok = vpsToken();
    if (!c.url || !tok) { _status.lastError = 'no-token'; return null; }
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(c.url.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, {
        method: 'POST',
        headers: {
          apikey: c.key,
          Authorization: 'Bearer ' + tok,
          'Content-Type': 'application/json',
          'Content-Profile': 'edusmart',
        },
        body: JSON.stringify(args || {}),
        signal: ctrl.signal,
      });
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        console.warn('[CloudSync] rpc', fn, r.status, t.slice(0, 200));
        // 401 = token kedaluwarsa/ditolak -> minta login ulang, JANGAN diam.
        if (r.status === 401) {
          _status.lastError = 'token-expired';
          _status.state = 'need-relogin';
        } else {
          _status.lastError = 'http-' + r.status;
        }
        return null;
      }
      const out = await r.json();
      if (out && out.ok === false && /token tidak valid/i.test(out.error || '')) {
        _status.lastError = 'token-expired';
        _status.state = 'need-relogin';
        return null;
      }
      return out;
    } catch (e) {
      console.warn('[CloudSync] rpc', fn, 'error:', e.message);
      _status.lastError = e.message;
      return null;
    } finally { clearTimeout(to); }
  }

  // RPC ke server LAMA — hanya dipakai saat migrasi data warisan.
  async function legacyRpc(fn, args) {
    const c = legacyCfg();
    if (!c.url || !c.key) return null;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 20000);
    try {
      const r = await fetch(c.url.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, {
        method: 'POST',
        headers: { apikey: c.key, Authorization: 'Bearer ' + c.key, 'Content-Type': 'application/json' },
        body: JSON.stringify(args || {}),
        signal: ctrl.signal,
      });
      if (!r.ok) return null;
      return await r.json();
    } catch (e) {
      console.warn('[CloudSync] legacyRpc', fn, 'error:', e.message);
      return null;
    } finally { clearTimeout(to); }
  }

  // ---------- scan lokal ----------
  function scanLocal(u) {
    const prefix = userPrefix(u);
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const tail = k.slice(prefix.length);
      const m = /^(master_rhk|kegiatan|eviden)_(\d{4})$/.exec(tail);
      const scope = m ? m[1] : tail;
      const periode = m ? parseInt(m[2], 10) : 0;
      let value = null;
      try { value = JSON.parse(localStorage.getItem(k)); } catch (e) { continue; }
      out.push({ scope: scope, periode: periode, value: value });
    }
    return out;
  }
  function safeParse(raw) { try { return JSON.parse(raw); } catch (e) { return null; } }

  // ---------- kirim ----------
  async function flush() {
    if (_busy) { _pendingFlush = true; return; }
    if (!canSync() || !_queue.size) return;
    _busy = true;
    const u = currentUser();
    const uk = usernameOf(u);
    const meta = readMeta();
    const um = userMeta(meta, uk);
    const items = Array.from(_queue.entries());
    _queue.clear();
    let ok = 0;
    for (const [k, v] of items) {
      const parts = k.split('|');
      const scope = parts[0];
      const periode = parseInt(parts[1], 10) || 0;
      const res = await rpc('fn_data_set', {
        p_scope: scope, p_periode: periode, p_payload: v,
        p_device: (navigator.userAgent || '').slice(0, 60),
      });
      if (res && res.ok === true) {
        ok++;
        um.scopes[k] = { at: res.updated_at || new Date().toISOString() };
      } else {
        // gagal -> kembalikan ke antrean, jangan hilang
        _queue.set(k, v);
      }
    }
    writeMeta(meta);
    _status.pushed += ok;
    _status.lastAt = new Date().toISOString();
    _status.state = ok ? 'ok' : 'error';
    _busy = false;
    if (_pendingFlush || _queue.size) { _pendingFlush = false; schedule(); }
  }
  function schedule() {
    if (_timer) clearTimeout(_timer);
    _timer = setTimeout(() => { _timer = null; flush(); }, DEBOUNCE_MS);
  }

  // Hook dipanggil Store.set() setiap penyimpanan sukses.
  function onSet(scope, value) {
    if (!canSync()) return;
    let periode = 0;
    if (window.Store && Store.isPeriodic && Store.isPeriodic(scope)) {
      periode = parseInt(Store.activePeriode(), 10) || 0;
    }
    _queue.set(scope + '|' + periode, value);
    schedule();
  }

  // ---------- tarik ----------
  async function hydrate() {
    if (!canSync()) return { ok: false, reason: 'not-applicable' };
    const u = currentUser();
    const uk = usernameOf(u);
    const res = await rpc('fn_data_get', {});
    if (!res || res.ok !== true) {
      _status.state = (_status.state === 'need-relogin') ? 'need-relogin' : 'error';
      return { ok: false, reason: _status.lastError || 'network' };
    }
    const rows = Array.isArray(res.rows) ? res.rows : [];
    const meta = readMeta();
    const um = userMeta(meta, uk);
    const sc = um.scopes;
    const cloudKeys = new Set();
    let applied = 0;

    for (const row of rows) {
      const scope = String(row.scope || '');
      const periode = parseInt(row.periode, 10) || 0;
      if (!scope) continue;
      const k = scope + '|' + periode;
      cloudKeys.add(k);
      const localKey = localKeyFor(u, scope, periode);
      const localRaw = localStorage.getItem(localKey);
      const localVal = localRaw ? safeParse(localRaw) : null;
      const cloudVal = row.payload;
      const same = localRaw !== null && JSON.stringify(localVal) === JSON.stringify(cloudVal);
      if (same) { sc[k] = { at: row.updated_at }; continue; }

      const lastSynced = sc[k] && sc[k].at ? sc[k].at : null;
      const serverNewer = !!(lastSynced && row.updated_at &&
        new Date(row.updated_at).getTime() > new Date(lastSynced).getTime());

      if (localRaw === null) {
        // perangkat baru tanpa data lokal → ambil dari cloud
        localStorage.setItem(localKey, JSON.stringify(cloudVal));
        sc[k] = { at: row.updated_at }; applied++;
      } else if (serverNewer) {
        // perangkat lain sudah memperbarui → pakai versi server
        localStorage.setItem(localKey, JSON.stringify(cloudVal));
        sc[k] = { at: row.updated_at }; applied++;
      } else {
        // lokal lebih baru / belum pernah tersinkron → dorong lokal ke cloud
        _queue.set(k, localVal);
      }
    }

    // Key lokal yang belum ada di cloud (akun lama / data baru) → dorong ke cloud
    for (const it of scanLocal(u)) {
      const k = it.scope + '|' + it.periode;
      if (!cloudKeys.has(k)) _queue.set(k, it.value);
    }

    writeMeta(meta);
    _status.pulled += rows.length;
    _status.applied += applied;
    _status.state = 'ok';
    _status.lastAt = new Date().toISOString();
    if (_queue.size) schedule();
    return { ok: true, pulled: rows.length, applied: applied };
  }

  // ---------- watcher & boot ----------

  // =============================================================
  // MIGRASI DATA WARISAN: server lama -> VPS (sekali per akun)
  // =============================================================
  // Dijalankan otomatis setelah login sukses via VPS.
  // Urutan sengaja: SALIN DULU ke file, baru sentuh apa pun.
  //
  // Aturan penggabungan: data LOKAL menang. Server lama hanya mengisi
  // bagian yang TIDAK ada di perangkat ini (mis. user pernah pakai
  // laptop lain). Jadi tidak mungkin menimpa kerja terbaru user.
  //
  // Gagal di tengah -> TIDAK ditandai selesai, dicoba lagi saat login
  // berikutnya. Tidak ada kondisi setengah jalan yang dianggap beres.
  const MIG_KEY = '***';

  function migDone(uk) {
    try {
      const raw = localStorage.getItem(MIG_KEY);
      const o = raw ? JSON.parse(raw) : {};
      return !!(o && o[uk]);
    } catch (e) { return false; }
  }
  function setMigDone(uk, info) {
    try {
      const raw = localStorage.getItem(MIG_KEY);
      const o = raw ? JSON.parse(raw) : {};
      o[uk] = Object.assign({ at: new Date().toISOString() }, info || {});
      localStorage.setItem(MIG_KEY, JSON.stringify(o));
    } catch (e) {}
  }

  // Unduh salinan data lokal sebagai file — jaring aman nyata di tangan user.
  function unduhSalinanLokal(u, tag) {
    try {
      const bundle = { aplikasi: 'e-RHK', akun: usernameOf(u), dibuat: new Date().toISOString(), data: {} };
      for (const it of scanLocal(u)) {
        bundle.data[it.scope + (it.periode ? '_' + it.periode : '')] = it.value;
      }
      if (!Object.keys(bundle.data).length) return false;
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'erhk-backup-' + (usernameOf(u) || 'akun') + '-' + (tag || 'migrasi') + '.json';
      document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
      return true;
    } catch (e) { console.warn('[CloudSync] unduh salinan gagal:', e.message); return false; }
  }

  async function migrateLegacyToVps(opts) {
    opts = opts || {};
    const u = currentUser();
    const uk = usernameOf(u);
    if (!u || !uk || u.role === 'admin') return { ok: false, reason: 'not-applicable' };
    if (!vpsToken()) return { ok: false, reason: 'no-token' };
    if (!opts.force && migDone(uk)) return { ok: true, reason: 'already', skipped: true };

    _status.state = 'migrating';
    const lap = { diambil_dari_lama: 0, dikirim_ke_vps: 0, dilewati: 0 };

    // 0) Salinan lokal dulu — sebelum apa pun berubah.
    lap.salinan_terunduh = unduhSalinanLokal(u, 'sebelum-migrasi');

    // 1) Apa yang sudah ada di VPS?
    const vpsRes = await rpc('fn_data_get', {});
    if (!vpsRes || vpsRes.ok !== true) {
      _status.state = 'error';
      return { ok: false, reason: 'vps-tak-terjangkau', lap: lap };
    }
    const adaDiVps = new Set((vpsRes.rows || []).map(function (r) {
      return r.scope + '|' + (parseInt(r.periode, 10) || 0);
    }));

    // 2) Kumpulkan data lokal (prioritas tertinggi)
    const gabungan = new Map();
    for (const it of scanLocal(u)) {
      gabungan.set(it.scope + '|' + it.periode, it.value);
    }

    // 3) Tarik data warisan dari server lama — hanya isi yang belum ada.
    //    Pakai serverHash yang tersimpan saat login (hash sha256 lama).
    const hash = passwordHashOf(u);
    if (hash) {
      const old = await legacyRpc('user_data_get', {
        p_app_slug: APP_SLUG, p_username: uk, p_password_hash: hash,
      });
      if (old && old.success === true && Array.isArray(old.rows)) {
        lap.diambil_dari_lama = old.rows.length;
        for (const row of old.rows) {
          const scope = String(row.scope || '');
          if (!scope) continue;
          const k = scope + '|' + (parseInt(row.periode, 10) || 0);
          if (gabungan.has(k)) { lap.dilewati++; continue; }   // lokal menang
          gabungan.set(k, row.payload);
        }
      } else {
        lap.lama_tak_terjangkau = true;   // bukan penggagal: mungkin user baru
      }
    }

    // 4) Kirim ke VPS semua yang belum ada di sana
    let gagal = 0;
    for (const [k, v] of gabungan.entries()) {
      if (adaDiVps.has(k)) continue;
      const parts = k.split('|');
      const res = await rpc('fn_data_set', {
        p_scope: parts[0], p_periode: parseInt(parts[1], 10) || 0, p_payload: v,
        p_device: 'migrasi',
      });
      if (res && res.ok === true) lap.dikirim_ke_vps++; else gagal++;
    }

    if (gagal > 0) {
      _status.state = 'error';
      return { ok: false, reason: 'sebagian-gagal', gagal: gagal, lap: lap };
    }

    // 5) Backup snapshot pertama di VPS (jalur kedua, jaring aman)
    try {
      const snapshot = {};
      for (const [k, v] of gabungan.entries()) snapshot[k] = v;
      if (Object.keys(snapshot).length) {
        await rpc('fn_backup_push', { p_payload: snapshot, p_device: 'migrasi-awal' });
      }
    } catch (e) {}

    // 6) Tandai selesai — di perangkat DAN di server
    await rpc('fn_mark_migrated', { p_note: 'bagian=' + lap.dikirim_ke_vps });
    setMigDone(uk, lap);

    _status.state = 'ok';
    _status.lastAt = new Date().toISOString();
    return { ok: true, lap: lap };
  }

  // Backup manual: snapshot ke VPS + salinan file ke perangkat (dua jalur).
  async function backupSekarang() {
    const u = currentUser();
    if (!u) return { ok: false, reason: 'belum-login' };
    const snapshot = {};
    for (const it of scanLocal(u)) {
      snapshot[it.scope + '|' + it.periode] = it.value;
    }
    const keFile = unduhSalinanLokal(u, 'backup');
    let keVps = false;
    if (vpsToken() && Object.keys(snapshot).length) {
      const r = await rpc('fn_backup_push', { p_payload: snapshot, p_device: 'manual' });
      keVps = !!(r && r.ok === true);
    }
    return { ok: (keFile || keVps), ke_file: keFile, ke_vps: keVps };
  }

  // =============================================================
  // INDIKATOR UI: badge status penyimpanan di topbar
  // =============================================================
  // Tujuan: user tahu datanya tersimpan di server TANPA perlu buka
  // Console. 38 pengawas tidak akan pernah membuka Console.
  //
  // Keadaan yang ditampilkan:
  //   hijau  "Tersimpan"      -> semua perubahan sudah di server
  //   kuning "Menyimpan…"     -> masih ada antrean
  //   merah  "Perlu login"    -> token kedaluwarsa, data belum aman
  //   abu    "Lokal saja"     -> belum login VPS / admin
  function badgeState() {
    const u = currentUser();
    if (!u || u.role === 'admin') return { cls: 'bg-secondary', icon: 'cloud-slash', text: 'Lokal', title: 'Mode lokal — data hanya di perangkat ini.' };
    if (_status.state === 'need-relogin') {
      return { cls: 'bg-danger', icon: 'exclamation-triangle', text: 'Perlu login',
               title: 'Sesi server berakhir. Keluar lalu masuk lagi agar data tersimpan ke server.' };
    }
    if (!canSync()) {
      return { cls: 'bg-secondary', icon: 'cloud-slash', text: 'Lokal saja',
               title: 'Belum terhubung ke server. Data tersimpan di perangkat ini.' };
    }
    if (_status.state === 'migrating') {
      return { cls: 'bg-info text-dark', icon: 'arrow-repeat', text: 'Memindahkan…',
               title: 'Memindahkan data ke server baru.' };
    }
    if (_queue.size > 0 || _busy) {
      return { cls: 'bg-warning text-dark', icon: 'arrow-repeat', text: 'Menyimpan…',
               title: _queue.size + ' perubahan sedang dikirim ke server.' };
    }
    if (_status.state === 'error') {
      return { cls: 'bg-warning text-dark', icon: 'wifi-off', text: 'Tertunda',
               title: 'Server belum bisa dihubungi. Data aman di perangkat, akan dikirim otomatis.' };
    }
    if (_status.state === 'ok') {
      const sisa = (window.SupabaseSync && SupabaseSync.vpsTokenSisaJam) ? SupabaseSync.vpsTokenSisaJam() : null;
      const ket = (sisa !== null && sisa < 48) ? ' (sesi akan diperpanjang)' : '';
      return { cls: 'bg-success', icon: 'cloud-check', text: 'Tersimpan',
               title: 'Semua perubahan sudah tersimpan di server.' + ket };
    }
    return { cls: 'bg-secondary', icon: 'cloud', text: 'Siap', title: 'Menunggu perubahan.' };
  }

  function gambarBadge() {
    const el = document.getElementById('syncBadge');
    if (!el) return;
    const s = badgeState();
    el.className = 'badge ' + s.cls + ' me-2';
    el.title = s.title;
    const ic = el.querySelector('i');
    if (ic) ic.className = 'bi bi-' + s.icon;
    const tx = document.getElementById('syncBadgeText');
    if (tx) tx.textContent = s.text;
  }

  // Panel ringkas saat badge diklik — pengganti Console untuk user biasa.
  function bukaPanelSync() {
    const u = currentUser();
    const uk = usernameOf(u);
    const sisa = (window.SupabaseSync && SupabaseSync.vpsTokenSisaJam) ? SupabaseSync.vpsTokenSisaJam() : null;
    const s = badgeState();
    const baris = function (k, v) {
      return '<div class="d-flex justify-content-between border-bottom py-2"><span class="text-muted">' +
        k + '</span><span class="fw-semibold text-end">' + v + '</span></div>';
    };
    const html =
      '<div class="small">' +
      baris('Status', '<span class="badge ' + s.cls + '">' + s.text + '</span>') +
      baris('Akun', uk || '-') +
      baris('Menunggu dikirim', _queue.size + ' perubahan') +
      baris('Terakhir tersimpan', _status.lastAt ? new Date(_status.lastAt).toLocaleString('id-ID') : 'belum ada') +
      baris('Data dipindahkan', migDone(uk) ? 'sudah' : 'belum') +
      baris('Sesi server', sisa === null ? 'belum login server' :
            (sisa <= 0 ? 'berakhir' : Math.round(sisa) + ' jam lagi')) +
      '<p class="text-muted mt-3 mb-2">Data selalu tersimpan di perangkat ini lebih dulu, ' +
      'lalu dikirim ke server sebagai cadangan. Aplikasi tetap bisa dipakai walau server sedang bermasalah.</p>' +
      '<div class="d-grid gap-2">' +
      '<button class="btn btn-success btn-sm" id="btnBackupSekarang"><i class="bi bi-cloud-arrow-up"></i> Cadangkan sekarang</button>' +
      '<button class="btn btn-outline-secondary btn-sm" id="btnUnduhSalinan"><i class="bi bi-download"></i> Unduh salinan data (file)</button>' +
      '</div></div>';

    UI.showModal('Penyimpanan & Cadangan', html, {
      onMount: function (body, close) {
        const b1 = body.querySelector('#btnBackupSekarang');
        const b2 = body.querySelector('#btnUnduhSalinan');
        if (b1) b1.onclick = async function () {
          b1.disabled = true;
          b1.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Mencadangkan…';
          try { await flush(); } catch (e) {}
          const r = await backupSekarang();
          gambarBadge();
          close();
          if (r && r.ok) {
            UI.toast(r.ke_vps ? 'Cadangan tersimpan di server dan file terunduh.'
                              : 'File cadangan terunduh. Server belum bisa dihubungi.',
                     r.ke_vps ? 'success' : 'warning');
          } else {
            UI.toast('Pencadangan belum berhasil. Coba lagi nanti.', 'danger');
          }
        };
        if (b2) b2.onclick = function () {
          const ok = unduhSalinanLokal(currentUser(), 'manual');
          UI.toast(ok ? 'Salinan data terunduh.' : 'Belum ada data untuk diunduh.',
                   ok ? 'success' : 'warning');
        };
      },
    });
  }

  function pasangBadge() {
    const el = document.getElementById('syncBadge');
    if (!el) return;
    el.onclick = bukaPanelSync;
    gambarBadge();
  }

  function refresh() {
    try { if (window.Router && Router.dispatch) Router.dispatch(); } catch (e) {}
  }

  // =============================================================
  // JAGA TOKEN: perpanjang sebelum kedaluwarsa
  // =============================================================
  // Token berlaku 7 hari. Tanpa perpanjangan, penyimpanan ke VPS
  // berhenti diam-diam dan user tidak sadar datanya tidak tersimpan.
  // Diperpanjang bila sisa umur < 48 jam.
  async function jagaToken() {
    try {
      const S = window.SupabaseSync || {};
      if (!S.vpsTokenSisaJam || !S.vpsRefreshToken) return false;
      const sisa = S.vpsTokenSisaJam();
      if (sisa === null) return false;          // belum login via VPS
      if (sisa > TOKEN_REFRESH_IF_LESS_H) return false;  // masih lama
      const ok = await S.vpsRefreshToken();
      if (ok) {
        if (_status.state === 'need-relogin') _status.state = 'ok';
        _status.lastError = null;
        console.info('[CloudSync] token diperpanjang');
      } else {
        _status.state = 'need-relogin';
        _status.lastError = 'token-expired';
      }
      return ok;
    } catch (e) { return false; }
  }
  function watchUser() {
    const ok = canSync();
    const u = ok ? currentUser() : null;
    const key = u ? (u.id + '|' + usernameOf(u)) : '';
    if (key && key !== _lastUserKey) {
      _lastUserKey = key;
      hydrate().then(r => { if (r && r.ok && r.applied) refresh(); });
      return true;
    }
    if (!key) _lastUserKey = '';
    return false;
  }
  function start() {
    if (window.Store && Store.onSet) Store.onSet(onSet);
    window.addEventListener('online', () => { _lastUserKey = ''; jagaToken().then(watchUser); });
    jagaToken().then(watchUser);
    setInterval(watchUser, WATCH_MS);
    // Jaga token tiap 30 menit. Token TTL 7 hari; kalau sisa < 48 jam
    // diperpanjang diam-diam supaya penyimpanan tidak berhenti mendadak.
    setInterval(jagaToken, TOKEN_CHECK_MS);
    // Segarkan badge berkala supaya status tidak basi.
    setInterval(gambarBadge, 3000);
  }

  window.CloudSync = {
    start: start,
    hydrate: hydrate,
    flush: flush,
    afterLogin: function () {
      _lastUserKey = '';
      // Migrasi dulu (sekali per akun), baru sinkron normal.
      migrateLegacyToVps().then(function (r) {
        if (r && r.ok && r.lap && r.lap.dikirim_ke_vps) {
          console.info('[CloudSync] migrasi selesai:', r.lap);
        }
        watchUser();
      }).catch(function () { watchUser(); });
    },
    canSync: canSync,
    usernameOf: usernameOf,
    status: function () { return Object.assign({}, _status, { queued: _queue.size }); },
    // === token ===
    jagaToken: jagaToken,
    tokenSisaJam: function () {
      try {
        const S = window.SupabaseSync || {};
        return S.vpsTokenSisaJam ? S.vpsTokenSisaJam() : null;
      } catch (e) { return null; }
    },
    // === migrasi & backup (dipanggil UI / Console) ===
    migrateLegacyToVps: migrateLegacyToVps,
    sudahMigrasi: function () { return migDone(usernameOf(currentUser())); },
    backupSekarang: backupSekarang,
    unduhSalinanLokal: function () { return unduhSalinanLokal(currentUser(), 'manual'); },
    // === indikator UI ===
    pasangBadge: pasangBadge,
    gambarBadge: gambarBadge,
    bukaPanelSync: bukaPanelSync,
  };
})();
