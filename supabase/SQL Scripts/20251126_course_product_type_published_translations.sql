-- =====================================================
-- Course Product Type and Published Status Translations
-- =====================================================
-- Translation keys for new course fields:
-- - product_type (optional product categorization)
-- - is_published (visibility control for user portal)
-- =====================================================

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant's UUID (adjust as needed)
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Insert translations for product_type field
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
  -- Product Type Label and Options
  ('en', 'lms.course.product_type_label', 'Product Type', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'lms.course.product_type_label', 'סוג מוצר', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'lms.course.product_type_optional', 'Optional', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'lms.course.product_type_optional', 'אופציונלי', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'lms.course.product_type_placeholder', 'Select product type...', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'lms.course.product_type_placeholder', 'בחר סוג מוצר...', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'lms.course.product_type_none', 'None', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'lms.course.product_type_none', 'ללא', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'lms.course.product_type_desc', 'Categorize this course for products and billing', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'lms.course.product_type_desc', 'סיווג קורס זה למוצרים וחיוב', 'admin', NOW(), NOW(), tenant_uuid),

  -- Product Type Values (reusing from products system)
  ('en', 'products.type.program', 'Program', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.type.program', 'תוכנית', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.type.course', 'Course', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.type.course', 'קורס', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.type.bundle', 'Bundle', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.type.bundle', 'חבילה', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.type.session_pack', 'Session Pack', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.type.session_pack', 'חבילת מפגשים', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.type.lecture', 'Lecture', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.type.lecture', 'הרצאה', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.type.workshop', 'Workshop', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.type.workshop', 'סדנה', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.type.webinar', 'Webinar', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.type.webinar', 'וובינר', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.type.session', 'Session', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.type.session', 'מפגש', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'products.type.custom', 'Custom', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'products.type.custom', 'מותאם אישית', 'admin', NOW(), NOW(), tenant_uuid),

  -- Published Status
  ('en', 'lms.course.published_label', 'Published', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'lms.course.published_label', 'מפורסם', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'lms.course.published_description', 'Make this course visible to users in the user portal', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'lms.course.published_description', 'הפוך קורס זה לגלוי למשתמשים בפורטל המשתמש', 'admin', NOW(), NOW(), tenant_uuid),

  ('en', 'lms.course.draft', 'Draft', 'admin', NOW(), NOW(), tenant_uuid),
  ('he', 'lms.course.draft', 'טיוטה', 'admin', NOW(), NOW(), tenant_uuid)

  ON CONFLICT (translation_key, language_code, tenant_id)
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    context = EXCLUDED.context,
    updated_at = NOW();

END $$;
