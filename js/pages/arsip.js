// Arsip Eviden
(function () {
  Page.Arsip = function () {
    const eviden = Store.get('eviden', []) || [];
    const masterRhk = Page.MasterRHK.get();
    const kegList = Store.get('kegiatan', []) || [];

    UI.shell('Arsip Eviden', `
      <div class="d-flex flex-wrap gap-2 mb-3">
        <input id="qa" class="form-control" style="max-width:280px;" placeholder="Cari RHK / kegiatan..." />
        <select id="ftw" class="form-select" style="max-width:160px;">
          <option value="">Semua Triwulan</option>
          ${['I','II','III','IV','TAMBAHAN'].map(t => `<option>${t}</option>`).join('')}
        </select>
        <select id="fst" class="form-select" style="max-width:140px;">
          <option value="">Semua Status</option>
          <option>draft</option><option>final</option>
        </select>
        <div class="dropdown ms-auto">
          <button class="btn btn-success dropdown-toggle" data-bs-toggle="dropdown"><i class="bi bi-download"></i> Download Massal</button>
          <ul class="dropdown-menu">
            ${['I','II','III','IV','TAMBAHAN'].map(t => `<li><a class="dropdown-item" href="#" data-zip-tw="${t}"><i class="bi bi-file-zip"></i> ZIP Triwulan ${t === 'TAMBAHAN' ? 'Tambahan' : t}</a></li>`).join('')}
            <li><hr class="dropdown-divider" /></li>
            <li><a class="dropdown-item" href="#" id="btnZipYear"><i class="bi bi-file-zip"></i> ZIP Semua Tahun 2026</a></li>
          </ul>
        </div>
      </div>

      <div class="card"><div class="table-responsive"><table class="table table-hover table-sm align-middle mb-0">
        <thead><tr><th>Tanggal</th><th>RHK</th><th>Judul / Eviden</th><th>Kegiatan</th><th>Dokumen</th><th>Status</th><th></th></tr></thead>
        <tbody id="tbody"></tbody>
      </table></div></div>
    `);

    const render = () => {
      const q = (document.getElementById('qa').value || '').toLowerCase();
      const ftw = document.getElementById('ftw').value;
      const fst = document.getElementById('fst').value;
      const rows = eviden.map(e => {
        const r = masterRhk.find(x => x.id === e.rhk_id);
        const k = e.kegiatan_id ? kegList.find(x => x.id === e.kegiatan_id) : null;
        return { e, r, k };
      }).filter(({ e, r, k }) => {
        if (!r) return false;
        if (ftw && r.triwulan !== ftw) return false;
        if (fst && e.status !== fst) return false;
        if (q) {
          const blob = ((r ? r.nama_eviden : '') + ' ' + (r ? r.id : '') + ' ' + (k ? k.nama_kegiatan : '')).toLowerCase();
          if (!blob.includes(q)) return false;
        }
        return true;
      }).sort((a, b) => (b.e.created_at || '').localeCompare(a.e.created_at || ''));

      document.getElementById('tbody').innerHTML = rows.map(({ e, r, k }) => `
        <tr>
          <td>${U.fmtTanggalISO(e.created_at)}</td>
          <td><span class="badge ${r.jenis_kinerja === 'Tambahan' ? 'badge-tambahan' : 'badge-tw'}">${r.id}</span></td>
          <td><a href="#/eviden/preview/${encodeURIComponent(e.id)}">${U.escapeHtml(r.nama_eviden)}</a></td>
          <td>${k ? U.escapeHtml(k.nama_kegiatan) : '<em class="text-muted">tanpa kegiatan</em>'}</td>
          <td>${(e.tipe_dokumen || []).length} dokumen</td>
          <td><span class="badge ${e.status === 'final' ? 'bg-success' : 'bg-warning text-dark'}">${e.status}</span></td>
          <td class="text-end">
            <a class="btn btn-sm btn-outline-success" href="#/eviden/preview/${encodeURIComponent(e.id)}" title="Preview"><i class="bi bi-eye"></i></a>
            <button class="btn btn-sm btn-outline-success" data-zip="${e.id}" title="Download ZIP"><i class="bi bi-file-zip"></i></button>
            <button class="btn btn-sm btn-outline-danger" data-del="${e.id}" title="Hapus"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `).join('') || `<tr><td colspan="7" class="text-center text-muted p-5">
        <div style="font-size:48px;opacity:.3">📁</div>
        <div class="mt-2"><strong>Belum ada eviden.</strong></div>
        <div class="mb-3 small">Buat eviden dari menu <a href="#/eviden">Generator Eviden</a> setelah Bapak input data kegiatan.</div>
        <a class="btn btn-success btn-sm" href="#/eviden"><i class="bi bi-file-earmark-plus"></i> Buka Generator Eviden</a>
      </td></tr>`;

      document.querySelectorAll('button[data-del]').forEach(b => b.addEventListener('click', async () => {
        if (await UI.confirmDialog('Hapus eviden ini?')) {
          Store.set('eviden', eviden.filter(x => x.id !== b.dataset.del));
          Page.Arsip();
        }
      }));
      document.querySelectorAll('button[data-zip]').forEach(b => b.addEventListener('click', async () => {
        const ev = eviden.find(x => x.id === b.dataset.zip);
        UI.toast('Membuat ZIP…');
        const { blob, filename } = await GenZIP.zipForEviden(ev);
        U.downloadBlob(blob, filename);
      }));
    };
    render();
    document.getElementById('qa').addEventListener('input', U.debounce(render, 200));
    document.getElementById('ftw').addEventListener('change', render);
    document.getElementById('fst').addEventListener('change', render);

    document.querySelectorAll('a[data-zip-tw]').forEach(a => a.addEventListener('click', async (e) => {
      e.preventDefault();
      UI.toast('Membuat ZIP triwulan… ini bisa beberapa detik.');
      const tw = a.dataset.zipTw;
      const { blob, filename } = await GenZIP.zipForTriwulan(tw);
      U.downloadBlob(blob, filename);
    }));
    document.getElementById('btnZipYear').addEventListener('click', async (e) => {
      e.preventDefault();
      if (!await UI.confirmDialog('Buat ZIP semua eviden tahun 2026? Proses ini bisa memakan waktu.')) return;
      UI.toast('Membuat ZIP tahun 2026…');
      const { blob, filename } = await GenZIP.zipForTahun();
      U.downloadBlob(blob, filename);
    });
  };
})();
