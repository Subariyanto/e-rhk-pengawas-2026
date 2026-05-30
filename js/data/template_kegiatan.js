// Template otomatis untuk 7 field "Uraian Kegiatan" di form Tambah Kegiatan
// Kategori RHK dideteksi dari kata kunci nama_eviden / rencana_hasil_kerja
// Setiap kategori punya 2-3 varian per field. Bisa dipakai sebagai auto-fill
// atau dipilih manual via dropdown "Pilih Contoh".
(function () {
  // ===== Helper: deteksi kategori RHK =====
  function detectKategori(rhk) {
    if (!rhk) return 'umum';
    const txt = ((rhk.nama_eviden || '') + ' ' + (rhk.rencana_hasil_kerja || '') + ' ' + (rhk.rencana_aksi || '')).toLowerCase();

    // Khusus per id (override)
    const byId = {
      'RHK-1': 'program_tahunan',
      'RHK-2': 'evaluasi_kurikulum',
      'RHK-3': 'pemetaan_uks',
      'RHK-4': 'analisis_an',
      'RHK-5': 'rktm',
      'RHK-6': 'karakter',
      'RHK-7': 'kolaborasi_komite',
      'RHK-8': 'organisasi_profesi',
      'RHK-9': 'reviu_kurikulum',
      'RHK-10': 'karakter',
      'RHK-11': 'monev_kurikulum',
      'RHK-12': 'akreditasi',
      'RHK-13': 'supervisi_klinis',
      'RHK-14': 'evaluasi_kebijakan',
      'RHK-15': 'sekolah_unggul',
      'RHK-16': 'bilingual',
      'RHK-17': 'prestasi_siswa',
      'RHK-18': 'profesionalisme_guru',
      'RHK-19': 'evaluasi_dampak',
      'RHK-20': 'best_practice',
      'RHK-21': 'kebutuhan_guru',
      'RHK-22': 'kompetensi_tendik',
      'RHK-23': 'sertifikasi_guru',
      'RHK-24': 'ppg',
      'RHK-25': 'ekstrakurikuler',
      'RHK-26': 'monev_guru_agama',
      'RHK-27': 'pengembangan_diri',
      'RHK-28': 'karya_inovatif',
      'RHK-29': 'publikasi_ilmiah',
      'RHK-30': 'organisasi_profesi',
    };
    if (rhk.id && byId[rhk.id]) return byId[rhk.id];

    // Fallback by keyword
    if (/program\s+pendampingan\s+tahunan/i.test(txt)) return 'program_tahunan';
    if (/akreditasi/i.test(txt)) return 'akreditasi';
    if (/supervisi\s+klinis/i.test(txt) || /supervisi\s+akademik/i.test(txt)) return 'supervisi_klinis';
    if (/reviu/i.test(txt) && /kurikulum/i.test(txt)) return 'reviu_kurikulum';
    if (/evaluasi/i.test(txt) && /kurikulum/i.test(txt)) return 'evaluasi_kurikulum';
    if (/karakter/i.test(txt)) return 'karakter';
    if (/literasi|numerasi|asesmen/i.test(txt)) return 'analisis_an';
    if (/rktm/i.test(txt)) return 'rktm';
    if (/profesionalisme/i.test(txt) || /pkb|pengembangan\s+keprofesian/i.test(txt)) return 'profesionalisme_guru';
    if (/sertifikasi|ppg/i.test(txt)) return 'sertifikasi_guru';
    if (/komite|orang\s*tua/i.test(txt)) return 'kolaborasi_komite';
    if (/ekstrakurikuler/i.test(txt)) return 'ekstrakurikuler';
    if (/bilingual/i.test(txt)) return 'bilingual';
    if (/prestasi/i.test(txt)) return 'prestasi_siswa';
    if (/best\s*practice|inovasi|karya\s+inovat/i.test(txt)) return 'best_practice';
    if (/publikasi|jurnal|makalah|buku/i.test(txt)) return 'publikasi_ilmiah';
    if (/pengembangan\s+diri|sertifikat/i.test(txt)) return 'pengembangan_diri';
    if (/organisasi\s+profesi|pokjawas|apsi/i.test(txt)) return 'organisasi_profesi';
    if (/uks|kesehatan/i.test(txt)) return 'pemetaan_uks';
    if (/dampak/i.test(txt)) return 'evaluasi_dampak';
    if (/kebutuhan\s+guru/i.test(txt)) return 'kebutuhan_guru';
    if (/kompetensi.*tendik|tenaga\s+kependidikan/i.test(txt)) return 'kompetensi_tendik';
    if (/monev|monitoring|evaluasi/i.test(txt)) return 'monev_umum';
    if (/pendampingan/i.test(txt)) return 'pendampingan_umum';
    if (/pembinaan/i.test(txt)) return 'pembinaan_umum';

    return 'umum';
  }

  // ===== Library template per kategori =====
  // Setiap kategori punya 7 field, masing-masing array of varian.
  // Placeholder: {RHK_NAMA}, {RHK_AKSI}, {MADRASAH}, {INDIKATOR}
  const LIB = {
    program_tahunan: {
      tujuan: [
        'Menyusun Program Pendampingan Tahunan Pengawas Madrasah sebagai pedoman pelaksanaan supervisi akademik dan manajerial pada madrasah binaan selama satu tahun anggaran.',
        'Memberikan arah kerja yang sistematis bagi Pengawas Madrasah dalam mengoptimalkan layanan pendidikan berbasis Kurikulum Berbasis Cinta pada madrasah binaan.',
      ],
      uraian: [
        'Pelaksanaan kegiatan meliputi: (1) studi pendahuluan terhadap kebijakan dan regulasi terkait kepengawasan; (2) pemetaan profil madrasah binaan; (3) identifikasi kebutuhan pendampingan; (4) penyusunan visi, misi, dan strategi; (5) penyusunan matriks program per triwulan; (6) konsultasi dan validasi dengan Ketua Pokjawas; (7) pengesahan oleh Kepala Kankemenag.',
        'Kegiatan dilaksanakan secara mandiri dan kolaboratif: review regulasi terbaru (Perdirjen GTK 7328/2023), pemetaan 8 SNP madrasah binaan, FGD bersama Kepala Madrasah untuk merumuskan kebutuhan, penyusunan draft program, validasi internal Pokjawas, finalisasi, dan pengesahan.',
      ],
      hasil: [
        'Tersusun 1 (satu) dokumen Program Pendampingan Tahunan Pengawas Madrasah yang memuat: latar belakang, dasar hukum, tujuan, sasaran madrasah binaan, ruang lingkup, analisis kebutuhan, matriks program per triwulan, jadwal pelaksanaan, indikator keberhasilan, dan lampiran SK pembagian tugas. Dokumen telah disahkan dan menjadi acuan kerja sepanjang tahun.',
        'Dihasilkan dokumen Program Pendampingan Tahunan yang lengkap dan terstruktur sesuai juknis Perdirjen GTK 7328/2023, mencakup seluruh ruang lingkup tugas Pengawas Madrasah dan disahkan oleh Kepala Kankemenag.',
      ],
      kendala: [
        'Kebijakan dan regulasi terkait kepengawasan masih dalam masa transisi sehingga memerlukan penyesuaian dengan juknis terbaru.',
        'Data pemetaan awal madrasah binaan belum sepenuhnya terkini, sehingga membutuhkan verifikasi tambahan.',
        'Keterbatasan waktu untuk konsultasi mendalam dengan seluruh Kepala Madrasah binaan.',
      ],
      solusi: [
        'Melakukan review regulasi secara intensif dan berkonsultasi dengan Pokjawas serta Kasi Pendma Kankemenag.',
        'Melakukan verifikasi data madrasah binaan melalui koordinasi langsung dan pemanfaatan data EMIS terbaru.',
        'Menggunakan media komunikasi grup (WhatsApp/daring) untuk efisiensi konsultasi dengan Kepala Madrasah.',
      ],
      tindak_lanjut: [
        'Mensosialisasikan Program Pendampingan Tahunan kepada seluruh Kepala Madrasah binaan dan tim kerja.',
        'Melaksanakan program sesuai matriks per triwulan dan melakukan evaluasi berkala.',
        'Menyiapkan instrumen pendukung untuk pelaksanaan program di tiap triwulan.',
      ],
      rekomendasi: [
        'Program Pendampingan Tahunan agar dijadikan acuan utama oleh Pengawas dan Kepala Madrasah binaan dalam menyelaraskan agenda tahunan.',
        'Perlu review berkala terhadap pelaksanaan program agar dapat dilakukan penyesuaian sesuai dinamika lapangan.',
        'Direkomendasikan agar Pokjawas memfasilitasi penyamaan persepsi antar pengawas dalam implementasi program.',
      ],
    },
    evaluasi_kurikulum: {
      tujuan: ['Mengevaluasi perangkat kurikulum madrasah binaan untuk mendukung peningkatan mutu pendidikan berbasis cinta kemanusiaan dan pelestarian lingkungan.'],
      uraian: ['Kegiatan dilaksanakan melalui: (1) penyiapan instrumen evaluasi kurikulum; (2) studi dokumen kurikulum operasional madrasah; (3) wawancara dengan tim pengembang kurikulum; (4) observasi implementasi pembelajaran; (5) analisis hasil; (6) penyusunan laporan evaluasi.'],
      hasil: ['Dihasilkan dokumen evaluasi perangkat kurikulum madrasah yang memuat temuan, rekomendasi pengembangan, dan rencana tindak lanjut. Madrasah binaan memperoleh masukan substantif untuk penyempurnaan kurikulum operasional.'],
      kendala: ['Masih ditemukan dokumen kurikulum yang belum lengkap atau belum mengintegrasikan Kurikulum Berbasis Cinta secara eksplisit.', 'Tim pengembang kurikulum belum optimal dalam menggunakan instrumen evaluasi diri.'],
      solusi: ['Memberikan pendampingan intensif dan contoh praktik baik dari madrasah lain.', 'Menyelenggarakan bimtek penggunaan instrumen evaluasi kurikulum.'],
      tindak_lanjut: ['Madrasah merevisi perangkat kurikulum sesuai rekomendasi.', 'Pengawas akan melakukan monev pelaksanaan revisi kurikulum pada triwulan berikutnya.'],
      rekomendasi: ['Madrasah agar mengoptimalkan tim pengembang kurikulum dalam meninjau dan mengevaluasi perangkat kurikulum secara berkala.', 'Kankemenag perlu memfasilitasi workshop pengembangan kurikulum berbasis cinta secara masif.'],
    },
    pemetaan_uks: {
      tujuan: ['Mengidentifikasi dan memetakan kondisi layanan kesehatan sekolah (UKS/UKM) pada madrasah binaan sebagai dasar perumusan rekomendasi peningkatan layanan kesehatan peserta didik.'],
      uraian: ['Kegiatan meliputi: (1) penyiapan instrumen pemetaan UKS; (2) kunjungan lapangan ke madrasah binaan; (3) wawancara dengan pembina UKS dan kepala madrasah; (4) observasi sarana prasarana UKS; (5) studi dokumentasi program UKS; (6) penyusunan laporan pemetaan.'],
      hasil: ['Tersusun dokumen identifikasi dan pemetaan kondisi layanan kesehatan sekolah dari seluruh madrasah binaan, dengan klasifikasi kategori layanan (Strata Minimal/Standar/Optimal/Paripurna) dan rekomendasi peningkatan.'],
      kendala: ['Sarana prasarana UKS pada beberapa madrasah masih sangat terbatas.', 'Pembina UKS belum semua mengikuti pelatihan teknis pengelolaan UKS.'],
      solusi: ['Mendorong madrasah memanfaatkan dana BOS untuk pemenuhan sarana UKS minimal.', 'Mengusulkan kepada Kankemenag dan Dinas Kesehatan agar diadakan pelatihan pembina UKS.'],
      tindak_lanjut: ['Madrasah menyusun rencana peningkatan strata UKS.', 'Pengawas akan memantau implementasi rekomendasi pada triwulan berikutnya.'],
      rekomendasi: ['Madrasah agar membentuk Trias UKS (Pendidikan Kesehatan, Pelayanan Kesehatan, Pembinaan Lingkungan) yang aktif.', 'Perlu kemitraan dengan Puskesmas untuk pelayanan kesehatan rutin.'],
    },
    analisis_an: {
      tujuan: ['Menganalisis data hasil Asesmen Nasional (literasi dan numerasi) madrasah binaan sebagai dasar perumusan strategi peningkatan mutu pembelajaran.'],
      uraian: ['Kegiatan meliputi: (1) pengumpulan rapor pendidikan/AN madrasah binaan; (2) analisis capaian literasi dan numerasi; (3) identifikasi indikator yang masih merah/kuning; (4) FGD dengan kepala madrasah dan guru; (5) penyusunan dokumen analisis; (6) sosialisasi temuan.'],
      hasil: ['Dihasilkan dokumen analisis hasil AN madrasah binaan yang memuat capaian per indikator, identifikasi gap, dan rekomendasi intervensi. Madrasah memperoleh peta jalan peningkatan literasi dan numerasi.'],
      kendala: ['Beberapa madrasah belum optimal dalam mengakses dan memahami rapor pendidikan.', 'Capaian literasi dan numerasi belum merata antar madrasah.'],
      solusi: ['Mendampingi kepala madrasah dalam mengakses dan membaca rapor pendidikan.', 'Memfasilitasi madrasah berkinerja tinggi untuk berbagi praktik baik.'],
      tindak_lanjut: ['Madrasah menyusun rencana aksi peningkatan literasi dan numerasi berbasis hasil AN.', 'Pengawas akan memantau implementasi rencana aksi.'],
      rekomendasi: ['Madrasah agar membentuk komunitas belajar guru fokus literasi dan numerasi.', 'Perlu integrasi pembiasaan literasi-numerasi dalam pembelajaran lintas mata pelajaran.'],
    },
    rktm: {
      tujuan: ['Membina dan mendampingi madrasah binaan dalam menyusun Rencana Kerja Tahunan Madrasah (RKTM) yang terukur, partisipatif, dan berbasis kebutuhan.'],
      uraian: ['Kegiatan meliputi: (1) sosialisasi pedoman penyusunan RKTM; (2) pendampingan analisis kondisi madrasah; (3) pendampingan perumusan tujuan dan sasaran; (4) pendampingan penyusunan program dan kegiatan; (5) pendampingan penyusunan anggaran; (6) finalisasi dan pengesahan RKTM.'],
      hasil: ['Madrasah binaan memiliki dokumen RKTM yang disusun secara partisipatif, terukur, dan berbasis kebutuhan. RKTM menjadi acuan operasional madrasah selama satu tahun.'],
      kendala: ['Beberapa madrasah masih kesulitan menyusun RKTM secara mandiri.', 'Keterbatasan waktu untuk pendampingan langsung di seluruh madrasah binaan.'],
      solusi: ['Memberikan template RKTM dan contoh praktik baik.', 'Pendampingan dilakukan secara blended (luring + grup daring).'],
      tindak_lanjut: ['Pengawas akan memantau implementasi RKTM melalui supervisi triwulanan.', 'Memfasilitasi sharing antar madrasah dalam implementasi RKTM.'],
      rekomendasi: ['Madrasah agar melibatkan seluruh stakeholder (komite, guru, tendik) dalam penyusunan RKTM.', 'Perlu evaluasi mid-year untuk memastikan ketercapaian target.'],
    },
    karakter: {
      tujuan: ['Mendampingi madrasah binaan dalam mengintegrasikan pendidikan karakter berbasis Profil Pelajar Pancasila Rahmatan lil ‘Alamin (P3RA) dalam pembelajaran dan budaya madrasah.'],
      uraian: ['Kegiatan meliputi: (1) sosialisasi 10 nilai P3RA; (2) pendampingan integrasi karakter dalam RPP/modul ajar; (3) observasi pembelajaran; (4) pendampingan budaya madrasah berkarakter; (5) evaluasi implementasi; (6) penyusunan laporan.'],
      hasil: ['Madrasah binaan telah mengintegrasikan nilai-nilai P3RA dalam dokumen pembelajaran dan budaya madrasah. Tersusun laporan implementasi pendidikan karakter.'],
      kendala: ['Pemahaman guru terhadap 10 nilai P3RA masih beragam.', 'Integrasi karakter belum terdokumentasi secara sistematis pada perangkat pembelajaran.'],
      solusi: ['Menyelenggarakan bimtek P3RA bersama Kepala Madrasah dan koordinator kurikulum.', 'Memberikan template RPP/modul ajar yang sudah mengintegrasikan karakter.'],
      tindak_lanjut: ['Madrasah memperkuat budaya religius dan akademik berbasis P3RA.', 'Pengawas akan memantau pembiasaan karakter melalui supervisi.'],
      rekomendasi: ['Madrasah agar mengembangkan program unggulan berbasis P3RA (misal: Jumat Berkah, Tahfidz, Bahasa Asing).', 'Perlu sinergi dengan komite dan orang tua siswa untuk penguatan karakter di rumah.'],
    },
    kolaborasi_komite: {
      tujuan: ['Mendampingi pelaksanaan kolaborasi antara Kepala Madrasah dan Komite Madrasah dalam mendukung program peningkatan mutu pendidikan.'],
      uraian: ['Kegiatan meliputi: (1) pemetaan peran komite madrasah; (2) FGD kepala madrasah dan komite; (3) pendampingan penyusunan program kolaboratif; (4) monitoring pelaksanaan; (5) evaluasi dampak; (6) penyusunan laporan.'],
      hasil: ['Tercipta kolaborasi yang efektif antara Kepala Madrasah dan Komite. Tersusun program-program bersama yang berkontribusi pada peningkatan mutu madrasah.'],
      kendala: ['Pemahaman komite terhadap peran strategisnya masih beragam.', 'Komunikasi antara madrasah dan komite belum optimal di sebagian madrasah.'],
      solusi: ['Memberikan sosialisasi peran dan fungsi komite madrasah.', 'Memfasilitasi rapat rutin antara madrasah dan komite.'],
      tindak_lanjut: ['Madrasah dan komite menyepakati program kerja kolaboratif.', 'Pengawas akan memantau pelaksanaan program kolaborasi.'],
      rekomendasi: ['Madrasah agar melibatkan komite dalam perencanaan, pelaksanaan, dan evaluasi program.', 'Perlu peningkatan kapasitas komite melalui workshop berkala.'],
    },
    organisasi_profesi: {
      tujuan: ['Meningkatkan keaktifan Pengawas Madrasah dalam organisasi profesi (Pokjawas, APSI) dan membangun jejaring kerja antar pengawas.'],
      uraian: ['Kegiatan meliputi: (1) keikutsertaan dalam rapat koordinasi Pokjawas; (2) partisipasi dalam kegiatan APSI tingkat kabupaten/provinsi; (3) sharing praktik baik antar pengawas; (4) pengembangan jejaring lintas wilayah; (5) dokumentasi kegiatan organisasi.'],
      hasil: ['Tersusun dokumen keaktifan dalam organisasi profesi (sertifikat, surat tugas, notulen rakor) dan terbangun jejaring kerja antar pengawas yang produktif.'],
      kendala: ['Keterbatasan anggaran perjalanan untuk kegiatan luar daerah.', 'Padatnya jadwal supervisi madrasah binaan.'],
      solusi: ['Mengoptimalkan kegiatan daring untuk koordinasi rutin.', 'Pengaturan jadwal yang efisien antara tugas supervisi dan kegiatan organisasi.'],
      tindak_lanjut: ['Aktif berperan dalam kepengurusan/program kerja Pokjawas dan APSI.', 'Mendiseminasikan hasil kegiatan organisasi kepada pengawas lain.'],
      rekomendasi: ['Pengawas agar mengambil peran lebih strategis dalam organisasi profesi.', 'Perlu fasilitasi anggaran kegiatan organisasi profesi dari Kankemenag.'],
    },
    reviu_kurikulum: {
      tujuan: ['Mendampingi madrasah binaan dalam menyusun/mereviu kurikulum madrasah yang mengintegrasikan Pembelajaran Mendalam dan Kurikulum Berbasis Cinta.'],
      uraian: ['Kegiatan meliputi: (1) sosialisasi konsep Pembelajaran Mendalam dan Kurikulum Berbasis Cinta; (2) workshop reviu kurikulum operasional; (3) pendampingan revisi dokumen kurikulum; (4) review oleh ahli; (5) finalisasi dan pengesahan kurikulum.'],
      hasil: ['Madrasah binaan memiliki dokumen kurikulum operasional yang telah direviu dan mengintegrasikan Pembelajaran Mendalam serta Kurikulum Berbasis Cinta. Tersusun laporan pendampingan reviu kurikulum.'],
      kendala: ['Pemahaman guru tentang Pembelajaran Mendalam masih beragam.', 'Adaptasi Kurikulum Berbasis Cinta belum merata antar madrasah.'],
      solusi: ['Menyelenggarakan bimtek bersama tim ahli kurikulum.', 'Memfasilitasi sharing dokumen kurikulum antar madrasah.'],
      tindak_lanjut: ['Madrasah mengimplementasikan kurikulum yang telah direviu.', 'Pengawas memantau implementasi melalui supervisi pembelajaran.'],
      rekomendasi: ['Madrasah agar membentuk tim pengembang kurikulum yang aktif dan kompeten.', 'Perlu pendampingan berkelanjutan untuk memastikan implementasi kurikulum berjalan baik.'],
    },
    monev_kurikulum: {
      tujuan: ['Melakukan pembinaan, pendampingan, monitoring, dan evaluasi terhadap pengembangan perangkat kurikulum madrasah binaan.'],
      uraian: ['Kegiatan meliputi: (1) penyiapan instrumen monev; (2) kunjungan ke madrasah binaan; (3) studi dokumen perangkat kurikulum; (4) wawancara dengan tim kurikulum; (5) observasi implementasi; (6) penyusunan laporan monev.'],
      hasil: ['Tersusun laporan monev pengembangan perangkat kurikulum madrasah yang memuat capaian, gap, dan rekomendasi pengembangan.'],
      kendala: ['Pengembangan perangkat kurikulum belum sepenuhnya konsisten dengan kerangka dasar.', 'Beberapa madrasah belum melakukan reviu berkala.'],
      solusi: ['Memberikan pendampingan intensif dan contoh praktik baik.', 'Mendorong madrasah membentuk tim kurikulum yang konsisten melakukan reviu.'],
      tindak_lanjut: ['Madrasah memperbaiki perangkat kurikulum sesuai rekomendasi.', 'Pengawas akan memantau implementasi perbaikan.'],
      rekomendasi: ['Madrasah agar konsisten melakukan reviu kurikulum minimal setiap tahun ajaran.', 'Perlu dukungan workshop kurikulum berkelanjutan dari Kankemenag.'],
    },
    akreditasi: {
      tujuan: ['Mendampingi madrasah binaan dalam pemenuhan standar akreditasi melalui pembinaan tata kelola madrasah yang akuntabel dan berbasis mutu.'],
      uraian: ['Kegiatan meliputi: (1) sosialisasi instrumen akreditasi terkini; (2) pemetaan kesiapan madrasah; (3) pendampingan penyusunan dokumen akreditasi; (4) simulasi visitasi; (5) pendampingan visitasi; (6) tindak lanjut hasil.'],
      hasil: ['Madrasah binaan memiliki kesiapan dokumen dan tata kelola yang lebih baik untuk menghadapi visitasi akreditasi. Beberapa madrasah berhasil mempertahankan/meningkatkan peringkat akreditasi.'],
      kendala: ['Dokumen akreditasi pada beberapa madrasah belum terorganisasi dengan baik.', 'Pemahaman terhadap instrumen akreditasi masih beragam.'],
      solusi: ['Memberikan template dokumen akreditasi.', 'Menyelenggarakan workshop akreditasi bersama asesor.'],
      tindak_lanjut: ['Madrasah menjalani visitasi sesuai jadwal BAN-S/M.', 'Madrasah menindaklanjuti rekomendasi hasil akreditasi.'],
      rekomendasi: ['Madrasah agar menjadikan akreditasi sebagai instrumen perbaikan mutu, bukan sekedar administratif.', 'Perlu pembentukan tim mutu madrasah yang aktif sepanjang tahun.'],
    },
    supervisi_klinis: {
      tujuan: ['Melakukan pendampingan klinis terhadap penerapan Pembelajaran Mendalam melalui supervisi akademik kepada guru madrasah binaan.'],
      uraian: ['Kegiatan meliputi: (1) pra-observasi (kontrak supervisi, telaah RPP/modul ajar); (2) observasi pembelajaran; (3) pasca-observasi (refleksi guru, umpan balik pengawas); (4) penyusunan rencana perbaikan; (5) follow-up; (6) penyusunan laporan supervisi klinis.'],
      hasil: ['Guru madrasah binaan memperoleh umpan balik yang konstruktif untuk perbaikan praktik pembelajaran. Tersusun laporan supervisi klinis dengan rekomendasi pengembangan profesional.'],
      kendala: ['Beberapa guru masih kurang percaya diri saat diobservasi.', 'Penerapan Pembelajaran Mendalam belum optimal pada semua mata pelajaran.'],
      solusi: ['Membangun rapport dan kontrak supervisi yang setara.', 'Memberikan contoh praktik baik Pembelajaran Mendalam.'],
      tindak_lanjut: ['Guru menyusun rencana perbaikan dan mengimplementasikannya.', 'Pengawas memantau implementasi rencana perbaikan.'],
      rekomendasi: ['Madrasah agar menjadikan supervisi klinis sebagai bagian dari budaya pengembangan profesional.', 'Perlu peer-supervision antar guru untuk memperkuat refleksi.'],
    },
    evaluasi_kebijakan: {
      tujuan: ['Mengevaluasi implementasi kebijakan kurikulum pada madrasah binaan untuk menilai efektivitas dan memberikan rekomendasi penyempurnaan.'],
      uraian: ['Kegiatan meliputi: (1) penyiapan instrumen evaluasi kebijakan; (2) pengumpulan data; (3) analisis implementasi; (4) FGD dengan stakeholder; (5) penyusunan laporan evaluasi; (6) sosialisasi hasil.'],
      hasil: ['Tersusun laporan evaluasi implementasi kebijakan kurikulum yang memuat tingkat capaian, faktor pendukung, hambatan, dan rekomendasi penyempurnaan.'],
      kendala: ['Implementasi kebijakan kurikulum belum sepenuhnya merata.', 'Beberapa kebijakan baru memerlukan adaptasi yang lebih panjang.'],
      solusi: ['Memberikan pendampingan intensif pada madrasah yang masih lambat adaptasi.', 'Sharing praktik baik dari madrasah berkinerja tinggi.'],
      tindak_lanjut: ['Madrasah memperbaiki implementasi sesuai rekomendasi.', 'Hasil evaluasi diteruskan ke Kankemenag sebagai bahan kebijakan.'],
      rekomendasi: ['Kankemenag perlu memberikan dukungan teknis berkelanjutan untuk implementasi kebijakan.', 'Madrasah agar melakukan evaluasi internal secara berkala.'],
    },
    sekolah_unggul: {
      tujuan: ['Mendampingi madrasah binaan dalam pemenuhan standar Satuan Pendidikan Unggul.'],
      uraian: ['Kegiatan meliputi: (1) sosialisasi kriteria sekolah/madrasah unggul; (2) pemetaan kesiapan madrasah; (3) pendampingan pemenuhan standar; (4) monitoring pelaksanaan; (5) evaluasi capaian; (6) penyusunan laporan.'],
      hasil: ['Madrasah binaan memperoleh peta jalan menuju Satuan Pendidikan Unggul. Tersusun laporan pendampingan dengan rekomendasi pengembangan.'],
      kendala: ['Standar Satuan Pendidikan Unggul memerlukan investasi sumber daya yang signifikan.', 'Belum semua madrasah memahami kriteria secara mendalam.'],
      solusi: ['Memfasilitasi sharing dengan madrasah yang sudah unggul.', 'Mendorong pemanfaatan dana BOS dan kemitraan untuk pemenuhan standar.'],
      tindak_lanjut: ['Madrasah menyusun rencana pengembangan menuju Satuan Pendidikan Unggul.', 'Pengawas memantau progress secara berkala.'],
      rekomendasi: ['Madrasah agar fokus pada keunggulan spesifik sebagai brand.', 'Perlu dukungan kebijakan dan fasilitasi dari Kankemenag.'],
    },
    bilingual: {
      tujuan: ['Mendampingi madrasah binaan dalam mengembangkan program pendidikan bilingual sebagai keunggulan layanan.'],
      uraian: ['Kegiatan meliputi: (1) pemetaan kesiapan madrasah untuk program bilingual; (2) pendampingan penyusunan kurikulum bilingual; (3) pendampingan pengembangan kompetensi guru bahasa; (4) monitoring implementasi; (5) evaluasi dampak.'],
      hasil: ['Madrasah binaan memiliki kerangka program pendidikan bilingual. Guru bahasa memperoleh peningkatan kompetensi pedagogi.'],
      kendala: ['Kompetensi bahasa Inggris/Arab guru beragam.', 'Sumber daya pembelajaran bilingual masih terbatas.'],
      solusi: ['Memfasilitasi peningkatan kompetensi guru melalui kursus/training bahasa.', 'Mendorong kemitraan dengan lembaga bahasa.'],
      tindak_lanjut: ['Madrasah mengimplementasikan program bilingual secara bertahap.', 'Pengawas memantau capaian pembelajaran.'],
      rekomendasi: ['Madrasah agar memulai dengan mata pelajaran tertentu sebelum scale-up.', 'Perlu dukungan teknis dan finansial dari Kankemenag.'],
    },
    prestasi_siswa: {
      tujuan: ['Mendampingi madrasah binaan dalam mengembangkan prestasi peserta didik baik akademik maupun non-akademik.'],
      uraian: ['Kegiatan meliputi: (1) pemetaan potensi siswa; (2) pendampingan penyusunan program pembinaan prestasi; (3) pendampingan persiapan kompetisi (KSM, PORSEMA, dll); (4) monitoring partisipasi; (5) evaluasi capaian.'],
      hasil: ['Madrasah binaan mengirim siswa berprestasi pada berbagai ajang kompetisi. Tersusun laporan pengembangan prestasi peserta didik.'],
      kendala: ['Pembinaan prestasi belum sistematis di sebagian madrasah.', 'Keterbatasan pelatih dan sarana latihan.'],
      solusi: ['Mendorong madrasah membentuk tim pembina prestasi.', 'Mendorong kemitraan dengan klub/lembaga eksternal.'],
      tindak_lanjut: ['Madrasah menyusun program pembinaan prestasi tahunan.', 'Pengawas memantau partisipasi madrasah pada ajang prestasi.'],
      rekomendasi: ['Madrasah agar memberikan apresiasi kepada siswa berprestasi.', 'Perlu dukungan dana pembinaan prestasi dari Kankemenag.'],
    },
    profesionalisme_guru: {
      tujuan: ['Mendampingi peningkatan profesionalisme guru madrasah binaan melalui kegiatan pengembangan keprofesian berkelanjutan (PKB).'],
      uraian: ['Kegiatan meliputi: (1) pemetaan kebutuhan PKB guru; (2) pendampingan penyusunan rencana PKB; (3) fasilitasi pelaksanaan PKB (workshop, KKG/MGMP, in-house training); (4) monitoring partisipasi; (5) evaluasi dampak.'],
      hasil: ['Guru madrasah binaan memperoleh peningkatan kompetensi melalui kegiatan PKB. Tersusun laporan pembinaan profesionalisme guru.'],
      kendala: ['Partisipasi PKB belum merata.', 'Ketersediaan waktu guru untuk PKB seringkali terbatas.'],
      solusi: ['Mendorong KKG/MGMP madrasah lebih aktif.', 'Memanfaatkan moda daring untuk fleksibilitas waktu.'],
      tindak_lanjut: ['Guru menerapkan hasil PKB dalam pembelajaran.', 'Pengawas memantau dampak PKB melalui supervisi pembelajaran.'],
      rekomendasi: ['Madrasah agar mengalokasikan dana BOS untuk kegiatan PKB.', 'Perlu sistem dokumentasi PKB yang sistematis.'],
    },
    evaluasi_dampak: {
      tujuan: ['Mengumpulkan data, menganalisis hasil pendampingan, dan mengevaluasi dampak pendampingan terhadap mutu madrasah binaan.'],
      uraian: ['Kegiatan meliputi: (1) penyiapan instrumen pengumpulan data; (2) pengumpulan data primer dan sekunder; (3) analisis kuantitatif dan kualitatif; (4) penyusunan laporan evaluasi dampak; (5) diseminasi hasil.'],
      hasil: ['Tersusun dokumen pengumpulan data, analisis hasil pendampingan, dan evaluasi dampak yang menjadi bahan refleksi dan perencanaan tahun berikutnya.'],
      kendala: ['Beberapa data dampak bersifat kualitatif dan memerlukan instrumen yang tepat.', 'Pengumpulan data lapangan memerlukan waktu yang panjang.'],
      solusi: ['Menggunakan triangulasi metode (observasi, wawancara, studi dokumen).', 'Memanfaatkan teknologi (formulir daring) untuk efisiensi pengumpulan data.'],
      tindak_lanjut: ['Hasil evaluasi dijadikan dasar penyusunan program pendampingan tahun berikutnya.', 'Diseminasi hasil kepada Kankemenag dan stakeholder.'],
      rekomendasi: ['Perlu sistem evaluasi dampak yang berkelanjutan.', 'Hasil evaluasi agar dipublikasikan sebagai bagian akuntabilitas publik.'],
    },
    best_practice: {
      tujuan: ['Mengembangkan karya inovasi atau best practice kepengawasan berbasis Kepemimpinan Kasih Sayang sebagai kontribusi pengembangan profesi.'],
      uraian: ['Kegiatan meliputi: (1) identifikasi praktik baik kepengawasan; (2) dokumentasi proses dan hasil; (3) penyusunan naskah best practice; (4) review oleh peer; (5) finalisasi karya; (6) diseminasi.'],
      hasil: ['Tersusun 1 (satu) dokumen karya inovasi/best practice kepengawasan berbasis Kepemimpinan Kasih Sayang yang dapat menjadi referensi pengawas lain.'],
      kendala: ['Waktu untuk menulis karya inovasi seringkali terbatas di antara tugas rutin.', 'Standar penulisan karya inovasi memerlukan ketelitian.'],
      solusi: ['Mengalokasikan waktu khusus untuk menulis di luar agenda supervisi.', 'Berkonsultasi dengan rekan pengawas dan akademisi.'],
      tindak_lanjut: ['Karya didiseminasikan melalui forum Pokjawas dan APSI.', 'Karya diajukan untuk dipublikasikan di jurnal/forum nasional.'],
      rekomendasi: ['Pengawas agar konsisten mendokumentasikan praktik baik kepengawasannya.', 'Perlu wadah publikasi karya inovasi pengawas.'],
    },
    kebutuhan_guru: {
      tujuan: ['Membina dan mendampingi madrasah binaan dalam perencanaan kebutuhan guru yang sesuai dengan kompetensi dan beban kerja.'],
      uraian: ['Kegiatan meliputi: (1) pemetaan ketersediaan dan kebutuhan guru; (2) analisis kesesuaian kompetensi-beban kerja; (3) pendampingan penyusunan usulan kebutuhan; (4) monitoring tindak lanjut; (5) penyusunan laporan.'],
      hasil: ['Tersusun laporan pembinaan perencanaan kebutuhan guru yang menjadi dasar usulan formasi guru ke Kankemenag.'],
      kendala: ['Ketidaksesuaian latar belakang akademik guru dengan mata pelajaran masih ditemukan.', 'Beban mengajar belum proporsional di sebagian madrasah.'],
      solusi: ['Mendorong madrasah menyusun analisis kebutuhan guru secara akurat.', 'Mengusulkan rotasi/penambahan guru sesuai kebutuhan.'],
      tindak_lanjut: ['Madrasah mengusulkan kebutuhan guru kepada Kankemenag.', 'Pengawas memantau realisasi pemenuhan kebutuhan guru.'],
      rekomendasi: ['Madrasah agar menyusun perencanaan kebutuhan guru jangka menengah.', 'Perlu dukungan kebijakan distribusi guru dari Kankemenag.'],
    },
    kompetensi_tendik: {
      tujuan: ['Membina, mendampingi, memonitor, dan mengevaluasi pemenuhan kualifikasi dan kompetensi tenaga kependidikan madrasah binaan.'],
      uraian: ['Kegiatan meliputi: (1) pemetaan kualifikasi dan kompetensi tendik; (2) identifikasi gap; (3) pendampingan peningkatan kompetensi; (4) monitoring partisipasi pengembangan; (5) evaluasi capaian.'],
      hasil: ['Tersusun laporan pembinaan tendik yang memuat profil kompetensi, gap, dan rekomendasi pengembangan. Tendik memperoleh kesempatan peningkatan kompetensi.'],
      kendala: ['Kualifikasi tendik beragam, beberapa belum sesuai standar.', 'Akses pelatihan tendik masih terbatas.'],
      solusi: ['Mendorong tendik mengikuti pelatihan teknis sesuai bidang.', 'Memfasilitasi sharing antar tendik madrasah.'],
      tindak_lanjut: ['Tendik mengikuti program peningkatan kompetensi.', 'Pengawas memantau dampak peningkatan kompetensi tendik.'],
      rekomendasi: ['Madrasah agar memberikan kesempatan pengembangan diri bagi tendik.', 'Perlu fasilitasi pelatihan tendik dari Kankemenag.'],
    },
    sertifikasi_guru: {
      tujuan: ['Mendampingi pemenuhan sertifikasi guru agama madrasah binaan agar memenuhi standar kualifikasi profesional.'],
      uraian: ['Kegiatan meliputi: (1) pemetaan status sertifikasi guru agama; (2) pendampingan persiapan sertifikasi; (3) pendampingan pengisian dokumen sertifikasi; (4) monitoring pelaksanaan; (5) evaluasi.'],
      hasil: ['Guru agama madrasah binaan memperoleh pendampingan untuk pemenuhan sertifikasi. Tersusun laporan pendampingan sertifikasi.'],
      kendala: ['Beberapa guru agama belum memenuhi syarat administratif sertifikasi.', 'Kuota sertifikasi terbatas.'],
      solusi: ['Pendampingan administratif intensif.', 'Koordinasi dengan Kankemenag untuk prioritas guru madrasah binaan.'],
      tindak_lanjut: ['Guru mengikuti tahapan sertifikasi sesuai jadwal.', 'Pengawas memantau capaian sertifikasi.'],
      rekomendasi: ['Madrasah agar membantu kelengkapan dokumen guru.', 'Perlu sosialisasi tata cara sertifikasi yang lebih masif.'],
    },
    ppg: {
      tujuan: ['Mendampingi guru madrasah binaan dalam persiapan Pendidikan Profesi Guru (PPG) sebagai jalur peningkatan profesionalisme.'],
      uraian: ['Kegiatan meliputi: (1) pemetaan guru calon PPG; (2) sosialisasi tata cara PPG; (3) pendampingan persiapan administratif; (4) pendampingan substansi (uji kompetensi); (5) monitoring kelulusan.'],
      hasil: ['Guru madrasah binaan memperoleh kesiapan administratif dan substantif untuk mengikuti PPG. Tersusun laporan pendampingan PPG.'],
      kendala: ['Materi uji kompetensi PPG cukup luas.', 'Waktu persiapan PPG bersamaan dengan tugas mengajar.'],
      solusi: ['Memfasilitasi try-out uji kompetensi PPG.', 'Mendorong KKG/MGMP fokus pada penguatan substansi.'],
      tindak_lanjut: ['Guru mengikuti PPG sesuai jadwal LPTK.', 'Pengawas memantau kelulusan PPG.'],
      rekomendasi: ['Madrasah agar memberikan dispensasi waktu bagi guru yang mengikuti PPG.', 'Perlu peningkatan kuota PPG bagi guru madrasah.'],
    },
    ekstrakurikuler: {
      tujuan: ['Mendampingi madrasah binaan dalam mengembangkan kegiatan ekstrakurikuler yang berkualitas dan berdampak pada karakter siswa.'],
      uraian: ['Kegiatan meliputi: (1) pemetaan ekstrakurikuler madrasah; (2) pendampingan penyusunan program ekstra; (3) pendampingan pelaksanaan; (4) monitoring partisipasi siswa; (5) evaluasi.'],
      hasil: ['Madrasah binaan memiliki program ekstrakurikuler yang berkualitas, terjadwal, dan diikuti aktif oleh siswa. Tersusun laporan pengembangan ekstrakurikuler.'],
      kendala: ['Pelatih/pembina ekstra terbatas.', 'Sarana ekstra di sebagian madrasah masih terbatas.'],
      solusi: ['Mendorong kemitraan dengan klub/lembaga eksternal sebagai pelatih.', 'Memanfaatkan dana BOS untuk pengadaan sarana minimal.'],
      tindak_lanjut: ['Madrasah memantau pelaksanaan ekstra secara berkala.', 'Pengawas memantau dampak ekstra pada karakter siswa.'],
      rekomendasi: ['Madrasah agar memprioritaskan ekstra unggulan sebagai brand.', 'Perlu dukungan dari komite dan orang tua.'],
    },
    monev_guru_agama: {
      tujuan: ['Memonitor dan menganalisis kebutuhan guru agama pada madrasah binaan untuk pemenuhan kebutuhan secara proporsional.'],
      uraian: ['Kegiatan meliputi: (1) penyiapan instrumen monev; (2) pengumpulan data jumlah dan kualifikasi guru agama; (3) analisis kebutuhan; (4) penyusunan instrumen monev; (5) penyusunan laporan.'],
      hasil: ['Tersusun instrumen monitoring dan analisis kebutuhan guru agama yang dapat digunakan oleh Kankemenag untuk perencanaan distribusi guru agama.'],
      kendala: ['Distribusi guru agama belum merata antar madrasah.', 'Beberapa madrasah kekurangan guru mata pelajaran agama tertentu.'],
      solusi: ['Mendorong rotasi guru agama antar madrasah.', 'Mengusulkan rekrutmen guru agama sesuai kebutuhan.'],
      tindak_lanjut: ['Hasil monev diteruskan ke Kankemenag.', 'Pengawas memantau realisasi pemenuhan kebutuhan.'],
      rekomendasi: ['Perlu kebijakan distribusi guru agama yang lebih proporsional.', 'Madrasah agar mengoptimalkan guru agama yang ada.'],
    },
    pengembangan_diri: {
      tujuan: ['Meningkatkan kompetensi pengawas melalui kegiatan pengembangan diri (workshop, pelatihan, seminar) sebagai bentuk pengembangan profesi.'],
      uraian: ['Kegiatan meliputi: (1) identifikasi kegiatan pengembangan diri; (2) keikutsertaan dalam workshop/pelatihan/seminar; (3) penyusunan laporan kegiatan; (4) pengumpulan sertifikat dan surat tugas; (5) implementasi hasil pengembangan diri.'],
      hasil: ['Pengawas memperoleh peningkatan kompetensi dan dokumen pengembangan diri (sertifikat, laporan, surat tugas) sesuai standar AK.'],
      kendala: ['Keterbatasan anggaran perjalanan untuk kegiatan luar daerah.', 'Padatnya jadwal supervisi.'],
      solusi: ['Mengoptimalkan kegiatan daring.', 'Mengatur jadwal yang efisien.'],
      tindak_lanjut: ['Mengimplementasikan hasil pengembangan diri dalam tugas kepengawasan.', 'Mendiseminasikan hasil kepada pengawas lain.'],
      rekomendasi: ['Pengawas agar konsisten mengikuti kegiatan pengembangan diri.', 'Perlu fasilitasi anggaran pengembangan diri dari Kankemenag.'],
    },
    karya_inovatif: {
      tujuan: ['Mengembangkan karya inovatif berupa aplikasi pendampingan kepengawasan sebagai kontribusi peningkatan efektivitas tugas.'],
      uraian: ['Kegiatan meliputi: (1) identifikasi kebutuhan aplikasi; (2) perancangan aplikasi; (3) pengembangan aplikasi; (4) uji coba; (5) penyusunan laporan; (6) implementasi.'],
      hasil: ['Tersusun aplikasi pendampingan kepengawasan beserta laporan pengembangannya, yang dapat membantu efektivitas tugas pengawas.'],
      kendala: ['Pengembangan aplikasi memerlukan keterampilan teknis.', 'Waktu pengembangan terbatas di antara tugas rutin.'],
      solusi: ['Berkolaborasi dengan pengembang/komunitas IT.', 'Mengalokasikan waktu khusus untuk pengembangan.'],
      tindak_lanjut: ['Aplikasi diuji coba pada madrasah binaan.', 'Aplikasi didiseminasikan ke pengawas lain.'],
      rekomendasi: ['Pengawas agar mengoptimalkan teknologi dalam tugas kepengawasan.', 'Perlu wadah berbagi karya inovatif antar pengawas.'],
    },
    publikasi_ilmiah: {
      tujuan: ['Menghasilkan karya publikasi ilmiah (buku, makalah, jurnal, PTKP) sebagai kontribusi pengembangan profesi pengawas.'],
      uraian: ['Kegiatan meliputi: (1) pemilihan topik publikasi; (2) studi literatur; (3) penulisan naskah; (4) review oleh peer/editor; (5) publikasi; (6) diseminasi.'],
      hasil: ['Tersusun karya publikasi ilmiah (buku/makalah/jurnal/PTKP) yang dipublikasikan dan dapat menjadi referensi bagi pengawas dan praktisi pendidikan.'],
      kendala: ['Standar penulisan karya ilmiah memerlukan ketelitian.', 'Akses publikasi pada jurnal terakreditasi cukup ketat.'],
      solusi: ['Berkonsultasi dengan akademisi/peer reviewer.', 'Memanfaatkan jurnal Kemenag dan jurnal organisasi profesi.'],
      tindak_lanjut: ['Karya didiseminasikan dalam forum ilmiah.', 'Karya menjadi referensi praktik kepengawasan.'],
      rekomendasi: ['Pengawas agar konsisten menulis karya ilmiah berbasis pengalaman lapangan.', 'Perlu wadah publikasi yang lebih variatif.'],
    },
    monev_umum: {
      tujuan: ['Melakukan monitoring dan evaluasi pelaksanaan {RHK_AKSI} pada madrasah binaan.'],
      uraian: ['Kegiatan meliputi: (1) penyiapan instrumen monev; (2) kunjungan ke madrasah binaan; (3) pengumpulan data dan studi dokumen; (4) wawancara dengan kepala madrasah dan guru; (5) observasi implementasi; (6) penyusunan laporan monev.'],
      hasil: ['Tersusun laporan monev yang memuat capaian, faktor pendukung, hambatan, dan rekomendasi tindak lanjut. Madrasah memperoleh masukan substantif untuk perbaikan.'],
      kendala: ['Implementasi belum sepenuhnya merata antar madrasah.', 'Dokumentasi pelaksanaan di sebagian madrasah belum sistematis.'],
      solusi: ['Memberikan pendampingan intensif pada madrasah yang masih lambat.', 'Memberikan template dokumentasi.'],
      tindak_lanjut: ['Madrasah memperbaiki sesuai rekomendasi.', 'Pengawas memantau implementasi perbaikan.'],
      rekomendasi: ['Madrasah agar konsisten melakukan evaluasi internal.', 'Perlu dukungan kebijakan dari Kankemenag.'],
    },
    pendampingan_umum: {
      tujuan: ['Melakukan pendampingan terkait {RHK_NAMA} pada madrasah binaan.'],
      uraian: ['Kegiatan meliputi: (1) sosialisasi/penyamaan persepsi; (2) pemetaan kondisi awal; (3) pendampingan substantif; (4) monitoring implementasi; (5) evaluasi capaian; (6) penyusunan laporan pendampingan.'],
      hasil: ['Madrasah binaan memperoleh pendampingan yang sistematis dan tersusun laporan pendampingan dengan rekomendasi tindak lanjut.'],
      kendala: ['Keberagaman kondisi awal madrasah memerlukan pendekatan diferensial.', 'Keterbatasan waktu pendampingan langsung.'],
      solusi: ['Pendampingan secara blended (luring + daring).', 'Memfasilitasi sharing antar madrasah.'],
      tindak_lanjut: ['Madrasah mengimplementasikan hasil pendampingan.', 'Pengawas memantau dampak pendampingan.'],
      rekomendasi: ['Madrasah agar konsisten dalam implementasi.', 'Perlu pendampingan berkelanjutan.'],
    },
    pembinaan_umum: {
      tujuan: ['Melakukan pembinaan terkait {RHK_NAMA} kepada madrasah binaan.'],
      uraian: ['Kegiatan meliputi: (1) pemetaan kondisi awal; (2) penyiapan materi pembinaan; (3) pelaksanaan pembinaan; (4) tindak lanjut; (5) monitoring; (6) penyusunan laporan.'],
      hasil: ['Madrasah binaan memperoleh pembinaan yang terarah dan tersusun laporan pembinaan dengan rekomendasi.'],
      kendala: ['Kondisi madrasah beragam.', 'Keterbatasan waktu.'],
      solusi: ['Pendekatan diferensial sesuai kondisi madrasah.', 'Optimalisasi moda daring.'],
      tindak_lanjut: ['Madrasah menindaklanjuti hasil pembinaan.', 'Pengawas memantau implementasi.'],
      rekomendasi: ['Madrasah agar konsisten dalam tindak lanjut.', 'Perlu pembinaan berkala.'],
    },
    umum: {
      tujuan: ['Melaksanakan kegiatan {RHK_NAMA} sesuai indikator kinerja yang telah ditetapkan.'],
      uraian: ['Kegiatan dilaksanakan secara sistematis meliputi tahapan persiapan, pelaksanaan, monitoring, evaluasi, dan pelaporan.'],
      hasil: ['Kegiatan {RHK_NAMA} terlaksana sesuai rencana dengan capaian indikator yang memadai.'],
      kendala: ['Kondisi lapangan yang beragam memerlukan penyesuaian metode pelaksanaan.'],
      solusi: ['Penyesuaian metode dan pendekatan sesuai dinamika lapangan.'],
      tindak_lanjut: ['Hasil kegiatan ditindaklanjuti melalui pendampingan dan monitoring lebih lanjut.'],
      rekomendasi: ['Madrasah agar terus meningkatkan implementasi sesuai standar.', 'Perlu dukungan kebijakan berkelanjutan dari Kankemenag.'],
    },
  };

  // ===== Generic fallback varians (cadangan kalau kategori belum punya 5 varian) =====
  const GENERIC_PADDING = {
    tujuan: [
      'Melaksanakan {RHK_NAMA} sebagai bagian dari tugas pokok Pengawas Madrasah dalam meningkatkan mutu layanan pendidikan pada madrasah binaan, sesuai indikator kinerja Perdirjen GTK Nomor 7328 Tahun 2023.',
      'Memberikan pendampingan teknis dan substantif terkait {RHK_NAMA} kepada Kepala Madrasah, guru, dan tenaga kependidikan madrasah binaan agar tercapai standar mutu yang diharapkan.',
      'Menjamin keterlaksanaan {RHK_NAMA} dengan baik melalui kegiatan supervisi, monitoring, dan evaluasi yang sistematis serta berkelanjutan.',
      'Mendorong implementasi {RHK_NAMA} pada madrasah binaan secara terintegrasi dengan Kurikulum Berbasis Cinta dan Profil Pelajar Pancasila Rahmatan lil Alamin.',
      'Membangun budaya kerja kolaboratif antara pengawas, kepala madrasah, dan guru dalam pelaksanaan {RHK_NAMA} demi peningkatan mutu pendidikan madrasah.',
    ],
    uraian: [
      'Kegiatan dilaksanakan dalam beberapa tahap: (1) persiapan dan koordinasi awal; (2) penyiapan instrumen dan bahan kerja; (3) pelaksanaan teknis di madrasah binaan; (4) pengumpulan data dan dokumentasi; (5) analisis dan refleksi; (6) penyusunan laporan dan tindak lanjut.',
      'Pelaksanaan kegiatan menggunakan pendekatan blended (luring + daring), meliputi: rapat koordinasi awal, kunjungan lapangan ke madrasah binaan, observasi langsung, wawancara dengan stakeholder, studi dokumentasi, FGD, dan penyusunan rekomendasi.',
      'Tahapan kegiatan: (a) studi pendahuluan terhadap regulasi dan kebijakan terkait; (b) penyiapan instrumen kerja; (c) sosialisasi dan koordinasi dengan kepala madrasah; (d) pelaksanaan teknis sesuai jadwal; (e) monitoring dan supervisi proses; (f) evaluasi capaian; (g) penyusunan laporan final.',
      'Kegiatan dimulai dengan pemetaan kondisi awal madrasah binaan, dilanjutkan penyusunan instrumen, kunjungan lapangan untuk pengumpulan data primer, FGD bersama Kepala Madrasah dan tim, analisis hasil, hingga finalisasi dan diseminasi laporan.',
      'Pendekatan pelaksanaan: (1) preparasi (penyiapan instrumen, agenda, surat tugas); (2) eksekusi (pertemuan, observasi, wawancara, studi dokumen); (3) elaborasi (analisis, FGD, refleksi); (4) konsolidasi (penyusunan laporan dan rekomendasi); (5) diseminasi (sosialisasi hasil ke stakeholder terkait).',
    ],
    hasil: [
      'Kegiatan {RHK_NAMA} terlaksana sesuai rencana dengan capaian yang memadai. Tersusun dokumen/laporan yang menjadi bukti pelaksanaan dan dasar tindak lanjut pada periode berikutnya.',
      'Madrasah binaan memperoleh pendampingan dan masukan substantif terkait {RHK_NAMA}. Tersusun laporan kegiatan yang memuat temuan, rekomendasi, dan rencana tindak lanjut.',
      'Tercapainya output kegiatan berupa dokumen pelaksanaan, dokumentasi proses, dan rumusan rekomendasi tindak lanjut yang dapat menjadi acuan perbaikan berkelanjutan di madrasah binaan.',
      'Pelaksanaan {RHK_NAMA} menghasilkan peningkatan pemahaman dan kapasitas Kepala Madrasah, guru, dan tenaga kependidikan, serta tersedianya dokumen administratif kegiatan secara lengkap.',
      'Tersusun laporan komprehensif {RHK_NAMA} yang memuat: (1) latar belakang dan tujuan; (2) deskripsi pelaksanaan; (3) capaian dan indikator keberhasilan; (4) kendala dan solusi; (5) rekomendasi tindak lanjut; (6) lampiran dokumentasi.',
    ],
    kendala: [
      'Keterbatasan waktu dan jadwal yang berhimpitan dengan agenda madrasah maupun agenda dinas lainnya.',
      'Geografis madrasah binaan yang tersebar memerlukan mobilitas tinggi dan biaya perjalanan yang tidak sedikit.',
      'Variasi kondisi awal antar madrasah memerlukan pendekatan diferensial yang berbeda-beda.',
      'Dukungan sarana prasarana dan SDM pada beberapa madrasah masih perlu ditingkatkan.',
      'Pemahaman dan komitmen sebagian stakeholder terhadap {RHK_NAMA} masih perlu diperkuat melalui sosialisasi yang berkelanjutan.',
    ],
    solusi: [
      'Mengoptimalkan komunikasi daring (grup WhatsApp/Zoom) untuk koordinasi rutin sehingga efisiensi waktu meningkat.',
      'Menyusun jadwal kunjungan yang efisien dengan pengelompokan madrasah berdasarkan kedekatan geografis.',
      'Menerapkan pendekatan diferensial sesuai karakteristik dan kebutuhan masing-masing madrasah.',
      'Memfasilitasi sharing praktik baik antar madrasah binaan agar madrasah dengan kondisi terbatas dapat belajar dari yang sudah maju.',
      'Melakukan sosialisasi berjenjang dan berulang sehingga pemahaman seluruh stakeholder meningkat secara bertahap.',
    ],
    tindak_lanjut: [
      'Menyusun rencana aksi tindak lanjut bersama Kepala Madrasah berdasarkan rekomendasi yang dihasilkan.',
      'Pengawas akan memantau implementasi rekomendasi melalui supervisi dan monev pada periode berikutnya.',
      'Menjadwalkan pertemuan koordinasi lanjutan untuk memastikan keberlanjutan kegiatan.',
      'Mendiseminasikan hasil kegiatan kepada Kankemenag dan stakeholder terkait sebagai bahan pertimbangan kebijakan.',
      'Mendokumentasikan seluruh proses dan hasil sebagai bahan refleksi dan acuan penyusunan program tahun berikutnya.',
    ],
    rekomendasi: [
      'Madrasah binaan agar konsisten mengimplementasikan hasil kegiatan dan menjadikannya bagian dari budaya kerja sehari-hari.',
      'Kepala Madrasah perlu mengoptimalkan peran tim kerja dan memberdayakan seluruh sumber daya yang ada untuk mendukung keberlanjutan program.',
      'Kankemenag perlu memberikan dukungan kebijakan, fasilitasi pelatihan, dan alokasi anggaran yang memadai untuk mendukung pelaksanaan {RHK_NAMA}.',
      'Pengawas Madrasah agar konsisten melakukan pembinaan dan pendampingan secara berkala dengan pendekatan yang reflektif dan berorientasi pada peningkatan mutu.',
      'Perlu sinergi yang lebih kuat antara madrasah, komite, orang tua siswa, dan masyarakat dalam mendukung keberlanjutan dan peningkatan mutu {RHK_NAMA}.',
    ],
  };

  // ===== Public API =====
  function fillPlaceholders(text, rhk) {
    return text
      .replace(/\{RHK_NAMA\}/g, (rhk && rhk.nama_eviden) || 'kegiatan kepengawasan')
      .replace(/\{RHK_AKSI\}/g, (rhk && rhk.rencana_aksi) || 'pendampingan')
      .replace(/\{INDIKATOR\}/g, (rhk && rhk.indikator_kuantitas) || '');
  }

  function getTemplate(rhk, field, varianIdx) {
    const arr = getAllVarians(rhk, field);
    const idx = Math.max(0, Math.min(arr.length - 1, varianIdx || 0));
    return arr[idx] || '';
  }

  function getAllVarians(rhk, field) {
    const kat = detectKategori(rhk);
    const lib = LIB[kat] || LIB.umum;
    const specific = (lib[field] && lib[field].length ? lib[field] : []);
    const generic = GENERIC_PADDING[field] || [];
    // Gabung: specific dulu, lalu generic untuk pad sampai minimal 5 varian.
    // Hindari duplikat persis.
    const out = [...specific];
    for (const g of generic) {
      if (out.length >= 5 && out.length >= specific.length + 2) break;
      if (!out.includes(g)) out.push(g);
      if (out.length >= 5) break;
    }
    // Final pad jika masih kurang dari 5 (kalau generic juga sedikit, ulangi LIB.umum)
    const fallback = (LIB.umum[field] || []);
    for (const f of fallback) {
      if (out.length >= 5) break;
      if (!out.includes(f)) out.push(f);
    }
    return out.map(v => fillPlaceholders(v, rhk));
  }

  function getKategori(rhk) { return detectKategori(rhk); }

  // Generate semua 7 field sekaligus
  function generateAll(rhk, varianIdx) {
    const fields = ['tujuan', 'uraian', 'hasil', 'kendala', 'solusi', 'tindak_lanjut', 'rekomendasi'];
    const out = {};
    fields.forEach(f => { out[f] = getTemplate(rhk, f, varianIdx || 0); });
    return out;
  }

  window.TemplateKegiatan = {
    detectKategori,
    getTemplate,
    getAllVarians,
    getKategori,
    generateAll,
    LIB,
  };
})();
