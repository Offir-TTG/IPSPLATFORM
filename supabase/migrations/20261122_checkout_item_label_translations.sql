-- Payment summary: what is being bought, by product type (it always said "Course").
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'user', NOW(), NOW()
FROM (VALUES
  ('en', 'user.payments.checkout.item.club', 'Club'),
  ('he', 'user.payments.checkout.item.club', U&'\05DE\05D5\05E2\05D3\05D5\05DF'),
  ('en', 'user.payments.checkout.item.program', 'Program'),
  ('he', 'user.payments.checkout.item.program', U&'\05EA\05D5\05DB\05E0\05D9\05EA'),
  ('en', 'user.payments.checkout.item.lecture', 'Lecture'),
  ('he', 'user.payments.checkout.item.lecture', U&'\05D4\05E8\05E6\05D0\05D4'),
  ('en', 'user.payments.checkout.item.workshop', 'Workshop'),
  ('he', 'user.payments.checkout.item.workshop', U&'\05E1\05D3\05E0\05D4'),
  ('en', 'user.payments.checkout.item.webinar', 'Webinar'),
  ('he', 'user.payments.checkout.item.webinar', U&'\05D5\05D5\05D1\05D9\05E0\05E8'),
  ('en', 'user.payments.checkout.item.session', 'Session'),
  ('he', 'user.payments.checkout.item.session', U&'\05DE\05E4\05D2\05E9'),
  ('en', 'user.payments.checkout.item.session_pack', 'Session pack'),
  ('he', 'user.payments.checkout.item.session_pack', U&'\05D7\05D1\05D9\05DC\05EA \05DE\05E4\05D2\05E9\05D9\05DD'),
  ('en', 'user.payments.checkout.item.bundle', 'Course bundle'),
  ('he', 'user.payments.checkout.item.bundle', U&'\05D7\05D1\05D9\05DC\05EA \05E7\05D5\05E8\05E1\05D9\05DD'),
  ('en', 'user.payments.checkout.item.product', 'Product'),
  ('he', 'user.payments.checkout.item.product', U&'\05DE\05D5\05E6\05E8')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
