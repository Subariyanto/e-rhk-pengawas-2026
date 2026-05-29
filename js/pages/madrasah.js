// Madrasah Binaan page (CRUD + import/export Excel)
(function () {
  Page.Madrasah = function () {
    const list = Store.get('madrasah', []) || [];
    UI.shell('Madrasah Binaan', `
      <div class="d-flex flex-wrap gap-2 mb-3">
        <input id="qmad" class="form-control" placeholder="Cari madrasah..." style="max-width:300px;" />
        <select id="fmad" class="form-select" style="max-width:160px;">
          <option value="">Semua Jenjang</option>
          <option>RA</option><option>MI</option><option>MTs</option><option>MA</option>
        </select>
        <button class="btn btn-success ms-auto" id="btnAdd"><i class="bi bi-plus-circle"></i> Tambah</button>
        <button class="btn btn-outline-success" id="btnImp"><i class="bi bi-upload"></i> Import Excel</button>
        <button class="btn btn-outline-success" id="btnExp"><i class="bi bi-download"></i> Export Excel</button>
        <button class="btn btn-outline-secondary" id="btnTpl"><i class="bi bi-file-earmark-spreadsheet"></i> Template</button>
        <input type="file" id="fimp" accept=".xlsx,.xls" class="d-none" />
      </div>
      <div class="card"><div class="table-responsive"><table class="table table-hover table-sm mb-0 align-middle">
        <thead><tr><th>Nama Madrasah</th><th>Jenjang</th><th>NSM</th><th>NPSN</th><th>Kepala Madrasah</th><th>Kecamatan</th><th>HP</th><th>Status</th><th></th></tr></thead>
        <tbody id="tbody"></tbody>
      </table></div></div>
    `);
    const render = () => {
      const data = Store.get('madrasah', []) || [];
      const q = (document.getElementById('qmad').value || '').toLowerCase();
      const j = document.getElementById('fmad').value;
      const f = data.filter(m => {
        if (j && m.jenjang !== j) return false;
        if (q && !((m.nama_madrasah + ' ' + (m.kepala_madrasah || '') + ' ' + (m.kecamatan || '')).toLowerCase().includes(q))) return false;
        return true;
      });
      document.getElementById('tbody').innerHTML = f.map(m => `
        <tr>
          <td>${U.escapeHtml(m.nama_madrasah)}</td>
          <td>${U.escapeHtml(m.jenjang || '')}</td>
          <td>${U.escapeHtml(m.nsm || '')}</td>
          <td>${U.escapeHtml(m.npsn || '')}</td>
          <td>${U.escapeHtml(m.kepala_madrasah || '')}</td>
          <td>${U.escapeHtml(m.kecamatan || '')}</td>
          <td>${U.escapeHtml(m.no_hp || '')}</td>
          <td><span class="badge ${m.status === 'aktif' ? 'bg-success' : 'bg-secondary'}">${U.escapeHtml(m.status || '')}</span></td>
          <td class="text-end">
            <button class="btn btn-sm btn-outline-success" data-edit="${m.id}"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-sm btn-outline-danger" data-del="${m.id}"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="9" class="text-center text-muted p-5">
        <div style="font-size:48px;opacity:.3">🏫</div>
        <div class="mt-2"><strong>Belum ada madrasah binaan.</strong></div>
        <div class="mb-3 small">Tambah satu per satu, atau pakai Template Excel untuk import banyak sekaligus.</div>
        <button class="btn btn-success btn-sm" onclick="document.getElementById('btnAdd').click()"><i class="bi bi-plus-circle"></i> Tambah Madrasah Pertama</button>
      </td></tr>`;
      document.querySelectorAll('button[data-edit]').forEach(b => b.addEventListener('click', () => form(data.find(x => x.id === b.dataset.edit))));
      document.querySelectorAll('button[data-del]').forEach(b => b.addEventListener('click', async () => {
        if (await UI.confirmDialog('Hapus madrasah ini?')) {
          Store.set('madrasah', data.filter(x => x.id !== b.dataset.del));
          render();
        }
      }));
    };
    render();

    document.getElementById('qmad').addEventListener('input', U.debounce(render, 200));
    document.getElementById('fmad').addEventListener('change', render);
    document.getElementById('btnAdd').addEventListener('click', () => form(null));
    document.getElementById('btnImp').addEventListener('click', () => document.getElementById('fimp').click());
    document.getElementById('btnExp').addEventListener('click', exportExcel);
    document.getElementById('btnTpl').addEventListener('click', templateExcel);
    document.getElementById('fimp').addEventListener('change', importExcel);

    function form(m) {
      const isNew = !m;
      m = m || { id: Store.uid('m_'), nama_madrasah: '', jenjang: 'MI', nsm: '', npsn: '', kepala_madrasah: '', alamat: '', kecamatan: '', no_hp: '', email: '', status: 'aktif' };
      UI.showModal((isNew ? 'Tambah' : 'Edit') + ' Madrasah', `
        <form id="frmMad" class="row g-3">
          <div class="col-md-8"><label class="form-label required">Nama Madrasah</label><input class="form-control" name="nama_madrasah" value="${U.escapeHtml(m.nama_madrasah)}" required /></div>
          <div class="col-md-4"><label class="form-label">Jenjang</label>
            <select class="form-select" name="jenjang">
              ${['RA','MI','MTs','MA'].map(j => `<option ${m.jenjang === j ? 'selected' : ''}>${j}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-6"><label class="form-label">NSM</label><input class="form-control" name="nsm" value="${U.escapeHtml(m.nsm || '')}" /></div>
          <div class="col-md-6"><label class="form-label">NPSN</label><input class="form-control" name="npsn" value="${U.escapeHtml(m.npsn || '')}" /></div>
          <div class="col-md-12"><label class="form-label">Kepala Madrasah</label><input class="form-control" name="kepala_madrasah" value="${U.escapeHtml(m.kepala_madrasah || '')}" /></div>
          <div class="col-md-12"><label class="form-label">Alamat</label><input class="form-control" name="alamat" value="${U.escapeHtml(m.alamat || '')}" /></div>
          <div class="col-md-6"><label class="form-label">Kecamatan</label><input class="form-control" name="kecamatan" value="${U.escapeHtml(m.kecamatan || '')}" /></div>
          <div class="col-md-3"><label class="form-label">No HP/WA</label><input class="form-control" name="no_hp" value="${U.escapeHtml(m.no_hp || '')}" /></div>
          <div class="col-md-3"><label class="form-label">Email</label><input class="form-control" name="email" value="${U.escapeHtml(m.email || '')}" /></div>
          <div class="col-md-12"><label class="form-label">Status</label>
            <select class="form-select" name="status"><option ${m.status === 'aktif' ? 'selected' : ''}>aktif</option><option ${m.status === 'nonaktif' ? 'selected' : ''}>nonaktif</option></select>
          </div>
          <div class="col-12 text-end"><button class="btn btn-success" type="submit"><i class="bi bi-save"></i> Simpan</button></div>
        </form>
      `, { size: 'lg', onMount: (body, close) => {
        body.querySelector('#frmMad').addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const obj = { ...m };
          for (const [k, v] of fd.entries()) obj[k] = v;
          const data = Store.get('madrasah', []) || [];
          if (isNew) data.push(obj);
          else { const i = data.findIndex(x => x.id === obj.id); if (i >= 0) data[i] = obj; }
          Store.set('madrasah', data);
          close();
          render();
          UI.toast('Madrasah disimpan.');
        });
      }});
    }

    async function templateExcel() {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('madrasah');
      ws.addRow(['nama_madrasah', 'jenjang', 'nsm', 'npsn', 'kepala_madrasah', 'alamat', 'kecamatan', 'no_hp', 'email', 'status']);
      ws.addRow(['MI Contoh', 'MI', '111235090001', '20581234', 'Drs. Contoh', 'Jl. Contoh No. 1', 'Sukowono', '081234567890', 'mi@contoh.id', 'aktif']);
      const buf = await wb.xlsx.writeBuffer();
      U.downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'template_madrasah_binaan.xlsx');
    }

    async function exportExcel() {
      const data = Store.get('madrasah', []) || [];
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('madrasah');
      ws.columns = ['nama_madrasah','jenjang','nsm','npsn','kepala_madrasah','alamat','kecamatan','no_hp','email','status'].map(k => ({ header: k, key: k, width: 20 }));
      data.forEach(m => ws.addRow(m));
      ws.getRow(1).font = { bold: true };
      const buf = await wb.xlsx.writeBuffer();
      U.downloadBlob(new Blob([buf]), 'madrasah_binaan_' + Date.now() + '.xlsx');
    }

    async function importExcel(e) {
      const file = e.target.files[0]; if (!file) return;
      const ab = await U.readFileAsArrayBuffer(file);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(ab);
      const ws = wb.worksheets[0];
      const headers = []; ws.getRow(1).eachCell((c, i) => headers[i - 1] = String(c.value || '').toLowerCase());
      const data = Store.get('madrasah', []) || [];
      let added = 0, updated = 0;
      ws.eachRow((row, i) => {
        if (i === 1) return;
        const obj = {};
        row.eachCell((c, j) => { obj[headers[j - 1]] = c.value == null ? '' : String(c.value); });
        if (!obj.nama_madrasah) return;
        // match by nsm/npsn/nama
        let exist = data.find(x =>
          (obj.nsm && x.nsm === obj.nsm) ||
          (obj.npsn && x.npsn === obj.npsn) ||
          (x.nama_madrasah === obj.nama_madrasah)
        );
        if (exist) { Object.assign(exist, obj); updated++; }
        else { obj.id = Store.uid('m_'); obj.status = obj.status || 'aktif'; data.push(obj); added++; }
      });
      Store.set('madrasah', data);
      UI.toast(`Import selesai: ${added} baru, ${updated} update.`);
      render();
      e.target.value = '';
    }
  };
})();
