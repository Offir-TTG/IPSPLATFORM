-- ============================================================================
-- Payment Transactions Page Translations
-- ============================================================================
-- Description: Add English and Hebrew translations for payment transactions page
-- Author: System
-- Date: 2025-11-24

DO $$
DECLARE
  v_tenant_id UUID := '70d86807-7e7c-49cd-8601-98235444e2ac';
BEGIN

  -- Delete existing translations if they exist to avoid duplicates
  DELETE FROM translations
  WHERE tenant_id = v_tenant_id
    AND translation_key IN (
      -- Page header
      'admin.payments.transactions.title',
      'admin.payments.transactions.description',
      'admin.payments.transactions.export',
      'admin.payments.transactions.refresh',
      -- Summary cards
      'admin.payments.transactions.totalTransactions',
      'admin.payments.transactions.totalAmount',
      'admin.payments.transactions.completed',
      'admin.payments.transactions.refunded',
      -- Filters
      'admin.payments.transactions.filters',
      'admin.payments.transactions.search',
      'admin.payments.transactions.searchPlaceholder',
      'admin.payments.transactions.allStatuses',
      'admin.payments.transactions.clearFilters',
      -- Status values
      'admin.payments.transactions.status.completed',
      'admin.payments.transactions.status.pending',
      'admin.payments.transactions.status.failed',
      'admin.payments.transactions.status.refunded',
      'admin.payments.transactions.status.partiallyRefunded',
      -- Table headers
      'admin.payments.transactions.table.date',
      'admin.payments.transactions.table.user',
      'admin.payments.transactions.table.product',
      'admin.payments.transactions.table.amount',
      'admin.payments.transactions.table.method',
      'admin.payments.transactions.table.status',
      'admin.payments.transactions.table.actions',
      -- Table content
      'admin.payments.transactions.refundedAmount',
      -- Empty state
      'admin.payments.transactions.noTransactionsFound',
      'admin.payments.transactions.noTransactionsMatch',
      -- Refund dialog
      'admin.payments.transactions.refund.title',
      'admin.payments.transactions.refund.description',
      'admin.payments.transactions.refund.type',
      'admin.payments.transactions.refund.fullRefund',
      'admin.payments.transactions.refund.partialRefund',
      'admin.payments.transactions.refund.amount',
      'admin.payments.transactions.refund.maximum',
      'admin.payments.transactions.refund.reasonPlaceholder',
      'admin.payments.transactions.refund.fullAlert',
      'admin.payments.transactions.refund.partialAlert',
      'admin.payments.transactions.refund.processButton',
      'admin.payments.transactions.refund.success',
      -- Details dialog
      'admin.payments.transactions.details.title',
      'admin.payments.transactions.details.transactionId',
      'admin.payments.transactions.details.stripePaymentIntent',
      'admin.payments.transactions.details.failureReason',
      'admin.payments.transactions.details.metadata',
      'admin.payments.transactions.details.close',
      -- Toast messages
      'admin.payments.transactions.loadError',
      'admin.payments.transactions.exportSuccess',
      'admin.payments.transactions.exportError'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES

  -- Page header
  (v_tenant_id, 'en', 'admin.payments.transactions.title', 'Payment Transactions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.title', 'עסקאות תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.description', 'View and manage all payment transactions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.description', 'הצג וניהל את כל עסקאות התשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.export', 'Export', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.export', 'יצוא', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.refresh', 'Refresh', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refresh', 'רענן', 'admin', NOW(), NOW()),

  -- Summary cards
  (v_tenant_id, 'en', 'admin.payments.transactions.totalTransactions', 'Total Transactions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.totalTransactions', 'סה"כ עסקאות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.totalAmount', 'Total Amount', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.totalAmount', 'סכום כולל', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.completed', 'Completed', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.completed', 'הושלמו', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.refunded', 'Refunded', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refunded', 'הוחזרו', 'admin', NOW(), NOW()),

  -- Filters
  (v_tenant_id, 'en', 'admin.payments.transactions.filters', 'Filters', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.filters', 'מסננים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.search', 'Search', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.search', 'חיפוש', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.searchPlaceholder', 'User name, email, or transaction ID', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.searchPlaceholder', 'שם משתמש, אימייל או מזהה עסקה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.allStatuses', 'All Statuses', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.allStatuses', 'כל הסטטוסים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.clearFilters', 'Clear Filters', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.clearFilters', 'נקה מסננים', 'admin', NOW(), NOW()),

  -- Status values
  (v_tenant_id, 'en', 'admin.payments.transactions.status.completed', 'Completed', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.status.completed', 'הושלם', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.status.pending', 'Pending', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.status.pending', 'ממתין', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.status.failed', 'Failed', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.status.failed', 'נכשל', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.status.refunded', 'Refunded', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.status.refunded', 'הוחזר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.status.partiallyRefunded', 'Partially Refunded', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.status.partiallyRefunded', 'הוחזר חלקית', 'admin', NOW(), NOW()),

  -- Table headers
  (v_tenant_id, 'en', 'admin.payments.transactions.table.date', 'Date', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.table.date', 'תאריך', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.table.user', 'User', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.table.user', 'משתמש', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.table.product', 'Product', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.table.product', 'מוצר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.table.amount', 'Amount', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.table.amount', 'סכום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.table.method', 'Method', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.table.method', 'שיטה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.table.status', 'Status', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.table.status', 'סטטוס', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.table.actions', 'Actions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.table.actions', 'פעולות', 'admin', NOW(), NOW()),

  -- Table content
  (v_tenant_id, 'en', 'admin.payments.transactions.refundedAmount', 'Refunded', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refundedAmount', 'הוחזר', 'admin', NOW(), NOW()),

  -- Empty state
  (v_tenant_id, 'en', 'admin.payments.transactions.noTransactionsFound', 'No Transactions Found', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.noTransactionsFound', 'לא נמצאו עסקאות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.noTransactionsMatch', 'No payment transactions match your current filters', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.noTransactionsMatch', 'אין עסקאות תשלום התואמות למסננים הנוכחיים', 'admin', NOW(), NOW()),

  -- Refund dialog
  (v_tenant_id, 'en', 'admin.payments.transactions.refund.title', 'Process Refund', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refund.title', 'עבד החזר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.refund.description', 'Refund payment for {user} - {product}', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refund.description', 'החזר תשלום עבור {user} - {product}', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.refund.type', 'Refund Type', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refund.type', 'סוג החזר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.refund.fullRefund', 'Full Refund', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refund.fullRefund', 'החזר מלא', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.refund.partialRefund', 'Partial Refund', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refund.partialRefund', 'החזר חלקי', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.refund.amount', 'Refund Amount', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refund.amount', 'סכום החזר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.refund.maximum', 'Maximum', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refund.maximum', 'מקסימום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.refund.reasonPlaceholder', 'e.g., User requested refund', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refund.reasonPlaceholder', 'לדוגמה: המשתמש ביקש החזר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.refund.fullAlert', 'This will refund the full payment amount to the user.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refund.fullAlert', 'פעולה זו תחזיר את מלוא סכום התשלום למשתמש.', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.refund.partialAlert', 'This will refund only the specified amount to the user.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refund.partialAlert', 'פעולה זו תחזיר רק את הסכום שצוין למשתמש.', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.refund.processButton', 'Process Refund', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refund.processButton', 'עבד החזר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.refund.success', 'Refund processed successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.refund.success', 'ההחזר עובד בהצלחה', 'admin', NOW(), NOW()),

  -- Details dialog
  (v_tenant_id, 'en', 'admin.payments.transactions.details.title', 'Transaction Details', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.details.title', 'פרטי עסקה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.details.transactionId', 'Transaction ID', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.details.transactionId', 'מזהה עסקה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.details.stripePaymentIntent', 'Stripe Payment Intent', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.details.stripePaymentIntent', 'מזהה תשלום Stripe', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.details.failureReason', 'Failure Reason', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.details.failureReason', 'סיבת כישלון', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.details.metadata', 'Metadata', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.details.metadata', 'מטא-דאטה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.details.close', 'Close', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.details.close', 'סגור', 'admin', NOW(), NOW()),

  -- Toast messages
  (v_tenant_id, 'en', 'admin.payments.transactions.loadError', 'Failed to load transactions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.loadError', 'טעינת עסקאות נכשלה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.exportSuccess', 'Transactions exported successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.exportSuccess', 'העסקאות יוצאו בהצלחה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.payments.transactions.exportError', 'Failed to export transactions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.payments.transactions.exportError', 'יצוא עסקאות נכשל', 'admin', NOW(), NOW());

  RAISE NOTICE 'Payment transactions translations added successfully';

END $$;
