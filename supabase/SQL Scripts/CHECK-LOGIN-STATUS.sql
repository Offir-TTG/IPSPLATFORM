-- ============================================================================
-- CHECK LOGIN STATUS
-- Run this to see if your user can login
-- ============================================================================

-- Replace with your email
DO $$
DECLARE
  v_email TEXT := 'offir.omer@gmail.com';  -- CHANGE THIS TO YOUR EMAIL
  v_user_id UUID;
  v_tenant_id UUID;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '   LOGIN STATUS CHECK';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  -- Get user ID from auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ User not found in auth.users';
    RAISE NOTICE '   Email: %', v_email;
    RETURN;
  END IF;

  RAISE NOTICE '✅ User found in auth.users';
  RAISE NOTICE '   Email: %', v_email;
  RAISE NOTICE '   User ID: %', v_user_id;
  RAISE NOTICE '';

  -- Check users table
  SELECT tenant_id INTO v_tenant_id FROM users WHERE id = v_user_id;

  IF v_tenant_id IS NULL THEN
    RAISE NOTICE '❌ NO TENANT_ID in users table';
    RAISE NOTICE '   → This will cause login to fail!';
    RAISE NOTICE '   → Run COMPLETE-FIX-LOGIN.sql to fix';
  ELSE
    RAISE NOTICE '✅ Tenant ID in users table: %', v_tenant_id;
  END IF;

  RAISE NOTICE '';

  -- Check tenant_users table
  IF EXISTS (
    SELECT 1 FROM tenant_users
    WHERE user_id = v_user_id
    AND tenant_id = v_tenant_id
    AND status = 'active'
  ) THEN
    RAISE NOTICE '✅ Active record in tenant_users table';
    RAISE NOTICE '   Role: %', (SELECT role FROM tenant_users WHERE user_id = v_user_id AND tenant_id = v_tenant_id);
    RAISE NOTICE '';
    RAISE NOTICE '🎉 LOGIN SHOULD WORK!';
  ELSE
    RAISE NOTICE '❌ NO active record in tenant_users table';
    RAISE NOTICE '   → This will cause login to fail!';
    RAISE NOTICE '   → Run COMPLETE-FIX-LOGIN.sql to fix';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════';
END $$;
