// Admin > Kode Aktivasi — generate kode untuk email pengawas + rotate secret.
(function () {
  Page.AdminAktivasi = function () {
    UI.shell('Kode Aktivasi', `
      <div class="alert alert-light border mb-3">
        <i class="bi bi-shield-check text-success"></i>
        Pengawas hanya bisa register kalau punya <strong>kode aktivasi</strong> dari Anda.
        Generate kode untuk email mereka, lalu kirim via WhatsApp / chat. Setiap email punya kode unik.
      </div>

      <div class="card mb-3">
        <div class="card-body">
          <h5 class="card-title"><i class="bi bi-key"></i> Generate Kode Aktivasi</h5>
          <p class="small text-muted mb-3">Masukkan email pengawas yang akan didaftarkan. Kode bersifat deterministik — selama secret tidak diubah, email yang sama selalu menghasilkan kode yang sama.</p>
          <div class="row g-2">
            <div class="col-md-8">
              <input id="emailIn" class="form-control" type="email" placeholder="contoh: pengawas@kemenag.go.id" autofocus />
            </div>
            <div class="col-md-4">
              <button class="btn btn-success w-100" id="btnGen"><i class="bi bi-key"></i> Generate Kode</button>
            </div>
          </div>
          <div id="result" class="mt-3"></div>
        </div>
      </div>

      <div class="card mb-3">
        <div class="card-body">
          <h5 class="card-title"><i class="bi bi-list-ol"></i> Generate Massal</h5>
          <p class="small text-muted mb-2">Tempel daftar email (satu per baris). Cocok untuk batch onboarding pengawas.</p>
          <textarea id="bulkIn" class="form-control" rows="5" placeholder="email1@kemenag.go.id&#10;email2@kemenag.go.id&#10;email3@kemenag.go.id"></textarea>
          <div class="mt-2">
            <button class="btn btn-outline-success" id="btnBulk"><i class="bi bi-collection"></i> Generate Semua</button>
          </div>
          <div id="bulkResult" class="mt-3"></div>
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <h5 class="card-title"><i class="bi bi-shield-lock"></i> Secret Aktivasi <small class="text-muted" id="secretBadge"></small></h5>
          <p class="small text-muted">Secret dipakai untuk men-derive kode dari email. Ubah secret kalau ada kode yang bocor — semua kode yang sudah dibagikan akan invalid, tapi user yang sudah terdaftar tetap bisa login.</p>
          <div class="row g-2">
            <div class="col-md-8">
              <input id="secretIn" class="form-control" value="${U.escapeHtml(KodeAktivasi.getSecret())}" />
            </div>
            <div class="col-md-4">
              <button class="btn btn-warning w-100" id="btnSecret"><i class="bi bi-shield-lock"></i> Simpan Secret Baru</button>
            </div>
          </div>
          <div class="mt-2">
            <button class="btn btn-sm btn-outline-secondary" id="btnRandom"><i class="bi bi-dice-5"></i> Generate Secret Acak</button>
            <button class="btn btn-sm btn-outline-secondary" id="btnReveal"><i class="bi bi-eye"></i> Tampilkan/Sembunyikan</button>
          </div>
        </div>
      </div>
    `);

    // Status badge default secret
    const badge = document.getElementById('secretBadge');
    if (KodeAktivasi.isDefault()) {
      badge.innerHTML = '<span class="badge bg-warning text-dark">menggunakan default — disarankan ganti</span>';
    } else {
      badge.innerHTML = '<span class="badge bg-success">custom</span>';
    }

    // Single generate
    document.getElementById('btnGen').addEventListener('click', () => doGenerate());
    document.getElementById('emailIn').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); doGenerate(); }
    });

    async function doGenerate() {
      const e = document.getElementById('emailIn').value.trim();
      if (!e || !/^.+@.+\..+$/.test(e)) return UI.toast('Email tidak valid.', 'danger');
      const k = await KodeAktivasi.generate(e);
      const baseUrl = location.origin + location.pathname.replace(/\/+$/, '/') + '#/register';
      document.getElementById('result').innerHTML = `
        <div class="alert alert-success mb-0">
          <div class="small text-muted">Kode aktivasi untuk</div>
          <div class="fw-bold">${U.escapeHtml(e)}</div>
          <div class="display-6 mt-2 mb-2" style="font-family:'Courier New',monospace;letter-spacing:.15em;">${k}</div>
          <div class="small text-muted mb-2">Daftar di: <code>${U.escapeHtml(baseUrl)}</code></div>
          <button class="btn btn-sm btn-success" id="btnCopyKode"><i class="bi bi-clipboard"></i> Salin Kode</button>
          <button class="btn btn-sm btn-outline-success" id="btnCopyMsg"><i class="bi bi-clipboard-check"></i> Salin Pesan Lengkap</button>
          <a class="btn btn-sm btn-outline-success" id="btnWA" target="_blank"><i class="bi bi-whatsapp"></i> Kirim via WhatsApp</a>
        </div>
      `;
      const msgFull = `Halo Bapak/Ibu,\n\nBerikut kode aktivasi untuk daftar di aplikasi e-SKP Pengawas Madrasah 2026:\n\nEmail: ${e}\nKode Aktivasi: ${k}\n\nLink Daftar: ${baseUrl}\n\nGunakan email & kode di atas saat mengisi form pendaftaran. Terima kasih.`;
      document.getElementById('btnCopyKode').onclick = async () => {
        try { await navigator.clipboard.writeText(k); UI.toast('Kode tersalin.'); } catch (_) { UI.toast('Gagal salin.', 'danger'); }
      };
      document.getElementById('btnCopyMsg').onclick = async () => {
        try { await navigator.clipboard.writeText(msgFull); UI.toast('Pesan tersalin.'); } catch (_) { UI.toast('Gagal salin.', 'danger'); }
      };
      document.getElementById('btnWA').href = 'https://wa.me/?text=' + encodeURIComponent(msgFull);
    }

    // Bulk generate
    document.getElementById('btnBulk').addEventListener('click', async () => {
      const raw = document.getElementById('bulkIn').value || '';
      const emails = raw.split(/\r?\n|,|;/).map(s => s.trim()).filter(s => s && /^.+@.+\..+$/.test(s));
      if (!emails.length) return UI.toast('Tidak ada email valid.', 'danger');
      const rows = [];
      for (const em of emails) {
        rows.push({ email: em, kode: await KodeAktivasi.generate(em) });
      }
      const tbl = `
        <div class="table-responsive">
          <table class="table table-sm table-bordered align-middle">
            <thead class="table-light"><tr><th>Email</th><th style="font-family:'Courier New',monospace;">Kode</th></tr></thead>
            <tbody>${rows.map(r => `<tr><td>${U.escapeHtml(r.email)}</td><td style="font-family:'Courier New',monospace;letter-spacing:.1em;">${r.kode}</td></tr>`).join('')}</tbody>
          </table>
        </div>
        <button class="btn btn-sm btn-outline-success" id="btnBulkCsv"><i class="bi bi-filetype-csv"></i> Export CSV</button>
        <button class="btn btn-sm btn-outline-success" id="btnBulkCopy"><i class="bi bi-clipboard"></i> Salin Semua (CSV)</button>
      `;
      document.getElementById('bulkResult').innerHTML = tbl;
      const csv = 'email,kode\n' + rows.map(r => `${r.email},${r.kode}`).join('\n');
      document.getElementById('btnBulkCsv').onclick = () => {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        U.downloadBlob(blob, 'kode-aktivasi-' + U.fmtTanggalISO(new Date()) + '.csv');
      };
      document.getElementById('btnBulkCopy').onclick = async () => {
        try { await navigator.clipboard.writeText(csv); UI.toast('CSV tersalin.'); } catch (_) { UI.toast('Gagal salin.', 'danger'); }
      };
    });

    // Secret rotate
    document.getElementById('btnSecret').addEventListener('click', async () => {
      const v = document.getElementById('secretIn').value.trim();
      if (!v) return UI.toast('Secret tidak boleh kosong.', 'danger');
      if (v === KodeAktivasi.getSecret()) return UI.toast('Secret tidak berubah.', 'secondary');
      if (!await UI.confirmDialog('Ubah secret? Semua kode aktivasi yang sudah dibagikan akan invalid. Pengawas yang sudah register tetap bisa login.')) return;
      KodeAktivasi.setSecret(v);
      UI.toast('Secret tersimpan.');
      Page.AdminAktivasi();
    });

    document.getElementById('btnRandom').addEventListener('click', () => {
      const arr = new Uint8Array(24);
      crypto.getRandomValues(arr);
      const s = 'JBR-' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32).toUpperCase();
      document.getElementById('secretIn').value = s;
      UI.toast('Secret acak digenerate. Klik Simpan untuk aktifkan.');
    });

    document.getElementById('btnReveal').addEventListener('click', () => {
      const inp = document.getElementById('secretIn');
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });
    // Default tampilkan password mask
    document.getElementById('secretIn').type = 'password';
  };
})();
