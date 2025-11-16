-- ============================================================================
-- QUICK USER STATUS CHECK
-- ============================================================================
-- This script quickly shows the current status of a user across all tables
-- ============================================================================

DO $$
DECLARE
  v_email TEXT := 'offir.omer@gmail.com'; -- ⚠️ CHANGE THIS TO YOUR EMAIL
  v_auth_user_id UUID;
  v_tenant_id UUID;
  v_tenant_slug TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '   QUICK USER STATUS CHECK';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Get auth user ID
  SELECT id INTO v_auth_user_id FROM auth.users WHERE email = v_email;

  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE '❌ User not found in auth.users';
    RETURN;
  END IF;

  RAISE NOTICE '✅ Auth User: %', v_auth_user_id;
  RAISE NOTICE '';

  -- Check email confirmation
  RAISE NOTICE '📧 Email Status:';
  SELECT
    CASE
      WHEN email_confirmed_at IS NOT NULL THEN '✅ Confirmed at ' || email_confirmed_at::TEXT
      ELSE '❌ NOT CONFIRMED'
    END
  FROM auth.users WHERE id = v_auth_user_id;
  RAISE NOTICE '';

  -- Check user profile
  RAISE NOTICE '👤 User Profile:';
  SELECT tenant_id INTO v_tenant_id FROM users WHERE id = v_auth_user_id;
  IF v_tenant_id IS NULL THEN
    RAISE NOTICE '❌ No user profile found';
  ELSE
    RAISE NOTICE '✅ Profile exists (tenant_id: %)', v_tenant_id;
  END IF;
  RAISE NOTICE '';

  -- Check tenant
  IF v_tenant_id IS NOT NULL THEN
    RAISE NOTICE '🏢 Tenant:';
    SELECT slug INTO v_tenant_slug FROM tenants WHERE id = v_tenant_id;
    RAISE NOTICE '   Name: %', (SELECT name FROM tenants WHERE id = v_tenant_id);
    RAISE NOTICE '   Slug: %', v_tenant_slug;
    RAISE NOTICE '   Status: %', (SELECT status FROM tenants WHERE id = v_tenant_id);
    RAISE NOTICE '   Email Verified: %', (SELECT email_verified FROM tenants WHERE id = v_tenant_id);
    RAISE NOTICE '';
  END IF;

  -- Check tenant_users
  RAISE NOTICE '🔗 Tenant-User Relationship:';
  IF EXISTS (SELECT 1 FROM tenant_users WHERE user_id = v_auth_user_id AND tenant_id = v_tenant_id) THEN
    RAISE NOTICE '   ✅ Exists';
    RAISE NOTICE '   Role: %', (SELECT role FROM tenant_users WHERE user_id = v_auth_user_id AND tenant_id = v_tenant_id);
    RAISE NOTICE '   Status: %', (SELECT status FROM tenant_users WHERE user_id = v_auth_user_id AND tenant_id = v_tenant_id);
  ELSE
    RAISE NOTICE '   ❌ Missing!';
  END IF;
  RAISE NOTICE '';

  -- Test RPC function
  RAISE NOTICE '🧪 Testing user_belongs_to_tenant() function:';
  IF user_belongs_to_tenant(v_auth_user_id, v_tenant_id) THEN
    RAISE NOTICE '   ✅ Returns TRUE - User has access';
  ELSE
    RAISE NOTICE '   ❌ Returns FALSE - User does NOT have access';
    RAISE NOTICE '   This is why login is failing!';
  END IF;
  RAISE NOTICE '';

  -- Login URL
  RAISE NOTICE '🔑 Login URL:';
  IF v_tenant_slug IS NOT NULL THEN
    RAISE NOTICE '   http://localhost:3000/org/%/login', v_tenant_slug;
  END IF;
  RAISE NOTICE '';

  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
END $$;
