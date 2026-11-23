-- Open-a-package wizard: the note when some packages have no service set.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.coaching.newPack.someUntyped', 'Packages with no service set (parent or child coaching) show for both services. Set the service on the product.'),
  ('he', 'admin.coaching.newPack.someUntyped', U&'\05D7\05D1\05D9\05DC\05D5\05EA \05E9\05DC\05D0 \05D4\05D5\05D2\05D3\05E8 \05DC\05D4\05DF \05E9\05D9\05E8\05D5\05EA (\05DC\05D9\05D5\05D5\05D9 \05D4\05D5\05E8\05D9 \05D0\05D5 \05DC\05D9\05D5\05D5\05D9 \05D9\05DC\05D3) \05DE\05D5\05E6\05D2\05D5\05EA \05D1\05E9\05E0\05D9 \05D4\05E9\05D9\05E8\05D5\05EA\05D9\05DD. \05DE\05D2\05D3\05D9\05E8\05D9\05DD \05D0\05EA \05D4\05E9\05D9\05E8\05D5\05EA \05D1\05DE\05D5\05E6\05E8.')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
