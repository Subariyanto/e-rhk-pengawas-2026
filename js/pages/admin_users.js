// Admin Users page (admin only) — extended with TIER column + upgrade/downgrade.
(function () {
  Page.AdminUsers = function () {
    const users = Auth.listUsers();
    UI.shell('Kelola User', `
      <div class="alert alert-light border mb-3"><i class="bi bi-shield-check text-success"></i> Daftar pengawas terdaftar dan administrator. Kolom <strong>Tier</strong> menentukan akses fitur: <span class="badge bg-primary">ADMIN</span> tanpa batasan, <span class="badge bg-success">FULL</span> berlaku ${Tier.LICENSE_DAYS} hari (1 tahun) sejak aktivasi, <span class="badge bg-warning text-dark">TRIAL</span> dibatasi ${Tier.TRIAL_DAYS} hari + ${Tier.TRIAL_MAX_KEGIATAN} kegiatan.</div>
      <div class="card"><div class="table-responsive"><table class="table table-sm table-hover mb-0 align-middle">
        <thead><tr><th>Nama</th><th>NIP</th><th>Email</th><th>Role</th><th>Tier</th><th>Lisensi Berlaku s/d</th><th>Status</th><th>Dibuat</th><th class="text-end" style="width:18rem;">Aksi</th></tr></thead>
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
            } else if (u.fullExpiresAt) {
              const ms = new Date(u.fullExpiresAt).getTime() - Date.now();
              const days = Math.ceil(ms / 86400000);
              if (ms <= 0) tierBadge = '<span class="badge bg-danger">FULL (expired)</span>';
              else if (days <= Tier.FULL_WARNING_DAYS) tierBadge = '<span class="badge bg-warning text-dark">FULL (' + days + 'h lagi)</span>';
            }
            // Kolom expiry FULL
            let expCell = '<span class="text-muted">&mdash;</span>';
            if (u.role !== 'admin' && tier === 'full') {
              if (u.fullExpiresAt) {
                const tgl = new Date(u.fullExpiresAt);
                const ms = tgl.getTime() - Date.now();
                const days = Math.ceil(ms / 86400000);
                const fmt = U.fmtTanggalISO ? U.fmtTanggalISO(u.fullExpiresAt) : tgl.toISOString().slice(0,10);
                if (ms <= 0) expCell = '<span class="text-danger">' + fmt + ' (expired)</span>';
                else if (days <= Tier.FULL_WARNING_DAYS) expCell = '<span class="text-warning">' + fmt + ' (' + days + 'h lagi)</span>';
                else expCell = '<span class="text-muted">' + fmt + ' (' + days + 'h)</span>';
              } else {
                expCell = '<span class="text-muted fst-italic">tanpa batas (legacy)</span>';
              }
            }
            const tierActionBtn = u.role === 'admin'
              ? ''
              : (tier === 'trial'
                  ? `<button class="btn btn-sm btn-outline-success" data-upgrade="${u.id}" title="Upgrade ke FULL (1 tahun)">⬆️</button>`
                  : `<button class="btn btn-sm btn-outline-primary" data-extend="${u.id}" title="Perpanjang Lisensi +1 tahun"><i class="bi bi-calendar-plus"></i></button>
                     <button class="btn btn-sm btn-outline-warning" data-downgrade="${u.id}" title="Downgrade ke TRIAL">🔻</button>`
                );
            return `<tr>
              <td>${U.escapeHtml(u.nama)}</td>
              <td style="font-family:'Courier New',monospace;font-size:.85em;">${U.escapeHtml(u.nip || '-')}</td>
              <td>${U.escapeHtml(u.email)}</td>
              <td><span class="badge ${u.role === 'admin' ? 'bg-success' : 'bg-secondary'}">${u.role}</span></td>
              <td>${tierBadge}</td>
              <td class="small">${expCell}</td>
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
      if (!await UI.confirmDialog('Upgrade akun ' + u.nama + ' ke FULL? Lisensi berlaku ' + Tier.LICENSE_DAYS + ' hari (1 tahun) sejak hari ini.')) return;
      Tier.upgradeUserToFull(u.id);
      const after = Auth.listUsers().find(x => x.id === u.id);
      const tgl = after && after.fullExpiresAt ? new Date(after.fullExpiresAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
      UI.toast('✅ ' + u.nama + ' di-upgrade ke FULL. Berlaku sampai ' + tgl + '.');
      Page.AdminUsers();
    }));
    document.querySelectorAll('button[data-extend]').forEach(b => b.addEventListener('click', async () => {
      const u = users.find(x => x.id === b.dataset.extend);
      if (!u) return;
      const curExp = u.fullExpiresAt ? new Date(u.fullExpiresAt) : null;
      const curStr = curExp ? curExp.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '(belum ada)';
      if (!await UI.confirmDialog('Perpanjang lisensi FULL ' + u.nama + ' +1 tahun?\n\nBerlaku sekarang sampai: ' + curStr + '.\nKalau masih aktif, perpanjangan ditambahkan ke akhir lisensi.')) return;
      Tier.extendUserFullByOneYear(u.id);
      const after = Auth.listUsers().find(x => x.id === u.id);
      const tgl = after && after.fullExpiresAt ? new Date(after.fullExpiresAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
      UI.toast('✅ Lisensi ' + u.nama + ' diperpanjang. Berlaku sampai ' + tgl + '.');
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
