-- ============================================================================
-- Allow NULL user_id in enrollments table for memory-based wizard
-- ============================================================================
-- This allows enrollments to exist without a user initially
-- User will be created and linked when they complete the enrollment wizard

-- Drop the NOT NULL constraint on user_id
ALTER TABLE enrollments ALTER COLUMN user_id DROP NOT NULL;

-- Add comment explaining why user_id can be NULL
COMMENT ON COLUMN enrollments.user_id IS 'User ID - can be NULL for enrollments created before user account exists. Will be set when user completes enrollment wizard.';

-- Verify the change
DO $$
DECLARE
  is_nullable TEXT;
BEGIN
  SELECT is_nullable INTO is_nullable
  FROM information_schema.columns
  WHERE table_name = 'enrollments' AND column_name = 'user_id';

  IF is_nullable = 'YES' THEN
    RAISE NOTICE 'SUCCESS: user_id column now allows NULL values';
  ELSE
    RAISE WARNING 'FAILED: user_id column still requires NOT NULL';
  END IF;
END$$;
