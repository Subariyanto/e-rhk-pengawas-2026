// Halaman Backup / Restore — export & import seluruh data user (semua periode + identitas)
(function () {
  Page.Backup = function () {
    const u = Auth.currentUser();

    UI.shell('Backup & Restore', `
      <div class="row g-3">
        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-header bg-success text-white">
              <i class="bi bi-cloud-download"></i> Backup (Unduh)
            </div>
            <div class="card-body">
              <p>Unduh seluruh data SKP Anda dalam satu file <code>.json</code>. Backup ini mencakup:</p>
              <ul class="small">
                <li>Semua periode SKP (Master RHK, Kegiatan, Eviden per tahun)</li>
                <li>Identitas Pengawas (kop, logo, TTD, stempel)</li>
                <li>SKP Atasan, Matriks Peran Hasil</li>
                <li>Madrasah Binaan</li>
                <li>Pengaturan tahun aktif</li>
              </ul>
              <button class="btn btn-success" id="btnBackup">
                <i class="bi bi-download"></i> Unduh Backup Sekarang
              </button>
              <div class="small text-muted mt-3">
                Tip: backup rutin tiap akhir bulan / akhir periode. File aman disimpan di Drive atau hard disk eksternal.
              </div>
            </div>
          </div>
        </div>

        <div class="col-md-6">
          <div class="card h-100">
            <div class="card-header bg-warning text-dark">
              <i class="bi bi-cloud-upload"></i> Restore (Pulihkan)
            </div>
            <div class="card-body">
              <p>Pulihkan data dari file backup <code>.json</code>. Pilihan mode:</p>
              <div class="form-check mb-2">
                <input class="form-check-input" type="radio" name="restoreMode" id="modeMerge" value="merge" checked />
                <label class="form-check-label" for="modeMerge">
                  <strong>Gabung (Merge)</strong> — data lama dipertahankan, data dari backup ditimpakan untuk key yang sama
                </label>
              </div>
              <div class="form-check mb-3">
                <input class="form-check-input" type="radio" name="restoreMode" id="modeReplace" value="replace" />
                <label class="form-check-label text-danger" for="modeReplace">
                  <strong>Ganti Total (Replace)</strong> — semua data Anda dihapus dulu, lalu diisi dari backup
                </label>
              </div>
              <div class="mb-3">
                <label class="form-label">File Backup</label>
                <input type="file" class="form-control" id="fileBackup" accept=".json,application/json" />
              </div>
              <button class="btn btn-warning" id="btnRestore" disabled>
                <i class="bi bi-upload"></i> Pulihkan
              </button>
              <div class="alert alert-warning small mt-3 mb-0">
                <i class="bi bi-exclamation-triangle"></i> Restore akan reload aplikasi. Pastikan sudah backup data terkini sebelum melakukan restore.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mt-3">
        <div class="card-header"><i class="bi bi-info-circle"></i> Informasi</div>
        <div class="card-body small">
          <ul class="mb-0">
            <li>Backup hanya menyimpan data <strong>akun yang sedang login</strong> (${U.escapeHtml(u?.email || '-')}).</li>
            <li>Data global seperti daftar user admin tidak ikut dalam backup ini.</li>
            <li>Format file: JSON dengan envelope <code>{ schema, version, exportedAt, user, data }</code>.</li>
            <li>Anda bisa membuka file backup dengan editor teks untuk inspeksi (semua data plain JSON).</li>
          </ul>
        </div>
      </div>
    `);

    // Backup
    document.getElementById('btnBackup').addEventListener('click', () => {
      const data = Store.exportAllForUser() || {};
      const envelope = {
        schema: 'erhk-pengawas-2026.backup',
        version: 1,
        exportedAt: new Date().toISOString(),
        user: { email: u?.email, nama: u?.nama, role: u?.role },
        activePeriode: Store.activePeriode(),
        data,
      };
      const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
      const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      const safeEmail = (u?.email || 'anon').replace(/[^a-z0-9]/gi, '_');
      U.downloadBlob(blob, `erhk-backup-${safeEmail}-${ts}.json`);
      UI.toast('Backup berhasil diunduh.');
    });

    // Restore — enable button setelah file dipilih
    const fileInput = document.getElementById('fileBackup');
    const btnRestore = document.getElementById('btnRestore');
    fileInput.addEventListener('change', () => {
      btnRestore.disabled = !fileInput.files || !fileInput.files.length;
    });

    btnRestore.addEventListener('click', async () => {
      const f = fileInput.files && fileInput.files[0];
      if (!f) return UI.toast('Pilih file backup dulu.', 'danger');
      const mode = document.querySelector('input[name="restoreMode"]:checked').value;
      let env;
      try {
        const txt = await f.text();
        env = JSON.parse(txt);
      } catch (e) {
        return UI.toast('File tidak valid: ' + e.message, 'danger');
      }
      if (!env || !env.data || env.schema !== 'erhk-pengawas-2026.backup') {
        if (!confirm('File ini tidak punya schema standar. Tetap lanjutkan restore?')) return;
      }
      const dataObj = env.data || env;
      const count = Object.keys(dataObj).length;
      const confirmText = mode === 'replace'
        ? `MODE GANTI TOTAL: semua data akun Anda akan DIHAPUS lalu diisi ${count} entri dari backup. Lanjutkan?`
        : `MODE GABUNG: ${count} entri dari backup akan ditimpakan ke data Anda. Lanjutkan?`;
      if (!confirm(confirmText)) return;

      try {
        if (mode === 'replace') {
          // Hapus semua key user dulu
          const session = JSON.parse(localStorage.getItem(Store.SESSION_KEY) || 'null');
          if (session) {
            const prefix = Store.PREFIX + 'u_' + session.userId + '_';
            const toDel = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith(prefix)) toDel.push(k);
            }
            toDel.forEach(k => localStorage.removeItem(k));
          }
        }
        Store.importAllForUser(dataObj);
        if (env.activePeriode) Store.setActivePeriode(env.activePeriode);
        UI.toast('Restore berhasil. Aplikasi akan dimuat ulang...');
        setTimeout(() => { location.reload(); }, 800);
      } catch (e) {
        UI.toast('Gagal restore: ' + e.message, 'danger');
      }
    });
  };
})();
