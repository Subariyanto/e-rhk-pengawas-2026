// Login page
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
              <label class="form-label">Email</label>
              <input class="form-control" type="email" name="email" required autofocus />
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
          <hr />
          <div class="small text-muted">
            <strong>Akun admin default:</strong> <code>admin@local</code> / <code>admin123</code>
          </div>
        </div>
      </div>
    `);
    document.getElementById('frmLogin').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await Auth.login({ email: fd.get('email'), password: fd.get('password') });
        // Eksplisit ke dashboard, replaceState supaya tidak menumpuk history
        history.replaceState(null, '', '#/dashboard');
        Router.dispatch();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    });
  };
})();
