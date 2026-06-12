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
  bankInfo: 'BNI 0168798767 a.n. SUBARIYANTO',
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
