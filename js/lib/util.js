// Generic helpers
(function () {
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.from((el || document).querySelectorAll(sel)); }
  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'class') node.className = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v !== false && v != null) node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null || c === false) return;
      if (typeof c === 'string') node.appendChild(document.createTextNode(c));
      else if (c instanceof Node) node.appendChild(c);
    });
    return node;
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function nl2br(s) { return escapeHtml(s).replace(/\r?\n/g, '<br>'); }

  function fmtTanggal(d) {
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt.getTime())) return '';
    const bln = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
    return `${dt.getDate()} ${bln[dt.getMonth()]} ${dt.getFullYear()}`;
  }
  function fmtTanggalISO(d) {
    const dt = (d instanceof Date) ? d : new Date(d);
    if (isNaN(dt.getTime())) return '';
    return dt.toISOString().slice(0, 10);
  }

  function readFileAsDataURL(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }
  function readFileAsArrayBuffer(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsArrayBuffer(file);
    });
  }

  // Compress an image dataURL to JPEG max width
  function compressImage(dataUrl, maxW = 1200, quality = 0.78) {
    return new Promise((res) => {
      const img = new Image();
      img.onload = () => {
        const ratio = img.width > maxW ? maxW / img.width : 1;
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        res(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => res(dataUrl);
      img.src = dataUrl;
    });
  }

  function debounce(fn, wait) {
    let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), wait); };
  }

  function downloadBlob(blob, filename) {
    if (window.saveAs) return window.saveAs(blob, filename);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 100);
  }

  // Simple template fill: ${var}
  function fillTemplate(tpl, vars) {
    return String(tpl).replace(/\$\{([^}]+)\}/g, (_, k) => {
      const v = k.split('.').reduce((o, p) => (o || {})[p.trim()], vars);
      return v == null ? '' : String(v);
    });
  }

  function sanitizeFilename(s) {
    return String(s || 'file').replace(/[\\/:*?"<>|]+/g, '_').slice(0, 120);
  }

  window.U = { $, $$, el, escapeHtml, nl2br, fmtTanggal, fmtTanggalISO, readFileAsDataURL, readFileAsArrayBuffer, compressImage, debounce, downloadBlob, fillTemplate, sanitizeFilename };
})();

// Global Print Dialog (orientasi + skala)
function showPrintDialog() {
  const html = `
    <div class="row g-3">
      <div class="col-md-6">
        <label class="form-label">Orientasi</label>
        <select class="form-select" id="printOrientation">
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
      </div>
      <div class="col-md-6">
        <label class="form-label">Skala / Zoom</label>
        <select class="form-select" id="printScale">
          <option value="100">100%</option>
          <option value="90">90%</option>
          <option value="80">80%</option>
          <option value="75">75%</option>
          <option value="70">70%</option>
          <option value="60">60%</option>
          <option value="50">50%</option>
        </select>
      </div>
    </div>
    <div class="mt-3 text-muted small">
      <i class="bi bi-info-circle"></i> Tips: set Margin = None di print dialog browser supaya tidak double margin.
    </div>
    <div class="mt-3 text-end">
      <button class="btn btn-outline-secondary" id="printCancel">Batal</button>
      <button class="btn btn-success ms-2" id="printGo"><i class="bi bi-printer"></i> Cetak Sekarang</button>
    </div>
  `;
  UI.showModal('Pengaturan Cetak', html, { size: 'sm', onMount: (body, close) => {
    body.querySelector('#printCancel').addEventListener('click', close);
    body.querySelector('#printGo').addEventListener('click', () => {
      const orientation = body.querySelector('#printOrientation').value;
      const scale = parseInt(body.querySelector('#printScale').value);
      // Set orientation
      document.body.classList.toggle('print-landscape', orientation === 'landscape');
      // Set scale via CSS variable
      document.documentElement.style.setProperty('--print-scale', (scale / 100).toString());
      close();
      setTimeout(() => window.print(), 150);
    });
  }});
}
