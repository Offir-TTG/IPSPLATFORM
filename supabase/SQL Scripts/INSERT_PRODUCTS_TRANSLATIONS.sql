-- Insert Products Page Translations
-- Run this SQL directly in your Supabase SQL Editor

-- First, get the tenant_id (replace with your actual tenant ID or use the query below)
DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant (or specify your tenant ID)
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Delete existing products translations to avoid duplicates
  DELETE FROM translations WHERE translation_key LIKE 'admin.payments.products.%';
  DELETE FROM translations WHERE translation_key LIKE 'admin.payments.cards.products.%';

  -- Insert English Products Translations
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    -- Page Headers
    ('en', 'admin.payments.products.title', 'Products', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.description', 'Manage billable products and their pricing', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.registerProduct', 'Register Product', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.back', 'Back', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.loading', 'Loading products...', 'admin', NOW(), NOW(), tenant_uuid),

    -- Search and Filters
    ('en', 'admin.payments.products.search', 'Search', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.searchPlaceholder', 'Search by name or ID...', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.productType', 'Product Type', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.status', 'Status', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.allTypes', 'All Types', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.programs', 'Programs', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.courses', 'Courses', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.lectures', 'Lectures', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.workshops', 'Workshops', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.custom', 'Custom', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.all', 'All', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.active', 'Active', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.inactive', 'Inactive', 'admin', NOW(), NOW(), tenant_uuid),

    -- Product Type Labels
    ('en', 'admin.payments.products.program', 'Program', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.course', 'Course', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.lecture', 'Lecture', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.workshop', 'Workshop', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.autoAssignPlan', 'Auto-assign Plan', 'admin', NOW(), NOW(), tenant_uuid),

    -- Empty States
    ('en', 'admin.payments.products.noProductsFound', 'No products found', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.noProductsRegistered', 'No products registered', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.tryAdjustingFilters', 'Try adjusting your filters', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.registerFirst', 'Register your first product to start accepting payments', 'admin', NOW(), NOW(), tenant_uuid),

    -- Form Dialog
    ('en', 'admin.payments.products.form.editTitle', 'Edit Product', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.createTitle', 'Register Product', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.editDescription', 'Update product details and pricing', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.createDescription', 'Register a new billable product in the system', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.productType', 'Product Type', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.productId', 'Product ID', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.productIdPlaceholder', 'e.g., course-123, program-456', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.productIdHelp', 'Unique identifier for this product (cannot be changed after creation)', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.productName', 'Product Name', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.productNamePlaceholder', 'e.g., Introduction to Programming', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.price', 'Price', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.currency', 'Currency', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.settings', 'Settings', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.autoAssignPaymentPlan', 'Auto-assign Payment Plan', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.autoAssignHelp', 'Automatically detect and assign a payment plan based on rules', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.activeStatus', 'Active', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.activeHelp', 'Only active products can accept new enrollments', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.cancel', 'Cancel', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.save', 'Save Changes', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.form.register', 'Register Product', 'admin', NOW(), NOW(), tenant_uuid),

    -- Messages
    ('en', 'admin.payments.products.deleteConfirm', 'Are you sure you want to delete this product? This action cannot be undone.', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.deleteSuccess', 'Product deleted successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.deleteFailed', 'Failed to delete product', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.createSuccess', 'Product created successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.updateSuccess', 'Product updated successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.saveFailed', 'Failed to save product', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.loadFailed', 'Failed to load products', 'admin', NOW(), NOW(), tenant_uuid),

    -- Dashboard Card
    ('en', 'admin.payments.cards.products.title', 'Products', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.cards.products.description', 'Manage billable products and pricing', 'admin', NOW(), NOW(), tenant_uuid);

  -- Insert Hebrew Products Translations
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    -- Page Headers
    ('he', 'admin.payments.products.title', 'מוצרים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.description', 'ניהול מוצרים לחיוב והתמחור שלהם', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.registerProduct', 'רישום מוצר', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.back', 'חזרה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.loading', 'טוען מוצרים...', 'admin', NOW(), NOW(), tenant_uuid),

    -- Search and Filters
    ('he', 'admin.payments.products.search', 'חיפוש', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.searchPlaceholder', 'חיפוש לפי שם או מזהה...', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.productType', 'סוג מוצר', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.status', 'סטטוס', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.allTypes', 'כל הסוגים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.programs', 'תוכניות', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.courses', 'קורסים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.lectures', 'הרצאות', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.workshops', 'סדנאות', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.custom', 'מותאם אישית', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.all', 'הכל', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.active', 'פעיל', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.inactive', 'לא פעיל', 'admin', NOW(), NOW(), tenant_uuid),

    -- Product Type Labels
    ('he', 'admin.payments.products.program', 'תוכנית', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.course', 'קורס', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.lecture', 'הרצאה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.workshop', 'סדנה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.autoAssignPlan', 'הקצאה אוטומטית של תוכנית', 'admin', NOW(), NOW(), tenant_uuid),

    -- Empty States
    ('he', 'admin.payments.products.noProductsFound', 'לא נמצאו מוצרים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.noProductsRegistered', 'אין מוצרים רשומים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.tryAdjustingFilters', 'נסה לשנות את המסננים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.registerFirst', 'רשום את המוצר הראשון שלך כדי להתחיל לקבל תשלומים', 'admin', NOW(), NOW(), tenant_uuid),

    -- Form Dialog
    ('he', 'admin.payments.products.form.editTitle', 'עריכת מוצר', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.createTitle', 'רישום מוצר', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.editDescription', 'עדכון פרטי מוצר ותמחור', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.createDescription', 'רישום מוצר חדש לחיוב במערכת', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.productType', 'סוג מוצר', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.productId', 'מזהה מוצר', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.productIdPlaceholder', 'לדוגמה: course-123, program-456', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.productIdHelp', 'מזהה ייחודי למוצר זה (לא ניתן לשינוי לאחר יצירה)', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.productName', 'שם מוצר', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.productNamePlaceholder', 'לדוגמה: מבוא לתכנות', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.price', 'מחיר', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.currency', 'מטבע', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.settings', 'הגדרות', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.autoAssignPaymentPlan', 'הקצאה אוטומטית של תוכנית תשלום', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.autoAssignHelp', 'זיהוי והקצאה אוטומטית של תוכנית תשלום על פי כללים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.activeStatus', 'פעיל', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.activeHelp', 'רק מוצרים פעילים יכולים לקבל רישומים חדשים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.cancel', 'ביטול', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.save', 'שמור שינויים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.form.register', 'רישום מוצר', 'admin', NOW(), NOW(), tenant_uuid),

    -- Messages
    ('he', 'admin.payments.products.deleteConfirm', 'האם אתה בטוח שברצונך למחוק מוצר זה? פעולה זו אינה הפיכה.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.deleteSuccess', 'המוצר נמחק בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.deleteFailed', 'מחיקת המוצר נכשלה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.createSuccess', 'המוצר נוצר בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.updateSuccess', 'המוצר עודכן בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.saveFailed', 'שמירת המוצר נכשלה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.loadFailed', 'טעינת המוצרים נכשלה', 'admin', NOW(), NOW(), tenant_uuid),

    -- Dashboard Card
    ('he', 'admin.payments.cards.products.title', 'מוצרים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.cards.products.description', 'ניהול מוצרים לחיוב ותמחור', 'admin', NOW(), NOW(), tenant_uuid);

  RAISE NOTICE 'Products translations inserted successfully for tenant: %', tenant_uuid;
END $$;
