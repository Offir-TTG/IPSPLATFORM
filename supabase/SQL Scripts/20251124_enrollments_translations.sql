-- ============================================================================
-- Enrollments Page Translations
-- ============================================================================
-- Description: Add English and Hebrew translations for enrollments page
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
      'admin.enrollments.title',
      'admin.enrollments.description',
      -- Summary cards
      'admin.enrollments.totalEnrollments',
      'admin.enrollments.active',
      'admin.enrollments.pendingPayment',
      'admin.enrollments.totalRevenue',
      -- Filters
      'admin.enrollments.filters',
      'admin.enrollments.search',
      'admin.enrollments.searchPlaceholder',
      'admin.enrollments.status',
      'admin.enrollments.paymentStatus',
      'admin.enrollments.allStatuses',
      'admin.enrollments.allPaymentStatuses',
      'admin.enrollments.clearFilters',
      -- Status values
      'admin.enrollments.status.active',
      'admin.enrollments.status.pendingPayment',
      'admin.enrollments.status.cancelled',
      'admin.enrollments.status.completed',
      -- Payment status values
      'admin.enrollments.paymentStatus.paid',
      'admin.enrollments.paymentStatus.partial',
      'admin.enrollments.paymentStatus.pending',
      'admin.enrollments.paymentStatus.overdue',
      -- Table headers
      'admin.enrollments.table.user',
      'admin.enrollments.table.product',
      'admin.enrollments.table.paymentPlan',
      'admin.enrollments.table.amount',
      'admin.enrollments.table.paymentStatus',
      'admin.enrollments.table.status',
      'admin.enrollments.table.nextPayment',
      'admin.enrollments.table.actions',
      -- Table content
      'admin.enrollments.paidPercentage',
      -- Empty state
      'admin.enrollments.noEnrollments',
      'admin.enrollments.noEnrollmentsDescription',
      -- Cancel dialog
      'admin.enrollments.cancel.title',
      'admin.enrollments.cancel.description',
      'admin.enrollments.cancel.alert',
      'admin.enrollments.cancel.reason',
      'admin.enrollments.cancel.reasonPlaceholder',
      'admin.enrollments.cancel.processRefund',
      'admin.enrollments.cancel.refundAmount',
      'admin.enrollments.cancel.maximum',
      'admin.enrollments.cancel.cancelButton',
      'admin.enrollments.cancel.success',
      'admin.enrollments.cancel.error',
      -- Manual payment dialog
      'admin.enrollments.manualPayment.title',
      'admin.enrollments.manualPayment.description',
      'admin.enrollments.manualPayment.paymentMethod',
      'admin.enrollments.manualPayment.bankTransfer',
      'admin.enrollments.manualPayment.cash',
      'admin.enrollments.manualPayment.check',
      'admin.enrollments.manualPayment.other',
      'admin.enrollments.manualPayment.reference',
      'admin.enrollments.manualPayment.referencePlaceholder',
      'admin.enrollments.manualPayment.notes',
      'admin.enrollments.manualPayment.notesPlaceholder',
      'admin.enrollments.manualPayment.alert',
      'admin.enrollments.manualPayment.recordButton',
      'admin.enrollments.manualPayment.success',
      'admin.enrollments.manualPayment.error',
      -- Toast messages
      'admin.enrollments.loadError'
    );

  -- Insert English and Hebrew translations
  INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at) VALUES

  -- Page header
  (v_tenant_id, 'en', 'admin.enrollments.title', 'Enrollments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.title', 'הרשמות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.description', 'Manage user enrollments and payments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.description', 'ניהול הרשמות משתמשים ותשלומים', 'admin', NOW(), NOW()),

  -- Summary cards
  (v_tenant_id, 'en', 'admin.enrollments.totalEnrollments', 'Total Enrollments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.totalEnrollments', 'סה"כ הרשמות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.active', 'Active', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.active', 'פעיל', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.pendingPayment', 'Pending Payment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.pendingPayment', 'ממתין לתשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.totalRevenue', 'Total Revenue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.totalRevenue', 'הכנסה כוללת', 'admin', NOW(), NOW()),

  -- Filters
  (v_tenant_id, 'en', 'admin.enrollments.filters', 'Filters', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.filters', 'מסננים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.search', 'Search', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.search', 'חיפוש', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.searchPlaceholder', 'User name, email, or product', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.searchPlaceholder', 'שם משתמש, אימייל או מוצר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.status', 'Status', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.status', 'סטטוס', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.paymentStatus', 'Payment Status', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.paymentStatus', 'סטטוס תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.allStatuses', 'All Statuses', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.allStatuses', 'כל הסטטוסים', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.allPaymentStatuses', 'All Payment Statuses', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.allPaymentStatuses', 'כל סטטוסי התשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.clearFilters', 'Clear Filters', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.clearFilters', 'נקה מסננים', 'admin', NOW(), NOW()),

  -- Status values
  (v_tenant_id, 'en', 'admin.enrollments.status.active', 'Active', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.status.active', 'פעיל', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.status.pendingPayment', 'Pending Payment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.status.pendingPayment', 'ממתין לתשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.status.cancelled', 'Cancelled', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.status.cancelled', 'מבוטל', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.status.completed', 'Completed', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.status.completed', 'הושלם', 'admin', NOW(), NOW()),

  -- Payment status values
  (v_tenant_id, 'en', 'admin.enrollments.paymentStatus.paid', 'Paid', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.paymentStatus.paid', 'שולם', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.paymentStatus.partial', 'Partial', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.paymentStatus.partial', 'חלקי', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.paymentStatus.pending', 'Pending', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.paymentStatus.pending', 'ממתין', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.paymentStatus.overdue', 'Overdue', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.paymentStatus.overdue', 'באיחור', 'admin', NOW(), NOW()),

  -- Table headers
  (v_tenant_id, 'en', 'admin.enrollments.table.user', 'User', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.table.user', 'משתמש', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.table.product', 'Product', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.table.product', 'מוצר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.table.paymentPlan', 'Payment Plan', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.table.paymentPlan', 'תוכנית תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.table.amount', 'Amount', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.table.amount', 'סכום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.table.paymentStatus', 'Payment Status', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.table.paymentStatus', 'סטטוס תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.table.status', 'Status', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.table.status', 'סטטוס', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.table.nextPayment', 'Next Payment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.table.nextPayment', 'תשלום הבא', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.table.actions', 'Actions', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.table.actions', 'פעולות', 'admin', NOW(), NOW()),

  -- Table content
  (v_tenant_id, 'en', 'admin.enrollments.paidPercentage', '% paid', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.paidPercentage', '% שולם', 'admin', NOW(), NOW()),

  -- Empty state
  (v_tenant_id, 'en', 'admin.enrollments.noEnrollments', 'No Enrollments Found', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.noEnrollments', 'לא נמצאו הרשמות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.noEnrollmentsDescription', 'No enrollments match your current filters', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.noEnrollmentsDescription', 'אין הרשמות התואמות למסננים הנוכחיים', 'admin', NOW(), NOW()),

  -- Cancel dialog
  (v_tenant_id, 'en', 'admin.enrollments.cancel.title', 'Cancel Enrollment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.cancel.title', 'ביטול הרשמה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.cancel.description', 'Cancel {user}''s enrollment in {product}', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.cancel.description', 'בטל את הרשמתו של {user} ל-{product}', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.cancel.alert', 'This action will cancel all future scheduled payments for this enrollment.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.cancel.alert', 'פעולה זו תבטל את כל התשלומים המתוזמנים העתידיים עבור הרשמה זו.', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.cancel.reason', 'Reason', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.cancel.reason', 'סיבה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.cancel.reasonPlaceholder', 'e.g., User requested cancellation', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.cancel.reasonPlaceholder', 'לדוגמה: המשתמש ביקש ביטול', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.cancel.processRefund', 'Process refund', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.cancel.processRefund', 'עבד החזר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.cancel.refundAmount', 'Refund Amount', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.cancel.refundAmount', 'סכום החזר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.cancel.maximum', 'Maximum', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.cancel.maximum', 'מקסימום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.cancel.cancelButton', 'Cancel Enrollment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.cancel.cancelButton', 'בטל הרשמה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.cancel.success', 'Enrollment cancelled successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.cancel.success', 'ההרשמה בוטלה בהצלחה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.cancel.error', 'Failed to cancel enrollment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.cancel.error', 'ביטול הרשמה נכשל', 'admin', NOW(), NOW()),

  -- Manual payment dialog
  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.title', 'Record Manual Payment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.title', 'רשום תשלום ידני', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.description', 'Record an offline payment for {user}', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.description', 'רשום תשלום לא מקוון עבור {user}', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.paymentMethod', 'Payment Method', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.paymentMethod', 'אמצעי תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.bankTransfer', 'Bank Transfer', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.bankTransfer', 'העברה בנקאית', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.cash', 'Cash', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.cash', 'מזומן', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.check', 'Check', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.check', 'צ׳ק', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.other', 'Other', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.other', 'אחר', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.reference', 'Transaction Reference', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.reference', 'אסמכתא', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.referencePlaceholder', 'e.g., TXN-12345', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.referencePlaceholder', 'לדוגמה: TXN-12345', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.notes', 'Notes', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.notes', 'הערות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.notesPlaceholder', 'Additional notes', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.notesPlaceholder', 'הערות נוספות', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.alert', 'This will mark the payment as completed without processing through Stripe.', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.alert', 'פעולה זו תסמן את התשלום כהושלם מבלי לעבד דרך Stripe.', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.recordButton', 'Record Payment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.recordButton', 'רשום תשלום', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.success', 'Manual payment recorded successfully', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.success', 'תשלום ידני נרשם בהצלחה', 'admin', NOW(), NOW()),

  (v_tenant_id, 'en', 'admin.enrollments.manualPayment.error', 'Failed to record payment', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.manualPayment.error', 'רישום תשלום נכשל', 'admin', NOW(), NOW()),

  -- Toast messages
  (v_tenant_id, 'en', 'admin.enrollments.loadError', 'Failed to load enrollments', 'admin', NOW(), NOW()),
  (v_tenant_id, 'he', 'admin.enrollments.loadError', 'טעינת הרשמות נכשלה', 'admin', NOW(), NOW());

  RAISE NOTICE 'Enrollments translations added successfully';

END $$;
