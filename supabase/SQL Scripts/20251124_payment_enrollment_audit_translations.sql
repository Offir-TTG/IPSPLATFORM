-- Migration: Add Payment and Enrollment audit event translations
-- Adds Hebrew and English translations for payment transactions, disputes, and enrollments

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant's UUID, or use a default
  SELECT id INTO tenant_uuid FROM public.tenants LIMIT 1;
  IF tenant_uuid IS NULL THEN
    tenant_uuid := '70d86807-7e7c-49cd-8601-98235444e2ac';
  END IF;

  -- Delete existing payment/enrollment audit translations if they exist
  DELETE FROM public.translations WHERE translation_key LIKE 'audit.payment.%' OR translation_key LIKE 'audit.enrollment.%' OR translation_key LIKE 'audit.resource_type.%';

  -- ============================================================================
  -- ENGLISH TRANSLATIONS
  -- ============================================================================
  INSERT INTO public.translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    -- Payment Transactions
    ('en', 'audit.payment.transaction_created', 'Payment transaction created', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.transaction_created_desc', 'Created payment transaction for {amount} {currency}', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.transaction_completed', 'Payment completed', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.transaction_completed_desc', 'Payment of {amount} {currency} completed successfully', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.transaction_failed', 'Payment failed', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.transaction_failed_desc', 'Payment of {amount} {currency} failed: {reason}', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.transaction_refunded', 'Payment refunded', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.transaction_refunded_desc', 'Refunded {amount} {currency} to customer', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.transaction_updated', 'Payment transaction updated', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.transaction_updated_desc', 'Updated payment transaction {transaction_id}', 'audit', NOW(), NOW(), tenant_uuid),

    -- Payment Disputes
    ('en', 'audit.payment.dispute_created', 'Payment dispute opened', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.dispute_created_desc', 'Customer opened dispute for {amount} {currency} - Reason: {reason}', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.dispute_won', 'Dispute won', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.dispute_won_desc', 'Won dispute for transaction {transaction_id}', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.dispute_lost', 'Dispute lost', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.dispute_lost_desc', 'Lost dispute for transaction {transaction_id} - {amount} {currency} refunded', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.dispute_updated', 'Dispute updated', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.dispute_updated_desc', 'Updated dispute {dispute_id} - Status: {status}', 'audit', NOW(), NOW(), tenant_uuid),

    -- Enrollments
    ('en', 'audit.enrollment.created', 'Student enrolled', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.enrollment.created_desc', 'Enrolled {student_name} in {course_name}', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.enrollment.updated', 'Enrollment updated', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.enrollment.updated_desc', 'Updated enrollment for {student_name} in {course_name}', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.enrollment.completed', 'Enrollment completed', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.enrollment.completed_desc', '{student_name} completed {course_name}', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.enrollment.cancelled', 'Enrollment cancelled', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.enrollment.cancelled_desc', 'Cancelled enrollment for {student_name} in {course_name}', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.enrollment.progress_updated', 'Progress updated', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.enrollment.progress_updated_desc', '{student_name} progress in {course_name}: {progress}%', 'audit', NOW(), NOW(), tenant_uuid),

    -- Payment Methods
    ('en', 'audit.payment.method_added', 'Payment method added', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.method_added_desc', 'Added {method_type} ending in {last4}', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.method_removed', 'Payment method removed', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.method_removed_desc', 'Removed {method_type} ending in {last4}', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.method_updated', 'Payment method updated', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.method_updated_desc', 'Updated {method_type} ending in {last4}', 'audit', NOW(), NOW(), tenant_uuid),

    -- Subscription Events
    ('en', 'audit.payment.subscription_created', 'Subscription created', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.subscription_created_desc', 'Created subscription for {plan_name} - {amount} {currency}/{interval}', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.subscription_cancelled', 'Subscription cancelled', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.subscription_cancelled_desc', 'Cancelled subscription {subscription_id}', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.subscription_renewed', 'Subscription renewed', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.payment.subscription_renewed_desc', 'Subscription renewed for {amount} {currency}', 'audit', NOW(), NOW(), tenant_uuid),

    -- Resource Types - English
    ('en', 'audit.resource_type.payment', 'Payment', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.resource_type.payment_transaction', 'Payment Transaction', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.resource_type.payment_dispute', 'Payment Dispute', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.resource_type.enrollment', 'Enrollment', 'audit', NOW(), NOW(), tenant_uuid),
    ('en', 'audit.resource_type.subscription', 'Subscription', 'audit', NOW(), NOW(), tenant_uuid);

  -- ============================================================================
  -- HEBREW TRANSLATIONS
  -- ============================================================================
  INSERT INTO public.translations (language_code, translation_key, translation_value, category, created_at, updated_at, tenant_id) VALUES
    -- Payment Transactions
    ('he', 'audit.payment.transaction_created', 'נוצרה עסקת תשלום', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.transaction_created_desc', 'נוצרה עסקת תשלום עבור {amount} {currency}', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.transaction_completed', 'תשלום הושלם', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.transaction_completed_desc', 'תשלום של {amount} {currency} הושלם בהצלחה', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.transaction_failed', 'תשלום נכשל', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.transaction_failed_desc', 'תשלום של {amount} {currency} נכשל: {reason}', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.transaction_refunded', 'תשלום הוחזר', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.transaction_refunded_desc', 'הוחזר {amount} {currency} ללקוח', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.transaction_updated', 'עסקת תשלום עודכנה', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.transaction_updated_desc', 'עודכנה עסקת תשלום {transaction_id}', 'audit', NOW(), NOW(), tenant_uuid),

    -- Payment Disputes
    ('he', 'audit.payment.dispute_created', 'נפתח מחלוקת תשלום', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.dispute_created_desc', 'לקוח פתח מחלוקת עבור {amount} {currency} - סיבה: {reason}', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.dispute_won', 'מחלוקת הוכרעה לטובתנו', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.dispute_won_desc', 'מחלוקת הוכרעה לטובתנו עבור עסקה {transaction_id}', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.dispute_lost', 'מחלוקת הוכרעה נגדנו', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.dispute_lost_desc', 'מחלוקת הוכרעה נגדנו עבור עסקה {transaction_id} - {amount} {currency} הוחזר', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.dispute_updated', 'מחלוקת עודכנה', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.dispute_updated_desc', 'עודכנה מחלוקת {dispute_id} - סטטוס: {status}', 'audit', NOW(), NOW(), tenant_uuid),

    -- Enrollments
    ('he', 'audit.enrollment.created', 'תלמיד נרשם', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.enrollment.created_desc', '{student_name} נרשם ל{course_name}', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.enrollment.updated', 'רישום עודכן', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.enrollment.updated_desc', 'עודכן רישום עבור {student_name} ב{course_name}', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.enrollment.completed', 'רישום הושלם', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.enrollment.completed_desc', '{student_name} השלים את {course_name}', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.enrollment.cancelled', 'רישום בוטל', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.enrollment.cancelled_desc', 'בוטל רישום עבור {student_name} ב{course_name}', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.enrollment.progress_updated', 'התקדמות עודכנה', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.enrollment.progress_updated_desc', 'התקדמות {student_name} ב{course_name}: {progress}%', 'audit', NOW(), NOW(), tenant_uuid),

    -- Payment Methods
    ('he', 'audit.payment.method_added', 'אמצעי תשלום נוסף', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.method_added_desc', 'נוסף {method_type} המסתיים ב-{last4}', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.method_removed', 'אמצעי תשלום הוסר', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.method_removed_desc', 'הוסר {method_type} המסתיים ב-{last4}', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.method_updated', 'אמצעי תשלום עודכן', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.method_updated_desc', 'עודכן {method_type} המסתיים ב-{last4}', 'audit', NOW(), NOW(), tenant_uuid),

    -- Subscription Events
    ('he', 'audit.payment.subscription_created', 'מנוי נוצר', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.subscription_created_desc', 'נוצר מנוי ל{plan_name} - {amount} {currency}/{interval}', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.subscription_cancelled', 'מנוי בוטל', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.subscription_cancelled_desc', 'בוטל מנוי {subscription_id}', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.subscription_renewed', 'מנוי חודש', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.payment.subscription_renewed_desc', 'מנוי חודש עבור {amount} {currency}', 'audit', NOW(), NOW(), tenant_uuid),

    -- Resource Types - Hebrew
    ('he', 'audit.resource_type.payment', 'תשלום', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.resource_type.payment_transaction', 'עסקת תשלום', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.resource_type.payment_dispute', 'מחלוקת תשלום', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.resource_type.enrollment', 'רישום', 'audit', NOW(), NOW(), tenant_uuid),
    ('he', 'audit.resource_type.subscription', 'מנוי', 'audit', NOW(), NOW(), tenant_uuid);

END $$;
