-- Add translations for course pricing validation errors
DO $$
DECLARE
  v_tenant_id uuid := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translations if they exist to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN (
      'lms.course.error_standalone_pricing_required',
      'lms.course.error_missing_required_fields',
      'lms.course.error_standalone_cannot_have_program',
      'lms.course.not_applicable_standalone',
      'common.clear_selection'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- English translations
  (v_tenant_id, 'en', 'lms.course.error_standalone_pricing_required', 'Price and payment plan are required for standalone courses', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.error_missing_required_fields', 'Missing required fields', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.error_standalone_cannot_have_program', 'Standalone courses cannot be part of a program', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.not_applicable_standalone', 'Not applicable for standalone courses', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'common.clear_selection', 'Clear selection', 'both', NOW(), NOW()),

  -- Hebrew translations
  (v_tenant_id, 'he', 'lms.course.error_standalone_pricing_required', 'מחיר ותכנית תשלום נדרשים עבור קורסים עצמאיים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.error_missing_required_fields', 'שדות חובה חסרים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.error_standalone_cannot_have_program', 'קורסים עצמאיים לא יכולים להיות חלק מתוכנית', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.not_applicable_standalone', 'לא רלוונטי לקורסים עצמאיים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.clear_selection', 'נקה בחירה', 'both', NOW(), NOW());

  RAISE NOTICE 'Course pricing error translations added successfully';

END $$;
