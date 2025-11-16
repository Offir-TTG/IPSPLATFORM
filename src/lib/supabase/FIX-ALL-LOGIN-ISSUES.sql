-- ============================================================================
-- COMPREHENSIVE FIX FOR ALL SELF-SERVICE SIGNUP LOGIN ISSUES
-- ============================================================================
-- This script fixes ALL issues preventing self-service signup users from
-- logging in:
--
-- 1. ✅ Confirms email in auth.users (email_confirmed_at)
-- 2. ✅ Marks tenant as email_verified
-- 3. ✅ Creates missing tenant_users junction record
-- 4. ✅ Updates get_tenant_by_slug to support 'trial' status
-- 5. ✅ Updates get_tenant_by_domain to support 'trial' status
--
-- IMPORTANT: Update the v_email variable below with your email address
-- ============================================================================

-- ============================================================================
-- PART 1: FIX TENANT LOOKUP FUNCTIONS (Must run first)
-- ============================================================================

-- Drop existing functions to recreate them
DROP FUNCTION IF EXISTS get_tenant_by_slug(TEXT);
DROP FUNCTION IF EXISTS get_tenant_by_domain(TEXT);

-- Update get_tenant_by_slug to support trial status
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
    AND t.status IN ('active', 'trial');
END;
$$;

-- Update get_tenant_by_domain to support trial status
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
    AND t.status IN ('active', 'trial');
END;
$$;

-- ============================================================================
-- PART 2: FIX USER DATA
-- ============================================================================

DO $$
DECLARE
  v_email TEXT := 'offir.omer@gmail.com'; -- ⚠️ CHANGE THIS TO YOUR EMAIL
  v_auth_user_id UUID;
  v_auth_email TEXT;
  v_auth_confirmed_at TIMESTAMPTZ;
  v_profile_exists BOOLEAN := false;
  v_profile_tenant_id UUID;
  v_profile_role TEXT;
  v_tenant_exists BOOLEAN := false;
  v_tenant_name TEXT;
  v_tenant_slug TEXT;
  v_tenant_email_verified BOOLEAN;
  v_tenant_creation_method TEXT;
  v_tenant_user_exists BOOLEAN := false;
  v_tenant_user_role TEXT;
  v_fixed_issues TEXT[] := ARRAY[]::TEXT[];
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Part 1 Complete: Tenant lookup functions updated to support trial status';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '   PART 2: USER DATA VERIFICATION & FIX';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE 'Checking user: %', v_email;
  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 1: CHECK AND FIX AUTH.USERS
  -- ============================================================================
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';
  RAISE NOTICE '1️⃣  CHECKING AUTH.USERS (Supabase Auth)';
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';

  SELECT id, email, email_confirmed_at
  INTO v_auth_user_id, v_auth_email, v_auth_confirmed_at
  FROM auth.users
  WHERE email = v_email;

  IF v_auth_user_id IS NULL THEN
    RAISE NOTICE '❌ NOT FOUND: User does not exist in auth.users';
    RAISE NOTICE '   This means signup failed or was not completed.';
    RAISE NOTICE '';
    RAISE EXCEPTION 'User not found in auth.users. Signup may have failed.';
  ELSE
    RAISE NOTICE '✅ FOUND: User exists in auth.users';
    RAISE NOTICE '   User ID: %', v_auth_user_id;
    RAISE NOTICE '   Email: %', v_auth_email;

    IF v_auth_confirmed_at IS NULL THEN
      RAISE NOTICE '   ⚠️  Email Confirmed: NO (email_confirmed_at is NULL)';
      RAISE NOTICE '   → FIXING: Setting email_confirmed_at = NOW()';

      UPDATE auth.users
      SET email_confirmed_at = NOW()
      WHERE id = v_auth_user_id;

      v_fixed_issues := array_append(v_fixed_issues, 'Set email_confirmed_at in auth.users');
      RAISE NOTICE '   ✅ FIXED: Email confirmed in Supabase Auth';
    ELSE
      RAISE NOTICE '   ✅ Email Confirmed: YES (at %)', v_auth_confirmed_at;
    END IF;
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 2: CHECK USERS TABLE
  -- ============================================================================
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';
  RAISE NOTICE '2️⃣  CHECKING USERS TABLE (User Profile)';
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';

  SELECT
    EXISTS(SELECT 1 FROM users WHERE id = v_auth_user_id),
    (SELECT tenant_id FROM users WHERE id = v_auth_user_id),
    (SELECT role FROM users WHERE id = v_auth_user_id)
  INTO v_profile_exists, v_profile_tenant_id, v_profile_role;

  IF NOT v_profile_exists THEN
    RAISE NOTICE '❌ NOT FOUND: User profile missing in users table';
    RAISE NOTICE '   This indicates signup did not complete properly.';
    RAISE NOTICE '   Expected record with id = %', v_auth_user_id;
  ELSE
    RAISE NOTICE '✅ FOUND: User profile exists';
    RAISE NOTICE '   User ID: %', v_auth_user_id;
    RAISE NOTICE '   Role: %', v_profile_role;
    RAISE NOTICE '   Tenant ID: %', COALESCE(v_profile_tenant_id::TEXT, 'NULL');
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 3: CHECK AND FIX TENANTS TABLE
  -- ============================================================================
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';
  RAISE NOTICE '3️⃣  CHECKING TENANTS TABLE (Organization)';
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';

  IF v_profile_tenant_id IS NOT NULL THEN
    SELECT
      EXISTS(SELECT 1 FROM tenants WHERE id = v_profile_tenant_id),
      (SELECT name FROM tenants WHERE id = v_profile_tenant_id),
      (SELECT slug FROM tenants WHERE id = v_profile_tenant_id),
      (SELECT email_verified FROM tenants WHERE id = v_profile_tenant_id),
      (SELECT creation_method FROM tenants WHERE id = v_profile_tenant_id)
    INTO v_tenant_exists, v_tenant_name, v_tenant_slug, v_tenant_email_verified, v_tenant_creation_method;

    IF NOT v_tenant_exists THEN
      RAISE NOTICE '❌ NOT FOUND: Tenant missing';
    ELSE
      RAISE NOTICE '✅ FOUND: Tenant exists';
      RAISE NOTICE '   Tenant ID: %', v_profile_tenant_id;
      RAISE NOTICE '   Name: %', v_tenant_name;
      RAISE NOTICE '   Slug: %', v_tenant_slug;
      RAISE NOTICE '   Creation Method: %', v_tenant_creation_method;

      IF v_tenant_creation_method = 'self_service' THEN
        IF NOT v_tenant_email_verified THEN
          RAISE NOTICE '   ⚠️  Email Verified: NO';
          RAISE NOTICE '   → FIXING: Setting email_verified = true';

          UPDATE tenants
          SET
            email_verified = true,
            email_verified_at = NOW()
          WHERE id = v_profile_tenant_id;

          v_fixed_issues := array_append(v_fixed_issues, 'Set email_verified in tenants table');
          RAISE NOTICE '   ✅ FIXED: Tenant email marked as verified';
        ELSE
          RAISE NOTICE '   ✅ Email Verified: YES';
        END IF;
      ELSE
        RAISE NOTICE '   ℹ️  Email Verification: N/A (not self-service signup)';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE '⚠️  SKIPPED: No tenant_id in user profile';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- STEP 4: CHECK AND FIX TENANT_USERS TABLE
  -- ============================================================================
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';
  RAISE NOTICE '4️⃣  CHECKING TENANT_USERS TABLE (User-Tenant Relationship)';
  RAISE NOTICE '──────────────────────────────────────────────────────────────────────';

  IF v_profile_tenant_id IS NOT NULL THEN
    SELECT
      EXISTS(SELECT 1 FROM tenant_users WHERE user_id = v_auth_user_id AND tenant_id = v_profile_tenant_id),
      (SELECT role FROM tenant_users WHERE user_id = v_auth_user_id AND tenant_id = v_profile_tenant_id)
    INTO v_tenant_user_exists, v_tenant_user_role;

    IF NOT v_tenant_user_exists THEN
      RAISE NOTICE '⚠️  NOT FOUND: User-tenant relationship missing';
      RAISE NOTICE '   Expected record: user_id=%, tenant_id=%', v_auth_user_id, v_profile_tenant_id;
      RAISE NOTICE '   → FIXING: Creating tenant_users record';

      -- FIX: Create the missing tenant_users junction record
      INSERT INTO tenant_users (tenant_id, user_id, role, status, joined_at)
      VALUES (v_profile_tenant_id, v_auth_user_id, 'owner', 'active', NOW())
      ON CONFLICT (tenant_id, user_id) DO UPDATE
      SET status = 'active', role = 'owner';

      v_fixed_issues := array_append(v_fixed_issues, 'Created tenant_users junction record');
      RAISE NOTICE '   ✅ FIXED: Created user-tenant relationship as owner';

      v_tenant_user_exists := true;
      v_tenant_user_role := 'owner';
    ELSE
      RAISE NOTICE '✅ FOUND: User-tenant relationship exists';
      RAISE NOTICE '   User ID: %', v_auth_user_id;
      RAISE NOTICE '   Tenant ID: %', v_profile_tenant_id;
      RAISE NOTICE '   Role: %', v_tenant_user_role;
    END IF;
  ELSE
    RAISE NOTICE '⚠️  SKIPPED: No tenant_id to check against';
  END IF;

  RAISE NOTICE '';

  -- ============================================================================
  -- SUMMARY
  -- ============================================================================
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '   SUMMARY';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

  IF array_length(v_fixed_issues, 1) > 0 THEN
    RAISE NOTICE '🔧 FIXED ISSUES:';
    FOR i IN 1..array_length(v_fixed_issues, 1) LOOP
      RAISE NOTICE '   %d. %', i, v_fixed_issues[i];
    END LOOP;
    RAISE NOTICE '';
  ELSE
    RAISE NOTICE 'ℹ️  No issues needed fixing - everything was already correct!';
    RAISE NOTICE '';
  END IF;

  RAISE NOTICE '📊 VERIFICATION STATUS:';
  RAISE NOTICE '   ├─ Auth User (auth.users): %', CASE WHEN v_auth_user_id IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '   ├─ User Profile (users): %', CASE WHEN v_profile_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '   ├─ Tenant (tenants): %', CASE WHEN v_tenant_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '   └─ Tenant User (tenant_users): %', CASE WHEN v_tenant_user_exists THEN '✅ EXISTS' ELSE '❌ MISSING' END;
  RAISE NOTICE '';

  IF v_auth_user_id IS NOT NULL AND v_profile_exists AND v_tenant_exists AND v_tenant_user_exists THEN
    RAISE NOTICE '✅ ALL CHECKS PASSED';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 User should now be able to log in!';
    RAISE NOTICE '';
    RAISE NOTICE '📝 LOGIN CREDENTIALS:';
    RAISE NOTICE '   Email: %', v_email;
    IF v_tenant_slug IS NOT NULL THEN
      RAISE NOTICE '   URL: http://localhost:3000/org/%/login', v_tenant_slug;
    END IF;
  ELSE
    RAISE NOTICE '❌ CRITICAL ISSUES REMAIN';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  Some critical data is missing. Please check the output above.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════';
END $$;
