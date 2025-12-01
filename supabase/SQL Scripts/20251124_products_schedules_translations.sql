-- Products and Schedules Pages Translations
-- This migration adds comprehensive translations for the Products Management and Payment Schedules pages

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant ID, or use default
  SELECT id INTO tenant_uuid FROM public.tenants LIMIT 1;
  IF tenant_uuid IS NULL THEN
    tenant_uuid := '70d86807-7e7c-49cd-8601-98235444e2ac';
  END IF;

  -- Delete existing translations if they exist
  DELETE FROM public.translations
  WHERE translation_key LIKE 'admin.payments.products.%'
     OR translation_key LIKE 'admin.payments.schedules.%'
     OR translation_key IN (
       'admin.payments.cards.products.title',
       'admin.payments.cards.products.description'
     );

  -- ========================================
  -- ENGLISH TRANSLATIONS
  -- ========================================

  -- Products Page - Main
  INSERT INTO public.translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    ('en', 'admin.payments.cards.products.title', 'Products', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.cards.products.description', 'Manage billable products and pricing', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.title', 'Products', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.description', 'Manage billable products and their pricing', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.registerProduct', 'Register Product', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.back', 'Back', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.loading', 'Loading products...', 'admin', NOW(), NOW(), tenant_uuid),

  -- Products Page - Filters
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

  -- Products Page - Labels
    ('en', 'admin.payments.products.program', 'Program', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.course', 'Course', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.lecture', 'Lecture', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.workshop', 'Workshop', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.autoAssignPlan', 'Auto-assign Plan', 'admin', NOW(), NOW(), tenant_uuid),

  -- Products Page - Empty State
    ('en', 'admin.payments.products.noProductsFound', 'No products found', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.noProductsRegistered', 'No products registered', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.tryAdjustingFilters', 'Try adjusting your filters', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.registerFirst', 'Register your first product to start accepting payments', 'admin', NOW(), NOW(), tenant_uuid),

  -- Products Page - Form Dialog
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

  -- Products Page - Messages
    ('en', 'admin.payments.products.deleteConfirm', 'Are you sure you want to delete this product? This action cannot be undone.', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.deleteSuccess', 'Product deleted successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.deleteFailed', 'Failed to delete product', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.createSuccess', 'Product created successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.updateSuccess', 'Product updated successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.saveFailed', 'Failed to save product', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.products.loadFailed', 'Failed to load products', 'admin', NOW(), NOW(), tenant_uuid),

  -- ========================================
  -- Payment Schedules Page
  -- ========================================

  -- Schedules Page - Main
    ('en', 'admin.payments.schedules.title', 'Payment Schedules', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.description', 'Manage individual payment schedules and dates', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.loading', 'Loading payment schedules...', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Summary Stats
    ('en', 'admin.payments.schedules.totalScheduled', 'Total Scheduled', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.totalAmount', 'Total Amount', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.pending', 'Pending', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.paid', 'Paid', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.overdue', 'Overdue', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Filters
    ('en', 'admin.payments.schedules.search', 'Search', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.searchPlaceholder', 'Search by user or plan...', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.statusFilter', 'Status', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.allStatuses', 'All Statuses', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.processing', 'Processing', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.failed', 'Failed', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.paused', 'Paused', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Actions
    ('en', 'admin.payments.schedules.adjustDate', 'Adjust Date', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordPayment', 'Record Payment', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.resume', 'Resume', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.pause', 'Pause', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.due', 'Due', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.paidOn', 'Paid on', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Empty State
    ('en', 'admin.payments.schedules.noSchedulesFound', 'No payment schedules found', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.tryAdjusting', 'Try adjusting your filters', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.willAppear', 'Payment schedules will appear here as enrollments are created', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Adjust Date Dialog
    ('en', 'admin.payments.schedules.adjustDateTitle', 'Adjust Payment Date', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.adjustDateDescription', 'Change the scheduled payment date for this installment', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.currentDate', 'Current Date', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.newDate', 'New Date', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.reason', 'Reason', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.reasonPlaceholder', 'e.g., Customer request, billing cycle change', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.adjustDateButton', 'Adjust Date', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Record Payment Dialog
    ('en', 'admin.payments.schedules.recordPaymentTitle', 'Record Manual Payment', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordPaymentDescription', 'Record a payment that was made outside the system', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.scheduledAmount', 'Scheduled Amount', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.amountPaid', 'Amount Paid', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.notes', 'Notes', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.notesPlaceholder', 'e.g., Cash payment, bank transfer reference', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordPaymentButton', 'Record Payment', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Messages
    ('en', 'admin.payments.schedules.pauseReason', 'Please provide a reason for pausing this payment:', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.pauseSuccess', 'Payment schedule paused successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.pauseFailed', 'Failed to pause schedule', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.resumeSuccess', 'Payment schedule resumed successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.resumeFailed', 'Failed to resume schedule', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.adjustSuccess', 'Payment date adjusted successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.adjustFailed', 'Failed to adjust date', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordSuccess', 'Payment recorded successfully', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.recordFailed', 'Failed to record payment', 'admin', NOW(), NOW(), tenant_uuid),
    ('en', 'admin.payments.schedules.loadFailed', 'Failed to load payment schedules', 'admin', NOW(), NOW(), tenant_uuid);

  -- ========================================
  -- HEBREW TRANSLATIONS
  -- ========================================

  -- Products Page - Main (Hebrew)
  INSERT INTO public.translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    ('he', 'admin.payments.cards.products.title', 'מוצרים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.cards.products.description', 'ניהול מוצרים לחיוב ותמחור', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.title', 'מוצרים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.description', 'ניהול מוצרים לחיוב והתמחור שלהם', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.registerProduct', 'רישום מוצר', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.back', 'חזרה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.loading', 'טוען מוצרים...', 'admin', NOW(), NOW(), tenant_uuid),

  -- Products Page - Filters (Hebrew)
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

  -- Products Page - Labels (Hebrew)
    ('he', 'admin.payments.products.program', 'תוכנית', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.course', 'קורס', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.lecture', 'הרצאה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.workshop', 'סדנה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.autoAssignPlan', 'הקצאה אוטומטית של תוכנית', 'admin', NOW(), NOW(), tenant_uuid),

  -- Products Page - Empty State (Hebrew)
    ('he', 'admin.payments.products.noProductsFound', 'לא נמצאו מוצרים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.noProductsRegistered', 'אין מוצרים רשומים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.tryAdjustingFilters', 'נסה לשנות את המסננים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.registerFirst', 'רשום את המוצר הראשון שלך כדי להתחיל לקבל תשלומים', 'admin', NOW(), NOW(), tenant_uuid),

  -- Products Page - Form Dialog (Hebrew)
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

  -- Products Page - Messages (Hebrew)
    ('he', 'admin.payments.products.deleteConfirm', 'האם אתה בטוח שברצונך למחוק מוצר זה? פעולה זו אינה הפיכה.', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.deleteSuccess', 'המוצר נמחק בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.deleteFailed', 'מחיקת המוצר נכשלה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.createSuccess', 'המוצר נוצר בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.updateSuccess', 'המוצר עודכן בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.saveFailed', 'שמירת המוצר נכשלה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.products.loadFailed', 'טעינת המוצרים נכשלה', 'admin', NOW(), NOW(), tenant_uuid),

  -- ========================================
  -- Payment Schedules Page (Hebrew)
  -- ========================================

  -- Schedules Page - Main (Hebrew)
    ('he', 'admin.payments.schedules.title', 'לוחות תשלומים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.description', 'ניהול לוחות תשלומים פרטניים ותאריכים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.loading', 'טוען לוחות תשלומים...', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Summary Stats (Hebrew)
    ('he', 'admin.payments.schedules.totalScheduled', 'סה"כ מתוכנן', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.totalAmount', 'סכום כולל', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.pending', 'ממתין', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.paid', 'שולם', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.overdue', 'באיחור', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Filters (Hebrew)
    ('he', 'admin.payments.schedules.search', 'חיפוש', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.searchPlaceholder', 'חיפוש לפי משתמש או תוכנית...', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.statusFilter', 'סטטוס', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.allStatuses', 'כל הסטטוסים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.processing', 'בעיבוד', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.failed', 'נכשל', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.paused', 'מושהה', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Actions (Hebrew)
    ('he', 'admin.payments.schedules.adjustDate', 'התאמת תאריך', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordPayment', 'רישום תשלום', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.resume', 'המשך', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.pause', 'השהה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.due', 'תאריך יעד', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.paidOn', 'שולם ב', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Empty State (Hebrew)
    ('he', 'admin.payments.schedules.noSchedulesFound', 'לא נמצאו לוחות תשלומים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.tryAdjusting', 'נסה לשנות את המסננים', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.willAppear', 'לוחות תשלומים יופיעו כאן עם יצירת רישומים', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Adjust Date Dialog (Hebrew)
    ('he', 'admin.payments.schedules.adjustDateTitle', 'התאמת תאריך תשלום', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.adjustDateDescription', 'שינוי תאריך התשלום המתוכנן עבור תשלום זה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.currentDate', 'תאריך נוכחי', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.newDate', 'תאריך חדש', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.reason', 'סיבה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.reasonPlaceholder', 'לדוגמה: בקשת לקוח, שינוי מחזור חיוב', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.adjustDateButton', 'התאם תאריך', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Record Payment Dialog (Hebrew)
    ('he', 'admin.payments.schedules.recordPaymentTitle', 'רישום תשלום ידני', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordPaymentDescription', 'רישום תשלום שבוצע מחוץ למערכת', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.scheduledAmount', 'סכום מתוכנן', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.amountPaid', 'סכום ששולם', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.notes', 'הערות', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.notesPlaceholder', 'לדוגמה: תשלום במזומן, אסמכתא להעברה בנקאית', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordPaymentButton', 'רישום תשלום', 'admin', NOW(), NOW(), tenant_uuid),

  -- Schedules Page - Messages (Hebrew)
    ('he', 'admin.payments.schedules.pauseReason', 'אנא ספק סיבה להשהיית תשלום זה:', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.pauseSuccess', 'לוח התשלומים הושהה בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.pauseFailed', 'השהיית הלוח נכשלה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.resumeSuccess', 'לוח התשלומים חודש בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.resumeFailed', 'חידוש הלוח נכשל', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.adjustSuccess', 'תאריך התשלום הותאם בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.adjustFailed', 'התאמת התאריך נכשלה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordSuccess', 'התשלום נרשם בהצלחה', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.recordFailed', 'רישום התשלום נכשל', 'admin', NOW(), NOW(), tenant_uuid),
    ('he', 'admin.payments.schedules.loadFailed', 'טעינת לוחות התשלומים נכשלה', 'admin', NOW(), NOW(), tenant_uuid);

END $$;
