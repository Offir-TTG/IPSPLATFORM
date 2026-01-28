-- ============================================================================
-- COMPLETE FIX: "You do not have access to this organization"
-- This script fixes ALL common causes of login issues
-- ============================================================================
-- Run this in your Supabase SQL Editor
-- ============================================================================

DO $$
DECLARE
  v_tenant_id UUID;
  v_user_count INTEGER;
  v_fixed_count INTEGER := 0;
  v_record RECORD;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '   FIXING LOGIN ACCESS ISSUES';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Step 1: Get the first tenant
  SELECT id INTO v_tenant_id FROM tenants ORDER BY created_at LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE '❌ ERROR: No tenant found!';
    RAISE NOTICE '';
    RAISE NOTICE 'Creating a default tenant...';

    INSERT INTO tenants (name, slug, admin_email, creation_method, email_verified)
    VALUES ('Default Organization', 'default', 'admin@example.com', 'manual', true)
    RETURNING id INTO v_tenant_id;

    RAISE NOTICE '✅ Created tenant: %', v_tenant_id;
  ELSE
    RAISE NOTICE '✅ Found tenant: %', v_tenant_id;
    RAISE NOTICE '   Name: %', (SELECT name FROM tenants WHERE id = v_tenant_id);
    RAISE NOTICE '   Slug: %', (SELECT slug FROM tenants WHERE id = v_tenant_id);
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '──────────────────────────────────────────────────────────────';
  RAISE NOTICE '   FIX 1: Assign tenant_id to users';
  RAISE NOTICE '──────────────────────────────────────────────────────────────';

  -- Fix 1: Update users table
  UPDATE users
  SET tenant_id = v_tenant_id,
      updated_at = NOW()
  WHERE tenant_id IS NULL;

  GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
  RAISE NOTICE '✅ Updated % users with tenant_id', v_fixed_count;

  RAISE NOTICE '';
  RAISE NOTICE '──────────────────────────────────────────────────────────────';
  RAISE NOTICE '   FIX 2: Create tenant_users records';
  RAISE NOTICE '──────────────────────────────────────────────────────────────';

  -- Fix 2: Create tenant_users records for users that don't have them
  INSERT INTO tenant_users (tenant_id, user_id, role, status, joined_at)
  SELECT
    v_tenant_id,
    u.id,
    CASE
      WHEN u.role IN ('admin', 'super_admin') THEN 'owner'
      WHEN u.role = 'instructor' THEN 'instructor'
      WHEN u.role = 'student' THEN 'student'
      WHEN u.role = 'parent' THEN 'student'
      ELSE 'student'
    END,
    'active',
    NOW()
  FROM users u
  WHERE NOT EXISTS (
    SELECT 1 FROM tenant_users tu
    WHERE tu.user_id = u.id AND tu.tenant_id = v_tenant_id
  );

  GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
  RAISE NOTICE '✅ Created % tenant_users records', v_fixed_count;

  RAISE NOTICE '';
  RAISE NOTICE '──────────────────────────────────────────────────────────────';
  RAISE NOTICE '   FIX 3: Activate any inactive tenant_users';
  RAISE NOTICE '──────────────────────────────────────────────────────────────';

  -- Fix 3: Activate any inactive records
  UPDATE tenant_users
  SET status = 'active',
      updated_at = NOW()
  WHERE tenant_id = v_tenant_id
    AND status != 'active';

  GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
  RAISE NOTICE '✅ Activated % tenant_users records', v_fixed_count;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '   VERIFICATION';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Show summary of all users
  RAISE NOTICE 'All users and their access:';
  RAISE NOTICE '';

  FOR v_record IN (
    SELECT
      u.email,
      u.role as user_role,
      u.tenant_id,
      tu.role as tenant_role,
      tu.status,
      CASE
        WHEN u.tenant_id IS NOT NULL AND tu.status = 'active' THEN '✅ CAN LOGIN'
        WHEN u.tenant_id IS NULL THEN '❌ NO TENANT_ID'
        WHEN tu.status IS NULL THEN '❌ NO TENANT_USERS RECORD'
        WHEN tu.status != 'active' THEN '❌ INACTIVE'
        ELSE '❓ UNKNOWN ISSUE'
      END as login_status
    FROM users u
    LEFT JOIN tenant_users tu ON tu.user_id = u.id AND tu.tenant_id = v_tenant_id
    ORDER BY u.created_at DESC
  ) LOOP
    RAISE NOTICE '  % - % - %', v_record.email, v_record.user_role, v_record.login_status;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '   ✅ DONE!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Go to: http://localhost:3000/login';
  RAISE NOTICE '2. Try logging in with your email';
  RAISE NOTICE '3. If it still fails, check the browser console for errors';
  RAISE NOTICE '';

END $$;
