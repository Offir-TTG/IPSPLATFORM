-- Seed missing global translations for the LMS course create/edit dialog
-- AND the course-detail "Instructor: <name>" label.
--
-- Hebrew labels were absent so the UI fell back to English for:
--   • "Course Image" (dialog section heading)
--   • "Instructor" (dialog field + course-detail header line)
--   • the two adjacent instructor helper strings (dialog)
--
-- `user.courses.instructor` already had a TENANT-SCOPED row from
-- 20260515_update_instructor_translation_to_lecturer.sql, but that migration
-- targets `SELECT id FROM tenants LIMIT 1` — any other tenant sees the
-- English fallback. Re-seed as GLOBAL (tenant_id IS NULL) so it applies to
-- every tenant, matching the admin-chrome convention from
-- 20260518_products_crm_tag_translations_global.sql. Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE translation_key IN (
    'lms.courses.image',
    'lms.courses.instructor',
    'lms.courses.select_instructor',
    'lms.courses.instructor_help',
    'user.courses.instructor',
    'common.show_more',
    'common.show_less'
  )
  AND tenant_id IS NULL;

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'lms.courses.image',              'Course Image',                                  'admin', NULL, 'admin'),
    ('he', 'lms.courses.image',              'תמונת הקורס',                                    'admin', NULL, 'admin'),

    ('en', 'lms.courses.instructor',         'Instructor',                                    'admin', NULL, 'admin'),
    ('he', 'lms.courses.instructor',         'מרצה',                                           'admin', NULL, 'admin'),

    ('en', 'lms.courses.select_instructor',  'Select an instructor (optional)',               'admin', NULL, 'admin'),
    ('he', 'lms.courses.select_instructor',  'בחר מרצה (אופציונלי)',                            'admin', NULL, 'admin'),

    ('en', 'lms.courses.instructor_help',    'Leave empty to set yourself as the instructor', 'admin', NULL, 'admin'),
    ('he', 'lms.courses.instructor_help',    'השאר ריק כדי להגדיר את עצמך כמרצה',                'admin', NULL, 'admin'),

    -- Course details page (admin route): "Instructor: <name>" line.
    -- context MUST be 'admin' (or 'both') because the admin app calls
    -- /api/translations?context=admin, which filters out context='user'.
    -- The original 20260515 seed used context='user' which is why it never
    -- resolved here even for the seeded tenant.
    ('en', 'user.courses.instructor',        'Instructor',                                    'admin', NULL, 'user'),
    ('he', 'user.courses.instructor',        'מרצה',                                           'admin', NULL, 'user'),

    -- Show more / show less toggle (used by the collapsible course description)
    ('en', 'common.show_more',               'Show more',                                     'admin', NULL, 'admin'),
    ('he', 'common.show_more',               'הצג עוד',                                        'admin', NULL, 'admin'),
    ('en', 'common.show_less',               'Show less',                                     'admin', NULL, 'admin'),
    ('he', 'common.show_less',               'הצג פחות',                                       'admin', NULL, 'admin');

  RAISE NOTICE 'LMS course dialog + course-detail instructor translations seeded.';
END $$;
