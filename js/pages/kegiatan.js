// Data Kegiatan: list + form
(function () {
  Page.KegiatanList = function () {
    const data = Store.get('kegiatan', []) || [];
    const masterRhk = Page.MasterRHK.get();
    const madrasah = Store.get('madrasah', []) || [];

    UI.shell('Data Kegiatan', `
      <div class="d-flex flex-wrap gap-2 mb-3">
        <input id="qkeg" class="form-control" style="max-width:300px;" placeholder="Cari kegiatan/RHK..." />
        <select id="ftw" class="form-select" style="max-width:160px;">
          <option value="">Semua Triwulan</option>
          ${['I','II','III','IV','TAMBAHAN'].map(t => `<option>${t}</option>`).join('')}
        </select>
        <select id="fst" class="form-select" style="max-width:160px;">
          <option value="">Semua Status</option>
          <option>draft</option><option>final</option>
        </select>
        <a class="btn btn-success ms-auto" href="#/kegiatan/baru"><i class="bi bi-plus-circle"></i> Tambah Kegiatan</a>
      </div>
      <div class="card"><div class="table-responsive"><table class="table table-hover table-sm mb-0 align-middle">
        <thead><tr><th>Tanggal</th><th>RHK</th><th>Nama Kegiatan</th><th>Tempat</th><th>Sasaran</th><th>Status</th><th></th></tr></thead>
        <tbody id="tbody"></tbody>
      </table></div></div>
    `);

    const render = () => {
      const q = (document.getElementById('qkeg').value || '').toLowerCase();
      const ftw = document.getElementById('ftw').value;
      const fst = document.getElementById('fst').value;
      const f = data.filter(k => {
        const r = masterRhk.find(x => x.id === k.rhk_id);
        if (ftw && r && r.triwulan !== ftw) return false;
        if (fst && k.status !== fst) return false;
        if (q) {
          const blob = (k.nama_kegiatan + ' ' + (r ? r.nama_eviden : '') + ' ' + (k.tempat || '') + ' ' + (k.sasaran || '')).toLowerCase();
          if (!blob.includes(q)) return false;
        }
        return true;
      }).sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || ''));
      document.getElementById('tbody').innerHTML = f.map(k => {
        const r = masterRhk.find(x => x.id === k.rhk_id);
        return `<tr>
          <td>${U.escapeHtml(k.tanggal || '')}</td>
          <td><strong>${U.escapeHtml(k.rhk_id || '')}</strong><div class="small text-muted text-truncate" style="max-width:240px">${U.escapeHtml(r ? r.nama_eviden : '')}</div></td>
          <td><a href="#/kegiatan/${encodeURIComponent(k.id)}">${U.escapeHtml(k.nama_kegiatan)}</a></td>
          <td>${U.escapeHtml(k.tempat || '')}</td>
          <td class="small">${U.escapeHtml((k.sasaran || '').slice(0, 60))}</td>
          <td><span class="badge ${k.status === 'final' ? 'bg-success' : 'bg-warning text-dark'}">${k.status}</span></td>
          <td class="text-end">
            <a class="btn btn-sm btn-outline-success" href="#/kegiatan/${encodeURIComponent(k.id)}" title="Edit"><i class="bi bi-pencil"></i></a>
            <a class="btn btn-sm btn-success" href="#/eviden/${encodeURIComponent(k.rhk_id)}?keg=${encodeURIComponent(k.id)}" title="Generate Eviden"><i class="bi bi-file-earmark-plus"></i></a>
            <button class="btn btn-sm btn-outline-danger" data-del="${k.id}" title="Hapus"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`;
      }).join('') || `<tr><td colspan="7" class="text-center text-muted p-5">
          <div style="font-size:48px;opacity:.3">📝</div>
          <div class="mt-2"><strong>Belum ada kegiatan.</strong></div>
          <div class="mb-3 small">Tambah kegiatan untuk mulai membuat eviden RHK.</div>
          <a class="btn btn-success btn-sm" href="#/kegiatan/baru"><i class="bi bi-plus-circle"></i> Tambah Kegiatan Pertama</a>
        </td></tr>`;
      document.querySelectorAll('button[data-del]').forEach(b => b.addEventListener('click', async () => {
        if (await UI.confirmDialog('Hapus kegiatan ini?')) {
          Store.set('kegiatan', data.filter(x => x.id !== b.dataset.del));
          Page.KegiatanList();
        }
      }));
    };
    render();
    document.getElementById('qkeg').addEventListener('input', U.debounce(render, 200));
    document.getElementById('ftw').addEventListener('change', render);
    document.getElementById('fst').addEventListener('change', render);
  };

  Page.KegiatanForm = function (id) {
    const data = Store.get('kegiatan', []) || [];
    const masterRhk = Page.MasterRHK.get();
    const madrasah = Store.get('madrasah', []) || [];
    const isNew = !id;
    const existing = id ? data.find(k => k.id === id) : null;
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const preRhk = params.get('rhk') || '';
    const k = existing || {
      id: Store.uid('k_'),
      rhk_id: preRhk,
      tanggal: U.fmtTanggalISO(new Date()),
      tempat: '',
      sasaran: '',
      peserta: '',
      narasumber: '',
      uraian: '',
      tujuan: '',
      hasil: '',
      kendala: '',
      solusi: '',
      tindak_lanjut: '',
      rekomendasi: '',
      foto: [],
      lampiran: [],
      status: 'draft',
      nama_kegiatan: '',
      created_at: new Date().toISOString(),
    };

    UI.shell((isNew ? 'Tambah' : 'Edit') + ' Kegiatan', `
      <form id="frmKeg">
        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-link-45deg"></i> Pemetaan RHK</div>
          <div class="card-body row g-3">
            <div class="col-md-12"><label class="form-label required">Pilih RHK</label>
              <select class="form-select" name="rhk_id" required>
                <option value="">— Pilih RHK —</option>
                ${masterRhk.map(r => `<option value="${r.id}" ${k.rhk_id === r.id ? 'selected' : ''}>${r.id} (TW ${r.triwulan}) — ${U.escapeHtml(r.nama_eviden)}</option>`).join('')}
              </select>
            </div>
            <div class="col-md-12"><label class="form-label required">Nama Kegiatan</label>
              <input class="form-control" name="nama_kegiatan" value="${U.escapeHtml(k.nama_kegiatan)}" required placeholder="Contoh: Pendampingan Penyusunan RKTM Madrasah Binaan" />
            </div>
            <div class="col-md-4"><label class="form-label">Tanggal</label><input type="date" class="form-control" name="tanggal" value="${U.escapeHtml(k.tanggal)}" /></div>
            <div class="col-md-8"><label class="form-label">Tempat</label><input class="form-control" name="tempat" value="${U.escapeHtml(k.tempat || '')}" placeholder="Contoh: MA Negeri 1 Jember" /></div>
            <div class="col-md-12"><label class="form-label">Madrasah Sasaran</label>
              <select class="form-select" name="madrasah_id">
                <option value="">(opsional — pilih madrasah binaan)</option>
                ${madrasah.map(m => `<option value="${m.id}" ${k.madrasah_id === m.id ? 'selected' : ''}>${U.escapeHtml(m.nama_madrasah)} (${m.jenjang})</option>`).join('')}
              </select>
            </div>
            <div class="col-md-6"><label class="form-label">Sasaran</label><textarea class="form-control" rows="2" name="sasaran">${U.escapeHtml(k.sasaran || '')}</textarea></div>
            <div class="col-md-6"><label class="form-label">Peserta</label><textarea class="form-control" rows="2" name="peserta">${U.escapeHtml(k.peserta || '')}</textarea></div>
            <div class="col-md-12"><label class="form-label">Narasumber/Pengawas</label><input class="form-control" name="narasumber" value="${U.escapeHtml(k.narasumber || '')}" /></div>
          </div>
        </div>

        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-list-task"></i> Uraian Kegiatan</div>
          <div class="card-body row g-3">
            <div class="col-md-12"><label class="form-label">Tujuan</label><textarea class="form-control" rows="3" name="tujuan">${U.escapeHtml(k.tujuan || '')}</textarea></div>
            <div class="col-md-12"><label class="form-label">Uraian/Langkah Kegiatan</label><textarea class="form-control" rows="4" name="uraian">${U.escapeHtml(k.uraian || '')}</textarea></div>
            <div class="col-md-12"><label class="form-label">Hasil Kegiatan</label><textarea class="form-control" rows="4" name="hasil">${U.escapeHtml(k.hasil || '')}</textarea></div>
            <div class="col-md-6"><label class="form-label">Kendala</label><textarea class="form-control" rows="3" name="kendala">${U.escapeHtml(k.kendala || '')}</textarea></div>
            <div class="col-md-6"><label class="form-label">Solusi</label><textarea class="form-control" rows="3" name="solusi">${U.escapeHtml(k.solusi || '')}</textarea></div>
            <div class="col-md-6"><label class="form-label">Tindak Lanjut</label><textarea class="form-control" rows="3" name="tindak_lanjut">${U.escapeHtml(k.tindak_lanjut || '')}</textarea></div>
            <div class="col-md-6"><label class="form-label">Rekomendasi</label><textarea class="form-control" rows="3" name="rekomendasi">${U.escapeHtml(k.rekomendasi || '')}</textarea></div>
          </div>
        </div>

        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-image"></i> Dokumentasi Foto</div>
          <div class="card-body">
            <input type="file" class="form-control" id="ffoto" accept="image/*" multiple />
            <div id="prevFoto" class="d-flex gap-2 flex-wrap mt-3"></div>
          </div>
        </div>

        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-paperclip"></i> Lampiran Dokumen</div>
          <div class="card-body">
            <input type="file" class="form-control" id="flmp" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple />
            <ul id="prevLmp" class="list-unstyled mt-3"></ul>
            <div class="form-text">Lampiran disimpan sebagai dataURL di localStorage; total volume terbatas. Untuk file besar gunakan link Google Drive di Master RHK.</div>
          </div>
        </div>

        <div class="d-flex gap-2 mb-4">
          <button class="btn btn-outline-success" name="aksi" value="draft" type="submit"><i class="bi bi-save"></i> Simpan Draft</button>
          <button class="btn btn-success" name="aksi" value="final" type="submit"><i class="bi bi-check2-circle"></i> Simpan Final</button>
          ${!isNew ? `<a class="btn btn-success ms-auto" href="#/eviden/${encodeURIComponent(k.rhk_id)}?keg=${encodeURIComponent(k.id)}"><i class="bi bi-file-earmark-plus"></i> Generate Eviden</a>` : ''}
        </div>
      </form>
    `);

    // Render foto
    const fotoState = [...(k.foto || [])];
    const lmpState = [...(k.lampiran || [])];
    const renderFoto = () => {
      document.getElementById('prevFoto').innerHTML = fotoState.map((f, i) => `
        <div class="position-relative" style="width:120px">
          <img src="${f.dataUrl}" class="img-thumbnail" style="height:90px;width:120px;object-fit:cover" />
          <div class="small text-truncate" title="${U.escapeHtml(f.name)}">${U.escapeHtml(f.name)}</div>
          <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0" data-rmfoto="${i}"><i class="bi bi-x"></i></button>
        </div>
      `).join('');
      document.querySelectorAll('button[data-rmfoto]').forEach(b => b.addEventListener('click', () => { fotoState.splice(parseInt(b.dataset.rmfoto), 1); renderFoto(); }));
    };
    const renderLmp = () => {
      document.getElementById('prevLmp').innerHTML = lmpState.map((l, i) => `
        <li class="d-flex gap-2 align-items-center mb-1">
          <i class="bi bi-file-earmark"></i>
          <span class="flex-grow-1">${U.escapeHtml(l.name)} <span class="text-muted small">(${Math.round((l.size||0)/1024)} KB)</span></span>
          <button type="button" class="btn btn-sm btn-outline-danger" data-rmlmp="${i}"><i class="bi bi-x"></i></button>
        </li>`).join('');
      document.querySelectorAll('button[data-rmlmp]').forEach(b => b.addEventListener('click', () => { lmpState.splice(parseInt(b.dataset.rmlmp), 1); renderLmp(); }));
    };
    renderFoto(); renderLmp();

    document.getElementById('ffoto').addEventListener('change', async (e) => {
      for (const f of e.target.files) {
        const dataUrl = await U.readFileAsDataURL(f);
        const compressed = await U.compressImage(dataUrl, 1200, 0.78);
        fotoState.push({ name: f.name, dataUrl: compressed });
      }
      renderFoto();
      e.target.value = '';
    });
    document.getElementById('flmp').addEventListener('change', async (e) => {
      for (const f of e.target.files) {
        const dataUrl = await U.readFileAsDataURL(f);
        lmpState.push({ name: f.name, size: f.size, dataUrl });
      }
      renderLmp();
      e.target.value = '';
    });

    document.getElementById('frmKeg').addEventListener('submit', (e) => {
      e.preventDefault();
      const aksi = e.submitter ? e.submitter.value : 'draft';
      const fd = new FormData(e.target);
      const out = { ...k };
      for (const [key, val] of fd.entries()) out[key] = val;
      out.foto = fotoState;
      out.lampiran = lmpState;
      out.status = aksi;
      out.updated_at = new Date().toISOString();
      const list = Store.get('kegiatan', []) || [];
      if (isNew) list.push(out);
      else { const i = list.findIndex(x => x.id === out.id); if (i >= 0) list[i] = out; }
      Store.set('kegiatan', list);
      UI.toast('Kegiatan disimpan (' + aksi + ').');
      Router.navigate('/kegiatan');
      Router.dispatch();
    });
  };
})();
