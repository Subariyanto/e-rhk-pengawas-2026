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
        password: await hashPassword('admin123'),
        role: 'admin',
        status: 'aktif',
        created_at: new Date().toISOString(),
      });
      saveUsers(users);
    }
  }

  async function register({ nama, email, password, nip }) {
    const users = listUsers();
    if (users.find(u => u.email.toLowerCase() === String(email).toLowerCase())) {
      throw new Error('Email sudah terdaftar.');
    }
    if (nip && users.find(u => u.nip === nip)) {
      throw new Error('NIP sudah terdaftar.');
    }
    const u = {
      id: Store.uid('u_'),
      nama,
      email,
      nip: nip || '',
      password: await hashPassword(password),
      role: 'pengawas',
      status: 'aktif',
      created_at: new Date().toISOString(),
    };
    users.push(u);
    saveUsers(users);
    return u;
  }

  async function login({ email, password }) {
    const users = listUsers();
    const hash = await hashPassword(password);
    const u = users.find(x => x.email.toLowerCase() === String(email).toLowerCase() && x.password === hash);
    if (!u) throw new Error('Email atau password salah.');
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

  window.Auth = {
    ensureAdminSeeded, register, login, logout, currentSession, currentUser,
    listUsers, updateUser, changePassword, deleteUser, hashPassword,
  };
})();
