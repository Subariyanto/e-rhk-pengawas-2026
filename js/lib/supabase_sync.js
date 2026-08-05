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
          list[idx].usedBy = row.email || row.nip || row.nama;
          list[idx].usedAt = row.activated_at;
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

  window.SupabaseSync = {
    isConfigured,
    reportActivation,
    fetchUnprocessed,
    markProcessed,
    syncAdminInbox,
  };
})();
