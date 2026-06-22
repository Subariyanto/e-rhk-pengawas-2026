// Admin > Kode Aktivasi — generate kode untuk NIP pengawas + import dari Excel + rotate secret.
(function () {
  Page.AdminAktivasi = function () {
    UI.shell('Kode Aktivasi', `
      <div class="alert alert-light border mb-3">
        <i class="bi bi-shield-check text-success"></i>
        Kelola <strong>kode aktivasi</strong> (TRIAL/FULL) untuk pengawas. Kode dibuat random format <code>FULL-XXXX-XXXX-XXXX</code>, sekali pakai. Lisensi FULL berlaku <strong>1 tahun</strong> sejak aktivasi.
      </div>

      <ul class="nav nav-tabs mb-3" id="aktTab" role="tablist">
        <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tabRandom" type="button">Kode Tier (Random)</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabSync" type="button">🔄 Sinkronisasi</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabRegistry" type="button">Daftar Pengawas</button></li>
      </ul>

      <div class="tab-content">
        <div class="tab-pane fade show active" id="tabRandom">
          <div class="card mb-3"><div class="card-body">
            <h5 class="card-title mb-2"><i class="bi bi-shuffle"></i> Generate Kode Random (TRIAL / FULL)</h5>
            <p class="small text-muted mb-3">Format <code>PREFIX-XXXX-XXXX-XXXX</code>. Sekali pakai, tidak terkait NIP. Cocok untuk lisensi yang dijual via WhatsApp.</p>
            <div class="d-flex flex-wrap gap-2">
              <button class="btn btn-success btn-sm" id="btnGenFull"><i class="bi bi-plus-circle"></i> 1 Kode FULL</button>
              <button class="btn btn-outline-success btn-sm" id="btnGen10Full"><i class="bi bi-collection"></i> 10 Kode FULL</button>
              <button class="btn btn-warning btn-sm" id="btnGenTrial"><i class="bi bi-plus-circle"></i> 1 Kode TRIAL</button>
              <button class="btn btn-outline-warning btn-sm" id="btnGen10Trial"><i class="bi bi-collection"></i> 10 Kode TRIAL</button>
              <button class="btn btn-outline-secondary btn-sm ms-auto" id="btnClearUsed"><i class="bi bi-eraser"></i> Hapus Kode Terpakai/Cabut</button>
            </div>
            <div class="alert alert-warning mt-3 small mb-0">
              <i class="bi bi-exclamation-triangle"></i> <strong>Penting (cross-device):</strong> Kode random tersimpan di localStorage device ini saja. Supaya user bisa aktivasi dari HP / device lain, klik <strong>📤 Export untuk Bundled</strong> di bawah, lalu paste hasilnya ke file <code>js/data/purchase_default.js</code> (atau kirim via chat ke Bari) → commit + push gh-pages.
            </div>
            <div class="alert alert-info mt-2 small mb-0">
              <i class="bi bi-key"></i> Kode <strong>master</strong> (selalu aktif, hard-coded di source):
              <code style="font-family:monospace;font-weight:600;">${U.escapeHtml(Codes.MASTER_CODE)}</code>
              &mdash; ganti + redeploy kalau bocor.
            </div>
          </div></div>
          <div class="card"><div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
              <h6 class="mb-0"><i class="bi bi-list-check"></i> Daftar Kode Random</h6>
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-sm btn-outline-success" id="btnRandomExportCsv"><i class="bi bi-filetype-csv"></i> Export CSV</button>
                <button class="btn btn-sm btn-outline-success" id="btnRandomExportXlsx"><i class="bi bi-file-earmark-excel"></i> Export Excel</button>
                <button class="btn btn-sm btn-outline-success" id="btnRandomPrint"><i class="bi bi-printer"></i> Cetak</button>
                <button class="btn btn-sm btn-warning" id="btnExportBundle"><i class="bi bi-cloud-arrow-up"></i> Export untuk Bundled (cross-device)</button>
              </div>
            </div>
            <div id="randomList"></div>
          </div></div>
        </div>

        <div class="tab-pane fade" id="tabSync">
          <div class="card mb-3"><div class="card-body">
            <h5 class="card-title mb-2"><i class="bi bi-cloud-arrow-up"></i> Sinkronisasi Kode Lintas Device</h5>
            <p class="small text-muted mb-3">Sekali setup GitHub Personal Access Token (PAT). Setelah itu, setiap kali Anda generate / revoke / hapus kode, sistem otomatis push ke <code>gh-pages/data/codes.json</code>. User di HP / device manapun bisa langsung pakai kode itu (auto-fetch saat buka aplikasi).</p>

            <div class="alert alert-info small">
              <strong>Cara dapat PAT (gratis, 5 menit):</strong>
              <ol class="mb-0 ps-3">
                <li>Buka <a href="https://github.com/settings/personal-access-tokens/new" target="_blank">github.com/settings/personal-access-tokens/new</a></li>
                <li>Token name: <code>e-RHK Pengawas Sync</code></li>
                <li>Resource owner: <strong>Subariyanto</strong></li>
                <li>Repository access: <strong>Only select repositories</strong> → pilih <code>e-rhk-pengawas-2026</code></li>
                <li>Permissions → Repository permissions → <strong>Contents: Read and write</strong></li>
                <li>Klik Generate token → salin token (mulai dengan <code>github_pat_...</code>)</li>
                <li>Paste di field di bawah, klik Simpan + Test</li>
              </ol>
            </div>

            <div class="row g-2 align-items-end">
              <div class="col-md-9">
                <label class="form-label">GitHub Personal Access Token</label>
                <input id="patIn" class="form-control" type="password" placeholder="github_pat_..." autocomplete="off" />
                <div class="form-text">Disimpan di localStorage admin's-browser saja. Tidak diupload ke server.</div>
              </div>
              <div class="col-md-3 d-grid">
                <button class="btn btn-success" id="btnSavePat"><i class="bi bi-shield-check"></i> Simpan + Test</button>
              </div>
            </div>
            <div class="mt-2 d-flex gap-2 flex-wrap">
              <button class="btn btn-sm btn-outline-secondary" id="btnRevealPat"><i class="bi bi-eye"></i> Tampilkan/Sembunyikan</button>
              <button class="btn btn-sm btn-outline-danger" id="btnClearPat"><i class="bi bi-trash"></i> Hapus PAT</button>
              <button class="btn btn-sm btn-outline-primary ms-auto" id="btnPullFromGh"><i class="bi bi-cloud-download"></i> Tarik dari gh-pages</button>
              <button class="btn btn-sm btn-outline-success" id="btnSyncNow"><i class="bi bi-arrow-clockwise"></i> Push Sekarang</button>
            </div>
            <div id="syncStatus" class="mt-3"></div>
          </div></div>
          <div class="card"><div class="card-body">
            <h6 class="mb-2"><i class="bi bi-info-circle"></i> Status saat ini</h6>
            <div id="syncInfo" class="small"></div>
          </div></div>
          <div class="card mt-3" id="cardSupabase" style="display:none;"><div class="card-body">
            <h6 class="mb-2"><i class="bi bi-inbox"></i> Inbox Aktivasi (Supabase)</h6>
            <p class="small text-muted mb-2">User aktivasi dari HP otomatis melapor ke Supabase. Klik tombol di bawah untuk tarik laporan terbaru, merge ke daftar kode (auto-isi kolom "Dipakai Oleh" + Catatan), lalu push ke gh-pages.</p>
            <button class="btn btn-sm btn-success" id="btnPullSupabase"><i class="bi bi-cloud-download"></i> Tarik Aktivasi Terbaru</button>
            <div id="supabaseStatus" class="small mt-2"></div>
          </div></div>
        </div>

        <div class="tab-pane fade" id="tabRegistry">
          <div class="card mb-3"><div class="card-body">
            <h5 class="card-title mb-2"><i class="bi bi-people"></i> Daftar Pengawas</h5>
            <p class="small text-muted mb-2">Database NIP → Nama pengawas. Dipakai halaman <strong>Daftar / Register</strong>: saat user mengetik NIP, nama otomatis muncul. Tidak ada kaitan dengan kode aktivasi.</p>
            <input id="xlsIn" type="file" class="form-control" accept=".xlsx,.xls,.xlsm" />
            <div class="form-text">Upload file Excel berisi kolom <strong>Nama Pengawas</strong> &amp; <strong>NIP Pengawas</strong> (opsional Wilayah/KKMA &amp; Telp). Sheet pertama yang berkolom NIP otomatis dibaca.</div>
            <div id="importResult" class="mt-3"></div>
          </div></div>
          <div class="card"><div class="card-body">
            <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
              <h6 class="mb-0"><i class="bi bi-list-ul"></i> Pengawas Tersimpan <span id="registryCount" class="badge bg-secondary">0</span></h6>
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-sm btn-outline-success" id="btnRegistryAdd"><i class="bi bi-plus-circle"></i> Tambah Manual</button>
                <button class="btn btn-sm btn-outline-danger" id="btnRegistryClear"><i class="bi bi-trash"></i> Hapus Semua</button>
              </div>
            </div>
            <div id="registryList"></div>
          </div></div>
        </div>
      </div>
    `);

    // ===== Status badge default secret (legacy, hidden) =====
    // tab Secret dihapus; secret tetap ada di KodeAktivasi.getSecret() untuk verifikasi kode legacy
    // milik pengawas lama yang sudah dibagikan sebelum migrasi.

    // ===== Tab Daftar Pengawas: Tambah Manual & Render =====
    function renderRegistry() {
      const list = (window.PengawasRegistry && PengawasRegistry.list()) || [];
      const wrap = document.getElementById('registryList');
      const cnt = document.getElementById('registryCount');
      if (cnt) cnt.textContent = String(list.length);
      if (!wrap) return;
      if (!list.length) {
        wrap.innerHTML = '<div class="text-center text-muted p-4"><div style="font-size:48px;opacity:.3">👥</div><div class="mt-2">Belum ada pengawas. Upload Excel di atas atau klik <strong>Tambah Manual</strong>.</div></div>';
        return;
      }
      const showWil = list.some(p => p.wilayah);
      const showTelp = list.some(p => p.telp);
      wrap.innerHTML = `
        <div class="table-responsive" style="max-height:480px;">
          <table class="table table-sm table-hover align-middle mb-0">
            <thead class="table-light position-sticky top-0"><tr>
              <th style="width:3rem;">#</th>
              <th>Nama</th>
              <th style="width:14rem;">NIP</th>
              ${showWil ? '<th>Wilayah/KKMA</th>' : ''}
              ${showTelp ? '<th style="width:9rem;">Telp/WA</th>' : ''}
              <th class="text-end" style="width:7rem;">Aksi</th>
            </tr></thead>
            <tbody>
              ${list.map((p, i) => `<tr>
                <td>${i + 1}</td>
                <td>${U.escapeHtml(p.nama || '-')}</td>
                <td style="font-family:'Courier New',monospace;font-size:.85em;">${U.escapeHtml(p.nip)}</td>
                ${showWil ? `<td>${U.escapeHtml(p.wilayah || '')}</td>` : ''}
                ${showTelp ? `<td>${U.escapeHtml(p.telp || '')}</td>` : ''}
                <td class="text-end text-nowrap">
                  <button class="btn btn-sm btn-outline-primary" data-reg-edit="${U.escapeHtml(p.nip)}" title="Edit"><i class="bi bi-pencil"></i></button>
                  <button class="btn btn-sm btn-outline-danger" data-reg-del="${U.escapeHtml(p.nip)}" title="Hapus"><i class="bi bi-trash"></i></button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `;
      wrap.querySelectorAll('button[data-reg-edit]').forEach(b => b.addEventListener('click', async () => {
        const nip = b.dataset.regEdit;
        const p = (PengawasRegistry.list() || []).find(x => x.nip === nip);
        if (!p) return;
        const nama = prompt('Nama:', p.nama || '');
        if (nama == null) return;
        const wilayah = prompt('Wilayah/KKMA:', p.wilayah || '');
        if (wilayah == null) return;
        const telp = prompt('Telp/WA:', p.telp || '');
        if (telp == null) return;
        PengawasRegistry.updateByNip(nip, { nama: String(nama).trim(), wilayah: String(wilayah).trim(), telp: String(telp).trim() });
        renderRegistry();
        UI.toast('Data tersimpan.');
      }));
      wrap.querySelectorAll('button[data-reg-del]').forEach(b => b.addEventListener('click', async () => {
        const nip = b.dataset.regDel;
        const p = (PengawasRegistry.list() || []).find(x => x.nip === nip);
        if (!p) return;
        if (!await UI.confirmDialog('Hapus pengawas ' + (p.nama || nip) + ' dari registry?')) return;
        PengawasRegistry.removeByNip(nip);
        renderRegistry();
        UI.toast('Pengawas dihapus.');
      }));
    }

    const btnRegistryAdd = document.getElementById('btnRegistryAdd');
    if (btnRegistryAdd) btnRegistryAdd.addEventListener('click', async () => {
      const nipRaw = prompt('NIP (15-18 digit):');
      if (nipRaw == null) return;
      const nip = String(nipRaw).replace(/[^0-9]/g, '');
      if (nip.length < 15) return UI.toast('NIP minimal 15 digit.', 'danger');
      const exist = PengawasRegistry.findByNip(nip);
      if (exist) return UI.toast('NIP ini sudah terdaftar di registry: ' + (exist.nama || nip), 'warning');
      const nama = prompt('Nama lengkap:');
      if (nama == null) return;
      const wilayah = prompt('Wilayah/KKMA (opsional):', '') || '';
      const telp = prompt('Telp/WA (opsional):', '') || '';
      PengawasRegistry.upsertMany([{ nip, nama: String(nama).trim(), wilayah: String(wilayah).trim(), telp: String(telp).trim() }]);
      renderRegistry();
      UI.toast('Pengawas ditambahkan.');
    });

    const btnRegistryClear = document.getElementById('btnRegistryClear');
    if (btnRegistryClear) btnRegistryClear.addEventListener('click', async () => {
      const list = PengawasRegistry.list() || [];
      if (!list.length) return UI.toast('Registry sudah kosong.', 'info');
      if (!await UI.confirmDialog('Hapus SEMUA ' + list.length + ' pengawas dari registry? Akun pengawas yang sudah terdaftar tidak ikut terhapus.')) return;
      PengawasRegistry.clear();
      renderRegistry();
      UI.toast('Registry dikosongkan.');
    });

    // ===== Import Excel =====
    document.getElementById('xlsIn').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const buf = await U.readFileAsArrayBuffer(file);
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buf);
        const result = await extractFromWorkbook(wb);
        const out = document.getElementById('importResult');
        if (!result.rows.length) {
          out.innerHTML = '<div class="alert alert-warning">Tidak ada baris dengan kolom Nama+NIP yang terdeteksi. Pastikan file punya header "Nama Pengawas" atau "NAMA" dan "NIP Pengawas" atau "NIP".</div>';
          return;
        }
        out.innerHTML = `<div class="alert alert-success mb-0"><i class="bi bi-check-circle"></i> <strong>${result.added}</strong> pengawas baru ditambahkan, <strong>${result.updated}</strong> di-update. Total registry: <strong>${result.total}</strong>.</div>`;
        renderRegistry();
        UI.toast('Import berhasil: ' + (result.added + result.updated) + ' pengawas tersimpan.');
      } catch (err) {
        console.error(err);
        UI.toast('Gagal baca file: ' + err.message, 'danger');
      }
    });

    async function extractFromWorkbook(wb) {
      // Cari sheet pertama yang punya kolom NIP
      for (const ws of wb.worksheets) {
        // Find header row (cek 5 baris pertama)
        let headerRow = 0, namaCol = 0, nipCol = 0, wilayahCol = 0, telpCol = 0;
        for (let r = 1; r <= Math.min(5, ws.rowCount); r++) {
          const row = ws.getRow(r);
          let foundNama = 0, foundNip = 0, foundWil = 0, foundTelp = 0;
          for (let c = 1; c <= ws.columnCount; c++) {
            const v = String(row.getCell(c).value || '').toLowerCase();
            if (!v) continue;
            if (!foundNama && /(^|\s)nama\b/.test(v)) { foundNama = c; }
            if (!foundNip && /\bnip\b/.test(v)) { foundNip = c; }
            if (!foundWil && /(wilayah|kkm|jenjang tugas)/.test(v)) { foundWil = c; }
            if (!foundTelp && /(telp|telepon|wa|telpon|hp)/.test(v)) { foundTelp = c; }
          }
          if (foundNama && foundNip) { headerRow = r; namaCol = foundNama; nipCol = foundNip; wilayahCol = foundWil; telpCol = foundTelp; break; }
        }
        if (!headerRow) continue;
        const out = [];
        for (let r = headerRow + 1; r <= ws.rowCount; r++) {
          const row = ws.getRow(r);
          const nama = String(row.getCell(namaCol).value || '').trim();
          let nipRaw = row.getCell(nipCol).value;
          if (nipRaw && typeof nipRaw === 'object' && 'result' in nipRaw) nipRaw = nipRaw.result;
          const nip = String(nipRaw || '').replace(/[^0-9]/g, '');
          if (!nama || !nip || nip.length < 15) continue;
          const wilayah = wilayahCol ? String(row.getCell(wilayahCol).value || '').trim() : '';
          let telp = telpCol ? row.getCell(telpCol).value : '';
          if (telp && typeof telp === 'object' && 'result' in telp) telp = telp.result;
          telp = String(telp || '').trim();
          out.push({ nama, nip, wilayah, telp });
        }
        if (!out.length) return { rows: [], added: 0, updated: 0, total: 0 };
        // Simpan ke registry untuk lookup nama dari NIP saat register
        let stat = { added: 0, updated: 0, total: 0 };
        try {
          stat = window.PengawasRegistry?.upsertMany(out) || stat;
        } catch (e) { console.warn('registry upsert:', e); }
        return { rows: out, added: stat.added, updated: stat.updated, total: stat.total };
      }
      return { rows: [], added: 0, updated: 0, total: 0 };
    }

    // ===== Tab Sinkronisasi (PAT + Auto-push) =====
    function refreshSyncInfo() {
      const info = document.getElementById('syncInfo');
      if (!info) return;
      const hasPat = !!window.GithubSync && window.GithubSync.hasPAT();
      const remoteCount = (window.REMOTE_CODES || []).length;
      const remoteUpd = window.REMOTE_CODES_UPDATED_AT;
      const localCount = Codes.getCodes().length;
      info.innerHTML = `
        <div class="mb-2"><strong>PAT:</strong> ${hasPat ? '<span class="text-success"><i class="bi bi-check-circle"></i> terkonfigurasi</span> — setiap perubahan kode auto-sync ke gh-pages.' : '<span class="text-warning"><i class="bi bi-exclamation-triangle"></i> belum diset</span> — kode tersimpan di device ini saja.'}</div>
        <div class="mb-1"><strong>Kode di gh-pages (publik):</strong> ${remoteCount} kode${remoteUpd ? ' · update terakhir: ' + remoteUpd.replace('T', ' ').slice(0, 19) + ' UTC' : ''}</div>
        <div><strong>Kode di device ini:</strong> ${localCount} kode</div>
        <div class="mt-2 small text-muted">URL publik: <code>${window.GithubSync ? 'https://raw.githubusercontent.com/' + window.GithubSync.REPO_OWNER + '/' + window.GithubSync.REPO_NAME + '/' + window.GithubSync.REPO_BRANCH + '/' + window.GithubSync.CODES_PATH : ''}</code></div>
      `;
    }
    refreshSyncInfo();

    const patIn = document.getElementById('patIn');
    if (patIn) {
      patIn.value = window.GithubSync ? window.GithubSync.getPAT() : '';
      patIn.type = 'password';
    }
    const btnSavePat = document.getElementById('btnSavePat');
    if (btnSavePat) btnSavePat.addEventListener('click', async () => {
      const v = patIn.value.trim();
      if (!v) return UI.toast('PAT kosong. Paste token dari GitHub.', 'danger');
      if (!/^github_pat_|^ghp_/.test(v)) {
        if (!await UI.confirmDialog('Token tidak diawali github_pat_ atau ghp_. Tetap simpan?')) return;
      }
      window.GithubSync.setPAT(v);
      const status = document.getElementById('syncStatus');
      status.innerHTML = '<div class="alert alert-info mb-0"><i class="bi bi-arrow-repeat"></i> Test PAT...</div>';
      const t = await window.GithubSync.testPAT();
      if (t.ok) {
        status.innerHTML = '<div class="alert alert-success mb-0"><i class="bi bi-check-circle"></i> ' + U.escapeHtml(t.message) + '</div>';
        // Push current local codes immediately
        const list = Codes.getCodes();
        if (list.length) {
          status.innerHTML += '<div class="alert alert-info mt-2 mb-0"><i class="bi bi-arrow-up-circle"></i> Push ' + list.length + ' kode lokal ke gh-pages...</div>';
          const r = await window.GithubSync.pushIfConfigured(list, 'initial sync after PAT setup');
          if (r.synced) status.innerHTML += '<div class="alert alert-success mt-2 mb-0"><i class="bi bi-cloud-check"></i> Berhasil push ' + list.length + ' kode. User di device manapun bisa aktivasi sekarang.</div>';
          else status.innerHTML += '<div class="alert alert-danger mt-2 mb-0"><i class="bi bi-x-circle"></i> Gagal push: ' + U.escapeHtml(r.error || r.reason) + '</div>';
        }
        UI.toast('PAT tersimpan dan terverifikasi.');
        refreshSyncInfo();
      } else {
        status.innerHTML = '<div class="alert alert-danger mb-0"><i class="bi bi-x-circle"></i> ' + U.escapeHtml(t.message) + '</div>';
      }
    });
    const btnRevealPat = document.getElementById('btnRevealPat');
    if (btnRevealPat) btnRevealPat.addEventListener('click', () => {
      patIn.type = patIn.type === 'password' ? 'text' : 'password';
    });
    const btnClearPat = document.getElementById('btnClearPat');
    if (btnClearPat) btnClearPat.addEventListener('click', async () => {
      if (!await UI.confirmDialog('Hapus PAT? Auto-sync akan berhenti, kode baru hanya tersimpan di device ini.')) return;
      window.GithubSync.clearPAT();
      patIn.value = '';
      document.getElementById('syncStatus').innerHTML = '<div class="alert alert-secondary mb-0"><i class="bi bi-info-circle"></i> PAT dihapus.</div>';
      refreshSyncInfo();
      UI.toast('PAT dihapus.');
    });
    const btnPullFromGh = document.getElementById('btnPullFromGh');
    if (btnPullFromGh) btnPullFromGh.addEventListener('click', async () => {
      const status = document.getElementById('syncStatus');
      status.innerHTML = '<div class="alert alert-info mb-0"><i class="bi bi-cloud-download"></i> Tarik kode dari gh-pages...</div>';
      try {
        const r = await window.GithubSync.refreshFromPublic();
        const remote = (r && Array.isArray(r.codes)) ? r.codes : [];
        if (!remote.length) {
          status.innerHTML = '<div class="alert alert-warning mb-0"><i class="bi bi-exclamation-triangle"></i> Tidak ada kode di gh-pages atau gagal fetch.</div>';
          return;
        }
        const localCount = Codes.getCodes().length;
        const ok = await UI.confirmDialog('Ditemukan ' + remote.length + ' kode di gh-pages. Local saat ini: ' + localCount + ' kode.\n\nTimpa daftar lokal dengan data dari gh-pages?\n\n(Aman: data di gh-pages tetap utuh, ini cuma copy ke device ini.)');
        if (!ok) {
          status.innerHTML = '<div class="alert alert-secondary mb-0"><i class="bi bi-info-circle"></i> Dibatalkan.</div>';
          return;
        }
        Store.setGlobal(Codes.STORE_KEY, remote);
        status.innerHTML = '<div class="alert alert-success mb-0"><i class="bi bi-check-circle"></i> Berhasil restore ' + remote.length + ' kode dari gh-pages.</div>';
        UI.toast('Restore berhasil: ' + remote.length + ' kode.');
        renderRandomList();
        refreshSyncInfo();
      } catch (e) {
        status.innerHTML = '<div class="alert alert-danger mb-0"><i class="bi bi-x-circle"></i> Gagal: ' + U.escapeHtml(e.message || String(e)) + '</div>';
      }
    });

    const btnSyncNow = document.getElementById('btnSyncNow');
    if (btnSyncNow) btnSyncNow.addEventListener('click', async () => {
      if (!window.GithubSync.hasPAT()) return UI.toast('Set PAT dulu sebelum push.', 'warning');
      const status = document.getElementById('syncStatus');
      const list = Codes.getCodes();
      status.innerHTML = '<div class="alert alert-info mb-0"><i class="bi bi-arrow-up-circle"></i> Push ' + list.length + ' kode lokal ke gh-pages...</div>';
      const r = await window.GithubSync.pushIfConfigured(list, 'manual push from admin');
      if (r.synced) {
        status.innerHTML = '<div class="alert alert-success mb-0"><i class="bi bi-cloud-check"></i> Berhasil push ' + list.length + ' kode. Sinkron di semua device dalam ~30 detik (cache GitHub).</div>';
        UI.toast('Push berhasil.');
        refreshSyncInfo();
      } else {
        status.innerHTML = '<div class="alert alert-danger mb-0"><i class="bi bi-x-circle"></i> Gagal: ' + U.escapeHtml(r.error || r.reason) + '</div>';
      }
    });

    // ===== Inbox Aktivasi (Supabase) =====
    if (window.SupabaseSync && window.SupabaseSync.isConfigured()) {
      const card = document.getElementById('cardSupabase');
      if (card) card.style.display = '';
      const btnPull = document.getElementById('btnPullSupabase');
      if (btnPull) btnPull.addEventListener('click', async () => {
        const st = document.getElementById('supabaseStatus');
        st.innerHTML = '<span class="text-muted"><i class="bi bi-hourglass-split"></i> Tarik laporan dari Supabase...</span>';
        try {
          const r = await window.SupabaseSync.syncAdminInbox();
          if (r.errors && r.errors.length && r.errors[0] === 'not-configured') {
            st.innerHTML = '<span class="text-warning">Supabase belum dikonfigurasi.</span>';
            return;
          }
          const parts = [];
          parts.push('<i class="bi bi-check-circle"></i> Diproses ' + r.processed + ' laporan, merged ke ' + r.merged + ' kode.');
          if (r.pushed) parts.push(' Auto-push gh-pages dijalankan.');
          if (r.errors && r.errors.length) parts.push(' Error: ' + r.errors.join('; '));
          st.innerHTML = '<span class="text-success">' + parts.join('') + '</span>';
          if (r.merged > 0) renderRandomList();
        } catch (e) {
          st.innerHTML = '<span class="text-danger">Gagal: ' + U.escapeHtml(e.message || String(e)) + '</span>';
        }
      });
    }

    // ===== Tab Kode Tier (Random) =====
    function renderRandomList() {
      const list = Codes.getCodes();
      const wrap = document.getElementById('randomList');
      if (!wrap) return;
      if (!list.length) {
        wrap.innerHTML = '<div class="text-center text-muted p-4"><div style="font-size:48px;opacity:.3">🔑</div><div class="mt-2">Belum ada kode random. Klik tombol di atas untuk generate.</div></div>';
        return;
      }
      wrap.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div><strong>${list.length}</strong> kode tersimpan.</div>
          <div class="small text-muted">Aktif: ${list.filter(c=>!c.usedBy && !c.revoked).length} | Terpakai: ${list.filter(c=>c.usedBy).length} | Dicabut: ${list.filter(c=>c.revoked).length}</div>
        </div>
        <div class="table-responsive" style="max-height:520px;">
          <table class="table table-sm table-hover align-middle mb-0">
            <thead class="table-light position-sticky top-0"><tr>
              <th style="width:3rem;">#</th>
              <th style="min-width:18rem;">Kode</th>
              <th>Tier</th>
              <th>Status</th>
              <th>Dipakai Oleh</th>
              <th style="min-width:12rem;">Catatan / Pemilik</th>
              <th>Tanggal</th>
              <th class="text-end" style="width:16rem;">Aksi</th>
            </tr></thead>
            <tbody>
              ${list.map((c, i) => {
                const tier = c.tier === 'trial' ? 'TRIAL' : 'FULL';
                const tierBadge = c.tier === 'trial'
                  ? '<span class="badge bg-warning text-dark">TRIAL</span>'
                  : '<span class="badge bg-success">FULL</span>';
                let status;
                if (c.revoked) status = '<span class="badge bg-danger">Dicabut</span>';
                else if (c.usedBy) status = '<span class="badge bg-secondary">Terpakai</span>';
                else status = '<span class="badge bg-success-subtle text-success border border-success">Aktif</span>';
                let usedBy = '-';
                if (c.usedBy) {
                  const u = (Auth.listUsers() || []).find(x => x.id === c.usedBy);
                  usedBy = u ? (U.escapeHtml(u.nama || u.email) + (u.nip ? ' (' + u.nip + ')' : '')) : U.escapeHtml(c.usedBy);
                }
                const noteText = c.note ? U.escapeHtml(c.note) : '<span class="text-muted fst-italic">— belum diisi —</span>';
                const tgl = c.usedAt
                  ? ('dipakai: ' + (U.fmtTanggalISO ? U.fmtTanggalISO(c.usedAt) : c.usedAt.slice(0,10)))
                  : (c.createdAt ? ('dibuat: ' + (U.fmtTanggalISO ? U.fmtTanggalISO(c.createdAt) : c.createdAt.slice(0,10))) : '-');
                const aksi = (c.usedBy || c.revoked)
                  ? `
                    <button class="btn btn-sm btn-outline-primary" data-note="${U.escapeHtml(c.code)}" title="Edit Catatan/Pemilik"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" data-del="${U.escapeHtml(c.code)}" title="Hapus"><i class="bi bi-trash"></i></button>
                  `
                  : `
                    <button class="btn btn-sm btn-outline-secondary" data-copy="${U.escapeHtml(c.code)}" title="Salin Kode"><i class="bi bi-clipboard"></i></button>
                    <button class="btn btn-sm btn-outline-success" data-wa="${U.escapeHtml(c.code)}" title="Kirim via WhatsApp"><i class="bi bi-whatsapp"></i></button>
                    <button class="btn btn-sm btn-outline-primary" data-note="${U.escapeHtml(c.code)}" title="Edit Catatan/Pemilik"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-warning" data-revoke="${U.escapeHtml(c.code)}" title="Cabut"><i class="bi bi-slash-circle"></i></button>
                    <button class="btn btn-sm btn-outline-danger" data-del="${U.escapeHtml(c.code)}" title="Hapus"><i class="bi bi-trash"></i></button>
                  `;
                return `<tr>
                  <td>${i + 1}</td>
                  <td style="font-family:'Courier New',monospace;font-weight:600;letter-spacing:.05em;">${U.escapeHtml(c.code)}</td>
                  <td>${tierBadge}</td>
                  <td>${status}</td>
                  <td class="small">${usedBy}</td>
                  <td class="small">${noteText}</td>
                  <td class="small text-muted">${tgl}</td>
                  <td class="text-end text-nowrap">${aksi}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;

      wrap.querySelectorAll('button[data-copy]').forEach(b => b.addEventListener('click', async () => {
        const c = b.dataset.copy;
        try { await navigator.clipboard.writeText(c); UI.toast('Kode tersalin: ' + c); }
        catch (_) { UI.toast('Gagal salin.', 'danger'); }
      }));
      wrap.querySelectorAll('button[data-wa]').forEach(b => b.addEventListener('click', () => sendCodeViaWa(b.dataset.wa)));
      wrap.querySelectorAll('button[data-note]').forEach(b => b.addEventListener('click', () => editNote(b.dataset.note)));
      wrap.querySelectorAll('button[data-revoke]').forEach(b => b.addEventListener('click', async () => {
        if (!await UI.confirmDialog('Cabut kode ' + b.dataset.revoke + '? Tidak bisa dipakai lagi.')) return;
        Codes.revokeCode(b.dataset.revoke);
        renderRandomList();
      }));
      wrap.querySelectorAll('button[data-del]').forEach(b => b.addEventListener('click', async () => {
        if (!await UI.confirmDialog('Hapus kode ' + b.dataset.del + ' dari daftar?')) return;
        Codes.deleteCode(b.dataset.del);
        renderRandomList();
      }));
    }

    async function sendCodeViaWa(code) {
      const s = Codes.getPurchaseSettings();
      const nomor = prompt('Nomor WA penerima (mis 0812xxxx atau 62812xxxx):');
      if (nomor == null) return;
      const trimmed = String(nomor).trim();
      if (!trimmed) return UI.toast('Nomor kosong.', 'danger');
      const text = Codes.fillTemplate(s.sendTemplate || '', {
        KODE: code,
        APP: s.appName,
        URL: s.appUrl,
        NAMA: '',
        NIP: '',
      });
      const url = Codes.buildWaLink(trimmed, text);
      if (!url) return UI.toast('Nomor WA tidak valid.', 'danger');
      window.open(url, '_blank');
    }

    async function editNote(code) {
      const list = Codes.getCodes();
      const item = list.find(x => x.code === code);
      if (!item) return UI.toast('Kode tidak ditemukan.', 'danger');
      const cur = item.note || '';
      const v = prompt('Catatan / Pemilik untuk kode ' + code + '\n\nContoh: "Pak Fulan - MA Sukowono" atau "Bu Aminah - WA 0812xxxx".', cur);
      if (v == null) return; // cancel
      Codes.setNote(code, String(v).trim());
      renderRandomList();
      UI.toast('Catatan tersimpan.');
    }

    const btnGenFull = document.getElementById('btnGenFull');
    if (btnGenFull) btnGenFull.addEventListener('click', () => {
      const c = Codes.addNewCode('full');
      renderRandomList();
      UI.toast('Kode FULL dibuat: ' + c.code);
    });
    const btnGenTrial = document.getElementById('btnGenTrial');
    if (btnGenTrial) btnGenTrial.addEventListener('click', () => {
      const c = Codes.addNewCode('trial');
      renderRandomList();
      UI.toast('Kode TRIAL dibuat: ' + c.code);
    });
    const btnGen10Full = document.getElementById('btnGen10Full');
    if (btnGen10Full) btnGen10Full.addEventListener('click', async () => {
      if (!await UI.confirmDialog('Generate 10 kode FULL random sekaligus?')) return;
      Codes.addNewCodesBatch('full', 10);
      renderRandomList();
      UI.toast('10 kode FULL berhasil dibuat.');
    });
    const btnGen10Trial = document.getElementById('btnGen10Trial');
    if (btnGen10Trial) btnGen10Trial.addEventListener('click', async () => {
      if (!await UI.confirmDialog('Generate 10 kode TRIAL random sekaligus?')) return;
      Codes.addNewCodesBatch('trial', 10);
      renderRandomList();
      UI.toast('10 kode TRIAL berhasil dibuat.');
    });
    const btnClearUsed = document.getElementById('btnClearUsed');
    if (btnClearUsed) btnClearUsed.addEventListener('click', async () => {
      if (!await UI.confirmDialog('Hapus semua kode yang sudah dipakai atau dicabut?')) return;
      Codes.clearUsedAndRevoked();
      renderRandomList();
      UI.toast('Kode terpakai/dicabut dihapus.');
    });

    function exportRandomCsv() {
      const list = Codes.getCodes();
      if (!list.length) return UI.toast('Tidak ada kode untuk di-export.', 'warning');
      const head = ['No', 'Kode', 'Tier', 'Status', 'Dipakai Oleh', 'Catatan / Pemilik', 'Tanggal Dibuat', 'Tanggal Dipakai'];
      const lines = [head.join(',')];
      list.forEach((c, i) => {
        const tier = (c.tier || 'full').toUpperCase();
        let status = 'Aktif';
        if (c.revoked) status = 'Dicabut';
        else if (c.usedBy) status = 'Terpakai';
        let usedBy = '';
        if (c.usedBy) {
          const u = (Auth.listUsers() || []).find(x => x.id === c.usedBy);
          usedBy = u ? (u.nama || u.email || '') + (u.nip ? ' (' + u.nip + ')' : '') : c.usedBy;
        }
        const cols = [
          i + 1,
          c.code,
          tier,
          status,
          '"' + String(usedBy).replace(/"/g, '""') + '"',
          '"' + String(c.note || '').replace(/"/g, '""') + '"',
          c.createdAt ? c.createdAt.slice(0, 10) : '',
          c.usedAt ? c.usedAt.slice(0, 10) : '',
        ];
        lines.push(cols.join(','));
      });
      const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
      const fname = 'kode-aktivasi-random-' + (U.fmtTanggalISO ? U.fmtTanggalISO(new Date()) : new Date().toISOString().slice(0, 10)) + '.csv';
      U.downloadBlob(blob, fname);
      UI.toast(list.length + ' kode di-export ke CSV.');
    }

    async function exportRandomXlsx() {
      const list = Codes.getCodes();
      if (!list.length) return UI.toast('Tidak ada kode untuk di-export.', 'warning');
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Pokjawas Madrasah Kab. Jember';
      const ws = wb.addWorksheet('Kode Aktivasi');
      const head = ['No', 'Kode Aktivasi', 'Tier', 'Status', 'Dipakai Oleh', 'Catatan / Pemilik', 'Tanggal Dibuat', 'Tanggal Dipakai'];
      ws.addRow(head);
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E2A5A' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 22;
      list.forEach((c, i) => {
        const tier = (c.tier || 'full').toUpperCase();
        let status = 'Aktif';
        if (c.revoked) status = 'Dicabut';
        else if (c.usedBy) status = 'Terpakai';
        let usedBy = '';
        if (c.usedBy) {
          const u = (Auth.listUsers() || []).find(x => x.id === c.usedBy);
          usedBy = u ? (u.nama || u.email || '') + (u.nip ? ' (' + u.nip + ')' : '') : c.usedBy;
        }
        ws.addRow([
          i + 1,
          c.code,
          tier,
          status,
          usedBy,
          c.note || '',
          c.createdAt ? c.createdAt.slice(0, 10) : '',
          c.usedAt ? c.usedAt.slice(0, 10) : '',
        ]);
      });
      // Style data rows + warna per status
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const statusCell = row.getCell(4);
        const status = String(statusCell.value || '').toLowerCase();
        let bgColor = null;
        if (status === 'aktif') bgColor = 'FFE8F5E9';
        else if (status === 'terpakai') bgColor = 'FFF1F3F5';
        else if (status === 'dicabut') bgColor = 'FFFFEBEE';
        if (bgColor) {
          row.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
          });
        }
        row.getCell(2).font = { name: 'Courier New', bold: true };
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFB0B0B0' } },
            left: { style: 'thin', color: { argb: 'FFB0B0B0' } },
            right: { style: 'thin', color: { argb: 'FFB0B0B0' } },
            bottom: { style: 'thin', color: { argb: 'FFB0B0B0' } },
          };
        });
      });
      ws.columns = [
        { width: 5 },
        { width: 26 },
        { width: 10 },
        { width: 12 },
        { width: 38 },
        { width: 30 },
        { width: 16 },
        { width: 16 },
      ];
      ws.getColumn(1).alignment = { horizontal: 'center' };
      ws.getColumn(2).alignment = { horizontal: 'center' };
      ws.getColumn(3).alignment = { horizontal: 'center' };
      ws.getColumn(4).alignment = { horizontal: 'center' };
      ws.getColumn(7).alignment = { horizontal: 'center' };
      ws.getColumn(8).alignment = { horizontal: 'center' };
      ws.views = [{ state: 'frozen', ySplit: 1 }];
      ws.autoFilter = { from: 'A1', to: 'H1' };
      // Sheet ringkasan
      const ws2 = wb.addWorksheet('Ringkasan');
      ws2.addRow(['Total kode', list.length]);
      ws2.addRow(['Aktif', list.filter(c => !c.usedBy && !c.revoked).length]);
      ws2.addRow(['Terpakai', list.filter(c => c.usedBy).length]);
      ws2.addRow(['Dicabut', list.filter(c => c.revoked).length]);
      ws2.addRow(['FULL', list.filter(c => (c.tier || 'full') === 'full').length]);
      ws2.addRow(['TRIAL', list.filter(c => c.tier === 'trial').length]);
      ws2.addRow(['Generated at', new Date().toISOString().slice(0, 19).replace('T', ' ')]);
      ws2.getColumn(1).width = 22; ws2.getColumn(1).font = { bold: true };
      ws2.getColumn(2).width = 30;
      const buf = await wb.xlsx.writeBuffer();
      const fname = 'kode-aktivasi-random-' + (U.fmtTanggalISO ? U.fmtTanggalISO(new Date()) : new Date().toISOString().slice(0, 10)) + '.xlsx';
      U.downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fname);
      UI.toast(list.length + ' kode di-export ke Excel.');
    }

    function printRandom() {
      const list = Codes.getCodes();
      if (!list.length) return UI.toast('Tidak ada kode untuk dicetak.', 'warning');
      const w = window.open('', '_blank');
      const rowsHtml = list.map((c, i) => {
        const tier = (c.tier || 'full').toUpperCase();
        let status = 'Aktif';
        if (c.revoked) status = 'Dicabut';
        else if (c.usedBy) status = 'Terpakai';
        let usedBy = '-';
        if (c.usedBy) {
          const u = (Auth.listUsers() || []).find(x => x.id === c.usedBy);
          usedBy = u ? (U.escapeHtml(u.nama || u.email || '') + (u.nip ? ' (' + u.nip + ')' : '')) : U.escapeHtml(c.usedBy);
        }
        return `<tr><td>${i + 1}</td><td class="kode">${U.escapeHtml(c.code)}</td><td>${tier}</td><td>${status}</td><td>${usedBy}</td><td>${U.escapeHtml(c.note || '')}</td><td>${c.createdAt ? c.createdAt.slice(0, 10) : ''}</td><td>${c.usedAt ? c.usedAt.slice(0, 10) : ''}</td></tr>`;
      }).join('');
      const aktif = list.filter(c => !c.usedBy && !c.revoked).length;
      const dipakai = list.filter(c => c.usedBy).length;
      const dicabut = list.filter(c => c.revoked).length;
      w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Daftar Kode Aktivasi Random</title>
        <style>
          body{font-family:Arial,sans-serif;padding:18px;}
          h2{margin:0 0 4px 0;color:#1E2A5A;}
          .sub{color:#555;margin-bottom:12px;font-size:.9em;}
          table{border-collapse:collapse;width:100%;font-size:.85em;}
          th,td{border:1px solid #444;padding:4px 8px;}
          th{background:#1E2A5A;color:#fff;}
          .kode{font-family:'Courier New',monospace;letter-spacing:.05em;font-weight:bold;}
          @media print{ .noprint{display:none;} body{padding:8px;} }
        </style></head><body>
        <h2>Daftar Kode Aktivasi Random e-RHK Pengawas Madrasah 2026</h2>
        <div class="sub">Pokjawas Kab. Jember &mdash; ${U.fmtTanggal ? U.fmtTanggal(new Date()) : new Date().toLocaleDateString('id-ID')} &mdash; Total: ${list.length} (Aktif: ${aktif}, Terpakai: ${dipakai}, Dicabut: ${dicabut})</div>
        <table><thead><tr>
          <th>No</th><th>Kode</th><th>Tier</th><th>Status</th><th>Dipakai Oleh</th><th>Catatan / Pemilik</th><th>Dibuat</th><th>Dipakai</th>
        </tr></thead><tbody>${rowsHtml}</tbody></table>
        <p class="noprint"><button onclick="window.print()">Cetak</button></p>
      </body></html>`);
      w.document.close();
    }

    const btnRandomCsv = document.getElementById('btnRandomExportCsv');
    if (btnRandomCsv) btnRandomCsv.addEventListener('click', exportRandomCsv);
    const btnRandomXlsx = document.getElementById('btnRandomExportXlsx');
    if (btnRandomXlsx) btnRandomXlsx.addEventListener('click', exportRandomXlsx);
    const btnRandomPrint = document.getElementById('btnRandomPrint');
    if (btnRandomPrint) btnRandomPrint.addEventListener('click', printRandom);

    const btnExport = document.getElementById('btnExportBundle');
    if (btnExport) btnExport.addEventListener('click', async () => {
      const aktif = Codes.getCodes().filter(c => !c.usedBy && !c.revoked);
      if (!aktif.length) return UI.toast('Tidak ada kode aktif untuk di-export.', 'warning');
      const lines = aktif.map(c => `  { code: '${c.code}', tier: '${(c.tier || 'full')}', note: '' },`).join('\n');
      const snippet = 'window.BUNDLED_CODES = [\n' + lines + '\n];';
      // Tampilkan modal copy-paste
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.innerHTML = `
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-cloud-arrow-up"></i> Export Bundled Codes</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p class="small mb-2">Salin blok di bawah, lalu paste ke file <code>js/data/purchase_default.js</code> di repo, ganti baris <code>window.BUNDLED_CODES = [ ... ];</code>. Commit + push ke <code>gh-pages</code>. Dalam ~1 menit semua device bisa aktivasi pakai kode ini.</p>
              <p class="small mb-2">Atau kirim blok ini via chat ke Bari, nanti dia yang commit.</p>
              <textarea class="form-control" rows="14" id="bundleSnippet" style="font-family:'Courier New',monospace;font-size:12px;" readonly>${snippet.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</textarea>
              <div class="mt-2"><strong>${aktif.length}</strong> kode aktif di-export.</div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-success" id="btnCopyBundle"><i class="bi bi-clipboard"></i> Salin ke Clipboard</button>
              <button class="btn btn-secondary" data-bs-dismiss="modal">Tutup</button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
      modal.addEventListener('hidden.bs.modal', () => modal.remove());
      modal.querySelector('#btnCopyBundle').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(snippet); UI.toast('Snippet tersalin.'); }
        catch (_) {
          modal.querySelector('#bundleSnippet').select();
          document.execCommand('copy');
          UI.toast('Snippet tersalin (fallback).');
        }
      });
    });

    renderRandomList();
    renderRegistry();
  };
})();
