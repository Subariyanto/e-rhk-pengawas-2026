// Generic dynamic file importer (Excel/Word/PDF) — reusable across pages
(function () {
  const PDF_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  function colRowFromAddress(addr) {
    const m = /^([A-Z]+)(\d+)$/.exec(addr);
    if (!m) return { r: 0, c: 0 };
    let col = 0;
    for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
    return { r: parseInt(m[2]) - 1, c: col - 1 };
  }

  function cellValue(cell) {
    const v = cell.value;
    if (v == null) return '';
    if (typeof v === 'object') {
      if (v.richText) return v.richText.map(t => t.text).join('');
      if (v.text) return v.text;
      if (v.result != null) return v.result;
      if (v instanceof Date) return v.toLocaleDateString('id-ID');
      if (v.formula) return cell.result ?? '';
      return '';
    }
    return v;
  }

  function cellMeta(cell) {
    const out = {};
    const f = cell.font;
    if (f) {
      if (f.bold) out.bold = true;
      if (f.italic) out.italic = true;
      if (f.underline) out.underline = true;
      if (f.color && f.color.argb) out.color = '#' + f.color.argb.slice(2);
      if (f.size) out.fontSize = f.size;
    }
    const a = cell.alignment;
    if (a) {
      if (a.horizontal) out.align = a.horizontal;
      if (a.vertical) out.valign = a.vertical;
      if (a.wrapText) out.wrap = true;
    }
    const fill = cell.fill;
    if (fill && fill.type === 'pattern' && fill.fgColor && fill.fgColor.argb) {
      const argb = fill.fgColor.argb;
      if (argb.toLowerCase() !== '00000000') out.bg = '#' + argb.slice(2);
    }
    return out;
  }

  async function parseExcel(file) {
    const buf = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buf);
    const sheets = [];
    wb.eachSheet((ws) => {
      const rows = [];
      const merges = [];
      const rawMerges = (ws.model && ws.model.merges) || [];
      for (const m of rawMerges) {
        const parts = m.split(':');
        const a = colRowFromAddress(parts[0]);
        const b = colRowFromAddress(parts[1] || parts[0]);
        merges.push({ top: a.r, left: a.c, bottom: b.r, right: b.c });
      }
      const rowCount = ws.rowCount || 0;
      const colCount = ws.columnCount || 0;
      // Column widths in Excel character units (default ~8.43). Convert to px (~7px/unit).
      const colWidths = [];
      for (let c = 1; c <= colCount; c++) {
        const col = ws.getColumn(c);
        const w = col && col.width ? col.width : 8.43;
        colWidths.push(Math.round(w * 7));
      }
      // Row heights in points; default 15. Convert to px (~1.333px/pt).
      const rowHeights = [];
      for (let r = 1; r <= rowCount; r++) {
        const rw = ws.getRow(r);
        const h = rw && rw.height ? rw.height : null;
        rowHeights.push(h ? Math.round(h * 1.333) : null);
      }
      for (let r = 1; r <= rowCount; r++) {
        const row = ws.getRow(r);
        const arr = [];
        for (let c = 1; c <= colCount; c++) {
          const cell = row.getCell(c);
          arr.push({ v: cellValue(cell), s: cellMeta(cell) });
        }
        rows.push(arr);
      }
      sheets.push({ name: ws.name, rows, merges, colWidths, rowHeights });
    });
    return { sheets };
  }

  async function parseDocx(file) {
    if (!window.mammoth) throw new Error('Library mammoth belum termuat.');
    const buf = await file.arrayBuffer();
    const result = await window.mammoth.convertToHtml({ arrayBuffer: buf }, {
      styleMap: [
        "p[style-name='Title'] => h1.title",
        "p[style-name='Heading 1'] => h2",
        "p[style-name='Heading 2'] => h3",
      ],
    });
    return { html: result.value, messages: result.messages || [] };
  }

  async function parsePdf(file) {
    if (!window.pdfjsLib) throw new Error('Library PDF.js belum termuat.');
    pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
    const buf = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const pages = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.85) });
    }
    return { pages };
  }

  async function importFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'xlsx' || ext === 'xls' || ext === 'xlsm' || ext === 'xlsb') {
      const payload = await parseExcel(file);
      return { kind: 'excel', payload, fileName: file.name, importedAt: Date.now() };
    }
    if (ext === 'docx' || ext === 'docm') {
      const payload = await parseDocx(file);
      return { kind: 'docx', payload, fileName: file.name, importedAt: Date.now() };
    }
    if (ext === 'pdf') {
      const payload = await parsePdf(file);
      return { kind: 'pdf', payload, fileName: file.name, importedAt: Date.now() };
    }
    throw new Error('Format tidak didukung: ' + ext);
  }

  function cellStyle(cell, opts = {}) {
    const css = [];
    if (cell && cell.s) {
      const s = cell.s;
      if (s.bold) css.push('font-weight:700');
      if (s.italic) css.push('font-style:italic');
      if (s.underline) css.push('text-decoration:underline');
      if (s.align) css.push('text-align:' + s.align);
      if (s.valign) css.push('vertical-align:' + (s.valign === 'middle' ? 'middle' : s.valign));
      if (s.bg) css.push('background-color:' + s.bg);
      if (s.color) css.push('color:' + s.color);
      if (s.fontSize) css.push('font-size:' + s.fontSize + 'pt');
      if (s.wrap) css.push('white-space:normal');
    }
    if (opts.wrapAll) {
      // Force wrap-text + word-wrap so cells respect column width instead of expanding.
      css.push('white-space:normal');
      css.push('word-wrap:break-word');
      css.push('overflow-wrap:break-word');
    }
    return css.length ? ` style="${css.join(';')}"` : '';
  }

  function renderSheetTable(sheet, opts = {}) {
    const editable = !!opts.editable;
    const merges = sheet.merges || [];
    const skip = new Set();
    const mergeMap = new Map();
    for (const m of merges) {
      mergeMap.set(`${m.top},${m.left}`, { rowspan: m.bottom - m.top + 1, colspan: m.right - m.left + 1 });
      for (let r = m.top; r <= m.bottom; r++) {
        for (let c = m.left; c <= m.right; c++) {
          if (r === m.top && c === m.left) continue;
          skip.add(`${r},${c}`);
        }
      }
    }
    const rows = sheet.rows || [];
    const maxCols = Math.max(0, ...rows.map(r => r.length));
    const colWidths = sheet.colWidths || [];
    const rowHeights = sheet.rowHeights || [];
    // Build colgroup with original column widths so wrapping works against the real width
    const colgroup = '<colgroup>' + Array.from({length: maxCols}, (_, i) => {
      const w = colWidths[i];
      return `<col${w ? ` style="width:${w}px"` : ''}>`;
    }).join('') + '</colgroup>';
    const trs = rows.map((row, r) => {
      const tds = [];
      for (let c = 0; c < maxCols; c++) {
        if (skip.has(`${r},${c}`)) continue;
        const span = mergeMap.get(`${r},${c}`);
        const cell = row[c];
        const v = (cell && (cell.v ?? '')) ?? '';
        const styleAttr = cellStyle(cell, { wrapAll: true });
        const rs = span?.rowspan && span.rowspan > 1 ? ` rowspan="${span.rowspan}"` : '';
        const cs = span?.colspan && span.colspan > 1 ? ` colspan="${span.colspan}"` : '';
        const editAttr = editable ? ` contenteditable="true" data-r="${r}" data-c="${c}"` : '';
        tds.push(`<td${rs}${cs}${styleAttr}${editAttr}>${U.escapeHtml(String(v)).replace(/\n/g, '<br>')}</td>`);
      }
      const rowH = rowHeights[r];
      const trStyle = rowH ? ` style="height:${rowH}px"` : '';
      return `<tr${trStyle}>${tds.join('')}</tr>`;
    }).join('');
    return `<table class="skp-excel-table">${colgroup}${trs}</table>`;
  }

  function renderExcel(payload, opts = {}) {
    const sheets = payload.sheets || [];
    const uid = 'imp' + Math.random().toString(36).slice(2, 8);
    const tabs = sheets.map((s, i) => `
      <li class="nav-item">
        <button class="nav-link ${i === 0 ? 'active' : ''}" data-bs-toggle="tab" data-bs-target="#${uid}-${i}" type="button">${U.escapeHtml(s.name)}</button>
      </li>`).join('');
    const panes = sheets.map((s, i) => `
      <div class="tab-pane fade ${i === 0 ? 'show active' : ''}" id="${uid}-${i}" data-sheet-idx="${i}">
        <div class="table-wide-wrap" style="max-height: calc(100vh - 160px); overflow-x: scroll; overflow-y: auto;">
          ${renderSheetTable(s, opts)}
        </div>
      </div>`).join('');
    return `
      <div class="card" id="${uid}-host">
        <div class="card-header p-0">
          <ul class="nav nav-tabs">${tabs}</ul>
        </div>
        <div class="tab-content">${panes}</div>
      </div>`;
  }

  function renderDoc(doc, opts = {}) {
    const meta = `
      <div class="card mb-3">
        <div class="card-body py-2 small d-flex flex-wrap gap-3 align-items-center">
          <div><i class="bi bi-file-earmark"></i> <strong>${U.escapeHtml(doc.fileName || '-')}</strong></div>
          <div class="text-muted">Tipe: ${doc.kind?.toUpperCase() || '-'}</div>
          <div class="text-muted">Diimport: ${new Date(doc.importedAt).toLocaleString('id-ID')}</div>
        </div>
      </div>`;
    let body = '';
    if (doc.kind === 'excel') body = renderExcel(doc.payload, opts);
    else if (doc.kind === 'docx') {
      const editAttr = opts.editable ? ' contenteditable="true" id="docxEdit"' : '';
      body = `<div class="card"><div class="card-body skp-doc"${editAttr}>${doc.payload.html}</div></div>`;
    }
    else if (doc.kind === 'pdf') body = renderPDF(doc.payload);
    else body = '<div class="alert alert-warning">Format tidak dikenali.</div>';
    return meta + body;
  }

  function renderPDF(payload) {
    const pages = payload.pages || [];
    return `
      <div class="card">
        <div class="card-body skp-doc">
          ${pages.map((p, i) => `
            <div class="pdf-page mb-3">
              <div class="text-muted small mb-1">Halaman ${i + 1}</div>
              <img src="${p.dataUrl}" style="max-width:100%;border:1px solid #ddd;border-radius:4px;" alt="page ${i + 1}" />
            </div>`).join('')}
        </div>
      </div>`;
  }

  function renderDoc(doc) {
    const meta = `
      <div class="card mb-3">
        <div class="card-body py-2 small d-flex flex-wrap gap-3 align-items-center">
          <div><i class="bi bi-file-earmark"></i> <strong>${U.escapeHtml(doc.fileName || '-')}</strong></div>
          <div class="text-muted">Tipe: ${doc.kind?.toUpperCase() || '-'}</div>
          <div class="text-muted">Diimport: ${new Date(doc.importedAt).toLocaleString('id-ID')}</div>
        </div>
      </div>`;
    let body = '';
    if (doc.kind === 'excel') body = renderExcel(doc.payload);
    else if (doc.kind === 'docx') body = `<div class="card"><div class="card-body skp-doc">${doc.payload.html}</div></div>`;
    else if (doc.kind === 'pdf' && doc.idbKey) {
      // PDF stored in IndexedDB — render placeholder, filled async
      body = '<div id="pdfRenderTarget"><div class="card"><div class="card-body text-center py-5"><div class="spinner-border text-primary" role="status"></div><div class="mt-2 text-muted">Memuat PDF...</div></div></div></div>';
    } else if (doc.kind === 'pdf') body = renderPDF(doc.payload);
    else body = '<div class="alert alert-warning">Format tidak dikenali.</div>';
    return meta + body;
  }

  /**
   * mountImporter({ title, storeKey, onRefresh })
   * Renders the importer page using UI.shell. Caller should pass onRefresh = () => Page.X()
   * so this helper can re-trigger the page after an import or clear.
   */
  function mountImporter({ title, storeKey, onRefresh, emptyHint }) {
    const doc = Store.get(storeKey, null);
    const editing = !!Store.get(storeKey + '__editing', false);
    UI.shell(title, `
      <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
        <input type="file" id="impFile" accept=".xlsx,.xls,.xlsm,.xlsb,.docx,.docm,.pdf" class="form-control" style="max-width:380px;" />
        <button class="btn btn-success" id="btnImport"><i class="bi bi-upload"></i> Import</button>
        ${doc && doc.kind !== 'pdf' ? (editing
          ? '<button class="btn btn-success ms-auto" id="btnSave"><i class="bi bi-save"></i> Simpan</button><button class="btn btn-outline-secondary" id="btnCancel"><i class="bi bi-x"></i> Batal</button>'
          : '<button class="btn btn-outline-primary ms-auto" id="btnEdit"><i class="bi bi-pencil"></i> Edit</button>') : ''}
        ${doc ? '<button class="btn btn-outline-danger" id="btnClear"><i class="bi bi-trash"></i> Hapus</button>' : ''}
        <div class="text-muted small ms-2">Format: Excel (.xlsx/.xls/.xlsm/.xlsb), Word (.docx/.docm), PDF</div>
      </div>

      ${doc ? renderDoc(doc, { editable: editing }) : `
        <div class="card">
          <div class="card-body text-center text-muted py-5">
            <div style="font-size:48px;opacity:.3">📄</div>
            <div class="mt-2"><strong>Belum ada dokumen.</strong></div>
            <div class="mb-3 small">${U.escapeHtml(emptyHint || 'Import file Excel / Word / PDF untuk menampilkannya di sini.')}</div>
          </div>
        </div>
      `}
    `);

    document.getElementById('btnImport').addEventListener('click', async () => {
      const f = document.getElementById('impFile').files[0];
      if (!f) { UI.toast('Pilih file dulu Pak.', 'warning'); return; }
      try {
        UI.toast('Membaca file…', 'info');
        const result = await importFile(f);
        if (result.kind === 'pdf') {
          // PDF data too large for localStorage — store in IndexedDB
          const idbKey = storeKey + '__pdf';
          await IDBStore.setBlob(idbKey, result.payload);
          Store.set(storeKey, { kind: 'pdf', fileName: result.fileName, importedAt: result.importedAt, idbKey: idbKey });
        } else {
          Store.set(storeKey, result);
        }
        Store.set(storeKey + '__editing', false);
        UI.toast('Import berhasil.', 'success');
        onRefresh();
      } catch (e) {
        console.error(e);
        UI.toast('Gagal import: ' + (e?.message || e), 'danger');
      }
    });
    if (doc && doc.kind === 'pdf' && doc.idbKey) {
      // Load PDF payload from IndexedDB and render
      (async () => {
        try {
          const payload = await IDBStore.getBlob(doc.idbKey);
          if (payload) {
            const container = document.getElementById('pdfRenderTarget');
            if (container) container.innerHTML = renderPDF(payload);
          }
        } catch (e) { console.error('IDB load error:', e); }
      })();
    }
    if (doc) {
      const btnEdit = document.getElementById('btnEdit');
      if (btnEdit) btnEdit.addEventListener('click', () => {
        Store.set(storeKey + '__editing', true);
        onRefresh();
      });
      const btnSave = document.getElementById('btnSave');
      if (btnSave) btnSave.addEventListener('click', () => {
        const cur = Store.get(storeKey, null);
        if (!cur) return;
        if (cur.kind === 'excel') {
          // collect each sheet pane
          document.querySelectorAll('[data-sheet-idx]').forEach(pane => {
            const idx = parseInt(pane.dataset.sheetIdx);
            const sheet = cur.payload.sheets[idx];
            if (!sheet) return;
            pane.querySelectorAll('td[contenteditable]').forEach(td => {
              const r = parseInt(td.dataset.r);
              const c = parseInt(td.dataset.c);
              if (Number.isFinite(r) && Number.isFinite(c) && sheet.rows[r] && sheet.rows[r][c]) {
                sheet.rows[r][c].v = td.innerText;
              }
            });
          });
        } else if (cur.kind === 'docx') {
          const ed = document.getElementById('docxEdit');
          if (ed) cur.payload.html = ed.innerHTML;
        }
        Store.set(storeKey, cur);
        Store.set(storeKey + '__editing', false);
        UI.toast('Perubahan disimpan.', 'success');
        onRefresh();
      });
      const btnCancel = document.getElementById('btnCancel');
      if (btnCancel) btnCancel.addEventListener('click', () => {
        Store.set(storeKey + '__editing', false);
        onRefresh();
      });
      const btnClear = document.getElementById('btnClear');
      if (btnClear) btnClear.addEventListener('click', async () => {
        if (await UI.confirmDialog('Hapus dokumen yang sudah diimport?')) {
          // Clean up IndexedDB if PDF
          const cur = Store.get(storeKey, null);
          if (cur && cur.idbKey) {
            try { await IDBStore.removeBlob(cur.idbKey); } catch(e) {}
          }
          Store.set(storeKey, null);
          Store.set(storeKey + '__editing', false);
          onRefresh();
        }
      });
    }
  }

  window.DynImporter = { mountImporter, importFile, renderDoc };
})();
