-- Toolbar strings on the /grades page: search placeholder + grade
-- range label. The other toolbar controls (course Select, the four
-- status tabs) reuse keys that already exist. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'user.grades.toolbar.searchPlaceholder',
      'user.grades.toolbar.gradeRange'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'user.grades.toolbar.searchPlaceholder', 'Search assignments or courses', 'user', NULL, 'user'),
    ('he', 'user.grades.toolbar.searchPlaceholder', 'חיפוש מטלות או קורסים',          'user', NULL, 'user'),

    ('en', 'user.grades.toolbar.gradeRange',        'Grade',                          'user', NULL, 'user'),
    ('he', 'user.grades.toolbar.gradeRange',        'ציון',                            'user', NULL, 'user');
END $$;
