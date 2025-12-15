-- ============================================================================
-- Payment Schedules Page Complete Translations (English & Hebrew)
-- ============================================================================
-- Description: Add all translations for the payment schedules page
-- This migration adds global translations (tenant_id = NULL) for all users
-- Author: Claude Code Assistant
-- Date: 2025-11-27

DO $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Delete existing schedules translations to avoid conflicts
  DELETE FROM translations
  WHERE tenant_id IS NULL
    AND translation_key LIKE 'admin.payments.schedules.%';

  -- ============================================================================
  -- PAYMENT SCHEDULES PAGE - MAIN TRANSLATIONS
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    -- Page Header
    ('admin.payments.schedules.title', 'en', 'Payment Schedules', 'admin', NULL::uuid),
    ('admin.payments.schedules.title', 'he', 'לוחות זמני תשלום', 'admin', NULL::uuid),
    ('admin.payments.schedules.description', 'en', 'Manage all payment schedules across all enrollments', 'admin', NULL::uuid),
    ('admin.payments.schedules.description', 'he', 'נהל את כל לוחות הזמנים של תשלומים בכל ההרשמות', 'admin', NULL::uuid),

    -- Table Headers
    ('admin.payments.schedules.paymentNumber', 'en', 'Payment #', 'admin', NULL::uuid),
    ('admin.payments.schedules.paymentNumber', 'he', 'תשלום #', 'admin', NULL::uuid),
    ('admin.payments.schedules.scheduledDate', 'en', 'Scheduled Date', 'admin', NULL::uuid),
    ('admin.payments.schedules.scheduledDate', 'he', 'תאריך מתוכנן', 'admin', NULL::uuid),
    ('admin.payments.schedules.original', 'en', 'Original', 'admin', NULL::uuid),
    ('admin.payments.schedules.original', 'he', 'מקורי', 'admin', NULL::uuid),

    -- Bulk Actions
    ('admin.payments.schedules.schedulesSelected', 'en', '{count} schedule(s) selected', 'admin', NULL::uuid),
    ('admin.payments.schedules.schedulesSelected', 'he', '{count} לוחות זמנים נבחרו', 'admin', NULL::uuid),
    ('admin.payments.schedules.delayPayments', 'en', 'Delay Payments', 'admin', NULL::uuid),
    ('admin.payments.schedules.delayPayments', 'he', 'דחה תשלומים', 'admin', NULL::uuid),
    ('admin.payments.schedules.pausePayments', 'en', 'Pause Payments', 'admin', NULL::uuid),
    ('admin.payments.schedules.pausePayments', 'he', 'השהה תשלומים', 'admin', NULL::uuid),
    ('admin.payments.schedules.cancelPayments', 'en', 'Cancel Payments', 'admin', NULL::uuid),
    ('admin.payments.schedules.cancelPayments', 'he', 'בטל תשלומים', 'admin', NULL::uuid),

    -- Empty State
    ('admin.payments.schedules.noSchedulesFound', 'en', 'No Schedules Found', 'admin', NULL::uuid),
    ('admin.payments.schedules.noSchedulesFound', 'he', 'לא נמצאו לוחות זמנים', 'admin', NULL::uuid),
    ('admin.payments.schedules.noSchedulesMatch', 'en', 'No payment schedules match your current filters', 'admin', NULL::uuid),
    ('admin.payments.schedules.noSchedulesMatch', 'he', 'אין לוחות זמנים של תשלומים התואמים את הסינון הנוכחי', 'admin', NULL::uuid),

    -- Actions
    ('admin.payments.schedules.adjustDate', 'en', 'Adjust Date', 'admin', NULL::uuid),
    ('admin.payments.schedules.adjustDate', 'he', 'התאם תאריך', 'admin', NULL::uuid),
    ('admin.payments.schedules.retryPayment', 'en', 'Retry Payment', 'admin', NULL::uuid),
    ('admin.payments.schedules.retryPayment', 'he', 'נסה תשלום שנית', 'admin', NULL::uuid),
    ('admin.payments.schedules.pausePayment', 'en', 'Pause Payment', 'admin', NULL::uuid),
    ('admin.payments.schedules.pausePayment', 'he', 'השהה תשלום', 'admin', NULL::uuid),
    ('admin.payments.schedules.resumePayment', 'en', 'Resume Payment', 'admin', NULL::uuid),
    ('admin.payments.schedules.resumePayment', 'he', 'חדש תשלום', 'admin', NULL::uuid),

    -- Adjust Date Dialog
    ('admin.payments.schedules.adjustPaymentDate', 'en', 'Adjust Payment Date', 'admin', NULL::uuid),
    ('admin.payments.schedules.adjustPaymentDate', 'he', 'התאם תאריך תשלום', 'admin', NULL::uuid),
    ('admin.payments.schedules.changeScheduledDate', 'en', 'Change the scheduled date for {name}''s payment #{number}', 'admin', NULL::uuid),
    ('admin.payments.schedules.changeScheduledDate', 'he', 'שנה את התאריך המתוכנן לתשלום #{number} של {name}', 'admin', NULL::uuid),
    ('admin.payments.schedules.newDate', 'en', 'New Date', 'admin', NULL::uuid),
    ('admin.payments.schedules.newDate', 'he', 'תאריך חדש', 'admin', NULL::uuid),
    ('admin.payments.schedules.reasonPlaceholder', 'en', 'e.g., User requested extension', 'admin', NULL::uuid),
    ('admin.payments.schedules.reasonPlaceholder', 'he', 'לדוגמה, המשתמש ביקש הארכה', 'admin', NULL::uuid),

    -- Bulk Delay Dialog
    ('admin.payments.schedules.delaySelectedPayments', 'en', 'Delay {count} selected payment(s) by a specified number of days', 'admin', NULL::uuid),
    ('admin.payments.schedules.delaySelectedPayments', 'he', 'דחה {count} תשלומים נבחרים במספר ימים מוגדר', 'admin', NULL::uuid),
    ('admin.payments.schedules.daysToDelay', 'en', 'Days to Delay', 'admin', NULL::uuid),
    ('admin.payments.schedules.daysToDelay', 'he', 'ימים לדחייה', 'admin', NULL::uuid),
    ('admin.payments.schedules.delayReasonPlaceholder', 'en', 'e.g., Program start date delayed', 'admin', NULL::uuid),
    ('admin.payments.schedules.delayReasonPlaceholder', 'he', 'לדוגמה, תאריך התחלת התוכנית נדחה', 'admin', NULL::uuid),

    -- Payment Statuses (used in schedule contexts)
    ('admin.payments.schedules.statuses.paid', 'en', 'Paid', 'admin', NULL::uuid),
    ('admin.payments.schedules.statuses.paid', 'he', 'שולם', 'admin', NULL::uuid),
    ('admin.payments.schedules.statuses.partial', 'en', 'Partial', 'admin', NULL::uuid),
    ('admin.payments.schedules.statuses.partial', 'he', 'חלקי', 'admin', NULL::uuid),
    ('admin.payments.schedules.statuses.pending', 'en', 'Pending', 'admin', NULL::uuid),
    ('admin.payments.schedules.statuses.pending', 'he', 'ממתין', 'admin', NULL::uuid),
    ('admin.payments.schedules.statuses.overdue', 'en', 'Overdue', 'admin', NULL::uuid),
    ('admin.payments.schedules.statuses.overdue', 'he', 'באיחור', 'admin', NULL::uuid),

    -- Error/Success Messages
    ('admin.payments.schedules.loadError', 'en', 'Failed to load payment schedules', 'admin', NULL::uuid),
    ('admin.payments.schedules.loadError', 'he', 'נכשל בטעינת לוחות זמני התשלום', 'admin', NULL::uuid),
    ('admin.payments.schedules.adjustSuccess', 'en', 'Payment date adjusted successfully', 'admin', NULL::uuid),
    ('admin.payments.schedules.adjustSuccess', 'he', 'תאריך התשלום הותאם בהצלחה', 'admin', NULL::uuid),
    ('admin.payments.schedules.adjustError', 'en', 'Failed to adjust payment date', 'admin', NULL::uuid),
    ('admin.payments.schedules.adjustError', 'he', 'נכשל בהתאמת תאריך התשלום', 'admin', NULL::uuid),
    ('admin.payments.schedules.retrySuccess', 'en', 'Payment retry initiated', 'admin', NULL::uuid),
    ('admin.payments.schedules.retrySuccess', 'he', 'נסיון תשלום חוזר הופעל', 'admin', NULL::uuid),
    ('admin.payments.schedules.retryError', 'en', 'Failed to retry payment', 'admin', NULL::uuid),
    ('admin.payments.schedules.retryError', 'he', 'נכשל בניסיון תשלום חוזר', 'admin', NULL::uuid),
    ('admin.payments.schedules.pauseSuccess', 'en', 'Payment paused successfully', 'admin', NULL::uuid),
    ('admin.payments.schedules.pauseSuccess', 'he', 'התשלום הושהה בהצלחה', 'admin', NULL::uuid),
    ('admin.payments.schedules.pauseError', 'en', 'Failed to pause payment', 'admin', NULL::uuid),
    ('admin.payments.schedules.pauseError', 'he', 'נכשל בהשהיית התשלום', 'admin', NULL::uuid),
    ('admin.payments.schedules.resumeSuccess', 'en', 'Payment resumed successfully', 'admin', NULL::uuid),
    ('admin.payments.schedules.resumeSuccess', 'he', 'התשלום חודש בהצלחה', 'admin', NULL::uuid),
    ('admin.payments.schedules.resumeError', 'en', 'Failed to resume payment', 'admin', NULL::uuid),
    ('admin.payments.schedules.resumeError', 'he', 'נכשל בחידוש התשלום', 'admin', NULL::uuid),
    ('admin.payments.schedules.bulkDelaySuccess', 'en', '{count} payments delayed successfully', 'admin', NULL::uuid),
    ('admin.payments.schedules.bulkDelaySuccess', 'he', '{count} תשלומים נדחו בהצלחה', 'admin', NULL::uuid),
    ('admin.payments.schedules.bulkDelayError', 'en', 'Failed to delay payments', 'admin', NULL::uuid),
    ('admin.payments.schedules.bulkDelayError', 'he', 'נכשל בדחיית התשלומים', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RAISE NOTICE 'Payment Schedules page translations migration completed successfully - added % translations', v_count;
END $$;
