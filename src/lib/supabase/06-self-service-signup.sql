-- ============================================================================
-- SELF-SERVICE SIGNUP SCHEMA ENHANCEMENT
-- ============================================================================
-- Adds support for self-service organization signup with email verification
-- and trial management
-- ============================================================================

-- Add new columns to tenants table for self-service signup
ALTER TABLE tenants
  -- Track how the tenant was created
  ADD COLUMN IF NOT EXISTS creation_method TEXT DEFAULT 'super_admin'
    CHECK (creation_method IN ('self_service', 'super_admin', 'invitation')),

  -- Email verification for self-service signups
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS email_verification_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,

  -- Track signup completion
  ADD COLUMN IF NOT EXISTS signup_completed_at TIMESTAMPTZ;

-- Add indexes for email verification lookups
CREATE INDEX IF NOT EXISTS idx_tenants_email_verification_token
  ON tenants(email_verification_token)
  WHERE email_verification_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenants_creation_method
  ON tenants(creation_method);

CREATE INDEX IF NOT EXISTS idx_tenants_email_verified
  ON tenants(email_verified)
  WHERE email_verified = false;

-- Add comments for documentation
COMMENT ON COLUMN tenants.creation_method IS 'How the tenant was created: self_service (public signup), super_admin (manually created), invitation (invited by super admin)';
COMMENT ON COLUMN tenants.email_verified IS 'Whether the tenant admin email has been verified';
COMMENT ON COLUMN tenants.email_verification_token IS 'Unique token sent via email for verification';
COMMENT ON COLUMN tenants.signup_completed_at IS 'When the self-service signup was completed';

-- ============================================================================
-- TRIAL MANAGEMENT ENHANCEMENT
-- ============================================================================

-- Ensure trial_ends_at is set for new self-service signups
-- (Will be set to NOW() + 14 days in application code)

-- Add function to check if trial is expired
CREATE OR REPLACE FUNCTION is_trial_expired(tenant_row tenants)
RETURNS BOOLEAN AS $$
BEGIN
  IF tenant_row.status = 'trial' AND tenant_row.trial_ends_at IS NOT NULL THEN
    RETURN tenant_row.trial_ends_at < NOW();
  END IF;
  RETURN false;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_trial_expired IS 'Check if a tenant trial period has expired';

-- ============================================================================
-- SLUG VALIDATION FUNCTION
-- ============================================================================

-- Function to check if slug is available
CREATE OR REPLACE FUNCTION is_slug_available(p_slug TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM tenants WHERE slug = p_slug
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_slug_available IS 'Check if a tenant slug is available for use';

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_slug_from_name(p_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_slug TEXT;
  v_counter INTEGER := 0;
  v_base_slug TEXT;
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove special chars
  v_base_slug := lower(regexp_replace(
    regexp_replace(trim(p_name), '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  ));

  -- Ensure it starts and ends with alphanumeric
  v_base_slug := regexp_replace(v_base_slug, '^-+|-+$', '', 'g');

  -- Limit length to 60 chars (leaving room for counter)
  v_base_slug := substring(v_base_slug from 1 for 60);

  v_slug := v_base_slug;

  -- If slug exists, append number
  WHILE NOT is_slug_available(v_slug) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter;
  END LOOP;

  RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_slug_from_name IS 'Generate a unique slug from organization name';

-- ============================================================================
-- EMAIL VERIFICATION TOKEN GENERATION
-- ============================================================================

-- Function to generate secure verification token
CREATE OR REPLACE FUNCTION generate_verification_token()
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate 32-character random token
  v_token := encode(gen_random_bytes(24), 'base64');
  -- Make URL-safe
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');
  RETURN v_token;
END;
$$ LANGUAGE plpgsql VOLATILE;

COMMENT ON FUNCTION generate_verification_token IS 'Generate secure URL-safe verification token';

-- ============================================================================
-- UPDATE EXISTING TENANTS
-- ============================================================================

-- Mark existing tenants as created by super admin and verified
UPDATE tenants
SET
  creation_method = 'super_admin',
  email_verified = true,
  email_verified_at = created_at
WHERE creation_method IS NULL OR email_verified IS NULL;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Self-service signup schema created successfully!';
  RAISE NOTICE 'New features added:';
  RAISE NOTICE '- creation_method tracking (self_service, super_admin, invitation)';
  RAISE NOTICE '- Email verification system with tokens';
  RAISE NOTICE '- Trial expiration checking';
  RAISE NOTICE '- Slug generation and availability functions';
  RAISE NOTICE '- All existing tenants marked as super_admin created and verified';
END $$;
