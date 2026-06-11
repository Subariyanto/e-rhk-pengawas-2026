// Tier (TRIAL/FULL/ADMIN) management for e-RHK Pengawas 2026.
// Selaras dengan supervisi-pm-kbc-jember tapi diadaptasi: limit dipakai pada KEGIATAN
// (bukan supervisi). Auth tetap pakai field `role`; tier disimpan di field `tier`.
//
// User shape (legacy aware):
//   { id, nama, email, nip, password, role:'admin'|'pengawas', status,
//     tier:'admin'|'full'|'trial' (opsional, default 'full' untuk legacy user),
//     trialExpiresAt:ISO|null,
//     activatedWith:string|null }
(function () {
  const TRIAL_DAYS = 5;
  const TRIAL_MAX_KEGIATAN = 10;

  function getTier(user) {
    if (!user) return 'full';
    if (user.role === 'admin') return 'admin';
    return user.tier || 'full';
  }

  function isAdmin(user) { return user && user.role === 'admin'; }

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
    const t = getTrialStatus(user);
    if (!t.isTrial) return { ok: true };
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

  function findUserById(userId) {
    if (!window.Auth) return null;
    return (Auth.listUsers() || []).find(u => u.id === userId) || null;
  }

  function upgradeUserToFull(userId) {
    const u = findUserById(userId);
    if (!u) return false;
    Auth.updateUser(userId, {
      tier: 'full',
      trialExpiresAt: null,
      upgradedAt: new Date().toISOString(),
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

  // Pastikan admin selalu tier='full' (idempotent)
  function ensureAdminFullTier() {
    if (!window.Auth) return;
    (Auth.listUsers() || []).forEach(u => {
      if (u.role === 'admin' && u.tier !== 'full') {
        Auth.updateUser(u.id, { tier: 'full' });
      }
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
    return '<span class="badge bg-success">FULL</span>';
  }

  window.Tier = {
    TRIAL_DAYS,
    TRIAL_MAX_KEGIATAN,
    getTier,
    isAdmin,
    getTrialStatus,
    canCreateKegiatan,
    upgradeUserToFull,
    downgradeUserToTrial,
    ensureAdminFullTier,
    tierBadgeHtml,
  };
})();
