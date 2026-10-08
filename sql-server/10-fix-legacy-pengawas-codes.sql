-- ============================================================
-- PUSAT LISENSI — MIGRATION 10: KOREKSI 2 KODE LEGACY PENGAWAS e-RHK
-- Project: pusat-lisensi-aplikasi (llaukzsztguwrtwdubpm)
--
-- Dua NIP di data sumber (Excel) salah jumlah digit:
--   - M. NUR ROFIQ              : 1971040520050110005 (19) -> 197104052005011005 (18)
--   - Muhammad Yasin Y. Ghozali : 19790101200501108 (17)  -> 197901012005011008 (18)
-- Karena kode legacy = SHA256(secret + ':nip:' + <18 digit NIP>), NIP salah
-- menghasilkan KODE yang salah:
--   - 6E1B-2D9E (salah)  ->  ADCE-9389 (benar)
--   - DA81-D6AB (salah)  ->  101F-B857 (benar)
--
-- Sifat: ADDITIVE & idempotent. Aman di-rerun.
-- ============================================================

-- Hapus 2 kode legacy yang salah (belum diklaim akun mana pun).
DELETE FROM licenses WHERE app_slug='e-rhk-pengawas' AND code='6E1B-2D9E';
DELETE FROM licenses WHERE app_slug='e-rhk-pengawas' AND code='DA81-D6AB';

-- Daftarkan 2 kode legacy yang benar (receiver = NIP 18 digit).
INSERT INTO licenses (code, app_slug, app_name, tier, max_devices, recipient)
VALUES
  ('ADCE-9389','e-rhk-pengawas','e-RHK Pengawas','pro',1,'197104052005011005'),
  ('101F-B857','e-rhk-pengawas','e-RHK Pengawas','pro',1,'197901012005011008')
ON CONFLICT (code) DO NOTHING;

-- Cek hasil: total kode e-rhk harus 146.
SELECT count(*) AS kode_e_rhk FROM licenses WHERE app_slug='e-rhk-pengawas';
