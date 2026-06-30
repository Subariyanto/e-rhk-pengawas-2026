const fs = require('fs');
let c = fs.readFileSync('js/lib/gen_html.js', 'utf8');

// Normalize CRLF to LF
c = c.replace(/\r\n/g, '\n');

// Function to find and replace a block between two markers
function replaceBlock(name, startMarker, endMarker, replacement) {
  const startIdx = c.indexOf(startMarker);
  if (startIdx === -1) { console.log('SKIP:', name, '- start not found'); return false; }
  
  const endIdx = c.indexOf(endMarker, startIdx + startMarker.length);
  if (endIdx === -1) {
    console.log('SKIP:', name, '- end not found');
    // Debug
    const chunk = c.substring(startIdx, startIdx + 200);
    console.log('  Context:', JSON.stringify(chunk).substring(0, 120));
    return false;
  }
  
  c = c.substring(0, startIdx) + replacement + c.substring(endIdx);
  console.log('REPLACED:', name);
  return true;
}

// 1. ttdTriwulan
replaceBlock(
  'ttdTriwulan',
  '  // TTD untuk Laporan Triwulan:',
  '\n\n  // TTD versi sederhana',
  `  // TTD untuk Laporan Triwulan: Kiri Ketua Pokjawas, Kanan Pengawas + Kota & Tanggal (sejajar, tanpa Mengetahui)
  function ttdTriwulan(idn, rhkId) {
    const i = idn || Page.Identitas.get();
    const mode = getSigMode();
    const ketuaPokjawasNama = (i.ketua_pokjawas && i.ketua_pokjawas.nama) || 'SUBARIYANTO, S.Pd, M.Pd.I';
    const ketuaPokjawasNIP  = (i.ketua_pokjawas && i.ketua_pokjawas.nip) || '197002122005011004';
    return \x60
      <div class="ttd" style="margin-top:24px;">
        <div class="ttd-block">
          <div>&nbsp;</div>
          <div>Ketua Pokjawas Madrasah,</div>
          <div style="height:80px;"></div>
          <div style="text-decoration:underline;font-weight:700">\${U.escapeHtml(ketuaPokjawasNama)}</div>
          <div>NIP. \${U.escapeHtml(ketuaPokjawasNIP)}</div>
        </div>
        <div class="ttd-block">
          \${pengawasTTDHtml(i, mode, rhkId)}
        </div>
      </div>
    \x60;
  }`
);

// 2. ttdPengawas
replaceBlock(
  'ttdPengawas',
  '  // TTD versi sederhana',
  '\n\n  // TTD untuk halaman Penutup',
  `  // TTD versi sederhana (cuma pengawas, posisi center agak ke kanan)
  function ttdPengawas(idn, rhkId) {
    const i = idn || Page.Identitas.get();
    const mode = getSigMode();
    return pengawasTTDHtml(i, mode, rhkId);
  }`
);

// 3. ttdBlokPenutup
replaceBlock(
  'ttdBlokPenutup',
  '  // TTD untuk halaman Penutup',
  '\n\n  // Variables for narasi',
  `  // TTD untuk halaman Penutup / Kata Pengantar: hanya Pengawas, posisi center agak ke kanan
  function ttdBlokPenutup(idn, rhkId) {
    const i = idn || Page.Identitas.get();
    const mode = getSigMode();
    return pengawasTTDHtml(i, mode, rhkId);
  }`
);

console.log('Final lines:', c.split('\n').length);
fs.writeFileSync('js/lib/gen_html.js', c, 'utf8');
console.log('Done.');
