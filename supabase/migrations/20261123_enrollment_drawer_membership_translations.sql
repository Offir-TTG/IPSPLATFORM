-- Enrollment drawer: a membership's kind, its next scheduled charge, and its end date.
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.enrollments.drawer.membershipMonthly', 'Monthly membership'),
  ('he', 'admin.enrollments.drawer.membershipMonthly', U&'\05DE\05E0\05D5\05D9 \05D7\05D5\05D3\05E9\05D9'),
  ('en', 'admin.enrollments.drawer.membershipYearly', 'Yearly membership'),
  ('he', 'admin.enrollments.drawer.membershipYearly', U&'\05DE\05E0\05D5\05D9 \05E9\05E0\05EA\05D9'),
  ('en', 'admin.enrollments.drawer.scheduled', 'Scheduled'),
  ('he', 'admin.enrollments.drawer.scheduled', U&'\05DE\05EA\05D5\05DB\05E0\05DF'),
  ('en', 'admin.enrollments.drawer.endsOn', 'Ends {date}'),
  ('he', 'admin.enrollments.drawer.endsOn', U&'\05DE\05E1\05EA\05D9\05D9\05DD \05D1-{date}')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
