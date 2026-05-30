// Halaman Periode (Tahun SKP) — kelola data tahunan SKP/RHK
(function () {
  Page.Periode = function () {
    const aktif = Store.activePeriode();
    const list = Store.listPeriode();

    // Statistik per tahun
    function statForYear(year) {
      // Switch sementara untuk baca data tahun spesifik
      const cur = Store.activePeriode();
      Store.setActivePeriode(year);
      const rhk = Store.get('master_rhk', null) || window.MASTER_RHK_DEFAULT;
      const keg = Store.get('kegiatan', []) || [];
      const evi = Store.get('eviden', []) || [];
      Store.setActivePeriode(cur);
      return {
        rhk: (rhk || []).length,
        kegiatan: keg.length,
        eviden: evi.length,
        evidenFinal: evi.filter(e => e.status === 'final').length,
      };
    }

    const rows = list.map(y => {
      const s = statForYear(y);
      const isAktif = y === aktif;
      return `
        <tr ${isAktif ? 'class="table-warning"' : ''}>
          <td>${y} ${isAktif ? '<span class="badge bg-success ms-1">Aktif</span>' : ''}</td>
          <td class="text-center">${s.rhk}</td>
          <td class="text-center">${s.kegiatan}</td>
          <td class="text-center">${s.eviden} <span class="text-muted small">(${s.evidenFinal} final)</span></td>
          <td class="text-end">
            ${!isAktif ? `<button class="btn btn-sm btn-outline-success" data-act="activate" data-y="${y}"><i class="bi bi-check-circle"></i> Aktifkan</button>` : ''}
            <button class="btn btn-sm btn-outline-secondary" data-act="clone" data-y="${y}"><i class="bi bi-files"></i> Duplikasi</button>
            <button class="btn btn-sm btn-outline-danger" data-act="delete" data-y="${y}" ${isAktif ? 'disabled title="Aktifkan tahun lain dulu"' : ''}><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `;
    }).join('');

    UI.shell('Periode SKP', `
      <div class="card mb-3">
        <div class="card-body">
          <p class="mb-2"><i class="bi bi-info-circle"></i> Setiap tahun SKP punya data Master RHK, Kegiatan, dan Eviden sendiri-sendiri. Pilih tahun aktif untuk mulai bekerja, atau buat tahun baru untuk SKP berikutnya.</p>
          <div class="d-flex gap-2 align-items-center">
            <strong>Tahun aktif:</strong>
            <span class="badge bg-success fs-6">${aktif}</span>
            <div class="ms-auto d-flex gap-2">
              <button class="btn btn-success" id="btnTambah"><i class="bi bi-plus-circle"></i> Tambah Tahun</button>
              <button class="btn btn-outline-success" id="btnDuplikasiAktif"><i class="bi bi-files"></i> Duplikasi Tahun Aktif</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><i class="bi bi-calendar3"></i> Daftar Periode</div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-bordered align-middle">
              <thead class="table-light">
                <tr>
                  <th>Tahun SKP</th>
                  <th class="text-center">RHK</th>
                  <th class="text-center">Kegiatan</th>
                  <th class="text-center">Eviden</th>
                  <th class="text-end">Aksi</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
        </div>
      </div>
    `);

    // Tambah tahun baru (kosong)
    document.getElementById('btnTambah').addEventListener('click', () => {
      const y = prompt('Tahun SKP baru (4 digit, misal 2027):', String(new Date().getFullYear() + 1));
      if (!y) return;
      if (!/^\d{4}$/.test(y)) return UI.toast('Format tahun harus 4 digit.', 'danger');
      const all = Store.listPeriode();
      if (all.includes(y)) return UI.toast(`Tahun ${y} sudah ada.`, 'warning');
      // Set tahun aktif lalu inisialisasi data default kosong agar muncul di list
      Store.setActivePeriode(y);
      Store.set('master_rhk', window.MASTER_RHK_DEFAULT);
      Store.set('kegiatan', []);
      Store.set('eviden', []);
      UI.toast(`Periode ${y} dibuat dan diaktifkan.`);
      Page.Periode();
    });

    // Duplikasi tahun aktif → tahun baru (copy semua data)
    document.getElementById('btnDuplikasiAktif').addEventListener('click', () => {
      const y = prompt(`Duplikasi data tahun ${aktif} ke tahun baru:`, String(parseInt(aktif, 10) + 1));
      if (!y) return;
      if (!/^\d{4}$/.test(y)) return UI.toast('Format tahun harus 4 digit.', 'danger');
      const all = Store.listPeriode();
      if (all.includes(y)) return UI.toast(`Tahun ${y} sudah ada. Hapus dulu kalau mau ditimpa.`, 'warning');
      Store.clonePeriode(aktif, y);
      Store.setActivePeriode(y);
      UI.toast(`Data tahun ${aktif} berhasil di-duplikasi ke ${y} dan diaktifkan.`);
      Page.Periode();
    });

    // Aksi tabel
    document.querySelector('.card .table-responsive').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const act = btn.dataset.act;
      const y = btn.dataset.y;
      if (act === 'activate') {
        Store.setActivePeriode(y);
        UI.toast(`Tahun ${y} diaktifkan.`);
        location.reload(); // reload supaya semua page baca data tahun baru
      } else if (act === 'clone') {
        const ny = prompt(`Duplikasi data tahun ${y} ke tahun baru:`, String(parseInt(y, 10) + 1));
        if (!ny) return;
        if (!/^\d{4}$/.test(ny)) return UI.toast('Format tahun harus 4 digit.', 'danger');
        if (Store.listPeriode().includes(ny)) return UI.toast(`Tahun ${ny} sudah ada.`, 'warning');
        Store.clonePeriode(y, ny);
        UI.toast(`Data ${y} di-duplikasi ke ${ny}.`);
        Page.Periode();
      } else if (act === 'delete') {
        if (!confirm(`Hapus seluruh data SKP tahun ${y}? (Master RHK, Kegiatan, Eviden tahun ini akan hilang permanen)`)) return;
        Store.deletePeriode(y);
        UI.toast(`Data tahun ${y} dihapus.`, 'warning');
        Page.Periode();
      }
    });
  };
})();
