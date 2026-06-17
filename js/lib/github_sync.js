// GithubSync — sinkronisasi codes.json ke gh-pages via GitHub API.
// Setup sekali (PAT), lalu setiap admin generate/revoke kode otomatis push ke gh-pages.
// Public users fetch dari raw.githubusercontent.com → kode valid di device manapun.
(function () {
  const REPO_OWNER = 'Subariyanto';
  const REPO_NAME = 'e-rhk-pengawas-2026';
  const REPO_BRANCH = 'gh-pages';
  const CODES_PATH = 'data/codes.json';

  const PAT_KEY = 'gh_pat';

  function getPAT() { return Store.getGlobal(PAT_KEY, '') || ''; }
  function setPAT(pat) { Store.setGlobal(PAT_KEY, String(pat || '').trim()); }
  function clearPAT() { Store.removeGlobal(PAT_KEY); }
  function hasPAT() { return !!getPAT(); }

  // RAW URL — public, tidak butuh auth, cache-busted dengan timestamp.
  function rawUrl() {
    return `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${REPO_BRANCH}/${CODES_PATH}?t=${Date.now()}`;
  }
  function apiUrl() {
    return `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${CODES_PATH}`;
  }

  // Fetch codes.json publik (tanpa auth). Return null kalau tidak ada / error.
  async function readPublic() {
    try {
      const r = await fetch(rawUrl(), { cache: 'no-store' });
      if (!r.ok) return null;
      const data = await r.json();
      // Format yang diharapkan: { codes: [{code, tier, usedBy, revoked, ...}], updatedAt }
      if (!data || !Array.isArray(data.codes)) return null;
      return data;
    } catch (e) {
      console.warn('[GithubSync] readPublic failed:', e.message);
      return null;
    }
  }

  // Helper: fetch SHA + remote codes terbaru dari gh-pages.
  // Return { sha, remoteCodes }. sha=null kalau file belum ada (first create).
  async function fetchCurrentSha(headers) {
    const r = await fetch(apiUrl() + '?ref=' + REPO_BRANCH + '&t=' + Date.now(), { headers, cache: 'no-store' });
    if (r.ok) {
      const j = await r.json();
      let remoteCodes = null;
      try {
        if (j.content && j.encoding === 'base64') {
          const decoded = decodeURIComponent(escape(atob(j.content.replace(/\n/g, ''))));
          const parsed = JSON.parse(decoded);
          if (parsed && Array.isArray(parsed.codes)) remoteCodes = parsed.codes;
        }
      } catch (e) { /* ignore decode errors */ }
      return { sha: j.sha || null, remoteCodes };
    } else if (r.status === 404) {
      return { sha: null, remoteCodes: null };
    } else if (r.status === 401 || r.status === 403) {
      throw new Error('PAT tidak valid atau tidak punya permission "Contents: write" di repo. Silakan generate PAT baru.');
    } else {
      throw new Error('GET ' + r.status + ' ' + (await r.text()));
    }
  }

  // Write codes.json via GitHub API. Butuh PAT.
  // Auto-retry sekali kalau kena 409 Conflict (re-fetch SHA terbaru lalu PUT ulang).
  async function writeAuth(codesArray, message) {
    const pat = getPAT();
    if (!pat) throw new Error('GitHub PAT belum diset. Setup di Admin → Kode Aktivasi → Sinkronisasi.');
    const headers = {
      Authorization: 'token ' + pat,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    };

    // Step 1: ambil SHA terbaru.
    let sha = null;
    try {
      const cur = await fetchCurrentSha(headers);
      sha = cur.sha;
    } catch (e) {
      throw e;
    }

    // Step 2: build payload + body.
    const payload = {
      codes: codesArray,
      updatedAt: new Date().toISOString(),
    };
    const contentB64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload, null, 2))));
    const buildBody = (currentSha) => {
      const body = {
        message: message || 'sync codes.json ' + new Date().toISOString(),
        content: contentB64,
        branch: REPO_BRANCH,
      };
      if (currentSha) body.sha = currentSha;
      return JSON.stringify(body);
    };

    // Step 3: PUT — kalau 409 Conflict, re-fetch SHA lalu retry sekali.
    let r = await fetch(apiUrl(), { method: 'PUT', headers, body: buildBody(sha) });
    if (r.status === 409) {
      console.warn('[GithubSync] 409 Conflict, refetching SHA + retry...');
      try {
        const cur2 = await fetchCurrentSha(headers);
        sha = cur2.sha;
      } catch (e) {
        throw new Error('Konflik: gagal ambil SHA terbaru saat retry. ' + e.message);
      }
      r = await fetch(apiUrl(), { method: 'PUT', headers, body: buildBody(sha) });
    }
    if (!r.ok) {
      const txt = await r.text();
      if (r.status === 401) throw new Error('PAT salah atau expired.');
      if (r.status === 403) throw new Error('PAT tidak punya scope "Contents: write" di repo ini.');
      if (r.status === 409) throw new Error('Konflik berulang: kode di gh-pages terus diubah dari device lain selama proses push. Refresh halaman lalu coba lagi.');
      throw new Error('PUT gagal: ' + r.status + ' ' + txt);
    }
    return await r.json();
  }

  // Test PAT — coba fetch repo info. Return {ok, message}.
  async function testPAT() {
    const pat = getPAT();
    if (!pat) return { ok: false, message: 'PAT belum diset.' };
    try {
      const r = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
        headers: { Authorization: 'token ' + pat, Accept: 'application/vnd.github.v3+json' },
      });
      if (r.status === 401) return { ok: false, message: 'PAT salah atau expired.' };
      if (r.status === 404) return { ok: false, message: 'Repo tidak ditemukan atau PAT tidak punya akses.' };
      if (!r.ok) return { ok: false, message: 'Status ' + r.status };
      const j = await r.json();
      return { ok: true, message: 'OK — repo: ' + j.full_name + ' (' + j.private ? 'private' : 'public' + ')' };
    } catch (e) {
      return { ok: false, message: 'Network error: ' + e.message };
    }
  }

  // Boot-time: fetch codes.json publik, simpan di window.REMOTE_CODES.
  // Dipanggil di app.js boot.
  async function refreshFromPublic() {
    const data = await readPublic();
    if (data && Array.isArray(data.codes)) {
      window.REMOTE_CODES = data.codes;
      window.REMOTE_CODES_UPDATED_AT = data.updatedAt || null;
      console.log('[GithubSync] loaded', data.codes.length, 'remote codes (updated:', data.updatedAt + ')');
    } else {
      window.REMOTE_CODES = [];
    }
    return data;
  }

  // Push current local codes ke gh-pages (kalau PAT terkonfigurasi).
  // Best-effort: kalau gagal, log warning tapi local op tetap berhasil.
  async function pushIfConfigured(codesArray, message) {
    if (!hasPAT()) return { synced: false, reason: 'no-pat' };
    try {
      await writeAuth(codesArray, message);
      // Refresh local cache dari yang baru saja kita push
      window.REMOTE_CODES = codesArray.slice();
      window.REMOTE_CODES_UPDATED_AT = new Date().toISOString();
      return { synced: true };
    } catch (e) {
      console.error('[GithubSync] push failed:', e.message);
      return { synced: false, reason: 'error', error: e.message };
    }
  }

  window.GithubSync = {
    REPO_OWNER, REPO_NAME, REPO_BRANCH, CODES_PATH,
    getPAT, setPAT, clearPAT, hasPAT,
    readPublic, writeAuth, testPAT,
    refreshFromPublic, pushIfConfigured,
  };
})();
