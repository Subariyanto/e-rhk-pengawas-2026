// Default purchase settings yang di-bundle dengan app (dideploy ke gh-pages).
// Tujuannya: setiap pengunjung halaman /beli-lisensi (dari HP/laptop berbeda) tetap
// melihat nomor WA admin walaupun localStorage mereka kosong (admin set settings di
// localStorage admin's-browser saja, tidak ke-share lintas device).
//
// Cara update:
//   Edit file ini, commit, push ke gh-pages → semua user dapat config baru otomatis.
//   Atau, admin set via halaman Pengaturan Pembelian (override per-device di localStorage).
//
// Prioritas baca: localStorage admin > default di file ini.
window.PURCHASE_DEFAULT = {
  waNumber: '6282330647698',           // 082330647698 → normalisasi ke 62
  harga: 'Rp 100.000 (lifetime / 1 akun)',
  bankInfo: 'QRIS — SUBARIYANTO, DIGITAL & KREATIF\nNMID: ID1026531620742\n(scan QR di bawah, semua e-wallet & m-banking)\n\nAtau Transfer BNI:\nNo. Rek: 0168798767\na.n. SUBARIYANTO',
  qrisImage: 'images/qris.jpg',        // path relatif ke aset QRIS
  appName: 'e-RHK Pengawas Madrasah 2026',
  appUrl: 'https://subariyanto.github.io/e-rhk-pengawas-2026/',
  orderTemplate:
    'Halo Pak Subariyanto, saya ingin membeli Kode Aktivasi FULL aplikasi {APP}.\n\n' +
    'Nama: \nNIP: \nWilayah/KKMA: \n\n' +
    'Mohon info cara pembayarannya. Terima kasih.',
  sendTemplate:
    'Assalamualaikum Bapak/Ibu,\n\nTerima kasih sudah membeli lisensi {APP}.\n\n' +
    'Berikut Kode Aktivasi FULL Bapak/Ibu:\n\n*{KODE}*\n\n' +
    'Cara pakai:\n' +
    '1. Buka aplikasi: {URL}\n' +
    '2. Login (atau daftar pakai mode TRIAL dulu)\n' +
    '3. Klik banner kuning di dashboard → "Masukkan Kode FULL"\n' +
    '4. Tempel kode di atas → selesai ✅\n\n' +
    'Kode ini sekali pakai. Simpan baik-baik.\n\nSalam,\nSubariyanto\nKetua Pokjawas Madrasah Kab. Jember',
};

// BUNDLED CODES — kode aktivasi yang ikut dideploy ke gh-pages.
// Manfaatnya: admin generate kode di laptop, tapi user bisa aktivasi dari HP manapun
// (localStorage HP user kosong, tapi codes ini ikut load dari file ini).
//
// Pemakaian:
//   1. Admin login di laptop → Admin > Kode Aktivasi > Generate kode FULL
//   2. Salin kode hasil generate, paste ke array di bawah dengan format:
//        { code: 'FULL-XXXX-XXXX-XXXX', tier: 'full', note: 'untuk Pak Fulan' }
//   3. Commit + push ke gh-pages → dalam ~1 menit semua device bisa pakai kode ini.
//
// Kode yang sudah di-consume akan ditandai di localStorage user (per-device).
// Kode bundled ini SELALU valid lintas device sampai admin hapus dari array di bawah.
window.BUNDLED_CODES = [
  // Contoh:
  // { code: 'FULL-AB12-CD34-EF56', tier: 'full', note: 'Pak Subariyanto' },
];
