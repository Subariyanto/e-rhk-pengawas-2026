// Kode aktivasi tipe RANDOM (TRIAL/FULL) — selaras dengan supervisi-pm-kbc-jember.
// Catatan: ini berdampingan dengan KodeAktivasi (deterministik per-NIP) yang masih
// dipakai untuk 59 pengawas yang sudah dapat kode legacy.
//
// Storage key: erhk2026_activation_codes (via Store.setGlobal/getGlobal).
// Master code TIDAK lagi hard-coded di sini — diverifikasi di server via
// SupabaseSync.verifyMasterCode (RPC verify_master_code). Ganti/cabut dari server.
(function () {
  const STORE_KEY = 'activation_codes';
  const APP_SLUG = 'e-rhk-pengawas';

  // Sesudah verifikasi server sukses, kode master di-cache sementara di sesi ini
  // supaya pemakaian berikutnya sinkron (mis. consumeCode yang melewati master).
  const MASTER_CACHE_KEY = 'erhk2026_master_verified';

  function normCode(s) { return String(s || '').toUpperCase().replace(/\s+/g, '').trim(); }

  function getCodes() { return Store.getGlobal(STORE_KEY, []) || []; }

  // Debounce + serialize sync ke gh-pages (anti race condition).
  let _syncTimer = null;
  let _syncInFlight = null;
  let _syncQueued = false;
  function scheduleSync() {
    if (typeof window === 'undefined' || !window.GithubSync || !window.GithubSync.hasPAT()) return;
    if (_syncTimer) clearTimeout(_syncTimer);
    _syncTimer = setTimeout(async () => {
      _syncTimer = null;
      // Safety: jangan auto-push kalau local kosong tapi remote berisi (anti-wipe).
      const localCodes = getCodes();
      const remoteCodes = (typeof window !== 'undefined' && Array.isArray(window.REMOTE_CODES)) ? window.REMOTE_CODES : [];
      if (localCodes.length === 0 && remoteCodes.length > 0) {
        console.warn('[codes] auto-sync diblokir: local kosong tapi remote ada', remoteCodes.length, 'kode. Pakai tombol "Tarik dari gh-pages" dulu.');
        return;
      }
      // Kalau ada push yang masih jalan, mark queued biar dijalankan setelahnya.
      if (_syncInFlight) { _syncQueued = true; return; }
      try {
        _syncInFlight = window.GithubSync.pushIfConfigured(getCodes(), 'sync codes after admin op');
        await _syncInFlight;
      } finally {
        _syncInFlight = null;
        if (_syncQueued) {
          _syncQueued = false;
          scheduleSync();
        }
      }
    }, 800);
  }

  function saveCodes(list) {
    Store.setGlobal(STORE_KEY, list || []);
    // Auto-sync ke gh-pages kalau admin sudah set PAT (debounced + serialized).
    try { scheduleSync(); } catch (e) { console.warn('[codes] auto-sync skipped:', e.message); }
  }

  // Generate kode random format: PREFIX-XXXX-XXXX-XXXX
  // chars dipilih supaya gampang dibaca (tanpa O/0/I/1).
  function genCode(prefix) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const blk = (n) => {
      let s = '';
      for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
      return s;
    };
    const pfx = prefix ? String(prefix).toUpperCase() + '-' : 'FULL-';
    return pfx + blk(4) + '-' + blk(4) + '-' + blk(4);
  }

  // Cari kode di list random codes; juga deteksi MASTER code hardcoded + BUNDLED codes.
  // Return: null kalau tidak ada / sudah revoked / sudah dipakai (untuk non-master).
  // Untuk konsistensi, MASTER code selalu valid (master=true, tier='full').
  // --- Master code: verifikasi ke server, hasil di-cache per sesi ---
  // FALLBACK LOKAL (salted SHA-256): dipakai HANYA bila Pusat Lisensi tidak
  // terjangkau / RPC verify_master_code belum diterapkan di server.
  // Saat server tersedia, server tetap OTORITATIF (bisa revoke).
  // Untuk ganti master code: update hash di sini + jalankan admin_set_master_code di server.
  const MASTER_FALLBACK_HASH = {
    'e-rhk-pengawas': 'f425c2f485696753cc05ac5d6af24f9164b599f2491b8f55e537e94d53a24ff4',
  };
  const MASTER_FALLBACK_SALT = 'pjm-salt-v1-2026-9c4e1a7b3f8d2560';

  async function localMasterMatch(codeText) {
    const exp = MASTER_FALLBACK_HASH[APP_SLUG];
    if (!exp) return false;
    const cr = (typeof window !== 'undefined') ? window.crypto : null;
    if (!cr || !cr.subtle || typeof TextEncoder === 'undefined') return false;
    try {
      const data = new TextEncoder().encode(MASTER_FALLBACK_SALT + ':' + APP_SLUG + ':' + normCode(codeText));
      const buf = await cr.subtle.digest('SHA-256', data);
      const hex = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      return hex === exp;
    } catch (e) { return false; }
  }

  async function verifyMasterCode(codeText) {
    const c = normCode(codeText);
    if (!c) return { valid: false, reason: 'empty' };
    // 1) Server (otoritatif + bisa revoke)
    if (window.SupabaseSync && typeof window.SupabaseSync.verifyMasterCode === 'function') {
      try {
        const r = await window.SupabaseSync.verifyMasterCode(c, APP_SLUG);
        if (r && r.valid === true) {
          try { sessionStorage.setItem(MASTER_CACHE_KEY, c); } catch (e) {}
          return { valid: true, tier: r.tier || 'full', role: r.role || 'admin', master: true, via: 'server' };
        }
        // Server menjawab tegas invalid/revoked → hormati (jangan fallback).
        if (r && (r.reason === 'invalid' || r.reason === 'revoked')) {
          return { valid: false, reason: r.reason };
        }
        // reason 'network'/tak dikenal → lanjut ke fallback lokal.
      } catch (e) { /* lanjut fallback */ }
    }
    // 2) Fallback lokal (server tak tersedia / RPC belum diterapkan)
    if (await localMasterMatch(c)) {
      try { sessionStorage.setItem(MASTER_CACHE_KEY, c); } catch (e) {}
      return { valid: true, tier: 'full', role: 'admin', master: true, via: 'fallback' };
    }
    return { valid: false, reason: 'invalid' };
  }

  function isVerifiedMaster(codeText) {
    const c = normCode(codeText);
    if (!c) return false;
    try { return sessionStorage.getItem(MASTER_CACHE_KEY) === c; } catch (e) { return false; }
  }

  // Isi hasil cache sesi → bentuk objek master (dipakai findCode/findCodeAny/lookupAnywhere).
  function cachedMasterObject(codeText) {
    const c = normCode(codeText);
    return { code: c, tier: 'full', master: true, usedBy: null, _cached: true };
  }

  function findCode(codeText) {
    const c = normCode(codeText);
    if (!c) return null;
    if (isVerifiedMaster(c)) return cachedMasterObject(c);
    const list = getCodes();
    const localHit = list.find(x => normCode(x.code) === c && !x.usedBy && !x.revoked);
    if (localHit) return localHit;
    // Cek REMOTE codes (loaded dari gh-pages via GithubSync.refreshFromPublic).
    // REMOTE_CODES adalah source of truth untuk admin codes lintas device.
    const remote = (typeof window !== 'undefined' && Array.isArray(window.REMOTE_CODES)) ? window.REMOTE_CODES : [];
    const rHit = remote.find(x => normCode(x.code) === c && !x.usedBy && !x.revoked);
    if (rHit) {
      // Cek apakah kode ini sudah di-consume di localStorage user current
      const consumedHere = list.find(x => normCode(x.code) === c && x.usedBy);
      if (consumedHere) return null;
      return { code: rHit.code, tier: (rHit.tier || 'full').toLowerCase(), remote: true, usedBy: null };
    }
    // Cek BUNDLED codes (statis dari js/data/purchase_default.js, fallback)
    const bundled = (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_CODES)) ? window.BUNDLED_CODES : [];
    const bHit = bundled.find(x => normCode(x.code) === c);
    if (bHit) {
      const consumedHere = list.find(x => normCode(x.code) === c && x.usedBy);
      if (consumedHere) return null;
      return { code: bHit.code, tier: (bHit.tier || 'full').toLowerCase(), bundled: true, usedBy: null };
    }
    return null;
  }

  // Versi non-strict: cari kode tanpa filter usedBy/revoked (untuk admin tabel).
  function findCodeAny(codeText) {
    const c = normCode(codeText);
    if (!c) return null;
    if (isVerifiedMaster(c)) return cachedMasterObject(c);
    const list = getCodes();
    const localHit = list.find(x => normCode(x.code) === c);
    if (localHit) return localHit;
    const remote = (typeof window !== 'undefined' && Array.isArray(window.REMOTE_CODES)) ? window.REMOTE_CODES : [];
    const rHit = remote.find(x => normCode(x.code) === c);
    if (rHit) return { code: rHit.code, tier: (rHit.tier || 'full').toLowerCase(), remote: true, usedBy: rHit.usedBy || null, revoked: !!rHit.revoked };
    const bundled = (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_CODES)) ? window.BUNDLED_CODES : [];
    const bHit = bundled.find(x => normCode(x.code) === c);
    if (bHit) return { code: bHit.code, tier: (bHit.tier || 'full').toLowerCase(), bundled: true, usedBy: null };
    return null;
  }

  // ===== MODEL "1 KODE = 1 AKUN" (Opsi B) =====
  // Kode diikat ke sebuah IDENTITAS AKUN yang stabil lintas perangkat:
  //   - NIP (kalau ada)      → identik di semua perangkat
  //   - email (trial tanpa NIP)
  // Akun yang SAMA boleh memakai kembali kodenya di perangkat lain (re-klaim).
  // Akun LAIN tetap ditolak selama kode sudah diklaim (sampai admin revoke/hapus).

  // Normalisasi identitas akun → array kunci pembanding.
  function ownerKeysOf(o) {
    const keys = [];
    if (o == null) return keys;
    if (typeof o === 'object') {
      const nip = String(o.nip || '').replace(/[^0-9]/g, '');
      const email = String(o.email || '').trim().toLowerCase();
      if (nip) keys.push('nip:' + nip);
      if (email && email.indexOf('@') >= 0 && !email.endsWith('@pengawas.local')) keys.push('email:' + email);
      return keys;
    }
    const s = String(o).trim();
    if (!s) return keys;
    const low = s.toLowerCase();
    if (low.indexOf('nip:') === 0) {
      const d = low.slice(4).replace(/[^0-9]/g, '');
      if (d) keys.push('nip:' + d);
      return keys;
    }
    if (low.indexOf('email:') === 0) {
      const e = low.slice(6).replace(/^(nip|email):/, '');
      if (e && e.indexOf('@') >= 0 && !e.endsWith('@pengawas.local')) keys.push('email:' + e);
      return keys;
    }
    if (/^\d{8,}$/.test(s)) keys.push('nip:' + s);
    else if (s.indexOf('@') >= 0 && !low.endsWith('@pengawas.local')) keys.push('email:' + low);
    else keys.push('raw:' + low);
    return keys;
  }

  // Kunci identitas dari nilai usedBy (bisa userId lokal, email, atau NIP).
  function ownerKeysOfUsedBy(usedBy) {
    if (!usedBy) return [];
    try {
      const us = (window.Auth && Auth.listUsers) ? Auth.listUsers() : [];
      const u = us.find(x => x.id === usedBy);
      if (u) return ownerKeysOf(u);
    } catch (e) {}
    return ownerKeysOf(usedBy);
  }

  function isSameOwner(usedBy, user) {
    const a = ownerKeysOfUsedBy(usedBy);
    const b = ownerKeysOf(user);
    return a.length > 0 && b.length > 0 && a.some(k => b.indexOf(k) >= 0);
  }

  // Kunci identitas stabil untuk disimpan sebagai usedBy (lintas perangkat).
  function stableOwnerKey(user) {
    if (!user) return '';
    const nip = String(user.nip || '').replace(/[^0-9]/g, '');
    if (nip) return nip;
    const email = String(user.email || '').trim().toLowerCase();
    if (email && email.indexOf('@') >= 0 && !email.endsWith('@pengawas.local')) return email;
    return email || '';
  }

  // Cari kode di semua sumber (local → remote gh-pages → bundled), tanpa filter.
  function lookupAnywhere(codeText) {
    const c = normCode(codeText);
    if (!c) return null;
    if (isVerifiedMaster(c)) return cachedMasterObject(c);
    const list = getCodes();
    const local = list.find(x => normCode(x.code) === c);
    if (local) return local;
    const remote = (typeof window !== 'undefined' && Array.isArray(window.REMOTE_CODES)) ? window.REMOTE_CODES : [];
    const r = remote.find(x => normCode(x.code) === c);
    if (r) return r;
    const bundled = (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_CODES)) ? window.BUNDLED_CODES : [];
    const b = bundled.find(x => normCode(x.code) === c);
    if (b) return b;
    return null;
  }

  // Validasi kode untuk sebuah USER (akun):
  //   { ok:true, tier, code, master?, reclaim? } | { ok:false, reason, owner? }
  // reason: 'empty' | 'not-found' | 'revoked' | 'used-by-other'
  // Akun yang sama → ok (reclaim). Akun lain → 'used-by-other'.
  async function validateForUser(codeText, user) {
    const c = normCode(codeText);
    if (!c) return { ok: false, reason: 'empty' };
    if (isVerifiedMaster(c)) return { ok: true, tier: 'full', code: c, master: true };
    if (!c.startsWith('FULL-') && !c.startsWith('TRIAL-')) {
      const mv = await verifyMasterCode(c);
      if (mv.valid) return { ok: true, tier: mv.tier || 'full', code: c, master: true };
    }
    const hit = lookupAnywhere(c);
    if (!hit) return { ok: false, reason: 'not-found' };
    if (hit.revoked) return { ok: false, reason: 'revoked' };
    const tier = (hit.tier || 'full').toLowerCase();
    if (!hit.usedBy) return { ok: true, tier, code: hit.code };
    if (isSameOwner(hit.usedBy, user)) return { ok: true, tier, code: hit.code, reclaim: true };
    return { ok: false, reason: 'used-by-other', owner: hit.usedBy };
  }

  // Identifikasi kode + pemiliknya (dipakai alur "masuk dengan kode" di perangkat baru).
  //   { ok:true, claimed:boolean, tier, code, master?, owner:{nip,email,name} }
  //   { ok:false, reason:'empty'|'not-found'|'revoked' }
  async function identifyCode(codeText) {
    const c = normCode(codeText);
    if (!c) return { ok: false, reason: 'empty' };
    if (isVerifiedMaster(c)) return { ok: true, claimed: false, tier: 'full', code: c, master: true };
    if (!c.startsWith('FULL-') && !c.startsWith('TRIAL-')) {
      const mv = await verifyMasterCode(c);
      if (mv.valid) return { ok: true, claimed: false, tier: mv.tier || 'full', code: c, master: true };
    }
    const hit = lookupAnywhere(c);
    if (!hit) return { ok: false, reason: 'not-found' };
    if (hit.revoked) return { ok: false, reason: 'revoked' };
    const tier = (hit.tier || 'full').toLowerCase();
    if (!hit.usedBy) return { ok: true, claimed: false, tier, code: hit.code };
    const owner = { nip: hit.ownerNip || '', email: hit.ownerEmail || '', name: hit.ownerName || '' };
    try {
      const us = (window.Auth && Auth.listUsers) ? Auth.listUsers() : [];
      const u = us.find(x => x.id === hit.usedBy);
      if (u) {
        owner.nip = owner.nip || u.nip || '';
        owner.email = owner.email || u.email || '';
        owner.name = owner.name || u.nama || '';
      }
    } catch (e) {}
    if (!owner.nip && !owner.email) {
      const s = String(hit.usedBy);
      if (/^\d{8,}$/.test(s)) owner.nip = s;
      else if (s.indexOf('@') >= 0 && !s.toLowerCase().endsWith('@pengawas.local')) owner.email = s.toLowerCase();
    }
    return { ok: true, claimed: true, tier, code: hit.code, owner };
  }

  function getTier(codeText) {
    const c = findCode(codeText);
    return c ? (c.tier || 'full') : null;
  }

  // Klaim kode untuk sebuah akun (1 kode = 1 akun). Master code tidak dihabiskan.
  // userId/ownerInfo disimpan supaya admin (dan perangkat lain) tahu kode ini milik akun siapa.
  // Re-klaim oleh akun yang sama aman & idempoten (dipakai saat login di perangkat baru).
  function consumeCode(codeText, userId, ownerInfo) {
    const c = normCode(codeText);
    if (!c || isVerifiedMaster(c)) return;
    const ownedBy = (ownerInfo && ownerInfo.usedBy) ? ownerInfo.usedBy : userId;
    const patchOwner = (obj) => {
      if (ownedBy) obj.usedBy = ownedBy;
      if (ownerInfo && ownerInfo.ownerName) obj.ownerName = ownerInfo.ownerName;
      if (ownerInfo && ownerInfo.ownerNip) obj.ownerNip = ownerInfo.ownerNip;
      if (ownerInfo && ownerInfo.ownerEmail) obj.ownerEmail = ownerInfo.ownerEmail;
      obj.usedAt = new Date().toISOString();
    };
    const list = getCodes();
    const idx = list.findIndex(x => normCode(x.code) === c);
    if (idx >= 0) {
      patchOwner(list[idx]);
      saveCodes(list);
      return;
    }
    // Kode yang TIDAK ada di list lokal (bundled / remote gh-pages) tapi baru
    // pertama dipakai di device ini — catat sebagai consumed di lokal supaya
    // device ini mengingat klaim tsb (dan tidak menawarkannya lagi).
    const bundled = (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_CODES)) ? window.BUNDLED_CODES : [];
    const remote = (typeof window !== 'undefined' && Array.isArray(window.REMOTE_CODES)) ? window.REMOTE_CODES : [];
    const bHit = bundled.find(x => normCode(x.code) === c);
    const rHit = remote.find(x => normCode(x.code) === c);
    const src = bHit || rHit;
    if (src) {
      const item = {
        code: src.code,
        tier: (src.tier || 'full').toLowerCase(),
        createdAt: new Date().toISOString(),
        usedBy: null,
        usedAt: null,
        revoked: false,
      };
      if (bHit) item.bundled = true;
      else item.remote = true;
      patchOwner(item);
      list.unshift(item);
      saveCodes(list);
    }
  }

  // Tambah kode random baru (de-dupe terhadap list eksisting).
  function addNewCode(tier, suppressSync) {
    tier = (tier || 'full').toLowerCase();
    if (tier !== 'full' && tier !== 'trial') tier = 'full';
    const list = getCodes();
    let code;
    let tries = 0;
    do {
      code = genCode(tier === 'trial' ? 'TRIAL' : 'FULL');
      tries++;
    } while (list.some(x => x.code === code) && tries < 50);
    const item = {
      code,
      tier,
      createdAt: new Date().toISOString(),
      usedBy: null,
      usedAt: null,
      revoked: false,
    };
    list.unshift(item);
    if (suppressSync) {
      // Save ke localStorage tanpa trigger sync (untuk batch)
      Store.setGlobal(STORE_KEY, list);
    } else {
      saveCodes(list);
    }
    return item;
  }

  // Generate banyak sekaligus. Push satu kali di akhir biar ngga race condition.
  function addNewCodesBatch(tier, n) {
    n = Math.max(1, Math.min(100, parseInt(n, 10) || 10));
    const out = [];
    for (let i = 0; i < n; i++) out.push(addNewCode(tier, /* suppressSync */ true));
    // Single sync di akhir batch
    saveCodes(getCodes());
    return out;
  }

  function revokeCode(code) {
    const c = normCode(code);
    const list = getCodes();
    const idx = list.findIndex(x => normCode(x.code) === c);
    if (idx >= 0) {
      list[idx].revoked = true;
      saveCodes(list);
      return true;
    }
    return false;
  }

  function deleteCode(code) {
    const c = normCode(code);
    const list = getCodes().filter(x => normCode(x.code) !== c);
    saveCodes(list);
  }

  function clearUsedAndRevoked() {
    const list = getCodes().filter(x => !x.usedBy && !x.revoked);
    saveCodes(list);
  }

  // Set/update note (Catatan / Pemilik) untuk kode tertentu.
  function setNote(code, note) {
    const c = normCode(code);
    const list = getCodes();
    const idx = list.findIndex(x => normCode(x.code) === c);
    if (idx >= 0) {
      list[idx].note = String(note || '');
      saveCodes(list);
      return true;
    }
    return false;
  }

  // ===== Purchase settings =====
  const SETTINGS_KEY = 'purchase_settings';

  function getPurchaseSettings() {
    // Default berlaku global (dideploy via js/data/purchase_default.js).
    // Admin bisa override per-device lewat halaman Pengaturan Pembelian (saved ke localStorage).
    const bundled = (typeof window !== 'undefined' && window.PURCHASE_DEFAULT) ? window.PURCHASE_DEFAULT : null;
    const def = bundled || {
      waNumber: '',
      harga: '',
      bankInfo: '',
      appName: 'e-RHK Pengawas Madrasah 2026',
      appUrl: 'https://subariyanto.github.io/e-rhk-pengawas-2026/',
      orderTemplate: 'Halo Pak Subariyanto, saya ingin membeli Kode Aktivasi FULL aplikasi {APP}.\n\nNama: \nNIP: \nWilayah/KKMA: \n\nMohon info cara pembayarannya. Terima kasih.',
      sendTemplate: 'Assalamualaikum Bapak/Ibu,\n\nTerima kasih sudah membeli lisensi {APP}.\n\nBerikut Kode Aktivasi FULL Bapak/Ibu:\n\n*{KODE}*\n\nCara pakai:\n1. Buka aplikasi: {URL}\n2. Login (atau daftar pakai mode TRIAL dulu)\n3. Klik banner kuning di dashboard → "Masukkan Kode FULL"\n4. Tempel kode di atas → selesai ✅\n5. Di perangkat baru: halaman Login → "Masuk pakai Kode Aktivasi"\n\nKode ini terikat ke 1 akun (NIP/email), bisa dipakai dari perangkat mana pun. Simpan baik-baik.\n\nSalam,\nSubariyanto\nKetua Pokjawas Madrasah Kab. Jember',
    };
    let saved = null;
    try { saved = Store.getGlobal(SETTINGS_KEY, null); } catch (e) {}
    // Merge: bundled defaults < saved overrides. Field kosong di saved jangan menimpa bundled.
    const merged = Object.assign({}, def);
    if (saved && typeof saved === 'object') {
      Object.entries(saved).forEach(([k, v]) => {
        if (v !== '' && v != null) merged[k] = v;
      });
    }
    return merged;
  }

  function savePurchaseSettings(s) {
    Store.setGlobal(SETTINGS_KEY, s || {});
  }

  function normalizeWa(num) {
    if (!num) return '';
    let d = String(num).replace(/[^0-9]/g, '');
    if (!d) return '';
    if (d[0] === '0') d = '62' + d.substring(1);
    if (d.substring(0, 2) !== '62') d = '62' + d;
    return d;
  }

  function buildWaLink(num, text) {
    const n = normalizeWa(num);
    if (!n) return '';
    return 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '');
  }

  function fillTemplate(tpl, vars) {
    let s = String(tpl || '');
    Object.entries(vars || {}).forEach(([k, v]) => {
      s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), String(v == null ? '' : v));
    });
    return s;
  }

  window.Codes = {
    APP_SLUG,
    verifyMasterCode,
    isVerifiedMaster,
    STORE_KEY,
    SETTINGS_KEY,
    normCode,
    getCodes, saveCodes,
    genCode,
    findCode, findCodeAny, getTier,
    // Model 1 kode = 1 akun (Opsi B)
    ownerKeysOf, isSameOwner, stableOwnerKey,
    lookupAnywhere, validateForUser, identifyCode,
    consumeCode,
    addNewCode, addNewCodesBatch,
    revokeCode, deleteCode, clearUsedAndRevoked,
    setNote,
    getPurchaseSettings, savePurchaseSettings,
    normalizeWa, buildWaLink, fillTemplate,
  };
})();
