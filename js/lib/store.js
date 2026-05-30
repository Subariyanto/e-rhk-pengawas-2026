// Generic localStorage store with key prefix per user
(function () {
  const PREFIX = 'erhk2026_';
  const SESSION_KEY = PREFIX + 'session';

  // ===== PERIODE (tahun) — data master_rhk, kegiatan, eviden disimpan per-tahun =====
  const PERIODIC_SCOPES = ['master_rhk', 'kegiatan', 'eviden'];
  function activePeriode() {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    const uid = s && s.userId ? s.userId : '_anon_';
    const k = PREFIX + 'u_' + uid + '_active_periode';
    let v = localStorage.getItem(k);
    if (!v) { v = String(new Date().getFullYear()); localStorage.setItem(k, v); }
    return v;
  }
  function setActivePeriode(year) {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    const uid = s && s.userId ? s.userId : '_anon_';
    localStorage.setItem(PREFIX + 'u_' + uid + '_active_periode', String(year));
  }
  function listPeriode() {
    // collect tahun dari semua key yang punya pola scope_YYYY
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    const uid = s && s.userId ? s.userId : '_anon_';
    const prefix = PREFIX + 'u_' + uid + '_';
    const years = new Set();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(prefix)) continue;
      const tail = k.slice(prefix.length);
      const m = tail.match(/^(?:master_rhk|kegiatan|eviden)_(\d{4})$/);
      if (m) years.add(m[1]);
    }
    // pastikan tahun aktif & tahun sekarang masuk
    years.add(activePeriode());
    return Array.from(years).sort();
  }
  function isPeriodic(scope) { return PERIODIC_SCOPES.includes(scope); }
  function userKey(scope) {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    const uid = s && s.userId ? s.userId : '_anon_';
    let k = scope;
    if (isPeriodic(scope)) k = scope + '_' + activePeriode();
    return PREFIX + 'u_' + uid + '_' + k;
  }

  // Migrasi otomatis: kalau ada key lama tanpa _YYYY (master_rhk, kegiatan, eviden), pindah ke _<tahun_sekarang>
  function migrateLegacy() {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (!s || !s.userId) return;
    const prefix = PREFIX + 'u_' + s.userId + '_';
    const year = activePeriode();
    PERIODIC_SCOPES.forEach(scope => {
      const oldKey = prefix + scope;
      const newKey = prefix + scope + '_' + year;
      const oldVal = localStorage.getItem(oldKey);
      if (oldVal !== null && localStorage.getItem(newKey) === null) {
        localStorage.setItem(newKey, oldVal);
        localStorage.removeItem(oldKey);
        console.log('[Store] migrasi', scope, '->', scope + '_' + year);
      }
    });
  }

  function get(scope, fallback) {
    try {
      const raw = localStorage.getItem(userKey(scope));
      return raw ? JSON.parse(raw) : (fallback === undefined ? null : fallback);
    } catch (e) { return fallback === undefined ? null : fallback; }
  }
  function set(scope, value) {
    localStorage.setItem(userKey(scope), JSON.stringify(value));
  }
  function getGlobal(scope, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + scope);
      return raw ? JSON.parse(raw) : (fallback === undefined ? null : fallback);
    } catch (e) { return fallback === undefined ? null : fallback; }
  }
  function setGlobal(scope, value) { localStorage.setItem(PREFIX + scope, JSON.stringify(value)); }
  function removeGlobal(scope) { localStorage.removeItem(PREFIX + scope); }

  // Hapus seluruh data periode tertentu (master_rhk_<year>, kegiatan_<year>, eviden_<year>)
  function deletePeriode(year) {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (!s || !s.userId) return;
    const prefix = PREFIX + 'u_' + s.userId + '_';
    PERIODIC_SCOPES.forEach(scope => {
      localStorage.removeItem(prefix + scope + '_' + year);
    });
  }
  // Clone dari satu tahun ke tahun lain (deep copy via JSON)
  function clonePeriode(srcYear, dstYear) {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (!s || !s.userId) return;
    const prefix = PREFIX + 'u_' + s.userId + '_';
    PERIODIC_SCOPES.forEach(scope => {
      const src = localStorage.getItem(prefix + scope + '_' + srcYear);
      if (src !== null) localStorage.setItem(prefix + scope + '_' + dstYear, src);
    });
  }

  function uid(prefix) {
    return (prefix || 'id_') + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function exportAllForUser() {
    const out = {};
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (!session) return null;
    const prefix = PREFIX + 'u_' + session.userId + '_';
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        try { out[k.slice(prefix.length)] = JSON.parse(localStorage.getItem(k)); } catch (e) {}
      }
    }
    return out;
  }
  function importAllForUser(obj) {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (!session) return false;
    const prefix = PREFIX + 'u_' + session.userId + '_';
    Object.entries(obj || {}).forEach(([k, v]) => {
      localStorage.setItem(prefix + k, JSON.stringify(v));
    });
    return true;
  }

  window.Store = {
    get, set, getGlobal, setGlobal, removeGlobal, uid, PREFIX, SESSION_KEY,
    exportAllForUser, importAllForUser,
    activePeriode, setActivePeriode, listPeriode, deletePeriode, clonePeriode, migrateLegacy,
  };
})();
