// Register page — cukup NIP + Kode Aktivasi + Password + Konfirmasi Password.
// Nama auto-lookup dari Pengawas Registry (yang di-import admin via Import Excel).
// Email auto-generate dari NIP (NIP@pengawas.local) — login pakai NIP juga.
(function () {
  Page.Register = function () {
    UI.bareShell(`
      <div class="auth-wrap">
        <div class="auth-card">
          <div class="text-center mb-3">
            <div class="auth-logo mb-2">📋</div>
            <h1 class="mb-0">Daftar Akun Pengawas</h1>
            <div class="small text-muted">Pendaftaran memerlukan <strong>kode aktivasi</strong> dari admin.</div>
          </div>
          <div class="alert alert-warning small py-2">
            <i class="bi bi-info-circle"></i> Belum punya kode aktivasi? Hubungi <strong>Subariyanto, S.Pd, M.Pd.I.</strong> (Ketua Pokjawas Madrasah Kab. Jember) untuk meminta kode sesuai NIP Anda.
          </div>
          <form id="frmReg">
            <div class="mb-3">
              <label class="form-label">NIP (18 digit)</label>
              <input class="form-control" name="nip" required inputmode="numeric" maxlength="18" placeholder="18 digit NIP" autofocus style="font-family:'Courier New',monospace;letter-spacing:.05em;" />
              <div id="nipInfo" class="form-text"></div>
            </div>
            <div class="mb-3">
              <label class="form-label">Kode Aktivasi</label>
              <input class="form-control" name="kode" required placeholder="XXXX-XXXX" style="font-family:'Courier New',monospace;letter-spacing:.1em;text-transform:uppercase;" />
              <div class="form-text">Format <code>XXXX-XXXX</code> dari admin. Tanda strip opsional.</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Password (min 6 karakter)</label>
              <input class="form-control" type="password" name="password" required minlength="6" />
            </div>
            <div class="mb-3">
              <label class="form-label">Konfirmasi Password</label>
              <input class="form-control" type="password" name="password2" required minlength="6" />
            </div>
            <button class="btn btn-success w-100" type="submit"><i class="bi bi-person-plus"></i> Daftar</button>
          </form>
          <div class="mt-3 text-center small">
            Sudah punya akun? <a href="#/login">Masuk</a>
          </div>
        </div>
      </div>
    `);

    // Auto-lookup nama saat NIP diketik
    const nipInput = document.querySelector('input[name="nip"]');
    const nipInfo = document.getElementById('nipInfo');
    function refreshNipInfo() {
      const nip = String(nipInput.value || '').replace(/[^0-9]/g, '');
      if (nip.length < 15) {
        nipInfo.innerHTML = '<span class="text-muted">Masukkan NIP 18 digit yang sudah didaftarkan ke admin.</span>';
        return;
      }
      const reg = window.PengawasRegistry?.findByNip(nip);
      if (reg && reg.nama) {
        nipInfo.innerHTML = '<span class="text-success"><i class="bi bi-check-circle"></i> Terdaftar atas nama <strong>' + U.escapeHtml(reg.nama) + '</strong>' + (reg.wilayah ? ' &mdash; ' + U.escapeHtml(reg.wilayah) : '') + '</span>';
      } else {
        nipInfo.innerHTML = '<span class="text-muted">NIP tidak ditemukan di daftar pengawas. Pastikan benar atau hubungi admin.</span>';
      }
    }
    nipInput.addEventListener('input', refreshNipInfo);
    refreshNipInfo();

    document.getElementById('frmReg').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const pw = fd.get('password');
      const nip = String(fd.get('nip') || '').replace(/[^0-9]/g, '');
      const kode = String(fd.get('kode') || '').trim();
      if (pw !== fd.get('password2')) return UI.toast('Konfirmasi password tidak cocok.', 'danger');
      if (!nip || nip.length < 15) return UI.toast('NIP tidak valid (minimal 15 digit angka).', 'danger');
      if (!kode) return UI.toast('Kode aktivasi wajib diisi.', 'danger');
      try {
        const ok = await KodeAktivasi.verify(nip, kode);
        if (!ok) {
          return UI.toast('Kode aktivasi tidak cocok dengan NIP ini. Pastikan NIP & kode sesuai pemberian admin.', 'danger');
        }
        const existing = Auth.listUsers().find(u => u.nip === nip);
        if (existing) {
          return UI.toast('NIP ini sudah terdaftar. Silakan login atau hubungi admin untuk reset password.', 'danger');
        }
        // Auto-lookup nama dari registry
        const reg = window.PengawasRegistry?.findByNip(nip);
        const nama = reg?.nama || ('Pengawas ' + nip.slice(-4));
        const email = nip + '@pengawas.local';
        await Auth.register({ nama, email, password: pw, nip });
        UI.toast('Pendaftaran berhasil. Silakan login dengan NIP & password Anda.');
        Router.navigate('/login', true);
        Router.dispatch();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    });
  };
})();
