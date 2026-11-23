-- Coaching drawer: added-session offers the client answered.
-- Hebrew as U&'..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.coaching.drawer.offerApproved', U&'The {who} approved {n} more sessions ({price} per session) \00B7 {date}'),
  ('he', 'admin.coaching.drawer.offerApproved', U&'\05D4{who} \05D0\05D9\05E9\05E8/\05D4 {n} \05DE\05E4\05D2\05E9\05D9\05DD \05E0\05D5\05E1\05E4\05D9\05DD ({price} \05DC\05DE\05E4\05D2\05E9) \00B7 {date}'),
  ('en', 'admin.coaching.drawer.offerDeclined', U&'The {who} did not approve the offer of {n} more sessions \00B7 {date}'),
  ('he', 'admin.coaching.drawer.offerDeclined', U&'\05D4{who} \05DC\05D0 \05D0\05D9\05E9\05E8/\05D4 \05D0\05EA \05D4\05D4\05E6\05E2\05D4 \05DC-{n} \05DE\05E4\05D2\05E9\05D9\05DD \05E0\05D5\05E1\05E4\05D9\05DD \00B7 {date}'),
  ('en', 'admin.coaching.drawer.offerGift', U&'{n} sessions added as a gift \00B7 {date}'),
  ('he', 'admin.coaching.drawer.offerGift', U&'\05E0\05D5\05E1\05E4\05D5 {n} \05DE\05E4\05D2\05E9\05D9\05DD \05D1\05DE\05EA\05E0\05D4 \00B7 {date}')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
