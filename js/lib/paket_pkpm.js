// Paket Ekspor Bukti Dukung PKPM
// Menghasilkan bundel bukti dukung terstruktur per indikator e-PKPM
// (K1.1 s/d K4.KBC), dikelompokkan mengikuti pemetaan RHK.
(function () {
  const KOMPONEN = {
    K1: 'Penyusunan Program Pengawasan',
    K2: 'Pelaksanaan Program Pengawasan',
    K3: 'Evaluasi Hasil Pelaksanaan Program Pengawasan',
    K4: 'Pembimbingan dan Pelatihan Profesional',
  };

  // Daftar indikator e-PKPM sesuai instrumen resmi (K1–K4, termasuk KBC).
  const INDIKATOR = [
    { kode: 'K1.1', komponen: 'K1', nama: 'Program Pengawasan Tahunan' },
    { kode: 'K1.2', komponen: 'K1', nama: 'Program Pembinaan Guru dan/atau Kepala Madrasah' },
    { kode: 'K1.3', komponen: 'K1', nama: 'Program Pemantauan Mutu/SNP' },
    { kode: 'K1.4', komponen: 'K1', nama: 'Program Penilaian Kinerja Guru dan/atau Kepala Madrasah' },
    { kode: 'K1.5', komponen: 'K1', nama: 'Program Pengawasan Semester' },
    { kode: 'K1.6', komponen: 'K1', nama: 'RPA dan/atau RPM' },
    { kode: 'K1.KBC', komponen: 'K1', nama: 'Integrasi Rencana Pendampingan KBC' },
    { kode: 'K2.1', komponen: 'K2', nama: 'Pelaksanaan Pembinaan Guru dan/atau Kepala Madrasah' },
    { kode: 'K2.2', komponen: 'K2', nama: 'Pelaksanaan Pemantauan Mutu/SNP' },
    { kode: 'K2.3', komponen: 'K2', nama: 'Pelaksanaan Penilaian Kinerja Guru dan/atau Kepala Madrasah' },
    { kode: 'K2.4', komponen: 'K2', nama: 'Laporan Tahunan Pelaksanaan Program Pengawasan' },
    { kode: 'K2.KBC', komponen: 'K2', nama: 'Sosialisasi dan Pendampingan Implementasi KBC' },
    { kode: 'K3.1', komponen: 'K3', nama: 'Evaluasi Hasil Pembinaan' },
    { kode: 'K3.2', komponen: 'K3', nama: 'Evaluasi Hasil Pemantauan Mutu/SNP' },
    { kode: 'K3.3', komponen: 'K3', nama: 'Evaluasi Hasil Penilaian Kinerja' },
    { kode: 'K3.4', komponen: 'K3', nama: 'Laporan Evaluasi Keseluruhan Program Pengawasan' },
    { kode: 'K3.5', komponen: 'K3', nama: 'Evaluasi Tingkat Kabupaten/Kota atau Provinsi' },
    { kode: 'K3.KBC', komponen: 'K3', nama: 'Evaluasi Hasil Pendampingan Nilai KBC' },
    { kode: 'K4.1', komponen: 'K4', nama: 'Program Pembimbingan dan Pelatihan Profesional' },
    { kode: 'K4.2', komponen: 'K4', nama: 'Pelaksanaan Pembimbingan dan Pelatihan Profesional' },
    { kode: 'K4.3', komponen: 'K4', nama: 'Pembimbingan Kepala Madrasah dalam Pengelolaan Madrasah' },
    { kode: 'K4.4', komponen: 'K4', nama: 'Evaluasi Hasil Pembimbingan dan Pelatihan' },
    { kode: 'K4.5', komponen: 'K4', nama: 'Pembimbingan Pengawas Lain' },
    { kode: 'K4.6', komponen: 'K4', nama: 'Pembimbingan Penelitian Tindakan/Pengembangan Profesi' },
    { kode: 'K4.7', komponen: 'K4', nama: 'Laporan Tahunan Pembimbingan dan Pelatihan' },
    { kode: 'K4.8', komponen: 'K4', nama: 'Bukti Dukung Unsur Tambahan' },
    { kode: 'K4.KBC', komponen: 'K4', nama: 'Praktik Baik/Inovasi Pembimbingan KBC' },
  ];

  function indikatorUntuk(rhk) {
    if (typeof window.pkpmIndikatorUntuk === 'function') return window.pkpmIndikatorUntuk(rhk);
    return (window.PKPM_INDICATOR || {})[rhk && rhk.id] || [];
  }

  // Susun peta: indikator -> daftar RHK pemasok bukti.
  function petaIndikator(masterRhk) {
    const peta = {};
    INDIKATOR.forEach(i => { peta[i.kode] = []; });
    masterRhk.forEach(r => {
      indikatorUntuk(r).forEach(x => {
        if (!peta[x.kode]) peta[x.kode] = [];
        peta[x.kode].push(r);
      });
    });
    return peta;
  }

  function semuaIndikator() { return INDIKATOR.slice(); }

  /** Hitung status kelengkapan per indikator berdasarkan eviden yang ada. */
  function hitungStatus(masterRhk, eviden) {
    const peta = petaIndikator(masterRhk);
    return INDIKATOR.map(ind => {
      const rhks = peta[ind.kode] || [];
      let totalEviden = 0, finalEviden = 0, adaDrive = false;
      const detail = rhks.map(r => {
        const evs = eviden.filter(e => e.rhk_id === r.id);
        totalEviden += evs.length;
        finalEviden += evs.filter(e => e.status === 'final').length;
        if (r.link_bukti_dukung) adaDrive = true;
        return {
          rhk: r,
          jumlah: evs.length,
          final: evs.filter(e => e.status === 'final').length,
        };
      });
      let status = 'kosong';
      if (finalEviden > 0) status = 'final';
      else if (totalEviden > 0) status = 'draft';
      return {
        indikator: ind,
        detail,
        totalEviden,
        finalEviden,
        adaDrive,
        status,
      };
    });
  }
  window.PaketPKPM = {
    KOMPONEN,
    semuaIndikator,
    petaIndikator,
    hitungStatus,
    indikatorUntuk,
  };
})();
