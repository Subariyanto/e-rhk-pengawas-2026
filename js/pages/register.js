// Register page
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
            <i class="bi bi-info-circle"></i> Belum punya kode aktivasi? Silakan hubungi <strong>Subariyanto, S.Pd, M.Pd.I.</strong> (Ketua Pokjawas Madrasah Kab. Jember) untuk meminta kode sesuai email Anda.
          </div>
          <form id="frmReg">
            <div class="mb-3">
              <label class="form-label">Nama Lengkap</label>
              <input class="form-control" name="nama" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input class="form-control" type="email" name="email" required />
              <div class="form-text">Gunakan email yang sudah didaftarkan ke admin.</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Kode Aktivasi</label>
              <input class="form-control" name="kode" required placeholder="XXXX-XXXX" style="font-family:'Courier New',monospace;letter-spacing:.1em;text-transform:uppercase;" />
              <div class="form-text">Kode unik dari admin sesuai email di atas. Tanda strip opsional.</div>
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
    document.getElementById('frmReg').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const pw = fd.get('password');
      const email = String(fd.get('email') || '').trim();
      const kode = String(fd.get('kode') || '').trim();
      if (pw !== fd.get('password2')) return UI.toast('Konfirmasi password tidak cocok.', 'danger');
      if (!kode) return UI.toast('Kode aktivasi wajib diisi.', 'danger');
      try {
        const ok = await KodeAktivasi.verify(email, kode);
        if (!ok) {
          return UI.toast('Kode aktivasi tidak cocok dengan email ini. Pastikan email & kode sesuai pemberian admin.', 'danger');
        }
        const u = await Auth.register({ nama: fd.get('nama'), email, password: pw });
        UI.toast('Pendaftaran berhasil. Silakan login.');
        Router.navigate('/login', true);
        Router.dispatch();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    });
  };
})();
