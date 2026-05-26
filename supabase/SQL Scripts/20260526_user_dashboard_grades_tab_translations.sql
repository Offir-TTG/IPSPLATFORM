-- Translations for the new "Grades" tab on the user dashboard
-- (sits next to Upcoming Sessions and Attendance). Letter grades and
-- percentages come from student_grades.letter_grade / .percentage,
-- which the backfill writes against each course's grading_scale_id —
-- no client-side computation. These keys are only for tab labels,
-- empty states, and the status badge. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'user.dashboard.grades.title',
      'user.dashboard.grades.noRecords',
      'user.dashboard.grades.checkLater',
      'user.dashboard.grades.record',
      'user.dashboard.grades.records',
      'user.dashboard.grades.viewAll',
      'user.dashboard.grades.status.excused',
      'user.dashboard.grades.status.graded',
      'user.dashboard.grades.status.submitted',
      'user.dashboard.grades.status.not_submitted',
      'user.dashboard.grades.status.late'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'user.dashboard.grades.title',         'Grades',                                                          'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.title',         'ציונים',                                                            'user', NULL, 'user'),

    ('en', 'user.dashboard.grades.noRecords',     'No grades yet',                                                   'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.noRecords',     'אין ציונים עדיין',                                                   'user', NULL, 'user'),

    ('en', 'user.dashboard.grades.checkLater',    'Your grades will appear here once instructors post them',         'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.checkLater',    'הציונים שלך יופיעו כאן ברגע שהמרצים יפרסמו אותם',                       'user', NULL, 'user'),

    ('en', 'user.dashboard.grades.record',        'graded item',                                                     'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.record',        'פריט מדורג',                                                         'user', NULL, 'user'),

    ('en', 'user.dashboard.grades.records',       'graded items',                                                    'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.records',       'פריטים מדורגים',                                                       'user', NULL, 'user'),

    ('en', 'user.dashboard.grades.viewAll',       'View all grades',                                                 'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.viewAll',       'הצג את כל הציונים',                                                   'user', NULL, 'user'),

    ('en', 'user.dashboard.grades.status.excused',       'Excused',         'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.status.excused',       'פטור',             'user', NULL, 'user'),

    ('en', 'user.dashboard.grades.status.graded',        'Graded',          'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.status.graded',        'הוערך',            'user', NULL, 'user'),

    ('en', 'user.dashboard.grades.status.submitted',     'Submitted',       'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.status.submitted',     'הוגש',             'user', NULL, 'user'),

    ('en', 'user.dashboard.grades.status.not_submitted', 'Not submitted',   'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.status.not_submitted', 'לא הוגש',           'user', NULL, 'user'),

    ('en', 'user.dashboard.grades.status.late',          'Late',            'user', NULL, 'user'),
    ('he', 'user.dashboard.grades.status.late',          'באיחור',            'user', NULL, 'user');
END $$;
