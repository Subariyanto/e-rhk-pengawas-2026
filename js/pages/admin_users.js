// Admin Users page (admin only)
(function () {
  Page.AdminUsers = function () {
    const users = Auth.listUsers();
    UI.shell('Kelola User', `
      <div class="alert alert-light border mb-3"><i class="bi bi-shield-check text-success"></i> Daftar pengawas terdaftar dan administrator. Pengawas dapat dinonaktifkan namun datanya tidak dapat dilihat oleh admin (terisolasi per akun).</div>
      <div class="card"><div class="table-responsive"><table class="table table-sm table-hover mb-0 align-middle">
        <thead><tr><th>Nama</th><th>Email</th><th>Role</th><th>Status</th><th>Dibuat</th><th></th></tr></thead>
        <tbody>
          ${users.map(u => `<tr>
            <td>${U.escapeHtml(u.nama)}</td>
            <td>${U.escapeHtml(u.email)}</td>
            <td><span class="badge ${u.role === 'admin' ? 'bg-success' : 'bg-secondary'}">${u.role}</span></td>
            <td><span class="badge ${u.status === 'aktif' ? 'bg-success' : 'bg-warning text-dark'}">${u.status}</span></td>
            <td>${U.fmtTanggalISO(u.created_at)}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-success" data-toggle="${u.id}">${u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button>
              <button class="btn btn-sm btn-outline-success" data-pwd="${u.id}">Reset Pwd</button>
              ${u.role !== 'admin' ? `<button class="btn btn-sm btn-outline-danger" data-del="${u.id}">Hapus</button>` : ''}
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div></div>
    `);
    document.querySelectorAll('button[data-toggle]').forEach(b => b.addEventListener('click', () => {
      const u = users.find(x => x.id === b.dataset.toggle);
      Auth.updateUser(u.id, { status: u.status === 'aktif' ? 'nonaktif' : 'aktif' });
      Page.AdminUsers();
    }));
    document.querySelectorAll('button[data-pwd]').forEach(b => b.addEventListener('click', async () => {
      const u = users.find(x => x.id === b.dataset.pwd);
      const np = prompt('Password baru untuk ' + u.email + ':', 'pengawas123');
      if (!np) return;
      await Auth.changePassword(u.id, np);
      UI.toast('Password ' + u.email + ' direset.');
    }));
    document.querySelectorAll('button[data-del]').forEach(b => b.addEventListener('click', async () => {
      const u = users.find(x => x.id === b.dataset.del);
      if (await UI.confirmDialog('Hapus akun ' + u.email + '? Data pribadinya tetap ada di localStorage tetapi tidak bisa dilogin lagi.')) {
        Auth.deleteUser(u.id);
        Page.AdminUsers();
      }
    }));
  };
})();
