// SupabaseSync — relay aktivasi dari HP user ke admin laptop via Supabase.
//
// Kenapa: GithubSync (PAT) cuma di admin browser, jadi HP user tidak bisa
// update kolom "Dipakai Oleh" di codes.json. Solusinya: HP user POST ke
// Supabase pakai anon key (RLS: INSERT-only). Admin laptop polling SELECT,
// merge ke local codes, lalu push lewat GithubSync seperti biasa.
//
// Setup tabel di Supabase (SQL Editor):
//
//   create table public.aktivasi_log (
//     id uuid primary key default gen_random_uuid(),
//     code text not null,
//     nama text not null,
//     nip text,
//     email text,
//     tier text,
//     device_info text,
//     activated_at timestamptz not null default now(),
//     processed_at timestamptz
//   );
//   create index on public.aktivasi_log (code);
//   create index on public.aktivasi_log (processed_at);
//   alter table public.aktivasi_log enable row level security;
//
//   -- HP user: cuma boleh INSERT (anon role)
//   create policy "anon insert"
//     on public.aktivasi_log for insert
//     to anon
//     with check (true);
//
//   -- Admin laptop: SELECT + UPDATE pakai anon juga (kita filter di app),
//   -- tapi karena anon key di-share, kita rely on processed_at flag saja.
//   -- Untuk lebih ketat nanti pakai service_role di admin (di-fetch via cron / proxy).
//   create policy "anon read"
//     on public.aktivasi_log for select
//     to anon
//     using (true);
//   create policy "anon update processed"
//     on public.aktivasi_log for update
//     to anon
//     using (true)
//     with check (true);
//
(function () {
  // === KONFIGURASI ===
  // Project Yanto: erhk-2026 (region ap-southeast-1, Singapore).
  // Publishable key boleh di-deploy ke browser (RLS yang melindungi).
  const SUPABASE_URL = 'https://setskebswnhfokfsorfj.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_bVcuJGs0k97BC18BkkgeYA_IOgDT16h';
  const TABLE = 'aktivasi_log';

  // === PUSAT LISENSI APLIKASI (verifikasi master code terpusat) ===
  // Kode master tidak disimpan di aplikasi; diverifikasi di server Pusat Lisensi.
  const PUSAT_URL = 'https://llaukzsztguwrtwdubpm.supabase.co';
  const PUSAT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsYXVrenN6dGd1d3J0d2R1YnBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTI1NDgsImV4cCI6MjEwMjc2ODU0OH0.DqKtA0aus9nOLViMEWjAPvYIAdLS_EKU3H8dYKe_Zhk';

  // =============================================================
  // === SERVER BARU: VPS EduSmartDigital (api.pokjawasjember.com)
  // =============================================================
  // Strategi migrasi: COBA VPS DULU, kalau gagal JATUH KE PUSAT LAMA.
  // Aplikasi lama tetap bisa dipakai client walau VPS bermasalah.
  //
  // Saklar runtime (tanpa deploy ulang) — jalankan di Console browser:
  //   localStorage.setItem('erhk_backend','vps')    -> paksa VPS saja
  //   localStorage.setItem('erhk_backend','legacy') -> paksa server lama
  //   localStorage.removeItem('erhk_backend')       -> otomatis (default)
  const VPS_URL = 'https://api.pokjawasjember.com';
  const VPS_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzkyOTkxMzgyLCJleHAiOjIxMDgzNTEzODJ9.PLdEjj-1BO106pt04M9Xg5Tlx2PuJIiskJRA1P10FlY';
  const VPS_APP_ID = 'e-rhk';            // app_id di skema VPS (bukan app_slug lama)
  const VPS_TOKEN_KEY = 'erhk_vps_token';
  const VPS_TIMEOUT_MS = 12000;

  function backendMode() {
    try { return localStorage.getItem('erhk_backend') || 'auto'; } catch (e) { return 'auto'; }
  }

  // === LATCH ANTI-FALLBACK (pengaman data) ===================
  // Begitu sebuah akun PERNAH berhasil login via VPS, akun itu dianggap
  // sudah pindah. Sejak saat itu DILARANG fallback diam-diam ke server
  // lama, karena server lama tidak punya data terbaru milik user.
  //
  // Kalau VPS sedang mati, user HARUS lihat error jujur "server sedang
  // bermasalah" — bukan diam-diam dilempar ke data lama yang bikin dia
  // merasa datanya hilang lalu panik.
  const VPS_MIGRATED_KEY = 'erhk_vps_users';

  function vpsMigratedUsers() {
    try {
      const raw = localStorage.getItem(VPS_MIGRATED_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function isVpsMigrated(username) {
    const u = String(username || '').trim().toLowerCase();
    return !!u && vpsMigratedUsers().indexOf(u) !== -1;
  }
  function markVpsMigrated(username) {
    const u = String(username || '').trim().toLowerCase();
    if (!u) return;
    try {
      const arr = vpsMigratedUsers();
      if (arr.indexOf(u) === -1) {
        arr.push(u);
        localStorage.setItem(VPS_MIGRATED_KEY, JSON.stringify(arr));
      }
    } catch (e) {}
  }
  // Pelepas darurat (hanya kalau Yanto memang mau mundur ke server lama):
  //   SupabaseSync.resetVpsLatch()
  function resetVpsLatch() {
    try { localStorage.removeItem(VPS_MIGRATED_KEY); } catch (e) {}
  }

  // Info diagnosa buat Console browser: SupabaseSync.backendInfo()
  function backendInfo() {
    return {
      mode: backendMode(),
      vps_url: VPS_URL,
      app_id: VPS_APP_ID,
      akun_sudah_pindah_vps: vpsMigratedUsers(),
      ada_token_vps: !!vpsGetToken(),
    };
  }

  function vpsSaveToken(tok) {
    try { if (tok) localStorage.setItem(VPS_TOKEN_KEY, tok); } catch (e) {}
  }
  function vpsGetToken() {
    try { return localStorage.getItem(VPS_TOKEN_KEY) || ''; } catch (e) { return ''; }
  }
  function vpsClearToken() {
    try { localStorage.removeItem(VPS_TOKEN_KEY); } catch (e) {}
  }

  // POST ke VPS. Return { httpOk, status, data } | { netError:true }
  async function vpsPost(path, body, authToken) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), VPS_TIMEOUT_MS);
      const h = { 'Content-Type': 'application/json', apikey: VPS_ANON_KEY };
      // apikey WAJIB anon key; token user hanya di Authorization.
      h.Authorization = 'Bearer ' + (authToken || VPS_ANON_KEY);
      const r = await fetch(VPS_URL + path, {
        method: 'POST', headers: h,
        body: JSON.stringify(body || {}), signal: ctrl.signal,
      });
      clearTimeout(to);
      let data = null;
      try { data = await r.json(); } catch (e) {}
      return { httpOk: r.ok, status: r.status, data: data };
    } catch (e) {
      console.warn('[VPS] ' + path + ' network:', e.message);
      return { netError: true };
    }
  }

  // Login ke VPS pakai PASSWORD ASLI (bukan hash).
  // Server yang menghitung & memverifikasi, lalu hash naik ke bcrypt otomatis.
  // Return { valid:true, ...profil } | { valid:false, reason } | { valid:null } offline
  async function vpsLogin(username, password) {
    const res = await vpsPost('/functions/v1/edusmart-auth/login', {
      app_id: VPS_APP_ID,
      username: String(username || '').trim().toLowerCase(),
      password: String(password || ''),
    });
    if (res.netError) return { valid: null, reason: 'network_error' };
    const d = res.data || {};
    if (!d.ok) return { valid: false, reason: d.error || 'invalid_credentials' };
    vpsSaveToken(d.token);
    return {
      valid: true, reason: 'ok', source: 'vps',
      username: d.username || username,
      fullname: d.fullname || '',
      madrasah: d.madrasah || '',
      role: d.role || 'user',
      tier: d.tier || 'pro',
      license_code: d.license_code || null,
    };
  }

  // Aktivasi/registrasi akun di VPS (1 kode = 1 akun).
  async function vpsActivate(code, username, password, fullname, madrasah) {
    const res = await vpsPost('/functions/v1/edusmart-auth/activate', {
      app_id: VPS_APP_ID,
      code: String(code || '').trim().toUpperCase(),
      username: String(username || '').trim().toLowerCase(),
      password: String(password || ''),
      fullname: fullname || '',
      madrasah: madrasah || '',
    });
    if (res.netError) return { success: null, reason: 'network_error' };
    const d = res.data || {};
    if (!d.ok) return { success: false, reason: d.error || 'failed' };
    vpsSaveToken(d.token);
    return { success: true, reason: d.mode === 'register' ? 'claimed' : 'ok', source: 'vps' };
  }

  // Cek VPS hidup (dipakai indikator UI / diagnosa).
  async function vpsOnline() {
    const res = await vpsPost('/functions/v1/edusmart-auth/login',
      { app_id: VPS_APP_ID, username: '__ping__', password: '__ping__' });
    return !res.netError;
  }

  // Perpanjang token tanpa minta password lagi.
  // Token TTL 7 hari; tanpa ini penyimpanan ke VPS berhenti diam-diam
  // begitu token kedaluwarsa.
  // Return true kalau token berhasil diperbarui.
  async function vpsRefreshToken() {
    const tok = vpsGetToken();
    if (!tok) return false;
    const res = await vpsPost('/functions/v1/edusmart-auth/refresh', {}, tok);
    if (res.netError) return false;
    const d = res.data || {};
    if (d.ok && d.token) { vpsSaveToken(d.token); return true; }
    // Token sudah kedaluwarsa/dicabut -> buang, user perlu login ulang.
    if (res.status === 401) vpsClearToken();
    return false;
  }

  // Sisa umur token dalam jam (dibaca dari klaim exp). null kalau tak ada token.
  function vpsTokenSisaJam() {
    const t = vpsGetToken();
    if (!t) return null;
    try {
      const parts = t.split('.');
      if (parts.length < 2) return null;
      let p = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      while (p.length % 4) p += '=';
      const c = JSON.parse(atob(p));
      if (!c.exp) return null;
      return (c.exp * 1000 - Date.now()) / 3600000;
    } catch (e) { return null; }
  }

  function isConfigured() {
    return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
  }

  function endpoint(path) {
    return SUPABASE_URL.replace(/\/$/, '') + '/rest/v1/' + path;
  }

  function headers(extra) {
    return Object.assign({
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    }, extra || {});
  }

  // Verifikasi master/owner code ke pusat lisensi (SECURITY DEFINER RPC).
  // Kode asli TIDAK pernah disimpan di file aplikasi.
  // Return: { valid:true, tier, role } | { valid:false, reason }
  async function verifyMasterCode(code, appSlug) {
    try {
      const r = await fetch(PUSAT_URL.replace(/\/$/, '') + '/rest/v1/rpc/verify_master_code', {
        method: 'POST',
        headers: {
          apikey: PUSAT_ANON_KEY,
          Authorization: 'Bearer ' + PUSAT_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_app_slug: appSlug || 'e-rhk-pengawas', p_code: String(code || '').trim() }),
      });
      if (!r.ok) { console.warn('[SupabaseSync] verifyMasterCode http', r.status); return { valid: false, reason: 'network' }; }
      return await r.json();
    } catch (e) {
      console.warn('[SupabaseSync] verifyMasterCode error:', e.message);
      return { valid: false, reason: 'network' };
    }
  }

  // HP user → POST setelah aktivasi sukses.
  // Best-effort: kalau gagal, aktivasi tetap jalan (admin nanti update manual).
  async function reportActivation(payload) {
    if (!isConfigured()) return { ok: false, reason: 'not-configured' };
    try {
      const body = {
        code: String(payload.code || '').toUpperCase(),
        nama: String(payload.nama || ''),
        nip: payload.nip ? String(payload.nip) : null,
        email: payload.email ? String(payload.email).toLowerCase() : null,
        tier: payload.tier || 'full',
        device_info: payload.device_info || (navigator.userAgent || '').slice(0, 200),
      };
      const r = await fetch(endpoint(TABLE), {
        method: 'POST',
        headers: headers({ Prefer: 'return=minimal' }),
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const txt = await r.text();
        console.warn('[SupabaseSync] reportActivation failed:', r.status, txt);
        return { ok: false, reason: 'http-' + r.status };
      }
      return { ok: true };
    } catch (e) {
      console.warn('[SupabaseSync] reportActivation error:', e.message);
      return { ok: false, reason: 'network', error: e.message };
    }
  }

  // Admin laptop → SELECT semua row yang belum processed_at.
  async function fetchUnprocessed() {
    if (!isConfigured()) return [];
    try {
      // ?processed_at=is.null&order=activated_at.asc&limit=200
      const url = endpoint(TABLE) +
        '?processed_at=is.null&order=activated_at.asc&limit=200';
      const r = await fetch(url, { headers: headers() });
      if (!r.ok) {
        console.warn('[SupabaseSync] fetchUnprocessed failed:', r.status);
        return [];
      }
      return await r.json();
    } catch (e) {
      console.warn('[SupabaseSync] fetchUnprocessed error:', e.message);
      return [];
    }
  }

  // Mark row sebagai processed (dipanggil setelah merge ke local codes berhasil).
  async function markProcessed(ids) {
    if (!isConfigured() || !ids || !ids.length) return { ok: true, count: 0 };
    try {
      const inFilter = '(' + ids.map(x => '"' + x + '"').join(',') + ')';
      const url = endpoint(TABLE) + '?id=in.' + encodeURIComponent(inFilter);
      const r = await fetch(url, {
        method: 'PATCH',
        headers: headers({ Prefer: 'return=minimal' }),
        body: JSON.stringify({ processed_at: new Date().toISOString() }),
      });
      if (!r.ok) {
        const txt = await r.text();
        console.warn('[SupabaseSync] markProcessed failed:', r.status, txt);
        return { ok: false, reason: 'http-' + r.status };
      }
      return { ok: true, count: ids.length };
    } catch (e) {
      console.warn('[SupabaseSync] markProcessed error:', e.message);
      return { ok: false, error: e.message };
    }
  }

  // Workflow lengkap untuk admin: pull unprocessed → merge ke local codes →
  // push ke gh-pages → mark processed di Supabase.
  // Return { merged, pushed, processed, errors }.
  async function syncAdminInbox() {
    if (!isConfigured()) return { merged: 0, pushed: false, processed: 0, errors: ['not-configured'] };
    const errors = [];
    const rows = await fetchUnprocessed();
    if (!rows.length) return { merged: 0, pushed: false, processed: 0, errors };

    const list = (window.Codes && window.Codes.getCodes) ? window.Codes.getCodes() : [];
    const processedIds = [];
    let merged = 0;

    for (const row of rows) {
      const codeNorm = String(row.code || '').toUpperCase().trim();
      if (!codeNorm) { processedIds.push(row.id); continue; }
      const idx = list.findIndex(x => String(x.code || '').toUpperCase() === codeNorm);
      const noteParts = [row.nama];
      if (row.nip) noteParts.push('NIP ' + row.nip);
      if (row.email) noteParts.push(row.email);
      const noteText = noteParts.filter(Boolean).join(' · ') + ' · auto ' + new Date(row.activated_at).toLocaleDateString('id-ID');
      if (idx >= 0) {
        if (!list[idx].usedBy) {
          // Simpan identitas pemilik secara eksplisit supaya lintas perangkat & tampilan admin
          // tahu kode ini milik akun siapa (model 1 kode = 1 akun).
          list[idx].usedBy = row.email || row.nip || row.nama;
          list[idx].usedAt = row.activated_at;
          list[idx].ownerName = list[idx].ownerName || row.nama || '';
          list[idx].ownerNip = list[idx].ownerNip || row.nip || '';
          list[idx].ownerEmail = list[idx].ownerEmail || row.email || '';
        }
        // Selalu update note kalau belum di-set manual (atau auto-prefix).
        if (!list[idx].note || list[idx].note.startsWith('auto:') || list[idx].note === '') {
          list[idx].note = 'auto: ' + noteText;
        }
        merged++;
      }
      processedIds.push(row.id);
    }

    let pushed = false;
    if (merged > 0 && window.Codes && window.Codes.saveCodes) {
      window.Codes.saveCodes(list); // saveCodes auto-trigger GithubSync.scheduleSync
      pushed = true;
    }
    let processed = 0;
    if (processedIds.length) {
      const r = await markProcessed(processedIds);
      if (r.ok) processed = r.count || processedIds.length;
      else errors.push('markProcessed: ' + (r.reason || r.error || 'unknown'));
    }
    return { merged, pushed, processed, errors };
  }

  // ============================================================
  // RPC AKUN PUSAT LISENSI — model "1 kode = 1 AKUN" (login lintas perangkat)
  // Mengikuti pola PKKM. Akun hidup di server (tabel app_accounts),
  // sehingga akun yang sama bisa login dari perangkat mana pun.
  // Kode aktivasi tetap satu sumber di tabel `licenses` (dipakai bersama).
  // ============================================================
  const PUSAT_APP_SLUG = 'e-rhk-pengawas';
  const RPC_TIMEOUT_MS = 12000;

  function pusatHeaders() {
    return {
      apikey: PUSAT_ANON_KEY,
      Authorization: 'Bearer ' + PUSAT_ANON_KEY,
      'Content-Type': 'application/json',
    };
  }

  // Panggil RPC di Pusat Lisensi. Return objek hasil, atau null bila gagal jaringan.
  async function callPusatRpc(fn, args) {
    try {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), RPC_TIMEOUT_MS);
      const r = await fetch(PUSAT_URL.replace(/\/$/, '') + '/rest/v1/rpc/' + fn, {
        method: 'POST',
        headers: pusatHeaders(),
        body: JSON.stringify(args || {}),
        signal: ctrl.signal,
      });
      clearTimeout(to);
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        console.warn('[SupabaseSync] rpc', fn, 'http', r.status, txt.slice(0, 200));
        return null;
      }
      return await r.json();
    } catch (e) {
      console.warn('[SupabaseSync] rpc', fn, 'error:', e.message);
      return null;
    }
  }

  // Hash akun server: sha256(username.lower + ':' + password).
  // HARUS sama dengan yang dihitung server (migrasi 05 & PKKM).
  async function accountHash(username, password) {
    try {
      const enc = new TextEncoder().encode(
        String(username || '').trim().toLowerCase() + ':' + String(password || '')
      );
      const buf = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { return ''; }
  }

  // Klaim kode untuk 1 akun. Return { success, reason } atau { success:null, reason:'network_error' }.
  async function registerAccount(code, appSlug, username, passwordHash, fullname, madrasah, deviceInfo) {
    const r = await callPusatRpc('register_account', {
      p_code: String(code || '').trim().toUpperCase(),
      p_app_slug: appSlug || PUSAT_APP_SLUG,
      p_username: String(username || '').trim().toLowerCase(),
      p_password_hash: passwordHash,
      p_fullname: fullname || '',
      p_madrasah: madrasah || '',
      p_device_info: deviceInfo || (navigator.userAgent || '').slice(0, 200),
    });
    if (r === null) return { success: null, reason: 'network_error' };
    return r;
  }

  // Autentikasi akun. Return { valid, reason, fullname, madrasah, role, license_code, tier }
  // atau { valid:null, reason:'network_error' } bila offline.
  async function loginAccount(username, passwordHash, appSlug, deviceInfo) {
    const r = await callPusatRpc('login_account', {
      p_app_slug: appSlug || PUSAT_APP_SLUG,
      p_username: String(username || '').trim().toLowerCase(),
      p_password_hash: passwordHash,
      p_device_info: deviceInfo || (navigator.userAgent || '').slice(0, 200),
      p_touch: true,
    });
    if (r === null) return { valid: null, reason: 'network_error' };
    return r;
  }

  // =============================================================
  // LOGIN CERDAS: VPS dulu, fallback ke server lama
  // =============================================================
  // Butuh PASSWORD ASLI karena VPS memverifikasi di server (bcrypt).
  // Jalur lama tetap pakai hash supaya tidak ada perubahan perilaku.
  async function loginAccountSmart(username, password, appSlug, deviceInfo) {
    const mode = backendMode();
    const uname = String(username || '').trim().toLowerCase();

    // 1) Coba VPS (kecuali dipaksa legacy)
    if (mode !== 'legacy') {
      const v = await vpsLogin(uname, password);
      if (v.valid === true) {
        markVpsMigrated(uname);      // kunci: akun ini resmi di VPS
        return v;
      }
      if (mode === 'vps') return v;  // dipaksa VPS -> apa pun hasilnya, hormati

      // === PENGAMAN DATA ===
      // Akun ini sudah pernah sukses di VPS. Jangan pernah lempar diam-diam
      // ke server lama: datanya lebih tua, user akan merasa datanya hilang.
      if (isVpsMigrated(uname)) {
        if (v.valid === null) {
          return { valid: null, reason: 'vps_unreachable', source: 'vps',
                   message: 'Server sedang tidak dapat dihubungi. Data Anda aman di server, '
                          + 'silakan coba beberapa saat lagi.' };
        }
        // Password salah di VPS = memang salah. Jangan dicoba ke server lama.
        return { valid: false, reason: v.reason || 'invalid_credentials', source: 'vps' };
      }
      // Akun BELUM pernah sukses di VPS -> aman untuk fallback ke server lama.
    }

    // 2) Fallback: server lama (pakai hash seperti semula)
    const hash = await accountHash(uname, password);
    if (!hash) return { valid: null, reason: 'hash-fail' };
    const r = await loginAccount(uname, hash, appSlug, deviceInfo);
    if (r && r.valid === true) r.source = 'legacy';
    return r;
  }

  // Aktivasi cerdas: VPS dulu, fallback server lama.
  async function registerAccountSmart(code, appSlug, username, password, fullname, madrasah, deviceInfo) {
    const mode = backendMode();
    const uname = String(username || '').trim().toLowerCase();

    if (mode !== 'legacy') {
      const v = await vpsActivate(code, uname, password, fullname, madrasah);
      if (v.success === true) {
        markVpsMigrated(uname);      // akun baru lahir di VPS
        return v;
      }
      if (mode === 'vps') return v;
      // Akun yang sudah pindah tidak boleh didaftarkan ulang ke server lama.
      if (isVpsMigrated(uname)) return v;
    }

    const hash = await accountHash(uname, password);
    if (!hash) return { success: null, reason: 'hash-fail' };
    const r = await registerAccount(code, appSlug, uname, hash, fullname, madrasah, deviceInfo);
    if (r && r.success === true) r.source = 'legacy';
    return r;
  }

  // RPC admin akun (butuh admin key Pusat Lisensi). Dipakai panel Pusat Lisensi.
  function adminListAccounts(adminKey, appSlug) {
    return callPusatRpc('admin_list_accounts', { p_admin_key: adminKey, p_app_slug: appSlug || PUSAT_APP_SLUG });
  }
  function adminRevokeAccount(adminKey, accountId) {
    return callPusatRpc('admin_revoke_account', { p_admin_key: adminKey, p_account_id: accountId });
  }
  function adminReactivateAccount(adminKey, accountId) {
    return callPusatRpc('admin_reactivate_account', { p_admin_key: adminKey, p_account_id: accountId });
  }
  function adminDeleteAccount(adminKey, accountId) {
    return callPusatRpc('admin_delete_account', { p_admin_key: adminKey, p_account_id: accountId });
  }
  function adminResetAccountPassword(adminKey, accountId, newHash) {
    return callPusatRpc('admin_reset_account_password', {
      p_admin_key: adminKey, p_account_id: accountId, p_new_password_hash: newHash,
    });
  }
  function adminGetAccountStats(adminKey, appSlug) {
    return callPusatRpc('admin_get_account_stats', { p_admin_key: adminKey, p_app_slug: appSlug || PUSAT_APP_SLUG });
  }

  // Daftar kode + status aktivasi (username pemakai, nama, login terakhir).
  function adminListCodes(adminKey, appSlug) {
    return callPusatRpc('admin_list_codes', { p_admin_key: adminKey, p_app_slug: appSlug || PUSAT_APP_SLUG });
  }

  // ==== Terbitkan kode LANGSUNG di server Pusat Lisensi (cross-device) ====
  // Tanpa ini, kode buatan panel admin lokal hanya ada di gh-pages/localStorage
  // dan TIDAK bisa dipakai login dari perangkat lain (HP) karena server tak kenal kodenya.
  // Butuh admin key Pusat Lisensi (disimpan lokal di perangkat admin).

  // === VPS: sumber kebenaran kode aktivasi (aktivasi sudah ke VPS) ===
  // Admin Key sama dengan Pusat Lisensi; diverifikasi di DB VPS.
  // Return { success, count, reason, skipped_used }.
  async function vpsAdminCodes(adminKey, action, codes, tier) {
    if (!adminKey) return { success: false, reason: 'no_admin_key' };
    const res = await vpsPost('/functions/v1/edusmart-auth/admin-codes', {
      admin_key: adminKey, action: action, app_id: VPS_APP_ID,
      codes: (codes || []).map(c => String(c || '').trim().toUpperCase()),
      tier: tier || 'pro',
    });
    if (res.netError) return { success: null, reason: 'network_error' };
    const d = res.data || {};
    if (!d.ok) return { success: false, reason: d.error || ('http_' + res.status) };
    return { success: true, count: d.count, skipped_used: d.skipped_used || [], reason: 'ok' };
  }

  // Salinan ke server lama, best-effort. Dipertahankan supaya jalur
  // fallback lama tetap kenal kodenya. Gagal di sini tidak membatalkan apa pun.
  function legacyBestEffort(p) { p.catch(() => {}); }

  // Daftarkan satu kode eksplisit (format persis dari panel, mis. FULL-XXXX-XXXX-XXXX).
  async function adminRegisterCode(adminKey, code, appSlug, tier, recipient, appName) {
    if (!adminKey) return { success: false, reason: 'no_admin_key' };
    legacyBestEffort(legacyRegisterCode(adminKey, code, appSlug, tier, recipient, appName));
    return vpsAdminCodes(adminKey, 'register', [code], tier);
  }
  async function legacyRegisterCode(adminKey, code, appSlug, tier, recipient, appName) {
    const r = await callPusatRpc('admin_register_code', {
      p_admin_key: adminKey,
      p_code: String(code || '').trim().toUpperCase(),
      p_app_slug: appSlug || PUSAT_APP_SLUG,
      p_tier: tier || 'pro',
      p_recipient: recipient || '',
      p_app_name: appName || '',
    });
    if (r === null) return { success: null, reason: 'network_error' };
    return r;
  }

  // Daftarkan banyak kode sekaligus (batch).
  async function adminRegisterCodes(adminKey, codes, appSlug, tier, appName) {
    if (!adminKey) return { success: false, reason: 'no_admin_key' };
    legacyBestEffort(legacyRegisterCodes(adminKey, codes, appSlug, tier, appName));
    return vpsAdminCodes(adminKey, 'register', Array.isArray(codes) ? codes : [], tier);
  }
  async function legacyRegisterCodes(adminKey, codes, appSlug, tier, appName) {
    const r = await callPusatRpc('admin_register_codes', {
      p_admin_key: adminKey,
      p_codes: Array.isArray(codes) ? codes.map(c => String(c || '').trim().toUpperCase()) : [],
      p_app_slug: appSlug || PUSAT_APP_SLUG,
      p_tier: tier || 'pro',
      p_app_name: appName || '',
    });
    if (r === null) return { success: null, reason: 'network_error' };
    return r;
  }

  async function adminRevokeCodeByCode(adminKey, code, appSlug) {
    if (!adminKey) return { success: false, reason: 'no_admin_key' };
    legacyBestEffort(callPusatRpc('admin_revoke_code_by_code', {
      p_admin_key: adminKey, p_code: String(code || '').trim().toUpperCase(),
      p_app_slug: appSlug || PUSAT_APP_SLUG,
    }));
    const r = await vpsAdminCodes(adminKey, 'revoke', [code]);
    if (r.success && !r.count) return { success: false, reason: 'not_found' };
    return r;
  }

  async function adminDeleteCodeByCode(adminKey, code, appSlug) {
    if (!adminKey) return { success: false, reason: 'no_admin_key' };
    const r = await vpsAdminCodes(adminKey, 'delete', [code]);
    // Kode yang masih dipakai akun tidak dihapus di VPS -> jangan hapus juga di server lama.
    if (r.success && r.skipped_used && r.skipped_used.length) return { success: false, reason: 'has_account' };
    legacyBestEffort(callPusatRpc('admin_delete_code_by_code', {
      p_admin_key: adminKey, p_code: String(code || '').trim().toUpperCase(),
      p_app_slug: appSlug || PUSAT_APP_SLUG,
    }));
    if (r.success && !r.count) return { success: false, reason: 'not_found' };
    return r;
  }

  window.SupabaseSync = {
    isConfigured,
    verifyMasterCode,
    reportActivation,
    fetchUnprocessed,
    markProcessed,
    syncAdminInbox,
    // Konfigurasi project (URL + anon key publik, by design boleh di frontend)
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    PUSAT_URL,
    PUSAT_ANON_KEY,
    // Akun server (1 kode = 1 akun)
    APP_SLUG: PUSAT_APP_SLUG,
    accountHash,
    registerAccount,
    loginAccount,
    callPusatRpc,
    // === VPS EduSmartDigital (server baru) ===
    VPS_URL,
    VPS_ANON_KEY,
    VPS_APP_ID,
    backendMode,
    backendInfo,
    isVpsMigrated,
    resetVpsLatch,
    vpsLogin,
    vpsActivate,
    vpsOnline,
    vpsGetToken,
    vpsClearToken,
    vpsRefreshToken,
    vpsTokenSisaJam,
    // Jalur cerdas: VPS dulu, fallback server lama
    loginAccountSmart,
    registerAccountSmart,
    // Admin akun (panel Pusat Lisensi)
    adminListAccounts,
    adminRevokeAccount,
    adminReactivateAccount,
    adminDeleteAccount,
    adminResetAccountPassword,
    adminGetAccountStats,
    adminListCodes,
    // Terbitkan/kelola kode langsung di server (cross-device)
    adminRegisterCode,
    adminRegisterCodes,
    adminRevokeCodeByCode,
    adminDeleteCodeByCode,
  };
})();
