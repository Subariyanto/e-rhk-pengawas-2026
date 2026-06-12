// Kode aktivasi tipe RANDOM (TRIAL/FULL) — selaras dengan supervisi-pm-kbc-jember.
// Catatan: ini berdampingan dengan KodeAktivasi (deterministik per-NIP) yang masih
// dipakai untuk 59 pengawas yang sudah dapat kode legacy.
//
// Storage key: erhk2026_activation_codes (via Store.setGlobal/getGlobal).
// Master code hard-coded: POKJAWAS-JEMBER-ERHK-2026 → tier=full, master=true.
(function () {
  const STORE_KEY = 'activation_codes';
  const MASTER_CODE = 'POKJAWAS-JEMBER-ERHK-2026';

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
  function findCode(codeText) {
    const c = normCode(codeText);
    if (!c) return null;
    if (c === MASTER_CODE) {
      return { code: MASTER_CODE, tier: 'full', master: true, usedBy: null };
    }
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
    if (c === MASTER_CODE) return { code: MASTER_CODE, tier: 'full', master: true, usedBy: null };
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

  function getTier(codeText) {
    const c = findCode(codeText);
    return c ? (c.tier || 'full') : null;
  }

  // Tandai kode sebagai dipakai. Master code tidak dihabiskan.
  // Untuk bundled code: kalau belum ada di local list, push entry baru sebagai marker.
  function consumeCode(codeText, userId) {
    const c = normCode(codeText);
    if (!c || c === MASTER_CODE) return;
    const list = getCodes();
    const idx = list.findIndex(x => normCode(x.code) === c);
    if (idx >= 0) {
      list[idx].usedBy = userId;
      list[idx].usedAt = new Date().toISOString();
      saveCodes(list);
      return;
    }
    // Bundled code yang baru pertama dipakai — catat sebagai consumed di local
    const bundled = (typeof window !== 'undefined' && Array.isArray(window.BUNDLED_CODES)) ? window.BUNDLED_CODES : [];
    const bHit = bundled.find(x => normCode(x.code) === c);
    if (bHit) {
      list.unshift({
        code: bHit.code,
        tier: (bHit.tier || 'full').toLowerCase(),
        bundled: true,
        createdAt: new Date().toISOString(),
        usedBy: userId,
        usedAt: new Date().toISOString(),
        revoked: false,
      });
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
      sendTemplate: 'Assalamualaikum Bapak/Ibu,\n\nTerima kasih sudah membeli lisensi {APP}.\n\nBerikut Kode Aktivasi FULL Bapak/Ibu:\n\n*{KODE}*\n\nCara pakai:\n1. Buka aplikasi: {URL}\n2. Login (atau daftar pakai mode TRIAL dulu)\n3. Klik banner kuning di dashboard → "Masukkan Kode FULL"\n4. Tempel kode di atas → selesai ✅\n\nKode ini sekali pakai. Simpan baik-baik.\n\nSalam,\nSubariyanto\nKetua Pokjawas Madrasah Kab. Jember',
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
    MASTER_CODE,
    STORE_KEY,
    SETTINGS_KEY,
    getCodes, saveCodes,
    genCode,
    findCode, findCodeAny, getTier,
    consumeCode,
    addNewCode, addNewCodesBatch,
    revokeCode, deleteCode, clearUsedAndRevoked,
    getPurchaseSettings, savePurchaseSettings,
    normalizeWa, buildWaLink, fillTemplate,
  };
})();
