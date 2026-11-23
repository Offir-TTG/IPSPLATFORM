-- Integrations page as cards (like the Settings page): group names, card
-- statuses and the way back to the cards, in he + en.
-- The page carries English fallbacks, so it works before this runs.
-- Adds only missing keys; existing translations are never changed. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW()
FROM (VALUES
  ('en', 'admin.integrations.group.email', 'Email'),
  ('he', 'admin.integrations.group.email', 'דוא"ל'),
  ('en', 'admin.integrations.group.payments', 'Payments'),
  ('he', 'admin.integrations.group.payments', 'תשלומים'),
  ('en', 'admin.integrations.group.signatures', 'Signatures'),
  ('he', 'admin.integrations.group.signatures', 'חתימות'),
  ('en', 'admin.integrations.group.video', 'Video meetings'),
  ('he', 'admin.integrations.group.video', 'פגישות וידאו'),
  ('en', 'admin.integrations.group.other', 'Other'),
  ('he', 'admin.integrations.group.other', 'אחר'),
  ('en', 'admin.integrations.status.connected', 'Connected'),
  ('he', 'admin.integrations.status.connected', 'מחובר'),
  ('en', 'admin.integrations.status.off', 'Off'),
  ('he', 'admin.integrations.status.off', 'כבוי'),
  ('en', 'admin.integrations.status.notSetUp', 'Not set up'),
  ('he', 'admin.integrations.status.notSetUp', 'לא הוגדר'),
  ('en', 'admin.integrations.allIntegrations', 'All integrations'),
  ('he', 'admin.integrations.allIntegrations', 'כל האינטגרציות')
) AS v(lang, key, value)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
