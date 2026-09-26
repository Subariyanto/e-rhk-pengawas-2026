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

  let _queue = new Map();      // "scope|periode" -> value (JS object)
  let _timer = null;
  let _busy = false;
  let _pendingFlush = false;
  let _lastUserKey = '';
  let _status = { state: 'idle', lastAt: null, lastError: null, pulled: 0, applied: 0, pushed: 0 };

  // ---------- config & akun ----------
  function cfg() {
    const S = window.SupabaseSync || {};
    return { url: S.PUSAT_URL || S.SUPABASE_URL || '', key: S.PUSAT_ANON_KEY || S.SUPABASE_ANON_KEY || '' };
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
    return !!(usernameOf(u) && passwordHashOf(u));
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
  async function rpc(fn, args) {
    const c = cfg();
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await fetch(c.url.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, {
        method: 'POST',
        headers: { apikey: c.key, Authorization: 'Bearer ' + c.key, 'Content-Type': 'application/json' },
        body: JSON.stringify(args || {}),
        signal: ctrl.signal,
      });
      if (!r.ok) {
        const t = await r.text().catch(() => '');
        console.warn('[CloudSync] rpc', fn, r.status, t.slice(0, 200));
        _status.lastError = 'http-' + r.status;
        return null;
      }
      return await r.json();
    } catch (e) {
      console.warn('[CloudSync] rpc', fn, 'error:', e.message);
      _status.lastError = e.message;
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
      const res = await rpc('user_data_set', {
        p_app_slug: APP_SLUG, p_username: uk, p_password_hash: passwordHashOf(u),
        p_scope: scope, p_periode: periode, p_payload: v,
      });
      if (res && res.success === true) {
        ok++;
        um.scopes[k] = { at: res.updated_at || new Date().toISOString() };
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
    const res = await rpc('user_data_get', {
      p_app_slug: APP_SLUG, p_username: uk, p_password_hash: passwordHashOf(u),
    });
    if (!res || res.success !== true) {
      _status.state = 'error';
      return { ok: false, reason: (res && res.reason) || _status.lastError || 'network' };
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
  function refresh() {
    try { if (window.Router && Router.dispatch) Router.dispatch(); } catch (e) {}
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
    window.addEventListener('online', () => { _lastUserKey = ''; watchUser(); });
    watchUser();
    setInterval(watchUser, WATCH_MS);
  }

  window.CloudSync = {
    start: start,
    hydrate: hydrate,
    flush: flush,
    afterLogin: function () { _lastUserKey = ''; watchUser(); },
    canSync: canSync,
    usernameOf: usernameOf,
    status: function () { return Object.assign({}, _status, { queued: _queue.size }); },
  };
})();
