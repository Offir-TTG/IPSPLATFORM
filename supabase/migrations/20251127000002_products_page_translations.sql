-- ============================================================================
-- Products Page Complete Translations (English & Hebrew)
-- ============================================================================
-- Description: Add all translations for the products page
-- This migration adds global translations (tenant_id = NULL) for all users
-- Author: Claude Code Assistant
-- Date: 2025-11-27

DO $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Delete existing products translations to avoid conflicts
  DELETE FROM translations
  WHERE tenant_id IS NULL
    AND (translation_key LIKE 'admin.payments.products.%'
    OR translation_key LIKE 'products.%');

  -- ============================================================================
  -- PRODUCTS PAGE - MAIN TRANSLATIONS
  -- ============================================================================

  -- Insert all translations using individual INSERT statements to avoid ON CONFLICT issues
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('admin.payments.products.back', 'en', 'Back', 'admin', NULL::uuid),
    ('admin.payments.products.back', 'he', 'חזרה', 'admin', NULL::uuid),
    ('admin.payments.products.title', 'en', 'Products', 'admin', NULL::uuid),
    ('admin.payments.products.title', 'he', 'מוצרים', 'admin', NULL::uuid),
    ('admin.payments.products.description', 'en', 'Manage billable products and their pricing', 'admin', NULL::uuid),
    ('admin.payments.products.description', 'he', 'נהל מוצרים לחיוב ותמחור שלהם', 'admin', NULL::uuid),
    ('admin.payments.products.createProduct', 'en', 'Create Product', 'admin', NULL::uuid),
    ('admin.payments.products.createProduct', 'he', 'יצירת מוצר', 'admin', NULL::uuid),
    ('admin.payments.products.search', 'en', 'Search', 'admin', NULL::uuid),
    ('admin.payments.products.search', 'he', 'חיפוש', 'admin', NULL::uuid),
    ('admin.payments.products.searchPlaceholder', 'en', 'Search products...', 'admin', NULL::uuid),
    ('admin.payments.products.searchPlaceholder', 'he', 'חפש מוצרים...', 'admin', NULL::uuid),
    ('admin.payments.products.productType', 'en', 'Product Type', 'admin', NULL::uuid),
    ('admin.payments.products.productType', 'he', 'סוג מוצר', 'admin', NULL::uuid),
    ('admin.payments.products.allTypes', 'en', 'All Types', 'admin', NULL::uuid),
    ('admin.payments.products.allTypes', 'he', 'כל הסוגים', 'admin', NULL::uuid),
    ('admin.payments.products.paymentModel', 'en', 'Payment Model', 'admin', NULL::uuid),
    ('admin.payments.products.paymentModel', 'he', 'מודל תשלום', 'admin', NULL::uuid),
    ('admin.payments.products.allModels', 'en', 'All Models', 'admin', NULL::uuid),
    ('admin.payments.products.allModels', 'he', 'כל המודלים', 'admin', NULL::uuid),
    ('admin.payments.products.status', 'en', 'Status', 'admin', NULL::uuid),
    ('admin.payments.products.status', 'he', 'סטטוס', 'admin', NULL::uuid),
    ('admin.payments.products.all', 'en', 'All', 'admin', NULL::uuid),
    ('admin.payments.products.all', 'he', 'הכל', 'admin', NULL::uuid),
    ('admin.payments.products.active', 'en', 'Active', 'admin', NULL::uuid),
    ('admin.payments.products.active', 'he', 'פעיל', 'admin', NULL::uuid),
    ('admin.payments.products.inactive', 'en', 'Inactive', 'admin', NULL::uuid),
    ('admin.payments.products.inactive', 'he', 'לא פעיל', 'admin', NULL::uuid),
    ('admin.payments.products.loading', 'en', 'Loading products...', 'admin', NULL::uuid),
    ('admin.payments.products.loading', 'he', 'טוען מוצרים...', 'admin', NULL::uuid),
    ('admin.payments.products.noProductsCreated', 'en', 'No products created', 'admin', NULL::uuid),
    ('admin.payments.products.noProductsCreated', 'he', 'לא נוצרו מוצרים', 'admin', NULL::uuid),
    ('admin.payments.products.noProductsFound', 'en', 'No products found', 'admin', NULL::uuid),
    ('admin.payments.products.noProductsFound', 'he', 'לא נמצאו מוצרים', 'admin', NULL::uuid),
    ('admin.payments.products.createFirst', 'en', 'Create your first product to start accepting payments', 'admin', NULL::uuid),
    ('admin.payments.products.createFirst', 'he', 'צור את המוצר הראשון שלך כדי להתחיל לקבל תשלומים', 'admin', NULL::uuid),
    ('admin.payments.products.tryAdjustingFilters', 'en', 'Try adjusting your filters', 'admin', NULL::uuid),
    ('admin.payments.products.tryAdjustingFilters', 'he', 'נסה להתאים את המסננים', 'admin', NULL::uuid),
    ('admin.payments.products.deleteConfirm', 'en', 'Are you sure you want to delete this product? This action cannot be undone.', 'admin', NULL::uuid),
    ('admin.payments.products.deleteConfirm', 'he', 'האם אתה בטוח שברצונך למחוק מוצר זה? פעולה זו לא ניתנת לביטול.', 'admin', NULL::uuid),
    ('admin.payments.products.deleteSuccess', 'en', 'Product deleted successfully', 'admin', NULL::uuid),
    ('admin.payments.products.deleteSuccess', 'he', 'המוצר נמחק בהצלחה', 'admin', NULL::uuid),
    ('admin.payments.products.deleteFailed', 'en', 'Failed to delete product', 'admin', NULL::uuid),
    ('admin.payments.products.deleteFailed', 'he', 'נכשל במחיקת המוצר', 'admin', NULL::uuid),
    ('admin.payments.products.saveFailed', 'en', 'Failed to save product', 'admin', NULL::uuid),
    ('admin.payments.products.saveFailed', 'he', 'נכשל בשמירת המוצר', 'admin', NULL::uuid),
    ('admin.payments.products.updateSuccess', 'en', 'Product updated successfully', 'admin', NULL::uuid),
    ('admin.payments.products.updateSuccess', 'he', 'המוצר עודכן בהצלחה', 'admin', NULL::uuid),
    ('admin.payments.products.createSuccess', 'en', 'Product created successfully', 'admin', NULL::uuid),
    ('admin.payments.products.createSuccess', 'he', 'המוצר נוצר בהצלחה', 'admin', NULL::uuid),
    ('admin.payments.products.loadFailed', 'en', 'Failed to load products', 'admin', NULL::uuid),
    ('admin.payments.products.loadFailed', 'he', 'נכשל בטעינת המוצרים', 'admin', NULL::uuid),
    ('admin.payments.products.form.editTitle', 'en', 'Edit Product', 'admin', NULL::uuid),
    ('admin.payments.products.form.editTitle', 'he', 'עריכת מוצר', 'admin', NULL::uuid),
    ('admin.payments.products.form.createTitle', 'en', 'Create Product', 'admin', NULL::uuid),
    ('admin.payments.products.form.createTitle', 'he', 'יצירת מוצר', 'admin', NULL::uuid),
    ('admin.payments.products.form.editDescription', 'en', 'Update product details and pricing', 'admin', NULL::uuid),
    ('admin.payments.products.form.editDescription', 'he', 'עדכן פרטי מוצר ותמחור', 'admin', NULL::uuid),
    ('admin.payments.products.form.createDescription', 'en', 'Create a new billable product in the system', 'admin', NULL::uuid),
    ('admin.payments.products.form.createDescription', 'he', 'צור מוצר חדש לחיוב במערכת', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Product Types
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('products.type.program', 'en', 'Program', 'admin', NULL::uuid),
    ('products.type.program', 'he', 'תוכנית', 'admin', NULL::uuid),
    ('products.type.course', 'en', 'Course', 'admin', NULL::uuid),
    ('products.type.course', 'he', 'קורס', 'admin', NULL::uuid),
    ('products.type.bundle', 'en', 'Bundle', 'admin', NULL::uuid),
    ('products.type.bundle', 'he', 'חבילה', 'admin', NULL::uuid),
    ('products.type.session_pack', 'en', 'Session Pack', 'admin', NULL::uuid),
    ('products.type.session_pack', 'he', 'חבילת מפגשים', 'admin', NULL::uuid),
    ('products.type.lecture', 'en', 'Lecture', 'admin', NULL::uuid),
    ('products.type.lecture', 'he', 'הרצאה', 'admin', NULL::uuid),
    ('products.type.workshop', 'en', 'Workshop', 'admin', NULL::uuid),
    ('products.type.workshop', 'he', 'סדנה', 'admin', NULL::uuid),
    ('products.type.webinar', 'en', 'Webinar', 'admin', NULL::uuid),
    ('products.type.webinar', 'he', 'וובינר', 'admin', NULL::uuid),
    ('products.type.session', 'en', 'Session', 'admin', NULL::uuid),
    ('products.type.session', 'he', 'מפגש', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  -- Payment Models
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('products.payment_model.one_time', 'en', 'One-time Payment', 'admin', NULL::uuid),
    ('products.payment_model.one_time', 'he', 'תשלום חד-פעמי', 'admin', NULL::uuid),
    ('products.payment_model.deposit_then_plan', 'en', 'Deposit + Installments', 'admin', NULL::uuid),
    ('products.payment_model.deposit_then_plan', 'he', 'מקדמה + תשלומים', 'admin', NULL::uuid),
    ('products.payment_model.subscription', 'en', 'Subscription', 'admin', NULL::uuid),
    ('products.payment_model.subscription', 'he', 'מנוי', 'admin', NULL::uuid),
    ('products.payment_model.free', 'en', 'Free', 'admin', NULL::uuid),
    ('products.payment_model.free', 'he', 'חינם', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  -- Form Fields & Tabs
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('products.tabs.basic', 'en', 'Basic Info', 'admin', NULL::uuid),
    ('products.tabs.basic', 'he', 'מידע בסיסי', 'admin', NULL::uuid),
    ('products.tabs.content', 'en', 'Content', 'admin', NULL::uuid),
    ('products.tabs.content', 'he', 'תוכן', 'admin', NULL::uuid),
    ('products.tabs.pricing', 'en', 'Pricing', 'admin', NULL::uuid),
    ('products.tabs.pricing', 'he', 'תמחור', 'admin', NULL::uuid),
    ('products.tabs.integrations', 'en', 'Integrations', 'admin', NULL::uuid),
    ('products.tabs.integrations', 'he', 'אינטגרציות', 'admin', NULL::uuid),
    ('products.title', 'en', 'Product Title', 'admin', NULL::uuid),
    ('products.title', 'he', 'כותרת מוצר', 'admin', NULL::uuid),
    ('products.title_placeholder', 'en', 'e.g., Advanced Leadership Program', 'admin', NULL::uuid),
    ('products.title_placeholder', 'he', 'לדוגמה, תוכנית מנהיגות מתקדמת', 'admin', NULL::uuid),
    ('products.description', 'en', 'Description', 'admin', NULL::uuid),
    ('products.description', 'he', 'תיאור', 'admin', NULL::uuid),
    ('products.description_placeholder', 'en', 'Describe what this product includes...', 'admin', NULL::uuid),
    ('products.description_placeholder', 'he', 'תאר מה כולל המוצר הזה...', 'admin', NULL::uuid),
    ('products.active', 'en', 'Active', 'admin', NULL::uuid),
    ('products.active', 'he', 'פעיל', 'admin', NULL::uuid),
    ('products.active_desc', 'en', 'Only active products can accept new enrollments', 'admin', NULL::uuid),
    ('products.active_desc', 'he', 'רק מוצרים פעילים יכולים לקבל הרשמות חדשות', 'admin', NULL::uuid),
    ('products.payment_model', 'en', 'Payment Model', 'admin', NULL::uuid),
    ('products.payment_model', 'he', 'מודל תשלום', 'admin', NULL::uuid),
    ('products.price', 'en', 'Price', 'admin', NULL::uuid),
    ('products.price', 'he', 'מחיר', 'admin', NULL::uuid),
    ('products.currency', 'en', 'Currency', 'admin', NULL::uuid),
    ('products.currency', 'he', 'מטבע', 'admin', NULL::uuid),
    ('products.requires_signature', 'en', 'Signature Required', 'admin', NULL::uuid),
    ('products.requires_signature', 'he', 'נדרשת חתימה', 'admin', NULL::uuid),
    ('products.keap_tag', 'en', 'Keap Tag', 'admin', NULL::uuid),
    ('products.keap_tag', 'he', 'תג Keap', 'admin', NULL::uuid),
    ('products.sessions', 'en', 'sessions', 'admin', NULL::uuid),
    ('products.sessions', 'he', 'מפגשים', 'admin', NULL::uuid),
    ('products.courses', 'en', 'courses', 'admin', NULL::uuid),
    ('products.courses', 'he', 'קורסים', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  -- Validation Messages
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('products.validation.title_required', 'en', 'Product title is required', 'admin', NULL::uuid),
    ('products.validation.title_required', 'he', 'כותרת המוצר נדרשת', 'admin', NULL::uuid),
    ('products.validation.program_required', 'en', 'Please select a program', 'admin', NULL::uuid),
    ('products.validation.program_required', 'he', 'אנא בחר תוכנית', 'admin', NULL::uuid),
    ('products.validation.courses_required', 'en', 'Please select at least one course for the bundle', 'admin', NULL::uuid),
    ('products.validation.courses_required', 'he', 'אנא בחר לפחות קורס אחד לחבילה', 'admin', NULL::uuid),
    ('products.validation.session_count_required', 'en', 'Please specify number of sessions', 'admin', NULL::uuid),
    ('products.validation.session_count_required', 'he', 'אנא ציין מספר מפגשים', 'admin', NULL::uuid),
    ('products.validation.course_required', 'en', 'Please select a course', 'admin', NULL::uuid),
    ('products.validation.course_required', 'he', 'אנא בחר קורס', 'admin', NULL::uuid),
    ('products.validation.price_required', 'en', 'Price is required for paid products', 'admin', NULL::uuid),
    ('products.validation.price_required', 'he', 'מחיר נדרש למוצרים בתשלום', 'admin', NULL::uuid),
    ('products.validation.deposit_type_required', 'en', 'Please select a deposit type', 'admin', NULL::uuid),
    ('products.validation.deposit_type_required', 'he', 'אנא בחר סוג מקדמה', 'admin', NULL::uuid),
    ('products.validation.deposit_percentage_required', 'en', 'Please specify deposit percentage', 'admin', NULL::uuid),
    ('products.validation.deposit_percentage_required', 'he', 'אנא ציין אחוז מקדמה', 'admin', NULL::uuid),
    ('products.validation.deposit_amount_required', 'en', 'Please specify deposit amount', 'admin', NULL::uuid),
    ('products.validation.deposit_amount_required', 'he', 'אנא ציין סכום מקדמה', 'admin', NULL::uuid),
    ('products.validation.installments_required', 'en', 'Please specify number of installments', 'admin', NULL::uuid),
    ('products.validation.installments_required', 'he', 'אנא ציין מספר תשלומים', 'admin', NULL::uuid),
    ('products.validation.plan_start_date_required', 'en', 'Please select installment plan start date', 'admin', NULL::uuid),
    ('products.validation.plan_start_date_required', 'he', 'אנא בחר תאריך התחלה לתוכנית תשלומים', 'admin', NULL::uuid),
    ('products.validation.subscription_interval_required', 'en', 'Please select billing interval', 'admin', NULL::uuid),
    ('products.validation.subscription_interval_required', 'he', 'אנא בחר מרווח חיוב', 'admin', NULL::uuid),
    ('products.validation.template_required', 'en', 'DocuSign template is required when signature is required', 'admin', NULL::uuid),
    ('products.validation.template_required', 'he', 'תבנית DocuSign נדרשת כאשר נדרשת חתימה', 'admin', NULL::uuid),
    ('products.validation.complete_required', 'en', 'Please complete all required fields before proceeding', 'admin', NULL::uuid),
    ('products.validation.complete_required', 'he', 'אנא השלם את כל השדות הנדרשים לפני המשך', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  RAISE NOTICE 'Products page translations migration completed successfully - added % translations', v_count;
END $$;
