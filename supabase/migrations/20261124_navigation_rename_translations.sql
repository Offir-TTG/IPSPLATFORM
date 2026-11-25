-- Navigation editor: the message when a menu name is saved empty, and the
-- drag handle's label. In he + en.
-- The Hebrew is written as U&'\05E9...' character codes, so the file is plain ASCII and
-- cannot be scrambled when pasted in the SQL editor. Postgres stores the same Hebrew text.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'navigation.nameRequired', 'Type a name before saving'),
  ('he', 'navigation.nameRequired', U&'\05DB\05EA\05D1\05D5 \05E9\05DD \05DC\05E4\05E0\05D9 \05D4\05E9\05DE\05D9\05E8\05D4'),
  ('en', 'navigation.dragToMove', 'Drag to move'),
  ('he', 'navigation.dragToMove', U&'\05D2\05E8\05E8\05D5 \05DB\05D3\05D9 \05DC\05D4\05D6\05D9\05D6')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
