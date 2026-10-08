-- ============================================================
-- PUSAT LISENSI — MIGRATION 11: DATA CLOUD PER AKUN (SYNC LINTAS PERANGKAT)
-- Project: pusat-lisensi-aplikasi (llaukzsztguwrtwdubpm)
-- Tanggal: 2026-09-27
--
-- Tujuan:
--   Menyimpan data aplikasi (identitas, madrasah, master_rhk, kegiatan, eviden)
--   di server agar bisa diakses dari perangkat mana pun — GRATIS memakai
--   project Supabase yang sudah dipakai untuk akun & kode aktivasi.
--
--   Lampiran (foto/PDF) TIDAK disimpan di sini (hemat kuota). Lampiran tetap
--   memakai LINK Google Drive pada kolom yang sudah tersedia di aplikasi.
--
-- Model keamanan:
--   * Tabel `user_data` TIDAK bisa diakses langsung oleh anon (RLS tanpa policy).
--   * Semua akses lewat RPC SECURITY DEFINER yang memverifikasi
--     (app_slug + username + sha256(username:password)) — hash yang sama
--     dipakai login_account, jadi tidak ada kredensial baru.
--   * Otorisasi per-akun: user hanya bisa membaca/menulis barisnya sendiri
--     (dipaksa lewat predicate username pada RPC, bukan dari parameter bebas).
--
-- Sifat: ADDITIVE / NON-DESTRUKTIF, idempotent. Aman di-rerun.
-- Tidak mengubah tabel / RPC lama.
--
-- CARA PAKAI: Supabase Dashboard -> SQL Editor -> paste semua -> Run.
-- ============================================================

-- ============================================================
-- 1. TABEL user_data
-- ============================================================
CREATE TABLE IF NOT EXISTS user_data (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_slug    TEXT NOT NULL,
  username    TEXT NOT NULL,
  scope       TEXT NOT NULL,          -- identitas | madrasah | master_rhk | kegiatan | eviden | ...
  periode     INTEGER NOT NULL DEFAULT 0,  -- 0 = non-periodik; 2025/2026 = per tahun
  payload     JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_data_unique UNIQUE (app_slug, username, scope, periode)
);

CREATE INDEX IF NOT EXISTS idx_user_data_lookup ON user_data (app_slug, username);

-- RLS: tidak ada akses langsung dari anon. Semua via RPC SECURITY DEFINER.
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_no_direct_user_data" ON user_data;
-- (tanpa policy = anon tidak punya akses apa pun; RPC SECURITY DEFINER tetap bisa)

-- ============================================================
-- 2. HELPER: verifikasi kredensial akun (username + password hash)
-- ============================================================
DROP FUNCTION IF EXISTS verify_account_key(TEXT, TEXT, TEXT);
CREATE FUNCTION verify_account_key(
  p_app_slug      TEXT,
  p_username      TEXT,
  p_password_hash TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  SELECT (
      a.password_hash IS NOT DISTINCT FROM p_password_hash
      AND a.status = 'active'
      AND COALESCE(l.is_active, false) = true
    )
    INTO v_ok
    FROM app_accounts a
    LEFT JOIN licenses l ON l.id = a.license_id
   WHERE a.app_slug = p_app_slug
     AND lower(a.username) = lower(trim(coalesce(p_username, '')))
   LIMIT 1;
  RETURN COALESCE(v_ok, false);
END;
$$;

-- ============================================================
-- 3. user_data_set — simpan/perbarui 1 entri (upsert)
--    Return: { success, reason, updated_at }
-- ============================================================
DROP FUNCTION IF EXISTS user_data_set(TEXT, TEXT, TEXT, TEXT, INTEGER, JSONB);
CREATE FUNCTION user_data_set(
  p_app_slug      TEXT,
  p_username      TEXT,
  p_password_hash TEXT,
  p_scope         TEXT,
  p_periode       INTEGER,
  p_payload       JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user TEXT;
  v_peri INTEGER;
  v_ts   TIMESTAMPTZ;
BEGIN
  IF NOT verify_account_key(p_app_slug, p_username, p_password_hash) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthorized');
  END IF;
  IF coalesce(trim(p_scope), '') = '' OR p_payload IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_input');
  END IF;

  v_user := lower(trim(p_username));
  v_peri := COALESCE(p_periode, 0);

  INSERT INTO user_data (app_slug, username, scope, periode, payload, updated_at)
  VALUES (p_app_slug, v_user, trim(p_scope), v_peri, p_payload, now())
  ON CONFLICT (app_slug, username, scope, periode)
  DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()
  RETURNING updated_at INTO v_ts;

  RETURN jsonb_build_object('success', true, 'reason', 'ok', 'updated_at', v_ts);
END;
$$;

-- ============================================================
-- 4. user_data_set_bulk — simpan banyak entri sekaligus (1 round-trip)
--    p_items: [ { scope, periode, payload }, ... ]
-- ============================================================
DROP FUNCTION IF EXISTS user_data_set_bulk(TEXT, TEXT, TEXT, JSONB);
CREATE FUNCTION user_data_set_bulk(
  p_app_slug      TEXT,
  p_username      TEXT,
  p_password_hash TEXT,
  p_items         JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user  TEXT;
  v_item  JSONB;
  v_count INTEGER := 0;
  v_ts    TIMESTAMPTZ := now();
BEGIN
  IF NOT verify_account_key(p_app_slug, p_username, p_password_hash) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthorized');
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_input');
  END IF;

  v_user := lower(trim(p_username));

  FOR v_item IN SELECT jsonb_array_elements(p_items) LOOP
    IF coalesce(trim(v_item->>'scope'), '') <> '' AND (v_item->'payload') IS NOT NULL THEN
      INSERT INTO user_data (app_slug, username, scope, periode, payload, updated_at)
      VALUES (
        p_app_slug, v_user, trim(v_item->>'scope'),
        COALESCE((v_item->>'periode')::int, 0), v_item->'payload', now()
      )
      ON CONFLICT (app_slug, username, scope, periode)
      DO UPDATE SET payload = EXCLUDED.payload, updated_at = now();
      v_count := v_count + 1;
    END IF;
  END LOOP;

  -- batasi payload per entri (mis. 2 MB) supaya tidak jadi tempat sampah data
  RETURN jsonb_build_object('success', true, 'reason', 'ok', 'count', v_count, 'updated_at', v_ts);
END;
$$;

-- ============================================================
-- 5. user_data_get — ambil semua data milik 1 akun
--    Return: { success, reason, rows: [ { scope, periode, payload, updated_at } ] }
-- ============================================================
DROP FUNCTION IF EXISTS user_data_get(TEXT, TEXT, TEXT);
CREATE FUNCTION user_data_get(
  p_app_slug      TEXT,
  p_username      TEXT,
  p_password_hash TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows JSONB;
BEGIN
  IF NOT verify_account_key(p_app_slug, p_username, p_password_hash) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'unauthorized', 'rows', '[]'::jsonb);
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'scope', scope,
           'periode', periode,
           'payload', payload,
           'updated_at', updated_at
         ) ORDER BY scope, periode), '[]'::jsonb)
    INTO v_rows
    FROM user_data
   WHERE app_slug = p_app_slug
     AND username = lower(trim(p_username));

  RETURN jsonb_build_object('success', true, 'reason', 'ok', 'rows', v_rows);
END;
$$;

-- ============================================================
-- 6. admin_user_data_stats — ringkasan pemakaian (opsional, panel admin)
-- ============================================================
DROP FUNCTION IF EXISTS admin_user_data_stats(TEXT, TEXT);
CREATE FUNCTION admin_user_data_stats(
  p_admin_key TEXT,
  p_app_slug  TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_users INT; v_rows INT; v_bytes BIGINT;
BEGIN
  IF NOT verify_admin_key(p_admin_key) THEN
    RETURN jsonb_build_object('success', false, 'reason', 'invalid_admin_key');
  END IF;
  SELECT COUNT(DISTINCT username), COUNT(*), COALESCE(SUM(pg_column_size(payload)), 0)
    INTO v_users, v_rows, v_bytes
    FROM user_data
   WHERE p_app_slug IS NULL OR app_slug = p_app_slug;
  RETURN jsonb_build_object('success', true,
    'users_with_data', v_users,
    'rows', v_rows,
    'bytes', v_bytes);
END;
$$;

-- ============================================================
-- VERIFIKASI — harus mengembalikan 4 baris function
-- ============================================================
SELECT proname
FROM pg_proc
WHERE proname IN ('verify_account_key', 'user_data_set', 'user_data_set_bulk', 'user_data_get', 'admin_user_data_stats')
ORDER BY proname;
