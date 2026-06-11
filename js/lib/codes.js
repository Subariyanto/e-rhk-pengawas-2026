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
  function saveCodes(list) { Store.setGlobal(STORE_KEY, list || []); }

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

  // Cari kode di list random codes; juga deteksi MASTER code hardcoded.
  // Return: null kalau tidak ada / sudah revoked / sudah dipakai (untuk non-master).
  // Untuk konsistensi, MASTER code selalu valid (master=true, tier='full').
  function findCode(codeText) {
    const c = normCode(codeText);
    if (!c) return null;
    if (c === MASTER_CODE) {
      return { code: MASTER_CODE, tier: 'full', master: true, usedBy: null };
    }
    const list = getCodes();
    return list.find(x => normCode(x.code) === c && !x.usedBy && !x.revoked) || null;
  }

  // Versi non-strict: cari kode tanpa filter usedBy/revoked (untuk admin tabel).
  function findCodeAny(codeText) {
    const c = normCode(codeText);
    if (!c) return null;
    if (c === MASTER_CODE) return { code: MASTER_CODE, tier: 'full', master: true, usedBy: null };
    const list = getCodes();
    return list.find(x => normCode(x.code) === c) || null;
  }

  function getTier(codeText) {
    const c = findCode(codeText);
    return c ? (c.tier || 'full') : null;
  }

  // Tandai kode sebagai dipakai. Master code tidak dihabiskan.
  function consumeCode(codeText, userId) {
    const c = normCode(codeText);
    if (!c || c === MASTER_CODE) return;
    const list = getCodes();
    const idx = list.findIndex(x => normCode(x.code) === c);
    if (idx >= 0) {
      list[idx].usedBy = userId;
      list[idx].usedAt = new Date().toISOString();
      saveCodes(list);
    }
  }

  // Tambah kode random baru (de-dupe terhadap list eksisting).
  function addNewCode(tier) {
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
    saveCodes(list);
    return item;
  }

  // Generate banyak sekaligus.
  function addNewCodesBatch(tier, n) {
    n = Math.max(1, Math.min(100, parseInt(n, 10) || 10));
    const out = [];
    for (let i = 0; i < n; i++) out.push(addNewCode(tier));
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
    const def = {
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
    return Object.assign({}, def, saved || {});
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
