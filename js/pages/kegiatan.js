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

    // Helper: render satu textarea + tombol pilih contoh
    const field = (name, label, rows, value, colMd) => {
      const col = colMd || 12;
      return `<div class="col-md-${col}">
        <div class="d-flex justify-content-between align-items-center">
          <label class="form-label mb-1">${U.escapeHtml(label)}</label>
          <button type="button" class="btn btn-sm btn-link p-0 text-decoration-none btn-pick-tpl" data-field="${name}" title="Pilih contoh dari template"><i class="bi bi-clipboard-check"></i> Pilih Contoh</button>
        </div>
        <textarea class="form-control" rows="${rows}" name="${name}" data-field="${name}">${U.escapeHtml(value || '')}</textarea>
      </div>`;
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
          <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span><i class="bi bi-list-task"></i> Uraian Kegiatan</span>
            <div class="btn-group btn-group-sm">
              <button type="button" class="btn btn-outline-success" id="btnGenAll" title="Auto-fill 7 field di bawah dengan template sesuai RHK"><i class="bi bi-magic"></i> Generate Semua</button>
              <button type="button" class="btn btn-outline-secondary" id="btnGenAllVar2" title="Generate dengan varian ke-2 jika tersedia"><i class="bi bi-shuffle"></i> Varian Lain</button>
              <button type="button" class="btn btn-outline-warning" id="btnClearAll" title="Kosongkan 7 field"><i class="bi bi-eraser"></i> Kosongkan</button>
            </div>
          </div>
          <div class="card-body row g-3">
            <div class="col-12"><div class="alert alert-info py-2 px-3 mb-0" style="font-size:13px;"><i class="bi bi-info-circle"></i> Klik <strong>Generate Semua</strong> untuk mengisi otomatis 7 field di bawah berdasarkan RHK terpilih. Klik <strong>icon 📋</strong> di sebelah kanan label tiap field untuk melihat varian alternatif. Anda bebas mengedit setelahnya.</div></div>
            ${field('tujuan', 'Tujuan', 3, k.tujuan)}
            ${field('uraian', 'Uraian/Langkah Kegiatan', 4, k.uraian)}
            ${field('hasil', 'Hasil Kegiatan', 4, k.hasil)}
            ${field('kendala', 'Kendala', 3, k.kendala, 6)}
            ${field('solusi', 'Solusi', 3, k.solusi, 6)}
            ${field('tindak_lanjut', 'Tindak Lanjut', 3, k.tindak_lanjut, 6)}
            ${field('rekomendasi', 'Rekomendasi', 3, k.rekomendasi, 6)}
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

    // ===== Auto-fill Template Kegiatan =====
    const TPL = window.TemplateKegiatan;
    const FIELDS_TPL = ['tujuan', 'uraian', 'hasil', 'kendala', 'solusi', 'tindak_lanjut', 'rekomendasi'];

    function getCurrentRhk() {
      const sel = document.querySelector('select[name="rhk_id"]');
      const id = sel ? sel.value : '';
      return masterRhk.find(r => r.id === id) || null;
    }

    function setField(name, val, force) {
      const ta = document.querySelector(`textarea[name="${name}"]`);
      if (!ta) return;
      if (!force && ta.value && ta.value.trim()) {
        if (!confirm(`Field "${name}" sudah terisi. Timpa dengan template?`)) return;
      }
      ta.value = val;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }

    function genAll(varianIdx) {
      const rhk = getCurrentRhk();
      if (!rhk) { UI.toast('Pilih RHK terlebih dahulu untuk generate template.'); return; }
      if (!TPL) { UI.toast('Library template belum dimuat.'); return; }

      const filled = FIELDS_TPL.filter(f => {
        const ta = document.querySelector(`textarea[name="${f}"]`);
        return ta && ta.value && ta.value.trim();
      });
      if (filled.length > 0) {
        if (!confirm(`${filled.length} field sudah terisi (${filled.join(', ')}). Timpa semua dengan template?`)) return;
      }

      const out = TPL.generateAll(rhk, varianIdx || 0);
      FIELDS_TPL.forEach(f => {
        const ta = document.querySelector(`textarea[name="${f}"]`);
        if (ta) {
          ta.value = out[f] || '';
          ta.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      UI.toast(`Template diisi (kategori: ${TPL.getKategori(rhk)}, varian ${(varianIdx || 0) + 1}). Silakan edit sesuai kebutuhan.`);
    }

    function clearAll() {
      if (!confirm('Yakin mengosongkan 7 field Uraian Kegiatan?')) return;
      FIELDS_TPL.forEach(f => {
        const ta = document.querySelector(`textarea[name="${f}"]`);
        if (ta) { ta.value = ''; ta.dispatchEvent(new Event('input', { bubbles: true })); }
      });
      UI.toast('Field Uraian Kegiatan dikosongkan.');
    }

    function showPickModal(fieldName) {
      const rhk = getCurrentRhk();
      if (!rhk) { UI.toast('Pilih RHK terlebih dahulu.'); return; }
      if (!TPL) { UI.toast('Library template belum dimuat.'); return; }

      const varians = TPL.getAllVarians(rhk, fieldName);
      const labelMap = {
        tujuan: 'Tujuan', uraian: 'Uraian/Langkah Kegiatan', hasil: 'Hasil Kegiatan',
        kendala: 'Kendala', solusi: 'Solusi', tindak_lanjut: 'Tindak Lanjut', rekomendasi: 'Rekomendasi',
      };
      const label = labelMap[fieldName] || fieldName;

      let oldModal = document.getElementById('mdlPickTpl');
      if (oldModal) oldModal.remove();

      const modalHtml = `
        <div class="modal fade" id="mdlPickTpl" tabindex="-1">
          <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title"><i class="bi bi-clipboard-check"></i> Pilih Contoh: ${U.escapeHtml(label)}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <div class="alert alert-info py-2 px-3 mb-3" style="font-size:13px;">
                  <i class="bi bi-info-circle"></i> Kategori: <strong>${TPL.getKategori(rhk)}</strong> — ${U.escapeHtml(rhk.nama_eviden || '')}<br/>
                  Klik tombol <strong>Pakai</strong> pada salah satu contoh untuk memilihnya.
                </div>
                ${varians.map((v, idx) => `
                  <div class="card mb-2">
                    <div class="card-body py-2 px-3">
                      <div class="d-flex justify-content-between align-items-start gap-2">
                        <div class="flex-grow-1">
                          <div class="small text-muted mb-1">Varian ${idx + 1}</div>
                          <div style="white-space:pre-wrap;font-size:13px;">${U.escapeHtml(v)}</div>
                        </div>
                        <button type="button" class="btn btn-sm btn-success btn-use-tpl flex-shrink-0" data-tpl-idx="${idx}"><i class="bi bi-check-lg"></i> Pakai</button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Batal</button>
              </div>
            </div>
          </div>
        </div>`;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      const modalEl = document.getElementById('mdlPickTpl');
      const modal = new bootstrap.Modal(modalEl);
      modal.show();

      modalEl.querySelectorAll('.btn-use-tpl').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.dataset.tplIdx);
          setField(fieldName, varians[idx], false);
          modal.hide();
          UI.toast(`Contoh "${label}" varian ${idx + 1} diterapkan.`);
        });
      });
      modalEl.addEventListener('hidden.bs.modal', () => modalEl.remove(), { once: true });
    }

    const btnGenAll = document.getElementById('btnGenAll');
    if (btnGenAll) btnGenAll.addEventListener('click', () => genAll(0));
    const btnGenAllVar2 = document.getElementById('btnGenAllVar2');
    if (btnGenAllVar2) btnGenAllVar2.addEventListener('click', () => genAll(1));
    const btnClearAll = document.getElementById('btnClearAll');
    if (btnClearAll) btnClearAll.addEventListener('click', clearAll);
    document.querySelectorAll('.btn-pick-tpl').forEach(btn => {
      btn.addEventListener('click', () => showPickModal(btn.dataset.field));
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
