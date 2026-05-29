// HTML Generators for Eviden documents (Cover, Pengesahan, BAB I-IV, Lampiran, Surat Tugas, dll)
(function () {
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

  // Variables for narasi templates
  function varsFor(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    return {
      rhk: { ...rhk, nama_eviden: rhk.nama_eviden, rencana_hasil_kerja: rhk.rencana_hasil_kerja, indikator_kuantitas: rhk.indikator_kuantitas, target_kuantitas: rhk.target_kuantitas, triwulan: rhk.triwulan },
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
      pengawas: {
        nama: i.pegawai.nama,
        nip: i.pegawai.nip,
        jabatan: i.pegawai.jabatan,
        unit_kerja: i.pegawai.unit_kerja,
        kabupaten: i.pegawai.kabupaten,
        pangkat: i.pegawai.pangkat_golongan,
      },
      penilai: i.pejabat_penilai,
      atasan: i.atasan_pejabat_penilai,
    };
  }

  function getNarasi(rhkId) {
    const def = window.NARASI_RHK.default;
    const ovr = window.NARASI_RHK[rhkId] || {};
    return { ...def, ...ovr };
  }

  // Cover document
  function genCover(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    return `
      <div class="doc-page">
        ${header(i)}
        <div class="cover-title">LAPORAN EVIDEN<br />${U.escapeHtml(rhk.id)}</div>
        <div class="cover-sub">${U.escapeHtml(rhk.nama_eviden)}</div>
        <div class="cover-sub" style="font-size:12pt;font-style:italic;">${rhk.triwulan === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + rhk.triwulan + ' Tahun 2026'}${keg && keg.nama_kegiatan ? '<br />Kegiatan: ' + U.escapeHtml(keg.nama_kegiatan) : ''}</div>

        <div style="text-align:center;margin:60px auto;">
          ${i.logo ? `<img src="${i.logo}" style="width:160px" />` : '<div style="height:160px;display:grid;place-items:center;color:#888">— LOGO KEMENAG —</div>'}
        </div>

        <div class="cover-id">
          <div>Disusun oleh:</div>
          <div style="font-weight:700; font-size:14pt;">${U.escapeHtml(i.pegawai.nama)}</div>
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
  }

  // Lembar pengesahan
  function genPengesahan(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    return `
      <div class="doc-page">
        ${header(i)}
        <h2 style="text-align:center;text-decoration:underline;">LEMBAR PENGESAHAN</h2>
        <p>Yang bertanda tangan di bawah ini, mengesahkan dokumen <strong>${U.escapeHtml(rhk.nama_eviden)}</strong> (<strong>${U.escapeHtml(rhk.id)}</strong>) ${rhk.triwulan === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + rhk.triwulan} Tahun 2026 yang disusun oleh:</p>
        <table class="fmt" style="width:90%;margin:8px auto;">
          <tr><td style="width:30%">Nama</td><td>${U.escapeHtml(i.pegawai.nama)}</td></tr>
          <tr><td>NIP</td><td>${U.escapeHtml(i.pegawai.nip)}</td></tr>
          <tr><td>Pangkat/Gol</td><td>${U.escapeHtml(i.pegawai.pangkat_golongan)}</td></tr>
          <tr><td>Jabatan</td><td>${U.escapeHtml(i.pegawai.jabatan)}</td></tr>
          <tr><td>Unit Kerja</td><td>${U.escapeHtml(i.pegawai.unit_kerja)}</td></tr>
        </table>
        ${keg ? `<p>Berkenaan dengan kegiatan: <strong>${U.escapeHtml(keg.nama_kegiatan)}</strong> yang dilaksanakan pada ${U.escapeHtml(U.fmtTanggal(keg.tanggal))} bertempat di ${U.escapeHtml(keg.tempat || '-')}.</p>` : ''}
        <p>Dokumen ini menjadi bagian dari Sasaran Kinerja Pegawai (SKP) Tahun 2026 sesuai Perdirjen GTK Nomor 7328 Tahun 2023.</p>
        <div style="text-align:right;margin-top:30px">${tanggalKota(i)}</div>

        <div class="ttd">
          <div class="ttd-block">
            <div>Pegawai yang Dinilai,</div>
            <div style="height:80px"></div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          </div>
          <div class="ttd-block">
            <div>Mengetahui,<br />Pejabat Penilai Kinerja,</div>
            <div style="height:80px"></div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pejabat_penilai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pejabat_penilai.nip)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function genKataPengantar(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    return `
      <div class="doc-page">
        <h2 style="text-align:center;text-decoration:underline;">KATA PENGANTAR</h2>
        <p style="text-align:justify;">Puji syukur kami panjatkan kehadirat Allah SWT atas limpahan rahmat dan karunia-Nya, sehingga penyusunan <strong>${U.escapeHtml(rhk.nama_eviden)}</strong> (<strong>${U.escapeHtml(rhk.id)}</strong>) ${rhk.triwulan === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + rhk.triwulan} Tahun 2026 dapat diselesaikan. Shalawat dan salam senantiasa tercurah kepada Nabi Muhammad SAW.</p>
        <p style="text-align:justify;">Dokumen ini disusun sebagai bagian dari Sasaran Kinerja Pegawai (SKP) ${U.escapeHtml(i.pegawai.nama)} Tahun 2026, dalam rangka pelaksanaan tugas pokok dan fungsi Pengawas Madrasah pada ${U.escapeHtml(i.pegawai.unit_kerja)}.</p>
        <p style="text-align:justify;">Kami mengucapkan terima kasih kepada Kepala ${U.escapeHtml(i.pejabat_penilai.unit_kerja)}, Kepala Madrasah, dewan guru, dan seluruh pemangku kepentingan yang telah memberikan dukungan dalam pelaksanaan kegiatan ini.</p>
        <p style="text-align:justify;">Kami menyadari masih terdapat kekurangan dalam penyusunan dokumen ini, sehingga masukan dan saran yang konstruktif sangat kami harapkan demi perbaikan di masa mendatang.</p>
        <div style="text-align:right;margin-top:30px">${tanggalKota(i)}<br />Penyusun,</div>
        <div style="text-align:right;margin-top:60px">
          <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
          <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
        </div>
      </div>
    `;
  }

  function genDaftarIsi(rhk, keg, idn) {
    const items = [
      ['HALAMAN JUDUL', 'i'],
      ['LEMBAR PENGESAHAN', 'ii'],
      ['KATA PENGANTAR', 'iii'],
      ['DAFTAR ISI', 'iv'],
      ['BAB I PENDAHULUAN', '1'],
      ['  A. Latar Belakang', '1'],
      ['  B. Dasar Pelaksanaan', '2'],
      ['  C. Tujuan', '3'],
      ['  D. Sasaran', '3'],
      ['BAB II PELAKSANAAN', '4'],
      ['  A. Waktu dan Tempat', '4'],
      ['  B. Peserta/Sasaran', '4'],
      ['  C. Langkah Kegiatan', '5'],
      ['  D. Metode Pelaksanaan', '6'],
      ['BAB III HASIL KEGIATAN', '7'],
      ['  A. Hasil yang Dicapai', '7'],
      ['  B. Analisis Hasil', '8'],
      ['  C. Permasalahan', '9'],
      ['  D. Solusi', '9'],
      ['  E. Tindak Lanjut', '10'],
      ['BAB IV PENUTUP', '11'],
      ['  A. Kesimpulan', '11'],
      ['  B. Rekomendasi', '11'],
      ['LAMPIRAN', '12'],
    ];
    return `
      <div class="doc-page">
        <h2 style="text-align:center;text-decoration:underline;">DAFTAR ISI</h2>
        <table style="width:100%;border-collapse:collapse;">
          ${items.map(([t, p]) => `<tr><td style="padding:4px 0;border-bottom:1px dotted #888;">${U.escapeHtml(t)}</td><td style="padding:4px 0;text-align:right;border-bottom:1px dotted #888;">${p}</td></tr>`).join('')}
        </table>
      </div>
    `;
  }

  function genBabI(rhk, keg, idn) {
    const N = getNarasi(rhk.id);
    const v = varsFor(rhk, keg, idn);
    return `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB I<br />PENDAHULUAN</h2>
        <h3>A. Latar Belakang</h3>
        <p style="text-align:justify;">${U.nl2br(U.fillTemplate(N.latar_belakang, v))}</p>
        <h3>B. Dasar Pelaksanaan</h3>
        <p style="text-align:justify;white-space:pre-wrap;">${U.escapeHtml(U.fillTemplate(N.dasar, v))}</p>
        <h3>C. Tujuan</h3>
        <p style="text-align:justify;white-space:pre-wrap;">${U.escapeHtml(U.fillTemplate(N.tujuan, v))}</p>
        <h3>D. Sasaran</h3>
        <p style="text-align:justify;">${U.nl2br(U.fillTemplate(N.sasaran, v))}</p>
      </div>
    `;
  }

  function genBabII(rhk, keg, idn) {
    const N = getNarasi(rhk.id);
    const v = varsFor(rhk, keg, idn);
    return `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB II<br />PELAKSANAAN</h2>
        <h3>A. Waktu dan Tempat</h3>
        <p style="text-align:justify;">${U.nl2br(U.fillTemplate(N.waktu_tempat, v))}</p>
        <h3>B. Peserta/Sasaran</h3>
        <p style="text-align:justify;">${U.nl2br(keg ? (keg.peserta || keg.sasaran || '-') : '-')}</p>
        <h3>C. Langkah Kegiatan</h3>
        <p style="text-align:justify;white-space:pre-wrap;">${U.escapeHtml(U.fillTemplate(N.langkah, v))}</p>
        <h3>D. Metode Pelaksanaan</h3>
        <p style="text-align:justify;">${U.nl2br(U.fillTemplate(N.metode, v))}</p>
      </div>
    `;
  }

  function genBabIII(rhk, keg, idn) {
    const N = getNarasi(rhk.id);
    const v = varsFor(rhk, keg, idn);
    return `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB III<br />HASIL KEGIATAN</h2>
        <h3>A. Hasil yang Dicapai</h3>
        <p style="text-align:justify;">${U.nl2br(U.fillTemplate(N.hasil, v))}</p>
        <h3>B. Analisis Hasil</h3>
        <p style="text-align:justify;">${U.nl2br(U.fillTemplate(N.analisis, v))}</p>
        <h3>C. Permasalahan</h3>
        <p style="text-align:justify;">${U.nl2br(U.fillTemplate(N.permasalahan, v) || '-')}</p>
        <h3>D. Solusi</h3>
        <p style="text-align:justify;">${U.nl2br(U.fillTemplate(N.solusi, v) || '-')}</p>
        <h3>E. Tindak Lanjut</h3>
        <p style="text-align:justify;">${U.nl2br(U.fillTemplate(N.tindak_lanjut, v) || '-')}</p>
      </div>
    `;
  }

  function genBabIV(rhk, keg, idn) {
    const N = getNarasi(rhk.id);
    const v = varsFor(rhk, keg, idn);
    const i = idn || Page.Identitas.get();
    return `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB IV<br />PENUTUP</h2>
        <h3>A. Kesimpulan</h3>
        <p style="text-align:justify;">${U.nl2br(U.fillTemplate(N.kesimpulan, v))}</p>
        <h3>B. Rekomendasi</h3>
        <p style="text-align:justify;">${U.nl2br(U.fillTemplate(N.rekomendasi, v))}</p>
        <div style="text-align:right;margin-top:30px">${tanggalKota(i)}</div>
        <div class="ttd">
          <div class="ttd-block"></div>
          <div class="ttd-block">
            <div>${U.escapeHtml(i.pegawai.jabatan)},</div>
            <div style="height:80px;display:grid;place-items:center;">${i.tanda_tangan ? `<img class="signature-img" src="${i.tanda_tangan}" />` : ''}${i.stempel ? `<img src="${i.stempel}" style="position:absolute;max-height:90px;opacity:.7;" />` : ''}</div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Laporan Singkat per RHK — ringkas, berbasis hasil pendampingan/pengawasan
  function genLaporanSingkat(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    const N = getNarasi(rhk.id);
    const v = varsFor(rhk, keg, idn);
    const periode = rhk.triwulan === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + rhk.triwulan + ' Tahun 2026';

    const uraian = keg ? (keg.uraian || '') : '';
    const hasil  = keg ? (keg.hasil || '') : '';
    const kendala = keg ? (keg.kendala || '') : '';
    const solusi  = keg ? (keg.solusi || '') : '';
    const tindak  = keg ? (keg.tindak_lanjut || '') : '';
    const rekom   = keg ? (keg.rekomendasi || '') : '';

    const ringkasPelaksanaan = uraian || U.fillTemplate(N.langkah || '', v) || '-';
    const ringkasHasil       = hasil  || U.fillTemplate(N.hasil || '', v) || '-';
    const ringkasAnalisis    = U.fillTemplate(N.analisis || '', v) || '-';
    const ringkasRekom       = rekom  || U.fillTemplate(N.rekomendasi || '', v) || '-';

    return `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;margin:8px 0 4px;">LAPORAN SINGKAT HASIL PENGAWASAN / PENDAMPINGAN</h3>
        <p style="text-align:center;margin:0 0 16px;"><strong>${U.escapeHtml(rhk.nama_eviden)}</strong><br/><em>${U.escapeHtml(rhk.id)} · ${U.escapeHtml(periode)} · ${U.escapeHtml(rhk.jenis_kinerja || '')}</em></p>

        <table class="fmt" style="width:100%;margin-bottom:10px;">
          <tr><td style="width:30%">Pengawas Madrasah</td><td>${U.escapeHtml(i.pegawai.nama)} (NIP. ${U.escapeHtml(i.pegawai.nip)})</td></tr>
          <tr><td>Jabatan</td><td>${U.escapeHtml(i.pegawai.jabatan)}</td></tr>
          <tr><td>Unit Kerja</td><td>${U.escapeHtml(i.pegawai.unit_kerja)}</td></tr>
          <tr><td>Wilayah Binaan</td><td>${U.escapeHtml(i.pegawai.kabupaten || '-')}</td></tr>
        </table>

        <table class="fmt" style="width:100%;margin-bottom:10px;">
          <tr><td style="width:30%"><strong>RHK Atasan yang Diintervensi</strong></td><td>${U.nl2br(rhk.rhk_atasan_intervensi || '-')}</td></tr>
          <tr><td><strong>Rencana Hasil Kerja</strong></td><td>${U.nl2br(rhk.rencana_hasil_kerja || '-')}</td></tr>
          <tr><td><strong>Indikator (Kuantitas)</strong></td><td>${U.escapeHtml(rhk.indikator_kuantitas || '-')} <em>(Target: ${U.escapeHtml(rhk.target_kuantitas || '-')})</em></td></tr>
          <tr><td><strong>Indikator (Waktu)</strong></td><td>${U.escapeHtml(rhk.indikator_waktu || '-')} <em>(Durasi: ${U.escapeHtml(rhk.target_waktu || '-')})</em></td></tr>
          <tr><td><strong>Rencana Aksi</strong></td><td>${U.nl2br(rhk.rencana_aksi || '-')}</td></tr>
        </table>

        ${keg ? `
        <table class="fmt" style="width:100%;margin-bottom:10px;">
          <tr><td style="width:30%"><strong>Kegiatan Pendampingan</strong></td><td>${U.escapeHtml(keg.nama_kegiatan || '-')}</td></tr>
          <tr><td><strong>Hari/Tanggal</strong></td><td>${U.escapeHtml(U.fmtTanggal(keg.tanggal) || '-')}</td></tr>
          <tr><td><strong>Tempat</strong></td><td>${U.escapeHtml(keg.tempat || '-')}</td></tr>
          <tr><td><strong>Sasaran/Peserta</strong></td><td>${U.escapeHtml(keg.sasaran || keg.peserta || '-')}</td></tr>
        </table>
        ` : `<p class="text-muted"><em>Catatan: laporan ini disusun tanpa data kegiatan terkait. Tambahkan kegiatan pada menu Data Kegiatan agar uraian pelaksanaan terisi otomatis.</em></p>`}

        <h4 style="margin-top:14px;">A. Uraian Pelaksanaan</h4>
        <p style="text-align:justify;">${U.nl2br(ringkasPelaksanaan)}</p>

        <h4>B. Hasil yang Dicapai</h4>
        <p style="text-align:justify;">${U.nl2br(ringkasHasil)}</p>

        <h4>C. Analisis Singkat</h4>
        <p style="text-align:justify;">${U.nl2br(ringkasAnalisis)}</p>

        ${(kendala || solusi) ? `
        <h4>D. Permasalahan dan Solusi</h4>
        <table class="fmt" style="width:100%;">
          <tr><td style="width:50%;vertical-align:top;"><strong>Permasalahan</strong><br/>${U.nl2br(kendala || '-')}</td>
              <td style="vertical-align:top;"><strong>Solusi</strong><br/>${U.nl2br(solusi || '-')}</td></tr>
        </table>` : ''}

        <h4>${(kendala || solusi) ? 'E' : 'D'}. Tindak Lanjut</h4>
        <p style="text-align:justify;">${U.nl2br(tindak || '-')}</p>

        <h4>${(kendala || solusi) ? 'F' : 'E'}. Rekomendasi</h4>
        <p style="text-align:justify;">${U.nl2br(ringkasRekom)}</p>

        <p style="text-align:right;margin-top:24px;">${tanggalKota(i)}</p>
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
  }

  function genSuratTugas(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    const noSurat = `B-${(rhk.nomor_rhk || '00')}/${(i.pegawai.kabupaten || 'JBR').toString().slice(0,3).toUpperCase()}/${new Date().getFullYear()}`;
    return `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;">SURAT TUGAS</h3>
        <p style="text-align:center;">Nomor: ${U.escapeHtml(noSurat)}</p>
        <p>Yang bertanda tangan di bawah ini, ${U.escapeHtml(i.pejabat_penilai.jabatan)}, menugaskan kepada:</p>
        <table class="fmt" style="width:90%;margin:8px auto">
          <tr><td>Nama</td><td>${U.escapeHtml(i.pegawai.nama)}</td></tr>
          <tr><td>NIP</td><td>${U.escapeHtml(i.pegawai.nip)}</td></tr>
          <tr><td>Pangkat/Gol</td><td>${U.escapeHtml(i.pegawai.pangkat_golongan)}</td></tr>
          <tr><td>Jabatan</td><td>${U.escapeHtml(i.pegawai.jabatan)}</td></tr>
        </table>
        <p>Untuk melaksanakan kegiatan <strong>${U.escapeHtml(keg ? keg.nama_kegiatan : rhk.nama_eviden)}</strong> dalam rangka <strong>${U.escapeHtml(rhk.nama_eviden)}</strong> ${rhk.triwulan === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + rhk.triwulan + ' Tahun 2026'}, yang akan dilaksanakan pada:</p>
        <table class="fmt" style="width:90%;margin:8px auto">
          <tr><td style="width:30%">Hari/Tanggal</td><td>${U.escapeHtml(keg ? U.fmtTanggal(keg.tanggal) : '...')}</td></tr>
          <tr><td>Tempat</td><td>${U.escapeHtml(keg ? (keg.tempat || '-') : '-')}</td></tr>
          <tr><td>Sasaran</td><td>${U.escapeHtml(keg ? (keg.sasaran || '-') : '-')}</td></tr>
        </table>
        <p>Setelah melaksanakan tugas, yang bersangkutan diharapkan menyampaikan laporan tertulis kepada pimpinan.</p>
        <p>Demikian surat tugas ini diberikan untuk dilaksanakan sebagaimana mestinya.</p>

        <div style="text-align:right;margin-top:30px">${tanggalKota(i)}</div>
        <div class="ttd">
          <div class="ttd-block"></div>
          <div class="ttd-block">
            <div>${U.escapeHtml(i.pejabat_penilai.jabatan)},</div>
            <div style="height:80px"></div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pejabat_penilai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pejabat_penilai.nip)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function genUndangan(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    return `
      <div class="doc-page">
        ${header(i)}
        <table style="width:100%;margin-bottom:8px">
          <tr><td style="width:80px">Nomor</td><td>: B-${rhk.nomor_rhk || '00'}/UND/${new Date().getFullYear()}</td><td style="text-align:right">${tanggalKota(i)}</td></tr>
          <tr><td>Sifat</td><td>: Penting</td><td></td></tr>
          <tr><td>Lampiran</td><td>: -</td><td></td></tr>
          <tr><td>Hal</td><td>: <strong>Undangan ${U.escapeHtml(keg ? keg.nama_kegiatan : rhk.nama_eviden)}</strong></td><td></td></tr>
        </table>
        <p>Kepada Yth.<br />${U.escapeHtml(keg ? (keg.sasaran || 'Kepala Madrasah Binaan') : 'Kepala Madrasah Binaan')}<br />di Tempat</p>
        <p style="text-align:justify;">Dengan hormat, sehubungan dengan pelaksanaan ${U.escapeHtml(rhk.nama_eviden)} ${rhk.triwulan === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + rhk.triwulan + ' Tahun 2026'}, dengan ini kami mengundang Bapak/Ibu untuk menghadiri kegiatan dengan rincian sebagai berikut:</p>
        <table class="fmt" style="width:90%;margin:8px auto">
          <tr><td style="width:30%">Hari/Tanggal</td><td>${U.escapeHtml(keg ? U.fmtTanggal(keg.tanggal) : '...')}</td></tr>
          <tr><td>Waktu</td><td>08.00 WIB s.d. selesai</td></tr>
          <tr><td>Tempat</td><td>${U.escapeHtml(keg ? (keg.tempat || '-') : '-')}</td></tr>
          <tr><td>Acara</td><td>${U.escapeHtml(keg ? keg.nama_kegiatan : rhk.nama_eviden)}</td></tr>
        </table>
        <p style="text-align:justify;">Mengingat pentingnya acara tersebut, dimohon kehadirannya tepat waktu. Atas perhatian dan kerja sama Bapak/Ibu, kami sampaikan terima kasih.</p>
        <div class="ttd">
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
  }

  function genDaftarHadir(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    const rows = Array.from({ length: 15 }).map((_, k) => `<tr><td>${k+1}</td><td></td><td></td><td></td><td></td><td></td></tr>`).join('');
    return `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;">DAFTAR HADIR</h3>
        <p>Kegiatan : <strong>${U.escapeHtml(keg ? keg.nama_kegiatan : rhk.nama_eviden)}</strong><br />
        Hari/Tanggal : ${U.escapeHtml(keg ? U.fmtTanggal(keg.tanggal) : '...')}<br />
        Tempat : ${U.escapeHtml(keg ? (keg.tempat || '-') : '-')}</p>
        <table class="fmt" style="width:100%">
          <thead><tr><th style="width:30px">No</th><th>Nama</th><th>NIP/NUPTK</th><th>Asal Madrasah</th><th>Jabatan</th><th>Tanda Tangan</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="ttd">
          <div class="ttd-block"></div>
          <div class="ttd-block">
            <div>Mengetahui,</div>
            <div>${U.escapeHtml(i.pegawai.jabatan)},</div>
            <div style="height:80px"></div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function genNotulen(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    return `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;">NOTULEN KEGIATAN</h3>
        <table class="fmt" style="width:100%">
          <tr><td style="width:25%">Nama Kegiatan</td><td>${U.escapeHtml(keg ? keg.nama_kegiatan : rhk.nama_eviden)}</td></tr>
          <tr><td>Tanggal</td><td>${U.escapeHtml(keg ? U.fmtTanggal(keg.tanggal) : '...')}</td></tr>
          <tr><td>Tempat</td><td>${U.escapeHtml(keg ? (keg.tempat || '-') : '-')}</td></tr>
          <tr><td>Pemimpin Rapat</td><td>${U.escapeHtml(i.pegawai.nama)}</td></tr>
          <tr><td>Notulis</td><td>(diisi)</td></tr>
        </table>
        <h4 class="mt-3">Pembahasan</h4>
        <p style="text-align:justify;">${U.nl2br(keg ? (keg.uraian || '-') : '-')}</p>
        <h4>Hasil/Keputusan</h4>
        <p style="text-align:justify;">${U.nl2br(keg ? (keg.hasil || '-') : '-')}</p>
        <h4>Tindak Lanjut</h4>
        <p style="text-align:justify;">${U.nl2br(keg ? (keg.tindak_lanjut || '-') : '-')}</p>
        <div class="ttd">
          <div class="ttd-block">
            <div>Notulis,</div>
            <div style="height:80px"></div>
            <div style="text-decoration:underline;font-weight:700">________________</div>
          </div>
          <div class="ttd-block">
            <div>Pemimpin Rapat,</div>
            <div style="height:80px"></div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function genBeritaAcara(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    return `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;">BERITA ACARA</h3>
        <p style="text-align:center;">Nomor: BA-${rhk.nomor_rhk || '00'}/${new Date().getFullYear()}</p>
        <p style="text-align:justify;">Pada hari ini, ${U.escapeHtml(keg ? U.fmtTanggal(keg.tanggal) : '...')}, telah dilaksanakan kegiatan <strong>${U.escapeHtml(keg ? keg.nama_kegiatan : rhk.nama_eviden)}</strong> bertempat di ${U.escapeHtml(keg ? (keg.tempat || '-') : '-')}, dengan hasil sebagai berikut:</p>
        <p style="text-align:justify;">${U.nl2br(keg ? (keg.hasil || '-') : '-')}</p>
        <p>Demikian berita acara ini dibuat untuk dapat dipergunakan sebagaimana mestinya.</p>
        <div class="ttd">
          <div class="ttd-block">
            <div>Saksi,</div>
            <div style="height:80px"></div>
            <div style="text-decoration:underline;font-weight:700">________________</div>
          </div>
          <div class="ttd-block">
            <div>${U.escapeHtml(i.pegawai.jabatan)},</div>
            <div style="height:80px;display:grid;place-items:center;">${i.tanda_tangan ? `<img class="signature-img" src="${i.tanda_tangan}" />` : ''}</div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function genInstrumen(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    return `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;">INSTRUMEN ${U.escapeHtml((rhk.nama_eviden || '').toUpperCase())}</h3>
        <p>Petunjuk: Berikan tanda centang (✓) pada kolom yang sesuai dengan kondisi di lapangan.</p>
        <table class="fmt" style="width:100%">
          <thead><tr><th style="width:30px">No</th><th>Aspek/Komponen</th><th style="width:60px">Ya</th><th style="width:60px">Tidak</th><th>Catatan</th></tr></thead>
          <tbody>
            ${(rhk.bukti_dukung || []).map((b, k) => `<tr><td>${k + 1}</td><td>${U.escapeHtml(b)}</td><td></td><td></td><td></td></tr>`).join('')}
            ${Array.from({length: 5}).map((_, k) => `<tr><td>${(rhk.bukti_dukung || []).length + k + 1}</td><td></td><td></td><td></td><td></td></tr>`).join('')}
          </tbody>
        </table>
        <p class="mt-3">Indikator Kuantitas: ${U.escapeHtml(rhk.indikator_kuantitas || '')} (Target: ${U.escapeHtml(rhk.target_kuantitas || '')})<br />
        Indikator Waktu: ${U.escapeHtml(rhk.indikator_waktu || '')} (Durasi: ${U.escapeHtml(rhk.target_waktu || '')})</p>
        <div class="ttd">
          <div class="ttd-block"></div>
          <div class="ttd-block">
            <div>${U.escapeHtml(i.pegawai.jabatan)},</div>
            <div style="height:80px"></div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function genRekap(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    return `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;">REKAP HASIL KEGIATAN</h3>
        <p>Kegiatan: <strong>${U.escapeHtml(keg ? keg.nama_kegiatan : rhk.nama_eviden)}</strong> (RHK ${U.escapeHtml(rhk.id)})</p>
        <table class="fmt" style="width:100%">
          <thead><tr><th>Aspek</th><th>Indikator</th><th>Target</th><th>Capaian</th><th>%</th><th>Catatan</th></tr></thead>
          <tbody>
            <tr><td>Kuantitas</td><td>${U.escapeHtml(rhk.indikator_kuantitas || '')}</td><td>${U.escapeHtml(rhk.target_kuantitas || '')}</td><td></td><td></td><td></td></tr>
            <tr><td>Waktu</td><td>${U.escapeHtml(rhk.indikator_waktu || '')}</td><td>${U.escapeHtml(rhk.target_waktu || '')}</td><td></td><td></td><td></td></tr>
          </tbody>
        </table>
        <h4 class="mt-3">Catatan Hasil</h4>
        <p style="text-align:justify;">${U.nl2br(keg ? (keg.hasil || '-') : '-')}</p>
        <div class="ttd">
          <div class="ttd-block"></div>
          <div class="ttd-block">
            <div>${U.escapeHtml(i.pegawai.jabatan)},</div>
            <div style="height:80px"></div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function genAnalisis(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    const N = getNarasi(rhk.id);
    const v = varsFor(rhk, keg, idn);
    return `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;">ANALISIS HASIL KEGIATAN</h3>
        <p>Kegiatan: <strong>${U.escapeHtml(keg ? keg.nama_kegiatan : rhk.nama_eviden)}</strong></p>
        <p style="text-align:justify;">${U.nl2br(U.fillTemplate(N.analisis, v))}</p>
        <h4>Faktor Pendukung</h4>
        <p style="text-align:justify;">- Dukungan Kepala Madrasah dan dewan guru<br />- Ketersediaan dokumen pendukung<br />- Komitmen pemangku kepentingan</p>
        <h4>Faktor Penghambat</h4>
        <p style="text-align:justify;">${U.nl2br(keg ? (keg.kendala || '-') : '-')}</p>
        <h4>Strategi Tindak Lanjut</h4>
        <p style="text-align:justify;">${U.nl2br(keg ? (keg.tindak_lanjut || '-') : '-')}</p>
      </div>
    `;
  }

  function genRekomendasi(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    const N = getNarasi(rhk.id);
    const v = varsFor(rhk, keg, idn);
    return `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;">REKOMENDASI TINDAK LANJUT</h3>
        <p style="text-align:justify;">Berdasarkan hasil pelaksanaan ${U.escapeHtml(rhk.nama_eviden)}, ${rhk.triwulan === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + rhk.triwulan + ' Tahun 2026'}, kami menyampaikan rekomendasi sebagai berikut:</p>
        <p style="text-align:justify;white-space:pre-wrap;">${U.escapeHtml(U.fillTemplate(N.rekomendasi, v))}</p>
        <div class="ttd">
          <div class="ttd-block"></div>
          <div class="ttd-block">
            <div>${U.escapeHtml(i.pegawai.jabatan)},</div>
            <div style="height:80px"></div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function genFotoDok(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    const fotos = (keg && keg.foto) || [];
    if (!fotos.length) {
      return `
        <div class="doc-page">
          ${header(i)}
          <h3 style="text-align:center;text-decoration:underline;">DOKUMENTASI FOTO KEGIATAN</h3>
          <p class="text-muted text-center" style="margin-top:60px;">Belum ada foto dokumentasi diunggah pada kegiatan ini.</p>
        </div>`;
    }
    const cells = fotos.map(f => `
      <div style="width:48%;margin-bottom:12px;text-align:center;page-break-inside:avoid;">
        <img src="${f.dataUrl}" style="max-width:100%;max-height:200px;border:1px solid #888" />
        <div class="small">${U.escapeHtml(f.name || '')}</div>
      </div>`).join('');
    return `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;">DOKUMENTASI FOTO KEGIATAN</h3>
        <div style="display:flex;flex-wrap:wrap;justify-content:space-between;">${cells}</div>
      </div>
    `;
  }

  function genLinkBukti(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    const link = rhk.link_bukti_dukung || '';
    return `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;">LINK BUKTI DUKUNG GOOGLE DRIVE</h3>
        <p>Bukti dukung lengkap untuk <strong>${U.escapeHtml(rhk.nama_eviden)}</strong> tersedia pada tautan berikut:</p>
        <p style="text-align:center;font-size:14pt;">${link ? `<a href="${U.escapeHtml(link)}">${U.escapeHtml(link)}</a>` : '<em>(Belum diisi pada Master RHK)</em>'}</p>
        <p class="text-muted small">Anda dapat mengubah link ini melalui menu <strong>Master RHK → Edit RHK ${U.escapeHtml(rhk.id)}</strong>.</p>
      </div>
    `;
  }

  // Document type catalog: id -> { label, gen }
  const TYPES = {
    laporan_singkat: { label: 'Laporan Singkat Hasil Pendampingan', gen: genLaporanSingkat },
    surat_tugas: { label: 'Surat Tugas', gen: genSuratTugas },
    undangan: { label: 'Undangan Kegiatan', gen: genUndangan },
    daftar_hadir: { label: 'Daftar Hadir', gen: genDaftarHadir },
    notulen: { label: 'Notulen', gen: genNotulen },
    berita_acara: { label: 'Berita Acara', gen: genBeritaAcara },
    instrumen: { label: 'Instrumen Kegiatan', gen: genInstrumen },
    rekap: { label: 'Rekap Hasil', gen: genRekap },
    analisis: { label: 'Analisis Hasil', gen: genAnalisis },
    rekomendasi: { label: 'Rekomendasi Tindak Lanjut', gen: genRekomendasi },
    foto: { label: 'Dokumentasi Foto Kegiatan', gen: genFotoDok },
    link: { label: 'Link Bukti Dukung Google Drive', gen: genLinkBukti },
  };

  function defaultTypesFor(rhk) {
    return ['laporan_singkat','surat_tugas','undangan','daftar_hadir','notulen','berita_acara','instrumen','rekap','analisis','rekomendasi','foto','link'];
  }

  // Plain text version (for DOCX & PDF fallback) — strip HTML
  function htmlToPlain(html) {
    return html.replace(/<style[\s\S]*?<\/style>/gi, '')
               .replace(/<script[\s\S]*?<\/script>/gi, '')
               .replace(/<br\s*\/?>(\r?\n)?/gi, '\n')
               .replace(/<\/(p|div|h[1-6]|tr|li)>/gi, '\n')
               .replace(/<[^>]+>/g, '')
               .replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#39;/g, "'")
               .replace(/\n{3,}/g, '\n\n').trim();
  }

  window.GenHTML = { TYPES, defaultTypesFor, htmlToPlain, header, varsFor, getNarasi, tanggalKota };
})();
