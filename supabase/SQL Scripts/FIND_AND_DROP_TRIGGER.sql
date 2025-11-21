-- ============================================================================
-- FIND AND DROP PROBLEMATIC TRIGGER ON MODULES TABLE
-- ============================================================================
-- Run each section step-by-step in Supabase SQL Editor
-- ============================================================================

-- STEP 1: List all triggers on modules table
-- ============================================================================
SELECT
  t.tgname AS trigger_name,
  pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t
WHERE t.tgrelid = 'public.modules'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- ============================================================================
-- STEP 2: Get the function definition for set_current_tenant
-- ============================================================================
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'set_current_tenant';

-- ============================================================================
-- STEP 3: Get the function definition for get_current_tenant_id
-- ============================================================================
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'get_current_tenant_id';

-- ============================================================================
-- STEP 4: DROP THE PROBLEMATIC TRIGGER(S)
-- ============================================================================
-- After you run STEP 1 and see the trigger name(s), uncomment and run:

-- Common trigger names that might be causing the issue:
DROP TRIGGER IF EXISTS set_tenant_context ON modules CASCADE;
DROP TRIGGER IF EXISTS enforce_tenant_isolation ON modules CASCADE;
DROP TRIGGER IF EXISTS tenant_context_trigger ON modules CASCADE;
DROP TRIGGER IF EXISTS set_current_tenant_trigger ON modules CASCADE;
DROP TRIGGER IF EXISTS modules_tenant_trigger ON modules CASCADE;

-- Do the same for lessons and lesson_topics tables:
DROP TRIGGER IF EXISTS set_tenant_context ON lessons CASCADE;
DROP TRIGGER IF EXISTS enforce_tenant_isolation ON lessons CASCADE;
DROP TRIGGER IF EXISTS tenant_context_trigger ON lessons CASCADE;
DROP TRIGGER IF EXISTS set_current_tenant_trigger ON lessons CASCADE;
DROP TRIGGER IF EXISTS lessons_tenant_trigger ON lessons CASCADE;

DROP TRIGGER IF EXISTS set_tenant_context ON lesson_topics CASCADE;
DROP TRIGGER IF EXISTS enforce_tenant_isolation ON lesson_topics CASCADE;
DROP TRIGGER IF EXISTS tenant_context_trigger ON lesson_topics CASCADE;
DROP TRIGGER IF EXISTS set_current_tenant_trigger ON lesson_topics CASCADE;
DROP TRIGGER IF EXISTS lesson_topics_tenant_trigger ON lesson_topics CASCADE;

-- ============================================================================
-- STEP 5: OPTIONALLY DROP THE PROBLEMATIC FUNCTIONS
-- ============================================================================
-- Only if you don't need them for other tables:

DROP FUNCTION IF EXISTS set_current_tenant() CASCADE;
DROP FUNCTION IF EXISTS get_current_tenant_id() CASCADE;

-- ============================================================================
-- STEP 6: Verify the fix
-- ============================================================================
-- Check that no triggers remain on modules
SELECT
  t.tgname AS trigger_name
FROM pg_trigger t
WHERE t.tgrelid = 'public.modules'::regclass
  AND NOT t.tgisinternal;

-- Should return no rows if all triggers are removed

-- ============================================================================
-- STEP 7: Test module creation
-- ============================================================================
-- After dropping the triggers, go back to your UI and try creating a module
-- It should now work without the "unrecognized configuration parameter" error
-- ============================================================================

-- ============================================================================
-- NOTES:
-- ============================================================================
-- Your RLS policies already handle tenant isolation using auth.uid()
-- You don't need these triggers - they were trying to use a PostgreSQL
-- configuration parameter that doesn't exist and isn't necessary
-- ============================================================================
