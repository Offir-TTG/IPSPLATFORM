-- Labels for the 'client' role value (the renamed 'student' role): "Client" / "לקוח".
-- Hebrew as U&'\05..' codes so the file stays plain ASCII. Adds only missing keys. Safe to rerun.
INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
SELECT NULL, v.lang, v.key, v.value, v.ctx, NOW(), NOW()
FROM (VALUES
  ('en', 'admin.users.roles.client', 'Client', 'admin'),
  ('he', 'admin.users.roles.client', U&'\05DC\05E7\05D5\05D7', 'admin'),
  ('en', 'admin.users.filters.role_client', 'Client', 'admin'),
  ('he', 'admin.users.filters.role_client', U&'\05DC\05E7\05D5\05D7', 'admin'),
  ('en', 'admin.users.drawer.role.client', 'Client', 'admin'),
  ('he', 'admin.users.drawer.role.client', U&'\05DC\05E7\05D5\05D7', 'admin'),
  ('en', 'admin.users.role_client', 'Client', 'admin'),
  ('he', 'admin.users.role_client', U&'\05DC\05E7\05D5\05D7', 'admin'),
  ('en', 'triggers.role.client', 'Client', 'admin'),
  ('he', 'triggers.role.client', U&'\05DC\05E7\05D5\05D7', 'admin'),
  ('en', 'user.profile.role.client', 'Client', 'user'),
  ('he', 'user.profile.role.client', U&'\05DC\05E7\05D5\05D7', 'user')
) AS v(lang, key, value, ctx)
WHERE NOT EXISTS (
  SELECT 1 FROM translations t
  WHERE t.translation_key = v.key AND t.language_code = v.lang AND t.tenant_id IS NULL
);
