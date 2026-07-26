// Identitas Pengawas page
(function () {
  // Daftar pangkat/golongan PNS standar
  const PANGKAT_GOLONGAN = [
    'Juru Muda, I/a',
    'Juru Muda Tingkat I, I/b',
    'Juru, I/c',
    'Juru Tingkat I, I/d',
    'Pengatur Muda, II/a',
    'Pengatur Muda Tingkat I, II/b',
    'Pengatur, II/c',
    'Pengatur Tingkat I, II/d',
    'Penata Muda, III/a',
    'Penata Muda Tingkat I, III/b',
    'Penata, III/c',
    'Penata Tingkat I, III/d',
    'Pembina, IV/a',
    'Pembina Tingkat I, IV/b',
    'Pembina Utama Muda, IV/c',
    'Pembina Utama Madya, IV/d',
    'Pembina Utama, IV/e',
  ];

  // Default identitas dari user (Yanto)
  const DEFAULT_IDENTITAS = {
    pegawai: {
      nama: 'SUBARIYANTO, S.Pd, M.Pd.I.',
      nip: '197002122005011004',
      pangkat_golongan: 'Pembina Tingkat I, IV/b',
      jabatan: 'Pengawas Madrasah Madya Tingkat Menengah Pada MA',
      unit_kerja: 'Kantor Kementerian Agama Kab. Jember',
      kabupaten: 'Jember',
      wilayah_binaan: 'KKMA 04 Jember (Kecamatan Sukowono)',
    },
    pejabat_penilai: {
      nama: 'Dr. SANTOSO, S.Ag, M.Pd.',
      nip: '196908251991031003',
      pangkat_golongan: 'Pembina Tingkat I, IV/b',
      jabatan: 'Kepala Kantor Kementerian Agama Kab. Jember',
      unit_kerja: 'Kantor Kementerian Agama Kab. Jember',
    },
    atasan_pejabat_penilai: {
      nama: 'Dr. Akhmad Sruji Bahtiar, M.Pd.I.',
      nip: '197204122000031002',
      pangkat_golongan: 'Pembina Tingkat I, IV/b',
      jabatan: 'Kepala Kanwil Kemenag Prov. Jawa Timur',
      unit_kerja: 'Kanwil Kementerian Agama Prov. Jawa Timur',
    },
    logo: '',          // dataURL
    tanda_tangan: '',  // dataURL
    stempel: '',       // dataURL
    kop_l1: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA',
    kop_l2: 'KANTOR KEMENTERIAN AGAMA KABUPATEN JEMBER',
    kop_l3: 'KELOMPOK KERJA PENGAWAS MADRASAH (POKJAWAS)',
    kop_l4: 'Jl. Imam Bonjol No. 28 Jember 68131 Telp. (0331) 484684',
  };

  function get() {
    return Store.get('identitas', null) || DEFAULT_IDENTITAS;
  }

  Page.Identitas = function () {
    const idn = get();

    UI.shell('Identitas Pengawas', `
      <form id="frmIdn">
        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-bank"></i> Kop Surat Kementerian Agama</div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-12"><label class="form-label">Baris 1</label><input class="form-control" name="kop_l1" value="${U.escapeHtml(idn.kop_l1)}" /></div>
              <div class="col-md-12"><label class="form-label">Baris 2</label><input class="form-control" name="kop_l2" value="${U.escapeHtml(idn.kop_l2)}" /></div>
              <div class="col-md-12"><label class="form-label">Baris 3</label><input class="form-control" name="kop_l3" value="${U.escapeHtml(idn.kop_l3)}" /></div>
              <div class="col-md-12"><label class="form-label">Baris 4 (Alamat)</label><input class="form-control" name="kop_l4" value="${U.escapeHtml(idn.kop_l4)}" /></div>
            </div>
          </div>
        </div>

        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-person-badge"></i> Data Pegawai (PNS yang Dinilai)</div>
          <div class="card-body row g-3">
            ${pegInput('pegawai', idn.pegawai, true)}
          </div>
        </div>

        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-person-check"></i> Pejabat Penilai (Kepala Kantor Kemenag)</div>
          <div class="card-body row g-3">
            ${pegInput('pejabat_penilai', idn.pejabat_penilai, false)}
            ${imgUpload('ttd_kepala_kemenag', 'Tanda Tangan Kepala Kemenag', idn.ttd_kepala_kemenag || '')}
            ${imgUpload('stempel_kemenag', 'Stempel Kemenag', idn.stempel_kemenag || '')}
          </div>
        </div>

        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-person-lines-fill"></i> Atasan Pejabat Penilai</div>
          <div class="card-body row g-3">
            ${pegInput('atasan_pejabat_penilai', idn.atasan_pejabat_penilai, false)}
          </div>
        </div>

        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-person-gear"></i> Ketua Pokjawas Madrasah</div>
          <div class="card-body row g-3">
            ${pegInput('ketua_pokjawas', idn.ketua_pokjawas || { nama: 'SUBARIYANTO, S.Pd, M.Pd.I', nip: '197002122005011004', jabatan: 'Ketua Pokjawas Madrasah Kab. Jember', unit_kerja: 'Kantor Kementerian Agama Kab. Jember' }, false)}
            ${imgUpload('ttd_ketua_pokjawas', 'Tanda Tangan Ketua Pokjawas', idn.ttd_ketua_pokjawas || '')}
          </div>
        </div>

        <div class="card mb-3">
          <div class="card-header"><i class="bi bi-image"></i> Logo, Tanda Tangan, dan Stempel</div>
          <div class="card-body row g-3">
            ${imgUpload('logo', 'Logo Kemenag', idn.logo)}
            ${imgUpload('tanda_tangan', 'Tanda Tangan', idn.tanda_tangan)}
            ${imgUpload('stempel', 'Stempel (opsional)', idn.stempel)}
          </div>
        </div>

        <div class="d-flex gap-2">
          <button class="btn btn-success" type="submit"><i class="bi bi-save"></i> Simpan Identitas</button>
          <button class="btn btn-outline-secondary" type="button" id="btnReset"><i class="bi bi-arrow-counterclockwise"></i> Reset ke Default</button>
        </div>
      </form>
    `);

    function pegInput(prefix, obj, withKabupaten) {
      const fields = [
        { name: 'nama', label: 'Nama' },
        { name: 'nip', label: 'NIP' },
        { name: 'pangkat_golongan', label: 'Pangkat / Golongan' },
        { name: 'jabatan', label: 'Jabatan' },
        { name: 'unit_kerja', label: 'Unit Kerja' },
      ];
      if (withKabupaten) {
        fields.push({ name: 'kabupaten', label: 'Kabupaten' });
        fields.push({ name: 'wilayah_binaan', label: 'Wilayah Binaan' });
      }
      return fields.map(f => {
        if (f.name === 'pangkat_golongan') {
          const cur = obj[f.name] || '';
          const opts = PANGKAT_GOLONGAN.map(p =>
            `<option value="${U.escapeHtml(p)}"${p === cur ? ' selected' : ''}>${U.escapeHtml(p)}</option>`
          ).join('');
          // Jika nilai saat ini tidak ada di daftar, tetap tampilkan sebagai opsi pertama
          const extraOpt = (cur && !PANGKAT_GOLONGAN.includes(cur))
            ? `<option value="${U.escapeHtml(cur)}" selected>${U.escapeHtml(cur)} (kustom)</option>`
            : '';
          return `
        <div class="col-md-6">
          <label class="form-label">${f.label}</label>
          <select class="form-select" name="${prefix}.${f.name}">
            <option value="">-- Pilih Pangkat/Golongan --</option>
            ${extraOpt}
            ${opts}
          </select>
        </div>`;
        }
        return `
        <div class="col-md-6">
          <label class="form-label">${f.label}</label>
          <input class="form-control" name="${prefix}.${f.name}" value="${U.escapeHtml(obj[f.name] || '')}" />
        </div>`;
      }).join('');
    }
    function imgUpload(name, label, dataUrl) {
      return `
        <div class="col-md-4">
          <label class="form-label">${label}</label>
          <input type="file" class="form-control" data-imgfor="${name}" accept="image/*" />
          <div class="mt-2"><img id="prev_${name}" src="${dataUrl || ''}" style="max-height:80px;${dataUrl ? '' : 'display:none;'}" /></div>
          <button type="button" class="btn btn-sm btn-outline-danger mt-2 ${dataUrl ? '' : 'd-none'}" data-clearimg="${name}">Hapus</button>
          <input type="hidden" name="${name}" value="${dataUrl || ''}" />
        </div>`;
    }

    document.querySelectorAll('input[type=file][data-imgfor]').forEach(inp => {
      inp.addEventListener('change', async () => {
        if (!inp.files || !inp.files[0]) return;
        const dataUrl = await U.readFileAsDataURL(inp.files[0]);
        const name = inp.dataset.imgfor;
        // For signature/stamp images: compress then remove white background so
        // transparency is baked into the pixels (alpha channel). CSS
        // mix-blend-mode:multiply only fakes transparency in the live HTML
        // preview — it is NOT honored by html2canvas, which the Download PDF
        // path uses. Without real alpha transparency here, the stamp/signature
        // renders as an opaque white square in the exported PDF and covers the
        // text/signature underneath.
        const isSignature = (name === 'tanda_tangan' || name === 'ttd_ketua_pokjawas' || name === 'ttd_kepala_kemenag');
        const isStempel = (name === 'stempel' || name === 'stempel_kemenag');
        let processed;
        if (isSignature) {
          const compressed = await U.compressImage(dataUrl, 600, 0.95);
          processed = await U.removeWhiteBg(compressed, 230);
        } else if (isStempel) {
          const compressed = await U.compressImage(dataUrl, 600, 0.95);
          processed = await U.removeWhiteBg(compressed, 235);
        } else {
          processed = await U.compressImage(dataUrl, 600, 0.85);
        }
        document.getElementById('prev_' + name).src = processed;
        document.getElementById('prev_' + name).style.display = '';
        document.querySelector(`input[name="${name}"]`).value = processed;
        document.querySelector(`button[data-clearimg="${name}"]`).classList.remove('d-none');
      });
    });
    document.querySelectorAll('button[data-clearimg]').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.clearimg;
        document.getElementById('prev_' + name).src = '';
        document.getElementById('prev_' + name).style.display = 'none';
        document.querySelector(`input[name="${name}"]`).value = '';
        btn.classList.add('d-none');
      });
    });
    document.getElementById('btnReset').addEventListener('click', () => {
      Store.set('identitas', null);
      Page.Identitas();
    });
    document.getElementById('frmIdn').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const out = { pegawai: {}, pejabat_penilai: {}, atasan_pejabat_penilai: {}, ketua_pokjawas: {} };
      for (const [k, v] of fd.entries()) {
        if (k.includes('.')) {
          const [a, b] = k.split('.');
          out[a] = out[a] || {};
          out[a][b] = v;
        } else {
          out[k] = v;
        }
      }
      Store.set('identitas', out);
      UI.toast('Identitas berhasil disimpan.');
    });
  };

  Page.Identitas.get = get;
})();
