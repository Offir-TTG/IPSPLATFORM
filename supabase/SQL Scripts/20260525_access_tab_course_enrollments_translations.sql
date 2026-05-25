-- Translations for the new "Course enrollments" section on the user
-- Access tab. Surfaces direct course enrollments (product.type='course')
-- that previously had no top-level visibility.
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
     AND translation_key LIKE 'admin.users.activity.access.courses.%';

  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    ('en', 'admin.users.activity.access.courses.title',        'Course enrollments',                                          'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.users.activity.access.courses.title',        'הרשמות לקורסים',                                                'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.users.activity.access.courses.description',  'Courses this user is enrolled in directly (outside of any program)', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.users.activity.access.courses.description',  'קורסים שמשתמש זה רשום אליהם ישירות (מחוץ לתוכנית כלשהי)',         'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.users.activity.access.courses.empty',        'No direct course enrollments',                                'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.users.activity.access.courses.empty',        'אין הרשמות ישירות לקורסים',                                     'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.users.activity.access.courses.enrolledOn',   'Enrolled',                                                    'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.users.activity.access.courses.enrolledOn',   'נרשם',                                                          'admin', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Access tab — course enrollments translations added successfully';
END$$;
