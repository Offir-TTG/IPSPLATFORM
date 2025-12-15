-- ============================================================================
-- Complete Enrollments Page Translations (English & Hebrew)
-- ============================================================================
-- Description: Add all missing translations for enrollments page including
--              payment plan details dialog
-- Author: Claude Code Assistant
-- Date: 2025-11-27

DO $$
BEGIN
  -- Delete existing enrollments translations to avoid conflicts
  DELETE FROM translations
  WHERE tenant_id IS NULL
    AND translation_key LIKE 'admin.enrollments.%';

  -- ============================================================================
  -- ENROLLMENTS PAGE - MAIN TRANSLATIONS
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    -- Page Header
    ('admin.enrollments.title', 'en', 'Enrollments', 'admin', NULL::uuid),
    ('admin.enrollments.title', 'he', 'רישומים', 'admin', NULL::uuid),
    ('admin.enrollments.description', 'en', 'Manage user enrollments and payments', 'admin', NULL::uuid),
    ('admin.enrollments.description', 'he', 'נהל רישומי משתמשים ותשלומים', 'admin', NULL::uuid),

    -- Summary Cards
    ('admin.enrollments.totalEnrollments', 'en', 'Total Enrollments', 'admin', NULL::uuid),
    ('admin.enrollments.totalEnrollments', 'he', 'סך הכל רישומים', 'admin', NULL::uuid),
    ('admin.enrollments.active', 'en', 'Active', 'admin', NULL::uuid),
    ('admin.enrollments.active', 'he', 'פעיל', 'admin', NULL::uuid),
    ('admin.enrollments.pendingPayment', 'en', 'Pending Payment', 'admin', NULL::uuid),
    ('admin.enrollments.pendingPayment', 'he', 'ממתין לתשלום', 'admin', NULL::uuid),
    ('admin.enrollments.totalRevenue', 'en', 'Total Revenue', 'admin', NULL::uuid),
    ('admin.enrollments.totalRevenue', 'he', 'סך הכנסות', 'admin', NULL::uuid),

    -- Search and Filters
    ('admin.enrollments.searchPlaceholder', 'en', 'User name, email, or product', 'admin', NULL::uuid),
    ('admin.enrollments.searchPlaceholder', 'he', 'שם משתמש, דוא"ל או מוצר', 'admin', NULL::uuid),
    ('admin.enrollments.status', 'en', 'Status', 'admin', NULL::uuid),
    ('admin.enrollments.status', 'he', 'סטטוס', 'admin', NULL::uuid),
    ('admin.enrollments.allStatuses', 'en', 'All Statuses', 'admin', NULL::uuid),
    ('admin.enrollments.allStatuses', 'he', 'כל הסטטוסים', 'admin', NULL::uuid),
    ('admin.enrollments.paymentStatus', 'en', 'Payment Status', 'admin', NULL::uuid),
    ('admin.enrollments.paymentStatus', 'he', 'סטטוס תשלום', 'admin', NULL::uuid),
    ('admin.enrollments.allPaymentStatuses', 'en', 'All Payment Statuses', 'admin', NULL::uuid),
    ('admin.enrollments.allPaymentStatuses', 'he', 'כל סטטוסי התשלום', 'admin', NULL::uuid),
    ('admin.enrollments.clearFilters', 'en', 'Clear Filters', 'admin', NULL::uuid),
    ('admin.enrollments.clearFilters', 'he', 'נקה מסננים', 'admin', NULL::uuid),

    -- Table Headers
    ('admin.enrollments.table.user', 'en', 'User', 'admin', NULL::uuid),
    ('admin.enrollments.table.user', 'he', 'משתמש', 'admin', NULL::uuid),
    ('admin.enrollments.table.product', 'en', 'Product', 'admin', NULL::uuid),
    ('admin.enrollments.table.product', 'he', 'מוצר', 'admin', NULL::uuid),
    ('admin.enrollments.table.paymentPlan', 'en', 'Payment Plan', 'admin', NULL::uuid),
    ('admin.enrollments.table.paymentPlan', 'he', 'תוכנית תשלום', 'admin', NULL::uuid),
    ('admin.enrollments.table.amount', 'en', 'Amount', 'admin', NULL::uuid),
    ('admin.enrollments.table.amount', 'he', 'סכום', 'admin', NULL::uuid),
    ('admin.enrollments.table.paymentStatus', 'en', 'Payment Status', 'admin', NULL::uuid),
    ('admin.enrollments.table.paymentStatus', 'he', 'סטטוס תשלום', 'admin', NULL::uuid),
    ('admin.enrollments.table.status', 'en', 'Status', 'admin', NULL::uuid),
    ('admin.enrollments.table.status', 'he', 'סטטוס', 'admin', NULL::uuid),
    ('admin.enrollments.table.actions', 'en', 'Actions', 'admin', NULL::uuid),
    ('admin.enrollments.table.actions', 'he', 'פעולות', 'admin', NULL::uuid),

    -- Enrollment Status
    ('admin.enrollments.status.draft', 'en', 'Draft', 'admin', NULL::uuid),
    ('admin.enrollments.status.draft', 'he', 'טיוטה', 'admin', NULL::uuid),
    ('admin.enrollments.status.pending', 'en', 'Pending', 'admin', NULL::uuid),
    ('admin.enrollments.status.pending', 'he', 'ממתין', 'admin', NULL::uuid),
    ('admin.enrollments.status.active', 'en', 'Active', 'admin', NULL::uuid),
    ('admin.enrollments.status.active', 'he', 'פעיל', 'admin', NULL::uuid),
    ('admin.enrollments.status.suspended', 'en', 'Suspended', 'admin', NULL::uuid),
    ('admin.enrollments.status.suspended', 'he', 'מושהה', 'admin', NULL::uuid),
    ('admin.enrollments.status.cancelled', 'en', 'Cancelled', 'admin', NULL::uuid),
    ('admin.enrollments.status.cancelled', 'he', 'מבוטל', 'admin', NULL::uuid),
    ('admin.enrollments.status.completed', 'en', 'Completed', 'admin', NULL::uuid),
    ('admin.enrollments.status.completed', 'he', 'הושלם', 'admin', NULL::uuid),

    -- Payment Status
    ('admin.enrollments.paymentStatus.paid', 'en', 'Paid', 'admin', NULL::uuid),
    ('admin.enrollments.paymentStatus.paid', 'he', 'שולם', 'admin', NULL::uuid),
    ('admin.enrollments.paymentStatus.partial', 'en', 'Partial', 'admin', NULL::uuid),
    ('admin.enrollments.paymentStatus.partial', 'he', 'חלקי', 'admin', NULL::uuid),
    ('admin.enrollments.paymentStatus.pending', 'en', 'Pending', 'admin', NULL::uuid),
    ('admin.enrollments.paymentStatus.pending', 'he', 'ממתין', 'admin', NULL::uuid),
    ('admin.enrollments.paymentStatus.overdue', 'en', 'Overdue', 'admin', NULL::uuid),
    ('admin.enrollments.paymentStatus.overdue', 'he', 'באיחור', 'admin', NULL::uuid),

    -- Other
    ('admin.enrollments.paidPercentage', 'en', '% paid', 'admin', NULL::uuid),
    ('admin.enrollments.paidPercentage', 'he', '% שולם', 'admin', NULL::uuid),
    ('admin.enrollments.noEnrollments', 'en', 'No enrollments found', 'admin', NULL::uuid),
    ('admin.enrollments.noEnrollments', 'he', 'לא נמצאו רישומים', 'admin', NULL::uuid),
    ('admin.enrollments.noEnrollmentsDescription', 'en', 'No enrollments match your current filters', 'admin', NULL::uuid),
    ('admin.enrollments.noEnrollmentsDescription', 'he', 'אין רישומים התואמים את הסינון הנוכחי', 'admin', NULL::uuid),
    ('admin.enrollments.loadError', 'en', 'Failed to load enrollments', 'admin', NULL::uuid),
    ('admin.enrollments.loadError', 'he', 'נכשל בטעינת רישומים', 'admin', NULL::uuid),

    -- Actions
    ('admin.enrollments.sendLink', 'en', 'Send enrollment link', 'admin', NULL::uuid),
    ('admin.enrollments.sendLink', 'he', 'שלח קישור לרישום', 'admin', NULL::uuid),
    ('admin.enrollments.sendLink.success', 'en', 'Enrollment link sent', 'admin', NULL::uuid),
    ('admin.enrollments.sendLink.success', 'he', 'קישור לרישום נשלח', 'admin', NULL::uuid),
    ('admin.enrollments.edit', 'en', 'Edit enrollment', 'admin', NULL::uuid),
    ('admin.enrollments.edit', 'he', 'ערוך רישום', 'admin', NULL::uuid),
    ('admin.enrollments.delete', 'en', 'Delete enrollment', 'admin', NULL::uuid),
    ('admin.enrollments.delete', 'he', 'מחק רישום', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  -- ============================================================================
  -- PAYMENT PLAN DETAILS DIALOG
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    -- Dialog Header
    ('admin.enrollments.paymentPlanDetails.title', 'en', 'Payment Plan Details', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.title', 'he', 'פרטי תוכנית תשלום', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.description', 'en', 'View payment plan configuration for this enrollment', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.description', 'he', 'צפה בתצורת תוכנית התשלום עבור רישום זה', 'admin', NULL::uuid),

    -- Basic Info
    ('admin.enrollments.paymentPlanDetails.planName', 'en', 'Plan Name', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.planName', 'he', 'שם תוכנית', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.paymentModel', 'en', 'Payment Model', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.paymentModel', 'he', 'מודל תשלום', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.totalAmount', 'en', 'Total Amount', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.totalAmount', 'he', 'סכום כולל', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.paidAmount', 'en', 'Paid Amount', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.paidAmount', 'he', 'סכום ששולם', 'admin', NULL::uuid),

    -- Payment Models
    ('admin.enrollments.paymentPlanDetails.oneTime', 'en', 'One-Time Payment', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.oneTime', 'he', 'תשלום חד-פעמי', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.depositThenPlan', 'en', 'Deposit + Installments', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.depositThenPlan', 'he', 'מקדמה + תשלומים', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.subscription', 'en', 'Subscription', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.subscription', 'he', 'מנוי', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.free', 'en', 'Free', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.free', 'he', 'חינם', 'admin', NULL::uuid),

    -- Installment Details
    ('admin.enrollments.paymentPlanDetails.installmentDetails', 'en', 'Installment Details', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.installmentDetails', 'he', 'פרטי תשלומים', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.depositType', 'en', 'Deposit Type', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.depositType', 'he', 'סוג מקדמה', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.depositPercentage', 'en', 'Deposit Percentage', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.depositPercentage', 'he', 'אחוז מקדמה', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.numberOfInstallments', 'en', 'Number of Installments', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.numberOfInstallments', 'he', 'מספר תשלומים', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.frequency', 'en', 'Frequency', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.frequency', 'he', 'תדירות', 'admin', NULL::uuid),

    -- Subscription Details
    ('admin.enrollments.paymentPlanDetails.subscriptionDetails', 'en', 'Subscription Details', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.subscriptionDetails', 'he', 'פרטי מנוי', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.billingInterval', 'en', 'Billing Interval', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.billingInterval', 'he', 'מרווח חיוב', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.trialDays', 'en', 'Trial Days', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.trialDays', 'he', 'ימי ניסיון', 'admin', NULL::uuid),

    -- Status
    ('admin.enrollments.paymentPlanDetails.paymentStatus', 'en', 'Payment Status', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.paymentStatus', 'he', 'סטטוס תשלום', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.enrollmentStatus', 'en', 'Enrollment Status', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.enrollmentStatus', 'he', 'סטטוס רישום', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.nextPaymentDate', 'en', 'Next Payment Date', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlanDetails.nextPaymentDate', 'he', 'תאריך תשלום הבא', 'admin', NULL::uuid),

    -- Payment Plan Display Names
    ('admin.enrollments.paymentPlan.oneTime', 'en', 'One-Time Payment', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.oneTime', 'he', 'תשלום חד-פעמי', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.deposit', 'en', 'Deposit + {count} Installments', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.deposit', 'he', 'מקדמה + {count} תשלומים', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.free', 'en', 'Free', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.free', 'he', 'חינם', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.notAvailable', 'en', 'N/A', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.notAvailable', 'he', 'לא זמין', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.subscriptionLabel', 'en', 'Subscription', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.subscriptionLabel', 'he', 'מנוי', 'admin', NULL::uuid),

    -- Payment Plan Frequencies
    ('admin.enrollments.paymentPlan.frequency.weekly', 'en', 'Weekly Installments', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.frequency.weekly', 'he', 'תשלומים שבועיים', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.frequency.biweekly', 'en', 'Bi-weekly Installments', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.frequency.biweekly', 'he', 'תשלומים דו-שבועיים', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.frequency.monthly', 'en', 'Monthly Installments', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.frequency.monthly', 'he', 'תשלומים חודשיים', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.frequency.quarterly', 'en', 'Quarterly Installments', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.frequency.quarterly', 'he', 'תשלומים רבעוניים', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.frequency.annually', 'en', 'Annual Installments', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.frequency.annually', 'he', 'תשלומים שנתיים', 'admin', NULL::uuid),

    -- Payment Plan Intervals (for subscriptions)
    ('admin.enrollments.paymentPlan.interval.weekly', 'en', 'Weekly', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.interval.weekly', 'he', 'שבועי', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.interval.monthly', 'en', 'Monthly', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.interval.monthly', 'he', 'חודשי', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.interval.quarterly', 'en', 'Quarterly', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.interval.quarterly', 'he', 'רבעוני', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.interval.annually', 'en', 'Annual', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.interval.annually', 'he', 'שנתי', 'admin', NULL::uuid),

    -- Product Types
    ('admin.enrollments.productType.program', 'en', 'Program', 'admin', NULL::uuid),
    ('admin.enrollments.productType.program', 'he', 'תוכנית', 'admin', NULL::uuid),
    ('admin.enrollments.productType.course', 'en', 'Course', 'admin', NULL::uuid),
    ('admin.enrollments.productType.course', 'he', 'קורס', 'admin', NULL::uuid),
    ('admin.enrollments.productType.standalone_course', 'en', 'Standalone Course', 'admin', NULL::uuid),
    ('admin.enrollments.productType.standalone_course', 'he', 'קורס עצמאי', 'admin', NULL::uuid),

    -- Edit Enrollment Dialog
    ('admin.enrollments.edit.title', 'en', 'Edit Enrollment', 'admin', NULL::uuid),
    ('admin.enrollments.edit.title', 'he', 'עריכת רישום', 'admin', NULL::uuid),
    ('admin.enrollments.edit.description', 'en', 'Update enrollment details (only available for draft enrollments)', 'admin', NULL::uuid),
    ('admin.enrollments.edit.description', 'he', 'עדכן פרטי רישום (זמין רק עבור רישומים בטיוטה)', 'admin', NULL::uuid),
    ('admin.enrollments.edit.user', 'en', 'User', 'admin', NULL::uuid),
    ('admin.enrollments.edit.user', 'he', 'משתמש', 'admin', NULL::uuid),
    ('admin.enrollments.edit.selectProduct', 'en', 'Select Product', 'admin', NULL::uuid),
    ('admin.enrollments.edit.selectProduct', 'he', 'בחר מוצר', 'admin', NULL::uuid),
    ('admin.enrollments.edit.selectProductPlaceholder', 'en', 'Choose a product...', 'admin', NULL::uuid),
    ('admin.enrollments.edit.selectProductPlaceholder', 'he', 'בחר מוצר...', 'admin', NULL::uuid),
    ('admin.enrollments.edit.noProducts', 'en', 'No products found', 'admin', NULL::uuid),
    ('admin.enrollments.edit.noProducts', 'he', 'לא נמצאו מוצרים', 'admin', NULL::uuid),
    ('admin.enrollments.edit.expiryDate', 'en', 'Expiry Date (Optional)', 'admin', NULL::uuid),
    ('admin.enrollments.edit.expiryDate', 'he', 'תאריך תפוגה (אופציונלי)', 'admin', NULL::uuid),
    ('admin.enrollments.edit.submit', 'en', 'Update Enrollment', 'admin', NULL::uuid),
    ('admin.enrollments.edit.submit', 'he', 'עדכן רישום', 'admin', NULL::uuid),
    ('admin.enrollments.edit.validationError', 'en', 'Please select a product', 'admin', NULL::uuid),
    ('admin.enrollments.edit.validationError', 'he', 'אנא בחר מוצר', 'admin', NULL::uuid),
    ('admin.enrollments.edit.success', 'en', 'Enrollment updated successfully', 'admin', NULL::uuid),
    ('admin.enrollments.edit.success', 'he', 'הרישום עודכן בהצלחה', 'admin', NULL::uuid),
    ('admin.enrollments.edit.error', 'en', 'Failed to update enrollment', 'admin', NULL::uuid),
    ('admin.enrollments.edit.error', 'he', 'נכשל בעדכון הרישום', 'admin', NULL::uuid),

    -- Create Enrollment
    ('admin.enrollments.createEnrollment', 'en', 'Create Enrollment', 'admin', NULL::uuid),
    ('admin.enrollments.createEnrollment', 'he', 'צור רישום', 'admin', NULL::uuid),

    -- Cancel Enrollment Dialog
    ('admin.enrollments.cancel.title', 'en', 'Cancel Enrollment', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.title', 'he', 'בטל רישום', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.description', 'en', 'Cancel {user}''s enrollment in {product}', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.description', 'he', 'בטל את הרישום של {user} ב{product}', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.alert', 'en', 'This action will cancel all future scheduled payments for this enrollment.', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.alert', 'he', 'פעולה זו תבטל את כל התשלומים המתוכננים עבור רישום זה.', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.reason', 'en', 'Reason', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.reason', 'he', 'סיבה', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.reasonPlaceholder', 'en', 'e.g., User requested cancellation', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.reasonPlaceholder', 'he', 'לדוגמה, המשתמש ביקש ביטול', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.processRefund', 'en', 'Process refund', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.processRefund', 'he', 'עבד החזר', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.refundAmount', 'en', 'Refund Amount', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.refundAmount', 'he', 'סכום החזר', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.maximum', 'en', 'Maximum', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.maximum', 'he', 'מקסימום', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.cancelButton', 'en', 'Cancel Enrollment', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.cancelButton', 'he', 'בטל רישום', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.success', 'en', 'Enrollment cancelled successfully', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.success', 'he', 'הרישום בוטל בהצלחה', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.error', 'en', 'Failed to cancel enrollment', 'admin', NULL::uuid),
    ('admin.enrollments.cancel.error', 'he', 'נכשל בביטול הרישום', 'admin', NULL::uuid),

    -- Manual Payment Dialog
    ('admin.enrollments.manualPayment.title', 'en', 'Record Manual Payment', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.title', 'he', 'רשום תשלום ידני', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.description', 'en', 'Record an offline payment for {user}', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.description', 'he', 'רשום תשלום מחוץ לרשת עבור {user}', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.paymentMethod', 'en', 'Payment Method', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.paymentMethod', 'he', 'אמצעי תשלום', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.bankTransfer', 'en', 'Bank Transfer', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.bankTransfer', 'he', 'העברה בנקאית', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.cash', 'en', 'Cash', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.cash', 'he', 'מזומן', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.check', 'en', 'Check', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.check', 'he', 'המחאה', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.other', 'en', 'Other', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.other', 'he', 'אחר', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.reference', 'en', 'Transaction Reference', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.reference', 'he', 'אסמכתא עסקה', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.referencePlaceholder', 'en', 'e.g., TXN-12345', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.referencePlaceholder', 'he', 'לדוגמה, TXN-12345', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.notes', 'en', 'Notes', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.notes', 'he', 'הערות', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.notesPlaceholder', 'en', 'Additional notes', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.notesPlaceholder', 'he', 'הערות נוספות', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.alert', 'en', 'This will mark the payment as completed without processing through Stripe.', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.alert', 'he', 'זה יסמן את התשלום כהושלם מבלי לעבד דרך Stripe.', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.recordButton', 'en', 'Record Payment', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.recordButton', 'he', 'רשום תשלום', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.success', 'en', 'Manual payment recorded successfully', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.success', 'he', 'תשלום ידני נרשם בהצלחה', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.error', 'en', 'Failed to record payment', 'admin', NULL::uuid),
    ('admin.enrollments.manualPayment.error', 'he', 'נכשל ברישום התשלום', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  RAISE NOTICE 'Complete enrollments page translations added successfully';
END$$;
