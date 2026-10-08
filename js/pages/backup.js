// Halaman Backup / Restore — export & import seluruh data user (semua periode + identitas)
(function () {
  // ============================================================
  // GABUNG 2 BACKUP — merge per-item antar dua perangkat
  // ------------------------------------------------------------
  // Skenario: isi data di Perangkat A -> backup A; lanjut isi di
  // Perangkat B -> backup B. Fungsi di bawah menyatukan kedua backup
  // TANPA menimpa: daftar (master RHK, madrasah, kegiatan, eviden)
  // disatukan per-item berdasarkan id (per-periode), objek (identitas)
  // digabung field-nya, nilai KOSONG tidak menimpa yang TERISI.
  // Bila dua-duanya terisi beda (bentrok), dipakai versi dari backup
  // yang lebih BARU (berdasarkan exportedAt).
  // ============================================================
  function isPlainObject(v) { return !!v && typeof v === 'object' && !Array.isArray(v); }
  function nonEmpty(v) {
    if (v === undefined || v === null) return false;
    if (typeof v === 'string') return v.trim() !== '';
    if (Array.isArray(v)) return v.length > 0;
    if (isPlainObject(v)) return Object.keys(v).length > 0;
    return true; // number / boolean
  }
  function stableStringify(v) {
    try {
      if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
      if (isPlainObject(v)) return '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
      return JSON.stringify(v);
    } catch (e) { return String(v); }
  }
  function itemKey(it) {
    if (isPlainObject(it)) {
      if (it.id) return 'id:' + it.id;
      if (it.name) return 'name:' + it.name;
      return '#' + stableStringify(it);
    }
    return 'v:' + stableStringify(it);
  }
  // Union 2 array: dedup by id/name/nilai. Item duplikat digabung field-nya.
  function mergeArrays(baseArr, overArr) {
    const out = new Map();
    ([]).concat(baseArr || [], overArr || []).forEach(it => {
      const k = itemKey(it);
      if (!out.has(k)) { out.set(k, it); return; }
      const prev = out.get(k);
      if (isPlainObject(prev) && isPlainObject(it)) out.set(k, mergeRecord(prev, it));
    });
    return Array.from(out.values());
  }
  // Gabung 2 objek: base (lama) + over (baru). Nilai kosong tidak menimpa isi.
  function mergeRecord(base, over) {
    if (!isPlainObject(base)) return isPlainObject(over) ? over : (nonEmpty(over) ? over : base);
    if (!isPlainObject(over)) return base;
    const out = Object.assign({}, base);
    Object.keys(over).forEach(k => {
      const bv = out[k], ov = over[k];
      if (Array.isArray(bv) || Array.isArray(ov)) out[k] = mergeArrays(bv || [], ov || []);
      else if (isPlainObject(bv) && isPlainObject(ov)) out[k] = mergeRecord(bv, ov);
      else if (typeof ov === 'boolean') out[k] = ov;
      else out[k] = nonEmpty(ov) ? ov : bv;
    });
    return out;
  }
  function mergeValue(va, vb) {
    if (Array.isArray(va) || Array.isArray(vb)) return mergeArrays(va || [], vb || []);
    if (isPlainObject(va) && isPlainObject(vb)) return mergeRecord(va, vb);
    if (typeof vb === 'boolean') return vb;
    return nonEmpty(vb) ? vb : (nonEmpty(va) ? va : vb);
  }
  function scopeLabel(k) {
    const m = /^(master_rhk|kegiatan|eviden)_(\d{4})$/.exec(k);
    const base = m ? m[1] : k;
    const y = m ? ' ' + m[2] : '';
    const map = {
      master_rhk: 'Master RHK', madrasah: 'Madrasah Binaan', kegiatan: 'Kegiatan',
      eviden: 'Eviden', skp_atasan_doc: 'SKP Atasan', matriks_peran_hasil_doc: 'Matriks Peran Hasil',
      identitas: 'Identitas',
    };
    return (map[base] || base) + y;
  }
  // Gabung 2 envelope backup -> envelope gabungan (siap di-restore).
  function mergeBackups(envA, envB) {
    const ta = Date.parse(envA.exportedAt) || 0;
    const tb = Date.parse(envB.exportedAt) || 0;
    const older = tb >= ta ? envA : envB;
    const newer = tb >= ta ? envB : envA;
    const da = older.data || {}, db = newer.data || {};
    const merged = {};
    const keys = Array.from(new Set(Object.keys(da).concat(Object.keys(db))));
    keys.forEach(k => {
      const va = da[k], vb = db[k];
      if (va === undefined) { merged[k] = vb; return; }
      if (vb === undefined) { merged[k] = va; return; }
      merged[k] = mergeValue(va, vb);
    });
    const lines = [];
    let added = 0;
    keys.forEach(k => {
      if (Array.isArray(merged[k])) {
        const before = Math.max((da[k] || []).length, (db[k] || []).length);
        const after = merged[k].length;
        const plus = after - before;
        if (plus > 0) added += plus;
        lines.push(scopeLabel(k) + ': ' + after + ' item' + (plus > 0 ? ' (+' + plus + ' baru)' : ''));
      }
    });
    if (!lines.length) lines.push('Tidak ada daftar item. Data identitas/dokumen digabung per-field.');
    const env = {
      schema: 'erhk-pengawas-2026.backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      user: newer.user || older.user || null,
      activePeriode: newer.activePeriode || older.activePeriode || null,
      mergedFrom: [older.exportedAt || '-', newer.exportedAt || '-'],
      data: merged,
    };
    return { env: env, older: older, newer: newer, stats: { lines: lines, added: added } };
  }

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

      <div class="card mt-3">
        <div class="card-header bg-primary text-white">
          <i class="bi bi-shuffle"></i> Gabung 2 Backup (Dua Perangkat)
        </div>
        <div class="card-body">
          <p class="mb-2">Isi data di <strong>Perangkat A</strong> lalu backup; lanjut isi di <strong>Perangkat B</strong> lalu backup. Unggah kedua file di sini untuk disatukan <em>tanpa menimpa</em> — data dari kedua perangkat digabung per-item (Master RHK, Madrasah, Kegiatan, Eviden), identitas digabung per-field.</p>
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label">Backup A</label>
              <input type="file" class="form-control" id="mrgFileA" accept=".json,application/json" />
              <div class="form-text" id="mrgInfoA">—</div>
            </div>
            <div class="col-md-6">
              <label class="form-label">Backup B</label>
              <input type="file" class="form-control" id="mrgFileB" accept=".json,application/json" />
              <div class="form-text" id="mrgInfoB">—</div>
            </div>
          </div>
          <div class="mt-3">
            <button class="btn btn-primary" id="btnMerge" disabled><i class="bi bi-shuffle"></i> Gabungkan</button>
          </div>
          <div id="mrgResult" class="mt-3"></div>
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

    // ---------- Gabung 2 Backup ----------
    const mrgA = { env: null, name: '' };
    const mrgB = { env: null, name: '' };
    const fA = document.getElementById('mrgFileA');
    const fB = document.getElementById('mrgFileB');
    const btnMerge = document.getElementById('btnMerge');
    const mrgResult = document.getElementById('mrgResult');

    function parseEnv(file) {
      return file.text().then(txt => {
        const raw = JSON.parse(txt);
        if (!isPlainObject(raw)) throw new Error('format tidak dikenali');
        const data = isPlainObject(raw.data) ? raw.data : raw;
        return {
          schema: raw.schema || null,
          exportedAt: raw.exportedAt || null,
          user: raw.user || null,
          activePeriode: raw.activePeriode || null,
          data: data,
        };
      });
    }
    function updMergeBtn() { btnMerge.disabled = !(mrgA.env && mrgB.env); }
    function describe(slot, file) {
      const when = slot.env.exportedAt ? String(slot.env.exportedAt).slice(0, 16).replace('T', ' ') : '-';
      const who = (slot.env.user && slot.env.user.email) ? ' • ' + slot.env.user.email : '';
      return U.escapeHtml(file.name) + ' • ' + Object.keys(slot.env.data).length + ' entri • ' + U.escapeHtml(when) + U.escapeHtml(who);
    }

    fA.addEventListener('change', async () => {
      const el = document.getElementById('mrgInfoA');
      const f = fA.files && fA.files[0];
      if (!f) { mrgA.env = null; el.textContent = '—'; return updMergeBtn(); }
      try { mrgA.env = await parseEnv(f); mrgA.name = f.name; el.innerHTML = describe(mrgA, f); }
      catch (e) { mrgA.env = null; el.innerHTML = '<span class="text-danger">Gagal baca: ' + U.escapeHtml(e.message) + '</span>'; }
      updMergeBtn(); mrgResult.innerHTML = '';
    });
    fB.addEventListener('change', async () => {
      const el = document.getElementById('mrgInfoB');
      const f = fB.files && fB.files[0];
      if (!f) { mrgB.env = null; el.textContent = '—'; return updMergeBtn(); }
      try { mrgB.env = await parseEnv(f); mrgB.name = f.name; el.innerHTML = describe(mrgB, f); }
      catch (e) { mrgB.env = null; el.innerHTML = '<span class="text-danger">Gagal baca: ' + U.escapeHtml(e.message) + '</span>'; }
      updMergeBtn(); mrgResult.innerHTML = '';
    });

    btnMerge.addEventListener('click', () => {
      if (!mrgA.env || !mrgB.env) return;
      const res = mergeBackups(mrgA.env, mrgB.env);
      const mergedEnv = res.env;
      const rows = res.stats.lines.map(l => '<li>' + U.escapeHtml(l) + '</li>').join('');
      const uA = mrgA.env.user && mrgA.env.user.email;
      const uB = mrgB.env.user && mrgB.env.user.email;
      const warn = (uA && uB && uA !== uB)
        ? '<div class="alert alert-warning small mb-2"><i class="bi bi-exclamation-triangle"></i> Backup A dan B berasal dari akun berbeda (' + U.escapeHtml(uA) + ' vs ' + U.escapeHtml(uB) + '). Data tetap digabung — pastikan ini memang disengaja.</div>'
        : '';
      const newerWhen = String(res.newer.exportedAt || '-').slice(0, 16).replace('T', ' ');
      mrgResult.innerHTML = warn +
        '<div class="alert alert-success mb-2"><i class="bi bi-check2-circle"></i> Penggabungan selesai — ' + res.stats.added + ' item baru ditambahkan.</div>' +
        '<ul class="small mb-2">' + rows + '</ul>' +
        '<div class="small text-muted mb-3">Bila ada isi bentrok, versi lebih baru (' + U.escapeHtml(newerWhen) + ') yang dipakai.</div>' +
        '<button class="btn btn-success me-2" id="btnMergeDownload"><i class="bi bi-download"></i> Unduh Hasil Gabungan</button>' +
        '<button class="btn btn-primary" id="btnMergeApply"><i class="bi bi-upload"></i> Terapkan ke Perangkat Ini</button>';

      document.getElementById('btnMergeDownload').addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(mergedEnv, null, 2)], { type: 'application/json' });
        const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
        U.downloadBlob(blob, 'erhk-backup-GABUNG-' + ts + '.json');
        UI.toast('Hasil gabungan diunduh. Pulihkan di perangkat lain lewat menu Restore.');
      });

      document.getElementById('btnMergeApply').addEventListener('click', () => {
        const n = Object.keys(mergedEnv.data).length;
        if (!confirm('Terapkan hasil gabungan (' + n + ' entri) ke perangkat ini? Data Anda saat ini akan DIGABUNG (diperbarui), tidak dihapus.')) return;
        try {
          Store.importAllForUser(mergedEnv.data);
          if (mergedEnv.activePeriode) Store.setActivePeriode(mergedEnv.activePeriode);
          UI.toast('Hasil gabungan diterapkan. Aplikasi dimuat ulang...');
          setTimeout(() => { location.reload(); }, 800);
        } catch (e) {
          UI.toast('Gagal menerapkan: ' + e.message, 'danger');
        }
      });
    });
  };

  // Diekspos untuk pengujian / debugging (tidak dipakai UI).
  if (typeof window !== 'undefined') window.__erhkMerge = { mergeBackups: mergeBackups, mergeArrays: mergeArrays, mergeRecord: mergeRecord };
})();
