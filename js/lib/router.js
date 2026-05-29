// Tiny hash router with role guard
(function () {
  const routes = []; // { pattern: RegExp, keys: [], handler, opts }
  function on(path, handler, opts) {
    const keys = [];
    const pat = new RegExp('^' + path.replace(/:[A-Za-z_]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
    routes.push({ pattern: pat, keys, handler, opts: opts || {} });
  }
  function navigate(hash, replace) {
    if (replace) location.replace('#' + hash);
    else location.hash = hash;
  }
  function current() { return location.hash.slice(1) || '/'; }

  async function dispatch() {
    const path = current();
    console.log('[Router] dispatch ->', path);
    for (const r of routes) {
      const m = path.match(r.pattern);
      if (m) {
        const params = {};
        r.keys.forEach((k, i) => { params[k] = decodeURIComponent(m[i + 1]); });
        if (r.opts.requireAuth) {
          const s = Auth.currentSession();
          if (!s) { navigate('/login', true); return; }
          if (r.opts.role && r.opts.role !== Auth.currentUser()?.role) { navigate('/', true); return; }
        }
        try { await r.handler(params); } catch (e) { console.error('[Router] handler error for', path, e); UI.toast('Error: ' + e.message, 'danger'); }
        return;
      }
    }
    // not found
    console.warn('[Router] no route for', path);
    document.getElementById('app').innerHTML = '<div class="p-4">Halaman tidak ditemukan. <a href="#/">Beranda</a></div>';
  }

  window.addEventListener('hashchange', dispatch);
  window.Router = { on, navigate, dispatch, current };
})();
