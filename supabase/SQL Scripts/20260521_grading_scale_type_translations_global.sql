-- Re-seed grading scale_type labels as GLOBAL (tenant_id IS NULL) so they
-- apply on every tenant, and fix the `passfail` key. The earlier seed at
-- 20251215_add_grade_ranges_missing_translations.sql used `pass_fail`
-- (with underscore) — but the actual ScaleType union in src/types/grading.ts
-- is `'passfail'` (no underscore). That mismatch meant the scale-type badge
-- on the grading scales list always fell back to English.

DO $$
BEGIN
  DELETE FROM public.translations
  WHERE translation_key IN (
    'admin.grading.scales.scaleType.letter',
    'admin.grading.scales.scaleType.numeric',
    'admin.grading.scales.scaleType.passfail',
    'admin.grading.scales.scaleType.custom',
    'admin.grading.scales.scaleType.percentage',
    'admin.grading.scales.scaleType.pass_fail'  -- legacy bad key, clean up
  )
  AND tenant_id IS NULL;

  INSERT INTO public.translations
    (language_code, translation_key, translation_value, context, tenant_id, category)
  VALUES
    ('en', 'admin.grading.scales.scaleType.letter',   'Letter',    'admin', NULL, 'admin'),
    ('he', 'admin.grading.scales.scaleType.letter',   'אותיות',     'admin', NULL, 'admin'),

    ('en', 'admin.grading.scales.scaleType.numeric',  'Numeric',   'admin', NULL, 'admin'),
    ('he', 'admin.grading.scales.scaleType.numeric',  'מספרי',      'admin', NULL, 'admin'),

    ('en', 'admin.grading.scales.scaleType.passfail', 'Pass/Fail', 'admin', NULL, 'admin'),
    ('he', 'admin.grading.scales.scaleType.passfail', 'עבר/נכשל',   'admin', NULL, 'admin'),

    ('en', 'admin.grading.scales.scaleType.custom',   'Custom',    'admin', NULL, 'admin'),
    ('he', 'admin.grading.scales.scaleType.custom',   'מותאם אישית', 'admin', NULL, 'admin');

  RAISE NOTICE 'Grading scale_type badge translations seeded as global.';
END $$;
