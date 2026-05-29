// Master RHK page (list, detail, inline edit, resizable columns, add custom, delete custom)
(function () {
  const COL_WIDTH_KEY = 'master_rhk_col_widths_v2';
  const COLS = [
    { label: 'No',                            width: 80  },
    { label: 'TW',                            width: 80  },
    { label: 'Jenis',                         width: 100 },
    { label: 'RHK Atasan yang Diintervensi',  width: 280 },
    { label: 'Rencana Hasil Kerja',           width: 240 },
    { label: 'Aspek',                         width: 90  },
    { label: 'Indikator Kinerja Individu',    width: 240 },
    { label: 'Target',                        width: 100 },
    { label: 'Rencana Aksi',                  width: 280 },
    { label: 'Nama Eviden / Bukti Dukung',    width: 240 },
    { label: 'Durasi',                        width: 100 },
    { label: 'Aksi',                          width: 130 },
  ];

  function getMaster() {
    return Store.get('master_rhk', null) || JSON.parse(JSON.stringify(window.MASTER_RHK_DEFAULT));
  }
  function saveMaster(list) { Store.set('master_rhk', list); }

  function getColWidths() {
    const saved = Store.getGlobal(COL_WIDTH_KEY, null);
    const widths = COLS.map(c => c.width);
    if (saved && Array.isArray(saved) && saved.length === COLS.length) {
      saved.forEach((w, i) => { if (typeof w === 'number' && w >= 50) widths[i] = w; });
    }
    return widths;
  }
  function saveColWidths(widths) { Store.setGlobal(COL_WIDTH_KEY, widths); }
  function resetColWidths() { Store.removeGlobal(COL_WIDTH_KEY); }

  function attr(s) { return U.escapeHtml(s == null ? '' : String(s)); }

  Page.MasterRHK = function () {
    const list = getMaster();
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const fTw = params.get('tw') || '';
    const fQ = (params.get('q') || '').toLowerCase();

    const filtered = list.filter(r => {
      if (fTw && r.triwulan !== fTw) return false;
      if (fQ) {
        const blob = (r.id + ' ' + r.nama_eviden + ' ' + (r.rencana_hasil_kerja || '') + ' ' + (r.indikator_kuantitas || '')).toLowerCase();
        if (!blob.includes(fQ)) return false;
      }
      return true;
    });

    const widths = getColWidths();
    const totalW = widths.reduce((a, b) => a + b, 0);

    UI.shell('Master RHK', `
      <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
        <div class="input-group" style="max-width:360px;">
          <span class="input-group-text"><i class="bi bi-search"></i></span>
          <input id="qsearch" class="form-control" placeholder="Cari RHK..." value="${U.escapeHtml(fQ)}" />
        </div>
        <select id="ftw" class="form-select" style="max-width:200px;">
          <option value="">Semua Triwulan</option>
          ${['I','II','III','IV','TAMBAHAN'].map(t => `<option ${fTw === t ? 'selected' : ''} value="${t}">${t === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + t}</option>`).join('')}
        </select>
        <div class="ms-auto d-flex gap-2 flex-wrap">
          <button class="btn btn-success" id="btnAdd"><i class="bi bi-plus-circle"></i> Tambah RHK</button>
          <button class="btn btn-outline-secondary" id="btnResetCol" title="Reset lebar kolom ke default"><i class="bi bi-arrows-angle-contract"></i> Lebar Kolom</button>
          <button class="btn btn-outline-secondary" id="btnReset" title="Reset Master RHK ke 30 RHK default"><i class="bi bi-arrow-counterclockwise"></i> Reset Default</button>
        </div>
      </div>

      <div class="alert alert-info py-2 small mb-3">
        <i class="bi bi-info-circle"></i>
        Klik sel mana saja untuk edit langsung — perubahan tersimpan otomatis. Seret <strong>ujung kanan header kolom</strong> untuk ubah lebar.
      </div>

      <div class="card">
        <div class="table-wide-wrap">
          <table class="table table-hover table-sm rhk-table mb-0" id="rhkTable" style="table-layout:fixed; width:${totalW}px;">
            <colgroup id="rhkColgroup">
              ${widths.map(w => `<col style="width:${w}px">`).join('')}
            </colgroup>
            <thead>
              <tr>
                ${COLS.map((c, i) => `<th style="position:relative;">${U.escapeHtml(c.label)}${i < COLS.length - 1 ? `<span class="col-resize-handle" data-col="${i}"></span>` : ''}</th>`).join('')}
              </tr>
            </thead>
            <tbody id="rhkTbody">
              ${filtered.map(r => renderRows(r)).join('') || `<tr><td colspan="${COLS.length}" class="text-center text-muted p-4">Tidak ada RHK yang cocok.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      <div class="text-muted small mt-2">Menampilkan ${filtered.length} dari ${list.length} RHK.</div>
    `);

    // === Filter ===
    const updateHash = () => {
      const q = document.getElementById('qsearch').value;
      const tw = document.getElementById('ftw').value;
      const ps = new URLSearchParams();
      if (q) ps.set('q', q);
      if (tw) ps.set('tw', tw);
      const qs = ps.toString();
      Router.navigate('/master-rhk' + (qs ? '?' + qs : ''), true);
      Page.MasterRHK();
    };
    document.getElementById('qsearch').addEventListener('input', U.debounce(updateHash, 300));
    document.getElementById('ftw').addEventListener('change', updateHash);

    // === Reset default ===
    document.getElementById('btnReset').addEventListener('click', async () => {
      if (await UI.confirmDialog('Kembalikan Master RHK ke default 30 RHK dari SKP 2026? Custom akan hilang.')) {
        Store.set('master_rhk', null);
        Page.MasterRHK();
        UI.toast('Master RHK direset ke default.');
      }
    });

    // === Reset column widths ===
    document.getElementById('btnResetCol').addEventListener('click', () => {
      resetColWidths();
      Page.MasterRHK();
      UI.toast('Lebar kolom direset.');
    });

    // === Add new (inline) ===
    document.getElementById('btnAdd').addEventListener('click', () => {
      const cur = getMaster();
      const newId = 'RHK-CUST-' + Date.now().toString(36).slice(-5).toUpperCase();
      const blank = {
        id: newId,
        nomor_rhk: cur.length + 1,
        triwulan: 'I',
        jenis_kinerja: 'Utama',
        nama_eviden: '',
        rhk_atasan_intervensi: '',
        rencana_hasil_kerja: '',
        indikator_kuantitas: '',
        target_kuantitas: '',
        indikator_waktu: '',
        target_waktu: '',
        rencana_aksi: '',
        durasi: '',
        bukti_dukung: [],
        link_bukti_dukung: '',
        is_custom: true,
      };
      cur.push(blank);
      saveMaster(cur);
      Page.MasterRHK();
      setTimeout(() => {
        const cell = document.querySelector(`tr[data-rhk-id="${CSS.escape(newId)}"] [data-field="nama_eviden"]`);
        if (cell) {
          cell.scrollIntoView({ block: 'center', behavior: 'smooth' });
          cell.focus();
        }
      }, 80);
    });

    // === Resize columns ===
    setupColumnResize();

    // === Inline edit ===
    setupInlineEdit();
  };

  function renderRows(r) {
    const idEnc = encodeURIComponent(r.id);
    const tw = `<span class="badge ${r.jenis_kinerja === 'Tambahan' ? 'badge-tambahan' : 'badge-tw'}">${r.triwulan === 'TAMBAHAN' ? 'Tmb' : 'TW ' + r.triwulan}</span>`;
    return `
      <tr data-rhk-id="${attr(r.id)}">
        <td rowspan="2" class="cell-id" style="vertical-align:middle;text-align:center;">
          <strong>${attr(r.id)}</strong>
          <div class="small mt-1">${tw}</div>
        </td>
        <td rowspan="2" class="cell-wrap" style="vertical-align:middle;">
          <select class="cell-select" data-field="triwulan" title="Triwulan">
            ${['I','II','III','IV','TAMBAHAN'].map(t => `<option value="${t}" ${r.triwulan === t ? 'selected' : ''}>${t === 'TAMBAHAN' ? 'Tambahan' : 'TW ' + t}</option>`).join('')}
          </select>
        </td>
        <td rowspan="2" class="cell-wrap" style="vertical-align:middle;">
          <select class="cell-select" data-field="jenis_kinerja" title="Jenis Kinerja">
            <option ${r.jenis_kinerja === 'Utama' ? 'selected' : ''}>Utama</option>
            <option ${r.jenis_kinerja === 'Tambahan' ? 'selected' : ''}>Tambahan</option>
          </select>
        </td>
        <td rowspan="2" class="cell-wrap"><textarea class="cell-textarea" data-field="rhk_atasan_intervensi" rows="1">${U.escapeHtml(r.rhk_atasan_intervensi || '')}</textarea></td>
        <td rowspan="2" class="cell-wrap"><textarea class="cell-textarea" data-field="rencana_hasil_kerja" rows="1">${U.escapeHtml(r.rencana_hasil_kerja || '')}</textarea></td>
        <td class="cell-aspek"><strong>Kuantitas</strong></td>
        <td class="cell-wrap"><textarea class="cell-textarea" data-field="indikator_kuantitas" rows="1">${U.escapeHtml(r.indikator_kuantitas || '')}</textarea></td>
        <td class="cell-wrap"><input class="cell-input" data-field="target_kuantitas" value="${attr(r.target_kuantitas)}" /></td>
        <td rowspan="2" class="cell-wrap"><textarea class="cell-textarea" data-field="rencana_aksi" rows="1">${U.escapeHtml(r.rencana_aksi || '')}</textarea></td>
        <td rowspan="2" class="cell-wrap"><input class="cell-input" data-field="nama_eviden" value="${attr(r.nama_eviden)}" /></td>
        <td rowspan="2" class="cell-wrap"><input class="cell-input" data-field="target_waktu" value="${attr(r.target_waktu)}" title="Durasi (sama dengan target waktu)" /></td>
        <td rowspan="2" class="text-center text-nowrap" style="vertical-align:middle;">
          <a class="btn btn-sm btn-outline-success" href="#/master-rhk/${idEnc}" title="Detail"><i class="bi bi-eye"></i></a>
          <a class="btn btn-sm btn-outline-success" href="#/eviden/${idEnc}" title="Generate Eviden"><i class="bi bi-file-earmark-plus"></i></a>
          ${r.is_custom ? `<button class="btn btn-sm btn-outline-danger btn-del-rhk" data-rhk-id="${attr(r.id)}" title="Hapus RHK custom"><i class="bi bi-trash"></i></button>` : ''}
        </td>
      </tr>
      <tr data-rhk-id="${attr(r.id)}">
        <td class="cell-aspek"><strong>Waktu</strong></td>
        <td class="cell-wrap"><textarea class="cell-textarea" data-field="indikator_waktu" rows="1">${U.escapeHtml(r.indikator_waktu || '')}</textarea></td>
        <td class="cell-wrap"><input class="cell-input" data-field="target_waktu" value="${attr(r.target_waktu)}" /></td>
      </tr>`;
  }

  function setupColumnResize() {
    const table = document.getElementById('rhkTable');
    const colgroup = document.getElementById('rhkColgroup');
    if (!table || !colgroup) return;
    const cols = colgroup.querySelectorAll('col');
    const handles = document.querySelectorAll('.col-resize-handle');

    handles.forEach(h => {
      h.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(h.dataset.col, 10);
        const col = cols[idx];
        if (!col) return;
        const startX = e.clientX;
        const startW = col.getBoundingClientRect().width;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMove = (ev) => {
          const newW = Math.max(60, Math.round(startW + (ev.clientX - startX)));
          col.style.width = newW + 'px';
          let total = 0;
          cols.forEach(c => { total += parseInt(c.style.width, 10) || 0; });
          table.style.width = total + 'px';
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          const widths = Array.from(cols).map(c => parseInt(c.style.width, 10) || 0);
          saveColWidths(widths);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  function setupInlineEdit() {
    const tbody = document.getElementById('rhkTbody');
    if (!tbody) return;

    const grow = (el) => {
      if (!el || el.tagName !== 'TEXTAREA') return;
      el.style.height = 'auto';
      el.style.height = Math.max(28, el.scrollHeight) + 'px';
    };
    tbody.querySelectorAll('textarea.cell-textarea').forEach(grow);

    tbody.addEventListener('input', (e) => {
      if (e.target.matches('textarea.cell-textarea')) grow(e.target);
    });

    tbody.addEventListener('change', (e) => {
      const el = e.target;
      if (el.matches('.cell-select')) saveCellEdit(el);
    });

    tbody.addEventListener('focusout', (e) => {
      const el = e.target;
      if (el.matches('.cell-input, .cell-textarea')) saveCellEdit(el);
    });

    tbody.addEventListener('keydown', (e) => {
      if (e.target.matches('.cell-input') && e.key === 'Enter') {
        e.preventDefault();
        e.target.blur();
      }
    });

    // Delete custom
    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-del-rhk');
      if (!btn) return;
      const rhkId = btn.dataset.rhkId;
      if (await UI.confirmDialog('Hapus RHK ' + rhkId + '?')) {
        const cur = getMaster().filter(x => x.id !== rhkId);
        saveMaster(cur);
        UI.toast('RHK dihapus.');
        Page.MasterRHK();
      }
    });
  }

  function saveCellEdit(el) {
    const tr = el.closest('tr');
    const rhkId = tr ? tr.dataset.rhkId : null;
    const field = el.dataset.field;
    if (!rhkId || !field) return;
    const val = el.value;

    const list = getMaster();
    const rec = list.find(x => x.id === rhkId);
    if (!rec) return;
    if ((rec[field] == null ? '' : String(rec[field])) === val) return;

    rec[field] = val;
    if (field === 'target_waktu') rec.durasi = val;
    saveMaster(list);

    el.classList.remove('cell-saved');
    void el.offsetWidth;
    el.classList.add('cell-saved');

    // Sync siblings (same RHK + same field) — both rows or duplicate cells (e.g., target_waktu in 2 columns)
    try {
      document.querySelectorAll(`tr[data-rhk-id="${CSS.escape(rhkId)}"] [data-field="${CSS.escape(field)}"]`).forEach(n => {
        if (n !== el && n.value !== val) n.value = val;
      });
    } catch (_) {}

    // If TW or Jenis changed, refresh the badge in the No cell
    if (field === 'triwulan' || field === 'jenis_kinerja') {
      const noCell = tr.parentElement.querySelector(`tr[data-rhk-id="${CSS.escape(rhkId)}"] .cell-id .badge`);
      if (noCell) {
        noCell.className = 'badge ' + (rec.jenis_kinerja === 'Tambahan' ? 'badge-tambahan' : 'badge-tw');
        noCell.textContent = rec.triwulan === 'TAMBAHAN' ? 'Tmb' : 'TW ' + rec.triwulan;
      }
    }
  }

  // ===== Detail page (still useful for read-only deep view) =====
  Page.MasterRHKDetail = function (id) {
    const list = getMaster();
    const r = list.find(x => x.id === id);
    if (!r) return UI.toast('RHK tidak ditemukan.', 'danger');

    UI.shell('Detail ' + r.id, `
      <div class="d-flex gap-2 mb-3">
        <a class="btn btn-outline-secondary" href="#/master-rhk"><i class="bi bi-arrow-left"></i> Kembali ke daftar</a>
        ${r.is_custom ? '<button class="btn btn-outline-danger ms-auto" id="btnDel"><i class="bi bi-trash"></i> Hapus</button>' : ''}
        <a class="btn btn-success ${r.is_custom ? '' : 'ms-auto'}" href="#/eviden/${encodeURIComponent(r.id)}"><i class="bi bi-file-earmark-plus"></i> Generate Eviden</a>
      </div>
      <div class="card mb-3">
        <div class="card-body">
          <h4 class="mb-1">${U.escapeHtml(r.nama_eviden)}</h4>
          <div class="text-muted small mb-3">${r.id} · ${r.triwulan === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + r.triwulan} · ${r.jenis_kinerja}</div>
          <div class="row g-3">
            <div class="col-md-12"><div class="text-muted small">RHK Atasan yang Diintervensi</div><div>${U.nl2br(r.rhk_atasan_intervensi)}</div></div>
            <div class="col-md-12"><div class="text-muted small">Rencana Hasil Kerja Pegawai</div><div>${U.nl2br(r.rencana_hasil_kerja)}</div></div>
            <div class="col-md-6"><div class="text-muted small">Indikator (Kuantitas)</div><div>${U.escapeHtml(r.indikator_kuantitas || '')}</div></div>
            <div class="col-md-3"><div class="text-muted small">Target Kuantitas</div><div>${U.escapeHtml(r.target_kuantitas || '')}</div></div>
            <div class="col-md-3"><div class="text-muted small">Durasi</div><div>${U.escapeHtml(r.target_waktu || '')}</div></div>
            <div class="col-md-12"><div class="text-muted small">Indikator (Waktu)</div><div>${U.escapeHtml(r.indikator_waktu || '')}</div></div>
            <div class="col-md-12"><div class="text-muted small">Rencana Aksi</div><div>${U.nl2br(r.rencana_aksi || '')}</div></div>
            <div class="col-md-12"><div class="text-muted small">Link Bukti Dukung</div><div>${r.link_bukti_dukung ? `<a target="_blank" href="${U.escapeHtml(r.link_bukti_dukung)}">${U.escapeHtml(r.link_bukti_dukung)}</a>` : '-'}</div></div>
          </div>
          <div class="mt-3 small text-muted"><i class="bi bi-info-circle"></i> Untuk mengubah field di atas, kembali ke daftar Master RHK lalu edit langsung di tabel.</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><i class="bi bi-file-earmark-text"></i> Daftar Bukti Dukung</div>
        <ol class="list-group list-group-numbered list-group-flush">
          ${(r.bukti_dukung || []).map(b => `<li class="list-group-item">${U.escapeHtml(b)}</li>`).join('') || '<li class="list-group-item text-muted">Belum ada bukti dukung.</li>'}
        </ol>
      </div>
    `);

    if (r.is_custom) {
      const del = document.getElementById('btnDel');
      if (del) del.addEventListener('click', async () => {
        if (await UI.confirmDialog('Hapus RHK ini?')) {
          const next = list.filter(x => x.id !== r.id);
          saveMaster(next);
          UI.toast('RHK dihapus.');
          Router.navigate('/master-rhk');
          Router.dispatch();
        }
      });
    }
  };

  Page.MasterRHK.get = getMaster;
})();
