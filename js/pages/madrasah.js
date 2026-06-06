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
            <button class="btn btn-sm btn-outline-primary" data-gtk="${m.id}" title="Data GTK"><i class="bi bi-people"></i> GTK</button>
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
      document.querySelectorAll('button[data-gtk]').forEach(b => b.addEventListener('click', () => gtkModal(data.find(x => x.id === b.dataset.gtk))));
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

    // ===== GTK (Guru & Tenaga Kependidikan) Modal =====
    function gtkModal(m) {
      if (!m) return;
      const jabatanOpts = ['Guru Kelas', 'Guru Mapel', 'Tendik', 'Operator'];

      function getGtk() {
        const data = Store.get('madrasah', []) || [];
        const mad = data.find(x => x.id === m.id);
        return (mad && mad.gtk) ? mad.gtk : [];
      }

      function saveGtk(gtk) {
        const data = Store.get('madrasah', []) || [];
        const mad = data.find(x => x.id === m.id);
        if (mad) { mad.gtk = gtk; Store.set('madrasah', data); }
      }

      function renderGtkList() {
        const gtk = getGtk();
        return gtk.length ? gtk.map((g, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${U.escapeHtml(g.nama)}</td>
            <td>${U.escapeHtml(g.nip_nuptk || '-')}</td>
            <td>${U.escapeHtml(g.jabatan || '')}</td>
            <td>${U.escapeHtml(g.pangkat_golongan || '-')}</td>
            <td>${U.escapeHtml(g.no_hp || '-')}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-success" data-editgtk="${g.id}"><i class="bi bi-pencil"></i></button>
              <button class="btn btn-sm btn-outline-danger" data-delgtk="${g.id}"><i class="bi bi-trash"></i></button>
            </td>
          </tr>
        `).join('') : `<tr><td colspan="7" class="text-center text-muted py-3">Belum ada data GTK.</td></tr>`;
      }

      UI.showModal('Data GTK — ' + U.escapeHtml(m.nama_madrasah), `
        <div class="d-flex flex-wrap gap-2 mb-3">
          <button class="btn btn-success btn-sm" id="btnAddGtk"><i class="bi bi-plus-circle"></i> Tambah GTK</button>
          <button class="btn btn-outline-success btn-sm" id="btnImpGtk"><i class="bi bi-upload"></i> Import Excel</button>
          <button class="btn btn-outline-secondary btn-sm" id="btnTplGtk"><i class="bi bi-file-earmark-spreadsheet"></i> Template</button>
          <input type="file" id="fimpGtk" accept=".xlsx,.xls" class="d-none" />
        </div>
        <div class="table-responsive"><table class="table table-hover table-sm mb-0 align-middle">
          <thead><tr><th>No</th><th>Nama</th><th>NIP/NUPTK</th><th>Jabatan</th><th>Pangkat/Gol</th><th>No HP</th><th></th></tr></thead>
          <tbody id="tbodyGtk">${renderGtkList()}</tbody>
        </table></div>
      `, { size: 'xl', onMount: (body, close) => {

        function refreshTable() {
          body.querySelector('#tbodyGtk').innerHTML = renderGtkList();
          bindGtkButtons();
        }

        function bindGtkButtons() {
          body.querySelectorAll('button[data-editgtk]').forEach(b => b.addEventListener('click', () => {
            const gtk = getGtk();
            const g = gtk.find(x => x.id === b.dataset.editgtk);
            if (g) gtkForm(g);
          }));
          body.querySelectorAll('button[data-delgtk]').forEach(b => b.addEventListener('click', async () => {
            if (await UI.confirmDialog('Hapus data GTK ini?')) {
              const gtk = getGtk().filter(x => x.id !== b.dataset.delgtk);
              saveGtk(gtk);
              refreshTable();
            }
          }));
        }
        bindGtkButtons();

        body.querySelector('#btnAddGtk').addEventListener('click', () => gtkForm(null));
        body.querySelector('#btnImpGtk').addEventListener('click', () => body.querySelector('#fimpGtk').click());
        body.querySelector('#btnTplGtk').addEventListener('click', gtkTemplate);
        body.querySelector('#fimpGtk').addEventListener('change', gtkImport);

        function gtkForm(g) {
          const isNew = !g;
          g = g || { id: Store.uid('gtk_'), nama: '', nip_nuptk: '', jabatan: 'Guru Kelas', pangkat_golongan: '', no_hp: '' };
          UI.showModal((isNew ? 'Tambah' : 'Edit') + ' GTK', `
            <form id="frmGtk" class="row g-3">
              <div class="col-md-12"><label class="form-label required">Nama</label><input class="form-control" name="nama" value="${U.escapeHtml(g.nama)}" required /></div>
              <div class="col-md-6"><label class="form-label">NIP/NUPTK</label><input class="form-control" name="nip_nuptk" value="${U.escapeHtml(g.nip_nuptk || '')}" /></div>
              <div class="col-md-6"><label class="form-label">Jabatan</label>
                <select class="form-select" name="jabatan">
                  ${jabatanOpts.map(j => `<option ${g.jabatan === j ? 'selected' : ''}>${j}</option>`).join('')}
                </select>
              </div>
              <div class="col-md-6"><label class="form-label">Pangkat/Golongan</label><input class="form-control" name="pangkat_golongan" value="${U.escapeHtml(g.pangkat_golongan || '')}" /></div>
              <div class="col-md-6"><label class="form-label">No HP</label><input class="form-control" name="no_hp" value="${U.escapeHtml(g.no_hp || '')}" /></div>
              <div class="col-12 text-end"><button class="btn btn-success" type="submit"><i class="bi bi-save"></i> Simpan</button></div>
            </form>
          `, { size: 'md', onMount: (body2, close2) => {
            body2.querySelector('#frmGtk').addEventListener('submit', (e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              const obj = { ...g };
              for (const [k, v] of fd.entries()) obj[k] = v;
              const gtk = getGtk();
              if (isNew) { gtk.push(obj); }
              else { const i = gtk.findIndex(x => x.id === obj.id); if (i >= 0) gtk[i] = obj; }
              saveGtk(gtk);
              close2();
              refreshTable();
              UI.toast('Data GTK disimpan.');
            });
          }});
        }

        async function gtkTemplate() {
          const wb = new ExcelJS.Workbook();
          const ws = wb.addWorksheet('gtk');
          ws.addRow(['nama', 'nip_nuptk', 'jabatan', 'pangkat_golongan', 'no_hp']);
          ws.addRow(['Ahmad Fauzi, S.Pd', '198501012010011001', 'Guru Kelas', 'III/c', '081234567890']);
          ws.addRow(['Siti Aminah, S.Ag', '197803052005012003', 'Guru Mapel', 'IV/a', '082345678901']);
          ws.getRow(1).font = { bold: true };
          ws.columns.forEach(c => { c.width = 22; });
          const buf = await wb.xlsx.writeBuffer();
          U.downloadBlob(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'template_gtk_' + m.nama_madrasah.replace(/\s+/g, '_') + '.xlsx');
        }

        async function gtkImport(e) {
          const file = e.target.files[0]; if (!file) return;
          const ab = await U.readFileAsArrayBuffer(file);
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(ab);
          const ws = wb.worksheets[0];
          const headers = []; ws.getRow(1).eachCell((c, i) => headers[i - 1] = String(c.value || '').toLowerCase().replace(/[\/\s]/g, '_'));
          const gtk = getGtk();
          let added = 0;
          ws.eachRow((row, i) => {
            if (i === 1) return;
            const obj = {};
            row.eachCell((c, j) => { obj[headers[j - 1]] = c.value == null ? '' : String(c.value); });
            if (!obj.nama) return;
            // normalize header aliases
            if (!obj.nip_nuptk && obj['nip/nuptk']) obj.nip_nuptk = obj['nip/nuptk'];
            if (!obj.pangkat_golongan && obj['pangkat_gol']) obj.pangkat_golongan = obj['pangkat_gol'];
            if (!obj.no_hp && obj['no_hp_wa']) obj.no_hp = obj['no_hp_wa'];
            obj.id = Store.uid('gtk_');
            obj.jabatan = obj.jabatan || 'Guru Kelas';
            gtk.push(obj);
            added++;
          });
          saveGtk(gtk);
          UI.toast(`Import GTK selesai: ${added} data ditambahkan.`);
          refreshTable();
          e.target.value = '';
        }
      }});
    }

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
