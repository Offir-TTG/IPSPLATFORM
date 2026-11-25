-- Product editor: the "Club" type card (a course product sold as a monthly membership). In he + en.
-- Hebrew is written as U& character codes, so the file is plain ASCII.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'products.type.club', 'Club'),
  ('he', 'products.type.club', U&'\05DE\05D5\05E2\05D3\05D5\05DF'),
  ('en', 'products.picker.clubLabel', 'Which course is the club?'),
  ('he', 'products.picker.clubLabel', U&'\05D0\05D9\05D6\05D4 \05E7\05D5\05E8\05E1 \05D4\05D5\05D0 \05D4\05DE\05D5\05E2\05D3\05D5\05DF?'),
  ('en', 'products.picker.clubHint', 'The club is a course with its meetings and recordings. Its payment is a monthly membership ("Club membership").'),
  ('he', 'products.picker.clubHint', U&'\05D4\05DE\05D5\05E2\05D3\05D5\05DF \05D4\05D5\05D0 \05E7\05D5\05E8\05E1, \05E2\05DD \05D4\05DE\05E4\05D2\05E9\05D9\05DD \05D5\05D4\05D4\05E7\05DC\05D8\05D5\05EA \05E9\05DC\05D5. \05D4\05EA\05E9\05DC\05D5\05DD \05E9\05DC\05D5 \05D4\05D5\05D0 \05DE\05E0\05D5\05D9 \05D7\05D5\05D3\05E9\05D9 ("\05D7\05D1\05E8\05D5\05EA \05D1\05DE\05D5\05E2\05D3\05D5\05DF").')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
