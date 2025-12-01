-- =====================================================
-- Products Form - Complete Translation Keys
-- =====================================================
-- This file contains ALL translation keys needed for the products form
-- including validations, search functionality, and all UI elements
-- =====================================================

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant's UUID (adjust as needed)
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- =====================================================
  -- VALIDATION MESSAGES (NEW)
  -- =====================================================

  -- Common actions
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
  ('en', 'common.cancel', 'Cancel', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'common.cancel', 'ביטול', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'common.save', 'Save Changes', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'common.save', 'שמור שינויים', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'common.create', 'Create Product', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'common.create', 'צור מוצר', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'common.loading', 'Loading...', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'common.loading', 'טוען...', 'admin', NOW(), NOW(), tenant_uuid),

  -- Basic validation
  ('en', 'products.validation.title_required', 'Product title is required', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.validation.title_required', 'שם המוצר הוא שדה חובה', 'admin', NOW(), NOW(), tenant_uuid),

  -- Content validation
  ('en', 'products.validation.program_required', 'Please select a program', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.validation.program_required', 'אנא בחר תוכנית', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.validation.course_required', 'Please select a course', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.validation.course_required', 'אנא בחר קורס', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.validation.courses_required', 'Please select at least one course for the bundle', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.validation.courses_required', 'אנא בחר לפחות קורס אחד לחבילה', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.validation.session_count_required', 'Please specify number of sessions', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.validation.session_count_required', 'אנא ציין מספר מפגשים', 'admin', NOW(), NOW(), tenant_uuid),

  -- Pricing validation
  ('en', 'products.validation.price_required', 'Price is required for paid products', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.validation.price_required', 'מחיר הוא שדה חובה למוצרים בתשלום', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.validation.deposit_type_required', 'Please select a deposit type', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.validation.deposit_type_required', 'אנא בחר סוג מקדמה', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.validation.deposit_percentage_required', 'Please specify deposit percentage', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.validation.deposit_percentage_required', 'אנא ציין אחוז מקדמה', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.validation.deposit_amount_required', 'Please specify deposit amount', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.validation.deposit_amount_required', 'אנא ציין סכום מקדמה', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.validation.installments_required', 'Please specify number of installments', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.validation.installments_required', 'אנא ציין מספר תשלומים', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.validation.plan_start_date_required', 'Please select installment plan start date', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.validation.plan_start_date_required', 'אנא בחר תאריך התחלה לתוכנית התשלומים', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.validation.subscription_interval_required', 'Please select billing interval', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.validation.subscription_interval_required', 'אנא בחר מרווח חיוב', 'admin', NOW(), NOW(), tenant_uuid),

  -- Integration validation
  ('en', 'products.validation.template_required', 'DocuSign template is required when signature is required', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.validation.template_required', 'תבנית DocuSign נדרשת כאשר נדרשת חתימה', 'admin', NOW(), NOW(), tenant_uuid),

  -- =====================================================
  -- KEAP TAG SEARCH (NEW)
  -- =====================================================

  ('en', 'products.keap.search_tags', 'Search tags...', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.keap.search_tags', 'חיפוש תגיות...', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.keap.no_tags_found', 'No tags found', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.keap.no_tags_found', 'לא נמצאו תגיות', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.keap.tags_available', 'tags available', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.keap.tags_available', 'תגיות זמינות', 'admin', NOW(), NOW(), tenant_uuid),

  -- =====================================================
  -- CONTENT SELECTOR (NEW)
  -- =====================================================

  ('en', 'products.select_course_for_type', 'Select Course', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.select_course_for_type', 'בחר קורס', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.course_selection_desc', 'Select the course that this product provides access to', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.course_selection_desc', 'בחר את הקורס שהמוצר הזה מעניק גישה אליו', 'admin', NOW(), NOW(), tenant_uuid),

  -- =====================================================
  -- PAYMENT PLAN (UPDATED)
  -- =====================================================

  ('en', 'products.payment_plan.plan_start_date', 'Installment Plan Start Date', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plan.plan_start_date', 'תאריך התחלת תוכנית התשלומים', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.payment_plan.plan_start_date_desc', 'The date when installment payments will begin (deposit is immediate)', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plan.plan_start_date_desc', 'התאריך בו תתחיל תוכנית התשלומים (המקדמה מיידית)', 'admin', NOW(), NOW(), tenant_uuid),

  -- =====================================================
  -- DOCUSIGN (UPDATED)
  -- =====================================================

  ('en', 'products.docusign.template', 'DocuSign Template', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.docusign.template', 'תבנית DocuSign', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.docusign.select_template', 'Select a template...', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.docusign.select_template', 'בחר תבנית...', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.docusign.template_desc', 'Select the DocuSign template to use for this product', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.docusign.template_desc', 'בחר את תבנית DocuSign לשימוש במוצר זה', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.docusign.no_templates', 'No templates available', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.docusign.no_templates', 'אין תבניות זמינות', 'admin', NOW(), NOW(), tenant_uuid),

  -- =====================================================
  -- KEAP (UPDATED)
  -- =====================================================

  ('en', 'products.keap.select_tag', 'Select a tag (optional)...', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.keap.select_tag', 'בחר תגית (אופציונלי)...', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.keap.no_tag', 'No tag', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.keap.no_tag', 'ללא תגית', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.keap.no_tags', 'No tags available', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.keap.no_tags', 'אין תגיות זמינות', 'admin', NOW(), NOW(), tenant_uuid),

  -- =====================================================
  -- BACK BUTTON (NEW)
  -- =====================================================

  ('en', 'admin.payments.products.back', 'Back', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'admin.payments.products.back', 'חזרה', 'admin', NOW(), NOW(), tenant_uuid),

  -- =====================================================
  -- PAYMENT PLAN SELECTION (NEW)
  -- =====================================================

  ('en', 'products.payment_plans.title', 'Payment Plan Options', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plans.title', 'אפשרויות תוכנית תשלום', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.payment_plans.use_templates', 'Use payment plan templates', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plans.use_templates', 'השתמש בתבניות תוכנית תשלום', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.payment_plans.default_plan', 'Default Payment Plan', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plans.default_plan', 'תוכנית תשלום ברירת מחדל', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.payment_plans.default_plan_desc', 'The payment plan that will be pre-selected for users', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plans.default_plan_desc', 'תוכנית התשלום שתיבחר מראש עבור המשתמשים', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.payment_plans.alternative_plans', 'Alternative Payment Plans', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plans.alternative_plans', 'תוכניות תשלום חלופיות', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.payment_plans.alternative_plans_desc', 'Additional payment plans that users can choose from', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plans.alternative_plans_desc', 'תוכניות תשלום נוספות שהמשתמשים יכולים לבחור מהן', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.payment_plans.allow_selection', 'Allow users to choose payment plan at checkout', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plans.allow_selection', 'אפשר למשתמשים לבחור תוכנית תשלום בקופה', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.payment_plans.no_plans_available', 'No payment plans available. Create plans first.', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plans.no_plans_available', 'אין תוכניות תשלום זמינות. צור תוכניות תחילה.', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.payment_plans.select_default', 'Select default plan...', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plans.select_default', 'בחר תוכנית ברירת מחדל...', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.payment_plans.select_alternative', 'Select alternative plans...', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plans.select_alternative', 'בחר תוכניות חלופיות...', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.payment_plans.mode', 'Payment Configuration Mode', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plans.mode', 'מצב הגדרת תשלום', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.payment_plans.mode_embedded', 'Embedded (Custom configuration)', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plans.mode_embedded', 'מוטמע (הגדרה מותאמת אישית)', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.payment_plans.mode_template', 'Template (Use payment plans)', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.payment_plans.mode_template', 'תבנית (השתמש בתוכניות תשלום)', 'admin', NOW(), NOW(), tenant_uuid)

  ON CONFLICT (translation_key, language_code, tenant_id)
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    context = EXCLUDED.context,
    updated_at = NOW();

END $$;
