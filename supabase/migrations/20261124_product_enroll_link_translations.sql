-- Product enrollment link: the copy button's name and the short screen
-- shown while the link opens the enrollment. In he + en.
-- The Hebrew (and the ellipsis) is written as U&'\05E9...' character codes, so
-- the file is plain ASCII and cannot be scrambled when pasted in the SQL editor.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, v.ctx, NOW(), NOW()
FROM (VALUES
  ('en', 'admin.products.copyEnrollLink', 'Copy enrollment link', 'admin'),
  ('he', 'admin.products.copyEnrollLink', U&'\05D4\05E2\05EA\05E7\05EA \05E7\05D9\05E9\05D5\05E8 \05DC\05D4\05E8\05E9\05DE\05D4', 'admin'),
  ('en', 'enroll.direct.opening', U&'Opening the enrollment\2026', 'both'),
  ('he', 'enroll.direct.opening', U&'\05E4\05D5\05EA\05D7\05D9\05DD \05D0\05EA \05D4\05D4\05E8\05E9\05DE\05D4\2026', 'both'),
  ('en', 'enroll.direct.notFound', 'This product is not open for enrollment.', 'both'),
  ('he', 'enroll.direct.notFound', U&'\05D4\05DE\05D5\05E6\05E8 \05D4\05D6\05D4 \05D0\05D9\05E0\05D5 \05E4\05EA\05D5\05D7 \05DC\05D4\05E8\05E9\05DE\05D4.', 'both'),
  ('en', 'enroll.direct.failed', 'We couldn''t open the enrollment. Please try again.', 'both'),
  ('he', 'enroll.direct.failed', U&'\05DC\05D0 \05D4\05E6\05DC\05D7\05E0\05D5 \05DC\05E4\05EA\05D5\05D7 \05D0\05EA \05D4\05D4\05E8\05E9\05DE\05D4. \05E0\05E1\05D5 \05E9\05D5\05D1.', 'both'),
  ('en', 'enroll.direct.retry', 'Try again', 'both'),
  ('he', 'enroll.direct.retry', U&'\05E0\05E1\05D5 \05E9\05D5\05D1', 'both')
) AS v(lang, key, value, ctx)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
