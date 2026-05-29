// Register page
(function () {
  Page.Register = function () {
    UI.bareShell(`
      <div class="auth-wrap">
        <div class="auth-card">
          <div class="text-center mb-3">
            <div class="auth-logo mb-2">📋</div>
            <h1 class="mb-0">Daftar Akun Pengawas</h1>
            <div class="small text-muted">Pendaftaran langsung aktif tanpa persetujuan admin.</div>
          </div>
          <form id="frmReg">
            <div class="mb-3">
              <label class="form-label">Nama Lengkap</label>
              <input class="form-control" name="nama" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Email</label>
              <input class="form-control" type="email" name="email" required />
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
      if (pw !== fd.get('password2')) return UI.toast('Konfirmasi password tidak cocok.', 'danger');
      try {
        const u = await Auth.register({ nama: fd.get('nama'), email: fd.get('email'), password: pw });
        UI.toast('Pendaftaran berhasil. Silakan login.');
        Router.navigate('/login', true);
        Router.dispatch();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    });
  };
})();
