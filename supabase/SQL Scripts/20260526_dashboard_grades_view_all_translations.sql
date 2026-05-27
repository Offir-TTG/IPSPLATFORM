-- "View all grades" link on the dashboard's Grades tab (header
-- right-side, matches the Attendance tab pattern). Two-tier label so
-- the link doesn't crowd narrow phones. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'user.dashboard.grades.viewAllLong',
      'user.dashboard.grades.viewAllShort'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'user.dashboard.grades.viewAllLong',  'View all grades', 'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.viewAllLong',  'הצג את כל הציונים', 'user', NULL, 'user'),

    ('en', 'user.dashboard.grades.viewAllShort', 'View All',         'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.viewAllShort', 'הצג הכול',          'user', NULL, 'user');
END $$;
