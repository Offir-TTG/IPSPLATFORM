-- ============================================================================
-- FIX UUID-OSSP EXTENSION - Enable it properly for this Supabase project
-- ============================================================================

-- Step 1: Check current extensions
DO $$
BEGIN
  RAISE NOTICE 'Current extensions:';
END $$;

SELECT extname, nspname as schema
FROM pg_extension e
JOIN pg_namespace n ON e.extnamespace = n.oid;

-- Step 2: Enable uuid-ossp extension (try multiple approaches)
-- Approach A: In extensions schema (Supabase default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- Approach B: In public schema (fallback)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Step 3: Test which one works
DO $$
BEGIN
  -- Try extensions.uuid_generate_v4()
  BEGIN
    PERFORM extensions.uuid_generate_v4();
    RAISE NOTICE '✓ uuid_generate_v4() works in extensions schema';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ extensions.uuid_generate_v4() failed: %', SQLERRM;
  END;

  -- Try public.uuid_generate_v4()
  BEGIN
    PERFORM public.uuid_generate_v4();
    RAISE NOTICE '✓ uuid_generate_v4() works in public schema';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ public.uuid_generate_v4() failed: %', SQLERRM;
  END;

  -- Try unqualified uuid_generate_v4()
  BEGIN
    PERFORM uuid_generate_v4();
    RAISE NOTICE '✓ uuid_generate_v4() works without schema qualifier';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE '✗ unqualified uuid_generate_v4() failed: %', SQLERRM;
  END;
END $$;

-- Step 4: Show where the function is located
SELECT
  n.nspname as schema,
  p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'uuid_generate_v4';
