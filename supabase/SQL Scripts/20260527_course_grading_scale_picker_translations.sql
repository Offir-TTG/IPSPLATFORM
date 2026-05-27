-- New CourseGradingScalePicker (renders at the top of the gradebook
-- page so admins can pick which scale the course's letter grades
-- resolve against). Safe to re-run.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE tenant_id IS NULL
    AND translation_key IN (
      'admin.grading.scale.label',
      'admin.grading.scale.help',
      'admin.grading.scale.tenantDefault',
      'admin.grading.scale.defaultMarker',
      'admin.grading.scale.savedToast'
    );

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.grading.scale.label',         'Grading scale',                                                                                                   'admin', NULL, 'admin'),
    ('he', 'admin.grading.scale.label',         'סולם דירוג',                                                                                                       'admin', NULL, 'admin'),

    ('en', 'admin.grading.scale.help',
      'Letters for this course are looked up against this scale. "Tenant default" uses whichever scale is marked default.',
      'admin', NULL, 'admin'),
    ('he', 'admin.grading.scale.help',
      'אותיות הציון בקורס נקבעות מהסולם הזה. "ברירת מחדל" משתמשת בסולם שמסומן כברירת המחדל של הדייר.',
      'admin', NULL, 'admin'),

    ('en', 'admin.grading.scale.tenantDefault', 'Tenant default',                                                                                                  'admin', NULL, 'admin'),
    ('he', 'admin.grading.scale.tenantDefault', 'ברירת מחדל',                                                                                                       'admin', NULL, 'admin'),

    ('en', 'admin.grading.scale.defaultMarker', 'default',                                                                                                         'admin', NULL, 'admin'),
    ('he', 'admin.grading.scale.defaultMarker', 'ברירת מחדל',                                                                                                       'admin', NULL, 'admin'),

    ('en', 'admin.grading.scale.savedToast',    'Grading scale updated for this course',                                                                           'admin', NULL, 'admin'),
    ('he', 'admin.grading.scale.savedToast',    'סולם הדירוג עודכן עבור הקורס',                                                                                       'admin', NULL, 'admin');
END $$;
