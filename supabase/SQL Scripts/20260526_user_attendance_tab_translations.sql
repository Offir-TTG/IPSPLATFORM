-- Translations for the rewritten Attendance tab on /admin/users/[id].
-- Per-course summary cards stay on top; the records list became a
-- platform-standard paginated table below. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.users.activity.attendance.title',
      'admin.users.activity.attendance.count',
      'admin.users.activity.attendance.col.date',
      'admin.users.activity.attendance.col.course',
      'admin.users.activity.attendance.col.status',
      'admin.users.activity.attendance.col.notes'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.users.activity.attendance.title',     'Attendance records',                'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.attendance.title',     'רישומי נוכחות',                       'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.attendance.count',     '{{count}} records',                 'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.attendance.count',     '{{count}} רשומות',                    'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.attendance.col.date',   'Date',                             'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.attendance.col.date',   'תאריך',                              'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.attendance.col.course', 'Course',                           'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.attendance.col.course', 'קורס',                               'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.attendance.col.status', 'Status',                           'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.attendance.col.status', 'סטטוס',                              'admin', NULL, 'admin'),

    ('en', 'admin.users.activity.attendance.col.notes',  'Notes',                            'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.attendance.col.notes',  'הערות',                              'admin', NULL, 'admin');
END $$;
