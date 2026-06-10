// Kode Aktivasi: deterministik per-NIP lewat SHA-256(secret + ':nip:' + nip)
// Admin generate kode → share ke pengawas → pengawas pakai untuk register.
// Tanpa kode valid, register ditolak.
(function () {
  const KEY = 'aktivasi_secret';
  // Default secret. Yanto bisa rotate via halaman Admin > Kode Aktivasi.
  const DEFAULT_SECRET = 'POKJAWAS-JEMBER-2026-eSKP-PENGAWAS-MAD';

  function getSecret() {
    return Store.getGlobal(KEY, null) || DEFAULT_SECRET;
  }
  function setSecret(s) {
    const v = String(s || '').trim();
    Store.setGlobal(KEY, v || DEFAULT_SECRET);
  }
  function isDefault() {
    const cur = Store.getGlobal(KEY, null);
    return !cur || cur === DEFAULT_SECRET;
  }

  async function sha256hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function normNip(n) { return String(n || '').replace(/[^0-9]/g, ''); }
  function normCode(c) { return String(c || '').toUpperCase().replace(/[\s-]+/g, ''); }

  // Generate kode aktivasi 8 hex char (XXXX-XXXX) dari NIP
  async function generate(nip) {
    const n = normNip(nip);
    if (!n) return '';
    const h = await sha256hex(getSecret() + ':nip:' + n);
    const code = h.slice(0, 8).toUpperCase();
    return code.slice(0, 4) + '-' + code.slice(4);
  }

  async function verify(nip, code) {
    const expect = await generate(nip);
    if (!expect) return false;
    return normCode(code) === normCode(expect);
  }

  window.KodeAktivasi = { getSecret, setSecret, isDefault, generate, verify, normNip };
})();
