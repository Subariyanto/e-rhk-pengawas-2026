// signature.js — Modul Tanda Tangan Eviden (QR Code TTE, TTD Scan, Manual)
(function () {
  const SETTINGS_KEY = 'erhk2026_signature_settings';
  const TTE_RECORDS_KEY = 'erhk2026_tte_records';
  const DOC_COUNTER_KEY = 'erhk2026_doc_counter';

  // ===== DEFAULT SETTINGS =====
  const DEFAULT_SETTINGS = {
    default_mode: 'scan_signature',
    enable_qrcode_tte: true,
    enable_scan_signature: true,
    enable_blank_manual: true,
    allow_choose_on_print: false,
    show_signature_preview: true
  };

  // ===== MODE LABELS & BADGES =====
  const MODE_INFO = {
    qrcode_tte: {
      label: 'QR Code / TTE Elektronik',
      shortLabel: 'TTE QR Code',
      badge: '<span class="badge bg-success">TTE QR Code</span>',
      description: 'Dokumen akan menampilkan QR Code verifikasi dan dapat dicek keasliannya secara online.'
    },
    scan_signature: {
      label: 'TTD Scan',
      shortLabel: 'TTD Scan',
      badge: '<span class="badge bg-primary">TTD Scan</span>',
      description: 'Dokumen akan menampilkan gambar tanda tangan scan yang sudah diupload.'
    },
    blank_manual: {
      label: 'Kosong / Manual',
      shortLabel: 'TTD Manual',
      badge: '<span class="badge bg-secondary">TTD Manual</span>',
      description: 'Dokumen akan menampilkan kolom tanda tangan kosong untuk tanda tangan basah/manual.'
    }
  };

  // ===== SETTINGS =====
  function getSettings() {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) return { ...DEFAULT_SETTINGS };
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  function saveSettings(settings) {
    const current = getSettings();
    const merged = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
    return merged;
  }

  function resetSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    return { ...DEFAULT_SETTINGS };
  }

  // ===== MODE VALIDATION =====
  function getAvailableModes() {
    const s = getSettings();
    const modes = [];
    if (s.enable_qrcode_tte) modes.push('qrcode_tte');
    if (s.enable_scan_signature) modes.push('scan_signature');
    if (s.enable_blank_manual) modes.push('blank_manual');
    return modes;
  }

  function isValidMode(mode) {
    const s = getSettings();
    if (mode === 'qrcode_tte') return s.enable_qrcode_tte;
    if (mode === 'scan_signature') return s.enable_scan_signature;
    if (mode === 'blank_manual') return s.enable_blank_manual;
    return false;
  }

  // ===== DOCUMENT NUMBER =====
  function generateDocNumber() {
    const counter = localStorage.getItem(DOC_COUNTER_KEY);
    const year = new Date().getFullYear();
    let num = 1;
    if (counter) {
      const parsed = JSON.parse(counter);
      num = (parsed.year === year) ? parsed.last + 1 : 1;
    }
    localStorage.setItem(DOC_COUNTER_KEY, JSON.stringify({ year, last: num }));
    const padded = String(num).padStart(5, '0');
    return `ERHK/${year}/${padded}`;
  }

  // ===== VERIFICATION CODE =====
  function generateVerificationCode() {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code1 = '';
    let code2 = '';
    for (let i = 0; i < 5; i++) {
      code1 += chars[Math.floor(Math.random() * chars.length)];
      code2 += chars[Math.floor(Math.random() * chars.length)];
    }
    return `ERHK-${year}-${code1}-${code2}`;
  }

  // ===== TTE RECORDS =====
  function getTTERecords() {
    const stored = localStorage.getItem(TTE_RECORDS_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  function saveTTERecord(record) {
    const records = getTTERecords();
    records.push(record);
    localStorage.setItem(TTE_RECORDS_KEY, JSON.stringify(records));
    return record;
  }

  function findTTERecord(verificationCode) {
    const records = getTTERecords();
    return records.find(r => r.verification_code === verificationCode) || null;
  }

  function createTTERecord(idn, rhkId, evidenTitle) {
    const docNumber = generateDocNumber();
    const verificationCode = generateVerificationCode();
    const now = new Date();
    const record = {
      id: 'tte_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      pengawas_id: Auth.currentUser() ? Auth.currentUser().id : 'unknown',
      nama_penandatangan: idn.pegawai.nama,
      nip_penandatangan: idn.pegawai.nip,
      jabatan_penandatangan: idn.pegawai.jabatan,
      unit_kerja: idn.pegawai.unit_kerja,
      rhk_id: rhkId,
      eviden_title: evidenTitle,
      nomor_dokumen: docNumber,
      verification_code: verificationCode,
      signed_at: now.toISOString(),
      status_tte: 'valid',
      created_at: now.toISOString()
    };
    saveTTERecord(record);
    return record;
  }

  // ===== VERIFICATION URL =====
  function getVerificationUrl(verificationCode) {
    const base = window.location.origin + window.location.pathname;
    return `${base}#/verify?code=${verificationCode}`;
  }

  // ===== QR CODE GENERATION (using qrcode.js CDN) =====
  function generateQRCode(container, data, size) {
    size = size || 150;
    container.innerHTML = '';
    if (typeof QRCode === 'undefined') {
      container.innerHTML = '<div class="text-danger small">QR Code library tidak tersedia</div>';
      return;
    }
    new QRCode(container, {
      text: data,
      width: size,
      height: size,
      colorDark: '#000000',
      colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.M
    });
  }

  // ===== TTD BLOCK HTML GENERATION =====
  function generateTTDBlock(mode, idn, rhkId, evidenTitle) {
    const kota = idn.pegawai.kabupaten || 'Jember';
    const tanggal = U.fmtTanggal(new Date());

    if (mode === 'qrcode_tte') {
      return generateTTEQRBlock(idn, rhkId, evidenTitle, kota, tanggal);
    } else if (mode === 'scan_signature') {
      return generateScanBlock(idn, kota, tanggal);
    } else if (mode === 'blank_manual') {
      return generateBlankBlock(idn, kota, tanggal);
    }
    return generateBlankBlock(idn, kota, tanggal);
  }

  function generateTTEQRBlock(idn, rhkId, evidenTitle, kota, tanggal) {
    const record = createTTERecord(idn, rhkId, evidenTitle);
    const verUrl = getVerificationUrl(record.verification_code);
    const qrContainerId = 'qr_' + record.id;

    return `
      <div class="tte-block" style="margin-top:30px;padding:20px;border:2px solid #1E2A5A;border-radius:8px;background:#f8f9fa;">
        <div style="text-align:center;margin-bottom:12px;">
          <i class="bi bi-shield-check text-success" style="font-size:24px;"></i>
          <div style="font-weight:600;color:#1E2A5A;">Telah Ditandatangani Secara Elektronik</div>
        </div>
        <div style="display:flex;gap:20px;align-items:flex-start;">
          <div style="flex:1;">
            <div style="margin-bottom:8px;">
              <div style="font-weight:700;font-size:11pt;">${U.escapeHtml(idn.pegawai.nama)}</div>
              <div>NIP. ${U.escapeHtml(idn.pegawai.nip)}</div>
              <div>${U.escapeHtml(idn.pegawai.jabatan)}</div>
              <div>${U.escapeHtml(idn.pegawai.unit_kerja)}</div>
            </div>
            <div style="font-size:9pt;color:#666;margin-top:12px;">
              <div><strong>Tanggal TTE:</strong> ${tanggal} ${new Date().toLocaleTimeString('id-ID')}</div>
              <div><strong>No. Dokumen:</strong> ${record.nomor_dokumen}</div>
              <div><strong>Kode Verifikasi:</strong> <code style="background:#e9ecef;padding:2px 6px;border-radius:3px;">${record.verification_code}</code></div>
            </div>
          </div>
          <div style="text-align:center;">
            <div id="${qrContainerId}" class="qr-container" data-qr-url="${verUrl}" style="width:150px;height:150px;margin:0 auto;"></div>
            <div style="font-size:8pt;margin-top:6px;color:#666;">Pindai untuk verifikasi</div>
          </div>
        </div>
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #dee2e6;font-size:8pt;color:#888;text-align:center;">
          Dokumen ini telah ditandatangani secara elektronik melalui aplikasi e-RHK Pengawas.<br/>
          Verifikasi: <a href="${verUrl}" target="_blank" style="color:#1E2A5A;">${verUrl}</a>
        </div>
      </div>
    `;
  }

  function generateScanBlock(idn, kota, tanggal) {
    const sigImg = idn.tanda_tangan ? `<img class="signature-img" src="${idn.tanda_tangan}" style="max-height:90px;max-width:160px;" />` : '';
    return `
      <div style="display:flex;justify-content:flex-end;margin-top:30px;">
        <div style="width:50%;text-align:center;padding-right:6%;">
          <div>${U.escapeHtml(kota)}, ${tanggal}</div>
          <div>Pengawas Madrasah,</div>
          <div style="height:auto;min-height:70px;display:flex;align-items:center;justify-content:center;">${sigImg}</div>
          <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(idn.pegawai.nama)}</div>
          <div>NIP. ${U.escapeHtml(idn.pegawai.nip)}</div>
        </div>
      </div>
    `;
  }

  function generateBlankBlock(idn, kota, tanggal) {
    return `
      <div style="display:flex;justify-content:flex-end;margin-top:30px;">
        <div style="width:50%;text-align:center;padding-right:6%;">
          <div>${U.escapeHtml(kota)}, ${tanggal}</div>
          <div>Pengawas Madrasah,</div>
          <div style="height:100px;"></div>
          <div style="text-decoration:underline;font-weight:700">${U.escapeHtml(idn.pegawai.nama)}</div>
          <div>NIP. ${U.escapeHtml(idn.pegawai.nip)}</div>
        </div>
      </div>
    `;
  }

  // ===== RENDER QR CODES AFTER DOM READY =====
  function renderAllQRCodes() {
    document.querySelectorAll('.qr-container[data-qr-url]').forEach(el => {
      const url = el.getAttribute('data-qr-url');
      if (url) {
        generateQRCode(el, url, 150);
      }
    });
  }

  // ===== BADGE =====
  function getModeBadge(mode) {
    const info = MODE_INFO[mode];
    return info ? info.badge : '<span class="badge bg-secondary">Unknown</span>';
  }

  function getModeLabel(mode) {
    const info = MODE_INFO[mode];
    return info ? info.label : 'Unknown';
  }

  // ===== EXPORT =====
  window.Signature = {
    MODE_INFO,
    getSettings,
    saveSettings,
    resetSettings,
    getAvailableModes,
    isValidMode,
    generateDocNumber,
    generateVerificationCode,
    getTTERecords,
    findTTERecord,
    createTTERecord,
    getVerificationUrl,
    generateQRCode,
    generateTTDBlock,
    renderAllQRCodes,
    getModeBadge,
    getModeLabel
  };
})();
