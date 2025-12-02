-- ============================================================================
-- EMERGENCY FIX: Remove incorrect users_id_fkey constraint
-- ============================================================================
-- RUN THIS IN SUPABASE SQL EDITOR IMMEDIATELY
-- This will fix the error preventing user creation during enrollment
-- ============================================================================

-- Step 1: Check current constraints
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname LIKE '%fkey%';

-- Step 2: Drop the incorrect users_id_fkey constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Step 3: Drop existing invited_by constraint if any
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_invited_by_fkey;

-- Step 4: Recreate invited_by constraint with proper naming and NULL handling
ALTER TABLE users
ADD CONSTRAINT users_invited_by_fkey
FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

-- Step 5: Verify the fix
SELECT
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname LIKE '%invited%';

-- Done! You should see only 'users_invited_by_fkey' constraint on the invited_by column
