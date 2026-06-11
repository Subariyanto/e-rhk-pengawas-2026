// Admin Users page (admin only) — extended with TIER column + upgrade/downgrade.
(function () {
  Page.AdminUsers = function () {
    const users = Auth.listUsers();
    UI.shell('Kelola User', `
      <div class="alert alert-light border mb-3"><i class="bi bi-shield-check text-success"></i> Daftar pengawas terdaftar dan administrator. Kolom <strong>Tier</strong> menentukan akses fitur: <span class="badge bg-primary">ADMIN</span> &amp; <span class="badge bg-success">FULL</span> tanpa batasan, <span class="badge bg-warning text-dark">TRIAL</span> dibatasi ${Tier.TRIAL_DAYS} hari + ${Tier.TRIAL_MAX_KEGIATAN} kegiatan.</div>
      <div class="card"><div class="table-responsive"><table class="table table-sm table-hover mb-0 align-middle">
        <thead><tr><th>Nama</th><th>NIP</th><th>Email</th><th>Role</th><th>Tier</th><th>Status</th><th>Dibuat</th><th class="text-end" style="width:14rem;">Aksi</th></tr></thead>
        <tbody>
          ${users.map(u => {
            const tier = u.role === 'admin' ? 'admin' : (u.tier || 'full');
            let tierBadge = '<span class="badge bg-success">FULL</span>';
            if (u.role === 'admin') tierBadge = '<span class="badge bg-primary">ADMIN</span>';
            else if (tier === 'trial') {
              let extra = '';
              if (u.trialExpiresAt) {
                const ms = new Date(u.trialExpiresAt).getTime() - Date.now();
                if (ms <= 0) extra = ' (expired)';
                else extra = ' (' + Math.ceil(ms / 86400000) + 'h)';
              }
              tierBadge = '<span class="badge bg-warning text-dark">TRIAL' + extra + '</span>';
            }
            const tierActionBtn = u.role === 'admin'
              ? ''
              : (tier === 'trial'
                  ? `<button class="btn btn-sm btn-outline-success" data-upgrade="${u.id}" title="Upgrade ke FULL">⬆️</button>`
                  : `<button class="btn btn-sm btn-outline-warning" data-downgrade="${u.id}" title="Downgrade ke TRIAL">🔻</button>`
                );
            return `<tr>
              <td>${U.escapeHtml(u.nama)}</td>
              <td style="font-family:'Courier New',monospace;font-size:.85em;">${U.escapeHtml(u.nip || '-')}</td>
              <td>${U.escapeHtml(u.email)}</td>
              <td><span class="badge ${u.role === 'admin' ? 'bg-success' : 'bg-secondary'}">${u.role}</span></td>
              <td>${tierBadge}</td>
              <td><span class="badge ${u.status === 'aktif' ? 'bg-success' : 'bg-warning text-dark'}">${u.status}</span></td>
              <td class="small text-muted">${U.fmtTanggalISO(u.created_at)}</td>
              <td class="text-end">
                ${tierActionBtn}
                <button class="btn btn-sm btn-outline-secondary" data-toggle="${u.id}" title="${u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}">${u.status === 'aktif' ? '🚫' : '✅'}</button>
                <button class="btn btn-sm btn-outline-secondary" data-pwd="${u.id}" title="Reset Password">🔑</button>
                ${u.role !== 'admin' ? `<button class="btn btn-sm btn-outline-danger" data-del="${u.id}" title="Hapus">🗑️</button>` : ''}
              </td>
            </tr>`;
          }).join('')}
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
    document.querySelectorAll('button[data-upgrade]').forEach(b => b.addEventListener('click', async () => {
      const u = users.find(x => x.id === b.dataset.upgrade);
      if (!u) return;
      if (!await UI.confirmDialog('Upgrade akun ' + u.nama + ' ke FULL? Batasan trial akan dihapus.')) return;
      Tier.upgradeUserToFull(u.id);
      UI.toast('✅ ' + u.nama + ' di-upgrade ke FULL.');
      Page.AdminUsers();
    }));
    document.querySelectorAll('button[data-downgrade]').forEach(b => b.addEventListener('click', async () => {
      const u = users.find(x => x.id === b.dataset.downgrade);
      if (!u) return;
      if (!await UI.confirmDialog('Downgrade akun ' + u.nama + ' ke TRIAL? Akun akan kembali dibatasi ' + Tier.TRIAL_DAYS + ' hari + ' + Tier.TRIAL_MAX_KEGIATAN + ' kegiatan. Data lama tidak dihapus.')) return;
      Tier.downgradeUserToTrial(u.id);
      UI.toast('✅ ' + u.nama + ' di-downgrade ke TRIAL (' + Tier.TRIAL_DAYS + ' hari).');
      Page.AdminUsers();
    }));
  };
})();
