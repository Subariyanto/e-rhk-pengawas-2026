-- ============================================================
-- PUSAT LISENSI — MIGRATION 08: SEED KODE AKTIVASI e-RHK
-- Project: pusat-lisensi-aplikasi (llaukzsztguwrtwdubpm)
-- Tanggal: 2026-09-26
--
-- Model BARU: 1 kode aktivasi = 1 AKUN, bisa login di semua perangkat (pola PKKM).
-- Agar register_account/login_account bekerja, kode e-RHK harus ada di tabel
-- `licenses` server. Saat ini server hanya punya 1 kode e-RHK (master saja).
-- 86 kode FULL-* di data/codes.json hanya ada di sisi klien.
--
-- Tier server: 'pro' (nilai valid di licenses: 'pro' | 'enterprise'; 'full' DITOLAK
--             oleh constraint licenses_tier_check). 'pro' = lisensi penuh (bukan trial).
-- Sifat: ADDITIVE / NON-DESTRUKTIF, idempotent (ON CONFLICT DO NOTHING).
-- Aman di-rerun. Tidak mengubah tabel/RPC lama.
--
-- CARA PAKAI: Supabase Dashboard -> SQL Editor -> paste -> Run.
-- ============================================================

INSERT INTO licenses (code, app_slug, app_name, tier, max_devices, recipient)
VALUES
  ('FULL-33J8-KU6K-KHJ9', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-49WL-UB3P-T93D', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-4FTE-73TE-V4J9', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-4M57-ECVN-2ZUU', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-59J8-4D9B-VENT', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-5FLU-VU4F-GYCG', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-5HQJ-DBJC-J5U3', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-8H4J-W9K5-9B6Q', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-8KNY-6H3H-Q6PZ', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-8RS7-AWJA-H62U', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-997H-9WW2-ZQFS', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-9J73-L2KT-TBT5', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-9KHC-UUUC-XAUM', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-9TG4-YEKJ-EZCD', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-AFJV-MCQA-DEBS', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-APZ7-VRXX-KUNL', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-AQ22-LPAU-WYWX', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-AR5F-J82B-RVZC', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-AZJ5-549W-N5P2', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-B8QS-9MSJ-BQV4', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-BBQT-GAJP-QAM5', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-BE23-76R8-5T8D', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-BF5W-XN48-VNBE', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-C2QW-BEWP-CVFD', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-CLLN-LR28-3XL5', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-CUN8-XH3S-FGDU', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-D65T-HJNK-TYP9', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-DAMX-P4VD-NPRC', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-DB5S-JE3T-NDXH', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-DC7T-3WBP-5KKJ', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-DMTZ-SPRJ-DJXB', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-DTZG-JWUV-TE83', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-DXQL-BZAG-VB6Q', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-ECNA-GATC-NYAB', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-EFAV-U3HG-K2E3', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-EGVR-9J82-AY3N', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-EMRU-E7PU-GUQ5', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-ES92-5DZL-G7W3', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-FPX4-FH2F-74LK', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-FURZ-NDTE-QPNZ', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-HJFU-ZETT-B9YT', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-HN8S-SHE3-SKC8', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-HV4L-5RFL-MWHC', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-J3MN-2HR9-2EMZ', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-JB6Q-PLER-23KN', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-JGZV-F8UM-FZG4', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-JQ5W-2JGR-EMH2', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-JSFS-Y4EF-XGFB', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-KZXH-AVL3-TR5E', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-LC9J-6PQS-ZH99', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-LKHZ-WDB9-PGAG', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-MMEH-PKJA-9BLE', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-P2GD-TBWG-886U', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-P9KV-CYPR-VNNU', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-PLE8-6ZKU-F66M', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-PPVC-XPQ5-8GH8', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-PZ7A-9KZM-QASF', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-QMKA-UMV7-V622', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-R5Y9-78EC-FZHF', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-RVRF-CSZY-XN8W', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-S9S4-6X3K-CK5E', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-S9SQ-SMG9-2NVF', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-SKGF-BDV5-4QPG', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-SV9T-Z49R-QPYA', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-T3XJ-XUGJ-RVLE', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-T6GD-W3D4-QVX6', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-T93N-BTC9-LMAS', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-TCRV-VQBE-96JX', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-UD7U-FRUY-ZU9U', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-UGBQ-UGMD-L4LX', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-UJT6-8R6W-XFLP', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-UMXC-64ZP-TXFR', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-URCA-2N8M-8CRT', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-VEZA-F5ZB-MFEN', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-VTE9-QZSZ-HE3R', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-VYFA-V28E-TYYN', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-W9BU-DPR3-TXWW', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-X78C-9PF2-6BCB', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-XDWQ-LJAP-DMXB', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-XKRD-MX5N-BKRJ', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-XU9Y-WUXA-5H7A', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-YS2Z-JCNM-L6PM', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-YVUZ-JMS4-YMFU', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-Z5J2-PUTY-GL7T', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-Z87K-7782-483A', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, ''),
  ('FULL-ZJW4-ZN48-6E3P', 'e-rhk-pengawas', 'e-RHK Pengawas', 'pro', 1, '')
ON CONFLICT (code) DO NOTHING;

-- Cek hasil:
SELECT tier, is_active, COUNT(*) AS jumlah FROM licenses
 WHERE app_slug = 'e-rhk-pengawas' GROUP BY tier, is_active ORDER BY jumlah DESC;

