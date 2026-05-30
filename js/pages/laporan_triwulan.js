// Laporan Triwulan: laporan lengkap kegiatan selama 1 triwulan
(function () {
  Page.LaporanTriwulan = function () {
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const tw = params.get('tw') || '';

    if (!tw) {
      // Pilih TW dulu
      const allKegiatan = Store.get('kegiatan', []) || [];
      const allRhk = Page.MasterRHK.get();
      const stats = (twKey) => {
        const rhks = allRhk.filter(r => r.triwulan === twKey);
        const ids = new Set(rhks.map(r => r.id));
        const kegs = allKegiatan.filter(k => ids.has(k.rhk_id));
        return { rhks: rhks.length, kegs: kegs.length };
      };
      const cards = [
        { tw: 'I',        label: 'Triwulan I',        bulan: 'Jan – Mar',  icon: 'bi-1-circle-fill',  warna: '#1E2A5A', accent: '#3B5BB8' },
        { tw: 'II',       label: 'Triwulan II',       bulan: 'Apr – Jun',  icon: 'bi-2-circle-fill',  warna: '#0F766E', accent: '#14B8A6' },
        { tw: 'III',      label: 'Triwulan III',      bulan: 'Jul – Sep',  icon: 'bi-3-circle-fill',  warna: '#92400E', accent: '#F59E0B' },
        { tw: 'IV',       label: 'Triwulan IV',       bulan: 'Okt – Des',  icon: 'bi-4-circle-fill',  warna: '#7C2D12', accent: '#DC2626' },
        { tw: 'TAMBAHAN', label: 'Kinerja Tambahan',  bulan: 'Sepanjang Tahun', icon: 'bi-stars',         warna: '#581C87', accent: '#A855F7' },
      ];
      UI.shell('Laporan Triwulan', `
        <div class="alert alert-light border d-flex align-items-center gap-2">
          <i class="bi bi-info-circle text-success fs-5"></i>
          <div>Pilih triwulan untuk membuat laporan lengkap kegiatan selama satu triwulan. Laporan otomatis disusun dari Master RHK + Data Kegiatan + Identitas Pengawas.</div>
        </div>
        <div class="row g-3">
          ${cards.map(c => {
            const s = stats(c.tw);
            const pct = s.rhks ? Math.round((s.kegs > 0 ? Math.min(s.kegs / s.rhks, 1) : 0) * 100) : 0;
            return `
            <div class="col-md-6 col-lg-4">
              <a class="card text-decoration-none h-100 tw-card" href="#/laporan-triwulan?tw=${c.tw}" style="border:none;overflow:hidden;box-shadow:0 4px 14px rgba(30,42,90,.08);transition:transform .15s ease, box-shadow .15s ease;">
                <div style="background:linear-gradient(135deg, ${c.warna} 0%, ${c.accent} 100%);color:#fff;padding:22px 24px;position:relative;">
                  <div style="position:absolute;top:8px;right:14px;opacity:.18;font-size:96px;line-height:1;"><i class="bi ${c.icon}"></i></div>
                  <div style="position:relative;z-index:1;">
                    <div style="font-size:11pt;opacity:.85;letter-spacing:1px;text-transform:uppercase;">${c.bulan}</div>
                    <div style="font-size:22pt;font-weight:700;line-height:1.1;margin-top:4px;">${c.label}</div>
                    <div style="font-size:10pt;opacity:.85;margin-top:2px;">Tahun 2026</div>
                  </div>
                </div>
                <div class="card-body py-3 px-3" style="color:var(--bs-body-color);">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <div class="small text-muted">
                      <i class="bi bi-clipboard-data text-primary"></i> ${s.rhks} RHK
                    </div>
                    <div class="small text-muted">
                      <i class="bi bi-calendar-check text-success"></i> ${s.kegs} kegiatan
                    </div>
                  </div>
                  <div class="progress" style="height:6px;">
                    <div class="progress-bar" role="progressbar" style="width:${pct}%;background:${c.accent};" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  <div class="d-flex justify-content-between align-items-center mt-2">
                    <div class="small text-muted">${pct > 0 ? `${pct}% capaian` : 'Belum ada kegiatan'}</div>
                    <div class="small fw-semibold" style="color:${c.warna};">Buat Laporan <i class="bi bi-arrow-right"></i></div>
                  </div>
                </div>
              </a>
            </div>`;
          }).join('')}
        </div>
        <style>
          .tw-card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(30,42,90,.18) !important; }
        </style>
      `);
      return;
    }

    renderTW(tw);
  };

  function renderTW(tw) {
    const masterRhk = Page.MasterRHK.get();
    const allKegiatan = Store.get('kegiatan', []) || [];
    const idn = Page.Identitas.get();
    const u = Auth.currentUser();

    const rhks = masterRhk.filter(r => r.triwulan === tw);
    if (!rhks.length) {
      UI.shell('Laporan ' + labelTW(tw), `
        <div class="alert alert-warning">Tidak ada RHK untuk ${labelTW(tw)}.</div>
        <a class="btn btn-outline-secondary" href="#/laporan-triwulan"><i class="bi bi-arrow-left"></i> Kembali</a>
      `);
      return;
    }

    // Build doc HTML
    const docHTML = buildTWDocument(tw, rhks, allKegiatan, idn);

    UI.shell('Laporan ' + labelTW(tw), `
      <div class="d-flex flex-wrap gap-2 mb-3 no-print">
        <a class="btn btn-outline-secondary" href="#/laporan-triwulan"><i class="bi bi-arrow-left"></i> Pilih Triwulan</a>
        <button class="btn btn-success" id="btnPrint"><i class="bi bi-printer"></i> Cetak</button>
        <div class="dropdown">
          <button class="btn btn-success dropdown-toggle" data-bs-toggle="dropdown">
            <i class="bi bi-download"></i> Download
          </button>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" id="btnDocx"><i class="bi bi-file-earmark-word"></i> Word (.docx)</a></li>
            <li><a class="dropdown-item" href="#" id="btnPdf"><i class="bi bi-file-earmark-pdf"></i> PDF</a></li>
            <li><a class="dropdown-item" href="#" id="btnHtml"><i class="bi bi-filetype-html"></i> HTML (printable)</a></li>
          </ul>
        </div>
      </div>

      <div class="alert alert-light border no-print">
        <strong>${labelTW(tw)} Tahun 2026</strong> · ${rhks.length} RHK · ${countKegiatan(rhks, allKegiatan)} kegiatan terkait
      </div>

      <div id="docContainer">${docHTML}</div>
    `);

    document.getElementById('btnPrint').addEventListener('click', () => window.print());
    document.getElementById('btnDocx').addEventListener('click', async (e) => {
      e.preventDefault();
      UI.toast('Membuat Word… mohon tunggu.');
      try {
        const parts = splitDocPages(docHTML);
        const blob = await GenDOCX.htmlToDocxBlob(parts, 'Laporan ' + labelTW(tw) + ' 2026');
        U.downloadBlob(blob, U.sanitizeFilename('Laporan_' + labelTW(tw) + '_2026') + '.docx');
      } catch (err) {
        UI.toast('Gagal export Word: ' + err.message, 'danger');
      }
    });
    document.getElementById('btnPdf').addEventListener('click', async (e) => {
      e.preventDefault();
      UI.toast('Membuat PDF… mohon tunggu.');
      try {
        const blob = await GenPDF.htmlToPdfBlob(docHTML);
        U.downloadBlob(blob, U.sanitizeFilename('Laporan_' + labelTW(tw) + '_2026') + '.pdf');
      } catch (err) {
        UI.toast('PDF gagal, fallback ke print: ' + err.message, 'warning');
        GenPDF.printHTML(docHTML);
      }
    });
    document.getElementById('btnHtml').addEventListener('click', (e) => {
      e.preventDefault();
      GenPDF.htmlAsPrintable(docHTML, 'Laporan_' + labelTW(tw) + '_2026');
    });
  }

  function labelTW(tw) {
    return tw === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + tw;
  }

  function countKegiatan(rhks, allKegiatan) {
    const ids = new Set(rhks.map(r => r.id));
    return allKegiatan.filter(k => ids.has(k.rhk_id)).length;
  }

  function header(idn) {
    const i = idn || Page.Identitas.get();
    return `<div class="kop">
      ${i.logo ? `<img class="logo" src="${i.logo}" />` : '<div style="width:80px"></div>'}
      <div class="text">
        <div class="l1">${U.escapeHtml(i.kop_l1)}</div>
        <div class="l2">${U.escapeHtml(i.kop_l2)}</div>
        <div class="l3">${U.escapeHtml(i.kop_l3)}</div>
        <div class="l4">${U.escapeHtml(i.kop_l4)}</div>
      </div>
      <div style="width:80px"></div>
    </div>`;
  }

  function tanggalKota(idn) {
    const i = idn || Page.Identitas.get();
    return `${i.pegawai.kabupaten || 'Jember'}, ${U.fmtTanggal(new Date())}`;
  }

  function buildTWDocument(tw, rhks, allKegiatan, idn) {
    const i = idn;
    const kegByRhk = {};
    allKegiatan.forEach(k => { (kegByRhk[k.rhk_id] = kegByRhk[k.rhk_id] || []).push(k); });

    const totalKegiatan = countKegiatan(rhks, allKegiatan);
    const rhkTerlaksana = rhks.filter(r => (kegByRhk[r.id] || []).length).length;
    const rhkBelum = rhks.length - rhkTerlaksana;

    // Halaman 1: Cover (TANPA kop kemenag)
    const cover = `
      <div class="doc-page doc-cover">
        <div class="cover-title">LAPORAN ${labelTW(tw).toUpperCase()}</div>
        <div class="cover-sub">PELAKSANAAN TUGAS POKOK PENGAWAS MADRASAH<br/>TAHUN 2026</div>

        <div style="text-align:center;margin:60px auto;">
          ${i.logo ? `<img src="${i.logo}" style="width:160px" />` : '<div style="height:160px;display:grid;place-items:center;color:#888">— LOGO KEMENAG —</div>'}
        </div>

        <div class="cover-id">
          <div>Disusun oleh:</div>
          <div style="font-weight:700;">${U.escapeHtml(i.pegawai.nama)}</div>
          <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          <div>${U.escapeHtml(i.pegawai.jabatan)}</div>
          <div>${U.escapeHtml(i.pegawai.unit_kerja)}</div>
        </div>

        <div class="cover-foot">
          <div>${U.escapeHtml(i.kop_l3 || 'POKJAWAS KEMENAG')}</div>
          <div>${U.escapeHtml(i.kop_l2 || 'KEMENAG KAB. JEMBER')}</div>
          <div>TAHUN 2026</div>
        </div>
      </div>
    `;

    // Halaman 2: Ringkasan Eksekutif
    const ringkasan = `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;margin-top:8px;">RINGKASAN PELAKSANAAN ${labelTW(tw).toUpperCase()} 2026</h3>

        <table class="fmt" style="width:100%;margin:10px 0;">
          <tr><td style="width:30%">Pengawas Madrasah</td><td>${U.escapeHtml(i.pegawai.nama)} (NIP. ${U.escapeHtml(i.pegawai.nip)})</td></tr>
          <tr><td>Pangkat/Gol</td><td>${U.escapeHtml(i.pegawai.pangkat_golongan)}</td></tr>
          <tr><td>Jabatan</td><td>${U.escapeHtml(i.pegawai.jabatan)}</td></tr>
          <tr><td>Unit Kerja</td><td>${U.escapeHtml(i.pegawai.unit_kerja)}</td></tr>
          <tr><td>Wilayah Binaan</td><td>${U.escapeHtml(i.pegawai.kabupaten || '-')}</td></tr>
          <tr><td>Periode</td><td>${labelTW(tw)} Tahun 2026</td></tr>
        </table>

        <h4 style="margin-top:14px;">A. Statistik Pelaksanaan</h4>
        <table class="fmt" style="width:100%;">
          <tr><td style="width:60%">Jumlah RHK pada ${labelTW(tw)}</td><td style="text-align:center;">${rhks.length} RHK</td></tr>
          <tr><td>Jumlah RHK yang sudah dilaksanakan</td><td style="text-align:center;">${rhkTerlaksana} RHK</td></tr>
          <tr><td>Jumlah RHK yang belum dilaksanakan</td><td style="text-align:center;">${rhkBelum} RHK</td></tr>
          <tr><td>Jumlah kegiatan pendampingan/pengawasan terkait</td><td style="text-align:center;">${totalKegiatan} kegiatan</td></tr>
          <tr><td>Persentase capaian RHK</td><td style="text-align:center;"><strong>${rhks.length ? Math.round(rhkTerlaksana / rhks.length * 100) : 0}%</strong></td></tr>
        </table>

        <h4 style="margin-top:14px;">B. Daftar RHK ${labelTW(tw)}</h4>
        <table class="fmt" style="width:100%;font-size:11pt;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="width:50px;">No</th>
              <th style="width:90px;">Kode</th>
              <th>Nama Eviden</th>
              <th style="width:80px;">Kegiatan</th>
              <th style="width:80px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rhks.map((r, idx) => {
              const kgs = kegByRhk[r.id] || [];
              const sts = kgs.length ? '<span style="color:#1E2A5A;font-weight:600;">Terlaksana</span>' : '<span style="color:#888;">Belum</span>';
              return `<tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>${U.escapeHtml(r.id)}</td>
                <td>${U.escapeHtml(r.nama_eviden || '-')}</td>
                <td style="text-align:center;">${kgs.length}</td>
                <td style="text-align:center;">${sts}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Halaman 3+: Per-RHK report
    const perRhkPages = rhks.map((r, idx) => buildRhkPage(r, kegByRhk[r.id] || [], i, idx + 1)).join('\n');

    // Halaman penutup
    const penutup = `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;margin-top:8px;">PENUTUP</h3>
        <p style="text-align:justify;">Demikian Laporan ${labelTW(tw)} Tahun 2026 ini disusun sebagai bentuk pertanggungjawaban pelaksanaan tugas pokok dan fungsi Pengawas Madrasah pada ${U.escapeHtml(i.pegawai.unit_kerja)}.</p>

        <p style="text-align:justify;">Pada ${labelTW(tw)} ini telah dilaksanakan <strong>${rhkTerlaksana} RHK</strong> dari total <strong>${rhks.length} RHK</strong> yang direncanakan, dengan total <strong>${totalKegiatan} kegiatan</strong> pendampingan/pengawasan pada madrasah binaan. Hasil pelaksanaan secara umum telah mencapai sasaran yang ditetapkan dalam Sasaran Kinerja Pegawai (SKP) Tahun 2026.</p>

        <p style="text-align:justify;">Kekurangan dan kendala yang ditemukan dalam pelaksanaan akan menjadi bahan refleksi untuk perbaikan pada periode berikutnya. Koordinasi dengan Kepala ${U.escapeHtml(i.pejabat_penilai.unit_kerja)}, Kepala Madrasah, dewan guru, dan seluruh pemangku kepentingan akan terus ditingkatkan.</p>

        <p style="text-align:justify;">Atas perhatian dan dukungan semua pihak, kami sampaikan terima kasih.</p>

        <p style="text-align:right;margin-top:30px;">${tanggalKota(i)}</p>
        <div class="ttd" style="margin-top:8px;">
          <div class="ttd-block"></div>
          <div class="ttd-block">
            <div>${U.escapeHtml(i.pegawai.jabatan)},</div>
            <div style="height:80px;display:grid;place-items:center;">${i.tanda_tangan ? `<img class="signature-img" src="${i.tanda_tangan}" />` : ''}</div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          </div>
        </div>
      </div>
    `;

    return cover + ringkasan + perRhkPages + penutup;
  }

  function buildRhkPage(rhk, kegList, idn, idx) {
    const N = window.NARASI_RHK ? { ...(window.NARASI_RHK.default || {}), ...(window.NARASI_RHK[rhk.id] || {}) } : {};

    // Pakai kegiatan pertama (atau gabungkan kalau banyak)
    const keg = kegList[0] || null;
    const v = {
      rhk: { ...rhk },
      kegiatan: {
        nama: keg ? keg.nama_kegiatan : '',
        tanggal: keg ? keg.tanggal : '',
        tanggal_str: keg ? U.fmtTanggal(keg.tanggal) : '',
        tempat: keg ? keg.tempat : '',
        sasaran: keg ? keg.sasaran : '',
        peserta: keg ? keg.peserta : '',
        uraian: keg ? keg.uraian : '',
        tujuan: keg ? keg.tujuan : '',
        hasil: keg ? keg.hasil : '',
        kendala: keg ? keg.kendala : '',
        solusi: keg ? keg.solusi : '',
        tindak_lanjut: keg ? keg.tindak_lanjut : '',
        rekomendasi: keg ? keg.rekomendasi : '',
      },
      pengawas: { nama: idn.pegawai.nama, nip: idn.pegawai.nip, jabatan: idn.pegawai.jabatan },
    };

    const allUraian = kegList.length
      ? kegList.map(k => `<li>${U.escapeHtml(U.fmtTanggal(k.tanggal))} — <strong>${U.escapeHtml(k.nama_kegiatan)}</strong>${k.tempat ? ' di ' + U.escapeHtml(k.tempat) : ''}${k.uraian ? '<br/><span style="font-size:11pt;">' + U.nl2br(k.uraian) + '</span>' : ''}</li>`).join('')
      : null;

    const allHasil = kegList.length
      ? kegList.map(k => k.hasil ? `<li><strong>${U.escapeHtml(k.nama_kegiatan)}:</strong> ${U.nl2br(k.hasil)}</li>` : '').filter(Boolean).join('')
      : null;

    const allKendala = kegList.length
      ? kegList.map(k => k.kendala ? `<li>${U.nl2br(k.kendala)}</li>` : '').filter(Boolean).join('')
      : '';

    const allSolusi = kegList.length
      ? kegList.map(k => k.solusi ? `<li>${U.nl2br(k.solusi)}</li>` : '').filter(Boolean).join('')
      : '';

    const allTindak = kegList.length
      ? kegList.map(k => k.tindak_lanjut ? `<li>${U.nl2br(k.tindak_lanjut)}</li>` : '').filter(Boolean).join('')
      : '';

    const allRekom = kegList.length
      ? kegList.map(k => k.rekomendasi ? `<li>${U.nl2br(k.rekomendasi)}</li>` : '').filter(Boolean).join('')
      : '';

    return `
      <div class="doc-page">
        ${header(idn)}
        <h4 style="margin:8px 0 4px;color:#1E2A5A;">${idx}. ${U.escapeHtml(rhk.id)} — ${U.escapeHtml(rhk.nama_eviden)}</h4>
        <div class="text-muted small" style="margin-bottom:10px;font-size:11pt;">${rhk.jenis_kinerja || 'Utama'} · ${kegList.length} kegiatan terkait</div>

        <table class="fmt" style="width:100%;margin-bottom:10px;font-size:11pt;">
          <tr><td style="width:30%"><strong>RHK Atasan yang Diintervensi</strong></td><td>${U.nl2br(rhk.rhk_atasan_intervensi || '-')}</td></tr>
          <tr><td><strong>Rencana Hasil Kerja</strong></td><td>${U.nl2br(rhk.rencana_hasil_kerja || '-')}</td></tr>
          <tr><td><strong>Indikator Kuantitas</strong></td><td>${U.escapeHtml(rhk.indikator_kuantitas || '-')} <em>(Target: ${U.escapeHtml(rhk.target_kuantitas || '-')})</em></td></tr>
          <tr><td><strong>Indikator Waktu</strong></td><td>${U.escapeHtml(rhk.indikator_waktu || '-')} <em>(Durasi: ${U.escapeHtml(rhk.target_waktu || '-')})</em></td></tr>
          <tr><td><strong>Rencana Aksi</strong></td><td>${U.nl2br(rhk.rencana_aksi || '-')}</td></tr>
        </table>

        ${kegList.length ? `
          <h5 style="margin-top:10px;">A. Pelaksanaan Kegiatan (${kegList.length})</h5>
          <ol style="padding-left:18px;font-size:11.5pt;">${allUraian}</ol>

          ${allHasil ? `<h5>B. Hasil yang Dicapai</h5><ul style="padding-left:18px;font-size:11.5pt;">${allHasil}</ul>` : `<h5>B. Hasil yang Dicapai</h5><p style="font-size:11.5pt;">${U.nl2br(U.fillTemplate(N.hasil || '', v) || '-')}</p>`}

          ${allKendala ? `<h5>C. Permasalahan</h5><ul style="padding-left:18px;font-size:11.5pt;">${allKendala}</ul>` : ''}
          ${allSolusi ? `<h5>${allKendala ? 'D' : 'C'}. Solusi</h5><ul style="padding-left:18px;font-size:11.5pt;">${allSolusi}</ul>` : ''}

          ${allTindak ? `<h5>${nextLetter(allKendala, allSolusi, true)}. Tindak Lanjut</h5><ul style="padding-left:18px;font-size:11.5pt;">${allTindak}</ul>` : ''}
          ${allRekom ? `<h5>${nextLetter(allKendala, allSolusi, allTindak, true)}. Rekomendasi</h5><ul style="padding-left:18px;font-size:11.5pt;">${allRekom}</ul>` : ''}
        ` : `
          <div style="background:#fff7d6;border:1px solid #d4af37;border-radius:6px;padding:10px;font-size:11.5pt;">
            <strong>⚠ RHK ini belum memiliki kegiatan terkait.</strong><br/>
            Tambahkan kegiatan pada menu <em>Data Kegiatan</em> agar laporan ini terisi otomatis dengan uraian pelaksanaan, hasil, kendala, solusi, dan rekomendasi.
          </div>
        `}
      </div>
    `;
  }

  function nextLetter(...flags) {
    // Compute next section letter starting after A, B (uraian + hasil)
    let n = 2; // A=Pelaksanaan, B=Hasil
    flags.forEach(f => { if (f) n++; });
    return String.fromCharCode(64 + n + 1);
  }

  // Split combined doc HTML into individual page HTMLs for DOCX builder
  function splitDocPages(html) {
    const pages = [];
    const regex = /<div class="doc-page">[\s\S]*?<\/div>\s*(?=<div class="doc-page"|$)/g;
    let m;
    while ((m = regex.exec(html)) !== null) pages.push(m[0]);
    return pages.length ? pages : [html];
  }
})();
