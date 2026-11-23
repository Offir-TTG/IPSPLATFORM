-- Open-a-package wizard: the product's tags shown on each package card.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.coaching.newPack.tagsLabel', 'Tags the client gets'),
  ('he', 'admin.coaching.newPack.tagsLabel', U&'\05EA\05D2\05D9\05D5\05EA \05E9\05D4\05DC\05E7\05D5\05D7 \05D9\05E7\05D1\05DC')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
