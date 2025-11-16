-- ============================================================================
-- DIAGNOSE ACCESS ISSUE
-- ============================================================================
-- This script checks why user_belongs_to_tenant() is returning false
-- ============================================================================

DO $$
DECLARE
  v_email TEXT := 'offir.omer@gmail.com';
  v_user_id UUID;
  v_tenant_id UUID;
  v_tenant_slug TEXT;
  v_record_exists BOOLEAN;
  v_record_status TEXT;
  v_function_result BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '   DIAGNOSE: Why "You do not have access to this organization"';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Get user ID
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  RAISE NOTICE '1️⃣  User ID: %', v_user_id;

  -- Get tenant ID from user profile
  SELECT tenant_id INTO v_tenant_id FROM users WHERE id = v_user_id;
  RAISE NOTICE '2️⃣  Tenant ID: %', v_tenant_id;

  -- Get tenant slug
  SELECT slug INTO v_tenant_slug FROM tenants WHERE id = v_tenant_id;
  RAISE NOTICE '3️⃣  Tenant Slug: %', v_tenant_slug;
  RAISE NOTICE '';

  -- Check if record exists in tenant_users
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';
  RAISE NOTICE '   CHECKING TENANT_USERS TABLE';
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';

  SELECT EXISTS(
    SELECT 1 FROM tenant_users
    WHERE user_id = v_user_id AND tenant_id = v_tenant_id
  ) INTO v_record_exists;

  IF v_record_exists THEN
    RAISE NOTICE '✅ Record EXISTS in tenant_users';

    -- Check status
    SELECT status INTO v_record_status
    FROM tenant_users
    WHERE user_id = v_user_id AND tenant_id = v_tenant_id;

    RAISE NOTICE '   Status: %', v_record_status;
    RAISE NOTICE '   Role: %', (SELECT role FROM tenant_users WHERE user_id = v_user_id AND tenant_id = v_tenant_id);
    RAISE NOTICE '   Created: %', (SELECT created_at FROM tenant_users WHERE user_id = v_user_id AND tenant_id = v_tenant_id);

    IF v_record_status != 'active' THEN
      RAISE NOTICE '';
      RAISE NOTICE '❌ PROBLEM: Status is "%" but needs to be "active"!', v_record_status;
      RAISE NOTICE '   → FIXING: Setting status to active';

      UPDATE tenant_users
      SET status = 'active'
      WHERE user_id = v_user_id AND tenant_id = v_tenant_id;

      RAISE NOTICE '   ✅ FIXED: Status set to active';
    ELSE
      RAISE NOTICE '   ✅ Status is correct (active)';
    END IF;
  ELSE
    RAISE NOTICE '❌ Record DOES NOT EXIST in tenant_users!';
    RAISE NOTICE '';
    RAISE NOTICE '   → FIXING: Creating the record now...';

    INSERT INTO tenant_users (tenant_id, user_id, role, status, joined_at)
    VALUES (v_tenant_id, v_user_id, 'owner', 'active', NOW());

    RAISE NOTICE '   ✅ FIXED: Record created';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';
  RAISE NOTICE '   TESTING user_belongs_to_tenant() FUNCTION';
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';

  -- Test the function
  SELECT user_belongs_to_tenant(v_user_id, v_tenant_id) INTO v_function_result;

  IF v_function_result THEN
    RAISE NOTICE '✅ user_belongs_to_tenant() returns TRUE';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Login should now work!';
  ELSE
    RAISE NOTICE '❌ user_belongs_to_tenant() returns FALSE';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  This is the problem! Let me check the function definition...';
    RAISE NOTICE '';

    -- Show the function SQL
    RAISE NOTICE 'The function checks:';
    RAISE NOTICE '  SELECT 1 FROM tenant_users';
    RAISE NOTICE '  WHERE user_id = % (your user)', v_user_id;
    RAISE NOTICE '  AND tenant_id = % (your tenant)', v_tenant_id;
    RAISE NOTICE '  AND status = ''active''';
    RAISE NOTICE '';

    -- Do a manual check
    IF EXISTS (
      SELECT 1 FROM tenant_users
      WHERE user_id = v_user_id
        AND tenant_id = v_tenant_id
        AND status = 'active'
    ) THEN
      RAISE NOTICE '✅ Manual query finds the record!';
      RAISE NOTICE '   The function might need to be recreated.';
      RAISE NOTICE '';
      RAISE NOTICE '   Run this to recreate the function:';
      RAISE NOTICE '   ------------------------------------------------';
      RAISE NOTICE '   DROP FUNCTION IF EXISTS user_belongs_to_tenant(UUID, UUID);';
      RAISE NOTICE '   Then re-run: src/lib/supabase/04-tenant-rls-functions.sql';
    ELSE
      RAISE NOTICE '❌ Manual query ALSO does not find the record!';
      RAISE NOTICE '   Something is wrong with the data.';
    END IF;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '   SUMMARY';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Your login URL: http://localhost:3000/org/%/login', v_tenant_slug;
  RAISE NOTICE 'Your email: %', v_email;
  RAISE NOTICE '';
  RAISE NOTICE 'If login still fails after this fix, restart your Next.js server.';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
END $$;
