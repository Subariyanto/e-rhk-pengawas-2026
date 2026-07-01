// PDF generator: render document HTML inside a hidden iframe and use window.print();
// For programmatic Blob (download), use jsPDF.html() -> blob.
(function () {
  function watermarkCSS() {
    return `
      .trial-watermark{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;display:flex;align-items:center;justify-content:center;overflow:hidden}
      .trial-watermark::before{content:"TRIAL \u2022 e-RHK Pengawas 2026";position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:84pt;font-family:"Times New Roman",serif;font-weight:900;color:rgba(220,53,69,.18);white-space:nowrap;letter-spacing:.05em;text-transform:uppercase}
      .trial-watermark-band{position:fixed;top:8px;left:0;right:0;text-align:center;font-family:"Times New Roman",serif;font-size:9pt;color:rgba(220,53,69,.7);font-weight:700;letter-spacing:.1em;z-index:9999;pointer-events:none}
      @media print{
        .trial-watermark, .trial-watermark-band{position:fixed;display:block}
      }
    `;
  }

  function watermarkHTML(active) {
    if (!active) return '';
    return `<div class="trial-watermark-band">DOKUMEN VERSI TRIAL — TIDAK SAH UNTUK PENGGUNAAN RESMI</div><div class="trial-watermark"></div>`;
  }

  function buildFullHTML(htmlBody) {
    const css = document.querySelector('link[href*="app.css"]') ? '<link href="css/app.css" rel="stylesheet">' : '';
    const bs = '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">';
    const trial = !!(window.Tier && Tier.isTrialUser && Tier.isTrialUser());
    return `<!doctype html><html><head><meta charset="utf-8">${bs}${css}<title>Eviden</title>
      <style>
        body{font-family:"Times New Roman",serif;font-size:12pt;line-height:1.5;background:#fff}
        h1,h2,h3{font-family:"Times New Roman",serif;font-size:13pt;font-weight:700}
        h4,h5{font-family:"Times New Roman",serif;font-size:12pt;font-weight:700}
        .doc-page{padding:1in 1in 1in 1.2in;max-width:210mm;min-height:297mm;page-break-after:always;}
        @media print {
          body{background:#fff}
          .doc-page{padding:0;margin:0;max-width:none;min-height:0;box-shadow:none}
          .doc-cover{padding:0}
          @page{size:A4;margin:1in 1in 1in 1.2in}
        }
        .kop{display:flex;align-items:center;gap:12px;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:16px}
        .kop .logo{width:80px;height:80px;flex-shrink:0}
        .kop .text{flex:1;text-align:center;min-width:0}
        .kop .text .l1,.kop .text .l2,.kop .text .l3,.kop .text .l4{white-space:nowrap;overflow:hidden}
        .kop .text .l1{font-size:12pt}
        .kop .text .l2{font-size:12pt;font-weight:700}
        .kop .text .l3{font-size:12pt;font-weight:700}
        .kop .text .l4{font-size:12pt}
        .ttd{display:flex;justify-content:space-between;margin-top:36px}
        .ttd .ttd-block{width:45%;text-align:center;position:relative}
        .ttd .signature-img{max-height:80px}
        table.fmt{width:100%;border-collapse:collapse}
        table.fmt th,table.fmt td{border:1px solid #000;padding:4px 6px}
        .cover-title{text-align:center;margin:40px 0 8px;font-size:12pt;font-weight:700}
        .cover-sub{text-align:center;font-size:12pt;margin-bottom:80px}
        .cover-id{text-align:center;line-height:1.8;margin-top:60px;font-size:12pt}
        .cover-foot{text-align:center;margin-top:80px;font-weight:700;font-size:12pt}
        .doc-cover{padding:1in 1in 1in 1.2in}
        ${watermarkCSS()}
      </style>
      </head><body>${watermarkHTML(trial)}${htmlBody}<script>window.onload=()=>{setTimeout(()=>{window.print();},300)}</` + `script></body></html>`;
  }

  function printHTML(htmlBody) {
    const w = window.open('', '_blank');
    w.document.open();
    w.document.write(buildFullHTML(htmlBody));
    w.document.close();
  }

  // Use html2canvas directly — no print preview, direct blob download
  async function htmlToPdfBlob(htmlBody) {
    if (window.Tier && Tier.blockExportIfTrial && Tier.blockExportIfTrial('Download PDF')) return null;
    const { jsPDF } = window.jspdf;

    // Grab app.css content for accurate rendering
    let appCss = '';
    const cssLink = document.querySelector('link[href*="app.css"]');
    if (cssLink) {
      try {
        const resp = await fetch(cssLink.href);
        appCss = await resp.text();
      } catch (e) { appCss = ''; }
    }

    const tmp = document.createElement('div');
    tmp.style.position = 'fixed';
    tmp.style.left = '-10000px';
    tmp.style.top = '0';
    tmp.style.width = '794px';
    tmp.style.background = '#fff';
    tmp.style.zIndex = '-9999';
    tmp.innerHTML = `<style>${appCss}</style>${htmlBody}`;
    document.body.appendChild(tmp);

    const pages = tmp.querySelectorAll('.doc-page');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = 210, pageH = 297;
    let first = true;

    for (const p of pages) {
      if (!first) pdf.addPage();
      first = false;
      try {
        // Force natural height — remove min-height constraint
        p.style.minHeight = 'auto';
        p.style.height = 'auto';
        p.style.overflow = 'visible';
        p.style.pageBreakAfter = 'auto';
        
        const canvas = await html2canvas(p, {
          scale: 3,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: p.offsetWidth || 794,
          height: p.scrollHeight || p.offsetHeight,
          windowWidth: p.offsetWidth || 794,
          scrollX: 0,
          scrollY: 0,
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgW = pageW;
        let imgH = (canvas.height * imgW) / canvas.width;

        if (imgH <= pageH) {
          // Fits in one page — pad to full A4 height
          const fullPxH = Math.round((pageH / imgH) * canvas.height);
          const padCanvas = document.createElement('canvas');
          padCanvas.width = canvas.width;
          padCanvas.height = fullPxH;
          const pctx = padCanvas.getContext('2d');
          pctx.fillStyle = '#ffffff';
          pctx.fillRect(0, 0, padCanvas.width, padCanvas.height);
          pctx.drawImage(canvas, 0, 0);
          pdf.addImage(padCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgW, pageH);
        } else {
          // Content exceeds A4 — split across multiple pages
          const totalPages = Math.ceil(imgH / pageH);
          const fullSlicePx = Math.round((pageH / imgH) * canvas.height);
          for (let pg = 0; pg < totalPages; pg++) {
            if (pg > 0) pdf.addPage();
            const sliceY = Math.round(pg * (pageH / imgH) * canvas.height);
            const sliceH = Math.min(fullSlicePx, canvas.height - sliceY);
            if (sliceH <= 0) continue;
            // Always render at full page size — pad short slices with white
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvas.width;
            sliceCanvas.height = fullSlicePx;
            const ctx = sliceCanvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
            ctx.drawImage(canvas, 0, sliceY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
            pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, imgW, pageH);
          }
        }
      } catch (e) {
        console.error('html2canvas page error:', e);
      }
    }
    document.body.removeChild(tmp);

    // Watermark TRIAL pada setiap halaman PDF
    if (window.Tier && Tier.isTrialUser && Tier.isTrialUser()) {
      const total = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= total; i++) {
        pdf.setPage(i);
        const w = pdf.internal.pageSize.getWidth();
        const h = pdf.internal.pageSize.getHeight();
        try {
          pdf.saveGraphicsState && pdf.saveGraphicsState();
          if (pdf.setGState) pdf.setGState(new pdf.GState({ opacity: 0.18 }));
        } catch (e) {}
        pdf.setTextColor(220, 53, 69);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(72);
        pdf.text('TRIAL', w / 2, h / 2, { align: 'center', angle: 30 });
        // Band atas
        try { if (pdf.setGState) pdf.setGState(new pdf.GState({ opacity: 0.7 })); } catch (e) {}
        pdf.setFontSize(9);
        pdf.text('DOKUMEN VERSI TRIAL — TIDAK SAH UNTUK PENGGUNAAN RESMI', w / 2, 6, { align: 'center' });
        try { pdf.restoreGraphicsState && pdf.restoreGraphicsState(); } catch (e) {}
      }
    }
    return pdf.output('blob');
  }

  // Quick fallback: download HTML as .pdf-friendly file (bundled HTML printable)
  function htmlAsPrintable(htmlBody, filename) {
    const blob = new Blob([buildFullHTML(htmlBody)], { type: 'text/html' });
    U.downloadBlob(blob, (filename || 'eviden') + '.html');
  }

  window.GenPDF = { printHTML, htmlToPdfBlob, htmlAsPrintable, buildFullHTML, watermarkCSS, watermarkHTML };
})();
