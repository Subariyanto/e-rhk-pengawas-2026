// verify.js — Halaman Verifikasi Dokumen TTE QR Code
(function () {
  Page.Verify = function () {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const code = params.get('code') || '';

    if (!code) {
      renderNotFound('Kode verifikasi tidak ditemukan.');
      return;
    }

    const record = Signature.findTTERecord(code);

    if (!record) {
      renderNotFound(`Kode verifikasi <strong>${U.escapeHtml(code)}</strong> tidak ditemukan dalam sistem.`);
      return;
    }

    renderValid(record);
  };

  function renderValid(r) {
    const signedDate = new Date(r.signed_at);
    const tglStr = U.fmtTanggal(signedDate);
    const jamStr = signedDate.toLocaleTimeString('id-ID');

    UI.shell('Verifikasi Dokumen', `
      <div class="container" style="max-width:600px;margin:0 auto;">
        <div class="card border-success">
          <div class="card-header bg-success text-white text-center">
            <i class="bi bi-shield-check" style="font-size:48px;"></i>
            <h4 class="mt-2 mb-0">DOKUMEN VALID</h4>
            <small>Telah ditandatangani secara elektronik</small>
          </div>
          <div class="card-body">
            <div class="text-center mb-3">
              <img src="icons/icon-192.png" alt="Logo" style="width:60px;" onerror="this.style.display='none'" />
              <h5 class="mt-2">e-RHK Pengawas</h5>
              <small class="text-muted">Sistem Verifikasi Dokumen Elektronik</small>
            </div>

            <table class="table table-sm table-borderless">
              <tr><td style="width:40%;font-weight:600;">Kode Verifikasi</td><td><code>${U.escapeHtml(r.verification_code)}</code></td></tr>
              <tr><td style="font-weight:600;">No. Dokumen</td><td>${U.escapeHtml(r.nomor_dokumen)}</td></tr>
              <tr><td colspan="2"><hr class="my-1" /></td></tr>
              <tr><td style="font-weight:600;">Nama</td><td>${U.escapeHtml(r.nama_penandatangan)}</td></tr>
              <tr><td style="font-weight:600;">NIP</td><td>${U.escapeHtml(r.nip_penandatangan)}</td></tr>
              <tr><td style="font-weight:600;">Jabatan</td><td>${U.escapeHtml(r.jabatan_penandatangan)}</td></tr>
              <tr><td style="font-weight:600;">Unit Kerja</td><td>${U.escapeHtml(r.unit_kerja)}</td></tr>
              <tr><td colspan="2"><hr class="my-1" /></td></tr>
              <tr><td style="font-weight:600;">RHK</td><td>${U.escapeHtml(r.rhk_id || '-')}</td></tr>
              <tr><td style="font-weight:600;">Judul Eviden</td><td>${U.escapeHtml(r.eviden_title || '-')}</td></tr>
              <tr><td colspan="2"><hr class="my-1" /></td></tr>
              <tr><td style="font-weight:600;">Tanggal TTE</td><td>${tglStr} ${jamStr}</td></tr>
              <tr><td style="font-weight:600;">Status</td><td><span class="badge bg-success">VALID</span></td></tr>
            </table>

            <div class="alert alert-success mt-3 mb-0" style="font-size:9pt;">
              <i class="bi bi-info-circle"></i> Dokumen ini benar telah ditandatangani secara elektronik melalui aplikasi e-RHK Pengawas. Tanda tangan elektronik ini sah sesuai ketentuan peraturan perundang-undangan.
            </div>
          </div>
        </div>
        <div class="text-center mt-3 mb-4">
          <a href="${window.location.pathname}" class="btn btn-outline-primary btn-sm"><i class="bi bi-house"></i> Kembali ke Aplikasi</a>
        </div>
      </div>
    `, 'verify-page');
  }

  function renderNotFound(message) {
    UI.shell('Verifikasi Dokumen', `
      <div class="container" style="max-width:600px;margin:0 auto;">
        <div class="card border-danger">
          <div class="card-header bg-danger text-white text-center">
            <i class="bi bi-shield-x" style="font-size:48px;"></i>
            <h4 class="mt-2 mb-0">DOKUMEN TIDAK VALID</h4>
            <small>Kode verifikasi tidak ditemukan</small>
          </div>
          <div class="card-body text-center">
            <p>${message}</p>
            <p class="text-muted" style="font-size:9pt;">Pastikan kode verifikasi yang Anda masukkan benar. Jika Anda yakin kode ini valid, silakan hubungi pengawas yang bersangkutan.</p>
          </div>
        </div>
        <div class="text-center mt-3 mb-4">
          <a href="${window.location.pathname}" class="btn btn-outline-primary btn-sm"><i class="bi bi-house"></i> Kembali ke Aplikasi</a>
        </div>
      </div>
    `, 'verify-page');
  }
})();
