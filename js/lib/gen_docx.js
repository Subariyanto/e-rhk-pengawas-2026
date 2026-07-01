// DOCX generator using docx library (window.docx UMD)
(function () {
  // Convert HTML doc-page to docx Paragraphs (best-effort plain text + headings)
  async function htmlToDocxBlocks(html) {
    const { Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle } = window.docx;
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const blocks = [];

    function alignFrom(node) {
      const ta = (node.style && node.style.textAlign) || node.getAttribute('align') || '';
      if (/center/i.test(ta)) return AlignmentType.CENTER;
      if (/right/i.test(ta)) return AlignmentType.RIGHT;
      if (/justify/i.test(ta)) return AlignmentType.JUSTIFIED;
      return AlignmentType.LEFT;
    }
    function txtRunsFromNode(node) {
      // Walk inline text and emit TextRun arrays
      const runs = [];
      function walk(n, opts = {}) {
        if (!n) return;
        if (n.nodeType === 3) {
          if (n.nodeValue && n.nodeValue.trim() !== '') runs.push(new TextRun({ text: n.nodeValue.replace(/\s+/g, ' '), ...opts }));
          return;
        }
        if (n.nodeType !== 1) return;
        const tag = n.tagName.toLowerCase();
        if (tag === 'br') { runs.push(new TextRun({ text: '', break: 1 })); return; }
        if (tag === 'b' || tag === 'strong') return n.childNodes.forEach(c => walk(c, { ...opts, bold: true }));
        if (tag === 'i' || tag === 'em') return n.childNodes.forEach(c => walk(c, { ...opts, italics: true }));
        if (tag === 'u') return n.childNodes.forEach(c => walk(c, { ...opts, underline: {} }));
        if (tag === 'a') return n.childNodes.forEach(c => walk(c, { ...opts, color: '0d6efd' }));
        n.childNodes.forEach(c => walk(c, opts));
      }
      walk(node);
      return runs.length ? runs : [new TextRun({ text: '' })];
    }
    async function fetchImageBuffer(src) {
      try {
        const r = await fetch(src);
        const blob = await r.blob();
        return await blob.arrayBuffer();
      } catch (e) { return null; }
    }

    async function processNode(node, depth = 0) {
      if (!node || node.nodeType !== 1) return;
      const tag = node.tagName.toLowerCase();
      if (['style', 'script'].includes(tag)) return;
      if (['h1','h2','h3','h4','h5','h6'].includes(tag)) {
        const level = parseInt(tag.slice(1));
        const heading = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6][level - 1];
        blocks.push(new Paragraph({ heading, alignment: alignFrom(node), children: txtRunsFromNode(node).map(r => { r.bold = true; return r; }) }));
        return;
      }
      if (tag === 'p') {
        blocks.push(new Paragraph({ alignment: alignFrom(node), children: txtRunsFromNode(node) }));
        return;
      }
      if (tag === 'img') {
        const src = node.getAttribute('src') || '';
        if (src.startsWith('data:image')) {
          const m = src.match(/^data:image\/(\w+);base64,(.*)$/);
          if (m) {
            const bin = atob(m[2]);
            const arr = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            const w = Math.min(220, parseInt(node.style.maxWidth) || 200);
            const h = Math.round(w * 0.75);
            blocks.push(new Paragraph({ alignment: AlignmentType.CENTER, children: [new ImageRun({ data: arr, transformation: { width: w, height: h } })] }));
          }
        }
        return;
      }
      if (tag === 'table') {
        const rows = [];
        const trs = node.querySelectorAll(':scope > tbody > tr, :scope > thead > tr, :scope > tr');
        for (const tr of trs) {
          const cells = [];
          for (const td of tr.querySelectorAll(':scope > td, :scope > th')) {
            const cellPars = [new Paragraph({ children: txtRunsFromNode(td) })];
            cells.push(new TableCell({
              children: cellPars,
              width: { size: 1, type: WidthType.AUTO },
              margins: { top: 60, bottom: 60, left: 60, right: 60 },
            }));
          }
          rows.push(new TableRow({ children: cells }));
        }
        if (rows.length) {
          blocks.push(new Table({
            rows,
            width: { size: 100, type: WidthType.PERCENTAGE },
          }));
          blocks.push(new Paragraph(''));
        }
        return;
      }
      // generic block (div / section / etc)
      for (const child of Array.from(node.childNodes)) {
        if (child.nodeType === 3) {
          if (child.nodeValue && child.nodeValue.trim() !== '') blocks.push(new Paragraph({ children: [new TextRun(child.nodeValue.trim())] }));
        } else if (child.nodeType === 1) {
          await processNode(child, depth + 1);
        }
      }
    }

    for (const child of Array.from(tmp.childNodes)) {
      if (child.nodeType === 1) await processNode(child);
    }
    if (!blocks.length) blocks.push(new Paragraph(''));
    return blocks;
  }

  async function htmlToDocxBlob(htmlList, title) {
    if (window.Tier && Tier.blockExportIfTrial && Tier.blockExportIfTrial('Export DOCX')) return null;
    const { Document, Packer } = window.docx;
    const sections = [];
    for (const html of htmlList) {
      const blocks = await htmlToDocxBlocks(html);
      sections.push({
        properties: {
          page: { margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } },
        },
        children: blocks,
      });
    }
    const doc = new Document({
      creator: 'E-RHK Pengawas Madrasah 2026',
      title: title || 'Eviden RHK',
      sections,
    });
    const blob = await Packer.toBlob(doc);
    return blob;
  }

  // ===== Word-HTML approach (MUCH lebih akurat untuk layout) =====
  // Word native baca HTML+MS Office namespace, tapi mesinnya pakai HTML 4 era —
  // tidak support display:flex, grid, atau modern CSS. Solusinya: transform
  // semua block flex/grid jadi table-based layout sebelum di-wrap.
  function transformHtmlForWord(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;

    // 1. Transform KOP (.kop) jadi table 2-col supaya logo + teks align rapi.
    tmp.querySelectorAll('.kop').forEach(kop => {
      const logoImg = kop.querySelector('img.logo');
      const textWrap = kop.querySelector('.text');
      const logoSrc = logoImg ? logoImg.getAttribute('src') : '';
      const lines = textWrap ? Array.from(textWrap.children).map(c => c.outerHTML).join('') : '';
      const tbl = document.createElement('table');
      tbl.setAttribute('style', 'width:100%;border-collapse:collapse;border-bottom:3px double #000;margin-bottom:12pt;padding-bottom:6pt;');
      tbl.innerHTML = `
        <tr>
          <td style="width:90px;border:none;vertical-align:middle;text-align:center;">${logoSrc ? `<img src="${logoSrc}" style="width:80px;height:80px;" />` : ''}</td>
          <td style="border:none;text-align:center;vertical-align:middle;">${lines}</td>
          <td style="width:90px;border:none;"></td>
        </tr>`;
      kop.parentNode.replaceChild(tbl, kop);
    });

    // 2a. Transform .ttd class blocks (CSS-based flex) → Word-compatible table
    tmp.querySelectorAll('.ttd').forEach(ttd => {
      const blocks = ttd.querySelectorAll('.ttd-block');
      if (blocks.length < 2) return;
      const tbl = document.createElement('table');
      tbl.setAttribute('style', 'width:100%;border-collapse:collapse;margin-top:18pt;');
      let row = '<tr>';
      blocks.forEach(b => {
        row += `<td style="width:50%;border:none;text-align:center;vertical-align:top;padding:0 20pt;">${b.innerHTML}</td>`;
      });
      row += '</tr>';
      tbl.innerHTML = row;
      ttd.parentNode.replaceChild(tbl, ttd);
    });

    // 2b. Transform inline-flex TTD blok (div berisi anak div text-align:center dengan signature)
    //    → jadi table 2-col, kolom kiri kosong, kolom kanan center.
    tmp.querySelectorAll('div').forEach(d => {
      const style = d.getAttribute('style') || '';
      if (!/display\s*:\s*flex/i.test(style)) return;
      // Cari child blok TTD (yang punya text-align:center + signature)
      const inner = d.querySelector('div[style*="text-align:center"], div[style*="text-align: center"]');
      if (!inner) return;
      // Skip kalau bukan blok TTD (heuristik: harus ada "Pengawas" / "NIP" / signature-img)
      const innerHTML = inner.innerHTML;
      if (!/NIP|Pengawas|Kepala|signature-img|Ketua/i.test(innerHTML)) return;
      const tbl = document.createElement('table');
      tbl.setAttribute('style', 'width:100%;border-collapse:collapse;margin-top:18pt;');
      tbl.innerHTML = `
        <tr>
          <td style="width:50%;border:none;"></td>
          <td style="width:50%;border:none;text-align:center;vertical-align:top;">${innerHTML}</td>
        </tr>`;
      d.parentNode.replaceChild(tbl, d);
    });

    // 3. Bersihkan display:grid, display:flex sisa di div lain.
    tmp.querySelectorAll('[style*="display"]').forEach(el => {
      let s = el.getAttribute('style') || '';
      s = s.replace(/display\s*:\s*(flex|grid)\s*;?/gi, '');
      s = s.replace(/place-items[^;]*;?/gi, '');
      s = s.replace(/justify-content[^;]*;?/gi, '');
      s = s.replace(/align-items[^;]*;?/gi, '');
      el.setAttribute('style', s);
    });

    return tmp.innerHTML;
  }

  function htmlToWordDocBlob(htmlList, title) {
    if (window.Tier && Tier.blockExportIfTrial && Tier.blockExportIfTrial('Export Word')) return null;
    const css = `
      @page WordSection1 { size: 21cm 29.7cm; margin: 2.54cm 2cm 2.54cm 2cm; mso-page-orientation: portrait; }
      div.WordSection1 { page: WordSection1; }
      body { font-family: 'Times New Roman', serif; font-size: 12pt; color: #000; line-height: 1.3; }
      h1, h2, h3, h4, h5, h6 { font-family: 'Times New Roman', serif; }
      h3 { font-size: 14pt; font-weight: 700; text-align: center; margin: 12pt 0 8pt; }
      h4 { font-size: 12pt; font-weight: 700; margin: 10pt 0 4pt; }
      p { margin: 4pt 0; text-align: justify; }
      table { border-collapse: collapse; mso-table-lspace: 0; mso-table-rspace: 0; }
      table.fmt { width: 100%; }
      table.fmt td, table.fmt th { border: 1pt solid #000; padding: 4pt; vertical-align: top; }
      .doc-page { page-break-after: always; }
      .doc-page:last-child { page-break-after: auto; }
      .signature-img { max-height: 80px; }
      .no-print { display: none; }
      img { max-width: 100%; }
    `;
    const body = htmlList.map(h => `<div class="WordSection1">${transformHtmlForWord(h)}</div>`).join('');
    const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>${(title || 'Eviden RHK').replace(/[<>&]/g, '')}</title>
<!--[if gte mso 9]><xml>
<w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument>
</xml><![endif]-->
<style>${css}</style>
</head>
<body>${body}</body>
</html>`;
    return new Blob(['\ufeff', html], { type: 'application/msword' });
  }

  window.GenDOCX = { htmlToDocxBlob, htmlToDocxBlocks, htmlToWordDocBlob };
})();
