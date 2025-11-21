-- Add translations for course pricing and type fields
DO $$
DECLARE
  v_tenant_id uuid := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translations if they exist to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN (
      'lms.course.is_standalone',
      'lms.course.standalone_label',
      'lms.course.standalone_description',
      'lms.course.price_label',
      'lms.course.currency_label',
      'lms.course.payment_plan_label',
      'lms.course.payment_plan_one_time',
      'lms.course.payment_plan_installments',
      'lms.course.installment_count_label',
      'lms.course.type_label',
      'lms.course.type_course',
      'lms.course.type_lecture',
      'lms.course.type_workshop',
      'lms.course.type_webinar'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES
  -- English translations
  (v_tenant_id, 'en', 'lms.course.is_standalone', 'Standalone Course', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.standalone_label', 'Available as Standalone', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.standalone_description', 'Allow this course to be purchased separately from programs', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.price_label', 'Price', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.currency_label', 'Currency', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.payment_plan_label', 'Payment Plan', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.payment_plan_one_time', 'One-time Payment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.payment_plan_installments', 'Installments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.installment_count_label', 'Number of Installments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.type_label', 'Course Type', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.type_course', 'Course', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.type_lecture', 'Lecture', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.type_workshop', 'Workshop', 'admin', NOW(), NOW()),
  (v_tenant_id, 'en', 'lms.course.type_webinar', 'Webinar', 'admin', NOW(), NOW()),

  -- Hebrew translations
  (v_tenant_id, 'he', 'lms.course.is_standalone', 'קורס עצמאי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.standalone_label', 'זמין כקורס עצמאי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.standalone_description', 'אפשר רכישת קורס זה בנפרד מתוכניות', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.price_label', 'מחיר', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.currency_label', 'מטבע', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.payment_plan_label', 'תכנית תשלום', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.payment_plan_one_time', 'תשלום חד פעמי', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.payment_plan_installments', 'תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.installment_count_label', 'מספר תשלומים', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.type_label', 'סוג הקורס', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.type_course', 'קורס', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.type_lecture', 'הרצאה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.type_workshop', 'סדנה', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'lms.course.type_webinar', 'ובינר', 'admin', NOW(), NOW());

  RAISE NOTICE 'Course pricing and type translations added successfully';

END $$;
