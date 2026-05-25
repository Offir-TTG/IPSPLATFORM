-- Translations for the per-cron toggle switches on /admin/crons.
-- Reminder: column is `context`, not `category` (filter on the
-- translations API is `context IN ('admin','both')`).
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;
  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  DELETE FROM translations
   WHERE tenant_id = tenant_uuid
     AND translation_key IN (
       'admin.crons.toggle.enabled',
       'admin.crons.toggle.disabled',
       'admin.crons.toggle.dryRun',
       'admin.crons.status.disabled',
       'admin.crons.filterByCron'
     );

  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'admin.crons.toggle.enabled',   'Enabled',                'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.toggle.enabled',   'פעיל',                   'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.toggle.disabled',  'Disabled',               'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.toggle.disabled',  'מושבת',                  'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.toggle.dryRun',    'Dry-run mode',           'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.toggle.dryRun',    'מצב הרצת בדיקה',         'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.status.disabled',  'Disabled',               'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.status.disabled',  'מושבת',                  'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.crons.filterByCron',     'Filter run table by this cron', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.crons.filterByCron',     'סנן את טבלת ההרצות לפי משימה זו', 'admin', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Cron toggle translations added successfully';
END$$;
