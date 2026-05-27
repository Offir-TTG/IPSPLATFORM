-- New /grades user page (mirrors notifications / attendance / calendar
-- pattern). Keys: page title + subtitle, error/empty states, the three
-- stats labels, and the four filter-tab labels. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'user.grades.title',
      'user.grades.subtitle',
      'user.grades.errorTitle',
      'user.grades.errorMessage',
      'user.grades.retry',
      'user.grades.noRecords',
      'user.grades.stats.total',
      'user.grades.stats.graded',
      'user.grades.stats.average',
      'user.grades.filter.all',
      'user.grades.filter.graded',
      'user.grades.filter.pending',
      'user.grades.filter.excused'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'user.grades.title',          'My Grades',                                  'user', NULL, 'user'),
    ('he', 'user.grades.title',          'הציונים שלי',                                  'user', NULL, 'user'),

    ('en', 'user.grades.subtitle',       'All your grades across every enrolled course','user', NULL, 'user'),
    ('he', 'user.grades.subtitle',       'כל הציונים בכל הקורסים שלך',                     'user', NULL, 'user'),

    ('en', 'user.grades.errorTitle',     'Error loading grades',                       'user', NULL, 'user'),
    ('he', 'user.grades.errorTitle',     'שגיאה בטעינת הציונים',                          'user', NULL, 'user'),

    ('en', 'user.grades.errorMessage',   'Failed to load your grades. Please try again.','user', NULL, 'user'),
    ('he', 'user.grades.errorMessage',   'טעינת הציונים נכשלה. אנא נסה שוב.',              'user', NULL, 'user'),

    ('en', 'user.grades.retry',          'Retry',                                      'user', NULL, 'user'),
    ('he', 'user.grades.retry',          'נסה שוב',                                      'user', NULL, 'user'),

    ('en', 'user.grades.noRecords',      'No grades yet',                              'user', NULL, 'user'),
    ('he', 'user.grades.noRecords',      'אין ציונים עדיין',                              'user', NULL, 'user'),

    ('en', 'user.grades.stats.total',    'Total',                                      'user', NULL, 'user'),
    ('he', 'user.grades.stats.total',    'סך הכול',                                      'user', NULL, 'user'),

    ('en', 'user.grades.stats.graded',   'Graded',                                     'user', NULL, 'user'),
    ('he', 'user.grades.stats.graded',   'הוערכו',                                       'user', NULL, 'user'),

    ('en', 'user.grades.stats.average',  'Average',                                    'user', NULL, 'user'),
    ('he', 'user.grades.stats.average',  'ממוצע',                                        'user', NULL, 'user'),

    ('en', 'user.grades.filter.all',     'All',                                        'user', NULL, 'user'),
    ('he', 'user.grades.filter.all',     'הכול',                                         'user', NULL, 'user'),

    ('en', 'user.grades.filter.graded',  'Graded',                                     'user', NULL, 'user'),
    ('he', 'user.grades.filter.graded',  'הוערכו',                                       'user', NULL, 'user'),

    ('en', 'user.grades.filter.pending', 'Pending',                                    'user', NULL, 'user'),
    ('he', 'user.grades.filter.pending', 'ממתינים',                                       'user', NULL, 'user'),

    ('en', 'user.grades.filter.excused', 'Excused',                                    'user', NULL, 'user'),
    ('he', 'user.grades.filter.excused', 'פטור',                                         'user', NULL, 'user');
END $$;
