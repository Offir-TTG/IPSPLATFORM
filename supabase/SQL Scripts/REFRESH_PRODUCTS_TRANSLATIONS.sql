-- REFRESH PRODUCTS TRANSLATIONS
-- This script removes all product-related translations and re-inserts them

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the default tenant UUID
  SELECT id INTO tenant_uuid FROM tenants WHERE slug = 'default' LIMIT 1;

  IF tenant_uuid IS NULL THEN
    RAISE EXCEPTION 'Default tenant not found';
  END IF;

  -- DELETE ALL PRODUCT-RELATED TRANSLATIONS
  DELETE FROM translations WHERE translation_key LIKE 'products.%' OR translation_key LIKE 'admin.payments.products.%';

  RAISE NOTICE 'Deleted all product translations';

  -- =====================================================
  -- RE-INSERT ALL TRANSLATIONS
  -- =====================================================
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES

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

    -- =====================================================
    -- Payment Plan Configuration
    -- =====================================================
    ('en', 'products.payment_plan.one_time_desc', 'Customer pays the full amount upfront in a single payment.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.one_time_desc', 'הלקוח משלם את המחיר המלא מראש בתשלום אחד.', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.free_desc', 'No payment required. This product is free for all users.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.free_desc', 'אין צורך בתשלום. מוצר זה חינמי לכל המשתמשים.', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.deposit', 'Initial Deposit', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit', 'מקדמה ראשונית', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.deposit_desc', 'Amount customer pays upfront before installments begin', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_desc', 'סכום שהלקוח משלם מראש לפני תחילת התשלומים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.deposit_type', 'Deposit Type', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_type', 'סוג מקדמה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.no_deposit', 'No Deposit', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.no_deposit', 'ללא מקדמה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.percentage', 'Percentage', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.percentage', 'אחוז', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.fixed_amount', 'Fixed Amount', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.fixed_amount', 'סכום קבוע', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.deposit_percentage', 'Deposit Percentage', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_percentage', 'אחוז מקדמה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.deposit_calc', 'Deposit:', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_calc', 'מקדמה:', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.deposit_amount', 'Deposit Amount', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.deposit_amount', 'סכום מקדמה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.start_delay', 'Start Delay (days)', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.start_delay', 'עיכוב התחלה (ימים)', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.start_delay_desc', 'Days between deposit and first installment', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.start_delay_desc', 'ימים בין המקדמה לתשלום הראשון', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.installments', 'Installment Plan', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.installments', 'תוכנית תשלומים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.installments_desc', 'Configure recurring payment schedule', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.installments_desc', 'הגדר לוח תשלומים חוזר', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.number_installments', 'Number of Installments', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.number_installments', 'מספר תשלומים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.frequency', 'Payment Frequency', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.frequency', 'תדירות תשלום', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.weekly', 'Weekly', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.weekly', 'שבועי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.biweekly', 'Bi-weekly', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.biweekly', 'דו-שבועי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.monthly', 'Monthly', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.monthly', 'חודשי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.quarterly', 'Quarterly', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.quarterly', 'רבעוני', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.annually', 'Annually', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.annually', 'שנתי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.custom', 'Custom', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.custom', 'מותאם אישית', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.custom_days', 'Custom Frequency (days)', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.custom_days', 'תדירות מותאמת (ימים)', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.subscription', 'Subscription Configuration', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.subscription', 'הגדרת מנוי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.subscription_desc', 'Recurring subscription billing', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.subscription_desc', 'חיוב מנוי חוזר', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.billing_interval', 'Billing Interval', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.billing_interval', 'מרווח חיוב', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.trial_days', 'Trial Period (days)', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.trial_days', 'תקופת ניסיון (ימים)', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.trial_desc', 'Free trial period before first charge', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.trial_desc', 'תקופת ניסיון חינמית לפני חיוב ראשון', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.preview', 'Payment Preview', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.preview', 'תצוגה מקדימה של תשלום', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.total_price', 'Total Price', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.total_price', 'מחיר כולל', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.initial_deposit', 'Initial Deposit', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.initial_deposit', 'מקדמה ראשונית', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.installment_amount', 'Installment Amount', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.installment_amount', 'סכום תשלום', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.payment_schedule', 'Payment Schedule', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.payment_schedule', 'לוח תשלומים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.total_collected', 'Total to be Collected', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.total_collected', 'סה"כ לגבייה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.subscription_price', 'Subscription Price', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.subscription_price', 'מחיר מנוי', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.trial_period', 'Trial Period', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.trial_period', 'תקופת ניסיון', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.days', 'days', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.days', 'ימים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.payment_plan.first_charge', 'First Charge', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.payment_plan.first_charge', 'חיוב ראשון', 'admin', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- Content Selector
    -- =====================================================
    ('en', 'products.bundle', 'Bundle', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.bundle', 'חבילה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.product_type', 'Product Type', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.product_type', 'סוג מוצר', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.type_desc', 'Select the type of content this product will provide access to', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.type_desc', 'בחר את סוג התוכן שהמוצר יספק גישה אליו', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.select_program', 'Select Program', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.select_program', 'בחר תוכנית', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.select_program_placeholder', 'Choose a program...', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.select_program_placeholder', 'בחר תוכנית...', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.no_programs', 'No programs available', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.no_programs', 'אין תוכניות זמינות', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.select_course', 'Select Course', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.select_course', 'בחר קורס', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.select_course_placeholder', 'Choose a standalone course...', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.select_course_placeholder', 'בחר קורס עצמאי...', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.no_standalone_courses', 'No standalone courses available', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.no_standalone_courses', 'אין קורסים עצמאיים זמינים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.no_courses', 'No courses available', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.no_courses', 'אין קורסים זמינים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.select_courses_bundle', 'Select Courses for Bundle', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.select_courses_bundle', 'בחר קורסים לחבילה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.session_count', 'Number of Sessions', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.session_count', 'מספר מפגשים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.session_count_placeholder', 'e.g., 10', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.session_count_placeholder', 'למשל, 10', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.session_count_desc', 'Number of sessions included in this pack', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.session_count_desc', 'מספר מפגשים הכלולים בחבילה זו', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.no_content_selection', 'No specific content selection required for this product type. You can add details in the title and description.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.no_content_selection', 'אין צורך בבחירת תוכן ספציפי עבור סוג מוצר זה. ניתן להוסיף פרטים בכותרת ובתיאור.', 'admin', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- DocuSign & Keap Configuration
    -- =====================================================
    ('en', 'products.docusign.title', 'DocuSign Integration', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.title', 'אינטגרציית DocuSign', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.description', 'Require electronic signature before enrollment completion', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.description', 'דרוש חתימה אלקטרונית לפני השלמת הרישום', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.require_signature', 'Require Signature', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.require_signature', 'דרוש חתימה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.require_signature_desc', 'Students must sign a document via DocuSign to complete enrollment', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.require_signature_desc', 'תלמידים חייבים לחתום על מסמך דרך DocuSign כדי להשלים את הרישום', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.template_id', 'DocuSign Template ID', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.template_id', 'מזהה תבנית DocuSign', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.template_id_placeholder', 'e.g., 12345678-abcd-1234-abcd-123456789abc', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.template_id_placeholder', 'למשל, 12345678-abcd-1234-abcd-123456789abc', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.template_id_desc', 'The ID of the DocuSign template to use for this product', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.template_id_desc', 'מזהה תבנית ה-DocuSign לשימוש במוצר זה', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.docusign.info', 'When a user enrolls in this product, they will receive a DocuSign envelope to complete before their enrollment is finalized.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.docusign.info', 'כאשר משתמש נרשם למוצר זה, הוא יקבל מעטפת DocuSign להשלמה לפני סיום הרישום שלו.', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.keap.title', 'Keap Integration', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.keap.title', 'אינטגרציית Keap', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.keap.description', 'Automatically tag contacts in Keap when they enroll', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.keap.description', 'תייג אוטומטית אנשי קשר ב-Keap כאשר הם נרשמים', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.keap.tag', 'Keap Tag', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.keap.tag', 'תגית Keap', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.keap.tag_placeholder', 'e.g., Program: Advanced Leadership', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.keap.tag_placeholder', 'למשל, תוכנית: מנהיגות מתקדמת', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.keap.tag_desc', 'Tag to apply to contacts when they enroll in this product (optional)', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.keap.tag_desc', 'תגית להחלה על אנשי קשר כאשר הם נרשמים למוצר זה (אופציונלי)', 'admin', NOW(), NOW(), tenant_uuid),

    ('en', 'products.keap.info', 'Contacts will be tagged with this tag in Keap upon enrollment.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'products.keap.info', 'אנשי קשר יתויגו עם תגית זו ב-Keap עם הרישום.', 'admin', NOW(), NOW(), tenant_uuid)

  ON CONFLICT (language_code, translation_key, tenant_id) DO NOTHING;

  RAISE NOTICE 'Products translations refreshed successfully - Total translations added';
END$$;
