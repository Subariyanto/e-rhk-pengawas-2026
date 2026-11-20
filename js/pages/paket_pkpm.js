// Halaman Paket Ekspor Bukti Dukung PKPM
// Menampilkan matriks cakupan bukti dukung per indikator e-PKPM (K1–K4),
// dengan opsi menyaring triwulan dan mengekspor daftar isi paket.
(function () {
  function esc(s) { return U.escapeHtml(s == null ? '' : String(s)); }

  function badgeStatus(status) {
    if (status === 'final') return '<span class="badge bg-success">Final</span>';
    if (status === 'draft') return '<span class="badge bg-warning">Draft</span>';
    return '<span class="badge bg-secondary">Belum ada</span>';
  }

  Page.PaketPKPM = function () {
    if (!window.PaketPKPM) return UI.toast('Modul paket PKPM belum dimuat', 'danger');
    const masterRhk = Page.MasterRHK.get();
    const eviden = Store.get('eviden', []) || [];
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const fTw = params.get('tw') || '';

    // Filter RHK berdasarkan triwulan; RHK TAMBAHAN selalu ikut agar bukti
    // unsur tambahan (K4.8) tidak hilang saat memilih triwulan tertentu.
    function rhkLolos(r) {
      if (!fTw) return true;
      return r.triwulan === fTw || r.triwulan === 'TAMBAHAN';
    }
    const masterFiltered = masterRhk.filter(rhkLolos);
    const status = window.PaketPKPM.hitungStatus(masterFiltered, eviden);

    const totalInd = status.length;
    const sudahFinal = status.filter(s => s.status === 'final').length;
    const adaDraft = status.filter(s => s.status === 'draft').length;
    const kosong = status.filter(s => s.status === 'kosong').length;

    const statCard = (label, nilai, warna) => `
      <div class="col-6 col-md-3">
        <div class="card h-100">
          <div class="card-body py-3">
            <div class="text-muted small">${esc(label)}</div>
            <div class="fs-4 fw-bold text-${warna}">${nilai}</div>
          </div>
        </div>
      </div>`;

    const komponenGroup = ['K1', 'K2', 'K3', 'K4'].map(komp => {
      const baris = status.filter(s => s.indikator.komponen === komp);
      if (!baris.length) return '';
      const rows = baris.map(s => {
        const rhkList = s.detail.length
          ? s.detail.map(d => `<a href="#/eviden/${encodeURIComponent(d.rhk.id)}">${esc(d.rhk.id)}</a> <span class="text-muted small">(${d.jumlah} eviden${d.final ? ', ' + d.final + ' final' : ''})</span>`).join('<br>')
          : '<em class="text-muted">tidak ada RHK pemasok</em>';
        const drive = s.adaDrive ? ' <i class="bi bi-link-45deg" title="Ada Link Drive"></i>' : '';
        return `
          <tr>
            <td class="text-nowrap"><strong>${esc(s.indikator.kode)}</strong></td>
            <td>${esc(s.indikator.nama)}</td>
            <td>${rhkList}${drive}</td>
            <td class="text-center text-nowrap">${s.totalEviden}</td>
            <td class="text-center text-nowrap">${s.finalEviden}</td>
            <td class="text-center text-nowrap">${badgeStatus(s.status)}</td>
          </tr>`;
      }).join('');
      return `
        <div class="card mb-3">
          <div class="card-header">
            <strong>${komp}</strong> — ${esc(window.PaketPKPM.KOMPONEN[komp])}
          </div>
          <div class="table-responsive">
            <table class="table table-sm table-bordered align-middle mb-0">
              <thead>
                <tr>
                  <th style="width:90px;">Indikator</th>
                  <th style="width:280px;">Nama Indikator</th>
                  <th>RHK Pemasok Bukti</th>
                  <th style="width:80px;" class="text-center">Eviden</th>
                  <th style="width:80px;" class="text-center">Final</th>
                  <th style="width:110px;" class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>`;
    }).join('');

    UI.shell('Paket Bukti Dukung e-PKPM', `
      <div class="alert alert-light border d-flex flex-wrap gap-2 align-items-center no-print">
        <i class="bi bi-clipboard-check"></i>
        <span>Matriks cakupan bukti dukung per indikator <strong>e-PKPM</strong> (K1–K4, termasuk indikator KBC).</span>
        <select id="fTwPaket" class="form-select ms-auto" style="max-width:200px;">
          <option value="" ${!fTw ? 'selected' : ''}>Semua Triwulan</option>
          <option value="I" ${fTw === 'I' ? 'selected' : ''}>Triwulan I</option>
          <option value="II" ${fTw === 'II' ? 'selected' : ''}>Triwulan II</option>
          <option value="III" ${fTw === 'III' ? 'selected' : ''}>Triwulan III</option>
          <option value="IV" ${fTw === 'IV' ? 'selected' : ''}>Triwulan IV</option>
        </select>
        <button class="btn btn-success" id="btnPaketDaftar"><i class="bi bi-file-earmark-text"></i> Unduh Daftar Isi Paket</button>
        <button class="btn btn-outline-success" id="btnPaketCetak"><i class="bi bi-printer"></i> Cetak Matriks</button>
      </div>

      <div class="row g-2 mb-3">
        ${statCard('Total indikator', totalInd, 'dark')}
        ${statCard('Sudah final', sudahFinal, 'success')}
        ${statCard('Masih draft', adaDraft, 'warning')}
        ${statCard('Belum ada bukti', kosong, 'secondary')}
      </div>

      <div id="areaPaket">${komponenGroup}</div>
    `);

    const sel = document.getElementById('fTwPaket');
    if (sel) sel.addEventListener('change', () => {
      location.hash = '#/paket-pkpm' + (sel.value ? '?tw=' + sel.value : '');
    });

    const btnDaftar = document.getElementById('btnPaketDaftar');
    if (btnDaftar) btnDaftar.addEventListener('click', () => unduhDaftarIsi(status, fTw));

    const btnCetak = document.getElementById('btnPaketCetak');
    if (btnCetak) btnCetak.addEventListener('click', () => {
      const area = document.getElementById('areaPaket');
      if (area && window.GenPDF) GenPDF.printHTML(area.innerHTML);
      else window.print();
    });
  };

  // Unduh Daftar Isi Paket sebagai berkas Word (.doc) supaya penilai bisa
  // mencetak/menandatangani, sekaligus mencantumkan RHK pemasok per indikator.
  function unduhDaftarIsi(status, fTw) {
    const idn = Page.Identitas.get() || {};
    const peg = idn.pengawas || idn.pegawai || {};
    const nama = (typeof peg === 'object' && peg.nama) || idn.nama_pengawas || idn.nama || '';
    const nip = (typeof peg === 'object' && peg.nip) || idn.nip || '';
    const madrasah = idn.wilayah_binaan || idn.unit_kerja || '';
    const judulPeriode = fTw ? ('Triwulan ' + fTw) : 'Semua Triwulan';

    const baris = [];
    ['K1', 'K2', 'K3', 'K4'].forEach(komp => {
      const grup = status.filter(s => s.indikator.komponen === komp);
      if (!grup.length) return;
      baris.push(`<tr><td colspan="5" style="background:#eef3fa;font-weight:bold;">${komp} — ${window.PaketPKPM.KOMPONEN[komp]}</td></tr>`);
      grup.forEach(s => {
        const rhk = s.detail.length ? s.detail.map(d => d.rhk.id + ' — ' + (d.rhk.nama_eviden || '')).join('; ') : '—';
        const stat = s.status === 'final' ? 'Final' : (s.status === 'draft' ? 'Draft' : 'Belum ada');
        baris.push(`<tr>
          <td>${s.indikator.kode}</td>
          <td>${s.indikator.nama}</td>
          <td>${rhk}</td>
          <td style="text-align:center;">${s.totalEviden}${s.finalEviden ? ' (' + s.finalEviden + ' final)' : ''}</td>
          <td style="text-align:center;">${stat}</td>
        </tr>`);
      });
    });

    const html = `
      <h2 style="text-align:center;margin-bottom:4px;">DAFTAR ISI PAKET BUKTI DUKUNG</h2>
      <p style="text-align:center;margin-top:0;">Penilaian Kinerja Pengawas Madrasah (e-PKPM)<br>${judulPeriode}</p>
      <p>
        Nama Pengawas: <strong>${esc(nama)}</strong><br>
        NIP: ${esc(nip)}<br>
        Madrasah Binaan: ${esc(madrasah)}
      </p>
      <table border="1" cellspacing="0" cellpadding="6" style="width:100%;border-collapse:collapse;font-size:11pt;">
        <thead>
          <tr style="background:#1e2a5a;color:#fff;">
            <th style="width:80px;">Kode</th>
            <th style="width:230px;">Indikator e-PKPM</th>
            <th>RHK Pemasok Bukti Dukung</th>
            <th style="width:90px;">Eviden</th>
            <th style="width:80px;">Status</th>
          </tr>
        </thead>
        <tbody>${baris.join('')}</tbody>
      </table>
      <p style="margin-top:12px;font-size:10pt;color:#555;">
        Dokumen ini dihasilkan otomatis oleh e-RHK Pengawas Madrasah 2026 sebagai daftar isi
        paket bukti dukung. Berkas eviden dilampirkan terpisah sesuai RHK pemasok.
      </p>`;

    const blob = window.GenDOCX && GenDOCX.htmlToWordDocBlob
      ? GenDOCX.htmlToWordDocBlob([html], 'Daftar Isi Paket Bukti Dukung PKPM')
      : new Blob([html], { type: 'application/msword' });
    // Tetap izinkan export fallback jika generator Word mengembalikan null
    // (mis. diblokir oleh batasan paket trial); beri pesan yang jelas.
    if (!blob) return UI.toast('Ekspor dibatasi oleh status lisensi akun ini', 'warning');
    U.downloadBlob(blob, U.sanitizeFilename('Daftar_Isi_Paket_Bukti_Dukung_PKPM_' + (fTw ? 'TW' + fTw : 'Semua_Triwulan')) + '.doc');
    UI.toast('Daftar isi paket berhasil diunduh', 'success');
  }
})();
