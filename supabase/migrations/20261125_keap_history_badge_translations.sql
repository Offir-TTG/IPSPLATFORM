INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, 'admin', NOW(), NOW() FROM (VALUES
  ('en', 'admin.keapHistory.badge.portal', 'Portal client'),
  ('he', 'admin.keapHistory.badge.portal', U&'\05DC\05E7\05D5\05D7 \05D1\05E4\05D5\05E8\05D8\05DC'),
  ('en', 'admin.keapHistory.badge.portalHint', 'This email is a client in the portal. Open the client.'),
  ('he', 'admin.keapHistory.badge.portalHint', U&'\05D4\05DE\05D9\05D9\05DC \05D4\05D6\05D4 \05E9\05D9\05D9\05DA \05DC\05DC\05E7\05D5\05D7 \05D1\05E4\05D5\05E8\05D8\05DC. \05DC\05D7\05D9\05E6\05D4 \05E4\05D5\05EA\05D7\05EA \05D0\05EA \05D4\05DC\05E7\05D5\05D7.'),
  ('en', 'admin.keapHistory.badge.crm', 'In CRM'),
  ('he', 'admin.keapHistory.badge.crm', U&'\05D1-CRM'),
  ('en', 'admin.keapHistory.badge.crmArchived', 'In CRM (archived)'),
  ('he', 'admin.keapHistory.badge.crmArchived', U&'\05D1-CRM (\05D1\05D0\05E8\05DB\05D9\05D5\05DF)'),
  ('en', 'admin.keapHistory.badge.crmHint', 'This email is a contact in the CRM. Opens the CRM in a new tab.'),
  ('he', 'admin.keapHistory.badge.crmHint', U&'\05D4\05DE\05D9\05D9\05DC \05D4\05D6\05D4 \05E9\05D9\05D9\05DA \05DC\05D0\05D9\05E9 \05E7\05E9\05E8 \05D1-CRM. \05E0\05E4\05EA\05D7 \05D1\05DC\05E9\05D5\05E0\05D9\05EA \05D7\05D3\05E9\05D4.')
) AS v(lang, key, value) WHERE NOT EXISTS (SELECT 1 FROM translations t WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL);
