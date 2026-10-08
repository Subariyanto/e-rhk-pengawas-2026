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

  // ==== Terbitkan kode LANGSUNG di server Pusat Lisensi (cross-device) ====
  // Tanpa ini, kode buatan panel admin lokal hanya ada di gh-pages/localStorage
  // dan TIDAK bisa dipakai login dari perangkat lain (HP) karena server tak kenal kodenya.
  // Butuh admin key Pusat Lisensi (disimpan lokal di perangkat admin).

  // Daftarkan satu kode eksplisit (format persis dari panel, mis. FULL-XXXX-XXXX-XXXX).
  async function adminRegisterCode(adminKey, code, appSlug, tier, recipient, appName) {
    if (!adminKey) return { success: false, reason: 'no_admin_key' };
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
    return callPusatRpc('admin_revoke_code_by_code', {
      p_admin_key: adminKey, p_code: String(code || '').trim().toUpperCase(),
      p_app_slug: appSlug || PUSAT_APP_SLUG,
    });
  }

  async function adminDeleteCodeByCode(adminKey, code, appSlug) {
    if (!adminKey) return { success: false, reason: 'no_admin_key' };
    return callPusatRpc('admin_delete_code_by_code', {
      p_admin_key: adminKey, p_code: String(code || '').trim().toUpperCase(),
      p_app_slug: appSlug || PUSAT_APP_SLUG,
    });
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
    // Admin akun (panel Pusat Lisensi)
    adminListAccounts,
    adminRevokeAccount,
    adminReactivateAccount,
    adminDeleteAccount,
    adminResetAccountPassword,
    adminGetAccountStats,
    // Terbitkan/kelola kode langsung di server (cross-device)
    adminRegisterCode,
    adminRegisterCodes,
    adminRevokeCodeByCode,
    adminDeleteCodeByCode,
  };
})();
