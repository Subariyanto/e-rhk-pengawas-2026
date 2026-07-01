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

  // ===== Helper: Get current signature mode =====
  function getSigMode() {
    if (window.Signature) {
      const s = Signature.getSettings();
      return s.default_mode || 'scan_signature';
    }
    return 'scan_signature';
  }

  // ===== Helper: Pengawas TTD block based on mode =====
  // When inside a .ttd-block (inside .ttd flex row), render plain — no extra flex wrapper.
  function pengawasTTDHtml(i, mode, rhkId) {
    const kota = i.pegawai.kabupaten || 'Jember';
    const tanggal = U.fmtTanggal(new Date());
    if (mode === 'qrcode_tte' && window.Signature) {
      const record = Signature.createTTERecord(i, rhkId || '', '');
      const verUrl = Signature.getVerificationUrl(record.verification_code);
      const qrId = 'qr_' + record.id;
      return `
        <div class="tte-block" style="margin-top:16px;padding:14px;border:2px solid #1E2A5A;border-radius:8px;background:#f8f9fa;text-align:center;">
          <div style="font-weight:600;color:#1E2A5A;font-size:10pt;margin-bottom:10px;">Telah Ditandatangani Secara Elektronik</div>
          <div style="display:flex;gap:14px;align-items:flex-start;">
            <div style="flex:1;text-align:left;">
              <div style="font-weight:700;">${U.escapeHtml(i.pegawai.nama)}</div>
              <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
              <div>${U.escapeHtml(i.pegawai.jabatan || '')}</div>
              <div>${U.escapeHtml(i.pegawai.unit_kerja || '')}</div>
              <div style="font-size:8pt;color:#666;margin-top:6px;">
                <div>Tanggal TTE: ${tanggal} ${new Date().toLocaleTimeString('id-ID')}</div>
                <div>No. Dokumen: ${record.nomor_dokumen}</div>
                <div>Kode Verifikasi: <code>${record.verification_code}</code></div>
              </div>
            </div>
            <div style="text-align:center;">
              <div id="${qrId}" class="qr-container" data-qr-url="${verUrl}" style="width:100px;height:100px;"></div>
              <div style="font-size:7pt;margin-top:4px;color:#888;">Pindai untuk verifikasi</div>
            </div>
          </div>
          <div style="margin-top:6px;font-size:7pt;color:#999;text-align:center;border-top:1px solid #dee2e6;padding-top:4px;">
            Verifikasi: ${verUrl}
          </div>
        </div>
      `;
    } else if (mode === 'blank_manual') {
      return `
        <div style="text-align:center;margin-top:10px;">
          <div>${U.escapeHtml(kota)}, ${tanggal}</div>
          <div>Pengawas Madrasah,</div>
          <div style="height:90px;"></div>
          <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
          <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
        </div>
      `;
    }
    // Default: scan_signature — clean centered layout, no nested flex wrappers
    const sigImg = i.tanda_tangan ? `<img class="signature-img" src="${i.tanda_tangan}" />` : '<div style="height:70px;"></div>';
    return `
      <div style="text-align:center;margin-top:10px;">
        <div>${U.escapeHtml(kota)}, ${tanggal}</div>
        <div>Pengawas Madrasah,</div>
        <div style="min-height:70px;display:flex;align-items:center;justify-content:center;">${sigImg}</div>
        <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
        <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
      </div>
    `;
  }

  // ===== TTD Layout standar (Kanan: Pengawas, Kiri: Ketua Pokjawas, Bawah: Kepala Kankemenag) =====
  // Default Ketua Pokjawas Kab Jember (sesuai MEMORY): SUBARIYANTO, S.Pd, M.Pd.I (NIP 197002122005011004)
  function ttdBlokStandar(idn, rhkId) {
    const i = idn || Page.Identitas.get();
    const mode = getSigMode();
    const ketuaPokjawasNama = (i.ketua_pokjawas && i.ketua_pokjawas.nama) || 'SUBARIYANTO, S.Pd, M.Pd.I';
    const ketuaPokjawasNIP  = (i.ketua_pokjawas && i.ketua_pokjawas.nip) || '197002122005011004';
    return `
      <div class="ttd" style="margin-top:24px;">
        <div class="ttd-block">
          <div>&nbsp;</div>
          <div>Ketua Pokjawas Madrasah,</div>
          <div style="height:80px;"></div>
          <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(ketuaPokjawasNama)}</div>
          <div>NIP. ${U.escapeHtml(ketuaPokjawasNIP)}</div>
        </div>
        <div class="ttd-block">
          ${pengawasTTDHtml(i, mode, rhkId)}
        </div>
      </div>
      <div style="text-align:center;margin-top:36px;clear:both;">
        <div>Mengetahui,</div>
        <div>${U.escapeHtml(i.pejabat_penilai.jabatan || 'Kepala Kantor Kementerian Agama Kabupaten Jember')},</div>
        <div style="height:80px;"></div>
        <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pejabat_penilai.nama)}</div>
        <div>NIP. ${U.escapeHtml(i.pejabat_penilai.nip)}</div>
      </div>
    `;
  }

  // TTD untuk Laporan Triwulan: Kiri Ketua Pokjawas, Kanan Pengawas + Kota & Tanggal (sejajar, tanpa Mengetahui)
  function ttdTriwulan(idn, rhkId) {
    const i = idn || Page.Identitas.get();
    const mode = getSigMode();
    const ketuaPokjawasNama = (i.ketua_pokjawas && i.ketua_pokjawas.nama) || 'SUBARIYANTO, S.Pd, M.Pd.I';
    const ketuaPokjawasNIP  = (i.ketua_pokjawas && i.ketua_pokjawas.nip) || '197002122005011004';
    return `
      <div class="ttd" style="margin-top:24px;">
        <div class="ttd-block">
          <div>&nbsp;</div>
          <div>Ketua Pokjawas Madrasah,</div>
          <div style="height:80px;"></div>
          <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(ketuaPokjawasNama)}</div>
          <div>NIP. ${U.escapeHtml(ketuaPokjawasNIP)}</div>
        </div>
        <div class="ttd-block">
          ${pengawasTTDHtml(i, mode, rhkId)}
        </div>
      </div>
    `;
  }

  // TTD versi sederhana (cuma pengawas, posisi center agak ke kanan)
  function ttdPengawas(idn, rhkId) {
    const i = idn || Page.Identitas.get();
    const mode = getSigMode();
    return pengawasTTDHtml(i, mode, rhkId);
  }

  // TTD untuk halaman Penutup / Kata Pengantar: hanya Pengawas, center-right
  function ttdBlokPenutup(idn, rhkId) {
    const i = idn || Page.Identitas.get();
    const mode = getSigMode();
    return `<div style="display:flex;justify-content:center;">
      <div style="width:50%;min-width:240px;text-align:center;">${pengawasTTDHtml(i, mode, rhkId)}</div>
    </div>`;
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

  // Cover document (tanpa kop)
  function genCover(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    return `
      <div class="doc-page doc-cover">
        <div class="cover-title">LAPORAN EVIDEN<br />${U.escapeHtml(rhk.id)}</div>
        <div class="cover-sub">${U.escapeHtml(rhk.nama_eviden)}</div>
        <div class="cover-sub" style="font-style:italic;">${rhk.triwulan === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + rhk.triwulan + ' Tahun 2026'}${keg && keg.nama_kegiatan ? '<br />Kegiatan: ' + U.escapeHtml(keg.nama_kegiatan) : ''}</div>

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
        ${ttdBlokStandar(i)}
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
        ${ttdBlokPenutup(i)}
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
        ${ttdBlokPenutup(i)}
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

    // Fallback ke library template kegiatan kalau field kosong
    const TPL = window.TemplateKegiatan;
    const tplTindak = TPL ? TPL.getTemplate(rhk, 'tindak_lanjut', 0) : '';
    const tplRekom  = TPL ? TPL.getTemplate(rhk, 'rekomendasi',  0) : '';

    const ringkasPelaksanaan = uraian || U.fillTemplate(N.langkah || '', v) || '-';
    const ringkasHasil       = hasil  || U.fillTemplate(N.hasil || '', v) || '-';
    const ringkasAnalisis    = U.fillTemplate(N.analisis || '', v) || '-';
    const ringkasTindak      = tindak || tplTindak || U.fillTemplate(N.tindak_lanjut || '', v) || '-';
    const ringkasRekom       = rekom  || tplRekom  || U.fillTemplate(N.rekomendasi || '', v) || '-';

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
        <p style="text-align:justify;">${U.nl2br(ringkasTindak)}</p>

        <h4>${(kendala || solusi) ? 'F' : 'E'}. Rekomendasi</h4>
        <p style="text-align:justify;">${U.nl2br(ringkasRekom)}</p>

        <div style="display:flex;justify-content:flex-end;margin-top:24px;">
          <div style="width:50%;text-align:center;padding-right:6%;">
            <div>${keg && keg.tanggal ? U.escapeHtml((i.pegawai.kabupaten || 'Jember') + ', ' + U.fmtTanggal(keg.tanggal)) : tanggalKota(i)}</div>
            <div>Pengawas Madrasah,</div>
            <div style="height:auto;min-height:70px;display:flex;align-items:center;justify-content:center;">${i.tanda_tangan ? `<img class="signature-img" src="${i.tanda_tangan}" />` : ''}</div>
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

        <div style="display:flex;justify-content:flex-end;margin-top:30px;">
          <div style="width:50%;text-align:center;padding-right:6%;">
            <div>${tanggalKota(i)}</div>
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
        <div style="display:flex;justify-content:flex-end;margin-top:24px;">
          <div style="width:50%;text-align:center;padding-right:6%;">
            <div>Pengawas Madrasah,</div>
            <div style="height:auto;min-height:70px;display:flex;align-items:center;justify-content:center;">${i.tanda_tangan ? `<img class="signature-img" src="${i.tanda_tangan}" />` : ''}</div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function genDaftarHadir(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    // Build rows from GTK data or Kepala Madrasah
    let gtkRows = [];
    const allMadrasah = Store.get('madrasah', []) || [];
    if (keg && keg.madrasah_id === 'semua') {
      // Semua Madrasah — isi dengan Kepala Madrasah
      allMadrasah.forEach(mad => {
        if (mad.kepala_madrasah) {
          gtkRows.push({ nama: mad.kepala_madrasah, nip_nuptk: mad.nip_kepala || '', asal: mad.nama_madrasah, jabatan: 'Kepala Madrasah' });
        }
      });
    } else if (keg && keg.madrasah_id) {
      // Specific madrasah — isi dengan GTK
      const mad = allMadrasah.find(x => x.id === keg.madrasah_id);
      if (mad && mad.gtk && mad.gtk.length) {
        gtkRows = mad.gtk.map(g => ({ nama: g.nama, nip_nuptk: g.nip_nuptk || '', asal: mad.nama_madrasah, jabatan: g.jabatan || '' }));
      }
    } else if (keg && keg.rhk_id) {
      // Fallback: semua GTK dari semua madrasah
      allMadrasah.forEach(mad => {
        if (mad.gtk && mad.gtk.length) {
          mad.gtk.forEach(g => {
            gtkRows.push({ nama: g.nama, nip_nuptk: g.nip_nuptk || '', asal: mad.nama_madrasah, jabatan: g.jabatan || '' });
          });
        }
      });
    }
    // Generate table rows: GTK data + 5 empty rows
    const emptyCount = gtkRows.length > 0 ? 5 : 15;
    const dataRowsHtml = gtkRows.map((g, idx) => `<tr><td>${idx+1}</td><td>${U.escapeHtml(g.nama)}</td><td>${U.escapeHtml(g.nip_nuptk)}</td><td>${U.escapeHtml(g.asal)}</td><td>${U.escapeHtml(g.jabatan)}</td><td></td></tr>`).join('');
    const emptyRowsHtml = Array.from({ length: emptyCount }).map((_, k) => `<tr><td>${gtkRows.length + k + 1}</td><td></td><td></td><td></td><td></td><td></td></tr>`).join('');
    const rows = dataRowsHtml + emptyRowsHtml;
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
        <div style="display:flex;justify-content:flex-end;margin-top:24px;">
          <div style="width:50%;text-align:center;padding-right:6%;">
            <div>Mengetahui,</div>
            <div>Pengawas Madrasah,</div>
            <div style="height:auto;min-height:70px;display:flex;align-items:center;justify-content:center;">${i.tanda_tangan ? `<img class="signature-img" src="${i.tanda_tangan}" />` : ''}</div>
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
            <div style="height:auto;min-height:70px;display:flex;align-items:center;justify-content:center;">${i.tanda_tangan ? `<img class="signature-img" src="${i.tanda_tangan}" />` : ''}</div>
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
            <div>Pengawas Madrasah,</div>
            <div style="height:auto;min-height:70px;display:flex;align-items:center;justify-content:center;">${i.tanda_tangan ? `<img class="signature-img" src="${i.tanda_tangan}" />` : ''}</div>
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
        <div style="display:flex;justify-content:flex-end;margin-top:24px;">
          <div style="width:50%;text-align:center;padding-right:6%;">
            <div>Pengawas Madrasah,</div>
            <div style="height:auto;min-height:70px;display:flex;align-items:center;justify-content:center;">${i.tanda_tangan ? `<img class="signature-img" src="${i.tanda_tangan}" />` : ''}</div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function genRekap(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    const hasKeg = !!keg;
    const hasHasil = hasKeg && String(keg.hasil || '').trim();
    const tglPelaksana = (hasKeg && keg.tanggal) ? U.fmtTanggal(keg.tanggal) : '';

    // Auto-derive isi kolom dari data kegiatan + target RHK.
    const capaianKuantitas = hasHasil ? (rhk.target_kuantitas || 'Tercapai sesuai target') : '-';
    const capaianWaktu     = tglPelaksana || (rhk.target_waktu || '-');
    const persenKuantitas  = hasHasil ? '100%' : '-';
    const persenWaktu      = tglPelaksana ? '100%' : '-';
    const catatanKuantitas = hasKeg
      ? (String(keg.kendala || '').trim() ? U.escapeHtml(keg.kendala) : 'Sesuai target')
      : 'Belum ada kegiatan terkait';
    const catatanWaktu     = hasKeg ? 'Dilaksanakan sesuai jadwal' : 'Belum ada kegiatan terkait';

    // Catatan Hasil: prioritas keg.hasil > keg.uraian > narasi default kegiatan terlaksana.
    const catatanHasil = hasHasil
      ? keg.hasil
      : (hasKeg && String(keg.uraian || '').trim()
          ? keg.uraian
          : 'Hasil pelaksanaan akan diperbarui setelah kegiatan dilaksanakan dan dilaporkan oleh Pengawas Madrasah.');

    return `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;">REKAP HASIL KEGIATAN</h3>
        <p>Kegiatan: <strong>${U.escapeHtml(keg ? keg.nama_kegiatan : rhk.nama_eviden)}</strong> (RHK ${U.escapeHtml(rhk.id)})</p>
        <table class="fmt" style="width:100%">
          <thead><tr><th>Aspek</th><th>Indikator</th><th>Target</th><th>Capaian</th><th>%</th><th>Catatan</th></tr></thead>
          <tbody>
            <tr><td>Kuantitas</td><td>${U.escapeHtml(rhk.indikator_kuantitas || '')}</td><td>${U.escapeHtml(rhk.target_kuantitas || '')}</td><td>${U.escapeHtml(capaianKuantitas)}</td><td>${U.escapeHtml(persenKuantitas)}</td><td>${catatanKuantitas}</td></tr>
            <tr><td>Waktu</td><td>${U.escapeHtml(rhk.indikator_waktu || '')}</td><td>${U.escapeHtml(rhk.target_waktu || '')}</td><td>${U.escapeHtml(capaianWaktu)}</td><td>${U.escapeHtml(persenWaktu)}</td><td>${U.escapeHtml(catatanWaktu)}</td></tr>
          </tbody>
        </table>
        <h4 class="mt-3">Catatan Hasil</h4>
        <p style="text-align:justify;">${U.nl2br(catatanHasil)}</p>
        <div style="display:flex;justify-content:flex-end;margin-top:24px;">
          <div style="width:50%;text-align:center;padding-right:6%;">
            <div>Pengawas Madrasah,</div>
            <div style="height:auto;min-height:70px;display:flex;align-items:center;justify-content:center;">${i.tanda_tangan ? `<img class="signature-img" src="${i.tanda_tangan}" />` : ''}</div>
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
    const hasKeg = !!keg;

    // Faktor pendukung: ada default umum, bisa dilengkapi dari kegiatan kalau ada.
    const pendukungHtml = '- Dukungan Kepala Madrasah dan dewan guru<br />- Ketersediaan dokumen pendukung<br />- Komitmen pemangku kepentingan';

    // Faktor penghambat: prioritas keg.kendala > narasi.permasalahan > placeholder informatif.
    const penghambatRaw = (hasKeg && String(keg.kendala || '').trim())
      ? keg.kendala
      : U.fillTemplate(N.permasalahan || '', v).trim();
    const penghambatHtml = penghambatRaw
      ? U.nl2br(penghambatRaw)
      : 'Kendala teknis dan administratif yang muncul selama pelaksanaan akan diidentifikasi dan didokumentasikan oleh Pengawas Madrasah pada saat kegiatan dilaksanakan.';

    // Strategi tindak lanjut: prioritas keg.tindak_lanjut > keg.solusi > narasi.tindak_lanjut+solusi > placeholder.
    let tindakLanjutRaw = '';
    if (hasKeg && String(keg.tindak_lanjut || '').trim()) tindakLanjutRaw = keg.tindak_lanjut;
    else if (hasKeg && String(keg.solusi || '').trim()) tindakLanjutRaw = keg.solusi;
    else {
      const tl = U.fillTemplate(N.tindak_lanjut || '', v).trim();
      const sol = U.fillTemplate(N.solusi || '', v).trim();
      tindakLanjutRaw = [tl, sol].filter(Boolean).join('\n');
    }
    const tindakLanjutHtml = tindakLanjutRaw
      ? U.nl2br(tindakLanjutRaw)
      : 'Pengawas Madrasah akan menyusun rencana tindak lanjut berdasarkan hasil analisis di atas, meliputi pendampingan klinis, peningkatan kapasitas, serta monitoring berkelanjutan terhadap madrasah binaan.';

    return `
      <div class="doc-page">
        ${header(i)}
        <h3 style="text-align:center;text-decoration:underline;margin-bottom:24px;">ANALISIS HASIL KEGIATAN</h3>
        <p style="margin-top:24px;">Kegiatan: <strong>${U.escapeHtml(keg ? keg.nama_kegiatan : rhk.nama_eviden)}</strong></p>
        <p style="text-align:justify;">${U.nl2br(U.fillTemplate(N.analisis, v))}</p>
        <h4>Faktor Pendukung</h4>
        <p style="text-align:justify;">${pendukungHtml}</p>
        <h4>Faktor Penghambat</h4>
        <p style="text-align:justify;">${penghambatHtml}</p>
        <h4>Strategi Tindak Lanjut</h4>
        <p style="text-align:justify;">${tindakLanjutHtml}</p>
        <div style="display:flex;justify-content:flex-end;margin-top:24px;">
          <div style="width:50%;text-align:center;padding-right:6%;">
            <div>${keg && keg.tanggal ? U.escapeHtml((i.pegawai.kabupaten || 'Jember') + ', ' + U.fmtTanggal(keg.tanggal)) : tanggalKota(i)}</div>
            <div>Pengawas Madrasah,</div>
            <div style="height:auto;min-height:70px;display:flex;align-items:center;justify-content:center;">${i.tanda_tangan ? `<img class="signature-img" src="${i.tanda_tangan}" />` : ''}</div>
            <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(i.pegawai.nama)}</div>
            <div>NIP. ${U.escapeHtml(i.pegawai.nip)}</div>
          </div>
        </div>
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
        <h3 style="text-align:center;text-decoration:underline;margin-top:24px;margin-bottom:24px;">REKOMENDASI TINDAK LANJUT</h3>
        <p style="text-align:justify;margin-top:24px;">Berdasarkan hasil pelaksanaan ${U.escapeHtml(rhk.nama_eviden)}, ${rhk.triwulan === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + rhk.triwulan + ' Tahun 2026'}, kami menyampaikan rekomendasi sebagai berikut:</p>
        <p style="text-align:justify;white-space:pre-wrap;">${U.escapeHtml(U.fillTemplate(N.rekomendasi, v))}</p>
        <div style="display:flex;justify-content:flex-end;margin-top:24px;">
          <div style="width:50%;text-align:center;padding-right:6%;">
            <div>${keg && keg.tanggal ? U.escapeHtml((i.pegawai.kabupaten || 'Jember') + ', ' + U.fmtTanggal(keg.tanggal)) : tanggalKota(i)}</div>
            <div>Pengawas Madrasah,</div>
            <div style="height:auto;min-height:70px;display:flex;align-items:center;justify-content:center;">${i.tanda_tangan ? `<img class="signature-img" src="${i.tanda_tangan}" />` : ''}</div>
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

  // ===== Surat Keterangan dari Lembaga Binaan =====
  // Madrasah binaan menerangkan bahwa Pengawas telah melaksanakan pendampingan/pengawasan.
  // Ditandatangani oleh Kepala Madrasah binaan (data diambil dari menu Madrasah Binaan, default ke madrasah pertama).
  function genSuratKeteranganMadrasah(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    const madrasahList = (Store && typeof Store.get === 'function') ? (Store.get('madrasah', []) || []) : [];
    // Cari madrasah dari kegiatan: prioritas madrasah_id, lalu match nama dari tempat, lalu item pertama.
    let mad = null;
    if (keg && keg.madrasah_id && keg.madrasah_id !== 'semua') {
      mad = madrasahList.find(m => m && m.id === keg.madrasah_id);
    }
    if (!mad && keg && keg.tempat) {
      const tempat = String(keg.tempat).toLowerCase();
      mad = madrasahList.find(m => m && m.nama_madrasah && tempat.includes(String(m.nama_madrasah).toLowerCase()));
    }
    if (!mad) mad = madrasahList[0] || null;

    const namaMad     = mad ? (mad.nama_madrasah || '-') : '(Madrasah Binaan)';
    const alamatMad   = mad ? (mad.alamat || '-') : '-';
    const kecamatanMad = mad ? (mad.kecamatan || '') : '';
    const teleponMad  = mad ? (mad.no_hp || mad.email || '') : '';
    const npsnMad     = mad ? (mad.npsn || '') : '';
    const nsmMad      = mad ? (mad.nsm || '') : '';
    const namaKamad   = mad ? (mad.kepala_madrasah || '(Nama Kepala Madrasah)') : '(Nama Kepala Madrasah)';
    const nipKamad    = mad ? (mad.nip_kepala || '-') : '-';
    const jabatanKamad = 'Kepala ' + (mad ? (mad.nama_madrasah || 'Madrasah Binaan') : 'Madrasah Binaan');
    const kotaSurat   = (mad && mad.kecamatan) ? mad.kecamatan : (i.pegawai.kabupaten || 'Jember');

    const tanggalKegiatan = (keg && keg.tanggal) ? U.fmtTanggal(keg.tanggal) : '............';
    const namaKegiatan = keg ? (keg.nama_kegiatan || rhk.nama_eviden) : rhk.nama_eviden;
    const sasaranKeg = keg ? (keg.sasaran || keg.peserta || '') : '';
    const sasaran = sasaranKeg || 'Kepala Madrasah, guru, dan tenaga kependidikan';
    const periode = rhk.triwulan === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + rhk.triwulan + ' Tahun 2026';
    const tanggalSurat = (keg && keg.tanggal) ? U.fmtTanggal(keg.tanggal) : U.fmtTanggal(new Date());
    const kodeMad = npsnMad || (mad ? (String(mad.nama_madrasah || '').replace(/\s+/g, '').slice(0, 5).toUpperCase() || 'MAD') : 'MAD');
    const nomorSurat = (keg && keg.no_surat_keterangan) ? keg.no_surat_keterangan : `....../SK/${kodeMad}/${new Date().getFullYear()}`;
    const kontakLine = [npsnMad ? 'NPSN: ' + npsnMad : '', nsmMad ? 'NSM: ' + nsmMad : '', teleponMad ? 'Telp/HP: ' + teleponMad : ''].filter(Boolean).join(' — ');

    return `
      <div class="doc-page">
        <table style="width:100%;border-collapse:collapse;border-bottom:3px double #000;margin-bottom:14pt;padding-bottom:6pt;">
          <tr>
            <td style="border:none;text-align:center;vertical-align:middle;">
              <div style="font-size:13pt;font-weight:700;">${U.escapeHtml(String(namaMad).toUpperCase())}</div>
              <div style="font-size:11pt;">${U.escapeHtml(alamatMad)}${kecamatanMad ? ', Kec. ' + U.escapeHtml(kecamatanMad) : ''}</div>
              ${kontakLine ? `<div style="font-size:11pt;">${U.escapeHtml(kontakLine)}</div>` : ''}
            </td>
          </tr>
        </table>

        <h3 style="text-align:center;text-decoration:underline;margin:18pt 0 6pt;">SURAT KETERANGAN</h3>
        <p style="text-align:center;margin:0 0 18pt;">Nomor: ${U.escapeHtml(nomorSurat)}</p>

        <p style="text-align:justify;">Yang bertanda tangan di bawah ini, Kepala ${U.escapeHtml(namaMad)}, dengan ini menerangkan bahwa:</p>

        <table style="margin-left:18pt;margin-bottom:8pt;">
          <tr><td style="padding:2pt 8pt;border:none;width:120pt;">Nama</td><td style="padding:2pt 8pt;border:none;">:</td><td style="padding:2pt 8pt;border:none;"><strong>${U.escapeHtml(i.pegawai.nama)}</strong></td></tr>
          <tr><td style="padding:2pt 8pt;border:none;">NIP</td><td style="padding:2pt 8pt;border:none;">:</td><td style="padding:2pt 8pt;border:none;">${U.escapeHtml(i.pegawai.nip)}</td></tr>
          <tr><td style="padding:2pt 8pt;border:none;">Pangkat/Gol.</td><td style="padding:2pt 8pt;border:none;">:</td><td style="padding:2pt 8pt;border:none;">${U.escapeHtml(i.pegawai.pangkat_golongan || '-')}</td></tr>
          <tr><td style="padding:2pt 8pt;border:none;">Jabatan</td><td style="padding:2pt 8pt;border:none;">:</td><td style="padding:2pt 8pt;border:none;">${U.escapeHtml(i.pegawai.jabatan)}</td></tr>
          <tr><td style="padding:2pt 8pt;border:none;">Unit Kerja</td><td style="padding:2pt 8pt;border:none;">:</td><td style="padding:2pt 8pt;border:none;">${U.escapeHtml(i.pegawai.unit_kerja)}</td></tr>
        </table>

        <p style="text-align:justify;">Telah benar-benar melaksanakan kegiatan <strong>${U.escapeHtml(namaKegiatan)}</strong> pada ${U.escapeHtml(namaMad)} dengan rincian sebagai berikut:</p>

        <table style="margin-left:18pt;margin-bottom:8pt;">
          <tr><td style="padding:2pt 8pt;border:none;width:120pt;">Hari/Tanggal</td><td style="padding:2pt 8pt;border:none;">:</td><td style="padding:2pt 8pt;border:none;">${U.escapeHtml(tanggalKegiatan)}</td></tr>
          <tr><td style="padding:2pt 8pt;border:none;">Tempat</td><td style="padding:2pt 8pt;border:none;">:</td><td style="padding:2pt 8pt;border:none;">${U.escapeHtml(keg ? (keg.tempat || namaMad) : namaMad)}</td></tr>
          <tr><td style="padding:2pt 8pt;border:none;">Sasaran/Peserta</td><td style="padding:2pt 8pt;border:none;">:</td><td style="padding:2pt 8pt;border:none;">${U.escapeHtml(sasaran)}</td></tr>
          <tr><td style="padding:2pt 8pt;border:none;">Periode</td><td style="padding:2pt 8pt;border:none;">:</td><td style="padding:2pt 8pt;border:none;">${U.escapeHtml(periode)}</td></tr>
          <tr><td style="padding:2pt 8pt;border:none;vertical-align:top;">RHK Terkait</td><td style="padding:2pt 8pt;border:none;vertical-align:top;">:</td><td style="padding:2pt 8pt;border:none;">${U.escapeHtml(rhk.id)} — ${U.escapeHtml(rhk.nama_eviden)}</td></tr>
        </table>

        <p style="text-align:justify;">Kegiatan tersebut dilaksanakan dalam rangka pendampingan/pengawasan akademik dan manajerial sebagai bagian dari pelaksanaan tugas pokok Pengawas Madrasah pada satuan pendidikan binaan kami. Pengawas yang bersangkutan telah melaksanakan tugasnya dengan baik, profesional, dan bertanggung jawab.</p>

        <p style="text-align:justify;">Demikian surat keterangan ini dibuat untuk dipergunakan sebagaimana mestinya.</p>

        <table style="width:100%;border-collapse:collapse;margin-top:18pt;">
          <tr>
            <td style="width:50%;border:none;"></td>
            <td style="width:50%;border:none;text-align:center;vertical-align:top;">
              <div>${U.escapeHtml(kotaSurat)}, ${U.escapeHtml(tanggalSurat)}</div>
              <div>${U.escapeHtml(jabatanKamad)},</div>
              <div style="height:80px;"></div>
              <div style="text-decoration:underline;font-weight:700;">${U.escapeHtml(namaKamad)}</div>
              <div>NIP. ${U.escapeHtml(nipKamad)}</div>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  // ===== Program Pendampingan Tahunan (Program Kerja Pengawas) — khusus RHK-1 =====
  function genProgramPendampingan(rhk, keg, idn) {
    const i = idn || Page.Identitas.get();
    const tahun = new Date().getFullYear();
    const madrasahList = (Store && typeof Store.get === 'function') ? (Store.get('madrasah', []) || []) : [];
    const kegiatan = (Store && typeof Store.get === 'function') ? (Store.get('kegiatan', []) || []) : [];
    const allRhk = (Page && Page.MasterRHK && Page.MasterRHK.get) ? Page.MasterRHK.get() : [rhk];

    // Cover (TANPA kop kemenag)
    const pCover = `
      <div class="doc-page doc-cover">
        <div class="cover-title">PROGRAM PENDAMPINGAN TAHUNAN</div>
        <div class="cover-sub">PENGAWAS MADRASAH<br/>TAHUN ${tahun}</div>
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
          <div>TAHUN ${tahun}</div>
        </div>
      </div>`;

    // Pengesahan
    const pPengesahan = `
      <div class="doc-page">
        <h2 style="text-align:center;text-decoration:underline;">LEMBAR PENGESAHAN</h2>
        <p style="text-align:justify;">Yang bertanda tangan di bawah ini, mengesahkan dokumen <strong>Program Pendampingan Tahunan ${tahun}</strong> yang disusun oleh:</p>
        <table class="fmt" style="width:90%;margin:8px auto;">
          <tr><td style="width:30%">Nama</td><td>${U.escapeHtml(i.pegawai.nama)}</td></tr>
          <tr><td>NIP</td><td>${U.escapeHtml(i.pegawai.nip)}</td></tr>
          <tr><td>Pangkat/Gol</td><td>${U.escapeHtml(i.pegawai.pangkat_golongan)}</td></tr>
          <tr><td>Jabatan</td><td>${U.escapeHtml(i.pegawai.jabatan)}</td></tr>
          <tr><td>Unit Kerja</td><td>${U.escapeHtml(i.pegawai.unit_kerja)}</td></tr>
        </table>
        <p style="text-align:justify;">Dokumen ini menjadi acuan pelaksanaan tugas pokok dan fungsi Pengawas Madrasah pada ${U.escapeHtml(i.pegawai.unit_kerja)} Tahun ${tahun}, sebagai bagian dari Sasaran Kinerja Pegawai (SKP) sesuai Perdirjen GTK Nomor 7328 Tahun 2023.</p>
        ${ttdBlokStandar(i)}
      </div>`;

    // Kata Pengantar
    const pKata = `
      <div class="doc-page">
        <h2 style="text-align:center;text-decoration:underline;">KATA PENGANTAR</h2>
        <p style="text-align:justify;">Puji syukur kami panjatkan kehadirat Allah SWT atas limpahan rahmat dan karunia-Nya, sehingga penyusunan <strong>Program Pendampingan Tahunan Pengawas Madrasah Tahun ${tahun}</strong> dapat diselesaikan. Shalawat dan salam senantiasa tercurah kepada Nabi Muhammad SAW.</p>
        <p style="text-align:justify;">Program Pendampingan Tahunan ini disusun sebagai pedoman pelaksanaan tugas Pengawas Madrasah dalam melakukan supervisi akademik dan manajerial pada madrasah binaan selama satu tahun pelajaran. Program ini memuat rencana kegiatan, jadwal pelaksanaan, sasaran, indikator keberhasilan, dan strategi pendampingan yang berorientasi pada peningkatan mutu layanan pendidikan berbasis Kurikulum Berbasis Cinta dan kompetensi peserta didik.</p>
        <p style="text-align:justify;">Kami mengucapkan terima kasih kepada Kepala ${U.escapeHtml(i.pejabat_penilai.unit_kerja)}, Ketua Pokjawas, Kepala Madrasah, dewan guru, dan seluruh pemangku kepentingan yang telah memberikan dukungan dalam penyusunan program ini.</p>
        <p style="text-align:justify;">Kami menyadari masih terdapat kekurangan dalam penyusunan program ini, sehingga masukan dan saran yang konstruktif sangat kami harapkan demi penyempurnaan di masa mendatang.</p>
        ${ttdBlokPenutup(i)}
      </div>`;

    // Daftar Isi
    const items = [
      ['HALAMAN JUDUL', 'i'],
      ['LEMBAR PENGESAHAN', 'ii'],
      ['KATA PENGANTAR', 'iii'],
      ['DAFTAR ISI', 'iv'],
      ['BAB I PENDAHULUAN', '1'],
      ['  A. Latar Belakang', '1'],
      ['  B. Dasar Hukum', '2'],
      ['  C. Tujuan', '3'],
      ['  D. Sasaran Pendampingan', '3'],
      ['  E. Ruang Lingkup', '4'],
      ['BAB II ANALISIS KEBUTUHAN MADRASAH BINAAN', '5'],
      ['  A. Profil Madrasah Binaan', '5'],
      ['  B. Pemetaan Mutu', '7'],
      ['  C. Identifikasi Kebutuhan', '8'],
      ['BAB III PROGRAM PENDAMPINGAN TAHUNAN', '9'],
      ['  A. Visi & Misi Pendampingan', '9'],
      ['  B. Strategi Pendampingan', '10'],
      ['  C. Matriks Program per Triwulan', '12'],
      ['BAB IV JADWAL & STRATEGI PENDAMPINGAN', '15'],
      ['  A. Jadwal Pelaksanaan', '15'],
      ['  B. Metode & Pendekatan', '17'],
      ['  C. Indikator Keberhasilan', '18'],
      ['BAB V PENUTUP', '19'],
      ['LAMPIRAN', '20'],
      ['  - SK Pembagian Tugas', '20'],
      ['  - Matriks Program', '21'],
      ['  - Surat Pengesahan Pengawas', '22'],
    ];
    const pDaftarIsi = `
      <div class="doc-page">
        <h2 style="text-align:center;text-decoration:underline;">DAFTAR ISI</h2>
        <table style="width:100%;border-collapse:collapse;">
          ${items.map(([t, p]) => `<tr><td style="padding:4px 0;border-bottom:1px dotted #888;">${U.escapeHtml(t)}</td><td style="padding:4px 0;text-align:right;border-bottom:1px dotted #888;">${p}</td></tr>`).join('')}
        </table>
      </div>`;

    // BAB I Pendahuluan
    const pBab1 = `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB I<br/>PENDAHULUAN</h2>
        <h3>A. Latar Belakang</h3>
        <p style="text-align:justify;">Pengawas Madrasah merupakan tenaga kependidikan yang memiliki tugas pokok melaksanakan supervisi akademik dan manajerial pada satuan pendidikan madrasah. Sesuai Perdirjen GTK Nomor 7328 Tahun 2023, Pengawas Madrasah dituntut menyusun Program Pendampingan Tahunan sebagai acuan pelaksanaan tugas selama satu tahun anggaran.</p>
        <p style="text-align:justify;">Pendampingan oleh Pengawas Madrasah berfokus pada peningkatan mutu pendidikan berbasis cinta kemanusiaan, pelestarian lingkungan, dan pengembangan kompetensi peserta didik melalui implementasi Kurikulum Berbasis Cinta. Program ini disusun untuk memastikan setiap madrasah binaan memperoleh pendampingan yang sistematis, terukur, dan berkelanjutan.</p>
        <p style="text-align:justify;">Sebagai bentuk akuntabilitas pelaksanaan tugas, dokumen ini menjadi pedoman bagi pengawas dalam menyelenggarakan kegiatan supervisi, evaluasi, dan tindak lanjut pada ${madrasahList.length} madrasah binaan di wilayah ${U.escapeHtml(i.pegawai.kabupaten || 'Jember')}.</p>

        <h3>B. Dasar Hukum</h3>
        <ol style="text-align:justify;">
          <li>Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;</li>
          <li>Peraturan Menteri PAN-RB Nomor 6 Tahun 2022 tentang Pengelolaan Kinerja Pegawai ASN;</li>
          <li>Peraturan Direktur Jenderal Pendidikan Islam (Perdirjen GTK) Nomor 7328 Tahun 2023 tentang Petunjuk Teknis Pengelolaan Kinerja Pengawas Madrasah;</li>
          <li>Peraturan BKN Nomor 2 Tahun 2026 tentang Layanan e-Kinerja Badan Kepegawaian Negara.</li>
        </ol>

        <h3>C. Tujuan</h3>
        <ol style="text-align:justify;">
          <li>Memberikan pedoman pelaksanaan tugas Pengawas Madrasah selama tahun ${tahun};</li>
          <li>Memastikan pendampingan berjalan sistematis, terukur, dan berkelanjutan pada seluruh madrasah binaan;</li>
          <li>Meningkatkan mutu pengelolaan madrasah dan layanan pembelajaran berbasis Kurikulum Berbasis Cinta;</li>
          <li>Mewujudkan akuntabilitas pelaksanaan kinerja sebagai bagian dari SKP Pengawas Madrasah.</li>
        </ol>

        <h3>D. Sasaran Pendampingan</h3>
        <p style="text-align:justify;">Program Pendampingan Tahunan ini ditujukan kepada seluruh madrasah binaan di wilayah ${U.escapeHtml(i.pegawai.kabupaten || 'Jember')} dengan rincian sebagai berikut:</p>
        ${madrasahList.length ? `<table class="fmt" style="width:100%;">
          <thead><tr style="background:#f0f0f0;"><th>No</th><th>Nama Madrasah</th><th>Jenjang</th><th>Alamat</th></tr></thead>
          <tbody>${madrasahList.map((m, idx) => `<tr><td style="text-align:center;width:40px;">${idx+1}</td><td>${U.escapeHtml(m.nama_madrasah || '-')}</td><td style="text-align:center;width:80px;">${U.escapeHtml(m.jenjang || '-')}</td><td>${U.escapeHtml(m.alamat || '-')}</td></tr>`).join('')}</tbody>
        </table>` : `<p><em>Daftar madrasah binaan belum diisi. Silakan tambahkan pada menu "Madrasah Binaan".</em></p>`}

        <h3>E. Ruang Lingkup</h3>
        <p style="text-align:justify;">Ruang lingkup pendampingan meliputi:</p>
        <ol style="text-align:justify;">
          <li><strong>Supervisi Akademik:</strong> pendampingan implementasi kurikulum, perangkat pembelajaran, evaluasi pembelajaran, dan peningkatan kompetensi profesional guru;</li>
          <li><strong>Supervisi Manajerial:</strong> pendampingan tata kelola madrasah, manajemen mutu, kepemimpinan kepala madrasah, dan pelayanan publik;</li>
          <li><strong>Pembinaan Karakter:</strong> penguatan profil pelajar Pancasila Rahmatan lil 'Alamin (P3RA), karakter siswa, dan pendidikan inklusif;</li>
          <li><strong>Penilaian Kinerja:</strong> Penilaian Kinerja Guru (PKG) dan Penilaian Kinerja Kepala Madrasah (PKKM);</li>
          <li><strong>Tindak Lanjut:</strong> rekomendasi perbaikan, monitoring, evaluasi, dan pelaporan.</li>
        </ol>
      </div>`;

    // BAB II Analisis Kebutuhan
    const pBab2 = `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB II<br/>ANALISIS KEBUTUHAN MADRASAH BINAAN</h2>
        <h3>A. Profil Madrasah Binaan</h3>
        <p style="text-align:justify;">Berdasarkan SK Pembagian Tugas Pengawas Tahun ${tahun}, ${U.escapeHtml(i.pegawai.nama)} ditugaskan untuk melakukan pendampingan pada ${madrasahList.length} madrasah binaan dengan komposisi sebagai berikut:</p>
        ${(() => {
          const stats = { MI: 0, MTs: 0, MA: 0, MAK: 0, RA: 0 };
          madrasahList.forEach(m => { const j = (m.jenjang||'').toUpperCase(); if (stats[j] !== undefined) stats[j]++; });
          return `<table class="fmt" style="width:60%;margin:8px auto;">
            <thead><tr style="background:#f0f0f0;"><th>Jenjang</th><th>Jumlah</th></tr></thead>
            <tbody>
              ${Object.entries(stats).filter(([_, n]) => n > 0).map(([j, n]) => `<tr><td>${j}</td><td style="text-align:center;">${n}</td></tr>`).join('') || '<tr><td colspan="2" style="text-align:center;color:#888;">Belum ada data</td></tr>'}
              <tr style="background:#f8f9fc;font-weight:700;"><td>TOTAL</td><td style="text-align:center;">${madrasahList.length}</td></tr>
            </tbody>
          </table>`;
        })()}

        <h3>B. Pemetaan Mutu</h3>
        <p style="text-align:justify;">Pemetaan mutu madrasah binaan dilakukan berdasarkan delapan Standar Nasional Pendidikan (SNP) dan hasil evaluasi diri madrasah (EDM) tahun sebelumnya. Aspek yang menjadi prioritas pendampingan meliputi:</p>
        <ol style="text-align:justify;">
          <li>Standar Isi (kurikulum dan perangkat pembelajaran)</li>
          <li>Standar Proses (perencanaan, pelaksanaan, dan penilaian pembelajaran)</li>
          <li>Standar Kompetensi Lulusan (capaian peserta didik)</li>
          <li>Standar Pendidik dan Tenaga Kependidikan</li>
          <li>Standar Sarana dan Prasarana</li>
          <li>Standar Pengelolaan</li>
          <li>Standar Pembiayaan</li>
          <li>Standar Penilaian Pendidikan</li>
        </ol>

        <h3>C. Identifikasi Kebutuhan</h3>
        <p style="text-align:justify;">Berdasarkan pemetaan mutu, identifikasi kebutuhan pendampingan tahun ${tahun} difokuskan pada:</p>
        <ol style="text-align:justify;">
          <li><strong>Implementasi Kurikulum Berbasis Cinta</strong> di seluruh madrasah binaan;</li>
          <li><strong>Penguatan literasi dan numerasi</strong> sebagai prioritas nasional;</li>
          <li><strong>Penguatan karakter</strong> melalui Profil Pelajar Pancasila Rahmatan lil 'Alamin (P3RA);</li>
          <li><strong>Akreditasi madrasah</strong> bagi madrasah yang akan re-akreditasi;</li>
          <li><strong>Peningkatan profesionalisme guru</strong> melalui kegiatan PKB (Pengembangan Keprofesian Berkelanjutan);</li>
          <li><strong>Penguatan tata kelola madrasah</strong> dan kepemimpinan Kepala Madrasah;</li>
          <li><strong>Penyusunan instrumen evaluasi kebijakan</strong> Kemenag.</li>
        </ol>
      </div>`;

    // BAB III Program Pendampingan
    const tw1 = allRhk.filter(r => r.triwulan === 'I');
    const tw2 = allRhk.filter(r => r.triwulan === 'II');
    const tw3 = allRhk.filter(r => r.triwulan === 'III');
    const tw4 = allRhk.filter(r => r.triwulan === 'IV');
    const twRow = (arr) => arr.map((r, idx) => `<tr><td style="text-align:center;width:40px;">${idx+1}</td><td>${U.escapeHtml(r.id)}</td><td>${U.escapeHtml(r.nama_eviden || r.rencana_hasil_kerja || '-')}</td><td style="width:120px;">${U.escapeHtml(r.target_waktu || '-')}</td></tr>`).join('') || '<tr><td colspan="4" style="text-align:center;color:#888;">Belum ada</td></tr>';

    const pBab3 = `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB III<br/>PROGRAM PENDAMPINGAN TAHUNAN</h2>
        <h3>A. Visi & Misi Pendampingan</h3>
        <p style="text-align:justify;"><strong>Visi:</strong> Terwujudnya madrasah binaan yang unggul, inklusif, dan berkarakter Rahmatan lil 'Alamin melalui pendampingan profesional yang sistematis dan berkelanjutan.</p>
        <p style="text-align:justify;"><strong>Misi:</strong></p>
        <ol style="text-align:justify;">
          <li>Melaksanakan supervisi akademik yang berfokus pada peningkatan kualitas pembelajaran;</li>
          <li>Melaksanakan supervisi manajerial untuk penguatan tata kelola madrasah;</li>
          <li>Mendampingi implementasi Kurikulum Berbasis Cinta;</li>
          <li>Memberikan bimbingan teknis berkelanjutan kepada Kepala Madrasah, guru, dan tendik;</li>
          <li>Melakukan evaluasi dan tindak lanjut hasil pendampingan secara periodik.</li>
        </ol>

        <h3>B. Strategi Pendampingan</h3>
        <ol style="text-align:justify;">
          <li><strong>Pendekatan kolaboratif</strong> — melibatkan Kepala Madrasah, guru, dan komite madrasah;</li>
          <li><strong>Pendekatan klinis</strong> — supervisi yang berfokus pada perbaikan praktik pembelajaran melalui observasi & feedback;</li>
          <li><strong>Pendekatan reflektif</strong> — mendorong guru dan kepala madrasah melakukan refleksi diri atas praktik kerja;</li>
          <li><strong>Pendekatan terbuka</strong> — berbasis dialog dan saling belajar (peer-coaching);</li>
          <li><strong>Pemanfaatan teknologi</strong> — supervisi blended (luring + daring) dengan dokumentasi digital.</li>
        </ol>

        <h3>C. Matriks Program per Triwulan</h3>
        <h4 style="margin-top:10px;">Triwulan I</h4>
        <table class="fmt" style="width:100%;font-size:11pt;"><thead><tr style="background:#f0f0f0;"><th>No</th><th>Kode RHK</th><th>Program/Kegiatan</th><th>Durasi</th></tr></thead><tbody>${twRow(tw1)}</tbody></table>
        <h4 style="margin-top:10px;">Triwulan II</h4>
        <table class="fmt" style="width:100%;font-size:11pt;"><thead><tr style="background:#f0f0f0;"><th>No</th><th>Kode RHK</th><th>Program/Kegiatan</th><th>Durasi</th></tr></thead><tbody>${twRow(tw2)}</tbody></table>
        <h4 style="margin-top:10px;">Triwulan III</h4>
        <table class="fmt" style="width:100%;font-size:11pt;"><thead><tr style="background:#f0f0f0;"><th>No</th><th>Kode RHK</th><th>Program/Kegiatan</th><th>Durasi</th></tr></thead><tbody>${twRow(tw3)}</tbody></table>
        <h4 style="margin-top:10px;">Triwulan IV</h4>
        <table class="fmt" style="width:100%;font-size:11pt;"><thead><tr style="background:#f0f0f0;"><th>No</th><th>Kode RHK</th><th>Program/Kegiatan</th><th>Durasi</th></tr></thead><tbody>${twRow(tw4)}</tbody></table>
      </div>`;

    // BAB IV Jadwal & Strategi
    const pBab4 = `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB IV<br/>JADWAL &amp; STRATEGI PENDAMPINGAN</h2>
        <h3>A. Jadwal Pelaksanaan</h3>
        <p style="text-align:justify;">Jadwal pelaksanaan pendampingan disusun mengikuti kalender pendidikan madrasah dan jadwal akademik Kemenag. Secara umum, kegiatan pendampingan dilakukan dengan ritme bulanan untuk supervisi rutin dan triwulanan untuk evaluasi.</p>
        <table class="fmt" style="width:100%;font-size:11pt;">
          <thead><tr style="background:#f0f0f0;"><th>Bulan</th><th>Fokus Kegiatan</th><th>Output</th></tr></thead>
          <tbody>
            <tr><td>Januari</td><td>Penyusunan program & pemetaan madrasah</td><td>Program tahunan</td></tr>
            <tr><td>Februari</td><td>Supervisi awal semester genap</td><td>Laporan supervisi</td></tr>
            <tr><td>Maret</td><td>Reviu kurikulum & RPP</td><td>Catatan reviu</td></tr>
            <tr><td>April</td><td>Monev penilaian + pendampingan PKKM</td><td>Hasil PKKM</td></tr>
            <tr><td>Mei</td><td>Bimtek evaluasi pembelajaran</td><td>Laporan bimtek</td></tr>
            <tr><td>Juni</td><td>Evaluasi semester genap & laporan TW II</td><td>Laporan TW II</td></tr>
            <tr><td>Juli</td><td>Penyiapan tahun ajaran baru + pendampingan kurikulum</td><td>Dokumen perencanaan</td></tr>
            <tr><td>Agustus</td><td>Supervisi awal semester gasal</td><td>Laporan supervisi</td></tr>
            <tr><td>September</td><td>PKG Guru + bimtek karakter siswa</td><td>Hasil PKG</td></tr>
            <tr><td>Oktober</td><td>Monev kurikulum & literasi-numerasi</td><td>Laporan monev</td></tr>
            <tr><td>November</td><td>Akreditasi & evaluasi kebijakan Kemenag</td><td>Dokumen akreditasi</td></tr>
            <tr><td>Desember</td><td>Evaluasi tahunan & laporan akhir</td><td>Laporan tahunan</td></tr>
          </tbody>
        </table>

        <h3>B. Metode &amp; Pendekatan</h3>
        <ol style="text-align:justify;">
          <li><strong>Observasi langsung</strong> ke madrasah binaan;</li>
          <li><strong>Wawancara terstruktur</strong> dengan kepala madrasah, guru, tendik, dan siswa;</li>
          <li><strong>Studi dokumentasi</strong> perangkat pembelajaran, kurikulum, dan tata kelola;</li>
          <li><strong>Diskusi reflektif</strong> dan focus group discussion (FGD);</li>
          <li><strong>Bimbingan teknis</strong> melalui workshop, pelatihan, dan in-house training;</li>
          <li><strong>Pendampingan berkelanjutan</strong> via grup koordinasi (luring & daring).</li>
        </ol>

        <h3>C. Indikator Keberhasilan</h3>
        <ol style="text-align:justify;">
          <li>Seluruh madrasah binaan telah disupervisi minimal 2 kali dalam setahun;</li>
          <li>Tersusunnya 30 RHK dengan capaian eviden lengkap minimal 90%;</li>
          <li>Meningkatnya nilai EDM/Akreditasi madrasah binaan;</li>
          <li>Meningkatnya kompetensi guru dan kepala madrasah berdasarkan hasil PKG/PKKM;</li>
          <li>Tersedianya laporan pendampingan triwulanan dan tahunan tepat waktu.</li>
        </ol>
      </div>`;

    // BAB V Penutup
    const pBab5 = `
      <div class="doc-page">
        <h2 style="text-align:center;">BAB V<br/>PENUTUP</h2>
        <p style="text-align:justify;">Demikian Program Pendampingan Tahunan ini disusun sebagai pedoman pelaksanaan tugas Pengawas Madrasah pada ${U.escapeHtml(i.pegawai.unit_kerja)} Tahun ${tahun}. Dokumen ini bersifat dinamis dan dapat dilakukan penyesuaian sesuai kebutuhan dan dinamika lapangan dengan tetap mengacu pada peraturan perundang-undangan yang berlaku.</p>
        <p style="text-align:justify;">Kelancaran pelaksanaan program ini sangat bergantung pada dukungan dan kerja sama yang baik antara Pengawas Madrasah, Kepala ${U.escapeHtml(i.pejabat_penilai.unit_kerja)}, Ketua Pokjawas, Kepala Madrasah, dewan guru, dan seluruh pemangku kepentingan pendidikan.</p>
        <p style="text-align:justify;">Atas perhatian dan dukungan semua pihak, kami sampaikan terima kasih.</p>
        ${ttdBlokPenutup(i)}
      </div>`;

    // Lampiran
    const pLampiran = `
      <div class="doc-page">
        <h2 style="text-align:center;">LAMPIRAN</h2>
        <h3>1. SK Pembagian Tugas Pengawas Madrasah Tahun ${tahun}</h3>
        <p style="font-style:italic;color:#888;">[Lampirkan SK Pembagian Tugas dari Kepala ${U.escapeHtml(i.pejabat_penilai.unit_kerja)}]</p>

        <h3 style="margin-top:20px;">2. Matriks Program Pendampingan</h3>
        <table class="fmt" style="width:100%;font-size:10pt;">
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="width:40px;">No</th>
              <th style="width:80px;">Kode</th>
              <th>Program/Kegiatan</th>
              <th style="width:60px;">TW</th>
              <th style="width:80px;">Durasi</th>
            </tr>
          </thead>
          <tbody>
            ${allRhk.map((r, idx) => `<tr>
              <td style="text-align:center;">${idx+1}</td>
              <td>${U.escapeHtml(r.id)}</td>
              <td>${U.escapeHtml(r.nama_eviden || r.rencana_hasil_kerja || '-')}</td>
              <td style="text-align:center;">${r.triwulan === 'TAMBAHAN' ? 'Tmb' : r.triwulan}</td>
              <td style="text-align:center;">${U.escapeHtml(r.target_waktu || '-')}</td>
            </tr>`).join('')}
          </tbody>
        </table>

        <h3 style="margin-top:20px;">3. Surat Pengesahan Pengawas</h3>
        <p style="font-style:italic;color:#888;">[Lampirkan Surat Pengesahan Program oleh ${U.escapeHtml(i.pejabat_penilai.jabatan)}]</p>
      </div>`;

    return pCover + pPengesahan + pKata + pDaftarIsi + pBab1 + pBab2 + pBab3 + pBab4 + pBab5 + pLampiran;
  }

  // Document type catalog: id -> { label, gen }
  const TYPES = {
    laporan_singkat: { label: 'Laporan Singkat Hasil Pendampingan', gen: genLaporanSingkat },
    program_pendampingan: { label: 'Program Pendampingan Tahunan (Program Kerja Pengawas)', gen: genProgramPendampingan },
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
    surat_keterangan_madrasah: { label: 'Surat Keterangan dari Madrasah Binaan', gen: genSuratKeteranganMadrasah },
  };

  function defaultTypesFor(rhk) {
    if (rhk && rhk.id === 'RHK-1') {
      return ['program_pendampingan','laporan_singkat','surat_tugas','undangan','daftar_hadir','notulen','berita_acara','foto','link'];
    }
    return ['laporan_singkat','surat_tugas','undangan','daftar_hadir','notulen','berita_acara','instrumen','rekap','analisis','rekomendasi','surat_keterangan_madrasah','foto','link'];
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

  window.GenHTML = { TYPES, defaultTypesFor, htmlToPlain, header, varsFor, getNarasi, tanggalKota, ttdBlokStandar, ttdBlokPenutup, ttdPengawas, ttdTriwulan };
})();
