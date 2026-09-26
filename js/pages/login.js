// Login page — terima NIP atau email.
// Termasuk alur "Masuk pakai Kode Aktivasi" untuk PERANGKAT BARU (model 1 kode = 1 akun):
// kode FULL milik Anda bisa dipakai membuat ulang akun di perangkat mana pun
// (tentukan password baru). Data tetap lokal per perangkat — tidak ikut tersalin.
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

          <div class="mt-3 pt-3 border-top text-center small">
            <a href="#" id="lnkCodeLogin"><i class="bi bi-key"></i> Perangkat baru / pindah HP? <strong>Masuk pakai Kode Aktivasi</strong></a>
          </div>
          <div id="codeLoginWrap" style="display:none;" class="mt-2">
            <div class="alert alert-info small py-2 mb-2">
              <i class="bi bi-info-circle"></i> Masukkan <strong>Kode Aktivasi FULL</strong> Anda. Kalau akun belum ada di perangkat ini, kami buatkan (tentukan password). Data lama tetap aman di perangkat asal.
            </div>
            <input class="form-control mb-2" id="clKode" placeholder="FULL-XXXX-XXXX-XXXX" autocomplete="off" style="font-family:'Courier New',monospace;letter-spacing:.05em;text-transform:uppercase;" />
            <div id="clResult" class="small mb-2"></div>
            <div id="clForm" style="display:none;">
              <div class="mb-2"><label class="form-label mb-1">Nama Lengkap</label><input class="form-control" id="clNama" /></div>
              <div class="mb-2"><label class="form-label mb-1">NIP <span class="text-muted small">(opsional)</span></label><input class="form-control" id="clNip" inputmode="numeric" maxlength="18" /></div>
              <div class="mb-2"><label class="form-label mb-1">Email <span class="text-muted small">(wajib bila tanpa NIP)</span></label><input class="form-control" type="email" id="clEmail" autocomplete="email" /></div>
              <div class="mb-2"><label class="form-label mb-1">Password (min 6)</label><input class="form-control" type="password" id="clPw" /></div>
              <div class="mb-2"><label class="form-label mb-1">Konfirmasi Password</label><input class="form-control" type="password" id="clPw2" /></div>
              <button class="btn btn-success w-100" id="clSubmit" type="button"><i class="bi bi-person-check"></i> Klaim &amp; Masuk</button>
            </div>
          </div>

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
      const idInput = String(fd.get('email') || '').trim();
      const pwInput = String(fd.get('password') || '');
      try {
        // 1) Verifikasi via server Pusat Lisensi (akun lintas perangkat, pola PKKM).
        let server = { ok: false, reason: 'no-module' };
        try { server = await Auth.loginWithServer(idInput, pwInput); } catch (err) { server = { ok: false, reason: 'network' }; }
        if (server.ok) {
          try { window.applyTrialWatermark && window.applyTrialWatermark(); } catch (_) {}
          history.replaceState(null, '', '#/dashboard');
          Router.dispatch();
          return;
        }
        // 2) Server menolak tegas (akun dinonaktifkan) → blokir.
        if (server.reason === 'revoked' || server.reason === 'inactive') {
          UI.toast(Auth.accountReasonMsg(server.reason), 'danger');
          return;
        }
        // 3) Fallback login lokal (offline, akun lama, atau trial tanpa akun server).
        await Auth.login({ email: idInput, password: pwInput });
        try { window.applyTrialWatermark && window.applyTrialWatermark(); } catch (_) {}
        history.replaceState(null, '', '#/dashboard');
        Router.dispatch();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    });

    // ===== Alur "Masuk pakai Kode Aktivasi" (perangkat baru) =====
    const lnk = document.getElementById('lnkCodeLogin');
    const wrapCode = document.getElementById('codeLoginWrap');
    const kodeInput = document.getElementById('clKode');
    const clResult = document.getElementById('clResult');
    const clForm = document.getElementById('clForm');
    const clSubmit = document.getElementById('clSubmit');
    let identified = null;

    // Referensi identitas pemilik kode (untuk cek kecocokan saat klaim).
    function ownerRef(id) {
      const o = (id && id.owner) || {};
      return { nip: o.nip || null, email: o.email || null };
    }

    function prefillForm(id) {
      const own = (id && id.owner) || {};
      const nNama = document.getElementById('clNama');
      const nNip = document.getElementById('clNip');
      const nEmail = document.getElementById('clEmail');
      if (nNama && !nNama.value) nNama.value = own.name || '';
      if (nNip && !nNip.value) nNip.value = own.nip || '';
      if (nEmail && !nEmail.value) nEmail.value = own.email || '';
    }

    async function doIdentify() {
      const raw = String(kodeInput.value || '').trim();
      identified = null;
      clForm.style.display = 'none';
      if (!raw) { clResult.innerHTML = ''; return; }
      if (window.GithubSync) { try { await window.GithubSync.refreshFromPublic(); } catch (e) {} }
      const id = await Codes.identifyCode(raw);
      identified = id;
      if (!id.ok) {
        if (id.reason === 'revoked') clResult.innerHTML = '<span class="text-danger">Kode ini sudah dicabut/expired oleh admin.</span>';
        else clResult.innerHTML = '<span class="text-danger">Kode tidak ditemukan. Cek penulisan (huruf O vs angka 0, I vs 1) atau minta kode baru ke admin.</span>';
        return;
      }
      if (id.master) {
        clResult.innerHTML = '<span class="text-warning-emphasis">Ini <strong>master code</strong>. Silakan login/daftar biasa; aktivasi bisa juga lewat menu Beli Lisensi.</span>';
        return;
      }
      if (!id.claimed) {
        clResult.innerHTML = '<span class="text-success">Kode <strong>belum dipakai</strong>. Buat akun FULL baru di perangkat ini?</span>';
        clSubmit.innerHTML = '<i class="bi bi-person-plus"></i> Daftar akun FULL dengan kode ini';
        clForm.style.display = '';
        prefillForm(id);
        return;
      }
      // Sudah diklaim seseorang.
      const own = id.owner || {};
      const nm = own.name || own.nip || own.email || 'akun lain';
      const existLocal = Auth.listUsers().find(u =>
        (own.nip && u.nip === own.nip) ||
        (own.email && u.email && u.email.toLowerCase() === String(own.email).toLowerCase())
      );
      if (existLocal) {
        clResult.innerHTML = '<span class="text-success">Kode ini milik <strong>' + U.escapeHtml(nm) + '</strong>, dan akunnya <strong>sudah ada di perangkat ini</strong>. Silakan login pakai ' + U.escapeHtml(own.nip || own.email || 'akun Anda') + '.</span>';
        const inp = document.getElementById('loginIdInput');
        if (inp) inp.value = own.nip || own.email || '';
        clForm.style.display = 'none';
        return;
      }
      clResult.innerHTML = '<span class="text-success">Kode ini terdaftar atas nama <strong>' + U.escapeHtml(nm) + '</strong>. Kalau ini akun Anda, klaim di perangkat ini (tentukan password).</span>';
      clSubmit.innerHTML = '<i class="bi bi-person-check"></i> Klaim &amp; Masuk';
      clForm.style.display = '';
      prefillForm(id);
    }

    if (lnk) lnk.addEventListener('click', (e) => {
      e.preventDefault();
      const show = (wrapCode.style.display === 'none' || !wrapCode.style.display);
      wrapCode.style.display = show ? '' : 'none';
      if (show && kodeInput) kodeInput.focus();
    });

    let _t = null;
    if (kodeInput) {
      kodeInput.addEventListener('input', () => { clearTimeout(_t); _t = setTimeout(doIdentify, 400); });
      kodeInput.addEventListener('blur', doIdentify);
    }

    if (clSubmit) clSubmit.addEventListener('click', async () => {
      let id = identified;
      if (!id) { await doIdentify(); id = identified; }
      if (!id || !id.ok || id.master) return;

      const nama = String(document.getElementById('clNama').value || '').trim();
      const nip = String(document.getElementById('clNip').value || '').replace(/[^0-9]/g, '');
      const email = String(document.getElementById('clEmail').value || '').trim().toLowerCase();
      const pw = document.getElementById('clPw').value;
      const pw2 = document.getElementById('clPw2').value;

      if (pw !== pw2) return UI.toast('Konfirmasi password tidak cocok.', 'danger');
      if (!pw || pw.length < 6) return UI.toast('Password minimal 6 karakter.', 'danger');
      if (!nip && !nama) return UI.toast('Mohon isi nama lengkap.', 'danger');
      if (!nip && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return UI.toast('Email valid wajib diisi kalau NIP kosong (dipakai untuk login).', 'danger');
      if (nip && nip.length < 15) return UI.toast('NIP minimal 15 digit, atau kosongkan.', 'danger');

      const users = Auth.listUsers();
      if (nip && users.find(u => u.nip === nip)) return UI.toast('NIP ini sudah terdaftar di perangkat ini. Silakan login.', 'danger');
      if (!nip && email && users.find(u => u.email && u.email.toLowerCase() === email)) return UI.toast('Email ini sudah terdaftar di perangkat ini. Silakan login.', 'danger');

      // Kalau kode sudah diklaim, identitas yang diisi harus cocok dengan pemilik.
      if (id.claimed && !Codes.isSameOwner(ownerRef(id), { nip: nip || null, email: email || null })) {
        return UI.toast('Identitas yang Anda isi tidak cocok dengan pemilik kode. Masukkan NIP/email yang sama seperti saat aktivasi pertama.', 'danger');
      }

      const emailFinal = nip ? (nip + '@pengawas.local') : email;
      try {
        // Daftarkan ke akun server (1 kode = 1 akun) supaya bisa login lintas perangkat.
        const username = nip || email;
        let serverHash = null;
        const sreg = await Auth.registerServerAccount({
          code: id.code, username: username, password: pw,
          fullname: nama || ('Pengawas ' + (nip ? nip.slice(-4) : '')), madrasah: '',
        });
        if (sreg.ok) {
          serverHash = sreg.hash || null;
        } else if (sreg.reason === 'network' || sreg.reason === 'no-module') {
          UI.toast('Server Pusat Lisensi tidak terjangkau — akun dibuat lokal; sinkron akun menyusul saat online.', 'warning');
        } else if (sreg.reason === 'account_exists') {
          return UI.toast('ID akun "' + username + '" sudah terdaftar di server. Silakan login biasa.', 'danger');
        } else if (sreg.reason === 'code_used') {
          return UI.toast('Kode ini sudah dipakai akun lain di server.', 'danger');
        } else if (sreg.reason !== 'invalid_code') {
          // invalid_code bisa berarti kode legacy (tak terdaftar di licenses) → lanjut lokal.
          return UI.toast('Registrasi akun ke server gagal: ' + Auth.accountReasonMsg(sreg.reason), 'danger');
        }
        const u = await Auth.register({
          nama: nama || ('Pengawas ' + (nip ? nip.slice(-4) : '')),
          email: emailFinal,
          password: pw,
          nip,
          tier: 'full',
          fullExpiresAt: new Date(Date.now() + Tier.LICENSE_DAYS * 86400000).toISOString(),
          activatedWith: id.code,
        });
        if (serverHash) Auth.updateUser(u.id, { serverHash: serverHash, server_synced: true });
        const ownerInfo = {
          usedBy: Codes.stableOwnerKey({ nip, email: emailFinal }) || u.id,
          ownerName: u.nama,
          ownerNip: nip || null,
          ownerEmail: (!nip && email) ? email : null,
        };
        Codes.consumeCode(id.code, u.id, ownerInfo);
        if (window.SupabaseSync && window.SupabaseSync.isConfigured()) {
          window.SupabaseSync.reportActivation({ code: id.code, nama: u.nama, nip: nip || null, email: emailFinal, tier: 'full' }).catch(() => {});
        }
        await Auth.login({ email: emailFinal, password: pw });
        try { window.applyTrialWatermark && window.applyTrialWatermark(); } catch (_) {}
        UI.toast('✅ Berhasil. Akun FULL aktif di perangkat ini.');
        history.replaceState(null, '', '#/dashboard');
        Router.dispatch();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    });
  };
})();
