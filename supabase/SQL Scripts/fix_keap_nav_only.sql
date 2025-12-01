-- Quick fix: Add back Keap navigation translations
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.nav.keap', 'Keap CRM', 'admin', NOW(), NOW()),
('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.nav.keap.dashboard', 'Keap Dashboard', 'admin', NOW(), NOW()),
('70d86807-7e7c-49cd-8601-98235444e2ac', 'en', 'admin.nav.keap.tags', 'Tags', 'admin', NOW(), NOW()),
('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.nav.keap', 'Keap CRM', 'admin', NOW(), NOW()),
('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.nav.keap.dashboard', 'לוח בקרה Keap', 'admin', NOW(), NOW()),
('70d86807-7e7c-49cd-8601-98235444e2ac', 'he', 'admin.nav.keap.tags', 'תגיות', 'admin', NOW(), NOW())
ON CONFLICT (language_code, translation_key) DO NOTHING;
