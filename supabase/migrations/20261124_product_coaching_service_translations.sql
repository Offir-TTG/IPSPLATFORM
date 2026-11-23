-- Session-pack products: the coaching service and session length.
-- Hebrew as U&'..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'products.coaching.title', 'Which service is this?'),
  ('he', 'products.coaching.title', U&'\05D0\05D9\05D6\05D4 \05E9\05D9\05E8\05D5\05EA \05D6\05D4?'),
  ('en', 'products.coaching.help', 'Decides whether the enrollment picks a child, and where it shows for the client in the portal.'),
  ('he', 'products.coaching.help', U&'\05E7\05D5\05D1\05E2 \05D0\05DD \05D1\05D4\05E8\05E9\05DE\05D4 \05D1\05D5\05D7\05E8\05D9\05DD \05D9\05DC\05D3, \05D5\05D0\05D9\05E4\05D4 \05D6\05D4 \05DE\05D5\05E4\05D9\05E2 \05DC\05DC\05E7\05D5\05D7 \05D1\05E4\05D5\05E8\05D8\05DC.'),
  ('en', 'products.coaching.parentText', 'The parent is coached'),
  ('he', 'products.coaching.parentText', U&'\05D4\05D4\05D5\05E8\05D4 \05E2\05E6\05DE\05D5 \05D1\05DC\05D9\05D5\05D5\05D9'),
  ('en', 'products.coaching.childText', 'The enrollment picks or adds a child'),
  ('he', 'products.coaching.childText', U&'\05D1\05D4\05E8\05E9\05DE\05D4 \05D1\05D5\05D7\05E8\05D9\05DD \05D0\05D5 \05DE\05D5\05E1\05D9\05E4\05D9\05DD \05D9\05DC\05D3'),
  ('en', 'products.coaching.minutes', 'Session length'),
  ('he', 'products.coaching.minutes', U&'\05D0\05D5\05E8\05DA \05DE\05E4\05D2\05E9'),
  ('en', 'products.coaching.minutesN', '{n} minutes'),
  ('he', 'products.coaching.minutesN', U&'{n} \05D3\05E7\05D5\05EA'),
  ('en', 'admin.coaching.newPack.noProducts2', 'There is no pay-per-session session pack for this service yet. Set one up on the Products page (type: session pack, payment: per session).'),
  ('he', 'admin.coaching.newPack.noProducts2', U&'\05E2\05D5\05D3 \05D0\05D9\05DF \05DE\05D5\05E6\05E8 \05E9\05DC \05D7\05D1\05D9\05DC\05EA \05DE\05E4\05D2\05E9\05D9\05DD \05D1\05EA\05E9\05DC\05D5\05DD \05DC\05E4\05D9 \05DE\05E4\05D2\05E9 \05DC\05E9\05D9\05E8\05D5\05EA \05D4\05D6\05D4. \05DE\05D2\05D3\05D9\05E8\05D9\05DD \05D0\05D5\05EA\05D5 \05D1\05E2\05DE\05D5\05D3 \05D4\05DE\05D5\05E6\05E8\05D9\05DD (\05E1\05D5\05D2: \05D7\05D1\05D9\05DC\05EA \05DE\05E4\05D2\05E9\05D9\05DD, \05EA\05E9\05DC\05D5\05DD: \05DC\05E4\05D9 \05DE\05E4\05D2\05E9).')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
