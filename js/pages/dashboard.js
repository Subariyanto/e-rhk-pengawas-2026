// Dashboard
(function () {
  Page.Dashboard = function () {
    const masterRhk = Store.get('master_rhk', null) || window.MASTER_RHK_DEFAULT;
    const kegiatan = Store.get('kegiatan', []) || [];
    const eviden = Store.get('eviden', []) || [];
    const madrasah = Store.get('madrasah', []) || [];

    const totalRHK = masterRhk.length;
    const evidenSelesai = eviden.filter(e => e.status === 'final').length;
    const evidenDraft = eviden.filter(e => e.status === 'draft').length;
    const totalKegiatan = kegiatan.length;
    const totalMadrasah = madrasah.length;

    const evidenPerRHK = {};
    eviden.forEach(e => { evidenPerRHK[e.rhk_id] = (evidenPerRHK[e.rhk_id] || 0) + 1; });
    const rhkSudah = Object.keys(evidenPerRHK).length;
    const rhkBelum = totalRHK - rhkSudah;

    const perTW = { I: 0, II: 0, III: 0, IV: 0, TAMBAHAN: 0 };
    masterRhk.forEach(r => {
      if (evidenPerRHK[r.id]) perTW[r.triwulan] = (perTW[r.triwulan] || 0) + 1;
    });
    const totTW = { I: 0, II: 0, III: 0, IV: 0, TAMBAHAN: 0 };
    masterRhk.forEach(r => { totTW[r.triwulan] = (totTW[r.triwulan] || 0) + 1; });

    // ===== Trial banner =====
    const u = Auth.currentUser();
    const t = Tier.getTrialStatus(u);
    let trialBanner = '';
    let blockTambah = false;
    if (t.isTrial) {
      if (t.isExpired || t.limitReached) {
        blockTambah = true;
        const reason = t.isExpired
          ? `<strong>⛔ Masa TRIAL ${Tier.TRIAL_DAYS} hari sudah habis.</strong> Hubungi admin untuk Kode Aktivasi FULL.`
          : `<strong>⚠️ Limit TRIAL tercapai</strong> (${t.kegiatanCount}/${Tier.TRIAL_MAX_KEGIATAN} kegiatan). Hubungi admin untuk upgrade.`;
        trialBanner = `<div class="alert alert-danger d-flex flex-wrap gap-2 align-items-center mb-3">
          <span class="flex-grow-1">${reason}</span>
          <a href="#/beli-lisensi" class="btn btn-sm btn-success"><i class="bi bi-cart"></i> Beli Lisensi</a>
          <button id="btnInputKodeFull" class="btn btn-sm btn-outline-success"><i class="bi bi-key"></i> Masukkan Kode FULL</button>
        </div>`;
      } else {
        trialBanner = `<div class="alert alert-warning d-flex flex-wrap gap-2 align-items-center mb-3">
          <span class="flex-grow-1"><i class="bi bi-hourglass-split"></i> Mode <strong>TRIAL</strong> &mdash; sisa <strong>${t.daysLeft} hari</strong> &middot; sudah pakai <strong>${t.kegiatanCount}/${Tier.TRIAL_MAX_KEGIATAN}</strong> kegiatan.</span>
          <a href="#/beli-lisensi" class="btn btn-sm btn-success"><i class="bi bi-cart"></i> Beli Lisensi</a>
          <button id="btnInputKodeFull" class="btn btn-sm btn-outline-success"><i class="bi bi-key"></i> Masukkan Kode FULL</button>
        </div>`;
      }
    }

    UI.shell('Dashboard', `
      ${trialBanner}
      <div class="row g-3 mb-3">
        ${stat('list-check', 'Total RHK', totalRHK)}
        ${stat('check2-circle', 'Eviden Final', evidenSelesai, 'text-success')}
        ${stat('hourglass-split', 'Draft', evidenDraft, 'text-warning')}
        ${stat('journal-text', 'Total Kegiatan', totalKegiatan)}
        ${stat('building', 'Madrasah Binaan', totalMadrasah)}
      </div>

      <div class="row g-3 mb-3">
        <div class="col-md-7">
          <div class="card">
            <div class="card-header"><i class="bi bi-bar-chart"></i> Progress per Triwulan</div>
            <div class="card-body">
              <canvas id="chTW" height="220"></canvas>
            </div>
          </div>
        </div>
        <div class="col-md-5">
          <div class="card">
            <div class="card-header"><i class="bi bi-pie-chart"></i> Status Eviden</div>
            <div class="card-body">
              <canvas id="chStatus" height="220"></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-3">
        <div class="card-header d-flex justify-content-between align-items-center">
          <span><i class="bi bi-lightning"></i> Aksi Cepat</span>
        </div>
        <div class="card-body d-flex gap-2 flex-wrap">
          <a href="#/eviden" class="btn btn-success"><i class="bi bi-file-earmark-plus"></i> Buat Eviden</a>
          ${blockTambah
            ? '<button class="btn btn-outline-secondary" disabled title="Trial habis/limit"><i class="bi bi-plus-circle"></i> Tambah Kegiatan (terkunci)</button>'
            : '<a href="#/kegiatan/baru" class="btn btn-outline-success"><i class="bi bi-plus-circle"></i> Tambah Kegiatan</a>'
          }
          <a href="#/madrasah" class="btn btn-outline-success"><i class="bi bi-building"></i> Madrasah Binaan</a>
          <a href="#/arsip" class="btn btn-outline-success"><i class="bi bi-archive"></i> Arsip Eviden</a>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><i class="bi bi-list-ul"></i> Status RHK 1—30</div>
        <div class="card-body">
          <div class="row g-2">
            ${masterRhk.map(r => {
              const cnt = evidenPerRHK[r.id] || 0;
              const cls = cnt ? 'bg-success' : 'bg-secondary';
              return `<div class="col-md-4 col-lg-3"><div class="d-flex align-items-center gap-2 small p-2 border rounded">
                <span class="badge ${cls}">${r.id}</span>
                <span class="flex-grow-1 text-truncate" title="${U.escapeHtml(r.nama_eviden)}">${U.escapeHtml(r.nama_eviden)}</span>
                <span class="badge bg-light text-dark border">${cnt}</span>
              </div></div>`;
            }).join('')}
          </div>
        </div>
      </div>
    `);

    const ctxTW = document.getElementById('chTW').getContext('2d');

    // Wire trial banner button
    const btnKodeFull = document.getElementById('btnInputKodeFull');
    if (btnKodeFull) {
      btnKodeFull.addEventListener('click', () => {
        const kode = prompt('Masukkan Kode Aktivasi FULL untuk upgrade akun ini:');
        if (kode == null) return;
        const c = String(kode).trim();
        if (!c) return;
        const found = Codes.findCode(c);
        if (!found || found.tier !== 'full') {
          return UI.toast('Kode tidak valid, sudah dipakai, atau bukan kode FULL.', 'danger');
        }
        const cur = Auth.currentUser();
        if (!cur) return UI.toast('Sesi tidak ditemukan, silakan login ulang.', 'danger');
        Tier.upgradeUserToFull(cur.id);
        if (!found.master) Codes.consumeCode(c, cur.id);
        UI.toast('🎉 Akun di-upgrade ke FULL. Selamat menikmati semua fitur!');
        Page.Dashboard();
      });
    }
    try {
      if (typeof Chart === 'undefined') throw new Error('Chart.js belum termuat');
      new Chart(ctxTW, {
        type: 'bar',
        data: {
          labels: ['Triwulan I', 'Triwulan II', 'Triwulan III', 'Triwulan IV', 'Tambahan'],
          datasets: [
            { label: 'Sudah Ada Eviden', data: [perTW.I, perTW.II, perTW.III, perTW.IV, perTW.TAMBAHAN], backgroundColor: '#1E2A5A' },
            { label: 'Belum', data: [totTW.I - perTW.I, totTW.II - perTW.II, totTW.III - perTW.III, totTW.IV - perTW.IV, totTW.TAMBAHAN - perTW.TAMBAHAN], backgroundColor: '#E5E7EB' },
          ],
        },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }
      });
      const ctxS = document.getElementById('chStatus').getContext('2d');
      new Chart(ctxS, {
        type: 'doughnut',
        data: { labels: ['Final', 'Draft', 'Belum dibuat'], datasets: [{ data: [evidenSelesai, evidenDraft, Math.max(0, totalRHK - rhkSudah)], backgroundColor: ['#1E2A5A', '#D4AF37', '#E5E7EB'] }] },
        options: { responsive: true, plugins: { legend: { position: 'bottom' } } },
      });
    } catch (e) {
      console.warn('Chart skipped:', e.message);
    }

    function stat(icon, label, num, cls) {
      return `<div class="col-6 col-md-2-4" style="flex:1 1 180px;">
        <div class="card stat-card p-3">
          <div class="d-flex gap-3 align-items-center">
            <div class="icon"><i class="bi bi-${icon}"></i></div>
            <div>
              <div class="stat-num ${cls || ''}">${num}</div>
              <div class="stat-label">${label}</div>
            </div>
          </div>
        </div>
      </div>`;
    }
  };
})();
