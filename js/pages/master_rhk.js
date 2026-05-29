// Master RHK page (list, detail, edit, add custom, delete custom)
(function () {
  function getMaster() {
    return Store.get('master_rhk', null) || JSON.parse(JSON.stringify(window.MASTER_RHK_DEFAULT));
  }
  function saveMaster(list) {
    Store.set('master_rhk', list);
  }

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
        <button class="btn btn-success ms-auto" id="btnAdd"><i class="bi bi-plus-circle"></i> Tambah RHK</button>
        <button class="btn btn-outline-secondary" id="btnReset"><i class="bi bi-arrow-counterclockwise"></i> Reset Default</button>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table table-hover table-sm align-middle mb-0">
            <thead>
              <tr>
                <th>No</th>
                <th>TW</th>
                <th>Jenis</th>
                <th>Nama Eviden / Bukti Dukung</th>
                <th>RHK Atasan yang Diintervensi</th>
                <th>Rencana Hasil Kerja</th>
                <th>Indikator</th>
                <th>Target</th>
                <th>Rencana Aksi</th>
                <th>Durasi</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(r => `
                <tr>
                  <td><strong>${r.id}</strong></td>
                  <td><span class="badge ${r.jenis_kinerja === 'Tambahan' ? 'badge-tambahan' : 'badge-tw'}">${r.triwulan === 'TAMBAHAN' ? 'Tmb' : 'TW ' + r.triwulan}</span></td>
                  <td>${r.jenis_kinerja}</td>
                  <td><a href="#/master-rhk/${encodeURIComponent(r.id)}">${U.escapeHtml(r.nama_eviden)}</a></td>
                  <td class="small" style="max-width:240px;">${U.escapeHtml((r.rhk_atasan_intervensi || '').slice(0, 140))}${(r.rhk_atasan_intervensi || '').length > 140 ? '…' : ''}</td>
                  <td class="small" style="max-width:220px;">${U.escapeHtml((r.rencana_hasil_kerja || '').slice(0, 120))}${(r.rencana_hasil_kerja || '').length > 120 ? '…' : ''}</td>
                  <td class="small" style="max-width:200px;">${U.escapeHtml((r.indikator_kuantitas || '').slice(0, 90))}${(r.indikator_kuantitas || '').length > 90 ? '…' : ''}</td>
                  <td>${U.escapeHtml(r.target_kuantitas || '')}</td>
                  <td class="small" style="max-width:220px;">${U.escapeHtml((r.rencana_aksi || '').slice(0, 120))}${(r.rencana_aksi || '').length > 120 ? '…' : ''}</td>
                  <td>${U.escapeHtml(r.target_waktu || '')}</td>
                  <td class="text-end text-nowrap">
                    <a class="btn btn-sm btn-outline-success" href="#/master-rhk/${encodeURIComponent(r.id)}" title="Detail"><i class="bi bi-eye"></i></a>
                    <a class="btn btn-sm btn-outline-success" href="#/eviden/${encodeURIComponent(r.id)}" title="Generate Eviden"><i class="bi bi-file-earmark-plus"></i></a>
                  </td>
                </tr>`).join('') || `<tr><td colspan="11" class="text-center text-muted p-4">Tidak ada RHK yang cocok.</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
      <div class="text-muted small mt-2">Menampilkan ${filtered.length} dari ${list.length} RHK.</div>
    `);

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
    document.getElementById('btnReset').addEventListener('click', async () => {
      if (await UI.confirmDialog('Kembalikan Master RHK ke default 30 RHK dari SKP 2026? Custom akan hilang.')) {
        Store.set('master_rhk', null);
        Page.MasterRHK();
        UI.toast('Master RHK direset ke default.');
      }
    });
    document.getElementById('btnAdd').addEventListener('click', () => editForm(null));
  };

  Page.MasterRHKDetail = function (id) {
    const list = getMaster();
    const r = list.find(x => x.id === id);
    if (!r) return UI.toast('RHK tidak ditemukan.', 'danger');

    UI.shell('Detail ' + r.id, `
      <div class="d-flex gap-2 mb-3">
        <a class="btn btn-outline-secondary" href="#/master-rhk"><i class="bi bi-arrow-left"></i> Kembali</a>
        <button class="btn btn-success ms-auto" id="btnEdit"><i class="bi bi-pencil"></i> Edit</button>
        ${r.is_custom ? '<button class="btn btn-outline-danger" id="btnDel"><i class="bi bi-trash"></i> Hapus</button>' : ''}
        <a class="btn btn-success" href="#/eviden/${encodeURIComponent(r.id)}"><i class="bi bi-file-earmark-plus"></i> Generate Eviden</a>
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
        </div>
      </div>

      <div class="card">
        <div class="card-header"><i class="bi bi-file-earmark-text"></i> Daftar Bukti Dukung</div>
        <ol class="list-group list-group-numbered list-group-flush">
          ${(r.bukti_dukung || []).map(b => `<li class="list-group-item">${U.escapeHtml(b)}</li>`).join('')}
        </ol>
      </div>
    `);

    document.getElementById('btnEdit').addEventListener('click', () => editForm(r));
    if (r.is_custom) document.getElementById('btnDel').addEventListener('click', async () => {
      if (await UI.confirmDialog('Hapus RHK ini?')) {
        const next = list.filter(x => x.id !== r.id);
        saveMaster(next);
        UI.toast('RHK dihapus.');
        Router.navigate('/master-rhk');
        Router.dispatch();
      }
    });
  };

  function editForm(existing) {
    const list = getMaster();
    const isNew = !existing;
    const r = existing ? JSON.parse(JSON.stringify(existing)) : {
      id: 'RHK-CUST-' + (list.filter(x => x.is_custom).length + 1),
      nomor_rhk: list.length + 1,
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

    UI.showModal((isNew ? 'Tambah' : 'Edit') + ' RHK', `
      <form id="frmRhk">
        <div class="row g-3">
          <div class="col-md-3"><label class="form-label required">Kode RHK</label><input class="form-control" name="id" value="${U.escapeHtml(r.id)}" ${isNew ? '' : 'readonly'} required /></div>
          <div class="col-md-3"><label class="form-label">No</label><input class="form-control" name="nomor_rhk" type="number" value="${r.nomor_rhk}" /></div>
          <div class="col-md-3"><label class="form-label">Triwulan</label>
            <select class="form-select" name="triwulan">
              ${['I','II','III','IV','TAMBAHAN'].map(t => `<option ${r.triwulan === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-3"><label class="form-label">Jenis</label>
            <select class="form-select" name="jenis_kinerja">
              <option ${r.jenis_kinerja === 'Utama' ? 'selected' : ''}>Utama</option>
              <option ${r.jenis_kinerja === 'Tambahan' ? 'selected' : ''}>Tambahan</option>
            </select>
          </div>
          <div class="col-md-12"><label class="form-label required">Nama Eviden / Bukti Dukung Utama</label><input class="form-control" name="nama_eviden" value="${U.escapeHtml(r.nama_eviden)}" required /></div>
          <div class="col-md-12"><label class="form-label">RHK Atasan yang Diintervensi</label><textarea class="form-control" rows="2" name="rhk_atasan_intervensi">${U.escapeHtml(r.rhk_atasan_intervensi)}</textarea></div>
          <div class="col-md-12"><label class="form-label">Rencana Hasil Kerja Pegawai</label><textarea class="form-control" rows="2" name="rencana_hasil_kerja">${U.escapeHtml(r.rencana_hasil_kerja)}</textarea></div>
          <div class="col-md-8"><label class="form-label">Indikator (Kuantitas)</label><input class="form-control" name="indikator_kuantitas" value="${U.escapeHtml(r.indikator_kuantitas)}" /></div>
          <div class="col-md-2"><label class="form-label">Target Kuantitas</label><input class="form-control" name="target_kuantitas" value="${U.escapeHtml(r.target_kuantitas)}" /></div>
          <div class="col-md-2"><label class="form-label">Durasi</label><input class="form-control" name="target_waktu" value="${U.escapeHtml(r.target_waktu)}" /></div>
          <div class="col-md-12"><label class="form-label">Indikator (Waktu)</label><input class="form-control" name="indikator_waktu" value="${U.escapeHtml(r.indikator_waktu)}" /></div>
          <div class="col-md-12"><label class="form-label">Rencana Aksi</label><textarea class="form-control" rows="3" name="rencana_aksi">${U.escapeHtml(r.rencana_aksi)}</textarea></div>
          <div class="col-md-12"><label class="form-label">Daftar Bukti Dukung (1 baris = 1 dokumen)</label><textarea class="form-control" rows="6" name="bukti_dukung">${U.escapeHtml((r.bukti_dukung || []).join('\n'))}</textarea></div>
          <div class="col-md-12"><label class="form-label">Link Bukti Dukung Google Drive</label><input class="form-control" name="link_bukti_dukung" value="${U.escapeHtml(r.link_bukti_dukung || '')}" /></div>
        </div>
        <div class="text-end mt-3"><button class="btn btn-success" type="submit"><i class="bi bi-save"></i> Simpan</button></div>
      </form>
    `, {
      size: 'lg',
      onMount: (body, close) => {
        body.querySelector('#frmRhk').addEventListener('submit', (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const out = { ...r };
          for (const [k, v] of fd.entries()) out[k] = v;
          out.bukti_dukung = (fd.get('bukti_dukung') || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
          out.nomor_rhk = parseInt(out.nomor_rhk) || 0;
          out.durasi = out.target_waktu;
          const cur = getMaster();
          if (isNew) cur.push(out);
          else {
            const i = cur.findIndex(x => x.id === out.id);
            if (i >= 0) cur[i] = out;
          }
          saveMaster(cur);
          close();
          UI.toast('RHK disimpan.');
          if (location.hash.includes('/master-rhk/')) Page.MasterRHKDetail(out.id);
          else Page.MasterRHK();
        });
      }
    });
  }

  Page.MasterRHK.get = getMaster;
})();
