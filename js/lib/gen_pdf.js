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
        .doc-page{padding:0.6in;max-width:210mm;min-height:297mm;page-break-after:always;}
        @media print {
          body{background:#fff}
          .doc-page{padding:0;margin:0;max-width:none;min-height:0;box-shadow:none}
          .doc-cover{padding:0}
          @page{size:A4;margin:0.6in}
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
        .doc-cover{padding:0.6in}
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

  // Break a large container (table/list) into row/item-level units so that
  // page-break pagination never has to slice through the middle of a table
  // row or list item. Returns an array of detached clone elements to insert
  // in place of the original, or null if the element does not need splitting.
  function expandUnit(el) {
    const tag = el.tagName;
    if (tag === 'TABLE') {
      const rows = Array.from(el.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr'));
      if (rows.length > 1) {
        const colgroup = el.querySelector(':scope > colgroup');
        // Measure each column's real rendered width from the ORIGINAL (still
        // attached, still fully laid out) table before splitting it into
        // one-row-per-table units below. Without this, each split-off table
        // uses the browser's default table-layout:auto and recomputes column
        // widths independently based only on that row's own content, so a
        // short header row and a long content row end up with different
        // column widths, and columns visually misalign between rows once
        // stacked as separate images in the PDF (tabel tidak rapi).
        const refRow = rows.find((r) => r.children.length > 0) || rows[0];
        const colWidths = Array.from(refRow.children).map((cell) => cell.getBoundingClientRect().width);
        return rows.map((row) => {
          const clone = el.cloneNode(false);
          clone.style.tableLayout = 'fixed';
          if (colgroup) {
            clone.appendChild(colgroup.cloneNode(true));
          } else if (colWidths.length) {
            const cg = document.createElement('colgroup');
            colWidths.forEach((w) => {
              const col = document.createElement('col');
              col.style.width = w + 'px';
              cg.appendChild(col);
            });
            clone.appendChild(cg);
          }
          const tbody = document.createElement('tbody');
          const rowClone = row.cloneNode(true);
          // Pin each cell's width directly too, in case of colspan/rowspan
          // mismatches between the reference row and this row.
          Array.from(rowClone.children).forEach((cell, ci) => {
            if (colWidths[ci] != null) {
              cell.style.width = colWidths[ci] + 'px';
            }
          });
          tbody.appendChild(rowClone);
          clone.appendChild(tbody);
          return clone;
        });
      }
    }
    if (tag === 'OL' || tag === 'UL') {
      const items = Array.from(el.children).filter((c) => c.tagName === 'LI');
      if (items.length > 1) {
        return items.map((li, idx) => {
          const clone = el.cloneNode(false);
          if (tag === 'OL') clone.setAttribute('start', String(idx + 1));
          clone.appendChild(li.cloneNode(true));
          return clone;
        });
      }
    }
    return null;
  }

  // Replace any top-level TABLE/OL/UL child of a .doc-page with its
  // row/item-level units (in place, same parent) so pagination below
  // operates at a fine enough granularity to avoid mid-row/mid-line cuts.
  function preprocessPageForPagination(p) {
    Array.from(p.children).forEach((child) => {
      const units = expandUnit(child);
      if (units && units.length > 1) {
        const frag = document.createDocumentFragment();
        units.forEach((u) => frag.appendChild(u));
        child.replaceWith(frag);
      }
    });
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

    // Helper: render a single DOM element to canvas
    const RENDER_SCALE = 2;
    const renderEl = async (el) => {
      return html2canvas(el, {
        scale: RENDER_SCALE,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: el.offsetWidth,
        height: el.scrollHeight,
        windowWidth: el.offsetWidth,
        scrollX: 0,
        scrollY: 0,
      });
    };

    for (const p of pages) {
      if (!first) pdf.addPage();
      first = false;
      try {
        preprocessPageForPagination(p);
        p.style.minHeight = 'auto';
        p.style.height = 'auto';
        p.style.overflow = 'visible';
        p.style.pageBreakAfter = 'auto';

        const pw = p.offsetWidth || 794;
        // px per mm ratio: CSS px (unscaled) → mm on page. html2canvas renders at
        // RENDER_SCALE× resolution, so canvas pixel dimensions must be divided by
        // RENDER_SCALE before converting, otherwise width/height end up inflated
        // and overflow past the page's right edge (looks like content is cut off).
        const mmPerPx = pageW / pw;
        const pxToMm = (px) => px * mmPerPx;
        const canvasPxToMm = (px) => (px / RENDER_SCALE) * mmPerPx;
        const maxPageMmH = pageH;
        const pageLeft = p.getBoundingClientRect().left;

        // Collect direct children with their rendered heights
        const children = Array.from(p.children);
        let curPageMmH = 0; // mm used on current PDF page

        for (let ci = 0; ci < children.length; ci++) {
          const el = children[ci];
          // Render element
          const canvas = await renderEl(el);
          const elMmH = canvasPxToMm(canvas.height);
          const elMmW = canvasPxToMm(canvas.width);
          // Preserve the element's real left offset (page padding/margin) instead
          // of stretching content to the full page width at x=0 — that was
          // collapsing the left/right margins and cutting off content.
          const offsetXmm = pxToMm(el.getBoundingClientRect().left - pageLeft);
          const elImgData = canvas.toDataURL('image/jpeg', 0.95);

          // Check if this element fits on current page
          if (curPageMmH + elMmH > maxPageMmH && curPageMmH > 0) {
            // Doesn't fit — add new page
            pdf.addPage();
            curPageMmH = 0;
          }

          // If single element is bigger than a page, it gets its own page
          if (elMmH > maxPageMmH) {
            // Split this large element (fallback: slice canvas)
            const slicePxH = Math.round((maxPageMmH / elMmH) * canvas.height);
            let y = 0;
            let lastSliceMmH = 0;
            while (y < canvas.height) {
              const sh = Math.min(slicePxH, canvas.height - y);
              const sliceC = document.createElement('canvas');
              sliceC.width = canvas.width;
              sliceC.height = sh;
              const sctx = sliceC.getContext('2d');
              sctx.fillStyle = '#ffffff';
              sctx.fillRect(0, 0, sliceC.width, sliceC.height);
              sctx.drawImage(canvas, 0, y, canvas.width, sh, 0, 0, canvas.width, sh);
              const shMm = canvasPxToMm(sh);
              pdf.addImage(sliceC.toDataURL('image/jpeg', 0.95), 'JPEG', offsetXmm, 0, elMmW, shMm);
              y += sh;
              lastSliceMmH = shMm;
              if (y < canvas.height) pdf.addPage();
            }
            // Continue subsequent content right below the last slice instead of
            // forcing an extra blank page. A fresh page will only be added later
            // if the next element genuinely doesn't fit in the remaining space.
            curPageMmH = lastSliceMmH;
          } else {
            pdf.addImage(elImgData, 'JPEG', offsetXmm, curPageMmH, elMmW, elMmH);
            curPageMmH += elMmH;
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
