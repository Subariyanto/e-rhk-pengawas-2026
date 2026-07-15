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
        .doc-page{padding:0.6in;max-width:210mm;min-height:297mm;page-break-before:always;}
        .doc-page:first-of-type{page-break-before:avoid;}
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

  // ===== Text-native PDF builder =====
  // Renders the document as real selectable text via jsPDF's text/table APIs
  // instead of rasterizing each element with html2canvas. Trade-off (accepted
  // by Yanto 2026-07-15): a table row may visually split across a page break
  // if it lands right at the edge; he adjusts margins manually via the Cetak
  // dialog when that happens. Benefit: real searchable/selectable text, much
  // smaller file size, and much faster generation (no per-element canvas pass).
  function buildTextPdf(htmlBody) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = 210, pageH = 297;
    const MARGIN_MM = 0.6 * 25.4;
    const contentW = pageW - MARGIN_MM * 2;
    const maxY = pageH - MARGIN_MM;
    const LINE_H = 4.8; // 1.15 spasi (~12pt × 1.15 = 4.8mm line height)
    let first = true;

    const tmp = document.createElement('div');
    tmp.innerHTML = htmlBody;
    const pages = Array.from(tmp.querySelectorAll('.doc-page'));

    function ensureSpace(y, needed) {
      if (y + needed > maxY) { pdf.addPage(); return MARGIN_MM; }
      return y;
    }

    function drawText(text, y, opts = {}) {
      const { align = 'left', bold = false, size = 12, indent = 0, justify = false } = opts;
      if (!text) return y;
      pdf.setFont('times', bold ? 'bold' : 'normal');
      pdf.setFontSize(size);
      const usableW = contentW - indent;
      const lines = pdf.splitTextToSize(text, usableW);
      for (let li = 0; li < lines.length; li++) {
        const line = lines[li];
        y = ensureSpace(y, LINE_H);
        const x = align === 'center' ? pageW / 2 : MARGIN_MM + indent;
        // Justify: spread words evenly across usableW (except last line)
        if (justify && align !== 'center' && li < lines.length - 1) {
          const words = line.split(/\s+/);
          if (words.length > 1) {
            const totalTextW = pdf.getTextWidth(words.join(''));
            const extraSpace = (usableW - totalTextW) / (words.length - 1);
            let cx = MARGIN_MM + indent;
            for (let wi = 0; wi < words.length; wi++) {
              pdf.text(words[wi], cx, y);
              cx += pdf.getTextWidth(words[wi]) + extraSpace;
            }
            y += LINE_H;
            continue;
          }
        }
        pdf.text(line, x, y, { align });
        y += LINE_H;
      }
      return y;
    }

    function drawTable(tableEl, y) {
      const rows = Array.from(tableEl.querySelectorAll(':scope > thead > tr, :scope > tbody > tr, :scope > tr'));
      if (!rows.length) return y;
      const bodyRows = rows.map((tr) => Array.from(tr.children).map((td) => td.textContent.trim()));
      const nCols = Math.max(...bodyRows.map((r) => r.length));
      const colW = contentW / nCols;
      const pad = 1.5;
      for (const row of bodyRows) {
        pdf.setFont('times', 'normal');
        pdf.setFontSize(10.5);
        let rowLines = 1;
        const wrapped = row.map((cell) => {
          const w = pdf.splitTextToSize(String(cell || ''), colW - pad * 2);
          rowLines = Math.max(rowLines, w.length);
          return w;
        });
        const rowH = Math.max(6, rowLines * 4.2 + pad * 2);
        y = ensureSpace(y, rowH);
        let x = MARGIN_MM;
        for (let ci = 0; ci < nCols; ci++) {
          pdf.rect(x, y, colW, rowH);
          (wrapped[ci] || []).forEach((ln, li) => pdf.text(ln, x + pad, y + pad + 3.6 + li * 4.2));
          x += colW;
        }
        y += rowH;
      }
      return y + 2;
    }

    function drawImageBlock(imgEl, y) {
      const src = imgEl.getAttribute('src') || '';
      if (!src.startsWith('data:image')) return y;
      try {
        const cssMaxH = parseFloat(imgEl.style.maxHeight) || 60;
        const hMm = Math.min(30, cssMaxH * 0.264583);
        y = ensureSpace(y, hMm + 2);
        const fmt = /png/i.test(src) ? 'PNG' : 'JPEG';
        pdf.addImage(src, fmt, MARGIN_MM, y, hMm * 1.6, hMm);
        y += hMm + 2;
      } catch (e) { /* skip unreadable image */ }
      return y;
    }

    // Flatten a signature/KOP sub-block (nested divs wrapping text lines and/or
    // an <img>) into an ordered list of {type:'text'|'img', ...} lines. Each
    // leaf div/p becomes one line; images become their own line. Used for
    // blocks whose original CSS layout (flex centering) the generic per-tag
    // walker below can't reproduce.
    function collectLines(el) {
      const lines = [];
      function walk(node) {
        if (node.nodeType !== 1) return;
        const tag = node.tagName.toLowerCase();
        if (tag === 'img') { lines.push({ type: 'img', el: node }); return; }
        if (tag === 'br') return;
        const hasElementChildren = Array.from(node.children).some((c) => c.tagName.toLowerCase() !== 'br');
        if (!hasElementChildren) {
          const text = node.textContent.replace(/\s+/g, ' ').trim();
          if (text) {
            const style = node.getAttribute('style') || '';
            const bold = /font-weight\s*:\s*(bold|700)/i.test(style) || tag === 'strong' || tag === 'b';
            lines.push({ type: 'text', text, bold });
          }
          return;
        }
        Array.from(node.children).forEach(walk);
      }
      Array.from(el.children).forEach(walk);
      return lines;
    }

    // Draw flattened lines centered around centerX (mm), returns new y.
    // Signature images are rendered preserving ORIGINAL aspect ratio so they
    // never look gepeng/stretched (per Yanto 2026-07-15). We determine the
    // natural width:height ratio from the base64 data via a temporary Image.
    function drawLinesCentered(lines, y, centerX) {
      for (const line of lines) {
        if (line.type === 'img') {
          const src = line.el.getAttribute('src') || '';
          if (!src.startsWith('data:image')) continue;
          try {
            // Use fixed generous height then derive width from aspect ratio.
            // If we can't determine aspect ratio, fall back to 30×50.
            const maxH = 30; // mm — generous vertical space
            const maxW = 55; // mm — max horizontal space
            let hMm = maxH, wMm = maxW;
            // Try to get natural dimensions from the img element attributes
            const natW = parseInt(line.el.getAttribute('width')) || line.el.naturalWidth || 0;
            const natH = parseInt(line.el.getAttribute('height')) || line.el.naturalHeight || 0;
            if (natW && natH) {
              const ratio = natW / natH;
              if (ratio > 1) { // landscape signature
                wMm = Math.min(maxW, maxH * ratio);
                hMm = wMm / ratio;
              } else { // portrait or square
                hMm = maxH;
                wMm = maxH * ratio;
              }
            }
            y = ensureSpace(y, hMm + 2);
            pdf.addImage(src, /png/i.test(src) ? 'PNG' : 'JPEG', centerX - wMm / 2, y, wMm, hMm);
            y += hMm + 2;
          } catch (e) { /* skip unreadable image */ }
        } else {
          y = ensureSpace(y, LINE_H);
          pdf.setFont('times', line.bold ? 'bold' : 'normal');
          pdf.setFontSize(12);
          pdf.text(line.text, centerX, y, { align: 'center' });
          y += LINE_H;
        }
      }
      return y;
    }

    // KOP header: logo pinned at the left margin, header lines (l1-l4)
    // centered over the full page width (mirrors the original flex layout of
    // logo-left + centered text + equal-width right spacer).
    function drawKop(kopEl, y) {
      const logo = kopEl.querySelector('img.logo');
      const textDiv = kopEl.querySelector('.text');
      const sizeMm = 18;
      let logoBottomY = y;
      if (logo) {
        const src = logo.getAttribute('src') || '';
        if (src.startsWith('data:image')) {
          try {
            pdf.addImage(src, /png/i.test(src) ? 'PNG' : 'JPEG', MARGIN_MM, y, sizeMm, sizeMm);
            logoBottomY = y + sizeMm;
          } catch (e) { /* skip unreadable logo */ }
        }
      }
      let ty = y + 1;
      if (textDiv) {
        Array.from(textDiv.children).forEach((line) => {
          const text = line.textContent.trim();
          if (!text) return;
          const bold = /\bl2\b|\bl3\b/.test(line.className || '');
          pdf.setFont('times', bold ? 'bold' : 'normal');
          pdf.setFontSize(12);
          pdf.text(text, pageW / 2, ty, { align: 'center' });
          ty += LINE_H;
        });
      }
      const bottomY = Math.max(logoBottomY, ty) + 2;
      pdf.setLineWidth(0.5);
      pdf.line(MARGIN_MM, bottomY, pageW - MARGIN_MM, bottomY);
      return bottomY + 4;
    }

    // .ttd row: 2+ signature columns (e.g. Notulis kiri / Pemimpin Rapat
    // kanan) laid out side by side, each centered within its own column.
    // Top-aligned: label jabatan ("Notulis," / "Pemimpin Rapat,") start at
    // the same Y. Then images/space in between, then nama/NIP also aligned
    // at the same Y across columns (per Yanto 2026-07-15: "Tulisan Notulis
    // sejajarkan dengan Pemimpin Rapat, Garis sejajarkan dengan nama").
    function drawTtdRow(ttdEl, y) {
      const blocks = Array.from(ttdEl.querySelectorAll(':scope > .ttd-block'));
      if (!blocks.length) return y;
      const colW = contentW / blocks.length;
      const blockLines = blocks.map((b) => collectLines(b));

      // Split each column's lines into: header (text before img), img, footer (text after img)
      function splitLines(lines) {
        const header = [], imgs = [], footer = [];
        let pastImg = false;
        for (const l of lines) {
          if (l.type === 'img') { imgs.push(l); pastImg = true; }
          else if (pastImg) footer.push(l);
          else header.push(l);
        }
        return { header, imgs, footer };
      }

      const splits = blockLines.map(splitLines);
      // Max image height across columns (for uniform spacing)
      const imgH = Math.max(...splits.map(s => s.imgs.length > 0 ? 32 : 0));
      // Max header lines
      const maxHeaderLines = Math.max(...splits.map(s => s.header.length));
      // Max footer lines
      const maxFooterLines = Math.max(...splits.map(s => s.footer.length));
      const totalH = maxHeaderLines * LINE_H + imgH + maxFooterLines * LINE_H + 4;
      y = ensureSpace(y, totalH);
      const startY = y;

      blocks.forEach((b, i) => {
        const colCenterX = MARGIN_MM + colW * i + colW / 2;
        const { header, imgs, footer } = splits[i];
        // Draw header lines (label jabatan) top-aligned
        let cy = startY;
        for (const line of header) {
          pdf.setFont('times', line.bold ? 'bold' : 'normal');
          pdf.setFontSize(12);
          pdf.text(line.text, colCenterX, cy, { align: 'center' });
          cy += LINE_H;
        }
        // Advance past header section to aligned img zone
        const imgStartY = startY + maxHeaderLines * LINE_H;
        // Draw images (TTD) if any
        if (imgs.length) {
          for (const img of imgs) {
            const src = img.el.getAttribute('src') || '';
            if (!src.startsWith('data:image')) continue;
            try {
              const maxImgH = 28, maxImgW = 50;
              let hMm = maxImgH, wMm = maxImgW;
              const natW = parseInt(img.el.getAttribute('width')) || img.el.naturalWidth || 0;
              const natH = parseInt(img.el.getAttribute('height')) || img.el.naturalHeight || 0;
              if (natW && natH) {
                const ratio = natW / natH;
                if (ratio > 1) { wMm = Math.min(maxImgW, maxImgH * ratio); hMm = wMm / ratio; }
                else { hMm = maxImgH; wMm = maxImgH * ratio; }
              }
              pdf.addImage(src, /png/i.test(src) ? 'PNG' : 'JPEG', colCenterX - wMm / 2, imgStartY, wMm, hMm);
            } catch (e) { /* skip */ }
          }
        } else {
          // No image: draw a line (________________) centered in the img zone
          const lineY = imgStartY + imgH / 2;
          pdf.setFont('times', 'normal');
          pdf.setFontSize(12);
          pdf.text('________________', colCenterX, lineY, { align: 'center' });
        }
        // Draw footer lines (nama/NIP) aligned across columns
        const footerStartY = imgStartY + imgH + 2;
        let fy = footerStartY;
        for (const line of footer) {
          pdf.setFont('times', line.bold ? 'bold' : 'normal');
          pdf.setFontSize(12);
          pdf.text(line.text, colCenterX, fy, { align: 'center' });
          fy += LINE_H;
        }
      });
      return startY + totalH;
    }

    // Ad-hoc single signature block used by most gen* functions:
    // <div style="display:flex;justify-content:center;..."><div style="width:50%;text-align:center;">...lines/img...</div></div>
    // Rendered shifted to the right (per Yanto 2026-07-15: "geser agak ke kanan").
    function isCenteredSignWrap(el) {
      if (el.tagName.toLowerCase() !== 'div') return false;
      const style = el.getAttribute('style') || '';
      return /justify-content\s*:\s*center/i.test(style) && el.children.length === 1;
    }

    function walkNode(node, y) {
      Array.from(node.children).forEach((child) => {
        const tag = child.tagName.toLowerCase();
        if (tag === 'div' && child.classList && child.classList.contains('kop')) {
          y = drawKop(child, y + 1);
          return;
        }
        if (tag === 'div' && child.classList && child.classList.contains('ttd')) {
          y = drawTtdRow(child, y + 2);
          return;
        }
        if (isCenteredSignWrap(child)) {
          // TTD geser agak ke kanan per Yanto 2026-07-15
          y = drawLinesCentered(collectLines(child.children[0]), y + 2, pageW * 0.62);
          return;
        }
        if (tag === 'table') { y = drawTable(child, y + 1); return; }
        if (tag === 'div' && child.children.length === 1 && child.querySelector(':scope > img')) {
          y = drawImageBlock(child.querySelector('img'), y); return;
        }
        // Foto documentation wrapper: div with img + small caption. Render
        // images but skip date/filename captions (per Yanto 2026-07-15).
        if (tag === 'div' && child.querySelector(':scope > img') && child.querySelector(':scope > .small, :scope > div.small')) {
          const imgs = child.querySelectorAll('img');
          for (const img of imgs) { y = drawImageBlock(img, y); }
          return;
        }
        if (tag === 'img') { y = drawImageBlock(child, y); return; }
        if (['h1', 'h2', 'h3', 'h4', 'h5'].includes(tag)) {
          const style = child.getAttribute('style') || '';
          const align = /text-align\s*:\s*center/i.test(style) ? 'center' : 'left';
          // Judul dokumen (h3): turun 2 baris sebelum.
          // Judul paragraf (h4, h5 — A. Uraian, B. Hasil, dst): jarak ke
          // paragraf di bawahnya 1.5 spasi (per Yanto 2026-07-15).
          const isDocTitle = tag === 'h3';
          y += isDocTitle ? LINE_H * 2 : LINE_H * 1.2;
          y = drawText(child.textContent.trim(), y, { align, bold: true, size: { h1: 15, h2: 14, h3: 13, h4: 12, h5: 12 }[tag] });
          // After doc title: 2 baris. After sub-heading (h4/h5): 1.5 spasi.
          y += isDocTitle ? LINE_H * 2 : LINE_H * 0.5;
          return;
        }
        if (tag === 'p') {
          const style = child.getAttribute('style') || '';
          const align = /text-align\s*:\s*center/i.test(style) ? 'center' : 'left';
          const bold = /font-weight\s*:\s*(bold|700)/i.test(style);
          const cls = child.className || '';
          const fontSize = 12;
          // Paragraf rata kiri-kanan (justify) per Yanto 2026-07-15
          y = drawText(child.textContent.replace(/\s+/g, ' ').trim(), y, { align, bold, size: fontSize, justify: align !== 'center' });
          y += 1.5;
          return;
        }
        if (tag === 'div' || tag === 'section') {
          if (child.children.length) y = walkNode(child, y);
          else if (child.textContent.trim()) y = drawText(child.textContent.trim(), y);
          return;
        }
        if (child.textContent && child.textContent.trim() && !child.children.length) {
          y = drawText(child.textContent.trim(), y);
        } else if (child.children.length) {
          y = walkNode(child, y);
        }
      });
      return y;
    }

    for (const p of pages) {
      if (!first) pdf.addPage();
      first = false;
      walkNode(p, MARGIN_MM);
    }

    return pdf.output('blob');
  }

  // Use html2canvas directly — no print preview, direct blob download (legacy,
  // kept for the trial-watermark/canvas path; no longer used by the default
  // Download PDF button as of 2026-07-15 — see buildTextPdf above).
  async function htmlToPdfBlobCanvas(htmlBody) {
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
        // Reserve a top/bottom margin band on every PDF page. This canvas-based
        // export path lays out content by hand (no CSS @page rule applies to
        // canvas/jsPDF output), so without this the content used the full
        // 297mm page height with zero top/bottom margin regardless of the
        // 0.6in margin configured elsewhere in the app (margin atas/bawah
        // tidak sesuai).
        const MARGIN_MM = 0.6 * 25.4; // 0.6in in mm
        const maxPageMmH = pageH - MARGIN_MM * 2;
        const pageLeft = p.getBoundingClientRect().left;

        // Collect direct children with their rendered heights
        const children = Array.from(p.children);
        let curPageMmH = 0; // mm used within the current page's content band (below top margin)

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
              pdf.addImage(sliceC.toDataURL('image/jpeg', 0.95), 'JPEG', offsetXmm, MARGIN_MM, elMmW, shMm);
              y += sh;
              lastSliceMmH = shMm;
              if (y < canvas.height) pdf.addPage();
            }
            // Continue subsequent content right below the last slice instead of
            // forcing an extra blank page. A fresh page will only be added later
            // if the next element genuinely doesn't fit in the remaining space.
            curPageMmH = lastSliceMmH;
          } else {
            pdf.addImage(elImgData, 'JPEG', offsetXmm, MARGIN_MM + curPageMmH, elMmW, elMmH);
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

  // Default Download PDF entry point: real text-native PDF (buildTextPdf).
  // Falls back to the html2canvas-based renderer only if buildTextPdf throws.
  async function htmlToPdfBlob(htmlBody) {
    if (window.Tier && Tier.blockExportIfTrial && Tier.blockExportIfTrial('Download PDF')) return null;
    try {
      console.log('[GenPDF] Using text-native buildTextPdf...');
      const blob = buildTextPdf(htmlBody);
      console.log('[GenPDF] buildTextPdf succeeded, blob size:', blob.size);
      return blob;
    } catch (e) {
      console.error('[GenPDF] buildTextPdf failed, falling back to canvas renderer:', e);
      return htmlToPdfBlobCanvas(htmlBody);
    }
  }

  window.GenPDF = { printHTML, htmlToPdfBlob, htmlToPdfBlobCanvas, buildTextPdf, htmlAsPrintable, buildFullHTML, watermarkCSS, watermarkHTML };
})();
