-- Enrollments: the CRM tag filter. In he + en. Adds only missing keys; safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW() FROM (VALUES
  ('en', 'admin.enrollments.crmTag', 'CRM tag'),
  ('he', 'admin.enrollments.crmTag', U&'\05EA\05D2\05D9\05EA CRM'),
  ('en', 'admin.enrollments.crmTagSearch', 'Search a tag...'),
  ('he', 'admin.enrollments.crmTagSearch', U&'\05D7\05D9\05E4\05D5\05E9 \05EA\05D2\05D9\05EA...'),
  ('en', 'admin.enrollments.crmTagNone', 'No tag by that name.'),
  ('he', 'admin.enrollments.crmTagNone', U&'\05DC\05D0 \05E0\05DE\05E6\05D0\05D4 \05EA\05D2\05D9\05EA \05D1\05E9\05DD \05D4\05D6\05D4.'),
  ('en', 'admin.enrollments.allTags', 'All tags'),
  ('he', 'admin.enrollments.allTags', U&'\05DB\05DC \05D4\05EA\05D2\05D9\05D5\05EA')
) AS v(lang, key, value) WHERE NOT EXISTS (SELECT 1 FROM translations t WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL);
