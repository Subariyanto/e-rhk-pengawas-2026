// PDF generator: render document HTML inside a hidden iframe and use window.print();
// For programmatic Blob (download), use jsPDF.html() -> blob.
(function () {
  function buildFullHTML(htmlBody) {
    const css = document.querySelector('link[href*="app.css"]') ? '<link href="css/app.css" rel="stylesheet">' : '';
    const bs = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">';
    return `<!doctype html><html><head><meta charset="utf-8">${bs}${css}<title>Eviden</title>
      <style>
        body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.5;background:#fff}
        .doc-page{padding:1in 1in 1in 1.2in;max-width:210mm;min-height:297mm;page-break-after:always;}
        @media print {.doc-page{padding:1in 1in 1in 1.2in;}}
        .kop{display:flex;align-items:center;gap:12px;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:16px}
        .kop .logo{width:80px;height:80px;flex-shrink:0}
        .kop .text{flex:1;text-align:center;min-width:0}
        .kop .text .l1,.kop .text .l2,.kop .text .l3,.kop .text .l4{white-space:nowrap;overflow:hidden}
        .kop .text .l1{font-size:13pt}
        .kop .text .l2{font-size:13pt;font-weight:700}
        .kop .text .l3{font-size:13pt;font-weight:700}
        .kop .text .l4{font-size:13pt}
        .ttd{display:flex;justify-content:space-between;margin-top:36px}
        .ttd .ttd-block{width:45%;text-align:center;position:relative}
        .ttd .signature-img{max-height:80px}
        table.fmt{width:100%;border-collapse:collapse}
        table.fmt th,table.fmt td{border:1px solid #000;padding:4px 6px}
        .cover-title{text-align:center;margin:40px 0 8px;font-size:13pt;font-weight:700}
        .cover-sub{text-align:center;font-size:13pt;margin-bottom:80px}
        .cover-id{text-align:center;line-height:1.8;margin-top:60px}
        .cover-foot{text-align:center;margin-top:80px;font-weight:700}
      </style>
      </head><body>${htmlBody}<script>window.onload=()=>{setTimeout(()=>{window.print();},300)}</` + `script></body></html>`;
  }

  function printHTML(htmlBody) {
    const w = window.open('', '_blank');
    w.document.open();
    w.document.write(buildFullHTML(htmlBody));
    w.document.close();
  }

  // Use jsPDF.html() to convert single HTML element to PDF. We render to off-DOM and return blob.
  async function htmlToPdfBlob(htmlBody, filename) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const tmp = document.createElement('div');
    tmp.innerHTML = htmlBody;
    tmp.style.position = 'fixed';
    tmp.style.left = '-10000px';
    tmp.style.top = '0';
    tmp.style.width = '210mm';
    tmp.style.background = '#fff';
    document.body.appendChild(tmp);

    const pages = tmp.querySelectorAll('.doc-page');
    let first = true;
    for (const p of pages) {
      // each .doc-page renders as its own page
      if (!first) pdf.addPage();
      first = false;
      await pdf.html(p, {
        callback: () => {},
        x: 0, y: 0,
        width: 210, windowWidth: p.offsetWidth || 800,
        autoPaging: 'text',
        margin: 0,
      });
    }
    document.body.removeChild(tmp);
    return pdf.output('blob');
  }

  // Quick fallback: download HTML as .pdf-friendly file (bundled HTML printable)
  function htmlAsPrintable(htmlBody, filename) {
    const blob = new Blob([buildFullHTML(htmlBody)], { type: 'text/html' });
    U.downloadBlob(blob, (filename || 'eviden') + '.html');
  }

  window.GenPDF = { printHTML, htmlToPdfBlob, htmlAsPrintable, buildFullHTML };
})();
