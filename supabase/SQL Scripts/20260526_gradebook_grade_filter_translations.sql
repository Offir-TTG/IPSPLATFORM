-- Additional gradebook translations: rename Total → Grade per design
-- feedback, plus the new grade-range filter + selective export keys.
-- Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.grading.gradebook.grade',
      'admin.grading.gradebook.total',
      'admin.grading.gradebook.gradeRange',
      'admin.grading.gradebook.exportSelected',
      'admin.grading.gradebook.selectAll',
      'admin.grading.gradebook.selectStudent'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- New "Grade" column header (replaces the previous "Total"/"סה״כ"
    -- which the admin found unclear).
    ('en', 'admin.grading.gradebook.grade',          'Grade',                 'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.grade',          'ציון',                   'admin', NULL, 'admin'),

    -- Keep the old key alive too in case any other surface still reads it.
    ('en', 'admin.grading.gradebook.total',          'Grade',                 'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.total',          'ציון',                   'admin', NULL, 'admin'),

    -- Range slider label
    ('en', 'admin.grading.gradebook.gradeRange',     'Grade',                 'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.gradeRange',     'ציון',                   'admin', NULL, 'admin'),

    -- Selective export
    ('en', 'admin.grading.gradebook.exportSelected', 'Export ({{n}})',         'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.exportSelected', 'ייצא ({{n}})',            'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.selectAll',      'Select all',             'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.selectAll',      'בחר הכול',                'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.selectStudent',  'Select student',         'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.selectStudent',  'בחר סטודנט',              'admin', NULL, 'admin');
END $$;
