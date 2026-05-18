-- Use the academic term "מרצה" (lecturer) for the `user.courses.instructor`
-- label, replacing the older "מדריך" (guide/trainer) seeded by
-- 20250131_add_instructor_label_translation.sql. Better fits the
-- higher-ed tone of the course catalog.

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT id INTO tenant_uuid FROM public.tenants LIMIT 1;

  DELETE FROM public.translations
  WHERE translation_key = 'user.courses.instructor'
    AND tenant_id = tenant_uuid;

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'user.courses.instructor', 'Instructor', 'user', tenant_uuid, 'user'),
    ('he', 'user.courses.instructor', 'מרצה',       'user', tenant_uuid, 'user');
END $$;
