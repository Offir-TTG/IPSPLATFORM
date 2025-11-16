-- ============================================================================
-- ENHANCE TENANT SCHEMA WITH ORGANIZATION INFORMATION
-- ============================================================================
-- This migration adds comprehensive organization information fields to tenants
-- ============================================================================

-- Add new columns to tenants table
ALTER TABLE tenants
  -- Organization Details
  ADD COLUMN IF NOT EXISTS organization_type TEXT CHECK (organization_type IN (
    'university', 'college', 'school', 'training_center',
    'corporate', 'non_profit', 'government', 'other'
  )),
  ADD COLUMN IF NOT EXISTS industry TEXT,
  ADD COLUMN IF NOT EXISTS organization_size TEXT CHECK (organization_size IN (
    '1-50', '51-200', '201-500', '501-1000', '1000+'
  )),
  ADD COLUMN IF NOT EXISTS website_url TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,

  -- Contact Information Enhancement
  ADD COLUMN IF NOT EXISTS phone_number TEXT,
  ADD COLUMN IF NOT EXISTS support_phone TEXT,

  -- Address Information
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state_province TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,

  -- Tax & Legal
  ADD COLUMN IF NOT EXISTS tax_id TEXT, -- VAT/EIN/Tax number
  ADD COLUMN IF NOT EXISTS legal_name TEXT, -- Official registered name
  ADD COLUMN IF NOT EXISTS registration_number TEXT, -- Business registration number

  -- Settings & Preferences
  ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'MM/DD/YYYY',
  ADD COLUMN IF NOT EXISTS time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
  ADD COLUMN IF NOT EXISTS week_start TEXT DEFAULT 'sunday' CHECK (week_start IN ('sunday', 'monday')),

  -- Onboarding & Status
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS invitation_token TEXT UNIQUE, -- Token for initial admin setup
  ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMPTZ,

  -- Subscription Management (for future)
  ADD COLUMN IF NOT EXISTS subscription_id TEXT, -- External subscription ID (Stripe, etc.)
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'pending' CHECK (subscription_status IN (
    'pending', 'active', 'past_due', 'canceled', 'trialing'
  )),
  ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_current_period_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ,

  -- Billing
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN (
    'monthly', 'quarterly', 'annually'
  )),
  ADD COLUMN IF NOT EXISTS payment_method_type TEXT, -- 'card', 'invoice', 'wire', etc.
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,

  -- Feature Limits (more granular)
  ADD COLUMN IF NOT EXISTS max_storage_per_user_mb INTEGER DEFAULT 500,
  ADD COLUMN IF NOT EXISTS max_file_upload_size_mb INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS max_video_duration_minutes INTEGER DEFAULT 120,
  ADD COLUMN IF NOT EXISTS max_concurrent_sessions INTEGER DEFAULT 1,

  -- Branding Enhancement
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS custom_css TEXT,
  ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_domain_verified_at TIMESTAMPTZ,

  -- Communication Preferences
  ADD COLUMN IF NOT EXISTS notification_email TEXT, -- For system notifications
  ADD COLUMN IF NOT EXISTS technical_contact_email TEXT,
  ADD COLUMN IF NOT EXISTS technical_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS technical_contact_phone TEXT,

  -- Notes & Tags
  ADD COLUMN IF NOT EXISTS internal_notes TEXT, -- Super admin notes
  ADD COLUMN IF NOT EXISTS tags TEXT[], -- For categorization ['vip', 'requires-attention']

  -- Risk & Compliance
  ADD COLUMN IF NOT EXISTS requires_data_residency BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS data_residency_region TEXT,
  ADD COLUMN IF NOT EXISTS gdpr_compliant BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sso_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sso_provider TEXT,

  -- Success Metrics
  ADD COLUMN IF NOT EXISTS customer_success_manager TEXT, -- Email of assigned CSM
  ADD COLUMN IF NOT EXISTS health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS churn_risk TEXT CHECK (churn_risk IN ('low', 'medium', 'high')),

  -- Referral & Source
  ADD COLUMN IF NOT EXISTS referral_source TEXT,
  ADD COLUMN IF NOT EXISTS partner_id TEXT,
  ADD COLUMN IF NOT EXISTS campaign_source TEXT;

-- Add indexes for new searchable fields
CREATE INDEX IF NOT EXISTS idx_tenants_organization_type ON tenants(organization_type);
CREATE INDEX IF NOT EXISTS idx_tenants_subscription_status ON tenants(subscription_status);
CREATE INDEX IF NOT EXISTS idx_tenants_country ON tenants(country);
CREATE INDEX IF NOT EXISTS idx_tenants_tags ON tenants USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_tenants_invitation_token ON tenants(invitation_token) WHERE invitation_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenants_health_score ON tenants(health_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_tenants_last_activity ON tenants(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenants_onboarding ON tenants(onboarding_completed, onboarding_step);

-- Update default language to only allow 'en' for new tenants (existing can keep their language)
ALTER TABLE tenants
  ALTER COLUMN default_language SET DEFAULT 'en';

-- Add constraint to ensure admin_name exists
ALTER TABLE tenants
  ADD CONSTRAINT admin_name_not_empty CHECK (char_length(trim(admin_name)) > 0);

-- Add comments for new fields
COMMENT ON COLUMN tenants.organization_type IS 'Type of organization using the platform';
COMMENT ON COLUMN tenants.onboarding_completed IS 'Whether tenant has completed initial onboarding';
COMMENT ON COLUMN tenants.invitation_token IS 'Unique token for initial tenant setup invitation';
COMMENT ON COLUMN tenants.subscription_status IS 'Current subscription payment status';
COMMENT ON COLUMN tenants.health_score IS 'Customer health score (0-100)';
COMMENT ON COLUMN tenants.internal_notes IS 'Private notes visible only to super admins';
COMMENT ON COLUMN tenants.tags IS 'Array of tags for categorization and filtering';

-- ============================================================================
-- CREATE TENANT ONBOARDING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_onboarding_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Step Information
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_status TEXT NOT NULL DEFAULT 'pending' CHECK (step_status IN ('pending', 'in_progress', 'completed', 'skipped')),

  -- Data collected in this step
  step_data JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  skipped_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, step_number)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_steps_tenant ON tenant_onboarding_steps(tenant_id, step_number);
CREATE INDEX IF NOT EXISTS idx_onboarding_steps_status ON tenant_onboarding_steps(tenant_id, step_status);

COMMENT ON TABLE tenant_onboarding_steps IS 'Tracks progress through tenant onboarding workflow';

-- ============================================================================
-- CREATE TENANT NOTES TABLE (for super admin notes with history)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Note Content
  note_type TEXT DEFAULT 'general' CHECK (note_type IN ('general', 'support', 'billing', 'technical', 'success')),
  title TEXT,
  content TEXT NOT NULL,

  -- Visibility & Priority
  is_pinned BOOLEAN DEFAULT false,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')),

  -- Author
  created_by UUID REFERENCES auth.users(id),
  created_by_name TEXT,
  created_by_email TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_tenant_notes_tenant ON tenant_notes(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_notes_type ON tenant_notes(tenant_id, note_type);
CREATE INDEX IF NOT EXISTS idx_tenant_notes_pinned ON tenant_notes(tenant_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_tenant_notes_priority ON tenant_notes(tenant_id, priority);

COMMENT ON TABLE tenant_notes IS 'Notes and comments about tenants for super admin team';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Tenant schema enhanced successfully!';
  RAISE NOTICE 'New features added:';
  RAISE NOTICE '- Comprehensive organization information';
  RAISE NOTICE '- Address and contact details';
  RAISE NOTICE '- Onboarding workflow tracking';
  RAISE NOTICE '- Subscription management fields';
  RAISE NOTICE '- Customer success metrics';
  RAISE NOTICE '- Super admin notes system';
  RAISE NOTICE '- Enhanced categorization with tags';
END $$;
