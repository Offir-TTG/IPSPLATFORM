-- Translations for the rewritten Access tab on /admin/users/[id].
-- Each section now uses the platform-standard Card + Table layout, so
-- it needs count-chip keys and table column-header keys per section.
-- Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      -- Programs
      'admin.users.activity.access.programs.count',
      'admin.users.activity.access.programs.col.program',
      'admin.users.activity.access.programs.col.courses',
      'admin.users.activity.access.programs.col.enrolled',
      'admin.users.activity.access.programs.col.status',
      -- Courses (direct)
      'admin.users.activity.access.courses.count',
      'admin.users.activity.access.courses.col.course',
      'admin.users.activity.access.courses.col.enrolled',
      'admin.users.activity.access.courses.col.status',
      -- Granted
      'admin.users.activity.access.granted.count',
      'admin.users.activity.access.granted.col.course',
      'admin.users.activity.access.granted.col.reason',
      'admin.users.activity.access.granted.col.granted',
      -- Hidden
      'admin.users.activity.access.hidden.count',
      'admin.users.activity.access.hidden.col.course',
      'admin.users.activity.access.hidden.col.reason',
      'admin.users.activity.access.hidden.col.hidden',
      -- Visible
      'admin.users.activity.access.visible.count',
      'admin.users.activity.access.visible.col.course',
      'admin.users.activity.access.visible.col.source',
      'admin.users.activity.access.visible.col.required',
      -- Visible — source labels & subtitles (previously inserted under a
      -- specific tenant_id in 20260525 so they didn't resolve for users
      -- on other tenants; re-seed as global rows here).
      'admin.users.activity.access.visible.sourceProgram',
      'admin.users.activity.access.visible.sourceCourseEnrollment',
      'admin.users.activity.access.visible.sourceManualGrant',
      'admin.users.activity.access.visible.fromProgram',
      'admin.users.activity.access.visible.fromProgramNoName',
      'admin.users.activity.access.visible.fromCourseEnrollment',
      'admin.users.activity.access.visible.grantedDirectly',
      'admin.users.activity.access.visible.requiredBadge'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    -- Programs section
    ('en', 'admin.users.activity.access.programs.count',         '{{count}} programs',  'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.programs.count',         '{{count}} תוכניות',     'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.programs.col.program',   'Program',             'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.programs.col.program',   'תוכנית',                'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.programs.col.courses',   'Courses',             'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.programs.col.courses',   'קורסים',                'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.programs.col.enrolled',  'Enrolled',            'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.programs.col.enrolled',  'נרשם בתאריך',           'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.programs.col.status',    'Status',              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.programs.col.status',    'סטטוס',                 'admin', NULL, 'admin'),

    -- Direct course enrollments section
    ('en', 'admin.users.activity.access.courses.count',          '{{count}} courses',   'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.courses.count',          '{{count}} קורסים',      'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.courses.col.course',     'Course',              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.courses.col.course',     'קורס',                 'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.courses.col.enrolled',   'Enrolled',            'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.courses.col.enrolled',   'נרשם בתאריך',           'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.courses.col.status',     'Status',              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.courses.col.status',     'סטטוס',                 'admin', NULL, 'admin'),

    -- Granted section
    ('en', 'admin.users.activity.access.granted.count',          '{{count}} granted',   'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.granted.count',          '{{count}} הוענקו',      'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.granted.col.course',     'Course',              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.granted.col.course',     'קורס',                 'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.granted.col.reason',     'Reason',              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.granted.col.reason',     'סיבה',                  'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.granted.col.granted',    'Granted',             'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.granted.col.granted',    'הוענק בתאריך',          'admin', NULL, 'admin'),

    -- Hidden section
    ('en', 'admin.users.activity.access.hidden.count',           '{{count}} hidden',    'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.hidden.count',           '{{count}} מוסתרים',     'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.hidden.col.course',      'Course',              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.hidden.col.course',      'קורס',                 'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.hidden.col.reason',      'Reason',              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.hidden.col.reason',      'סיבה',                  'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.hidden.col.hidden',      'Hidden',              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.hidden.col.hidden',      'הוסתר בתאריך',          'admin', NULL, 'admin'),

    -- Visible section
    ('en', 'admin.users.activity.access.visible.count',          '{{count}} visible',   'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.visible.count',          '{{count}} גלויים',      'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.visible.col.course',     'Course',              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.visible.col.course',     'קורס',                 'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.visible.col.source',     'Source',              'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.visible.col.source',     'מקור',                  'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.visible.col.required',   'Required',            'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.visible.col.required',   'נדרש',                  'admin', NULL, 'admin'),

    -- Visible — source badge labels (global re-seed)
    ('en', 'admin.users.activity.access.visible.sourceProgram',           'Program',                  'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.visible.sourceProgram',           'תוכנית',                     'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.visible.sourceCourseEnrollment',  'Course',                   'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.visible.sourceCourseEnrollment',  'קורס',                       'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.visible.sourceManualGrant',       'Manual grant',             'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.visible.sourceManualGrant',       'הענקה ידנית',                 'admin', NULL, 'admin'),

    -- Visible — row subtitles (global re-seed)
    ('en', 'admin.users.activity.access.visible.fromProgram',             'From {{program}}',         'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.visible.fromProgram',             'מתוך {{program}}',           'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.visible.fromProgramNoName',       'From a program',           'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.visible.fromProgramNoName',       'מתוכנית',                    'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.visible.fromCourseEnrollment',    'Direct course enrollment', 'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.visible.fromCourseEnrollment',    'הרשמה ישירה לקורס',           'admin', NULL, 'admin'),
    ('en', 'admin.users.activity.access.visible.grantedDirectly',         'Granted directly',         'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.visible.grantedDirectly',         'הוענק ישירות',                'admin', NULL, 'admin'),

    -- Visible — required badge (global re-seed)
    ('en', 'admin.users.activity.access.visible.requiredBadge',           'Required',                 'admin', NULL, 'admin'),
    ('he', 'admin.users.activity.access.visible.requiredBadge',           'נדרש',                       'admin', NULL, 'admin');
END $$;
