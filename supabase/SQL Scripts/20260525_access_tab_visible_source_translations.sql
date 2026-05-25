-- Refined source labels for the "Final visible courses" section on
-- the user Access tab. Previously the badge was either "Program" or
-- "Override" (a catch-all). Now we distinguish 3 cases so the admin
-- sees *exactly* why each course is visible.
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
       'admin.users.activity.access.visible.fromProgramNoName',
       'admin.users.activity.access.visible.fromCourseEnrollment',
       'admin.users.activity.access.visible.sourceCourseEnrollment',
       'admin.users.activity.access.visible.sourceManualGrant'
     );

  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'admin.users.activity.access.visible.fromProgramNoName',     'From a program',                                 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.users.activity.access.visible.fromProgramNoName',     'מתוכנית',                                          'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.users.activity.access.visible.fromCourseEnrollment',  'Direct course enrollment',                       'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.users.activity.access.visible.fromCourseEnrollment',  'הרשמה ישירה לקורס',                                 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.users.activity.access.visible.sourceCourseEnrollment','Course',                                         'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.users.activity.access.visible.sourceCourseEnrollment','קורס',                                             'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.users.activity.access.visible.sourceManualGrant',     'Manual grant',                                   'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.users.activity.access.visible.sourceManualGrant',     'הענקה ידנית',                                       'admin', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Visible courses refined-source translations added successfully';
END$$;
