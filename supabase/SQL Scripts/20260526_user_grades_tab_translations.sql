-- Translations for the rewritten Grades tab on /admin/users/[id].
-- Card + Table + platform-standard TabPagination. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.users.activity.grades.title',
      'admin.users.activity.grades.count',
      'admin.users.activity.grades.col.item',
      'admin.users.activity.grades.col.course',
      'admin.users.activity.grades.col.status',
      'admin.users.activity.grades.col.graded',
      'admin.users.activity.grades.col.letter',
      'admin.users.activity.grades.col.score'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.users.activity.grades.title',       'Grades',                'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.grades.title',       'ציונים',                 'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.grades.count',       '{{count}} grades',      'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.grades.count',       '{{count}} ציונים',        'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.grades.col.item',    'Item',                  'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.grades.col.item',    'פריט',                   'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.grades.col.course',  'Course',                'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.grades.col.course',  'קורס',                   'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.grades.col.status',  'Status',                'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.grades.col.status',  'סטטוס',                  'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.grades.col.graded',  'Graded',                'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.grades.col.graded',  'נבדק',                   'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.grades.col.letter',  'Letter',                'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.grades.col.letter',  'אות',                    'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.grades.col.score',   'Score',                 'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.grades.col.score',   'ציון',                   'admin', NULL, 'admin');
END $$;
