// Admin > Kode Aktivasi — generate kode untuk NIP pengawas + import dari Excel + rotate secret.
(function () {
  Page.AdminAktivasi = function () {
    UI.shell('Kode Aktivasi', `
      <div class="alert alert-light border mb-3">
        <i class="bi bi-shield-check text-success"></i>
        Pengawas hanya bisa register kalau punya <strong>kode aktivasi</strong> dari Anda.
        Kode dibuat dari <strong>NIP</strong> (18 digit) — setiap NIP punya kode unik.
      </div>

      <ul class="nav nav-tabs mb-3" id="aktTab" role="tablist">
        <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tabRandom" type="button">Kode Tier (Random)</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabSync" type="button">🔄 Sinkronisasi</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabSingle" type="button">Per NIP (Legacy)</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabBulk" type="button">Bulk (Daftar NIP)</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabImport" type="button">Import Excel Pengawas</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabSecret" type="button">Secret Legacy</button></li>
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
              <button class="btn btn-sm btn-outline-success ms-auto" id="btnSyncNow"><i class="bi bi-arrow-clockwise"></i> Push Sekarang</button>
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

        <div class="tab-pane fade" id="tabSingle">
          <div class="card"><div class="card-body">
            <h5 class="card-title"><i class="bi bi-key"></i> Generate Kode untuk Satu NIP</h5>
            <div class="row g-2">
              <div class="col-md-4"><input id="namaIn" class="form-control" placeholder="Nama (opsional, untuk pesan)" /></div>
              <div class="col-md-5"><input id="nipIn" class="form-control" inputmode="numeric" maxlength="18" placeholder="NIP 18 digit" autofocus /></div>
              <div class="col-md-3"><button class="btn btn-success w-100" id="btnGen"><i class="bi bi-key"></i> Generate</button></div>
            </div>
            <div id="result" class="mt-3"></div>
          </div></div>
        </div>

        <div class="tab-pane fade" id="tabBulk">
          <div class="card"><div class="card-body">
            <h5 class="card-title"><i class="bi bi-list-ol"></i> Generate Massal dari Daftar NIP</h5>
            <p class="small text-muted mb-2">Tempel daftar NIP (satu per baris) atau format <code>NIP,Nama</code>.</p>
            <textarea id="bulkIn" class="form-control" rows="5" placeholder="196605032002121002,ABD HAMID&#10;196906112005011005,ABDUL LATIF ANWAR"></textarea>
            <div class="mt-2"><button class="btn btn-outline-success" id="btnBulk"><i class="bi bi-collection"></i> Generate Semua</button></div>
            <div id="bulkResult" class="mt-3"></div>
          </div></div>
        </div>

        <div class="tab-pane fade" id="tabImport">
          <div class="card"><div class="card-body">
            <h5 class="card-title"><i class="bi bi-file-earmark-excel"></i> Import dari Excel Daftar Pengawas</h5>
            <p class="small text-muted mb-2">Upload file Excel berisi daftar pengawas. Sistem akan auto-deteksi kolom <strong>Nama</strong> dan <strong>NIP</strong>, lalu generate kode untuk semua baris. Cocok untuk file resmi <em>DATA PENGAWAS 2025</em>.</p>
            <input id="xlsIn" type="file" class="form-control" accept=".xlsx,.xls,.xlsm" />
            <div class="form-text">Sheet pertama yang punya kolom NIP akan dipakai. Header bisa di baris 1 (kolom: <em>Nama Pengawas / NIP Pengawas / Wilayah</em>).</div>
            <div id="importResult" class="mt-3"></div>
          </div></div>
        </div>

        <div class="tab-pane fade" id="tabSecret">
          <div class="card"><div class="card-body">
            <h5 class="card-title"><i class="bi bi-shield-lock"></i> Secret Aktivasi <small class="text-muted" id="secretBadge"></small></h5>
            <p class="small text-muted">Secret dipakai untuk men-derive kode dari NIP. Ubah secret kalau ada kode yang bocor — semua kode yang sudah dibagikan jadi invalid, tapi user yang sudah terdaftar tetap bisa login.</p>
            <div class="row g-2">
              <div class="col-md-8"><input id="secretIn" class="form-control" value="${U.escapeHtml(KodeAktivasi.getSecret())}" /></div>
              <div class="col-md-4"><button class="btn btn-warning w-100" id="btnSecret"><i class="bi bi-shield-lock"></i> Simpan Secret Baru</button></div>
            </div>
            <div class="mt-2">
              <button class="btn btn-sm btn-outline-secondary" id="btnRandom"><i class="bi bi-dice-5"></i> Generate Secret Acak</button>
              <button class="btn btn-sm btn-outline-secondary" id="btnReveal"><i class="bi bi-eye"></i> Tampilkan/Sembunyikan</button>
            </div>
          </div></div>
        </div>
      </div>
    `);

    // Status badge default secret
    const badge = document.getElementById('secretBadge');
    if (KodeAktivasi.isDefault()) {
      badge.innerHTML = '<span class="badge bg-warning text-dark">menggunakan default — disarankan ganti</span>';
    } else {
      badge.innerHTML = '<span class="badge bg-success">custom</span>';
    }

    // ===== Single =====
    document.getElementById('btnGen').addEventListener('click', () => doGenerate());
    document.getElementById('nipIn').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); doGenerate(); }
    });

    async function doGenerate() {
      const nama = document.getElementById('namaIn').value.trim();
      const nip = KodeAktivasi.normNip(document.getElementById('nipIn').value);
      if (!nip || nip.length < 10) return UI.toast('NIP tidak valid (minimal 10 digit angka).', 'danger');
      const k = await KodeAktivasi.generate(nip);
      const baseUrl = location.origin + location.pathname.replace(/\/+$/, '/') + '#/register';
      const namaHtml = nama ? `<div class="fw-bold">${U.escapeHtml(nama)}</div>` : '';
      document.getElementById('result').innerHTML = `
        <div class="alert alert-success mb-0">
          ${namaHtml}
          <div class="small text-muted">NIP</div>
          <div style="font-family:'Courier New',monospace;letter-spacing:.05em;">${U.escapeHtml(nip)}</div>
          <div class="display-6 mt-2 mb-2" style="font-family:'Courier New',monospace;letter-spacing:.15em;">${k}</div>
          <div class="small text-muted mb-2">Daftar di: <code>${U.escapeHtml(baseUrl)}</code></div>
          <button class="btn btn-sm btn-success" id="btnCopyKode"><i class="bi bi-clipboard"></i> Salin Kode</button>
          <button class="btn btn-sm btn-outline-success" id="btnCopyMsg"><i class="bi bi-clipboard-check"></i> Salin Pesan Lengkap</button>
          <a class="btn btn-sm btn-outline-success" id="btnWA" target="_blank"><i class="bi bi-whatsapp"></i> Kirim via WhatsApp</a>
        </div>
      `;
      const greeting = nama ? `Halo ${nama},\n\n` : 'Halo Bapak/Ibu,\n\n';
      const msgFull = `${greeting}Berikut data login untuk aplikasi e-SKP Pengawas Madrasah 2026:\n\nNIP: ${nip}\nKode Aktivasi: ${k}\n\nLink Daftar: ${baseUrl}\n\nLangkah pendaftaran:\n1) Buka link di atas\n2) Isi Nama, NIP, Email pribadi, Kode Aktivasi, dan Password baru\n3) Login dengan email & password yang dibuat\n\nTerima kasih.`;
      document.getElementById('btnCopyKode').onclick = async () => {
        try { await navigator.clipboard.writeText(k); UI.toast('Kode tersalin.'); } catch (_) { UI.toast('Gagal salin.', 'danger'); }
      };
      document.getElementById('btnCopyMsg').onclick = async () => {
        try { await navigator.clipboard.writeText(msgFull); UI.toast('Pesan tersalin.'); } catch (_) { UI.toast('Gagal salin.', 'danger'); }
      };
      document.getElementById('btnWA').href = 'https://wa.me/?text=' + encodeURIComponent(msgFull);
    }

    // ===== Bulk =====
    document.getElementById('btnBulk').addEventListener('click', async () => {
      const raw = document.getElementById('bulkIn').value || '';
      const lines = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      const rows = [];
      for (const line of lines) {
        // Bisa "NIP" atau "NIP,Nama" atau "Nama;NIP" — fleksibel
        const parts = line.split(/[,;\t]/).map(s => s.trim());
        let nip = '';
        let nama = '';
        for (const p of parts) {
          const dig = KodeAktivasi.normNip(p);
          if (dig.length >= 15) { nip = dig; }
          else if (p) { nama = nama || p; }
        }
        if (!nip) continue;
        rows.push({ nama: nama || '-', nip, kode: await KodeAktivasi.generate(nip) });
      }
      if (!rows.length) return UI.toast('Tidak ada NIP valid (minimal 15 digit).', 'danger');
      renderRows(rows, document.getElementById('bulkResult'), 'bulk');
    });

    // ===== Import Excel =====
    document.getElementById('xlsIn').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const buf = await U.readFileAsArrayBuffer(file);
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buf);
        const rows = await extractFromWorkbook(wb);
        if (!rows.length) {
          document.getElementById('importResult').innerHTML = '<div class="alert alert-warning">Tidak ada baris dengan kolom Nama+NIP yang terdeteksi. Pastikan file punya header "Nama Pengawas" atau "NAMA" dan "NIP Pengawas" atau "NIP".</div>';
          return;
        }
        renderRows(rows, document.getElementById('importResult'), 'import');
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
          const nip = KodeAktivasi.normNip(nipRaw);
          if (!nama || !nip || nip.length < 15) continue;
          const wilayah = wilayahCol ? String(row.getCell(wilayahCol).value || '').trim() : '';
          let telp = telpCol ? row.getCell(telpCol).value : '';
          if (telp && typeof telp === 'object' && 'result' in telp) telp = telp.result;
          telp = String(telp || '').trim();
          out.push({ nama, nip, wilayah, telp, kode: await KodeAktivasi.generate(nip) });
        }
        if (!out.length) return [];
        // Simpan ke registry biar register page bisa lookup nama dari NIP
        try {
          const stat = window.PengawasRegistry?.upsertMany(out);
          if (stat) console.log('[registry] added', stat.added, 'updated', stat.updated, 'total', stat.total);
        } catch (e) { console.warn('registry upsert:', e); }
        return out;
      }
      return [];
    }

    function renderRows(rows, container, prefix) {
      const showWil = rows.some(r => r.wilayah);
      const showTelp = rows.some(r => r.telp);
      const isImport = prefix === 'import';
      const aksiWidth = isImport ? '10rem' : '5rem';
      const tbl = `
        <div class="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <div><strong>${rows.length}</strong> kode aktivasi tergenerate.</div>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-sm btn-outline-success" id="${prefix}_csv"><i class="bi bi-filetype-csv"></i> Export CSV</button>
            <button class="btn btn-sm btn-outline-success" id="${prefix}_xlsx"><i class="bi bi-file-earmark-excel"></i> Export Excel</button>
            <button class="btn btn-sm btn-outline-success" id="${prefix}_print"><i class="bi bi-printer"></i> Cetak</button>
            ${isImport ? `<button class="btn btn-sm btn-outline-danger" id="${prefix}_clearAll"><i class="bi bi-trash"></i> Hapus Semua</button>` : ''}
          </div>
        </div>
        <div class="table-responsive" style="max-height:480px;">
          <table class="table table-sm table-bordered table-striped align-middle mb-0">
            <thead class="table-light position-sticky top-0"><tr>
              <th style="width:3rem;">#</th><th>Nama</th><th style="width:14rem;">NIP</th>
              ${showWil ? '<th>Wilayah</th>' : ''}
              ${showTelp ? '<th style="width:9rem;">Telp/WA</th>' : ''}
              <th style="width:10rem;">Kode</th>
              <th style="width:${aksiWidth};">Aksi</th>
            </tr></thead>
            <tbody>${rows.map((r, i) => `<tr>
              <td>${i+1}</td>
              <td>${U.escapeHtml(r.nama)}</td>
              <td style="font-family:'Courier New',monospace;">${U.escapeHtml(r.nip)}</td>
              ${showWil ? `<td>${U.escapeHtml(r.wilayah || '')}</td>` : ''}
              ${showTelp ? `<td>${U.escapeHtml(r.telp || '')}</td>` : ''}
              <td style="font-family:'Courier New',monospace;letter-spacing:.05em;font-weight:bold;">${r.kode}</td>
              <td class="text-nowrap">
                <button class="btn btn-sm btn-outline-success" data-row="${i}" title="Salin pesan WhatsApp"><i class="bi bi-whatsapp"></i></button>
                ${isImport ? `
                <button class="btn btn-sm btn-outline-primary" data-edit="${i}" title="Edit data pengawas"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" data-del="${i}" title="Hapus pengawas dari registry"><i class="bi bi-trash"></i></button>
                ` : ''}
              </td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      `;
      container.innerHTML = tbl;

      // Hapus Semua (import only)
      if (isImport) {
        const btnAll = document.getElementById(prefix + '_clearAll');
        if (btnAll) btnAll.addEventListener('click', async () => {
          if (!await UI.confirmDialog(`Hapus SEMUA ${rows.length} pengawas dari registry? Akun login pengawas yang sudah daftar tidak ikut dihapus.`)) return;
          try { window.PengawasRegistry?.clear(); } catch (e) {}
          rows.length = 0;
          container.innerHTML = '<div class="alert alert-success mb-0"><i class="bi bi-check-circle"></i> Registry pengawas dikosongkan.</div>';
          UI.toast('Registry pengawas dikosongkan.');
        });

        // Edit per-row
        container.querySelectorAll('button[data-edit]').forEach(b => b.addEventListener('click', async () => {
          const idx = Number(b.dataset.edit);
          const r = rows[idx];
          if (!r) return;
          const nama = prompt('Nama:', r.nama || '');
          if (nama == null) return;
          const wilayah = prompt('Wilayah/KKMA:', r.wilayah || '');
          if (wilayah == null) return;
          const telp = prompt('Telp/WA:', r.telp || '');
          if (telp == null) return;
          r.nama = String(nama).trim();
          r.wilayah = String(wilayah).trim();
          r.telp = String(telp).trim();
          try { window.PengawasRegistry?.updateByNip(r.nip, { nama: r.nama, wilayah: r.wilayah, telp: r.telp }); } catch (e) { console.warn(e); }
          renderRows(rows, container, prefix);
          UI.toast('Data ' + r.nama + ' tersimpan.');
        }));

        // Hapus per-row
        container.querySelectorAll('button[data-del]').forEach(b => b.addEventListener('click', async () => {
          const idx = Number(b.dataset.del);
          const r = rows[idx];
          if (!r) return;
          if (!await UI.confirmDialog('Hapus pengawas ' + (r.nama || r.nip) + ' dari registry?')) return;
          try { window.PengawasRegistry?.removeByNip(r.nip); } catch (e) { console.warn(e); }
          rows.splice(idx, 1);
          if (rows.length) renderRows(rows, container, prefix);
          else container.innerHTML = '<div class="alert alert-info mb-0"><i class="bi bi-info-circle"></i> Tidak ada data pengawas tersisa.</div>';
          UI.toast('Pengawas ' + (r.nama || r.nip) + ' dihapus.');
        }));
      }

      // CSV
      document.getElementById(prefix + '_csv').onclick = () => {
        const head = ['No','Nama','NIP'];
        if (showWil) head.push('Wilayah');
        if (showTelp) head.push('Telp');
        head.push('Kode Aktivasi');
        const lines = [head.join(',')];
        rows.forEach((r, i) => {
          const cols = [i+1, '"'+r.nama.replace(/"/g,'""')+'"', r.nip];
          if (showWil) cols.push('"'+(r.wilayah||'').replace(/"/g,'""')+'"');
          if (showTelp) cols.push('"'+(r.telp||'').replace(/"/g,'""')+'"');
          cols.push(r.kode);
          lines.push(cols.join(','));
        });
        const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        U.downloadBlob(blob, 'kode-aktivasi-pengawas-' + U.fmtTanggalISO(new Date()) + '.csv');
      };

      // XLSX
      document.getElementById(prefix + '_xlsx').onclick = async () => {
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet('Kode Aktivasi');
        const head = ['No','Nama','NIP'];
        if (showWil) head.push('Wilayah');
        if (showTelp) head.push('Telp');
        head.push('Kode Aktivasi');
        ws.addRow(head);
        ws.getRow(1).font = { bold: true };
        ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
        rows.forEach((r, i) => {
          const cols = [i+1, r.nama, r.nip];
          if (showWil) cols.push(r.wilayah || '');
          if (showTelp) cols.push(r.telp || '');
          cols.push(r.kode);
          ws.addRow(cols);
        });
        ws.columns.forEach((c, idx) => {
          c.width = idx === 1 ? 36 : (idx === 2 ? 22 : 16);
          if (head[idx] === 'NIP' || head[idx] === 'Kode Aktivasi') c.alignment = { horizontal: 'center' };
        });
        ws.eachRow((row) => {
          row.eachCell((cell) => {
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }, bottom: { style: 'thin' } };
          });
        });
        const buf = await wb.xlsx.writeBuffer();
        U.downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'kode-aktivasi-pengawas-' + U.fmtTanggalISO(new Date()) + '.xlsx');
      };

      // Print
      document.getElementById(prefix + '_print').onclick = () => {
        const w = window.open('', '_blank');
        w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Kode Aktivasi Pengawas</title>
          <style>
            body{font-family:Arial,sans-serif;padding:18px;}
            h2{margin:0 0 4px 0;}
            .sub{color:#555;margin-bottom:12px;font-size:.9em;}
            table{border-collapse:collapse;width:100%;font-size:.9em;}
            th,td{border:1px solid #444;padding:4px 8px;}
            th{background:#e8f5e9;}
            .kode{font-family:'Courier New',monospace;letter-spacing:.05em;font-weight:bold;}
            @media print{ .noprint{display:none;} body{padding:8px;} }
          </style></head><body>
          <h2>Daftar Kode Aktivasi e-SKP Pengawas Madrasah 2026</h2>
          <div class="sub">Pokjawas Kab. Jember &mdash; ${U.fmtTanggal(new Date())} &mdash; Total: ${rows.length}</div>
          <table><thead><tr>
            <th>No</th><th>Nama</th><th>NIP</th>${showWil?'<th>Wilayah</th>':''}${showTelp?'<th>Telp</th>':''}<th>Kode Aktivasi</th>
          </tr></thead><tbody>
          ${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${U.escapeHtml(r.nama)}</td><td>${U.escapeHtml(r.nip)}</td>${showWil?`<td>${U.escapeHtml(r.wilayah||'')}</td>`:''}${showTelp?`<td>${U.escapeHtml(r.telp||'')}</td>`:''}<td class="kode">${r.kode}</td></tr>`).join('')}
          </tbody></table>
          <p class="noprint"><button onclick="window.print()">Cetak</button></p>
        </body></html>`);
        w.document.close();
      };

      // Per-row WhatsApp
      const baseUrl = location.origin + location.pathname.replace(/\/+$/, '/') + '#/register';
      container.querySelectorAll('button[data-row]').forEach(b => b.addEventListener('click', async () => {
        const r = rows[Number(b.dataset.row)];
        const msg = `Halo ${r.nama},\n\nBerikut kode aktivasi untuk aplikasi e-SKP Pengawas Madrasah 2026:\n\nNIP: ${r.nip}\nKode Aktivasi: ${r.kode}\n\nLink Daftar: ${baseUrl}\n\nLangkah pendaftaran:\n1) Buka link di atas\n2) Isi Nama, NIP, Email pribadi, Kode Aktivasi, dan Password baru\n3) Login dengan email & password yang dibuat\n\nTerima kasih.`;
        try {
          await navigator.clipboard.writeText(msg);
          UI.toast('Pesan untuk ' + r.nama + ' tersalin.');
        } catch (_) {
          window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
        }
      }));
    }

    // ===== Secret =====
    document.getElementById('btnSecret').addEventListener('click', async () => {
      const v = document.getElementById('secretIn').value.trim();
      if (!v) return UI.toast('Secret tidak boleh kosong.', 'danger');
      if (v === KodeAktivasi.getSecret()) return UI.toast('Secret tidak berubah.', 'secondary');
      if (!await UI.confirmDialog('Ubah secret? Semua kode aktivasi yang sudah dibagikan akan invalid. Pengawas yang sudah register tetap bisa login.')) return;
      KodeAktivasi.setSecret(v);
      UI.toast('Secret tersimpan.');
      Page.AdminAktivasi();
    });
    document.getElementById('btnRandom').addEventListener('click', () => {
      const arr = new Uint8Array(24);
      crypto.getRandomValues(arr);
      const s = 'JBR-' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32).toUpperCase();
      document.getElementById('secretIn').value = s;
      UI.toast('Secret acak digenerate. Klik Simpan untuk aktifkan.');
    });
    document.getElementById('btnReveal').addEventListener('click', () => {
      const inp = document.getElementById('secretIn');
      inp.type = inp.type === 'password' ? 'text' : 'password';
    });
    document.getElementById('secretIn').type = 'password';

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
  };
})();
