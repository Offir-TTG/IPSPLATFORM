-- ============================================================================
-- MULTITENANCY: RLS HELPER FUNCTIONS
-- ============================================================================
-- These functions help enforce tenant isolation at the database level.
-- Run this AFTER migrating data (03-migrate-to-default-tenant.sql)
-- Run this BEFORE updating RLS policies (05-tenant-rls-policies.sql)
-- ============================================================================

-- ============================================================================
-- FUNCTION: get_current_tenant_id()
-- ============================================================================
-- Returns the current tenant ID from the database session
-- This is set by the application (middleware/API) for each request

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  -- Try to get tenant_id from current_setting
  -- This is set by the application: SET LOCAL app.current_tenant_id = 'uuid';
  BEGIN
    v_tenant_id := current_setting('app.current_tenant_id', true)::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      v_tenant_id := NULL;
  END;

  RETURN v_tenant_id;
END;
$$;

COMMENT ON FUNCTION get_current_tenant_id() IS 'Get the current tenant ID from session';

-- ============================================================================
-- FUNCTION: set_current_tenant(tenant_id UUID)
-- ============================================================================
-- Sets the current tenant ID in the database session
-- Called by the application at the start of each request

CREATE OR REPLACE FUNCTION set_current_tenant(p_tenant_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate tenant exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM tenants
    WHERE id = p_tenant_id
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive tenant: %', p_tenant_id;
  END IF;

  -- Set in session (transaction-scoped)
  PERFORM set_config('app.current_tenant_id', p_tenant_id::TEXT, true);
END;
$$;

COMMENT ON FUNCTION set_current_tenant(UUID) IS 'Set the current tenant ID in session';

-- ============================================================================
-- FUNCTION: user_belongs_to_tenant(user_id UUID, tenant_id UUID)
-- ============================================================================
-- Check if a user is a member of a specific tenant

CREATE OR REPLACE FUNCTION user_belongs_to_tenant(
  p_user_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM tenant_users
    WHERE user_id = p_user_id
      AND tenant_id = p_tenant_id
      AND status = 'active'
  );
END;
$$;

COMMENT ON FUNCTION user_belongs_to_tenant(UUID, UUID) IS 'Check if user belongs to tenant';

-- ============================================================================
-- FUNCTION: get_user_tenant_role(user_id UUID, tenant_id UUID)
-- ============================================================================
-- Get a user's role within a specific tenant

CREATE OR REPLACE FUNCTION get_user_tenant_role(
  p_user_id UUID,
  p_tenant_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM tenant_users
  WHERE user_id = p_user_id
    AND tenant_id = p_tenant_id
    AND status = 'active';

  RETURN v_role;
END;
$$;

COMMENT ON FUNCTION get_user_tenant_role(UUID, UUID) IS 'Get user role in tenant';

-- ============================================================================
-- FUNCTION: is_super_admin(user_id UUID)
-- ============================================================================
-- Check if a user is a super admin (platform administrator)
-- Super admins can bypass tenant restrictions

CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
  v_super_admin_emails TEXT[];
BEGIN
  -- Get user email
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = p_user_id;

  IF v_email IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Get super admin emails from environment/config
  -- This would be set from environment variables in production
  -- For now, we'll check a config table or hardcode
  v_super_admin_emails := ARRAY[
    'admin@ipsplatform.com',
    'superadmin@ipsplatform.com'
  ];

  -- Check if user email is in super admin list
  RETURN v_email = ANY(v_super_admin_emails);
END;
$$;

COMMENT ON FUNCTION is_super_admin(UUID) IS 'Check if user is a super admin';

-- ============================================================================
-- FUNCTION: get_user_tenants(user_id UUID)
-- ============================================================================
-- Get all tenants a user belongs to

CREATE OR REPLACE FUNCTION get_user_tenants(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  tenant_slug TEXT,
  user_role TEXT,
  joined_at TIMESTAMPTZ
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
    tu.role,
    tu.joined_at
  FROM tenants t
  INNER JOIN tenant_users tu ON tu.tenant_id = t.id
  WHERE tu.user_id = p_user_id
    AND tu.status = 'active'
    AND t.status = 'active'
  ORDER BY tu.joined_at DESC;
END;
$$;

COMMENT ON FUNCTION get_user_tenants(UUID) IS 'Get all tenants for a user';

-- ============================================================================
-- FUNCTION: validate_tenant_access()
-- ============================================================================
-- Validate that current user has access to current tenant
-- Used in RLS policies

CREATE OR REPLACE FUNCTION validate_tenant_access()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Super admins bypass tenant restrictions
  IF is_super_admin(v_user_id) THEN
    RETURN TRUE;
  END IF;

  -- Get current tenant
  v_tenant_id := get_current_tenant_id();
  IF v_tenant_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user belongs to tenant
  RETURN user_belongs_to_tenant(v_user_id, v_tenant_id);
END;
$$;

COMMENT ON FUNCTION validate_tenant_access() IS 'Validate user has access to current tenant';

-- ============================================================================
-- FUNCTION: is_tenant_admin()
-- ============================================================================
-- Check if current user is an admin in the current tenant

CREATE OR REPLACE FUNCTION is_tenant_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Super admins are always considered admins
  IF is_super_admin(v_user_id) THEN
    RETURN TRUE;
  END IF;

  v_tenant_id := get_current_tenant_id();
  IF v_tenant_id IS NULL THEN
    RETURN FALSE;
  END IF;

  v_role := get_user_tenant_role(v_user_id, v_tenant_id);

  RETURN v_role IN ('owner', 'admin');
END;
$$;

COMMENT ON FUNCTION is_tenant_admin() IS 'Check if user is admin in current tenant';

-- ============================================================================
-- FUNCTION: is_tenant_instructor()
-- ============================================================================
-- Check if current user is an instructor in the current tenant

CREATE OR REPLACE FUNCTION is_tenant_instructor()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
  v_role TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Super admins and tenant admins can act as instructors
  IF is_super_admin(v_user_id) OR is_tenant_admin() THEN
    RETURN TRUE;
  END IF;

  v_tenant_id := get_current_tenant_id();
  IF v_tenant_id IS NULL THEN
    RETURN FALSE;
  END IF;

  v_role := get_user_tenant_role(v_user_id, v_tenant_id);

  RETURN v_role = 'instructor';
END;
$$;

COMMENT ON FUNCTION is_tenant_instructor() IS 'Check if user is instructor in current tenant';

-- ============================================================================
-- FUNCTION: get_tenant_by_slug(slug TEXT)
-- ============================================================================
-- Get tenant information by slug (for subdomain routing)

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
  enabled_features JSONB
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
    t.enabled_features
  FROM tenants t
  WHERE t.slug = p_slug
    AND t.status = 'active';
END;
$$;

COMMENT ON FUNCTION get_tenant_by_slug(TEXT) IS 'Get tenant by slug for routing';

-- ============================================================================
-- FUNCTION: get_tenant_by_domain(domain TEXT)
-- ============================================================================
-- Get tenant information by custom domain

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
  enabled_features JSONB
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
    t.enabled_features
  FROM tenants t
  WHERE t.domain = p_domain
    AND t.status = 'active';
END;
$$;

COMMENT ON FUNCTION get_tenant_by_domain(TEXT) IS 'Get tenant by custom domain';

-- ============================================================================
-- FUNCTION: update_tenant_last_accessed()
-- ============================================================================
-- Update last_accessed_at for tenant_users

CREATE OR REPLACE FUNCTION update_tenant_last_accessed()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  v_user_id := auth.uid();
  v_tenant_id := get_current_tenant_id();

  IF v_user_id IS NOT NULL AND v_tenant_id IS NOT NULL THEN
    UPDATE tenant_users
    SET last_accessed_at = NOW()
    WHERE user_id = v_user_id
      AND tenant_id = v_tenant_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION update_tenant_last_accessed() IS 'Update last access time for current tenant';

-- ============================================================================
-- TEST FUNCTIONS
-- ============================================================================

-- Test if tenant functions are working
DO $$
DECLARE
  v_tenant_id UUID;
  v_test_user_id UUID;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Testing tenant RLS functions...';
  RAISE NOTICE '============================================';

  -- Get default tenant
  SELECT id INTO v_tenant_id FROM tenants WHERE slug = 'default';

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE '⚠️  No default tenant found. Please run migration first.';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Found default tenant: %', v_tenant_id;

  -- Test set_current_tenant
  PERFORM set_current_tenant(v_tenant_id);
  RAISE NOTICE '✅ set_current_tenant() works';

  -- Test get_current_tenant_id
  IF get_current_tenant_id() = v_tenant_id THEN
    RAISE NOTICE '✅ get_current_tenant_id() works';
  ELSE
    RAISE NOTICE '❌ get_current_tenant_id() failed';
  END IF;

  -- Test get_tenant_by_slug
  IF EXISTS (SELECT 1 FROM get_tenant_by_slug('default')) THEN
    RAISE NOTICE '✅ get_tenant_by_slug() works';
  ELSE
    RAISE NOTICE '❌ get_tenant_by_slug() failed';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ All tenant RLS functions created!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next step: Run 05-tenant-rls-policies.sql';
  RAISE NOTICE '============================================';
END $$;
