-- ============================================================================
-- Payment Schedules Page Translations
-- ============================================================================
-- Description: Add English and Hebrew translations for payment schedules page
-- Author: System
-- Date: 2025-01-22

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translations if they exist to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN (
      -- Common translations
      'common.refresh',
      'common.filters',
      'common.status',
      'common.allStatuses',
      'common.pending',
      'common.paid',
      'common.overdue',
      'common.failed',
      'common.paused',
      'common.dateFrom',
      'common.dateTo',
      'common.clearFilters',
      'common.clear',
      'common.user',
      'common.product',
      'common.amount',
      'common.actions',
      'common.reason',
      'common.cancel',
      -- Schedules page specific
      'admin.payments.schedules.title',
      'admin.payments.schedules.description',
      'admin.payments.schedules.schedulesSelected',
      'admin.payments.schedules.delayPayments',
      'admin.payments.schedules.pausePayments',
      'admin.payments.schedules.cancelPayments',
      'admin.payments.schedules.paymentNumber',
      'admin.payments.schedules.scheduledDate',
      'admin.payments.schedules.original',
      'admin.payments.schedules.noSchedulesFound',
      'admin.payments.schedules.noSchedulesMatch',
      'admin.payments.schedules.adjustDate',
      'admin.payments.schedules.retryPayment',
      'admin.payments.schedules.pausePayment',
      'admin.payments.schedules.resumePayment',
      'admin.payments.schedules.adjustPaymentDate',
      'admin.payments.schedules.changeScheduledDate',
      'admin.payments.schedules.newDate',
      'admin.payments.schedules.reasonPlaceholder',
      'admin.payments.schedules.delaySelectedPayments',
      'admin.payments.schedules.daysToDelay',
      'admin.payments.schedules.delayReasonPlaceholder'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES

  -- Common translations
  (v_tenant_id, 'en', 'common.refresh', 'Refresh', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.refresh', 'רענן', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.filters', 'Filters', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.filters', 'מסננים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.status', 'Status', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.status', 'סטטוס', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.allStatuses', 'All Statuses', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.allStatuses', 'כל הסטטוסים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.pending', 'Pending', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.pending', 'ממתין', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.paid', 'Paid', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.paid', 'שולם', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.overdue', 'Overdue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.overdue', 'באיחור', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.failed', 'Failed', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.failed', 'נכשל', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.paused', 'Paused', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.paused', 'מושהה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.dateFrom', 'Date From', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.dateFrom', 'תאריך מ-', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.dateTo', 'Date To', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.dateTo', 'תאריך עד-', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.clearFilters', 'Clear Filters', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.clearFilters', 'נקה מסננים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.clear', 'Clear', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.clear', 'נקה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.user', 'User', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.user', 'משתמש', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.product', 'Product', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.product', 'מוצר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.amount', 'Amount', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.amount', 'סכום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.actions', 'Actions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.actions', 'פעולות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.reason', 'Reason', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.reason', 'סיבה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'common.cancel', 'Cancel', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'common.cancel', 'ביטול', 'admin', NOW(), NOW()),

  -- Payment Schedules page translations
  (v_tenant_id, 'en', 'admin.payments.schedules.title', 'Payment Schedules', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.title', 'לוחות זמני תשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.description', 'Manage all payment schedules across all enrollments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.description', 'ניהול כל לוחות זמני התשלומים בכל ההרשמות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.schedulesSelected', '{count} schedule(s) selected', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.schedulesSelected', '{count} לוחות זמנים נבחרו', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.delayPayments', 'Delay Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.delayPayments', 'דחה תשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.pausePayments', 'Pause Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.pausePayments', 'השהה תשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.cancelPayments', 'Cancel Payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.cancelPayments', 'בטל תשלומים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.paymentNumber', 'Payment #', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.paymentNumber', 'תשלום מס׳', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.scheduledDate', 'Scheduled Date', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.scheduledDate', 'תאריך מתוכנן', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.original', 'Original', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.original', 'מקורי', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.noSchedulesFound', 'No Schedules Found', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.noSchedulesFound', 'לא נמצאו לוחות זמנים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.noSchedulesMatch', 'No payment schedules match your current filters', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.noSchedulesMatch', 'אין לוחות זמני תשלומים התואמים למסננים הנוכחיים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.adjustDate', 'Adjust Date', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.adjustDate', 'התאם תאריך', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.retryPayment', 'Retry Payment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.retryPayment', 'נסה תשלום שוב', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.pausePayment', 'Pause Payment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.pausePayment', 'השהה תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.resumePayment', 'Resume Payment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.resumePayment', 'המשך תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.adjustPaymentDate', 'Adjust Payment Date', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.adjustPaymentDate', 'התאם תאריך תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.changeScheduledDate', 'Change the scheduled date for {name}''s payment #{number}', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.changeScheduledDate', 'שנה את התאריך המתוכנן עבור תשלום מס׳ {number} של {name}', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.newDate', 'New Date', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.newDate', 'תאריך חדש', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.reasonPlaceholder', 'e.g., User requested extension', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.reasonPlaceholder', 'לדוגמה: המשתמש ביקש הארכה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.delaySelectedPayments', 'Delay {count} selected payment(s) by a specified number of days', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.delaySelectedPayments', 'דחה {count} תשלומים נבחרים במספר ימים מוגדר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.daysToDelay', 'Days to Delay', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.daysToDelay', 'ימים לדחייה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.schedules.delayReasonPlaceholder', 'e.g., Program start date delayed', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.schedules.delayReasonPlaceholder', 'לדוגמה: תאריך תחילת התוכנית נדחה', 'admin', NOW(), NOW());

  RAISE NOTICE 'Payment schedules translations added successfully';

END $$;
