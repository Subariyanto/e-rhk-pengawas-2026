# E-RHK Pengawas Madrasah 2026

Aplikasi Otomatisasi Eviden RHK Pengawas Madrasah berbasis SKP Tahun 2026.

## Cara menjalankan (lokal)

```powershell
cd C:\Users\subar\.openclaw\workspace\e-rhk-pengawas-2026
node .serve.js
# buka http://localhost:5173
```

Atau gunakan Live Server / static server pilihan Anda.

## Login default

- Admin: `admin@local` / `admin123`
- Pengawas: daftar sendiri di halaman Register

## Fitur Utama

1. Login multi-user (Admin + Pengawas) dengan isolasi data per akun.
2. Identitas Pengawas (Pegawai, Pejabat Penilai, Atasan Pejabat Penilai) dengan upload Logo / TTD / Stempel.
3. Master RHK 30 item (sudah pre-seeded dari file SKP Tahun 2026 + bukti dukung lengkap).
4. Madrasah Binaan (CRUD + Import/Export Excel + Template).
5. Data Kegiatan per RHK (foto, lampiran).
6. Generator Eviden Otomatis: Cover, Pengesahan, Kata Pengantar, Daftar Isi, BAB I—IV, Surat Tugas, Undangan, Daftar Hadir, Notulen, Berita Acara, Instrumen, Rekap, Analisis, Rekomendasi, Foto Dokumentasi, Link Drive.
7. Cetak / Download per Dokumen, ZIP per RHK / Triwulan / Tahunan, Word, PDF, HTML printable.
8. Arsip Eviden + Filter + Hapus.
9. Rekapitulasi (per RHK, Triwulan, Madrasah) + Export Excel + Cetak.
10. PWA installable (offline-ready).

## Struktur Data (localStorage)

- `erhk2026_users` — daftar akun (global)
- `erhk2026_session` — sesi login
- Per user (`erhk2026_u_<userId>_*`):
  - `identitas` — identitas pengawas + kop
  - `master_rhk` — master RHK custom (kalau diedit)
  - `madrasah` — daftar madrasah binaan
  - `kegiatan` — data kegiatan
  - `eviden` — eviden yang sudah dibuat

## Stack

- Vanilla JS SPA (no framework, no build step)
- Bootstrap 5 + Bootstrap Icons (CDN)
- ExcelJS, JSZip, FileSaver, docx, jsPDF, Chart.js (CDN)
- Service Worker untuk offline / PWA

## Catatan

- Lampiran dokumen (PDF, Word) disimpan sebagai dataURL di localStorage. Untuk volume besar, gunakan link Google Drive di kolom RHK.
- DOCX export adalah konversi best-effort dari HTML; layout kompleks (margin, kolom) bisa berbeda dengan PDF.
- PDF export menggunakan jsPDF.html() — untuk kualitas terbaik gunakan tombol Cetak browser yang lebih akurat.
