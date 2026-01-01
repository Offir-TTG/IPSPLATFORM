-- ============================================================================
-- FIX: Add admin_email to tenant RPC functions
-- ============================================================================
-- This script updates get_tenant_by_slug and get_tenant_by_domain functions
-- to include the admin_email field in their return values
-- ============================================================================

-- Update get_tenant_by_slug to include admin_email
CREATE OR REPLACE FUNCTION get_tenant_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  domain TEXT,
  status TEXT,
  subscription_tier TEXT,
  max_users INTEGER,
  max_courses INTEGER,
  logo_url TEXT,
  primary_color TEXT,
  admin_email TEXT,
  default_language TEXT,
  timezone TEXT,
  currency TEXT,
  enabled_features JSONB,
  created_at TIMESTAMPTZ
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
    t.subscription_tier,
    t.max_users,
    t.max_courses,
    t.logo_url,
    t.primary_color,
    t.admin_email,
    t.default_language,
    t.timezone,
    t.currency,
    t.enabled_features,
    t.created_at
  FROM tenants t
  WHERE t.slug = p_slug
    AND t.status = 'active';
END;
$$;

COMMENT ON FUNCTION get_tenant_by_slug(TEXT) IS 'Get tenant by slug for routing - includes admin_email';

-- Update get_tenant_by_domain to include admin_email
CREATE OR REPLACE FUNCTION get_tenant_by_domain(p_domain TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  domain TEXT,
  status TEXT,
  subscription_tier TEXT,
  max_users INTEGER,
  max_courses INTEGER,
  logo_url TEXT,
  primary_color TEXT,
  admin_email TEXT,
  default_language TEXT,
  timezone TEXT,
  currency TEXT,
  enabled_features JSONB,
  created_at TIMESTAMPTZ
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
    t.subscription_tier,
    t.max_users,
    t.max_courses,
    t.logo_url,
    t.primary_color,
    t.admin_email,
    t.default_language,
    t.timezone,
    t.currency,
    t.enabled_features,
    t.created_at
  FROM tenants t
  WHERE t.domain = p_domain
    AND t.status = 'active';
END;
$$;

COMMENT ON FUNCTION get_tenant_by_domain(TEXT) IS 'Get tenant by domain for routing - includes admin_email';
