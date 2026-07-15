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
    const MARGIN_LEFT = 25.4; // 1 inchi per Yanto 2026-07-15
    const MARGIN_TOP = 20.32; // 0.8 inchi
    const MARGIN_RIGHT = 20.32; // 0.8 inchi
    const MARGIN_BOTTOM = 20.32; // 0.8 inchi
    const MARGIN_MM = MARGIN_LEFT; // alias for left margin (used in x positioning)
    const contentW = pageW - MARGIN_LEFT - MARGIN_RIGHT;
    const maxY = pageH - MARGIN_BOTTOM;
    const LINE_H = 6.0; // 1.5 spasi (~12pt × 1.5 = 6.0mm line height) per Yanto 2026-07-15
    let first = true;

    const tmp = document.createElement('div');
    tmp.innerHTML = htmlBody;
    const pages = Array.from(tmp.querySelectorAll('.doc-page'));

    function ensureSpace(y, needed) {
      if (y + needed > maxY) { pdf.addPage(); return MARGIN_TOP; }
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

      // Smart column widths: use HTML col widths if available, else auto-size
      const headerCells = rows[0] ? Array.from(rows[0].children) : [];
      let colWidths = [];
      let hasPct = false;
      // Try to read width hints from th/td style attributes (px or %)
      if (headerCells.length === nCols) {
        colWidths = headerCells.map(cell => {
          const style = cell.getAttribute('style') || '';
          const wMatch = style.match(/width\s*:\s*(\d+)\s*px/i);
          if (wMatch) return parseInt(wMatch[1]);
          const pctMatch = style.match(/width\s*:\s*(\d+)\s*%/i);
          if (pctMatch) { hasPct = true; return parseInt(pctMatch[1]); }
          return 0;
        });
      }
      // If we have pixel widths, convert proportionally to mm
      const totalPx = colWidths.reduce((a, b) => a + b, 0);
      let colWmm;
      if (hasPct) {
        // Percentage widths: convert directly to mm of contentW
        // If nCols === 2 and only col1 has explicit %, col2 fills remaining
        colWmm = colWidths.map((pct, idx) => {
          if (pct > 0) return (pct / 100) * contentW;
          // Zero-width: if it's the last column and other columns have explicit %,
          // fill remaining space to right margin
          if (idx === nCols - 1) {
            const used = colWidths.slice(0, idx).reduce((s, w) => s + (w > 0 ? (w / 100) * contentW : 0), 0);
            return Math.max(contentW - used, 30);
          }
          return contentW / nCols;
        });
      } else if (totalPx > 0) {
        colWmm = colWidths.map(px => px > 0 ? (px / totalPx) * contentW : contentW / nCols);
      } else {
        // Auto: measure max content width per column, distribute proportionally
        pdf.setFontSize(10.5);
        const maxW = bodyRows[0].map(() => 10);
        bodyRows.forEach(row => {
          row.forEach((cell, ci) => {
            if (ci < nCols) {
              const w = pdf.getTextWidth(String(cell || '').substring(0, 40)) + 4;
              maxW[ci] = Math.max(maxW[ci], w);
            }
          });
        });
        const sumW = maxW.reduce((a, b) => a + b, 0);
        colWmm = maxW.map(w => (w / sumW) * contentW);
      }

      const pad = 1.5;
      let headerRowH = 0;
      for (let ri = 0; ri < bodyRows.length; ri++) {
        const row = bodyRows[ri];
        const isHeader = ri === 0 && tableEl.querySelector('thead');
        pdf.setFont('times', isHeader ? 'bold' : 'normal');
        pdf.setFontSize(10.5);
        let rowLines = 1;
        const wrapped = row.map((cell, ci) => {
          const cw = (colWmm[ci] || contentW / nCols) - pad * 2;
          const w = pdf.splitTextToSize(String(cell || ''), Math.max(cw, 10));
          rowLines = Math.max(rowLines, w.length);
          return w;
        });
        const rowH = Math.max(6, rowLines * 4.2 + pad * 2);
        if (isHeader) headerRowH = rowH;
        y = ensureSpace(y, rowH);
        // If page break happened for non-header row, re-draw header
        if (!isHeader && y === MARGIN_TOP && headerRowH > 0) {
          const hy = ensureSpace(MARGIN_TOP, headerRowH);
          let hx = MARGIN_MM;
          // Re-draw header row
          const hRow = bodyRows[0];
          const hWrapped = hRow.map((cell, ci) => {
            const cw = (colWmm[ci] || contentW / nCols) - pad * 2;
            return pdf.splitTextToSize(String(cell || ''), Math.max(cw, 10));
          });
          pdf.setFont('times', 'bold');
          pdf.setFontSize(10.5);
          for (let ci = 0; ci < nCols; ci++) {
            const cw = colWmm[ci] || contentW / nCols;
            const hCellStyle = (hRow[ci] && hRow[ci].style) ? hRow[ci].style : {};
            const hCellCss = typeof hCellStyle.getAttribute === 'function' ? hCellStyle.getAttribute('style') || '' : '';
            const hHasBorder = !/border\s*:\s*none/i.test(hCellCss);
            if (hHasBorder) pdf.rect(hx, hy, cw, headerRowH);
            (hWrapped[ci] || []).forEach((ln, li) => pdf.text(ln, hx + pad, hy + pad + 3.6 + li * 4.2));
            hx += cw;
          }
          y = hy + headerRowH;
        }
        let x = MARGIN_MM;
        for (let ci = 0; ci < nCols; ci++) {
          const cw = colWmm[ci] || contentW / nCols;
          // Check if this cell has border:none (skip drawing rect)
          const cellStyle = (row[ci] && row[ci].style) ? row[ci].style : {};
          const cellCss = typeof cellStyle.getAttribute === 'function' ? cellStyle.getAttribute('style') || '' : '';
          const hasBorder = !/border\s*:\s*none/i.test(cellCss);
          if (hasBorder) pdf.rect(x, y, cw, rowH);
          pdf.setFont('times', isHeader ? 'bold' : 'normal');
          (wrapped[ci] || []).forEach((ln, li) => pdf.text(ln, x + pad, y + pad + 3.6 + li * 4.2));
          x += cw;
        }
        y += rowH;
      }
      // Jarak 1 spasi setelah tabel ke paragraf berikutnya (per Yanto 2026-07-15)
      y += LINE_H;
      return y;
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
      // Group consecutive images together for overlapping render (stempel + TTD)
      let i = 0;
      while (i < lines.length) {
        const line = lines[i];
        if (line.type === 'img') {
          // Collect consecutive images
          const imgGroup = [];
          while (i < lines.length && lines[i].type === 'img') {
            imgGroup.push(lines[i]);
            i++;
          }
          // Determine image dimensions
          const imgData = imgGroup.map(img => {
            const src = img.el.getAttribute('src') || '';
            if (!src.startsWith('data:image')) return null;
            const maxH = 30, maxW = 55;
            let hMm = maxH, wMm = maxW;
            const natW = parseInt(img.el.getAttribute('width')) || img.el.naturalWidth || 0;
            const natH = parseInt(img.el.getAttribute('height')) || img.el.naturalHeight || 0;
            if (natW && natH) {
              const ratio = natW / natH;
              if (ratio > 1) { wMm = Math.min(maxW, maxH * ratio); hMm = wMm / ratio; }
              else { hMm = maxH; wMm = maxH * ratio; }
            }
            // Detect stempel: has opacity or mix-blend-mode in style
            const style = img.el.getAttribute('style') || '';
            const isStempel = /opacity/i.test(style) || (/mix-blend-mode/i.test(style) && /pointer-events\s*:\s*none/i.test(style));
            return { src, hMm, wMm, isStempel, format: /png/i.test(src) ? 'PNG' : 'JPEG' };
          }).filter(Boolean);
          if (!imgData.length) continue;
          const maxImgH = Math.max(...imgData.map(d => d.hMm));
          y = ensureSpace(y, maxImgH + 2);
          if (imgData.length >= 2) {
            // Multiple images: stempel offset to left, TTD centered
            const ttd = imgData.find(d => !d.isStempel) || imgData[0];
            const stempel = imgData.find(d => d.isStempel);
            // Draw TTD centered
            try { pdf.addImage(ttd.src, ttd.format, centerX - ttd.wMm / 2, y, ttd.wMm, ttd.hMm); } catch(e) {}
            // Draw stempel overlapping from the right side of TTD
            // Geser ke atas dan ke kanan sedikit per Yanto 2026-07-15
            if (stempel) {
              const stempelX = centerX - ttd.wMm / 2 - stempel.wMm + (ttd.wMm * 0.35);
              const stempelY = y - 4; // naik 4mm
              try { pdf.addImage(stempel.src, stempel.format, stempelX, stempelY, stempel.wMm, stempel.hMm); } catch(e) {}
            }
          } else {
            // Single image: draw centered
            const d = imgData[0];
            try { pdf.addImage(d.src, d.format, centerX - d.wMm / 2, y, d.wMm, d.hMm); } catch(e) {}
          }
          y += maxImgH + 2;
        } else {
          y = ensureSpace(y, LINE_H);
          pdf.setFont('times', line.bold ? 'bold' : 'normal');
          pdf.setFontSize(12);
          pdf.text(line.text, centerX, y, { align: 'center' });
          y += LINE_H;
          i++;
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
        // Skip style/script tags — jangan render sebagai teks
        if (tag === 'style' || tag === 'script' || tag === 'link') return;
        if (tag === 'div' && child.classList && child.classList.contains('kop')) {
          y = drawKop(child, y + 1);
          return;
        }
        if (tag === 'div' && child.classList && child.classList.contains('ttd-penutup')) {
          // TTD Penutup/Kata Pengantar: rendered as right-aligned signature
          const innerDiv = child.querySelector(':scope > div[style*="float:right"]') || child.querySelector(':scope > div');
          if (innerDiv) {
            y = drawLinesCentered(collectLines(innerDiv), y + 2, pageW * 0.62);
          }
          return;
        }
        // Pengesahan-style TTD: div with text-align:center containing
        // inline-block children (multi-column signature layout)
        if (tag === 'div' && /text-align\s*:\s*center/i.test(child.getAttribute('style') || '') && child.querySelectorAll(':scope > div[style*="inline-block"]').length >= 2) {
          // Treat as dual-column TTD row — top-aligned (sejajar)
          const cols = Array.from(child.querySelectorAll(':scope > div[style*="inline-block"]'));
          const colW = contentW / cols.length;
          const colLines = cols.map(c => {
            // Filter out nbsp-only lines so columns align properly
            return collectLines(c).filter(l => !(l.type === 'text' && /^[\s\u00a0]*$/.test(l.text)));
          });
          // Calculate max height
          function calcColH(lines) {
            let h = 0;
            for (const l of lines) { h += l.type === 'img' ? 34 : LINE_H; }
            return h;
          }
          const maxH = Math.max(...colLines.map(calcColH));
          y = ensureSpace(y + 2, maxH + 4);
          const startY = y;
          colLines.forEach((lines, ci) => {
            const cx = MARGIN_MM + colW * ci + colW / 2;
            drawLinesCentered(lines, startY, cx);
          });
          y = startY + maxH + 2;
          return;
        }
        // Single-column "Mengetahui" TTD block (no inline-block, just center text)
        // Per Yanto 2026-07-15: naikkan 4 baris (reduce gap above)
        // TTD Kepala Kemenag geser ke kiri sedikit (centerX = pageW/2 - 8)
        if (tag === 'div' && /text-align\s*:\s*center/i.test(child.getAttribute('style') || '') && /margin-top/i.test(child.getAttribute('style') || '') && child.querySelector('div[style*="underline"]')) {
          y = drawLinesCentered(collectLines(child), y - LINE_H * 2, pageW / 2 - 8);
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
        if (tag === 'a') {
          // Render link text inline with underline/blue color
          y = ensureSpace(y, LINE_H);
          pdf.setFont('times', 'normal');
          pdf.setFontSize(12);
          pdf.setTextColor(0, 0, 255);
          const linkText = (child.textContent || '').trim();
          pdf.textWithLink(linkText, MARGIN_MM, y, { url: child.getAttribute('href') || '#' });
          pdf.setTextColor(0, 0, 0);
          y += LINE_H;
          return;
        }
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
          // Judul BAB (h2): turun 2 baris sebelum + 2 baris setelah.
          // Sub judul (h3, h4, h5 — A. Latar Belakang, dst): jarak ke
          // paragraf di bawahnya 1 spasi (per Yanto 2026-07-15).
          const isDocTitle = tag === 'h2';
          const isSubTitle = tag === 'h3' || tag === 'h4' || tag === 'h5';
          y += isDocTitle ? LINE_H * 2 : LINE_H;
          // Handle <br/> in headings — render each part on separate line
          const htmlContent = child.innerHTML;
          const parts = htmlContent.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim().split('\n').map(s => s.trim()).filter(Boolean);
          const fontSize = { h1: 15, h2: 14, h3: 13, h4: 12, h5: 12 }[tag];
          parts.forEach(part => {
            y = ensureSpace(y, LINE_H);
            pdf.setFont('times', 'bold');
            pdf.setFontSize(fontSize);
            pdf.text(part, align === 'center' ? pageW / 2 : MARGIN_MM, y, { align });
            y += LINE_H;
          });
          // After BAB title: 2 spasi. After sub-heading: 1 spasi.
          y += isDocTitle ? LINE_H * 2 : LINE_H;
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
        if (tag === 'ol' || tag === 'ul') {
          const items = Array.from(child.querySelectorAll(':scope > li'));
          items.forEach((li, idx) => {
            const prefix = tag === 'ol' ? `${idx + 1}. ` : '• ';
            const txt = li.textContent.replace(/\s+/g, ' ').trim();
            y = drawText(prefix + txt, y, { indent: 6, justify: true });
            y += 0.5;
          });
          y += 1;
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

    // ===== Cover page renderer =====
    function drawCoverPage(pageEl) {
      // Vertically distribute cover elements across the page
      const titleEl = pageEl.querySelector('.cover-title');
      const subEl = pageEl.querySelector('.cover-sub');
      const idEl = pageEl.querySelector('.cover-id');
      const footEl = pageEl.querySelector('.cover-foot');
      let y = MARGIN_TOP + 40; // start ~40mm from top
      if (titleEl) {
        pdf.setFont('times', 'bold');
        pdf.setFontSize(18);
        pdf.text(titleEl.textContent.trim(), pageW / 2, y, { align: 'center' });
        y += 14;
      }
      if (subEl) {
        pdf.setFont('times', 'bold');
        pdf.setFontSize(14);
        const subLines = subEl.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim().split('\n');
        subLines.forEach(line => {
          pdf.text(line.trim(), pageW / 2, y, { align: 'center' });
          y += 8;
        });
        y += 20;
      }
      if (idEl) {
        y = Math.max(y, pageH * 0.4); // at least 40% down
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12);
        Array.from(idEl.children).forEach(div => {
          const style = div.getAttribute('style') || '';
          const bold = /font-weight\s*:\s*(bold|700)/i.test(style);
          pdf.setFont('times', bold ? 'bold' : 'normal');
          pdf.text(div.textContent.trim(), pageW / 2, y, { align: 'center' });
          y += LINE_H;
        });
        y += 30;
      }
      if (footEl) {
        y = Math.max(y, pageH * 0.75); // at least 75% down
        pdf.setFont('times', 'bold');
        pdf.setFontSize(12);
        Array.from(footEl.children).forEach(div => {
          pdf.text(div.textContent.trim(), pageW / 2, y, { align: 'center' });
          y += LINE_H;
        });
      }
    }

    // ===== Daftar Isi renderer (dot-leader, no table) =====
    function drawDaftarIsi(pageEl) {
      let y = MARGIN_TOP;
      // Title
      const h2 = pageEl.querySelector('h2');
      if (h2) {
        y += LINE_H * 2;
        pdf.setFont('times', 'bold');
        pdf.setFontSize(14);
        pdf.text(h2.textContent.trim(), pageW / 2, y, { align: 'center' });
        y += LINE_H * 2;
      }
      // Items from table rows or direct items
      const rows = pageEl.querySelectorAll('table tr');
      pdf.setFontSize(12);
      rows.forEach(tr => {
        const cells = Array.from(tr.children);
        if (cells.length < 2) return;
        const label = cells[0].textContent.trim();
        const pageNum = cells[1].textContent.trim();
        const isIndented = label.startsWith('  ') || label.startsWith('\u00a0\u00a0');
        const indent = isIndented ? 8 : 0;
        const cleanLabel = label.trim();
        const isBold = !isIndented;
        pdf.setFont('times', isBold ? 'bold' : 'normal');
        // Draw label
        const labelX = MARGIN_LEFT + indent;
        const numX = pageW - MARGIN_RIGHT;
        // Dot leader
        const labelW = pdf.getTextWidth(cleanLabel);
        const numW = pdf.getTextWidth(pageNum);
        const dotW = pdf.getTextWidth('.');
        const availW = contentW - indent - labelW - numW - 4;
        const nDots = Math.max(0, Math.floor(availW / dotW));
        const dots = '.'.repeat(nDots);
        y = ensureSpace(y, LINE_H);
        pdf.text(cleanLabel, labelX, y);
        pdf.setFont('times', 'normal');
        pdf.text(dots, labelX + labelW + 1, y);
        pdf.text(pageNum, numX, y, { align: 'right' });
        y += LINE_H;
      });
    }

    for (const p of pages) {
      if (!first) pdf.addPage();
      first = false;
      // Cover page
      if (p.classList.contains('doc-cover')) {
        drawCoverPage(p);
        continue;
      }
      // Daftar Isi detection: contains h2 with "DAFTAR ISI" text
      const h2El = p.querySelector('h2');
      if (h2El && /daftar isi/i.test(h2El.textContent)) {
        drawDaftarIsi(p);
        continue;
      }
      walkNode(p, MARGIN_TOP);
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
