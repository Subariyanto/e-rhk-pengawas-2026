// Master RHK page (list, detail, row-level edit mode, resizable columns, add custom, delete custom)
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
    { label: 'Aksi',                          width: 150 },
  ];

  // Map field name -> snapshot of original value when entering edit mode (per RHK id)
  const editingSnapshots = new Map(); // rhkId -> snapshot object

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
        Klik <i class="bi bi-pencil"></i> di kolom Aksi untuk masuk mode edit, lalu <i class="bi bi-save"></i> Simpan atau <i class="bi bi-x"></i> Batal.
        Seret <strong>ujung kanan header kolom</strong> untuk ubah lebar.
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
        editingSnapshots.clear();
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

    // === Add new (auto-enter edit mode) ===
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
      // Pre-snapshot so a Cancel right after add removes the empty record
      editingSnapshots.set(newId, { __isNew: true });
      Page.MasterRHK();
      setTimeout(() => {
        enterEditMode(newId);
        const cell = document.querySelector(`tr[data-rhk-id="${CSS.escape(newId)}"] [data-field="nama_eviden"]`);
        if (cell) {
          cell.scrollIntoView({ block: 'center', behavior: 'smooth' });
          cell.focus();
        }
      }, 80);
    });

    // === Resize columns ===
    setupColumnResize();

    // === Setup table interactions (edit mode toggle, save, cancel, delete) ===
    setupTableActions();

    // === Refresh edit-mode UI for any rows that are still in edit state across re-renders ===
    editingSnapshots.forEach((_snap, rhkId) => {
      const tr = document.querySelector(`tr[data-rhk-id="${CSS.escape(rhkId)}"]`);
      if (tr) applyEditModeUI(rhkId, true);
    });
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
          <select class="cell-select" data-field="triwulan" title="Triwulan" disabled>
            ${['I','II','III','IV','TAMBAHAN'].map(t => `<option value="${t}" ${r.triwulan === t ? 'selected' : ''}>${t === 'TAMBAHAN' ? 'Tambahan' : 'TW ' + t}</option>`).join('')}
          </select>
        </td>
        <td rowspan="2" class="cell-wrap" style="vertical-align:middle;">
          <select class="cell-select" data-field="jenis_kinerja" title="Jenis Kinerja" disabled>
            <option ${r.jenis_kinerja === 'Utama' ? 'selected' : ''}>Utama</option>
            <option ${r.jenis_kinerja === 'Tambahan' ? 'selected' : ''}>Tambahan</option>
          </select>
        </td>
        <td rowspan="2" class="cell-wrap"><textarea class="cell-textarea" data-field="rhk_atasan_intervensi" rows="1" readonly>${U.escapeHtml(r.rhk_atasan_intervensi || '')}</textarea></td>
        <td rowspan="2" class="cell-wrap"><textarea class="cell-textarea" data-field="rencana_hasil_kerja" rows="1" readonly>${U.escapeHtml(r.rencana_hasil_kerja || '')}</textarea></td>
        <td class="cell-aspek"><strong>Kuantitas</strong></td>
        <td class="cell-wrap"><textarea class="cell-textarea" data-field="indikator_kuantitas" rows="1" readonly>${U.escapeHtml(r.indikator_kuantitas || '')}</textarea></td>
        <td class="cell-wrap"><textarea class="cell-textarea" data-field="target_kuantitas" rows="1" readonly>${U.escapeHtml(r.target_kuantitas || '')}</textarea></td>
        <td rowspan="2" class="cell-wrap"><textarea class="cell-textarea" data-field="rencana_aksi" rows="1" readonly>${U.escapeHtml(r.rencana_aksi || '')}</textarea></td>
        <td rowspan="2" class="cell-wrap cell-link-wrap" data-link-target="#/master-rhk/${idEnc}" data-field-text="nama_eviden">
          <a class="cell-display-link" href="#/master-rhk/${idEnc}" title="Buka detail RHK">${U.escapeHtml(r.nama_eviden || '—')}</a>
          <textarea class="cell-textarea cell-editor" data-field="nama_eviden" rows="1" readonly>${U.escapeHtml(r.nama_eviden || '')}</textarea>
        </td>
        <td rowspan="2" class="cell-wrap"><textarea class="cell-textarea" data-field="target_waktu" rows="1" title="Durasi (sama dengan target waktu)" readonly>${U.escapeHtml(r.target_waktu || '')}</textarea></td>
        <td rowspan="2" class="text-center text-nowrap cell-actions" style="vertical-align:middle;">
          <div class="actions-view d-flex gap-1 justify-content-center flex-wrap">
            <a class="btn btn-sm btn-outline-success" href="#/master-rhk/${idEnc}" title="Detail"><i class="bi bi-eye"></i></a>
            <button class="btn btn-sm btn-outline-primary btn-edit-rhk" data-rhk-id="${attr(r.id)}" title="Edit"><i class="bi bi-pencil"></i></button>
            <a class="btn btn-sm btn-outline-success" href="#/eviden/${idEnc}" title="Generate Eviden"><i class="bi bi-file-earmark-plus"></i></a>
            ${r.is_custom ? `<button class="btn btn-sm btn-outline-danger btn-del-rhk" data-rhk-id="${attr(r.id)}" title="Hapus RHK custom"><i class="bi bi-trash"></i></button>` : ''}
          </div>
          <div class="actions-edit d-none d-flex gap-1 justify-content-center flex-wrap">
            <button class="btn btn-sm btn-success btn-save-rhk" data-rhk-id="${attr(r.id)}" title="Simpan"><i class="bi bi-save"></i> Simpan</button>
            <button class="btn btn-sm btn-outline-secondary btn-cancel-rhk" data-rhk-id="${attr(r.id)}" title="Batal"><i class="bi bi-x-lg"></i> Batal</button>
          </div>
        </td>
      </tr>
      <tr data-rhk-id="${attr(r.id)}">
        <td class="cell-aspek"><strong>Waktu</strong></td>
        <td class="cell-wrap"><textarea class="cell-textarea" data-field="indikator_waktu" rows="1" readonly>${U.escapeHtml(r.indikator_waktu || '')}</textarea></td>
        <td class="cell-wrap"><textarea class="cell-textarea" data-field="target_waktu" rows="1" readonly>${U.escapeHtml(r.target_waktu || '')}</textarea></td>
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
          regrowAll();
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
          document.body.style.userSelect = '';
          const widths = Array.from(cols).map(c => parseInt(c.style.width, 10) || 0);
          saveColWidths(widths);
          regrowAll();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  function regrowAll() {
    const tbody = document.getElementById('rhkTbody');
    if (!tbody) return;
    tbody.querySelectorAll('textarea.cell-textarea').forEach(growTextarea);
  }

  function growTextarea(el) {
    if (!el || el.tagName !== 'TEXTAREA') return;
    el.style.height = 'auto';
    el.style.height = Math.max(28, el.scrollHeight) + 'px';
  }

  function setupTableActions() {
    const tbody = document.getElementById('rhkTbody');
    if (!tbody) return;

    // Initial layout
    regrowAll();

    // Auto-grow while typing in edit mode
    tbody.addEventListener('input', (e) => {
      if (e.target.matches('textarea.cell-textarea')) growTextarea(e.target);
    });

    // Re-grow on viewport changes
    window.addEventListener('resize', U.debounce(regrowAll, 100));

    // Click handlers (edit / save / cancel / delete)
    tbody.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('.btn-edit-rhk');
      if (editBtn) {
        enterEditMode(editBtn.dataset.rhkId);
        return;
      }
      const saveBtn = e.target.closest('.btn-save-rhk');
      if (saveBtn) {
        commitEdit(saveBtn.dataset.rhkId);
        return;
      }
      const cancelBtn = e.target.closest('.btn-cancel-rhk');
      if (cancelBtn) {
        cancelEdit(cancelBtn.dataset.rhkId);
        return;
      }
      const delBtn = e.target.closest('.btn-del-rhk');
      if (delBtn) {
        const rhkId = delBtn.dataset.rhkId;
        if (await UI.confirmDialog('Hapus RHK ' + rhkId + '?')) {
          const cur = getMaster().filter(x => x.id !== rhkId);
          saveMaster(cur);
          editingSnapshots.delete(rhkId);
          UI.toast('RHK dihapus.');
          Page.MasterRHK();
        }
        return;
      }
    });
  }

  function getRowFields(rhkId) {
    return document.querySelectorAll(`tr[data-rhk-id="${CSS.escape(rhkId)}"] [data-field]`);
  }

  function applyEditModeUI(rhkId, editing) {
    const trs = document.querySelectorAll(`tr[data-rhk-id="${CSS.escape(rhkId)}"]`);
    trs.forEach(tr => {
      tr.classList.toggle('row-editing', !!editing);
      const view = tr.querySelector('.actions-view');
      const edit = tr.querySelector('.actions-edit');
      if (view) view.classList.toggle('d-none', !!editing);
      if (edit) edit.classList.toggle('d-none', !editing);
    });
    getRowFields(rhkId).forEach(el => {
      if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
        el.readOnly = !editing;
      } else if (el.tagName === 'SELECT') {
        el.disabled = !editing;
      }
      el.classList.toggle('cell-editable', !!editing);
    });
  }

  function enterEditMode(rhkId) {
    const list = getMaster();
    const rec = list.find(x => x.id === rhkId);
    if (!rec) return;
    if (!editingSnapshots.has(rhkId)) {
      editingSnapshots.set(rhkId, JSON.parse(JSON.stringify(rec)));
    }
    applyEditModeUI(rhkId, true);
    // Focus first editable field for convenience
    const first = document.querySelector(`tr[data-rhk-id="${CSS.escape(rhkId)}"] textarea[data-field="rhk_atasan_intervensi"]`);
    if (first) first.focus();
    regrowAll();
  }

  function commitEdit(rhkId) {
    const list = getMaster();
    const rec = list.find(x => x.id === rhkId);
    if (!rec) return;

    // Collect values from all editable fields under this rhk
    const fields = getRowFields(rhkId);
    fields.forEach(el => {
      const f = el.dataset.field;
      if (!f) return;
      rec[f] = el.value;
    });
    if (rec.target_waktu) rec.durasi = rec.target_waktu;

    saveMaster(list);
    editingSnapshots.delete(rhkId);
    applyEditModeUI(rhkId, false);

    // Refresh badge in No cell (TW / Jenis may have changed)
    const idCell = document.querySelector(`tr[data-rhk-id="${CSS.escape(rhkId)}"] .cell-id .badge`);
    if (idCell) {
      idCell.className = 'badge ' + (rec.jenis_kinerja === 'Tambahan' ? 'badge-tambahan' : 'badge-tw');
      idCell.textContent = rec.triwulan === 'TAMBAHAN' ? 'Tmb' : 'TW ' + rec.triwulan;
    }

    // Sync duplicate target_waktu cell across the 2 rows
    document.querySelectorAll(`tr[data-rhk-id="${CSS.escape(rhkId)}"] [data-field="target_waktu"]`).forEach(n => {
      if (n.value !== rec.target_waktu) n.value = rec.target_waktu || '';
    });

    // Refresh display-mode link text (Nama Eviden)
    syncDisplayLinks(rhkId, rec);

    UI.toast('RHK ' + rhkId + ' tersimpan.');
    regrowAll();
  }

  function cancelEdit(rhkId) {
    const snap = editingSnapshots.get(rhkId);
    if (!snap) {
      applyEditModeUI(rhkId, false);
      return;
    }
    if (snap.__isNew) {
      // Just-added blank row → drop it
      const list = getMaster().filter(x => x.id !== rhkId);
      saveMaster(list);
      editingSnapshots.delete(rhkId);
      Page.MasterRHK();
      UI.toast('Penambahan dibatalkan.');
      return;
    }
    // Restore record from snapshot
    const list = getMaster();
    const idx = list.findIndex(x => x.id === rhkId);
    if (idx >= 0) list[idx] = snap;
    saveMaster(list);
    editingSnapshots.delete(rhkId);

    // Restore field values in DOM
    getRowFields(rhkId).forEach(el => {
      const f = el.dataset.field;
      if (!f) return;
      el.value = snap[f] == null ? '' : String(snap[f]);
    });

    // Restore badge
    const idCell = document.querySelector(`tr[data-rhk-id="${CSS.escape(rhkId)}"] .cell-id .badge`);
    if (idCell) {
      idCell.className = 'badge ' + (snap.jenis_kinerja === 'Tambahan' ? 'badge-tambahan' : 'badge-tw');
      idCell.textContent = snap.triwulan === 'TAMBAHAN' ? 'Tmb' : 'TW ' + snap.triwulan;
    }

    applyEditModeUI(rhkId, false);
    syncDisplayLinks(rhkId, snap);
    regrowAll();
  }

  function syncDisplayLinks(rhkId, rec) {
    const wrap = document.querySelector(`tr[data-rhk-id="${CSS.escape(rhkId)}"] .cell-link-wrap[data-field-text="nama_eviden"]`);
    if (!wrap) return;
    const link = wrap.querySelector('.cell-display-link');
    if (link) link.textContent = rec.nama_eviden && rec.nama_eviden.trim() ? rec.nama_eviden : '—';
  }

  // ===== Detail page (read-only deep view) =====
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
          <div class="mt-3 small text-muted"><i class="bi bi-info-circle"></i> Untuk mengubah field di atas, kembali ke daftar Master RHK lalu klik <i class="bi bi-pencil"></i> di kolom Aksi.</div>
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
