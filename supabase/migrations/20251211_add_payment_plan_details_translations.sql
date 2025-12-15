-- Migration: Add payment plan details dialog translations
-- Date: 2025-12-11
-- Purpose: Add Hebrew translations for PaymentPlanDetailsDialog component

INSERT INTO translations (tenant_id, language_code, translation_key, translation_value, context, created_at, updated_at)
VALUES
  -- Dialog title and description
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.title', 'פרטי תוכנית תשלום', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.description', 'הצג את תצורת תוכנית התשלום עבור הרשמה זו', 'admin', NOW(), NOW()),

  -- Plan details fields
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.planName', 'שם תוכנית', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.paymentModel', 'מודל תשלום', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.totalAmount', 'סכום כולל', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.paidAmount', 'סכום ששולם', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.paymentStatus', 'סטטוס תשלום', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.enrollmentStatus', 'סטטוס הרשמה', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.paymentStartDate', 'תאריך התחלת תשלום', 'admin', NOW(), NOW()),

  -- Payment models
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.oneTime', 'תשלום חד פעמי', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.depositThenPlan', 'מקדמה + תשלומים', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.subscription', 'מנוי', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.free', 'חינם', 'admin', NOW(), NOW()),

  -- Installment details section
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.installmentDetails', 'פרטי תשלומים', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.depositType', 'סוג מקדמה', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.depositType.percentage', 'אחוזים', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.depositType.fixed', 'סכום קבוע', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.depositPercentage', 'אחוז מקדמה', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.depositAmount', 'סכום מקדמה', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.numberOfInstallments', 'מספר תשלומים', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.recurringPayment', 'תשלום חוזר', 'admin', NOW(), NOW()),

  -- Subscription details section
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.subscriptionDetails', 'פרטי מנוי', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.billingInterval', 'תדירות חיוב', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.trialDays', 'ימי ניסיון', 'admin', NOW(), NOW()),

  -- Payment schedule section
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.paymentSchedule', 'לוח תשלומים', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.fullPayment', 'תשלום מלא', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.depositPayment', 'מקדמה', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.installment', 'תשלום', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.payment', 'תשלום', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.dueDate', 'מועד', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.paidOn', 'שולם ב', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.noScheduleInfo', 'מידע על לוח תשלומים אינו זמין.', 'admin', NOW(), NOW()),

  -- Payment status badges
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.status.pending', 'ממתין', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.status.paid', 'שולם', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.status.overdue', 'באיחור', 'admin', NOW(), NOW()),
  (NULL::uuid, 'he', 'admin.enrollments.paymentPlanDetails.status.cancelled', 'בוטל', 'admin', NOW(), NOW())

ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  updated_at = NOW();
