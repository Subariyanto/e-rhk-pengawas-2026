// Auth: register, login, logout, current user
(function () {
  const USERS_KEY = 'users';
  const SESSION_KEY = Store.SESSION_KEY;

  // Hash password with simple SHA-256 via SubtleCrypto (async). Fallback to plain if unavailable.
  async function hashPassword(pw) {
    try {
      const enc = new TextEncoder().encode(pw);
      const buf = await crypto.subtle.digest('SHA-256', enc);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) { return 'plain:' + pw; }
  }

  function listUsers() { return Store.getGlobal(USERS_KEY, []) || []; }
  function saveUsers(list) { Store.setGlobal(USERS_KEY, list); }

  async function ensureAdminSeeded() {
    const users = listUsers();
    if (!users.find(u => u.role === 'admin')) {
      users.push({
        id: 'admin',
        nama: 'Administrator',
        email: 'admin@local',
        password: await hashPassword('@riyant1970'),
        role: 'admin',
        tier: 'full',
        status: 'aktif',
        created_at: new Date().toISOString(),
      });
      saveUsers(users);
    } else {
      // Pastikan admin selalu tier='full' (idempotent migration)
      const list = listUsers();
      let changed = false;
      list.forEach(u => {
        if (u.role === 'admin' && u.tier !== 'full') { u.tier = 'full'; changed = true; }
      });
      if (changed) saveUsers(list);
    }
  }

  // register({ nama, email, password, nip, tier, trialExpiresAt, fullExpiresAt, activatedWith })
  // tier default 'full' agar backward-compat dengan kode legacy per-NIP.
  async function register({ nama, email, password, nip, tier, trialExpiresAt, fullExpiresAt, activatedWith }) {
    const users = listUsers();
    if (email && users.find(u => u.email.toLowerCase() === String(email).toLowerCase())) {
      throw new Error('Email sudah terdaftar.');
    }
    if (nip && users.find(u => u.nip === nip)) {
      throw new Error('NIP sudah terdaftar.');
    }
    const u = {
      id: Store.uid('u_'),
      nama: nama || '',
      email: email || (nip ? nip + '@pengawas.local' : ''),
      nip: nip || '',
      password: await hashPassword(password),
      role: 'pengawas',
      tier: tier || 'full',
      trialExpiresAt: trialExpiresAt || null,
      fullExpiresAt: fullExpiresAt || null,
      activatedWith: activatedWith || null,
      status: 'aktif',
      created_at: new Date().toISOString(),
    };
    users.push(u);
    saveUsers(users);
    return u;
  }

  async function login({ email, password, nip }) {
    const users = listUsers();
    const hash = await hashPassword(password);
    let u = null;
    if (nip) {
      const n = String(nip).replace(/[^0-9]/g, '');
      u = users.find(x => x.nip === n && x.password === hash);
    }
    if (!u && email) {
      // Login via email atau via NIP yang dimasukkan di field email
      const v = String(email).trim();
      const vDigits = v.replace(/[^0-9]/g, '');
      u = users.find(x =>
        x.password === hash && (
          x.email.toLowerCase() === v.toLowerCase() ||
          (vDigits && x.nip === vDigits)
        )
      );
    }
    if (!u) throw new Error('Email/NIP atau password salah.');
    if (u.status !== 'aktif') throw new Error('Akun tidak aktif.');
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: u.id, role: u.role, ts: Date.now() }));
    return u;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function currentSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) { return null; }
  }
  function currentUser() {
    const s = currentSession();
    if (!s) return null;
    return listUsers().find(u => u.id === s.userId) || null;
  }

  function updateUser(id, patch) {
    const users = listUsers();
    const i = users.findIndex(u => u.id === id);
    if (i < 0) throw new Error('User tidak ditemukan.');
    users[i] = { ...users[i], ...patch };
    saveUsers(users);
    return users[i];
  }

  async function changePassword(id, newPassword) {
    return updateUser(id, { password: await hashPassword(newPassword) });
  }

  function deleteUser(id) {
    const users = listUsers().filter(u => u.id !== id);
    saveUsers(users);
  }

  // ============================================================
  // AKUN SERVER (Pusat Lisensi) — model "1 kode = 1 AKUN"
  // Akun hidup di server (app_accounts), sehingga akun yang sama bisa
  // login dari perangkat mana pun. Mengikuti pola aplikasi PKKM.
  // Data RHK tetap lokal per perangkat (per-user key).
  // Hash server: sha256(username.lower + ':' + password), disimpan di u.serverHash.
  // ============================================================
  function _normId(v) { return String(v || '').trim().toLowerCase(); }

  // Pesan user-friendly untuk reason RPC akun Pusat Lisensi.
  function accountReasonMsg(reason) {
    switch (String(reason || '')) {
      case 'network': return 'Butuh koneksi internet untuk verifikasi akun. Periksa koneksi lalu coba lagi.';
      case 'no-module': return 'Modul sync belum termuat. Refresh halaman.';
      case 'invalid_credentials': return 'NIP/Email atau Password salah.';
      case 'account_exists': return 'Username ini sudah dipakai akun lain. Hubungi admin.';
      case 'code_used': return 'Kode aktivasi ini sudah dipakai akun lain (aturan: 1 kode = 1 akun).';
      case 'invalid_code': return 'Kode aktivasi tidak valid atau belum terdaftar di server. Hubungi admin.';
      case 'inactive': return 'Kode aktivasi sudah dinonaktifkan. Hubungi admin.';
      case 'revoked': return 'Akun ini dinonaktifkan oleh admin. Silakan hubungi admin.';
      case 'account_not_found': return 'Akun belum terdaftar di server. Silakan daftar/aktivasi dulu.';
      case 'username_invalid': return 'Username/ID minimal 4 karakter.';
      case 'password_invalid': return 'Password tidak valid.';
      default: return 'Proses gagal. Silakan coba lagi.';
    }
  }

  // Cari user lokal berdasar id login (NIP atau email).
  function findLocalById(id) {
    const v = _normId(id);
    const vDigits = v.replace(/[^0-9]/g, '');
    return listUsers().find(u =>
      (u.email && u.email.toLowerCase() === v) ||
      (vDigits && u.nip && u.nip === vDigits)
    ) || null;
  }

  // Ciptakan/perbarui akun lokal dari data server (cache offline + wadah data lokal).
  async function upsertLocalFromServer(opts) {
    opts = opts || {};
    const users = listUsers();
    const uname = _normId(opts.username);
    const nipDigits = String(opts.nip || (/^\d{6,}$/.test(uname) ? uname : '')).replace(/[^0-9]/g, '');
    const emailFinal = opts.email || (nipDigits ? (nipDigits + '@pengawas.local') : uname);
    let u = users.find(x =>
      (x.email && x.email.toLowerCase() === String(emailFinal).toLowerCase()) ||
      (nipDigits && x.nip === nipDigits)
    ) || null;
    const pwHash = await hashPassword(opts.password);
    const srvHash = opts.serverHash || null;
    const role = (String(opts.role || '').toLowerCase() === 'admin') ? 'admin' : 'pengawas';
    const tier = (String(opts.tier || '').toLowerCase() === 'trial') ? 'trial' : 'full';
    const licDays = (window.Tier && Tier.LICENSE_DAYS) || 365;
    if (!u) {
      u = {
        id: Store.uid('u_'),
        nama: opts.fullname || ('Pengawas ' + (nipDigits ? nipDigits.slice(-4) : emailFinal)),
        email: emailFinal,
        nip: nipDigits || '',
        password: pwHash,
        serverHash: srvHash,
        role: role,
        tier: tier,
        trialExpiresAt: null,
        fullExpiresAt: tier === 'full' ? new Date(Date.now() + licDays * 86400000).toISOString() : null,
        activatedWith: opts.licenseCode || null,
        status: 'aktif',
        created_at: new Date().toISOString(),
        server_synced: true,
      };
      users.push(u);
    } else {
      u.password = pwHash;
      if (srvHash) u.serverHash = srvHash;
      if (role === 'admin') u.role = 'admin';
      u.tier = tier;
      if (opts.fullname) u.nama = opts.fullname;
      if (nipDigits) u.nip = nipDigits;
      if (tier === 'full' && !u.fullExpiresAt) u.fullExpiresAt = new Date(Date.now() + licDays * 86400000).toISOString();
      u.status = 'aktif';
      u.server_synced = true;
    }
    saveUsers(users);
    return u;
  }

  // Login via server Pusat Lisensi (akun lintas perangkat).
  // Return { ok:true, user } | { ok:false, reason }.
  // reason 'network'/'no-module'/'hash-fail' => pemanggil boleh fallback ke login lokal.
  async function loginWithServer(id, password) {
    if (!window.SupabaseSync || typeof SupabaseSync.loginAccount !== 'function') return { ok: false, reason: 'no-module' };
    const username = _normId(id);
    if (!username) return { ok: false, reason: 'invalid_credentials' };
    const hash = await SupabaseSync.accountHash(username, password);
    if (!hash) return { ok: false, reason: 'hash-fail' };
    const r = await SupabaseSync.loginAccount(username, hash, SupabaseSync.APP_SLUG);
    if (!r || r.valid === null) return { ok: false, reason: 'network' };
    if (r.valid !== true) return { ok: false, reason: r.reason || 'invalid_credentials' };
    const isNip = /^\d{6,}$/.test(username);
    const u = await upsertLocalFromServer({
      username: username,
      password: password,
      serverHash: hash,
      fullname: r.fullname,
      nip: isNip ? username : '',
      email: isNip ? '' : username,
      role: r.role,
      tier: r.tier,
      licenseCode: r.license_code || null,
    });
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: u.id, role: u.role, ts: Date.now() }));
    return { ok: true, user: u };
  }

  // Daftarkan akun ke server (klaim 1 kode = 1 akun).
  // Return { ok, reason } — reason 'network' => server tak terjangkau (boleh lanjut offline).
  async function registerServerAccount(opts) {
    opts = opts || {};
    if (!window.SupabaseSync || typeof SupabaseSync.registerAccount !== 'function') return { ok: false, reason: 'no-module' };
    const uname = _normId(opts.username);
    if (uname.length < 4) return { ok: false, reason: 'username_invalid' };
    const hash = await SupabaseSync.accountHash(uname, opts.password);
    if (!hash) return { ok: false, reason: 'hash-fail' };
    const r = await SupabaseSync.registerAccount(
      opts.code, SupabaseSync.APP_SLUG, uname, hash, opts.fullname || '', opts.madrasah || '',
      (navigator.userAgent || '').slice(0, 200)
    );
    if (r === null || r.success === null) return { ok: false, reason: 'network' };
    if (r.success === true) return { ok: true, reason: r.reason || 'claimed', hash: hash };
    return { ok: false, reason: r.reason || 'failed' };
  }

  window.Auth = {
    ensureAdminSeeded, register, login, logout, currentSession, currentUser,
    listUsers, updateUser, changePassword, deleteUser, hashPassword,
    // Akun server (Pusat Lisensi)
    accountReasonMsg, findLocalById, upsertLocalFromServer, loginWithServer, registerServerAccount,
  };
})();
