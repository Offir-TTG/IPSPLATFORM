-- ============================================================================
-- Fix users table foreign key constraint issue
-- ============================================================================
-- Description: Drop incorrect users_id_fkey constraint and recreate invited_by constraint
-- Author: Claude Code Assistant
-- Date: 2025-12-02
-- Issue: users_id_fkey constraint on id column preventing user creation

-- Drop the incorrect constraint if it exists (this appears to be on the id column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_id_fkey'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_id_fkey;
    RAISE NOTICE 'Dropped incorrect users_id_fkey constraint';
  END IF;
END$$;

-- Drop the invited_by constraint if it exists (to recreate it with correct name)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_invited_by_fkey'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_invited_by_fkey;
    RAISE NOTICE 'Dropped users_invited_by_fkey constraint for recreation';
  END IF;
END$$;

-- Recreate the invited_by foreign key constraint with correct naming
DO $$
BEGIN
  -- Add the foreign key constraint
  ALTER TABLE users
  ADD CONSTRAINT users_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

  RAISE NOTICE 'Created users_invited_by_fkey constraint';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'users_invited_by_fkey constraint already exists';
END$$;

-- List all constraints on users table for verification
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE 'Current constraints on users table:';
  FOR r IN
    SELECT conname, contype, pg_get_constraintdef(oid) as definition
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass
  LOOP
    RAISE NOTICE '  - % (%) %', r.conname, r.contype, r.definition;
  END LOOP;
END$$;
