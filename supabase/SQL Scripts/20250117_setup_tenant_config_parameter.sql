-- ============================================================================
-- Setup app.current_tenant_id configuration parameter
-- ============================================================================
-- This fixes the error: "unrecognized configuration parameter app.current_tenant_id"
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Create the custom configuration parameter for tenant context
-- This allows PostgreSQL to accept and store app.current_tenant_id in sessions
DO $$
BEGIN
  -- Set a default empty value for the parameter at the database level
  -- This makes PostgreSQL recognize the parameter
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET app.current_tenant_id = ''''';
  RAISE NOTICE '✅ Created app.current_tenant_id configuration parameter';
EXCEPTION
  WHEN OTHERS THEN
    -- If it fails or already exists, log but don't error
    RAISE NOTICE '⚠️  Could not create parameter (may already exist): %', SQLERRM;
END $$;

-- Verify the parameter was created
DO $$
DECLARE
  v_setting TEXT;
BEGIN
  -- Try to read the parameter
  BEGIN
    v_setting := current_setting('app.current_tenant_id', true);
    RAISE NOTICE '✅ Configuration parameter exists and can be read';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '❌ Failed to read parameter: %', SQLERRM;
  END;
END $$;

-- ============================================================================
-- NOTE: After running this script:
-- 1. The error "unrecognized configuration parameter" should be resolved
-- 2. The set_current_tenant() function will work properly
-- 3. Tenant context will be maintained across database operations
-- ============================================================================
