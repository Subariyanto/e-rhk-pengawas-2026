// Generic localStorage store with key prefix per user
(function () {
  const PREFIX = 'erhk2026_';
  const SESSION_KEY = PREFIX + 'session';

  function userKey(scope) {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    const uid = s && s.userId ? s.userId : '_anon_';
    return PREFIX + 'u_' + uid + '_' + scope;
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

  window.Store = { get, set, getGlobal, setGlobal, removeGlobal, uid, PREFIX, SESSION_KEY, exportAllForUser, importAllForUser };
})();
