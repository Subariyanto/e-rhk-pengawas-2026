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
        <li class="nav-item"><button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tabSingle" type="button">Per NIP</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabBulk" type="button">Bulk (Daftar NIP)</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabImport" type="button">Import Excel Pengawas</button></li>
        <li class="nav-item"><button class="nav-link" data-bs-toggle="tab" data-bs-target="#tabSecret" type="button">Secret</button></li>
      </ul>

      <div class="tab-content">
        <div class="tab-pane fade show active" id="tabSingle">
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
        if (out.length) return out;
      }
      return [];
    }

    function renderRows(rows, container, prefix) {
      const showWil = rows.some(r => r.wilayah);
      const showTelp = rows.some(r => r.telp);
      const tbl = `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div><strong>${rows.length}</strong> kode aktivasi tergenerate.</div>
          <div>
            <button class="btn btn-sm btn-outline-success" id="${prefix}_csv"><i class="bi bi-filetype-csv"></i> Export CSV</button>
            <button class="btn btn-sm btn-outline-success" id="${prefix}_xlsx"><i class="bi bi-file-earmark-excel"></i> Export Excel</button>
            <button class="btn btn-sm btn-outline-success" id="${prefix}_print"><i class="bi bi-printer"></i> Cetak</button>
          </div>
        </div>
        <div class="table-responsive" style="max-height:480px;">
          <table class="table table-sm table-bordered table-striped align-middle mb-0">
            <thead class="table-light position-sticky top-0"><tr>
              <th style="width:3rem;">#</th><th>Nama</th><th style="width:14rem;">NIP</th>
              ${showWil ? '<th>Wilayah</th>' : ''}
              ${showTelp ? '<th style="width:9rem;">Telp/WA</th>' : ''}
              <th style="width:10rem;">Kode</th>
              <th style="width:5rem;">Aksi</th>
            </tr></thead>
            <tbody>${rows.map((r, i) => `<tr>
              <td>${i+1}</td>
              <td>${U.escapeHtml(r.nama)}</td>
              <td style="font-family:'Courier New',monospace;">${U.escapeHtml(r.nip)}</td>
              ${showWil ? `<td>${U.escapeHtml(r.wilayah || '')}</td>` : ''}
              ${showTelp ? `<td>${U.escapeHtml(r.telp || '')}</td>` : ''}
              <td style="font-family:'Courier New',monospace;letter-spacing:.05em;font-weight:bold;">${r.kode}</td>
              <td>
                <button class="btn btn-sm btn-outline-success" data-row="${i}" title="Salin pesan WhatsApp"><i class="bi bi-whatsapp"></i></button>
              </td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
      `;
      container.innerHTML = tbl;

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
  };
})();
