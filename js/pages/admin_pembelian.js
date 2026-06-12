// Admin > Pengaturan Pembelian Lisensi
// Edit: nomor WA, harga, info bank, nama aplikasi, URL, template pesan order, template kirim kode.
// Storage: Store.setGlobal('purchase_settings', {...})
(function () {
  Page.AdminPembelian = function () {
    const s = Codes.getPurchaseSettings();

    UI.shell('Pengaturan Pembelian', `
      <div class="alert alert-info small mb-3">
        <i class="bi bi-info-circle"></i> <strong>Penting tentang penyimpanan:</strong>
        Pengaturan ini disimpan di <strong>browser Bapak/Ibu saja</strong> (localStorage device ini). User lain yang buka <code>#/beli-lisensi</code> dari HP/laptop mereka <strong>tidak otomatis melihat nomor WA Bapak</strong>.
        <br>Untuk membuat nomor WA muncul ke <strong>semua user</strong>, edit file <code>js/data/purchase_default.js</code> di repo (commit + push gh-pages). Atau minta Bari untuk update default lewat chat.
      </div>

      <div class="alert alert-light border mb-3">
        <i class="bi bi-info-circle text-success"></i>
        Data ini muncul di halaman publik <code>#/beli-lisensi</code> dan dipakai sebagai template pesan WhatsApp ke calon pembeli.
        Pakai placeholder <code>{KODE}</code>, <code>{APP}</code>, <code>{URL}</code>, <code>{NIP}</code>, <code>{NAMA}</code>.
      </div>

      <div class="alert alert-secondary small py-2 mb-3">
        <i class="bi bi-database"></i> <strong>Status tersimpan saat ini:</strong>
        Nomor WA: <code>${s.waNumber ? U.escapeHtml(s.waNumber) : '(belum diatur)'}</code>
        · Harga: <code>${s.harga ? U.escapeHtml(s.harga) : '(belum diatur)'}</code>
      </div>

      <div class="card">
        <div class="card-body">
          <form id="frmPur">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label"><i class="bi bi-whatsapp text-success"></i> Nomor WA Penjualan</label>
                <input class="form-control" name="waNumber" value="${U.escapeHtml(s.waNumber || '')}" placeholder="Misal 6281234567890" />
                <div class="form-text">Format internasional. Boleh diawali 0, akan dikonversi otomatis ke 62.</div>
              </div>
              <div class="col-md-6">
                <label class="form-label"><i class="bi bi-cash-stack text-success"></i> Harga Lisensi FULL</label>
                <input class="form-control" name="harga" value="${U.escapeHtml(s.harga || '')}" placeholder="Misal Rp 50.000 (lifetime / 1 akun)" />
              </div>

              <div class="col-md-12">
                <label class="form-label"><i class="bi bi-bank"></i> Info Cara Bayar</label>
                <textarea class="form-control" name="bankInfo" rows="4" placeholder="Misal:\nBRI 0123-4567-8901 a.n. Subariyanto\nQRIS / DANA: 0812xxxx">${U.escapeHtml(s.bankInfo || '')}</textarea>
              </div>

              <div class="col-md-6">
                <label class="form-label">Nama Aplikasi (di pesan WA)</label>
                <input class="form-control" name="appName" value="${U.escapeHtml(s.appName || '')}" />
              </div>
              <div class="col-md-6">
                <label class="form-label">URL Aplikasi</label>
                <input class="form-control" name="appUrl" value="${U.escapeHtml(s.appUrl || '')}" />
              </div>

              <div class="col-md-12">
                <label class="form-label">Template Pesan Pemesanan (user → admin)</label>
                <textarea class="form-control" name="orderTemplate" rows="6">${U.escapeHtml(s.orderTemplate || '')}</textarea>
                <div class="form-text">Placeholder: <code>{APP}</code>, <code>{URL}</code></div>
              </div>

              <div class="col-md-12">
                <label class="form-label">Template Pesan Kirim Kode (admin → user)</label>
                <textarea class="form-control" name="sendTemplate" rows="10">${U.escapeHtml(s.sendTemplate || '')}</textarea>
                <div class="form-text">Placeholder: <code>{KODE}</code>, <code>{APP}</code>, <code>{URL}</code>, <code>{NAMA}</code>, <code>{NIP}</code></div>
              </div>

              <div class="col-12 d-flex gap-2 flex-wrap">
                <button class="btn btn-success" type="submit"><i class="bi bi-save"></i> Simpan</button>
                <a class="btn btn-outline-success" href="#/beli-lisensi" target="_blank"><i class="bi bi-eye"></i> Preview Halaman Beli</a>
                <button class="btn btn-outline-secondary ms-auto" type="button" id="btnReset"><i class="bi bi-arrow-counterclockwise"></i> Reset Default</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `);

    document.getElementById('frmPur').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const cur = Codes.getPurchaseSettings();
      const rawWa = String(fd.get('waNumber') || '').trim();
      const normWa = Codes.normalizeWa(rawWa);
      if (rawWa && !normWa) {
        return UI.toast('Nomor WA tidak valid (harus mengandung angka).', 'danger');
      }
      const next = {
        ...cur,
        waNumber: normWa,
        harga: String(fd.get('harga') || '').trim(),
        bankInfo: String(fd.get('bankInfo') || ''),
        appName: String(fd.get('appName') || '').trim() || cur.appName,
        appUrl: String(fd.get('appUrl') || '').trim() || cur.appUrl,
        orderTemplate: String(fd.get('orderTemplate') || ''),
        sendTemplate: String(fd.get('sendTemplate') || ''),
      };
      Codes.savePurchaseSettings(next);
      // Verifikasi roundtrip dari localStorage
      const verify = Codes.getPurchaseSettings();
      if (verify.waNumber !== normWa) {
        UI.toast('Gagal menyimpan: data tidak terbaca ulang dari storage.', 'danger');
        console.error('[AdminPembelian] save mismatch', { saved: normWa, got: verify.waNumber });
        return;
      }
      UI.toast('Pengaturan tersimpan. Nomor WA: ' + (verify.waNumber || '(kosong)'));
      // Re-render form supaya menampilkan nilai ternormalisasi
      Page.AdminPembelian();
    });

    document.getElementById('btnReset').addEventListener('click', async () => {
      if (!await UI.confirmDialog('Reset semua pengaturan pembelian ke nilai default?')) return;
      Store.removeGlobal(Codes.SETTINGS_KEY);
      Page.AdminPembelian();
      UI.toast('Pengaturan direset ke default.');
    });
  };
})();
