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

  window.GenDOCX = { htmlToDocxBlob, htmlToDocxBlocks };
})();
