-- ============================================================================
-- FIX TENANT LOOKUP FUNCTIONS TO SUPPORT TRIAL STATUS
-- ============================================================================
-- The original get_tenant_by_slug and get_tenant_by_domain functions only
-- return tenants with status = 'active', but self-service signups create
-- tenants with status = 'trial'. This prevents login during trial period.
-- ============================================================================

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS get_tenant_by_slug(TEXT);
DROP FUNCTION IF EXISTS get_tenant_by_domain(TEXT);

-- ============================================================================
-- FUNCTION: get_tenant_by_slug(slug TEXT)
-- ============================================================================
-- Get tenant information by slug (for subdomain routing)
-- Now includes 'trial' status to support self-service signups

CREATE OR REPLACE FUNCTION get_tenant_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  domain TEXT,
  status TEXT,
  logo_url TEXT,
  primary_color TEXT,
  default_language TEXT,
  timezone TEXT,
  currency TEXT,
  enabled_features JSONB,
  creation_method TEXT,
  email_verified BOOLEAN,
  trial_ends_at TIMESTAMPTZ,
  subscription_status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.slug,
    t.domain,
    t.status,
    t.logo_url,
    t.primary_color,
    t.default_language,
    t.timezone,
    t.currency,
    t.enabled_features,
    t.creation_method,
    t.email_verified,
    t.trial_ends_at,
    t.subscription_status
  FROM tenants t
  WHERE t.slug = p_slug
    AND t.status IN ('active', 'trial'); -- ✅ Now includes trial status
END;
$$;

COMMENT ON FUNCTION get_tenant_by_slug(TEXT) IS 'Get tenant by slug for routing (includes trial tenants)';

-- ============================================================================
-- FUNCTION: get_tenant_by_domain(domain TEXT)
-- ============================================================================
-- Get tenant information by custom domain
-- Now includes 'trial' status to support self-service signups

CREATE OR REPLACE FUNCTION get_tenant_by_domain(p_domain TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  domain TEXT,
  status TEXT,
  logo_url TEXT,
  primary_color TEXT,
  default_language TEXT,
  timezone TEXT,
  currency TEXT,
  enabled_features JSONB,
  creation_method TEXT,
  email_verified BOOLEAN,
  trial_ends_at TIMESTAMPTZ,
  subscription_status TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.slug,
    t.domain,
    t.status,
    t.logo_url,
    t.primary_color,
    t.default_language,
    t.timezone,
    t.currency,
    t.enabled_features,
    t.creation_method,
    t.email_verified,
    t.trial_ends_at,
    t.subscription_status
  FROM tenants t
  WHERE t.domain = p_domain
    AND t.status IN ('active', 'trial'); -- ✅ Now includes trial status
END;
$$;

COMMENT ON FUNCTION get_tenant_by_domain(TEXT) IS 'Get tenant by custom domain (includes trial tenants)';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '   TENANT LOOKUP FUNCTIONS UPDATED';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Updated: get_tenant_by_slug()';
  RAISE NOTICE '   - Now returns tenants with status = ''active'' OR ''trial''';
  RAISE NOTICE '   - Added creation_method, email_verified, trial_ends_at fields';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Updated: get_tenant_by_domain()';
  RAISE NOTICE '   - Now returns tenants with status = ''active'' OR ''trial''';
  RAISE NOTICE '   - Added creation_method, email_verified, trial_ends_at fields';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 Self-service signup users can now log in during trial period!';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
END $$;
