// Login page — terima NIP atau email
(function () {
  Page.Login = function () {
    UI.bareShell(`
      <div class="auth-wrap">
        <div class="auth-card">
          <div class="text-center mb-3">
            <div class="auth-logo">📋</div>
            <h1 class="mt-3 mb-0">E-RHK Pengawas Madrasah 2026</h1>
            <div class="small text-muted">Otomatisasi Eviden RHK</div>
          </div>
          <form id="frmLogin">
            <div class="mb-3">
              <label class="form-label">NIP atau Email</label>
              <input class="form-control" name="email" required autofocus placeholder="18 digit NIP atau email" id="loginIdInput" />
              <div class="form-text">Pengawas: masukkan NIP. Trial tanpa NIP: pakai email yang didaftarkan.</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Password</label>
              <input class="form-control" type="password" name="password" required />
            </div>
            <button class="btn btn-success w-100" type="submit"><i class="bi bi-box-arrow-in-right"></i> Masuk</button>
          </form>
          <div class="mt-3 text-center small">
            Belum punya akun? <a href="#/register">Daftar di sini</a>
          </div>
          <div class="mt-2 text-center small">
            🛒 <a href="#/beli-lisensi">Beli Lisensi FULL</a>
          </div>
        </div>
      </div>
    `);
    // Pre-fill from last register if available
    try {
      const last = sessionStorage.getItem('erhk2026_last_login');
      if (last) {
        const inp = document.getElementById('loginIdInput');
        if (inp) inp.value = last;
        sessionStorage.removeItem('erhk2026_last_login');
      }
    } catch (e) {}

    document.getElementById('frmLogin').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await Auth.login({ email: fd.get('email'), password: fd.get('password') });
        history.replaceState(null, '', '#/dashboard');
        Router.dispatch();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    });
  };
})();
