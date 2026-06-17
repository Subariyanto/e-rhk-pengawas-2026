// Halaman public "Beli Lisensi FULL". Bisa diakses tanpa login (#/beli-lisensi).
// Kalau user sudah login, ada tombol "Aktivasi Kode FULL" untuk upgrade akun saat ini.
(function () {
  Page.BeliLisensi = function () {
    const s = Codes.getPurchaseSettings();
    const u = Auth.currentUser();
    const isLogin = !!u;

    const html = `
      <div class="auth-wrap" style="min-height:100vh;align-items:flex-start;padding:32px 12px;">
        <div class="auth-card" style="max-width:720px;width:100%;">
          <div class="text-center mb-3">
            <div class="auth-logo">🛒</div>
            <h1 class="mt-3 mb-0">Beli Lisensi FULL</h1>
            <div class="small text-muted">Aktifkan semua fitur tanpa batasan trial.</div>
          </div>

          <div class="card mb-3 border-success">
            <div class="card-body">
              <h5 class="card-title text-success mb-2"><i class="bi bi-stars"></i> Yang Anda Dapatkan dengan Lisensi FULL</h5>
              <ul class="mb-0">
                <li>✅ Tanpa batas waktu (akun aktif selamanya)</li>
                <li>✅ Tanpa batas jumlah kegiatan & eviden</li>
                <li>✅ Cetak laporan tanpa watermark TRIAL</li>
                <li>✅ Semua menu (Master RHK, Kegiatan, Eviden, Arsip, Rekap, Laporan Triwulan)</li>
                <li>✅ Backup &amp; Restore data per akun</li>
                <li>✅ Update aplikasi otomatis (PWA)</li>
              </ul>
            </div>
          </div>

          ${s.harga ? `
          <div class="text-center mb-3">
            <div class="small text-muted">Harga Lisensi</div>
            <div class="display-6 fw-bold text-success">${U.escapeHtml(s.harga)}</div>
          </div>` : ''}

          <div class="card mb-3" style="background:#fff7ed;border-color:#f59e0b;">
            <div class="card-body">
              <h5 class="card-title text-warning-emphasis mb-2"><i class="bi bi-list-ol"></i> Cara Membeli</h5>
              <ol class="mb-0">
                <li>Klik tombol <strong>📲 Pesan via WhatsApp</strong> di bawah</li>
                <li>Lakukan pembayaran sesuai instruksi admin</li>
                <li>Kirim bukti transfer via WA</li>
                <li>Kode Aktivasi FULL dikirim balik via WA dalam <strong>1–6 jam</strong> (jam kerja)</li>
                <li>Login aplikasi → klik banner kuning di dashboard → <strong>Masukkan Kode FULL</strong> → selesai ✅</li>
              </ol>
            </div>
          </div>

          ${s.bankInfo ? `
          <div class="card mb-3 bg-light">
            <div class="card-body">
              <h6 class="card-title"><i class="bi bi-bank"></i> Info Pembayaran</h6>
              <pre style="white-space:pre-wrap;font-family:inherit;margin:0;color:#334155">${U.escapeHtml(s.bankInfo)}</pre>
              ${s.qrisImage ? `
                <div class="mt-3 text-center">
                  <img src="${U.escapeHtml(s.qrisImage)}" alt="QRIS" style="max-width:280px;width:100%;height:auto;border:1px solid #e5e7eb;border-radius:8px;padding:6px;background:#fff;" onerror="this.style.display='none'">
                  <div class="small text-muted mt-1"><i class="bi bi-qr-code-scan"></i> Scan QRIS di atas pakai aplikasi e-wallet / m-banking</div>
                </div>
              ` : ''}
            </div>
          </div>` : ''}

          <div class="d-grid gap-2 mb-3">
            ${s.waNumber
              ? `<button class="btn btn-success btn-lg" id="btnWaOrder"><i class="bi bi-whatsapp"></i> Pesan via WhatsApp <span class="small opacity-75">(+${U.escapeHtml(s.waNumber)})</span></button>`
              : `<div class="alert alert-warning mb-0">
                  <i class="bi bi-exclamation-triangle"></i> <strong>Nomor WA admin belum dikonfigurasi.</strong>
                  <div class="small mt-1">Kalau Anda <strong>admin</strong> dan sudah set nomor WA: tekan <kbd>Ctrl+F5</kbd> untuk hard reload (cache aplikasi mungkin belum sinkron).</div>
                  <button class="btn btn-sm btn-outline-warning mt-2" id="btnReloadCfg"><i class="bi bi-arrow-clockwise"></i> Muat ulang konfigurasi</button>
                </div>`
            }
            <button class="btn btn-outline-success" id="btnActivate"><i class="bi bi-key"></i> Aktivasi Kode FULL</button>
          </div>

          <div class="text-center small">
            ${isLogin
              ? '<a href="#/dashboard"><i class="bi bi-arrow-left"></i> Kembali ke Dashboard</a>'
              : '<a href="#/login"><i class="bi bi-arrow-left"></i> Kembali ke Login</a>'
            }
          </div>
        </div>
      </div>
    `;
    UI.bareShell(html);

    const btnReload = document.getElementById('btnReloadCfg');
    if (btnReload) {
      btnReload.addEventListener('click', () => {
        Page.BeliLisensi();
      });
    }

    const btnWa = document.getElementById('btnWaOrder');
    if (btnWa) {
      btnWa.addEventListener('click', () => {
        const ss = Codes.getPurchaseSettings();
        if (!ss.waNumber) return UI.toast('Nomor WA admin belum dikonfigurasi.', 'danger');
        const text = Codes.fillTemplate(ss.orderTemplate, { APP: ss.appName, URL: ss.appUrl });
        const url = Codes.buildWaLink(ss.waNumber, text);
        if (!url) return UI.toast('Nomor WA tidak valid.', 'danger');
        window.open(url, '_blank');
      });
    }

    document.getElementById('btnActivate').addEventListener('click', async () => {
      const kode = prompt('Masukkan Kode Aktivasi FULL:');
      if (kode == null) return;
      const c = String(kode).trim();
      if (!c) return;
      // SELALU refresh REMOTE_CODES dari gh-pages sebelum lookup. Kode baru
      // dari admin harus langsung valid tanpa perlu reload aplikasi.
      if (window.GithubSync) {
        UI.toast('Memuat daftar kode terbaru...', 'info');
        try { await window.GithubSync.refreshFromPublic(); } catch (e) { console.warn('refresh failed:', e); }
      }
      // Diagnostik bertingkat
      const found = Codes.findCode(c);
      if (!found) {
        // Kode benar-benar tidak ada di registry, ATAU sudah dipakai / dicabut
        const any = Codes.findCodeAny(c);
        if (any) {
          if (any.usedBy) return UI.toast('Kode "' + c.toUpperCase() + '" sudah pernah dipakai oleh akun lain. Hubungi admin untuk kode baru.', 'danger');
          if (any.revoked) return UI.toast('Kode "' + c.toUpperCase() + '" sudah dicabut/expired oleh admin.', 'danger');
        }
        // Kode benar-benar tidak ada → kasih hint cross-device
        const msg = 'Kode "' + c.toUpperCase() + '" tidak ditemukan.\n\nKemungkinan penyebab:\n1. Salah ketik (cek huruf O vs angka 0, I vs 1)\n2. Kode di-generate di browser/device lain (localStorage tidak sinkron lintas device)\n3. Belum dideploy ke gh-pages (kalau pakai bundled codes)\n\nUntuk admin: cek halaman Kode Aktivasi di device yang sama dengan tempat generate, atau coba master code POKJAWAS-JEMBER-ERHK-2026.';
        if (window.confirm) alert(msg);
        else UI.toast('Kode tidak ditemukan. Cek pesan di console.', 'danger');
        console.warn('[Aktivasi] kode tidak ditemukan:', c.toUpperCase(), '\nKode di registry:', Codes.getCodes().length, 'item');
        return;
      }
      if (found.tier !== 'full') {
        return UI.toast('Kode "' + c.toUpperCase() + '" valid tapi tier-nya "' + found.tier + '", bukan FULL. Untuk upgrade FULL, butuh kode FULL-* atau master code.', 'warning');
      }
      const cur = Auth.currentUser();
      if (!cur) {
        UI.toast('Anda perlu login terlebih dahulu untuk aktivasi. Silakan login dulu, kemudian masukkan kode dari banner dashboard.', 'warning');
        Router.navigate('/login', true);
        Router.dispatch();
        return;
      }
      const wasFull = (cur.tier === 'full') && cur.fullExpiresAt;
      Tier.upgradeUserToFull(cur.id);
      try { window.applyTrialWatermark && window.applyTrialWatermark(); } catch (_) {}
      if (!found.master) {
        Codes.consumeCode(c, cur.id);
        if (window.SupabaseSync && window.SupabaseSync.isConfigured()) {
          window.SupabaseSync.reportActivation({
            code: c,
            nama: cur.nama || cur.email,
            nip: cur.nip || null,
            email: cur.email,
            tier: 'full',
          }).catch(() => {});
        }
      }
      const after = Auth.currentUser();
      const tgl = after.fullExpiresAt ? new Date(after.fullExpiresAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-';
      const pesan = wasFull
        ? '🎉 Lisensi FULL diperpanjang. Berlaku sampai ' + tgl + '.'
        : '🎉 Akun berhasil di-upgrade ke FULL. Berlaku sampai ' + tgl + '.';
      UI.toast(pesan);
      Router.navigate('/dashboard', true);
      Router.dispatch();
    });
  };
})();
