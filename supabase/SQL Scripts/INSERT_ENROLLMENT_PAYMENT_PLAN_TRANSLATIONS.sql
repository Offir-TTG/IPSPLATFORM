-- ============================================================================
-- Insert Missing Enrollment Payment Plan Translations
-- ============================================================================
-- Run this script manually in Supabase SQL Editor
-- Adds translations for payment plan names in enrollment list
-- ============================================================================

DO $$
BEGIN
  -- Delete existing payment plan translations to avoid conflicts
  DELETE FROM translations
  WHERE tenant_id IS NULL
    AND translation_key LIKE 'admin.enrollments.paymentPlan.%';

  -- Insert all payment plan translations
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    -- Payment Plan Display Names
    ('admin.enrollments.paymentPlan.oneTime', 'en', 'One-Time Payment', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.oneTime', 'he', 'תשלום חד-פעמי', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.free', 'en', 'Free', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.free', 'he', 'חינם', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.notAvailable', 'en', 'N/A', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.notAvailable', 'he', 'לא זמין', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.subscriptionLabel', 'en', 'Subscription', 'admin', NULL::uuid),
    ('admin.enrollments.paymentPlan.subscriptionLabel', 'he', 'מנוי', 'admin', NULL::uuid),

    -- Payment Plan Frequencies (for installments)
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
    ('admin.enrollments.paymentPlan.interval.annually', 'he', 'שנתי', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  RAISE NOTICE 'Payment plan translations for enrollments added successfully!';
END$$;
