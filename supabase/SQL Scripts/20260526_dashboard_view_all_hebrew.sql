-- Hebrew translations for the "View all" / short labels on the
-- dashboard tabs (Attendance + Grades + Upcoming Sessions). These
-- keys were referenced in the React components but had no Hebrew
-- translation in any existing seed, so RTL users saw the English
-- fallback. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'user.dashboard.attendance.viewAll',
      'user.dashboard.attendance.viewAllShort',
      'user.dashboard.sessions.calendar',
      'user.dashboard.grades.viewAllLong',
      'user.dashboard.grades.viewAllShort'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- Attendance tab — long label on sm+, short label on phones
    ('en', 'user.dashboard.attendance.viewAll',      'View All Attendance', 'user', NULL, 'user'),
    ('he', 'user.dashboard.attendance.viewAll',      'הצג את כל הנוכחות',     'user', NULL, 'user'),

    ('en', 'user.dashboard.attendance.viewAllShort', 'View All',            'user', NULL, 'user'),
    ('he', 'user.dashboard.attendance.viewAllShort', 'הצג הכול',             'user', NULL, 'user'),

    -- Grades tab — same two-tier pattern as Attendance
    ('en', 'user.dashboard.grades.viewAllLong',      'View all grades',     'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.viewAllLong',      'הצג את כל הציונים',     'user', NULL, 'user'),

    ('en', 'user.dashboard.grades.viewAllShort',     'View All',            'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.viewAllShort',     'הצג הכול',             'user', NULL, 'user'),

    -- Upcoming Sessions tab — mobile short label for the calendar link
    ('en', 'user.dashboard.sessions.calendar',       'Calendar',            'user', NULL, 'user'),
    ('he', 'user.dashboard.sessions.calendar',       'יומן',                 'user', NULL, 'user');
END $$;
