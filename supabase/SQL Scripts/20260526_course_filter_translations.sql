-- "All courses" dropdown option for the combined /grades and
-- /attendance pages (which now support a ?course=<id> filter so the
-- old per-course pages can redirect into them). Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'user.grades.filter.allCourses',
      'user.attendance.filter.allCourses'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'user.grades.filter.allCourses',     'All courses', 'user', NULL, 'user'),
    ('he', 'user.grades.filter.allCourses',     'כל הקורסים',   'user', NULL, 'user'),

    ('en', 'user.attendance.filter.allCourses', 'All courses', 'user', NULL, 'user'),
    ('he', 'user.attendance.filter.allCourses', 'כל הקורסים',   'user', NULL, 'user');
END $$;
