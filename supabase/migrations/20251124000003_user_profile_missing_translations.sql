-- =====================================================
-- Profile Page Missing Translations
-- =====================================================
-- This migration adds missing translation keys for:
-- 1. Role badges (student)
-- 2. Billing cycle values (monthly, yearly, etc.)
-- 3. Payment/invoice status values (paid, pending, failed, etc.)
--
-- Total: 8 keys × 2 languages = 16 rows
-- =====================================================

DO $$
DECLARE
  tenant_uuid UUID;
BEGIN
  -- Get the first tenant UUID
  SELECT id INTO tenant_uuid FROM tenants LIMIT 1;

  -- Insert missing translations
  INSERT INTO translations (language_code, translation_key, translation_value, context, created_at, updated_at, tenant_id) VALUES
    -- =====================================================
    -- ROLE BADGES (1 key)
    -- =====================================================
    -- English
    ('en', 'user.profile.role.student', 'Student', 'user', NOW(), NOW(), tenant_uuid),
    -- Hebrew
    ('he', 'user.profile.role.student', 'תלמיד', 'user', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- BILLING CYCLE VALUES (3 keys)
    -- =====================================================
    -- English
    ('en', 'user.profile.billing.cycle.monthly', 'Monthly', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.cycle.yearly', 'Yearly', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.cycle.quarterly', 'Quarterly', 'user', NOW(), NOW(), tenant_uuid),
    -- Hebrew
    ('he', 'user.profile.billing.cycle.monthly', 'חודשי', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.cycle.yearly', 'שנתי', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.cycle.quarterly', 'רבעוני', 'user', NOW(), NOW(), tenant_uuid),

    -- =====================================================
    -- PAYMENT/INVOICE STATUS VALUES (4 keys)
    -- =====================================================
    -- English
    ('en', 'user.profile.billing.status.paid', 'Paid', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.status.pending', 'Pending', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.status.failed', 'Failed', 'user', NOW(), NOW(), tenant_uuid),
    ('en', 'user.profile.billing.status.refunded', 'Refunded', 'user', NOW(), NOW(), tenant_uuid),
    -- Hebrew
    ('he', 'user.profile.billing.status.paid', 'שולם', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.status.pending', 'ממתין', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.status.failed', 'נכשל', 'user', NOW(), NOW(), tenant_uuid),
    ('he', 'user.profile.billing.status.refunded', 'הוחזר', 'user', NOW(), NOW(), tenant_uuid)
  ON CONFLICT (tenant_id, language_code, translation_key)
  DO UPDATE SET
    translation_value = EXCLUDED.translation_value,
    updated_at = NOW();

  RAISE NOTICE 'Successfully added 8 missing Profile page translation keys (16 total rows): Role (1), Billing Cycles (3), Payment Status (4)';

END $$;
