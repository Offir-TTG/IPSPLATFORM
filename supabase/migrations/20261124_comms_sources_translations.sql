-- Communications: the website contact form as a source in the send log and overview.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.comms.source.contact', 'Website contact form'),
  ('he', 'admin.comms.source.contact', U&'\05E4\05E0\05D9\05D9\05D4 \05DE\05D4\05D0\05EA\05E8'),
  ('en', 'admin.comms.log.contact', 'Sent to the school'),
  ('he', 'admin.comms.log.contact', U&'\05E0\05E9\05DC\05D7 \05DC\05E2\05E1\05E7')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.tenant_id IS NULL AND t.language_code = v.lang AND t.translation_key = v.key
);
