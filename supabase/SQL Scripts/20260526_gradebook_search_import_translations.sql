-- Translations for the gradebook upgrade: search/filter, pagination,
-- working export, CSV import dialog with dry-run preview. Safe to
-- re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.grading.gradebook.searchPlaceholder',
      'admin.grading.gradebook.allCategories',
      'admin.grading.gradebook.uncategorized',
      'admin.grading.gradebook.studentCount',
      'admin.grading.gradebook.noMatches',
      'admin.grading.gradebook.import.title',
      'admin.grading.gradebook.import.help',
      'admin.grading.gradebook.import.preview',
      'admin.grading.gradebook.import.apply',
      'admin.grading.gradebook.import.applied',
      'admin.grading.gradebook.import.choose',
      'admin.grading.gradebook.import.errors',
      'admin.grading.gradebook.import.changes',
      'admin.grading.gradebook.import.changeCount',
      'admin.grading.gradebook.import.errorCount',
      'common.clear'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.grading.gradebook.searchPlaceholder', 'Search students by name or email', 'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.searchPlaceholder', 'חיפוש לפי שם או דוא״ל',              'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.allCategories',     'All categories',                    'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.allCategories',     'כל הקטגוריות',                       'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.uncategorized',     'Uncategorized',                     'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.uncategorized',     'ללא קטגוריה',                        'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.studentCount',      '{{n}} students',                    'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.studentCount',      '{{n}} סטודנטים',                     'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.noMatches',         'No students match your search',     'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.noMatches',         'אין תוצאות לחיפוש',                   'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.import.title',      'Import grades from CSV',            'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.import.title',      'ייבוא ציונים מקובץ CSV',              'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.import.help',
      'Upload a CSV exported from this gradebook. The importer matches students by Student ID or Email and grade items by column name. Empty cells are left alone; "EXCUSED" marks the grade as excused.',
      'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.import.help',
      'העלה קובץ CSV שיוצא מהגיליון הזה. ההתאמה לסטודנט מתבצעת לפי מזהה או דוא״ל, ולפריט הציון לפי שם העמודה. תאים ריקים לא משנים את הציון הקיים; ערך "EXCUSED" מסמן את הציון כפטור.',
      'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.import.preview',    'Preview changes',                    'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.import.preview',    'תצוגה מקדימה',                        'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.import.apply',      'Apply {{n}} changes',                'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.import.apply',      'החל {{n}} שינויים',                   'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.import.applied',    '{{n}} grade changes applied',        'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.import.applied',    'הוחלו {{n}} שינויי ציון',             'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.import.choose',     'Choose different file',              'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.import.choose',     'בחר קובץ אחר',                        'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.import.errors',     'Issues',                             'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.import.errors',     'בעיות',                                'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.import.changes',    'Changes',                            'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.import.changes',    'שינויים',                              'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.import.changeCount','{{n}} changes',                      'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.import.changeCount','{{n}} שינויים',                        'admin', NULL, 'admin'),

    ('en', 'admin.grading.gradebook.import.errorCount', '{{n}} issues',                       'admin', NULL, 'admin'),
    ('he', 'admin.grading.gradebook.import.errorCount', '{{n}} בעיות',                         'admin', NULL, 'admin'),

    ('en', 'common.clear',                              'Clear',                               'both',  NULL, 'both'),
    ('he', 'common.clear',                              'נקה',                                  'both',  NULL, 'both');
END $$;
