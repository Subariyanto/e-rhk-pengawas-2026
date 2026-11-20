// Pemetaan RHK e-RHK -> indikator e-PKPM (Penilaian Kinerja Pengawas Madrasah).
// Setiap entri menunjukkan butir RHK mana yang menyiapkan bukti dukung untuk
// indikator PKPM tertentu. Dipakai untuk menunjukkan keterkaitan di halaman
// Master RHK dan Preview Eviden, supaya penilai tahu bundel bukti mana yang
// harus diperiksa. Data lama tetap kompatibel: field ini opsional.
(function () {
  window.PKPM_INDICATOR = {
    // K1 — Penyusunan Program Pengawasan
    'RHK-1': [{ kode: 'K1.1', komponen: 'K1', nama: 'Program Pengawasan Tahunan' },
              { kode: 'K1.KBC', komponen: 'K1', nama: 'Integrasi Rencana Pendampingan KBC' }],
    'RHK-2': [{ kode: 'K1.5', komponen: 'K1', nama: 'Program Pengawasan Semester' }],
    'RHK-3': [{ kode: 'K1.3', komponen: 'K1', nama: 'Program Pemantauan Mutu/SNP' }],
    'RHK-4': [{ kode: 'K1.6', komponen: 'K1', nama: 'RPA dan/atau RPM' }],
    'RHK-5': [{ kode: 'K1.2', komponen: 'K1', nama: 'Program Pembinaan Guru dan/atau Kepala Madrasah' }],
    'RHK-6': [{ kode: 'K2.KBC', komponen: 'K2', nama: 'Sosialisasi dan Pendampingan Implementasi KBC' }],
    'RHK-26': [{ kode: 'K1.4', komponen: 'K1', nama: 'Program Penilaian Kinerja Guru dan/atau Kepala Madrasah' }],

    // K2 — Pelaksanaan Program Pengawasan
    'RHK-9': [{ kode: 'K2.2', komponen: 'K2', nama: 'Pelaksanaan Pemantauan Mutu/SNP' },
              { kode: 'K2.KBC', komponen: 'K2', nama: 'Sosialisasi dan Pendampingan Implementasi KBC' }],
    'RHK-10': [{ kode: 'K2.1', komponen: 'K2', nama: 'Pelaksanaan Pembinaan Guru dan/atau Kepala Madrasah' }],
    'RHK-11': [{ kode: 'K2.3', komponen: 'K2', nama: 'Pelaksanaan Penilaian Kinerja Guru dan/atau Kepala Madrasah' }],
    'RHK-13': [{ kode: 'K2.1', komponen: 'K2', nama: 'Pelaksanaan Pembinaan Guru dan/atau Kepala Madrasah' }],
    'RHK-19': [{ kode: 'K2.4', komponen: 'K2', nama: 'Laporan Tahunan Pelaksanaan Program Pengawasan' },
               { kode: 'K3.4', komponen: 'K3', nama: 'Laporan Evaluasi Keseluruhan Program Pengawasan' },
               { kode: 'K3.KBC', komponen: 'K3', nama: 'Evaluasi Hasil Pendampingan Nilai KBC' }],

    // K3 — Evaluasi Hasil Pelaksanaan Program Pengawasan
    'RHK-14': [{ kode: 'K3.1', komponen: 'K3', nama: 'Evaluasi Hasil Pembinaan' }],
    'RHK-15': [{ kode: 'K3.2', komponen: 'K3', nama: 'Evaluasi Hasil Pemantauan Mutu/SNP' }],
    'RHK-22': [{ kode: 'K3.3', komponen: 'K3', nama: 'Evaluasi Hasil Penilaian Kinerja' }],
    'RHK-7': [{ kode: 'K3.5', komponen: 'K3', nama: 'Evaluasi Tingkat Kabupaten/Kota atau Provinsi' }],

    // K4 — Pembimbingan dan Pelatihan Profesional
    'RHK-21': [{ kode: 'K4.1', komponen: 'K4', nama: 'Program Pembimbingan dan Pelatihan Profesional' }],
    'RHK-25': [{ kode: 'K4.2', komponen: 'K4', nama: 'Pelaksanaan Pembimbingan dan Pelatihan Profesional' }],
    'RHK-16': [{ kode: 'K2.1', komponen: 'K2', nama: 'Pelaksanaan Pembinaan Guru dan/atau Kepala Madrasah' }],
    'RHK-23': [{ kode: 'K2.1', komponen: 'K2', nama: 'Pelaksanaan Pembinaan Guru dan/atau Kepala Madrasah' }],
    'RHK-24': [{ kode: 'K2.1', komponen: 'K2', nama: 'Pelaksanaan Pembinaan Guru dan/atau Kepala Madrasah' }],
    'RHK-12': [{ kode: 'K4.3', komponen: 'K4', nama: 'Pembimbingan Kepala Madrasah dalam Pengelolaan Madrasah' }],
    'RHK-17': [{ kode: 'K4.4', komponen: 'K4', nama: 'Evaluasi Hasil Pembimbingan dan Pelatihan' }],
    'RHK-8': [{ kode: 'K4.5', komponen: 'K4', nama: 'Pembimbingan Pengawas Lain' }],
    'RHK-20': [{ kode: 'K4.6', komponen: 'K4', nama: 'Pembimbingan Penelitian Tindakan/Pengembangan Profesi' },
               { kode: 'K4.KBC', komponen: 'K4', nama: 'Praktik Baik/Inovasi Pembimbingan KBC' }],
    'RHK-18': [{ kode: 'K4.7', komponen: 'K4', nama: 'Laporan Tahunan Pembimbingan dan Pelatihan' }],
    'RHK-27': [{ kode: 'K4.8', komponen: 'K4', nama: 'Bukti Dukung Unsur Tambahan' }],
    'RHK-28': [{ kode: 'K4.8', komponen: 'K4', nama: 'Bukti Dukung Unsur Tambahan' }],
    'RHK-29': [{ kode: 'K4.8', komponen: 'K4', nama: 'Bukti Dukung Unsur Tambahan' }],
    'RHK-30': [{ kode: 'K4.8', komponen: 'K4', nama: 'Bukti Dukung Unsur Tambahan' }],
  };

  // Judul komponen untuk ditampilkan di tooltip/badge.
  window.PKPM_KOMPONEN = {
    K1: 'Penyusunan Program Pengawasan',
    K2: 'Pelaksanaan Program Pengawasan',
    K3: 'Evaluasi Hasil Pelaksanaan Program Pengawasan',
    K4: 'Pembimbingan dan Pelatihan Profesional',
  };

  /** Ambil daftar indikator PKPM untuk satu RHK (aman untuk data lama). */
  window.pkpmIndikatorUntuk = function (rhk) {
    if (!rhk) return [];
    if (Array.isArray(rhk.pkpm_indikator) && rhk.pkpm_indikator.length) {
      return rhk.pkpm_indikator.map(function (x) {
        return typeof x === 'string' ? { kode: x } : x;
      });
    }
    return window.PKPM_INDICATOR[rhk.id] || [];
  };
})();
