// Kode Aktivasi: deterministik per-email lewat SHA-256(secret + ':' + email)
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

  function normEmail(e) { return String(e || '').toLowerCase().trim(); }
  function normCode(c) { return String(c || '').toUpperCase().replace(/[\s-]+/g, ''); }

  async function generate(email) {
    const e = normEmail(email);
    if (!e) return '';
    const h = await sha256hex(getSecret() + ':' + e);
    const code = h.slice(0, 8).toUpperCase();
    // Format XXXX-XXXX biar gampang dibaca/diketik
    return code.slice(0, 4) + '-' + code.slice(4);
  }

  async function verify(email, code) {
    const expect = await generate(email);
    return normCode(code) === normCode(expect);
  }

  window.KodeAktivasi = { getSecret, setSecret, isDefault, generate, verify };
})();
