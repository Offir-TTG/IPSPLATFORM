-- Products: their own picture, shown on the product's card in the client portal. In he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'products.cardImage', 'Product picture'),
  ('he', 'products.cardImage', U&'\05EA\05DE\05D5\05E0\05EA \05D4\05DE\05D5\05E6\05E8'),
  ('en', 'products.cardImageHint', 'Shown on this product''s card in the client portal. PNG, JPG, GIF or WEBP, up to 20MB.'),
  ('he', 'products.cardImageHint', U&'\05DE\05D5\05E6\05D2\05EA \05D1\05DB\05E8\05D8\05D9\05E1 \05E9\05DC \05D4\05DE\05D5\05E6\05E8 \05D1\05E4\05D5\05E8\05D8\05DC \05D4\05DC\05E7\05D5\05D7\05D5\05EA. PNG, JPG, GIF \05D0\05D5 WEBP, \05E2\05D3 20MB.')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
