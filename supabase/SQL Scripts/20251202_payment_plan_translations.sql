-- Payment Plan Display Translations for Enrollment Page
-- These translations are used to display payment plan details in different languages

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant (or specify your tenant ID)
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Delete existing translations to avoid duplicates
  DELETE FROM translations WHERE translation_key IN (
    'enrollment.paymentPlan.frequency.monthly',
    'enrollment.paymentPlan.frequency.weekly',
    'enrollment.paymentPlan.frequency.quarterly',
    'enrollment.paymentPlan.frequency.yearly',
    'enrollment.paymentPlan.installmentsText',
    'enrollment.paymentPlan.interval.monthly',
    'enrollment.paymentPlan.interval.weekly',
    'enrollment.paymentPlan.interval.yearly',
    'enrollment.paymentPlan.subscriptionText',
    'enrollment.paymentPlan.oneTime',
    'enrollment.paymentPlan.free',
    'enrollment.paymentPlan.deposit',
    'enrollment.productType.course',
    'enrollment.productType.program',
    'enrollment.productType.bundle',
    'enrollment.productType.workshop',
    'enrollment.productType.service'
  );

  -- Insert new translations
  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  VALUES
    -- Frequency options (for deposit_then_plan)
    ('enrollment.paymentPlan.frequency.monthly', 'en', 'monthly', 'user', NULL),
    ('enrollment.paymentPlan.frequency.monthly', 'he', 'חודשיים', 'user', NULL),
    ('enrollment.paymentPlan.frequency.weekly', 'en', 'weekly', 'user', NULL),
    ('enrollment.paymentPlan.frequency.weekly', 'he', 'שבועיים', 'user', NULL),
    ('enrollment.paymentPlan.frequency.quarterly', 'en', 'quarterly', 'user', NULL),
    ('enrollment.paymentPlan.frequency.quarterly', 'he', 'רבעוניים', 'user', NULL),
    ('enrollment.paymentPlan.frequency.yearly', 'en', 'yearly', 'user', NULL),
    ('enrollment.paymentPlan.frequency.yearly', 'he', 'שנתיים', 'user', NULL),

    -- Installments text
    ('enrollment.paymentPlan.installmentsText', 'en', 'installments', 'user', NULL),
    ('enrollment.paymentPlan.installmentsText', 'he', 'תשלומים', 'user', NULL),

    -- Payment Plan Interval Translations (for subscription)
    ('enrollment.paymentPlan.interval.monthly', 'en', 'monthly', 'user', NULL),
    ('enrollment.paymentPlan.interval.monthly', 'he', 'חודשי', 'user', NULL),
    ('enrollment.paymentPlan.interval.weekly', 'en', 'weekly', 'user', NULL),
    ('enrollment.paymentPlan.interval.weekly', 'he', 'שבועי', 'user', NULL),
    ('enrollment.paymentPlan.interval.yearly', 'en', 'yearly', 'user', NULL),
    ('enrollment.paymentPlan.interval.yearly', 'he', 'שנתי', 'user', NULL),

    -- Subscription text
    ('enrollment.paymentPlan.subscriptionText', 'en', 'Subscription', 'user', NULL),
    ('enrollment.paymentPlan.subscriptionText', 'he', 'מנוי', 'user', NULL),

    -- Payment Plan Types
    ('enrollment.paymentPlan.oneTime', 'en', 'One-time payment', 'user', NULL),
    ('enrollment.paymentPlan.oneTime', 'he', 'תשלום חד פעמי', 'user', NULL),
    ('enrollment.paymentPlan.free', 'en', 'Free', 'user', NULL),
    ('enrollment.paymentPlan.free', 'he', 'חינם', 'user', NULL),

    -- Deposit text
    ('enrollment.paymentPlan.deposit', 'en', 'Deposit', 'user', NULL),
    ('enrollment.paymentPlan.deposit', 'he', 'מקדמה', 'user', NULL),

    -- Product Type Badge Translations
    ('enrollment.productType.course', 'en', 'Course', 'user', NULL),
    ('enrollment.productType.course', 'he', 'קורס', 'user', NULL),
    ('enrollment.productType.program', 'en', 'Program', 'user', NULL),
    ('enrollment.productType.program', 'he', 'תוכנית', 'user', NULL),
    ('enrollment.productType.bundle', 'en', 'Bundle', 'user', NULL),
    ('enrollment.productType.bundle', 'he', 'חבילה', 'user', NULL),
    ('enrollment.productType.workshop', 'en', 'Workshop', 'user', NULL),
    ('enrollment.productType.workshop', 'he', 'סדנה', 'user', NULL),
    ('enrollment.productType.service', 'en', 'Service', 'user', NULL),
    ('enrollment.productType.service', 'he', 'שירות', 'user', NULL);
END $$;
