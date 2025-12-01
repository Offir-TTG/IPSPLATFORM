-- ============================================================================
-- Payment Plans Page Complete Translations (English & Hebrew)
-- ============================================================================
-- Description: Add all translations for the payment plans page
-- This migration adds global translations (tenant_id = NULL) for all users
-- Author: Claude Code Assistant
-- Date: 2025-11-27

DO $$
DECLARE
  v_count integer := 0;
BEGIN
  -- Delete existing payment plans translations to avoid conflicts
  DELETE FROM translations
  WHERE tenant_id IS NULL
    AND translation_key LIKE 'admin.payments.plans.%';

  -- ============================================================================
  -- PAYMENT PLANS PAGE - MAIN TRANSLATIONS
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    -- Page Header
    ('admin.payments.plans.title', 'en', 'Payment Plans', 'admin', NULL::uuid),
    ('admin.payments.plans.title', 'he', 'תוכניות תשלום', 'admin', NULL::uuid),
    ('admin.payments.plans.description', 'en', 'Configure and manage payment plans', 'admin', NULL::uuid),
    ('admin.payments.plans.description', 'he', 'הגדר ונהל תוכניות תשלום', 'admin', NULL::uuid),
    ('admin.payments.plans.createPlan', 'en', 'Create Plan', 'admin', NULL::uuid),
    ('admin.payments.plans.createPlan', 'he', 'יצירת תוכנית', 'admin', NULL::uuid),

    -- Auto Detection Alert
    ('admin.payments.plans.autoDetection', 'en', 'Auto-Detection', 'admin', NULL::uuid),
    ('admin.payments.plans.autoDetection', 'he', 'זיהוי אוטומטי', 'admin', NULL::uuid),
    ('admin.payments.plans.autoDetectionDesc', 'en', 'Payment plans with auto-detection enabled will be automatically assigned to enrollments based on priority.', 'admin', NULL::uuid),
    ('admin.payments.plans.autoDetectionDesc', 'he', 'תוכניות תשלום עם זיהוי אוטומטי מופעל יוקצו אוטומטית להרשמות לפי עדיפות.', 'admin', NULL::uuid),

    -- Plan List - Badges & Status
    ('admin.payments.plans.default', 'en', 'Default', 'admin', NULL::uuid),
    ('admin.payments.plans.default', 'he', 'ברירת מחדל', 'admin', NULL::uuid),
    ('admin.payments.plans.autoDetect', 'en', 'Auto-Detect', 'admin', NULL::uuid),
    ('admin.payments.plans.autoDetect', 'he', 'זיהוי אוטומטי', 'admin', NULL::uuid),
    ('admin.payments.plans.inactive', 'en', 'Inactive', 'admin', NULL::uuid),
    ('admin.payments.plans.inactive', 'he', 'לא פעיל', 'admin', NULL::uuid),
    ('admin.payments.plans.priority', 'en', 'Priority', 'admin', NULL::uuid),
    ('admin.payments.plans.priority', 'he', 'עדיפות', 'admin', NULL::uuid),
    ('admin.payments.plans.enrollments', 'en', 'enrollments', 'admin', NULL::uuid),
    ('admin.payments.plans.enrollments', 'he', 'הרשמות', 'admin', NULL::uuid),

    -- Plan Types
    ('admin.payments.plans.types.oneTime', 'en', 'One-Time', 'admin', NULL::uuid),
    ('admin.payments.plans.types.oneTime', 'he', 'חד-פעמי', 'admin', NULL::uuid),
    ('admin.payments.plans.types.deposit', 'en', 'Deposit', 'admin', NULL::uuid),
    ('admin.payments.plans.types.deposit', 'he', 'מקדמה', 'admin', NULL::uuid),
    ('admin.payments.plans.types.installments', 'en', 'Installments', 'admin', NULL::uuid),
    ('admin.payments.plans.types.installments', 'he', 'תשלומים', 'admin', NULL::uuid),
    ('admin.payments.plans.types.subscription', 'en', 'Subscription', 'admin', NULL::uuid),
    ('admin.payments.plans.types.subscription', 'he', 'מנוי', 'admin', NULL::uuid),

    -- Plan Details (dynamic descriptions shown in plan cards)
    ('admin.payments.plans.details.fixedDeposit', 'en', '${amount} deposit', 'admin', NULL::uuid),
    ('admin.payments.plans.details.fixedDeposit', 'he', 'מקדמה של ${amount}', 'admin', NULL::uuid),
    ('admin.payments.plans.details.percentDeposit', 'en', '{percentage}% deposit', 'admin', NULL::uuid),
    ('admin.payments.plans.details.percentDeposit', 'he', 'מקדמה של {percentage}%', 'admin', NULL::uuid),
    ('admin.payments.plans.details.payments', 'en', '{count} {frequency} payments', 'admin', NULL::uuid),
    ('admin.payments.plans.details.payments', 'he', '{count} תשלומים {frequency}', 'admin', NULL::uuid),
    ('admin.payments.plans.details.installments', 'en', '{count} {frequency} payments', 'admin', NULL::uuid),
    ('admin.payments.plans.details.installments', 'he', '{count} תשלומים {frequency}', 'admin', NULL::uuid),
    ('admin.payments.plans.details.subscription', 'en', '{frequency} recurring billing', 'admin', NULL::uuid),
    ('admin.payments.plans.details.subscription', 'he', 'חיוב חוזר {frequency}', 'admin', NULL::uuid),
    ('admin.payments.plans.details.fullPayment', 'en', 'Pay full amount upfront', 'admin', NULL::uuid),
    ('admin.payments.plans.details.fullPayment', 'he', 'תשלום מלא מראש', 'admin', NULL::uuid),

    -- Frequency translations (for dynamic replacement)
    ('admin.payments.plans.frequency.weekly', 'en', 'weekly', 'admin', NULL::uuid),
    ('admin.payments.plans.frequency.weekly', 'he', 'שבועיים', 'admin', NULL::uuid),
    ('admin.payments.plans.frequency.biweekly', 'en', 'bi-weekly', 'admin', NULL::uuid),
    ('admin.payments.plans.frequency.biweekly', 'he', 'דו-שבועיים', 'admin', NULL::uuid),
    ('admin.payments.plans.frequency.monthly', 'en', 'monthly', 'admin', NULL::uuid),
    ('admin.payments.plans.frequency.monthly', 'he', 'חודשיים', 'admin', NULL::uuid),
    ('admin.payments.plans.frequency.quarterly', 'en', 'quarterly', 'admin', NULL::uuid),
    ('admin.payments.plans.frequency.quarterly', 'he', 'רבעוניים', 'admin', NULL::uuid),
    ('admin.payments.plans.frequency.annually', 'en', 'annually', 'admin', NULL::uuid),
    ('admin.payments.plans.frequency.annually', 'he', 'שנתיים', 'admin', NULL::uuid),

    -- Empty State
    ('admin.payments.plans.noPlans', 'en', 'No Payment Plans', 'admin', NULL::uuid),
    ('admin.payments.plans.noPlans', 'he', 'אין תוכניות תשלום', 'admin', NULL::uuid),
    ('admin.payments.plans.noPlansDesc', 'en', 'Get started by creating your first payment plan.', 'admin', NULL::uuid),
    ('admin.payments.plans.noPlansDesc', 'he', 'התחל על ידי יצירת תוכנית התשלום הראשונה שלך.', 'admin', NULL::uuid),

    -- CRUD Operations
    ('admin.payments.plans.deleteConfirm', 'en', 'Are you sure you want to delete this payment plan?', 'admin', NULL::uuid),
    ('admin.payments.plans.deleteConfirm', 'he', 'האם אתה בטוח שברצונך למחוק תוכנית תשלום זו?', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- ============================================================================
  -- FORM TRANSLATIONS
  -- ============================================================================

  INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
  SELECT * FROM (VALUES
    -- Form Header
    ('admin.payments.plans.form.editTitle', 'en', 'Edit Payment Plan', 'admin', NULL::uuid),
    ('admin.payments.plans.form.editTitle', 'he', 'עריכת תוכנית תשלום', 'admin', NULL::uuid),
    ('admin.payments.plans.form.createTitle', 'en', 'Create Payment Plan', 'admin', NULL::uuid),
    ('admin.payments.plans.form.createTitle', 'he', 'יצירת תוכנית תשלום', 'admin', NULL::uuid),
    ('admin.payments.plans.form.description', 'en', 'Configure payment plan details and settings.', 'admin', NULL::uuid),
    ('admin.payments.plans.form.description', 'he', 'הגדר פרטי תוכנית תשלום והגדרות.', 'admin', NULL::uuid),

    -- Basic Info
    ('admin.payments.plans.form.planName', 'en', 'Plan Name', 'admin', NULL::uuid),
    ('admin.payments.plans.form.planName', 'he', 'שם תוכנית', 'admin', NULL::uuid),
    ('admin.payments.plans.form.planNamePlaceholder', 'en', 'e.g., Monthly Installments', 'admin', NULL::uuid),
    ('admin.payments.plans.form.planNamePlaceholder', 'he', 'לדוגמה, תשלומים חודשיים', 'admin', NULL::uuid),
    ('admin.payments.plans.form.planDescription', 'en', 'Description', 'admin', NULL::uuid),
    ('admin.payments.plans.form.planDescription', 'he', 'תיאור', 'admin', NULL::uuid),
    ('admin.payments.plans.form.planDescriptionPlaceholder', 'en', 'Describe this payment plan...', 'admin', NULL::uuid),
    ('admin.payments.plans.form.planDescriptionPlaceholder', 'he', 'תאר את תוכנית התשלום הזו...', 'admin', NULL::uuid),
    ('admin.payments.plans.form.planType', 'en', 'Payment Type', 'admin', NULL::uuid),
    ('admin.payments.plans.form.planType', 'he', 'סוג תשלום', 'admin', NULL::uuid),

    -- Payment Types
    ('admin.payments.plans.form.oneTimePayment', 'en', 'One-Time Payment', 'admin', NULL::uuid),
    ('admin.payments.plans.form.oneTimePayment', 'he', 'תשלום חד-פעמי', 'admin', NULL::uuid),
    ('admin.payments.plans.form.depositInstallments', 'en', 'Deposit + Installments', 'admin', NULL::uuid),
    ('admin.payments.plans.form.depositInstallments', 'he', 'מקדמה + תשלומים', 'admin', NULL::uuid),
    ('admin.payments.plans.form.installmentsOnly', 'en', 'Installments Only', 'admin', NULL::uuid),
    ('admin.payments.plans.form.installmentsOnly', 'he', 'תשלומים בלבד', 'admin', NULL::uuid),
    ('admin.payments.plans.form.subscription', 'en', 'Subscription', 'admin', NULL::uuid),
    ('admin.payments.plans.form.subscription', 'he', 'מנוי', 'admin', NULL::uuid),

    -- Deposit Configuration
    ('admin.payments.plans.form.depositConfig', 'en', 'Deposit Configuration', 'admin', NULL::uuid),
    ('admin.payments.plans.form.depositConfig', 'he', 'הגדרת מקדמה', 'admin', NULL::uuid),
    ('admin.payments.plans.form.depositType', 'en', 'Deposit Type', 'admin', NULL::uuid),
    ('admin.payments.plans.form.depositType', 'he', 'סוג מקדמה', 'admin', NULL::uuid),
    ('admin.payments.plans.form.percentage', 'en', 'Percentage', 'admin', NULL::uuid),
    ('admin.payments.plans.form.percentage', 'he', 'אחוז', 'admin', NULL::uuid),
    ('admin.payments.plans.form.fixedAmount', 'en', 'Fixed Amount', 'admin', NULL::uuid),
    ('admin.payments.plans.form.fixedAmount', 'he', 'סכום קבוע', 'admin', NULL::uuid),
    ('admin.payments.plans.form.depositPercentage', 'en', 'Deposit Percentage', 'admin', NULL::uuid),
    ('admin.payments.plans.form.depositPercentage', 'he', 'אחוז מקדמה', 'admin', NULL::uuid),
    ('admin.payments.plans.form.depositAmount', 'en', 'Deposit Amount', 'admin', NULL::uuid),
    ('admin.payments.plans.form.depositAmount', 'he', 'סכום מקדמה', 'admin', NULL::uuid),

    -- Installments Configuration
    ('admin.payments.plans.form.installmentsConfig', 'en', 'Installments Configuration', 'admin', NULL::uuid),
    ('admin.payments.plans.form.installmentsConfig', 'he', 'הגדרת תשלומים', 'admin', NULL::uuid),
    ('admin.payments.plans.form.numberOfInstallments', 'en', 'Number of Installments', 'admin', NULL::uuid),
    ('admin.payments.plans.form.numberOfInstallments', 'he', 'מספר תשלומים', 'admin', NULL::uuid),
    ('admin.payments.plans.form.frequency', 'en', 'Frequency', 'admin', NULL::uuid),
    ('admin.payments.plans.form.frequency', 'he', 'תדירות', 'admin', NULL::uuid),
    ('admin.payments.plans.form.selectFrequency', 'en', 'Select frequency', 'admin', NULL::uuid),
    ('admin.payments.plans.form.selectFrequency', 'he', 'בחר תדירות', 'admin', NULL::uuid),
    ('admin.payments.plans.form.weekly', 'en', 'Weekly', 'admin', NULL::uuid),
    ('admin.payments.plans.form.weekly', 'he', 'שבועי', 'admin', NULL::uuid),
    ('admin.payments.plans.form.biweekly', 'en', 'Bi-weekly', 'admin', NULL::uuid),
    ('admin.payments.plans.form.biweekly', 'he', 'דו-שבועי', 'admin', NULL::uuid),
    ('admin.payments.plans.form.monthly', 'en', 'Monthly', 'admin', NULL::uuid),
    ('admin.payments.plans.form.monthly', 'he', 'חודשי', 'admin', NULL::uuid),

    -- Subscription Configuration
    ('admin.payments.plans.form.subscriptionConfig', 'en', 'Subscription Configuration', 'admin', NULL::uuid),
    ('admin.payments.plans.form.subscriptionConfig', 'he', 'הגדרת מנוי', 'admin', NULL::uuid),
    ('admin.payments.plans.form.billingFrequency', 'en', 'Billing Frequency', 'admin', NULL::uuid),
    ('admin.payments.plans.form.billingFrequency', 'he', 'תדירות חיוב', 'admin', NULL::uuid),
    ('admin.payments.plans.form.quarterly', 'en', 'Quarterly', 'admin', NULL::uuid),
    ('admin.payments.plans.form.quarterly', 'he', 'רבעוני', 'admin', NULL::uuid),
    ('admin.payments.plans.form.annually', 'en', 'Annually', 'admin', NULL::uuid),
    ('admin.payments.plans.form.annually', 'he', 'שנתי', 'admin', NULL::uuid),

    -- Settings
    ('admin.payments.plans.form.settings', 'en', 'Settings', 'admin', NULL::uuid),
    ('admin.payments.plans.form.settings', 'he', 'הגדרות', 'admin', NULL::uuid),
    ('admin.payments.plans.form.priorityDesc', 'en', 'Higher priority plans are selected first during auto-detection', 'admin', NULL::uuid),
    ('admin.payments.plans.form.priorityDesc', 'he', 'תוכניות עם עדיפות גבוהה יותר נבחרות ראשונות בזיהוי אוטומטי', 'admin', NULL::uuid),
    ('admin.payments.plans.form.autoDetectionEnabled', 'en', 'Auto-Detection Enabled', 'admin', NULL::uuid),
    ('admin.payments.plans.form.autoDetectionEnabled', 'he', 'זיהוי אוטומטי מופעל', 'admin', NULL::uuid),
    ('admin.payments.plans.form.autoDetectionDesc', 'en', 'Automatically assign this plan to eligible enrollments', 'admin', NULL::uuid),
    ('admin.payments.plans.form.autoDetectionDesc', 'he', 'הקצה תוכנית זו אוטומטית להרשמות זכאיות', 'admin', NULL::uuid),
    ('admin.payments.plans.form.active', 'en', 'Active', 'admin', NULL::uuid),
    ('admin.payments.plans.form.active', 'he', 'פעיל', 'admin', NULL::uuid),
    ('admin.payments.plans.form.activeDesc', 'en', 'Inactive plans cannot be assigned to new enrollments', 'admin', NULL::uuid),
    ('admin.payments.plans.form.activeDesc', 'he', 'תוכניות לא פעילות לא ניתן להקצות להרשמות חדשות', 'admin', NULL::uuid),
    ('admin.payments.plans.form.defaultPlan', 'en', 'Default Plan', 'admin', NULL::uuid),
    ('admin.payments.plans.form.defaultPlan', 'he', 'תוכנית ברירת מחדל', 'admin', NULL::uuid),
    ('admin.payments.plans.form.defaultPlanDesc', 'en', 'Use this plan when no other plan matches', 'admin', NULL::uuid),
    ('admin.payments.plans.form.defaultPlanDesc', 'he', 'השתמש בתוכנית זו כאשר אף תוכנית אחרת לא מתאימה', 'admin', NULL::uuid),

    -- Form Actions
    ('admin.payments.plans.form.cancel', 'en', 'Cancel', 'admin', NULL::uuid),
    ('admin.payments.plans.form.cancel', 'he', 'ביטול', 'admin', NULL::uuid),
    ('admin.payments.plans.form.saveChanges', 'en', 'Save Changes', 'admin', NULL::uuid),
    ('admin.payments.plans.form.saveChanges', 'he', 'שמור שינויים', 'admin', NULL::uuid),
    ('admin.payments.plans.form.createPlan', 'en', 'Create Plan', 'admin', NULL::uuid),
    ('admin.payments.plans.form.createPlan', 'he', 'יצור תוכנית', 'admin', NULL::uuid)
  ) AS t(translation_key, language_code, translation_value, context, tenant_id);

  RAISE NOTICE 'Payment Plans page translations migration completed successfully - added % translations', v_count;
END $$;
