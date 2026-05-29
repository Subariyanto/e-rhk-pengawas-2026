// UI shell, toasts, modal helpers
(function () {
  function shell(title, contentHTML) {
    const u = Auth.currentUser();
    const role = u?.role || 'pengawas';
    const menus = [
      { href: '#/', icon: 'speedometer2', label: 'Dashboard', section: 'Utama' },
      { href: '#/identitas', icon: 'person-badge', label: 'Identitas Pengawas' },
      { href: '#/master-rhk', icon: 'list-check', label: 'Master RHK' },
      { href: '#/skp-atasan', icon: 'person-workspace', label: 'SKP Atasan Langsung' },
      { href: '#/madrasah', icon: 'building', label: 'Madrasah Binaan' },
      { href: '#/kegiatan', icon: 'journal-text', label: 'Data Kegiatan' },
      { href: '#/eviden', icon: 'file-earmark-text', label: 'Generator Eviden' },
      { href: '#/arsip', icon: 'archive', label: 'Arsip Eviden' },
      { href: '#/rekap', icon: 'bar-chart', label: 'Rekapitulasi' },
    ];
    if (role === 'admin') {
      menus.push({ href: '#/admin/users', icon: 'people', label: 'Kelola User', section: 'Admin' });
    }

    const cur = location.hash || '#/';
    let lastSection = '';
    const navHTML = menus.map(m => {
      let s = '';
      if (m.section && m.section !== lastSection) {
        s += `<div class="section-label">${m.section}</div>`;
        lastSection = m.section;
      }
      const active = (cur === m.href || (m.href !== '#/' && cur.startsWith(m.href))) ? 'active' : '';
      s += `<a class="${active}" href="${m.href}"><i class="bi bi-${m.icon}"></i><span>${m.label}</span></a>`;
      return s;
    }).join('');

    document.getElementById('app').innerHTML = `
      <div class="app-shell">
        <aside class="app-sidebar" id="appSidebar">
          <div class="brand">
            <div class="logo">📋</div>
            <div>
              <div class="title">e-SKP Pengawas</div>
              <div class="subtitle">Pokjawas Kab. Jember</div>
            </div>
          </div>
          <nav>${navHTML}</nav>
          <div class="userbox">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <div class="fw-bold">${U.escapeHtml(u?.nama || '')}</div>
                <div class="small opacity-75">${U.escapeHtml(u?.role || '')}</div>
              </div>
              <button class="btn btn-sm btn-outline-light" id="btnLogout" title="Logout"><i class="bi bi-box-arrow-right"></i></button>
            </div>
          </div>
          <div class="sidebar-credit">
            <div>Aplikasi ini dibuat oleh : Subariyanto, S.Pd, M.Pd.I.</div>
            <div>Ketua Pokjawas Madrasah Kabupaten Jember</div>
          </div>
        </aside>
        <div class="app-overlay" id="appOverlay"></div>
        <main class="app-main">
          <div class="app-topbar">
            <button class="btn btn-burger btn-sm btn-outline-success" id="btnBurger"><i class="bi bi-list"></i></button>
            <div class="page-title flex-grow-1">${U.escapeHtml(title)}</div>
            <div class="text-muted small d-none d-md-block">${U.escapeHtml((u?.email || ''))}</div>
          </div>
          <div class="app-content" id="appContent">${contentHTML || ''}</div>
        </main>
      </div>
    `;
    document.getElementById('btnLogout').addEventListener('click', () => {
      Auth.logout();
      Router.navigate('/login', true);
      Router.dispatch();
    });
    const burger = document.getElementById('btnBurger');
    const sidebar = document.getElementById('appSidebar');
    const overlay = document.getElementById('appOverlay');
    burger.addEventListener('click', () => { sidebar.classList.toggle('open'); overlay.classList.toggle('show'); });
    overlay.addEventListener('click', () => { sidebar.classList.remove('open'); overlay.classList.remove('show'); });
  }

  function bareShell(html) {
    document.getElementById('app').innerHTML = html;
  }

  function toast(message, type) {
    type = type || 'success';
    const wrap = document.querySelector('.toast-container') || (() => {
      const w = document.createElement('div');
      w.className = 'toast-container position-fixed top-0 end-0 p-3';
      w.style.zIndex = 9999;
      document.body.appendChild(w);
      return w;
    })();
    const t = document.createElement('div');
    t.className = `toast align-items-center text-bg-${type} border-0 show`;
    t.innerHTML = `<div class="d-flex"><div class="toast-body">${U.escapeHtml(message)}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button></div>`;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }

  function confirmDialog(message) {
    return new Promise((resolve) => {
      const id = 'cd_' + Date.now();
      const m = document.createElement('div');
      m.className = 'modal fade show d-block';
      m.tabIndex = -1;
      m.style.background = 'rgba(0,0,0,.5)';
      m.innerHTML = `<div class="modal-dialog modal-dialog-centered"><div class="modal-content"><div class="modal-body p-4">${U.escapeHtml(message)}</div><div class="modal-footer"><button class="btn btn-secondary" id="${id}_no">Batal</button><button class="btn btn-success" id="${id}_yes">Ya</button></div></div></div>`;
      document.body.appendChild(m);
      document.getElementById(id + '_no').onclick = () => { m.remove(); resolve(false); };
      document.getElementById(id + '_yes').onclick = () => { m.remove(); resolve(true); };
    });
  }

  function showModal(title, bodyHTML, opts) {
    return new Promise((resolve) => {
      const id = 'mdl_' + Date.now();
      const m = document.createElement('div');
      m.className = 'modal fade show d-block';
      m.tabIndex = -1;
      m.style.background = 'rgba(0,0,0,.5)';
      const sizeCls = opts && opts.size === 'lg' ? 'modal-lg' : (opts && opts.size === 'xl' ? 'modal-xl' : '');
      m.innerHTML = `<div class="modal-dialog ${sizeCls} modal-dialog-centered modal-dialog-scrollable"><div class="modal-content"><div class="modal-header"><h5 class="modal-title">${U.escapeHtml(title)}</h5><button type="button" class="btn-close" id="${id}_close"></button></div><div class="modal-body" id="${id}_body">${bodyHTML || ''}</div></div></div>`;
      document.body.appendChild(m);
      const close = () => { m.remove(); resolve(); };
      document.getElementById(id + '_close').onclick = close;
      m.addEventListener('click', (e) => { if (e.target === m) close(); });
      if (opts && typeof opts.onMount === 'function') {
        try { opts.onMount(document.getElementById(id + '_body'), close); } catch (e) { console.error(e); }
      }
    });
  }

  window.UI = { shell, bareShell, toast, confirmDialog, showModal };
})();
