// Registry pengawas pre-terdaftar (NIP → Nama, Wilayah, dll)
// Diisi admin via Import Excel. Dipakai register page untuk lookup nama dari NIP.
(function () {
  const KEY = 'pengawas_registry';

  function list() { return Store.getGlobal(KEY, []) || []; }
  function save(arr) { Store.setGlobal(KEY, arr || []); }

  function findByNip(nip) {
    const n = String(nip || '').replace(/[^0-9]/g, '');
    if (!n) return null;
    return list().find(p => p.nip === n) || null;
  }

  // Tambahkan/update banyak entry sekaligus. rows: [{ nip, nama, wilayah, telp, telpon }]
  function upsertMany(rows) {
    const cur = list();
    const byNip = new Map(cur.map(p => [p.nip, p]));
    let added = 0, updated = 0;
    (rows || []).forEach(r => {
      const nip = String(r.nip || '').replace(/[^0-9]/g, '');
      if (!nip) return;
      const existing = byNip.get(nip);
      const next = {
        nip,
        nama: r.nama || existing?.nama || '',
        wilayah: r.wilayah || existing?.wilayah || '',
        telp: r.telp || existing?.telp || '',
      };
      if (existing) { Object.assign(existing, next); updated++; }
      else { cur.push(next); byNip.set(nip, next); added++; }
    });
    save(cur);
    return { added, updated, total: cur.length };
  }

  function clear() { save([]); }

  function removeByNip(nip) {
    const n = String(nip || '').replace(/[^0-9]/g, '');
    if (!n) return false;
    const before = list();
    const after = before.filter(p => p.nip !== n);
    if (after.length === before.length) return false;
    save(after);
    return true;
  }

  function updateByNip(nip, patch) {
    const n = String(nip || '').replace(/[^0-9]/g, '');
    if (!n) return null;
    const cur = list();
    const i = cur.findIndex(p => p.nip === n);
    if (i < 0) return null;
    cur[i] = { ...cur[i], ...(patch || {}), nip: n };
    save(cur);
    return cur[i];
  }

  window.PengawasRegistry = { list, save, findByNip, upsertMany, clear, removeByNip, updateByNip };
})();
