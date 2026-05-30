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
    const tahun = 2026;
    const madrasahList = Store.get('madrasah', []) || [];
    const persentase = rhks.length ? Math.round(rhkTerlaksana / rhks.length * 100) : 0;
    const labelLower = labelTW(tw).toLowerCase();
    const periodeBulan = (tw === 'I' ? 'Januari–Maret' : tw === 'II' ? 'April–Juni' : tw === 'III' ? 'Juli–September' : tw === 'IV' ? 'Oktober–Desember' : 'sepanjang Tahun');

    // ===== HALAMAN 1: COVER (tanpa kop & logo) =====
    const cover = `
      <div class="doc-page doc-cover">
        <div class="cover-title">LAPORAN ${labelTW(tw).toUpperCase()}</div>
        <div class="cover-sub">PELAKSANAAN TUGAS POKOK PENGAWAS MADRASAH<br/>TAHUN ${tahun}</div>

        <div class="cover-id" style="margin-top:120px;">
          <div>Disusun oleh:</div>
          <div style="font-weight:700;">${U.escapeHtml(i.pegawai.nama)}</div>
          <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          <div>${U.escapeHtml(i.pegawai.jabatan)}</div>
          <div>${U.escapeHtml(i.pegawai.unit_kerja)}</div>
        </div>

        <div class="cover-foot" style="margin-top:120px;">
          <div>${U.escapeHtml(i.kop_l3 || 'POKJAWAS KEMENAG')}</div>
          <div>${U.escapeHtml(i.kop_l2 || 'KEMENAG KAB. JEMBER')}</div>
          <div>TAHUN ${tahun}</div>
        </div>
      </div>
    `;

    // ===== HALAMAN 2: LEMBAR PENGESAHAN =====
    const pengesahan = `
      <div class="doc-page">
        <h2 style="text-align:center;text-decoration:underline;">LEMBAR PENGESAHAN</h2>
        <p style="text-align:justify;">Yang bertanda tangan di bawah ini, mengesahkan dokumen <strong>Laporan ${labelTW(tw)} Tahun ${tahun}</strong> tentang Pelaksanaan Tugas Pokok Pengawas Madrasah, yang disusun oleh:</p>
        <table class="fmt" style="width:90%;margin:8px auto;">
          <tr><td style="width:30%">Nama</td><td>${U.escapeHtml(i.pegawai.nama)}</td></tr>
          <tr><td>NIP</td><td>${U.escapeHtml(i.pegawai.nip)}</td></tr>
          <tr><td>Pangkat/Gol</td><td>${U.escapeHtml(i.pegawai.pangkat_golongan)}</td></tr>
          <tr><td>Jabatan</td><td>${U.escapeHtml(i.pegawai.jabatan)}</td></tr>
          <tr><td>Unit Kerja</td><td>${U.escapeHtml(i.pegawai.unit_kerja)}</td></tr>
          <tr><td>Periode</td><td>${labelTW(tw)} Tahun ${tahun}</td></tr>
        </table>
        <p style="text-align:justify;">Laporan ini menjadi bukti pelaksanaan Sasaran Kinerja Pegawai (SKP) Pengawas Madrasah pada ${U.escapeHtml(i.pegawai.unit_kerja)} sesuai dengan Perdirjen GTK Nomor 7328 Tahun 2023 tentang Petunjuk Teknis Pengelolaan Kinerja Pengawas Madrasah.</p>
        ${GenHTML.ttdBlokStandar(i)}
      </div>
    `;

    // ===== HALAMAN 3: KATA PENGANTAR =====
    const kataPengantar = `
      <div class="doc-page">
        <h2 style="text-align:center;text-decoration:underline;">KATA PENGANTAR</h2>
        <p style="text-align:justify;">Puji syukur kami panjatkan kehadirat Allah SWT atas limpahan rahmat, taufik, dan hidayah-Nya, sehingga penyusunan <strong>Laporan ${labelTW(tw)} Tahun ${tahun}</strong> tentang Pelaksanaan Tugas Pokok Pengawas Madrasah dapat diselesaikan tepat waktu. Shalawat dan salam senantiasa tercurah kepada junjungan kita Nabi Muhammad SAW beserta keluarga, sahabat, dan pengikutnya.</p>
        <p style="text-align:justify;">Laporan ini disusun sebagai bentuk pertanggungjawaban pelaksanaan tugas pokok dan fungsi Pengawas Madrasah pada ${labelTW(tw)} (${periodeBulan}) Tahun ${tahun}. Dokumen ini memuat hasil pelaksanaan supervisi akademik dan manajerial pada madrasah binaan, capaian Rencana Hasil Kerja (RHK), kegiatan pendampingan, kendala yang dihadapi, serta rekomendasi tindak lanjut sebagai bahan refleksi dan perbaikan pada periode berikutnya.</p>
        <p style="text-align:justify;">Penyusunan laporan ini mengacu pada Sasaran Kinerja Pegawai (SKP) Pengawas Madrasah Tahun ${tahun} dan Perdirjen GTK Nomor 7328 Tahun 2023 tentang Petunjuk Teknis Pengelolaan Kinerja Pengawas Madrasah, serta berorientasi pada peningkatan mutu layanan pendidikan berbasis Kurikulum Berbasis Cinta dan profil Pelajar Pancasila Rahmatan lil 'Alamin.</p>
        <p style="text-align:justify;">Kami mengucapkan terima kasih kepada Kepala ${U.escapeHtml(i.pejabat_penilai.unit_kerja)}, Ketua Pokjawas, Kepala Madrasah, dewan guru, tenaga kependidikan, komite madrasah, serta seluruh pemangku kepentingan yang telah memberikan dukungan dalam pelaksanaan tugas kepengawasan ini.</p>
        <p style="text-align:justify;">Kami menyadari masih terdapat kekurangan dalam penyusunan laporan ini. Oleh karena itu, kritik dan saran yang konstruktif sangat kami harapkan demi penyempurnaan di masa mendatang. Semoga laporan ini bermanfaat bagi peningkatan mutu pendidikan madrasah.</p>
        <p style="text-align:right;margin-top:30px;">${tanggalKota(i)}<br/>Penyusun,</p>
        <div style="text-align:right;margin-top:60px">
          <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
          <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
        </div>
      </div>
    `;

    // ===== HALAMAN 4: DAFTAR ISI =====
    const items = [
      ['HALAMAN JUDUL', 'i'],
      ['LEMBAR PENGESAHAN', 'ii'],
      ['KATA PENGANTAR', 'iii'],
      ['DAFTAR ISI', 'iv'],
      ['BAB I PENDAHULUAN', '1'],
      ['  A. Latar Belakang', '1'],
      ['  B. Dasar Hukum', '2'],
      ['  C. Tujuan', '3'],
      ['  D. Sasaran', '3'],
      ['  E. Ruang Lingkup', '4'],
      ['BAB II PELAKSANAAN KEGIATAN', '5'],
      ['  A. Identitas Pengawas', '5'],
      ['  B. Statistik Pelaksanaan', '5'],
      ['  C. Daftar RHK ' + labelTW(tw), '6'],
      ['BAB III HASIL DAN URAIAN PER-RHK', '7'],
      ['BAB IV ANALISIS, PERMASALAHAN DAN SOLUSI', String(7 + rhks.length)],
      ['  A. Analisis Capaian', String(7 + rhks.length)],
      ['  B. Permasalahan', String(7 + rhks.length + 1)],
      ['  C. Solusi', String(7 + rhks.length + 1)],
      ['  D. Tindak Lanjut', String(7 + rhks.length + 1)],
      ['BAB V PENUTUP', String(7 + rhks.length + 2)],
      ['  A. Simpulan', String(7 + rhks.length + 2)],
      ['  B. Saran', String(7 + rhks.length + 2)],
      ['LAMPIRAN', String(7 + rhks.length + 3)],
    ];
    const daftarIsi = `
      <div class="doc-page">
        <h2 style="text-align:center;text-decoration:underline;">DAFTAR ISI</h2>
        <table style="width:100%;border-collapse:collapse;">
          ${items.map(([t, p]) => `<tr><td style="padding:4px 0;border-bottom:1px dotted #888;">${U.escapeHtml(t)}</td><td style="padding:4px 0;text-align:right;border-bottom:1px dotted #888;">${p}</td></tr>`).join('')}
        </table>
      </div>
    `;

    // ===== HALAMAN 5: BAB I PENDAHULUAN =====
    const bab1 = `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB I<br/>PENDAHULUAN</h2>

        <h3>A. Latar Belakang</h3>
        <p style="text-align:justify;">Pengawas Madrasah merupakan tenaga kependidikan yang memiliki tugas pokok melaksanakan supervisi akademik dan manajerial pada madrasah binaan. Sesuai dengan Perdirjen GTK Nomor 7328 Tahun 2023, Pengawas Madrasah dituntut untuk menyusun Sasaran Kinerja Pegawai (SKP) yang memuat Rencana Hasil Kerja (RHK), indikator kinerja, target, serta menyusun laporan pelaksanaan kinerja secara periodik (triwulanan dan tahunan).</p>
        <p style="text-align:justify;">Laporan ${labelTW(tw)} Tahun ${tahun} ini disusun sebagai bentuk akuntabilitas dan pertanggungjawaban atas pelaksanaan tugas Pengawas Madrasah pada periode ${periodeBulan} ${tahun}. Pada ${labelTW(tw)} ini direncanakan ${rhks.length} Rencana Hasil Kerja yang menjadi fokus pelaksanaan supervisi dan pendampingan.</p>
        <p style="text-align:justify;">Pelaksanaan tugas kepengawasan diorientasikan pada peningkatan mutu layanan pendidikan berbasis Kurikulum Berbasis Cinta, penguatan profil Pelajar Pancasila Rahmatan lil 'Alamin (P3RA), pemenuhan 8 Standar Nasional Pendidikan, dan peningkatan profesionalisme guru serta tenaga kependidikan pada ${madrasahList.length} madrasah binaan di wilayah ${U.escapeHtml(i.pegawai.kabupaten || 'Jember')}.</p>

        <h3>B. Dasar Hukum</h3>
        <ol style="text-align:justify;">
          <li>Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;</li>
          <li>Undang-Undang Nomor 14 Tahun 2005 tentang Guru dan Dosen;</li>
          <li>Peraturan Pemerintah Nomor 19 Tahun 2017 tentang Perubahan atas PP Nomor 74 Tahun 2008 tentang Guru;</li>
          <li>Peraturan Menteri PAN-RB Nomor 21 Tahun 2010 tentang Jabatan Fungsional Pengawas Sekolah dan Angka Kreditnya;</li>
          <li>Peraturan Menteri Agama Nomor 31 Tahun 2013 tentang Pengawas Madrasah dan Pengawas Pendidikan Agama Islam;</li>
          <li>Peraturan Menteri PAN-RB Nomor 6 Tahun 2022 tentang Pengelolaan Kinerja Pegawai ASN;</li>
          <li>Peraturan Direktur Jenderal Pendidikan Islam (Perdirjen GTK) Nomor 7328 Tahun 2023 tentang Petunjuk Teknis Pengelolaan Kinerja Pengawas Madrasah;</li>
          <li>Sasaran Kinerja Pegawai (SKP) ${U.escapeHtml(i.pegawai.nama)} Tahun ${tahun};</li>
          <li>Surat Keputusan Kepala ${U.escapeHtml(i.pejabat_penilai.unit_kerja)} tentang Pembagian Tugas Pengawas Madrasah Tahun ${tahun}.</li>
        </ol>

        <h3>C. Tujuan</h3>
        <p style="text-align:justify;">Penyusunan Laporan ${labelTW(tw)} Tahun ${tahun} bertujuan:</p>
        <ol style="text-align:justify;">
          <li>Memberikan laporan akuntabilitas pelaksanaan tugas Pengawas Madrasah pada ${labelTW(tw)} (${periodeBulan}) Tahun ${tahun};</li>
          <li>Mendokumentasikan capaian Rencana Hasil Kerja, indikator kinerja, dan target yang telah ditetapkan;</li>
          <li>Menjadi bahan evaluasi dan refleksi pelaksanaan tugas guna perbaikan kinerja pada periode berikutnya;</li>
          <li>Memberikan rekomendasi tindak lanjut yang konstruktif kepada Kepala ${U.escapeHtml(i.pejabat_penilai.unit_kerja)}, Kepala Madrasah, dan pemangku kepentingan lainnya;</li>
          <li>Memenuhi ketentuan pelaporan kinerja sesuai Perdirjen GTK 7328/2023.</li>
        </ol>

        <h3>D. Sasaran</h3>
        <p style="text-align:justify;">Sasaran kegiatan pada ${labelTW(tw)} Tahun ${tahun} meliputi ${madrasahList.length} madrasah binaan di wilayah ${U.escapeHtml(i.pegawai.kabupaten || 'Jember')} yang menjadi tanggung jawab Pengawas Madrasah ${U.escapeHtml(i.pegawai.nama)}. Sasaran ini mencakup Kepala Madrasah, dewan guru, tenaga kependidikan, peserta didik, dan komite madrasah dalam rangka peningkatan mutu pendidikan secara holistik.</p>

        <h3>E. Ruang Lingkup</h3>
        <p style="text-align:justify;">Ruang lingkup pelaporan ${labelTW(tw)} ini meliputi:</p>
        <ol style="text-align:justify;">
          <li><strong>Supervisi Akademik:</strong> pendampingan implementasi kurikulum, perangkat pembelajaran, evaluasi pembelajaran, dan peningkatan kompetensi profesional guru;</li>
          <li><strong>Supervisi Manajerial:</strong> pendampingan tata kelola madrasah, manajemen mutu, kepemimpinan kepala madrasah, dan pelayanan publik;</li>
          <li><strong>Pembinaan Karakter:</strong> penguatan P3RA, karakter siswa, dan pendidikan inklusif;</li>
          <li><strong>Penilaian Kinerja:</strong> Penilaian Kinerja Guru (PKG) dan Penilaian Kinerja Kepala Madrasah (PKKM);</li>
          <li><strong>Tindak Lanjut:</strong> rekomendasi perbaikan, monitoring, evaluasi, dan pelaporan periodik.</li>
        </ol>
      </div>
    `;

    // ===== HALAMAN: BAB II PELAKSANAAN =====
    const bab2 = `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB II<br/>PELAKSANAAN KEGIATAN</h2>

        <h3>A. Identitas Pengawas</h3>
        <table class="fmt" style="width:100%;margin:8px 0;">
          <tr><td style="width:30%">Nama</td><td>${U.escapeHtml(i.pegawai.nama)}</td></tr>
          <tr><td>NIP</td><td>${U.escapeHtml(i.pegawai.nip)}</td></tr>
          <tr><td>Pangkat/Gol</td><td>${U.escapeHtml(i.pegawai.pangkat_golongan)}</td></tr>
          <tr><td>Jabatan</td><td>${U.escapeHtml(i.pegawai.jabatan)}</td></tr>
          <tr><td>Unit Kerja</td><td>${U.escapeHtml(i.pegawai.unit_kerja)}</td></tr>
          <tr><td>Wilayah Binaan</td><td>${U.escapeHtml(i.pegawai.kabupaten || '-')}</td></tr>
          <tr><td>Periode Pelaporan</td><td>${labelTW(tw)} Tahun ${tahun} (${periodeBulan})</td></tr>
          <tr><td>Jumlah Madrasah Binaan</td><td>${madrasahList.length} madrasah</td></tr>
        </table>

        <h3>B. Statistik Pelaksanaan</h3>
        <table class="fmt" style="width:100%;">
          <tr><td style="width:60%">Jumlah RHK pada ${labelTW(tw)}</td><td style="text-align:center;">${rhks.length} RHK</td></tr>
          <tr><td>Jumlah RHK yang sudah dilaksanakan</td><td style="text-align:center;">${rhkTerlaksana} RHK</td></tr>
          <tr><td>Jumlah RHK yang belum dilaksanakan</td><td style="text-align:center;">${rhkBelum} RHK</td></tr>
          <tr><td>Jumlah kegiatan pendampingan/pengawasan terkait</td><td style="text-align:center;">${totalKegiatan} kegiatan</td></tr>
          <tr><td>Persentase capaian RHK</td><td style="text-align:center;"><strong>${persentase}%</strong></td></tr>
        </table>

        <h3>C. Daftar RHK ${labelTW(tw)}</h3>
        <table class="fmt" style="width:100%;font-size:11pt;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="width:40px;">No</th>
              <th style="width:80px;">Kode</th>
              <th>Nama Eviden</th>
              <th style="width:60px;">Kegiatan</th>
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

    // ===== BAB III: PER-RHK =====
    const bab3Header = `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB III<br/>HASIL DAN URAIAN PER-RHK</h2>
        <p style="text-align:justify;">Bab ini memuat uraian rinci pelaksanaan setiap Rencana Hasil Kerja (RHK) pada ${labelTW(tw)} Tahun ${tahun}, beserta data kegiatan terkait, hasil yang dicapai, dan rekomendasi tindak lanjut. Setiap RHK disajikan dalam halaman tersendiri untuk memudahkan referensi.</p>
      </div>
    `;
    const perRhkPages = rhks.map((r, idx) => buildRhkPage(r, kegByRhk[r.id] || [], i, idx + 1)).join('\n');

    // Agregasi kendala/solusi/tindak lanjut dari semua kegiatan untuk BAB IV
    const aggregateField = (field) => {
      const list = [];
      rhks.forEach(r => {
        const kgs = kegByRhk[r.id] || [];
        kgs.forEach(k => { if (k[field]) list.push({ rhk: r, val: k[field] }); });
      });
      return list;
    };
    const allKendala = aggregateField('kendala');
    const allSolusi = aggregateField('solusi');
    const allTindak = aggregateField('tindak_lanjut');

    // ===== BAB IV: ANALISIS =====
    const bab4 = `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB IV<br/>ANALISIS, PERMASALAHAN DAN SOLUSI</h2>

        <h3>A. Analisis Capaian</h3>
        <p style="text-align:justify;">Pada ${labelTW(tw)} Tahun ${tahun}, dari total <strong>${rhks.length} RHK</strong> yang direncanakan, telah dilaksanakan sebanyak <strong>${rhkTerlaksana} RHK</strong> (${persentase}%) dengan total <strong>${totalKegiatan} kegiatan</strong> pendampingan/pengawasan pada madrasah binaan. ${persentase >= 80 ? 'Capaian ini menunjukkan tingkat realisasi yang baik dan sesuai dengan rencana yang ditetapkan.' : persentase >= 50 ? 'Capaian ini menunjukkan tingkat realisasi yang cukup memadai, namun masih perlu peningkatan pada periode berikutnya.' : 'Capaian ini masih perlu ditingkatkan secara signifikan pada periode berikutnya.'}</p>
        <p style="text-align:justify;">Pelaksanaan kegiatan dilakukan secara terpadu dan terkoordinasi dengan Kepala Madrasah, dewan guru, tenaga kependidikan, dan komite madrasah pada setiap madrasah binaan. Setiap kegiatan didokumentasikan dalam bentuk laporan, foto kegiatan, daftar hadir, dan berita acara sebagaimana terlampir.</p>
        ${rhkBelum > 0 ? `<p style="text-align:justify;">Adapun ${rhkBelum} RHK yang belum terlaksana akan menjadi prioritas pelaksanaan pada periode berikutnya, dengan mempertimbangkan jadwal kalender pendidikan, ketersediaan waktu, dan kesiapan madrasah binaan.</p>` : ''}

        <h3>B. Permasalahan</h3>
        ${allKendala.length ? `<p style="text-align:justify;">Beberapa permasalahan yang ditemukan selama pelaksanaan ${labelTW(tw)} antara lain:</p>
        <ol style="text-align:justify;">
          ${allKendala.slice(0, 10).map(x => `<li><strong>${U.escapeHtml(x.rhk.id)}:</strong> ${U.nl2br(x.val)}</li>`).join('')}
        </ol>` : `<p style="text-align:justify;">Pada ${labelTW(tw)} ini secara umum tidak ditemukan permasalahan signifikan yang menghambat pelaksanaan tugas kepengawasan. Beberapa kondisi minor di lapangan dapat ditangani dengan koordinasi yang baik.</p>`}

        <h3>C. Solusi</h3>
        ${allSolusi.length ? `<p style="text-align:justify;">Beberapa solusi yang telah ditempuh untuk menangani permasalahan tersebut:</p>
        <ol style="text-align:justify;">
          ${allSolusi.slice(0, 10).map(x => `<li><strong>${U.escapeHtml(x.rhk.id)}:</strong> ${U.nl2br(x.val)}</li>`).join('')}
        </ol>` : `<p style="text-align:justify;">Solusi yang ditempuh secara umum berupa penguatan koordinasi, pendampingan intensif, dan pemanfaatan teknologi komunikasi untuk efisiensi pelaksanaan tugas.</p>`}

        <h3>D. Tindak Lanjut</h3>
        ${allTindak.length ? `<p style="text-align:justify;">Tindak lanjut atas pelaksanaan kegiatan ${labelTW(tw)} antara lain:</p>
        <ol style="text-align:justify;">
          ${allTindak.slice(0, 10).map(x => `<li><strong>${U.escapeHtml(x.rhk.id)}:</strong> ${U.nl2br(x.val)}</li>`).join('')}
        </ol>` : `<p style="text-align:justify;">Tindak lanjut yang akan dilaksanakan pada periode berikutnya meliputi: (1) pemantauan implementasi rekomendasi pada madrasah binaan; (2) pendampingan berkelanjutan; (3) penyusunan laporan periodik; dan (4) koordinasi dengan stakeholder terkait.</p>`}
      </div>
    `;

    // ===== BAB V: PENUTUP =====
    const bab5 = `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB V<br/>PENUTUP</h2>

        <h3>A. Simpulan</h3>
        <ol style="text-align:justify;">
          <li>Pelaksanaan tugas Pengawas Madrasah pada ${labelTW(tw)} Tahun ${tahun} telah dilaksanakan sesuai dengan rencana yang ditetapkan dalam Sasaran Kinerja Pegawai (SKP) Tahun ${tahun}.</li>
          <li>Dari ${rhks.length} RHK yang direncanakan, telah terealisasi sebanyak ${rhkTerlaksana} RHK (${persentase}%) dengan total ${totalKegiatan} kegiatan pendampingan/pengawasan pada ${madrasahList.length} madrasah binaan.</li>
          <li>Hasil pelaksanaan secara umum telah mencapai sasaran yang ditetapkan dan memberikan kontribusi positif terhadap peningkatan mutu pendidikan madrasah.</li>
          <li>Kendala yang dihadapi telah diupayakan penanganannya melalui solusi yang konstruktif, dan menjadi bahan refleksi untuk perbaikan pada periode berikutnya.</li>
        </ol>

        <h3>B. Saran</h3>
        <ol style="text-align:justify;">
          <li>Kepada Kepala ${U.escapeHtml(i.pejabat_penilai.unit_kerja)}, agar terus memberikan dukungan kebijakan, fasilitasi pelatihan, dan alokasi anggaran yang memadai untuk kelancaran tugas kepengawasan.</li>
          <li>Kepada Kepala Madrasah binaan, agar mengoptimalkan tindak lanjut hasil pendampingan dan menjadikan rekomendasi pengawas sebagai bagian dari budaya peningkatan mutu madrasah.</li>
          <li>Kepada dewan guru dan tenaga kependidikan, agar konsisten dalam mengimplementasikan Kurikulum Berbasis Cinta dan profil P3RA dalam pembelajaran dan budaya madrasah.</li>
          <li>Kepada Pokjawas, agar terus memperkuat koordinasi antar pengawas dan memfasilitasi sharing praktik baik kepengawasan.</li>
          <li>Kepada Pengawas Madrasah, agar konsisten meningkatkan kapasitas profesional melalui PKB dan publikasi karya ilmiah.</li>
        </ol>

        <p style="text-align:justify;margin-top:14px;">Demikian Laporan ${labelTW(tw)} Tahun ${tahun} ini disusun. Atas perhatian dan dukungan semua pihak, kami sampaikan terima kasih.</p>
        ${GenHTML.ttdBlokStandar(i)}
      </div>
    `;

    // ===== LAMPIRAN =====
    const lampiran = `
      <div class="doc-page">
        <h2 style="text-align:center;">LAMPIRAN</h2>

        <h3>1. Daftar Madrasah Binaan</h3>
        ${madrasahList.length ? `<table class="fmt" style="width:100%;font-size:11pt;">
          <thead><tr style="background:#f0f0f0;"><th style="width:40px;">No</th><th>Nama Madrasah</th><th style="width:80px;">Jenjang</th><th>Alamat</th></tr></thead>
          <tbody>${madrasahList.map((m, idx) => `<tr><td style="text-align:center;">${idx+1}</td><td>${U.escapeHtml(m.nama_madrasah || '-')}</td><td style="text-align:center;">${U.escapeHtml(m.jenjang || '-')}</td><td>${U.escapeHtml(m.alamat || '-')}</td></tr>`).join('')}</tbody>
        </table>` : `<p><em>Daftar madrasah binaan belum diisi pada menu Madrasah Binaan.</em></p>`}

        <h3 style="margin-top:20px;">2. Matriks RHK ${labelTW(tw)}</h3>
        <table class="fmt" style="width:100%;font-size:10pt;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="width:40px;">No</th>
              <th style="width:70px;">Kode</th>
              <th>Rencana Hasil Kerja</th>
              <th style="width:80px;">Target</th>
              <th style="width:60px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rhks.map((r, idx) => `<tr>
              <td style="text-align:center;">${idx+1}</td>
              <td>${U.escapeHtml(r.id)}</td>
              <td>${U.escapeHtml(r.rencana_hasil_kerja || r.nama_eviden || '-')}</td>
              <td style="text-align:center;">${U.escapeHtml(r.target_kuantitas || '-')}</td>
              <td style="text-align:center;">${(kegByRhk[r.id] || []).length ? '✓' : '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table>

        <h3 style="margin-top:20px;">3. Dokumentasi Kegiatan</h3>
        <p style="font-style:italic;color:#888;">[Lampirkan dokumentasi foto kegiatan, daftar hadir, notulen, dan berita acara sebagaimana terlampir pada masing-masing eviden RHK.]</p>
      </div>
    `;

    return cover + pengesahan + kataPengantar + daftarIsi + bab1 + bab2 + bab3Header + perRhkPages + bab4 + bab5 + lampiran;
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
