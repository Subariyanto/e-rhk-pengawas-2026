// ZIP packaging: bundle eviden output (HTML + DOCX + index.html)
(function () {
  // Build all docs HTML for a given evidenItem (rhk, keg, types)
  function buildAllHTML(rhk, keg, types) {
    return types
      .filter(t => GenHTML.TYPES[t] && typeof GenHTML.TYPES[t].gen === 'function')
      .map(t => ({ id: t, label: GenHTML.TYPES[t].label, html: GenHTML.TYPES[t].gen(rhk, keg) }));
  }

  function combinedHTML(parts) {
    return parts.map(p => p.html).join('\n');
  }

  async function zipForEviden(evidenItem) {
    const masterRhk = Page.MasterRHK.get();
    const rhk = masterRhk.find(r => r.id === evidenItem.rhk_id);
    const kegList = Store.get('kegiatan', []) || [];
    const keg = evidenItem.kegiatan_id ? kegList.find(k => k.id === evidenItem.kegiatan_id) : null;
    const types = evidenItem.tipe_dokumen || GenHTML.defaultTypesFor(rhk);
    const parts = buildAllHTML(rhk, keg, types);
    const zip = new JSZip();
    const dir = U.sanitizeFilename(rhk.id + '_' + rhk.nama_eviden);
    const folder = zip.folder(dir);
    parts.forEach((p, i) => {
      const fname = String(i + 1).padStart(2, '0') + '_' + U.sanitizeFilename(p.label) + '.html';
      folder.file(fname, GenPDF.buildFullHTML(p.html));
    });
    // Combined HTML
    folder.file('00_LAPORAN_GABUNGAN.html', GenPDF.buildFullHTML(combinedHTML(parts)));
    // DOCX combined
    try {
      const docxBlob = await GenDOCX.htmlToDocxBlob(parts.map(p => p.html), rhk.id + ' ' + rhk.nama_eviden);
      folder.file('00_LAPORAN_GABUNGAN.docx', docxBlob);
    } catch (e) { console.warn('DOCX build failed:', e); }
    // README
    folder.file('README.txt', `Eviden ${rhk.id} — ${rhk.nama_eviden}\nTriwulan: ${rhk.triwulan}\nDibuat: ${new Date().toISOString()}\n\nDokumen yang disertakan:\n${parts.map((p, i) => (i+1) + '. ' + p.label).join('\n')}\n\nDicetak otomatis oleh E-RHK Pengawas Madrasah 2026.`);
    const blob = await zip.generateAsync({ type: 'blob' });
    return { blob, filename: dir + '.zip' };
  }

  async function zipForRHK(rhkId) {
    const eviden = (Store.get('eviden', []) || []).filter(e => e.rhk_id === rhkId);
    if (!eviden.length) {
      const masterRhk = Page.MasterRHK.get();
      const rhk = masterRhk.find(r => r.id === rhkId);
      // produce empty template (no kegiatan)
      const types = GenHTML.defaultTypesFor(rhk);
      return zipForEviden({ rhk_id: rhkId, kegiatan_id: null, tipe_dokumen: types });
    }
    const zip = new JSZip();
    for (const ev of eviden) {
      const { blob, filename } = await zipForEviden(ev);
      const buf = await blob.arrayBuffer();
      zip.file(filename, buf);
    }
    return { blob: await zip.generateAsync({ type: 'blob' }), filename: U.sanitizeFilename(rhkId) + '_all.zip' };
  }

  async function zipForTriwulan(tw) {
    const masterRhk = Page.MasterRHK.get();
    const rhks = masterRhk.filter(r => r.triwulan === tw);
    const zip = new JSZip();
    for (const rhk of rhks) {
      const { blob, filename } = await zipForRHK(rhk.id);
      const buf = await blob.arrayBuffer();
      zip.file(filename, buf);
    }
    return { blob: await zip.generateAsync({ type: 'blob' }), filename: 'Eviden_Triwulan_' + tw + '.zip' };
  }

  async function zipForTahun() {
    const masterRhk = Page.MasterRHK.get();
    const zip = new JSZip();
    for (const rhk of masterRhk) {
      const { blob, filename } = await zipForRHK(rhk.id);
      const buf = await blob.arrayBuffer();
      zip.file(filename, buf);
    }
    return { blob: await zip.generateAsync({ type: 'blob' }), filename: 'Eviden_Tahun_2026.zip' };
  }

  window.GenZIP = { buildAllHTML, combinedHTML, zipForEviden, zipForRHK, zipForTriwulan, zipForTahun };
})();
