-- Translations for the new "Enrollment tags" section on the user
-- Overview tab. Surfaces Keap tag(s) + CRM tag slug(s) configured on
-- the products this user is enrolled in (the tags that have been or
-- will be applied to their contact at purchase time).
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
     AND translation_key LIKE 'admin.users.activity.overview.tags.%';

  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'admin.users.activity.overview.tags.title',         'Enrollment tags',                                                                'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.users.activity.overview.tags.title',         'תגיות מהרשמות',                                                                  'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.users.activity.overview.tags.empty',
       'No tags assigned yet — products this user has enrolled in have no Keap or CRM tags configured.',
       'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.users.activity.overview.tags.empty',
       'אין תגיות מוקצות עדיין — למוצרים שאליהם נרשם המשתמש לא הוגדרו תגיות Keap או CRM.',
       'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.users.activity.overview.tags.keapHeading',   'Keap tags',                                                                      'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.users.activity.overview.tags.keapHeading',   'תגיות Keap',                                                                      'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.users.activity.overview.tags.crmHeading',    'CRM tags',                                                                       'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.users.activity.overview.tags.crmHeading',    'תגיות CRM',                                                                       'admin', NOW(), NOW(), tenant_uuid),

    -- Hover-title shown on each badge so the admin can trace which
    -- product(s) contributed the tag.
    ('en', 'admin.users.activity.overview.tags.fromProducts',  'From: {{products}}',                                                             'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.users.activity.overview.tags.fromProducts',  'מתוך: {{products}}',                                                              'admin', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Overview enrollment-tags translations added successfully';
END$$;
