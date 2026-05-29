// Narasi otomatis per RHK — placeholder ${var} di-resolve oleh U.fillTemplate
// Variables yang tersedia: rhk.nama_eviden, rhk.rencana_hasil_kerja, rhk.indikator_kuantitas,
// rhk.target_kuantitas, rhk.triwulan, kegiatan.nama, kegiatan.tanggal_str, kegiatan.tempat,
// kegiatan.sasaran, kegiatan.peserta, kegiatan.uraian, kegiatan.tujuan, kegiatan.hasil,
// kegiatan.kendala, kegiatan.solusi, kegiatan.tindak_lanjut, kegiatan.rekomendasi,
// pengawas.nama, pengawas.nip, pengawas.jabatan, pengawas.unit_kerja, pengawas.kabupaten
window.NARASI_RHK = {
  default: {
    latar_belakang:
      'Pengawas Madrasah memiliki tugas pokok melaksanakan pengawasan akademik dan manajerial pada madrasah binaan, ' +
      'sesuai dengan Peraturan Menteri Agama dan ketentuan kepengawasan yang berlaku. Dalam rangka pelaksanaan SKP Tahun 2026 ' +
      'dengan ${rhk.nama_eviden}, perlu disusun ${rhk.nama_eviden} sebagai bagian dari Rencana Hasil Kerja (RHK) ' +
      'untuk memastikan ${rhk.rencana_hasil_kerja}',
    dasar:
      '1. Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;\n' +
      '2. Peraturan Pemerintah Nomor 19 Tahun 2017 tentang Perubahan PP Nomor 74 Tahun 2008 tentang Guru;\n' +
      '3. Peraturan Menteri Agama Nomor 31 Tahun 2013 tentang Pengawas Madrasah;\n' +
      '4. Peraturan Menteri PANRB Nomor 6 Tahun 2022 tentang Pengelolaan Kinerja Pegawai ASN;\n' +
      '5. Perdirjen GTK Nomor 7328 Tahun 2023 tentang Pengelolaan Kinerja Guru dan Kepala Sekolah/Madrasah;\n' +
      '6. SKP ${pengawas.nama} Tahun 2026 dan SK Pembagian Tugas Kepengawasan Tahun 2026.',
    tujuan:
      '1. ${rhk.rencana_hasil_kerja}\n' +
      '2. Meningkatkan mutu layanan pendidikan pada madrasah binaan.\n' +
      '3. Memenuhi target ${rhk.indikator_kuantitas} sebesar ${rhk.target_kuantitas}.',
    sasaran:
      'Madrasah binaan di wilayah kerja ${pengawas.unit_kerja}, ${pengawas.kabupaten}, baik jenjang RA, MI, MTs, maupun MA.',
    waktu_tempat:
      'Kegiatan dilaksanakan pada ${kegiatan.tanggal_str} bertempat di ${kegiatan.tempat}.',
    langkah:
      '1. Persiapan: penyusunan instrumen, koordinasi dengan kepala madrasah, dan pengumpulan dokumen pendukung.\n' +
      '2. Pelaksanaan: ${kegiatan.uraian}\n' +
      '3. Tindak lanjut: penyusunan laporan, rekomendasi, dan diseminasi hasil.',
    metode: 'Kombinasi observasi, wawancara, studi dokumentasi, diskusi terfokus, dan pendampingan teknis.',
    hasil:
      'Berdasarkan pelaksanaan kegiatan, diperoleh hasil sebagai berikut:\n${kegiatan.hasil}',
    analisis:
      'Hasil kegiatan menunjukkan ${rhk.rencana_hasil_kerja} sudah/belum sepenuhnya tercapai. Indikator capaian: ${rhk.indikator_kuantitas} dengan target ${rhk.target_kuantitas}. ' +
      'Capaian aktual ditelusuri melalui dokumen, observasi, dan wawancara dengan kepala madrasah/guru/peserta didik.',
    permasalahan: '${kegiatan.kendala}',
    solusi: '${kegiatan.solusi}',
    tindak_lanjut: '${kegiatan.tindak_lanjut}',
    kesimpulan:
      'Kegiatan ${kegiatan.nama} pada Triwulan ${rhk.triwulan} telah dilaksanakan sesuai dengan rencana. ' +
      '${rhk.rencana_hasil_kerja} dapat dicapai melalui pelaksanaan kegiatan ini.',
    rekomendasi:
      '${kegiatan.rekomendasi}\nDirekomendasikan kepada Kementerian Agama, Kepala Madrasah, dan pemangku kepentingan untuk menindaklanjuti hasil pendampingan ini.',
  },
  // RHK-specific overrides for richer narrative
  'RHK-1': {
    latar_belakang:
      'Program Pendampingan Tahunan merupakan kerangka acuan kerja Pengawas Madrasah dalam melaksanakan supervisi akademik dan manajerial pada madrasah binaan selama satu tahun anggaran. ' +
      'Penyusunan program ini bertujuan agar ${rhk.rencana_hasil_kerja} dapat tercapai dengan terukur dan akuntabel, serta memprioritaskan layanan berpusat pada peserta didik melalui Kurikulum Berbasis Cinta.',
  },
  'RHK-13': {
    latar_belakang:
      'Supervisi akademik berbasis Pembelajaran Mendalam (Deep Learning) merupakan strategi pendampingan klinis untuk meningkatkan kualitas pembelajaran di madrasah binaan. ' +
      'Pengawas Madrasah berperan sebagai mitra reflektif bagi guru dalam mengembangkan praktik pembelajaran yang bermakna dan berpusat pada peserta didik.',
    metode: 'Observasi kelas, pra-konferensi, konferensi, dan pasca-konferensi (refleksi terstruktur) dengan instrumen Pembelajaran Mendalam.',
  },
  'RHK-19': {
    latar_belakang:
      'Evaluasi dampak pendampingan dilaksanakan untuk mengukur sejauh mana program pendampingan tahunan berkontribusi pada peningkatan mutu layanan pendidikan pada madrasah binaan, ' +
      'serta menjadi dasar perumusan rekomendasi perbaikan tahun berikutnya.',
  },
  'RHK-20': {
    latar_belakang:
      'Karya inovasi/best practice kepengawasan berbasis kepemimpinan kasih sayang merupakan wujud nyata kontribusi profesional Pengawas Madrasah dalam mendorong transformasi pendidikan. ' +
      'Karya ini diharapkan dapat menginspirasi praktik kepengawasan yang humanis, transformatif, dan berdampak.',
  },
  'RHK-27': {
    latar_belakang:
      'Pengembangan diri merupakan kebutuhan profesional setiap Pengawas Madrasah dalam rangka meningkatkan kapasitas dan kompetensi sebagai mitra peningkatan mutu pendidikan. ' +
      'Kegiatan diklat, bimtek, seminar, workshop, dan webinar yang diikuti perlu dilaporkan sebagai bagian dari kinerja tambahan.',
    dasar:
      '1. UU Nomor 14 Tahun 2005 tentang Guru dan Dosen;\n' +
      '2. Peraturan Menteri Agama tentang Pengawas Madrasah;\n' +
      '3. Surat Tugas dari atasan langsung;\n' +
      '4. SKP ${pengawas.nama} Tahun 2026 — Kinerja Tambahan.',
  },
};
