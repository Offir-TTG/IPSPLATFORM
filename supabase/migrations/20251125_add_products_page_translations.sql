-- Add all translations for the products page
-- This includes product types, payment models, form fields, and UI elements

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the default tenant UUID
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;

  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  -- Delete existing product-related translations to avoid duplicates
  DELETE FROM translations WHERE translation_key LIKE 'products.%' OR translation_key LIKE 'admin.payments.products.%';

  -- Insert English and Hebrew translations
  INSERT INTO translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES

    -- =====================================================
    -- Admin Products Page
    -- =====================================================
    ('en', 'admin.payments.products.title', 'Products', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.title', 'מוצרים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.description', 'Manage billable products and their pricing', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.description', 'נהל מוצרים לחיוב ותמחור שלהם', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.back', 'Back', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.back', 'חזרה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.createProduct', 'Create Product', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.createProduct', 'צור מוצר', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.loading', 'Loading products...', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.loading', 'טוען מוצרים...', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.loadFailed', 'Failed to load products', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.loadFailed', 'טעינת המוצרים נכשלה', 'admin', NOW(), NOW(), tenant_uuid),

    -- Filters
    ('en', 'admin.payments.products.search', 'Search', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.search', 'חיפוש', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.searchPlaceholder', 'Search products...', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.searchPlaceholder', 'חפש מוצרים...', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.productType', 'Product Type', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.productType', 'סוג מוצר', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.allTypes', 'All Types', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.allTypes', 'כל הסוגים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.paymentModel', 'Payment Model', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.paymentModel', 'מודל תשלום', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.allModels', 'All Models', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.allModels', 'כל המודלים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.status', 'Status', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.status', 'סטטוס', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.all', 'All', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.all', 'הכל', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.active', 'Active', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.active', 'פעיל', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.inactive', 'Inactive', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.inactive', 'לא פעיל', 'admin', NOW(), NOW(), tenant_uuid),

    -- Empty states
    ('en', 'admin.payments.products.noProductsFound', 'No products found', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.noProductsFound', 'לא נמצאו מוצרים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.noProductsCreated', 'No products created', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.noProductsCreated', 'לא נוצרו מוצרים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.tryAdjustingFilters', 'Try adjusting your filters', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.tryAdjustingFilters', 'נסה להתאים את המסננים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.createFirst', 'Create your first product to start accepting payments', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.createFirst', 'צור את המוצר הראשון שלך כדי להתחיל לקבל תשלומים', 'admin', NOW(), NOW(), tenant_uuid),

    -- CRUD operations
    ('en', 'admin.payments.products.createSuccess', 'Product created successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.createSuccess', 'המוצר נוצר בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.updateSuccess', 'Product updated successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.updateSuccess', 'המוצר עודכן בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.deleteSuccess', 'Product deleted successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.deleteSuccess', 'המוצר נמחק בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.saveFailed', 'Failed to save product', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.saveFailed', 'שמירת המוצר נכשלה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.deleteFailed', 'Failed to delete product', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.deleteFailed', 'מחיקת המוצר נכשלה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.deleteConfirm', 'Are you sure you want to delete this product? This action cannot be undone.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.deleteConfirm', 'האם אתה בטוח שברצונך למחוק מוצר זה? פעולה זו לא ניתנת לביטול.', 'admin', NOW(), NOW(), tenant_uuid),

    -- Form dialog
    ('en', 'admin.payments.products.form.createTitle', 'Create Product', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.createTitle', 'צור מוצר', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.form.editTitle', 'Edit Product', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.editTitle', 'ערוך מוצר', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.form.createDescription', 'Create a new billable product in the system', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.createDescription', 'צור מוצר חדש לחיוב במערכת', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'admin.payments.products.form.editDescription', 'Update product details and pricing', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.editDescription', 'עדכן פרטי מוצר ותמחור', 'admin', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- Product Form Fields
    -- =====================================================

    -- Tabs
    ('en', 'products.tabs.basic', 'Basic Info', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.tabs.basic', 'מידע בסיסי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.tabs.content', 'Content', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.tabs.content', 'תוכן', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.tabs.pricing', 'Pricing', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.tabs.pricing', 'תמחור', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.tabs.integrations', 'Integrations', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.tabs.integrations', 'אינטגרציות', 'admin', NOW(), NOW(), tenant_uuid),

    -- Basic fields
    ('en', 'products.title', 'Product Title', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.title', 'שם המוצר', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.title_placeholder', 'e.g., Advanced Leadership Program', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.title_placeholder', 'למשל, תוכנית מנהיגות מתקדמת', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.description', 'Description', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.description', 'תיאור', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.description_placeholder', 'Describe what this product includes...', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.description_placeholder', 'תאר מה כולל המוצר הזה...', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.active', 'Active', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.active', 'פעיל', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.active_desc', 'Only active products can accept new enrollments', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.active_desc', 'רק מוצרים פעילים יכולים לקבל רישומים חדשים', 'admin', NOW(), NOW(), tenant_uuid),

    -- Product Types
    ('en', 'products.type.program', 'Program', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.type.program', 'תוכנית', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.type.course', 'Course', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.type.course', 'קורס', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.type.lecture', 'Lecture', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.type.lecture', 'הרצאה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.type.workshop', 'Workshop', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.type.workshop', 'סדנה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.type.webinar', 'Webinar', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.type.webinar', 'וובינר', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.type.session', 'Session', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.type.session', 'מפגש', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.type.session_pack', 'Session Pack', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.type.session_pack', 'חבילת מפגשים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.type.bundle', 'Bundle', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.type.bundle', 'חבילה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.type.custom', 'Custom', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.type.custom', 'מותאם אישית', 'admin', NOW(), NOW(), tenant_uuid),

    -- Payment Models
    ('en', 'products.payment_model', 'Payment Model', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_model', 'מודל תשלום', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_model.one_time', 'One-time Payment', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_model.one_time', 'תשלום חד-פעמי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_model.deposit_then_plan', 'Deposit + Installments', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_model.deposit_then_plan', 'מקדמה + תשלומים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_model.subscription', 'Subscription', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_model.subscription', 'מנוי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_model.free', 'Free', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_model.free', 'חינם', 'admin', NOW(), NOW(), tenant_uuid),

    -- Pricing
    ('en', 'products.price', 'Price', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.price', 'מחיר', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.currency', 'Currency', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.currency', 'מטבע', 'admin', NOW(), NOW(), tenant_uuid),

    -- Display fields
    ('en', 'products.sessions', 'sessions', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.sessions', 'מפגשים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.courses', 'courses', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.courses', 'קורסים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.requires_signature', 'Signature Required', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.requires_signature', 'נדרשת חתימה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.keap_tag', 'Keap Tag', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.keap_tag', 'תגית Keap', 'admin', NOW(), NOW(), tenant_uuid),

    -- Validation
    ('en', 'products.validation.title_required', 'Product title is required', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.validation.title_required', 'שם המוצר הוא שדה חובה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.validation.price_required', 'Price is required for paid products', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.validation.price_required', 'מחיר הוא שדה חובה עבור מוצרים בתשלום', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.validation.template_required', 'DocuSign template ID is required when signature is required', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.validation.template_required', 'מזהה תבנית DocuSign הוא שדה חובה כאשר נדרשת חתימה', 'admin', NOW(), NOW(), tenant_uuid),

    -- Common buttons (if not already exist)
    ('en', 'common.cancel', 'Cancel', 'common', NOW(), NOW(), tenant_uuid),
    ('he', 'common.cancel', 'ביטול', 'common', NOW(), NOW(), tenant_uuid),

    ('en', 'common.save', 'Save Changes', 'common', NOW(), NOW(), tenant_uuid),
    ('he', 'common.save', 'שמור שינויים', 'common', NOW(), NOW(), tenant_uuid),

    ('en', 'common.create', 'Create Product', 'common', NOW(), NOW(), tenant_uuid),
    ('he', 'common.create', 'צור מוצר', 'common', NOW(), NOW(), tenant_uuid),

    ('en', 'common.loading', 'Loading...', 'common', NOW(), NOW(), tenant_uuid),
    ('he', 'common.loading', 'טוען...', 'common', NOW(), NOW(), tenant_uuid)

  ON CONFLICT (language_code, translation_key, tenant_id) DO UPDATE
  SET translation_value = EXCLUDED.translation_value,
      updated_at = NOW();

  RAISE NOTICE 'Products page translations added successfully';
END$$;
