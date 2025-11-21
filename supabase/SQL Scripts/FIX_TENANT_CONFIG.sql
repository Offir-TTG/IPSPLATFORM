-- ============================================================================
-- FIX: Create app.current_tenant_id configuration parameter
-- ============================================================================
-- This fixes the error: "unrecognized configuration parameter app.current_tenant_id"
-- Run this SQL in Supabase SQL Editor
-- ============================================================================

-- Option 1: Create the configuration parameter (if you want to keep tenant context)
-- This allows PostgreSQL to accept the app.current_tenant_id parameter
DO $$
BEGIN
  -- Create a custom configuration parameter for tenant context
  -- This is safe and allows setting tenant_id in session for RLS
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET app.current_tenant_id = ''''';
EXCEPTION
  WHEN OTHERS THEN
    -- If it already exists or fails, ignore
    NULL;
END $$;

-- ============================================================================
-- Option 2: Check for and remove any problematic triggers
-- ============================================================================

-- List all triggers on modules table (for debugging)
SELECT
  tgname AS trigger_name,
  proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'modules'::regclass;

-- List all triggers on lessons table (for debugging)
SELECT
  tgname AS trigger_name,
  proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'lessons'::regclass;

-- List all triggers on lesson_topics table (for debugging)
SELECT
  tgname AS trigger_name,
  proname AS function_name
FROM pg_trigger
JOIN pg_proc ON pg_trigger.tgfoid = pg_proc.oid
WHERE tgrelid = 'lesson_topics'::regclass;

-- ============================================================================
-- If you find a trigger that sets app.current_tenant_id, you can drop it:
-- DROP TRIGGER IF EXISTS [trigger_name] ON modules;
-- DROP TRIGGER IF EXISTS [trigger_name] ON lessons;
-- DROP TRIGGER IF EXISTS [trigger_name] ON lesson_topics;
-- ============================================================================
