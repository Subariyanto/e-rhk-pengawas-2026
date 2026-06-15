// Tier (TRIAL/FULL/ADMIN) management for e-RHK Pengawas 2026.
// Selaras dengan supervisi-pm-kbc-jember tapi diadaptasi: limit dipakai pada KEGIATAN
// (bukan supervisi). Auth tetap pakai field `role`; tier disimpan di field `tier`.
//
// User shape (legacy aware):
//   { id, nama, email, nip, password, role:'admin'|'pengawas', status,
//     tier:'admin'|'full'|'trial' (opsional, default 'full' untuk legacy user),
//     trialExpiresAt:ISO|null,
//     fullExpiresAt:ISO|null,   // null untuk admin (selamanya); user FULL dapat 365 hari sejak aktivasi
//     activatedWith:string|null,
//     upgradedAt:ISO|null,
//     extendedAt:ISO|null }
(function () {
  const TRIAL_DAYS = 5;
  const TRIAL_MAX_KEGIATAN = 10;
  const LICENSE_DAYS = 365; // FULL berlaku 1 tahun sejak aktivasi
  const FULL_WARNING_DAYS = 30; // banner peringatan jika sisa <= 30 hari

  function getTier(user) {
    if (!user) return 'full';
    if (user.role === 'admin') return 'admin';
    return user.tier || 'full';
  }

  function isAdmin(user) { return user && user.role === 'admin'; }

  function isTrialUser(user) {
    user = user || (window.Auth && Auth.currentUser ? Auth.currentUser() : null);
    if (!user) return false;
    if (isAdmin(user)) return false;
    return (user.tier || 'full') === 'trial';
  }

  // Guard: cek tier user. Kalau TRIAL, tampilkan toast & return true (blocked).
  // Kalau FULL/admin: return false (boleh lanjut).
  function blockExportIfTrial(label) {
    if (!isTrialUser()) return false;
    var msg = (label ? label + ': ' : '') + 'Fitur Export hanya tersedia untuk akun FULL. Cetak/Print Preview (Ctrl+P) tetap bisa, dengan watermark TRIAL.';
    try { (window.UI && UI.toast) ? UI.toast(msg, 'warning') : alert(msg); } catch (_) { try { alert(msg); } catch (e) {} }
    return true;
  }

  // Status lisensi FULL (sisa hari, expired, dst).
  function getFullStatus(user) {
    user = user || (window.Auth && Auth.currentUser ? Auth.currentUser() : null);
    const empty = { hasLicense: false, isExpired: false, isExpiringSoon: false, daysLeft: Infinity, expiresAt: null };
    if (!user) return empty;
    if (isAdmin(user)) return empty; // admin selamanya, tidak ada expiry
    if ((user.tier || 'full') !== 'full') return empty;
    if (!user.fullExpiresAt) return empty; // legacy user tanpa expiry → unlimited
    const ms = new Date(user.fullExpiresAt).getTime() - Date.now();
    const daysLeft = Math.ceil(ms / 86400000);
    return {
      hasLicense: true,
      isExpired: ms <= 0,
      isExpiringSoon: ms > 0 && daysLeft <= FULL_WARNING_DAYS,
      daysLeft: Math.max(0, daysLeft),
      expiresAt: user.fullExpiresAt,
    };
  }

  // status object yg dipakai banner & guard
  function getTrialStatus(user) {
    user = user || (window.Auth && Auth.currentUser ? Auth.currentUser() : null);
    const empty = { tier: 'full', isTrial: false, isExpired: false, daysLeft: Infinity, kegiatanCount: 0, limit: TRIAL_MAX_KEGIATAN, limitReached: false };
    if (!user) return empty;
    if (isAdmin(user)) return { ...empty, tier: 'admin' };
    const tier = user.tier || 'full';
    if (tier !== 'trial') return empty;

    let count = 0;
    try {
      const list = (window.Store && Store.get) ? (Store.get('kegiatan', []) || []) : [];
      count = Array.isArray(list) ? list.length : 0;
    } catch (e) { count = 0; }

    let daysLeft = Infinity;
    let isExpired = false;
    if (user.trialExpiresAt) {
      const ms = new Date(user.trialExpiresAt).getTime() - Date.now();
      daysLeft = Math.ceil(ms / 86400000);
      isExpired = ms <= 0;
    }
    return {
      tier: 'trial',
      isTrial: true,
      isExpired,
      daysLeft: Math.max(0, daysLeft),
      kegiatanCount: count,
      limit: TRIAL_MAX_KEGIATAN,
      limitReached: count >= TRIAL_MAX_KEGIATAN,
    };
  }

  // Dipanggil sebelum membuat kegiatan baru.
  // Return { ok:true } atau { ok:false, reason:'...' }.
  function canCreateKegiatan(user) {
    user = user || (window.Auth && Auth.currentUser ? Auth.currentUser() : null);
    if (isAdmin(user)) return { ok: true };
    const t = getTrialStatus(user);
    if (t.isTrial) {
      if (t.isExpired) {
        return {
          ok: false,
          reason: 'Masa trial ' + TRIAL_DAYS + ' hari sudah habis. Hubungi Admin untuk mendapatkan Kode Aktivasi FULL agar bisa lanjut.',
        };
      }
      if (t.limitReached) {
        return {
          ok: false,
          reason: 'Trial dibatasi maksimal ' + TRIAL_MAX_KEGIATAN + ' kegiatan. Hubungi Admin untuk upgrade ke FULL.',
        };
      }
      return { ok: true };
    }
    // Cek FULL expiry
    const f = getFullStatus(user);
    if (f.hasLicense && f.isExpired) {
      const tgl = new Date(f.expiresAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      return {
        ok: false,
        reason: 'Lisensi FULL Anda sudah berakhir pada ' + tgl + '. Hubungi Admin untuk perpanjangan (Kode Aktivasi baru, berlaku 1 tahun).',
      };
    }
    return { ok: true };
  }

  function findUserById(userId) {
    if (!window.Auth) return null;
    return (Auth.listUsers() || []).find(u => u.id === userId) || null;
  }

  function upgradeUserToFull(userId) {
    const u = findUserById(userId);
    if (!u) return false;
    const now = Date.now();
    // Kalau user sudah FULL & belum expired, perpanjang dari fullExpiresAt yang lebih baru
    // (supaya sisa hari yang belum kepakai tidak hangus). Kalau expired/baru, mulai dari now.
    let anchor = now;
    if (u.tier === 'full' && u.fullExpiresAt) {
      const cur = new Date(u.fullExpiresAt).getTime();
      if (cur > now) anchor = cur;
    }
    const expiresAt = new Date(anchor + LICENSE_DAYS * 86400000).toISOString();
    Auth.updateUser(userId, {
      tier: 'full',
      trialExpiresAt: null,
      fullExpiresAt: expiresAt,
      upgradedAt: new Date().toISOString(),
    });
    return true;
  }

  // Perpanjang lisensi FULL 1 tahun. Kalau masih aktif, ditambah dari expiresAt.
  // Kalau sudah expired atau kosong, mulai dari sekarang.
  function extendUserFullByOneYear(userId) {
    const u = findUserById(userId);
    if (!u) return false;
    if (u.role === 'admin') return false; // admin tidak perlu
    const now = Date.now();
    let anchor = now;
    if (u.fullExpiresAt) {
      const cur = new Date(u.fullExpiresAt).getTime();
      if (cur > now) anchor = cur;
    }
    const expiresAt = new Date(anchor + LICENSE_DAYS * 86400000).toISOString();
    Auth.updateUser(userId, {
      tier: 'full',
      trialExpiresAt: null,
      fullExpiresAt: expiresAt,
      extendedAt: new Date().toISOString(),
    });
    return true;
  }

  function downgradeUserToTrial(userId) {
    const u = findUserById(userId);
    if (!u) return false;
    if (u.role === 'admin') return false; // admin tidak boleh di-downgrade
    Auth.updateUser(userId, {
      tier: 'trial',
      trialExpiresAt: new Date(Date.now() + TRIAL_DAYS * 86400000).toISOString(),
      downgradedAt: new Date().toISOString(),
    });
    return true;
  }

  // Pastikan admin selalu tier='full' & tanpa fullExpiresAt (idempotent).
  function ensureAdminFullTier() {
    if (!window.Auth) return;
    (Auth.listUsers() || []).forEach(u => {
      if (u.role === 'admin') {
        const patch = {};
        if (u.tier !== 'full') patch.tier = 'full';
        if (u.fullExpiresAt) patch.fullExpiresAt = null;
        if (Object.keys(patch).length) Auth.updateUser(u.id, patch);
      }
    });
  }

  // Migrasi sekali untuk user FULL existing (sebelum fitur expiry diperkenalkan).
  // Anchor: upgradedAt > created_at > now. Set fullExpiresAt = anchor + 365 hari.
  // Kalau anchor sudah > 1 tahun lalu, lisensi langsung expired (sesuai kebijakan tahunan).
  function migrateExistingFullUsers() {
    if (!window.Auth) return;
    (Auth.listUsers() || []).forEach(u => {
      if (u.role === 'admin') return;
      if ((u.tier || 'full') !== 'full') return;
      if (u.fullExpiresAt) return; // sudah punya, skip
      if (u._fullMigrated) return;
      const anchorIso = u.upgradedAt || u.created_at || new Date().toISOString();
      const anchorMs = new Date(anchorIso).getTime();
      const expiresAt = new Date(anchorMs + LICENSE_DAYS * 86400000).toISOString();
      Auth.updateUser(u.id, { fullExpiresAt: expiresAt, _fullMigrated: true });
    });
  }

  function tierBadgeHtml(user) {
    if (!user) return '';
    if (user.role === 'admin') {
      return '<span class="badge bg-primary">ADMIN</span>';
    }
    const tier = user.tier || 'full';
    if (tier === 'trial') {
      let extra = '';
      if (user.trialExpiresAt) {
        const ms = new Date(user.trialExpiresAt).getTime() - Date.now();
        if (ms <= 0) extra = ' (expired)';
        else extra = ' (' + Math.ceil(ms / 86400000) + 'h)';
      }
      return '<span class="badge bg-warning text-dark">TRIAL' + extra + '</span>';
    }
    if (user.fullExpiresAt) {
      const ms = new Date(user.fullExpiresAt).getTime() - Date.now();
      const days = Math.ceil(ms / 86400000);
      if (ms <= 0) return '<span class="badge bg-danger">FULL (expired)</span>';
      if (days <= FULL_WARNING_DAYS) return '<span class="badge bg-warning text-dark">FULL (' + days + 'h lagi)</span>';
      return '<span class="badge bg-success">FULL</span>';
    }
    return '<span class="badge bg-success">FULL</span>';
  }

  window.Tier = {
    TRIAL_DAYS,
    TRIAL_MAX_KEGIATAN,
    LICENSE_DAYS,
    FULL_WARNING_DAYS,
    getTier,
    isAdmin,
    isTrialUser,
    blockExportIfTrial,
    getTrialStatus,
    getFullStatus,
    canCreateKegiatan,
    upgradeUserToFull,
    extendUserFullByOneYear,
    downgradeUserToTrial,
    ensureAdminFullTier,
    migrateExistingFullUsers,
    tierBadgeHtml,
  };
})();
