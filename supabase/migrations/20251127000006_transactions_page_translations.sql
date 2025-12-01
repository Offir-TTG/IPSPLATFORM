-- ============================================================================
-- Payment Transactions Page Complete Translations (English & Hebrew)
-- ============================================================================
-- Description: Add all translations for the payment transactions page
-- This migration adds global translations (tenant_id = NULL) for all users
-- Author: Claude Code Assistant
-- Date: 2025-11-27

DO $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Delete existing transactions translations to avoid conflicts
  DELETE FROM translations
  WHERE tenant_id IS NULL
    AND translation_key LIKE 'admin.payments.transactions.%';

  -- ============================================================================
  -- PAYMENT TRANSACTIONS PAGE - MAIN TRANSLATIONS
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    -- Page Header
    ('admin.payments.transactions.title', 'en', 'Transactions', 'admin', NULL::uuid),
    ('admin.payments.transactions.title', 'he', 'עסקאות', 'admin', NULL::uuid),
    ('admin.payments.transactions.description', 'en', 'View and manage all payment transactions', 'admin', NULL::uuid),
    ('admin.payments.transactions.description', 'he', 'הצג ונהל את כל עסקאות התשלום', 'admin', NULL::uuid),
    ('admin.payments.transactions.export', 'en', 'Export', 'admin', NULL::uuid),
    ('admin.payments.transactions.export', 'he', 'ייצוא', 'admin', NULL::uuid),
    ('admin.payments.transactions.refresh', 'en', 'Refresh', 'admin', NULL::uuid),
    ('admin.payments.transactions.refresh', 'he', 'רענן', 'admin', NULL::uuid),

    -- Summary Cards
    ('admin.payments.transactions.totalTransactions', 'en', 'Total Transactions', 'admin', NULL::uuid),
    ('admin.payments.transactions.totalTransactions', 'he', 'סך העסקאות', 'admin', NULL::uuid),
    ('admin.payments.transactions.totalAmount', 'en', 'Total Amount', 'admin', NULL::uuid),
    ('admin.payments.transactions.totalAmount', 'he', 'סכום כולל', 'admin', NULL::uuid),
    ('admin.payments.transactions.completed', 'en', 'Completed', 'admin', NULL::uuid),
    ('admin.payments.transactions.completed', 'he', 'הושלמו', 'admin', NULL::uuid),
    ('admin.payments.transactions.refunded', 'en', 'Refunded', 'admin', NULL::uuid),
    ('admin.payments.transactions.refunded', 'he', 'הוחזרו', 'admin', NULL::uuid),

    -- Filters
    ('admin.payments.transactions.filters', 'en', 'Filters', 'admin', NULL::uuid),
    ('admin.payments.transactions.filters', 'he', 'סינון', 'admin', NULL::uuid),
    ('admin.payments.transactions.search', 'en', 'Search', 'admin', NULL::uuid),
    ('admin.payments.transactions.search', 'he', 'חיפוש', 'admin', NULL::uuid),
    ('admin.payments.transactions.searchPlaceholder', 'en', 'Search by user, email, or transaction ID...', 'admin', NULL::uuid),
    ('admin.payments.transactions.searchPlaceholder', 'he', 'חפש לפי משתמש, אימייל או מזהה עסקה...', 'admin', NULL::uuid),
    ('admin.payments.transactions.allStatuses', 'en', 'All Statuses', 'admin', NULL::uuid),
    ('admin.payments.transactions.allStatuses', 'he', 'כל הסטטוסים', 'admin', NULL::uuid),
    ('admin.payments.transactions.clearFilters', 'en', 'Clear Filters', 'admin', NULL::uuid),
    ('admin.payments.transactions.clearFilters', 'he', 'נקה סינון', 'admin', NULL::uuid),

    -- Transaction Statuses
    ('admin.payments.transactions.status.completed', 'en', 'Completed', 'admin', NULL::uuid),
    ('admin.payments.transactions.status.completed', 'he', 'הושלם', 'admin', NULL::uuid),
    ('admin.payments.transactions.status.pending', 'en', 'Pending', 'admin', NULL::uuid),
    ('admin.payments.transactions.status.pending', 'he', 'ממתין', 'admin', NULL::uuid),
    ('admin.payments.transactions.status.failed', 'en', 'Failed', 'admin', NULL::uuid),
    ('admin.payments.transactions.status.failed', 'he', 'נכשל', 'admin', NULL::uuid),
    ('admin.payments.transactions.status.refunded', 'en', 'Refunded', 'admin', NULL::uuid),
    ('admin.payments.transactions.status.refunded', 'he', 'הוחזר', 'admin', NULL::uuid),

    -- Table Headers
    ('admin.payments.transactions.table.date', 'en', 'Date', 'admin', NULL::uuid),
    ('admin.payments.transactions.table.date', 'he', 'תאריך', 'admin', NULL::uuid),
    ('admin.payments.transactions.table.user', 'en', 'User', 'admin', NULL::uuid),
    ('admin.payments.transactions.table.user', 'he', 'משתמש', 'admin', NULL::uuid),
    ('admin.payments.transactions.table.product', 'en', 'Product', 'admin', NULL::uuid),
    ('admin.payments.transactions.table.product', 'he', 'מוצר', 'admin', NULL::uuid),
    ('admin.payments.transactions.table.amount', 'en', 'Amount', 'admin', NULL::uuid),
    ('admin.payments.transactions.table.amount', 'he', 'סכום', 'admin', NULL::uuid),
    ('admin.payments.transactions.table.method', 'en', 'Payment Method', 'admin', NULL::uuid),
    ('admin.payments.transactions.table.method', 'he', 'אמצעי תשלום', 'admin', NULL::uuid),
    ('admin.payments.transactions.table.status', 'en', 'Status', 'admin', NULL::uuid),
    ('admin.payments.transactions.table.status', 'he', 'סטטוס', 'admin', NULL::uuid),
    ('admin.payments.transactions.table.actions', 'en', 'Actions', 'admin', NULL::uuid),
    ('admin.payments.transactions.table.actions', 'he', 'פעולות', 'admin', NULL::uuid),

    -- Additional Fields
    ('admin.payments.transactions.refundedAmount', 'en', 'Refunded', 'admin', NULL::uuid),
    ('admin.payments.transactions.refundedAmount', 'he', 'הוחזר', 'admin', NULL::uuid),

    -- Empty State
    ('admin.payments.transactions.noTransactionsFound', 'en', 'No Transactions Found', 'admin', NULL::uuid),
    ('admin.payments.transactions.noTransactionsFound', 'he', 'לא נמצאו עסקאות', 'admin', NULL::uuid),
    ('admin.payments.transactions.noTransactionsMatch', 'en', 'No transactions match your current filters', 'admin', NULL::uuid),
    ('admin.payments.transactions.noTransactionsMatch', 'he', 'אין עסקאות התואמות את הסינון הנוכחי', 'admin', NULL::uuid),

    -- Error/Success Messages
    ('admin.payments.transactions.loadError', 'en', 'Failed to load transactions', 'admin', NULL::uuid),
    ('admin.payments.transactions.loadError', 'he', 'נכשל בטעינת עסקאות', 'admin', NULL::uuid),
    ('admin.payments.transactions.exportSuccess', 'en', 'Transactions exported successfully', 'admin', NULL::uuid),
    ('admin.payments.transactions.exportSuccess', 'he', 'עסקאות יוצאו בהצלחה', 'admin', NULL::uuid),
    ('admin.payments.transactions.exportError', 'en', 'Failed to export transactions', 'admin', NULL::uuid),
    ('admin.payments.transactions.exportError', 'he', 'נכשל בייצוא עסקאות', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.error', 'en', 'Failed to process refund', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.error', 'he', 'נכשל בעיבוד החזר', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- ============================================================================
  -- REFUND DIALOG
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('admin.payments.transactions.refund.title', 'en', 'Process Refund', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.title', 'he', 'עבד החזר', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.description', 'en', 'Refund transaction for', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.description', 'he', 'החזר עסקה עבור', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.type', 'en', 'Refund Type', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.type', 'he', 'סוג החזר', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.fullRefund', 'en', 'Full Refund', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.fullRefund', 'he', 'החזר מלא', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.partialRefund', 'en', 'Partial Refund', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.partialRefund', 'he', 'החזר חלקי', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.amount', 'en', 'Refund Amount', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.amount', 'he', 'סכום החזר', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.maximum', 'en', 'Maximum', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.maximum', 'he', 'מקסימום', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.reasonPlaceholder', 'en', 'Enter reason for refund...', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.reasonPlaceholder', 'he', 'הזן סיבה להחזר...', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.fullAlert', 'en', 'This will refund the full amount to the customer', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.fullAlert', 'he', 'זה יחזיר את הסכום המלא ללקוח', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.partialAlert', 'en', 'This will refund the specified amount to the customer', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.partialAlert', 'he', 'זה יחזיר את הסכום שצוין ללקוח', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.processButton', 'en', 'Process Refund', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.processButton', 'he', 'עבד החזר', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.success', 'en', 'Refund processed successfully', 'admin', NULL::uuid),
    ('admin.payments.transactions.refund.success', 'he', 'החזר עובד בהצלחה', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  -- ============================================================================
  -- TRANSACTION DETAILS DIALOG
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    ('admin.payments.transactions.details.title', 'en', 'Transaction Details', 'admin', NULL::uuid),
    ('admin.payments.transactions.details.title', 'he', 'פרטי עסקה', 'admin', NULL::uuid),
    ('admin.payments.transactions.details.transactionId', 'en', 'Transaction ID', 'admin', NULL::uuid),
    ('admin.payments.transactions.details.transactionId', 'he', 'מזהה עסקה', 'admin', NULL::uuid),
    ('admin.payments.transactions.details.stripePaymentIntent', 'en', 'Stripe Payment Intent', 'admin', NULL::uuid),
    ('admin.payments.transactions.details.stripePaymentIntent', 'he', 'כוונת תשלום Stripe', 'admin', NULL::uuid),
    ('admin.payments.transactions.details.failureReason', 'en', 'Failure Reason', 'admin', NULL::uuid),
    ('admin.payments.transactions.details.failureReason', 'he', 'סיבת כישלון', 'admin', NULL::uuid),
    ('admin.payments.transactions.details.metadata', 'en', 'Metadata', 'admin', NULL::uuid),
    ('admin.payments.transactions.details.metadata', 'he', 'מטא-נתונים', 'admin', NULL::uuid),
    ('admin.payments.transactions.details.close', 'en', 'Close', 'admin', NULL::uuid),
    ('admin.payments.transactions.details.close', 'he', 'סגור', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  RAISE NOTICE 'Payment Transactions page translations migration completed successfully - added translations';
END $$;
