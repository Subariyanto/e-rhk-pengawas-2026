// Panduan Penggunaan Aplikasi e-RHK Pengawas Madrasah 2026
(function () {
  Page.Panduan = function () {
    UI.shell('Panduan Penggunaan', `
      <style>
        .panduan-toc a { display:block; padding:.4rem .6rem; border-radius:.4rem; color:#1E2A5A; text-decoration:none; font-size:.92rem; }
        .panduan-toc a:hover { background:#f3f4f6; }
        .panduan-toc a.active { background:#1E2A5A; color:#fff; }
        .panduan-section { scroll-margin-top: 5rem; }
        .panduan-section h3 { color:#1E2A5A; border-bottom:2px solid #D4AF37; padding-bottom:.4rem; margin-top:0; }
        .panduan-section h4 { color:#1E2A5A; margin-top:1.2rem; }
        .panduan-step { background:#f8f9fa; border-left:4px solid #1E2A5A; padding:.7rem 1rem; margin:.6rem 0; border-radius:.3rem; }
        .panduan-tip { background:#fff8e1; border-left:4px solid #D4AF37; padding:.6rem 1rem; margin:.5rem 0; border-radius:.3rem; }
        .panduan-warn { background:#fff5f5; border-left:4px solid #dc3545; padding:.6rem 1rem; margin:.5rem 0; border-radius:.3rem; }
        .panduan-print-btn { position:sticky; top:1rem; }
        @media print {
          .app-sidebar, .app-topbar, .panduan-toc-wrap, .btn, .badge { display:none !important; }
          .app-main { margin-left:0 !important; }
          .app-content { padding:0 !important; }
          .panduan-section { page-break-inside: avoid; }
        }
      </style>

      <div class="row g-3">
        <div class="col-lg-3 panduan-toc-wrap">
          <div class="card panduan-print-btn">
            <div class="card-body p-2">
              <div class="fw-bold mb-2"><i class="bi bi-list-ul"></i> Daftar Isi</div>
              <nav class="panduan-toc" id="panduanToc">
                <a href="#sec-intro">📌 Pengantar</a>
                <a href="#sec-akun">👤 Akun & Login</a>
                <a href="#sec-tier">💎 TRIAL vs FULL</a>
                <a href="#sec-setup">⚙️ Setup Awal</a>
                <a href="#sec-rhk">📋 Master RHK</a>
                <a href="#sec-madrasah">🏫 Madrasah Binaan</a>
                <a href="#sec-kegiatan">📝 Data Kegiatan</a>
                <a href="#sec-eviden">📄 Generator Eviden</a>
                <a href="#sec-rekap">📊 Rekap & Laporan</a>
                <a href="#sec-periode">📅 Periode SKP</a>
                <a href="#sec-backup">💾 Backup & Restore</a>
                <a href="#sec-faq">❓ FAQ</a>
                <a href="#sec-kontak">📞 Kontak & Lisensi</a>
              </nav>
              <hr class="my-2">
              <button class="btn btn-sm btn-outline-success w-100" onclick="window.print()"><i class="bi bi-printer"></i> Cetak Panduan</button>
            </div>
          </div>
        </div>

        <div class="col-lg-9">
          <div class="card">
            <div class="card-body">

              <section id="sec-intro" class="panduan-section">
                <h3>📌 Pengantar</h3>
                <p><strong>e-RHK Pengawas Madrasah 2026</strong> adalah aplikasi web untuk memudahkan Pengawas Madrasah dalam menyusun dan mengelola Rencana Hasil Kerja (RHK), Daftar Kegiatan, serta menghasilkan eviden/dokumen pendukung secara otomatis sesuai juknis SKP Pengawas Madrasah.</p>
                <p><strong>Fitur utama:</strong></p>
                <ul>
                  <li>Master RHK (30 jenis RHK pengawas) dengan target kuantitatif/kualitatif</li>
                  <li>Generator Eviden otomatis (13 jenis dokumen) — surat tugas, undangan, daftar hadir, notulen, dll.</li>
                  <li>Rekapitulasi & Laporan Triwulan dengan TTD digital</li>
                  <li>Backup & Restore data lokal (JSON)</li>
                  <li>Multi-user dengan tier TRIAL/FULL</li>
                </ul>
                <p><strong>Catatan penting:</strong> Semua data tersimpan di browser (localStorage). Pindah perangkat = data hilang. Wajib backup berkala via menu <em>Backup &amp; Restore</em>.</p>
              </section>

              <section id="sec-akun" class="panduan-section mt-4">
                <h3>👤 Akun & Login</h3>
                <h4>Daftar Akun Baru</h4>
                <div class="panduan-step">
                  <strong>Cara 1 — Pengawas dengan NIP:</strong>
                  <ol class="mb-0">
                    <li>Buka halaman <a href="#/register">Daftar</a></li>
                    <li>Isi NIP 18 digit. Sistem auto-lookup nama kalau NIP terdaftar.</li>
                    <li>Isi password minimal 6 karakter (& konfirmasi).</li>
                    <li>(Opsional) Isi <strong>Kode Aktivasi FULL</strong> agar langsung aktif penuh.</li>
                    <li>Klik <strong>Daftar</strong>. Login pakai NIP + password.</li>
                  </ol>
                </div>
                <div class="panduan-step">
                  <strong>Cara 2 — TRIAL tanpa NIP:</strong>
                  <ol class="mb-0">
                    <li>Kosongkan field NIP.</li>
                    <li>Isi Nama lengkap & Email aktif (email dipakai untuk login).</li>
                    <li>Isi password.</li>
                    <li>Klik <strong>Daftar</strong>. Login pakai email + password.</li>
                  </ol>
                </div>
                <h4>Login</h4>
                <p>Buka halaman <a href="#/login">Login</a>, masukkan NIP atau Email + password.</p>
                <div class="panduan-tip"><strong>💡 Tips:</strong> Setelah daftar, halaman login akan auto pre-fill identitas Bapak/Ibu (sesi terakhir). Tinggal ketik password.</div>
                <h4>Lupa Password</h4>
                <p>Hubungi pengelola aplikasi untuk reset password.</p>
              </section>

              <section id="sec-tier" class="panduan-section mt-4">
                <h3>💎 TRIAL vs FULL</h3>
                <div class="row g-2">
                  <div class="col-md-6">
                    <div class="card border-warning h-100">
                      <div class="card-body">
                        <h5 class="text-warning"><i class="bi bi-hourglass-split"></i> TRIAL</h5>
                        <ul class="mb-0">
                          <li>Gratis</li>
                          <li>Berlaku 5 hari</li>
                          <li>Maks 10 kegiatan</li>
                          <li>Akses penuh semua menu</li>
                          <li>Cocok untuk eksplorasi fitur</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-6">
                    <div class="card border-success h-100">
                      <div class="card-body">
                        <h5 class="text-success"><i class="bi bi-patch-check"></i> FULL</h5>
                        <ul class="mb-0">
                          <li>Aktif permanen</li>
                          <li>Tidak ada batas kegiatan</li>
                          <li>Semua fitur unlimited</li>
                          <li>Aktivasi pakai <strong>Kode Aktivasi</strong></li>
                          <li>Beli via <a href="#/beli-lisensi">halaman Beli Lisensi</a></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="panduan-tip mt-2"><strong>💡 Upgrade dari TRIAL ke FULL:</strong> Masukkan kode aktivasi pada menu <em>Pembelian → Aktivasi</em>.</div>
              </section>

              <section id="sec-setup" class="panduan-section mt-4">
                <h3>⚙️ Setup Awal (Wajib)</h3>
                <div class="panduan-step">
                  <strong>Urutan setup yang disarankan:</strong>
                  <ol class="mb-0">
                    <li><strong>Periode SKP</strong> — pilih tahun aktif (2026, 2027, dst.)</li>
                    <li><strong>Identitas Pengawas</strong> — NIP, NUPTK, jabatan, pangkat, instansi, foto/TTD</li>
                    <li><strong>SKP Atasan Langsung</strong> — RHK milik Kepala Kankemenag (untuk konteks)</li>
                    <li><strong>Master RHK</strong> — pilih/customize RHK Bapak/Ibu untuk tahun aktif</li>
                    <li><strong>Matriks Peran Hasil</strong> — turunan tugas dari SKP atasan</li>
                    <li><strong>Madrasah Binaan</strong> — daftar madrasah + GTK</li>
                    <li>Mulai input <strong>Data Kegiatan</strong></li>
                  </ol>
                </div>
              </section>

              <section id="sec-rhk" class="panduan-section mt-4">
                <h3>📋 Master RHK</h3>
                <p>30 jenis RHK Pengawas Madrasah sesuai juknis. Setiap RHK punya: kode, nama, kategori, target kuantitatif, target kualitatif, satuan, dan turunan kegiatan.</p>
                <h4>Cara pakai</h4>
                <ol>
                  <li>Buka menu <a href="#/master-rhk">Master RHK</a></li>
                  <li>Klik baris RHK untuk edit detail (target, deskripsi, kegiatan turunan)</li>
                  <li>Drag kolom untuk resize, klik ikon pensil untuk edit inline</li>
                  <li>Filter Triwulan untuk lihat RHK aktif per kuartal</li>
                </ol>
                <div class="panduan-tip"><strong>💡 Catatan:</strong> Master RHK terpisah per periode tahun. Tahun 2026 dan 2027 punya master sendiri.</div>
              </section>

              <section id="sec-madrasah" class="panduan-section mt-4">
                <h3>🏫 Madrasah Binaan</h3>
                <p>Daftar madrasah binaan (RA/MI/MTs/MA) lengkap dengan data Kepala Madrasah & GTK.</p>
                <ol>
                  <li>Klik <strong>+ Tambah Madrasah</strong></li>
                  <li>Isi: NSM, NPSN, nama, jenjang, alamat, kepala madrasah, NIP/NPK</li>
                  <li>Tab <strong>Data GTK</strong>: input guru/tendik per madrasah (auto-fill ke Daftar Hadir)</li>
                </ol>
                <div class="panduan-tip"><strong>💡 Tips:</strong> Saat bikin Daftar Hadir, pilih "Semua Madrasah" → otomatis isi seluruh Kepala Madrasah binaan.</div>
              </section>

              <section id="sec-kegiatan" class="panduan-section mt-4">
                <h3>📝 Data Kegiatan</h3>
                <p>Input setiap kegiatan supervisi/pembinaan/pendampingan yang Bapak/Ibu lakukan.</p>
                <h4>Field penting</h4>
                <ul>
                  <li><strong>RHK</strong> — kaitkan kegiatan ke RHK (drives auto-fill nama kegiatan)</li>
                  <li><strong>Madrasah Sasaran</strong> — pilih satu / "Semua Madrasah"</li>
                  <li><strong>Tanggal & Triwulan</strong></li>
                  <li><strong>Catatan/Hasil</strong> — narasi singkat</li>
                </ul>
                <div class="panduan-warn"><strong>⚠️ TRIAL:</strong> dibatasi maks 10 kegiatan. Upgrade ke FULL untuk unlimited.</div>
              </section>

              <section id="sec-eviden" class="panduan-section mt-4">
                <h3>📄 Generator Eviden</h3>
                <p>Generate dokumen pendukung otomatis dari data kegiatan. <strong>13 jenis dokumen</strong>:</p>
                <ul>
                  <li>Surat Tugas, Surat Undangan, Surat Pemberitahuan</li>
                  <li>Daftar Hadir, Notulen, Berita Acara</li>
                  <li>Instrumen Supervisi, Hasil Supervisi</li>
                  <li>Laporan Kegiatan, Sertifikat, dll.</li>
                </ul>
                <h4>Cara generate</h4>
                <ol>
                  <li>Buka <a href="#/eviden">Generator Eviden</a></li>
                  <li>Pilih RHK → klik <strong>Buat Eviden</strong></li>
                  <li>Pilih jenis dokumen, isi field tambahan kalau perlu</li>
                  <li>Klik <strong>Preview</strong> untuk lihat hasil</li>
                  <li>Export ke <strong>HTML / DOCX / PDF</strong> atau cetak langsung</li>
                </ol>
                <div class="panduan-tip"><strong>💡 Pengaturan Cetak:</strong> Klik tombol <em>Pengaturan Cetak</em> di toolbar preview untuk atur orientasi (Portrait/Landscape) & skala/zoom.</div>
              </section>

              <section id="sec-rekap" class="panduan-section mt-4">
                <h3>📊 Rekap & Laporan</h3>
                <h4>Rekapitulasi</h4>
                <p>Tabel ringkas progress RHK: target vs realisasi per triwulan. Filter per Triwulan tersedia.</p>
                <h4>Laporan Triwulan</h4>
                <p>Generate laporan resmi per kuartal dengan blok TTD: <strong>Pokjawas (kiri) + Pengawas (kanan)</strong>. Export PDF/DOCX.</p>
                <h4>Arsip Eviden</h4>
                <p>Daftar semua eviden yang pernah di-generate. Bisa di-preview ulang atau di-export.</p>
              </section>

              <section id="sec-periode" class="panduan-section mt-4">
                <h3>📅 Periode SKP</h3>
                <p>Aplikasi mendukung multi-tahun. Setiap periode punya data Master RHK, Kegiatan, dan Eviden sendiri.</p>
                <ol>
                  <li>Buka <a href="#/periode">Periode SKP</a></li>
                  <li>Tambah periode tahun baru → set sebagai aktif</li>
                  <li>Badge periode aktif tampil di pojok kanan atas (klik untuk ganti cepat)</li>
                </ol>
              </section>

              <section id="sec-backup" class="panduan-section mt-4">
                <h3>💾 Backup & Restore</h3>
                <div class="panduan-warn"><strong>⚠️ PENTING:</strong> Semua data ada di browser (localStorage). Hapus browser cache = data hilang. <strong>Backup berkala wajib!</strong></div>
                <ol>
                  <li>Buka <a href="#/backup">Backup &amp; Restore</a></li>
                  <li>Klik <strong>Download Backup</strong> → simpan file JSON</li>
                  <li>Untuk restore: klik <strong>Pilih File</strong> → upload JSON → klik Restore</li>
                </ol>
                <div class="panduan-tip"><strong>💡 Saran:</strong> Backup tiap minggu, simpan di Google Drive / OneDrive.</div>
              </section>

              <section id="sec-faq" class="panduan-section mt-4">
                <h3>❓ FAQ</h3>
                <p><strong>Q: Saya pakai laptop lain, data hilang?</strong><br>
                A: Ya, data per-device (localStorage). Solusi: backup di laptop lama → restore di laptop baru.</p>
                <p><strong>Q: Aplikasi bisa offline?</strong><br>
                A: Ya. Setelah pertama kali load (dengan internet), semua aset di-cache via Service Worker. Bisa dipakai offline.</p>
                <p><strong>Q: Cara update ke versi terbaru?</strong><br>
                A: <kbd>Ctrl+F5</kbd> untuk hard reload. Service Worker otomatis cek update tiap kali halaman dibuka.</p>
                <p><strong>Q: Bisa multi-user di 1 laptop?</strong><br>
                A: Ya, tiap user login terpisah. Data per-user disimpan terpisah di localStorage.</p>
                <p><strong>Q: TRIAL habis, data hilang?</strong><br>
                A: Tidak. Data tetap aman, hanya akses input dibatasi. Upgrade ke FULL untuk lanjut.</p>
                <p><strong>Q: Bisa cetak ke kertas A4?</strong><br>
                A: Ya, semua eviden & laporan support cetak A4 (Portrait/Landscape) lewat dialog browser.</p>
              </section>

              <section id="sec-kontak" class="panduan-section mt-4">
                <h3>📞 Kontak & Lisensi</h3>
                <p><strong>Pengembang:</strong> Subariyanto, S.Pd, M.Pd.I.<br>
                <strong>Jabatan:</strong> Ketua Pokjawas Madrasah Kabupaten Jember<br>
                <strong>NIP:</strong> 197002122005011004</p>
                <p><strong>Beli Lisensi FULL:</strong> <a href="#/beli-lisensi">Halaman Beli Lisensi</a></p>
                <p class="text-muted small">© 2026 Pokjawas Madrasah Kabupaten Jember. Aplikasi ini dikembangkan untuk lingkungan Pengawas Madrasah Kemenag.</p>
              </section>

            </div>
          </div>
        </div>
      </div>
    `);

    // TOC active highlight on scroll
    const toc = document.getElementById('panduanToc');
    const links = toc ? Array.from(toc.querySelectorAll('a')) : [];
    const sections = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const onScroll = () => {
      const y = window.scrollY + 80;
      let active = sections[0];
      for (const s of sections) { if (s.offsetTop <= y) active = s; }
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + (active?.id || '')));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Smooth scroll
    links.forEach(a => a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href && href.startsWith('#sec-')) {
        e.preventDefault();
        const t = document.querySelector(href);
        if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }));
  };
})();
