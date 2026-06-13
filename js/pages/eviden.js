// Eviden Generator — Index (pilih RHK) dan halaman per RHK + Preview
(function () {
  Page.EvidenIndex = function () {
    const masterRhk = Page.MasterRHK.get();
    const eviden = Store.get('eviden', []) || [];
    const evidenByRHK = {};
    eviden.forEach(e => { (evidenByRHK[e.rhk_id] = evidenByRHK[e.rhk_id] || []).push(e); });

    UI.shell('Generator Eviden Otomatis', `
      <div class="alert alert-light border">
        <i class="bi bi-info-circle text-success"></i> Pilih RHK dari daftar di bawah untuk membuat eviden otomatis. Anda dapat mengaitkan kegiatan yang sudah ada atau membuat eviden tanpa kegiatan (template kosong).
      </div>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <select id="ftwEviden" class="form-select" style="max-width:200px;">
          <option value="">Semua Triwulan</option>
          <option value="I">Triwulan I</option>
          <option value="II">Triwulan II</option>
          <option value="III">Triwulan III</option>
          <option value="IV">Triwulan IV</option>
          <option value="TAMBAHAN">Kinerja Tambahan</option>
        </select>
      </div>
      <div class="row g-3" id="evidenGrid">
        ${masterRhk.map(r => {
          const cnt = (evidenByRHK[r.id] || []).length;
          return `<div class="col-md-6 col-lg-4 eviden-card" data-tw="${r.triwulan}">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <span class="badge ${r.jenis_kinerja === 'Tambahan' ? 'badge-tambahan' : 'badge-tw'}">${r.id} · ${r.triwulan === 'TAMBAHAN' ? 'Tambahan' : 'TW ' + r.triwulan}</span>
                  ${cnt ? `<span class="badge bg-success">${cnt} eviden</span>` : ''}
                </div>
                <div class="fw-bold mb-2">${U.escapeHtml(r.nama_eviden)}</div>
                <div class="small text-muted text-truncate-3" style="display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${U.escapeHtml(r.rencana_hasil_kerja)}</div>
                <div class="d-flex gap-2 mt-3">
                  <a href="#/eviden/${encodeURIComponent(r.id)}" class="btn btn-sm btn-success"><i class="bi bi-file-earmark-plus"></i> Generate</a>
                  <a href="#/master-rhk/${encodeURIComponent(r.id)}" class="btn btn-sm btn-outline-success"><i class="bi bi-eye"></i> Detail</a>
                </div>
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
    `);

    document.getElementById('ftwEviden').addEventListener('change', function() {
      const tw = this.value;
      document.querySelectorAll('.eviden-card').forEach(card => {
        card.style.display = (!tw || card.dataset.tw === tw) ? '' : 'none';
      });
    });
  };

  Page.EvidenForRHK = function (rhkId) {
    const masterRhk = Page.MasterRHK.get();
    const rhk = masterRhk.find(r => r.id === rhkId);
    if (!rhk) return UI.toast('RHK tidak ditemukan', 'danger');
    const allKegiatan = (Store.get('kegiatan', []) || []).filter(k => k.rhk_id === rhkId);
    const params = new URLSearchParams(location.hash.split('?')[1] || '');
    const kegId = params.get('keg') || '';
    const types = GenHTML.defaultTypesFor(rhk);

    UI.shell('Generator Eviden — ' + rhk.id, `
      <div class="card mb-3">
        <div class="card-body">
          <h5 class="mb-1">${U.escapeHtml(rhk.nama_eviden)}</h5>
          <div class="text-muted small mb-2">${rhk.id} · ${rhk.triwulan === 'TAMBAHAN' ? 'Kinerja Tambahan' : 'Triwulan ' + rhk.triwulan}</div>
          <div>${U.nl2br(rhk.rencana_hasil_kerja)}</div>
        </div>
      </div>

      <form id="frmEv">
        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-link"></i> Kegiatan Sumber Data</div>
          <div class="card-body">
            <select class="form-select" name="kegiatan_id">
              <option value="">— Tanpa kegiatan (template kosong) —</option>
              ${allKegiatan.map(k => `<option value="${k.id}" ${kegId === k.id ? 'selected' : ''}>${U.escapeHtml(k.nama_kegiatan)} (${U.escapeHtml(U.fmtTanggal(k.tanggal))})</option>`).join('')}
            </select>
            <div class="form-text">Belum ada kegiatan? <a href="#/kegiatan/baru?rhk=${encodeURIComponent(rhk.id)}">Tambah Kegiatan baru</a> dulu agar narasi terisi otomatis.</div>
          </div>
        </div>

        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-list-check"></i> Pilih Dokumen yang Akan Dihasilkan</div>
          <div class="card-body">
            <div class="row g-2">
              ${types.map(t => `<div class="col-md-4"><div class="form-check"><input class="form-check-input" type="checkbox" name="t_${t}" id="t_${t}" checked /><label class="form-check-label" for="t_${t}">${U.escapeHtml(GenHTML.TYPES[t].label)}</label></div></div>`).join('')}
            </div>
          </div>
        </div>

        <div class="d-flex gap-2 flex-wrap">
          <button class="btn btn-success" name="aksi" value="preview" type="submit"><i class="bi bi-eye"></i> Generate & Preview</button>
          <button class="btn btn-outline-success" name="aksi" value="save_draft" type="submit"><i class="bi bi-save"></i> Simpan Draft</button>
          <button class="btn btn-outline-success" name="aksi" value="save_final" type="submit"><i class="bi bi-check2-circle"></i> Simpan Final</button>
        </div>
      </form>
    `);

    document.getElementById('frmEv').addEventListener('submit', (e) => {
      e.preventDefault();
      const aksi = e.submitter ? e.submitter.value : 'preview';
      const fd = new FormData(e.target);
      const selected = types.filter(t => fd.get('t_' + t));
      const kid = fd.get('kegiatan_id') || '';
      const u = Auth.currentUser();
      const ev = {
        id: Store.uid('e_'),
        user_id: u.id,
        rhk_id: rhk.id,
        kegiatan_id: kid,
        tipe_dokumen: selected,
        judul: rhk.nama_eviden,
        status: aksi === 'save_final' ? 'final' : (aksi === 'save_draft' ? 'draft' : 'draft'),
        created_at: new Date().toISOString(),
      };
      const list = Store.get('eviden', []) || [];
      list.push(ev);
      Store.set('eviden', list);

      if (aksi === 'preview') {
        Router.navigate('/eviden/preview/' + encodeURIComponent(ev.id));
        Router.dispatch();
      } else {
        UI.toast('Eviden disimpan (' + ev.status + ').');
        Router.navigate('/arsip');
        Router.dispatch();
      }
    });
  };

  Page.EvidenPreview = function (id) {
    const list = Store.get('eviden', []) || [];
    const ev = list.find(x => x.id === id);
    if (!ev) return UI.toast('Eviden tidak ditemukan', 'danger');
    const masterRhk = Page.MasterRHK.get();
    const rhk = masterRhk.find(r => r.id === ev.rhk_id);
    const kegList = Store.get('kegiatan', []) || [];
    const keg = ev.kegiatan_id ? kegList.find(k => k.id === ev.kegiatan_id) : null;
    const types = (ev.tipe_dokumen || GenHTML.defaultTypesFor(rhk)).filter(t => GenHTML.TYPES[t]);
    const idn = Page.Identitas.get();
    const parts = types.map(t => ({ id: t, label: GenHTML.TYPES[t].label, html: GenHTML.TYPES[t].gen(rhk, keg, idn) }));

    UI.shell('Preview Eviden ' + rhk.id, `
      <div class="d-flex flex-wrap gap-2 mb-3 no-print">
        <a class="btn btn-outline-secondary" href="#/arsip"><i class="bi bi-arrow-left"></i> Arsip</a>
        <button class="btn btn-success" id="btnPrint"><i class="bi bi-printer"></i> Cetak</button>
        <div class="dropdown">
          <button class="btn btn-success dropdown-toggle" data-bs-toggle="dropdown">
            <i class="bi bi-download"></i> Download
          </button>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="#" id="btnDocxAll"><i class="bi bi-file-earmark-word"></i> Word (semua dokumen)</a></li>
            <li><a class="dropdown-item" href="#" id="btnPdfAll"><i class="bi bi-file-earmark-pdf"></i> PDF (semua dokumen)</a></li>
            <li><a class="dropdown-item" href="#" id="btnHtmlAll"><i class="bi bi-filetype-html"></i> HTML (printable)</a></li>
            <li><a class="dropdown-item" href="#" id="btnZipOne"><i class="bi bi-file-zip"></i> ZIP (paket lengkap)</a></li>
          </ul>
        </div>
        <button class="btn btn-outline-success" id="btnFinal" ${ev.status === 'final' ? 'disabled' : ''}><i class="bi bi-check2-circle"></i> Tandai Final</button>
        <button class="btn btn-outline-danger ms-auto" id="btnDel"><i class="bi bi-trash"></i> Hapus Eviden</button>
      </div>

      <div class="alert alert-light border no-print">
        <strong>${U.escapeHtml(rhk.nama_eviden)}</strong> · ${ev.status} · ${parts.length} dokumen ·
        Kegiatan: ${keg ? U.escapeHtml(keg.nama_kegiatan) : '<em class="text-muted">tanpa kegiatan</em>'}
      </div>

      <ul class="nav nav-pills mb-3 no-print" id="navDoc">
        ${parts.map((p, i) => `<li class="nav-item"><button class="nav-link ${i === 0 ? 'active' : ''}" data-tab="${i}">${U.escapeHtml(p.label)}</button></li>`).join('')}
      </ul>

      <div id="docContainer">
        ${parts.map((p, i) => `<div data-doc="${i}" class="${i === 0 ? '' : 'd-none'}">${p.html}</div>`).join('')}
      </div>
    `);

    document.querySelectorAll('#navDoc button').forEach(btn => btn.addEventListener('click', () => {
      document.querySelectorAll('#navDoc button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('#docContainer > div').forEach(d => d.classList.add('d-none'));
      document.querySelector(`#docContainer > div[data-doc="${btn.dataset.tab}"]`).classList.remove('d-none');
    }));

    document.getElementById('btnPrint').addEventListener('click', () => {
      // Show all docs then print
      document.querySelectorAll('#docContainer > div').forEach(d => d.classList.remove('d-none'));
      showPrintDialog();
    });
    document.getElementById('btnDocxAll').addEventListener('click', async (e) => {
      e.preventDefault();
      UI.toast('Membuat Word… mohon tunggu.');
      // Pakai Word-HTML wrapper supaya layout match dengan tampilan cetak.
      const blob = GenDOCX.htmlToWordDocBlob(parts.map(p => p.html), rhk.id + ' ' + rhk.nama_eviden);
      U.downloadBlob(blob, U.sanitizeFilename(rhk.id + '_' + rhk.nama_eviden) + '.doc');
    });
    document.getElementById('btnPdfAll').addEventListener('click', async (e) => {
      e.preventDefault();
      UI.toast('Membuat PDF… mohon tunggu.');
      try {
        const combined = parts.map(p => p.html).join('\n');
        const blob = await GenPDF.htmlToPdfBlob(combined);
        U.downloadBlob(blob, U.sanitizeFilename(rhk.id + '_' + rhk.nama_eviden) + '.pdf');
      } catch (err) {
        UI.toast('PDF gagal, fallback ke print dialog: ' + err.message, 'warning');
        const combined = parts.map(p => p.html).join('\n');
        GenPDF.printHTML(combined);
      }
    });
    document.getElementById('btnHtmlAll').addEventListener('click', (e) => {
      e.preventDefault();
      const combined = parts.map(p => p.html).join('\n');
      GenPDF.htmlAsPrintable(combined, rhk.id + '_' + rhk.nama_eviden);
    });
    document.getElementById('btnZipOne').addEventListener('click', async (e) => {
      e.preventDefault();
      UI.toast('Membuat paket ZIP…');
      const { blob, filename } = await GenZIP.zipForEviden(ev);
      U.downloadBlob(blob, filename);
    });
    document.getElementById('btnFinal').addEventListener('click', () => {
      const list2 = Store.get('eviden', []) || [];
      const idx = list2.findIndex(x => x.id === ev.id);
      if (idx >= 0) { list2[idx].status = 'final'; Store.set('eviden', list2); }
      UI.toast('Eviden ditandai sebagai final.');
      Page.EvidenPreview(id);
    });
    document.getElementById('btnDel').addEventListener('click', async () => {
      if (await UI.confirmDialog('Hapus eviden ini?')) {
        Store.set('eviden', (Store.get('eviden', []) || []).filter(x => x.id !== ev.id));
        UI.toast('Eviden dihapus.');
        Router.navigate('/arsip'); Router.dispatch();
      }
    });
  };
})();
