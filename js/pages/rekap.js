// Rekapitulasi
(function () {
  Page.Rekap = function () {
    const masterRhk = Page.MasterRHK.get();
    const eviden = Store.get('eviden', []) || [];
    const kegiatan = Store.get('kegiatan', []) || [];
    const madrasah = Store.get('madrasah', []) || [];

    UI.shell('Rekapitulasi', `
      <div class="d-flex gap-2 mb-3">
        <button class="btn btn-success" id="btnExp"><i class="bi bi-file-earmark-spreadsheet"></i> Export Excel</button>
        <button class="btn btn-outline-success" id="btnPdf"><i class="bi bi-file-earmark-pdf"></i> Cetak / PDF</button>
      </div>

      <div class="card mb-3" id="cardCetak">
        <div class="card-header">Rekap Eviden per RHK</div>
        <div class="table-responsive">
          <table class="table table-sm table-bordered align-middle mb-0">
            <thead><tr><th>RHK</th><th>Triwulan</th><th>Nama Eviden</th><th>Indikator (Kuantitas)</th><th>Target</th><th>Jumlah Eviden</th><th>Final</th><th>Draft</th></tr></thead>
            <tbody>
              ${masterRhk.map(r => {
                const evs = eviden.filter(e => e.rhk_id === r.id);
                const final = evs.filter(e => e.status === 'final').length;
                const draft = evs.filter(e => e.status === 'draft').length;
                return `<tr>
                  <td><strong>${r.id}</strong></td>
                  <td>${r.triwulan === 'TAMBAHAN' ? 'Tambahan' : 'TW ' + r.triwulan}</td>
                  <td>${U.escapeHtml(r.nama_eviden)}</td>
                  <td class="small">${U.escapeHtml(r.indikator_kuantitas || '')}</td>
                  <td>${U.escapeHtml(r.target_kuantitas || '')}</td>
                  <td>${evs.length}</td>
                  <td>${final}</td>
                  <td>${draft}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card mb-3">
        <div class="card-header">Rekap Eviden per Triwulan</div>
        <div class="table-responsive">
          <table class="table table-sm table-bordered mb-0">
            <thead><tr><th>Triwulan</th><th>Total RHK</th><th>RHK ber-eviden</th><th>Eviden Final</th><th>Eviden Draft</th><th>Kegiatan</th></tr></thead>
            <tbody>
              ${['I','II','III','IV','TAMBAHAN'].map(tw => {
                const rs = masterRhk.filter(r => r.triwulan === tw);
                const ev = eviden.filter(e => rs.find(r => r.id === e.rhk_id));
                const rsBer = rs.filter(r => eviden.some(e => e.rhk_id === r.id)).length;
                const kg = kegiatan.filter(k => rs.find(r => r.id === k.rhk_id));
                return `<tr><td>${tw === 'TAMBAHAN' ? 'Tambahan' : 'Triwulan ' + tw}</td><td>${rs.length}</td><td>${rsBer}</td><td>${ev.filter(e => e.status === 'final').length}</td><td>${ev.filter(e => e.status === 'draft').length}</td><td>${kg.length}</td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card mb-3">
        <div class="card-header">Rekap Kegiatan per Madrasah</div>
        <div class="table-responsive">
          <table class="table table-sm table-bordered mb-0">
            <thead><tr><th>Madrasah</th><th>Jenjang</th><th>Jumlah Kegiatan</th></tr></thead>
            <tbody>
              ${madrasah.map(m => {
                const c = kegiatan.filter(k => k.madrasah_id === m.id).length;
                return `<tr><td>${U.escapeHtml(m.nama_madrasah)}</td><td>${U.escapeHtml(m.jenjang || '')}</td><td>${c}</td></tr>`;
              }).join('') || '<tr><td colspan="3" class="text-center text-muted">Belum ada madrasah binaan.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header">Eviden yang Belum Lengkap</div>
        <div class="card-body">
          <div class="row g-2">
            ${masterRhk.filter(r => !eviden.some(e => e.rhk_id === r.id)).map(r => `
              <div class="col-md-4 col-lg-3">
                <div class="d-flex gap-2 align-items-center small p-2 border rounded">
                  <span class="badge bg-secondary">${r.id}</span>
                  <span class="flex-grow-1 text-truncate" title="${U.escapeHtml(r.nama_eviden)}">${U.escapeHtml(r.nama_eviden)}</span>
                  <a href="#/eviden/${encodeURIComponent(r.id)}" class="btn btn-sm btn-success py-0 px-2">Buat</a>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </div>
    `);

    document.getElementById('btnPdf').addEventListener('click', () => window.print());
    document.getElementById('btnExp').addEventListener('click', exportExcel);

    async function exportExcel() {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Per RHK');
      ws.columns = [
        { header: 'RHK', key: 'id', width: 12 },
        { header: 'Triwulan', key: 'tw', width: 10 },
        { header: 'Nama Eviden', key: 'nm', width: 60 },
        { header: 'Indikator Kuantitas', key: 'ik', width: 50 },
        { header: 'Target', key: 'tg', width: 12 },
        { header: 'Jumlah', key: 'jum', width: 10 },
        { header: 'Final', key: 'fn', width: 10 },
        { header: 'Draft', key: 'dr', width: 10 },
      ];
      ws.getRow(1).font = { bold: true };
      masterRhk.forEach(r => {
        const evs = eviden.filter(e => e.rhk_id === r.id);
        ws.addRow({
          id: r.id, tw: r.triwulan, nm: r.nama_eviden, ik: r.indikator_kuantitas, tg: r.target_kuantitas,
          jum: evs.length, fn: evs.filter(e => e.status === 'final').length, dr: evs.filter(e => e.status === 'draft').length,
        });
      });

      const ws2 = wb.addWorksheet('Per Triwulan');
      ws2.columns = [
        { header: 'Triwulan', key: 'tw', width: 16 },
        { header: 'Total RHK', key: 'rs', width: 12 },
        { header: 'RHK ber-eviden', key: 'rb', width: 16 },
        { header: 'Final', key: 'fn', width: 10 },
        { header: 'Draft', key: 'dr', width: 10 },
        { header: 'Kegiatan', key: 'kg', width: 12 },
      ];
      ws2.getRow(1).font = { bold: true };
      ['I','II','III','IV','TAMBAHAN'].forEach(tw => {
        const rs = masterRhk.filter(r => r.triwulan === tw);
        const ev = eviden.filter(e => rs.find(r => r.id === e.rhk_id));
        const kg = kegiatan.filter(k => rs.find(r => r.id === k.rhk_id));
        ws2.addRow({ tw, rs: rs.length, rb: rs.filter(r => eviden.some(e => e.rhk_id === r.id)).length, fn: ev.filter(e => e.status === 'final').length, dr: ev.filter(e => e.status === 'draft').length, kg: kg.length });
      });

      const ws3 = wb.addWorksheet('Madrasah');
      ws3.columns = [
        { header: 'Nama Madrasah', key: 'nm', width: 40 },
        { header: 'Jenjang', key: 'jj', width: 10 },
        { header: 'Kegiatan', key: 'kg', width: 12 },
      ];
      ws3.getRow(1).font = { bold: true };
      madrasah.forEach(m => ws3.addRow({ nm: m.nama_madrasah, jj: m.jenjang, kg: kegiatan.filter(k => k.madrasah_id === m.id).length }));

      const buf = await wb.xlsx.writeBuffer();
      U.downloadBlob(new Blob([buf]), 'rekap_e-rhk_2026_' + Date.now() + '.xlsx');
    }
  };
})();
