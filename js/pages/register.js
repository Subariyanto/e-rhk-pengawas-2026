// Register page — fleksibel:
//   1. NIP kosong + Kode kosong → tier=trial (5 hari, 10 kegiatan), butuh field Nama
//   2. NIP diisi + Kode kosong → tier=trial (5 hari), nama auto-lookup dari registry
//   3. NIP diisi + Kode legacy (XXXX-XXXX) → verify pakai KodeAktivasi.verify (per-NIP) → tier=full
//   4. Kode random PREFIX-XXXX-XXXX-XXXX (TRIAL/FULL) → cek di Codes.findCode → tier sesuai
//   5. Master code POKJAWAS-JEMBER-ERHK-2026 → tier=full
(function () {
  Page.Register = function () {
    UI.bareShell(`
      <div class="auth-wrap">
        <div class="auth-card">
          <div class="text-center mb-3">
            <div class="auth-logo mb-2">📋</div>
            <h1 class="mb-0">Daftar Akun Pengawas</h1>
            <div class="small text-muted">Daftar gratis &mdash; otomatis dapat <strong>${Tier.TRIAL_DAYS} hari TRIAL</strong> + <strong>${Tier.TRIAL_MAX_KEGIATAN} kegiatan</strong>.</div>
          </div>
          <div class="alert alert-info small py-2 mb-3">
            <i class="bi bi-info-circle"></i> Punya kode aktivasi <strong>FULL</strong> dari admin? Isi di field bawah agar akun langsung aktif penuh tanpa batas.
          </div>
          <form id="frmReg">
            <div class="mb-3">
              <label class="form-label">NIP <span class="text-muted small">(opsional, 18 digit)</span></label>
              <input class="form-control" name="nip" inputmode="numeric" maxlength="18" placeholder="18 digit NIP (kosongkan untuk trial tanpa NIP)" autofocus style="font-family:'Courier New',monospace;letter-spacing:.05em;" />
              <div id="nipInfo" class="form-text"></div>
            </div>
            <div class="mb-3" id="namaWrap" style="display:none;">
              <label class="form-label">Nama Lengkap</label>
              <input class="form-control" name="nama" placeholder="Nama lengkap (untuk trial tanpa NIP)" />
              <div class="form-text">Wajib diisi kalau NIP dikosongkan.</div>
            </div>
            <div class="mb-3" id="emailWrap" style="display:none;">
              <label class="form-label">Email</label>
              <input class="form-control" type="email" name="email" placeholder="contoh@email.com" autocomplete="email" />
              <div class="form-text">Wajib diisi kalau NIP dikosongkan. Email ini dipakai untuk <strong>login</strong>.</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Kode Aktivasi <span class="text-muted small">(opsional)</span></label>
              <input class="form-control" name="kode" placeholder="Kosongkan untuk TRIAL gratis" style="font-family:'Courier New',monospace;letter-spacing:.05em;text-transform:uppercase;" autocomplete="off" />
              <div class="form-text">Bisa kode legacy <code>XXXX-XXXX</code> (per-NIP) atau kode random <code>FULL-XXXX-XXXX-XXXX</code> / <code>TRIAL-XXXX-XXXX-XXXX</code>.</div>
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
          <div class="mt-2 text-center small">
            🛒 <a href="#/beli-lisensi">Beli Lisensi FULL</a>
          </div>
        </div>
      </div>
    `);

    const nipInput = document.querySelector('input[name="nip"]');
    const namaWrap = document.getElementById('namaWrap');
    const emailWrap = document.getElementById('emailWrap');
    const namaInput = document.querySelector('input[name="nama"]');
    const nipInfo = document.getElementById('nipInfo');

    function refreshNipInfo() {
      const nip = String(nipInput.value || '').replace(/[^0-9]/g, '');
      if (!nip) {
        namaWrap.style.display = '';
        emailWrap.style.display = '';
        nipInfo.innerHTML = '<span class="text-muted">NIP kosong &rarr; daftar mode <strong>TRIAL tanpa NIP</strong>. Isi nama &amp; email di bawah (email dipakai untuk login).</span>';
        return;
      }
      namaWrap.style.display = 'none';
      emailWrap.style.display = 'none';
      if (nip.length < 15) {
        nipInfo.innerHTML = '<span class="text-muted">Lengkapi NIP minimal 15 digit, atau kosongkan untuk trial tanpa NIP.</span>';
        return;
      }
      const reg = window.PengawasRegistry?.findByNip(nip);
      if (reg && reg.nama) {
        nipInfo.innerHTML = '<span class="text-success"><i class="bi bi-check-circle"></i> Terdaftar atas nama <strong>' + U.escapeHtml(reg.nama) + '</strong>' + (reg.wilayah ? ' &mdash; ' + U.escapeHtml(reg.wilayah) : '') + '</span>';
      } else {
        nipInfo.innerHTML = '<span class="text-muted">NIP tidak ditemukan di registry. Tetap bisa daftar &mdash; nama akan diisi otomatis dari NIP.</span>';
      }
    }
    nipInput.addEventListener('input', refreshNipInfo);
    refreshNipInfo();

    document.getElementById('frmReg').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const pw = fd.get('password');
      const nip = String(fd.get('nip') || '').replace(/[^0-9]/g, '');
      const kodeRaw = String(fd.get('kode') || '').trim();
      const kode = kodeRaw.toUpperCase();
      let nama = String(fd.get('nama') || '').trim();
      let emailInput = String(fd.get('email') || '').trim();

      if (pw !== fd.get('password2')) return UI.toast('Konfirmasi password tidak cocok.', 'danger');
      if (!pw || pw.length < 6) return UI.toast('Password minimal 6 karakter.', 'danger');

      // Tentukan tier dan validasi kode
      let tier = 'trial';
      let activatedWith = null;
      let trialExpiresAt = null;

      if (kode) {
        // SELALU refresh REMOTE_CODES dari gh-pages sebelum validasi.
        // Penting: kode yang baru dibuat admin harus langsung valid di device user,
        // tanpa perlu reload aplikasi. Cache-busted via raw URL ?t=Date.now().
        if (window.GithubSync) {
          try { await window.GithubSync.refreshFromPublic(); } catch (e) { console.warn('[register] refresh failed:', e); }
        }
        // Coba 1: kode random (PREFIX-XXXX-XXXX-XXXX) atau master
        const randCode = Codes.findCode(kode);
        if (randCode) {
          tier = (randCode.tier === 'trial') ? 'trial' : 'full';
          activatedWith = randCode.code;
        } else if (nip && /^[A-Z0-9-]+$/i.test(kodeRaw) && kodeRaw.replace(/-/g, '').length <= 12) {
          // Coba 2: kode legacy deterministik per-NIP (8 hex char, format XXXX-XXXX)
          try {
            const ok = await KodeAktivasi.verify(nip, kodeRaw);
            if (ok) {
              tier = 'full';
              activatedWith = '(legacy:' + kodeRaw.toUpperCase() + ')';
            } else {
              return UI.toast('Kode aktivasi tidak cocok dengan NIP ini, atau kode tidak valid/sudah dipakai.', 'danger');
            }
          } catch (err) {
            return UI.toast('Gagal validasi kode legacy: ' + err.message, 'danger');
          }
        } else {
          return UI.toast('Kode aktivasi tidak valid atau sudah dipakai. Kosongkan untuk daftar TRIAL gratis.', 'danger');
        }
      }

      // Validasi NIP & nama
      if (!nip) {
        // Trial tanpa NIP — wajib nama + email
        if (!nama) return UI.toast('Mohon isi nama lengkap (NIP dikosongkan).', 'danger');
        if (!emailInput) return UI.toast('Mohon isi email (NIP dikosongkan). Email dipakai untuk login.', 'danger');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) return UI.toast('Format email tidak valid.', 'danger');
        const dup = Auth.listUsers().find(x => x.email && x.email.toLowerCase() === emailInput.toLowerCase());
        if (dup) return UI.toast('Email ini sudah terdaftar. Silakan login atau pakai email lain.', 'danger');
      } else {
        if (nip.length < 15) return UI.toast('NIP tidak valid (minimal 15 digit angka), atau kosongkan untuk trial tanpa NIP.', 'danger');
        // Auto-lookup nama
        const reg = window.PengawasRegistry?.findByNip(nip);
        if (reg && reg.nama) nama = nama || reg.nama;
        if (!nama) nama = 'Pengawas ' + nip.slice(-4);
      }

      try {
        const existingByNip = nip && Auth.listUsers().find(u => u.nip === nip);
        if (existingByNip) {
          return UI.toast('NIP ini sudah terdaftar. Silakan login atau hubungi admin untuk reset password.', 'danger');
        }
        if (tier === 'trial') {
          trialExpiresAt = new Date(Date.now() + Tier.TRIAL_DAYS * 86400000).toISOString();
        }
        // Lisensi FULL dari registrasi langsung (kode FULL/legacy/master) berlaku 1 tahun sejak hari ini
        let fullExpiresAt = null;
        if (tier === 'full') {
          fullExpiresAt = new Date(Date.now() + Tier.LICENSE_DAYS * 86400000).toISOString();
        }
        const email = nip ? (nip + '@pengawas.local') : emailInput.toLowerCase();
        await Auth.register({ nama, email, password: pw, nip, tier, trialExpiresAt, fullExpiresAt, activatedWith });

        // Konsumsi kode random (master tidak dihabiskan, legacy juga tidak)
        if (kode) {
          const randCode = Codes.findCode(kode);
          if (randCode && !randCode.master) {
            // Cari user yang baru dibuat untuk consume berdasarkan id
            const u = Auth.listUsers().find(x => x.email === email);
            Codes.consumeCode(kode, u ? u.id : email);
            // Best-effort relay ke Supabase supaya admin laptop bisa auto-update
            // kolom "Dipakai Oleh". No-op kalau Supabase belum dikonfigurasi.
            if (window.SupabaseSync && window.SupabaseSync.isConfigured()) {
              window.SupabaseSync.reportActivation({
                code: kode,
                nama,
                nip: nip || null,
                email,
                tier,
              }).catch(() => {});
            }
          }
        }

        const loginId = nip || email;
        let pesan = 'Pendaftaran berhasil. Silakan login pakai ' + loginId + '.';
        if (tier === 'trial') pesan = '✅ TRIAL sukses (' + Tier.TRIAL_DAYS + ' hari, max ' + Tier.TRIAL_MAX_KEGIATAN + ' kegiatan). Login pakai: ' + loginId;
        else pesan = '🎉 FULL sukses (berlaku ' + Tier.LICENSE_DAYS + ' hari = 1 tahun). Login pakai: ' + loginId;
        UI.toast(pesan);
        // Pre-fill login field via sessionStorage agar mudah
        try { sessionStorage.setItem('erhk2026_last_login', loginId); } catch (e) {}
        Router.navigate('/login', true);
        Router.dispatch();
      } catch (err) {
        UI.toast(err.message, 'danger');
      }
    });
  };
})();
